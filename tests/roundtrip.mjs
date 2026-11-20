// Kreislauf-Beweis für den Modus "rückbaufähig" je Format (txt, docx, xlsx, csv):
// Original -> anonymisieren -> simulierte Korrektur (Wörter ändern, Sätze einfügen, Absätze verschieben)
// -> Rückbau -> Vergleich mit dem erwarteten Ergebnis (= Original mit denselben Korrekturen).
// Dazu Fallen-Tests und Determinismus. Ergebnis: tests/ROUNDTRIP-REPORT.md
// Aufruf: node tests/roundtrip.mjs
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import JSZip from 'jszip';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const fx = path.join(here, 'fixtures');
const outDir = path.join(here, 'out-roundtrip');
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });
let chromium;
try { ({ chromium } = createRequire(import.meta.url)('playwright')); } catch { ({ chromium } = createRequire('/opt/node22/lib/node_modules/')('playwright')); }

const sha = (b) => crypto.createHash('sha256').update(b).digest('hex').slice(0, 16);
const report = [];
const log = (s = '') => { report.push(s); console.log(s); };
const requests = [];
const browser = await chromium.launch();

// ---------- Hilfen für die Oberfläche ----------
async function newPage() {
  const ctx = await browser.newContext({ acceptDownloads: true });
  const page = await ctx.newPage();
  page.on('request', (r) => requests.push(r.url()));
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('dialog', (d) => d.accept());
  await page.goto('file://' + path.join(root, 'index.html'));
  return { page, ctx, errors };
}
async function setMode(page, mode) { await page.check(`input[name=mode][value="${mode}"]`); }
async function loadFile(page, file) {
  await page.setInputFiles('#file', file);
  await page.waitForFunction(() => /Gelesen|nicht|Fehler/.test(document.querySelector('#load-status').textContent), null, { timeout: 120000 });
}
async function ack(page) { await page.$$eval('#doc-warnings input[type=checkbox]', (els) => els.forEach((e) => { if (!e.checked) e.click(); })); }
async function download(page, clickSel, statusSel, okRe) {
  await page.evaluate((s) => { document.querySelector(s).textContent = ''; }, statusSel);
  const dlP = page.waitForEvent('download', { timeout: 120000 }).catch(() => null);
  await page.click(clickSel);
  await page.waitForFunction((s) => { const t = document.querySelector(s).textContent; return t && !/^Erzeuge/.test(t); }, statusSel, { timeout: 120000 });
  const status = await page.textContent(statusSel);
  const dl = okRe.test(status) ? await dlP : null;
  if (!dl) return { status, bytes: null };
  const p = path.join(outDir, `${Date.now()}-${dl.suggestedFilename()}`);
  await dl.saveAs(p);
  return { status, bytes: fs.readFileSync(p), name: dl.suggestedFilename(), file: p };
}
async function anonymize(file, manual = []) {
  const { page, ctx, errors } = await newPage();
  await setMode(page, 'reversible');
  await loadFile(page, file);
  for (const m of manual) await page.evaluate((x) => window.__anon.addManual(x), m);
  await ack(page);
  const kind = path.extname(file).slice(1);
  const btn = { txt: '#btn-txt', csv: '#btn-csv', docx: '#btn-docx', xlsx: '#btn-xlsx' }[kind];
  let out = await download(page, btn, '#export-status', /Gespeichert/);
  if (!out.bytes && /blockiert/.test(out.status)) { await page.check('#leaks input[type=checkbox]'); out = await download(page, btn, '#export-status', /Gespeichert/); }
  const keyP = page.waitForEvent('download');
  await page.click('#btn-key');
  const kd = await keyP;
  const keyPath = path.join(outDir, `${Date.now()}-${kd.suggestedFilename()}`);
  await kd.saveAs(keyPath);
  const keyStatus = await page.textContent('#key-status');
  await ctx.close();
  return { anon: out.bytes, anonStatus: out.status, keyPath, key: JSON.parse(fs.readFileSync(keyPath, 'utf8').replace(/^\uFEFF/, '')), keyStatus, errors };
}
async function restore(fileBytes, name, keyPath, { confirm = true } = {}) {
  const { page, ctx, errors } = await newPage();
  const fp = path.join(outDir, `in-${Date.now()}-${name}`);
  fs.writeFileSync(fp, fileBytes);
  await page.setInputFiles('#rb-file', fp);
  await page.waitForFunction(() => document.querySelector('#rb-file-status').textContent, null, { timeout: 60000 });
  await page.setInputFiles('#rb-key', keyPath);
  await page.waitForFunction(() => document.querySelector('#rb-key-status').textContent);
  const fileStatus = await page.textContent('#rb-file-status');
  const keyStatus = await page.textContent('#rb-key-status');
  await page.click('#rb-btn-check').catch(() => {});
  const plan = await page.evaluate(() => { const p = window.__anon.rb.plan; return p ? { totalFound: p.totalFound, matchedKeys: p.matchedKeys, verdict: p.verdict, needsConfirm: p.needsConfirm, rows: p.rows, issues: p.issues } : null; });
  const reportText = await page.textContent('#rb-report');
  let res = { status: '', bytes: null };
  if (plan && plan.verdict !== 'falsch') {
    if (plan.needsConfirm && confirm) await page.check('#rb-confirm');
    res = await download(page, '#rb-btn-save', '#rb-status', /Gespeichert/);
    if (!res.bytes && /blockiert/.test(res.status)) {
      res.blocked = await page.$$eval('#rb-left li', (els) => els.map((e) => e.textContent));
      await page.check('#rb-left input[type=checkbox]');
      res = { ...await download(page, '#rb-btn-save', '#rb-status', /Gespeichert/), blocked: res.blocked };
    }
  }
  await ctx.close();
  return { plan, reportText, fileStatus, keyStatus, ...res, errors };
}

