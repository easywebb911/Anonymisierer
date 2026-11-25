// Version 2.11.2: „Speichern verständlicher“. Über die echte Oberfläche (Chromium, file://), Gegenprobe gegen main (2.11.1).
// Testdateien: tests/make-bildrauschen.mjs (alle Namen erfunden).
// A. Häkchen gesperrt wegen ungesehener Bilder: Satz „Sieh dir zuerst die Bilder an.“ und Knopf „Bilder ansehen“ sichtbar;
//    Knopf öffnet die Bilderliste (sichtbar), Häkchen wählbar; eine Änderung danach: Häkchen fällt zurück wie auf main;
//    Datei ohne Bilder: kein Satz, kein Knopf, Verhalten wie main
// B. Schlusscheck: Zufallstreffer kurzer Namen in reinen Bilddaten (PNG/JPEG) vorher (main) und nachher (Ziel 0), je
//    Datei, Name und Fundort; kein Fund verloren bei lesbarem Text in Bildangaben (PNG-Textfeld, EXIF, XMP, Alt-Text);
//    Gegenprobe über alle vorhandenen Word-/Excel-Testdateien (jeder Fund, den main meldet und der Branch nicht)
// Aufruf: node tests/bildrauschen-test.mjs <index.html von main (2.11.1)>
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import JSZip from 'jszip';
import { startAnon, loadIn, goTo, ackPoints } from './ui-helpers.mjs';
import { FXB, LESBAR, makeAll } from './make-bildrauschen.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const NEW = path.join(root, 'index.html');
const OLD = path.resolve(process.argv[2] || path.join(here, 'out-alt', 'index-2.11.1.html'));
if (!fs.existsSync(OLD)) { console.error('Bitte Pfad zur index.html von main (2.11.1) angeben.'); process.exit(2); }
await makeAll();
let chromium;
try { ({ chromium } = createRequire(import.meta.url)('playwright')); } catch { ({ chromium } = createRequire('/opt/node22/lib/node_modules/')('playwright')); }

const report = [];
const log = (s = '') => { report.push(s); console.log(s); };
let pass = 0;
let fail = 0;
const check = (name, ok, detail = '') => { if (ok) pass++; else fail++; log(`- ${ok ? 'OK' : 'FEHLER'}: ${name}${detail ? ' – ' + detail : ''}`); };
const requests = [];
const errorsAll = [];
const browser = await chromium.launch();

async function open(file, mode = 'person', html = NEW) {
  const ctx = await browser.newContext({ acceptDownloads: true });
  const page = await ctx.newPage();
  page.on('request', (r) => requests.push(r.url()));
  page.on('pageerror', (e) => errorsAll.push(e.message));
  page.on('dialog', (d) => d.accept());
  await page.goto('file://' + html);
  await startAnon(page, mode);
  await loadIn(page, file);
  await goTo(page, 'a2');
  if (await page.$('#col-ok')) await page.click('#col-ok');
  return { page, ctx };
}
// Schlusscheck-Funde einer Ausgabe (Wort | Fundort); raw: Fundort im Paket (nur neue Version); bytes: eigene Ausgabe
async function leaksOf(page, { opt = null, bytes = null } = {}) {
  return page.evaluate(async ([o, b]) => {
    const A = window.__anon;
    const out = b ? { bytes: new Uint8Array(b), zip: true } : await A.buildOutput(A.app.doc.kind);
    const ls = await A.finalCheck(out, o || {});
    return ls.map((l) => ({ word: l.word, where: l.where, raw: l.raw || null }));
  }, [opt, bytes]);
}
const key = (l) => `${l.word} | ${l.where}`;
const count = (ls) => { const m = new Map(); for (const l of ls) m.set(key(l), (m.get(key(l)) || 0) + 1); return m; };
const letters = (w) => (w.match(/\p{L}/gu) || []).length;

