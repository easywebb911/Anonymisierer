// Beweis "versteckte Angaben" (Version 1.3): Ausgabedateien entpacken und ALLE Teile nach jedem Testnamen
// durchsuchen (vorher/nachher je Teil), Bildpunkte vorher/nachher vergleichen, SharePoint-Struktur prüfen,
// Schlusscheck-Falle (TIFF) prüfen, Paket-Konsistenz und Öffnen in LibreOffice prüfen, Rückbau ohne Bereinigung.
// Ergebnis: tests/META-REPORT.md. Aufruf: node tests/meta-proof.mjs (vorher npm run build, node tests/make-meta.mjs)
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import zlib from 'node:zlib';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import JSZip from 'jszip';
import { META_PEOPLE } from './make-meta.mjs';
import { startAnon, loadIn, goTo, ackAll, exportOnce, exportWithAck, saveKey, screenOf } from './ui-helpers.mjs';

const { chromium } = createRequire('/opt/node22/lib/node_modules/')('playwright');
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const fx = path.join(here, 'fixtures');
const outDir = path.join(here, 'out-meta');
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });
const report = [];
const log = (s = '') => { report.push(s); console.log(s); };
const checks = [];
const check = (name, ok, detail = '') => { checks.push([name, ok]); log(`- ${ok ? 'OK' : 'FEHLER'}: ${name}${detail ? ' – ' + detail : ''}`); };
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');

// Testnamen: alle Namen aus den Metadaten und der bestätigte Name aus dem Text
const NAMES = [...new Set([META_PEOPLE.creator, META_PEOPLE.lastModifiedBy, META_PEOPLE.manager, META_PEOPLE.company, META_PEOPLE.spPerson, META_PEOPLE.spPerson2, META_PEOPLE.textPerson])];
// Gesucht wird jedes Namenswort der Personen (≥ 4 Buchstaben) und der Firmenname als Ganzes (Wörter wie „Beratung“
// kommen auch als normales Wort im Text vor), in UTF-8, Latin-1, UTF-16 und ue-Schreibweise
const WORDS = [...new Set(NAMES.filter((n) => n !== META_PEOPLE.company).flatMap((n) => n.split(/[\s-]+/)).filter((w) => w.length >= 4)), META_PEOPLE.company];
const variants = (w) => [...new Set([w, w.replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/Ä/g, 'Ae').replace(/Ö/g, 'Oe').replace(/Ü/g, 'Ue')])];
function decodedViews(name, bytes) {
  const views = [bytes.toString('utf8'), bytes.toString('latin1'), bytes.toString('utf16le')];
  if (bytes[0] === 0x89 && bytes[1] === 0x50) { // PNG: komprimierte Textblöcke entpacken
    let i = 8;
    while (i + 12 <= bytes.length) {
      const len = bytes.readUInt32BE(i);
      const type = bytes.toString('latin1', i + 4, i + 8);
      const data = bytes.subarray(i + 8, i + 8 + len);
      if (type === 'zTXt') { try { views.push(zlib.inflateSync(data.subarray(data.indexOf(0) + 2)).toString('latin1')); } catch { /* */ } }
      i += 12 + len;
    }
  }
  if (/\.xml$|\.rels$/i.test(name)) views.push(bytes.toString('utf8').replace(/&amp;/g, '&'));
  return views;
}
// Zählt je Teil die Vorkommen aller Namenswörter (Maximum über die Kodierungen, damit nichts doppelt zählt)
async function countParts(bytes) {
  const z = await JSZip.loadAsync(bytes);
  const res = {};
  for (const n of Object.keys(z.files).filter((x) => !z.files[x].dir).sort()) {
    const b = await z.file(n).async('nodebuffer');
    const views = decodedViews(n, b);
    let total = 0;
    const per = {};
    for (const w of WORDS) {
      let best = 0;
      for (const v of variants(w)) for (const t of views) best = Math.max(best, t.split(v).length - 1);
      if (best) per[w] = best;
      total += best;
    }
    res[n] = { total, per };
  }
  return res;
}
async function zipFiles(bytes) {
  const z = await JSZip.loadAsync(bytes);
  const out = {};
  for (const n of Object.keys(z.files).filter((x) => !z.files[x].dir)) out[n] = await z.file(n).async('nodebuffer');
  return out;
}

