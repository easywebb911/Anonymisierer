// Namenserkennung (regelbasiert, deterministisch).
// Eingabe: Liste von Texteinheiten (Absätze, Zellen …) und ein Zustand mit Einstellungen,
// manuell markierten Namen, Ausnahmen, Umschaltungen und Zusammenführungen.
// Ausgabe: Treffer (hits) und Personen (entities) mit Pseudonymen.
import { fold, umlautVariant } from './fold.js';
import * as lex from './lexicon.js';
import { findContacts } from './patterns.js';
import { assignReversible, MODE_REVERSIBLE, reservedPlaceholders } from './reversible.js';

const TOKEN_RE = /[\p{L}\p{M}]+(?:['’][\p{L}\p{M}]+)*(?:-[\p{L}\p{M}]+(?:['’][\p{L}\p{M}]+)*)*|\p{N}+|\S/gu;
// Arabische Namenspräfixe mit Bindestrich: al-Hassan, el-Masri, Abd-ar-…
const HYPHEN_PREFIX = new Set(['al', 'el', 'ul', 'ad', 'ar', 'as', 'ash', 'at', 'az', 'abd', 'abu', 'ben', 'bin', 'ibn']);
const ACADEMIC = new Set(['med', 'dent', 'vet', 'rer', 'nat', 'phil', 'jur', 'oec', 'pol', 'hc', 'ing', 'habil']);

export const CONTACT_LABELS = { email: '[E-MAIL]', phone: '[TELEFON]', iban: '[IBAN]', address: '[ADRESSE]' };

export function defaultState() {
  return {
    settings: { mode: 'person', email: true, phone: true, iban: true, address: true, unsureOn: true },
    manualTerms: [], // vom Nutzer markierte Namen (Reihenfolge = Reihenfolge der Markierung)
    orgTerms: [], // vom Nutzer (oder aus den Dateiangaben) als Einrichtung übernommene Bezeichnungen (Version 2.3)
    exceptions: [], // nie anonymisieren
    overrides: {}, // "s:e" -> true/false (Treffer an/aus)
    merges: {}, // entityKey -> Ziel-entityKey
    unlinks: [], // Kurzformen, die NICHT zugeordnet werden sollen (Schlüssel "S|…")
  };
}

function isCap(t) {
  const c = t.charAt(0);
  return c !== c.toLowerCase() && c === c.toUpperCase();
}

export function tokenize(text, base = 0) {
  const toks = [];
  for (const m of text.matchAll(TOKEN_RE)) {
    const t = m[0];
    const s = base + m.index;
    const word = /^[\p{L}\p{M}]/u.test(t);
    toks.push({
      t, s, e: s + t.length, word, idx: toks.length,
      cap: word && isCap(t),
      allcaps: word && [...t].length > 1 && t === t.toUpperCase() && t !== t.toLowerCase(),
    });
  }
  return toks;
}

function info(tok, exceptions) {
  if (tok._i) return tok._i;
  const lk = lex.lookupWord(tok.t);
  const key = lk.key;
  const r = {
    key, suffix: lk.suffix, stemEnd: tok.s + lk.stemLen,
    F: lex.isFirst(key), L: lex.isLast(key), A: lex.isAmbiguous(key), stop: lex.isStopWord(tok.t),
    shaped: lex.isShaped(key), title: lex.isTitle(key), strong: lex.isStrongTitle(key),
    particle: lex.PARTICLES.has(tok.t.toLowerCase()), exception: exceptions.has(key) || exceptions.has(fold(tok.t)),
    hyCommon: false, hy: false,
  };
  const parts = tok.t.split('-');
  if (parts.length > 1 && !r.F && !r.L) {
    const lastLk = lex.lookupWord(parts[parts.length - 1]);
    const pk = parts.slice(0, -1).map((p) => fold(p)).concat(lastLk.key);
    const known = pk.filter((k) => [...k].length >= 2 && lex.inLists(k) && !lex.isAmbiguous(k));
    const tiny = pk.some((k) => [...k].length < 2);
    const common = pk.filter((k) => (lex.isAmbiguous(k) || lex.isStop(k)) && !lex.PARTICLES.has(k));
    if (HYPHEN_PREFIX.has(pk[0]) && pk.length === 2 && isCap(parts[1])) { r.L = true; r.hy = true; }
    else if (known.length && !common.length && !tiny) {
      if (pk.every((k) => lex.isFirst(k))) r.F = true; else r.L = true;
      r.hy = true;
    } else if (common.length) r.hyCommon = true;
    if (r.hy && lastLk.suffix) { r.suffix = lastLk.suffix; r.stemEnd = tok.e - lastLk.suffix.length; }
    if (pk.some((k) => exceptions.has(k))) r.exception = true;
  }
  r.known = r.F || r.L;
  tok._i = r;
  return r;
}

function gapHasBreak(text, base, a, b) {
  // Zwischenraum zwischen Tokens enthält Zeilenumbruch?
  return /[\n\r\t\u2028\u2029]/.test(text.slice(a - base, b - base));
}

// Steht vor Token i ein Artikel/Begleiter oder eine Präposition (ggf. mit Adjektiv dazwischen)?
// -> mehrdeutiges Wort ist dann eher ein Substantiv ("die Rose", "im Winter", "mit voller Kraft", "nach Paris")
function nounContext(toks, i, withPrep = true) {
  let adj = 0;
  for (let k = i - 1; k >= 0; k--) {
    const tk = toks[k];
    if (!tk.word) return false;
    const key = fold(tk.t);
    if (lex.DETERMINERS.has(key) || (withPrep && lex.PREPOSITIONS.has(key))) return true;
    if (!tk.cap && /(?:e|en|er|es|em)$/.test(key) && adj < 2) { adj++; continue; }
    return false;
  }
  return false;
}

function isInitial(toks, k) {
  const tk = toks[k];
  return tk.word && [...tk.t].length === 1 && tk.cap && toks[k + 1] && toks[k + 1].t === '.' && toks[k + 1].s === tk.e;
}

// Liest eine mögliche Namensfolge ab Token j.
function parseSeq(toks, j, ctx, text, base, covered, exceptions) {
  const comps = [];
  let k = j;
  let words = 0;
  while (k < toks.length) {
    const tk = toks[k];
    if (covered[k]) break;
    if (k > j && gapHasBreak(text, base, toks[k - 1].e, tk.s)) break;
    if (!tk.word) break;
    if (isInitial(toks, k)) {
      comps.push({ type: 'I', s: tk.s, e: toks[k + 1].e, key: fold(tk.t) + '.' });
      k += 2;
      continue;
    }
    const inf = info(tk, exceptions);
    // Partikel nur ohne Diakritika ("Văn" ist kein "van")
    if (inf.particle && !tk.allcaps && !inf.F && !inf.L) {
      // Namenszusatz (von, van der, al, bin …) nur vor einem großgeschriebenen Wort
      let m = k;
      while (m < toks.length && toks[m].word && lex.PARTICLES.has(fold(toks[m].t)) && !gapHasBreak(text, base, toks[m - 1 >= 0 ? m - 1 : m].e, toks[m].s)) m++;
      const nx = toks[m];
      // Am Anfang nur mit Anrede ("Frau von Bodelschwingh") oder großgeschrieben ("Van Gogh", "Al Hassan");
      // sonst ist "von"/"de" meist eine Präposition ("Bericht von Anna Müller")
      const leadOk = comps.length > 0 || ctx.strong || ctx.weak || (tk.cap && lex.LEADING_PARTICLES.has(inf.key));
      if (nx && nx.word && nx.cap && !covered[m] && leadOk && m - k <= 3) {
        const ni = info(nx, exceptions);
        if (!ni.stop && !ni.title && !ni.exception && (comps.length > 0 || ctx.strong || ni.known || ni.shaped)) {
          for (let q = k; q < m; q++) comps.push({ type: 'P', s: toks[q].s, e: toks[q].e, key: fold(toks[q].t) });
          k = m;
          continue;
        }
      }
      break;
    }
    if (!tk.cap && !(inf.hy && inf.L)) break; // klein nur bei "al-Hassan" o. ä.
    if (inf.title || inf.stop || inf.exception) break;
    if (inf.hyCommon && !ctx.strong) break;
    if (tk.allcaps && !inf.known && !ctx.strong) break;
    // Kurze Wörter in GROSSBUCHSTABEN sind meist Abkürzungen (TOP, IBAN, GMBH) – nur mit Namenskontext
    if (tk.allcaps && [...tk.t].length <= 4 && !ctx.strong && !ctx.weak && !comps.length) break;
    const lastW = [...comps].reverse().find((c) => c.type === 'W');
    const prev = comps[comps.length - 1];
    let accept;
    if (!lastW) {
      if (ctx.strong) accept = true;
      else if (prev && (prev.type === 'I' || prev.type === 'P')) accept = true;
      else if (ctx.weak) accept = inf.known || inf.shaped || !inf.A;
      else accept = inf.known || inf.shaped || (!inf.A && !tk.allcaps && nextIsSurname(toks, k, text, base, covered, exceptions));
    } else {
      accept = (inf.known && (!inf.A || lastW.F)) || inf.shaped || inf.hy
        || (prev.type === 'I' || prev.type === 'P') || (lastW.F && !lastW.A && !inf.A)
        || (ctx.strong && words === 1 && lastW.F && !inf.A);
    }
    if (!accept) break;
    comps.push({ type: 'W', s: tk.s, e: tk.e, stemEnd: inf.stemEnd, suffix: inf.suffix, key: inf.key, F: inf.F, L: inf.L,
      A: inf.A, known: inf.known, shaped: inf.shaped, allcaps: tk.allcaps, tokIdx: k });
    words++;
    k++;
    if (inf.suffix || words >= 4) break;
  }
  while (comps.length && comps[comps.length - 1].type !== 'W') comps.pop();
  // Führende Initiale ohne folgendes Wort ist schon entfernt; Partikel am Anfang ohne Kontext bleiben erlaubt.
  return { comps, next: Math.max(k, j + 1) };
}

