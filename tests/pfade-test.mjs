// Teile an ungewöhnlicher Stelle und Schlusscheck nur über Nutzertext (Version 2.4.1).
// 1. Phase-0-Datei (Aufbau wie openpyxl), vorher (2.4.0) und nachher
// 2. Namen je Teil der entpackten Ausgabe, übliche und ungewöhnliche Pfade, Excel und Word, vorher und nachher
// 3. Kreislauf (rückbaufähig -> Rückbau) für alle neuen Dateien: jeder Abschnitt exakt wie im Original
// 4. Gegenprobe: Namensteile wie Format-Schlüsselwörter (Thi, Val, Bold, Left, Auto, Row)
// 5. Sicherheitsbeweis: Liste der durchsuchten und übersprungenen Felder; Name absichtlich in jedem durchsuchten Feld
// 6. Doppellauf, Anfragen nach außen, Firefox (wenn startbar)
// Ergebnis: tests/PFADE-REPORT.md. Aufruf: node tests/pfade-test.mjs <index.html-der-Version-2.4.0>
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import JSZip from 'jszip';
import * as esbuild from 'esbuild';
import { startAnon, loadIn, ackAll, goTo, exportWithAck, saveKey, rbConfirm } from './ui-helpers.mjs';
import { XLSX_NAMES, DOCX_NAMES, GEGEN, FX } from './make-pfade.mjs';

const pw = createRequire('/opt/node22/lib/node_modules/')('playwright');
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const newHtml = path.join(root, 'index.html');
const oldHtml = process.argv[2] ? path.resolve(process.argv[2]) : null;
if (!oldHtml) { console.error('Bitte Pfad zur index.html der Version 2.4.0 angeben.'); process.exit(2); }
const outDir = path.join(here, 'out-pfade');
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });
const report = [];
const log = (s = '') => { report.push(s); console.log(s); };
const checks = [];
const check = (name, ok, detail = '') => { checks.push([name, ok]); log(`- ${ok ? 'OK' : 'FEHLER'}: ${name}${detail ? ' – ' + detail : ''}`); };
const requests = [];
let seq = 0;

async function newPage(browser, html) {
  const ctx = await browser.newContext({ acceptDownloads: true });
  const page = await ctx.newPage();
  page.on('request', (r) => requests.push(r.url()));
  page.on('dialog', (d) => d.accept());
  await page.goto(html === 'about:blank' ? html : 'file://' + html);
  return { page, ctx };
}
const ext = (f) => path.extname(f).slice(1);
// Anonymisieren über die Oberfläche. Liefert Ausgabe, Schlüssel, Abschnitte, Treffer, Schlusscheck-Fundstellen
async function anonUI(browser, html, file, mode) {
  const { page, ctx } = await newPage(browser, html);
  await startAnon(page, mode);
  await page.evaluate(() => { document.querySelector('#load-status').textContent = ''; });
  await page.setInputFiles('#file', file);
  await page.waitForFunction(() => /Gelesen|zu groß|nicht|kein|Fehler|Unbekannt|PDF enthält/.test(document.querySelector('#load-status').textContent), null, { timeout: 120000 });
  const status = await page.textContent('#load-status');
  if (!/Gelesen/.test(status)) { await ctx.close(); return { refused: status.trim() }; }
  const info = await page.evaluate(() => {
    const a = window.__anon.app;
    const r = a.result;
    return {
      units: a.doc.units.map((u) => ({ label: u.label, text: u.text })),
      hits: r.hits.filter((h) => h.type === 'person').map((h) => ({ t: r.fullText.slice(h.s, h.e), cert: h.cert, on: h.on })),
    };
  });
  await ackAll(page);
  await goTo(page, 'a3');
  let kp = null;
  if (mode === 'reversible') {
    const kd = await saveKey(page);
    kp = path.join(outDir, `${++seq}-${kd.suggestedFilename()}`);
    await kd.saveAs(kp);
  }
  const r = await exportWithAck(page, ext(file));
  const ap = path.join(outDir, `${++seq}-${path.basename(html, '.html')}-${r.dl.suggestedFilename()}`);
  await r.dl.saveAs(ap);
  await ctx.close();
  return { ap, kp, ...info, blocked: r.blocked ? r.blocked.items : [] };
}
async function restoreUI(browser, html, file, key) {
  const { page, ctx } = await newPage(browser, html);
  await page.click('#go-restore');
  await page.setInputFiles('#rb-file', file);
  await page.waitForFunction(() => document.querySelector('#rb-file-status').textContent);
  await page.setInputFiles('#rb-key', key);
  await page.waitForFunction(() => document.querySelector('#rb-key-status').textContent);
  await page.click('#rb-btn-check');
  const rbi = await rbConfirm(page, true);
  const verdict = await page.evaluate(() => window.__anon.rb.plan.verdict);
  await page.click('#r2-next');
  const dlP = page.waitForEvent('download', { timeout: 20000 }).catch(() => null);
  await page.click('#rb-btn-save');
  let dl = await Promise.race([dlP, page.waitForFunction(() => /blockiert/.test(document.querySelector('#rb-status').textContent), null, { timeout: 20000 }).then(() => null).catch(() => null)]);
  let left = rbi.left || [];
  if (!dl && await page.$('#rb-left input[type=checkbox]')) { // nur bis 2.4.1
    left = await page.$$eval('#rb-left li', (l) => l.map((x) => x.textContent));
    await page.check('#rb-left input[type=checkbox]');
    const p2 = page.waitForEvent('download'); await page.click('#rb-btn-save'); dl = await p2;
  }
  const p = path.join(outDir, `w${++seq}-${dl.suggestedFilename()}`);
  await dl.saveAs(p);
  await ctx.close();
  return { p, verdict, left };
}
// Abschnitte einer Datei mit der neuen Version lesen (für den Kreislauf-Vergleich)
async function unitsOf(browser, bytes, name) {
  const { page, ctx } = await newPage(browser, newHtml);
  const u = await page.evaluate(async ([b, n]) => { await window.__anon.openBytes(new Uint8Array(b), n); return window.__anon.app.doc.units.map((x) => `${x.label}: ${x.text}`); }, [[...bytes], name]);
  await ctx.close();
  return u;
}
// Namen je Teil der entpackten Ausgabe (roher Inhalt, ohne Rücksicht auf Groß-/Kleinschreibung)
async function namesPerPart(file, names) {
  const z = await JSZip.loadAsync(fs.readFileSync(file));
  const res = {};
  for (const n of Object.keys(z.files).filter((x) => !z.files[x].dir).sort()) {
    const s = await z.file(n).async('string');
    // ganzes Wort, ohne Rücksicht auf Groß-/Kleinschreibung („Thi“ ist nicht „thin“)
    const f = names.filter((w) => w.split(/\s+/).some((p) => new RegExp(`(^|[^\\p{L}])${p}(?![\\p{L}])`, 'iu').test(s)));
    if (f.length) res[n] = f;
  }
  return res;
}
const fmtParts = (o) => Object.entries(o).map(([k, v]) => `${k}: ${v.join(', ')}`).join('; ') || 'keine';