// ---------- Textgewinnung ohne Browser-Code ----------
const dec = (x) => x.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
function decodeTxt(b) { let t = b.toString('utf8'); if (t.charCodeAt(0) === 0xfeff) t = t.slice(1); return t; }
async function docxParagraphs(bytes) {
  const z = await JSZip.loadAsync(bytes);
  const out = [];
  for (const n of Object.keys(z.files).filter((x) => /^word\/(document|header\d*|footer\d*|footnotes|endnotes|comments)\.xml$/.test(x)).sort()) {
    const xml = await z.file(n).async('string');
    // Absätze in Dokumentreihenfolge (Textfelder separat, da verschachtelt)
    const paras = xml.split(/<w:p[ >]/).slice(1).map((p) => dec([...p.matchAll(/<w:(?:t|delText)(?: [^>]*)?>([^<]*)<\/w:(?:t|delText)>/g)].map((m) => m[1]).join('')));
    paras.forEach((t, i) => out.push(`${n}#${i}: ${t}`));
  }
  return out;
}
async function docxStructure(bytes) {
  const z = await JSZip.loadAsync(bytes);
  const xml = await z.file('word/document.xml').async('string');
  return xml.replace(/<w:(t|delText)(?: [^>]*)?>[^<]*<\/w:\1>/g, '<w:$1/>').replace(/<w:(t|delText)(?: [^>]*)?\/>/g, '<w:$1/>');
}
async function xlsxCells(bytes) {
  const z = await JSZip.loadAsync(bytes);
  const get = async (n) => (z.file(n) ? z.file(n).async('string') : '');
  const ss = [...(await get('xl/sharedStrings.xml')).matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) => dec([...m[1].matchAll(/<t(?: [^>]*)?>([^<]*)<\/t>/g)].map((x) => x[1]).join('')));
  const wb = await get('xl/workbook.xml');
  const out = [];
  [...wb.matchAll(/<sheet [^>]*name="([^"]*)"/g)].forEach((m, i) => out.push(`Blatt ${i + 1}: ${dec(m[1])}`));
  for (const m of wb.matchAll(/<definedName[^>]*>([^<]*)<\/definedName>/g)) out.push('Name: ' + dec(m[1]));
  for (let i = 1; i <= 3; i++) {
    const sh = await get(`xl/worksheets/sheet${i}.xml`);
    for (const c of sh.matchAll(/<c r="([A-Z]+\d+)"([^>]*)>([\s\S]*?)<\/c>/g)) {
      const t = (c[2].match(/t="(\w+)"/) || [])[1];
      const v = (c[3].match(/<v>([^<]*)<\/v>/) || [])[1];
      const f = (c[3].match(/<f>([^<]*)<\/f>/) || [])[1];
      let val = '';
      if (t === 's') val = ss[Number(v)];
      else if (t === 'inlineStr') val = dec([...c[3].matchAll(/<t(?: [^>]*)?>([^<]*)<\/t>/g)].map((x) => x[1]).join(''));
      else val = dec(v || '');
      out.push(`S${i}!${c[1]}: ${val}${f ? ' | f=' + dec(f) : ''}`);
    }
    for (const hf of sh.matchAll(/<(odd|even|first)(Header|Footer)>([^<]*)</g)) out.push(`S${i} ${hf[1]}${hf[2]}: ${dec(hf[3])}`);
  }
  const cm = await get('xl/comments1.xml');
  for (const m of cm.matchAll(/<comment ref="([^"]+)"[\s\S]*?<\/comment>/g)) out.push(`Kommentar ${m[1]}: ${dec([...m[0].matchAll(/<t(?: [^>]*)?>([^<]*)<\/t>/g)].map((x) => x[1]).join(''))}`);
  const app = await get('docProps/app.xml');
  for (const m of app.matchAll(/<vt:lpstr>([^<]*)<\/vt:lpstr>/g)) out.push('app: ' + dec(m[1]));
  return out;
}
function diffLists(a, b) {
  const dev = [];
  const n = Math.max(a.length, b.length);
  for (let i = 0; i < n; i++) if (a[i] !== b[i]) dev.push({ erwartet: b[i], ergebnis: a[i] });
  return dev;
}

