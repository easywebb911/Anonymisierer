// Version 2.10.0: Tabellen – Spalten behandeln. Über die echte Oberfläche (Chromium, file://), Gegenprobe gegen main (2.9.0).
// Testdateien: tests/make-spaltenwahl.mjs (alle Daten erfunden).
// 1. Vorschläge je Spalte (stammdaten, 40 Überschriften) und Konflikte
// 2. Ohne jeden Klick außer „So übernehmen“: in jeder Spalte „Name“/„ganz ersetzen“ kein Originalwert mehr (Zelle für Zelle),
//    drei Modi, Excel und CSV; dieselbe Zahl für main; auch mit „Unsichere Treffer standardmäßig ersetzen“ aus
// 3. Paare: Kind, Erziehungsberechtigte 1 und 2 sind je Zeile drei verschiedene Personen, Vor- und Nachname gehören zusammen
// 4. Rückbau exakt (Zelltyp und Format der Zahl- und Datumszellen), locker umgeschriebene Platzhalter, alte Schlüsseldatei
//    aus 2.9.0, neue Schlüsseldatei in 2.9.0 (klar abgelehnt)
// 5. Weg-Gleichheit: Spalte auf „wie bisher“ und zurück = nie umgestellt; alle Spalten „wie bisher“ = Ausgabe von main
// 6. Kein stilles Speichern (Punkt „Die Spalten sind noch nicht geprüft“); Formel und verbundene Zellen als Punkt
// 7. Vorhandene Tabellen-Testdateien: Vorschläge je Spalte
// dazu: Merkliste (nur Überschrift), Tabellen-Ansicht, Sammelfrage/Schlusscheck, kein „null“/„undefined“, 0 Anfragen nach außen
// Aufruf: node tests/spaltenwahl-test.mjs <index.html von main (2.10.0)>
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import JSZip from 'jszip';
import { startAnon, loadIn, goTo, ackPoints, saveKey, exportWithAck, rbConfirm, savePoints, waitCheck } from './ui-helpers.mjs';
import { FXW, HEADERS, EXPECT, EXPECT_MAIN, makeAll } from './make-spaltenwahl.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const NEW = path.join(root, 'index.html');
const MAIN = path.resolve(process.argv[2] || path.join(here, 'out-alt', 'index-2.10.0.html'));
if (!fs.existsSync(MAIN)) { console.error('Bitte Pfad zur index.html von main (2.10.0) angeben.'); process.exit(2); }
if (!process.env.ANON_FIXTURES_FERTIG) await makeAll();
const outDir = path.join(here, 'out-spaltenwahl');
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

