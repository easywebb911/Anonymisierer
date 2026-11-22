// Version 2.6.0: Namensspalten (Excel, CSV, Word), Spalte von Hand, Anrede in der Nachbarzelle (Excel), Anrede am
// Zeilenende (Textdateien, eingefügter Text) und „von“ nur vor Nachname. Testdokumente: tests/make-spalten.mjs.
// Ziel-Test: In den drei nachgebauten Dateien aus der Diagnose (Brief, Liste, Protokoll) bleibt kein echter Name stehen.
// Aufruf: node tests/spalten-test.mjs [--alt <index.html der Vorversion>]   (Ergebnis: tests/SPALTEN-REPORT.md)
//   --alt: Vergleich „vorher/nachher“ (Fälle „wie bisher“, „von“, Schlusscheck). Ohne --alt werden diese Punkte als
//   „nicht geprüft“ ausgewiesen.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { makeAll, FXS, CASES, RISIKO, PROTOKOLL, strip } from './make-spalten.mjs';
import { tokenize } from '../src/core/detect.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const args = process.argv.slice(2);
const altIdx = args.indexOf('--alt');
const ALT = altIdx >= 0 ? path.resolve(args[altIdx + 1]) : null;
let chromium;
try { ({ chromium } = createRequire(import.meta.url)('playwright')); } catch { ({ chromium } = createRequire('/opt/node22/lib/node_modules/')('playwright')); }

const truth = await makeAll();
const report = [];
const log = (s = '') => { report.push(s); console.log(s); };
const results = [];
const check = (name, ok, detail = '') => { results.push([name, ok]); log(`- ${ok ? 'OK' : 'FEHLER'}: ${name}${detail ? ' – ' + detail : ''}`); };
const requests = [];
const browser = await chromium.launch();
async function newPage(html) {
  const ctx = await browser.newContext({ acceptDownloads: true });
  const page = await ctx.newPage();
  page.on('request', (r) => { if (!r.url().startsWith('file:')) requests.push(r.url()); });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('file://' + html);
  return { page, ctx, errors };
}
const NEW = await newPage(path.join(root, 'index.html'));
const OLD = ALT ? await newPage(ALT) : null;

