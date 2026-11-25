// Namenserkennung (regelbasiert, deterministisch).
// Eingabe: Liste von Texteinheiten (Absätze, Zellen …) und ein Zustand mit Einstellungen,
// manuell markierten Namen, Ausnahmen, Umschaltungen und Zusammenführungen.
// Ausgabe: Treffer (hits) und Personen (entities) mit Pseudonymen.
import { fold, umlautVariant } from './fold.js';
import * as lex from './lexicon.js';
import { findContacts } from './patterns.js';
import { findOrgs } from './orgauto.js';
import { assignReversible, MODE_REVERSIBLE, reservedPlaceholders } from './reversible.js';

const TOKEN_RE = /[\p{L}\p{M}]+(?:['’][\p{L}\p{M}]+)*(?:-[\p{L}\p{M}]+(?:['’][\p{L}\p{M}]+)*)*|\p{N}+|\S/gu;
// Arabische Namenspräfixe mit Bindestrich: al-Hassan, el-Masri, Abd-ar-…
const HYPHEN_PREFIX = new Set(['al', 'el', 'ul', 'ad', 'ar', 'as', 'ash', 'at', 'az', 'abd', 'abu', 'ben', 'bin', 'ibn']);
const ACADEMIC = new Set(['med', 'dent', 'vet', 'rer', 'nat', 'phil', 'jur', 'oec', 'pol', 'hc', 'ing', 'habil']);

export const CONTACT_LABELS = { email: '[E-MAIL]', phone: '[TELEFON]', iban: '[IBAN]', address: '[ADRESSE]', web: '[WEBADRESSE]', account: '[KONTO]',
  // Version 2.10.0: neue Arten nur aus der Behandlung „ganz ersetzen“ von Tabellenspalten
  date: '[DATUM]', info: '[ANGABE]' };

