// Version 2.7.0 (PR A „Webadressen, Konten und Sperre“): Ziel-Test mit dem Anmeldeformular „anmeldung“ (txt, csv, docx,
// xlsx, pdf), Gegenprobe „sachtext“, Sperre Punkt 1 und 2, Warnpunkt „Hier könnte eine Einrichtung stehen“, Rückbau
// (streng, locker umgeschrieben, Schlüsseldatei aus 2.6.1). Gestuft: Schulname, Träger und GYMTH bleiben nach PR A noch im
// Klartext; sie stehen als erwartete offene Punkte („kommt mit PR B/C“) im Bericht, nicht als bestanden.
// Aufruf: node tests/traeger-test.mjs [index.html der Version 2.6.1]   (Ergebnis: tests/TRAEGER-REPORT.md)
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import JSZip from 'jszip';
import { makeAll, FXT, MUST_STAY, ACCOUNT, NURWEB } from './make-traeger.mjs';
import { startAnon, loadIn, goTo, waitCheck, exportOnce, exportWithAck, saveKey, rbConfirm, savePoints, ackPoints } from './ui-helpers.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const HTML = path.join(root, 'index.html');
const OLD = process.argv[2] ? path.resolve(process.argv[2]) : null;
const FXALT = path.join(here, 'fixtures-traeger-alt'); // Ausgabe + Schlüsseldatei aus Version 2.6.1 (fest im Repo)
const outDir = path.join(here, 'out', 'traeger'); // tests/out/ ist von git ausgenommen
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });
let pwMod;
try { pwMod = createRequire(import.meta.url)('playwright'); } catch { pwMod = createRequire('/opt/node22/lib/node_modules/')('playwright'); }
await makeAll();

const report = [];
const log = (s = '') => { report.push(s); console.log(s); };
const results = [];
function check(name, ok, detail = '') { results.push([name, ok]); log(`- ${ok ? 'OK' : 'FEHLER'}: ${name}${detail ? ' – ' + detail : ''}`); }
const requests = [];
const errors = [];
const browser = await pwMod.chromium.launch();
let seq = 0;
async function newPage(html = HTML) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true });
  const page = await ctx.newPage();
  page.on('request', (r) => { if (!/^(file|blob|data):/.test(r.url())) requests.push(r.url()); });
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('dialog', (d) => d.accept());
  await page.goto('file://' + html);
  return { page, ctx };
}
const FORMATS = ['txt', 'csv', 'docx', 'xlsx', 'pdf'];
const MODES = ['person', 'name', 'reversible'];
const OUTF = { txt: ['txt'], csv: ['csv'], docx: ['docx'], xlsx: ['xlsx'], pdf: ['txt', 'docx'] };
const HOST = 'lern-und-spiel-tannhofen';
const OPEN = ['Tannhofen', 'Brandner', 'lern und spiel', 'GYMTH']; // kommt mit PR B/C
const WARN_MUST = ['Gymnasium Tannhofen', 'Gymnasium Kirchberg Tannhofen', '„Brandner lern und spiel“'];
const unxml = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
const count = (t, w) => t.split(w).length - 1;
async function allText(v) {
  if (typeof v === 'string') return v;
  const z = await JSZip.loadAsync(Buffer.from(v));
  let t = '';
  for (const n of Object.keys(z.files).sort()) if (/\.(xml|rels)$/.test(n)) t += '\n' + unxml(await z.file(n).async('string'));
  return t;
}