// Steht Token k am Satz- oder Zeilenanfang?
function atSentenceStart(toks, k, text, base) {
  const pv = toks[k - 1];
  if (!pv) return true;
  if (/[\n\r]/.test(text.slice(pv.e - base, toks[k].s - base))) return true;
  return /^[.!?:;•–—]$/.test(pv.t) && !(toks[k - 2] && lex.isTitle(fold(toks[k - 2].t)));
}

// Folgt direkt (gleiche Zeile, nur Leerzeichen) ein bekannter, eindeutiger Nachname? ("Jolanthe Kowalczyk")
function nextIsSurname(toks, k, text, base, covered, exceptions) {
  if (atSentenceStart(toks, k, text, base)) return false;
  const nx = toks[k + 1];
  if (!nx || !nx.word || !nx.cap || covered[k + 1] || nx.allcaps) return false;
  if (!/^[ \u00a0]+$/.test(text.slice(toks[k].e - base, nx.s - base))) return false;
  const ni = info(nx, exceptions);
  return !ni.stop && !ni.title && !ni.exception && ((ni.L && !ni.A && !ni.F) || ni.shaped);
}

function evaluate(comps, ctx) {
  const W = comps.filter((c) => c.type === 'W');
  const I = comps.some((c) => c.type === 'I');
  if (!W.length) return null;
  const strongKnown = W.some((c) => (c.known && !c.A && [...c.key].length >= 3) || c.shaped);
  if (ctx.strong || ctx.post) return 'sicher';
  if (ctx.weak) return (W.some((c) => c.known || c.shaped)) ? 'sicher' : 'unsicher';
  if (W.length >= 2) {
    // Erstes Wort unbekannt (nur wegen folgendem Nachnamen angenommen) -> unsicher
    if (!W[0].known && !W[0].shaped && comps[0].type === 'W') return 'unsicher';
    if (strongKnown) return 'sicher';
    if (W[0].F && W[W.length - 1].L) return 'sicher';
    return 'unsicher';
  }
  const w = W[0];
  if (I) return (w.known && !w.A) || w.shaped ? 'sicher' : 'unsicher';
  if (w.known && !w.A && [...w.key].length >= 3) return 'sicher';
  if (w.known || w.shaped) return 'unsicher';
  return null;
}

function mentionKey(comps, swapped) {
  const W = comps.filter((c) => c.type === 'W');
  const I = comps.filter((c) => c.type === 'I');
  if (swapped) return { full: true, given: swapped.given, sur: swapped.sur };
  if (W.length === 1 && !I.length) return { full: false, single: W[0].key };
  // Nachname = letztes Wort inkl. vorangehender Partikel; Vorname(n) = Rest
  const lastIdx = comps.lastIndexOf(W[W.length - 1]);
  let st = lastIdx;
  while (st > 0 && comps[st - 1].type === 'P') st--;
  const sur = comps.slice(st, lastIdx + 1).map((c) => c.key).join(' ');
  const given = comps.slice(0, st).filter((c) => c.type !== 'P').map((c) => c.key).join(' ');
  return { full: true, given, sur };
}

// ---------- Regel a2: Anrede allein in einer Einheit -> Anfang der direkt folgenden Einheit ist ein Name ----------
// Auslöser: Absatz/Zeile/Zelle besteht NUR aus Herr/Herrn/Frau/Fräulein/Hr./Fr./Frl., optional mit akademischem Titel.
const ANREDE = new Set(['herr', 'herrn', 'frau', 'fraulein', 'hr', 'fr', 'frl']);
const ANREDE_TITLES = new Set(['dr', 'prof', 'professor', 'professorin', 'doktor', 'dipl', 'ing', 'mag', 'med', 'dent', 'vet', 'rer', 'nat',
  'phil', 'jur', 'oec', 'pol', 'hc', 'habil', 'msc', 'bsc', 'llm', 'mba']);
export function isAnredeOnly(text) {
  const t = text.trim();
  if (!t || !/^[\p{L}\p{M}\s.-]+$/u.test(t)) return false;
  const words = tokenize(t).filter((x) => x.word);
  if (!words.length || words.length > 6) return false;
  let anrede = false;
  for (const w of words) {
    const k = fold(w.t);
    if (ANREDE.has(k) && isCap(w.t)) anrede = true;
    else if (!ANREDE_TITLES.has(k)) return false;
  }
  return anrede;
}
// Enge Grenze: Die erste Zeile der Folge-Einheit besteht GANZ aus 1–3 großgeschriebenen Namenswörtern
// (plus Initialen und Namenszusätzen wie von/van der/al-); danach höchstens Satzzeichen. Sonst kein Treffer.
const A2_MAX_WORDS = 3;
function a2Candidate(u, toks, base, cov, exceptions) {
  const nl = u.text.indexOf('\n');
  const lineEnd = base + (nl < 0 ? u.text.length : nl);
  const comps = [];
  let words = 0;
  let k = 0;
  while (k < toks.length && toks[k].s < lineEnd) {
    const tk = toks[k];
    if (cov[k]) return null;
    if (!tk.word) break;
    if (isInitial(toks, k)) { comps.push({ type: 'I', s: tk.s, e: toks[k + 1].e, key: fold(tk.t) + '.' }); k += 2; continue; }
    const inf = info(tk, exceptions);
    if (inf.particle && !tk.allcaps && !inf.F && !inf.L) { comps.push({ type: 'P', s: tk.s, e: tk.e, key: fold(tk.t) }); k++; continue; }
    if (!(tk.cap || (inf.hy && inf.L))) return null;
    if (inf.stop || inf.title || inf.exception) return null;
    comps.push({ type: 'W', s: tk.s, e: tk.e, stemEnd: inf.stemEnd, suffix: inf.suffix, key: inf.key, F: inf.F, L: inf.L, A: inf.A,
      known: inf.known, shaped: inf.shaped, allcaps: tk.allcaps, tokIdx: k });
    words++;
    k++;
    if (words > A2_MAX_WORDS) return null;
  }
  const restStart = k < toks.length && toks[k].s < lineEnd ? toks[k].s : lineEnd;
  if (!/^[\s,.;:]*$/.test(u.text.slice(restStart - base, lineEnd - base))) return null;
  const W = comps.filter((c) => c.type === 'W');
  if (!W.length || comps[comps.length - 1].type !== 'W') return null;
  // Nur Allerweltswörter (z. B. "Berlin", "Montag") -> keine a2-Regel; dafür gelten die bisherigen Regeln
  if (W.every((c) => c.A)) return null;
  // Markierung (Entscheidung E): Ersetzt wird immer. Ein einzelnes Wort, das in keiner Namensliste steht,
  // wird "unsicher, an" (es kann auch ein Sachwort sein, z. B. "Mathematik" oder "Turnhalle").
  const w0 = W[0];
  const unsure = W.length === 1 && !w0.known && !w0.shaped;
  return { comps, endTok: k, unsure };
}

