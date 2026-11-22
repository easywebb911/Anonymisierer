// Version 2.9.0 „Diese Wörter bleiben stehen“: Messungen (kein Testlauf mit bestanden/nicht bestanden).
// - Listenlänge je vorhandener Testdatei und je Korpus-Abschnitt, jedes Wort eingeordnet; zum Vergleich die Länge MIT
//   üblicher Endungs-Abtrennung (nur gemessen, nicht gebaut)
// - Namen, die die Liste NICHT zeigt (weil sie als gewöhnliches Wort in der Wortliste stehen): Anzahl und Beispiele
// - Fehlerrate „fälschlich bekannt“ auf 100 000 erfundenen Nichtwörtern
// - Größe der index.html, Startzeit, Zeit bis „Prüfen“, Laufzeit auf der großen Testdatei (10 MB) – vorher (main) / nachher
// Aufruf: node tests/restwoerter-messung.mjs <index.html von main>   (Ergebnis: tests/RESTWOERTER-MESSUNGEN.md)
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const OLD = path.resolve(process.argv[2] || '');
const NEW = path.join(root, 'index.html');
if (!process.argv[2] || !fs.existsSync(OLD)) { console.error('Bitte Pfad zur index.html von main angeben.'); process.exit(2); }
const req = createRequire(path.join(root, 'package.json'));
let pwMod;
try { pwMod = createRequire(import.meta.url)('playwright'); } catch { pwMod = createRequire('/opt/node22/lib/node_modules/')('playwright'); }
const pako = req('pako');
const { makeDict, isKnown } = await import('../src/core/restwoerter.js');
const { fold } = await import('../src/core/fold.js');
const { FIRST, LAST } = await import('../src/generated/names.js');
const { SECTIONS } = await import('./korpus/korpus-quelle.mjs');

// Wortliste genau so, wie sie in index.html steht
const html = fs.readFileSync(NEW, 'utf8');
const b64 = html.match(/<script type="application\/octet-stream" id="woerter-daten">([A-Za-z0-9+/=]+)<\/script>/)[1];
const dict = makeDict(new TextDecoder().decode(pako.inflateRaw(Buffer.from(b64, 'base64'))));
const known = (w) => isKnown(dict, w, false);
// zum Vergleich: übliche Endungen abtrennen (Stamm mindestens 3 Buchstaben)
const ENDS = ['ens', 'ern', 'en', 'er', 'es', 'em', 'e', 'n', 's'];
const knownStripped = (w) => known(w) || ENDS.some((e) => w.length - e.length >= 3 && w.toLowerCase().endsWith(e) && known(w.slice(0, -e.length)));

const out = [];
const log = (s = '') => { out.push(s); console.log(s); };
log('# Messungen „Diese Wörter bleiben stehen“ (Version 2.9.0)');
log('');
log('Modus „Person A“, Standard-Einstellungen, keine Antwort. Nur Chromium. Alle Namen in den Testdateien sind erfunden.');
log('');

