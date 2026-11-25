// Kompakte Bedienung und Fragen je Stelle (Version 2.5.0).
// 1. Easys Befunde (tests/make-bedienung.mjs) je Fall vorher (2.4.1) / nachher: Fragen, Zeilen und Häkchen auf dem
//    Speichern-Bildschirm, Höhe bei 1366×768, anonymisierter Text ohne Antwort, nach „Ja“ bei allen Wort-Fragen, nach „Ja“
//    bei allen Fragen und nach „Nein“ bei allen Fragen je Stelle
// 2. Beweis D.5 über alle Testdokumente: jede stehen gebliebene Stelle eines bestätigten Namens ist genau eines von:
//    offene Frage, mit „Nein“ entschieden, Schlusscheck-Fund
// 3. Ohne Bedienung byte-gleich zu 2.4.1: alle Testdokumente, alle Modi, alle Formate, Schlüsseldatei (Kennung fest)
// 4. Sperren, Liste „Eigene Namen“, 1366×768, Kreislauf, Doppellauf, Firefox, Anfragen
// Ergebnis: tests/BEDIENUNG-REPORT.md. Aufruf: node tests/bedienung-test.mjs <index.html-der-Version-2.4.1>
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { orgTermTokens } from '../src/core/detect.js';
import { startAnon, loadIn, goTo, saveKey, waitCheck, ackImages, exportOnce, rbConfirm } from './ui-helpers.mjs';
import { FXB, META_NAME } from './make-bedienung.mjs';
import { FX as FXP } from './make-pfade.mjs';
import { PEOPLE } from './make-gross.mjs';

const pw = createRequire('/opt/node22/lib/node_modules/')('playwright');
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const fx = path.join(here, 'fixtures');
const newHtml = path.join(root, 'index.html');
const oldHtml = process.argv[2] ? path.resolve(process.argv[2]) : null;
if (!oldHtml) { console.error('Bitte Pfad zur index.html der Version 2.4.1 angeben.'); process.exit(2); }
const outDir = path.join(here, 'out-bedienung');
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });
const report = [];
const log = (s = '') => { report.push(s); console.log(s); };
const checks = [];
const check = (name, ok, detail = '') => { checks.push([name, ok]); log(`- ${ok ? 'OK' : 'FEHLER'}: ${name}${detail ? ' – ' + detail : ''}`); };
const requests = [];
let seq = 0;
const browser = await pw.chromium.launch();
async function newPage(html = newHtml, viewport = { width: 1366, height: 768 }, b = browser) {
  const ctx = await b.newContext({ acceptDownloads: true, viewport });
  const page = await ctx.newPage();
  page.on('request', (r) => requests.push(r.url()));
  page.on('dialog', (d) => d.accept());
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('file://' + html);
  return { page, ctx, errors };
}
const FILES = [['bedienung.docx', 'docx'], ['bedienung.xlsx', 'xlsx'], ['bedienung.txt', 'txt']];
const MANUAL_TXT = ['Wittekindhorn']; // TXT hat keine Dateiangaben: Name steht in „Eigene Namen“
const SHOW = /Winter|Rose|Montag|Do 13|ittekindhorn|ITTEKINDHORN|Person A|Name B|Kühn/;