// ---------- 1. Ziel-Test je Format und Modus (ohne jede Antwort) ----------
async function measure(html, ext, mode) {
  const { page, ctx } = await newPage(html);
  const res = await page.evaluate(async ([arr, nm, md, F]) => {
    const A = window.__anon;
    A.app.state.settings.mode = md;
    await A.openBytes(new Uint8Array(arr), nm);
    const o = {};
    for (const f of F) { const x = await A.buildOutput(f); o[f] = x.zip ? Array.from(x.bytes) : x.text; }
    const pts = A.savePoints ? A.savePoints() : [];
    const warn = pts.find((p) => /^einr:/.test(p.id));
    return { o, warn: warn ? warn.items.map((i) => i.text) : null, q: A.questions().length };
  }, [[...fs.readFileSync(path.join(FXT, 'anmeldung.' + ext))], 'anmeldung.' + ext, mode, OUTF[ext]]);
  await ctx.close();
  const rows = [];
  for (const [f, v] of Object.entries(res.o)) {
    const t = await allText(v);
    rows.push({ f, web: count(t.toLowerCase(), HOST), acc: count(t, ACCOUNT), open: OPEN.map((w) => count(t, w)), stay: MUST_STAY.filter((w) => t.includes(w)).length, warn: res.warn, q: res.q });
  }
  return rows;
}
log('# Ziel-Test Version 2.7.0, PR A „Webadressen, Konten und Sperre“');
log('');
log('Testdatei „anmeldung“ (tests/make-traeger.mjs), alle Namen erfunden. Word: Verknüpfung als Feldfunktion HYPERLINK (Ziel mit Pfad) und als Verknüpfung mit Link-Hinweis; Excel: Verknüpfung mit Link-Hinweis in B5. PDF über LibreOffice aus der Word-Fassung.');
log('');
log('## 1. Soll / gemessen je Format und Modus (ohne jede Antwort)');
log('');
log('Soll: 0 Webadresse (auch Link-Ziel, Feldfunktion, Link-Hinweis), 0 Kontoname, alle 10 Wörter „bleiben stehen“, Warnpunkt nennt die drei Stellen. Offen (kommt mit PR B/C): Vorkommen von ' + OPEN.map((w) => '„' + w + '“').join(', ') + '.');
log('');
log(`| Format | Modus | Ausgabe | Webadresse 2.7.0${OLD ? ' (2.6.1)' : ''} | Konto 2.7.0${OLD ? ' (2.6.1)' : ''} | bleiben stehen | Warnpunkt nennt die drei | offen, kommt mit PR B/C${OLD ? ' (2.6.1)' : ''} |`);
log('|---|---|---|---|---|---|---|---|');
const openTotals = {};
for (const ext of FORMATS) for (const mode of MODES) {
  const now = await measure(HTML, ext, mode);
  const old = OLD ? await measure(OLD, ext, mode) : null;
  now.forEach((r, i) => {
    const o = old ? old[i] : null;
    const warnOk = r.warn && WARN_MUST.every((w) => r.warn.some((x) => x.includes(w)));
    const openN = r.open.reduce((a, b) => a + b, 0);
    openTotals[ext + '/' + r.f] = openN;
    log(`| ${ext} | ${mode} | .${r.f} | ${r.web}${o ? ` (${o.web})` : ''} | ${r.acc}${o ? ` (${o.acc})` : ''} | ${r.stay}/${MUST_STAY.length} | ${warnOk ? 'ja' : 'NEIN'} | ${openN} (${OPEN.map((w, k) => w + ' ' + r.open[k]).join(', ')})${o ? ` (${o.open.reduce((a, b) => a + b, 0)})` : ''} |`);
    check(`${ext}/${mode}/.${r.f}: 0 Webadresse, 0 Konto, alles Stehende da, Warnpunkt vollständig`, r.web === 0 && r.acc === 0 && r.stay === MUST_STAY.length && warnOk);
  });
}
log('');
log('Erwartete offene Punkte nach PR A (NICHT bestanden, kommt mit PR B/C), Zahl der Vorkommen in der Ausgabe je Format: ' + Object.entries(openTotals).filter(([k]) => /\/(txt|csv|docx|xlsx)$/.test(k)).map(([k, v]) => `${k} ${v}`).join(', ') + '.');
log('');

