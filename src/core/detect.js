// Namenserkennung (regelbasiert, deterministisch).
// Eingabe: Liste von Texteinheiten (Absätze, Zellen …) und ein Zustand mit Einstellungen,
// manuell markierten Namen, Ausnahmen, Umschaltungen und Zusammenführungen.
// Ausgabe: Treffer (hits) und Personen (entities) mit Pseudonymen.
import { fold, umlautVariant } from './fold.js';
import * as lex from './lexicon.js';
import { findContacts } from './patterns.js';

const TOKEN_RE = /[\p{L}\p{M}]+(?:['’][\p{L}\p{M}]+)*(?:-[\p{L}\p{M}]+(?:['’][\p{L}\p{M}]+)*)*|\p{N}+|\S/gu;
// Arabische Namenspräfixe mit Bindestrich: al-Hassan, el-Masri, Abd-ar-…
const HYPHEN_PREFIX = new Set(['al', 'el', 'ul', 'ad', 'ar', 'as', 'ash', 'at', 'az', 'abd', 'abu', 'ben', 'bin', 'ibn']);
const ACADEMIC = new Set(['med', 'dent', 'vet', 'rer', 'nat', 'phil', 'jur', 'oec', 'pol', 'hc', 'ing', 'habil']);

export const CONTACT_LABELS = { email: '[E-MAIL]', phone: '[TELEFON]', iban: '[IBAN]', address: '[ADRESSE]' };

export function defaultState() {
  return {
    settings: { mode: 'person', email: true, phone: true, iban: true, address: true, unsureOn: true },
    manualTerms: [], // vom Nutzer markierte Namen (Reihenfolge = Reihenfolge der Markierung)
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

  // 2) Automatische Namenserkennung
  const mentions = [];
  units.forEach((u, ui) => {
    const base = unitStarts[ui];
    const toks = unitToks[ui];
    const cov = covered[ui];
    const prevText = ui > 0 ? units[ui - 1].text : '';
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
      if (cert) {
        const s = comps[0].s;
        const lastWc = [...comps].reverse().find((c) => c.type === 'W');
        const e = lastWc.e;
        const isNoun = W.length === 1 && W[0].A && !ctx.strong && !ctx.weak && nounContext(toks, W[0].tokIdx);
        const mk = mentionKey(comps.filter((c) => c.type !== 'SEP'), swapped);
        const h = { s, e, type: 'person', cert, origin: 'auto', unit: ui, suffix: lastWc.suffix || '', comps, mk,
          defaultOff: cert === 'unsicher' && (isNoun || !st.settings.unsureOn) };
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
  const manualParts = new Set(hits.filter((h) => h.origin === 'manual').flatMap((h) => (h.comps || []).map((c) => c.key)));
  const partKeys = new Set([...partToEntities.keys()].filter((k) => partToEntities.get(k).size === 1));
  units.forEach((u, ui) => {
    const toks = unitToks[ui];
    toks.forEach((tk, k) => {
      if (!tk.word || covered[ui][k]) return;
      const stm = lex.stemFor(tk.t, partKeys);
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

  // 7) Personen und Pseudonyme (Reihenfolge des ersten Auftretens)
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
  let n = 0;
  for (const en of entities.values()) {
    en.letter = letterFor(n++);
    en.label = st.settings.mode === 'name' ? '[NAME]' : 'Person ' + en.letter;
    en.display = [...en.forms.entries()].sort((a, b) => b[1] - a[1] || b[0].length - a[0].length || (a[0] < b[0] ? -1 : 1))[0][0];
  }

  // 8) An/Aus pro Treffer
  hits.forEach((h, idx) => {
    h.id = idx;
    h.key = h.s + ':' + h.e;
    const ov = st.overrides[h.key];
    h.on = ov === undefined ? !h.defaultOff : ov;
    h.label = h.type === 'person' ? entities.get(h.entity).label : CONTACT_LABELS[h.type];
  });
  for (const en of entities.values()) en.count = en.hits.length;

  return { fullText, unitStarts, hits, entities };
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

// Ersetzungen je Einheit: [{s, e, text}] relativ zur Einheit
export function replacementsByUnit(result, units) {
  const per = units.map(() => []);
  for (const h of result.hits) {
    if (!h.on) continue;
    const base = result.unitStarts[h.unit];
    const text = h.label + (h.type === 'person' ? (h.suffix || '') : '');
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

// Sucht verbliebene Klarnamen in Texten. texts: [{where, text}]
export function findLeaks(forms, texts) {
  const leaks = [];
  for (const { where, text } of texts) {
    for (const tk of tokenize(text)) {
      if (!tk.word) continue;
      const cands = [tk.t, ...tk.t.split('-')];
      for (const c of cands) {
        let k = fold(c);
        let f = forms.get(k);
        if (!f) { const m = c.match(/^(.+?)(['’]s|s)$/u); if (m) { k = fold(m[1]); f = forms.get(k); } }
        if (!f) continue;
        if (f.ambiguous && !isCap(c)) continue;
        leaks.push({ where, word: tk.t, entity: f.entity, context: text.slice(Math.max(0, tk.s - 30), Math.min(text.length, tk.e + 30)) });
        break;
      }
    }
  }
  return leaks;
}

// Ersetzer für Texte außerhalb der Prüfansicht (Metadaten, Feldfunktionen, Alternativtexte, Verweise):
// ersetzt alle Formen bestätigter Personen sowie Kontaktdaten (gemäß Einstellungen).
export function makeGenericReplacer(result, settings) {
  const forms = new Map();
  for (const en of result.entities.values()) {
    if (!en.hits.some((h) => h.on)) continue;
    for (const [k, f] of leakForms({ ...result, entities: new Map([[en.key, en]]) })) if (!forms.has(k)) forms.set(k, { ...f, label: en.label });
  }
  return (str) => {
    if (!str || !/\p{L}|\d/u.test(str)) return str;
    const reps = [];
    for (const c of findContacts(str, settings)) if (c.cert === 'sicher') reps.push({ s: c.s, e: c.e, text: CONTACT_LABELS[c.type] });
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
