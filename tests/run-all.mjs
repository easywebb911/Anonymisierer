// Tempo: alle Testläufe gleichzeitig (npm run test:all) oder nur einzelne (npm run test:quick -- <Namen>).
// 1) Alte index.html-Versionen für die Vergleiche aus der Git-Geschichte holen (tests/out-alt/, nicht im Repo; nur lokal,
//    kein Netz) und ihre Prüfsumme prüfen.
// 2) Testdateien EINMAL vorher erzeugen (make-traeger, make-anzeige, make-spalten); während der Läufe erzeugt kein Lauf
//    sie neu (ANON_FIXTURES_FERTIG=1).
// 3) Läufe gleichzeitig starten (so viele wie Rechenkerne; --jobs N), je Lauf eigenes Protokoll (tests/out-logs/<Name>.log),
//    „bestanden/gesamt“ und Dauer sammeln. Endet mit Fehler, wenn ein Lauf scheitert.
// 4) test:all schreibt tests/STAND.md (Version, sha256 der index.html, je Lauf bestanden/gesamt und Dauer, Gesamtdauer).
// Aufruf: node tests/run-all.mjs [--jobs N] [--quick name1 name2 …]
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const ALT = path.join(here, 'out-alt');
const LOGS = path.join(here, 'out-logs');
const args = process.argv.slice(2);
let jobs = os.cpus().length;
const ji = args.indexOf('--jobs');
if (ji >= 0) jobs = Math.max(1, Number(args[ji + 1]) || 1);
const quick = args.includes('--quick') ? args.slice(args.indexOf('--quick') + 1).filter((a) => !a.startsWith('--')) : null;

// Alte Versionen: Name -> [Commit, sha256-Anfang der index.html]
const OLD = {
  '2.3.0': ['53cf64905a5e43ce0dbe64a856789148929dcaa6', '03d8c27ceb9230f6'],
  '2.3.1': ['176f15d92a4f1d0ef7c22f08913f4642f985e09c', 'df1f14af7f74ddfc'],
  '2.3.2': ['bc341bd71f545bfbe2e38201c5cd9a266e416716', '09aaa2f024ede98b'],
  '2.3.3': ['19b5697a34b96a53bedd9afbbff9c2a0485bf0ad', '22306d4f7a086342'],
  '2.4.0': ['a744a765d05c64689a6b2d798486ae0198d51193', 'f4162bb516cedf58'],
  '2.4.1': ['39b85d5ae3ba8d643036c8f6d53a8dcb00e5781e', '6e67c6f8f1fb70e2'],
  '2.5.0': ['ae8aec6f5a47062f61a8e3f6e3d6def7a1668198', '3d1acf7ceaf96b21'],
  '2.7.0': ['3ecfe3245b60e892fb764db6a1c07d44d9fb5838', '631a2bcd05e3aaf8'],
  '2.8.0': ['81b863b2786b1a8a62d310dc7310c33fcadf69c9', 'c3ce5b2b219992ef'],
  '2.8.1': ['cccf13c16473a6c1999e45427d4649bf12a009ed', '51b039c10a514d2a'],
  '2.9.0': ['fc3d7e172b1c72f3e0560f45edd80fb6f0ee0d9e', 'c8117f37c68689cf'],
  '2.10.0': ['c6d74d8cfd24c5fa041f5f8d3de3a88f5224f1dc', 'f6e9546bf17ad947'],
  '2.11.0': ['a9f6b1696e08a9ba8ee7f76a08cfaac9426ee7a0', '89e519fd9cf15896'],
  '2.11.1': ['0aec7e6cafdff096c0ef871c1cd4e543aa4979b7', 'e6da1f81267284a3'],
};
const SRC_234 = '479aa0af98ff3d82723c6cc7e9715a4cafa5f349'; // src/ von Version 2.3.4 (wortliste-test)
const alt = (v) => path.join(ALT, `index-${v}.html`);