// ---------- Regel b2: Wochentage und Monate allein -> "unsicher, aus" ----------
const CALENDAR = new Set(['montag', 'dienstag', 'mittwoch', 'donnerstag', 'freitag', 'samstag', 'sonnabend', 'sonntag',
  'januar', 'janner', 'februar', 'feber', 'marz', 'april', 'mai', 'juni', 'juli', 'august', 'september', 'oktober', 'november', 'dezember']);
// Abkürzungen zählen nur mit Punkt ("Jan." ist Januar, "Jan" ist ein Vorname)
const CALENDAR_ABBR = new Set(['mo', 'di', 'mi', 'do', 'fr', 'sa', 'so', 'jan', 'feb', 'mar', 'mrz', 'apr', 'jun', 'jul', 'aug', 'sep', 'sept', 'okt', 'nov', 'dez']);
function isCalendarWord(toks, k) {
  const tk = toks[k];
  const key = fold(tk.t);
  if (CALENDAR.has(key)) return true;
  return CALENDAR_ABBR.has(key) && toks[k + 1] && toks[k + 1].t === '.' && toks[k + 1].s === tk.e;
}

function letterFor(n) {
  let s = '';
  n += 1;
  while (n > 0) { const r = (n - 1) % 26; s = String.fromCharCode(65 + r) + s; n = Math.floor((n - 1) / 26); }
  return s;
}

