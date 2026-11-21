// Messkorpus-Test (seit Version 2.4.0): Wie gut trennt die Erkennung echte Namen von gewöhnlichen Wörtern?
// Korpus: tests/korpus/korpus-quelle.mjs (erfunden, jeder echte Personenname mit ⟦…⟧ gekennzeichnet).
// Gezählt wird je Wort: Fehltreffer (sicher / unsicher an / unsicher aus), echte Namen (ersetzt / nur als Frage /
// ganz übersehen), dazu Zahl der Fragen (Personen mit unsicheren Treffern) und Schlusscheck-Meldungen.
// Jede Änderung an der Erkennung liefert dieselben Zahlen wie tests/korpus/erwartung.json oder zeigt die Abweichung.
// Aufruf: node tests/korpus-test.mjs [--update] [--src <Ordner mit core/>] [--zellen]
//   --update  Erwartung neu schreiben (nur nach bewusster, begründeter Änderung)
//   --src     anderen Stand messen (z. B. eine ältere Version zum Vergleich)
//   --zellen  Tabelle und Liste als einzelne Zellen (wie CSV/Excel)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const UPDATE = args.includes('--update');
const CELLS = args.includes('--zellen');
const srcIdx = args.indexOf('--src');
const SRC = srcIdx >= 0 ? path.resolve(args[srcIdx + 1]) : path.resolve(here, '../src');
const OTHER = srcIdx >= 0;
const { analyze, defaultState, tokenize, replacementsByUnit, applyReplacements, leakForms, findLeaks } = await import(pathToFileURL(path.join(SRC, 'core/detect.js')).href);
const { SECTIONS } = await import('./korpus/korpus-quelle.mjs');

// Titel und Anreden innerhalb der Kennzeichnung zählen nicht als Namenswort
const TITLES = new Set(['Dr', 'Dr.', 'Herr', 'Herrn', 'Frau']);
const units = [];
for (const [sec, txt] of Object.entries(SECTIONS)) {
  for (const line of txt.split('\n')) {
    const parts = CELLS && (sec === 'tabelle' || sec === 'liste') && line.includes(';') ? line.split(';').map((x) => x.trim()) : [line];
    for (const p of parts) {
      let text = '';
      const spans = [];
      let pos = 0;
      for (const m of p.matchAll(/⟦([^⟧]*)⟧/g)) { text += p.slice(pos, m.index); spans.push([text.length, text.length + m[1].length]); text += m[1]; pos = m.index + m[0].length; }
      text += p.slice(pos);
      units.push({ text, spans, sec });
    }
  }
}
const r = analyze(units.map((u) => ({ text: u.text })), defaultState());
const KEYS = ['fehltreffer_sicher', 'fehltreffer_unsicher_an', 'fehltreffer_unsicher_aus', 'namen_ersetzt', 'namen_nur_frage', 'namen_uebersehen', 'fragen', 'schlusscheck'];
const res = Object.fromEntries(KEYS.map((k) => [k, 0]));
const words = {}; // Kategorie -> [Wort (Abschnitt)]
units.forEach((u, ui) => {
  const base = r.unitStarts[ui];
  for (const tk of tokenize(u.text)) {
    if (!tk.word || TITLES.has(tk.t)) continue;
    const isName = u.spans.some(([s, e]) => tk.s >= s && tk.e <= e);
    const h = r.hits.find((x) => x.type === 'person' && x.s < base + tk.e && x.e > base + tk.s);
    let cat = null;
    if (isName) cat = !h ? 'namen_uebersehen' : h.on ? 'namen_ersetzt' : 'namen_nur_frage';
    else if (h) cat = h.cert === 'sicher' && h.on ? 'fehltreffer_sicher' : h.on ? 'fehltreffer_unsicher_an' : 'fehltreffer_unsicher_aus';
    if (!cat) continue;
    res[cat]++;
    (words[cat] = words[cat] || []).push(`${tk.t} (${u.sec})`);
  }
});
res.fragen = [...r.entities.values()].filter((en) => en.hits.some((x) => x.type === 'person' && x.cert === 'unsicher')).length;
const reps = replacementsByUnit(r, units);
res.schlusscheck = findLeaks(leakForms(r), units.map((u, i) => ({ where: '', text: applyReplacements(u.text, reps[i]) }))).length;

const nameWords = units.reduce((n, u) => n + tokenize(u.text).filter((tk) => tk.word && !TITLES.has(tk.t) && u.spans.some(([s, e]) => tk.s >= s && tk.e <= e)).length, 0);
const allWords = units.reduce((n, u) => n + tokenize(u.text).filter((tk) => tk.word).length, 0);
const LABEL = { fehltreffer_sicher: 'Fehltreffer sicher', fehltreffer_unsicher_an: 'Fehltreffer unsicher an', fehltreffer_unsicher_aus: 'Fehltreffer unsicher aus', namen_ersetzt: 'Namen ersetzt', namen_nur_frage: 'Namen nur als Frage', namen_uebersehen: 'Namen ganz übersehen', fragen: 'Fragen (Personen)', schlusscheck: 'Schlusscheck-Meldungen' };
const expFile = path.join(here, 'korpus', CELLS ? 'erwartung-zellen.json' : 'erwartung.json');
const out = [`# Messkorpus${CELLS ? ' (Tabelle/Liste als Zellen)' : ''}${OTHER ? ` – Stand aus ${SRC}` : ''}`, '',
  `${units.length} Abschnitte, ${allWords} Wörter, davon ${nameWords} Namenswörter (gekennzeichnet).`, '',
  `| ${KEYS.map((k) => LABEL[k]).join(' | ')} |`, `|${KEYS.map(() => '---').join('|')}|`, `| ${KEYS.map((k) => res[k]).join(' | ')} |`, ''];
for (const k of ['fehltreffer_sicher', 'fehltreffer_unsicher_an', 'namen_nur_frage', 'namen_uebersehen']) out.push(`- ${LABEL[k]}: ${(words[k] || []).join(', ') || '–'}`);
let failed = false;
if (!OTHER) {
  if (UPDATE || !fs.existsSync(expFile)) {
    fs.writeFileSync(expFile, JSON.stringify(res, null, 2) + '\n');
    out.push('', `Erwartung geschrieben: ${path.relative(path.resolve(here, '..'), expFile)}`);
  } else {
    const exp = JSON.parse(fs.readFileSync(expFile, 'utf8'));
    const diff = KEYS.filter((k) => exp[k] !== res[k]);
    out.push('', diff.length ? `ABWEICHUNG von der Erwartung: ${diff.map((k) => `${LABEL[k]} ${exp[k]} → ${res[k]}`).join('; ')}` : 'Alle Zahlen wie erwartet.');
    failed = diff.length > 0;
  }
  if (!CELLS) fs.writeFileSync(path.join(here, 'KORPUS-REPORT.md'), out.join('\n') + '\n');
}
console.log(out.join('\n'));
process.exit(failed ? 1 : 0);
