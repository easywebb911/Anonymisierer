// Version 2.8.0 (PR B): Einrichtungen selbst finden. Liefert Bezeichnungen (wie sie im Dokument stehen), die danach
// genau wie von Hand markierte Einrichtungen im ganzen Dokument gesucht werden (detect.js, matchOrgTerms), aber
// „unsicher, an“ sind (ersetzt und gefragt). Schwache Funde (Regel b ohne Merkmal) gehen nur in den Warnpunkt.
// Regeln (Auftrag Easy):
// a) Kopfwort + 1–3 großgeschriebene Wörter (auch mit „am / an der / in / bei / im“ dazwischen); Name-Bindestrich-Kopfwort;
//    Name vor Rechtsform. Ausschluss-Liste: Wort nach dem Kopfwort, das dort üblich und kein Name ist.
// b) 2–6 Wörter in Anführungszeichen: stark mit Merkmal 1–4, sonst schwach; Titel-Wort davor ohne Merkmal 1–3: nichts.
// c) Schreibweisen derselben Einrichtung = eine Gruppe (gleiches Kopfwort und Namens-Wörter enthalten; Form 1/2;
//    mit/ohne Rechtsform).
import { tokenize } from './detect.js';
import { fold } from './fold.js';
import * as lex from './lexicon.js';
import { findContacts } from './patterns.js';

// Kopfwörter (wie hints.js) und Zusammensetzungen, die auf ein Kopfwort enden („Förderverein“, „Musikschule“)
const HEADS = [
  ['schule', /^(?:\p{L}*schul(?:e|en))$/iu], ['gymnasium', /^\p{L}*gymnasi(?:um|ums|en)$/iu], ['universitat', /^universität(?:en)?$/iu],
  ['kita', /^\p{L}*kitas?$/iu], ['kindergarten', /^\p{L}*kinderg(?:arten|artens|ärten)$/iu], ['krippe', /^\p{L}*krippen?$/iu],
  ['hort', /^hort(?:s|es|e|en)?$/iu], ['kinderhaus', /^kinderh(?:aus|auses|äuser|äusern)$/iu],
  ['familienzentrum', /^familienzentr(?:um|ums|en)$/iu], ['jugendzentrum', /^jugendzentr(?:um|ums|en)$/iu],
  ['verein', /^\p{L}*verein(?:s|es|e|en)?$/iu], ['stiftung', /^\p{L}*stiftung(?:en)?$/iu], ['praxis', /^\p{L}*prax(?:is|en)$/iu],
  ['klinik', /^\p{L}*klinik(?:en)?$/iu], ['krankenhaus', /^krankenh(?:aus|auses|äuser|äusern)$/iu], ['kanzlei', /^kanzlei(?:en)?$/iu],
  ['firma', /^firm(?:a|en)$/iu], ['institut', /^\p{L}*institut(?:s|es|e|en)?$/iu], ['akademie', /^\p{L}*akademi(?:e|en)$/iu],
];
export const HEAD_LIST = ['Gymnasium', 'Schule und Wörter auf -schule', 'Universität', 'Kita (auch auf -kita)', 'Kindergarten (auch auf -kindergarten)',
  'Krippe (auch auf -krippe)', 'Hort', 'Kinderhaus', 'Familienzentrum', 'Jugendzentrum', 'Verein (auch auf -verein, z. B. Förderverein)',
  'Stiftung (auch auf -stiftung)', 'Praxis (auch auf -praxis)', 'Klinik (auch auf -klinik)', 'Krankenhaus', 'Kanzlei', 'Firma',
  'Institut (auch auf -institut)', 'Akademie (auch auf -akademie)', 'Gymnasium auch auf -gymnasium'];