// Hauptfunktion
export function analyze(units, state) {
  const st = state;
  const exceptions = new Set(st.exceptions.map((x) => fold(x.trim())).filter(Boolean));
  const unitStarts = [];
  let pos = 0;
  for (const u of units) { unitStarts.push(pos); pos += u.text.length + 1; }
  const fullText = units.map((u) => u.text).join('\n');

  const hits = [];
  const unitToks = [];
  const covered = [];
  const tokHit = []; // pro Einheit: Token-Index -> Treffer

  // 1) Kontaktdaten
  units.forEach((u, ui) => {
    const base = unitStarts[ui];
    const toks = tokenize(u.text, base);
    unitToks.push(toks);
    covered.push(new Array(toks.length).fill(false));
    tokHit.push(new Array(toks.length).fill(null));
    for (const c of findContacts(u.text, st.settings)) {
      const h = { s: base + c.s, e: base + c.e, type: c.type, cert: c.cert, origin: 'auto', unit: ui };
      hits.push(h);
      toks.forEach((tk, k) => { if (tk.s < h.e && tk.e > h.s) { covered[ui][k] = true; tokHit[ui][k] = h; } });
    }
  });

  // 1b) Einrichtungen (Version 2.3): NUR vom Nutzer markierte oder aus den Dateiangaben übernommene Bezeichnungen,
  // keine automatische Suche. Sie haben Vorrang: Ihre Wörter sind danach belegt, darin entsteht kein Personen-Treffer.
  matchOrgTerms(st.orgTerms || [], units, unitToks, unitStarts, covered, tokHit, fullText, hits, st.settings.mode === MODE_REVERSIBLE);

  // 2) Automatische Namenserkennung
  const mentions = [];
  units.forEach((u, ui) => {
    const base = unitStarts[ui];
    const toks = unitToks[ui];
    const cov = covered[ui];
    const prevText = ui > 0 ? units[ui - 1].text : '';
    // Regel a2: vorige Einheit besteht nur aus einer Anrede und diese Einheit folgt direkt darauf
    if (ui > 0 && u.follows && !u.heading && isAnredeOnly(units[ui - 1].text)) {
      const c = a2Candidate(u, toks, base, cov, exceptions);
      if (c) {
        const comps = c.comps;
        const lastWc = [...comps].reverse().find((x) => x.type === 'W');
        const s = comps[0].s;
        const e = lastWc.e;
        const h = { s, e, type: 'person', cert: c.unsure ? 'unsicher' : 'sicher', origin: 'auto', unit: ui, suffix: lastWc.suffix || '', comps,
          mk: mentionKey(comps, null), titled: true, a2: true, defaultOff: false };
        // Gruppe: alle Vorkommen dieses Worts werden in der Prüfansicht gemeinsam an-/ausgeschaltet
        if (c.unsure) h.a2group = 'a2|' + lastWc.key;
        hits.push(h);
        mentions.push(h);
        toks.forEach((t2, k) => { if (t2.s < e && t2.e > s) { cov[k] = true; tokHit[ui][k] = h; } });
      }
    }
    let i = 0;
    while (i < toks.length) {
      const tk = toks[i];
      if (!tk.word || cov[i]) { i++; continue; }
      // Anreden-/Titelkette
      let j = i;
      const ctx = { strong: false, weak: false, post: false };
      while (j < toks.length && toks[j].word && !cov[j]) {
        const inf = info(toks[j], exceptions);
        if (!inf.title) break;
        if (!toks[j].cap && !(ctx.strong && ACADEMIC.has(inf.key))) break;
        if (j > i && gapHasBreak(u.text, base, toks[j - 1].e, toks[j].s)) break;
        // "die Frau", "der Herr", "ein Kollege" -> Substantiv, kein Anredekontext
        if (j === i && nounContext(toks, j, false)) break;
        if (inf.strong) ctx.strong = true; else ctx.weak = true;
        j++;
        if (j < toks.length && toks[j].t === '.' && toks[j].s === toks[j - 1].e) j++;
        if (j + 1 < toks.length && toks[j].t === '-' && toks[j].s === toks[j - 1].e && toks[j + 1].word) j++;
      }
      if (j === i) {
        // Gruß am Zeilenanfang nach Grußformel ("Mit freundlichen Grüßen" -> nächste Zeile = Name)
        const before = u.text.slice(0, tk.s - base);
        const lineStart = !before.trim() || /\n\s*$/.test(before);
        if (lineStart) {
          const prevLine = before.trim() ? before.replace(/\n\s*$/, '').split('\n').pop() : prevText.split('\n').pop();
          if (lex.CLOSINGS.test(prevLine || '')) ctx.weak = true;
        }
      }
      const { comps, next } = parseSeq(toks, j, ctx, u.text, base, cov, exceptions);
      if (!comps.length) { i = j > i ? j : i + 1; continue; }
      // Nachgestellte Anrede ("Ahmet Bey")
      const lastC = comps[comps.length - 1];
      const after = toks.find((t) => t.s >= lastC.e);
      if (after && after.word && lex.POST_TITLES.has(fold(after.t)) && after.cap) ctx.post = true;
      let cert = evaluate(comps, ctx);
      let swapped = null;
      let endIdx = next;
      // "Nachname, Vorname"
      const W = comps.filter((c) => c.type === 'W');
      if (!ctx.strong && !ctx.weak && W.length === 1 && comps.length === 1 && ((W[0].L && !W[0].A) || W[0].shaped)) {
        const comma = toks[next];
        if (comma && comma.t === ',' && comma.s === lastC.e) {
          const r2 = parseSeq(toks, next + 1, { strong: false, weak: false }, u.text, base, cov, exceptions);
          const W2 = r2.comps.filter((c) => c.type === 'W');
          if (W2.length >= 1 && W2.length <= 2 && W2[0].F && !W2[0].A && r2.comps.every((c) => c.type === 'W')) {
            swapped = { given: W2.map((c) => c.key).join(' '), sur: W[0].key };
            comps.push({ type: 'SEP', s: comma.s, e: comma.e }, ...r2.comps);
            cert = 'sicher';
            endIdx = r2.next;
          }
        }
      }
      // Regel b2: Wochentag/Monat allein (ohne Anrede, ohne Nachbarnamen) -> unsicher und standardmäßig aus
      const calendarOnly = cert && W.length === 1 && comps.length === 1 && !ctx.strong && !ctx.weak && !ctx.post && isCalendarWord(toks, W[0].tokIdx);
      if (calendarOnly) cert = 'unsicher';
      if (cert) {
        const s = comps[0].s;
        const lastWc = [...comps].reverse().find((c) => c.type === 'W');
        const e = lastWc.e;
        const isNoun = W.length === 1 && W[0].A && !ctx.strong && !ctx.weak && nounContext(toks, W[0].tokIdx);
        const mk = mentionKey(comps.filter((c) => c.type !== 'SEP'), swapped);
        const h = { s, e, type: 'person', cert, origin: 'auto', unit: ui, suffix: lastWc.suffix || '', comps, mk, titled: ctx.strong || ctx.weak,
          defaultOff: cert === 'unsicher' && (isNoun || calendarOnly || !st.settings.unsureOn) };
        if (calendarOnly) h.calendar = true;
        if (W.length === 1 && W[0].key.length <= 2 && !ctx.strong && !ctx.weak && !ctx.post) h.defaultOff = true;
        hits.push(h);
        mentions.push(h);
        toks.forEach((t2, k) => { if (t2.s < e && t2.e > s) { cov[k] = true; tokHit[ui][k] = h; } });
      }
      i = Math.max(endIdx, i + 1);
    }
  });

  // 3) Zuordnung: Vollnamen zuerst, dann Kurzformen (nur Nachname / nur Vorname / Initiale)
  const fullKeys = new Map(); // key -> {given, sur}
  for (const h of mentions) {
    if (h.mk.full && h.mk.given && !/\.$/.test(h.mk.given)) {
      const k = 'N|' + h.mk.given + '|' + h.mk.sur;
      if (!fullKeys.has(k)) fullKeys.set(k, h.mk);
    }
  }
  const bySur = new Map();
  const byGiven = new Map();
  for (const [k, v] of fullKeys) {
    const surLast = v.sur.split(' ').pop();
    for (const sk of new Set([v.sur, surLast, ...surLast.split('-')])) {
      if (!bySur.has(sk)) bySur.set(sk, new Set());
      bySur.get(sk).add(k);
    }
    const g0 = v.given.split(' ')[0];
    if (!byGiven.has(g0)) byGiven.set(g0, new Set());
    byGiven.get(g0).add(k);
  }
  const unlinks = new Set(st.unlinks);
  for (const h of mentions) {
    const mk = h.mk;
    if (mk.full && mk.given && !/\.$/.test(mk.given)) { h.entity = 'N|' + mk.given + '|' + mk.sur; continue; }
    if (mk.full) {
      // Initiale(n) + Nachname
      const ownKey = 'N|' + mk.given + '|' + mk.sur;
      const cands = [...(bySur.get(mk.sur) || [])].filter((k) => fullKeys.get(k).given.startsWith(mk.given.charAt(0)));
      if (!unlinks.has(ownKey) && cands.length === 1) { h.entity = cands[0]; h.link = 'Initiale + Nachname'; }
      else if (!unlinks.has(ownKey) && !mk.given && (bySur.get(mk.sur) || new Set()).size === 1) { h.entity = [...bySur.get(mk.sur)][0]; h.link = 'Nachname'; }
      else h.entity = ownKey;
      h.linkable = ownKey;
      continue;
    }
    const sk = 'S|' + mk.single;
    h.linkable = sk;
    if (!unlinks.has(sk)) {
      const s1 = bySur.get(mk.single);
      const g1 = byGiven.get(mk.single);
      if (s1 && s1.size === 1) { h.entity = [...s1][0]; h.link = 'nur Nachname'; continue; }
      if (!s1 && g1 && g1.size === 1) { h.entity = [...g1][0]; h.link = 'nur Vorname'; continue; }
      if ((s1 && s1.size > 1) || (!s1 && g1 && g1.size > 1)) h.ambiguousLink = true;
    }
    h.entity = sk;
  }

  // 4) Manuell markierte Namen: alle Vorkommen (ohne Groß-/Kleinschreibung, mit Endungen)
  const merges = { };
  st.manualTerms.forEach((term) => {
    const tt = tokenize(term.normalize('NFC')).filter((t) => t.word);
    if (!tt.length) return;
    const mKey = 'M|' + tt.map((t) => fold(t.t)).join(' ');
    const partKeys = new Set(tt.map((t) => fold(t.t)).filter((k) => k.length >= 2 && !lex.isStop(k) && !lex.PARTICLES.has(k)));
    if (tt.length === 1) partKeys.add(fold(tt[0].t));
    units.forEach((u, ui) => {
      const toks = unitToks[ui];
      toks.forEach((tk, k) => {
        if (!tk.word) return;
        const stm = lex.stemFor(tk.t, partKeys);
        if (!stm) return;
        const existing = tokHit[ui][k];
        if (existing && existing.type !== 'person') return; // in E-Mail/Adresse bereits ersetzt
        if (existing) {
          if (existing.origin !== 'manual' && existing.entity && !existing.entity.startsWith('M|')) merges[existing.entity] = merges[existing.entity] || mKey;
          return;
        }
        const h = { s: tk.s, e: tk.e, type: 'person', cert: 'sicher', origin: 'manual', unit: ui, suffix: stm.suffix, entity: mKey,
          comps: [{ type: 'W', s: tk.s, e: tk.e, key: stm.key }] };
        hits.push(h);
        covered[ui][k] = true;
        tokHit[ui][k] = h;
      });
    });
  });
  // Benachbarte manuelle Treffer derselben Person zu einem Treffer verbinden ("Chidi Okonkwo" -> 1 Pseudonym)
  mergeAdjacent(hits, fullText);

  // 5) Zusammenführen (manuell + vom Nutzer gewählt)
  const allMerges = { ...merges, ...st.merges };
  const resolve = (k) => { const seen = new Set(); while (allMerges[k] && !seen.has(k)) { seen.add(k); k = allMerges[k]; } return k; };
  for (const h of hits) if (h.entity) { h.origEntity = h.entity; h.entity = resolve(h.entity); }

  // 6) Weitere Vorkommen bekannter Namensteile ("Propagation")
  const partToEntities = new Map();
  for (const h of hits) {
    if (h.type !== 'person') continue;
    for (const c of h.comps || []) {
      if (c.type !== 'W') continue;
      const raw = fullText.slice(c.s, c.stemEnd || c.e);
      if (h.origin !== 'manual' && ([...c.key].length < 3 || lex.isStopWord(raw) || lex.PARTICLES.has(raw.toLowerCase()))) continue;
      if (h.cert !== 'sicher' && h.origin === 'auto') continue;
      if (!partToEntities.has(c.key)) partToEntities.set(c.key, new Set());
      partToEntities.get(c.key).add(h.entity);
    }
  }
  // Regel a2 (Entscheidung E): Ein "unsicher, an" markiertes Wort nach allein stehender Anrede wird auf weitere
  // Vorkommen übertragen, dort ebenfalls "unsicher, an". Nur für Wörter, die NICHT schon durch einen anderen
  // Treffer bekannt sind -> die bisherige Übertragung bleibt unverändert.
  const a2Groups = new Map();
  for (const h of hits) {
    if (!h.a2group) continue;
    const c = h.comps.find((x) => x.type === 'W');
    if (!c || partToEntities.has(c.key) && !a2Groups.has(c.key)) continue;
    if (!partToEntities.has(c.key)) partToEntities.set(c.key, new Set());
    partToEntities.get(c.key).add(h.entity);
    a2Groups.set(c.key, h.a2group);
  }
  const manualParts = new Set(hits.filter((h) => h.origin === 'manual').flatMap((h) => (h.comps || []).map((c) => c.key)));
  const partKeys = new Set([...partToEntities.keys()].filter((k) => partToEntities.get(k).size === 1));
  // Version 2.3.2: GROSS-Form mit großer Endung („QUABBENJANSENS“) nur für automatisch erkannte Namensteile, nicht für
  // von Hand markierte (dort würde jede Fundstelle „sicher“; Phase 0: Fehltreffer „ROSEN“ bei markierter „Anna Rose“).
  // Solche Formen meldet der Schlusscheck.
  const capsKeys = new Set([...partKeys].filter((k) => !manualParts.has(k)));
  units.forEach((u, ui) => {
    const toks = unitToks[ui];
    toks.forEach((tk, k) => {
      if (!tk.word || covered[ui][k]) return;
      const stm = lex.stemFor(tk.t, partKeys) || lex.stemFor(tk.t, capsKeys, true);
      if (!stm) return;
      if (exceptions.has(stm.key) && !manualParts.has(stm.key)) return;
      if (lex.isTitle(stm.key) || lex.PARTICLES.has(tk.t.toLowerCase()) || lex.isStopWord(tk.t)) return;
      const ent = [...partToEntities.get(stm.key)][0];
      const amb = lex.isAmbiguous(stm.key);
      const manual = manualParts.has(stm.key);
      if (amb && !tk.cap && !manual) return;
      const cert = manual || (tk.cap && !amb) ? 'sicher' : 'unsicher';
      const h = { s: tk.s, e: tk.e, type: 'person', cert, origin: manual ? 'manual' : 'propagated', unit: ui, suffix: stm.suffix,
        entity: ent, comps: [{ type: 'W', s: tk.s, e: tk.e, key: stm.key }],
        defaultOff: cert === 'unsicher' && amb && nounContext(toks, k) };
      if (!manual && a2Groups.has(stm.key)) { h.cert = 'unsicher'; h.defaultOff = false; h.a2group = a2Groups.get(stm.key); }
      // Regel b2 auch hier: einzelner Wochentag/Monat nur wegen eines gleichlautenden Namensteils -> unsicher, aus
      if (!manual && isCalendarWord(toks, k)) { h.cert = 'unsicher'; h.defaultOff = true; h.calendar = true; }
      // Unbekanntes großgeschriebenes Wort direkt davor (z. B. Vorname vor bekanntem Nachnamen) -> mit ersetzen, unsicher
      const pv = toks[k - 1];
      if (!amb && tk.cap && pv && pv.word && pv.cap && !pv.allcaps && !covered[ui][k - 1] && /^[ \u00a0]+$/.test(fullText.slice(pv.e, tk.s))) {
        const pi = info(pv, exceptions);
        if (!pi.known && !pi.A && !pi.stop && !pi.title && !pi.exception && !pi.particle && !nounContext(toks, k - 1)) {
          h.s = pv.s;
          h.comps.unshift({ type: 'W', s: pv.s, e: pv.e, key: pi.key });
          h.cert = 'unsicher';
          covered[ui][k - 1] = true;
        }
      }
      hits.push(h);
      covered[ui][k] = true;
    });
  });

  hits.sort((a, b) => a.s - b.s || a.e - b.e);

  // 7) Personen und Pseudonyme (Reihenfolge des ersten Auftretens); Einrichtungen mit eigener Buchstabenfolge
  const orgs = new Map();
  for (const h of hits) {
    if (h.type !== 'org') continue;
    if (!orgs.has(h.entity)) orgs.set(h.entity, { key: h.entity, org: true, manual: true, hits: [], forms: new Map(), linkable: [], terms: new Set() });
    const og = orgs.get(h.entity);
    og.hits.push(h);
    og.terms.add(h.term);
    const surface = fullText.slice(h.s, h.e - (h.suffix ? h.suffix.length : 0));
    og.forms.set(surface, (og.forms.get(surface) || 0) + 1);
  }
  // Version 2.3.4: Platzhalter-Wörter, die schon im Original stehen („Person A“, „Einrichtung A“, „Nachname A“ …), werden
  // nicht vergeben. Modus „Person A“: nächster freier Buchstabe; rückbaufähig: nächste freie Nummer (reversible.js).
  const placeholderWords = reservedPlaceholders(fullText);
  const freeLetter = (counter, prefix) => {
    let L;
    do { L = letterFor(counter.n++); } while (st.settings.mode === 'person' && placeholderWords.reserved.has(prefix + L));
    return L;
  };
  const orgCounter = { n: 0 };
  for (const og of orgs.values()) {
    og.letter = freeLetter(orgCounter, 'Einrichtung ');
    og.label = st.settings.mode === 'name' ? '[EINRICHTUNG]' : 'Einrichtung ' + og.letter;
    // Anzeige: die markierte Bezeichnung selbst (bei zusammengeführten die des Ziels), sonst die häufigste Schreibweise
    const own = og.hits.find((x) => x.origEntity === og.key);
    og.display = own ? own.term : [...og.forms.entries()].sort((a, b) => b[1] - a[1] || b[0].length - a[0].length || (a[0] < b[0] ? -1 : 1))[0][0];
  }
  const entities = new Map();
  for (const h of hits) {
    if (h.type !== 'person') continue;
    if (!entities.has(h.entity)) {
      entities.set(h.entity, { key: h.entity, manual: h.entity.startsWith('M|'), hits: [], forms: new Map(), linkable: [] });
    }
    const en = entities.get(h.entity);
    en.hits.push(h);
    const surface = fullText.slice(h.s, h.e - (h.suffix ? h.suffix.length : 0));
    en.forms.set(surface, (en.forms.get(surface) || 0) + 1);
    if (h.link || h.ambiguousLink) en.linkable.push(h);
  }
  const personCounter = { n: 0 };
  for (const en of entities.values()) {
    en.letter = freeLetter(personCounter, 'Person ');
    en.label = st.settings.mode === 'name' ? '[NAME]' : 'Person ' + en.letter;
    en.display = [...en.forms.entries()].sort((a, b) => b[1] - a[1] || b[0].length - a[0].length || (a[0] < b[0] ? -1 : 1))[0][0];
  }

  // 8) An/Aus pro Treffer
  hits.forEach((h, idx) => {
    h.id = idx;
    h.key = h.s + ':' + h.e;
    const ov = st.overrides[h.key];
    h.on = ov === undefined ? !h.defaultOff : ov;
    h.label = h.type === 'person' ? entities.get(h.entity).label : h.type === 'org' ? orgs.get(h.entity).label : CONTACT_LABELS[h.type];
  });
  for (const en of entities.values()) en.count = en.hits.length;
  for (const og of orgs.values()) og.count = og.hits.length;

  const result = { fullText, unitStarts, hits, entities, orgs, placeholderWords };
  // Modus "rückbaufähig": Platzhalter je Namensteil und nummerierte Kontaktdaten
  if (st.settings.mode === MODE_REVERSIBLE) assignReversible(result);
  return result;
}