// Platzhalter aus der Schlüsseldatei für bekannte Werte suchen
function phFor(key, wert, rolle) { const e = key.platzhalter.find((x) => x.wert === wert && (!rolle || x.rolle === rolle)); return e ? e.platzhalter : null; }

log('# Rückbau: Kreislauf-Beweis und Fallen');
log('');
log(`Chromium headless gegen index.html (SHA-256 ${sha(fs.readFileSync(path.join(root, 'index.html')))}…). Alle Namen sind erfunden.`);
log('');
const MANUAL = ['Ijeoma', 'Uchendu', 'Xiong', 'Wenjie'];
const summary = [];

// ---------- TXT ----------
{
  const orig = fs.readFileSync(path.join(fx, 'protokoll.txt'), 'utf8');
  const a = await anonymize(path.join(fx, 'protokoll.txt'), MANUAL);
  const anon = decodeTxt(a.anon);
  const N = phFor(a.key, 'Müller', 'Nachname');
  const V = phFor(a.key, 'Anna', 'Vorname');
  const E = phFor(a.key, 'anna.mueller@beispiel-firma.de');
  const edit = (t, n, v, e) => {
    let lines = t.split('\n');
    lines = lines.map((l) => l.replace('Begrüßung', 'Eröffnung'));
    lines.splice(3, 0, `Nachtrag: ${n} und ${v} ${n} haben zugestimmt (Kontakt ${e}). ${n}s Vorschlag gilt.`);
    const i3 = lines.findIndex((l) => l.startsWith('TOP 3'));
    const iEnd = lines.findIndex((l) => l.startsWith('Mit freundlichen'));
    const i2 = lines.findIndex((l) => l.startsWith('TOP 2'));
    const block = lines.splice(i3, iEnd - i3);
    lines.splice(i2, 0, ...block);
    return lines.join('\n');
  };
  const corrected = edit(anon, N, V, E);
  const expected = edit(orig, 'Müller', 'Anna', 'anna.mueller@beispiel-firma.de');
  const r = await restore(Buffer.from('\uFEFF' + corrected), 'korrigiert.txt', a.keyPath);
  const got = decodeTxt(r.bytes);
  const dev = diffLists(got.split('\n'), expected.split('\n'));
  summary.push(['TXT', r.plan.totalFound, r.plan.totalFound - dev.length, dev]);
  log('## TXT (protokoll.txt)');
  log(`- Anonymisiert (rückbaufähig): ${a.key.platzhalter.length} Platzhalter in der Schlüsseldatei; Status „${a.anonStatus.trim()}“`);
  log(`- Simulierte Korrektur: Wort geändert, Satz mit ${N}, ${V}, ${E} und Endung „${N}s“ eingefügt, Abschnitt TOP 3 vor TOP 2 verschoben`);
  log(`- Rückbau: ${r.plan.totalFound} Platzhalter ersetzt; abweichende Zeilen gegenüber Erwartung: ${dev.length}`);
  for (const d of dev) log(`  - erwartet „${d.erwartet}“ / erhalten „${d.ergebnis}“`);
  log(`- Bericht meldete: ${r.plan.rows.filter((x) => x.status !== 'ok').map((x) => `${x.platzhalter} ${x.erwartet}→${x.gefunden}`).join(', ') || 'keine Abweichung'}; Auffälligkeiten ${r.plan.issues.length}`);
  log(`- Dateiname: ${r.name}; JS-Fehler: ${[...a.errors, ...r.errors].join(' | ') || 'keine'}`);
  log('');
  fs.writeFileSync(path.join(outDir, 'txt-korrigiert-anonym.txt'), corrected);
  globalThis.__txt = { a, corrected };
}

// ---------- CSV ----------
{
  const orig = fs.readFileSync(path.join(fx, 'mitarbeiter.csv'), 'utf8');
  const a = await anonymize(path.join(fx, 'mitarbeiter.csv'));
  const anon = decodeTxt(a.anon);
  const N = phFor(a.key, 'Müller', 'Nachname');
  const V = phFor(a.key, 'Anna', 'Vorname');
  const E = phFor(a.key, 'anna.mueller@beispiel-firma.de');
  const edit = (t, n, v, e) => {
    const lines = t.split('\r\n');
    lines[1] = lines[1].replace('Leitung', 'Geschäftsleitung');
    const tmp = lines[3]; lines[3] = lines[4]; lines[4] = tmp; // Zeilen tauschen
    lines.splice(lines.length - 1, 0, `${v};${n};Neu;${e};"eingefügt; ${n}s Vertretung"`);
    return lines.join('\r\n');
  };
  const corrected = edit(anon, N, V, E);
  const expected = edit(orig, 'Müller', 'Anna', 'anna.mueller@beispiel-firma.de');
  const r = await restore(Buffer.from('\uFEFF' + corrected), 'korrigiert.csv', a.keyPath);
  const got = decodeTxt(r.bytes);
  const dev = diffLists(got.split('\r\n'), expected.split('\r\n'));
  summary.push(['CSV', r.plan.totalFound, r.plan.totalFound - dev.length, dev]);
  log('## CSV (mitarbeiter.csv)');
  log(`- Schlüsseldatei: ${a.key.platzhalter.length} Platzhalter (E-Mail-Platzhalter: ${a.key.platzhalter.filter((x) => x.kategorie === 'E-Mail').map((x) => x.platzhalter).join(', ')})`);
  log(`- Korrektur: Zelle geändert, zwei Zeilen getauscht, neue Zeile mit ${V} ${N}, ${E}, „${N}s“ eingefügt`);
  log(`- Rückbau: ${r.plan.totalFound} Platzhalter ersetzt; abweichende Zeilen: ${dev.length}`);
  for (const d of dev) log(`  - erwartet „${d.erwartet}“ / erhalten „${d.ergebnis}“`);
  log(`- JS-Fehler: ${[...a.errors, ...r.errors].join(' | ') || 'keine'}`);
  log('');
}

