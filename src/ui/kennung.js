// Kennung für den Modus „rückbaufähig“: verbindet anonymisierte Datei und Schlüsseldatei.
// Sie entsteht NUR aus dem Zufallsgenerator des Browsers (crypto.getRandomValues). In die Kennung geht nichts aus
// dem Dokument ein: kein Text, kein Name, kein Dateiname, keine Uhrzeit. Deshalb lässt sich aus ihr nichts ableiten.

// 32 verwechslungsfreie Zeichen: Großbuchstaben und Ziffern ohne 0, O, 1, I
export const KENNUNG_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const KENNUNG_RE = /^[A-HJ-NP-Z2-9]{4}$/;
// Nie zwei Buchstaben direkt nebeneinander: so kann eine Kennung nie wie ein Name oder ein Wort aussehen
// (z. B. „ANNA“, „LI“), den der Schlusscheck sonst in der Datei fände.
const TWO_LETTERS = /[A-Z]{2}/;

export function isKennung(k) { return typeof k === 'string' && KENNUNG_RE.test(k) && !TWO_LETTERS.test(k); }

// rand(Uint8Array) füllt das Feld mit Zufallsbytes; Standard: der sichere Zufallsgenerator des Browsers
export function newKennung(rand = (a) => globalThis.crypto.getRandomValues(a)) {
  const buf = new Uint8Array(4);
  for (;;) {
    rand(buf);
    // 256 ist ein Vielfaches von 32: „Byte & 31“ wählt jedes Zeichen gleich wahrscheinlich
    const k = Array.from(buf, (b) => KENNUNG_ALPHABET[b & 31]).join('');
    if (!TWO_LETTERS.test(k)) return k;
  }
}

// Kennung aus einem vom Tool vergebenen Dateinamen („anonymisiert_K7F3.docx“, auch „anonymisiert_K7F3 (1).docx“)
export function kennungFromFileName(name) {
  const base = String(name || '').split(/[\\/]/).pop();
  const m = base.match(/^anonymisiert_([A-Z0-9]{4})(?: ?\(\d+\))?\.[A-Za-z0-9]+$/);
  return m && isKennung(m[1]) ? m[1] : null;
}