// Fragen beantworten über die Oberfläche (Knöpfe der Fragekarte). policy(kind) -> true (Ja) | false (Nein) | null (offen lassen)
async function answerAll(page, policy) {
  for (let i = 0; i < 80; i++) {
    const cur = await page.evaluate(() => {
      const A = window.__anon;
      const q = A.questions().find((x) => !(A.answerOf ? A.answerOf(x) : A.app.answers.get(x.id) || (x.kind === 'meta' && x.taken ? 'ja' : null)));
      return q ? { kind: q.kind === 'hit' ? 'word' : q.kind, id: q.id } : null;
    });
    if (!cur) break;
    const yes = policy(cur.kind);
    if (yes === null) {
      // offen lassen: die übrigen Fragen dieser Art direkt beantworten (ohne diese)
      const rest = await page.evaluate(([pol]) => {
        const A = window.__anon;
        const open = A.questions().filter((x) => !A.answerOf(x));
        const next = open.find((x) => (x.kind === 'hit' ? 'word' : x.kind) !== 'place');
        return next ? { id: next.id, kind: next.kind } : null;
      }, [null]);
      if (!rest) break;
      await page.evaluate(([id, y]) => { const A = window.__anon; const q = A.questions().find((x) => x.id === id); A.answer(q, y); }, [rest.id, policy(rest.kind === 'hit' ? 'word' : rest.kind)]);
      continue;
    }
    // Version 2.9.0: die Sammelfrage hat nur „Kein Name dabei“ (#q-no)
    await page.click(yes && cur.kind !== 'rest' ? '#q-yes' : '#q-no');
  }
}
async function caseRun(html, file, kind, policy) {
  const { page, ctx, errors } = await newPage(html);
  await startAnon(page, 'person');
  if (kind === 'txt') await page.evaluate((m) => { window.__anon.app.state.manualTerms = m; }, MANUAL_TXT);
  await loadIn(page, path.join(FXB, file));
  await goTo(page, 'a2');
  const nQ = await page.evaluate(() => window.__anon.questions().length);
  const kinds = await page.evaluate(() => window.__anon.questions().map((q) => q.kind));
  if (policy) await answerAll(page, policy);
  await goTo(page, 'a3');
  await waitCheck(page);
  const neu = !!(await page.$('#ack-all'));
  const rows = neu ? await page.$$eval('#points > li', (l) => l.map((x) => x.innerText.replace(/\s+/g, ' ').trim())) : await page.$$eval('#ampel > li', (l) => l.map((x) => x.innerText.replace(/\s+/g, ' ').trim()));
  const boxes = await page.$$eval('#scr-a3 input[type=checkbox]', (l) => l.filter((x) => x.offsetParent !== null).length);
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  const text = await page.evaluate(async () => (await window.__anon.buildOutput('txt')).text);
  await ctx.close();
  return { nQ, kinds, rows, boxes, height, lines: text.split('\n').filter((l) => SHOW.test(l)), text, errors };
}

log('# Kompakte Bedienung und Fragen je Stelle (Version 2.5.0): Tests');
log('');
log('Testdokumente: tests/make-bedienung.mjs -> tests/fixtures-bedienung/ (alles erfunden). Vorher = Version 2.4.1, nachher = diese Version. Chromium, 1366×768, Modus „Person A“. In der TXT-Datei steht „Wittekindhorn“ in der Liste „Eigene Namen“ (TXT hat keine Dateiangaben).');
log('');