// Wörter auf -schule usw. müssen mit einem Großbuchstaben beginnen (Nomen)
function headOf(t) {
  if (!/^\p{Lu}/u.test(t) || t.includes('-')) return null;
  for (const [k, re] of HEADS) if (re.test(t)) return k;
  return null;
}
// Ausschluss-Liste (Regel a): Wort direkt nach dem Kopfwort, das dort üblich und kein Name ist
export const EXCLUDE_AFTER = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonnabend', 'Sonntag',
  'Januar', 'Jänner', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
  'Schuljahr', 'Schuljahres', 'Schuljahre', 'Halbjahr', 'Halbjahres', 'Jahrgang', 'Jahrgangs', 'Jahrgangsstufe', 'Klasse', 'Klassen',
  'Unterricht', 'Unterrichts', 'Anmeldung', 'Anmeldungen', 'Leitung', 'Schulleitung', 'Eltern', 'Elternbeirat', 'Elternabend',
  'Kinder', 'Kindern', 'Schüler', 'Schülerin', 'Schülerinnen', 'Schülern', 'Lehrer', 'Lehrerin', 'Lehrerinnen', 'Lehrern', 'Lehrkräfte',
  'Lehrkraft', 'Mitglieder', 'Mitglied', 'Mitgliedern', 'Vorstand', 'Satzung', 'Öffnungszeiten', 'Betreuung', 'Gebühren', 'Gebühr',
  'Beitrag', 'Beiträge', 'Träger', 'Gebäude', 'Hof', 'Ferien', 'Termin', 'Termine', 'Team', 'Sekretariat', 'Verwaltung', 'Kontakt',
  'Telefon', 'Fax', 'Adresse', 'Anschrift', 'Website', 'Webseite', 'Homepage', 'Mittagessen', 'Essen', 'Mensa', 'Aula', 'Turnhalle',
  'Sporthalle', 'Bibliothek', 'Kosten', 'Programm', 'Stundenplan', 'Speiseplan', 'Elternbrief', 'Info', 'Infos', 'Informationen',
  'Hinweis', 'Hinweise', 'Formular', 'Antrag', 'Woche', 'Wochen', 'Jahr', 'Tag', 'Tage', 'Uhr', 'Beginn', 'Ende', 'Neubau', 'Alltag',
  // Nachbesserung 2.8.0 (Befund 2): Schulfächer, Raum-Wörter, Funktions-Wörter
  'Deutsch', 'Mathe', 'Mathematik', 'Englisch', 'Französisch', 'Latein', 'Spanisch', 'Italienisch', 'Sport', 'Musik', 'Kunst', 'Religion',
  'Ethik', 'Biologie', 'Bio', 'Chemie', 'Physik', 'Geschichte', 'Erdkunde', 'Geografie', 'Geographie', 'Sachkunde', 'Sachunterricht',
  'Informatik', 'Werken', 'Textil', 'Wirtschaft', 'Politik', 'Sozialkunde', 'Hauswirtschaft',
  'Raum', 'Räume', 'Zimmer', 'Saal', 'Halle', 'Küche', 'Garten', 'Pausenhof', 'Flur', 'Eingang',
  'Rektor', 'Rektorin', 'Konrektor', 'Konrektorin', 'Direktor', 'Direktorin', 'Vorsitzender', 'Vorsitzende', 'Vorsitz', 'Aufnahme',
  'Gruppe', 'Gruppen', 'Hausmeister', 'Hausmeisterin', 'Personal', 'Elternvertreter', 'Elternvertreterin'];
// … und Wörter auf -fest, -feier, -tag, -woche (auch Mehrzahl) sowie -raum, -zimmer, -saal, -halle
export const EXCLUDE_ENDINGS = ['fest', 'feste', 'feier', 'feiern', 'tag', 'tage', 'woche', 'wochen', 'raum', 'zimmer', 'saal', 'halle'];
const EXCL_WORDS = new Set(EXCLUDE_AFTER.map((w) => fold(w)));
const EXCL = { has: (k) => EXCL_WORDS.has(k) || (k.length > 5 && EXCLUDE_ENDINGS.some((e) => k.endsWith(e))) };
// Nachbesserung 2.8.0 (Befund 1): Anrede oder Titel (wie die Personen-Erkennung) beendet einen Namen
const isTitleTok = (tk) => tk && tk.word && lex.isTitle(fold(tk.t));
const PREP = new Set(['am', 'im', 'in', 'bei', 'beim']);
const PREP2 = new Set(['an der', 'an dem', 'in der', 'auf der', 'auf dem']);
// Titel-Wörter (Regel b): direkt vor Anführungszeichen, ohne Merkmal 1–3 -> kein Fund, kein Warnpunkt
export const TITLE_WORDS = ['Vortrag', 'Kurs', 'Projekt', 'Thema', 'Motto', 'Buch', 'Titel', 'Lied', 'Film', 'Workshop', 'Seminar', 'Fach', 'AG', 'Stück', 'Artikel'];
const TITLE = new Set(TITLE_WORDS.map((w) => fold(w)));
export const LEGAL_FORMS = ['GmbH', 'gGmbH', 'AG', 'KG', 'UG', 'GbR', 'eG', 'e. V.', 'e.V.', 'mbH'];
const LF_EXACT = new Set(['GmbH', 'gGmbH', 'AG', 'KG', 'UG', 'GbR', 'eG', 'mbH', 'GMBH', 'GGMBH', 'GBR', 'MBH']);
const QUOTES = [['„', '“”'], ['“', '”'], ['"', '"'], ['»', '«'], ['«', '»']];
const SP = /^[  ]+$/;