// ---------- Einordnung ----------
const firstSet = new Set(FIRST.split('|'));
const lastSet = new Set(LAST.split('|'));
// von Hand eingeordnet (Testdateien sind erfunden; Einordnung nach dem Satz, in dem das Wort steht)
const P = 'Name einer Person (erfunden)';
const PG = 'Name einer Person in GROSS-Form mit Endung (erfunden)';
const E = 'Einrichtung oder Ort (erfunden)';
const K = 'Kürzel einer Einrichtung (erfunden)';
const SW = 'Sachwort (kein Name)';
const SG = 'Sachwort in GROSS-Form mit Endung (kein Name)';
const HAND = {
  Brzęczek: P, Dobbeling: P, Hallmayer: P, Huckebein: P, Ijeoma: P, Jolanthe: P, Kirchbichler: P, Kortlang: P, Rautenbach: P,
  Sonnleitner: P, Uchendu: P, Wenjie: P, Xiong: P, Wittekindhorn: P, WITTEKINDHORN: P, WITTEKINDHORNES: PG, WITTEKINDHORNN: PG,
  WITTEKINDHORNNS: PG, WITTEKINDHORNS: PG, QUABBENJANSEN: P, QUABBENJANSENES: PG, QUABBENJANSENN: PG, QUABBENJANSENNS: PG,
  QUABBENJANSENS: PG, LÜDINGHAUS: P, LÜDINGHAUSES: PG, LÜDINGHAUSN: PG, LÜDINGHAUSNS: PG, LÜDINGHAUSS: PG,
  Tannfeld: E, Tannhofen: E, Lindenblick: E, Lindenschule: E, Wiesenkamp: E, Lindenauer: 'Ortsname als Beiwort („Lindenauer Bürgerverein“, erfunden)',
  OGTS: K, GYMTH: K, FZS: K, BÜRGERVEREINES: SG, BÜRGERVEREINN: SG, BÜRGERVEREINNS: SG,
  Pausenverkauf: SW, Klassenleitung: SW, Bastelgruppe: SW, ELTERNINFORMATION: SW, Elterncafé: SW, Kopfzeilenzeichen: SW, Kursname: SW,
  Kursübersicht: SW, Protokollführung: SW, Teamsitzung: SW, TÖPFERKURS: SW, Töpferkurs: SW, Vortreffen: SW,
  Übertragungs: 'Sachwort-Teil („Übertragungs-“ in einer Zusammensetzung)',
};
function classify(w, nameSpans) {
  if (nameSpans && nameSpans.has(fold(w))) return 'Name (im Korpus als Name gekennzeichnet)';
  if (HAND[w]) return HAND[w];
  const k = fold(w);
  if (lastSet.has(k) || firstSet.has(k)) return 'Name (steht in den Namenslisten des Tools)';
  return nameSpans ? 'kein Name (Sachwort)' : 'NICHT EINGEORDNET';
}

// ---------- Browser ----------
const browser = await pwMod.chromium.launch();
async function page(file) {
  const ctx = await browser.newContext();
  const p = await ctx.newPage();
  await p.goto('file://' + file);
  return { p, ctx };
}
const { p: pg, ctx: pctx } = await page(NEW);
async function restOf(bytes, name) {
  return pg.evaluate(async ([arr, nm]) => {
    const A = window.__anon;
    A.app.state.settings.mode = 'person';
    await A.openBytes(new Uint8Array(arr), nm);
    const q = A.questions().find((x) => x.kind === 'rest');
    const o = await A.buildOutput('txt');
    return { words: q ? q.words.map((w) => ({ word: w.word, count: w.count })) : [], out: o.text || '' };
  }, [[...bytes], name]);
}

// ---------- 1. Testdateien ----------
log('## 1. Listenlänge je vorhandener Testdatei');
log('');
log('„ohne Endungen“ = gebaut (genaue Wortform); „mit Endungen“ = nur gemessen (Stamm ohne -s, -e, -n, -en, -er, -es, -em, -ern, -ens).');
log('');
log('| Datei | Liste (gebaut) | mit Endungs-Abtrennung | Wörter (Einordnung) |');
log('|---|---|---|---|');
const DIRS = ['fixtures', 'fixtures-traeger', 'fixtures-spalten', 'fixtures-anzeige', 'fixtures-bedienung', 'fixtures-pfade', 'fixtures-reste'];
const cats = new Map();
let files = 0;
for (const d of DIRS) {
  for (const f of fs.readdirSync(path.join(here, d)).filter((x) => /\.(txt|csv|docx|xlsx|pdf)$/.test(x)).sort()) {
    let r;
    try { r = await restOf(fs.readFileSync(path.join(here, d, f)), f); } catch (e) { log(`| ${d}/${f} | nicht lesbar (${e.message.slice(0, 60)}) | | |`); continue; }
    files++;
    const strip = r.words.filter((w) => !knownStripped(w.word));
    const desc = r.words.map((w) => { const c = classify(w.word); cats.set(c, (cats.get(c) || 0) + 1); return `${w.word} – ${c}`; });
    log(`| ${d}/${f} | ${r.words.length} | ${strip.length} | ${desc.join('; ') || '–'} |`);
  }
}
log('');
log(`${files} Dateien. Einordnung aller Listeneinträge: ${[...cats].map(([c, n]) => `${c}: ${n}`).join('; ')}.`);
log('');