// ---------- 1. Easys Befunde ----------
log('## 1. Easys Befunde je Fall');
const ALLJA = () => true;
const WORTJA = (k) => (k === 'place' ? null : true);
const STELLENEIN = (k) => k !== 'place';
for (const [file, kind] of FILES) {
  log(`### ${file}`);
  const v0 = await caseRun(oldHtml, file, kind, null);
  const v1 = await caseRun(oldHtml, file, kind, ALLJA);
  const n0 = await caseRun(newHtml, file, kind, null);
  const nW = await caseRun(newHtml, file, kind, WORTJA);
  const nA = await caseRun(newHtml, file, kind, ALLJA);
  const nN = await caseRun(newHtml, file, kind, STELLENEIN);
  log('');
  log('| | vorher (2.4.1) | nachher |');
  log('|---|---|---|');
  log(`| Fragen | ${v0.nQ} | ${n0.nQ} (${['word', 'place', 'meta'].map((k) => `${n0.kinds.filter((x) => x === k).length} ${{ word: 'zum Wort', place: 'je Stelle', meta: 'Dateiangaben' }[k]}`).join(', ')}) |`);
  log(`| Zeilen auf dem Speichern-Bildschirm (ohne Antwort) | ${v0.rows.length} | ${n0.rows.length} |`);
  log(`| Häkchen auf dem Speichern-Bildschirm (ohne Antwort) | ${v0.boxes} | ${n0.boxes} |`);
  log(`| Höhe des Speichern-Bildschirms bei 1366×768 | ${v0.height} px | ${n0.height} px |`);
  log('');
  log(`- Zeilen nachher: ${n0.rows.map((r) => `„${r.slice(0, 110)}“`).join(' · ')}`);
  log(`- Text ohne Antwort, vorher: ${v0.lines.join(' ⏎ ')}`);
  log(`- Text ohne Antwort, nachher: ${n0.lines.join(' ⏎ ')}`);
  log(`- Text nach „Ja“ bei allen Fragen, vorher: ${v1.lines.join(' ⏎ ')}`);
  log(`- Text nach „Ja“ bei allen Wort-Fragen (Fragen je Stelle offen), nachher: ${nW.lines.join(' ⏎ ')}`);
  log(`- Text nach „Ja“ bei allen Fragen, nachher: ${nA.lines.join(' ⏎ ')}`);
  log(`- Text nach „Nein“ bei allen Fragen je Stelle (übrige „Ja“), nachher: ${nN.lines.join(' ⏎ ')}`);
  check(`${file}: ohne Bedienung gleicher Text wie vorher`, v0.text === n0.text);
  check(`${file}: „Ja“ bei allen Wort-Fragen ersetzt „im Winter“ nicht (vorher ersetzt)`, /Im Winter gehen/.test(nW.text) && !/Im Winter gehen/.test(v1.text));
  check(`${file}: „Nein“ je Stelle: „im Winter“ und „Rosen“ bleiben unverändert`, /Im Winter gehen/.test(nN.text) && /bringt Rosen/.test(nN.text));
  check(`${file}: ohne Antwort und nach „Ja“ bei Wort-Fragen bleibt „Rosen“ wie heute ersetzt (Entscheidung Variante a)`, !/bringt Rosen/.test(n0.text) && !/bringt Rosen/.test(nW.text));
  check(`${file}: keine Frage und keine Markierung für „Montag“ und „Do 13:30“`, !(await (async () => { const { page, ctx } = await newPage(); await startAnon(page, 'person'); if (kind === 'txt') await page.evaluate((m) => { window.__anon.app.state.manualTerms = m; }, MANUAL_TXT); await loadIn(page, path.join(FXB, file)); await goTo(page, 'a2'); const r = await page.evaluate(() => { const qs = window.__anon.questions().map((q) => q.word || ''); const marked = [...document.querySelectorAll('#docview mark.on, #docview mark.ask')].map((m) => m.textContent); return qs.includes('Montag') || qs.includes('Do') || marked.includes('Montag') || marked.includes('Do'); }); await ctx.close(); return r; })()));
  const wQ = await (async () => {
    const { page, ctx } = await newPage(); await startAnon(page, 'person');
    if (kind === 'txt') await page.evaluate((m) => { window.__anon.app.state.manualTerms = m; }, MANUAL_TXT);
    await loadIn(page, path.join(FXB, file)); await goTo(page, 'a2');
    if (kind !== 'txt') await page.evaluate(() => { const A = window.__anon; const q = A.questions().find((x) => x.kind === 'meta'); if (q) A.answer(q, true); });
    const r = await page.evaluate(() => { const A = window.__anon; const q = A.questions().find((x) => x.kind === 'place' && x.hit.capsManual); if (!q) return null; return { word: A.app.result.fullText.slice(q.hit.s, q.hit.e), on: q.hit.on }; });
    let card = '';
    if (r) {
      for (let i = 0; i < 20; i++) { const t = await page.textContent('#qcard'); if (/WITTEKINDHORNS/.test(t)) { card = t.replace(/\s+/g, ' '); break; } await page.evaluate(() => { const A = window.__anon; const q = A.questions().find((x) => !A.answerOf(x)); if (q) A.answer(q, true); }); }
    }
    await ctx.close();
    return { r, card };
  })();
  check(`${file}: GROSS-Form „WITTEKINDHORNS“ des übernommenen Namens wird je Stelle gefragt; Fragekarte zeigt „Bleibt im Moment stehen.“`, !!wQ.r && !wQ.r.on && /Bleibt im Moment stehen/.test(wQ.card), wQ.card.slice(0, 200));
  log('');
}