// Datei laden und Ergebnis lesen (über die Testschnittstelle der Seite)
async function analyzeIn(pg, bytes, name, mode = 'person', cols = null) {
  return pg.page.evaluate(async ([arr, nm, md, cl]) => {
    const A = window.__anon;
    A.app.state.settings.mode = md;
    await A.openBytes(new Uint8Array(arr), nm);
    if (cl) { Object.assign(A.app.state.nameColumns, cl); A.runAnalysis(); }
    const R = A.app.result;
    const ents = R.entities;
    const hits = R.hits.filter((h) => h.type === 'person').map((h) => ({ s: h.s, e: h.e, cert: h.cert, on: h.on, entity: h.entity,
      label: ents.get(h.entity) ? ents.get(h.entity).label : '', parts: (h.parts || []).map((p) => p.text), column: h.column || '' }));
    let check = null;
    try {
      const fmt = /\.docx$/.test(nm) ? 'docx' : /\.xlsx$/.test(nm) ? 'xlsx' : /\.csv$/.test(nm) ? 'csv' : 'txt';
      const out = await A.buildOutput(fmt);
      check = (await A.finalCheck(out)).map((l) => l.word + ' (' + l.where + ')');
    } catch (e) { check = ['Fehler: ' + e.message]; }
    return { units: A.app.doc.units.map((u) => ({ text: u.text, label: u.label })), unitStarts: R.unitStarts, hits, columns: R.columns || [],
      // Version 2.9.0: die Sammelfrage „Diese Wörter bleiben stehen“ ist keine Erkennungsfrage (Vergleich mit 2.5.0 betrifft die Erkennung)
      questions: A.questions().filter((q) => q.kind !== 'rest').map((q) => q.kind + ':' + (q.word || q.name || R.fullText.slice(q.hit.s, q.hit.e))), check, kennung: A.app.kennung };
  }, [[...bytes], name, mode, cols]);
}
const readFx = (f) => fs.readFileSync(path.join(FXS, f));
// Zustand eines Wortes: 'S+' sicher an, 'U+' unsicher an, 'U-'/'S-' aus, '' kein Treffer
function tokens(r, unitFilter = () => true) {
  const out = [];
  r.units.forEach((u, ui) => {
    if (!unitFilter(u, ui)) return;
    for (const tk of tokenize(u.text, r.unitStarts[ui])) {
      if (!tk.word) continue;
      const h = r.hits.find((x) => x.s < tk.e && x.e > tk.s);
      out.push({ t: tk.t, s: tk.s, e: tk.e, ui, unit: u.text, st: h ? (h.cert === 'sicher' ? 'S' : 'U') + (h.on ? '+' : '-') : '', h });
    }
  });
  return out;
}
const fullOf = (r) => r.units.map((u) => u.text).join('\n');
// Wahrheit: markierte Abschnitte (⟦…⟧) -> Namens-Spannen im Volltext
function nameSpans(file, r) {
  const src = truth[file] || [];
  const map = new Map(src.map((s) => [strip(s), s]));
  const spans = [];
  r.units.forEach((u, ui) => {
    const m = map.get(u.text);
    if (!m) return;
    let text = '';
    let pos = 0;
    for (const x of m.matchAll(/⟦([^⟧]*)⟧/g)) { text += m.slice(pos, x.index); spans.push([r.unitStarts[ui] + text.length, r.unitStarts[ui] + text.length + x[1].length]); text += x[1]; pos = x.index + x[0].length; }
  });
  return spans;
}
const TITLES = new Set(['Herr', 'Herrn', 'Frau', 'Dr']);
function categories(file, r) {
  const ns = nameSpans(file, r);
  const c = { fs: 0, fua: 0, faus: 0, ers: 0, frage: 0, ueb: 0, w: { ueb: [], fs: [], fua: [] } };
  for (const tk of tokens(r)) {
    if (TITLES.has(tk.t)) continue;
    const isName = ns.some(([a, b]) => tk.s >= a && tk.e <= b);
    if (isName) { if (!tk.st) { c.ueb++; c.w.ueb.push(tk.t); } else if (tk.st.endsWith('+')) c.ers++; else c.frage++; } else if (tk.st) {
      if (tk.st === 'S+') { c.fs++; c.w.fs.push(tk.t); } else if (tk.st.endsWith('+')) { c.fua++; c.w.fua.push(tk.t); } else c.faus++;
    }
  }
  return c;
}

log('# Namensspalten, Anrede in der Nachbarzelle, Anrede am Zeilenende, „von“ (Version 2.6.0)');
log('');
log(`Testdokumente: tests/fixtures-spalten/ (erzeugt mit tests/make-spalten.mjs). Vergleich mit Vorversion: ${ALT ? path.basename(path.dirname(ALT)) + '/' + path.basename(ALT) : 'nicht angegeben (Punkte „wie bisher“ nicht geprüft)'}.`);