// ---------- Einrichtungen (Version 2.3) ----------
// Bezeichnung in Wörter (und Satzzeichen) zerlegen; gaps[i] = Text zwischen Token i-1 und i ('' oder Leerraum)
export function orgTermTokens(term) {
  const t = String(term || '').normalize('NFC').replace(/\s+/g, ' ').trim();
  const toks = tokenize(t);
  const gaps = toks.map((tk, i) => (i ? t.slice(toks[i - 1].e, tk.s) : ''));
  return { text: t, toks, gaps, key: 'O|' + toks.map((x) => fold(x.t)).join(' ') };
}
// Endungen wie bei von Hand markierten Namen (lex.stemFor): 's, ’s, ', ’, s, es, n, ns
const ORG_ENDINGS = ["'s", '’s', "'", '’', 's', 'es', 'n', 'ns'];
// Ein Wort der Bezeichnung passt auf ein Wort im Text: gleich (ohne Groß-/Kleinschreibung, Akzente) oder mit einer
// dieser Endungen ("Familienzentrums" zu "Familienzentrum", "Bürgervereins" zu "Bürgerverein"). Jede Endung wird
// geprüft (nicht nur die kürzeste Zerlegung). Liefert die Endung oder null.
function orgTokMatch(textTok, termTok) {
  if (!termTok.word) return textTok.t === termTok.t ? '' : null;
  if (!textTok.word) return null;
  const k = fold(termTok.t);
  if (fold(textTok.t) === k) return '';
  if ([...k].length < 3) return null;
  for (const end of ORG_ENDINGS) {
    if (textTok.t.length > end.length && textTok.t.slice(-end.length).toLowerCase() === end && fold(textTok.t.slice(0, -end.length)) === k) return textTok.t.slice(-end.length);
  }
  return null;
}
// Alle Vorkommen der Einrichtungs-Bezeichnungen als GANZE Wortfolge. Längere Bezeichnungen zuerst.
// Zwischen zwei Wörtern darf beliebiger Leerraum stehen (auch ein Zeilenumbruch innerhalb eines Abschnitts).
// Modus rückbaufähig: NICHT über ein festes Zeichen der Vorlage hinweg (u. fixed, z. B. Zeilenumbruch <w:br/> in Word),
// weil es beim Ersetzen stehen bliebe und der Rückbau dann nicht exakt wäre. Dort meldet der Schlusscheck den Namen.
function matchOrgTerms(orgTerms, units, unitToks, unitStarts, covered, tokHit, fullText, hits, reversible) {
  const terms = [];
  const seen = new Set();
  for (const raw of orgTerms) {
    const ot = orgTermTokens(raw);
    if (!ot.toks.some((x) => x.word) || seen.has(ot.key)) continue;
    seen.add(ot.key);
    terms.push(ot);
  }
  terms.sort((a, b) => b.toks.length - a.toks.length);
  for (const ot of terms) {
    const n = ot.toks.length;
    units.forEach((u, ui) => {
      const toks = unitToks[ui];
      const cov = covered[ui];
      for (let k = 0; k + n <= toks.length; k++) {
        let ok = true;
        let suffix = '';
        for (let j = 0; j < n && ok; j++) {
          const tk = toks[k + j];
          if (cov[k + j]) { ok = false; break; }
          const suf = orgTokMatch(tk, ot.toks[j]);
          if (suf === null) { ok = false; break; }
          if (j > 0) {
            const gap = fullText.slice(toks[k + j - 1].e, tk.s);
            if (ot.gaps[j] === '' ? gap !== '' : !/^\s+$/.test(gap)) { ok = false; break; }
            if (reversible && u.fixed && u.fixed.some((p) => p >= toks[k + j - 1].e - unitStarts[ui] && p < tk.s - unitStarts[ui])) { ok = false; break; }
          }
          if (j === n - 1) suffix = suf;
        }
        if (!ok) continue;
        const h = { s: toks[k].s, e: toks[k + n - 1].e, type: 'org', cert: 'sicher', origin: 'org', unit: ui, suffix, entity: ot.key, term: ot.text, comps: [] };
        hits.push(h);
        for (let j = 0; j < n; j++) { cov[k + j] = true; tokHit[ui][k + j] = h; }
        k += n - 1;
      }
    });
    // TXT (Version 2.3, Entscheidung Easy): Einrichtung über GENAU EINEN Zeilenumbruch, d. h. Ende einer Zeile +
    // Anfang der direkt folgenden Zeile (u.joinNext). Nur für markierte Einrichtungen. Die beiden Zeilen werden in der
    // Ausgabe zu einer; der Wert enthält das echte Zeilenende (u.eol), damit der Rückbau den Umbruch exakt herstellt.
    if (n < 2) continue;
    units.forEach((u, ui) => {
      if (!u.joinNext || ui + 1 >= units.length) return;
      const A = unitToks[ui];
      const B = unitToks[ui + 1];
      for (let cut = 1; cut < n; cut++) { // cut Token in Zeile ui (am Zeilenende), n - cut Token am Anfang von Zeile ui + 1
        if (A.length < cut || B.length < n - cut) continue;
        const k = A.length - cut;
        const seq = [...A.slice(k), ...B.slice(0, n - cut)];
        const covs = [...covered[ui].slice(k), ...covered[ui + 1].slice(0, n - cut)];
        if (covs.some(Boolean)) continue;
        let ok = true;
        let suffix = '';
        for (let j = 0; j < n && ok; j++) {
          const suf = orgTokMatch(seq[j], ot.toks[j]);
          if (suf === null) { ok = false; break; }
          if (j > 0) {
            const gap = fullText.slice(seq[j - 1].e, seq[j].s);
            // An der Zeilengrenze: Leerraum mit genau dem einen Zeilenwechsel; in der Bezeichnung muss dort Leerraum stehen
            if (ot.gaps[j] === '' ? gap !== '' : !/^\s+$/.test(gap)) { ok = false; break; }
            if (j === cut && (ot.gaps[j] === '' || (gap.match(/\n/g) || []).length !== 1)) { ok = false; break; }
          }
          if (j === n - 1) suffix = suf;
        }
        // nach dem Namensanfang darf in Zeile ui nichts mehr stehen (sonst wäre es kein Umbruch im Namen)
        if (!ok || fullText.slice(seq[cut - 1].e, unitStarts[ui] + u.text.length).trim()) continue;
        const h = { s: seq[0].s, e: seq[n - 1].e, type: 'org', cert: 'sicher', origin: 'org', unit: ui, unit2: ui + 1,
          split: unitStarts[ui] + u.text.length, eol: u.eol || '\n', suffix, entity: ot.key, term: ot.text, comps: [] };
        hits.push(h);
        for (let j = k; j < A.length; j++) { covered[ui][j] = true; tokHit[ui][j] = h; }
        for (let j = 0; j < n - cut; j++) { covered[ui + 1][j] = true; tokHit[ui + 1][j] = h; }
        break;
      }
    });
  }
}
// Schlusscheck (Version 2.3, Entscheidung Easy): JEDE Einrichtung aus der Liste (eigene Namen, markiert, aus den
// Dateiangaben übernommen) wird im ORIGINALTEXT aller Abschnitte gesucht – auch wenn die Erkennung sie nicht gefunden
// hat, auch über Zeilenumbruch und Absatzgrenze hinweg, mit Endungen und in GROSSSCHREIBUNG. Jede Fundstelle muss
// vollständig von eingeschalteten Einrichtungs-Treffern abgedeckt sein (also in der Ausgabe ganz ersetzt). Sonst:
// Fund. Ersetzt wird hier nichts; Erkennung und Platzhalter bleiben unverändert.
// Liefert [{s, e, text, units: [Abschnitt-Indizes], term, partly}] in Koordinaten von result.fullText.
export function orgCoverageLeaks(result, orgTerms) {
  const out = [];
  const terms = [];
  const seen = new Set();
  for (const raw of orgTerms || []) {
    const ot = orgTermTokens(raw);
    if (!ot.toks.some((x) => x.word) || seen.has(ot.key)) continue;
    seen.add(ot.key);
    terms.push(ot);
  }
  if (!terms.length) return out;
  const text = result.fullText;
  const toks = tokenize(text);
  // Bereiche, die eingeschaltete Einrichtungs-Treffer abdecken
  const cov = result.hits.filter((h) => h.type === 'org' && h.on).map((h) => [h.s, h.e]);
  const covered = (a, b) => cov.some(([x, y]) => x <= a && b <= y);
  const personAt = (a, b) => result.hits.some((h) => h.type === 'person' && h.on && h.s < b && h.e > a);
  const unitOf = (pos) => { let lo = 0; let hi = result.unitStarts.length - 1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (result.unitStarts[m] <= pos) lo = m; else hi = m - 1; } return lo; };
  const taken = [];
  terms.sort((a, b) => b.toks.length - a.toks.length);
  for (const ot of terms) {
    const n = ot.toks.length;
    for (let k = 0; k + n <= toks.length; k++) {
      let ok = true;
      for (let j = 0; j < n && ok; j++) {
        if (orgTokMatch(toks[k + j], ot.toks[j]) === null) { ok = false; break; }
        if (j > 0) {
          const gap = text.slice(toks[k + j - 1].e, toks[k + j].s);
          if (ot.gaps[j] === '' ? gap !== '' : !/^\s+$/.test(gap)) ok = false;
        }
      }
      if (!ok) continue;
      const s = toks[k].s;
      const e = toks[k + n - 1].e;
      if (taken.some(([x, y]) => s < y && e > x)) continue; // schon von einer längeren Bezeichnung erfasst
      taken.push([s, e]);
      // vollständig ersetzt? Jedes Wort der Fundstelle muss in einem eingeschalteten Einrichtungs-Treffer liegen
      const words = toks.slice(k, k + n);
      if (words.every((t) => covered(t.s, t.e))) continue;
      const units = [...new Set([unitOf(s), unitOf(e - 1)])];
      out.push({ s, e, text: text.slice(s, e), units, term: ot.text, partly: words.some((t) => covered(t.s, t.e)) || words.some((t) => personAt(t.s, t.e)) });
    }
  }
  return out.sort((a, b) => a.s - b.s);
}