// ---------- 2. Korpus ----------
log('## 2. Listenlänge je Korpus-Abschnitt (tests/korpus/korpus-quelle.mjs)');
log('');
log('| Abschnitt | Wörter | Liste (gebaut) | je 100 Wörter | mit Endungs-Abtrennung | Wörter (Einordnung) |');
log('|---|---|---|---|---|---|');
let notShown = [];
let shownNames = [];
for (const [sec, src] of Object.entries(SECTIONS)) {
  const nameSpans = new Set();
  for (const m of src.matchAll(/⟦([^⟧]*)⟧/g)) for (const t of m[1].split(/[^\p{L}\p{M}]+/u)) if (t) nameSpans.add(fold(t));
  const text = src.replace(/[⟦⟧]/g, '');
  const nWords = (text.match(/[\p{L}\p{N}]+/gu) || []).length;
  const r = await restOf(Buffer.from(text, 'utf8'), sec + '.txt');
  const strip = r.words.filter((w) => !knownStripped(w.word));
  log(`| ${sec} | ${nWords} | ${r.words.length} | ${(100 * r.words.length / nWords).toFixed(1)} | ${strip.length} | ${r.words.map((w) => `${w.word} – ${classify(w.word, nameSpans)}`).join('; ') || '–'} |`);
  // Namen (gekennzeichnet), die nach der Ersetzung noch im Text stehen
  const listed = new Set(r.words.map((w) => fold(w.word)));
  for (const m of src.matchAll(/⟦([^⟧]*)⟧/g)) {
    for (const t of m[1].split(/[^\p{L}\p{M}]+/u)) {
      if (!t || ['Herr', 'Herrn', 'Frau', 'Dr'].includes(t) || [...t].length < 3) continue;
      if (!new RegExp(`(^|[^\\p{L}])${t}([^\\p{L}]|$)`, 'u').test(r.out)) continue;
      (listed.has(fold(t)) ? shownNames : notShown).push(`${t} (${sec})`);
    }
  }
}
log('');

// ---------- 3. Namen, die die Liste NICHT zeigt ----------
log('## 3. Namen, die die Liste nicht zeigt');
log('');
log(`- Korpus: gekennzeichnete Namen, die nach der Ersetzung noch im Text stehen: ${shownNames.length + notShown.length}. Davon in der Liste: ${shownNames.length}${shownNames.length ? ' (' + shownNames.join(', ') + ')' : ''}; NICHT in der Liste (stehen in der Wortliste): ${notShown.length}${notShown.length ? ' (' + notShown.join(', ') + ')' : ''}.`);
const ex = ['Regenbogen', 'Schuster', 'Kirchberg', 'Gesine', 'Karsten', 'Bodo', 'Müller', 'Schmidt', 'Weber', 'Koch', 'Winter', 'Rosen', 'Brandner', 'Okonkwo', 'Rautenbach'];
log(`- Beispiele (gewöhnliches Wort laut Wortliste = wird nicht gezeigt): ${ex.map((w) => `${w}: ${known(w) ? 'nicht gezeigt' : 'gezeigt'}`).join(', ')}.`);
const share = (set, label) => {
  let n = 0; let k = 0;
  for (const w of set) { if ([...w].length < 3 || !/^\p{L}+$/u.test(w)) continue; n++; if (known(w[0].toUpperCase() + w.slice(1))) k++; }
  return `${label}: ${k} von ${n} (${(100 * k / n).toFixed(1)} %) stehen in der Wortliste`;
};
log(`- Namenslisten des Tools (sie zeigen, wie viele Namen eine Wortliste „kennt“): ${share(lastSet, 'Nachnamen')}; ${share(firstSet, 'Vornamen')}. Solche Namen kommen nie in die Liste, wenn das Tool sie nicht ersetzt.`);
log('');

// ---------- 4. Fehlerrate ----------
log('## 4. Fehlerrate „fälschlich bekannt“');
log('');
{
  const words = JSON.parse(fs.readFileSync(path.join(root, 'node_modules/all-the-german-words/woerter.json'), 'utf8'));
  const S = new Set();
  for (const w of words) { const l = String(w).normalize('NFC').toLowerCase(); S.add(l); S.add(fold(l)); }
  let seed = 20261122;
  const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  const A = 'abcdefghijklmnopqrstuvwxyzäöüß';
  let n = 0; let fp = 0; let real = 0;
  while (n < 100000) {
    let w = '';
    const L = 4 + Math.floor(rnd() * 9);
    for (let i = 0; i < L; i++) w += A[Math.floor(rnd() * A.length)];
    if (S.has(w) || S.has(fold(w))) { real++; continue; }
    n++;
    if (dict.has(w) || dict.has(fold(w))) fp++;
  }
  let miss = 0;
  for (const l of S) if (/^\p{L}{3,}$/u.test(l) && !dict.has(l)) miss++;
  log(`- 100 000 erfundene Nichtwörter (4 bis 12 Buchstaben, Zufall mit festem Startwert; ${real} zufällig echte Wörter verworfen): **${fp} fälschlich als bekannt** (Fehlerrate ${(fp / 1000).toFixed(3)} %).`);
  log(`- Gegenrichtung: Wörter der Liste (nur Buchstaben, ab 3), die die Struktur NICHT findet: ${miss}.`);
}
log('');