// ---------- 1. Ziel: drei Testdateien aus der Diagnose ----------
log('');
log('## 1. Ziel: Brief, Liste, Protokoll – kein echter Name bleibt stehen');
log('');
log('| Datei | Stand | Fragen | Fehltreffer sicher/unsicher an | Fehltreffer aus | Namen ersetzt | Namen nur Frage/aus | Namen ganz übersehen | Schlusscheck-Meldungen |');
log('|---|---|---|---|---|---|---|---|---|');
const goal = {};
for (const f of ['brief.docx', 'liste.xlsx', 'protokoll.txt', 'protokoll-lf.txt']) {
  for (const [lab, pg] of [['vorher', OLD], ['nachher', NEW]]) {
    if (!pg) continue;
    const r = await analyzeIn(pg, readFx(f), f);
    const c = categories(f, r);
    goal[f + lab] = { r, c };
    log(`| ${f} | ${lab} | ${r.questions.length} | ${c.fs}/${c.fua} | ${c.faus} | ${c.ers} | ${c.frage} | ${c.ueb}${c.w.ueb.length ? ' (' + c.w.ueb.join(', ') + ')' : ''} | ${r.check.length}${r.check.length ? ' (' + r.check.join('; ') + ')' : ''} |`);
  }
}
log('');
for (const f of ['brief.docx', 'liste.xlsx', 'protokoll.txt', 'protokoll-lf.txt']) {
  const g = goal[f + 'nachher'];
  check(`${f}: kein echter Name ganz übersehen`, g.c.ueb === 0, g.c.ueb ? g.c.w.ueb.join(', ') : '');
  check(`${f}: kein echter Name nur als Frage/aus`, g.c.frage === 0);
}
for (const f of ['brief.docx', 'liste.xlsx', 'protokoll.txt']) {
  const g = goal[f + 'nachher'];
  log(`  - ${f} nachher: Fragen: ${g.r.questions.join(', ') || '–'}; Fehltreffer sicher: ${g.c.w.fs.join(', ') || '–'}; unsicher an: ${g.c.w.fua.join(', ') || '–'}`);
}
// Personen-Zuordnung in der Liste: Vor- und Nachname einer Zeile = ein Buchstabe; „Frau Koch“ im Text = derselbe Buchstabe
{
  const r = goal['liste.xlsxnachher'].r;
  const lab = (w) => [...new Set(tokens(r).filter((t) => t.t === w && t.h).map((t) => t.h.label))];
  const koch = lab('Koch');
  check('Liste: „Koch“ (Zelle) und „Sabine“ (Zelle) eine Person, „Frau Koch“ in der Bemerkung derselbe Buchstabe', koch.length === 1 && lab('Sabine').length === 1 && koch[0] === lab('Sabine')[0], `Koch ${koch.join('/')}, Sabine ${lab('Sabine').join('/')}`);
  check('Liste: „Kirchbichler“/„Magdalena“ eine Person', lab('Kirchbichler')[0] === lab('Magdalena')[0]);
  check('Liste: „Nguyen“/„Thi Lan“ eine Person', lab('Nguyen')[0] === lab('Thi')[0] && lab('Thi')[0] === lab('Lan')[0]);
  const vonTok = tokens(r).find((t) => t.t === 'von' && /^Schwester von/.test(t.unit));
  check('Liste: „Schwester von Lena Winter“ behält das „von“', vonTok && !vonTok.st);
}

