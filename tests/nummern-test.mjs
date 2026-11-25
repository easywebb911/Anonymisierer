// Version 2.11.1: Heikle Spalten – eigene Nummer je Zelle (Modus „rückbaufähig“). Über die echte Oberfläche (Chromium,
// file://), Gegenprobe gegen main (2.11.0). Testdaten: tests/make-spaltenwahl.mjs (alle Daten erfunden).
// 1. Je heikler Spalte (stammdaten, CSV und XLSX): gefüllte Zellen, verschiedene Platzhalter vorher (2.11.0) und nachher;
//    nachher gleich viele verschiedene Platzhalter wie gefüllte Zellen
// 2. Kein Platzhalter aus einer heiklen Spalte steht ein zweites Mal im Dokument
// 3. Rückbau: exakt (CSV byte-gleich, Excel Zelle für Zelle); mit simulierter KI (Zeilen getauscht, Text angehängt);
//    Schlüsseldatei und Ausgabe von 2.11.0 (feste Testdateien) bauen mit 2.11.1 exakt zurück
// 4. Modi „Person A“ und „[NAME]“: Ausgabe gleich wie 2.11.0
// 5. Zwei Läufe ergeben dieselbe Ausgabe
// Anzeige: „eigene Nummer je Zelle“ in der Spalten-Übersicht (nur rückbaufähig), Satz im Hinweis für die KI
// Nur gezählt: leere Zellen je heikler Spalte
// Aufruf: node tests/nummern-test.mjs <index.html von main (2.11.0)>
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import JSZip from 'jszip';
import { startAnon, loadIn, goTo, ackPoints, saveKey, exportWithAck, rbConfirm } from './ui-helpers.mjs';
import { FXW, HEADERS, makeAll } from './make-spaltenwahl.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const NEW = path.join(root, 'index.html');
const OLD = path.resolve(process.argv[2] || path.join(here, 'out-alt', 'index-2.11.0.html'));
if (!fs.existsSync(OLD)) { console.error('Bitte Pfad zur index.html von main (2.11.0) angeben.'); process.exit(2); }
if (!process.env.ANON_FIXTURES_FERTIG) await makeAll();
// Feste Testdateien aus 2.11.0 (Ausgabe und Schlüsseldatei); fehlen sie, werden sie einmal mit 2.11.0 erzeugt
const FXN = path.join(here, 'fixtures-nummern');
const outDir = path.join(here, 'out-nummern');
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });
let chromium;
try { ({ chromium } = createRequire(import.meta.url)('playwright')); } catch { ({ chromium } = createRequire('/opt/node22/lib/node_modules/')('playwright')); }
const TRUTH = JSON.parse(fs.readFileSync(path.join(FXW, 'stammdaten-wahrheit.json'), 'utf8'));

const report = [];
const log = (s = '') => { report.push(s); console.log(s); };
let pass = 0;
let fail = 0;
const check = (name, ok, detail = '') => { if (ok) pass++; else fail++; log(`- ${ok ? 'OK' : 'FEHLER'}: ${name}${detail ? ' – ' + detail : ''}`); };
const requests = [];
const browser = await chromium.launch();
let seq = 0;