// ---------- 2. Sperre ----------
log('## 2. Sperre beim Speichern');
log('');
async function openUI(file, mode = 'person', { webOff = false } = {}) {
  const pg = await newPage();
  await startAnon(pg.page, mode);
  if (webOff) {
    if (await pg.page.isHidden('#opt-web')) await pg.page.click('#tgl-adv');
    await pg.page.uncheck('#opt-web');
  }
  await loadIn(pg.page, file);
  await goTo(pg.page, 'a2');
  return pg;
}
async function answerAllNo(page) {
  let n = 0;
  for (let i = 0; i < 40; i++) { const b = await page.$('#q-no'); if (!b || !(await b.isVisible())) break; await b.click(); n++; }
  return n;
}
const P1 = 'In dieser Datei wird nichts ersetzt. Bitte prüfe Schulname, Firma, Webadresse und Konto und markiere sie von Hand.';
{
  const { page, ctx } = await openUI(path.join(FXT, 'anmeldung.txt'), 'person', { webOff: true });
  const nNo = await answerAllNo(page);
  await goTo(page, 'a3');
  await waitCheck(page);
  const pts = await savePoints(page);
  const on = await page.evaluate(() => window.__anon.app.result.hits.filter((x) => x.on).length);
  log(`anmeldung.txt, Schalter „Webadressen und Konten“ aus, ${nNo} Fragen mit „Nein“ beantwortet, danach ${on} Stellen ersetzt. Punkte:`);
  for (const p of pts) log(`  - ${p}`);
  check('Punkt 2 erscheint (Webadresse oder Konto steht noch im Text)', pts.some((p) => /Webadressen oder Konten stehen noch im Text/.test(p)));
  check(`Punkt 1 erscheint genau dann, wenn gar nichts ersetzt wird (${on} ersetzt)`, pts.some((p) => p.includes(P1)) === (on === 0));
  const first = await exportOnce(page, 'txt');
  check('Speichern ohne Häkchen gesperrt', !first.dl, first.status);
  const second = await exportWithAck(page, 'txt');
  check('Speichern nach dem einen Häkchen möglich', !!second.dl, second.status);
  if (second.dl) { const t = fs.readFileSync(await second.dl.path(), 'utf8'); check('Schalter aus: Webadresse bleibt in der Ausgabe (so gewollt)', t.includes(HOST)); }
  await ctx.close();
}
{
  fs.writeFileSync(path.join(outDir, 'nurweb.txt'), NURWEB.join('\n') + '\n');
  const { page, ctx } = await openUI(path.join(FXT, 'nurweb.txt'), 'person', { webOff: true });
  await goTo(page, 'a3');
  await waitCheck(page);
  const pts = await savePoints(page);
  log('nurweb.txt (nur Webadresse und Konto), Schalter aus. Punkte:');
  for (const p of pts) log(`  - ${p}`);
  check('Gar nichts ersetzt: Punkt 1 und Punkt 2 erscheinen', pts.some((p) => p.includes(P1)) && pts.some((p) => /Webadressen oder Konten stehen noch im Text/.test(p)));
  const items = await page.$$eval('#points .plist li', (l) => l.map((x) => x.innerText.replace(/\s+/g, ' ').trim()));
  check('Punkt 2 nennt jede Stelle mit Fundort und „Im Text zeigen“', items.some((x) => /www\.beispiel-kinderhaus\.de\/termine.*Zeile 1.*Im Text zeigen/.test(x)) && items.some((x) => /@sonnenhof_kids.*Zeile 2.*Im Text zeigen/.test(x)), items.join(' | '));
  await page.click('#points .plist li button');
  check('„Im Text zeigen“ führt zum Prüfen-Schritt', (await page.evaluate(() => window.__anon.app.screen)) === 'a2');
  await goTo(page, 'a3');
  await waitCheck(page);
  await page.click('#points li:has-text("Webadressen oder Konten") .pact button');
  await waitCheck(page);
  const pts2 = await savePoints(page);
  check('„Ersetzen“ schaltet den Schalter ein: Punkt 1 und Punkt 2 verschwinden', !pts2.some((p) => p.includes(P1)) && !pts2.some((p) => /Webadressen oder Konten/.test(p)) && await page.evaluate(() => window.__anon.app.state.settings.web), pts2.join(' | ') || 'keine Punkte');
  await ctx.close();
}
log('');