// ---------- 2. Tabellenfälle in Excel, CSV und Word ----------
log('');
log('## 2. Tabellenfälle (Excel, CSV, Word)');
const caseRange = (r, kind, key) => {
  if (kind === 'csv') return () => true;
  if (kind === 'xlsx') return (u) => u.label.startsWith(key + '!');
  const start = r.units.findIndex((u) => u.text === 'Fall ' + key);
  let end = r.units.findIndex((u, i) => i > start && /^Fall /.test(u.text));
  if (end < 0) end = r.units.length;
  return (u, ui) => ui > start && ui < end;
};
const cellTexts = (c) => new Set(c.rows.flat().map((v) => strip(v)).filter((v) => v !== ''));
for (const kind of ['xlsx', 'csv', 'docx']) {
  log('');
  log(`### ${kind.toUpperCase()}`);
  const docR = kind === 'csv' ? null : await analyzeIn(NEW, readFx('tabellen.' + kind), 'tabellen.' + kind);
  const docOld = kind === 'csv' || !OLD ? null : await analyzeIn(OLD, readFx('tabellen.' + kind), 'tabellen.' + kind);
  for (const [key, c] of Object.entries(CASES)) {
    const fname = kind === 'csv' ? `tabellen-${key}.csv` : 'tabellen.' + kind;
    const r = docR || await analyzeIn(NEW, readFx(fname), fname);
    const ro = kind === 'csv' ? (OLD ? await analyzeIn(OLD, readFx(fname), fname) : null) : docOld;
    const inCase = caseRange(r, kind, key);
    const cells = cellTexts(c);
    // nur Zellen (keine Sätze) prüfen; Sätze über cellExpect
    const isCell = (u) => cells.has(u.text.trim()) && u.text.trim().split(/\s+/).length <= 4 && !(c.cellExpect && typeof c.cellExpect[u.text] === 'object');
    const toks = tokens(r, (u, ui) => inCase(u, ui) && isCell(u));
    const oldToks = ro ? tokens(ro, (u, ui) => caseRange(ro, kind, key)(u, ui) && isCell(u)) : null;
    const bad = [];
    for (const [w, exp] of Object.entries(c.expect)) {
      const occ = toks.filter((t) => t.t === w);
      if (!occ.length) continue;
      for (const t of occ) {
        let want = exp;
        if (exp === 'alt') {
          // „wie bisher“ nur in den CSV-Dateien prüfbar (je Fall eine Datei); in Excel/Word stehen alle Fälle in EINER Datei,
          // dort überträgt ein sicher erkannter Name aus einem anderen Fall auf gleiche Wörter (gewollt)
          if (!oldToks || kind !== 'csv') continue;
          const o = oldToks.find((x) => x.t === t.t && x.unit === t.unit);
          want = o ? o.st : '';
        }
        if (t.st !== want) bad.push(`${w} in „${t.unit}“: ${t.st || '–'} statt ${want || '–'}`);
      }
    }
    for (const [cellText, exp] of Object.entries(c.cellExpect || {})) {
      const ts = tokens(r, (u, ui) => inCase(u, ui) && u.text === cellText);
      if (typeof exp === 'string') { for (const t of ts) if (t.st !== exp) bad.push(`„${cellText}“/${t.t}: ${t.st || '–'} statt ${exp}`); } else {
        for (const [w, e] of Object.entries(exp)) for (const t of ts.filter((x) => x.t === w)) if (t.st !== e) bad.push(`„${cellText}“/${w}: ${t.st || '–'} statt ${e || '–'}`);
      }
    }
    const cols = r.columns.filter((col) => (kind === 'xlsx' ? col.t === 'x|' + key : kind === 'csv' ? true : true));
    let colNote = '';
    if (c.noNameColumns) {
      const named = r.columns.filter((col) => col.kind && (kind === 'xlsx' ? col.t === 'x|' + key : kind === 'csv' ? true : r.units.some((u, ui) => inCase(u, ui) && u.tcells)));
      const inThis = kind === 'docx' ? named.filter((col) => r.units.some((u, ui) => inCase(u, ui))) : named;
      // Word: Spalten der Tabelle dieses Falls bestimmen
      const tid = kind === 'docx' ? (r.units.find((u, ui) => inCase(u, ui)) || {}).label : null;
      colNote = `Namensspalten: ${inThis.length && kind !== 'docx' ? inThis.map((x) => x.header).join(', ') : kind === 'docx' ? '(siehe Word-Prüfung unten)' : 'keine'}`;
      if (kind !== 'docx' && inThis.length) bad.push('Namensspalte erkannt: ' + inThis.map((x) => x.header).join(', '));
      void tid;
    }
    check(`${kind} ${key}: ${c.title}`, !bad.length, bad.join('; ') || colNote);
    void cols;
    // Personen-Zuordnung (Fall „stark“)
    if (key === 'stark') {
      const lab = (w, unit) => [...new Set(toks.filter((t) => t.t === w && (!unit || t.unit === unit) && t.h).map((t) => t.h.label))];
      check(`${kind} stark: Koch + Sabine (zwei Zeilen) = ein Buchstabe`, lab('Koch').length === 1 && lab('Koch')[0] === lab('Sabine')[0], `Koch ${lab('Koch')}, Sabine ${lab('Sabine')}`);
      check(`${kind} stark: Nguyen + Thi Lan = ein Buchstabe`, lab('Nguyen')[0] === lab('Thi')[0]);
      check(`${kind} stark: von der Heide + Jonas = ein Buchstabe`, lab('Heide')[0] === lab('Jonas')[0]);
      if (kind === 'xlsx') {
        // Grenze: gleicher Zelltext „Winter“ in zwei Zeilen mit verschiedenen Vornamen -> in Excel EIN gemeinsamer Text
        check('xlsx stark: Winter/Lukas und Winter/Lena getrennt (gemeinsamer Text „Winter“ bleibt eigene Person)', lab('Lukas')[0] !== lab('Lena')[0] && lab('Winter').length === 1 && lab('Winter')[0] !== lab('Lukas')[0]);
      } else {
        const w = toks.filter((t) => t.t === 'Winter');
        check(`${kind} stark: zwei Personen mit Nachname Winter (Lukas, Lena) = zwei Buchstaben`, w.length === 2 && w[0].h.label === lab('Lukas')[0] && w[1].h.label === lab('Lena')[0] && lab('Lukas')[0] !== lab('Lena')[0]);
      }
    }
  }
  if (kind === 'docx') {
    // Word: Spaltenköpfe mit Namenswort als Teil (Fall „teilwort“) sind keine Namensspalten
    const r = docR;
    const start = r.units.findIndex((u) => u.text === 'Fall teilwort');
    const t = r.units.find((u, i) => i > start && u.tcells);
    void t;
    const heads = ['Dateiname', 'Benutzername', 'Kursname', 'Name der Schule', 'Firmenname'];
    const cols = r.columns.filter((col) => heads.includes(col.header));
    check('docx teilwort: keine dieser Spalten ist Namensspalte', cols.length === 5 && cols.every((col) => !col.kind), cols.map((col) => col.header + '=' + (col.kind || 'nein')).join(', '));
  }
}