async function newPage(html = NEW) {
  const ctx = await browser.newContext({ acceptDownloads: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on('request', (r) => requests.push(r.url()));
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('dialog', (d) => d.accept());
  await page.goto('file://' + html);
  return { page, ctx, errors };
}
async function openFile(file, mode, { html = NEW, confirm = true, unsure = true } = {}) {
  const o = await newPage(html);
  await startAnon(o.page, mode);
  if (!unsure) {
    if (await o.page.isHidden('#advanced')) await o.page.click('#tgl-adv');
    if (await o.page.isChecked('#opt-unsureOn')) await o.page.click('#opt-unsureOn');
  }
  await loadIn(o.page, file);
  await goTo(o.page, 'a2');
  if (confirm && await o.page.$('#col-ok')) await o.page.click('#col-ok');
  return o;
}
async function anonymize(file, mode, html = NEW, unsure = true) {
  const o = await openFile(file, mode, { html, unsure });
  const { page } = o;
  // heikle Spalten (eigene Nummer je Zelle): Spalten mit solchen Treffern
  const perCell = await page.evaluate(() => {
    const r = window.__anon.app.result;
    const ids = new Set(r.hits.filter((h) => h.on && h.perCell).map((h) => h.column));
    return (r.colPlan || []).filter((c) => ids.has(c.id)).map((c) => ({ id: c.id, header: c.header, c: c.c }));
  });
  await goTo(page, 'a3');
  await ackPoints(page);
  let keyPath = null;
  if (mode === 'reversible') {
    const kd = await saveKey(page);
    keyPath = path.join(outDir, `k${++seq}-${kd.suggestedFilename()}`);
    await kd.saveAs(keyPath);
  }
  const ext = path.extname(file).slice(1);
  const r = await exportWithAck(page, ext);
  const outPath = path.join(outDir, `a${++seq}-${r.dl.suggestedFilename()}`);
  await r.dl.saveAs(outPath);
  const errors = o.errors;
  await o.ctx.close();
  return { outPath, keyPath, perCell, errors };
}
async function restore(file, key, html = NEW) {
  const { page, ctx, errors } = await newPage(html);
  await page.click('#go-restore');
  await page.setInputFiles('#rb-file', file);
  await page.waitForFunction(() => document.querySelector('#rb-file-status').textContent);
  await page.setInputFiles('#rb-key', key);
  await page.waitForFunction(() => document.querySelector('#rb-key-status').textContent);
  await page.click('#rb-btn-check', { timeout: 3000 }).catch(() => {});
  const plan = await page.evaluate(() => { const p = window.__anon.rb.plan; return p ? { verdict: p.verdict, bad: p.rows.filter((r) => r.status !== 'ok').map((r) => `${r.platzhalter} ${r.erwartet}→${r.gefunden}`) } : null; });
  let bytes = null;
  if (plan && plan.verdict !== 'falsch') {
    await rbConfirm(page, true);
    await page.click('#r2-next', { timeout: 5000 }).catch(() => {});
    const dlP = page.waitForEvent('download', { timeout: 60000 }).catch(() => null);
    await page.click('#rb-btn-save');
    const dl = await dlP;
    if (dl) { const p = path.join(outDir, `r${++seq}-${dl.suggestedFilename()}`); await dl.saveAs(p); bytes = fs.readFileSync(p); }
  }
  await ctx.close();
  return { bytes, plan, errors };
}

// ---------- Zellen lesen ----------
const dec = (x) => x.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
const colNum = (c) => { let n = 0; for (const ch of c) n = n * 26 + (ch.charCodeAt(0) - 64); return n; };
async function xlsxGrid(bytes) {
  const z = await JSZip.loadAsync(bytes);
  const ssx = z.file('xl/sharedStrings.xml') ? await z.file('xl/sharedStrings.xml').async('string') : '';
  const si = [...ssx.matchAll(/<si>([\s\S]*?)<\/si>|<si\/>/g)].map((m) => m[1] || '');
  const textOf = (x) => dec([...x.matchAll(/<t(?:\s[^>]*)?>([^<]*)<\/t>/g)].map((m) => m[1]).join(''));
  const sh = await z.file('xl/worksheets/sheet1.xml').async('string');
  const grid = new Map();
  for (const m of sh.matchAll(/<c r="([A-Z]+)(\d+)"((?:\s[^>]*?)?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
    const attrs = m[3] || '';
    const inner = m[4] || '';
    const t = (attrs.match(/\st="(\w+)"/) || [])[1] || null;
    const s = (attrs.match(/\ss="(\d+)"/) || [])[1] || null;
    const v = (inner.match(/<v>([^<]*)<\/v>/) || [])[1];
    let text;
    if (t === 's') text = textOf(si[Number(v)]); else if (t === 'inlineStr') text = textOf(inner); else text = dec(v || '');
    grid.set((Number(m[2]) - 1) + '|' + (colNum(m[1]) - 1), { t: t === 'inlineStr' ? 's' : t, s, text, shared: t === 's' ? Number(v) : null });
  }
  return grid;
}
function csvRows(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) { if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += ch; continue; }
    if (ch === '"' && cell === '') { q = true; continue; }
    if (ch === ';') { row.push(cell); cell = ''; continue; }
    if (ch === '\r') continue;
    if (ch === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; continue; }
    cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}
const noBom = (b) => (b && b[0] === 0xef && b[1] === 0xbb && b[2] === 0xbf ? b.subarray(3) : b);
async function rowsOf(file) {
  const b = fs.readFileSync(file);
  if (file.endsWith('.csv')) return csvRows(noBom(b).toString('utf8'));
  const g = await xlsxGrid(b);
  const rows = [];
  for (const [k, c] of g) { const [r, cc] = k.split('|').map(Number); (rows[r] = rows[r] || [])[cc] = c.text; }
  return Array.from(rows, (r) => Array.from({ length: HEADERS.length }, (_, i) => (r && r[i] !== undefined ? r[i] : '')));
}
async function allText(file) {
  const b = fs.readFileSync(file);
  if (file.endsWith('.csv')) return noBom(b).toString('utf8');
  const z = await JSZip.loadAsync(b);
  let t = '';
  for (const n of Object.keys(z.files).filter((x) => /\.xml$/i.test(x)).sort()) t += await z.file(n).async('string');
  return t;
}
// Excel-Zellen gleich (Text, Zelltyp, Format); Unterschiede als Liste
function gridDiff(a, b) {
  const out = [];
  for (const k of new Set([...a.keys(), ...b.keys()])) {
    const x = a.get(k);
    const y = b.get(k);
    if (!x || !y || x.text !== y.text || x.t !== y.t || x.s !== y.s) out.push(`${k}: ${x ? JSON.stringify(x) : '-'} / ${y ? JSON.stringify(y) : '-'}`);
  }
  return out;
}
const PH = /\[ANGABE-\d+\]/g;

// ---------- feste Testdateien aus 2.11.0 ----------
fs.mkdirSync(FXN, { recursive: true });
for (const ext of ['csv', 'xlsx']) {
  const out = path.join(FXN, `stammdaten-2.11.0-anonym.${ext}`);
  const key = path.join(FXN, `stammdaten-2.11.0-schluessel-${ext}.json`);
  if (fs.existsSync(out) && fs.existsSync(key)) continue;
  const a = await anonymize(path.join(FXW, `stammdaten.${ext}`), 'reversible', OLD);
  fs.copyFileSync(a.outPath, out);
  fs.copyFileSync(a.keyPath, key);
  log(`(Feste Testdatei mit 2.11.0 erzeugt: ${path.relative(here, out)})`);
}

// ---------- 1, 2, 4: stammdaten ----------
log('# Heikle Spalten: eigene Nummer je Zelle (Version 2.11.1)');
log('');
const runs = {};
for (const ext of ['csv', 'xlsx']) {
  const f = path.join(FXW, `stammdaten.${ext}`);
  const now = await anonymize(f, 'reversible');
  const old = await anonymize(f, 'reversible', OLD);
  runs[ext] = now;
  check(`stammdaten.${ext}: keine JS-Fehler`, !now.errors.length, now.errors.join(' | '));
  check(`stammdaten.${ext}: heikle Spalten gefunden`, now.perCell.length > 0, String(now.perCell.length));
  const rn = await rowsOf(now.outPath);
  const ro = await rowsOf(old.outPath);
  log('');
  log(`## 1. stammdaten.${ext}, Modus rückbaufähig: je heikler Spalte`);
  log('');
  log('| Spalte | gefüllt | leer | verschiedene Platzhalter 2.11.0 | verschiedene Platzhalter 2.11.1 | Zellen mit eigener Nummer 2.11.1 |');
  log('|---|---|---|---|---|---|');
  const bad = [];
  const allPh = [];
  for (const c of now.perCell) {
    const filled = TRUTH.rows.filter((r) => String(r[c.c]).trim() !== '').length;
    const empty = TRUTH.rows.length - filled;
    const phNew = rn.slice(1).flatMap((r) => (r[c.c] || '').match(PH) || []);
    const phOld = ro.slice(1).flatMap((r) => (r[c.c] || '').match(PH) || []);
    const dNew = new Set(phNew).size;
    const dOld = new Set(phOld).size;
    // Zelle mit eigener Nummer: hat Platzhalter, und keiner davon steht in einer anderen Zelle. Eine Excel-Zelle mit
    // mehreren formatierten Teilen hat wie bisher (seit 2.10.0) einen Platzhalter je Teil, jeder mit eigener Nummer.
    const cellsPh = rn.slice(1).map((r) => (r[c.c] || '').match(PH) || []).filter((x) => x.length);
    const multi = cellsPh.filter((x) => x.length > 1).length;
    log(`| ${c.header} | ${filled} | ${empty} | ${dOld} | ${dNew}${multi ? ` (${multi} Zelle(n) mit mehreren formatierten Teilen)` : ''} | ${cellsPh.length} |`);
    if (cellsPh.length !== filled || dNew !== phNew.length || (!multi && dNew !== filled)) bad.push(`${c.header}: ${filled} gefüllt, ${cellsPh.length} Zellen mit Platzhalter, ${dNew} verschieden (${phNew.length} Platzhalter)`);
    allPh.push(...phNew);
  }
  log('');
  check(`stammdaten.${ext}: in jeder heiklen Spalte hat jede gefüllte Zelle eigene Nummern (verschiedene Platzhalter = Platzhalter; ohne Zellen mit mehreren Teilen = gefüllte Zellen)`, !bad.length, bad.join('; '));
  const txt = await allText(now.outPath);
  const twice = allPh.filter((p) => txt.split(p).length - 1 !== 1);
  check(`stammdaten.${ext}: kein Platzhalter aus einer heiklen Spalte steht ein zweites Mal im Dokument`, !twice.length && allPh.length > 0, twice.slice(0, 5).join(', '));
  // Schlüssel: gleiches Format (formatVersion 3), mehr Einträge
  const kn = JSON.parse(fs.readFileSync(now.keyPath, 'utf8').replace(/^﻿/, ''));
  const ko = JSON.parse(fs.readFileSync(old.keyPath, 'utf8').replace(/^﻿/, ''));
  check(`stammdaten.${ext}: Schlüsseldatei im bisherigen Format (Format und formatVersion wie 2.11.0)`, kn.format === ko.format && kn.formatVersion === ko.formatVersion && kn.formatVersion === 3, `${kn.formatVersion} / ${ko.formatVersion}`);
  log(`- Schlüsseldatei: ${ko.platzhalter.length} Einträge (2.11.0) → ${kn.platzhalter.length} Einträge (2.11.1)`);
  // 4. Modi „Person A“ und „[NAME]“ gleich wie 2.11.0
  for (const mode of ['person', 'name']) {
    const a = await anonymize(f, mode);
    const b = await anonymize(f, mode, OLD);
    const same = ext === 'csv' ? fs.readFileSync(a.outPath).equals(fs.readFileSync(b.outPath)) : !gridDiff(await xlsxGrid(fs.readFileSync(a.outPath)), await xlsxGrid(fs.readFileSync(b.outPath))).length;
    check(`stammdaten.${ext}, Modus ${mode}: Ausgabe gleich wie 2.11.0${ext === 'csv' ? ' (byte-gleich)' : ' (jede Zelle)'}`, same);
  }
  // 5. zweiter Lauf: dieselbe Ausgabe
  const again = await anonymize(f, 'reversible');
  const sameRun = ext === 'csv' ? fs.readFileSync(again.outPath).equals(fs.readFileSync(now.outPath)) : !gridDiff(await xlsxGrid(fs.readFileSync(again.outPath)), await xlsxGrid(fs.readFileSync(now.outPath))).length;
  const k2 = JSON.parse(fs.readFileSync(again.keyPath, 'utf8').replace(/^﻿/, ''));
  check(`stammdaten.${ext}: zwei Läufe ergeben dieselbe Ausgabe und dieselben Platzhalter im Schlüssel`, sameRun && JSON.stringify(k2.platzhalter) === JSON.stringify(kn.platzhalter));
}

// ---------- 3. Rückbau ----------
log('');
log('## 3. Rückbau');
{
  // CSV exakt
  const origC = fs.readFileSync(path.join(FXW, 'stammdaten.csv'));
  const rc = await restore(runs.csv.outPath, runs.csv.keyPath);
  check('Rückbau CSV byte-gleich (nach der Byte-Order-Mark)', !!rc.bytes && noBom(rc.bytes).equals(origC), rc.plan && rc.plan.verdict);
  // Excel exakt
  const origX = await xlsxGrid(fs.readFileSync(path.join(FXW, 'stammdaten.xlsx')));
  const rx = await restore(runs.xlsx.outPath, runs.xlsx.keyPath);
  const dx = rx.bytes ? gridDiff(origX, await xlsxGrid(rx.bytes)) : ['keine Datei'];
  check('Rückbau Excel exakt (jede Zelle: Text, Zelltyp, Format)', !dx.length && rx.plan.verdict === 'passend', dx.slice(0, 3).join('; '));
  // Simulierte KI, CSV: zwei Datenzeilen getauscht, Text an eine Zelle einer heiklen Spalte angehängt
  const hc = runs.csv.perCell[0];
  const anonText = noBom(fs.readFileSync(runs.csv.outPath)).toString('utf8');
  const lines = anonText.split('\r\n');
  const swap = (arr, i, j) => { const t = arr[i]; arr[i] = arr[j]; arr[j] = t; };
  const rowsA = csvRows(anonText);
  const target = rowsA.findIndex((r, i) => i > 0 && /^\[ANGABE-\d+\]$/.test(r[hc.c] || ''));
  const ph = rowsA[target][hc.c];
  swap(lines, 3, 4);
  const corrected = lines.join('\r\n').replace(ph, ph + ' (geprüft)');
  const fc = path.join(outDir, 'ki-stammdaten.csv');
  fs.writeFileSync(fc, '﻿' + corrected);
  const rk = await restore(fc, runs.csv.keyPath);
  const exp = csvRows(origC.toString('utf8'));
  exp[target][hc.c] += ' (geprüft)';
  swap(exp, 3, 4);
  const got = rk.bytes ? csvRows(noBom(rk.bytes).toString('utf8')) : [];
  check(`Rückbau CSV nach simulierter KI (Zeilen 4 und 5 getauscht, „ (geprüft)“ an „${hc.header}“ angehängt): jede Zelle wie erwartet`, JSON.stringify(got) === JSON.stringify(exp), rk.plan && rk.plan.verdict);
  // Simulierte KI, Excel: Inhalte zweier Zellen einer heiklen Spalte getauscht (wie umsortiert), Text angehängt
  const hx = runs.xlsx.perCell[0];
  const z = await JSZip.loadAsync(fs.readFileSync(runs.xlsx.outPath));
  let sh = await z.file('xl/worksheets/sheet1.xml').async('string');
  const gA = await xlsxGrid(fs.readFileSync(runs.xlsx.outPath));
  const cellsH = [...gA].filter(([k, c]) => Number(k.split('|')[1]) === hx.c && Number(k.split('|')[0]) > 0 && /^\[ANGABE-\d+\]$/.test(c.text));
  const [k1, c1] = cellsH[0];
  const [k2, c2] = cellsH[1];
  sh = sh.replace(`>${c1.text}<`, '>@@1@@<').replace(`>${c2.text}<`, `>${c1.text}<`).replace('>@@1@@<', `>${c2.text}<`);
  sh = sh.replace(`>${c1.text}<`, `>${c1.text} (geprüft)<`);
  z.file('xl/worksheets/sheet1.xml', sh);
  const fx = path.join(outDir, 'ki-stammdaten.xlsx');
  fs.writeFileSync(fx, await z.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }));
  const rkx = await restore(fx, runs.xlsx.keyPath);
  const expX = new Map([...origX].map(([k, c]) => [k, { ...c }]));
  const o1 = expX.get(k1).text;
  expX.get(k1).text = expX.get(k2).text;
  expX.get(k2).text = o1 + ' (geprüft)';
  const dkx = rkx.bytes ? gridDiff(expX, await xlsxGrid(rkx.bytes)).filter((d) => !d.startsWith(k1 + ':') && !d.startsWith(k2 + ':')) : ['keine Datei'];
  const gotX = rkx.bytes ? await xlsxGrid(rkx.bytes) : new Map();
  const okCells = gotX.get(k1) && gotX.get(k2) && gotX.get(k1).text === expX.get(k1).text && gotX.get(k2).text === expX.get(k2).text;
  check(`Rückbau Excel nach simulierter KI (Zellen ${k1} und ${k2} in „${hx.header}“ getauscht, Text angehängt): beide Zellen wie erwartet, alle übrigen exakt`, !!okCells && !dkx.length, dkx.slice(0, 3).join('; '));
  // Schlüsseldatei und Ausgabe aus 2.11.0 (feste Testdateien) mit 2.11.1
  const r0c = await restore(path.join(FXN, 'stammdaten-2.11.0-anonym.csv'), path.join(FXN, 'stammdaten-2.11.0-schluessel-csv.json'));
  check('Schlüsseldatei aus 2.11.0 (CSV) baut mit 2.11.1 byte-gleich zurück', !!r0c.bytes && noBom(r0c.bytes).equals(origC), r0c.plan && r0c.plan.verdict);
  const r0x = await restore(path.join(FXN, 'stammdaten-2.11.0-anonym.xlsx'), path.join(FXN, 'stammdaten-2.11.0-schluessel-xlsx.json'));
  const d0x = r0x.bytes ? gridDiff(origX, await xlsxGrid(r0x.bytes)) : ['keine Datei'];
  check('Schlüsseldatei aus 2.11.0 (Excel) baut mit 2.11.1 exakt zurück (jede Zelle)', !d0x.length, d0x.slice(0, 3).join('; '));
}

// ---------- gemeinsame Texte (Excel) ----------
log('');
log('## Gemeinsame Texte in Excel (sharedStrings)');
{
  const origB = fs.readFileSync(path.join(FXW, 'stammdaten.xlsx'));
  const origX = await xlsxGrid(origB);
  const outX = await xlsxGrid(fs.readFileSync(runs.xlsx.outPath));
  const rx = await restore(runs.xlsx.outPath, runs.xlsx.keyPath);
  const back = rx.bytes ? await xlsxGrid(rx.bytes) : new Map();
  const shown = [];
  let pairs = 0;
  let okPairs = 0;
  for (const c of runs.xlsx.perCell) {
    // zwei Zellen der Spalte, die im Original auf denselben gemeinsamen Text zeigen
    const byShared = new Map();
    for (const [k, x] of origX) if (Number(k.split('|')[1]) === c.c && Number(k.split('|')[0]) > 0 && x.shared !== null) { if (!byShared.has(x.shared)) byShared.set(x.shared, []); byShared.get(x.shared).push(k); }
    const pair = [...byShared.values()].find((ks) => ks.length >= 2);
    if (!pair) continue;
    pairs++;
    const [k1, k2] = pair;
    const p1 = outX.get(k1).text;
    const p2 = outX.get(k2).text;
    const exact = [k1, k2].every((k) => back.get(k) && back.get(k).text === origX.get(k).text && back.get(k).t === origX.get(k).t && back.get(k).s === origX.get(k).s);
    if (p1 !== p2 && /^\[ANGABE-\d+\]$/.test(p1) && /^\[ANGABE-\d+\]$/.test(p2) && exact) okPairs++;
    if (shown.length < 3) shown.push(`„${c.header}“: ${k1} und ${k2} (gemeinsamer Text Nr. ${origX.get(k1).shared}) → ${p1} und ${p2}, zurück „${back.get(k1) && back.get(k1).text}“ und „${back.get(k2) && back.get(k2).text}“`);
  }
  for (const x of shown) log(`- Beispiel ${x}`);
  check(`stammdaten.xlsx: in jeder heiklen Spalte mit gemeinsamem Text (${pairs} Spalten) tragen zwei Zellen mit gleichem Text verschiedene Platzhalter und kommen Zelle für Zelle exakt zurück`, pairs > 0 && okPairs === pairs, `${okPairs}/${pairs}`);
}

// ---------- „Unsichere Treffer“ aus (CLAUDE.md: jede neue Regel auch so) ----------
log('');
log('## „Unsichere Treffer standardmäßig ersetzen“ aus');
for (const ext of ['csv', 'xlsx']) {
  const f = path.join(FXW, `stammdaten.${ext}`);
  const u = await anonymize(f, 'reversible', NEW, false);
  const ru = await rowsOf(u.outPath);
  const bad = [];
  const all = [];
  for (const c of u.perCell) {
    const filled = TRUTH.rows.filter((r) => String(r[c.c]).trim() !== '').length;
    const cellsPh = ru.slice(1).map((r) => (r[c.c] || '').match(PH) || []).filter((x) => x.length);
    all.push(...cellsPh.flat());
    if (cellsPh.length !== filled) bad.push(`${c.header}: ${cellsPh.length}/${filled}`);
  }
  check(`stammdaten.${ext}, „Unsichere Treffer“ aus: jede gefüllte Zelle einer heiklen Spalte hat eigene Nummern, keine doppelt`, u.perCell.length === runs[ext].perCell.length && !bad.length && new Set(all).size === all.length, bad.join('; '));
  const r = await restore(u.outPath, u.keyPath);
  const ok = ext === 'csv' ? !!r.bytes && noBom(r.bytes).equals(fs.readFileSync(f)) : !!r.bytes && !gridDiff(await xlsxGrid(fs.readFileSync(f)), await xlsxGrid(r.bytes)).length;
  check(`stammdaten.${ext}, „Unsichere Treffer“ aus: Rückbau exakt`, ok, r.plan && r.plan.verdict);
}

// ---------- Anzeige ----------
log('');
log('## Anzeige');
{
  const f = path.join(FXW, 'stammdaten.csv');
  for (const mode of ['reversible', 'person', 'name']) {
    const o = await openFile(f, mode, { confirm: false });
    const n = await o.page.$$eval('#qcard .colpercell', (els) => els.map((e) => e.textContent));
    const exp = mode === 'reversible' ? runs.csv.perCell.length : 0;
    check(`Spalten-Übersicht, Modus ${mode}: „eigene Nummer je Zelle“ bei ${exp} Spalte(n)`, n.length === exp && n.every((t) => /eigene Nummer je Zelle/i.test(t)), `${n.length}: ${n[0] || ''}`);
    // Hinweis für die KI (Text abfangen statt in die Zwischenablage)
    if (await o.page.$('#col-ok')) await o.page.click('#col-ok');
    await goTo(o.page, 'a3');
    await o.page.evaluate(() => { window.__clip = null; try { navigator.clipboard.writeText = async (t) => { window.__clip = t; }; } catch { /* nichts */ } });
    await o.page.click('#btn-kihint');
    await o.page.waitForFunction(() => window.__clip || !document.querySelector('#kihint-text').hidden, null, { timeout: 5000 }).catch(() => {});
    const t = await o.page.evaluate(() => window.__clip || document.querySelector('#kihint-text').value);
    const has = /In manchen Spalten hat jede Zelle eine eigene Nummer/.test(t || '');
    check(`Hinweis für die KI, Modus ${mode}: Satz zu eigenen Nummern ${mode === 'reversible' ? 'vorhanden' : 'fehlt'}; kein „null“/„undefined“`, has === (mode === 'reversible') && !/null|undefined/.test(t || 'null'), (t || '').slice(-200));
    await o.ctx.close();
  }
}

log('');
const ext = requests.filter((u) => !/^(file:|blob:|data:|about:)/.test(u));
check('0 Anfragen nach außen (alle Seiten dieses Laufs)', !ext.length, ext.slice(0, 3).join(', '));
await browser.close();
log('');
log(`Ergebnis: ${pass} von ${pass + fail} Prüfungen bestanden`);
fs.writeFileSync(path.join(here, 'NUMMERN-REPORT.md'), report.join('\n') + '\n');
process.exit(fail ? 1 : 0);