// Testläufe: Name, Skript, Argumente
const TESTS = [
  ['korpus', 'korpus-test.mjs', []],
  ['wortliste', 'wortliste-test.mjs', [path.join(ALT, 'src-2.3.4', 'src')]],
  ['spalten', 'spalten-test.mjs', ['--alt', alt('2.5.0')]],
  ['run-tests', 'run-tests.mjs', []],
  ['roundtrip', 'roundtrip.mjs', []],
  ['ui-flow', 'ui-flow.mjs', []],
  ['endungen', 'endungen-test.mjs', [alt('2.3.0')]],
  ['gross', 'gross-test.mjs', [alt('2.3.1')]],
  ['platzhalter', 'platzhalter-test.mjs', [alt('2.3.2')]],
  ['kollision', 'kollision-test.mjs', [alt('2.3.3')]],
  ['kennung', 'kennung-test.mjs', []],
  ['bilder', 'bilder-test.mjs', []],
  ['einrichtung', 'einrichtung-test.mjs', []],
  ['meta-proof', 'meta-proof.mjs', []],
  ['pfade', 'pfade-test.mjs', [alt('2.4.0')]],
  ['bedienung', 'bedienung-test.mjs', [alt('2.4.1')]],
  ['anzeige', 'anzeige-test.mjs', []],
  ['regression', 'regression.mjs', [alt('2.11.1')]], // Version 2.11.2: Regression gegen main (2.11.1)
  ['bildrauschen', 'bildrauschen-test.mjs', [alt('2.11.1')]], // Version 2.11.2: Häkchen und Bilder, Zufallstreffer in Bilddaten
  ['traeger', 'traeger-test.mjs', [alt('2.7.0')]],
  ['massstab', 'massstab-test.mjs', [alt('2.7.0'), alt('2.8.0')]],
  ['nachbarn', 'nachbarn-test.mjs', [alt('2.7.0'), alt('2.8.0')]],
  ['restwoerter', 'restwoerter-test.mjs', []],
  ['nummern', 'nummern-test.mjs', [alt('2.11.0')]], // Version 2.11.1: heikle Spalten, eigene Nummer je Zelle
  ['spaltenwahl', 'spaltenwahl-test.mjs', [alt('2.10.0')]], // Version 2.10.0/2.11.0: Spalten behandeln (Gegenprobe gegen main 2.10.0)
];
// Längste zuerst (aus der Messung), damit die Gesamtzeit nicht vom Letzten abhängt
const ORDER = ['nachbarn', 'massstab', 'bedienung', 'spaltenwahl', 'nummern', 'bildrauschen', 'restwoerter', 'gross', 'run-tests', 'anzeige', 'regression', 'einrichtung', 'pfade', 'traeger', 'roundtrip', 'kollision', 'platzhalter', 'kennung', 'ui-flow', 'bilder', 'endungen', 'meta-proof', 'spalten', 'wortliste', 'korpus'];

const sha = (p) => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
function prepareOld() {
  fs.mkdirSync(ALT, { recursive: true });
  for (const [v, [commit, pre]] of Object.entries(OLD)) {
    const f = alt(v);
    if (!fs.existsSync(f) || !sha(f).startsWith(pre)) fs.writeFileSync(f, execFileSync('git', ['show', `${commit}:index.html`], { cwd: root, maxBuffer: 64 << 20 }));
    if (!sha(f).startsWith(pre)) throw new Error(`Alte Version ${v}: Prüfsumme passt nicht`);
  }
  const s = path.join(ALT, 'src-2.3.4');
  if (!fs.existsSync(path.join(s, 'src', 'core', 'detect.js'))) {
    fs.mkdirSync(s, { recursive: true });
    const tar = execFileSync('git', ['archive', SRC_234, 'src'], { cwd: root, maxBuffer: 256 << 20 });
    execFileSync('tar', ['-x', '-C', s], { input: tar });
  }
}
async function prepareFixtures() {
  // einmal vorher, in derselben Reihenfolge wie die Läufe sie bisher erzeugt haben
  await (await import('./make-spalten.mjs')).makeAll();
  await (await import('./make-anzeige.mjs')).makeAll();
  await (await import('./make-traeger.mjs')).makeAll();
  await (await import('./make-spaltenwahl.mjs')).makeAll();
}
// „bestanden/gesamt“ aus dem Protokoll lesen (jeder Lauf hat sein eigenes Format)
function score(name, log) {
  const pick = (re) => { const m = [...log.matchAll(re)].pop(); return m || null; };
  let m;
  if ((m = pick(/Prüfungen: (\d+) von (\d+) bestanden/g)) || (m = pick(/Ergebnis: (\d+) von (\d+) Prüfungen bestanden/g)) || (m = pick(/Ergebnis: (?:NICHT )?bestanden\*\* \((\d+)\/(\d+)\)/g))
    || (m = pick(/Ergebnis: (\d+)\/(\d+) bestanden/g)) || (m = pick(/Fallen-Prüfungen: (\d+) von (\d+) bestanden/g))) return `${m[1]}/${m[2]}`;
  if (name === 'regression' && (m = pick(/Regression: (\d+) von (\d+) Ausgaben byte-identisch, (\d+) gleich bis auf die Kennung.*?, (\d+) unterschiedlich/g))) {
    const v = (log.match(/(\d+) durch die Spalten-Behandlung von Version 2\.11\.0 geändert/) || [])[1];
    const pc = (log.match(/(\d+) nur durch eigene Nummern je Zelle in heiklen Spalten/) || [])[1];
    return `${Number(m[2]) - Number(m[4])}/${m[2]} (${m[1]} byte-gleich, ${m[3]} nur Kennung${v !== undefined && v !== '0' ? `, ${v} Spalten-Behandlung` : ''}${pc !== undefined ? `, ${pc} eigene Nummer je Zelle` : ''})`;
  }
  if (name === 'massstab' && (m = pick(/Geprüft: (\d+) Dateien.*?, (\d+) Stellen der Vorversion.*?(?:: (\d+) Stellen von 2\.8\.0)?/g))) {
    const a = pick(/\((\d+) Abweichung\(en\)\)/g);
    return `${a ? a[1] : '?'} Abweichungen (${m[1]} Dateien, ${m[2]} + ${(log.match(/: (\d+) Stellen von 2\.8\.0/) || [])[1] || '?'} Stellen)`;
  }
  if (name === 'korpus') return /Alle Zahlen wie erwartet/.test(log) ? 'alle Zahlen wie erwartet' : 'Zahlen weichen ab';
  if (name === 'run-tests') return 'Messbericht ohne Zähler (Ende erreicht)';
  return 'ohne Zähler';
}
function run(name, script, a) {
  return new Promise((resolve) => {
    const t0 = Date.now();
    const out = fs.openSync(path.join(LOGS, name + '.log'), 'w');
    const p = spawn(process.execPath, [path.join(here, script), ...a], { cwd: root, stdio: ['ignore', out, out], env: { ...process.env, ANON_FIXTURES_FERTIG: '1' } });
    p.on('close', (code) => {
      fs.closeSync(out);
      const log = fs.readFileSync(path.join(LOGS, name + '.log'), 'utf8');
      resolve({ name, code, sec: Math.round((Date.now() - t0) / 1000), score: score(name, log) });
    });
  });
}