// ---------- DOCX ----------
{
  const origBytes = fs.readFileSync(path.join(fx, 'protokoll.docx'));
  const a = await anonymize(path.join(fx, 'protokoll.docx'), MANUAL);
  const N = phFor(a.key, 'Müller', 'Nachname');
  const V = phFor(a.key, 'Anna', 'Vorname');
  const editDocx = async (bytes, n, v) => {
    const z = await JSZip.loadAsync(bytes);
    let xml = await z.file('word/document.xml').async('string');
    xml = xml.replace('Begrüßung', 'Eröffnung');
    // Neuer Absatz, Platzhalter bzw. Name über zwei Runs (normal + fett) zerlegt
    const cut = Math.ceil(n.length / 2);
    const para = `<w:p><w:r><w:t xml:space="preserve">Nachtrag: </w:t></w:r><w:r><w:t>${n.slice(0, cut)}</w:t></w:r><w:r><w:rPr><w:b/></w:rPr><w:t xml:space="preserve">${n.slice(cut)}</w:t></w:r><w:r><w:t xml:space="preserve"> und ${v} ${n}s Team haben zugestimmt.</w:t></w:r></w:p>`;
    xml = xml.replace(/(<w:body>)/, `$1${para}`);
    // Überschriften TOP 2 und TOP 3 tauschen
    const p2 = xml.match(/<w:p><w:r><w:t xml:space="preserve">TOP 2: Personal<\/w:t><\/w:r><\/w:p>/)[0];
    const p3 = xml.match(/<w:p><w:r><w:t xml:space="preserve">TOP 3: Verschiedenes<\/w:t><\/w:r><\/w:p>/)[0];
    xml = xml.replace(p2, '@@P2@@').replace(p3, p2).replace('@@P2@@', p3);
    z.file('word/document.xml', xml);
    return z.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  };
  const corrected = await editDocx(a.anon, N, V);
  const expected = await editDocx(origBytes, 'Müller', 'Anna');
  const r = await restore(corrected, 'korrigiert.docx', a.keyPath);
  const got = await docxParagraphs(r.bytes);
  const exp = await docxParagraphs(expected);
  const dev = diffLists(got, exp);
  const sameStructure = (await docxStructure(r.bytes)) === (await docxStructure(corrected));
  summary.push(['DOCX', r.plan.totalFound, r.plan.totalFound - dev.length, dev]);
  log('## DOCX (protokoll.docx)');
  log(`- Schlüsseldatei: ${a.key.platzhalter.length} Platzhalter`);
  log(`- Korrektur: Wort geändert, neuer Absatz mit über zwei Runs zerlegtem „${N}“ (normal + fett), Absätze TOP 2/TOP 3 getauscht`);
  log(`- Rückbau: ${r.plan.totalFound} Platzhalter ersetzt; abweichende Absätze (Haupttext, Kopf-/Fußzeile, Fußnote, Kommentar, Textfeld): ${dev.length}`);
  for (const d of dev) log(`  - erwartet „${d.erwartet}“ / erhalten „${d.ergebnis}“`);
  log(`- Formatierung/Struktur von word/document.xml außer Text unverändert gegenüber der korrigierten Datei: ${sameStructure ? 'ja' : 'NEIN'}`);
  const z = await JSZip.loadAsync(r.bytes);
  const core = await z.file('docProps/core.xml').async('string');
  const comments = await z.file('word/comments.xml').async('string');
  log(`- Metadaten nach Rückbau (werden bewusst NICHT wiederhergestellt): creator „${(core.match(/<dc:creator>([^<]*)</) || [, ''])[1]}“, Kommentar-Autor „${(comments.match(/w:author="([^"]*)"/) || [, ''])[1]}“`);
  const rels = await z.file('word/_rels/document.xml.rels').async('string');
  log(`- Hyperlink-Ziel nach Rückbau: ${(rels.match(/Target="(mailto:[^"]*)"/) || [, '?'])[1]}`);
  log(`- Schlusscheck: ${r.blocked ? 'blockierte (' + r.blocked.join(' | ') + ')' : 'kein Platzhalter mehr im Ergebnis'}; Dateiname ${r.name}`);
  log(`- JS-Fehler: ${[...a.errors, ...r.errors].join(' | ') || 'keine'}`);
  log('');
}

