// Version 2.4.0: Wochentag vor Uhrzeit/Datum (Weg d) und Liste gewöhnlicher Wörter als „mehrdeutig“ (Weg a″).
// Einzelprüfungen und Zusammenspiel (Regel a2, b2, Einrichtungen, Endungs-/Großformen), vorher und nachher, am Kern.
// Ergebnis: tests/WORTLISTE-REPORT.md. Aufruf: node tests/wortliste-test.mjs <src-Ordner der Version 2.3.4>
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const oldSrc = process.argv[2] ? path.resolve(process.argv[2]) : null;
if (!oldSrc) { console.error('Bitte Pfad zum src-Ordner der Version 2.3.4 angeben.'); process.exit(2); }
const OLD = await import(pathToFileURL(path.join(oldSrc, 'core/detect.js')).href);
const NEW = await import('../src/core/detect.js');
const LEX = await import('../src/core/lexicon.js');
const report = [];
const log = (s = '') => { report.push(s); console.log(s); };
const checks = [];
const check = (name, ok, detail = '') => { checks.push([name, ok]); log(`- ${ok ? 'OK' : 'FEHLER'}: ${name}${detail ? ' – ' + detail : ''}`); };
const run = (M, units, opt = {}) => {
  const st = M.defaultState();
  Object.assign(st, opt);
  const r = M.analyze(units.map((u) => (typeof u === 'string' ? { text: u } : u)), st);
  return r;
};
const desc = (r) => r.hits.filter((h) => h.type === 'person').map((h) => `${r.fullText.slice(h.s, h.e).replace(/\n/g, '⏎')} (${h.cert}, ${h.on ? 'an' : 'aus'}${h.calendar ? ', Regel b2' : ''}${h.a2 ? ', Regel a2' : ''})`).join('; ') || 'kein Personentreffer';
const both = (units, opt) => ({ a: run(OLD, units, opt), b: run(NEW, units, opt) });
const hitOf = (r, w) => r.hits.find((h) => h.type === 'person' && r.fullText.slice(h.s, h.e) === w);

log('# Wortliste „mehrdeutig“ und Wochentag vor Uhrzeit (Version 2.4.0): Tests');
log('');
log(`Liste (${LEX.EXTRA_AMBIGUOUS.length} Wörter): ${LEX.EXTRA_AMBIGUOUS.join(', ')}`);
log('');
log('## Einzelprüfungen (vorher = 2.3.4, nachher = diese Version)');
const CASES = [
  ['Die Kita Freie Waldorfschule lädt ein.', (r) => !hitOf(r, 'Kita Freie'), 'kein Personentreffer „Kita Freie“ mehr'],
  ['Yoga für Anfänger', (r) => hitOf(r, 'Yoga') && hitOf(r, 'Yoga').cert === 'unsicher', '„Yoga“ nicht mehr „sicher“'],
  ['Der Handball-Campus beginnt um 10 Uhr.', (r) => !hitOf(r, 'Handball-Campus') || hitOf(r, 'Handball-Campus').cert !== 'sicher', '„Handball-Campus“ nicht mehr „sicher“'],
  ['Do 13:30 Uhr Elterncafé', (r) => !hitOf(r, 'Do'), 'kein Treffer'],
  ['Mo 05.10. Ausflug zum Bauernhof', (r) => !hitOf(r, 'Mo'), 'kein Treffer'],
  ['Do. 13:30 Uhr Elterncafé', (r) => hitOf(r, 'Do') && hitOf(r, 'Do').calendar && !hitOf(r, 'Do').on, 'mit Punkt weiter Regel b2 (unsicher, aus)'],
  ['Frau Do kommt um 13:30.', (r) => hitOf(r, 'Do') && hitOf(r, 'Do').on && hitOf(r, 'Do').cert === 'sicher', 'echte Person nach Anrede bleibt ersetzt'],
  ['Frau Do 13:30 Uhr', (r) => hitOf(r, 'Do') && hitOf(r, 'Do').on, 'echte Person nach Anrede vor Uhrzeit bleibt ersetzt'],
];
for (const [t, ok, what] of CASES) {
  const { a, b } = both([t]);
  log(`- „${t}“: vorher ${desc(a)}; nachher ${desc(b)}`);
  check(`„${t}“: ${what}`, !!ok(b));
}
log('');