// ---------- 3. Warnpunkt ----------
log('## 3. Warnpunkt „Hier könnte eine Einrichtung stehen“');
log('');
{
  const { page, ctx } = await openUI(path.join(FXT, 'anmeldung.txt'), 'person');
  const before = await page.evaluate(async () => (await window.__anon.buildOutput('txt')).text);
  await goTo(page, 'a3');
  await waitCheck(page);
  const pts = await savePoints(page);
  const warn = pts.find((p) => p.startsWith('Hier könnte eine Einrichtung stehen.'));
  log('anmeldung.txt: ' + (warn || '(kein Warnpunkt)'));
  check('Warnpunkt erscheint mit dem Text aus dem Auftrag', !!warn && warn.includes('Das Tool ersetzt Einrichtungen noch nicht selbst. Bitte prüfen und bei Bedarf als Einrichtung markieren.'));
  check('Warnpunkt nennt „Gymnasium Tannhofen“, „Gymnasium Kirchberg Tannhofen“, „Brandner lern und spiel“', !!warn && WARN_MUST.every((w) => warn.includes(w)));
  check('Warnpunkt ohne Frage, ohne Ersetzen-Knopf (nur „Im Text zeigen“)', await page.$$eval('#points > li', (l) => { const li = l.find((x) => x.innerText.startsWith('Hier könnte')); return !!li && [...li.querySelectorAll('button')].every((b) => b.textContent === 'Im Text zeigen'); }));
  const after = await page.evaluate(async () => (await window.__anon.buildOutput('txt')).text);
  check('Warnpunkt ändert die Ausgabe nicht (vor und nach dem Speichern-Schritt gleich)', before === after);
  // Stelle von Hand als Einrichtung markiert -> sie fällt weg
  await page.evaluate(() => window.__anon.addOrg('Gymnasium Tannhofen'));
  await goTo(page, 'a3');
  await waitCheck(page);
  const warn2 = (await savePoints(page)).find((p) => p.startsWith('Hier könnte'));
  check('Nach „als Einrichtung markiert“ fällt „Gymnasium Tannhofen“ weg, die übrigen bleiben', !!warn2 && !/„Gymnasium Tannhofen“/.test(warn2) && warn2.includes('Gymnasium Kirchberg Tannhofen'), warn2);
  // Ein Häkchen: Speichern erst danach
  const first = await exportOnce(page, 'txt');
  check('Warnpunkt läuft über das eine Häkchen (ohne Häkchen gesperrt)', !first.dl, first.status);
  await ctx.close();
}
{
  // höchstens zehn Stellen, dann „und n weitere“
  const lines = Array.from({ length: 12 }, (_, i) => `Zeile ${i + 1}: Wir besuchen die Grundschule ${['Am', 'Bei', 'Nord', 'Süd', 'Ost', 'Weiher', 'Mitte', 'Lindenau', 'Rosenhof', 'Eichwald', 'Birkach', 'Ahornweg'][i]}.`);
  fs.writeFileSync(path.join(outDir, 'zwoelf.txt'), lines.join('\n') + '\n');
  const { page, ctx } = await openUI(path.join(outDir, 'zwoelf.txt'), 'person');
  await goTo(page, 'a3');
  await waitCheck(page);
  const items = await page.$$eval('#points .plist li', (l) => l.map((x) => x.innerText.replace(/\s+/g, ' ').trim()));
  check('Höchstens zehn Stellen, dann „und 2 weitere“', items.length === 11 && items[10] === 'und 2 weitere', items.length + ' Zeilen: ' + items.join(' | '));
  await ctx.close();
}
{
  // Gegenprobe sachtext
  const { page, ctx } = await openUI(path.join(FXT, 'sachtext.txt'), 'person');
  const r = await page.evaluate(() => { const A = window.__anon; return { web: A.app.result.hits.filter((x) => x.type === 'web').length, acc: A.app.result.hits.filter((x) => x.type === 'account').length }; });
  await goTo(page, 'a3');
  await waitCheck(page);
  const items = await page.$$eval('#points li', (l) => { const li = l.find((x) => x.innerText.startsWith('Hier könnte')); return li ? [...li.querySelectorAll('.plist li')].map((x) => x.innerText.replace(/\s+/g, ' ').trim()) : []; });
  log(`Gegenprobe sachtext.txt: ${r.web} Webadressen, ${r.acc} Konten, ${items.length} Stellen im Warnpunkt${items.length ? ': ' + items.join(' | ') : ''}.`);
  check('sachtext: 0 Webadressen, 0 Konten', r.web === 0 && r.acc === 0);
  await ctx.close();
}
log('');