const isCapWord = (tk) => tk.word && /^\p{Lu}/u.test(tk.t);
const isFunctionWord = (tk) => lex.DETERMINERS.has(fold(tk.t)) || lex.isStop(fold(tk.t)) || lex.PREPOSITIONS.has(fold(tk.t));
// Rechtsform ab Token i: liefert Index des letzten Tokens oder -1 (GmbH | e. V. | e.V.)
function legalAt(toks, i, text) {
  const t = toks[i];
  if (!t) return -1;
  if (LF_EXACT.has(t.t)) return i;
  // e. V. / e.V. / E. V.
  if ((t.t === 'e' || t.t === 'E') && toks[i + 1] && toks[i + 1].t === '.' && toks[i + 2] && toks[i + 2].t === 'V' && toks[i + 3] && toks[i + 3].t === '.') {
    const g = text.slice(toks[i + 1].e, toks[i + 2].s);
    if (g === '' || SP.test(g)) return i + 3;
  }
  return -1;
}
const gapOk = (text, a, b) => SP.test(text.slice(a.e, b.s));

// Kandidaten einer Texteinheit (Koordinaten relativ zur Einheit)
function unitCandidates(text, covered) {
  const toks = tokenize(text);
  const cov = (k) => covered && covered(toks[k].s, toks[k].e);
  const out = [];
  const usedEnd = { v: -1 };
  for (let i = 0; i < toks.length; i++) {
    const tk = toks[i];
    if (!tk.word || cov(i)) continue;
    // Form 2: Name-Bindestrich-Kopfwort („Tannhofen-Gymnasium“, „Erika-Brandner-Schule“)
    if (tk.t.includes('-')) {
      const parts = tk.t.split('-');
      const last = parts[parts.length - 1];
      const head = headOf(last.charAt(0).toUpperCase() + last.slice(1));
      if (head && parts.slice(0, -1).every((p) => /^\p{Lu}/u.test(p) && !EXCL.has(fold(p)))) {
        let end = i;
        if (toks[i + 1] && gapOk(text, tk, toks[i + 1])) { const l = legalAt(toks, i + 1, text); if (l >= 0) end = l; }
        out.push({ s: tk.s, e: toks[end].e, head, names: parts.slice(0, -1).map((p) => fold(p)), form: 2 });
        i = end;
        continue;
      }
    }
    // Form 1: Kopfwort + Namen
    const head = headOf(tk.allcaps ? tk.t.charAt(0) + tk.t.slice(1).toLowerCase() : tk.t);
    if (head) {
      let j = i + 1;
      // „am / im / in / bei / beim“ oder „an der / in der …“
      if (toks[j] && gapOk(text, tk, toks[j]) && toks[j].word) {
        const w1 = fold(toks[j].t);
        if (toks[j + 1] && gapOk(text, toks[j], toks[j + 1]) && PREP2.has(w1 + ' ' + fold(toks[j + 1].t))) j += 2;
        else if (PREP.has(w1)) j += 1;
      }
      const names = [];
      const nameEnds = [];
      let last = i;
      while (names.length < 3 && toks[j] && gapOk(text, toks[j - 1], toks[j]) && isCapWord(toks[j]) && !cov(j)) {
        const w = toks[j];
        const k = fold(w.t);
        if (isTitleTok(w) || EXCL.has(k) || headOf(w.allcaps ? w.t.charAt(0) + w.t.slice(1).toLowerCase() : w.t) || isFunctionWord(w) || w.t.includes('-') && headOf(w.t.split('-').pop())) break;
        names.push(k);
        nameEnds.push(w.e);
        last = j;
        j++;
      }
      if (names.length) {
        let end = last;
        if (toks[end + 1] && gapOk(text, toks[end], toks[end + 1])) { const l = legalAt(toks, end + 1, text); if (l >= 0) end = l; }
        out.push({ s: tk.s, e: toks[end].e, head, names, nameEnds, lf: end !== last, caps: tk.allcaps, form: 1 });
        i = end;
        continue;
      }
    }
    // Form 3: 1–3 großgeschriebene Wörter vor einer Rechtsform
    const l = legalAt(toks, i, text);
    if (l >= 0 && i > 0) {
      const names = [];
      let st = i;
      for (let k = i - 1; k >= 0 && names.length < 3; k--) {
        if (!gapOk(text, toks[k], toks[k + 1]) && !(toks[k + 1].t === '&')) break;
        if (toks[k].t === '&') { st = k; continue; }
        if (!isCapWord(toks[k]) || isFunctionWord(toks[k]) || isTitleTok(toks[k]) || cov(k) || toks[k].s <= usedEnd.v) break;
        names.unshift(fold(toks[k].t));
        st = k;
      }
      while (st < i && toks[st].t === '&') st++;
      if (names.length) out.push({ s: toks[st].s, e: toks[l].e, head: null, names, form: 3 });
      i = l;
    }
  }
  return out;
}