// ---------- 3. Rückbaufähig: Rollen „Vorname X“ / „Nachname X“ ----------
log('');
log('## 3. Modus rückbaufähig: Vor- und Nachname einer Zeile');
for (const kind of ['xlsx', 'csv', 'docx']) {
  const fname = kind === 'csv' ? 'tabellen-stark.csv' : 'tabellen.' + kind;
  const r = await analyzeIn(NEW, readFx(fname), fname, 'reversible');
  const inCase = caseRange(r, kind, 'stark');
  const toks = tokens(r, inCase);
  const ph = (w) => { const t = toks.find((x) => x.t === w && x.h); return t ? t.h.parts.join(' ') : ''; };
  const L = (s) => (s.match(/ ([A-Z]+)\d*$/) || [])[1];
  const ok = /^Nachname [A-Z]+$/.test(ph('Koch')) && /^Vorname [A-Z]+$/.test(ph('Sabine')) && L(ph('Koch')) === L(ph('Sabine'))
    && /^Vorname/.test(ph('Thi')) && /^Nachname/.test(ph('Heide'));
  check(`${kind}: Koch → ${ph('Koch')}, Sabine → ${ph('Sabine')}, Thi Lan → ${ph('Thi')}, von der Heide → ${ph('Heide')}`, ok);
}