// ---------- XLSX ----------
{
  const origBytes = fs.readFileSync(path.join(fx, 'mitarbeiter.xlsx'));
  const a = await anonymize(path.join(fx, 'mitarbeiter.xlsx'));
  const N = phFor(a.key, 'Müller', 'Nachname');
  const V = phFor(a.key, 'Anna', 'Vorname');
  const editXlsx = async (bytes, n, v) => {
    const z = await JSZip.loadAsync(bytes);
    let ss = await z.file('xl/sharedStrings.xml').async('string');
    ss = ss.replace('>Elternzeit<', '>Elternzeit (verlängert)<').replace('>Vertrieb<', `>Vertrieb, Ansprechpartner ${v} ${n}s Team<`);
    z.file('xl/sharedStrings.xml', ss);
    let sh = await z.file('xl/worksheets/sheet1.xml').async('string');
    // Zeilen 3 und 4 (Spalten A, B) tauschen
    const cell = (ref) => sh.match(new RegExp(`<c r="${ref}" t="s"><v>(\\d+)</v></c>`))[1];
    const [a3, b3, a4, b4] = ['A3', 'B3', 'A4', 'B4'].map(cell);
    const setv = (ref, v2) => { sh = sh.replace(new RegExp(`(<c r="${ref}" t="s"><v>)\\d+(</v>)`), `$1${v2}$2`); };
    setv('A3', a4); setv('B3', b4); setv('A4', a3); setv('B4', b3);
    z.file('xl/worksheets/sheet1.xml', sh);
    return z.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  };
  const corrected = await editXlsx(a.anon, N, V);
  const expected = await editXlsx(origBytes, 'Müller', 'Anna');
  const r = await restore(corrected, 'korrigiert.xlsx', a.keyPath);
  const got = await xlsxCells(r.bytes);
  const exp = await xlsxCells(expected);
  const dev = diffLists(got, exp);
  summary.push(['XLSX', r.plan.totalFound, r.plan.totalFound - dev.length, dev]);
  log('## XLSX (mitarbeiter.xlsx)');
  log(`- Schlüsseldatei: ${a.key.platzhalter.length} Platzhalter; ausgeblendetes Blatt „Yılmaz“ hieß anonymisiert „${phFor(a.key, 'Yılmaz', 'Nachname')}“`);
  log('- Korrektur: Zelltext geändert, Text mit Platzhaltern in eine Zelle eingefügt, Zeilen 3/4 getauscht');
  log(`- Rückbau: ${r.plan.totalFound} Platzhalter ersetzt; abweichende Zellen/Blattnamen/Formeln/Kommentare/Kopfzeilen: ${dev.length}`);
  for (const d of dev) log(`  - erwartet „${d.erwartet}“ / erhalten „${d.ergebnis}“`);
  const blatt = got.filter((x) => /^Blatt|^Name:|f=.*!|^app:/.test(x));
  log(`- Blattnamen und Bezüge nach Rückbau: ${blatt.join(' · ')}`);
  log(`- JS-Fehler: ${[...a.errors, ...r.errors].join(' | ') || 'keine'}`);
  log('');
}

// ---------- DOCX Kurs-Tabelle (Namen nur über "Anrede allein -> nächster Absatz/Nachbarzelle" erkannt) ----------
{
  const origBytes = fs.readFileSync(path.join(fx, 'kurse.docx'));
  const a = await anonymize(path.join(fx, 'kurse.docx'));
  const a2Names = ['Kirchbichler', 'Tesfamariam', 'Brzęczek', 'Sonnleitner'];
  const phs = a2Names.map((n) => phFor(a.key, n));
  const editDocx = async (bytes, n1, n2) => {
    const z = await JSZip.loadAsync(bytes);
    let xml = await z.file('word/document.xml').async('string');
    xml = xml.replace('Wir malen Landschaften', 'Wir zeichnen Landschaften');
    const para = `<w:p><w:r><w:t xml:space="preserve">Nachtrag: Frau ${n1} vertritt Frau ${n2}.</w:t></w:r></w:p>`;
    xml = xml.replace(/(<w:body>)/, `$1${para}`);
    // zwei Tabellenzeilen tauschen (Kurse "Töpfern" und "Schach")
    const rows = [...xml.matchAll(/<w:tr>(?:(?!<w:tr>)[\s\S])*?<\/w:tr>/g)].map((m) => m[0]);
    const r1 = rows.find((r) => r.includes('Töpfern'));
    const r2 = rows.find((r) => r.includes('Schach'));
    xml = xml.replace(r1, '@@R1@@').replace(r2, r1).replace('@@R1@@', r2);
    z.file('word/document.xml', xml);
    return z.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  };
  const corrected = await editDocx(a.anon, phs[0], phs[1]);
  const expected = await editDocx(origBytes, a2Names[0], a2Names[1]);
  const r = await restore(corrected, 'korrigiert.docx', a.keyPath);
  const got = await docxParagraphs(r.bytes);
  const exp = await docxParagraphs(expected);
  const dev = diffLists(got, exp);
  summary.push(['DOCX Kurs-Tabelle', r.plan.totalFound, r.plan.totalFound - dev.length, dev]);
  log('## DOCX Kurs-Tabelle (kurse.docx, Namen nur über Anrede im Absatz/der Zelle davor erkannt)');
  log(`- Platzhalter der nur so erkannten Namen: ${a2Names.map((n, i) => `${n} → ${phs[i]}`).join(', ')}`);
  log(`- Korrektur: Wort geändert, Satz mit ${phs[0]} und ${phs[1]} eingefügt, zwei Tabellenzeilen getauscht`);
  log(`- Rückbau: ${r.plan.totalFound} Platzhalter ersetzt; abweichende Absätze: ${dev.length}`);
  for (const d of dev) log(`  - erwartet „${d.erwartet}“ / erhalten „${d.ergebnis}“`);
  log(`- JS-Fehler: ${[...a.errors, ...r.errors].join(' | ') || 'keine'}`);
  log('');
  globalThis.__kursePhs = phs;
}

