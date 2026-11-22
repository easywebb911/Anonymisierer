// Version 2.9.0 „Diese Wörter bleiben stehen“: Testlauf restwoerter.
// 1. Testdatei „reste“ (txt, docx, xlsx; erfunden): Liste genau wie Soll; nach „Name“/„Einrichtung“ je Wort steht keines
//    mehr in der Ausgabe (Modi Person A, Name, rückbaufähig; dazu „Unsichere Treffer“ aus); Rückbau exakt.
// 2. anmeldung.*: Liste enthält GYMTH und OGTS; nach „Einrichtung“ auf GYMTH steht GYMTH 0-mal in der Ausgabe.
// 3. sachtext.txt: höchstens 5 Wörter, jedes benannt.
// 4. Kein stilles Speichern: offene Sammelfrage -> Punkt auf „Speichern“; „Kein Name dabei“ -> Punkt weg; neues Wort ->
//    Frage wieder offen.
// 5. Weg-Gleichheit: übernommen, dann ausgeschaltet = nie übernommen; „bleibt immer stehen“ und zurück = nie.
// Gegenprobe: RESTE_HTML=<index.html von main> muss scheitern.
// Aufruf: node tests/restwoerter-test.mjs   (Ergebnis: tests/RESTWOERTER-REPORT.md)
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import JSZip from 'jszip';
import { FXT as FXT_TRAEGER, makeAll } from './make-traeger.mjs';
import { startAnon, loadIn, goTo, waitCheck, exportWithAck, saveKey, rbConfirm, ackPoints } from './ui-helpers.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const HTML = process.env.RESTE_HTML ? path.resolve(process.env.RESTE_HTML) : path.join(root, 'index.html');
const FX = path.join(here, 'fixtures-reste');
const outDir = path.join(here, 'out', 'restwoerter');
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });
let pwMod;
try { pwMod = createRequire(import.meta.url)('playwright'); } catch { pwMod = createRequire('/opt/node22/lib/node_modules/')('playwright'); }
await makeAll();

// ---------- Testdatei „reste“ (alle Namen erfunden) ----------
export const RESTE = [
  'Herr Bodo Rautenbach kommt.',
  'Frau Gesine Kortlang kommt.',
  'Viele Grüße',
  'Karsten Dobbeling',
  'Frau Okonkwo vom Gymnasium Kirchberg Tannhofen',
  'Herr Dorfner vom Förderverein Lindenblick',
  'Wir freuen uns über unsere Arbeit am GYMTH.',
  'Es kommen Hallmayer und Sonnleitner.',
  'Der Elternabend beginnt um 19 Uhr in der Aula.',
  'Bitte bringen Sie das ausgefüllte Formular mit.',
  'Für Getränke und kleine Speisen ist gesorgt.',
  'Die Anmeldung für die Ferienbetreuung endet am Freitag.',
  'Fragen beantwortet gerne das Sekretariat.',
];
// Soll: Wort -> Knopf
const SOLL = { Rautenbach: 'name', Kortlang: 'name', Dobbeling: 'name', Tannhofen: 'einr', Lindenblick: 'einr', GYMTH: 'einr', Hallmayer: 'name', Sonnleitner: 'name' };
const ZO = { date: new Date(Date.UTC(2026, 0, 1, 12)), createFolders: false };
const X = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const S = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
async function save(name, files) {
  const z = new JSZip();
  for (const [n, c] of Object.entries(files)) z.file(n, c, ZO);
  fs.writeFileSync(path.join(FX, name), await z.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }));
}
async function makeReste() {
  fs.mkdirSync(FX, { recursive: true });
  fs.writeFileSync(path.join(FX, 'reste.txt'), RESTE.join('\r\n') + '\r\n');
  const run = (t) => `<w:r><w:t xml:space="preserve">${esc(t)}</w:t></w:r>`;
  await save('reste.docx', {
    '[Content_Types].xml': X + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>',
    '_rels/.rels': X + `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${R}/officeDocument" Target="word/document.xml"/></Relationships>`,
    'word/document.xml': X + `<w:document xmlns:w="${W}" xmlns:r="${R}"><w:body>${RESTE.map((l) => `<w:p>${run(l)}</w:p>`).join('')}<w:sectPr/></w:body></w:document>`,
  });
  const rows = RESTE.map((l, i) => `<row r="${i + 1}"><c r="A${i + 1}" t="s"><v>${i}</v></c></row>`).join('');
  await save('reste.xlsx', {
    '[Content_Types].xml': X + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/></Types>',
    '_rels/.rels': X + `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${R}/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
    'xl/workbook.xml': X + `<workbook xmlns="${S}" xmlns:r="${R}"><sheets><sheet name="Liste" sheetId="1" r:id="rId1"/></sheets></workbook>`,
    'xl/_rels/workbook.xml.rels': X + `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${R}/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rIdS" Type="${R}/sharedStrings" Target="sharedStrings.xml"/></Relationships>`,
    'xl/worksheets/sheet1.xml': X + `<worksheet xmlns="${S}"><sheetData>${rows}</sheetData></worksheet>`,
    'xl/sharedStrings.xml': X + `<sst xmlns="${S}" count="${RESTE.length}" uniqueCount="${RESTE.length}">${RESTE.map((s) => `<si><t xml:space="preserve">${esc(s)}</t></si>`).join('')}</sst>`,
  });
}
await makeReste();