// ---------- 4. Spalte von Hand (Oberfläche) ----------
log('');
log('## 4. Spalte von Hand');
{
  const { page, ctx, errors } = await newPage(path.join(root, 'index.html'));
  const { startAnon, loadIn, goTo } = await import('./ui-helpers.mjs');
  await startAnon(page, 'reversible');
  await loadIn(page, path.join(FXS, 'tabellen-ohnekopf.csv'));
  await goTo(page, 'a2');
  const state = () => page.evaluate(() => {
    const A = window.__anon;
    const R = A.app.result;
    return { hits: R.hits.filter((h) => h.type === 'person').map((h) => R.fullText.slice(h.s, h.e) + ':' + (h.cert === 'sicher' ? 'S' : 'U') + (h.on ? '+' : '-')),
      q: A.questions().length, kennung: A.app.kennung, stamp: A.app.stamp, ack: A.app.ackSig };
  });
  const s0 = await state();
  // gespeicherte Schlüsseldatei und gesetztes Häkchen simulieren
  await page.evaluate(() => { const A = window.__anon; A.app.keyKennung = A.app.kennung; A.app.ackSig = A.app.stamp + '#x'; });
  const box = page.locator('input[data-col="csv|0"]');
  check('Schalter „Namen“ an Spalte 1 sichtbar, aus (keine Kopfzeile)', (await box.count()) === 1 && !(await box.isChecked()));
  await box.check();
  const s1 = await state();
  const sure1 = ['Kirchbichler', 'Brzęczek', 'Huckebein'].every((w) => s1.hits.includes(w + ':S+'));
  check('Einschalten: Spalte 1 alle sicher', sure1, s1.hits.join(', '));
  log(`  - Fragen: ${s0.q} → ${s1.q} (hier ohne Frage: die Wörter waren vorher gar nicht erkannt)`);
  check('Einschalten: neue Kennung (nach gespeicherter Schlüsseldatei)', s1.kennung !== s0.kennung);
  check('Einschalten: Häkchen fällt zurück', s1.stamp !== s0.stamp && s1.ack !== s1.stamp + '#x');
  check('Kopf als Namensspalte gekennzeichnet', await page.locator('th.namecol:has(input[data-col="csv|0"])').count() === 1);
  await page.locator('input[data-col="csv|0"]').uncheck();
  const s2 = await state();
  check('Ausschalten: Treffer wie ohne Regel', JSON.stringify(s2.hits) === JSON.stringify(s0.hits), s2.hits.join(', '));
  // erkannte Namensspalte ausschalten (Fall „stark“, Spalte Nachname)
  await loadIn(page, path.join(FXS, 'tabellen-stark.csv'));
  await goTo(page, 'a2');
  const n0 = await state();
  const auto = page.locator('input[data-col="csv|2"]');
  check('Erkannte Namensspalte „Nachname“ angehakt', await auto.isChecked());
  await auto.uncheck();
  const n1 = await state();
  check('Ausgeschaltet: „Brzęczek“ nicht mehr sicher aus der Spalte', !n1.hits.includes('Brzęczek:S+') && n0.hits.includes('Brzęczek:S+'), n1.hits.filter((x) => /Brz/.test(x)).join(', ') || 'kein Treffer');
  check('Ausgeschaltet: Fragen ändern sich (Spalte „Nachname“)', n1.q !== n0.q, `${n0.q} → ${n1.q}`);
  await page.locator('input[data-col="csv|2"]').check();
  const n2 = await state();
  check('Wieder eingeschaltet: Treffer wie vorher', JSON.stringify(n2.hits) === JSON.stringify(n0.hits) && n2.q === n0.q);
  check('Keine JS-Fehler', !errors.length, errors.join(' | '));
  await ctx.close();
}

// ---------- 5. Anrede am Zeilenende (Textdateien) ----------
log('');
log('## 5. Anrede am Zeilenende (TXT, Windows- und Unix-Zeilenenden, eingefügter Text)');
for (const f of ['umbruch-risiko.txt', 'umbruch-risiko-lf.txt']) {
  const r = await analyzeIn(NEW, readFx(f), f);
  const ro = OLD ? await analyzeIn(OLD, readFx(f), f) : null;
  const rows = [];
  let ok = true;
  for (const [l1, l2, w, exp] of RISIKO) {
    const line = strip(l2);
    const t = tokens(r, (u) => u.text === line).find((x) => x.t === w);
    const o = ro ? tokens(ro, (u) => u.text === line).find((x) => x.t === w) : null;
    const want = exp === 'alt' ? (o ? o.st : null) : exp;
    const good = want === null || (t && t.st === want);
    if (!good) ok = false;
    rows.push(`„${l1}⏎${line}“: ${w} ${o ? (o.st || '–') + ' → ' : ''}${t ? t.st || '–' : '?'} (erwartet ${want === null ? 'nicht geprüft' : want || '–'})`);
  }
  check(`${f}: Risikofälle wie erwartet`, ok);
  for (const x of rows) log('  - ' + x);
}
{
  const txt = PROTOKOLL.map(strip).join('\n');
  const r = await analyzeIn(NEW, new TextEncoder().encode(txt), 'Eingefügter Text');
  const st = (w) => tokens(r).filter((t) => t.t === w).map((t) => t.st);
  check('Eingefügter Text: Sonnleitner und Kirchbichler ersetzt', st('Sonnleitner').every((x) => x.endsWith('+')) && st('Kirchbichler').every((x) => x.endsWith('+')), `Sonnleitner ${st('Sonnleitner')}, Kirchbichler ${st('Kirchbichler')}`);
}