// ---------- A. Häkchen und Bilder ----------
log('# Speichern verständlicher (Version 2.11.2)');
log('');
log('## A. Häkchen gesperrt wegen ungesehener Bilder');
{
  const file = path.join(FXB, 'lesbar.docx');
  const res = {};
  for (const [tag, html] of [['neu', NEW], ['main', OLD]]) {
    const { page, ctx } = await open(file, 'person', html);
    await goTo(page, 'a3');
    await page.waitForSelector('#ack-all-row:not([hidden])');
    const r = { before: await page.evaluate(() => ({ disabled: document.querySelector('#ack-all').disabled, row: !!document.querySelector('#ack-img-row') && !document.querySelector('#ack-img-row').hidden, text: (document.querySelector('#ack-img-row') || {}).innerText || '' })) };
    if (tag === 'neu') {
      // Tastatur: Knopf mit Tab erreichbar (fokussierbar) und mit Enter auslösbar
      await page.focus('#btn-ack-images');
      r.focusable = await page.evaluate(() => document.activeElement && document.activeElement.id === 'btn-ack-images');
      await page.keyboard.press('Enter');
    } else await page.click('#btn-images');
    await page.waitForSelector('#img-list');
    await page.waitForFunction(() => !document.querySelector('#ack-all').disabled);
    r.after = await page.evaluate(() => {
      const box = document.querySelector('#img-list').getBoundingClientRect();
      return { disabled: document.querySelector('#ack-all').disabled, row: !!document.querySelector('#ack-img-row') && !document.querySelector('#ack-img-row').hidden,
        visible: box.top < window.innerHeight && box.bottom > 0, focus: document.activeElement && document.activeElement.id };
    });
    await page.check('#ack-all');
    r.checked = await page.isChecked('#ack-all');
    // eine Änderung danach (eigener Name): Häkchen fällt zurück
    await page.evaluate(() => window.__anon.addManual('Brunhilde Quastenberg'));
    await page.waitForFunction(() => !document.querySelector('#ack-all').checked, null, { timeout: 5000 }).catch(() => {});
    r.afterChange = await page.evaluate(() => ({ checked: document.querySelector('#ack-all').checked, disabled: document.querySelector('#ack-all').disabled, row: !!document.querySelector('#ack-img-row') && !document.querySelector('#ack-img-row').hidden }));
    res[tag] = r;
    await ctx.close();
  }
  const n = res.neu;
  check('Datei mit Bildern: Häkchen gesperrt, Satz „Sieh dir zuerst die Bilder an.“ und Knopf „Bilder ansehen“ sichtbar', n.before.disabled && n.before.row && /Sieh dir zuerst die Bilder an\./.test(n.before.text) && /Bilder ansehen/.test(n.before.text), JSON.stringify(n.before));
  check('Knopf mit der Tastatur erreichbar und mit Enter auslösbar', n.focusable && n.after.row === false);
  check('Nach dem Knopf: Bilderliste offen und im sichtbaren Bereich, Häkchen wählbar, Satz und Knopf weg', !n.after.disabled && !n.after.row && n.after.visible, JSON.stringify(n.after));
  check('Häkchen lässt sich setzen; nach einer Änderung fällt es zurück wie auf main', n.checked && !n.afterChange.checked && res.main.checked && !res.main.afterChange.checked && n.afterChange.disabled === res.main.afterChange.disabled, `neu ${JSON.stringify(n.afterChange)} / main ${JSON.stringify(res.main.afterChange)}`);
  check('Sperre wie auf main (vorher gesperrt, nach dem Öffnen frei)', res.main.before.disabled === n.before.disabled && res.main.after.disabled === n.after.disabled);
  const t = n.before.text;
  check('Kein „null“/„undefined“ im Satz', !/null|undefined/.test(t), t);
  // Datei ohne Bilder: kein Satz, kein Knopf, wie main
  const plain = path.join(here, 'fixtures', 'protokoll.docx');
  const noImg = {};
  for (const [tag, html] of [['neu', NEW], ['main', OLD]]) {
    const { page, ctx } = await open(plain, 'person', html);
    await goTo(page, 'a3');
    await page.waitForTimeout(300);
    noImg[tag] = await page.evaluate(() => ({ disabled: document.querySelector('#ack-all').disabled, rowHidden: document.querySelector('#ack-all-row').hidden, img: !!document.querySelector('#ack-img-row') && !document.querySelector('#ack-img-row').hidden }));
    await ctx.close();
  }
  check('Datei ohne Bilder: kein Satz, kein Knopf; Häkchen wie auf main', !noImg.neu.img && noImg.neu.disabled === noImg.main.disabled && noImg.neu.rowHidden === noImg.main.rowHidden, `neu ${JSON.stringify(noImg.neu)} / main ${JSON.stringify(noImg.main)}`);
}