// ---------- 2. Beweis D.5 ----------
log('## 2. Beweis D.5: jede stehen gebliebene Stelle eines bestätigten Namens genau einmal');
log('');
log('Für jedes Testdokument (tests/fixtures, tests/fixtures-pfade, tests/fixtures-bedienung, dazu die GROSS-Testdokumente mit von Hand übernommenen Nachnamen) in drei Zuständen: ohne Antwort, „Ja“ bei allen Fragen, „Nein“ bei allen Fragen je Stelle. Gezählt wird jede ausgeschaltete Stelle einer Person, die mindestens eine eingeschaltete Stelle hat.');
log('');
const allFiles = [
  ...fs.readdirSync(fx).filter((f) => /\.(docx|xlsx|txt|csv|pdf)$/.test(f)).map((f) => [path.join(fx, f), []]),
  ...fs.readdirSync(FXP).filter((f) => /\.(docx|xlsx)$/.test(f)).map((f) => [path.join(FXP, f), []]),
  ...fs.readdirSync(FXB).map((f) => [path.join(FXB, f), f.endsWith('.txt') ? MANUAL_TXT : []]),
  ...['grossform-einzig.docx', 'grossform-mit.docx', 'grossform-einzig.txt', 'grossform-mit.csv'].map((f) => [path.join(fx, f), PEOPLE.map((p) => p[2])]),
];
let spots = 0;
let bad = [];
const tally = { frage: 0, nein: 0, schlusscheck: 0 };
{
  const { page, ctx } = await newPage();
  for (const [file, manual] of allFiles) {
    for (const state of ['ohne', 'ja', 'stelle-nein']) {
      const res = await page.evaluate(async ([b, n, man, st]) => {
        const A = window.__anon;
        A.app.state.settings.mode = 'person';
        A.app.state.manualTerms = man;
        try { await A.openBytes(new Uint8Array(b), n); } catch { return null; }
        for (let i = 0; i < 200 && st !== 'ohne'; i++) {
          const q = A.questions().find((x) => !A.answerOf(x));
          if (!q) break;
          A.answer(q, st === 'ja' ? true : q.kind !== 'place');
        }
        const r = A.app.result;
        const fmt = { docx: 'docx', xlsx: 'xlsx', csv: 'csv' }[A.app.doc.kind] || 'txt';
        const leaks = await A.finalCheck(await A.buildOutput(fmt));
        const fold = (s) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/ß/g, 'ss');
        const used = new Set();
        const out = [];
        for (const en of r.entities.values()) {
          if (!en.hits.some((h) => h.on)) continue;
          for (const h of en.hits) {
            if (h.on) continue;
            const words = r.fullText.slice(h.s, h.e).split(/[^\p{L}\p{M}\p{N}'’-]+/u).filter(Boolean);
            const qs = A.questions().filter((q) => (q.kind === 'place' && q.hit === h) || (q.kind === 'word' && (q.hits.includes(h) || q.neinHits.includes(h))));
            const open = qs.some((q) => !A.answerOf(q) && (q.kind === 'place' || q.hits.includes(h) || (!q.hits.length && q.neinHits.includes(h))));
            const nein = qs.some((q) => A.answerOf(q) === 'nein');
            const li = leaks.findIndex((l, k) => !used.has(k) && l.unit === h.unit && words.some((w) => fold(l.word) === fold(w) || l.word.split('-').some((p) => fold(p) === fold(w))));
            const leak = li >= 0;
            if (leak) used.add(li);
            out.push({ w: r.fullText.slice(h.s, h.e), open, nein, leak, n: [open, nein, leak].filter(Boolean).length });
          }
        }
        return out;
      }, [[...fs.readFileSync(file)], path.basename(file), manual, state]);
      if (!res) continue;
      for (const x of res) {
        spots++;
        if (x.n !== 1) bad.push(`${path.basename(file)} (${state}): „${x.w}“ offen=${x.open} nein=${x.nein} Schlusscheck=${x.leak}`);
        else if (x.open) tally.frage++; else if (x.nein) tally.nein++; else tally.schlusscheck++;
      }
    }
  }
  await ctx.close();
}
log(`- Stellen insgesamt: ${spots}; davon offene Frage ${tally.frage}, mit „Nein“ entschieden ${tally.nein}, Schlusscheck-Fund ${tally.schlusscheck}; Abweichungen ${bad.length}`);
for (const b of bad.slice(0, 30)) log(`  - ${b}`);
check('D.5: jede stehen gebliebene Stelle genau einmal (offene Frage ODER „Nein“ ODER Schlusscheck)', bad.length === 0, `${bad.length} Abweichung(en)`);
log('');

// ---------- 3. Ohne Bedienung byte-gleich ----------
log('## 3. Ohne Bedienung byte-gleich zu Version 2.4.1 (alle Testdokumente, alle Modi, alle Formate, Schlüsseldatei)');
const FORMATS = { txt: ['txt', 'docx'], csv: ['csv', 'txt', 'docx'], docx: ['docx', 'txt'], xlsx: ['xlsx', 'txt'], pdf: ['txt', 'docx'] };
async function outputs(html, file, mode, manual, groups = null, allBisher = false) {
  const { page, ctx } = await newPage(html);
  // Version 2.8.0 (Nachweis): gefundene Einrichtungen der neuen Version als von Hand markiert vorgeben, ihre Schreibweisen
  // zusammenführen (Regel c)
  const merges = {};
  for (const g of groups || []) for (const t of g.slice(1)) merges[orgTermTokens(t).key] = orgTermTokens(g[0]).key;
  const res = await page.evaluate(async ([b, n, m, man, F, terms, mg, ab]) => {
    const A = window.__anon;
    A.app.state.settings.mode = m;
    A.app.state.manualTerms = man;
    if (terms.length) A.app.state.orgTerms = terms;
    try { await A.openBytes(new Uint8Array(b), n); } catch (e) { return { err: e.message }; }
    // Version 2.10.0 (Nachweis): alle Spalten „wie bisher“; cols = Spalten mit Behandlung „Name“/„ganz ersetzen“
    const cols = ((A.app.result && A.app.result.colPlan) || []).filter((c) => c.treat !== 'bisher').map((c) => c.header);
    if (ab && cols.length) { for (const c of A.app.result.colPlan) A.app.state.colTreat[c.id] = 'bisher'; await A.applyColumns(); }
    if (Object.keys(mg).length) { Object.assign(A.app.state.merges, mg); A.runAnalysis(); }
    const groups = A.app.result.orgs ? [...A.app.result.orgs.values()].filter((o) => o.auto).map((o) => [...o.forms.keys()]) : [];
    A.app.kennung = 'TST1'; // feste Kennung (sonst Zufall)
    const o = {};
    for (const f of F[A.app.doc.kind]) { const x = await A.buildOutput(f); o[f] = x.zip ? Array.from(x.bytes) : x.text; }
    return { o, kind: A.app.doc.kind, groups, cols };
  }, [[...fs.readFileSync(file)], path.basename(file), mode, manual, FORMATS, (groups || []).flat(), merges, allBisher]);
  let key = null;
  if (mode === 'reversible' && !res.err) {
    await page.evaluate(() => window.__anon.show('a3'));
    const dlP = page.waitForEvent('download', { timeout: 30000 });
    await page.click('#btn-key');
    const dl = await dlP;
    const p = path.join(outDir, `k${++seq}.json`);
    await dl.saveAs(p);
    const k = JSON.parse(fs.readFileSync(p, 'utf8').replace(/^﻿/, ''));
    delete k.toolVersion; delete k.erstellt; delete k.version;
    key = JSON.stringify(k);
  }
  await ctx.close();
  return { ...res, key };
}
let nOut = 0;
const diffs = [];
const v28 = []; // Version 2.8.0: Änderung allein durch selbst gefundene Einrichtungen (nachgewiesen)
const v210 = []; // Version 2.10.0: Änderung allein durch die Spalten-Behandlung (nachgewiesen: alle Spalten „wie bisher“ = Vorversion)
const v210cols = new Map();
for (const [file, manual] of allFiles) {
  for (const mode of ['person', 'name', 'reversible']) {
    const a = await outputs(oldHtml, file, mode, manual);
    const b = await outputs(newHtml, file, mode, manual);
    if (a.err || b.err) { if (a.err !== b.err) diffs.push(`${path.basename(file)} ${mode}: Fehler ${a.err} / ${b.err}`); continue; }
    // Nachweis 2.8.0: die alte Version mit den gefundenen Einrichtungen als von Hand markiert (zusammengeführt)
    let c = null;
    const ref = async () => { if (!c) c = await outputs(oldHtml, file, mode, manual, b.groups); return c; };
    let cb = null;
    const bisher = async () => { if (!cb) cb = await outputs(newHtml, file, mode, manual, null, true); return cb; };
    // beides zusammen (gefundene Einrichtungen 2.8.0 und Spalten-Behandlung 2.10.0): alle Spalten „wie bisher“ = Vorversion
    // mit den dann gefundenen Einrichtungen als von Hand markiert
    let cr = null;
    const both = async () => { if (!cr) { const bb = await bisher(); cr = bb.groups.length ? await outputs(oldHtml, file, mode, manual, bb.groups) : { o: {}, key: null }; } return cr; };
    const label = `${path.basename(file)}${manual.length ? ' (mit eigenen Namen)' : ''}`;
    for (const f of Object.keys(a.o)) {
      nOut++;
      const same = JSON.stringify(a.o[f]) === JSON.stringify(b.o[f]);
      if (same) continue;
      if (b.groups.length && JSON.stringify((await ref()).o[f]) === JSON.stringify(b.o[f])) { v28.push(`${label}, ${mode}, .${f}`); continue; }
      if (b.cols && b.cols.length && JSON.stringify((await bisher()).o[f]) === JSON.stringify(a.o[f])) { v210.push(`${label}, ${mode}, .${f}`); v210cols.set(label, b.cols); continue; }
      if (b.cols && b.cols.length && (await bisher()).groups.length && JSON.stringify((await bisher()).o[f]) === JSON.stringify((await both()).o[f])) { v210.push(`${label}, ${mode}, .${f} (dazu 2.8.0)`); v210cols.set(label, b.cols); continue; }
      diffs.push(`${label}, ${mode}, .${f}`);
    }
    if (mode === 'reversible') {
      nOut++;
      if (a.key !== b.key) {
        if (b.groups.length && (await ref()).key === b.key) v28.push(`${label}, Schlüsseldatei`);
        else if (b.cols && b.cols.length && (await bisher()).key === a.key) v210.push(`${label}, Schlüsseldatei`);
        else if (b.cols && b.cols.length && (await bisher()).groups.length && (await bisher()).key === (await both()).key) v210.push(`${label}, Schlüsseldatei (dazu 2.8.0)`);
        else diffs.push(`${label}, Schlüsseldatei`);
      }
    }
  }
}
// Version 2.6.0: Diese Dokumente ändern sich ohne Bedienung gewollt durch die neuen Regeln (Grund je Dokument; Einzelheiten
// zeilengenau im PR-Text und in tests/SPALTEN-REPORT.md). Alle übrigen Ausgaben müssen byte-gleich bleiben.
const CHANGED_260 = {
  'a2-risiko.txt': 'Anrede am Zeilenende: „Liebe Frau⏎Vielen Dank …“ und „Gesprächspartner: Herr⏎Schulleitung“ jetzt ersetzt (unsicher, an); Buchstaben danach verschoben',
  'a2-uebertragung.csv': 'Spalte „Name“ ist Namensspalte (starkes Kopfwort): „Hartungs Antrag“ (reine Namenszelle) wird eine Person; Buchstaben danach verschoben',
  'mitarbeiter.csv': 'Spalten „Vorname“/„Nachname“: Vor- und Nachname einer Zeile sind eine Person (ein Buchstabe, rückbaufähig „Vorname X“/„Nachname X“)',
  'mitarbeiter.xlsx': 'wie mitarbeiter.csv (eine Person je Zeile)',
  'vertausch-1.csv': 'Spalte „Nachname“: „Achterberg“ (in keiner Liste) jetzt ersetzt; eine Person je Zeile',
  'vertausch-1.xlsx': 'wie vertausch-1.csv',
  'vertausch-2.csv': 'Spalten „Vorname“/„Nachname“: „Brinkhaus“, „Tilmann“, „Overkamp“ jetzt ersetzt; eine Person je Zeile',
  'vertausch-2.xlsx': 'wie vertausch-2.csv',
  'pfade-phase0.xlsx': 'nur Modus rückbaufähig: „Thi Lan“ unter „Vorname“ ist jetzt ganz „Vorname C“ (vorher „Vorname C Nachname C“, Rolle aus der Spalte)',
};
const docOf = (d) => d.split(/[ ,]/)[0];
const unexplained = diffs.filter((d) => !CHANGED_260[docOf(d)]);
log(`- ${nOut} Ausgaben (inkl. Schlüsseldateien) verglichen, ${diffs.length} unterschiedlich${diffs.length ? ': ' + diffs.join('; ') : ''}`);
for (const [doc, why] of Object.entries(CHANGED_260)) {
  const n = diffs.filter((d) => docOf(d) === doc).length;
  log(`  - ${doc}: ${n} Ausgabe(n) geändert – Grund (Version 2.6.0): ${why}`);
}
log(`- Version 2.8.0: ${v28.length} Ausgabe(n) geändert allein durch selbst gefundene Einrichtungen (nachgewiesen: gleich der Vorversion mit diesen Einrichtungen als von Hand markiert, Schreibweisen zusammengeführt)${v28.length ? ': ' + v28.join('; ') : ''}`);
log(`- Version 2.10.0: ${v210.length} Ausgabe(n) geändert allein durch die Spalten-Behandlung (nachgewiesen: mit allen Spalten „wie bisher“ gleich der Vorversion; „dazu 2.8.0“: gleich der Vorversion mit den dann gefundenen Einrichtungen als von Hand markiert)${v210.length ? ': ' + v210.join('; ') : ''}`);
for (const [doc, cols] of v210cols) log(`  - ${doc}: Spalten mit Behandlung „Name“/„ganz ersetzen“: ${cols.map((x) => '„' + x + '“').join(', ')}`);
check('Ohne Bedienung byte-gleich zur Vorversion (Kennung fest), außer den Dokumenten mit Grund aus Version 2.6.0 und den nachgewiesenen Änderungen durch gefundene Einrichtungen (2.8.0) und durch die Spalten-Behandlung (2.10.0)', unexplained.length === 0, unexplained.join('; '));
log('');

// ---------- 4. Sperren, Eigene Namen, 1366×768 ----------
log('## 4. Sperren, Liste „Eigene Namen“, Bildschirmhöhe');
{
  const { page, ctx } = await newPage();
  await startAnon(page, 'person');
  await loadIn(page, path.join(FXB, 'bedienung.docx'));
  await goTo(page, 'a3');
  await waitCheck(page);
  let r = await exportOnce(page, 'docx');
  check('Offener Punkt ohne Häkchen: nicht gespeichert', !r.dl && /blockiert/.test(r.status), r.status);
  check('Mit Bildern ist das Häkchen erst nach dem Öffnen der Bilderliste wählbar', await page.isDisabled('#ack-all'));
  await ackImages(page);
  check('… nach dem Öffnen wählbar', !(await page.isDisabled('#ack-all')));
  await page.check('#ack-all');
  await goTo(page, 'a2');
  await page.evaluate(() => { const A = window.__anon; const q = A.questions().find((x) => !A.answerOf(x)); A.answer(q, true); });
  await goTo(page, 'a3');
  await waitCheck(page);
  check('Nach einer Änderung (Antwort) fällt das Häkchen zurück', !(await page.isChecked('#ack-all')));
  r = await exportOnce(page, 'docx');
  check('… und es wird nicht gespeichert', !r.dl, r.status);
  await page.check('#ack-all');
  r = await exportOnce(page, 'docx');
  check('Mit Häkchen wird gespeichert', !!r.dl, r.status);
  await ctx.close();
}
{
  const { page, ctx } = await newPage();
  await page.click('#go-anon');
  const s0 = await page.textContent('#names-state');
  await page.click('#tgl-adv');
  await page.fill('#name-input', 'Erika Musterfrau');
  await page.click('#name-add button[type=submit]');
  await page.fill('#name-input', 'Lindenauer Bürgerverein');
  await page.selectOption('#name-kind', 'org');
  await page.click('#name-add button[type=submit]');
  const s1 = await page.textContent('#names-state');
  const hint = await page.isVisible('#persist-hint') ? await page.textContent('#persist-hint') : '';
  await page.reload();
  await page.click('#go-anon');
  const s2 = await page.textContent('#names-state');
  check('Stand der Liste auf dem Datei-Bildschirm stimmt', s0 === 'Eigene Namen: keine' && s1 === 'Eigene Namen: 1 Einrichtung, 1 Person', `${s0} → ${s1}`);
  check('Hinweis beim Hinzufügen: „Diese Liste gilt nur, bis du die Seite schließt oder neu lädst.“ mit Knopf zum Speichern', /Diese Liste gilt nur, bis du die Seite schließt oder neu lädst\./.test(hint) && /Dauerhaft in diesem Browser speichern/.test(hint), hint.replace(/\s+/g, ' '));
  check('Nach dem Neuladen ohne Speichern: „Eigene Namen: keine“', s2 === 'Eigene Namen: keine', s2);
  await ctx.close();
}
{
  const { page, ctx } = await newPage();
  const hStart = await page.evaluate(() => document.documentElement.scrollHeight);
  await startAnon(page, 'reversible');
  await loadIn(page, path.join(FXB, 'bedienung.docx'));
  const hDatei = await page.evaluate(() => document.documentElement.scrollHeight);
  await goTo(page, 'a3');
  await waitCheck(page);
  const n = (await page.$$('#points > li')).length;
  const hSave = await page.evaluate(() => document.documentElement.scrollHeight);
  check(`1366×768: Start (${hStart} px), Datei (${hDatei} px) und Speichern mit ${n} offenen Punkten (${hSave} px) ohne Scrollen`, hStart <= 768 && hDatei <= 768 && hSave <= 768 && n <= 5);
  await ctx.close();
}
log('');

// ---------- 5. Kreislauf, Doppellauf ----------
log('## 5. Kreislauf (rückbaufähig, „Ja“ bei allen Fragen) und Doppellauf');
for (const [file, kind] of FILES) {
  const { page, ctx } = await newPage();
  await startAnon(page, 'reversible');
  if (kind === 'txt') await page.evaluate((m) => { window.__anon.app.state.manualTerms = m; }, MANUAL_TXT);
  await loadIn(page, path.join(FXB, file));
  await goTo(page, 'a2');
  await answerAll(page, ALLJA);
  await goTo(page, 'a3');
  await ackImages(page);
  await waitCheck(page);
  if (await page.isVisible('#ack-all-row')) await page.check('#ack-all');
  const kd = await saveKey(page);
  const kp = path.join(outDir, `${++seq}-${kd.suggestedFilename()}`);
  await kd.saveAs(kp);
  if (await page.isVisible('#ack-all-row') && !(await page.isChecked('#ack-all'))) await page.check('#ack-all');
  const r = await exportOnce(page, kind);
  const ap = path.join(outDir, `${++seq}-${r.dl.suggestedFilename()}`);
  await r.dl.saveAs(ap);
  const orig = await page.evaluate(() => window.__anon.app.doc.units.map((u) => u.text));
  await ctx.close();
  const p2 = await newPage();
  await p2.page.click('#go-restore');
  await p2.page.setInputFiles('#rb-file', ap);
  await p2.page.waitForFunction(() => document.querySelector('#rb-file-status').textContent);
  await p2.page.setInputFiles('#rb-key', kp);
  await p2.page.waitForFunction(() => document.querySelector('#rb-key-status').textContent);
  await p2.page.click('#rb-btn-check');
  await rbConfirm(p2.page, true);
  await p2.page.click('#r2-next');
  const dlP = p2.page.waitForEvent('download');
  await p2.page.click('#rb-btn-save');
  const dl = await dlP;
  const bp = path.join(outDir, `${++seq}-${dl.suggestedFilename()}`);
  await dl.saveAs(bp);
  const back = await p2.page.evaluate(async (b) => { await window.__anon.openBytes(new Uint8Array(b), 'x'); return window.__anon.app.doc.units.map((u) => u.text); }, [...fs.readFileSync(bp)]).catch(() => null);
  await p2.ctx.close();
  const backOk = back && JSON.stringify(back) === JSON.stringify(orig);
  check(`${file}: Kreislauf exakt (alle Abschnitte wie im Original)`, backOk);
  const twice = [];
  for (let i = 0; i < 2; i++) {
    const { page: pg, ctx: c2 } = await newPage();
    twice.push(await pg.evaluate(async ([b, n, man]) => { const A = window.__anon; A.app.state.settings.mode = 'person'; A.app.state.manualTerms = man; await A.openBytes(new Uint8Array(b), n); const x = await A.buildOutput({ docx: 'docx', xlsx: 'xlsx' }[A.app.doc.kind] || 'txt'); return x.zip ? Array.from(x.bytes).join(',') : x.text; }, [[...fs.readFileSync(path.join(FXB, file))], file, kind === 'txt' ? MANUAL_TXT : []]));
    await c2.close();
  }
  check(`${file}: Doppellauf byte-gleich`, twice[0] === twice[1]);
}
log('');

// ---------- 6. Firefox, Anfragen ----------
log('## 6. Firefox und Anfragen nach außen');
let ff = null;
try { ff = await pw.firefox.launch(); } catch (e) { log(`- Firefox: nicht startbar (${String(e.message).split('\n')[0].slice(0, 140)}). Die neuen Tests sind in Firefox ungeprüft.`); }
if (ff) { log('- Firefox gestartet (Läufe hier nicht ausgeführt).'); await ff.close(); }
await browser.close();
const outside = requests.filter((u) => !/^(file|blob|data|about):/.test(u));
check('0 Anfragen nach außen', outside.length === 0, outside.slice(0, 3).join(', '));
const failed = checks.filter((c) => !c[1]);
log('');
log(`Prüfungen: ${checks.length - failed.length} von ${checks.length} bestanden${failed.length ? ' – FEHLER: ' + failed.map((c) => c[0]).join('; ') : ''}.`);
fs.writeFileSync(path.join(here, 'BEDIENUNG-REPORT.md'), report.join('\n') + '\n');
process.exit(failed.length ? 1 : 0);