const browser = await pw.chromium.launch();
log('# Teile an ungewöhnlicher Stelle, Excel-Kommentare, Schlusscheck nur über Nutzertext (Version 2.4.1): Tests');
log('');
log('Testdokumente: tests/make-pfade.mjs -> tests/fixtures-pfade/ (alles erfunden). Vorher = Version 2.4.0, nachher = diese Version. Alles über die Oberfläche (Chromium).');
log('');

// ---------- 1. Phase 0 ----------
log('## 1. Phase-0-Datei (Aufbau wie openpyxl)');
const P0 = ['Nguyen', 'Thi Lan', 'Tannhäuser', 'Tannhäusers', 'Henrike', 'Jonas Wiesenthal'];
for (const [lbl, html] of [['vorher', oldHtml], ['nachher', newHtml]]) {
  const a = await anonUI(browser, html, path.join(FX, 'pfade-phase0.xlsx'), 'person');
  const comment = a.units.filter((u) => /^Kommentar/.test(u.label));
  const parts = await namesPerPart(a.ap, P0);
  // Version 2.10.0: „TANNHÄUSERS Neffe“ steht in der Spalte „Vorname“ (Behandlung „Name“): die ganze Zelle ist EIN Treffer,
  // der „TANNHÄUSERS“ enthält (vorher Treffer genau auf dem Wort). Erwartung unverändert: sicher, an.
  const tann = a.hits.find((h) => h.t === 'TANNHÄUSERS') || a.hits.find((h) => h.t.split(/\s+/).includes('TANNHÄUSERS'));
  log(`- ${lbl}: Kommentar in der Prüfansicht: ${comment.map((u) => `„${u.text}“`).join(', ') || 'fehlt'}; „TANNHÄUSERS“: ${tann ? `${tann.cert}, ${tann.on ? 'an' : 'aus'}` : 'kein Treffer'}; Schlusscheck: ${a.blocked.length ? a.blocked.join(' | ') : 'ohne Fund'}; Namen in der Ausgabe: ${fmtParts(parts)}`);
  if (lbl === 'nachher') {
    check('Phase 0: Kommentar unter xl/comments/comment1.xml erscheint in der Prüfansicht', comment.length === 1 && /Jonas Wiesenthal/.test(comment[0].text));
    check('Phase 0: kein Testname in irgendeinem Teil der entpackten Ausgabe', Object.keys(parts).length === 0, fmtParts(parts));
    check('Phase 0: keine Schlusscheck-Meldung „thin“ (überhaupt keine Meldung)', a.blocked.length === 0, a.blocked.join(' | '));
    check('Phase 0: „TANNHÄUSERS“ sicher, an (Chromium)', !!tann && tann.cert === 'sicher' && tann.on);
  } else {
    check('Phase 0 vorher: Befund 1 (Kommentar fehlt, Name bleibt) und Befund 2 („thin“) nachgestellt', comment.length === 0 && !!parts['xl/comments/comment1.xml'] && a.blocked.some((x) => /^thin/.test(x)));
  }
}
log('');

// ---------- 2. Namen je Teil ----------
log('## 2. Namen je Teil der entpackten Ausgabe (Modus „Person A“)');
const SETS = [
  ['pfade-ueblich.xlsx', XLSX_NAMES], ['pfade-unueblich.xlsx', XLSX_NAMES], ['pfade-hauptteil.xlsx', XLSX_NAMES],
  ['pfade-ueblich.docx', DOCX_NAMES], ['pfade-unueblich.docx', DOCX_NAMES], ['pfade-hauptteil.docx', DOCX_NAMES],
];
const nameList = (N) => [...new Set(Object.values(N).flatMap((v) => v.split(/[\s-]+/)).filter((w) => w.length > 3 && !/^(Kita|Liste)$/.test(w)))];
log('');
log('| Datei | vorher (2.4.0): Namen je Teil | nachher: Namen je Teil | Schlusscheck nachher |');
log('|---|---|---|---|');
const rows = [];
for (const [f, N] of SETS) {
  const names = nameList(N);
  const res = {};
  for (const [lbl, html] of [['vorher', oldHtml], ['nachher', newHtml]]) {
    const a = await anonUI(browser, html, path.join(FX, f), 'person');
    res[lbl] = a.refused ? { refused: a.refused } : { parts: await namesPerPart(a.ap, names), blocked: a.blocked, units: a.units };
  }
  const v = res.vorher.refused ? `Datei abgelehnt („${res.vorher.refused}“)` : fmtParts(res.vorher.parts);
  log(`| ${f} | ${v} | ${fmtParts(res.nachher.parts)} | ${res.nachher.blocked.length ? res.nachher.blocked.join(' / ') : 'ohne Fund'} |`);
  rows.push([f, res]);
}
log('');
for (const [f, res] of rows) {
  check(`${f}: nachher kein Testname in irgendeinem Teil, Schlusscheck ohne Fund`, Object.keys(res.nachher.parts).length === 0 && res.nachher.blocked.length === 0, fmtParts(res.nachher.parts));
  const labels = res.nachher.units.map((u) => u.label);
  if (/xlsx$/.test(f)) check(`${f}: Kommentar, Unterhaltung, Kopfzeile, Textfeld in der Prüfansicht`, ['Kommentar B2', 'Kommentar (Unterhaltung) B3', 'Textfeld/Form'].every((l) => labels.includes(l)) && labels.some((l) => /Kopfzeile/.test(l)));
  else check(`${f}: Kopfzeile, Fußzeile, Fußnote, Endnote, Kommentar in der Prüfansicht`, ['Kopfzeile', 'Fußzeile', 'Fußnote', 'Endnote', 'Kommentar'].every((l) => labels.includes(l)), labels.join(', '));
}
log('');