// Suchformen der eingeschalteten Einrichtungen für den Schlusscheck: jede Schreibweise als GANZE Wortfolge
export function orgLeakPhrases(result) {
  const phrases = [];
  for (const og of (result.orgs || new Map()).values()) {
    if (!og.hits.some((h) => h.on)) continue;
    const seen = new Set(); // ohne Groß-/Kleinschreibung nur einmal (die Suche ist ohnehin unabhängig davon)
    for (const f of [...og.forms.keys(), ...og.terms]) {
      const words = f.trim().split(/\s+/).filter(Boolean);
      const k = words.map((w) => w.toLowerCase()).join(' ');
      if (!words.length || seen.has(k)) continue;
      seen.add(k);
      phrases.push({ words, display: f, entity: og.label, full: f, org: true });
    }
  }
  return phrases;
}
// Ersetzt die Schreibweisen der Einrichtungen in beliebigem Text (Wortfolge, beliebiger Leerraum dazwischen).
// label(form) liefert den Ersatz oder null; reps bekommt {s, e, text}.
function orgReplacements(str, result, label) {
  const reps = [];
  for (const og of (result.orgs || new Map()).values()) {
    if (!og.hits.some((h) => h.on)) continue;
    const forms = [...new Set([...og.forms.keys(), ...og.terms])].sort((a, b) => b.length - a.length);
    for (const f of forms) {
      const words = f.trim().split(/\s+/).filter(Boolean);
      if (!words.length) continue;
      const re = new RegExp('(^|[^\\p{L}\\p{N}])(' + words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('[\\s\\u00a0]+') + ')(?![\\p{L}\\p{N}])', 'giu');
      for (const m of str.matchAll(re)) {
        const s = m.index + m[1].length;
        const e = s + m[2].length;
        if (reps.some((r) => s < r.e && e > r.s)) continue;
        const text = label(og, m[2]);
        if (text !== null) reps.push({ s, e, text });
      }
    }
  }
  return reps;
}