// ---------- 5. Größe und Zeit ----------
log('## 5. Größe und Zeit (Chromium, headless, Median aus 5 Läufen; große Testdatei: 1 Lauf)');
log('');
const med = (a) => a.sort((x, y) => x - y)[Math.floor(a.length / 2)];
async function timing(file) {
  const start = [];
  const pruef = [];
  const pruef2 = [];
  for (let i = 0; i < 5; i++) {
    const { p, ctx } = await page(file);
    start.push(await p.evaluate(() => { const n = performance.getEntriesByType('navigation')[0]; return n.domContentLoadedEventEnd - n.startTime; }));
    const bytes = [...fs.readFileSync(path.join(here, 'fixtures-traeger', 'anmeldung.docx'))];
    pruef.push(await p.evaluate(async (arr) => { const A = window.__anon; const t0 = performance.now(); await A.openBytes(new Uint8Array(arr), 'anmeldung.docx'); A.questions(); return performance.now() - t0; }, bytes));
    pruef2.push(await p.evaluate(async (arr) => { const A = window.__anon; const t0 = performance.now(); await A.openBytes(new Uint8Array(arr), 'anmeldung.docx'); A.questions(); return performance.now() - t0; }, bytes));
    await ctx.close();
  }
  // große Testdatei wie in run-tests.mjs: protokoll.txt wiederholt bis 10 MB
  const para = fs.readFileSync(path.join(here, 'fixtures', 'protokoll.txt'), 'utf8');
  let t = '';
  while (t.length < 10 * 1024 * 1024) t += para + '\n';
  const { p, ctx } = await page(file);
  const big = await p.evaluate(async (s) => {
    const A = window.__anon;
    const t0 = performance.now();
    await A.openBytes(new TextEncoder().encode(s), 'gross.txt');
    const t1 = performance.now();
    const q = A.questions();
    const t2 = performance.now();
    const rq = q.find((x) => x.kind === 'rest');
    return { load: t1 - t0, q: t2 - t1, n: rq ? rq.words.length : 0 };
  }, t);
  await ctx.close();
  return { size: fs.statSync(file).size, start: med(start), pruef: med(pruef), pruef2: med(pruef2), big };
}
const a = await timing(OLD);
const b = await timing(NEW);
log('| | vorher (main, 2.8.1) | nachher (2.9.0) |');
log('|---|---|---|');
log(`| Größe index.html | ${a.size} Bytes (${(a.size / 1048576).toFixed(2)} MB) | ${b.size} Bytes (${(b.size / 1048576).toFixed(2)} MB); Zuwachs ${b.size - a.size} Bytes (${((b.size - a.size) / 1048576).toFixed(2)} MB) |`);
log(`| Start (bis DOMContentLoaded) | ${a.start.toFixed(0)} ms | ${b.start.toFixed(0)} ms |`);
log(`| erstes Dokument bis „Prüfen“ (anmeldung.docx laden, Fragen; nachher inkl. einmaligem Entpacken der Wortliste) | ${a.pruef.toFixed(0)} ms | ${b.pruef.toFixed(0)} ms |`);
log(`| zweites Dokument bis „Prüfen“ (Wortliste schon entpackt) | ${a.pruef2.toFixed(0)} ms | ${b.pruef2.toFixed(0)} ms |`);
log(`| große Testdatei (10 MB TXT): Laden und Analyse | ${(a.big.load / 1000).toFixed(1)} s | ${(b.big.load / 1000).toFixed(1)} s |`);
log(`| große Testdatei: Fragen berechnen (nachher inkl. Liste) | ${a.big.q.toFixed(0)} ms | ${b.big.q.toFixed(0)} ms (${b.big.n} Wörter in der Liste) |`);
log('');
await pctx.close();
await browser.close();
fs.writeFileSync(path.join(here, 'RESTWOERTER-MESSUNGEN.md'), out.join('\n') + '\n');