// ---------- Oberfläche ----------
async function newPage(html = NEW, ctx0 = null) {
  const ctx = ctx0 || await browser.newContext({ acceptDownloads: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on('request', (r) => requests.push(r.url()));
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('dialog', (d) => d.accept());
  await page.goto('file://' + html);
  return { page, ctx, errors };
}
async function setUnsure(page, on) {
  if (await page.isHidden('#advanced')) await page.click('#tgl-adv');
  if ((await page.isChecked('#opt-unsureOn')) !== on) await page.click('#opt-unsureOn');
}
// Datei laden (Modus, ggf. „Unsichere Treffer“ aus), zum Prüfen gehen; confirm: „So übernehmen“ klicken (nur neue Version)
async function openFile(file, mode, { html = NEW, unsure = true, confirm = true, ctx = null } = {}) {
  const o = await newPage(html, ctx);
  await startAnon(o.page, mode);
  if (!unsure) await setUnsure(o.page, false);
  await loadIn(o.page, file);
  await goTo(o.page, 'a2');
  if (confirm && await o.page.$('#col-ok')) await o.page.click('#col-ok');
  return o;
}
// Speichern (rückbaufähig: zuerst die Schlüsseldatei); liefert Pfade
async function save(o, ext, mode) {
  const { page } = o;
  await goTo(page, 'a3');
  await ackPoints(page);
  let keyPath = null;
  if (mode === 'reversible') {
    const kd = await saveKey(page);
    keyPath = path.join(outDir, `k${++seq}-${kd.suggestedFilename()}`);
    await kd.saveAs(keyPath);
  }
  const r = await exportWithAck(page, ext);
  const outPath = path.join(outDir, `a${++seq}-${r.dl.suggestedFilename()}`);
  await r.dl.saveAs(outPath);
  return { outPath, keyPath };
}
async function anonymize(file, mode, opts = {}) {
  const o = await openFile(file, mode, opts);
  if (opts.before) await opts.before(o.page);
  const r = await save(o, path.extname(file).slice(1), mode);
  const errors = o.errors;
  await o.ctx.close();
  return { ...r, errors };
}
async function restore(file, key, html = NEW) {
  const { page, ctx, errors } = await newPage(html);
  await page.click('#go-restore');
  await page.setInputFiles('#rb-file', file);
  await page.waitForFunction(() => document.querySelector('#rb-file-status').textContent);
  await page.setInputFiles('#rb-key', key);
  await page.waitForFunction(() => document.querySelector('#rb-key-status').textContent);
  const keyStatus = await page.textContent('#rb-key-status');
  await page.click('#rb-btn-check', { timeout: 3000 }).catch(() => {});
  const plan = await page.evaluate(() => { const p = window.__anon.rb.plan; return p ? { verdict: p.verdict, issues: p.issues.map((x) => ({ text: x.text.trim(), vermutlich: x.vermutlich })), bad: p.rows.filter((r) => r.status !== 'ok').map((r) => `${r.platzhalter} ${r.erwartet}→${r.gefunden}`) } : null; });
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
  return { bytes, plan, keyStatus, errors };
}

// ---------- Zellen lesen (ohne Browser) ----------
const dec = (x) => x.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
const colNum = (c) => { let n = 0; for (const ch of c) n = n * 26 + (ch.charCodeAt(0) - 64); return n; };
// Excel: Zelle -> {t, s, v, f, text, runs}; Zeile/Spalte ab 0
async function xlsxGrid(bytes) {
  const z = await JSZip.loadAsync(bytes);
  const ssx = z.file('xl/sharedStrings.xml') ? await z.file('xl/sharedStrings.xml').async('string') : '';
  const si = [...ssx.matchAll(/<si>([\s\S]*?)<\/si>|<si\/>/g)].map((m) => m[1] || '');
  const textOf = (x) => dec([...x.matchAll(/<t(?:\s[^>]*)?>([^<]*)<\/t>/g)].map((m) => m[1]).join(''));
  const runsOf = (x) => [...x.matchAll(/<r>([\s\S]*?)<\/r>/g)].map((m) => m[1].replace(/<t(?:\s[^>]*)?>/, '<t>'));
  const sh = await z.file('xl/worksheets/sheet1.xml').async('string');
  const grid = new Map();
  for (const m of sh.matchAll(/<c r="([A-Z]+)(\d+)"((?:\s[^>]*?)?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
    const attrs = m[3] || '';
    const inner = m[4] || '';
    const t = (attrs.match(/\st="(\w+)"/) || [])[1] || null;
    const s = (attrs.match(/\ss="(\d+)"/) || [])[1] || null;
    const v = (inner.match(/<v>([^<]*)<\/v>/) || [])[1];
    const f = (inner.match(/<f>([^<]*)<\/f>/) || [])[1];
    let text;
    let runs = [];
    if (t === 's') { text = textOf(si[Number(v)]); runs = runsOf(si[Number(v)]); } else if (t === 'inlineStr') { text = textOf(inner); runs = runsOf(inner); } else text = dec(v || '');
    grid.set((Number(m[2]) - 1) + '|' + (colNum(m[1]) - 1), { t, s, v: v === undefined ? null : dec(v), f: f === undefined ? null : dec(f), text, runs });
  }
  return grid;
}
// CSV (Semikolon, Anführungszeichen) -> Zeilen
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
async function outRows(file) {
  const b = fs.readFileSync(file);
  if (file.endsWith('.csv')) return csvRows(b.toString('utf8').replace(/^﻿/, ''));
  const g = await xlsxGrid(b);
  const rows = [];
  for (const [k, c] of g) { const [r, cc] = k.split('|').map(Number); (rows[r] = rows[r] || [])[cc] = c.text; }
  return Array.from(rows, (r) => Array.from({ length: HEADERS.length }, (_, i) => (r && r[i] !== undefined ? r[i] : '')));
}

// Zellen aller Blätter (Blatt-Nummer|Zelle -> Text) und aller CSV-Zeilen (Zeile|Spalte -> Text); Wörter einer Zelle
async function xlsxCells(bytes) {
  const z = await JSZip.loadAsync(bytes);
  const ssx = z.file('xl/sharedStrings.xml') ? await z.file('xl/sharedStrings.xml').async('string') : '';
  const si = [...ssx.matchAll(/<si>([\s\S]*?)<\/si>|<si\/>/g)].map((m) => m[1] || '');
  const textOf = (x) => dec([...x.matchAll(/<t(?:\s[^>]*)?>([^<]*)<\/t>/g)].map((m) => m[1]).join(''));
  const out = new Map();
  for (const n of Object.keys(z.files).filter((x) => /^xl\/worksheets\/sheet\d+\.xml$/.test(x)).sort()) {
    const sh = await z.file(n).async('string');
    for (const m of sh.matchAll(/<c r="([A-Z]+\d+)"((?:\s[^>]*?)?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const t = ((m[2] || '').match(/\st="(\w+)"/) || [])[1];
      const inner = m[3] || '';
      const v = (inner.match(/<v>([^<]*)<\/v>/) || [])[1];
      out.set(n + '|' + m[1], t === 's' ? textOf(si[Number(v)] || '') : t === 'inlineStr' ? textOf(inner) : dec(v || ''));
    }
  }
  return out;
}
function csvCells(text) {
  const out = new Map();
  csvRows(text).forEach((r, ri) => r.forEach((c, ci) => out.set(ri + '|' + ci, c)));
  return out;
}
// Blattname -> Teil der Datei (xl/worksheets/sheetN.xml) über die Arbeitsmappe
async function sheetFiles(bytes) {
  const z = await JSZip.loadAsync(bytes);
  if (!z.file('xl/workbook.xml') || !z.file('xl/_rels/workbook.xml.rels')) return {}; // Teile an ungewöhnlicher Stelle (pfade-Testdateien)
  const wb = await z.file('xl/workbook.xml').async('string');
  const rels = await z.file('xl/_rels/workbook.xml.rels').async('string');
  const out = {};
  for (const m of wb.matchAll(/<sheet [^>]*name="([^"]*)"[^>]*r:id="([^"]*)"/g)) {
    const t = (rels.match(new RegExp(`Id="${m[2]}"[^>]*Target="([^"]*)"`)) || rels.match(new RegExp(`Target="([^"]*)"[^>]*Id="${m[2]}"`)) || [])[1];
    if (t) out[dec(m[1])] = 'xl/' + t.replace(/^\/?xl\//, '');
  }
  return out;
}
const colL = (i) => { let s = ''; let n = i + 1; while (n > 0) { const r = (n - 1) % 26; s = String.fromCharCode(65 + r) + s; n = Math.floor((n - 1) / 26); } return s; };
const words = (t) => new Set(String(t).split(/[^\p{L}\p{N}]+/u).filter((w) => w.length >= 2 && /\p{L}/u.test(w)));
// Originalwert noch in der Zelle? Name: jeder Name (Teile getrennt durch | ; / „und“, ohne Füllwerte) als ganzes Wort;
// ganz ersetzen: der ganze Zellwert als Text in der Zelle
const FILL = new Set(['keine', '–', 'n.n.', '-', '']);
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function leftover(orig, out, treat) {
  const o = String(orig).trim();
  if (!o) return false;
  if (treat === 'name') {
    const parts = o.split(/\s*(?:[|;/]|\bund\b)\s*/).map((x) => x.trim()).filter((x) => x && !FILL.has(x.toLowerCase()));
    return parts.some((p) => new RegExp(`(^|[^\\p{L}\\p{N}])${esc(p)}($|[^\\p{L}\\p{N}])`, 'iu').test(out));
  }
  // ganz ersetzen: ein Teil des Originalwerts genügt (jedes Wort ab 3 Zeichen, jede Zahl ab 2 Ziffern, als ganzes Wort).
  // Platzhalter selbst zählen nicht („[ADRESSE-2]“ enthält die Hausnummer „2“ nicht)
  const rest = String(out).replace(/\[[A-Z-]+(?:-\d+)?\]|(?:Person|Vorname|Nachname|Name|Initiale|Einrichtung) [A-Z]{1,3}\d*/g, ' ');
  if (rest.trim() === o) return true;
  const toks = o.split(/[^\p{L}\p{N}]+/u).filter((t) => t.length >= 3 || /^\d{2,}$/.test(t));
  return toks.some((t) => new RegExp(`(^|[^\\p{L}\\p{N}])${esc(t)}($|[^\\p{L}\\p{N}])`, 'u').test(rest));
}
// Zählung je Spalte: „Name“/„ganz ersetzen“ = Zellen mit Originalwert; lesbare Spalte = Zellen mit einem seltenen Wert
// (weniger als 3-mal) im Klartext und Zellen, die lesbar geblieben sind
const RARE = {};
HEADERS.forEach((hd, ci) => { const c = new Map(); for (const r of TRUTH.rows) if (String(r[ci]).trim()) c.set(r[ci], (c.get(r[ci]) || 0) + 1); RARE[hd] = c; });
async function plainCount(file) {
  const rows = await outRows(file);
  const per = {};
  HEADERS.forEach((hd, ci) => {
    const e = EXPECT[hd];
    let n = 0;
    let rare = 0;
    let kept = 0;
    TRUTH.rows.forEach((r, ri) => {
      const o = String(r[ci]).trim();
      if (!o) return;
      const out = (rows[ri + 1] || [])[ci] || '';
      if (e === 'bisher') { if (out === o) { kept++; if (RARE[hd].get(r[ci]) < 3) rare++; } return; }
      if (leftover(r[ci], out, e === 'name' ? 'name' : 'ganz')) n++;
    });
    per[hd] = e === 'bisher' ? { rare, kept } : n;
  });
  // Kopfzeile unverändert?
  per.__head = (rows[0] || []).join('\u0001') === HEADERS.join('\u0001');
  return per;
}
// ======================================================================================================
log('# Tabellen: Spalten behandeln (Version 2.10.0) und Personen-Tabellen (Version 2.11.0)');
log('');
log(`Neue Version: index.html; Gegenprobe: main (2.10.0), ${path.relative(root, MAIN)}. Nur Chromium, Firefox prüft Easy. Alle Daten erfunden.`);
log('');

// ---------- 1. Vorschläge ----------
log('## 1. Vorschlag anhand der Überschrift (stammdaten.xlsx und stammdaten.csv)');
const planOf = async (file) => {
  const o = await openFile(file, 'person', { confirm: false });
  const p = await o.page.evaluate(() => window.__anon.app.result.colPlan.map((c) => ({ id: c.id, header: c.header, treat: c.treat, kind: c.kind, groups: c.proposal.groups, conflict: c.proposal.conflict, why: c.proposal.why || '', person: c.person })));
  const ui = await o.page.$$eval('#qcard .colrow', (els) => els.map((e) => ({ col: e.dataset.col, sel: e.querySelector('select').value, text: e.innerText.replace(/\s+/g, ' ') })));
  await o.ctx.close();
  return { p, ui };
};
for (const f of ['stammdaten.xlsx', 'stammdaten.csv']) {
  const { p, ui } = await planOf(path.join(FXW, f));
  const got = Object.fromEntries(p.map((c) => [c.header, c.treat === 'ganz' ? 'ganz:' + c.kind : c.treat]));
  const wrong = HEADERS.filter((hd) => got[hd] !== EXPECT[hd]);
  const N = HEADERS.length;
  check(`${f}: Vorschlag für alle ${N} Spalten wie erwartet (Personen-Tabelle)`, p.length === N && !wrong.length, wrong.map((hd) => `${hd}: ${got[hd]} statt ${EXPECT[hd]}`).join('; '));
  check(`${f}: Übersicht zeigt jede Spalte mit gewählter Behandlung (Auswahl = Vorschlag)`, ui.length === N && ui.every((u) => { const c = p.find((x) => x.id === u.col); return c && u.sel === c.treat; }));
  if (f.endsWith('.xlsx')) {
    log('');
    log('| Spalte | Vorschlag main (2.10.0) | Vorschlag jetzt | Grund |');
    log('|---|---|---|---|');
    const lab = (x) => (x === 'name' ? 'Name' : x === 'bisher' ? 'lesbar (wie bisher)' : 'ganz ersetzen (' + x.split(':')[1] + ')');
    for (const c of p) log(`| ${c.header} | ${lab(EXPECT_MAIN[c.header])} | ${lab(got[c.header])} | ${c.why || c.groups.join(' + ') || '–'}${c.conflict ? ' (Konflikt)' : ''} |`);
    log('');
    log(`Konflikte: ${p.filter((c) => c.conflict).map((c) => `„${c.header}“ (${c.groups.join(' + ')} → ${c.kind})`).join('; ') || 'keine'}`);
    const geb = ui.find((u) => /Geburtsdatum/.test(u.text));
    check(`${f}: Zahl der gefüllten Zellen zählt auch Datums- und Zahlzellen (Geburtsdatum 60)`, !!geb && /60 Zellen gefüllt/.test(geb.text), geb ? geb.text : '');
    const nRead = HEADERS.filter((hd) => EXPECT[hd] === 'bisher').length;
    check(`${f}: Personen-Tabelle: ersetzte Spalten oben, lesbare Spalten darunter NICHT eingeklappt, je mit ihren Werten`, await (async () => {
      const o = await openFile(path.join(FXW, f), 'person', { confirm: false });
      const r = await o.page.evaluate(() => ({ top: [...document.querySelectorAll('#qcard > ul.collist:not(.lesbar) .colrow')].map((e) => e.querySelector('select').value),
        read: [...document.querySelectorAll('#qcard ul.collist.lesbar .colrow')].map((e) => ({ v: e.querySelector('select').value, vals: (e.querySelector('.colvals') || {}).textContent || '' })),
        details: document.querySelectorAll('#qcard details').length, rareOpt: !!document.querySelector('#col-rare:checked'), text: document.querySelector('#qcard').innerText }));
      await o.ctx.close();
      log(`  (oben ${r.top.length}, lesbar ${r.read.length}, eingeklappt ${r.details}; Schalter „Seltene Werte“ an: ${r.rareOpt})`);
      log('');
      log('Lesbare Spalten, wie der Nutzer sie sieht:');
      for (const x of r.read) log(`- ${x.vals}`);
      log('');
      return r.top.length === N - nRead && r.top.every((v) => v !== 'bisher') && r.read.length === nRead && r.read.every((x) => x.v === 'bisher' && /^Bleibt lesbar: .+ \d+/.test(x.vals)) && !r.details && r.rareOpt && !/\bnull\b|\bundefined\b/.test(r.text);
    })());
  }
}

// ---------- 2. Ziel: kein Originalwert ----------
log('');
log('## 2. Ohne jeden Klick außer „So übernehmen“: Klartext-Zellen je Spalte (Excel und CSV, drei Modi)');
const table = {}; // Spalte -> Lauf -> {main, now}
for (const f of ['stammdaten.xlsx', 'stammdaten.csv']) {
  for (const mode of ['person', 'name', 'reversible']) {
    const a = await anonymize(path.join(FXW, f), mode);
    const per = await plainCount(a.outPath);
    const bad = HEADERS.filter((hd) => EXPECT[hd] !== 'bisher' && per[hd]);
    check(`${f}, ${mode}: keine Zelle mit Originalwert in Spalten „Name“/„ganz ersetzen“`, !bad.length, bad.map((hd) => `${hd}: ${per[hd]}`).join('; '));
    const rareLeft = HEADERS.filter((hd) => EXPECT[hd] === 'bisher' && per[hd].rare);
    check(`${f}, ${mode}: kein seltener Wert (weniger als 3-mal) in einer lesbaren Spalte`, !rareLeft.length, rareLeft.map((hd) => `${hd}: ${per[hd].rare}`).join('; '));
    check(`${f}, ${mode}: Kopfzeile unverändert`, per.__head);
    check(`${f}, ${mode}: keine JS-Fehler`, !a.errors.length, a.errors.join(' | '));
    const m = await anonymize(path.join(FXW, f), mode, { html: MAIN });
    const pm = await plainCount(m.outPath);
    for (const hd of HEADERS) { table[hd] = table[hd] || {}; table[hd][`${f}|${mode}`] = { main: pm[hd], now: per[hd] }; }
  }
  // „Unsichere Treffer standardmäßig ersetzen“ aus (CLAUDE.md: jede neue Regel auch so)
  const u = await anonymize(path.join(FXW, f), 'person', { unsure: false });
  const pu = await plainCount(u.outPath);
  const bu = HEADERS.filter((hd) => (EXPECT[hd] !== 'bisher' ? pu[hd] : pu[hd].rare));
  check(`${f}, „Unsichere Treffer“ aus: keine Originalwerte in ersetzten Spalten, kein seltener Wert`, !bu.length, bu.join('; '));
}
// csv: Kopfzeile byte-gleich
{
  const a = await anonymize(path.join(FXW, 'stammdaten.csv'), 'reversible');
  const first = (b) => b.toString('utf8').replace(/^\uFEFF/, '').split(/\r?\n/)[0];
  check('stammdaten.csv: Kopfzeile byte-gleich mit dem Original', first(fs.readFileSync(a.outPath)) === first(fs.readFileSync(path.join(FXW, 'stammdaten.csv'))));
}
log('');
log('Zellen mit Klartext (von 60) je Spalte, main → jetzt; Lauf: Excel „Person A“ (alle 6 Läufe gleich, siehe Prüfungen). Bei lesbaren Spalten: lesbare Zellen und davon seltene Werte.');
log('');
log('| Spalte | Vorschlag main | Vorschlag jetzt | Klartext main | Klartext jetzt |');
log('|---|---|---|---|---|');
const fmtN = (x) => (typeof x === 'object' ? `${x.kept} lesbar, ${x.rare} selten` : String(x));
const labT = (x) => (x === 'name' ? 'Name' : x === 'bisher' ? 'lesbar' : 'ganz ' + x.split(':')[1]);
let sumMain = 0;
let sumNow = 0;
for (const hd of HEADERS) {
  const x = table[hd]['stammdaten.xlsx|person'];
  // main: Klartext-Zellen wie in 2.10.0 gezählt (ganz oder teilweise), auch für Spalten, die jetzt lesbar sind
  log(`| ${hd} | ${labT(EXPECT_MAIN[hd])} | ${labT(EXPECT[hd])} | ${fmtN(x.main)} | ${fmtN(x.now)} |`);
  for (const k of Object.keys(table[hd])) { const y = table[hd][k]; if (typeof y.now === 'number') { sumNow += y.now; sumMain += y.main; } else { sumNow += y.now.rare; sumMain += y.main.rare; } }
}
log('');
log(`Summe über alle 6 Läufe (ersetzte Spalten: Zellen mit Originalwert; lesbare Spalten: seltene Werte im Klartext): main ${sumMain}, jetzt ${sumNow}.`);
check('Gegenprobe: main lässt Originalwerte bzw. seltene Werte stehen (der Test erkennt sie)', sumMain > 0, `main ${sumMain}`);

// ---------- 3. Paare ----------
log('');
log('## 3. Paare: Kind, Erziehungsberechtigte 1 und 2 je Zeile drei Personen');
for (const f of ['stammdaten.xlsx', 'stammdaten.csv']) {
  for (const mode of ['person', 'reversible']) {
    const a = await anonymize(path.join(FXW, f), mode);
    const rows = await outRows(a.outPath);
    const ix = (hd) => HEADERS.indexOf(hd);
    const letter = (s) => { const m = String(s).match(/^(?:Person|Vorname|Nachname|Name) ([A-Z]+)\d*$/); return m ? m[1] : null; };
    let okRows = 0;
    const bad = [];
    TRUTH.rows.forEach((r, ri) => {
      const o = rows[ri + 1] || [];
      const kid = ['Nachname', 'Rufname', 'Vornamen laut Geburtsurkunde'].map((hd) => letter(o[ix(hd)]));
      const e1 = ['1. Erziehungsberechtigte/r Nachname', '1. Erziehungsberechtigte/r Vorname'].map((hd) => letter(o[ix(hd)]));
      const has2 = !!r[ix('2. Erziehungsberechtigte/r Nachname')];
      const e2 = has2 ? ['2. Erziehungsberechtigte/r Nachname', '2. Erziehungsberechtigte/r Vorname'].map((hd) => letter(o[ix(hd)])) : [];
      const groups = [kid, e1, ...(has2 ? [e2] : [])];
      const same = groups.every((g) => g.every((x) => x && x === g[0]));
      const distinct = new Set(groups.map((g) => g[0])).size === groups.length;
      if (same && distinct) okRows++; else bad.push(`Zeile ${ri + 2}: ${groups.map((g) => g.join('/')).join(' | ')}`);
    });
    check(`${f}, ${mode}: je Zeile Kind, EB 1 (und EB 2) je eine Person (gleicher Buchstabe im Paar, verschiedene Personen)`, okRows === TRUTH.rows.length, `${okRows}/${TRUTH.rows.length} ${bad.slice(0, 3).join('; ')}`);
  }
}

// ---------- 4. Rückbau ----------
log('');
log('## 4. Rückbau (Excel: Wert, Zelltyp, Format; CSV: byte-gleich)');
const cellsEqual = (g1, g2) => {
  const diff = [];
  for (const [k, a] of g1) {
    const b = g2.get(k);
    if (!b) { diff.push(`${k} fehlt`); continue; }
    if (a.text !== b.text) diff.push(`${k}: „${b.text}“ statt „${a.text}“`);
    const ta = a.t === 's' || a.t === 'inlineStr' ? 'text' : a.t || 'n';
    const tb = b.t === 's' || b.t === 'inlineStr' ? 'text' : b.t || 'n';
    if (ta !== tb) diff.push(`${k}: Zelltyp ${b.t} statt ${a.t}`);
    if (a.s !== b.s) diff.push(`${k}: Format ${b.s} statt ${a.s}`);
    if (ta !== 'text' && a.v !== b.v) diff.push(`${k}: Wert ${b.v} statt ${a.v}`);
    if (JSON.stringify(a.runs) !== JSON.stringify(b.runs)) diff.push(`${k}: Textläufe anders`);
  }
  for (const k of g2.keys()) if (!g1.has(k)) diff.push(`${k} zusätzlich`);
  return diff;
};
const origX = await xlsxGrid(fs.readFileSync(path.join(FXW, 'stammdaten.xlsx')));
// CSV: das Tool schreibt wie bisher mit Byte-Order-Mark (BOM); verglichen wird der Inhalt danach Byte für Byte
const noBom = (b) => (b && b[0] === 0xef && b[1] === 0xbb && b[2] === 0xbf ? b.subarray(3) : b);
const origC = fs.readFileSync(path.join(FXW, 'stammdaten.csv'));
const nums = [...origX.values()].filter((c) => !c.t && c.v !== null);
log(`Original (Excel): ${nums.length} Zahl- und Datumszellen, davon ${nums.filter((c) => c.s === '1').length} mit Datumsformat.`);
const revX = await anonymize(path.join(FXW, 'stammdaten.xlsx'), 'reversible');
const keyX = JSON.parse(fs.readFileSync(revX.keyPath, 'utf8').replace(/^﻿/, ''));
const cats = {};
for (const e of keyX.platzhalter) cats[e.kategorie] = (cats[e.kategorie] || 0) + 1;
log(`Schlüsseldatei (Excel): Format-Version ${keyX.formatVersion}, ${keyX.platzhalter.length} Platzhalter (${Object.entries(cats).map(([k, n]) => `${k} ${n}`).join(', ')}), davon mit Zelltyp: ${keyX.platzhalter.filter((e) => e.zelle).length}`);
check('Schlüsseldatei mit den neuen Arten hat Format-Version 3', keyX.formatVersion === 3);
const anonX = await xlsxGrid(fs.readFileSync(revX.outPath));
const geb = [...anonX.entries()].filter(([k]) => k.endsWith('|4') && !k.startsWith('0|')).map(([, c]) => c);
check('Anonymisiert: Datumszellen sind Text-Platzhalter mit unverändertem Format (Stil)', geb.length === TRUTH.rows.length && geb.every((c) => c.t === 'inlineStr' && /^\[DATUM-\d+\]$/.test(c.text) && c.s === '1'), geb.slice(0, 2).map((c) => `${c.t} ${c.text} s=${c.s}`).join('; '));
const sharedLeft = await (async () => { const z = await JSZip.loadAsync(fs.readFileSync(revX.outPath)); const ss = await z.file('xl/sharedStrings.xml').async('string'); return ['Öztürk', 'Asthma', 'Gaziantep', 'Lindenweg', 'Notfallspray'].filter((w) => ss.includes(w)); })();
check('Anonymisiert: kein Originalwert der ersetzten Spalten in der gemeinsamen Textliste (sharedStrings)', !sharedLeft.length, sharedLeft.join(', '));
const rx = await restore(revX.outPath, revX.keyPath);
const backX = rx.bytes ? await xlsxGrid(rx.bytes) : new Map();
const dx = cellsEqual(origX, backX);
check('Rückbau Excel exakt: jede Zelle mit Wert, Zelltyp, Format (Stil) und Textläufen', !!rx.bytes && !dx.length && rx.plan.verdict === 'passend', `${dx.length} Abweichungen ${dx.slice(0, 5).join('; ')}; Urteil ${rx.plan && rx.plan.verdict}`);
// LibreOffice öffnet Ausgabe und Rückbau; Rückbau zeigt dieselben Werte wie das Original (auch Datum als Datum)
function libreOffice(bytes) {
  const t = fs.mkdtempSync(path.join(os.tmpdir(), 'lo-'));
  const f = path.join(t, 'datei.xlsx');
  fs.writeFileSync(f, bytes);
  try {
    execFileSync('soffice', ['--headless', '-env:UserInstallation=file://' + t + '/p', '--convert-to', 'csv', '--outdir', t, f], { stdio: 'pipe', timeout: 120000 });
    const o = path.join(t, 'datei.csv');
    return fs.existsSync(o) ? fs.readFileSync(o, 'utf8') : null;
  } catch { return null; } finally { fs.rmSync(t, { recursive: true, force: true }); }
}
{
  const lo0 = libreOffice(fs.readFileSync(path.join(FXW, 'stammdaten.xlsx')));
  const lo1 = libreOffice(fs.readFileSync(revX.outPath));
  const lo2 = rx.bytes ? libreOffice(rx.bytes) : null;
  const row1 = lo1 ? lo1.split('\n')[1] || '' : '';
  check('LibreOffice öffnet die anonymisierte Datei (Datumsspalte zeigt den Platzhalter)', !!lo1 && /\[DATUM-1\]/.test(row1), row1.slice(0, 120));
  check('LibreOffice: Rückbau zeigt dieselben Werte wie das Original (auch Datum und Zahlen)', !!lo0 && lo0 === lo2, lo0 ? (lo0.split('\n')[1] || '').slice(0, 120) : 'nicht geöffnet');
}
const richBack = backX.get('4|11');
check('Rückbau Excel: Zelle mit gemischter Formatierung hat wieder zwei Textläufe (der zweite fett)', !!richBack && richBack.runs.length === 2 && /<b\/>/.test(richBack.runs[1]), richBack ? richBack.runs.join(' | ') : '');
const revC = await anonymize(path.join(FXW, 'stammdaten.csv'), 'reversible');
const rc = await restore(revC.outPath, revC.keyPath);
check('Rückbau CSV byte-gleich (nach der Byte-Order-Mark)', !!rc.bytes && noBom(rc.bytes).equals(origC), rc.plan && rc.plan.verdict);
// locker umgeschrieben (Muster traeger-test/roundtrip): [DATUM-1] -> [Datum 1], [ANGABE-2] -> [Angabe-2]
const loosen = (s) => s.replace(/\[DATUM-(\d+)\]/, '[Datum $1]').replace(/\[ANGABE-(\d+)\]/, '[Angabe-$1]');
async function rewrite(p, fn, tag) {
  const q = p.replace(/(\.\w+)$/, `-${tag}$1`);
  if (p.endsWith('.csv')) { fs.writeFileSync(q, fn(fs.readFileSync(p, 'utf8'))); return q; }
  const z = await JSZip.loadAsync(fs.readFileSync(p));
  z.file('xl/worksheets/sheet1.xml', fn(await z.file('xl/worksheets/sheet1.xml').async('string')));
  fs.writeFileSync(q, await z.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }));
  return q;
}
for (const [label, rev, orig] of [['Excel', revX, null], ['CSV', revC, origC]]) {
  const loose = await rewrite(rev.outPath, loosen, 'locker');
  const r2 = await restore(loose, rev.keyPath);
  const want = ['[Datum ', '[Angabe-'];
  const rep = want.map((w) => r2.plan.issues.find((x) => x.text.startsWith(w)));
  check(`${label}: locker umgeschriebene Platzhalter erkannt und gemeldet („gemeint vermutlich“), nicht geraten`, rep.every((x) => x && /^\[(DATUM|ANGABE)-\d+\]$/.test(x.vermutlich)),
    rep.map((x, i) => `${want[i]}… → ${x ? x.vermutlich : 'nicht gemeldet'}`).join('; '));
  const fixed = await rewrite(loose, (s) => rep.reduce((a, x) => (x ? a.split(x.text).join(x.vermutlich) : a), s), 'korrigiert');
  const r3 = await restore(fixed, rev.keyPath);
  const exact = orig ? !!r3.bytes && noBom(r3.bytes).equals(orig) : !!r3.bytes && !cellsEqual(origX, await xlsxGrid(r3.bytes)).length;
  check(`${label}: nach Korrektur wie vorgeschlagen Rückbau exakt (auch Zelltyp und Format)`, exact, r3.plan && r3.plan.verdict);
}
// alte Schlüsseldatei aus main (2.10.0) baut mit der neuen Version exakt zurück (gleiche Testdatei, in main anonymisiert)
for (const [f, label] of [['stammdaten.csv', 'CSV'], ['stammdaten.xlsx', 'Excel']]) {
  const m = await anonymize(path.join(FXW, f), 'reversible', { html: MAIN });
  const k = JSON.parse(fs.readFileSync(m.keyPath, 'utf8').replace(/^﻿/, ''));
  const r = await restore(m.outPath, m.keyPath);
  const exact = f.endsWith('.csv') ? !!r.bytes && noBom(r.bytes).equals(origC) : !!r.bytes && !cellsEqual(origX, await xlsxGrid(r.bytes)).length;
  check(`${label}: Schlüsseldatei aus 2.10.0 (Format-Version ${k.formatVersion}) baut mit 2.11.0 exakt zurück`, exact, r.plan && r.plan.verdict);
}
// Kollisions-Schutz: „[DATUM-1]“/„[ANGABE-2]“ schon im Original -> das Tool vergibt die nächste freie Nummer, Rückbau exakt
{
  const f = path.join(FXW, 'kollision-datum.csv');
  const a = await anonymize(f, 'reversible');
  const k = JSON.parse(fs.readFileSync(a.keyPath, 'utf8').replace(/^\uFEFF/, ''));
  const phs = k.platzhalter.map((e) => e.platzhalter);
  const r = await restore(a.outPath, a.keyPath);
  check('Kollisions-Schutz: „[DATUM-1]“ und „[ANGABE-2]“ aus dem Original nicht vergeben, im Schlüssel als „imOriginal“', !phs.includes('[DATUM-1]') && !phs.includes('[ANGABE-2]') && phs.includes('[DATUM-2]') && (k.imOriginal || []).some((x) => x.text === '[DATUM-1]'), phs.join(', '));
  check('Kollisions-Schutz: Rückbau exakt (die Wörter aus dem Original bleiben)', !!r.bytes && noBom(r.bytes).equals(fs.readFileSync(f)), r.plan && r.plan.verdict);
}
// „Nachname, Vorname“ in einer Spalte „Name“ = dieselbe Person wie „Vorname Nachname“ daneben (Guardian-Lauf 1, Fund 2)
{
  const a = await anonymize(path.join(FXW, 'komma.csv'), 'person');
  const rows = csvRows(fs.readFileSync(a.outPath, 'utf8').replace(/^\uFEFF/, ''));
  // Version 2.11.0: dieselbe Person steht in der Titelzeile (Text wie bisher), die Tabelle ist eine Personen-Tabelle
  check('„Berger, Tilda“ und „Quandt, Hauke“ (Spalte „Name“) sind dieselben Personen wie „Tilda Berger“ und „Hauke Quandt“ in der Titelzeile', rows[0] && rows[0][0] === `Liste für ${rows[2][0]} und ${rows[3][0]}` && /^Person [A-Z]$/.test(rows[2][0]) && rows[2][0] !== rows[3][0], rows.slice(0, 4).map((r) => r.join(';')).join(' | '));
}

// ---------- 5. Weg-Gleichheit ----------
log('');
log('## 5. Weg-Gleichheit');
const bytesOf = async (file, mode, before, html = NEW) => { const a = await anonymize(file, mode, { before, html }); return fs.readFileSync(a.outPath); };
const setSel = (col, v) => async (page) => {
  if (await page.isVisible('#col-change')) await page.click('#col-change');
  await page.waitForSelector(`#qcard select[data-col="${col}"]`, { state: 'attached' });
  // Spalte „wie bisher“: Liste darunter aufklappen (wie ein Mensch)
  if (!(await page.isVisible(`#qcard select[data-col="${col}"]`))) await page.click('#qcard details.colrest > summary');
  await page.selectOption(`#qcard select[data-col="${col}"]`, v);
  await page.waitForFunction((c) => { const r = window.__anon.app.result; const x = r && r.colPlan.find((y) => y.id === c); return document.querySelector(`#qcard select[data-col="${c}"]`) && x; }, col);
};
for (const f of ['stammdaten.xlsx', 'stammdaten.csv']) {
  const t = f.endsWith('.xlsx') ? 'x|Schüler' : 'csv';
  const never = await bytesOf(path.join(FXW, f), 'person');
  const col = `${t}|${HEADERS.indexOf('Erläuterung')}`;
  const col2 = `${t}|${HEADERS.indexOf('Nachname')}`;
  const back = await bytesOf(path.join(FXW, f), 'person', async (page) => {
    for (const [c, v] of [[col, 'bisher'], [col2, 'ganz'], [col, 'ganz'], [col2, 'name']]) {
      await setSel(c, v)(page);
      await page.waitForFunction(([c2, v2]) => window.__anon.app.result.colPlan.find((y) => y.id === c2).treat === v2, [c, v]);
    }
    await page.click('#col-ok');
  });
  check(`${f}: „Erläuterung“ auf „wie bisher“, „Nachname“ auf „ganz ersetzen“ und beide zurück = nie umgestellt (byte-gleich)`, never.equals(back));
  // Version 2.11.0: Schalter „Seltene Werte“ aus und wieder an = nie umgeschaltet
  const rareBack = await bytesOf(path.join(FXW, f), 'person', async (page) => {
    if (await page.isVisible('#col-change')) await page.click('#col-change');
    for (const on of [false, true]) {
      await page.click('#col-rare');
      await page.waitForFunction((x) => window.__anon.app.state.colRare === x && document.querySelector('#col-ok') && document.querySelector('#col-rare').checked === x, on);
    }
    await page.click('#col-ok');
  });
  check(`${f}: Schalter „Seltene Werte“ aus und wieder an = nie umgeschaltet (byte-gleich)`, never.equals(rareBack));
  const rareOff = await bytesOf(path.join(FXW, f), 'person', async (page) => {
    if (await page.isVisible('#col-change')) await page.click('#col-change');
    await page.click('#col-rare');
    await page.waitForFunction(() => window.__anon.app.state.colRare === false && document.querySelector('#col-ok'));
    await page.click('#col-ok');
  });
  const ro = await outRows(await (async () => { const q = path.join(outDir, `rare-off-${f}`); fs.writeFileSync(q, rareOff); return q; })());
  const ixD = HEADERS.indexOf('Geschlecht');
  check(`${f}: Schalter „Seltene Werte“ aus: der seltene Wert „d“ (Geschlecht) bleibt lesbar`, ro.some((r) => r[ixD] === 'd'));
  // alle Spalten „wie bisher“ und Schalter „Seltene Werte“ aus = Ausgabe von main (2.10.0); Unterschiede nur in der
  // Kopfzeile oder durch gewöhnliche Wörter aus Namensspalten wären begründet (hier: keine erwartet)
  const allOld = await bytesOf(path.join(FXW, f), 'person', async (page) => {
    if (await page.isVisible('#col-change')) await page.click('#col-change');
    await page.evaluate(async () => { const A = window.__anon; A.app.state.colRare = false; for (const c of A.app.result.colPlan) A.app.state.colTreat[c.id] = 'bisher'; await A.applyColumns(); });
    await page.click('#col-ok');
  });
  const main = await bytesOf(path.join(FXW, f), 'person', async (page) => {
    await page.evaluate(async () => { const A = window.__anon; for (const c of A.app.result.colPlan) A.app.state.colTreat[c.id] = 'bisher'; await A.applyColumns(); });
    if (await page.$('#col-ok')) await page.click('#col-ok');
  }, MAIN);
  // Unterschied nur erlaubt: Kopfzeile (seit 2.11.0 nie ersetzt; main ersetzt „Grundschule“ in einer Überschrift) und die
  // dadurch verschobenen Buchstaben der Platzhalter. Vergleich ohne Kopfzeile, Buchstaben nach erstem Auftreten neu gezählt.
  const canon = (cells) => { const m = new Map(); return cells.map((t) => String(t).replace(/(Person|Einrichtung|Vorname|Nachname|Name|Initiale) ([A-Z]{1,3})(\d*)/g, (x, a, l, d) => { const k = a.startsWith('Einr') ? 'E' + l : 'P' + l; if (!m.has(k)) m.set(k, m.size); return `${a} #${m.get(k)}${d}`; })); };
  const body = async (buf) => { const q = path.join(outDir, `cmp-${++seq}-${f}`); fs.writeFileSync(q, buf); return (await outRows(q)).slice(1).flat(); };
  const bo = await body(allOld);
  const bm = await body(main);
  const headOld = (await outRows(await (async () => { const q = path.join(outDir, `cmph-${++seq}-${f}`); fs.writeFileSync(q, allOld); return q; })()))[0];
  const same = JSON.stringify(canon(bo)) === JSON.stringify(canon(bm));
  check(`${f}: alle Spalten „wie bisher“, „Seltene Werte“ aus = main mit allen Spalten „wie bisher“ (ohne Kopfzeile, Buchstaben neu gezählt), Kopfzeile unverändert`, same && headOld.join('|') === HEADERS.join('|'));
}

// ---------- 6. Kein stilles Speichern; Formel und verbundene Zellen ----------
log('');
log('## 6. Kein stilles Speichern, Formeln und verbundene Zellen');
{
  const o = await openFile(path.join(FXW, 'stammdaten.csv'), 'person', { confirm: false });
  await goTo(o.page, 'a3');
  let pts = await savePoints(o.page);
  check('Übersicht nicht bestätigt: Punkt „Die Spalten sind noch nicht geprüft“ mit Knopf „Ansehen“', pts.some((p) => /Die Spalten sind noch nicht geprüft/.test(p) && /Ansehen/.test(p)), pts.find((p) => /Spalten/.test(p)) || '');
  await o.page.click('#btn-cols');
  check('„Ansehen“ führt zur Spalten-Übersicht (Prüfen)', (await o.page.evaluate(() => window.__anon.app.screen)) === 'a2' && !!(await o.page.$('#col-ok')));
  await o.page.click('#col-ok');
  check('Nach „So übernehmen“ kommen die Fragen (Fragekarte statt Übersicht)', !(await o.page.$('#col-ok')) && !!(await o.page.$('#colline:not([hidden])')));
  await goTo(o.page, 'a3');
  pts = await savePoints(o.page);
  check('Bestätigt: kein Punkt „Spalten“ mehr', !pts.some((p) => /Spalten sind noch nicht geprüft/.test(p)));
  const th = await o.page.evaluate(() => { window.__anon.show('a2'); return { rep: document.querySelectorAll('#docview th.colrep').length, td: document.querySelectorAll('#docview td.colrep').length, badge: document.querySelector('#docview th.colrep .colbadge') && document.querySelector('#docview th.colrep .colbadge').textContent }; });
  const nRep = HEADERS.filter((hd) => EXPECT[hd] !== 'bisher').length;
  check('Tabellen-Ansicht zeigt ersetzte Spalten sichtbar als ersetzt (Kopf und Zellen)', th.rep === nRep && th.td > 1500, `${th.rep} Köpfe, ${th.td} Zellen, „${th.badge}“`);
  // Version 2.11.0: Punkt „Diese Spalten bleiben lesbar“ nennt genau die lesbaren Spalten (mit ihren Werten)
  await goTo(o.page, 'a3');
  pts = await savePoints(o.page);
  const lp = pts.find((p) => /Diese Spalten bleiben lesbar/.test(p)) || '';
  const named = [...lp.matchAll(/„([^“]+)“/g)].map((m) => m[1]);
  const want = HEADERS.filter((hd) => EXPECT[hd] === 'bisher');
  check('Punkt „Diese Spalten bleiben lesbar: …“ nennt genau die lesbaren Spalten, mit „Ansehen“ und ihren Werten', JSON.stringify(named) === JSON.stringify(want) && /Ansehen/.test(lp) && /Bus \d+/.test(lp), lp.slice(0, 300));
  log(`  - ${lp}`);
  const txt = await o.page.evaluate(() => document.body.innerText);
  check('Kein Text „null“ oder „undefined“ (Prüfen, Übersicht)', !/\bnull\b|\bundefined\b/.test(txt));
  await o.ctx.close();
}
{
  const o = await openFile(path.join(FXW, 'stammdaten-formel.xlsx'), 'person');
  await goTo(o.page, 'a3');
  const pts = await savePoints(o.page);
  check('Formel in einer ersetzten Spalte: eigener Punkt mit Zelle', pts.some((p) => /Formel/.test(p) && /Zelle S4/.test(p)), pts.find((p) => /Formel/.test(p)) || '');
  // Guardian-Lauf 1, Fund 1: Formelergebnis in einer Namensspalte wird wie bisher (Namensspalten-Regel 2.6.0) ersetzt
  const out = await o.page.evaluate(async () => (await window.__anon.buildOutput('txt')).text);
  check('Formelergebnis mit Namen in einer Spalte „Name“ wird wie in 2.9.0 ersetzt (Namensspalten-Regel), aber gemeldet', !/Pawlitzki/.test(out) && pts.some((p) => /Zelle A4/.test(p)), (out.match(/.*Schüler!A4.*/g) || []).join(' | '));
  check('Verbundene Zellen in einer ersetzten Spalte: eigener Punkt mit Bereich', pts.some((p) => /verbundene Zellen/.test(p) && /R5:S5/.test(p)), pts.find((p) => /verbunden/.test(p)) || '');
  const txt = await o.page.evaluate(() => document.body.innerText);
  check('Kein Text „null“ oder „undefined“ (Speichern)', !/\bnull\b|\bundefined\b/.test(txt));
  await o.ctx.close();
}

// ---------- Version 2.11.0: Gegenprobe ohne Namensspalte, kleine Personen-Tabelle ----------
log('');
log('## Gegenprobe „plan“ (ohne Namensspalte) und kleine Personen-Tabelle (10 Zeilen)');
{
  const pl = path.join(FXW, 'plan.xlsx');
  const n = await planOf(pl);
  const m = await (async () => { const o = await openFile(pl, 'person', { confirm: false, html: MAIN }); const p = await o.page.evaluate(() => window.__anon.app.result.colPlan.map((c) => `${c.header}=${c.treat}`)); await o.ctx.close(); return p; })();
  const nn = n.p.map((c) => `${c.header}=${c.treat}`);
  check('plan.xlsx: keine Personen-Tabelle, Vorschläge wie 2.10.0 (keine Spalte nur wegen der neuen Regeln ersetzt)', n.p.every((c) => !c.person) && JSON.stringify(nn) === JSON.stringify(m), nn.join(', ') + ' / main ' + m.join(', '));
  const a = await bytesOf(pl, 'person');
  const b = await bytesOf(pl, 'person', null, MAIN);
  check('plan.xlsx: Ausgabe gleich wie main (jede Zelle)', JSON.stringify([...(await xlsxGrid(a))]) === JSON.stringify([...(await xlsxGrid(b))]));
  const kl = path.join(FXW, 'klein.csv');
  const o = await openFile(kl, 'person', { confirm: false });
  const r = await o.page.evaluate(() => ({ plan: window.__anon.app.result.colPlan.map((c) => `${c.header}=${c.treat}${c.rareRows ? '+selten' : ''}`), small: (document.querySelector('#qcard .colsmall') || {}).textContent || '' }));
  await o.ctx.close();
  check('klein.csv (10 Zeilen): Regel „seltene Werte“ aus, Hinweis sichtbar', !r.plan.some((x) => /\+selten/.test(x)) && /weniger als 20 Zeilen/.test(r.small), r.small);
  check('klein.csv: Teil 2 gilt (Name, Klasse/Ganztag lesbar, Bemerkung ganz ersetzt)', r.plan.join(',') === 'Nachname=name,Vorname=name,Klasse=bisher,Ganztag=bisher,Bemerkung=ganz', r.plan.join(', '));
}

// ---------- Sammelfrage, Schlusscheck ----------
log('');
log('## Sammelfrage und Schlusscheck');
{
  const o = await openFile(path.join(FXW, 'stammdaten.xlsx'), 'person');
  const r = await o.page.evaluate(() => {
    const A = window.__anon;
    const rest = A.questions().find((q) => q.kind === 'rest');
    return { words: rest ? rest.words.map((w) => w.word) : [] };
  });
  const inTreated = ['Gaziantep', 'Asthma', 'Notfallspray', 'Lindenweg', 'Mogadischu', 'Igbo', 'Levetiracetam'];
  check('Sammelfrage „Diese Wörter bleiben stehen“: kein Wort aus ersetzten Zellen', !r.words.some((w) => inTreated.includes(w)), r.words.filter((w) => inTreated.includes(w)).join(', '));
  await goTo(o.page, 'a3');
  await waitCheck(o.page);
  const leaks = await o.page.$$eval('#points > li.bad', (els) => els.map((e) => e.innerText.replace(/\s+/g, ' ')));
  check('Schlusscheck: kein Fund (ersetzte Zellen sind ersetzt)', !leaks.length, leaks.slice(0, 3).join(' | '));
  await o.ctx.close();
}

// Version 2.11.0: echter Name in einer Kopfzeile (mitarbeiter.xlsx, Blatt „Yılmaz“: „Notizen zu Mehmet Yılmaz“) – die
// Kopfzeile wird nie ersetzt, der Schlusscheck meldet den Namen mit Hinweis
{
  const o = await openFile(path.join(here, 'fixtures', 'mitarbeiter.xlsx'), 'person');
  await goTo(o.page, 'a3');
  await waitCheck(o.page);
  const leaks = await o.page.$$eval('#points > li.bad', (els) => els.map((e) => e.innerText.replace(/\s+/g, ' ')));
  check('Name in einer Kopfzeile: bleibt stehen, Schlusscheck meldet ihn mit Hinweis „Kopfzeile … selbst ändern“', leaks.some((l) => /Mehmet/.test(l) && /Kopfzeile einer Tabelle/.test(l)), leaks.slice(0, 2).join(' | '));
  await o.ctx.close();
}

// ---------- Merkliste ----------
log('');
log('## Merkliste: Wahl je Überschrift');
{
  const ctx = await browser.newContext({ acceptDownloads: true });
  const o = await openFile(path.join(FXW, 'stammdaten.csv'), 'person', { confirm: false, ctx });
  await o.page.evaluate(() => { window.__anon.app.persist = true; });
  await setSel(`csv|${HEADERS.indexOf('Geschlecht')}`, 'ganz')(o.page);
  await o.page.waitForFunction(() => window.__anon.app.result.colPlan.find((c) => c.header === 'Geschlecht').treat === 'ganz');
  const stored = await o.page.evaluate(() => window.localStorage.getItem('anonymisierer.merkliste.v1'));
  await o.page.close();
  const o2 = await openFile(path.join(FXW, 'stammdaten.xlsx'), 'person', { confirm: false, ctx });
  const g = await o2.page.evaluate(() => window.__anon.app.result.colPlan.find((c) => c.header === 'Geschlecht'));
  const values = TRUTH.rows.flat().filter((v) => String(v).length > 2);
  check('Merkliste an: Wahl je Überschrift gemerkt und beim nächsten Dokument angewendet (auch in Excel)', g.treat === 'ganz' && g.fromMemory, JSON.parse(stored || '{}').spalten ? JSON.stringify(JSON.parse(stored).spalten) : 'nichts gespeichert');
  check('Merkliste enthält nur die Überschrift, nie Inhalte', !!stored && !values.some((v) => stored.includes(v)));
  await ctx.close();
  const o3 = await openFile(path.join(FXW, 'stammdaten.csv'), 'person', { confirm: false });
  const g3 = await o3.page.evaluate(() => window.__anon.app.result.colPlan.find((c) => c.header === 'Geschlecht').treat);
  check('Merkliste aus: nichts gemerkt (neues Fenster wie vorher)', g3 === 'bisher');
  await o3.ctx.close();
}

// ---------- 7. Vorhandene Tabellen-Testdateien ----------
log('');
log('## 7. Vorhandene Tabellen-Testdateien: Personen-Tabelle ja/nein, Vorschlag je Spalte main → jetzt, nie schwächer');
const OLD_FX = ['fixtures-spaltenwahl/stammdaten-formel.xlsx', 'fixtures-spalten/liste.xlsx', 'fixtures-spalten/tabellen.xlsx', 'fixtures-spalten/tabellen-stark.csv', 'fixtures-spalten/tabellen-schwach.csv', 'fixtures-spalten/tabellen-zweikopf.csv',
  'fixtures-spalten/tabellen-einezelle.csv', 'fixtures-spalten/tabellen-teilwort.csv', 'fixtures-spalten/tabellen-anrede.csv', 'fixtures-spalten/tabellen-ohnekopf.csv',
  'fixtures/mitarbeiter.xlsx', 'fixtures/mitarbeiter.csv', 'fixtures/meta-tabelle.xlsx', 'fixtures/bilder-excel.xlsx', 'fixtures/ziffern.xlsx', 'fixtures/ziffern.csv',
  'fixtures/einrichtung.xlsx', 'fixtures/einrichtung.csv', 'fixtures/a2-risiko.csv', 'fixtures/a2-uebertragung.csv', 'fixtures/vertausch-1.csv', 'fixtures/vertausch-1.xlsx',
  'fixtures/vertausch-2.csv', 'fixtures/vertausch-2.xlsx', 'fixtures/kollision.csv', 'fixtures/endungen.csv', 'fixtures/einrichtung-gross.csv', 'fixtures/einrichtung-gross.xlsx',
  'fixtures/grossform-mit.csv', 'fixtures/grossform-einzig.csv', 'fixtures-anzeige/mehrblatt.xlsx', 'fixtures-bedienung/bedienung.xlsx', 'fixtures-reste/reste.xlsx',
  'fixtures-traeger/anmeldung.xlsx', 'fixtures-traeger/anmeldung.csv', 'fixtures-traeger/einrichtung-person.xlsx', 'fixtures-traeger/einrichtung-person.csv',
  'fixtures-traeger/nachbarn.xlsx', 'fixtures-traeger/nachbarn.csv', 'fixtures-traeger/nachbarn-offen.xlsx', 'fixtures-traeger/nachbarn-offen.csv', 'fixtures-traeger/einrichtungen-auto.xlsx',
  'fixtures-pfade/pfade-ueblich.xlsx', 'fixtures-pfade/pfade-unueblich.xlsx', 'fixtures-pfade/pfade-hauptteil.xlsx', 'fixtures-pfade/pfade-phase0.xlsx', 'fixtures-pfade/pfade-gegenprobe.xlsx'];
{
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  page.on('request', (r) => requests.push(r.url()));
  await page.goto('file://' + NEW);
  const mpage = await ctx.newPage();
  mpage.on('request', (r) => requests.push(r.url()));
  await mpage.goto('file://' + MAIN);
  for (const f of OLD_FX) {
    const p = path.join(here, f);
    if (!fs.existsSync(p)) { log(`- ${f}: fehlt`); continue; }
    await page.evaluate(() => { document.querySelector('#load-status').textContent = ''; });
    await page.setInputFiles('#file', p);
    await page.waitForFunction(() => /Gelesen|nicht|Fehler/.test(document.querySelector('#load-status').textContent), null, { timeout: 120000 });
    const lab = (c) => (c.treat === 'ganz' ? 'ganz (' + c.kind + ')' : c.treat === 'name' ? 'Name' : 'lesbar');
    const planOfPage = (pg) => pg.evaluate(() => (window.__anon.app.result && window.__anon.app.result.colPlan ? window.__anon.app.result.colPlan : []).map((c) => ({ t: c.t, c: c.c, header: c.header, treat: c.treat, kind: c.kind, person: !!c.person, headerRow: c.headerRow })));
    const full = await planOfPage(page);
    await mpage.evaluate(() => { document.querySelector('#load-status').textContent = ''; });
    await mpage.setInputFiles('#file', p);
    await mpage.waitForFunction(() => /Gelesen|nicht|Fehler/.test(document.querySelector('#load-status').textContent), null, { timeout: 120000 });
    const mfull = await planOfPage(mpage);
    const rep = full.filter((c) => c.treat !== 'bisher');
    const person = [...new Set(full.filter((c) => c.person).map((c) => c.t))];
    log(`- ${f}: ${full.length ? `${full.length} Spalten mit Kopfzeile; Personen-Tabelle: ${person.length ? 'ja' + (person.some((t) => t.startsWith('x|')) ? ' (' + person.map((t) => t.slice(2)).join(', ') + ')' : '') : 'nein'}; Vorschlag main → jetzt: ${full.map((c) => { const m = mfull.find((x) => x.t === c.t && x.c === c.c); const a = m ? lab(m) : '–'; const b = lab(c); return `„${c.header}“ ${a === b ? b : a + ' → ' + b}`; }).join('; ')}` : 'keine Tabelle mit Kopfzeile'}`);
    if (!rep.length) continue;
    // nie schwächer als main (2.10.0): kein Wort, das main ersetzt, steht jetzt noch da (Kopfzeile ausgenommen: sie wird
    // seit 2.11.0 nie ersetzt)
    const packJs = async (pg) => pg.evaluate(async () => { const A = window.__anon; const o = await A.buildOutput(A.app.doc.kind); return o.text !== undefined ? o.text : btoa(Array.from(o.bytes, (b) => String.fromCharCode(b)).join('')); });
    const nowDef = await packJs(page);
    const mainDef = await packJs(mpage);
    // nie schwächer: kein Wort, das „wie bisher“ (= 2.9.0 mit Namensspalten-Regel) ersetzt, steht mit den Vorschlägen noch da
    const outs = await page.evaluate(async () => {
      const A = window.__anon;
      const fmt = A.app.doc.kind;
      const pack = (o) => (o.text !== undefined ? o.text : btoa(Array.from(o.bytes, (b) => String.fromCharCode(b)).join('')));
      const def = pack(await A.buildOutput(fmt));
      for (const c of A.app.result.colPlan) A.app.state.colTreat[c.id] = 'bisher';
      await A.applyColumns();
      const old = pack(await A.buildOutput(fmt));
      return { def, old, fmt };
    });
    const cellsOf = async (data) => (outs.fmt === 'csv' ? csvCells(data) : xlsxCells(Buffer.from(data, 'base64')));
    const orig = outs.fmt === 'csv' ? csvCells(fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, '')) : await xlsxCells(fs.readFileSync(p));
    const cd = await cellsOf(outs.def);
    const co = await cellsOf(outs.old);
    const weaker = [];
    for (const [k, t] of orig) {
      const ws = words(t);
      const keptD = words(cd.get(k) || '');
      const keptO = words(co.get(k) || '');
      for (const w of ws) if (keptD.has(w) && !keptO.has(w)) weaker.push(`${k} „${w}“`);
    }
    check(`${f}: mit den Vorschlägen nie schwächer als „wie bisher“ (kein Wort, das „wie bisher“ ersetzt, bleibt stehen)`, !weaker.length, weaker.slice(0, 5).join('; '));
    const sheets = outs.fmt === 'csv' ? [] : await sheetFiles(fs.readFileSync(p));
    const headKeys = new Set(full.map((c) => (outs.fmt === 'csv' ? `${c.headerRow}|${c.c}` : `${sheets[c.t.slice(2)]}|${colL(c.c)}${c.headerRow + 1}`)));
    const cn = await cellsOf(nowDef);
    const cm = await cellsOf(mainDef);
    const weakerMain = [];
    for (const [k, t] of orig) {
      if (headKeys.has(k)) continue;
      const keptN = words(cn.get(k) || '');
      const keptM = words(cm.get(k) || '');
      for (const w of words(t)) if (keptN.has(w) && !keptM.has(w)) weakerMain.push(`${k} „${w}“`);
    }
    check(`${f}: nie schwächer als main 2.10.0 (kein Wort, das main ersetzt, bleibt stehen; ohne Kopfzeile)`, !weakerMain.length, weakerMain.slice(0, 5).join('; '));
  }
  await ctx.close();
}

// ---------- Netz ----------
log('');
const ext = requests.filter((u) => !/^(file:|blob:|data:|about:)/.test(u));
check('0 Anfragen nach außen (alle Seiten dieses Laufs)', !ext.length, ext.slice(0, 3).join(', '));
await browser.close();
log('');
log(`Ergebnis: ${pass} von ${pass + fail} Prüfungen bestanden`);
fs.writeFileSync(path.join(here, 'SPALTENWAHL-REPORT.md'), report.join('\n') + '\n');
process.exit(fail ? 1 : 0);