function mergeAdjacent(hits, fullText) {
  const manual = hits.filter((h) => h.origin === 'manual').sort((a, b) => a.s - b.s);
  for (let i = 0; i + 1 < manual.length; i++) {
    const a = manual[i];
    const b = manual[i + 1];
    if (a.entity === b.entity && a.unit === b.unit && /^[  ]+$/.test(fullText.slice(a.e, b.s)) && !a.suffix) {
      a.e = b.e;
      a.suffix = b.suffix;
      a.comps = a.comps.concat(b.comps);
      b.dead = true;
      manual[i + 1] = a;
    }
  }
  for (let i = hits.length - 1; i >= 0; i--) if (hits[i].dead) hits.splice(i, 1);
}

// Endung hinter dem Platzhalter (Modi „Person A“ und „[NAME]“). Version 2.3.3: eine große Endung wird klein geschrieben
// („MÜLLERS“ → „Person As“), damit „Person AS“ nie wie eine andere Person „AS“ aussieht. Im Modus rückbaufähig
// gehört eine große Endung zum Platzhalter selbst (reversible.js), dort kommt hier nur eine kleine Endung an.
function outSuffix(suffix) {
  if (!suffix) return '';
  return /\p{Lu}/u.test(suffix) ? suffix.toLowerCase() : suffix;
}

// Ersetzungen je Einheit: [{s, e, text}] relativ zur Einheit
export function replacementsByUnit(result, units) {
  const per = units.map(() => []);
  result.joins = new Set(); // TXT: Zeile i wird mit Zeile i + 1 verbunden (Einrichtung über einen Zeilenumbruch)
  for (const h of result.hits) {
    if (!h.on) continue;
    const base = result.unitStarts[h.unit];
    if (h.unit2 !== undefined) {
      // Platzhalter am Ende von Zeile 1, Rest des Namens am Anfang von Zeile 2 entfällt, die Zeilen werden verbunden
      const label = h.parts ? h.parts[0].text : h.label;
      per[h.unit].push({ s: h.s - base, e: h.split - base, text: label + (h.suffixInPh ? '' : outSuffix(h.suffix)) });
      per[h.unit2].push({ s: 0, e: (h.tailEnd || h.e) - result.unitStarts[h.unit2], text: '' });
      result.joins.add(h.unit);
      continue;
    }
    if (h.parts) {
      // rückbaufähig: jeder Namensteil einzeln; Text dazwischen (Leerzeichen, Komma, Punkt der Initiale) und Endung bleiben
      for (const p of h.parts) per[h.unit].push({ s: p.s - base, e: p.e - base, text: p.text });
      continue;
    }
    const text = h.label + (h.type === 'person' || h.type === 'org' ? outSuffix(h.suffix) : '');
    per[h.unit].push({ s: h.s - base, e: h.e - base, text });
  }
  return per;
}

export function applyReplacements(text, reps) {
  let out = '';
  let pos = 0;
  for (const r of [...reps].sort((a, b) => a.s - b.s)) {
    if (r.s < pos) continue;
    out += text.slice(pos, r.s) + r.text;
    pos = r.e;
  }
  return out + text.slice(pos);
}

// Schlusscheck: Suchformen aller bestätigten (mind. ein Treffer aktiv) Personen
export function leakForms(result) {
  const forms = new Map(); // key -> {display, ambiguous}
  for (const en of result.entities.values()) {
    if (!en.hits.some((h) => h.on)) continue;
    for (const h of en.hits) {
      if (!h.on) continue;
      for (const c of h.comps || []) {
        if (c.type !== 'W') continue;
        const raw = result.fullText.slice(c.s, c.stemEnd || c.e);
        const keys = new Set([c.key, fold(raw)]);
        const uv = umlautVariant(raw);
        if (uv) keys.add(fold(uv));
        for (const k of keys) {
          if (!k || [...k].length < 2) continue;
          if (!forms.has(k)) forms.set(k, { display: raw, entity: en.label, ambiguous: lex.isAmbiguous(k) });
        }
      }
    }
  }
  return forms;
}

// Namen aus den Original-Metadaten (Autor, Bearbeiter, Manager, Kommentar-/Änderungsautoren, SharePoint-Personen)
// als Suchformen für den Schlusscheck. Personen: jedes Namenswort einzeln; Firma: die ganze Wortfolge.
// Platzhalter-/Standardwerte wie "Autor" oder "Microsoft Office User" zählen nicht als Name.
const META_DEFAULT_WORDS = new Set(['autor', 'author', 'microsoft', 'office', 'user', 'benutzer', 'nutzer', 'administrator', 'admin',
  'windows', 'unknown', 'unbekannt', 'owner', 'besitzer', 'gast', 'guest', 'none', 'system', 'person', 'name']);
export function metaLeakForms(metaNames) {
  const forms = new Map();
  const phrases = [];
  for (const m of metaNames || []) {
    const label = 'aus den Dateiangaben: ' + m.where;
    if (m.kind === 'org') {
      const words = m.name.trim().split(/\s+/);
      if (/\p{L}{2,}/u.test(m.name) && !words.every((w) => META_DEFAULT_WORDS.has(fold(w)))) phrases.push({ words, display: m.name, entity: label, full: m.name, meta: true, metaOrg: true });
      continue;
    }
    let v = m.name;
    if (v.includes('@')) v = v.split('@')[0].replace(/[._-]+/g, ' '); // E-Mail-Adresse: nur der Teil vor dem @
    if (v.includes('\\')) v = v.split('\\').pop(); // DOMÄNE\benutzer
    for (const tk of tokenize(v)) {
      if (!tk.word) continue;
      const k = fold(tk.t);
      if ([...k].length < 2 || META_DEFAULT_WORDS.has(k) || lex.isStopWord(tk.t) || lex.PARTICLES.has(k) || lex.isTitle(k)) continue;
      if (!forms.has(k)) forms.set(k, { display: tk.t, entity: label, ambiguous: lex.isAmbiguous(k), full: m.name, meta: true });
      const uv = umlautVariant(tk.t);
      if (uv && !forms.has(fold(uv))) forms.set(fold(uv), { display: tk.t, entity: label, ambiguous: lex.isAmbiguous(k), full: m.name, meta: true });
    }
  }
  return { forms, phrases };
}

// Prüft, ob ein Text einen der Namen enthält (für SharePoint-Felder)
export function makeNameTest(forms, phrases) {
  return (str) => findLeaks(forms, [{ where: '', text: str }], phrases).length > 0;
}