// ---------- 3. Kreislauf ----------
log('## 3. Kreislauf (rückbaufähig -> Rückbau), jeder Abschnitt exakt wie im Original');
for (const f of ['pfade-phase0.xlsx', 'pfade-ueblich.xlsx', 'pfade-unueblich.xlsx', 'pfade-hauptteil.xlsx', 'pfade-ueblich.docx', 'pfade-unueblich.docx', 'pfade-hauptteil.docx', 'pfade-gegenprobe.xlsx', 'pfade-gegenprobe.docx']) {
  const src = path.join(FX, f);
  const a = await anonUI(browser, newHtml, src, 'reversible');
  const back = await restoreUI(browser, newHtml, a.ap, a.kp);
  const orig = await unitsOf(browser, fs.readFileSync(src), f);
  const got = await unitsOf(browser, fs.readFileSync(back.p), f);
  const anon = await unitsOf(browser, fs.readFileSync(a.ap), f);
  const wrong = orig.map((u, i) => (u !== got[i] ? `„${u}“ → „${got[i]}“` : null)).filter(Boolean);
  const cm = anon.filter((u) => /^Kommentar/.test(u));
  log(`- ${f}: Urteil ${back.verdict}; ${orig.length} Abschnitte, falsch zurückgebaut ${wrong.length}${wrong.length ? ': ' + wrong.join('; ') : ''}${back.left.length ? '; Rest: ' + back.left.join(' | ') : ''}${cm.length ? `; Kommentar anonymisiert: ${cm.map((x) => `„${x}“`).join(', ')}` : ''}`);
  check(`${f}: Kreislauf exakt (auch Kommentare)`, wrong.length === 0 && orig.length === got.length && back.verdict === 'passend' && back.left.length === 0);
}
log('');

// ---------- 4. Gegenprobe ----------
log('## 4. Gegenprobe: Namensteile wie Format-Schlüsselwörter (Thi, Val, Bold, Left, Auto, Row)');
for (const f of ['pfade-gegenprobe.xlsx', 'pfade-gegenprobe.docx']) {
  for (const [lbl, html] of [['vorher', oldHtml], ['nachher', newHtml]]) {
    const a = await anonUI(browser, html, path.join(FX, f), 'person');
    const miss = GEGEN.filter((n) => !a.hits.some((h) => h.t.includes(n) && h.on));
    // Nutzertext der Ausgabe (Abschnitte, mit der neuen Version gelesen): kein Namensteil mehr
    const outUnits = (await unitsOf(browser, fs.readFileSync(a.ap), f)).join('\n');
    const left = GEGEN.flatMap((n) => n.split(' ')).filter((w) => new RegExp(`(^|[^\\p{L}])${w}(?![\\p{L}])`, 'u').test(outUnits));
    log(`- ${f}, ${lbl}: Schlusscheck ${a.blocked.length} Meldung(en)${a.blocked.length ? ': ' + [...new Set(a.blocked.map((x) => x.split(' – ')[0]))].join(', ') : ''}; nicht ersetzt: ${miss.join(', ') || 'keiner'}; Namensteile im Nutzertext der Ausgabe: ${left.join(', ') || 'keine'}`);
    if (lbl === 'nachher') check(`${f}: alle sechs Namen ersetzt, kein Namensteil im Nutzertext, keine Schlusscheck-Meldung aus Formatangaben`, miss.length === 0 && left.length === 0 && a.blocked.length === 0, a.blocked.join(' | '));
  }
}
log('');