// ---------- 4. Rückbau ----------
log('## 4. Rückbau (Modus rückbaufähig)');
log('');
// Vergleich: Text (txt/csv) exakt; Word/Excel: alle Texte, Link-Ziele, Link-Hinweise, Feldfunktionen je Teil
async function content(bytes, kind) {
  if (kind === 'txt' || kind === 'csv') return bytes.toString('utf8').replace(/^﻿/, '');
  const z = await JSZip.loadAsync(bytes);
  const out = [];
  for (const n of Object.keys(z.files).sort()) {
    if (!/\.(xml|rels)$/.test(n) || /^docProps\//.test(n)) continue;
    const x = await z.file(n).async('string');
    const parts = [];
    for (const m of x.matchAll(/<(?:w:t|t|w:instrText)(?:\s[^>]*)?>([^<]*)<\//g)) parts.push(unxml(m[1]));
    for (const m of x.matchAll(/<Relationship\b[^>]*>/g)) if (/TargetMode="External"/.test(m[0])) parts.push('ZIEL ' + unxml(m[0].match(/Target="([^"]*)"/)[1]));
    for (const m of x.matchAll(/\stooltip="([^"]*)"/g)) parts.push('HINWEIS ' + unxml(m[1]));
    if (parts.length) out.push(n + ': ' + parts.join(' ¦ '));
  }
  return out.join('\n');
}
async function anonymize(ext, file = path.join(FXT, 'anmeldung.' + ext)) {
  const { page, ctx } = await openUI(file, 'reversible');
  await goTo(page, 'a3');
  await ackPoints(page); // rückbaufähig: erst die Schlüsseldatei, dann die Datei
  const kd = await saveKey(page);
  const keyPath = path.join(outDir, `a${++seq}-${kd.suggestedFilename()}`);
  await kd.saveAs(keyPath);
  const r = await exportWithAck(page, ext);
  const outPath = path.join(outDir, `a${seq}-${r.dl.suggestedFilename()}`);
  await r.dl.saveAs(outPath);
  await ctx.close();
  return { outPath, keyPath, name: r.dl.suggestedFilename() };
}
async function restore(file, key) {
  const { page, ctx } = await newPage();
  await page.click('#go-restore');
  await page.setInputFiles('#rb-file', file);
  await page.waitForFunction(() => document.querySelector('#rb-file-status').textContent);
  await page.setInputFiles('#rb-key', key);
  await page.waitForFunction(() => document.querySelector('#rb-key-status').textContent);
  await page.click('#rb-btn-check');
  const plan = await page.evaluate(() => { const p = window.__anon.rb.plan; return { verdict: p.verdict, rows: p.rows.map((r) => `${r.platzhalter}: ${r.gefunden}/${r.erwartet}`), issues: p.issues.map((x) => ({ text: x.text.trim(), vermutlich: x.vermutlich })) }; });
  await rbConfirm(page, true);
  let bytes = null;
  if (!(await page.$eval('#r2-next', (b) => b.disabled))) {
    await page.click('#r2-next');
    if (await page.$('#rb-left-ack')) await page.check('#rb-left-ack').catch(() => {});
    const dlP = page.waitForEvent('download', { timeout: 60000 }).catch(() => null);
    await page.click('#rb-btn-save');
    const dl = await dlP;
    if (dl) { const p = path.join(outDir, `r${++seq}-${dl.suggestedFilename()}`); await dl.saveAs(p); bytes = fs.readFileSync(p); }
  }
  await ctx.close();
  return { bytes, plan };
}
// „KI“ schreibt die neuen Platzhalter locker um: [WEBADRESSE-1] -> [Webadresse 1], [KONTO-1] -> Konto-1 (nur sichtbarer Text)
const loosen = (s) => s.replace(/\[WEBADRESSE-(\d+)\]/g, '[Webadresse $1]').replace(/\[KONTO-(\d+)\]/g, 'Konto-$1');
async function loosenFile(p, ext) {
  const q = p.replace(/(\.\w+)$/, '-locker$1');
  if (ext === 'txt' || ext === 'csv') { fs.writeFileSync(q, loosen(fs.readFileSync(p, 'utf8'))); return q; }
  const z = await JSZip.loadAsync(fs.readFileSync(p));
  for (const n of Object.keys(z.files)) {
    if (!/(document|sharedStrings)\.xml$/.test(n)) continue;
    z.file(n, (await z.file(n).async('string')).replace(/(<(?:w:t|t)(?:\s[^>]*)?>)([^<]*)(<\/)/g, (m, a, b, c) => a + loosen(b) + c));
  }
  fs.writeFileSync(q, await z.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }));
  return q;
}
async function fixFile(p, ext, pairs) {
  const q = p.replace(/-locker(\.\w+)$/, '-korrigiert$1');
  const fix = (t) => pairs.reduce((a, [f, r]) => a.split(f).join(r), t);
  if (ext === 'txt' || ext === 'csv') { fs.writeFileSync(q, fix(fs.readFileSync(p, 'utf8'))); return q; }
  const z = await JSZip.loadAsync(fs.readFileSync(p));
  for (const n of Object.keys(z.files)) if (/(document|sharedStrings)\.xml$/.test(n)) z.file(n, fix(await z.file(n).async('string')));
  fs.writeFileSync(q, await z.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }));
  return q;
}
for (const ext of ['txt', 'csv', 'docx', 'xlsx']) {
  const orig = await content(fs.readFileSync(path.join(FXT, 'anmeldung.' + ext)), ext);
  const a = await anonymize(ext);
  const outText = await content(fs.readFileSync(a.outPath), ext);
  const key = JSON.parse(fs.readFileSync(a.keyPath, 'utf8').replace(/^﻿/, ''));
  const webKeys = key.platzhalter.filter((e) => /^\[(WEBADRESSE|KONTO)-\d+\]$/.test(e.platzhalter)).map((e) => `${e.platzhalter} = ${e.wert} (${e.anzahl})`);
  log(`${ext}: Schlüssel mit ${key.platzhalter.length} Platzhaltern, davon Webadresse/Konto: ${webKeys.join('; ')}`);
  check(`${ext}: Ausgabe ohne Webadresse und Konto (auch Link-Ziel, Feldfunktion, Link-Hinweis)`, !outText.toLowerCase().includes(HOST) && !outText.includes(ACCOUNT));
  const r1 = await restore(a.outPath, a.keyPath);
  check(`${ext}: Rückbau exakt (Texte, Link-Ziele, Feldfunktionen, Link-Hinweise)`, !!r1.bytes && (await content(r1.bytes, ext)) === orig, r1.plan.verdict);
  const loose = await loosenFile(a.outPath, ext);
  const looseText = await content(fs.readFileSync(loose), ext);
  // Muster der vorhandenen Rückbau-Tests (roundtrip.mjs): lockere Formen werden erkannt und mit „gemeint vermutlich“
  // gemeldet, aber nicht geraten; nach der Korrektur wie vorgeschlagen ist der Rückbau exakt
  const r2 = await restore(loose, a.keyPath);
  const want = [...new Set([...looseText.matchAll(/\[Webadresse (\d+)\]|Konto-(\d+)/g)].map((m) => m[0]))];
  const rep = want.map((w) => r2.plan.issues.find((x) => x.text === w));
  check(`${ext}: lockere Formen erkannt und gemeldet (${want.join(', ')})`, want.length >= 2 && rep.every((x, i) => x && x.vermutlich === (want[i].startsWith('[') ? `[WEBADRESSE-${want[i].match(/\d+/)[0]}]` : `[KONTO-${want[i].match(/\d+/)[0]}]`)),
    rep.map((x, i) => `${want[i]} → ${x ? x.vermutlich : 'nicht gemeldet'}`).join('; '));
  const r2t = r2.bytes ? await content(r2.bytes, ext) : '';
  check(`${ext}: lockere Formen nicht geraten (bleiben im Ergebnis stehen, alles andere zurück)`, want.every((w) => r2t.includes(w)) && !r2t.includes('[WEBADRESSE-') && !r2t.includes('[KONTO-'));
  const fixed = await fixFile(loose, ext, rep.map((x, i) => [want[i], x ? x.vermutlich : want[i]]));
  const r3 = await restore(fixed, a.keyPath);
  check(`${ext}: nach Korrektur wie vorgeschlagen Rückbau exakt`, !!r3.bytes && (await content(r3.bytes, ext)) === orig, r3.plan.verdict);
}
// Kollisions-Schutz: steht „[WEBADRESSE-1]“ oder „[KONTO]“ schon im Original, vergibt das Tool die nächste freie Nummer
{
  const f = path.join(outDir, 'kollision.txt');
  fs.writeFileSync(f, 'Vorlage: [WEBADRESSE-1] und [KONTO] bleiben so stehen.\nSeite: www.kita-sonnenblume.de, Instagram: @kita_sonnenblume\n');
  const a = await anonymize('txt', f);
  const out = fs.readFileSync(a.outPath, 'utf8');
  log('Kollision: ' + out.replace(/^\uFEFF/, '').trim().replace(/\n/g, ' ⏎ '));
  check('Kollision: Original-„[WEBADRESSE-1]“ bleibt, die echte Webadresse bekommt [WEBADRESSE-2]', out.includes('Vorlage: [WEBADRESSE-1] und [KONTO]') && out.includes('Seite: [WEBADRESSE-2]') && out.includes('Instagram: [KONTO-1]'));
  const r = await restore(a.outPath, a.keyPath);
  check('Kollision: Rückbau exakt', !!r.bytes && r.bytes.toString('utf8').replace(/^\uFEFF/, '') === fs.readFileSync(f, 'utf8'), r.plan.verdict);
}
// Schlüsseldatei aus Version 2.6.1 (fest im Repo, ohne die neuen Arten)
// je Unterordner (txt, docx): anonymisierte Datei und Schlüsseldatei unter ihren Originalnamen (Kennung im Dateinamen)
for (const ext of fs.existsSync(FXALT) ? fs.readdirSync(FXALT).sort() : []) {
  const dir = path.join(FXALT, ext);
  const f = fs.readdirSync(dir).find((x) => !/\.json$/.test(x));
  const keyF = fs.readdirSync(dir).find((x) => /\.json$/.test(x));
  const r = await restore(path.join(dir, f), path.join(dir, keyF));
  check(`Schlüsseldatei aus 2.6.1 (${ext}): Rückbau exakt`, !!r.bytes && (await content(r.bytes, ext)) === await content(fs.readFileSync(path.join(FXT, 'anmeldung.' + ext)), ext), r.plan.verdict);
}
log('');

// ---------- Netz, Fehler, Summe ----------
check('0 Anfragen ins Netz', requests.length === 0, requests.slice(0, 3).join(', '));
check('0 Fehler in der Seite', errors.length === 0, errors.slice(0, 3).join(' | '));
await browser.close();
const ok = results.filter((r) => r[1]).length;
log('');
log(`**Ergebnis: ${ok}/${results.length} bestanden.** Nur Chromium, Firefox prüft Easy.`);
fs.writeFileSync(path.join(here, 'TRAEGER-REPORT.md'), report.join('\n') + '\n');
process.exit(ok === results.length ? 0 : 1);