// Schlusscheck (Version 2.3.2): Grundform mit einer Endung der vorhandenen Liste ('s, ’s, ', ’, s, es, n, ns), Endung
// ohne Rücksicht auf Groß-/Kleinschreibung („MÜLLERS“, „QUABBENJANSENS“, „Quabbenjansens“). Jede Zerlegung wird geprüft.
const LEAK_ENDINGS = ["'s", "'", 'ns', 'es', 's', 'n'];
function leakFormWithEnding(word, forms) {
  for (const end of LEAK_ENDINGS) {
    if (word.length <= end.length) continue;
    if (word.slice(-end.length).toLowerCase().replace(/’/g, "'") !== end) continue; // ohne Akzent-Angleichung („ń“ ist kein „n“)
    const f = forms.get(fold(word.slice(0, -end.length)));
    if (f) return f;
  }
  return null;
}

// Sucht verbliebene Klarnamen in Texten. texts: [{where, text}]; phrases: Wortfolgen (z. B. Firmenname)
export function findLeaks(forms, texts, phrases = []) {
  const leaks = [];
  for (const { where, text, plain } of texts) {
    for (const ph of phrases) {
      // ohne Lookbehind (ältere Safari-Versionen): Wortgrenze vorn als Gruppe
      // Einrichtungen (2.3): auch mit Endung am Schluss ("des Lindenauer Bürgervereins"); Firmen aus Dateiangaben wie bisher
      const end = ph.org ? "(?:'s|’s|'|’|s|es|n|ns)?" : '';
      const re = new RegExp('(^|[^\\p{L}\\p{N}])(' + ph.words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('[\\s\\u00a0]+') + end + ')(?![\\p{L}\\p{N}])', 'giu');
      // Einrichtungen: im reinen Text ohne Attributwerte suchen (eine Wortfolge kann in Word über mehrere Textläufe
      // verteilt sein; dazwischen stünden sonst Attributwerte wie „preserve“). Alle anderen Suchen wie bisher.
      const src = ph.org && typeof plain === 'string' ? plain : text;
      for (const m of src.matchAll(re)) {
        const at = m.index + m[1].length;
        leaks.push({ where, word: m[2], entity: ph.entity, full: ph.full, meta: !ph.org, org: !!ph.org, metaOrg: !!ph.metaOrg, context: src.slice(Math.max(0, at - 30), Math.min(src.length, at + m[2].length + 30)) });
      }
    }
    for (const tk of tokenize(text)) {
      if (!tk.word) continue;
      const cands = [tk.t, ...tk.t.split('-')];
      for (const c of cands) {
        let k = fold(c);
        let f = forms.get(k);
        if (!f) { const m = c.match(/^(.+?)(['’]s|s)$/u); if (m) { k = fold(m[1]); f = forms.get(k); } }
        if (!f) f = leakFormWithEnding(c, forms);
        if (!f) continue;
        if (f.ambiguous && !isCap(c)) continue;
        leaks.push({ where, word: tk.t, entity: f.entity, full: f.full, meta: !!f.meta, context: text.slice(Math.max(0, tk.s - 30), Math.min(text.length, tk.e + 30)) });
        break;
      }
    }
  }
  return leaks;
}

// Ersetzer für Texte außerhalb der Prüfansicht (Metadaten, Feldfunktionen, Alternativtexte, Verweise):
// ersetzt alle Formen bestätigter Personen sowie Kontaktdaten (gemäß Einstellungen).
export function makeGenericReplacer(result, settings) {
  if (result.reversible) return makeReversibleGeneric(result, settings);
  const forms = new Map();
  for (const en of result.entities.values()) {
    if (!en.hits.some((h) => h.on)) continue;
    for (const [k, f] of leakForms({ ...result, entities: new Map([[en.key, en]]) })) if (!forms.has(k)) forms.set(k, { ...f, label: en.label });
  }
  return (str) => {
    if (!str || !/\p{L}|\d/u.test(str)) return str;
    const reps = [];
    for (const c of findContacts(str, settings)) if (c.cert === 'sicher') reps.push({ s: c.s, e: c.e, text: CONTACT_LABELS[c.type] });
    // Einrichtungen als ganze Wortfolge (vor den Personen, Vorrang)
    for (const r of orgReplacements(str, result, (og) => og.label)) if (!reps.some((x) => r.s < x.e && r.e > x.s)) reps.push(r);
    for (const tk of tokenize(str)) {
      if (!tk.word || reps.some((r) => tk.s < r.e && tk.e > r.s)) continue;
      let k = fold(tk.t);
      let suffix = '';
      let f = forms.get(k);
      if (!f) { const m = tk.t.match(/^(.+?)(['’]s|s)$/u); if (m) { k = fold(m[1]); f = forms.get(k); suffix = m[2]; } }
      if (!f || (f.ambiguous && !isCap(tk.t))) continue;
      reps.push({ s: tk.s, e: tk.e, text: f.label + suffix });
    }
    return reps.length ? applyReplacements(str, reps) : str;
  };
}

// rückbaufähig: dieselben Platzhalter wie im Text, wenn die Schreibweise exakt bekannt ist.
// Sonst "Name X" (nicht rückbaufähig; wird beim Rückbau als unbekannt gemeldet).
function makeReversibleGeneric(result, settings) {
  const exact = new Map(); // Schreibweise -> Platzhalter
  // Initialen und Einzelzeichen nicht: "A" in "Plan A" ist kein Name
  for (const [ph, info] of result.reversible.placeholderInfo) {
    if (info.kategorie === 'Name' && info.rolle !== 'Initiale' && [...info.wert].length >= 2 && !exact.has(info.wert)) exact.set(info.wert, ph);
  }
  const forms = new Map();
  for (const en of result.entities.values()) {
    if (!en.hits.some((h) => h.on)) continue;
    for (const [k, f] of leakForms({ ...result, entities: new Map([[en.key, en]]) })) if (!forms.has(k)) forms.set(k, { ...f, label: 'Name ' + en.letter });
  }
  return (str) => {
    if (!str || !/\p{L}|\d/u.test(str)) return str;
    const reps = [];
    for (const c of findContacts(str, settings)) {
      if (c.cert !== 'sicher') continue;
      const ph = result.reversible.contactNums.get(c.type + '|' + str.slice(c.s, c.e));
      reps.push({ s: c.s, e: c.e, text: ph || CONTACT_LABELS[c.type] });
    }
    // Einrichtungen: exakt bekannte Schreibweise -> ihr Platzhalter, sonst "[EINRICHTUNG]" (nicht rückbaufähig)
    for (const r of orgReplacements(str, result, (og, found) => result.reversible.orgExact.get(og.letter + '|' + found) || '[EINRICHTUNG]')) {
      if (!reps.some((x) => r.s < x.e && r.e > x.s)) reps.push(r);
    }
    for (const tk of tokenize(str)) {
      if (!tk.word || reps.some((r) => tk.s < r.e && tk.e > r.s)) continue;
      // Version 2.3.4: Ziffern direkt dahinter („Müller2“): nur die ganze Schreibweise exakt, sonst „Name X“ samt Ziffern
      // (nie „Nachname A“ + „2“, das sähe aus wie die Schreibweise „Nachname A2“)
      const dg = str.slice(tk.e).match(/^[\p{L}\p{N}]+/u);
      if (dg) {
        const whole = tk.t + dg[0];
        const f2 = forms.get(fold(tk.t));
        if (exact.has(whole)) reps.push({ s: tk.s, e: tk.e + dg[0].length, text: exact.get(whole) });
        else if (f2 && !(f2.ambiguous && !isCap(tk.t))) reps.push({ s: tk.s, e: tk.e + dg[0].length, text: f2.label });
        continue;
      }
      const m = tk.t.match(/^(.+?)(['’]s|s)$/u);
      if (exact.has(tk.t)) { reps.push({ s: tk.s, e: tk.e, text: exact.get(tk.t) }); continue; }
      if (m && exact.has(m[1])) { reps.push({ s: tk.s, e: tk.e, text: exact.get(m[1]) + m[2] }); continue; }
      let f = forms.get(fold(tk.t));
      let suffix = '';
      if (!f && m) { f = forms.get(fold(m[1])); suffix = m[2]; }
      if (!f || (f.ambiguous && !isCap(tk.t))) continue;
      reps.push({ s: tk.s, e: tk.e, text: f.label + suffix });
    }
    return reps.length ? applyReplacements(str, reps) : str;
  };
}