// ---------- B. Zufallstreffer in Bilddaten ----------
log('');
log('## B. Schlusscheck: Zufallstreffer kurzer Namen in reinen Bilddaten');
for (const f of ['rauschen.docx', 'rauschen.xlsx']) {
  const file = path.join(FXB, f);
  for (const mode of ['person', 'name', 'reversible']) {
    const m = await open(file, mode, OLD);
    const lm = await leaksOf(m.page);
    await m.ctx.close();
    const b = await open(file, mode);
    const lb = await leaksOf(b.page);
    const lw = await leaksOf(b.page, { opt: { pixelSkip: false } });
    await b.ctx.close();
    log('');
    log(`### ${f}, Modus ${mode}: main ${lm.length} Funde, Branch ${lb.length} Funde`);
    // Fundorte (gemessen auf dem Branch ohne die neue Regel; Gesamtzahl gleich main)
    const per = new Map();
    for (const l of lw) {
      const ort = /\(binär, UTF-8\)$/.test(l.raw) ? 'binär UTF-8' : /\(binär, UTF-16\)$/.test(l.raw) ? 'binär UTF-16' : /Bildangaben/.test(l.raw) ? 'Bildangaben' : 'anderer Ort';
      const nm = l.word.normalize('NFKD').replace(/[^\p{L}]/gu, '').toLowerCase();
      const k = `${nm}|${ort}`;
      per.set(k, (per.get(k) || 0) + 1);
    }
    if (mode === 'person') {
      log('');
      log('| Name (Grundform des Treffers) | Fundort | Zahl (main) |');
      log('|---|---|---|');
      for (const [k, v] of [...per].sort()) { const [nm, ort] = k.split('|'); log(`| ${nm} | ${ort} | ${v} |`); }
    }
    check(`${f}, ${mode}: Messung ohne neue Regel = main (gleiche Funde)`, JSON.stringify([...count(lw)].sort()) === JSON.stringify([...count(lm)].sort()), `${lw.length} / ${lm.length}`);
    check(`${f}, ${mode}: auf main mindestens ein Zufallstreffer (nachgestellt)`, lm.length > 0, String(lm.length));
    check(`${f}, ${mode}: Branch meldet keinen Zufallstreffer mehr (Ziel 0)`, lb.length === 0, lb.slice(0, 5).map(key).join('; '));
    check(`${f}, ${mode}: jeder Fund von main liegt in einem Bild (PNG/JPEG, binär) und ist kurz (bis 4 Buchstaben)`, lw.every((l) => /media\/[^/]+\.(png|jpe?g) \(binär, UTF-(8|16)\)$/.test(l.raw || '') && letters(l.word) <= 4), lw.filter((l) => !(letters(l.word) <= 4)).slice(0, 3).map(key).join('; '));
  }
}

// ---------- B. lesbarer Text in Bildangaben: kein Fund verloren ----------
log('');
log('## B. Lesbarer Text in Bildangaben (kurzer Name „' + LESBAR.kurz + '“, langer Name „' + LESBAR.lang + '“)');
for (const f of ['lesbar.docx', 'lesbar.xlsx']) {
  const file = path.join(FXB, f);
  // Ausgabe der neuen Version; darin die Original-Bilder (mit Bildangaben) und ein Alt-Text mit beiden Namen
  // (so, als hätte das Leeren der Bildangaben versagt): der Schlusscheck muss jeden Namen melden
  const o = await open(file, 'person');
  const outBytes = await o.page.evaluate(async () => Array.from((await window.__anon.buildOutput(window.__anon.app.doc.kind)).bytes));
  await o.ctx.close();
  const src = await JSZip.loadAsync(fs.readFileSync(file));
  const variants = { 'PNG-Textfeld': 'png-text.png', EXIF: 'exif.jpeg', XMP: 'xmp.jpeg', 'Alt-Text': null };
  for (const [what, media] of Object.entries(variants)) {
    const z = await JSZip.loadAsync(Buffer.from(outBytes));
    const dir = f.endsWith('.docx') ? 'word/media/' : 'xl/media/';
    if (media) z.file(dir + media, await src.file(dir + media).async('nodebuffer'));
    else {
      const part = f.endsWith('.docx') ? 'word/document.xml' : 'xl/drawings/drawing1.xml';
      const x = await z.file(part).async('string');
      z.file(part, x.replace(/name="Bild (\d+)"/, `name="Bild $1" descr="Foto von ${LESBAR.kurz} ${LESBAR.lang}"`));
    }
    const bytes = Array.from(await z.generateAsync({ type: 'uint8array' }));
    const found = {};
    for (const [tag, html] of [['main', OLD], ['neu', NEW]]) {
      const p = await open(file, 'person', html);
      const ls = await leaksOf(p.page, { bytes });
      await p.ctx.close();
      found[tag] = { kurz: ls.some((l) => l.word.toLowerCase() === LESBAR.kurz.toLowerCase()), lang: ls.some((l) => l.word.toLowerCase() === LESBAR.lang.toLowerCase()) };
    }
    check(`${f}, ${what}: kurzer und langer Name gemeldet wie auf main`, found.neu.kurz && found.neu.lang && found.main.kurz === found.neu.kurz && found.main.lang === found.neu.lang, `main ${JSON.stringify(found.main)} / neu ${JSON.stringify(found.neu)}`);
  }
}

