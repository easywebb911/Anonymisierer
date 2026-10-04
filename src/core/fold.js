// Vergleichsschlüssel für Namen: Kleinschreibung, ohne Akzente/Diakritika.
// Beispiele: "Müller" -> "muller", "Yılmaz" -> "yilmaz", "Łukasz" -> "lukasz".
const SPECIAL = { 'ß': 'ss', 'ı': 'i', 'ł': 'l', 'đ': 'd', 'ø': 'o', 'æ': 'ae', 'œ': 'oe', 'þ': 'th', 'ð': 'd', 'ħ': 'h', 'ŀ': 'l' };

const cache = new Map();
export function fold(s) {
  let t = cache.get(s);
  if (t !== undefined) return t;
  if (/^[a-z'-]*$/.test(s)) t = s;
  else {
    t = s.normalize('NFC').toLowerCase().normalize('NFD').replace(/\p{M}+/gu, '');
    t = t.replace(/[ßıłđøæœþðħŀ]/g, (c) => SPECIAL[c]);
    t = t.replace(/[’ʼ`´‘]/g, "'");
  }
  if (cache.size > 200000) cache.clear();
  cache.set(s, t);
  return t;
}

// Umlaute als "ae/oe/ue" geschrieben (z. B. "Mueller") – zusätzliche Schreibweise.
export function umlautVariant(s) {
  const t = s.normalize('NFC');
  if (!/[äöüÄÖÜ]/.test(t)) return null;
  return t.replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue')
    .replace(/Ä/g, 'Ae').replace(/Ö/g, 'Oe').replace(/Ü/g, 'Ue');
}