// Version 2.8.1 (Teil 3): Kandidat (Kopfwort + Namen) vor einer sicheren Person abschneiden. Bleibt Kopfwort + mindestens
// ein Namens-Wort, ist das die Einrichtung; sonst kein Fund. Beginnt die Person schon am Kopfwort (oder ist es eine andere
// Form), bleibt der Kandidat wie er ist (die Sperre „Person geht vor“ greift danach wie bisher).
function cutBefore(c, p) {
  if (p < 0 || c.form !== 1 || !c.nameEnds || p <= c.s) return c;
  const keep = c.nameEnds.filter((x) => x <= p).length;
  if (keep >= c.names.length && !c.lf) return c;
  if (!keep) return null;
  return { ...c, names: c.names.slice(0, keep), nameEnds: c.nameEnds.slice(0, keep), e: c.nameEnds[keep - 1], lf: false, cut: true };
}

// Wortfolge (mit beliebigem Leerraum, ohne Groß-/Kleinschreibung) als ganze Wörter zählen
const phraseCache = new Map();
function countPhrase(fullText, words) {
  const ck = fullText.length + '|' + words.join(' ').toLowerCase();
  if (phraseCache.has(ck) && phraseCache.get(ck).t === fullText) return phraseCache.get(ck).n;
  if (phraseCache.size > 5000) phraseCache.clear();
  const n = countPhrase0(fullText, words);
  phraseCache.set(ck, { t: fullText, n });
  return n;
}
function countPhrase0(fullText, words) {
  const esc = words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const re = new RegExp('(?<![\\p{L}\\p{N}])' + esc.join('\\s+') + '(?![\\p{L}\\p{N}])', 'giu');
  return (fullText.match(re) || []).length;
}