const report = [];
const log = (s = '') => { report.push(s); console.log(s); };
const results = [];
function check(name, ok, detail = '') { results.push([name, ok]); log(`- ${ok ? 'OK' : 'FEHLER'}: ${name}${detail ? ' – ' + detail : ''}`); }
const requests = [];
const errors = [];
const browser = await pwMod.chromium.launch();
let seq = 0;
async function newPage() {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true });
  const page = await ctx.newPage();
  page.on('request', (r) => { if (!/^(file|blob|data):/.test(r.url())) requests.push(r.url()); });
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('dialog', (d) => d.accept());
  await page.goto('file://' + HTML);
  return { page, ctx };
}
const MODES = ['person', 'name', 'reversible'];
const unxml = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
const countCI = (t, w) => t.toLowerCase().split(w.toLowerCase()).length - 1;
// Vergleichsinhalt: txt/csv als Text; Word/Excel: alle Texte je Teil (ohne docProps, dort steht die Kennung)
async function content(bytes, kind) {
  if (kind === 'txt' || kind === 'csv') return Buffer.from(bytes).toString('utf8').replace(/^﻿/, '');
  const z = await JSZip.loadAsync(bytes);
  const out = [];
  for (const n of Object.keys(z.files).sort()) {
    if (!/\.(xml|rels)$/.test(n) || /^docProps\//.test(n)) continue;
    const x = await z.file(n).async('string');
    const parts = [];
    for (const m of x.matchAll(/<(?:w:t|t|w:instrText)(?:\s[^>]*)?>([^<]*)<\//g)) parts.push(unxml(m[1]));
    for (const m of x.matchAll(/<sheet\b[^>]*\bname="([^"]*)"/g)) parts.push('BLATT ' + unxml(m[1]));
    if (parts.length) out.push(n + ': ' + parts.join(' ¦ '));
  }
  return out.join('\n');
}
// alle Teile der Ausgabe als Text (für das Zählen von Namen)
async function allText(bytes, kind) {
  if (kind === 'txt' || kind === 'csv') return Buffer.from(bytes).toString('utf8');
  const z = await JSZip.loadAsync(bytes);
  let t = '';
  for (const n of Object.keys(z.files).sort()) if (/\.(xml|rels)$/.test(n)) t += '\n' + unxml(await z.file(n).async('string'));
  return t;
}
async function openUI(file, mode, unsureOff = false) {
  const { page, ctx } = await newPage();
  await startAnon(page, mode);
  if (unsureOff) {
    if (await page.isHidden('#advanced')) await page.click('#tgl-adv');
    await page.uncheck('#opt-unsureOn');
  }
  const st = await loadIn(page, file);
  if (!/Gelesen/.test(st)) throw new Error('Laden: ' + st);
  await goTo(page, 'a2');
  return { page, ctx };
}
const restQ = (page) => page.evaluate(() => { const q = window.__anon.questions().find((x) => x.kind === 'rest'); return q ? { id: q.id, words: q.words.map((w) => ({ key: w.key, word: w.word, count: w.count, keep: !w.replacedElsewhere })) } : null; });
// Sammelfrage zeigen (über den Punkt auf „Speichern“ wäre es auch möglich; hier über „Nächste Frage“ bis zum Ende)
async function showRestQ(page) {
  for (let i = 0; i < 200; i++) {
    const kind = await page.evaluate(() => { const r = window.__anon.shownQuestion(); const q = window.__anon.questions()[r.idx]; return q ? q.kind : null; });
    if (kind === 'rest') return true;
    if (await page.isDisabled('#q-next')) {
      // unbeantwortete Frage davor: weiter springen über die Testschnittstelle (keine Antwort geben)
      const id = await page.evaluate(() => (window.__anon.questions().find((x) => x.kind === 'rest') || {}).id);
      if (!id) return false;
      await page.evaluate((x) => window.__anon.showQ(x), id);
      return true;
    }
    await page.click('#q-next');
  }
  return false;
}
// Eintrag der Personen- bzw. Einrichtungsliste ausschalten (wie ein Mensch: Liste zeigen, Schalter aus)
async function switchOff(page, display) {
  if (await page.isHidden('#entities')) await page.click('#tgl-entities');
  await page.uncheck(`#entities input[aria-label="${display} an/aus"]`);
}
async function clickWord(page, key, act) {
  await showRestQ(page);
  await page.click(`#rest-list li[data-key="${key}"] button[data-act="${act}"]`);
}
async function exportFile(page, ext, mode, tag) {
  await goTo(page, 'a3');
  let keyPath = null;
  if (mode === 'reversible') {
    await ackPoints(page);
    const kd = await saveKey(page);
    keyPath = path.join(outDir, `${tag}-${++seq}-${kd.suggestedFilename()}`);
    await kd.saveAs(keyPath);
  }
  const r = await exportWithAck(page, ext);
  if (!r.dl) throw new Error('Speichern: ' + r.status);
  const outPath = path.join(outDir, `${tag}-${++seq}-${r.dl.suggestedFilename()}`);
  await r.dl.saveAs(outPath);
  return { outPath, keyPath };
}
async function restore(file, key) {
  const { page, ctx } = await newPage();
  await page.click('#go-restore');
  await page.setInputFiles('#rb-file', file);
  await page.waitForFunction(() => document.querySelector('#rb-file-status').textContent);
  await page.setInputFiles('#rb-key', key);
  await page.waitForFunction(() => document.querySelector('#rb-key-status').textContent);
  await page.click('#rb-btn-check');
  const verdict = await page.evaluate(() => window.__anon.rb.plan.verdict);
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
  return { bytes, verdict };
}

log('# Testlauf „restwoerter“ (Version 2.9.0: Diese Wörter bleiben stehen)');
log('');
log(`Geprüfte Datei: ${path.relative(root, HTML)}. Nur Chromium, Firefox prüft Easy. Alle Namen erfunden.`);
log('');
const table = [];

// ---------- 1. Testdatei „reste“ ----------
log('## 1. Testdatei „reste“ (txt, docx, xlsx)');
log('');
const sollKeys = Object.keys(SOLL);
for (const ext of ['txt', 'docx', 'xlsx']) {
  const file = path.join(FX, 'reste.' + ext);
  const orig = await content(fs.readFileSync(file), ext);
  for (const [mode, unsureOff] of [...MODES.map((m) => [m, false]), ['person', true]]) {
    const tag = `reste-${ext}-${mode}${unsureOff ? '-unsicher-aus' : ''}`;
    const { page, ctx } = await openUI(file, mode, unsureOff);
    const q = await restQ(page);
    const words = q ? q.words.map((w) => w.word) : [];
    const extra = words.filter((w) => !sollKeys.includes(w));
    const missing = sollKeys.filter((w) => !words.includes(w));
    const isLast = await page.evaluate(() => { const qs = window.__anon.questions(); return qs.length > 0 && qs[qs.length - 1].kind === 'rest'; });
    check(`${tag}: Liste = Soll (${sollKeys.length} Wörter), letzte Frage`, !extra.length && !missing.length && isLast, `gemessen: ${words.join(', ')}${extra.length ? ' · zusätzlich: ' + extra.join(', ') : ''}${missing.length ? ' · fehlt: ' + missing.join(', ') : ''}`);
    for (const w of sollKeys) {
      const cur = await restQ(page);
      const it = cur && cur.words.find((x) => x.word === w);
      if (it) await clickWord(page, it.key, SOLL[w]);
    }
    const after = await restQ(page);
    const { outPath, keyPath } = await exportFile(page, ext, mode, tag);
    await ctx.close();
    const t = await allText(fs.readFileSync(outPath), ext);
    const left = sollKeys.filter((w) => countCI(t, w) > 0);
    check(`${tag}: nach „Name“/„Einrichtung“ je Wort steht keines mehr in der Ausgabe`, !left.length, left.length ? 'noch da: ' + left.map((w) => `${w} (${countCI(t, w)})`).join(', ') : `Liste danach: ${after ? after.words.map((w) => w.word).join(', ') : 'leer'}`);
    let rb = '';
    if (mode === 'reversible') {
      const r = await restore(outPath, keyPath);
      const ok = !!r.bytes && (await content(r.bytes, ext)) === orig;
      check(`${tag}: Rückbau exakt`, ok, r.verdict);
      rb = ok ? 'exakt' : 'NICHT exakt';
    }
    table.push(`| 1 reste | ${ext} | ${mode}${unsureOff ? ', Unsichere aus' : ''} | Liste = 8 Soll-Wörter; danach 0 in der Ausgabe${mode === 'reversible' ? '; Rückbau exakt' : ''} | ${words.length} Wörter${extra.length || missing.length ? ' (abweichend)' : ''}; danach ${left.length ? left.join(', ') : '0'}${rb ? '; Rückbau ' + rb : ''} |`);
  }
}
log('');

// ---------- 2. anmeldung.* ----------
log('## 2. anmeldung.*: GYMTH');
log('');
for (const ext of ['txt', 'csv', 'docx', 'xlsx', 'pdf']) {
  for (const mode of MODES) {
    const tag = `anmeldung-${ext}-${mode}`;
    const { page, ctx } = await openUI(path.join(FXT_TRAEGER, 'anmeldung.' + ext), mode);
    const q = await restQ(page);
    const words = q ? q.words.map((w) => w.word) : [];
    check(`${tag}: Liste enthält GYMTH und OGTS`, words.includes('GYMTH') && words.includes('OGTS'), `Liste: ${words.join(', ')}`);
    const it = q && q.words.find((w) => w.word === 'GYMTH');
    if (it) await clickWord(page, it.key, 'einr');
    const outExt = ext === 'pdf' ? 'txt' : ext;
    const { outPath } = await exportFile(page, outExt, mode, tag);
    await ctx.close();
    const n = (await allText(fs.readFileSync(outPath), outExt)).split('GYMTH').length - 1;
    check(`${tag}: nach „Einrichtung“ auf GYMTH steht GYMTH 0-mal in der Ausgabe`, n === 0, `${n}-mal`);
    table.push(`| 2 anmeldung | ${ext} | ${mode} | GYMTH und OGTS in der Liste; danach GYMTH 0-mal | Liste ${words.join(', ')}; GYMTH ${n}-mal |`);
  }
}
log('');

// ---------- 3. sachtext.txt ----------
log('## 3. sachtext.txt');
log('');
const WHY = {
  Pausenverkauf: 'Sachwort (zusammengesetzt, steht nicht in der Wortliste), kein Name',
  Klassenleitung: 'Sachwort (zusammengesetzt, steht nicht in der Wortliste), kein Name',
  Tannfeld: 'erfundener Ortsname („in die Stadt Tannfeld“), kein Personenname',
};
{
  const { page, ctx } = await openUI(path.join(FXT_TRAEGER, 'sachtext.txt'), 'person');
  const q = await restQ(page);
  await ctx.close();
  const words = q ? q.words.map((w) => w.word) : [];
  const unnamed = words.filter((w) => !WHY[w]);
  check('sachtext.txt: höchstens 5 Wörter in der Liste, jedes benannt', words.length <= 5 && !unnamed.length, `${words.length} Wörter: ${words.map((w) => `${w} – ${WHY[w] || 'NICHT BENANNT'}`).join('; ')}`);
  table.push(`| 3 sachtext | txt | person | ≤ 5 Wörter, jedes benannt | ${words.length}: ${words.join(', ')} |`);
}
log('');

// ---------- 4. Kein stilles Speichern ----------
log('## 4. Kein stilles Speichern');
log('');
for (const ext of ['txt', 'docx', 'xlsx']) {
  const { page, ctx } = await openUI(path.join(FX, 'reste.' + ext), 'person');
  // alle anderen Fragen beantworten („Nein“), damit nur die Sammelfrage offen ist
  for (let i = 0; i < 50; i++) {
    const kind = await page.evaluate(() => { const A = window.__anon; const r = A.shownQuestion(); const q = A.questions()[r.idx]; return q && !A.answerOf(q) ? q.kind : null; });
    if (!kind || kind === 'rest') break;
    await page.click('#q-no');
  }
  await goTo(page, 'a3');
  await waitCheck(page);
  const pts = async () => page.$$eval('#points > li', (l) => l.map((x) => x.innerText.replace(/\s+/g, ' ').trim()));
  const p1 = await pts();
  const pt = p1.find((x) => /Wörter sind noch nicht geprüft\. Ist ein Name dabei\?/.test(x));
  check(`${ext}: offene Sammelfrage -> Punkt „8 Wörter sind noch nicht geprüft. Ist ein Name dabei?“ mit „Ansehen“`, !!pt && /^8 Wörter/.test(pt) && /Ansehen/.test(pt), pt || p1.join(' | '));
  // ohne Häkchen wird nicht gespeichert
  const blocked = await page.isVisible('#ack-all-row') && !(await page.isChecked('#ack-all'));
  check(`${ext}: Speichern braucht das eine Häkchen (Punkt läuft darüber)`, blocked);
  await page.click('#btn-rest');
  const shown = await page.evaluate(() => { const A = window.__anon; const r = A.shownQuestion(); return A.app.screen + ':' + (A.questions()[r.idx] || {}).kind; });
  check(`${ext}: „Ansehen“ zeigt die Sammelfrage auf „Prüfen“`, shown === 'a2:rest', shown);
  const counter = await page.textContent('#qcard .qcount');
  const total = await page.evaluate(() => window.__anon.questions().length);
  check(`${ext}: Sammelfrage zählt im Zähler mit (letzte Frage)`, counter.trim() === `Frage ${total} von ${total}`, counter);
  await page.click('#q-no'); // „Kein Name dabei“
  await goTo(page, 'a3');
  await waitCheck(page);
  const p2 = await pts();
  check(`${ext}: „Kein Name dabei“ -> Punkt weg`, !p2.some((x) => /noch nicht geprüft/.test(x)), p2.join(' | ') || 'keine Punkte');
  // neues Wort: die Person „Okonkwo vom Gymnasium“ ausschalten -> „Okonkwo“ bleibt stehen und ist kein gewöhnliches Wort
  // (Vornamen wie „Gesine“ stehen dagegen in der Wortliste und kämen nicht in die Liste)
  await goTo(page, 'a2');
  const before = (await restQ(page)).words.map((w) => w.word);
  const off = await page.evaluate(() => {
    const A = window.__anon;
    const en = [...A.app.result.entities.values()].find((e) => e.display === 'Okonkwo vom Gymnasium');
    return en ? en.display : null;
  });
  if (off) await switchOff(page, off);
  const q3 = await restQ(page);
  const now = q3 ? q3.words.map((w) => w.word) : [];
  const open = await page.evaluate(() => { const A = window.__anon; const q = A.questions().find((x) => x.kind === 'rest'); return !!q && !A.answerOf(q); });
  check(`${ext}: neues Wort (Person „${off}“ ausgeschaltet) -> Frage wieder offen`, !!off && now.includes('Okonkwo') && !before.includes('Okonkwo') && open, `vorher ${before.length}, jetzt ${now.length} Wörter (${now.filter((w) => !before.includes(w)).join(', ')} neu)`);
  await goTo(page, 'a3');
  await waitCheck(page);
  const p3 = await pts();
  check(`${ext}: Punkt wieder da`, p3.some((x) => /^9 Wörter sind noch nicht geprüft/.test(x)), p3.find((x) => /geprüft/.test(x)) || p3.join(' | '));
  await ctx.close();
  table.push(`| 4 stilles Speichern | ${ext} | person | Punkt da; nach „Kein Name dabei“ weg; neues Wort -> wieder offen | ${pt ? 'Punkt da' : 'kein Punkt'}; danach ${p2.some((x) => /geprüft/.test(x)) ? 'noch da' : 'weg'}; neues Wort ${open ? 'offen' : 'NICHT offen'} |`);
}
log('');

// ---------- 5. Weg-Gleichheit ----------
log('## 5. Weg-Gleichheit');
log('');
async function outputOf(ext, mode, steps, tag) {
  const { page, ctx } = await openUI(path.join(FX, 'reste.' + ext), mode);
  await steps(page);
  const { outPath } = await exportFile(page, ext, mode, tag);
  const words = (await restQ(page) || { words: [] }).words.map((w) => w.word);
  await ctx.close();
  return { c: await content(fs.readFileSync(outPath), ext), words };
}
for (const ext of ['txt', 'docx', 'xlsx']) {
  for (const mode of MODES) {
    const tag = `weg-${ext}-${mode}`;
    const never = await outputOf(ext, mode, async () => {}, tag + '-nie');
    const keyOf = async (page, w) => (await restQ(page)).words.find((x) => x.word === w).key;
    // a) Name „Hallmayer“ übernehmen, dann in der Personenliste ausschalten
    const a = await outputOf(ext, mode, async (page) => {
      await clickWord(page, await keyOf(page, 'Hallmayer'), 'name');
      await switchOff(page, 'Hallmayer');
    }, tag + '-name');
    // b) Einrichtung „Lindenblick“ übernehmen, dann in der Einrichtungsliste ausschalten
    const b = await outputOf(ext, mode, async (page) => {
      await clickWord(page, await keyOf(page, 'Lindenblick'), 'einr');
      await switchOff(page, 'Lindenblick');
    }, tag + '-einr');
    // c) „bleibt immer stehen“ für „Sonnleitner“, dann aus „Ausnahmen“ wieder entfernen
    let inExc = false;
    const c = await outputOf(ext, mode, async (page) => {
      await clickWord(page, await keyOf(page, 'Sonnleitner'), 'immer');
      inExc = await page.evaluate(() => window.__anon.app.state.exceptions.includes('Sonnleitner'));
      // Ausnahmen stehen auf dem Bildschirm „Datei“ unter „Einstellungen und eigene Namen“
      await goTo(page, 'a1');
      if (await page.isHidden('#advanced')) await page.click('#tgl-adv');
      await page.click('#exc-chips button[aria-label="Sonnleitner entfernen"]');
      await goTo(page, 'a2');
    }, tag + '-immer');
    const same = (x) => x.c === never.c && JSON.stringify(x.words) === JSON.stringify(never.words);
    check(`${tag}: „Name“ übernommen, dann ausgeschaltet = nie übernommen`, same(a), same(a) ? '' : `Liste nie: ${never.words.join(', ')} / danach: ${a.words.join(', ')}`);
    check(`${tag}: „Einrichtung“ übernommen, dann ausgeschaltet = nie übernommen`, same(b), same(b) ? '' : `Liste nie: ${never.words.join(', ')} / danach: ${b.words.join(', ')}`);
    check(`${tag}: „bleibt immer stehen“ und zurück = nie`, inExc && same(c), `in Ausnahmen: ${inExc}`);
    table.push(`| 5 Weg-Gleichheit | ${ext} | ${mode} | übernommen+aus = nie (Name, Einrichtung); „bleibt immer stehen“+zurück = nie | ${same(a) ? 'gleich' : 'VERSCHIEDEN'} / ${same(b) ? 'gleich' : 'VERSCHIEDEN'} / ${same(c) ? 'gleich' : 'VERSCHIEDEN'} |`);
  }
}
log('');

await browser.close();
check('0 Anfragen nach außen', requests.length === 0, requests.slice(0, 3).join(', '));
check('keine Fehler auf der Seite', errors.length === 0, errors.slice(0, 3).join(' | '));
log('');
log('## Soll / gemessen');
log('');
log('| Test | Format | Modus | Soll | gemessen |');
log('|---|---|---|---|---|');
for (const r of table) log(r);
log('');
const ok = results.filter((r) => r[1]).length;
log(`**Ergebnis: ${ok === results.length ? '' : 'NICHT '}bestanden** (${ok}/${results.length})`);
if (!process.env.RESTE_HTML) fs.writeFileSync(path.join(here, 'RESTWOERTER-REPORT.md'), report.join('\n') + '\n');
process.exit(ok === results.length ? 0 : 1);