// ---------- 5. Sicherheitsbeweis ----------
log('## 5. Sicherheitsbeweis: durchsuchte und übersprungene Felder');
const bundle = await esbuild.build({
  stdin: { contents: "export { default as JSZip } from 'jszip'; export { collectZipTexts } from './src/formats/xmlutil.js'; export { findLeaks } from './src/core/detect.js'; export { fold } from './src/core/fold.js';", resolveDir: root, loader: 'js' },
  bundle: true, format: 'iife', globalName: 'P', write: false, platform: 'browser', logLevel: 'silent',
});
const NS = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture" xmlns:w15="http://schemas.microsoft.com/office/word/2012/wordml"';
const SNS = 'xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"';
const VNS = 'xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office"';
const X = '<?xml version="1.0" encoding="UTF-8"?>';
// [Feld, Teil, XML mit Platzhalter $ für den Namen]
const SEARCHED = [
  ['Word: Text (w:t)', 'word/document.xml', `<w:document ${NS}><w:body><w:p><w:r><w:t>$</w:t></w:r></w:p></w:body></w:document>`],
  ['Word: Feldfunktion (w:instrText)', 'word/document.xml', `<w:document ${NS}><w:body><w:p><w:r><w:instrText> HYPERLINK "mailto:$@example.org" </w:instrText></w:r></w:p></w:body></w:document>`],
  ['Word: Feldfunktion (w:fldSimple w:instr)', 'word/document.xml', `<w:document ${NS}><w:body><w:p><w:fldSimple w:instr=" AUTHOR $ "/></w:p></w:body></w:document>`],
  ['Word: gelöschter Text (w:delText)', 'word/document.xml', `<w:document ${NS}><w:body><w:p><w:del w:id="1" w:author="Autor"><w:r><w:delText>$</w:delText></w:r></w:del></w:p></w:body></w:document>`],
  ['Word: Änderungsautor (w:author)', 'word/document.xml', `<w:document ${NS}><w:body><w:p><w:ins w:id="1" w:author="$"/></w:p></w:body></w:document>`],
  ['Word: Bildbeschreibung (wp:docPr descr)', 'word/document.xml', `<w:document ${NS}><w:body><w:p><w:r><w:drawing><wp:inline><wp:docPr id="1" name="Bild 1" descr="$"/></wp:inline></w:drawing></w:r></w:p></w:body></w:document>`],
  ['Word: Bildtitel (wp:docPr title)', 'word/document.xml', `<w:document ${NS}><w:body><w:p><w:r><w:drawing><wp:inline><wp:docPr id="1" name="Bild 1" title="$"/></wp:inline></w:drawing></w:r></w:p></w:body></w:document>`],
  ['Word: Objektname (wp:docPr name)', 'word/document.xml', `<w:document ${NS}><w:body><w:p><w:r><w:drawing><wp:inline><wp:docPr id="1" name="$"/></wp:inline></w:drawing></w:r></w:p></w:body></w:document>`],
  ['Word: Bildname (pic:cNvPr name)', 'word/document.xml', `<w:document ${NS}><w:body><w:p><w:r><w:drawing><pic:pic><pic:nvPicPr><pic:cNvPr id="0" name="$.jpg"/></pic:nvPicPr></pic:pic></w:drawing></w:r></w:p></w:body></w:document>`],
  ['Word: Inhaltssteuerelement Titel (w:alias)', 'word/document.xml', `<w:document ${NS}><w:body><w:sdt><w:sdtPr><w:alias w:val="$"/></w:sdtPr></w:sdt></w:body></w:document>`],
  ['Word: Inhaltssteuerelement Tag (w:tag)', 'word/document.xml', `<w:document ${NS}><w:body><w:sdt><w:sdtPr><w:tag w:val="$"/></w:sdtPr></w:sdt></w:body></w:document>`],
  ['Word: Auswahlliste (w:listItem displayText)', 'word/document.xml', `<w:document ${NS}><w:body><w:sdt><w:sdtPr><w:dropDownList><w:listItem w:displayText="$" w:value="1"/></w:dropDownList></w:sdtPr></w:sdt></w:body></w:document>`],
  ['Word: Auswahlliste (w:listItem value)', 'word/document.xml', `<w:document ${NS}><w:body><w:sdt><w:sdtPr><w:dropDownList><w:listItem w:displayText="x" w:value="$"/></w:dropDownList></w:sdtPr></w:sdt></w:body></w:document>`],
  ['Word: Textmarke (w:bookmarkStart name)', 'word/document.xml', `<w:document ${NS}><w:body><w:p><w:bookmarkStart w:id="0" w:name="$"/></w:p></w:body></w:document>`],
  ['Word: Link-Hinweis (w:hyperlink tooltip)', 'word/document.xml', `<w:document ${NS}><w:body><w:p><w:hyperlink w:tooltip="$"/></w:p></w:body></w:document>`],
  ['Word: Link auf Textmarke (w:hyperlink anchor)', 'word/document.xml', `<w:document ${NS}><w:body><w:p><w:hyperlink w:anchor="$"/></w:p></w:body></w:document>`],
  ['Word: Formularfeld-Name (w:ffData/w:name)', 'word/document.xml', `<w:document ${NS}><w:body><w:p><w:r><w:fldChar w:fldCharType="begin"><w:ffData><w:name w:val="$"/></w:ffData></w:fldChar></w:r></w:p></w:body></w:document>`],
  ['Word: Formularfeld-Hilfe (w:statusText)', 'word/document.xml', `<w:document ${NS}><w:body><w:p><w:r><w:fldChar w:fldCharType="begin"><w:ffData><w:statusText w:type="text" w:val="$"/></w:ffData></w:fldChar></w:r></w:p></w:body></w:document>`],
  ['Word: Formularfeld-Hilfe (w:helpText)', 'word/document.xml', `<w:document ${NS}><w:body><w:p><w:r><w:fldChar w:fldCharType="begin"><w:ffData><w:helpText w:type="text" w:val="$"/></w:ffData></w:fldChar></w:r></w:p></w:body></w:document>`],
  ['Word: Formularfeld-Vorgabe (w:default)', 'word/document.xml', `<w:document ${NS}><w:body><w:p><w:r><w:fldChar w:fldCharType="begin"><w:ffData><w:textInput><w:default w:val="$"/></w:textInput></w:ffData></w:fldChar></w:r></w:p></w:body></w:document>`],
  ['Word: Formularfeld-Liste (w:listEntry)', 'word/document.xml', `<w:document ${NS}><w:body><w:p><w:r><w:fldChar w:fldCharType="begin"><w:ffData><w:ddList><w:listEntry w:val="$"/></w:ddList></w:ffData></w:fldChar></w:r></w:p></w:body></w:document>`],
  ['Word: Link-Hinweis Bild (a:hlinkClick tooltip)', 'word/document.xml', `<w:document ${NS}><w:body><w:p><w:r><w:drawing><wp:inline><wp:docPr id="1" name="x"><a:hlinkClick r:id="" tooltip="$"/></wp:docPr></wp:inline></w:drawing></w:r></w:p></w:body></w:document>`],
  ['Word: Dokumentvariable (w:docVar name)', 'word/settings.xml', `<w:settings ${NS}><w:docVars><w:docVar w:name="$" w:val="1"/></w:docVars></w:settings>`],
  ['Word: Dokumentvariable (w:docVar val)', 'word/settings.xml', `<w:settings ${NS}><w:docVars><w:docVar w:name="x" w:val="$"/></w:docVars></w:settings>`],
  ['Word: Name einer eigenen Formatvorlage', 'word/styles.xml', `<w:styles ${NS}><w:style w:type="paragraph" w:customStyle="1" w:styleId="X"><w:name w:val="Brief $"/></w:style></w:styles>`],
  ['Word: Text einer Aufzählung (w:lvlText)', 'word/numbering.xml', `<w:numbering ${NS}><w:abstractNum w:abstractNumId="0"><w:lvl w:ilvl="0"><w:lvlText w:val="$ %1"/></w:lvl></w:abstractNum></w:numbering>`],
  ['Word: Kommentar-Autor (w:author)', 'word/comments.xml', `<w:comments ${NS}><w:comment w:id="0" w:author="$" w:initials="X"/></w:comments>`],
  ['Word: Kommentar-Kürzel (w:initials)', 'word/comments.xml', `<w:comments ${NS}><w:comment w:id="0" w:author="x" w:initials="$"/></w:comments>`],
  ['Word: Personenliste (w15:person author)', 'word/people.xml', `<w15:people ${NS}><w15:person w15:author="$"><w15:presenceInfo w15:providerId="None" w15:userId="x"/></w15:person></w15:people>`],
  ['Word: Personenliste (w15:presenceInfo userId)', 'word/people.xml', `<w15:people ${NS}><w15:person w15:author="x"><w15:presenceInfo w15:providerId="AD" w15:userId="S::$@example.org::1"/></w15:person></w15:people>`],
  ['Dateieigenschaft (dc:creator)', 'docProps/core.xml', `<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:creator>$</dc:creator></cp:coreProperties>`],
  ['Dateieigenschaft (Company, Manager)', 'docProps/app.xml', `<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Manager>$</Manager></Properties>`],
  ['Benutzerdefinierte Eigenschaft (Name)', 'docProps/custom.xml', `<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/custom-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><property fmtid="{D5CDD505-2E9C-101B-9397-08002B2CF9AE}" pid="2" name="$"><vt:lpwstr>1</vt:lpwstr></property></Properties>`],
  ['Benutzerdefinierte Eigenschaft (Wert)', 'docProps/custom.xml', `<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/custom-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><property fmtid="{D5CDD505-2E9C-101B-9397-08002B2CF9AE}" pid="2" name="x"><vt:lpwstr>$</vt:lpwstr></property></Properties>`],
  ['SharePoint-/Zusatzdaten: Attribut (unbekannter Aufbau, alles durchsucht)', 'customXml/item1.xml', '<daten xmlns="urn:beispiel"><feld wert="$"/></daten>'],
  ['SharePoint-/Zusatzdaten: Office-Namensraum, Attribut', 'customXml/item2.xml', '<p:properties xmlns:p="http://schemas.microsoft.com/office/2006/metadata/properties"><x anzeige="$"/></p:properties>'],
  ['Unbekannter Teil mit eigenem Namensraum: Attribut', 'word/webextensions/webextension1.xml', '<we:webextension xmlns:we="http://schemas.microsoft.com/office/webextensions/webextension/2010/11"><we:property name="x" value="$"/></we:webextension>'],
  ['Teil, der kein sauberes XML ist (ganzer Inhalt)', 'word/kaputt.xml', '<a><b x="$"></a>'],
  ['Externer Verweis (Target, TargetMode External)', 'word/_rels/document.xml.rels', '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="r1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="file:///C:/Users/$/Akte.docx" TargetMode="External"/></Relationships>'],
  ['Interner Verweis (Target)', 'word/_rels/document.xml.rels', '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="r1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/$.png"/></Relationships>'],
  ['Teilname (PartName in [Content_Types].xml)', '[Content_Types].xml', '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Override PartName="/word/$.xml" ContentType="application/xml"/></Types>'],
  ['VML: Bildtitel (o:title)', 'word/vml1.vml', `<xml ${VNS}><v:shape><v:imagedata o:title="$"/></v:shape></xml>`],
  ['VML: Alternativtext (alt)', 'word/vml1.vml', `<xml ${VNS}><v:shape alt="$"/></xml>`],
  ['VML: WordArt-Text (v:textpath string)', 'word/vml1.vml', `<xml ${VNS}><v:shape><v:textpath string="$"/></v:shape></xml>`],
  ['VML: Link (o:href)', 'word/vml1.vml', `<xml ${VNS}><v:shape o:href="mailto:$@example.org"/></xml>`],
  ['Excel: Zelle (Inline-Text)', 'xl/worksheets/sheet1.xml', `<worksheet ${SNS}><sheetData><row r="1"><c r="A1" t="inlineStr"><is><t>$</t></is></c></row></sheetData></worksheet>`],
  ['Excel: gemeinsamer Text', 'xl/sharedStrings.xml', `<sst ${SNS}><si><t>$</t></si></sst>`],
  ['Excel: Lautschrift (rPh)', 'xl/sharedStrings.xml', `<sst ${SNS}><si><t>x</t><rPh sb="0" eb="1"><t>$</t></rPh></si></sst>`],
  ['Excel: Text in Formel (Zeichenkette)', 'xl/worksheets/sheet1.xml', `<worksheet ${SNS}><sheetData><row r="1"><c r="A1"><f>CONCATENATE("Frau ","$")</f></c></row></sheetData></worksheet>`],
  ['Excel: Blattverweis in Formel', 'xl/worksheets/sheet1.xml', `<worksheet ${SNS}><sheetData><row r="1"><c r="A1"><f>'$'!A1</f></c></row></sheetData></worksheet>`],
  ['Excel: Kopfzeile (ohne Steuercodes)', 'xl/worksheets/sheet1.xml', `<worksheet ${SNS}><headerFooter><oddHeader>&amp;L&amp;"Arial,Fett"$&amp;RSeite &amp;P</oddHeader></headerFooter></worksheet>`],
  ['Excel: Fußzeile erste Seite', 'xl/worksheets/sheet1.xml', `<worksheet ${SNS}><headerFooter><firstFooter>&amp;C$</firstFooter></headerFooter></worksheet>`],
  ['Excel: Link-Ziel im Blatt (hyperlink location)', 'xl/worksheets/sheet1.xml', `<worksheet ${SNS}><hyperlinks><hyperlink ref="A1" location="'$'!A1"/></hyperlinks></worksheet>`],
  ['Excel: Link-Hinweis (hyperlink tooltip)', 'xl/worksheets/sheet1.xml', `<worksheet ${SNS}><hyperlinks><hyperlink ref="A1" tooltip="$"/></hyperlinks></worksheet>`],
  ['Excel: Link-Anzeige (hyperlink display)', 'xl/worksheets/sheet1.xml', `<worksheet ${SNS}><hyperlinks><hyperlink ref="A1" display="$"/></hyperlinks></worksheet>`],
  ['Excel: Gültigkeitsregel Eingabehinweis (prompt)', 'xl/worksheets/sheet1.xml', `<worksheet ${SNS}><dataValidations><dataValidation sqref="A1" prompt="$"/></dataValidations></worksheet>`],
  ['Excel: Gültigkeitsregel Titel (promptTitle)', 'xl/worksheets/sheet1.xml', `<worksheet ${SNS}><dataValidations><dataValidation sqref="A1" promptTitle="$"/></dataValidations></worksheet>`],
  ['Excel: Gültigkeitsregel Fehler (error)', 'xl/worksheets/sheet1.xml', `<worksheet ${SNS}><dataValidations><dataValidation sqref="A1" error="$"/></dataValidations></worksheet>`],
  ['Excel: Gültigkeitsregel Fehlertitel (errorTitle)', 'xl/worksheets/sheet1.xml', `<worksheet ${SNS}><dataValidations><dataValidation sqref="A1" errorTitle="$"/></dataValidations></worksheet>`],
  ['Excel: Gültigkeitsliste (formula1)', 'xl/worksheets/sheet1.xml', `<worksheet ${SNS}><dataValidations><dataValidation sqref="A1" type="list"><formula1>"$,Meier"</formula1></dataValidation></dataValidations></worksheet>`],
  ['Excel: bedingte Formatierung „Text enthält“ (cfRule text)', 'xl/worksheets/sheet1.xml', `<worksheet ${SNS}><conditionalFormatting sqref="A1"><cfRule type="containsText" priority="1" operator="containsText" text="$"/></conditionalFormatting></worksheet>`],
  ['Excel: Filterwert (filter val)', 'xl/worksheets/sheet1.xml', `<worksheet ${SNS}><autoFilter ref="A1:A9"><filterColumn colId="0"><filters><filter val="$"/></filters></filterColumn></autoFilter></worksheet>`],
  ['Excel: benutzerdefinierter Filter (customFilter val)', 'xl/worksheets/sheet1.xml', `<worksheet ${SNS}><autoFilter ref="A1:A9"><filterColumn colId="0"><customFilters><customFilter val="$*"/></customFilters></filterColumn></autoFilter></worksheet>`],
  ['Excel: Blattname (sheet name)', 'xl/workbook.xml', `<workbook ${SNS}><sheets><sheet name="$" sheetId="1"/></sheets></workbook>`],
  ['Excel: definierter Name (name)', 'xl/workbook.xml', `<workbook ${SNS}><definedNames><definedName name="$">Tabelle1!$A$1</definedName></definedNames></workbook>`],
  ['Excel: definierter Name (Kommentar)', 'xl/workbook.xml', `<workbook ${SNS}><definedNames><definedName name="x" comment="$">1</definedName></definedNames></workbook>`],
  ['Excel: definierter Name (Inhalt)', 'xl/workbook.xml', `<workbook ${SNS}><definedNames><definedName name="x">"$"</definedName></definedNames></workbook>`],
  ['Excel: Schreibschutz-Benutzer (fileSharing userName)', 'xl/workbook.xml', `<workbook ${SNS}><fileSharing userName="$"/></workbook>`],
  ['Excel: Kommentar-Autor', 'xl/comments1.xml', `<comments ${SNS}><authors><author>$</author></authors></comments>`],
  ['Excel: Kommentartext', 'xl/comments1.xml', `<comments ${SNS}><commentList><comment ref="A1" authorId="0"><text><t>$</t></text></comment></commentList></comments>`],
  ['Excel: Unterhaltung (threadedComment)', 'xl/threadedComments/threadedComment1.xml', '<ThreadedComments xmlns="http://schemas.microsoft.com/office/spreadsheetml/2018/threadedcomments"><threadedComment ref="A1"><text>$</text></threadedComment></ThreadedComments>'],
  ['Excel: Personenliste (person displayName)', 'xl/persons/person.xml', '<personList xmlns="http://schemas.microsoft.com/office/spreadsheetml/2018/threadedcomments"><person displayName="$" id="{1}" userId="x" providerId="None"/></personList>'],
  ['Excel: Personenliste (person userId)', 'xl/persons/person.xml', '<personList xmlns="http://schemas.microsoft.com/office/spreadsheetml/2018/threadedcomments"><person displayName="x" id="{1}" userId="$@example.org" providerId="AD"/></personList>'],
  ['Excel: Zahlenformat mit Text („"Herr "@“)', 'xl/styles.xml', `<styleSheet ${SNS}><numFmts><numFmt numFmtId="164" formatCode="&quot;$ &quot;@"/></numFmts></styleSheet>`],
  ['Excel: eigene Zellenformatvorlage (cellStyle ohne builtinId)', 'xl/styles.xml', `<styleSheet ${SNS}><cellStyles><cellStyle name="Stil $" xfId="1"/></cellStyles></styleSheet>`],
  ['Excel: eigene Tabellenformatvorlage (tableStyle name)', 'xl/styles.xml', `<styleSheet ${SNS}><tableStyles count="1"><tableStyle name="$" pivot="0"/></tableStyles></styleSheet>`],
  ['Excel: Tabellenname (table name/displayName)', 'xl/tables/table1.xml', `<table ${SNS} id="1" name="$" displayName="x" ref="A1:B2"/>`],
  ['Excel: Tabellenspalte (tableColumn name)', 'xl/tables/table1.xml', `<table ${SNS} id="1" name="x" displayName="x" ref="A1:B2"><tableColumns><tableColumn id="1" name="$"/></tableColumns></table>`],
  ['Excel: Pivot-Feld (cacheField name)', 'xl/pivotCache/pivotCacheDefinition1.xml', `<pivotCacheDefinition ${SNS}><cacheFields><cacheField name="$"/></cacheFields></pivotCacheDefinition>`],
  ['Excel: Pivot-Wert (s v)', 'xl/pivotCache/pivotCacheDefinition1.xml', `<pivotCacheDefinition ${SNS}><cacheFields><cacheField name="x"><sharedItems><s v="$"/></sharedItems></cacheField></cacheFields></pivotCacheDefinition>`],
  ['Excel: Pivot-Quelle (worksheetSource sheet)', 'xl/pivotCache/pivotCacheDefinition1.xml', `<pivotCacheDefinition ${SNS}><cacheSource type="worksheet"><worksheetSource ref="A1:B2" sheet="$"/></cacheSource></pivotCacheDefinition>`],
  ['Excel: Pivot-Tabelle (Name, Element n, Datenfeld)', 'xl/pivotTables/pivotTable1.xml', `<pivotTableDefinition ${SNS} name="x"><pivotFields><pivotField><items><item n="$"/></items></pivotField></pivotFields></pivotTableDefinition>`],
  ['Excel: Verbindung (connection description)', 'xl/connections.xml', `<connections ${SNS}><connection id="1" name="x" description="$"/></connections>`],
  ['Excel: Verbindung (dbPr connection)', 'xl/connections.xml', `<connections ${SNS}><connection id="1" name="x"><dbPr connection="Data Source=C:\\Users\\$\\daten.accdb" command="x"/></connection></connections>`],
  ['Excel: Verbindung (sourceFile, odcFile)', 'xl/connections.xml', `<connections ${SNS}><connection id="1" name="x" odcFile="C:\\Users\\$\\Abfrage.odc"/></connections>`],
  ['Excel: verknüpfte Datei (sheetName val)', 'xl/externalLinks/externalLink1.xml', `<externalLink ${SNS}><externalBook><sheetNames><sheetName val="$"/></sheetNames></externalBook></externalLink>`],
  ['Excel: Textfeld (a:t)', 'xl/drawings/drawing1.xml', '<xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><xdr:sp><xdr:txBody><a:p><a:r><a:t>$</a:t></a:r></a:p></xdr:txBody></xdr:sp></xdr:wsDr>'],
  ['Excel: Bildbeschreibung (cNvPr descr)', 'xl/drawings/drawing1.xml', '<xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing"><xdr:pic><xdr:nvPicPr><xdr:cNvPr id="2" name="Bild 1" descr="$"/></xdr:nvPicPr></xdr:pic></xdr:wsDr>'],
  ['Excel: Diagramm (c:v, c:f)', 'xl/charts/chart1.xml', '<c:chartSpace xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart"><c:tx><c:strRef><c:f>\'$\'!$A$1</c:f></c:strRef></c:tx></c:chartSpace>'],
  ['Excel: Datenschnitt (slicer caption)', 'xl/slicers/slicer1.xml', '<slicers xmlns="http://schemas.microsoft.com/office/spreadsheetml/2009/9/main"><slicer name="x" caption="$"/></slicers>'],
  ['Excel: Abfrage (queryTable name)', 'xl/queryTables/queryTable1.xml', `<queryTable ${SNS} name="$" connectionId="1"/>`],
  ['Excel: Kommentar-Rahmen (VML, Text)', 'xl/drawings/vmlDrawing1.vml', `<xml ${VNS}><v:shape><v:textbox><div>$</div></v:textbox></v:shape></xml>`],
];
// Felder, die NICHT durchsucht werden (Formatangaben), mit Grund
const SKIPPED = [
  ['Excel: Rahmenart (border style)', 'xl/styles.xml', `<styleSheet ${SNS}><borders><border><left style="$"/></border></borders></styleSheet>`, 'Formatangabe (z. B. „thin“), kein Nutzertext'],
  ['Excel: Ausrichtung (alignment horizontal)', 'xl/styles.xml', `<styleSheet ${SNS}><cellXfs><xf><alignment horizontal="$"/></xf></cellXfs></styleSheet>`, 'Formatangabe („left“)'],
  ['Excel: Schriftart (font name val)', 'xl/styles.xml', `<styleSheet ${SNS}><fonts><font><name val="$"/></font></fonts></styleSheet>`, 'Name einer Schriftart („Calibri“), kein Nutzertext'],
  ['Excel: Farbe (color)', 'xl/styles.xml', `<styleSheet ${SNS}><fonts><font><color rgb="$"/></font></fonts></styleSheet>`, 'Formatangabe („auto“, Farbwert)'],
  ['Excel: Formatzeichen im Zahlenformat (außerhalb von "…")', 'xl/styles.xml', `<styleSheet ${SNS}><numFmts><numFmt numFmtId="164" formatCode="$ #,##0"/></numFmts></styleSheet>`, 'Formatzeichen (z. B. „[Red]“, „TT.MM.JJJJ“); Text in Anführungszeichen wird durchsucht'],
  ['Excel: eingebaute Zellenformatvorlage (cellStyle mit builtinId)', 'xl/styles.xml', `<styleSheet ${SNS}><cellStyles><cellStyle name="$" xfId="0" builtinId="0"/></cellStyles></styleSheet>`, 'eingebauter Name („Standard“, „Normal“)'],
  ['Excel: Zellbezug, Typ, Stil (c r/t/s)', 'xl/worksheets/sheet1.xml', `<worksheet ${SNS}><sheetData><row r="1"><c r="A1" t="$" s="1"/></row></sheetData></worksheet>`, 'Aufbauangabe'],
  ['Excel: Seiteneinrichtung (pageSetup orientation)', 'xl/worksheets/sheet1.xml', `<worksheet ${SNS}><pageSetup orientation="$"/></worksheet>`, 'Formatangabe („landscape“)'],
  ['Excel: Blattansicht (pane activePane)', 'xl/worksheets/sheet1.xml', `<worksheet ${SNS}><sheetViews><sheetView><pane activePane="$"/></sheetView></sheetViews></worksheet>`, 'Formatangabe („bottomLeft“)'],
  ['Excel: Funktionsname in Formel', 'xl/worksheets/sheet1.xml', `<worksheet ${SNS}><sheetData><row r="1"><c r="A1"><f>QUENZLERIN(1)</f></c></row></sheetData></worksheet>`, 'Funktionsname („ROW(“, „LEFT(“); Zeichenketten und Blattverweise werden durchsucht'],
  ['Excel: Steuercode Kopfzeile (&"Schrift,Stil")', 'xl/worksheets/sheet1.xml', `<worksheet ${SNS}><headerFooter><oddHeader>&amp;"Arial,$"Text</oddHeader></headerFooter></worksheet>`, 'Steuercode für Schrift („Bold“); der Text der Kopfzeile wird durchsucht'],
  ['Word: Ausrichtung (w:jc)', 'word/document.xml', `<w:document ${NS}><w:body><w:p><w:pPr><w:jc w:val="$"/></w:pPr></w:p></w:body></w:document>`, 'Formatangabe („left“)'],
  ['Word: Farbe (w:color)', 'word/document.xml', `<w:document ${NS}><w:body><w:p><w:r><w:rPr><w:color w:val="$"/></w:rPr></w:r></w:p></w:body></w:document>`, 'Formatangabe („auto“)'],
  ['Word: Schriftart (w:rFonts)', 'word/document.xml', `<w:document ${NS}><w:body><w:p><w:r><w:rPr><w:rFonts w:ascii="$"/></w:rPr></w:r></w:p></w:body></w:document>`, 'Name einer Schriftart'],
  ['Word: Verweis auf Formatvorlage (w:pStyle)', 'word/document.xml', `<w:document ${NS}><w:body><w:p><w:pPr><w:pStyle w:val="$"/></w:pPr></w:p></w:body></w:document>`, 'Kennung der Vorlage; der Name einer eigenen Vorlage steht in styles.xml und wird dort durchsucht'],
  ['Word: Tabellenbreite (w:tblW type)', 'word/document.xml', `<w:document ${NS}><w:body><w:tbl><w:tblPr><w:tblW w:w="0" w:type="$"/></w:tblPr></w:tbl></w:body></w:document>`, 'Formatangabe („auto“)'],
  ['Word: Sprache (w:lang)', 'word/styles.xml', `<w:styles ${NS}><w:docDefaults><w:rPrDefault><w:rPr><w:lang w:val="$"/></w:rPr></w:rPrDefault></w:docDefaults></w:styles>`, 'Sprachkennung („de-DE“)'],
  ['Word: Name einer eingebauten Formatvorlage', 'word/styles.xml', `<w:styles ${NS}><w:style w:type="paragraph" w:styleId="X"><w:name w:val="$"/></w:style></w:styles>`, 'eingebauter Name („heading 1“, „Normal“); eigene Vorlagen (w:customStyle) werden durchsucht'],
  ['Word: Änderungskennungen (w:rsid…)', 'word/document.xml', `<w:document ${NS}><w:body><w:p w:rsidR="$"/></w:body></w:document>`, 'Zufallskennung'],
  ['VML: Form-Stil (style)', 'xl/drawings/vmlDrawing1.vml', `<xml ${VNS}><v:shape style="margin-$:1pt"/></xml>`, 'Formatangabe („margin-left“, „visibility:hidden“)'],
  ['VML: Innenabstand (o:insetmode)', 'xl/drawings/vmlDrawing1.vml', `<xml ${VNS}><v:shape o:insetmode="$"/></xml>`, 'Formatangabe („auto“)'],
  ['Verweistyp (Type)', 'word/_rels/document.xml.rels', '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="r1" Type="http://example.org/$" Target="x.xml"/></Relationships>', 'Kennung des Verweistyps (Adresse eines Standards)'],
  ['Inhaltstyp (ContentType)', '[Content_Types].xml', '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/$"/></Types>', 'Kennung des Dateityps'],
];
const MARK = 'Quenzlerin';
{
  const { page, ctx } = await newPage(browser, 'about:blank');
  await page.addScriptTag({ content: bundle.outputFiles[0].text });
  const res = await page.evaluate(async ([cases, mark, X]) => {
    const forms = new Map([[P.fold(mark), { entity: 'Person A', full: mark }]]);
    const out = [];
    for (const [name, part, xml] of cases) {
      const z = new P.JSZip();
      z.file(part, (part.endsWith('.vml') ? '' : X) + xml.replace('$', mark));
      const texts = await P.collectZipTexts(await P.JSZip.loadAsync(await z.generateAsync({ type: 'uint8array' })), { userText: true });
      const leaks = P.findLeaks(forms, texts);
      out.push([name, part, leaks.length]);
    }
    return out;
  }, [[...SEARCHED, ...SKIPPED.map((x) => x.slice(0, 3))], MARK, X]);
  await ctx.close();
  log('');
  log(`Prüfname „${MARK}“ absichtlich in jedes Feld gesetzt; Suche wie im Schlusscheck (Version 2.4.1).`);
  log('');
  log('### Durchsucht (Name muss gefunden werden)');
  log('| Feld | Teil | gefunden |');
  log('|---|---|---|');
  const sr = res.slice(0, SEARCHED.length);
  for (const [n, p, c] of sr) log(`| ${n} | ${p} | ${c ? 'ja' : '**NEIN**'} |`);
  log('');
  log('### Übersprungen (Formatangaben; Name darf hier nicht gemeldet werden)');
  log('| Feld | Teil | gemeldet | Grund |');
  log('|---|---|---|---|');
  const kr = res.slice(SEARCHED.length);
  kr.forEach(([n, p, c], i) => log(`| ${n} | ${p} | ${c ? '**ja**' : 'nein'} | ${SKIPPED[i][3]} |`));
  log('');
  check(`Sicherheitsbeweis: Prüfname in allen ${sr.length} durchsuchten Feldern gefunden`, sr.every((x) => x[2] > 0), sr.filter((x) => !x[2]).map((x) => x[0]).join(', '));
  check(`Sicherheitsbeweis: in keinem der ${kr.length} übersprungenen Formatfelder gemeldet`, kr.every((x) => x[2] === 0), kr.filter((x) => x[2]).map((x) => x[0]).join(', '));
}
log('');