// ---------- 6. „von“ ----------
log('');
log('## 6. „von“: die sechs Fälle aus der Diagnose');
{
  const FX = path.join(here, 'fixtures');
  const cases = [
    ['fixtures/protokoll.txt', 'Frau Dr. von Bodelschwingh', 'von Bodelschwingh'],
    ['fixtures/protokoll.pdf', 'Frau Dr. von Bodelschwingh', 'von Bodelschwingh'],
    ['fixtures/protokoll.docx', 'Frau Dr. von Bodelschwingh', 'von Bodelschwingh'],
    ['fixtures/mitarbeiter.xlsx', 'Frau Dr. von Bodelschwingh', 'von Bodelschwingh'],
    ['fixtures-pfade/pfade-phase0.xlsx', 'Mutter von Jonas Wiesenthal', 'von Jonas Wiesenthal'],
    ['fixtures-spalten/liste.xlsx', 'Schwester von Lena Winter', 'Lena Winter'],
  ];
  void FX;
  log('');
  log('| Datei | Stelle | vorher (Treffer) | nachher (Treffer) | erwartet |');
  log('|---|---|---|---|---|');
  let ok = true;
  for (const [f, phrase, want] of cases) {
    const bytes = fs.readFileSync(path.join(here, f));
    const name = path.basename(f);
    const hitText = (r) => { const ft = fullOf(r); const i = ft.indexOf(phrase); if (i < 0) return '(Stelle nicht gefunden)'; const h = r.hits.filter((x) => x.s < i + phrase.length && x.e > i); return h.map((x) => ft.slice(x.s, x.e)).join(' + ') || '–'; };
    const rn = await analyzeIn(NEW, bytes, name);
    const ro = OLD ? await analyzeIn(OLD, bytes, name) : null;
    const now = hitText(rn);
    if (now !== want) ok = false;
    log(`| ${f} | ${phrase} | ${ro ? hitText(ro) : 'nicht geprüft'} | ${now} | ${want} |`);
  }
  check('„von“: alle sechs Fälle wie erwartet', ok);
}

// ---------- 7. Schlusscheck je Testdatei ----------
log('');
log('## 7. Schlusscheck-Meldungen vorher/nachher');
for (const f of ['brief.docx', 'liste.xlsx', 'protokoll.txt', 'tabellen.xlsx', 'tabellen.docx']) {
  const rn = goal[f + 'nachher'] ? goal[f + 'nachher'].r : await analyzeIn(NEW, readFx(f), f);
  const ro = OLD ? (goal[f + 'vorher'] ? goal[f + 'vorher'].r : await analyzeIn(OLD, readFx(f), f)) : null;
  log(`- ${f}: vorher ${ro ? ro.check.length + (ro.check.length ? ' (' + ro.check.join('; ') + ')' : '') : 'nicht geprüft'}, nachher ${rn.check.length}${rn.check.length ? ' (' + rn.check.join('; ') + ')' : ''}`);
}

// ---------- 8. Doppellauf ----------
{
  const a = await analyzeIn(NEW, readFx('tabellen.xlsx'), 'tabellen.xlsx', 'reversible');
  const b = await analyzeIn(NEW, readFx('tabellen.xlsx'), 'tabellen.xlsx', 'reversible');
  check('Doppellauf gleich (Treffer und Platzhalter)', JSON.stringify(a.hits) === JSON.stringify(b.hits));
}

log('');
check('Netzwerkanfragen nach außen: 0', requests.length === 0, requests.join(', '));
check('Keine JS-Fehler (Seite neu)', !NEW.errors.length, NEW.errors.join(' | '));
const failed = results.filter(([, ok]) => !ok);
log('');
log(`**Ergebnis: ${results.length - failed.length} von ${results.length} Prüfungen bestanden.**`);
if (!OLD) log('(Ohne --alt: Vergleiche mit der Vorversion nicht geprüft.)');
fs.writeFileSync(path.join(here, 'SPALTEN-REPORT.md'), report.join('\n') + '\n');
await browser.close();
process.exit(failed.length ? 1 : 0);