const browser = await chromium.launch();
const requests = [];
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
// Version 2: Start -> „Dokument anonymisieren“ -> Antwort -> Datei
async function loadFile(page, file, mode = 'person') {
  if ((await screenOf(page)) === 'start') await startAnon(page, mode);
  await loadIn(page, file);
}
// Bildpunkte im Browser dekodieren (wie ein Betrachter sie anzeigt) und als Prüfsumme zurückgeben
async function pixelHash(page, bytes, mime) {
  const arr = await page.evaluate(async ({ b, mime }) => {
    const bmp = await createImageBitmap(new Blob([new Uint8Array(b)], { type: mime }));
    const c = document.createElement('canvas');
    c.width = bmp.width; c.height = bmp.height;
    const x = c.getContext('2d');
    x.drawImage(bmp, 0, 0);
    return { w: bmp.width, h: bmp.height, d: Array.from(x.getImageData(0, 0, bmp.width, bmp.height).data) };
  }, { b: Array.from(bytes), mime });
  return `${arr.w}x${arr.h}:${sha(Buffer.from(arr.d)).slice(0, 16)}`;
}
// Paket-Konsistenz: alle XML-Teile wohlgeformt, alle internen Verweise und Inhaltstyp-Einträge zeigen auf vorhandene Teile
async function packageCheck(page, files) {
  const xml = Object.fromEntries(Object.entries(files).filter(([n]) => /\.(xml|rels)$/i.test(n)).map(([n, b]) => [n, b.toString('utf8')]));
  return page.evaluate(({ xml, names }) => {
    const problems = [];
    const docs = {};
    for (const [n, s] of Object.entries(xml)) {
      const d = new DOMParser().parseFromString(s, 'application/xml');
      if (d.getElementsByTagName('parsererror').length) problems.push('XML-Fehler: ' + n); else docs[n] = d;
    }
    const resolve = (dir, t) => { if (t.startsWith('/')) return t.slice(1); const o = []; for (const p of (dir + t).split('/')) { if (p === '..') o.pop(); else if (p && p !== '.') o.push(p); } return o.join('/'); };
    for (const [n, d] of Object.entries(docs)) {
      if (!/\.rels$/.test(n)) continue;
      const dir = n.replace(/_rels\/[^/]*\.rels$/, '');
      for (const r of Array.from(d.getElementsByTagName('Relationship'))) {
        if (r.getAttribute('TargetMode') === 'External') continue;
        const t = resolve(dir, r.getAttribute('Target'));
        if (!names.includes(t)) problems.push(`Verweis ins Leere: ${n} -> ${t}`);
      }
    }
    const ct = docs['[Content_Types].xml'];
    if (ct) for (const o of Array.from(ct.getElementsByTagName('Override'))) { const t = o.getAttribute('PartName').slice(1); if (!names.includes(t)) problems.push('Inhaltstyp ohne Teil: ' + t); }
    return problems;
  }, { xml, names: Object.keys(files) });
}
function libreOffice(bytes, ext) {
  const t = fs.mkdtempSync(path.join(os.tmpdir(), 'lo-'));
  const f = path.join(t, 'datei.' + ext);
  fs.writeFileSync(f, bytes);
  const target = ext === 'xlsx' ? 'csv' : 'txt:Text';
  try {
    execFileSync('soffice', ['--headless', '-env:UserInstallation=file://' + t + '/p', '--convert-to', target, '--outdir', t, f], { stdio: 'pipe', timeout: 120000 });
    const outF = path.join(t, 'datei.' + (ext === 'xlsx' ? 'csv' : 'txt'));
    return { ok: fs.existsSync(outF), text: fs.existsSync(outF) ? fs.readFileSync(outF, 'utf8') : '' };
  } catch (e) { return { ok: false, err: String(e.message).slice(0, 200), text: '' }; } finally { fs.rmSync(t, { recursive: true, force: true }); }
}

