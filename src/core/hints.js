// Version 2.7.0 (PR A): Warnpunkt „Hier könnte eine Einrichtung stehen“. Findet Stellen, die wie der Name einer
// Einrichtung aussehen. Nur ein Hinweis beim Speichern: ersetzt nichts, fragt nichts, ändert keine Ausgabe.
// a) Kopfwort (auch mit Endung) direkt gefolgt von großgeschriebenen Wörtern („Gymnasium Tannhofen“) oder ein Wort mit
//    Bindestrich vor dem Kopfwort („Tannhofen-Gymnasium“)
// b) großgeschriebenes Wort vor einer Rechtsform („Muster GmbH“, „Brandner e. V.“)
// c) zwei bis sechs Wörter in Anführungszeichen, das erste großgeschrieben („Brandner lern und spiel“)
export const HEAD_WORDS = ['Gymnasium', 'Schule (und Wörter auf -schule)', 'Universität', 'Kita', 'Kindergarten', 'Krippe', 'Hort', 'Kinderhaus',
  'Familienzentrum', 'Jugendzentrum', 'Verein', 'Stiftung', 'Praxis', 'Klinik', 'Krankenhaus', 'Kanzlei', 'Firma', 'Institut', 'Akademie'];
export const LEGAL_FORMS = ['GmbH', 'gGmbH', 'AG', 'KG', 'UG', 'GbR', 'eG', 'e. V.', 'e.V.', 'mbH'];
const HEAD = '(?:\\p{Lu}[\\p{L}]*schul(?:e|en)|Schul(?:e|en)|Gymnasi(?:um|ums|en)|Universität(?:en)?|Kitas?|Kinderg(?:arten|artens|ärten)|Krippen?'
  + '|Hort(?:s|es|e|en)?|Kinderh(?:aus|auses|äuser|äusern)|Familienzentr(?:um|ums|en)|Jugendzentr(?:um|ums|en)|Verein(?:s|es|e|en)?|Stiftung(?:en)?'
  + '|Prax(?:is|en)|Klinik(?:en)?|Krankenh(?:aus|auses|äuser|äusern)|Kanzlei(?:en)?|Firm(?:a|en)|Institut(?:s|es|e|en)?|Akademi(?:e|en))';
const SP = '[ \\u00a0]+';
const CAPW = '\\p{Lu}[\\p{L}\\p{N}\'’]*(?:-[\\p{L}\\p{N}]+)*';
const RE_HEAD_NAME = new RegExp(`(?<![\\p{L}\\p{N}-])${HEAD}(?:${SP}${CAPW}){1,3}(?![\\p{L}\\p{N}])`, 'gu');
const RE_NAME_HEAD = new RegExp(`(?<![\\p{L}\\p{N}-])\\p{Lu}[\\p{L}\\p{N}]*(?:-\\p{Lu}[\\p{L}\\p{N}]*)*-${HEAD}(?![\\p{L}\\p{N}])`, 'gu');
const LF = '(?:gGmbH|GmbH|mbH|AG|KG|UG|GbR|eG|e\\.[ \\u00a0]?V\\.)';
const RE_LEGAL = new RegExp(`(?<![\\p{L}\\p{N}-])(?:${CAPW}${SP}(?:&${SP})?){1,3}${LF}(?![\\p{L}\\p{N}])`, 'gu');
const QUOTES = [['„', '“”'], ['“', '”'], ['"', '"'], ['»', '«'], ['«', '»']];
// Wörter am Anfang, die nicht zum Namen gehören (Satzanfang, Artikel)
const LEAD = /^(?:(?:Der|Die|Das|Den|Dem|Des|Ein|Eine|Einen|Einem|Einer|Bei|Von|Vom|Mit|Für|Im|In|Am|An|Zum|Zur|Und|Oder|Wir|Sie|Ihr|Unser|Unsere)[  ]+)+/u;

export function findOrgHints(text) {
  const out = [];
  if (!text) return out;
  const add = (s, e, rule) => { if (e > s) out.push({ s, e, text: text.slice(s, e), rule }); };
  for (const m of text.matchAll(RE_HEAD_NAME)) add(m.index, m.index + m[0].length, 'a');
  for (const m of text.matchAll(RE_NAME_HEAD)) add(m.index, m.index + m[0].length, 'a');
  for (const m of text.matchAll(RE_LEGAL)) {
    const lead = m[0].match(LEAD);
    const s = m.index + (lead ? lead[0].length : 0);
    // nur eine Rechtsform ohne Wort davor bleibt keine Stelle
    if (new RegExp(`^${LF}$`, 'u').test(text.slice(s, m.index + m[0].length))) continue;
    add(s, m.index + m[0].length, 'b');
  }
  for (const [open, closes] of QUOTES) {
    let i = text.indexOf(open);
    while (i >= 0) {
      let j = -1;
      for (let k = i + 1; k < text.length && k <= i + 100; k++) { if (closes.includes(text[k])) { j = k; break; } if (text[k] === '\n') break; }
      if (j < 0) { i = text.indexOf(open, i + 1); continue; }
      const inner = text.slice(i + 1, j);
      const words = inner.trim().split(/[  ]+/).filter(Boolean);
      if (inner.trim() === inner && words.length >= 2 && words.length <= 6 && /^\p{Lu}/u.test(words[0]) && words.every((w) => /[\p{L}\p{N}]/u.test(w))) add(i, j + 1, 'c');
      i = text.indexOf(open, j + 1);
    }
  }
  // überlappende Stellen: die längste zählt
  out.sort((a, b) => a.s - b.s || b.e - a.e);
  const res = [];
  for (const x of out) {
    const last = res[res.length - 1];
    if (last && x.s < last.e) { if (x.e - x.s > last.e - last.s) res[res.length - 1] = x; continue; }
    res.push(x);
  }
  return res;
}