export function defaultState() {
  return {
    settings: { mode: 'person', email: true, phone: true, iban: true, address: true, web: true, unsureOn: true },
    manualTerms: [], // vom Nutzer markierte Namen (Reihenfolge = Reihenfolge der Markierung)
    orgTerms: [], // vom Nutzer (oder aus den Dateiangaben) als Einrichtung übernommene Bezeichnungen (Version 2.3)
    exceptions: [], // nie anonymisieren
    overrides: {}, // "s:e" -> true/false (Treffer an/aus)
    merges: {}, // entityKey -> Ziel-entityKey
    unlinks: [], // Kurzformen, die NICHT zugeordnet werden sollen (Schlüssel "S|…")
    nameColumns: {}, // Version 2.6.0: Spalte von Hand: Spalten-Kennung -> true (enthält Namen) / false (keine Namensspalte)
    colTreat: {}, // Version 2.10.0: Behandlung je Spalte von Hand: Spalten-Kennung -> 'name' | 'ganz' | 'bisher'
    colMemory: {}, // Version 2.10.0: gemerkte Wahl je Überschrift (Merkliste): Vergleichsform der Überschrift -> Behandlung
    colRare: true, // Version 2.11.0: Personen-Tabellen – seltene Werte (weniger als 3-mal) in lesbaren Spalten ersetzen
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
        // Version 2.6.0: Ein FÜHRENDER Namenszusatz gehört nur zum Namen, wenn danach ein Nachname folgt, nicht ein reiner
        // Vorname („Schwester von Lena Winter“ behält sein „von“; „Frau von Bodelschwingh“ bleibt ein Name)
        const firstNameOnly = comps.length === 0 && ni.F && !ni.L && !ni.shaped;
        if (!firstNameOnly && !ni.stop && !ni.title && !ni.exception && (comps.length > 0 || ctx.strong || ni.known || ni.shaped)) {
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

// Version 2.6.0: Endet der Text auf eine Anrede (Herr/Herrn/Frau/Fräulein/Hr./Fr./Frl., ggf. mit Titeln), ohne Artikel davor?
function endsWithAnrede(text) {
  if (!/\S/.test(text)) return false;
  const t = tokenize(text);
  let k = t.length - 1;
  if (k >= 0 && t[k].t === '.') k--;
  while (k >= 0 && t[k].word) {
    const key = fold(t[k].t);
    if (ANREDE.has(key) && isCap(t[k].t)) return !nounContext(t, k, false);
    if (!ANREDE_TITLES.has(key)) return false;
    k--;
    if (k >= 0 && t[k].t === '.') k--;
  }
  return false;
}

// ---------- Regel b2: Wochentage und Monate allein -> "unsicher, aus" ----------
const CALENDAR = new Set(['montag', 'dienstag', 'mittwoch', 'donnerstag', 'freitag', 'samstag', 'sonnabend', 'sonntag',
  'januar', 'janner', 'februar', 'feber', 'marz', 'april', 'mai', 'juni', 'juli', 'august', 'september', 'oktober', 'november', 'dezember']);
// Abkürzungen zählen nur mit Punkt ("Jan." ist Januar, "Jan" ist ein Vorname)
const CALENDAR_ABBR = new Set(['mo', 'di', 'mi', 'do', 'fr', 'sa', 'so', 'jan', 'feb', 'mar', 'mrz', 'apr', 'jun', 'jul', 'aug', 'sep', 'sept', 'okt', 'nov', 'dez']);
// Weg d (2.4.0): Wochentags-Abkürzungen und was direkt danach als Uhrzeit oder Datum gilt („13:30“, „13.30“, „05.10.“, „5.“)
const WEEKDAY_ABBR = new Set(['mo', 'di', 'mi', 'do', 'fr', 'sa', 'so']);
const TIME_OR_DATE = /^[ \u00a0]*\d{1,2}(?:[:.]\d{2}|\.\d{1,2}\.?|\.)/;
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
export function analyze(units, state, extra = {}) {
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
  // Version 2.10.0: Behandlung je Spalte (Excel, CSV). „Name“ zuerst (vor der Namensspalten-Regel), „ganz ersetzen“ am
  // Ende der Erkennung (columnWholeHits). Ohne Tabelle mit Kopfzeile oder mit „wie bisher“ überall: wie 2.9.0.
  const colPlan = columnPlan(units, st.colTreat || {}, st.colMemory || {}, { valueCells: extra.valueCells, rare: st.colRare !== false });
  const nameUnits = new Set();
  const ganzUnits = columnTreatRule(units, unitToks, unitStarts, covered, tokHit, hits, mentions, exceptions, colPlan, nameUnits);
  // Version 2.6.0: Namensspalten in Tabellen (Excel, CSV, Word) – vor allen übrigen Regeln (Vorrang vor „mehrdeutig“,
  // Regel b2 und Regel a2)
  const columns = nameColumnRule(units, unitToks, covered, tokHit, hits, mentions, exceptions, fullText, st.nameColumns || {},
    nameUnits);

  // 1c) Version 2.8.0: Einrichtungen selbst finden (orgauto.js). Nach Kontaktdaten, von Hand markierten Einrichtungen und
  // Namensspalten (die haben Vorrang), vor der Personen-Erkennung (ein Personenname in einer Einrichtung gehört zu ihr).
  // Gefundene Bezeichnungen werden wie von Hand markierte im ganzen Dokument gesucht, aber „unsicher, an“. Gehört ein
  // Fund zu einer von Hand markierten Einrichtung (gleiche Einrichtung, andere Schreibweise), wird er Teil von ihr (sicher).
  const isCovered = (ui, s, e) => { const base = unitStarts[ui]; return unitToks[ui].some((tk, k) => covered[ui][k] && tk.s - base < e && tk.e - base > s); };
  // Nachbesserung 2.8.0 / Version 2.8.1: Personen, die die Erkennung OHNE gefundene Einrichtungen „sicher“ ersetzt (einmal
  // rechnen, erst wenn es einen Kandidaten gibt)
  let safeSpans = null;
  const safe = () => {
    if (!safeSpans) {
      const plain = analyze(units, state, { ...extra, noAutoOrgs: true });
      // Version 2.8.1 (Guardian-Fund 4, Entscheidung Easy): Schalter oder Antworten, die eine Person ausschalten, ändern die
      // Grenze nicht. Guardian-Lauf 5, Fund 1 (Entscheidung Easy): Personen, die von Anfang an aus sind (z. B. GROSS-Form
      // mit Endung eines eigenen Namens), zählen nicht – nur solche, die ersetzt werden oder von Hand ausgeschaltet sind.
      safeSpans = plain.hits.filter((h) => h.type === 'person' && h.cert === 'sicher' && (h.on || (st.overrides || {})[h.key] === false)).map((h) => [h.s, h.e]);
    }
    return safeSpans;
  };
  // Version 2.8.1 (Teil 3): Beginn der ersten sicheren Person in einem Kandidaten (Koordinaten der Einheit), sonst -1
  const cutAt = (ui, s, e) => {
    const a = unitStarts[ui] + s;
    const b = unitStarts[ui] + e;
    let p = -1;
    for (const [x, y] of safe()) if (x < b && y > a && (p < 0 || x < p)) p = x;
    return p < 0 ? -1 : p - unitStarts[ui];
  };
  const auto = extra.noAutoOrgs ? { groups: [], weak: [] } : findOrgs(units, fullText, { covered: isCovered, exceptions, manualTerms: st.orgTerms || [], cutAt });
  const autoTerms = [];
  for (const g of auto.groups) {
    const manualKey = g.manualTerm ? orgTermTokens(g.manualTerm).key : null;
    const entity = manualKey || 'A|' + orgTermTokens(g.terms[0]).key.slice(2);
    for (const t of g.terms) autoTerms.push({ text: t, entity, auto: !manualKey, display: g.terms[0], hyphen: !!(g.hyphen && g.hyphen.has(t)) });
  }
  if (autoTerms.length) {
    // Nachbesserung 2.8.0 (Befund 1): Eine gefundene Einrichtung verdeckt nie eine Stelle, die die Personen-Erkennung ohne
    // sie „sicher“ ersetzt (Ausnahme: Bindestrich-Form „Erika-Brandner-Schule“). Dazu einmal ohne gefundene Einrichtungen
    // rechnen (nur wenn es Funde gibt).
    const blocked = (a, b) => safe().some(([x, y]) => x < b && y > a);
    const blockedHits = [];
    matchOrgTerms(autoTerms, units, unitToks, unitStarts, covered, tokHit, fullText, hits, st.settings.mode === MODE_REVERSIBLE, st.settings,
      { blocked, overrides: st.overrides || {}, blockedHits });
    // Eine so verdrängte Stelle geht in den Warnpunkt „Hier könnte eine Einrichtung stehen“ (nicht still verlieren)
    for (const b of blockedHits) auto.weak.push({ unit: b.unit, s: b.s - unitStarts[b.unit], e: b.e - unitStarts[b.unit], text: fullText.slice(b.s, b.e), blocked: true });
  }
  units.forEach((u, ui) => {
    const base = unitStarts[ui];
    const toks = unitToks[ui];
    const cov = covered[ui];
    const prevText = ui > 0 ? units[ui - 1].text : '';
    // Regel a2: vorige Einheit besteht nur aus einer Anrede und diese Einheit folgt direkt darauf
    // Version 2.6.0 (Excel): Anrede allein in der linken Nachbarzelle (bei gemeinsamem Text: in irgendeiner seiner Zellen)
    const a2Left = u.leftUnits && u.leftUnits.some((li) => li !== ui && isAnredeOnly(units[li].text));
    if (((ui > 0 && u.follows && isAnredeOnly(units[ui - 1].text)) || a2Left) && !u.heading) {
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
    // Version 2.6.0 (Textdateien und eingefügter Text): Die vorige Zeile endet auf eine Anrede (ggf. mit Titel, ohne
    // Artikel davor) -> der Anfang dieser Zeile ist ein Name. Variante „eng“: wie Regel a2 (Entscheidung E).
    if (ui > 0 && units[ui - 1].joinNext && !isAnredeOnly(units[ui - 1].text) && endsWithAnrede(units[ui - 1].text)
      && toks[0] && toks[0].word && toks[0].cap && !cov[0]) {
      const { comps } = parseSeq(toks, 0, { strong: true, weak: false, post: false }, u.text, base, cov, exceptions);
      const Wl = comps.filter((c) => c.type === 'W');
      const skip = !Wl.length || Wl.every((c) => c.A) || (Wl.length === 1 && isCalendarWord(toks, Wl[0].tokIdx));
      if (!skip) {
        const lastWc = [...comps].reverse().find((x) => x.type === 'W');
        const s = comps[0].s;
        const e = lastWc.e;
        const unsure = Wl.length === 1 && !Wl[0].known && !Wl[0].shaped;
        const h = { s, e, type: 'person', cert: unsure ? 'unsicher' : 'sicher', origin: 'auto', unit: ui, suffix: lastWc.suffix || '', comps,
          mk: mentionKey(comps, null), titled: true, lineBreak: true, defaultOff: false };
        if (unsure) h.a2group = 'a2|' + lastWc.key;
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
      // Version 2.4.0 (Weg d): Wochentags-Abkürzung OHNE Punkt direkt vor einer Uhrzeit oder einem Datum („Do 13:30“,
      // „Mo 05.10.“) ist kein Name. Mit Punkt („Do.“) gilt weiter Regel b2; mit Anrede („Frau Do“) bleibt es ein Name.
      if (cert && W.length === 1 && comps.length === 1 && !ctx.strong && !ctx.weak && !ctx.post && !swapped
        && WEEKDAY_ABBR.has(W[0].key) && TIME_OR_DATE.test(u.text.slice(W[0].e - base))) cert = null;
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
  // Version 2.5.0 (D.3): Dieselben GROSS-Formen mit Endung bei von Hand übernommenen Namen werden als Treffer geführt,
  // aber standardmäßig AUS (Ausgabe ohne Bedienung unverändert) und je Stelle gefragt (capsManual).
  const manualCapsKeys = new Set([...partKeys].filter((k) => manualParts.has(k)));
  units.forEach((u, ui) => {
    const toks = unitToks[ui];
    toks.forEach((tk, k) => {
      if (!tk.word || covered[ui][k]) return;
      let stm = lex.stemFor(tk.t, partKeys) || lex.stemFor(tk.t, capsKeys, true);
      if (!stm) {
        const cm = lex.stemFor(tk.t, manualCapsKeys, true);
        if (!cm || exceptions.has(cm.key) || lex.isTitle(cm.key) || lex.PARTICLES.has(tk.t.toLowerCase()) || lex.isStopWord(tk.t)) return;
        hits.push({ s: tk.s, e: tk.e, type: 'person', cert: 'sicher', origin: 'manual', unit: ui, suffix: cm.suffix,
          entity: [...partToEntities.get(cm.key)][0], comps: [{ type: 'W', s: tk.s, e: tk.e, key: cm.key }], defaultOff: true, capsManual: true });
        covered[ui][k] = true;
        return;
      }
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

  // Version 2.10.0: Spalten mit Behandlung „ganz ersetzen“ (nach allen Regeln und der Übertragung)
  columnWholeHits(units, unitStarts, hits, ganzUnits, st.settings.mode === MODE_REVERSIBLE);
  // Version 2.11.0: Zellen der Kopfzeile einer Tabelle (Excel, CSV), die nur aus üblichen Spaltenkopf-Wörtern bestehen,
  // werden nie ersetzt (st.headKeep === false nur für den Nachweis in tests/bedienung-test.mjs: Kopfzeile wie 2.10.0)
  const headOnly = st.headKeep === false ? new Set() : headerOnlyUnits(units);
  for (let i = hits.length - 1; i >= 0; i--) if (headOnly.has(hits[i].unit) || (hits[i].unit2 !== undefined && headOnly.has(hits[i].unit2))) hits.splice(i, 1);

  hits.sort((a, b) => a.s - b.s || a.e - b.e);

  // 7) Personen und Pseudonyme (Reihenfolge des ersten Auftretens); Einrichtungen mit eigener Buchstabenfolge
  const orgs = new Map();
  for (const h of hits) {
    if (h.type !== 'org') continue;
    if (!orgs.has(h.entity)) orgs.set(h.entity, { key: h.entity, org: true, manual: !h.auto, auto: !!h.auto, hits: [], forms: new Map(), linkable: [], terms: new Set() });
    const og = orgs.get(h.entity);
    if (h.colOrg) og.col = true; // Version 2.10.0: aus einer Spalte „ganz ersetzen“ (Einrichtung)
    if (!h.auto) { og.manual = true; og.auto = false; }
    if (h.auto && !og.autoDisplay) og.autoDisplay = h.display;
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
    og.display = og.auto && og.autoDisplay ? og.autoDisplay : own ? own.term : [...og.forms.entries()].sort((a, b) => b[1] - a[1] || b[0].length - a[0].length || (a[0] < b[0] ? -1 : 1))[0][0];
  }
  const entities = new Map();
  // Version 2.5.0: Treffer „GROSS-Form eines von Hand übernommenen Namens“ (capsManual) bestimmen weder Reihenfolge
  // noch Schreibweisen einer Person; sie hängen sich nur an (so bleiben Buchstaben und Anzeige wie bisher).
  for (const h of [...hits.filter((x) => !x.capsManual), ...hits.filter((x) => x.capsManual)]) {
    if (h.type !== 'person') continue;
    if (h.capsManual) { if (entities.has(h.entity)) entities.get(h.entity).hits.push(h); continue; }
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
    // Version 2.8.1 (Guardian-Lauf 2, Fund 1): Einrichtungs-Treffer haben eigene Schlüssel („o…“). Sonst erbt eine Person,
    // die nach „Nein“ genau dieselbe Stelle belegt („Praxis Lindqvist“), das „aus“ der Einrichtung.
    h.key = (h.type === 'org' ? 'o' : '') + h.s + ':' + h.e;
    const ov = st.overrides[h.key];
    h.on = ov === undefined ? !h.defaultOff : ov;
    h.label = h.type === 'person' ? entities.get(h.entity).label : h.type === 'org' ? orgs.get(h.entity).label : CONTACT_LABELS[h.type];
  });
  for (const en of entities.values()) { en.hits.sort((a, b) => a.s - b.s); en.count = en.hits.filter((x) => !x.capsManual).length; }
  // Version 2.5.0 (D.2): Stelle im Sachkontext – nur Wörter der Liste „mehrdeutig“: direkt nach Artikel oder Präposition
  // („im Winter“, „die Rosen“) oder gebeugte Form („Rosen“ bei Person Rose). Nur ein Merkmal für die Fragen, An/Aus
  // bleibt wie bisher.
  for (const h of hits) {
    if (h.type !== 'person' || h.capsManual) continue;
    const ws = (h.comps || []).filter((c) => c.type === 'W');
    if (ws.length !== 1 || (h.comps || []).length !== 1 || !lex.isAmbiguous(ws[0].key)) continue;
    const toks = unitToks[h.unit];
    const ti = toks.findIndex((t) => t.s === h.s);
    if (ti < 0) continue;
    if (nounContext(toks, ti)) h.sachkontext = 'artikel';
    else if (h.suffix) h.sachkontext = 'gebeugt';
  }
  for (const og of orgs.values()) og.count = og.hits.length;

  const result = { fullText, unitStarts, hits, entities, orgs, placeholderWords, columns, colPlan, headOnly, orgWeak: auto.weak, autoOrgTerms: autoTerms.filter((t) => t.auto).map((t) => ({ text: t.text, entity: t.entity })) };
  // Version 2.7.0: Webadressen/Konten in Link-Zielen, Link-Hinweisen und Feldfunktionen (nur bei eingeschaltetem Schalter)
  if (st.settings.web && extra.linkTexts && extra.linkTexts.length) result.linkTexts = extra.linkTexts;
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
function matchOrgTerms(orgTerms, units, unitToks, unitStarts, covered, tokHit, fullText, hits, reversible, settings, autoOpt = null) {
  const terms = [];
  const seen = new Set();
  for (const raw of orgTerms) {
    // Version 2.8.0: auch {text, entity, auto, display} (selbst gefundene Einrichtung, entity = ihre Gruppe)
    const ot = orgTermTokens(typeof raw === 'string' ? raw : raw.text);
    if (typeof raw !== 'string') { ot.entity = raw.entity; ot.auto = raw.auto; ot.display = raw.display; ot.hyphen = raw.hyphen; }
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
        const h = { s: toks[k].s, e: toks[k + n - 1].e, type: 'org', cert: 'sicher', origin: 'org', unit: ui, suffix, entity: ot.key, term: ot.text, comps: [], ...orgAutoFields(ot, settings) };
        // Nachbesserung 2.8.0: gefundene Einrichtung (auch eine Schreibweise einer markierten)
        if (autoOpt) {
          if (!ot.hyphen && autoOpt.blocked(h.s, h.e)) { autoOpt.blockedHits.push(h); continue; } // verdeckte eine „sichere“ Person: kein Treffer
          // nicht ersetzt (Version 2.8.1, Teil 1: gleich aus welchem Grund – „Nein“, Schalter, Klick oder die Einstellung
          // „Unsichere Treffer standardmäßig ersetzen“ aus): Treffer bleibt (Frage, Liste), gibt seine Wörter aber frei
          if (autoOff(autoOpt, h)) { h.released = true; hits.push(h); k += n - 1; continue; }
        }
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
          split: unitStarts[ui] + u.text.length, eol: u.eol || '\n', suffix, entity: ot.key, term: ot.text, comps: [], ...orgAutoFields(ot, settings) };
        if (autoOpt) {
          if (!ot.hyphen && autoOpt.blocked(h.s, h.e)) { autoOpt.blockedHits.push(h); continue; }
          if (autoOff(autoOpt, h)) { h.released = true; hits.push(h); break; }
        }
        hits.push(h);
        for (let j = k; j < A.length; j++) { covered[ui][j] = true; tokHit[ui][j] = h; }
        for (let j = 0; j < n - cut; j++) { covered[ui + 1][j] = true; tokHit[ui + 1][j] = h; }
        break;
      }
    });
  }
}
// Version 2.8.1 (Teil 1): Wird dieser Treffer einer gefundenen Einrichtung NICHT ersetzt? (dieselbe Regel wie unten in 8)
function autoOff(autoOpt, h) {
  const ov = autoOpt.overrides['o' + h.s + ':' + h.e];
  return ov === undefined ? !!h.defaultOff : ov === false;
}
// Version 2.8.0: Felder eines Treffers einer selbst gefundenen Einrichtung (bzw. einer Schreibweise, die zu einer von Hand
// markierten gehört: dann sicher, Gruppe = die markierte Einrichtung)
function orgAutoFields(ot, settings) {
  if (!ot.entity) return {};
  if (!ot.auto) return { entity: ot.entity, origin: 'org' };
  return { entity: ot.entity, cert: 'unsicher', origin: 'orgauto', auto: true, display: ot.display, defaultOff: !(settings && settings.unsureOn) };
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

// ---------- Namensspalten (Version 2.6.0) ----------
// Kopfwörter: Ein Kopf zählt nur, wenn ALLE seine Wörter Kopfwörter (oder Füllwörter) sind. Teile eines Wortes zählen
// nicht („Dateiname“, „Benutzername“, „Kursname“, „Firmenname“) und auch nicht Wortgruppen mit anderen Wörtern
// („Name der Schule“).
export const NAME_HEADERS_STRONG = ['name', 'namen', 'nachname', 'nachnamen', 'vorname', 'vornamen', 'familienname', 'rufname', 'rufnamen', 'geburtsname'];
export const NAME_HEADERS_WEAK = ['lehrkraft', 'lehrkrafte', 'lehrer', 'lehrerin', 'lehrerinnen', 'kursleitung', 'kursleiter', 'kursleiterin',
  'leitung', 'teilnehmer', 'teilnehmerin', 'teilnehmerinnen', 'teilnehmende', 'kind', 'kinder', 'schuler', 'schulerin', 'schulerinnen',
  'mitarbeiter', 'mitarbeiterin', 'mitarbeitende', 'ansprechpartner', 'ansprechpartnerin', 'person', 'personen', 'eltern',
  'erziehungsberechtigte', 'erziehungsberechtigter', 'trainer', 'trainerin', 'referent', 'referentin', 'dozent', 'dozentin',
  'betreuer', 'betreuerin', 'bearbeiter', 'bearbeiterin', 'verantwortlich', 'verantwortliche'];
const HEAD_STRONG = new Set(NAME_HEADERS_STRONG);
const HEAD_WEAK = new Set(NAME_HEADERS_WEAK);
const HEAD_FILL = new Set(['und', 'bzw', 'oder', 'sowie', 'in', 'innen', 'n']);
const ROLE_GIVEN = new Set(['vorname', 'vornamen', 'rufname', 'rufnamen']);
const ROLE_SUR = new Set(['nachname', 'nachnamen', 'familienname', 'geburtsname']);
// Übliche Spaltenköpfe (nur um eine Kopfzeile zu erkennen; sie machen keine Spalte zur Namensspalte)
const HEAD_GENERAL = new Set(['nr', 'nummer', 'lfd', 'anrede', 'titel', 'e-mail', 'email', 'mail', 'telefon', 'telefonnummer', 'tel', 'handy',
  'mobil', 'fax', 'kurs', 'kurse', 'termin', 'termine', 'datum', 'uhrzeit', 'zeit', 'beginn', 'start', 'ende', 'bemerkung', 'bemerkungen',
  'notiz', 'notizen', 'anmerkung', 'anmerkungen', 'kommentar', 'hinweis', 'adresse', 'anschrift', 'strasse', 'plz', 'ort', 'wohnort', 'raum',
  'fach', 'klasse', 'gruppe', 'beschreibung', 'thema', 'rolle', 'funktion', 'abteilung', 'status', 'betrag', 'preis', 'alter',
  'geburtsdatum', 'geboren', 'text', 'art', 'typ', 'kategorie', 'id', 'kennung', 'formel', 'kontakt', 'tag', 'wochentag', 'stunde']);
// Übliche Füllwerte in Namensspalten: nie ein Name
export const NAME_FILLERS = ['n.n.', 'nn', 'n. n.', 'offen', 'vakant', 'alle', 'siehe oben', 's. o.', 's.o.', 'dito', 'do.', 'frei', 'keine', 'keiner',
  'niemand', 'unbekannt', 'folgt', 'entfallt', 'tbd', 'tba', 'k. a.', 'k.a.', 'ka', 'x', '-', '–', '—', '?', '...', '…'];
const FILLER_SET = new Set(NAME_FILLERS);
function headWords(text) {
  return tokenize(text).filter((t) => t.word).map((t) => fold(t.t)).filter((w) => !HEAD_FILL.has(w));
}
// Kopf einer Spalte: {kind: 'stark'|'schwach'|null, role: 'Vorname'|'Nachname'|null}
function classifyHeader(text) {
  const ws = headWords(text);
  if (!ws.length || !ws.every((w) => HEAD_STRONG.has(w) || HEAD_WEAK.has(w))) return { kind: null, role: null };
  const kind = ws.some((w) => HEAD_STRONG.has(w)) ? 'stark' : 'schwach';
  const g = ws.some((w) => ROLE_GIVEN.has(w));
  const sur = ws.some((w) => ROLE_SUR.has(w) || w === 'name' || w === 'namen');
  return { kind, role: g && !sur ? 'Vorname' : sur && !g && ws.some((w) => ROLE_SUR.has(w)) ? 'Nachname' : null };
}
function isHeaderLike(text) {
  const ws = headWords(text);
  return ws.length > 0 && ws.some((w) => HEAD_STRONG.has(w) || HEAD_WEAK.has(w) || HEAD_GENERAL.has(w));
}
function hasNameHeader(text) { return classifyHeader(text).kind !== null; }
// Reine Namenszelle: 1–4 großgeschriebene Wörter oder Namenszusätze (Anrede/Titel davor erlaubt), keine Ziffern, kein
// Satz, kein Füllwert. Liefert die Gruppen (bei „Nachname, Vorname“ zwei) als Token-Indizes oder null.
function pureNameGroups(text, toks, exceptions) {
  const t = text.trim();
  if (!t || /\d/.test(t) || !/^[\p{L}\p{M}\s.,'’-]+$/u.test(t)) return null;
  if (FILLER_SET.has(fold(t).replace(/\s+/g, ' '))) return null;
  // Wiederholter Spaltenkopf (z. B. zweite Kopfzeile oder Zwischenüberschrift „Nachname“) ist kein Name
  const hw = headWords(t);
  if (hw.length && hw.every((w) => HEAD_STRONG.has(w) || HEAD_WEAK.has(w) || HEAD_GENERAL.has(w))) return null;
  const groups = [[]];
  let lead = true;
  let words = 0;
  let strongTitle = false;
  let titled = false;
  for (let k = 0; k < toks.length; k++) {
    const tk = toks[k];
    if (!tk.word) {
      if (tk.t === ',') { if (!groups[groups.length - 1].length) return null; groups.push([]); lead = false; continue; }
      if (tk.t === '.' || tk.t === '-' || tk.t === "'" || tk.t === '’') continue;
      return null;
    }
    const inf = info(tk, exceptions);
    if (inf.exception) return null;
    if (lead && inf.title && groups.length === 1 && !groups[0].length) { if (inf.strong) strongTitle = true; titled = true; continue; } // Anrede/Titel vor dem Namen
    lead = false;
    if (inf.particle && !tk.cap && !tk.allcaps) { groups[groups.length - 1].push(k); continue; }
    if (!tk.cap && !tk.allcaps) return null;
    if (inf.title || (inf.stop && !inf.particle)) return null;
    groups[groups.length - 1].push(k);
    words++;
  }
  if (groups.length > 2 || !words || words > 4) return null;
  for (const g of groups) {
    while (g.length && info(toks[g[g.length - 1]], exceptions).particle && !toks[g[g.length - 1]].cap) g.pop();
    if (!g.length || !g.some((k) => toks[k].cap || toks[k].allcaps)) return null;
  }
  groups.strongTitle = strongTitle;
  groups.titled = titled;
  return groups;
}
function cellComps(toks, idxs, exceptions) {
  return idxs.map((k) => {
    const tk = toks[k];
    const inf = info(tk, exceptions);
    if (inf.particle && !tk.cap && !tk.allcaps) return { type: 'P', s: tk.s, e: tk.e, key: fold(tk.t) };
    return { type: 'W', s: tk.s, e: tk.e, stemEnd: tk.e, suffix: '', key: fold(tk.t), F: inf.F, L: inf.L, A: inf.A, known: inf.known,
      shaped: inf.shaped, allcaps: tk.allcaps, tokIdx: k };
  });
}
// Version 2.10.0: Tabellen mit Kopfzeile (dieselbe Erkennung wie die Namensspalten-Regel aus 2.6.0, nur herausgelöst,
// damit die Spalten-Übersicht und die Behandlung je Spalte dieselben Kopfzeilen sehen)
export function findTables(units) {
  const tables = new Map(); // t -> Map(r -> Map(c -> {units:Set, c2}))
  units.forEach((u, ui) => {
    if (!u.tcells || !u.text.trim()) return;
    for (const tc of u.tcells) {
      if (!tables.has(tc.t)) tables.set(tc.t, new Map());
      const tb = tables.get(tc.t);
      if (!tb.has(tc.r)) tb.set(tc.r, new Map());
      const row = tb.get(tc.r);
      if (!row.has(tc.c)) row.set(tc.c, { units: new Set(), c2: tc.c2 === undefined ? tc.c : tc.c2 });
      row.get(tc.c).units.add(ui);
    }
  });
  const out = [];
  const textOf = (cell) => [...cell.units].map((ui) => units[ui].text).join(' ').trim();
  for (const [t, tb] of tables) {
    const rnums = [...tb.keys()].sort((a, b) => a - b);
    const filled = (r) => { const s = new Set(); for (const [c, cell] of tb.get(r)) for (let x = c; x <= cell.c2; x++) s.add(x); return s; };
    const allCols = new Set();
    let maxCols = 0;
    for (const r of rnums) { const f = filled(r); f.forEach((x) => allCols.add(x)); maxCols = Math.max(maxCols, f.size); }
    // Kopfzeile: die erste Zeile, in der mindestens die Hälfte der Spalten gefüllt ist (Titelzeilen darüber zählen nicht),
    // und nur, wenn sie wie eine Kopfzeile aussieht (mindestens ein üblicher Spaltenkopf). Eine direkt folgende Zeile mit
    // einem Namens-Kopfwort ist eine zweite Kopfzeile.
    const headRows = [];
    const ri = rnums.findIndex((r) => filled(r).size >= Math.max(1, Math.ceil(maxCols / 2)));
    if (ri >= 0 && [...tb.get(rnums[ri]).values()].some((cell) => isHeaderLike(textOf(cell)))) {
      headRows.push(rnums[ri]);
      const r1 = rnums[ri + 1];
      // Zweite Kopfzeile nur, wenn ALLE ihre Zellen Spaltenköpfe sind (eine Datenzeile wie „Anna | Müller | Leitung“ ist keine)
      if (r1 !== undefined && filled(r1).size >= Math.max(1, Math.ceil(maxCols / 2)) && [...tb.get(r1).values()].some((cell) => hasNameHeader(textOf(cell)))
        && [...tb.get(r1).values()].every((cell) => isHeaderLike(textOf(cell)))) headRows.push(r1);
    }
    const head = new Map(); // c -> {text, kind, role}
    const rank = { stark: 2, schwach: 1 };
    for (const r of headRows) {
      for (const [c, cell] of tb.get(r)) {
        const tx = textOf(cell);
        const cl = classifyHeader(tx);
        for (let x = c; x <= cell.c2; x++) {
          const old = head.get(x) || { text: '', kind: null, role: null };
          head.set(x, { text: old.text ? old.text + ' / ' + tx : tx, kind: (rank[cl.kind] || 0) > (rank[old.kind] || 0) ? cl.kind : old.kind, role: cl.role || old.role });
        }
      }
    }
    const headUnits = new Set(headRows.flatMap((r) => [...tb.get(r).values()].flatMap((cell) => [...cell.units])));
    const lastHead = headRows.length ? headRows[headRows.length - 1] : -1;
    out.push({ t, tb, rnums, head, headRows, headUnits, lastHead, allCols });
  }
  return out;
}
// skipUnits (Version 2.10.0): Abschnitte, die die Behandlung „Name“ schon ersetzt (Formelergebnisse gehören nicht dazu:
// für sie gilt die Regel wie bisher)
function nameColumnRule(units, unitToks, covered, tokHit, hits, mentions, exceptions, fullText, manual, skipUnits = new Set()) {
  const columns = [];
  const plan = new Map(); // ui -> {kind, roles:Set, rows:[{t,r}]}
  for (const { t, tb, rnums, head, headUnits, lastHead, allCols } of findTables(units)) {
    for (const c of [...allCols].sort((a, b) => a - b)) {
      const id = t + '|' + c;
      const hd = head.get(c) || { text: '', kind: null, role: null };
      const man = manual[id];
      const kind = man === true ? 'hand' : man === false ? null : hd.kind;
      columns.push({ id, t, c, header: hd.text, auto: hd.kind, role: hd.role, manual: man === true ? true : man === false ? false : undefined, kind, headerRow: lastHead });
      if (!kind) continue;
      for (const r of rnums) {
        if (r <= lastHead) continue;
        const cell = tb.get(r).get(c);
        if (!cell) continue;
        for (const ui of cell.units) {
          if (headUnits.has(ui) || skipUnits.has(ui)) continue;
          const p = plan.get(ui) || { kind: null, roles: new Set(), rows: [], col: id };
          if (kind === 'hand' || kind === 'stark' || !p.kind) { if (!p.kind || p.kind === 'schwach') { p.kind = kind; p.col = id; } }
          p.roles.add(hd.role || '');
          p.rows.push(t + '|' + r);
          plan.set(ui, p);
        }
      }
    }
  }
  // Treffer je Zelle
  const cellHits = new Map(); // ui -> Treffer
  for (const [ui, p] of plan) {
    const u = units[ui];
    const toks = unitToks[ui];
    if (toks.some((tk, k) => tk.word && covered[ui][k])) continue; // Kontaktdaten/Einrichtung haben Vorrang
    const groups = pureNameGroups(u.text, toks, exceptions);
    if (!groups) continue;
    const role = p.roles.size === 1 && [...p.roles][0] ? [...p.roles][0] : null;
    let comps;
    let mk;
    if (groups.length === 2) { // „Nachname, Vorname“ in einer Zelle
      const sur = cellComps(toks, groups[0], exceptions);
      const giv = cellComps(toks, groups[1], exceptions);
      const comma = toks.find((tk) => tk.t === ',' && tk.s >= sur[sur.length - 1].e);
      comps = [...sur, { type: 'SEP', s: comma.s, e: comma.e }, ...giv];
      mk = { full: true, given: giv.filter((x) => x.type === 'W').map((x) => x.key).join(' '), sur: sur.map((x) => x.key).join(' ') };
    } else {
      comps = cellComps(toks, groups[0], exceptions);
      mk = role ? { full: false, single: comps.map((x) => x.key).join(' ') } : mentionKey(comps, null);
    }
    const W = comps.filter((x) => x.type === 'W');
    const strong = p.kind === 'stark' || p.kind === 'hand';
    // Schwaches Kopfwort: sicher mit Namenslisten-Wort, mit zwei Namenswörtern oder mit Anrede/Titel in der Zelle („Dr. Haberkorn“)
    const cert = strong || W.length >= 2 || W.some((x) => x.known) || groups.strongTitle ? 'sicher' : 'unsicher';
    const s = comps[0].s;
    const e = comps[comps.length - 1].e;
    // Mit Anrede (in der Zelle, im Absatz davor derselben Zelle oder in der linken Nachbarzelle) gilt ein Einzelwort wie
    // bisher als Nachname (Rolle im Modus rückbaufähig)
    const titled = !!groups.titled || (ui > 0 && !!u.follows && isAnredeOnly(units[ui - 1].text))
      || (!!u.leftUnits && u.leftUnits.some((li) => li !== ui && isAnredeOnly(units[li].text)));
    const h = { s, e, type: 'person', cert, origin: 'auto', unit: ui, suffix: '', comps, mk, titled, defaultOff: false, column: p.col, columnKind: p.kind };
    if (role && groups.length === 1) h.role = role;
    hits.push(h);
    mentions.push(h);
    cellHits.set(ui, { h, p });
    toks.forEach((tk, k) => { if (tk.s < e && tk.e > s) { covered[ui][k] = true; tokHit[ui][k] = h; } });
  }
  // Vor- und Nachname in derselben Zeile = eine Person. Bei gleichem Zelltext in mehreren Zeilen (gemeinsamer Text in
  // Excel) nur, wenn der Partner in allen diesen Zeilen derselbe ist.
  const rowRoles = new Map(); // "t|r" -> {Vorname: [ui], Nachname: [ui]}
  for (const [ui, { h, p }] of cellHits) {
    if (!h.role) continue;
    for (const rk of p.rows) {
      if (!rowRoles.has(rk)) rowRoles.set(rk, { Vorname: [], Nachname: [] });
      rowRoles.get(rk)[h.role].push(ui);
    }
  }
  const partners = new Map(); // ui -> Set(Partner-ui | -1)
  for (const rr of rowRoles.values()) {
    const ok = rr.Vorname.length === 1 && rr.Nachname.length === 1;
    for (const ui of [...rr.Vorname, ...rr.Nachname]) {
      if (!partners.has(ui)) partners.set(ui, new Set());
      if (!ok) { partners.get(ui).add(-1); continue; }
      partners.get(ui).add(rr.Vorname[0] === ui ? rr.Nachname[0] : rr.Vorname[0]);
    }
  }
  for (const [ui, ps] of partners) {
    const h = cellHits.get(ui).h;
    if (h.role !== 'Vorname' || ps.size !== 1 || ps.has(-1)) continue;
    const pu = [...ps][0];
    const ps2 = partners.get(pu);
    if (!ps2 || ps2.size !== 1 || !ps2.has(ui)) continue;
    const ph = cellHits.get(pu).h;
    const mk = { full: true, given: h.mk.single, sur: ph.mk.single };
    h.mk = mk;
    ph.mk = { ...mk };
    h.rowPerson = true;
    ph.rowPerson = true;
  }
  return columns;
}

// ---------- Spalten behandeln (Version 2.10.0) ----------
// Bei Tabellen mit Kopfzeile (Excel, CSV) gilt je Spalte eine Behandlung:
//   'name'   – jede gefüllte Zelle ist eine Person (auch unbekannte, klein geschriebene, mehrteilige Namen); mehrere Namen
//              in einer Zelle (getrennt durch | ; / oder „und“) einzeln; Füllwerte (NAME_FILLERS) bleiben
//   'ganz'   – jede gefüllte Zelle wird als Ganzes durch einen Platzhalter ersetzt (Art: kind)
//   'bisher' – die Erkennung läuft im Zelltext wie in 2.9.0 (einschließlich der Namensspalten-Regel aus 2.6.0)
// Vorschlag anhand der Überschrift: ein Schlüsselwort steht als ganzes Wort irgendwo in der Überschrift.
export const COL_KEYWORDS = {
  name: ['Nachname', 'Vorname', 'Vornamen', 'Rufname', 'Familienname', 'Geburtsname', 'Name', 'Ansprechpartner', 'Wunschpartner',
    'Erziehungsberechtigte', 'Erziehungsberechtigter'],
  address: ['Strasse', 'Straße', 'Hausnummer', 'Hausnr', 'PLZ', 'Postleitzahl', 'Ort', 'Wohnort', 'Ortsteil', 'Stadt', 'Gemeinde', 'Anschrift', 'Adresse'],
  phone: ['Telefon', 'Handy', 'Mobil', 'Fax', 'Notfallnummer'],
  email: ['E-Mail', 'Mail'],
  date: ['Geburtsdatum', 'geboren', 'Geb.-Datum', 'Zuzugsdatum'],
  org: ['Schule', 'Grundschule', 'Übertritt von', 'Kita', 'Kindergarten', 'Arbeitgeber', 'Firma', 'Einrichtung'],
  info: ['Erläuterung', 'Bemerkung', 'Notiz', 'Notizen', 'Anmerkung', 'Hinweis', 'Kommentar', 'Sonstiges', 'Diagnose', 'Gesundheit', 'gesundheitlich',
    'Krankheit', 'Allergie', 'Medikament', 'Beeinträchtigung', 'Störung', 'Inklusion', 'Sorgerecht', 'Religion', 'Konfession', 'Staatsangehörigkeit',
    'Muttersprache', 'Sprache', 'Geburtsort', 'Geburtsland', 'Zuzug', 'Schulnummer', 'GKZ', 'Kennzahl', 'Wunsch'],
};
// Platzhalter-Art je Gruppe (Anschrift, Telefon, E-Mail wie die Kontakt-Arten; Datum und Angabe neu)
export const COL_KIND_LABEL = { address: '[ADRESSE]', phone: '[TELEFON]', email: '[E-MAIL]', date: '[DATUM]', org: 'Einrichtung', info: '[ANGABE]' };
// Vergleichsform: Groß-/Kleinschreibung, Akzente, Umlaute (auch ae/oe/ue) und ss/ß egal; alles außer Buchstaben und Ziffern
// trennt Wörter („1. Erziehungsberechtigte/r“ -> „1 erziehungsberechtigte r“, „Geb.-Datum“ -> „geb datum“)
function colNorm(s) {
  return fold(String(s || '').normalize('NFC')).replace(/ae/g, 'a').replace(/oe/g, 'o').replace(/ue/g, 'u')
    .replace(/[^a-z0-9]+/g, ' ').trim();
}
const COL_KW_NORM = Object.fromEntries(Object.entries(COL_KEYWORDS).map(([g, l]) => [g, [...new Set(l.map(colNorm))]]));
const hasWords = (hn, kw) => (' ' + hn + ' ').includes(' ' + kw + ' ');
const ERZ = new Set(['erziehungsberechtigte', 'erziehungsberechtigter']);
// Wörter, die neben „Erziehungsberechtigte“ kein Art-Wort sind (Nummer, Endung „/r“, „/in“)
const ERZ_FILL = new Set(['r', 'n', 'in', 'innen', 'der', 'die', 'des']);
const NAME_ROLE_WORDS = ['nachname', 'nachnamen', 'vorname', 'vornamen', 'rufname', 'rufnamen', 'familienname', 'geburtsname', 'name', 'namen'];
// Vorschlag für eine Überschrift: {treat, kind, groups, conflict}
export function proposeColumn(header) {
  const hn = colNorm(header);
  const groups = [];
  if (!hn) return { treat: 'bisher', kind: null, groups, conflict: false };
  for (const [g, kws] of Object.entries(COL_KW_NORM)) {
    const hit = kws.filter((kw) => hasWords(hn, kw));
    if (g === 'name') {
      // „Erziehungsberechtigte“ nur, wenn sonst kein Art-Wort folgt (nur Nummer und „/r“)
      const other = hn.split(' ').filter((w) => !ERZ.has(w) && !ERZ_FILL.has(w) && !/^\d+$/.test(w));
      const real = hit.filter((kw) => !ERZ.has(kw) || !other.length);
      if (real.length) groups.push(g);
    } else if (hit.length) groups.push(g);
  }
  // „Name“ zählt nicht in „Name der Schule/Einrichtung/Firma“: steht ein Einrichtungs-Wort da, gilt nur die Einrichtung
  if (groups.includes('name') && groups.includes('org')) {
    const nameKws = COL_KW_NORM.name.filter((kw) => hasWords(hn, kw));
    if (nameKws.every((kw) => kw === 'name')) groups.splice(groups.indexOf('name'), 1);
  }
  const ganz = groups.filter((g) => g !== 'name');
  if (!ganz.length) return groups.includes('name') ? { treat: 'name', kind: null, groups, conflict: false } : { treat: 'bisher', kind: null, groups, conflict: false };
  // Strengere Behandlung gewinnt: ganz ersetzen vor Name. Unter den Arten: „Angabe“ (Sammelart) vor allem; Anschrift,
  // Telefon, E-Mail, Datum vor Einrichtung; zwei verschiedene davon -> Angabe
  let kind;
  if (ganz.includes('info')) kind = 'info';
  else {
    const spec = ganz.filter((g) => g !== 'org');
    kind = spec.length === 1 ? spec[0] : spec.length > 1 ? 'info' : 'org';
  }
  return { treat: 'ganz', kind, groups, conflict: groups.length > 1 };
}
// Rolle aus der Überschrift (für Paare): Vorname, Nachname oder null; Vorspann = Text vor dem Namenswort
function colRole(header) {
  const ws = colNorm(header).split(' ').filter(Boolean);
  const g = ws.some((w) => ROLE_GIVEN.has(w));
  const sur = ws.some((w) => ROLE_SUR.has(w));
  const role = g && !sur ? 'Vorname' : sur && !g ? 'Nachname' : null;
  const i = ws.findIndex((w) => NAME_ROLE_WORDS.includes(w));
  return { role, prefix: i >= 0 ? ws.slice(0, i).join(' ') : null };
}
// Spalten aller Tabellen mit Kopfzeile, mit Vorschlag und gültiger Behandlung (overrides: Spalten-Kennung -> Behandlung;
// memory: Vergleichsform der Überschrift -> Behandlung aus der Merkliste)
// ---------- Version 2.11.0: Personen-Tabellen – im Zweifel ersetzen ----------
// Heikle Themen: Wortstamm irgendwo in der Überschrift, auch in zusammengesetzten Wörtern (Vergleichsform wie colNorm,
// ohne Trennzeichen). Abkürzungen mit Punkt („Rel.“) zählen als ganzes Wort.
export const SENSITIVE_STEMS = ['relig', 'konfess', 'glaub', 'zuzug', 'asyl', 'aufenth', 'herkunft', 'staats', 'national', 'sprach', 'gesund', 'krank',
  'diagn', 'allerg', 'medik', 'behind', 'beeintr', 'störung', 'lrs', 'legasth', 'dyskalk', 'inklus', 'förder', 'msd', 'therap', 'sorge', 'wohn',
  'pflege', 'einkommen', 'sozial', 'bemerk', 'erläut', 'notiz', 'anmerk', 'hinweis', 'komment', 'sonstig', 'wunsch',
  // ergänzt (2.11.0)
  'flucht', 'migra', 'jugendamt', 'vormund', 'psych', 'adhs', 'autis', 'nachteilsausgl', 'notenschutz',
  // ergänzt nach Guardian-Fund (2.11.0)
  'bekenntnis', 'geburtsland', 'ethni', 'familienstand', 'lebtbei'];
// Kürzel mit Punkt oder Bindestrich (vorne ein Wortanfang): „Rel.“, „Konf.“, „Rel-Unt“
export const SENSITIVE_ABBR = ['rel.', 'konf.', 'rel-'];
// Kurze Kürzel zählen nur als ganzer Spaltenkopf (sonst träfen sie Wortteile)
export const SENSITIVE_WHOLE = ['ru', 'daz'];
// Zu weit (im Test belegt, Rückfalllinie): „Fremdsprache“ und „Gewünschte …“ (gewählte Schulfächer) sind kein heikles Thema
const STEM_EXCEPT = { sprach: ['fremdsprach'], wunsch: ['gewunsch'] };
const STEMS_NORM = SENSITIVE_STEMS.map((x) => [x, colNorm(x).replace(/ /g, '')]);
export function sensitiveStem(header) {
  const flat = colNorm(header).replace(/ /g, '');
  const low = fold(String(header || '').normalize('NFC'));
  for (const a of SENSITIVE_ABBR) if (new RegExp('(^|[^a-z])' + a.replace(/[.-]/g, (m) => '\\' + m)).test(low)) return a;
  for (const w of SENSITIVE_WHOLE) if (colNorm(header) === w) return w;
  for (const [orig, st] of STEMS_NORM) {
    let i = flat.indexOf(st);
    while (i >= 0) {
      const ex = (STEM_EXCEPT[orig] || []).map((x) => colNorm(x).replace(/ /g, ''));
      if (!ex.some((x) => flat.slice(Math.max(0, i - (x.length - st.length)), i + st.length) === x)) return orig;
      i = flat.indexOf(st, i + 1);
    }
  }
  return null;
}
// Version 2.11.1: Spalte, die wegen eines heiklen Wortstamms im Spaltenkopf ganz als [ANGABE] ersetzt wird. Im Modus
// „rückbaufähig“ bekommt dort jede gefüllte Zelle eine eigene Nummer (gleiche Inhalte, verschiedene Nummern), damit die
// Häufigkeit nichts über den Inhalt verrät. Von Hand auf „Name“ oder „wie bisher“ gestellt: nicht betroffen.
export function isPerCellColumn(col) {
  return !!col && col.treat === 'ganz' && (col.kind || 'info') === 'info' && !!sensitiveStem(col.header);
}
// Namenswörter für die Behandlung „Name“ in einer Personen-Tabelle
const NAME_HEAD_WORDS = new Set(['nachname', 'nachnamen', 'vorname', 'vornamen', 'rufname', 'rufnamen', 'familienname', 'geburtsname', 'name', 'namen']);
const DATE_TEXT = /^(\d{1,2}\.\d{1,2}\.(\d{2}|\d{4})|\d{4}-\d{2}-\d{2})$/;
export const RARE_LIMIT = 3; // seltener Wert: weniger als 3-mal
export const RARE_MIN_ROWS = 20; // Regel „seltene Werte“ erst ab 20 Zeilen
// Auswahl-Spalte: höchstens 12 verschiedene Werte, jeder höchstens 40 Zeichen, verschiedene Werte höchstens ein Drittel
function isChoiceColumn(counts, filled) {
  if (!filled) return true;
  return counts.size <= 12 && [...counts.keys()].every((v) => [...v].length <= 40) && counts.size <= filled / 3;
}
// Spalten aller Tabellen mit Kopfzeile, mit Vorschlag und gültiger Behandlung (overrides: Spalten-Kennung -> Behandlung;
// memory: Vergleichsform der Überschrift -> Behandlung aus der Merkliste). opts.valueCells: Zellen ohne Abschnitt (Excel:
// Zahl, Datum) [{t, r, c, value, date}]; opts.rare: Regel „seltene Werte“ an (Standard an)
export function columnPlan(units, overrides = {}, memory = {}, opts = {}) {
  const out = [];
  const rareOn = opts.rare !== false;
  const vcells = opts.valueCells || [];
  for (const { t, tb, rnums, head, headUnits, lastHead, allCols } of findTables(units)) {
    // nur Excel und CSV (Tabellen in Word und PDF: wie bisher)
    if (lastHead < 0 || !(t === 'csv' || t.startsWith('x|'))) continue;
    const myVals = vcells.filter((x) => x.t === t && x.r > lastHead);
    const cols = [];
    const dataRows = new Set();
    for (const c of [...new Set([...allCols, ...myVals.map((x) => x.c)])].sort((a, b) => a - b)) {
      const hd = head.get(c);
      if (!hd || !hd.text.trim()) continue;
      const id = t + '|' + c;
      const prop = proposeColumn(hd.text);
      const mem = memory[colNorm(hd.text)];
      const ov = overrides[id];
      const chosen = ov === 'name' || ov === 'ganz' || ov === 'bisher' ? ov : mem === 'name' || mem === 'ganz' || mem === 'bisher' ? mem : null;
      // Werte der Zellen unterhalb der Kopfzeile (Text; Zahl- und Datumszellen mit gespeichertem Wert)
      const vals = new Map(); // Zeile -> {key, text, date}
      for (const r of rnums) {
        if (r <= lastHead) continue;
        const cell = tb.get(r).get(c);
        if (!cell) continue;
        const ui = [...cell.units].find((x) => !headUnits.has(x));
        if (ui === undefined) continue;
        const u = units[ui];
        const text = u.text.trim();
        if (!text) continue;
        vals.set(r, { key: u.cellOrig ? '#' + u.cellOrig.v : text, text, date: u.cellOrig ? !!u.cellDate : DATE_TEXT.test(text) });
      }
      for (const x of myVals) if (x.c === c && String(x.value).trim() !== '') vals.set(x.r, { key: '#' + x.value, text: String(x.display || x.value), date: !!x.date });
      for (const r of vals.keys()) dataRows.add(r);
      const { role, prefix } = colRole(hd.text);
      // Zeilen unterhalb der Kopfzeile mit Inhalt (nur Zellen mit Text)
      const rows = rnums.filter((r) => r > lastHead && tb.get(r).has(c));
      cols.push({ id, t, c, header: hd.text, headerRow: lastHead, prop, chosen, fromMemory: ov === undefined && mem !== undefined, role, prefix, rows, vals });
    }
    // Personen-Tabelle: mindestens eine Spalte mit der Behandlung „Name“ (Vorschlag wie 2.10.0 oder eigene Wahl)
    const person = cols.some((x) => (x.chosen || x.prop.treat) === 'name');
    const smallTable = dataRows.size < RARE_MIN_ROWS;
    for (const x of cols) {
      let proposal = x.prop;
      if (person) proposal = personProposal(x);
      const treat = x.chosen || proposal.treat;
      const kind = treat === 'ganz' ? (proposal.kind || x.prop.kind || 'info') : null;
      // Werte mit Häufigkeit (häufigste zuerst)
      const counts = new Map();
      const texts = new Map();
      for (const v of x.vals.values()) { counts.set(v.key, (counts.get(v.key) || 0) + 1); if (!texts.has(v.key)) texts.set(v.key, v.text); }
      const values = [...counts].sort((a, b) => b[1] - a[1] || (texts.get(a[0]) < texts.get(b[0]) ? -1 : 1)).map(([k, n]) => [texts.get(k), n]);
      // seltene Werte (nur lesbare Spalten einer Personen-Tabelle ab 20 Zeilen)
      let rareRows = null;
      let rareValues = 0;
      if (person && treat === 'bisher' && rareOn && !smallTable) {
        rareRows = new Set([...x.vals].filter(([, v]) => counts.get(v.key) < RARE_LIMIT).map(([r]) => r));
        rareValues = [...counts.values()].filter((n) => n < RARE_LIMIT).length;
      }
      out.push({ id: x.id, t, c: x.c, header: x.header, headerRow: x.headerRow, proposal, treat, kind, role: x.role, prefix: x.prefix, rows: x.rows,
        fromMemory: x.fromMemory, person, smallTable, values, filled: x.vals.size, rareRows, rareValues,
        // Version 2.11.0: „Name“ nach 2.10.0, jetzt „ganz ersetzen“ (z. B. Wunschpartner): Namen darin gelten weiter anderswo
        seedName: person && treat === 'ganz' && x.prop.treat === 'name' });
    }
  }
  return out;
}
// Abschnitte, die nur in Kopfzeilen von Tabellen (Excel, CSV) stehen. Ein gemeinsamer Text (Excel), der auch in einer
// Datenzelle steht, gehört nicht dazu (sonst bliebe die Datenzelle stehen).
export function headerOnlyUnits(units) {
  const out = new Set();
  for (const { t, headRows, headUnits } of findTables(units)) {
    if (!headRows.length || !(t === 'csv' || t.startsWith('x|'))) continue;
    // Schutz je Zelle (Entscheidung Easy zu 2.11.0): nur eine Zelle, die ausschließlich aus üblichen Spaltenkopf-Wörtern
    // (und Füllwörtern) besteht, bleibt stehen. Jede andere Zelle der Kopfzeile wird geprüft wie in 2.10.0.
    for (const ui of headUnits) {
      if (!(units[ui].tcells || []).every((tc) => tc.t === t && headRows.includes(tc.r))) continue;
      if (isPureHeaderCell(units[ui].text)) out.add(ui);
    }
  }
  return out;
}
// Übliche Köpfe aus Schul-Stammdaten (nur ganze Wörter; nur für den Schutz der Kopfzeile, nicht für die Erkennung einer
// Kopfzeile oder einer Namensspalte)
export const HEAD_SCHOOL_WORDS = ['schule', 'grundschule', 'schulart', 'schulform', 'schulnummer', 'schuljahr', 'schulweg', 'einrichtung',
  'kita', 'kindergarten', 'hort', 'einschulung', 'eintritt', 'austritt', 'übertritt', 'übertrittszeugnis', 'übertrittszeugnisses', 'zeugnis',
  'ergebnis', 'jahrgang', 'jahrgangsstufe', 'jgst', 'zweig', 'ausbildungsrichtung', 'ganztag', 'geschlecht', 'geburtsort', 'geburtsland',
  'geburtsurkunde', 'muttersprache', 'staatsangehörigkeit', 'religion', 'konfession', 'religionsunterricht', 'ethik', 'fremdsprache',
  'sprache', 'erste', 'zweite', 'dritte', 'gewünscht', 'gewünschte', 'gewünschter', 'hausnummer', 'gkz', 'notfall', 'notfälle',
  'notfallnummer', 'sorgerecht', 'sorgeberechtigt', 'sorgeberechtigte', 'erziehungsberechtigt', 'elternteil', 'mutter', 'vater',
  'auskunftsberechtigt', 'akad', 'akademischer', 'wohnt', 'schwimmen', 'schwimmabzeichen', 'zuzug', 'zuzugsart', 'bisherige',
  'bisheriger', 'gesundheitliche', 'beeinträchtigung', 'erläuterung', 'msd', 'lrs', 'rechtschreibstörung', 'lese', 'inklusionsbedarf',
  'förderbedarf', 'kontaktdaten', 'wunschpartner', 'unt', 'rel', 'konf', 'laut', 'mobilnummer', 'festnetz', 'pflegschaft',
  // Fragen als Überschrift aus einem Schul-Export (Testdatei stammdaten): „Besteht Kontakt zum MSD“, „Wurde in der
  // Grundschule Nachteilsausgleich oder Notenschutz wegen LRS gewährt?“
  'besteht', 'wurde', 'nachteilsausgleich', 'notenschutz', 'wegen', 'gewährt'];
// Füllwörter in Spaltenköpfen
const HEAD_PROTECT_FILL = ['der', 'die', 'das', 'des', 'dem', 'den', 'zu', 'zum', 'zur', 'mit', 'von', 'vom', 'für', 'am', 'im', 'an', 'auf',
  'ab', 'bis', 'pro', 'je', 'nach', 'bei', 'r', 'e', 's'];
const HEAD_PROTECT = new Set([...NAME_HEADERS_STRONG, ...NAME_HEADERS_WEAK, ...HEAD_GENERAL, ...HEAD_FILL,
  ...HEAD_SCHOOL_WORDS.map(fold), ...HEAD_PROTECT_FILL.map(fold)]);
// Zelle nur aus Spaltenkopf-Wörtern: jedes Wort steht in HEAD_PROTECT; Zahlen höchstens zweistellig („1. Ort“); sonst nur
// Satzzeichen
export function isPureHeaderCell(text) {
  let words = 0;
  for (const tk of tokenize(text)) {
    if (tk.word) { if (!HEAD_PROTECT.has(fold(tk.t))) return false; words++; continue; }
    if (/\d/.test(tk.t) && !/^\d{1,2}$/.test(tk.t)) return false;
  }
  return words > 0;
}
// Vorschlag in einer Personen-Tabelle (Reihenfolge laut Auftrag 2.11.0)
function personProposal(x) {
  const p = x.prop;
  const words = colNorm(x.header).split(' ');
  // 1. bekannte Gruppen; „Name“ nur mit Namenswort in der Überschrift, sonst (Wunschpartner, Ansprechpartner …) ganz ersetzen
  if (p.treat === 'name') return words.some((w) => NAME_HEAD_WORDS.has(w)) ? p : { ...p, treat: 'ganz', kind: 'info', why: 'Name ohne Namenswort' };
  // 2. heikle Themen (auch neben einer bekannten Gruppe „Einrichtung“: dann ist es eine Angabe, z. B. „Wurde in der
  // Grundschule … wegen LRS gewährt?“; wie in 2.10.0 gewinnt die Angabe)
  const st = sensitiveStem(x.header);
  if (p.treat === 'ganz') return st && p.kind === 'org' ? { ...p, kind: 'info', conflict: true, groups: [...p.groups, 'heikel'], why: 'heikel: ' + st + ' (vor Einrichtung)' } : p;
  if (st) return { treat: 'ganz', kind: 'info', groups: ['heikel'], conflict: false, why: 'heikel: ' + st };
  // 3. überwiegend Datumswerte
  const vs = [...x.vals.values()];
  if (vs.length && vs.filter((v) => v.date).length > vs.length / 2) return { treat: 'ganz', kind: 'date', groups: ['datum'], conflict: false, why: 'Datumswerte' };
  // 4. nach dem Inhalt: Auswahl-Spalte bleibt lesbar, sonst ganz ersetzen
  const counts = new Map();
  for (const v of vs) counts.set(v.key, (counts.get(v.key) || 0) + 1);
  if (isChoiceColumn(counts, vs.length)) return { treat: 'bisher', kind: null, groups: ['auswahl'], conflict: false, why: 'Auswahl' };
  return { treat: 'ganz', kind: 'info', groups: ['inhalt'], conflict: false, why: 'Freitext oder viele Werte' };
}
export function columnKeyOf(header) { return colNorm(header); }

// Behandlung „Name“: Teile einer Zelle (getrennt durch | ; / „und“), je Teil Folgen von Wörtern, die noch frei sind
// commaList (Guardian-Lauf 2, Fund 1): in Spalten ohne Namenswort in der Überschrift (z. B. „Wunschpartner“) trennt auch
// ein Komma Namen („Hauke, Ole“ = zwei Personen, wie die Erkennung bis 2.9.0)
function nameCellSegments(toks, covered, commaList = false) {
  const parts = [[]];
  toks.forEach((tk, k) => {
    if (!tk.word ? (commaList ? /^[|;/,]$/ : /^[|;/]$/).test(tk.t) : fold(tk.t) === 'und') { parts.push([]); return; }
    parts[parts.length - 1].push(k);
  });
  const segs = [];
  for (const p of parts) {
    let cur = [];
    const flush = () => {
      // Füllwert („N.N.“, „k. A.“, „–“) mit seinen Satzzeichen prüfen, bevor sie am Rand abgeschnitten werden
      const full = cur.length ? [toks[cur[0]].s, toks[cur[cur.length - 1]].e] : null;
      while (cur.length && !toks[cur[0]].word && !/^\p{N}/u.test(toks[cur[0]].t)) cur.shift();
      while (cur.length && !toks[cur[cur.length - 1]].word && !/^\p{N}/u.test(toks[cur[cur.length - 1]].t)) cur.pop();
      if (cur.length) { cur.full = full; segs.push(cur); } else if (full) segs.push(Object.assign([], { full, empty: true }));
      cur = [];
    };
    for (const k of p) { if (covered[k]) flush(); else cur.push(k); }
    flush();
  }
  return segs;
}
// Treffer für die Spalten mit Behandlung „Name“ (vor allen übrigen Regeln, wie die Namensspalten). Liefert die Abschnitte
// mit Behandlung „ganz ersetzen“ (deren Treffer entstehen am Ende, siehe columnWholeHits).
function columnTreatRule(units, unitToks, unitStarts, covered, tokHit, hits, mentions, exceptions, plan, nameUnits = new Set()) {
  const byUnit = new Map(); // ui -> {treat, kind, col, cells}
  const tabs = new Map(findTables(units).map((x) => [x.t, x]));
  for (const col of plan) {
    // Version 2.11.0: in lesbaren Spalten nur die Zellen mit seltenen Werten (ganz ersetzen als [ANGABE])
    if (col.treat === 'bisher' && !(col.rareRows && col.rareRows.size)) continue;
    const tb = tabs.get(col.t);
    if (!tb) continue;
    const rare = col.treat === 'bisher';
    for (const r of rare ? col.rows.filter((x) => col.rareRows.has(x)) : col.rows) {
      const cell = tb.tb.get(r) && tb.tb.get(r).get(col.c);
      if (!cell) continue;
      for (const ui of cell.units) {
        if (tb.headUnits.has(ui) || units[ui].formula) continue; // Formeln: nicht raten (Punkt auf „Speichern“)
        const old = byUnit.get(ui);
        const treat = rare ? 'ganz' : units[ui].cellOrig && col.treat === 'name' ? 'ganz' : col.treat; // Zahl/Datum in einer Namensspalte
        const kind = rare ? 'info' : treat === 'ganz' ? (units[ui].cellOrig && (col.kind === 'org' || col.treat === 'name') ? 'info' : col.kind) : null;
        if (old && (old.treat === 'ganz' || treat !== 'ganz')) { old.cells.push({ r, col }); continue; }
        byUnit.set(ui, { treat, kind, col, cells: [...(old ? old.cells : []), { r, col }] });
      }
    }
  }
  const ganz = new Map();
  const named = [];
  for (const [ui, p] of byUnit) {
    if (p.treat === 'ganz') {
      ganz.set(ui, p);
      // Version 2.11.0: Spalte war bis 2.10.0 „Name“ (z. B. Wunschpartner): Namen darin werden wie bisher erkannt und gelten
      // anderswo (nie schwächer); die Zelle selbst wird ganz ersetzt (die Treffer darin fallen in columnWholeHits weg)
      if (!p.col.seedName || units[ui].cellOrig) continue;
    } else nameUnits.add(ui);
    const toks = unitToks[ui];
    // „Nachname, Vorname“ nur in Spalten mit Namenswort in der Überschrift (Name, Nachname, Vorname …); sonst ist das Komma
    // eine Aufzählung
    const commaForm = p.col.prefix !== null;
    const segs = nameCellSegments(toks, covered[ui], !commaForm);
    const made = [];
    const isFill = (a, b) => FILLER_SET.has(fold(units[ui].text.slice(a - unitStarts[ui], b - unitStarts[ui])).replace(/\s+/g, ' ').trim());
    for (const seg of segs) {
      if (seg.empty) continue; // nur Satzzeichen („–“, „?“): bleibt
      const s = toks[seg[0]].s;
      const e = toks[seg[seg.length - 1]].e;
      if (isFill(s, e) || isFill(seg.full[0], seg.full[1])) continue;
      let wordIdx = seg.filter((k) => toks[k].word);
      if (!wordIdx.length) { made.push({ info: true, s, e }); continue; }
      // Anrede und Titel vorn („Frau“, „Herr Dr.“) bleiben stehen wie bei der Namensspalten-Regel (sie sind kein Name)
      while (wordIdx.length > 1 && info(toks[wordIdx[0]], exceptions).title) wordIdx = wordIdx.slice(1);
      const comps = wordIdx.map((k, i) => {
        const tk = toks[k];
        const inf = info(tk, exceptions);
        if (inf.particle && !tk.cap && !tk.allcaps && i < wordIdx.length - 1) return { type: 'P', s: tk.s, e: tk.e, key: fold(tk.t) };
        return { type: 'W', s: tk.s, e: tk.e, stemEnd: tk.e, suffix: '', key: fold(tk.t), F: inf.F, L: inf.L, A: inf.A, known: inf.known, shaped: inf.shaped, allcaps: tk.allcaps, tokIdx: k };
      });
      if (!comps.some((x) => x.type === 'W')) comps[comps.length - 1].type = 'W';
      // „Nachname, Vorname“ (genau ein Komma zwischen zwei Wortgruppen) wie bei der Namensspalten-Regel: Nachname vorn
      const commas = seg.filter((k) => toks[k].t === ',' && toks[k].s > comps[0].s && toks[k].e < comps[comps.length - 1].e);
      if (commaForm && commas.length === 1) {
        const c = toks[commas[0]];
        const sur = comps.filter((x) => x.e <= c.s);
        const giv = comps.filter((x) => x.s >= c.e);
        if (sur.some((x) => x.type === 'W') && giv.some((x) => x.type === 'W')) {
          made.push({ s, e, comps: [...sur, { type: 'SEP', s: c.s, e: c.e }, ...giv], seg,
            mk: { full: true, given: giv.filter((x) => x.type === 'W').map((x) => x.key).join(' '), sur: sur.map((x) => x.key).join(' ') } });
          continue;
        }
      }
      made.push({ s, e, comps, seg });
    }
    const role = made.length === 1 && p.cells.length === 1 && !made[0].mk ? p.col.role : null;
    for (const m of made) {
      if (m.info) {
        hits.push({ s: m.s, e: m.e, type: 'info', cert: 'sicher', origin: 'auto', unit: ui, colHit: true, column: p.col.id });
      } else {
        const W = m.comps.filter((x) => x.type === 'W');
        const mk = m.mk ? m.mk : role ? { full: false, single: m.comps.map((x) => x.key).join(' ') } : W.length === 1 && m.comps.length === 1 ? { full: false, single: W[0].key } : mentionKey(m.comps, null);
        const h = { s: m.comps[0].s, e: m.comps[m.comps.length - 1].e, type: 'person', cert: 'sicher', origin: 'auto', unit: ui, suffix: '', comps: m.comps, mk,
          titled: false, defaultOff: false, column: p.col.id, columnKind: 'spalte', colName: true };
        if (role) h.role = role;
        hits.push(h);
        mentions.push(h);
        if (role) named.push({ ui, h, p });
      }
      const a = m.s;
      const b = m.e;
      toks.forEach((tk, k) => { if (tk.s < b && tk.e > a) { covered[ui][k] = true; if (!tokHit[ui][k]) tokHit[ui][k] = hits[hits.length - 1]; } });
    }
  }
  // Paare: Vor- und Nachname(n) mit demselben Überschriften-Vorspann in derselben Zeile sind EINE Person
  const groups = new Map();
  for (const x of named) {
    if (x.p.col.prefix === null) continue;
    const k = x.p.col.t + '|' + x.p.cells[0].r + '|' + x.p.col.prefix;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(x);
  }
  for (const g of groups.values()) {
    const sur = g.filter((x) => x.h.role === 'Nachname');
    const giv = g.filter((x) => x.h.role === 'Vorname').sort((a, b) => a.p.col.c - b.p.col.c);
    if (sur.length !== 1 || !giv.length) continue;
    const mk = { full: true, given: giv[0].h.mk.single, sur: sur[0].h.mk.single };
    for (const x of [...sur, ...giv]) { x.h.mk = { ...mk }; x.h.rowPerson = true; }
  }
  return ganz;
}
// Behandlung „ganz ersetzen“: alle übrigen Treffer in diesen Zellen entfallen (sie haben ihre Namen schon auf andere
// Stellen übertragen), die ganze Zelle wird EIN Treffer der Art. Rückbaufähig: Zelle mit mehreren Textläufen (Excel,
// gemischte Formatierung) je Lauf ein Treffer, damit der Rückbau jeden Lauf exakt zurückschreibt.
function columnWholeHits(units, unitStarts, hits, ganz, reversible) {
  if (!ganz.size) return;
  for (let i = hits.length - 1; i >= 0; i--) {
    const h = hits[i];
    if (ganz.has(h.unit) || (h.unit2 !== undefined && ganz.has(h.unit2))) hits.splice(i, 1);
  }
  for (const [ui, p] of ganz) {
    const u = units[ui];
    const base = unitStarts[ui];
    const lead = u.text.length - u.text.trimStart().length;
    const end = u.text.trimEnd().length;
    if (end <= lead) continue;
    let pieces = [[lead, end]];
    if (reversible && u.segBounds && u.segBounds.length) {
      const cuts = [lead, ...u.segBounds.filter((x) => x > lead && x < end), end];
      pieces = [];
      for (let k = 0; k + 1 < cuts.length; k++) {
        let a = cuts[k];
        let b = cuts[k + 1];
        while (a < b && /\s/.test(u.text[a])) a++;
        while (b > a && /\s/.test(u.text[b - 1])) b--;
        if (b > a) pieces.push([a, b]);
      }
    }
    for (const [a, b] of pieces) {
      const h = { s: base + a, e: base + b, type: p.kind === 'org' ? 'org' : p.kind, cert: 'sicher', origin: 'auto', unit: ui, colHit: true, column: p.col.id, suffix: '' };
      // Version 2.11.1: heikle Spalte – im Modus „rückbaufähig“ eigene Nummer je Zelle (siehe assignReversible)
      if (p.kind === 'info' && p.treat === 'ganz' && isPerCellColumn(p.col)) h.perCell = true;
      if (u.cellOrig && pieces.length === 1) h.cellOrig = u.cellOrig;
      if (p.kind === 'org') {
        const value = u.text.slice(a, b);
        h.entity = 'C|' + fold(value).replace(/\s+/g, ' ');
        h.origEntity = h.entity;
        h.term = value;
        h.colOrg = true;
      }
      hits.push(h);
    }
  }
}