log('## Zusammenspiel');
// Regel a2: Wort der Liste nach allein stehender Anrede bleibt ersetzt (als „unsicher, an“)
for (const w of ['Yoga', 'Kita', 'Mama', 'Kalender', 'Campus']) {
  const units = [{ text: 'Herr' }, { text: w, follows: true }, { text: 'Er kommt morgen.' }];
  const { a, b } = both(units);
  const hb = hitOf(b, w);
  log(`- Regel a2, „Herr“ ⏎ „${w}“: vorher ${desc(a)}; nachher ${desc(b)}`);
  check(`Regel a2: „${w}“ nach allein stehender Anrede bleibt ersetzt`, !!hb && hb.on && hb.cert === 'unsicher');
}
// Einrichtungen: Vorrang und Schlusscheck für „Freie Waldorfschule“ unverändert
{
  const units = [{ text: 'Kita Freie' }, { text: 'Waldorfschule', follows: true }, { text: 'Die Freie Waldorfschule lädt ein.' }];
  const opt = { orgTerms: ['Freie Waldorfschule'] };
  const { a, b } = both(units, opt);
  const orgs = (r) => r.hits.filter((h) => h.type === 'org').map((h) => r.fullText.slice(h.s, h.e)).join('; ');
  const la = OLD.orgCoverageLeaks(a, opt.orgTerms).map((f) => f.text.replace(/\n/g, '⏎'));
  const lb = NEW.orgCoverageLeaks(b, opt.orgTerms).map((f) => f.text.replace(/\n/g, '⏎'));
  log(`- Einrichtung „Freie Waldorfschule“: Treffer vorher „${orgs(a)}“, nachher „${orgs(b)}“; Schlusscheck Einrichtung vorher ${la.join(', ')}, nachher ${lb.join(', ')}; Personen vorher ${desc(a)}, nachher ${desc(b)}`);
  check('Einrichtungen: Vorrang und Schlusscheck für „Freie Waldorfschule“ unverändert', orgs(a) === orgs(b) && la.join('|') === lb.join('|'));
}
// Endungs- und Großformen: Übertragung bleibt (Wort der Liste als echter Name)
for (const [w, forms] of [['Kalender', ['Kalenders', 'KALENDER', 'KALENDERS']], ['Yoga', ['Yogas', 'YOGA', 'YOGAS']], ['Pole', ['Poles', 'POLE']]]) {
  const t = `Herr Felix ${w} kommt. ${forms.map((f) => `Akte ${f} liegt vor.`).join(' ')}`;
  const { a, b } = both([t]);
  const lost = forms.filter((f) => { const ha = a.hits.find((h) => h.type === 'person' && a.fullText.slice(h.s, h.e) === f); const hb = b.hits.find((h) => h.type === 'person' && b.fullText.slice(h.s, h.e) === f); return ha && ha.on && !(hb && hb.on); });
  log(`- Übertragung „${w}“: vorher ${desc(a)}; nachher ${desc(b)}`);
  check(`Endungs-/Großformen von „${w}“: keine Übertragung entfällt, alles bleibt ersetzt`, lost.length === 0, lost.length ? 'verloren: ' + lost.join(', ') : '');
}
// Liste enthält nur Wörter der Namenslisten (sonst wäre der Eintrag wirkungslos)
check('Jedes Wort der Liste steht in einer Namensliste', LEX.EXTRA_AMBIGUOUS.every((k) => LEX.isFirst(k) || LEX.isLast(k)));

const failed = checks.filter((c) => !c[1]);
log('');
log(`Prüfungen: ${checks.length - failed.length} von ${checks.length} bestanden${failed.length ? ' – FEHLER: ' + failed.map((c) => c[0]).join('; ') : ''}.`);
fs.writeFileSync(path.join(here, 'WORTLISTE-REPORT.md'), report.join('\n') + '\n');
process.exit(failed.length ? 1 : 0);