// ---------- Fallen ----------
log('## Fallen (einzeln geprüft)');
{
  const persons = ['Anna Müller', 'Peter Müller', 'Mehmet Yılmaz', 'Ayşe Öztürk', 'Fatima Haddad', 'Agnieszka Wiśniewska', 'Krzysztof Kowalczyk',
    'Chukwuemeka Okonkwo', 'Oluwaseun Adebayo', 'Ngozi Eze', 'Alejandro Fernández', 'Dmitri Iwanow', 'Swetlana Kusnezowa', 'Nguyễn Văn Thành',
    'Trần Thị Mai', 'María García', 'Klaus Schröder', 'Ursula von der Leyen', 'Mohammed Al-Hassan', 'Jolanthe Weber', 'Kemal Demir',
    'Ingrid Hoffmann', 'Bernd Krüger', 'Monika Neumann', 'Felix Marx', 'Andreas Haas', 'Olga Petrowa', 'Svenja Lindqvist'];
  const text = [
    'Fallen-Test für den Rückbau',
    `Teilnehmer: ${persons.join(', ')}.`,
    'Frau Müller leitet. Müllers Bericht liegt vor. MÜLLER unterschrieb. A. Müller kam später.',
    'Herr Müller (unklar, welcher) rief an. Peter Müller war im Urlaub.',
    'Marx\' Theorie und Herrn Haas\' Akte. Felix Marx und Andreas Haas stimmen zu.',
    'Zum Schluss: Svenja Lindqvist und Olga Petrowa.',
    'E-Mail: anna@beispiel.de, zweite Adresse anna.mueller@beispiel.de, nochmals anna@beispiel.de.',
    'Telefon 030 1234567, IBAN DE89 3704 0044 0532 0130 00, Adresse Musterweg 12, 10115 Berlin.',
    'Ende.',
  ].join('\n');
  const fp = path.join(fx, 'rueckbau-fallen.txt');
  fs.writeFileSync(fp, text);
  const a = await anonymize(fp);
  const anon = decodeTxt(a.anon);
  fs.writeFileSync(path.join(outDir, 'fallen-anonym.txt'), anon);
  const k = a.key;
  const ph = (w, r) => phFor(k, w, r);
  const lines = anon.split('\n');
  log('- Anonymisierte Fallen-Zeilen (so sieht die KI den Text):');
  for (const l of lines.slice(2, 8)) log(`  > ${l}`);
  // Prüfungen am anonymisierten Text
  const checks = [];
  const chk = (name, ok, info = '') => { checks.push([name, ok]); log(`- ${ok ? 'OK' : 'FEHLER'}: ${name}${info ? ' – ' + info : ''}`); };
  const nA = ph('Müller', 'Nachname');
  const aaEntry = k.platzhalter.find((x) => x.person === 'AA');
  const nH = ph('Haas', 'Nachname');
  chk('voller Name gegen nur Nachname: gleiche Person, Nachname-Platzhalter gleich', lines[4].includes(`Herrn ${nH}' Akte`) && lines[4].includes(`${ph('Andreas', 'Vorname')} ${nH} stimmen`), `„Andreas Haas“ → „${ph('Andreas', 'Vorname')} ${nH}“, „Herrn Haas'“ → „Herrn ${nH}'“`);
  const nFrau = lines[2].match(/^Frau (Nachname [A-Z]+\d*) leitet/)[1];
  chk('nur Nachname bei zwei Personen gleichen Nachnamens (mehrdeutig): eigener Platzhalter, exakt rückbaubar', nFrau !== nA && k.platzhalter.find((x) => x.platzhalter === nFrau).wert === 'Müller', `„Frau Müller“ → „Frau ${nFrau}“ (Anna: ${nA}); in der Prüfansicht mit „zusammenführen“ änderbar`);
  const peterN = k.platzhalter.find((x) => x.wert === 'Müller' && x.platzhalter !== nA && x.rolle === 'Nachname');
  chk('zwei Personen mit gleichem Nachnamen bekommen verschiedene Platzhalter', !!peterN, `Anna → ${nA}, Peter → ${peterN && peterN.platzhalter}`);
  const gross = k.platzhalter.find((x) => x.wert === 'MÜLLER');
  chk('GROSSSCHREIBUNG als eigene Schreibweise mit Nummer', !!gross && /\d$/.test(gross.platzhalter), gross && `„MÜLLER“ → „${gross.platzhalter}“`);
  const ini = k.platzhalter.find((x) => x.rolle === 'Initiale');
  chk('Initiale', !!ini && lines[2].includes(`${ini.platzhalter}. ${nA} kam`), ini && `„A. Müller“ → „${ini.platzhalter}. ${nA}“`);
  chk('Namen auf -x/-s mit Apostroph-Endung', lines[4].includes(`${ph('Marx', 'Nachname')}' Theorie`) && lines[4].includes(`${ph('Haas', 'Nachname')}' Akte`), `„Marx'“ → „${ph('Marx', 'Nachname')}'“, „Haas'“ → „${ph('Haas', 'Nachname')}'“`);
  chk('„Nachname A“ gegen „Nachname AA“ und „Nachname A2“ alle verschieden', !!aaEntry && !!gross, `AA-Person: ${aaEntry && aaEntry.platzhalter} = ${aaEntry && aaEntry.wert}; A2: ${gross && gross.platzhalter}`);
  const mails = k.platzhalter.filter((x) => x.kategorie === 'E-Mail');
  chk('zwei verschiedene E-Mail-Adressen, gleiche Adresse gleiche Nummer', mails.length === 2 && lines[6].split(mails[0].platzhalter).length === 3, mails.map((x) => `${x.platzhalter}=${x.wert}×${x.anzahl}`).join(', '));
  chk('Namenszusatz „von der“ und Präfix „Al-“ im Platzhalter enthalten', ph('von der Leyen', 'Nachname') !== null && ph('Al-Hassan', 'Nachname') !== null);
  // Simulierte KI-Bearbeitung mit Fallen
  const tel = ph('030 1234567');
  const L = [...lines];
  L[2] = L[2].replace(`Frau ${nFrau} leitet`, `Frau ${nFrau.toLowerCase()} leitet`); // Kleinschreibung
  L.splice(8, 0, `Zusatz: Laut des ${nA.replace('Nachname', 'Nachnamens')} gilt das. Auch ${aaEntry.platzhalter} ist dabei. Unbekannt: Nachname ZZ. Kontakt [E-Mail-1].`);
  L.splice(9, 0, 'Getrennt: Nachname', nA.split(' ')[1] + ' am Zeilenanfang.');
  L[7] = L[7].replace(`Telefon ${tel}, `, 'Telefon gelöscht, ');
  const corrected = L.join('\n');
  const O = text.split('\n');
  O[2] = O[2].replace('Frau Müller leitet', `Frau ${nFrau.toLowerCase()} leitet`);
  O.splice(8, 0, `Zusatz: Laut des ${nA.replace('Nachname', 'Nachnamens')} gilt das. Auch ${aaEntry.wert} ist dabei. Unbekannt: Nachname ZZ. Kontakt [E-Mail-1].`);
  O.splice(9, 0, 'Getrennt: Nachname', nA.split(' ')[1] + ' am Zeilenanfang.');
  O[7] = O[7].replace('Telefon 030 1234567, ', 'Telefon gelöscht, ');
  const expected = O.join('\n');
  const r = await restore(Buffer.from(corrected), 'fallen-korrigiert.txt', a.keyPath);
  const got = decodeTxt(r.bytes);
  const dev = diffLists(got.split('\n'), expected.split('\n'));
  summary.push(['Fallen-TXT', r.plan.totalFound, r.plan.totalFound - dev.length, dev]);
  const arts = r.plan.issues.map((x) => `${x.art}: ${x.text}`);
  chk('Kleinschreibung „nachname a“ erkannt und NICHT geraten', arts.some((x) => /^verändert: nachname/.test(x)), arts.find((x) => /nachname/.test(x)));
  chk('gebeugt „des Nachnamens A“ erkannt', arts.some((x) => /^gebeugt/.test(x)), arts.find((x) => /^gebeugt/.test(x)));
  chk('Platzhalter über Zeilen getrennt erkannt', arts.some((x) => /^getrennt/.test(x)), arts.find((x) => /^getrennt/.test(x)));
  chk('unbekannter Platzhalter „Nachname ZZ“ gemeldet', arts.some((x) => /^unbekannt: Nachname ZZ/.test(x)));
  chk('veränderter Kontakt-Platzhalter „[E-Mail-1]“ gemeldet', arts.some((x) => /\[E-Mail-1\]/.test(x)));
  const telRow = r.plan.rows.find((x) => x.platzhalter === tel);
  chk('gelöschter Platzhalter (Telefon) als „weniger“ gemeldet', telRow && telRow.status === 'weniger', telRow && `${telRow.erwartet}→${telRow.gefunden}`);
  const aaRow = r.plan.rows.find((x) => x.platzhalter === aaEntry.platzhalter);
  chk('eingefügter Platzhalter als „mehr“ gemeldet', aaRow && aaRow.status === 'mehr', aaRow && `${aaRow.erwartet}→${aaRow.gefunden}`);
  chk('Export erst nach Bestätigung (Bericht verlangte Bestätigung)', r.plan.needsConfirm === true);
  chk('Ergebnis entspricht exakt der Erwartung (alle exakten Platzhalter zurück, Auffälliges unverändert)', dev.length === 0, dev.map((d) => `erwartet „${d.erwartet}“ / erhalten „${d.ergebnis}“`).join(' ; '));
  log(`- Rückbau-Bericht: ${r.plan.totalFound} ersetzt; Auffälligkeiten: ${arts.join(' | ')}`);
  // Falsche Schlüsseldatei
  const wrong = await restore(Buffer.from(corrected), 'fallen-korrigiert.txt', globalThis.__txt.a.keyPath);
  chk('falsche Schlüsseldatei (vom Protokoll) erkannt', wrong.plan && wrong.plan.verdict !== 'passend', `Urteil: ${wrong.plan && wrong.plan.verdict}; Meldung: ${(wrong.reportText.match(/(Wahrscheinlich[^.]*\.|Die Schlüsseldatei passt nicht[^.]*\.)/) || [''])[0]}`);
  const wrong2 = await restore(Buffer.from('Ganz normaler Text ohne Platzhalter.'), 'leer.txt', a.keyPath);
  chk('Datei ohne passende Platzhalter: kein Ergebnis', wrong2.plan && wrong2.plan.verdict === 'falsch' && !wrong2.bytes, wrong2.reportText.slice(0, 120));
  // Alte Zuordnungstabelle als Schlüssel
  const csvKey = path.join(outDir, 'zuordnung_VERTRAULICH.csv');
  fs.writeFileSync(csvKey, '\uFEFFVERTRAULICH – enthält echte Namen\r\n"Pseudonym";"Klarname (Schreibweisen)";"Treffer aktiv"\r\n"Person A";"Anna Müller / Müller";"3"\r\n');
  const old = await restore(Buffer.from(corrected), 'x.txt', csvKey);
  chk('alte Zuordnungstabelle (CSV) wird abgelehnt', /reicht für einen Rückbau NICHT/.test(old.keyStatus), old.keyStatus.slice(0, 110));
  // Determinismus Rückbau
  const r2 = await restore(Buffer.from(corrected), 'fallen-korrigiert.txt', a.keyPath);
  chk('Rückbau deterministisch (Doppellauf byte-gleich)', sha(r.bytes) === sha(r2.bytes), `${sha(r.bytes)} / ${sha(r2.bytes)}`);
  const a2 = await anonymize(fp);
  chk('Anonymisierung rückbaufähig deterministisch (Datei und Schlüssel)', sha(a.anon) === sha(a2.anon) && JSON.stringify(a.key) === JSON.stringify(a2.key), `${sha(a.anon)} / ${sha(a2.anon)}`);
  globalThis.__checks = checks;
}