// Anführungszeichen (Regel b)
function quoteCandidates(text, fullText, webJoined, covered) {
  const out = [];
  for (const [open, closes] of QUOTES) {
    let i = text.indexOf(open);
    while (i >= 0) {
      let j = -1;
      for (let k = i + 1; k < text.length && k <= i + 100; k++) { if (closes.includes(text[k])) { j = k; break; } if (text[k] === '\n') break; }
      if (j < 0) { i = text.indexOf(open, i + 1); continue; }
      const inner = text.slice(i + 1, j);
      const words = inner.trim().split(/[  ]+/).filter(Boolean);
      const ok = inner.trim() === inner && words.length >= 2 && words.length <= 6 && /^\p{Lu}/u.test(words[0])
        && words.every((w) => /[\p{L}\p{N}]/u.test(w)) && !/[.!?;:,]/.test(inner) && !(covered && covered(i + 1, j))
        // beginnt mit einer Anrede oder einem Titel („Herr Kowalczyk“): eine Person, keine Einrichtung
        // Nachbesserung 2.8.0: auch keine Anrede/kein Titel mittendrin („Praxis Dr Müller“)
        && !words.some((w) => lex.isTitle(fold(w.replace(/\.$/, ''))));
      if (ok) {
        const before = text.slice(0, i).match(/([\p{L}\p{N}.]+)[  ]*:?[  ]*$/u);
        const after = text.slice(j + 1).match(/^[  ]+([\p{L}][\p{L}.]*(?:[  ]V\.)?)/u);
        const bw = before ? before[1] : '';
        const m1 = !!(bw && (headOf(bw) || LF_EXACT.has(bw) && !TITLE.has(fold(bw)))) || !!(after && (LF_EXACT.has(after[1]) || /^[eE]\.[ \u00a0]?V\.$/.test(after[1])));
        // Merkmal 2: Wort aus den Namenslisten (ohne „mehrdeutig“). Umlaute: nur, wenn die gefaltete Form nicht erst durch das
        // Entfernen des Umlauts entsteht („Blätter“ ist nicht „Blatter“), außer bei Vornamen
        const m2 = words.some((w) => { const c = w.replace(/[^\p{L}\p{M}'’-]/gu, ''); const k = fold(c); return k.length >= 3 && /^\p{Lu}/u.test(w) && lex.inLists(k) && !lex.isStop(k) && !lex.isAmbiguous(k) && (k === c.toLowerCase() || lex.isFirst(k)); });
        const lw = words.map((w) => fold(w.replace(/[^\p{L}\p{N}]/gu, ''))).filter(Boolean);
        const m3 = lw.length >= 2 && ['', '-', '_', '.'].some((sep) => webJoined.some((x) => x.includes(lw.join(sep))));
        const m4 = countPhrase(fullText, words) >= 2;
        const title = !!(bw && TITLE.has(fold(bw)));
        const strong = m1 || m2 || m3 || (m4 && !title);
        if (strong) out.push({ s: i + 1, e: j, head: null, names: lw, form: 4, quoted: true, merkmal: [m1 && 1, m2 && 2, m3 && 3, m4 && 4].filter(Boolean) });
        else if (!title) out.push({ s: i, e: j + 1, weak: true });
      }
      i = text.indexOf(open, j + 1);
    }
  }
  return out;
}

const PRE = /[sS]chul|SCHUL|[gG]ymnasi|GYMNASI|Universit|UNIVERSIT|[kK]ita|KITA|[kK]inderg|KINDERG|[kK]rippe|KRIPPE|Hort|HORT|Kinderh|KINDERH|zentr|ZENTR|[vV]erein|VEREIN|[sS]tiftung|STIFTUNG|[pP]rax|PRAX|[kK]linik|KLINIK|Krankenh|KRANKENH|Kanzlei|KANZLEI|Firm|FIRM|[iI]nstitut|INSTITUT|[aA]kademi|AKADEMI|GmbH|mbH|AG|KG|UG|GbR|GBR|eG|e\.[  ]?V\.|[„“"»«]/;

// units: [{text}], covered(ui, s, e): Stelle ist schon belegt (Kontaktdaten, von Hand markierte Einrichtungen,
// Namensspalten). exceptions: Set gefalteter Wörter (Liste „Ausnahmen“). manualTerms: von Hand markierte Bezeichnungen.
// Ergebnis: {groups: [{key, terms:[Bezeichnung], manualKey|null}], weak: [{unit, s, e, text}]}
// cutAt(ui, s, e) (Version 2.8.1, Teil 3): Beginn (in der Einheit) der ersten „sicheren“ Person, die die Stelle s..e
// überschneidet, sonst -1. Eine Einrichtung, hinter deren Kopfwort eine sichere Person steht, endet vor ihr.
export function findOrgs(units, fullText, { covered, exceptions, manualTerms, cutAt }) {
  // Webadressen und Konten des Dokuments (für Merkmal 3), unabhängig vom Schalter
  const webSet = new Set();
  for (const u of units) if (/[./:@]/.test(u.text)) for (const c of findContacts(u.text, { web: true })) if (c.type === 'web' || c.type === 'account') webSet.add(fold(u.text.slice(c.s, c.e)));
  const webJoined = [...webSet];
  const cands = [];
  const weak = [];
  units.forEach((u, ui) => {
    if (!u.text || !PRE.test(u.text)) return;
    const cv = covered ? (s, e) => covered(ui, s, e) : null;
    // Excel-Formeln: Anführungszeichen sind dort Zeichenketten der Formel, keine Namensklammern
    const formula = / \(Formel\)/.test(u.label || '');
    const qs = !formula && /[„“"»«]/.test(u.text) ? quoteCandidates(u.text, fullText, webJoined, cv) : [];
    for (const q of qs) if (q.weak) weak.push({ unit: ui, s: q.s, e: q.e, text: u.text.slice(q.s, q.e) });
    const all = [...unitCandidates(u.text, cv), ...qs.filter((q) => !q.weak)];
    for (const c0 of all) {
      const c = cutAt ? cutBefore(c0, cutAt(ui, c0.s, c0.e)) : c0;
      if (!c) continue;
      const term = u.text.slice(c.s, c.e).replace(/\s+/g, ' ');
      if (exceptions && (exceptions.has(fold(term)) || c.names.some((n) => exceptions.has(n)))) continue;
      cands.push({ ...c, unit: ui, term });
    }
  });
  // GROSSSCHRIFT: Wörter dahinter sind auch groß („FAMILIENZENTRUM SONNENBLUME LÄDT“). Gibt es dieselbe Einrichtung in
  // normaler Schreibweise, endet die GROSS-Form nach genauso vielen Namens-Wörtern.
  const normal = new Map(); // Kopfwort -> verschiedene Namensfolgen in normaler Schreibweise
  for (const o of cands) {
    if (o.caps || !o.head) continue;
    if (!normal.has(o.head)) normal.set(o.head, new Map());
    normal.get(o.head).set(o.names.join(' '), o);
  }
  for (const c of cands) {
    if (!c.caps || c.lf || !c.nameEnds) continue;
    const ref = [...(normal.get(c.head) || new Map()).values()].filter((o) => o.names.length < c.names.length && o.names.every((n, i) => n === c.names[i]));
    if (!ref.length) continue;
    const n = Math.max(...ref.map((o) => o.names.length));
    c.names = c.names.slice(0, n);
    c.e = c.nameEnds[n - 1];
    c.term = units[c.unit].text.slice(c.s, c.e).replace(/\s+/g, ' ');
  }
  // Von Hand markierte Bezeichnungen als Anker: gehört ein Fund zu derselben Einrichtung, wird er Teil von ihr (sicher)
  const anchors = [];
  for (const t of manualTerms || []) {
    const cs = unitCandidates(t, null);
    const c = cs.find((x) => x.s === 0 && x.e >= t.trim().length - 1) || null;
    anchors.push({ term: t, head: c ? c.head : null, names: c ? c.names : tokenize(t).filter((x) => x.word).map((x) => fold(x.t)), manual: true });
  }
  // Gleiche Bezeichnung nur einmal (Geschwindigkeit; die Suche im ganzen Dokument macht danach matchOrgTerms)
  const seenTerm = new Set();
  const uniq = cands.filter((c) => { const k = c.term + '|' + (c.quoted ? 'q' : ''); if (seenTerm.has(k)) return false; seenTerm.add(k); return true; });
  const items = [...anchors, ...uniq];
  // Gruppen (Regel c): gleiches Kopfwort und Namens-Wörter enthalten; ohne Kopfwort: gleiche Namens-Wörter
  const parent = items.map((_, i) => i);
  const find = (i) => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  const sub = (a, b) => a.length && a.every((x) => b.includes(x));
  const same = (a, b) => {
    if (fold(a.term || '') === fold(b.term || '') && a.term) return true;
    if (a.head && b.head) return a.head === b.head && (sub(a.names, b.names) || sub(b.names, a.names));
    if (!a.head && !b.head) return a.names.length === b.names.length && sub(a.names, b.names);
    return false;
  };
  for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) if (same(items[i], items[j])) parent[find(j)] = find(i);
  const groups = new Map();
  items.forEach((it, i) => {
    const r = find(i);
    if (!groups.has(r)) groups.set(r, { terms: [], manualTerm: null, quoted: false });
    const g = groups.get(r);
    if (it.manual) { if (!g.manualTerm) g.manualTerm = it.term; return; }
    if (!g.terms.some((t) => t === it.term)) g.terms.push(it.term);
    if (it.quoted) g.quoted = true;
    if (it.form === 2) (g.hyphen = g.hyphen || new Set()).add(it.term);
  });
  const res = [];
  for (const g of groups.values()) if (g.terms.length) res.push(g);
  return { groups: res, weak };
}
