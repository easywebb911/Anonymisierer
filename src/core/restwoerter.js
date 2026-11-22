// Version 2.9.0 „Diese Wörter bleiben stehen“: Wörter, die nicht ersetzt werden und keine gewöhnlichen deutschen Wörter
// sind. Die Wortliste (all-the-german-words 1.1.0, MIT) liegt vorne zusammengefasst vor (siehe build/build-woerter.mjs):
// je Zeile ein Zeichen 48+n (n gleiche Anfangszeichen wie das vorige Wort) und der Rest, sortiert. Nachschlagen exakt
// über einen Sprungindex (jedes 64. Wort) und kurzes Weiterlesen. Ändert keine Erkennung und ersetzt nichts.
import { fold } from './fold.js';

const STEP = 64;
// text: entpackte Wortliste (Zeichenkette). Liefert {has(w), hasPrefix(p), size}
export function makeDict(text) {
  const cpWord = [];
  const cpNext = []; // Position der Zeile NACH dem Sprungwort
  let cur = '';
  let pos = 0;
  let n = 0;
  const len = text.length;
  while (pos < len) {
    let end = text.indexOf('\n', pos);
    if (end < 0) end = len;
    const p = text.charCodeAt(pos) - 48;
    cur = cur.slice(0, p) + text.slice(pos + 1, end);
    if (n % STEP === 0) { cpWord.push(cur); cpNext.push(end + 1); }
    n++;
    pos = end + 1;
  }
  // erstes Wort >= w ab dem passenden Sprungwort (oder null)
  function lowerBound(w) {
    let lo = 0;
    let hi = cpWord.length - 1;
    if (hi < 0) return null;
    if (w <= cpWord[0]) return cpWord[0];
    while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (cpWord[mid] <= w) lo = mid; else hi = mid - 1; }
    let c = cpWord[lo];
    if (c === w) return c;
    let q = cpNext[lo];
    while (q < len) {
      let end = text.indexOf('\n', q);
      if (end < 0) end = len;
      c = c.slice(0, text.charCodeAt(q) - 48) + text.slice(q + 1, end);
      if (c >= w) return c;
      q = end + 1;
    }
    return null;
  }
  return {
    size: n,
    has: (w) => lowerBound(w) === w,
    hasPrefix: (p) => { const c = lowerBound(p); return c !== null && c.startsWith(p); },
  };
}

// Ist das Wort ein gewöhnliches deutsches Wort? Vergleich klein (Schreibweise der Liste) und in der Vergleichsform des
// Tools (fold). Ergänzungsstrich („Förder- oder …“): bekannt, wenn ein Wort der Liste so beginnt.
export function isKnown(dict, word, fragment) {
  const l = word.normalize('NFC').toLowerCase();
  const f = fold(l);
  if (dict.has(l) || dict.has(f)) return true;
  return !!fragment && (dict.hasPrefix(l) || dict.hasPrefix(f));
}

const TOKEN = /[\p{L}\p{M}\p{N}]+(?:[-‐‑][\p{L}\p{M}\p{N}]+)*[-‐‑]?/gu;
const HYPH = /[-‐‑]/u;
// Kandidaten eines Textes: Teile (Bindestrich-Teile einzeln), nur Buchstaben, mindestens 3 Buchstaben, groß beginnend
// (oder ganz groß). Liefert [{s, e, t, fragment}]
export function candidates(text) {
  const out = [];
  for (const m of text.matchAll(TOKEN)) {
    const tok = m[0];
    const trailing = HYPH.test(tok[tok.length - 1]);
    let off = 0;
    const parts = tok.split(HYPH);
    parts.forEach((part, i) => {
      const s = m.index + off;
      off += part.length + 1;
      if (!part) return;
      if (/\p{N}/u.test(part)) return;
      const letters = part.replace(/\p{M}/gu, '');
      if ([...letters].length < 3 || !/^[\p{Lu}\p{Lt}]/u.test(letters)) return;
      out.push({ s, e: s + part.length, t: part, fragment: trailing && i === parts.length - 2 });
    });
  }
  return out;
}

// Restwörter eines Dokuments. units: [{text}], result: Ergebnis von analyze (hits mit on, unit, unit2, s, e; unitStarts),
// exceptions: Liste „Ausnahmen“, known(word, fragment): Wortliste.
// Liefert [{key, word, count, first: {unit, s, e}, replacedElsewhere}] in der Reihenfolge des ersten Vorkommens.
export function restWords(units, result, exceptions, known) {
  const exc = new Set();
  for (const e of exceptions || []) for (const t of String(e).split(/[^\p{L}\p{M}\p{N}]+/u)) if (t) exc.add(fold(t));
  const onBy = new Map();
  for (const x of result.hits) {
    if (!x.on) continue;
    for (const k of [x.unit, x.unit2]) if (k !== undefined) { if (!onBy.has(k)) onBy.set(k, []); onBy.get(k).push(x); }
  }
  const map = new Map();
  const replaced = new Set();
  units.forEach((u, ui) => {
    const base = result.unitStarts[ui];
    const on = onBy.get(ui) || [];
    for (const c of candidates(u.text)) {
      const key = fold(c.t.normalize('NFC'));
      if (on.some((o) => o.s < base + c.e && o.e > base + c.s)) { replaced.add(key); continue; }
      if (exc.has(key)) continue;
      if (known(c.t, c.fragment)) continue;
      const r = map.get(key);
      if (r) r.count++;
      else map.set(key, { key, word: c.t, count: 1, first: { unit: ui, s: c.s, e: c.e } });
    }
  });
  return [...map.values()].map((r) => ({ ...r, replacedElsewhere: replaced.has(r.key) }));
}
