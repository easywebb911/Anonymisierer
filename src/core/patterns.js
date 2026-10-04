// Kontaktdaten: E-Mail, Telefon, IBAN, Adresse/PLZ. Regelbasiert und deterministisch.

const EMAIL = /[\p{L}\p{N}._%+-]+@[\p{L}\p{N}-]+(?:\.[\p{L}\p{N}-]+)*\.\p{L}{2,}/gu;
const IBAN_CAND = /\b[A-Z]{2}\d{2}(?: ?[A-Z0-9]){11,32}/g;
const PHONE = /(^|[^\p{L}\p{N}+])(?:\+|00)?\(?\d[\d \u00a0/()–-]{5,}\d(?![\p{L}\p{N}])/gu;
const STREET_SUFFIX = '(?:straße|strasse|str\\.|weg|allee|gasse|platz|ring|damm|ufer|chaussee|steig|pfad|stieg|markt|anger|graben|kamp|wall|zeile|promenade|hof)';
const STREET = new RegExp(
  '(^|[^\\p{L}\\p{N}])(?:(?:Am|An der|An den|Auf der|Auf dem|Im|In der|Zum|Zur|Unter den|Alte|Alter|Neue|Neuer|Große|Großer|Kleine|Kleiner)[ \\u00a0]+)?' +
  '[\\p{Lu}][\\p{L}ß.\'-]*' + STREET_SUFFIX + '[ \\u00a0]*\\d{1,4}[ \\u00a0]?[a-zA-Z]?(?:[ \\u00a0]?[-/–][ \\u00a0]?\\d{1,4}[a-zA-Z]?)?(?![\\p{L}\\p{N}])', 'gu');
const STREET2 = /(^|[^\p{L}\p{N}])(?:Am|An der|An den|Auf der|Auf dem|Im|In der|Zum|Zur|Unter den)[ \u00a0]+[\p{Lu}][\p{L}ß-]+[ \u00a0]+\d{1,4}[ \u00a0]?[a-zA-Z]?(?![\p{L}\p{N}])/gu;
const STREET_EN = /(^|[^\p{L}\p{N}])\d{1,5}[A-Za-z]?[ \u00a0]+(?:[A-Z][a-z]+[ \u00a0]){1,3}(?:Street|St\.|Road|Rd\.|Avenue|Ave\.|Lane|Ln\.|Drive|Way|Boulevard|Blvd\.|Court|Ct\.|Place|Pl\.|Square|Sq\.)/g;
const PLZ = /(^|[^\p{L}\p{N}-])(?:(?:D|DE)-)?\d{5}[ \u00a0]+[\p{Lu}][\p{L}ß-]+(?:[ \u00a0]+(?:am|an der|im|in der|ob der|bei|vor der)[ \u00a0]+[\p{Lu}][\p{L}ß-]+|[ \u00a0]+\([\p{L} .]+\))?/gu;
const PLZ4 = /(^|[^\p{L}\p{N}-])(?:A|AT|CH)-\d{4}[ \u00a0]+[\p{Lu}][\p{L}ß-]+/gu;

function ibanValid(raw) {
  const s = raw.replace(/ /g, '');
  if (s.length < 15 || s.length > 34) return false;
  const re = s.slice(4) + s.slice(0, 4);
  let mod = 0;
  for (const ch of re) {
    const v = /\d/.test(ch) ? ch : String(ch.charCodeAt(0) - 55);
    for (const d of v) mod = (mod * 10 + Number(d)) % 97;
  }
  return mod === 1;
}

function phoneValid(m) {
  const digits = m.replace(/\D/g, '');
  if (digits.length < 7 || digits.length > 15) return false;
  const t = m.trim();
  if (!/^(\+|00|0|\(0)/.test(t)) return false;
  // Datumsbereiche, Jahreszahlen o. ä. ausschließen
  if (/^\d{4}\s*[–-]\s*\d{4}$/.test(t)) return false;
  return true;
}

// Liefert [{s, e, type, cert}] für einen Text. opts: {email, phone, iban, address}
export function findContacts(text, opts) {
  const out = [];
  const push = (s, e, type, cert = 'sicher') => {
    if (out.some((h) => s < h.e && e > h.s)) return;
    out.push({ s, e, type, cert });
  };
  const hasDigit = /\d/.test(text);
  if (opts.email && text.includes('@')) for (const m of text.matchAll(EMAIL)) push(m.index, m.index + m[0].length, 'email');
  if (opts.iban && hasDigit && /[A-Z]{2}\d{2}/.test(text)) {
    for (const m of text.matchAll(IBAN_CAND)) {
      let cand = m[0];
      let ok = false;
      while (cand.replace(/ /g, '').length >= 15) {
        if (ibanValid(cand)) { ok = true; break; }
        cand = cand.slice(0, -1).replace(/ $/, '');
      }
      if (ok) push(m.index, m.index + cand.length, 'iban');
      else if (/^(DE|AT|CH)\d{2}/.test(m[0]) && m[0].replace(/ /g, '').length >= 18) push(m.index, m.index + m[0].trimEnd().length, 'iban', 'unsicher');
    }
  }
  if (opts.address && hasDigit) {
    for (const re of [STREET, STREET2, STREET_EN, PLZ, PLZ4]) {
      // Gruppe 1 = Zeichen davor (Ersatz für Lookbehind, damit auch ältere iPhones/Safari funktionieren)
      for (const m of text.matchAll(re)) { const st = m.index + m[1].length; push(st, st + m[0].length - m[1].length, 'address'); }
    }
  }
  if (opts.phone && hasDigit) {
    for (const m of text.matchAll(PHONE)) {
      const st = m.index + m[1].length;
      const raw = m[0].slice(m[1].length).replace(/[ \u00a0–-]+$/, '');
      if (phoneValid(raw)) push(st, st + raw.length, 'phone');
    }
  }
  out.sort((a, b) => a.s - b.s || b.e - a.e);
  return out;
}