// ---------- B. Gegenprobe über alle vorhandenen Word-/Excel-Testdateien ----------
log('');
log('## B. Gegenprobe: alle Word-/Excel-Testdateien, Modus „Person A“');
{
  const files = [];
  for (const d of fs.readdirSync(here).filter((x) => /^fixtures/.test(x) && fs.statSync(path.join(here, x)).isDirectory()).sort()) {
    for (const f of fs.readdirSync(path.join(here, d)).sort()) if (/\.(docx|xlsx)$/i.test(f) && !/^rauschen\./.test(f)) files.push(path.join(here, d, f));
  }
  let diffs = 0;
  let notJustified = 0;
  let nFiles = 0;
  for (const file of files) {
    let m;
    let b;
    try { m = await open(file, 'person', OLD); } catch { continue; }
    const lm = await leaksOf(m.page).catch(() => null);
    await m.ctx.close();
    b = await open(file, 'person');
    const lb = await leaksOf(b.page).catch(() => null);
    const lw = await leaksOf(b.page, { opt: { pixelSkip: false } }).catch(() => null);
    await b.ctx.close();
    if (!lm || !lb) continue;
    nFiles++;
    const cm = count(lm);
    const cb = count(lb);
    const gone = [];
    for (const [k, v] of cm) { const d = v - (cb.get(k) || 0); for (let i = 0; i < d; i++) gone.push(k); }
    const added = [];
    for (const [k, v] of cb) { const d = v - (cm.get(k) || 0); for (let i = 0; i < d; i++) added.push(k); }
    for (const g of gone) {
      diffs++;
      const word = g.split(' | ')[0];
      const src = (lw || []).find((l) => key(l) === g);
      const ok = src && /\.(png|jpe?g) \(binär, UTF-(8|16)\)$/.test(src.raw || '') && letters(word) <= 4;
      if (!ok) notJustified++;
      log(`- ${path.relative(here, file)}: „${g}“ – ${ok ? `Zufallstreffer in reinen Bilddaten (${src.raw})` : 'NICHT BEGRÜNDET'}`);
    }
    for (const a of added) { notJustified++; log(`- ${path.relative(here, file)}: neu gemeldet „${a}“ – NICHT BEGRÜNDET`); }
  }
  log(`- ${nFiles} Dateien verglichen, ${diffs} Funde fallen weg`);
  check('Gegenprobe: jeder wegfallende Fund ist ein Zufallstreffer in reinen Bilddaten; sonst keine Abweichung', notJustified === 0, String(notJustified));
}

log('');
check('Keine JS-Fehler', !errorsAll.length, errorsAll.slice(0, 3).join(' | '));
const ext = requests.filter((u) => !/^(file:|blob:|data:|about:)/.test(u));
check('0 Anfragen nach außen (alle Seiten dieses Laufs)', !ext.length, ext.slice(0, 3).join(', '));
await browser.close();
log('');
log(`Ergebnis: ${pass} von ${pass + fail} Prüfungen bestanden`);
fs.writeFileSync(path.join(here, 'BILDRAUSCHEN-REPORT.md'), report.join('\n') + '\n');
process.exit(fail ? 1 : 0);