// ---------- 6. Doppellauf, Anfragen, Firefox ----------
log('## 6. Doppellauf, Anfragen nach außen, Firefox');
for (const f of fs.readdirSync(FX).filter((x) => /\.(docx|xlsx)$/.test(x)).sort()) {
  const run = async () => {
    const { page, ctx } = await newPage(browser, newHtml);
    const out = await page.evaluate(async ([b, n, fm]) => {
      const A = window.__anon;
      A.app.state.settings.mode = 'person';
      await A.openBytes(new Uint8Array(b), n);
      const x = await A.buildOutput(fm);
      return Array.from(x.bytes);
    }, [[...fs.readFileSync(path.join(FX, f))], f, ext(f)]);
    await ctx.close();
    return Buffer.from(out);
  };
  const a = await run();
  const b = await run();
  check(`Doppellauf ${f}: zweimal dieselbe Ausgabe (byte-gleich)`, a.equals(b));
}
await browser.close();
const outside = requests.filter((u) => !/^(file|blob|data|about):/.test(u));
check('0 Anfragen nach außen', outside.length === 0, outside.slice(0, 3).join(', '));
let ff = null;
try { ff = await pw.firefox.launch(); } catch (e) { ff = null; log(`- Firefox: nicht startbar (${String(e.message).split('\n')[0].slice(0, 140)}). Firefox-Läufe ungeprüft.`); }
if (ff) {
  const a = await anonUI(ff, newHtml, path.join(FX, 'pfade-phase0.xlsx'), 'person');
  const tann = a.hits.find((h) => h.t === 'TANNHÄUSERS') || a.hits.find((h) => h.t.split(/\s+/).includes('TANNHÄUSERS'));
  log(`- Firefox, Phase-0-Datei: „TANNHÄUSERS“ ${tann ? `${tann.cert}, ${tann.on ? 'an' : 'aus'}` : 'kein Treffer'}; Namen in der Ausgabe: ${fmtParts(await namesPerPart(a.ap, P0))}`);
  await ff.close();
}

const failed = checks.filter((c) => !c[1]);
log('');
log(`Prüfungen: ${checks.length - failed.length} von ${checks.length} bestanden${failed.length ? ' – FEHLER: ' + failed.map((c) => c[0]).join('; ') : ''}.`);
fs.writeFileSync(path.join(here, 'PFADE-REPORT.md'), report.join('\n') + '\n');
process.exit(failed.length ? 1 : 0);