// ---------- Modi ohne Rückbau ----------
for (const mode of ['person', 'name']) {
  const { page, ctx } = await newPage();
  await setMode(page, mode);
  await loadFile(page, path.join(fx, 'protokoll.txt'));
  const norev = await page.isVisible('#norev-note');
  const keyBtn = await page.isVisible('#btn-key');
  const ok = norev && !keyBtn;
  globalThis.__checks.push([`Modus ${mode}`, ok]);
  log(`- ${ok ? 'OK' : 'FEHLER'}: Modus „${mode === 'person' ? 'Person A' : '[NAME]'}“ zeigt „nicht rückbaufähig“ (${norev}) und keine Schlüsseldatei (${!keyBtn})`);
  await ctx.close();
}
await browser.close();

log('');
log('## Zusammenfassung Kreislauf');
log('| Format | Werte gesamt (ersetzte Platzhalter) | exakt zurück | Abweichungen |');
log('|---|---|---|---|');
for (const [f, total, ok, dev] of summary) log(`| ${f} | ${total} | ${ok} | ${dev.length} |`);
const failed = globalThis.__checks.filter((c) => !c[1]);
log('');
log(`Fallen-Prüfungen: ${globalThis.__checks.length - failed.length} von ${globalThis.__checks.length} bestanden${failed.length ? ' – FEHLER: ' + failed.map((c) => c[0]).join('; ') : ''}.`);
const external = requests.filter((u) => !/^(file|blob|data):/.test(u));
log(`Netzwerkanfragen außer lokalen Dateien: ${external.length}${external.length ? ' – ' + external.join(', ') : ''}.`);
fs.writeFileSync(path.join(here, 'ROUNDTRIP-REPORT.md'), report.join('\n') + '\n');
process.exit(failed.length || summary.some((s) => s[3].length) ? 1 : 0);