const t0 = Date.now();
fs.rmSync(LOGS, { recursive: true, force: true });
fs.mkdirSync(LOGS, { recursive: true });
prepareOld();
await prepareFixtures();
const wanted = quick && quick.length ? quick : null;
if (wanted) for (const n of wanted) if (!TESTS.some((t) => t[0] === n)) { console.error(`Unbekannter Testlauf: ${n}. Bekannt: ${TESTS.map((t) => t[0]).join(', ')}`); process.exit(2); }
const list = TESTS.filter((t) => !wanted || wanted.includes(t[0])).sort((a, b) => ORDER.indexOf(a[0]) - ORDER.indexOf(b[0]));
console.log(`${list.length} Testläufe, ${jobs} gleichzeitig (${os.cpus().length} Rechenkerne).`);
const results = [];
const queue = [...list];
await Promise.all(Array.from({ length: Math.min(jobs, queue.length) }, async () => {
  while (queue.length) {
    const [n, s, a] = queue.shift();
    const r = await run(n, s, a);
    results.push(r);
    console.log(`${r.code === 0 ? 'OK    ' : 'FEHLER'} ${n.padEnd(12)} ${String(r.sec).padStart(4)} s  ${r.score}`);
  }
}));
const total = Math.round((Date.now() - t0) / 1000);
results.sort((a, b) => TESTS.findIndex((t) => t[0] === a.name) - TESTS.findIndex((t) => t[0] === b.name));
const bad = results.filter((r) => r.code !== 0);
console.log(`Gesamtdauer ${total} s; ${bad.length ? bad.length + ' Lauf/Läufe gescheitert: ' + bad.map((r) => r.name).join(', ') : 'alle bestanden'}. Protokolle: tests/out-logs/`);
if (!wanted) {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  const lines = ['# Stand der Tests (npm run test:all)', '', `Version ${pkg.version}; sha256 der index.html: ${sha(path.join(root, 'index.html'))}`, '',
    `${jobs} Läufe gleichzeitig auf ${os.cpus().length} Rechenkernen; Gesamtdauer ${total} s (mit Vorbereitung). Nur Chromium, Firefox prüft Easy.`, '',
    '| Testlauf | Ergebnis | bestanden/gesamt | Dauer |', '|---|---|---|---|',
    ...results.map((r) => `| ${r.name} | ${r.code === 0 ? 'bestanden' : '**NICHT bestanden**'} | ${r.score} | ${r.sec} s |`), ''];
  fs.writeFileSync(path.join(here, 'STAND.md'), lines.join('\n'));
}
process.exit(bad.length ? 1 : 0);