log('# Versteckte Angaben (Version 1.3): Beweis');
log('');
log(`Chromium headless gegen index.html (SHA-256 ${sha(fs.readFileSync(path.join(root, 'index.html'))).slice(0, 16)}…). Alle Namen sind erfunden.`);
log(`Gesuchte Namenswörter und Firmenname (in UTF-8, Latin-1, UTF-16, ae/oe/ue, entpackten PNG-Textblöcken): ${WORDS.join(', ')}`);
log('');

const FILES = [['meta-word.docx', 'docx'], ['meta-tabelle.xlsx', 'xlsx']];
for (const [file, kind] of FILES) {
  const orig = fs.readFileSync(path.join(fx, file));
  const before = await countParts(orig);
  const origFiles = await zipFiles(orig);
  log(`## ${file}`);
  for (const mode of ['person', 'name', 'reversible']) {
    const { page, ctx, errors } = await newPage();
    await loadFile(page, path.join(fx, file), mode);
    // Version 2: Namen aus den Dateiangaben erscheinen als Fragen auf dem Prüfen-Bildschirm
    const ui = await page.evaluate(() => ({ meta: window.__anon.questions().filter((q) => q.kind === 'meta').map((q) => `In den Dateiangaben steht „${q.name}“`).join(' | '), warnings: window.__anon.app.doc.warnings }));
    const out = await page.evaluate(async (k) => { const o = await window.__anon.buildOutput(k); const leaks = await window.__anon.finalCheck(o); return { bytes: Array.from(o.bytes), leaks }; }, kind);
    const bytes = Buffer.from(out.bytes);
    fs.writeFileSync(path.join(outDir, `${mode}-${file}`), bytes);
    const after = await countParts(bytes);
    const outFiles = await zipFiles(bytes);
    log(`### Modus „${mode === 'person' ? 'Person A' : mode === 'name' ? '[NAME]' : 'rückbaufähig'}“`);
    if (mode === 'person') {
      log('');
      log('| Teil der Datei | Namenswörter vorher | nachher |');
      log('|---|---|---|');
      for (const n of [...new Set([...Object.keys(before), ...Object.keys(after)])].sort()) {
        const b = before[n] ? before[n].total : '–';
        const a = after[n] ? after[n].total : '(entfernt)';
        if (b === 0 && a === 0) continue;
        log(`| ${n} | ${b}${before[n] && before[n].total ? ' (' + Object.entries(before[n].per).map(([w, c]) => `${w} ${c}`).join(', ') + ')' : ''} | ${a}${after[n] && after[n].total ? ' (' + Object.entries(after[n].per).map(([w, c]) => `${w} ${c}`).join(', ') + ')' : ''} |`);
      }
      log('');
    }
    const left = Object.entries(after).filter(([, v]) => v.total);
    check(`${file} (${mode}): in KEINEM Teil der Ausgabe steht noch ein Testname`, !left.length, left.map(([n, v]) => `${n}: ${JSON.stringify(v.per)}`).join('; ') || `vorher ${Object.values(before).reduce((s, v) => s + v.total, 0)} Vorkommen, nachher 0`);
    check(`${file} (${mode}): Schlusscheck ohne Fund`, !out.leaks.length, out.leaks.map((l) => `${l.word} – ${l.where}`).join('; '));
    if (mode === 'person') {
      check(`${file}: Prüfen-Bildschirm fragt nach allen Namen aus den Dateiangaben`, NAMES.filter((n) => n !== META_PEOPLE.textPerson).every((n) => ui.meta.includes(n)), ui.meta.slice(0, 220));
      // Bildpunkte
      for (const n of Object.keys(origFiles).filter((x) => /media\//.test(x))) {
        const mime = /jpe?g$/.test(n) ? 'image/jpeg' : /png$/.test(n) ? 'image/png' : 'image/gif';
        const h1 = await pixelHash(page, origFiles[n], mime);
        const h2 = await pixelHash(page, outFiles[n], mime);
        check(`${file}: ${n} – Bildpunkte vorher/nachher identisch`, h1 === h2, `${h1} / ${h2}; Dateigröße ${origFiles[n].length} → ${outFiles[n].length} Byte`);
      }
      // Ausrichtung im JPEG bleibt erhalten (minimales EXIF nur mit Orientation)
      const jp = Object.keys(outFiles).find((x) => /\.jpeg$/.test(x));
      const exifIdx = outFiles[jp].indexOf(Buffer.from('Exif\0\0', 'latin1'));
      check(`${file}: JPEG-Ausrichtung (6) bleibt erhalten, sonst keine EXIF-Angaben`, exifIdx > 0 && outFiles[jp].readUInt16BE(exifIdx + 6 + 8 + 2 + 8) === 6 && outFiles[jp].readUInt16BE(exifIdx + 6 + 8) === 1);
      // SharePoint-Struktur
      const sp = outFiles['customXml/item1.xml'].toString('utf8');
      const ui0 = (origFiles['customXml/item1.xml'].toString('utf8').match(/<UserInfo>/g) || []).length;
      check(`${file}: SharePoint-Felder – Struktur erhalten (${ui0} Personeneinträge), Personen geleert (AccountId xsi:nil)`, (sp.match(/<UserInfo>/g) || []).length === ui0 && !/<DisplayName>[^<]/.test(sp) && (sp.match(/<AccountId xsi:nil="true"\/?>/g) || []).length === ui0);
      check(`${file}: SharePoint-Textfelder mit Namen geleert, anderes bleibt („Projektakte 2026“)`, /<Bemerkung[^>]*\/>|<Bemerkung[^>]*><\/Bemerkung>/.test(sp) && /<Mandant[^>]*\/>|<Mandant[^>]*><\/Mandant>/.test(sp) && sp.includes('>Projektakte 2026<'));
      const cu = outFiles['eigenschaften/benutzer.xml'].toString('utf8');
      check(`${file}: benutzerdefinierte Textwerte geleert, Zahl bleibt`, !/<vt:lpwstr>[^<]/.test(cu) && cu.includes('<vt:i4>3</vt:i4>'));
      const probs = await packageCheck(page, outFiles);
      check(`${file}: Paket konsistent (XML wohlgeformt, keine Verweise ins Leere)`, !probs.length, probs.join('; '));
      const lo = libreOffice(bytes, kind);
      const loOrig = libreOffice(orig, kind);
      check(`${file}: LibreOffice öffnet die Ausgabe`, lo.ok, lo.err || `Text ${lo.text.length} Zeichen (Original ${loOrig.text.length})`);
    }
    if (errors.length) log(`  - JS-Fehler: ${errors.join(' | ')}`);
    await ctx.close();
  }
  log('');
}

// ---------- Rückbau: keine Bereinigung ----------
log('## Rückbau bleibt ohne Bereinigung');
{
  const { page, ctx } = await newPage();
  await loadFile(page, path.join(fx, 'meta-word.docx'), 'reversible');
  await ackAll(page);
  const kd = await saveKey(page); // erst Schlüssel, dann Datei
  const keyPath = path.join(outDir, 'rb-key.json');
  await kd.saveAs(keyPath);
  const { dl } = await exportWithAck(page, 'docx');
  const anonPath = path.join(outDir, 'rb-anon.docx');
  await dl.saveAs(anonPath);
  await ctx.close();
  // Bild MIT Bildangaben und Kern-Eigenschaften MIT Autor zurück in die anonymisierte Datei legen
  const orig = await zipFiles(fs.readFileSync(path.join(fx, 'meta-word.docx')));
  const z = await JSZip.loadAsync(fs.readFileSync(anonPath));
  z.file('word/media/foto1.jpeg', orig['word/media/foto1.jpeg']);
  z.file('eigenschaften/kern.xml', orig['eigenschaften/kern.xml']);
  const inPath = path.join(outDir, 'rb-mit-angaben.docx');
  fs.writeFileSync(inPath, await z.generateAsync({ type: 'nodebuffer' }));
  const p2 = await newPage();
  await p2.page.click('#go-restore');
  await p2.page.setInputFiles('#rb-file', inPath);
  await p2.page.waitForFunction(() => document.querySelector('#rb-file-status').textContent);
  await p2.page.setInputFiles('#rb-key', keyPath);
  await p2.page.waitForFunction(() => document.querySelector('#rb-key-status').textContent);
  await p2.page.click('#rb-btn-check');
  const res = await p2.page.evaluate(() => (window.__anon.rb.plan ? window.__anon.rb.plan.totalFound : -1));
  await p2.page.click('#r2-next');
  const dl2P = p2.page.waitForEvent('download', { timeout: 60000 });
  await p2.page.click('#rb-btn-save');
  const dl2 = await dl2P;
  const outPath = path.join(outDir, 'rb-wiederhergestellt.docx');
  await dl2.saveAs(outPath);
  const restored = await zipFiles(fs.readFileSync(outPath));
  await p2.ctx.close();
  check('Rückbau: Bild mit Bildangaben bleibt unverändert (keine Bereinigung beim Rückbau)', restored['word/media/foto1.jpeg'].equals(orig['word/media/foto1.jpeg']), `${res} Platzhalter zurückgebaut`);
  check('Rückbau: Dateieigenschaften bleiben unverändert (Metadaten werden nicht verändert)', restored['eigenschaften/kern.xml'].toString('utf8').includes(META_PEOPLE.creator));
  check('Rückbau: Name im Text wiederhergestellt', (await JSZip.loadAsync(fs.readFileSync(outPath)).then((x) => x.file('word/document.xml').async('string'))).includes(META_PEOPLE.textPerson));
}
log('');

// ---------- Schlusscheck-Falle ----------
log('## Schlusscheck-Falle (meta-falle.docx: TIFF-Bild mit Autor, das das Tool nicht bereinigt)');
{
  const { page, ctx, errors } = await newPage();
  await loadFile(page, path.join(fx, 'meta-falle.docx'));
  const warnings = await page.evaluate(() => window.__anon.app.doc.warnings);
  await ackAll(page);
  const rowText = await page.textContent('#ampel');
  check('Hinweis auf dem Speichern-Bildschirm nennt den Bildtyp TIFF', warnings.some((w) => /TIFF/.test(w)) && /TIFF/.test(rowText), warnings.find((w) => /TIFF/.test(w)) || '');
  const { status } = await exportOnce(page, 'docx');
  const leaks = await page.$$eval('#leaks li', (els) => els.map((e) => e.textContent));
  check('Schlusscheck blockiert den Export', /blockiert/.test(status), status);
  check('Schlusscheck nennt die Fundstelle „Bild“ im TIFF-Teil', leaks.some((l) => /Bild/.test(l) && /scan4\.tiff/.test(l)), leaks.filter((l) => /tiff/.test(l)).slice(0, 2).join(' | '));
  const others = leaks.filter((l) => !/scan4\.tiff/.test(l));
  check('Schlusscheck meldet nur das TIFF (alles andere ist bereinigt)', !others.length, others.join(' | '));
  if (errors.length) log(`  - JS-Fehler: ${errors.join(' | ')}`);
  await ctx.close();
}
log('');

// ---------- Hinweis beim Speichern, Übernehmen-Knopf ----------
log('## Oberfläche');
{
  const { page, ctx } = await newPage();
  await loadFile(page, path.join(fx, 'meta-word.docx'));
  await ackAll(page);
  await exportWithAck(page, 'docx');
  const after1 = await page.textContent('.after');
  check('Hinweis nach dem Speichern im Kasten „Danach“ (du-Form, Word)', after1.includes('Lade die Datei direkt hoch. Wenn du sie vorher in Word öffnest und speicherst, trägt Word deinen Namen wieder ein.'), after1.trim().slice(0, 140));
  // Frage zu einem Namen aus den Dateiangaben auf dem Prüfen-Bildschirm mit „Ja, übernehmen“ beantworten
  await goTo(page, 'a2');
  for (let i = 0; i < 20; i++) {
    const t = await page.textContent('#qcard');
    if (/In den Dateiangaben steht/.test(t)) { await page.click('#q-yes'); break; }
    await page.click('#q-no');
  }
  const after = await page.evaluate(() => ({ terms: window.__anon.app.state.manualTerms.slice(), q: window.__anon.questions().filter((q) => q.kind === 'meta' && q.taken).map((q) => q.name) }));
  check('Frage „Als Namen übernehmen?“ mit Ja übernimmt den Namen als eigenen Namen', after.terms.length === 1 && after.q.length === 1, `übernommen: ${after.terms.join(', ')}`);
  await ctx.close();
}
{
  const { page, ctx } = await newPage();
  await loadFile(page, path.join(fx, 'meta-tabelle.xlsx'));
  await ackAll(page);
  await exportWithAck(page, 'xlsx');
  const after1 = await page.textContent('.after');
  check('Hinweis nach dem Speichern im Kasten „Danach“ (du-Form, Excel)', after1.includes('Lade die Datei direkt hoch. Wenn du sie vorher in Excel öffnest und speicherst, trägt Excel deinen Namen wieder ein.'), after1.trim().slice(0, 140));
  await ctx.close();
}
// ---------- Firmenname aus den Dateiangaben im sichtbaren Text (kurse.docx, Entscheidung A) ----------
log('');
log('## Firmenname aus den Dateiangaben im sichtbaren Text (kurse.docx)');
{
  const { page, ctx } = await newPage();
  await loadFile(page, path.join(fx, 'kurse.docx'));
  await ackAll(page);
  const { status } = await exportOnce(page, 'docx');
  const box = await page.textContent('#leaks');
  const items = await page.$$eval('#leaks li', (els) => els.map((e) => e.textContent));
  check('Schlusscheck blockiert wegen des Firmennamens', /blockiert/.test(status) && items.length > 0 && items.every((t) => t.includes('Familienzentrum Sonnenblume')), items.length + ' Fund(e)');
  check('Meldung nennt den Ort in einfacher Sprache („Kopfzeile“)', items.every((t) => /steht in: Kopfzeile/.test(t)), items[0] || '');
  check('Meldung nennt beide Wege: als Namen übernehmen oder bewusst stehen lassen', /als Namen übernehmen/.test(box) && /bewusst stehen lassen/.test(box));
  await page.click('#leaks button');
  const after = await page.evaluate(async () => { const o = await window.__anon.buildOutput('docx'); return (await window.__anon.finalCheck(o)).length; });
  check('Knopf in der Meldung übernimmt den Firmennamen, danach Schlusscheck ohne Fund', after === 0);
  await ctx.close();
}
for (const mode of ['person', 'name', 'reversible']) {
  const { page, ctx } = await newPage();
  await loadFile(page, path.join(fx, 'kurse.docx'), mode);
  if (await page.isHidden('#advanced')) await page.click('#tgl-adv'); // Eigene Namen liegen unter „Erweitert“
  await page.fill('#name-input', 'Familienzentrum Sonnenblume');
  await page.click('#name-add button');
  const r = await page.evaluate(async () => { const o = await window.__anon.buildOutput('docx'); return { n: (await window.__anon.finalCheck(o)).length, b: Array.from(o.bytes) }; });
  const z = await JSZip.loadAsync(Buffer.from(r.b));
  const hdr = await z.file('word/header1.xml').async('string');
  check(`Firmenname in der Liste „Eigene Namen“ (${mode}): in Kopfzeile und Alt-Text ersetzt, Schlusscheck still`, r.n === 0 && !hdr.includes('Sonnenblume'), (hdr.match(/<w:t[^>]*>[^<]*<\/w:t>/g) || []).join('') + ' · ' + ((hdr.match(/descr="[^"]*"/) || [''])[0]));
  await ctx.close();
}

await browser.close();

const failed = checks.filter((c) => !c[1]);
log('');
log(`Prüfungen: ${checks.length - failed.length} von ${checks.length} bestanden${failed.length ? ' – FEHLER: ' + failed.map((c) => c[0]).join('; ') : ''}.`);
const external = requests.filter((u) => !/^(file|blob|data):/.test(u));
log(`Netzwerkanfragen außer lokalen Dateien: ${external.length}.`);
fs.writeFileSync(path.join(here, 'META-REPORT.md'), report.join('\n') + '\n');
process.exit(failed.length ? 1 : 0);
