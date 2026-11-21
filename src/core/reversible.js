// Modus "rückbaufähig": Platzhalter je Namensteil ("Vorname A", "Nachname A", "Initiale A", weitere
// Schreibweisen mit Nummer "Nachname A2") und eindeutige Kontakt-Platzhalter ("[E-MAIL-1]").
// Jeder Platzhalter steht für genau EINE Schreibweise, deshalb ist der Rückbau exakt möglich.
import * as lex from './lexicon.js';
import { findContacts } from './patterns.js';

export const MODE_REVERSIBLE = 'reversible';
export const CONTACT_BASE = { email: 'E-MAIL', phone: 'TELEFON', iban: 'IBAN', address: 'ADRESSE', web: 'WEBADRESSE', account: 'KONTO' };
export const CONTACT_NAMES = { email: 'E-Mail', phone: 'Telefon', iban: 'IBAN', address: 'Adresse', web: 'Webadresse', account: 'Konto' };
export const KEY_FORMAT = 'anonymisierer-rueckbau-schluessel';
export const KEY_WARNING = 'Enthält echte Namen. Nie weitergeben, nie an eine KI.';

// Erkennt Platzhalter dieses Modus in beliebigem Text (für Kollisionsprüfung und Rückbau)
export const NAME_PH_RE = /(^|[^\p{L}\p{N}])((?:Vorname|Nachname|Initiale|Name) [A-Z]{1,3}\d*)(?=(?:'s|’s|'|’|s|es|ns|n)?(?![\p{L}\p{N}]))/gu;
export const CONTACT_PH_RE = /\[(?:E-MAIL|TELEFON|IBAN|ADRESSE|WEBADRESSE|KONTO)-\d+\]/g;
// Einrichtungen (Version 2.3): der ganze Name als EIN Platzhalter, weitere Schreibweisen mit Nummer
export const ORG_PH_RE = /(^|[^\p{L}\p{N}])(Einrichtung [A-Z]{1,3}\d*)(?=(?:'s|’s|'|’|s|es|ns|n)?(?![\p{L}\p{N}]))/gu;

// Version 2.3.3/2.3.4: Alles, was wie ein Platzhalter des Tools aussieht (für das Sicherheitsnetz beim Rückbau und,
// seit 2.3.4, für Wörter, die schon im Original stehen): Vorname/Nachname/Name/Initiale/Person/Einrichtung +
// Großbuchstaben, danach weitere Großbuchstaben oder Ziffern und höchstens eine Endung der Liste; dazu Platzhalter in
// eckigen Klammern („[E-MAIL-1]“, „[NAME]“, „[EINRICHTUNG]“).
const LIKE_NAME_RE = /(^|[^\p{L}\p{N}])((?:Vorname|Nachname|Initiale|Name|Person|Einrichtung)[ \u00a0][A-Z][A-Z\d]*(?:'s|’s|'|’|s|es|ns|n)?)(?![\p{L}\p{N}])/gu;
const LIKE_BRACKET_RE = /\[(?:E-MAIL|TELEFON|IBAN|ADRESSE|WEBADRESSE|KONTO|NAME|EINRICHTUNG)(?:-[\p{L}\p{N}]*)?\][\p{L}\p{N}]*/gu;
export function findPlaceholderLike(text) {
  const out = [];
  for (const m of text.matchAll(LIKE_NAME_RE)) { const s = m.index + m[1].length; out.push({ text: m[2], s, e: s + m[2].length }); }
  for (const m of text.matchAll(LIKE_BRACKET_RE)) out.push({ text: m[0], s: m.index, e: m.index + m[0].length });
  return out.sort((a, b) => a.s - b.s);
}
// Version 2.3.4: Platzhalter, die das Tool NICHT vergeben darf, weil sie (oder sie mit einer kleinen Endung) schon im
// Original stehen. „Nachname As“ im Original sperrt auch „Nachname A“ (der Platzhalter + „s“ sähe gleich aus).
export function reservedPlaceholders(fullText) {
  const words = new Map(); // Wort -> Anzahl im Original
  const reserved = new Set();
  for (const x of findPlaceholderLike(fullText)) {
    words.set(x.text, (words.get(x.text) || 0) + 1);
    reserved.add(x.text);
    const base = x.text.match(/^(.*?[A-Z\d\]])(?:'s|’s|'|’|s|es|ns|n)$/u);
    if (base) reserved.add(base[1]);
  }
  return { words, reserved };
}
// Nächster freier Platzhalter: base, base2, base3 … ohne die gesperrten (ohne Sperre wie bisher: 1. = base, 2. = base2)
function numbered(state, value, base, reserved) {
  if (state.map.has(value)) return state.map.get(value);
  let ph;
  do { state.n++; ph = state.n > 1 ? base + state.n : base; } while (reserved.has(ph));
  state.map.set(value, ph);
  return ph;
}

// Rolle eines einzelnen Namenswortes innerhalb einer Person
function roleOfSingle(h, comp, entityKey, singleRoles) {
  if (h.role) return h.role; // Version 2.6.0: Rolle aus der Namensspalte (Vorname/Nachname)
  if (h.link === 'nur Vorname') return 'Vorname';
  if (h.link === 'nur Nachname') return 'Nachname';
  if (entityKey.startsWith('N|')) {
    const [, given, sur] = entityKey.split('|');
    const parts = (s) => s.split(/[ -]/).filter(Boolean);
    if (parts(sur).includes(comp.key) || sur === comp.key) return 'Nachname';
    if (parts(given).includes(comp.key) || given === comp.key) return 'Vorname';
  }
  if (singleRoles.has(entityKey)) return singleRoles.get(entityKey);
  if (lex.isLast(comp.key)) return 'Nachname';
  if (lex.isFirst(comp.key)) return 'Vorname';
  return 'Name';
}

// Teilbereiche eines Treffers: [{s, e, role}] in Textkoordinaten (Endung bleibt außerhalb)
function splitHit(h, entityKey, singleRoles) {
  const stemEnd = h.e - (h.suffix ? h.suffix.length : 0);
  const comps = h.comps || [];
  const sep = comps.findIndex((c) => c.type === 'SEP');
  const real = comps.filter((c) => c.type !== 'SEP');
  const W = real.filter((c) => c.type === 'W');
  // Version 2.6.0: ganze Zelle einer Vor- bzw. Nachnamensspalte („Thi Lan“, „von der Heide“) = ein Teil mit dieser Rolle
  if (h.role && sep < 0) return [{ s: real[0].s, e: Math.min(real[real.length - 1].e, stemEnd), role: h.role }];
  if (real.length === 1 && W.length === 1) {
    return [{ s: real[0].s, e: Math.min(real[0].e, stemEnd), role: roleOfSingle(h, W[0], entityKey, singleRoles) }];
  }
  let surname;
  let given;
  if (sep >= 0) { // "Nachname, Vorname"
    surname = comps.slice(0, sep);
    given = comps.slice(sep + 1);
  } else {
    const lastW = real.lastIndexOf(W[W.length - 1]);
    let st = lastW;
    while (st > 0 && real[st - 1].type === 'P') st--;
    surname = real.slice(st, lastW + 1);
    given = real.slice(0, st);
  }
  const span = (group, role) => {
    if (!group.length) return null;
    let e = Math.min(group[group.length - 1].e, stemEnd);
    if (group[group.length - 1].type === 'I') e -= 1; // Punkt der Initiale bleibt stehen
    return { s: group[0].s, e, role };
  };
  const givenRole = given.length && given.every((c) => c.type === 'I') ? 'Initiale' : 'Vorname';
  const out = [span(given, givenRole), span(surname, 'Nachname')].filter((x) => x && x.e > x.s);
  return out.sort((a, b) => a.s - b.s);
}

// Berechnet für alle Treffer die Platzhalter. Ändert nur Felder für diesen Modus.
export function assignReversible(result) {
  const { hits, entities, fullText } = result;
  // Rolle für Einzelwort-Personen: mit Anrede -> Nachname
  const singleRoles = new Map();
  for (const h of hits) {
    if (h.type === 'person' && h.titled && h.entity && h.entity.startsWith('S|')) singleRoles.set(h.entity, 'Nachname');
  }
  // Version 2.3.4: Platzhalter, die schon im Original stehen, werden nicht vergeben (nächste freie Nummer)
  const reserved = (result.placeholderWords && result.placeholderWords.reserved) || new Set();
  const variants = new Map(); // "A|Nachname" -> {map: Schreibweise -> Platzhalter, n}
  const placeholderInfo = new Map(); // Platzhalter -> {wert, rolle, person, kategorie}
  const contactNums = new Map(); // "email|Wert" -> Platzhalter
  const contactCount = {};
  const orgExact = new Map(); // "A|Schreibweise" -> Platzhalter (für Texte außerhalb der Prüfansicht)
  // Version 2.5.0: Treffer „GROSS-Form eines von Hand übernommenen Namens“ (standardmäßig aus) bekommen ihre Platzhalter
  // zuletzt, damit die Nummern aller übrigen Schreibweisen gleich bleiben
  for (const h of [...hits.filter((x) => !x.capsManual), ...hits.filter((x) => x.capsManual)]) {
    if (h.type === 'org') {
      // Ganze Bezeichnung (ohne Endung am Schluss, die bleibt wie bei Personen im Text stehen) = ein Platzhalter
      const og = result.orgs.get(h.entity);
      // Version 2.3.3: Endung mit Großbuchstaben („BÜRGERVEREINS“) gehört wie bei Personen zur Schreibweise des
      // Platzhalters („Einrichtung A2“ = „… BÜRGERVEREINS“); dahinter („Einrichtung A2S“) erkennt der Rückbau sie nicht
      if (/\p{Lu}/u.test(h.suffix || '')) h.suffixInPh = true;
      // Version 2.3.4: Ziffern/Buchstaben direkt dahinter („Bürgerverein2“) gehören zur Schreibweise (sonst „Einrichtung A2“)
      const tail = trailing(h, hits, fullText);
      if (tail) { h.suffixInPh = true; h.tailEnd = h.e + tail; }
      const stemEnd = h.e + tail - (h.suffix && !h.suffixInPh ? h.suffix.length : 0);
      // Über einen Zeilenumbruch (TXT): eigene Schreibweise mit dem echten Zeilenende, damit der Rückbau es herstellt
      const value = h.unit2 !== undefined ? fullText.slice(h.s, h.split) + h.eol + fullText.slice(h.split + 1, stemEnd) : fullText.slice(h.s, stemEnd);
      const vk = 'O|' + og.letter;
      if (!variants.has(vk)) variants.set(vk, { map: new Map(), n: 0 });
      const ph = numbered(variants.get(vk), value, `Einrichtung ${og.letter}`, reserved);
      if (!placeholderInfo.has(ph)) placeholderInfo.set(ph, { wert: value, kategorie: 'Einrichtung', einrichtung: og.letter });
      orgExact.set(og.letter + '|' + value, ph);
      h.parts = [{ s: h.s, e: stemEnd, text: ph }];
      h.label = ph;
    } else if (h.type === 'person') {
      const en = entities.get(h.entity);
      // Version 2.3.2: Endung mit Großbuchstaben („MÜLLERS“) gehört zur Schreibweise des Platzhalters („Nachname A2“ =
      // „MÜLLERS“). Stünde sie dahinter („Nachname AS“), läse der Rückbau einen anderen Platzhalter.
      if (/\p{Lu}/u.test(h.suffix || '')) h.suffixInPh = true;
      // Version 2.3.4: Ziffern direkt hinter dem Namen („Müller2“) gehören zur Schreibweise des Platzhalters; dahinter
      // („Nachname A“ + „2“) sähe er aus wie die Schreibweise „Nachname A2“
      const tail = trailing(h, hits, fullText);
      let hx = h;
      if (tail) {
        h.suffixInPh = true;
        const comps = (h.comps || []).map((c) => ({ ...c }));
        const last = comps.filter((c) => c.type === 'W').pop();
        if (last) { last.e = h.e + tail; delete last.stemEnd; }
        hx = { ...h, e: h.e + tail, comps, suffix: '' };
      } else if (h.suffixInPh) hx = { ...h, suffix: '' };
      const parts = splitHit(hx, h.origEntity || h.entity, singleRoles);
      h.parts = parts.map((p) => {
        const value = fullText.slice(p.s, p.e);
        const vk = en.letter + '|' + p.role;
        if (!variants.has(vk)) variants.set(vk, { map: new Map(), n: 0 });
        const ph = numbered(variants.get(vk), value, `${p.role} ${en.letter}`, reserved);
        if (!placeholderInfo.has(ph)) placeholderInfo.set(ph, { wert: value, rolle: p.role, person: en.letter, kategorie: 'Name' });
        return { s: p.s, e: p.e, text: ph };
      });
      h.label = h.parts.map((p) => p.text).join(' … ');
    } else {
      const value = fullText.slice(h.s, h.e);
      const ck = h.type + '|' + value;
      if (!contactNums.has(ck)) {
        let ph;
        do { contactCount[h.type] = (contactCount[h.type] || 0) + 1; ph = `[${CONTACT_BASE[h.type]}-${contactCount[h.type]}]`; } while (reserved.has(ph));
        contactNums.set(ck, ph);
        placeholderInfo.set(ph, { wert: value, kategorie: CONTACT_NAMES[h.type] });
      }
      h.label = contactNums.get(ck);
    }
  }
  // Version 2.7.0: Webadressen und Konten, die nur in Link-Zielen, Link-Hinweisen oder Feldfunktionen stehen, bekommen
  // die nächsten Nummern (nach allen Stellen im Text, damit deren Nummern gleich bleiben). Sie stehen mit Anzahl 0 im
  // Schlüssel (Zahl bezieht sich auf den Text) und machen den Rückbau der Link-Ziele exakt.
  for (const t of result.linkTexts || []) {
    for (const c of findContacts(t, { web: true })) {
      if ((c.type !== 'web' && c.type !== 'account') || c.cert !== 'sicher') continue;
      const value = t.slice(c.s, c.e);
      const ck = c.type + '|' + value;
      if (contactNums.has(ck)) continue;
      let ph;
      do { contactCount[c.type] = (contactCount[c.type] || 0) + 1; ph = `[${CONTACT_BASE[c.type]}-${contactCount[c.type]}]`; } while (reserved.has(ph));
      contactNums.set(ck, ph);
      placeholderInfo.set(ph, { wert: value, kategorie: CONTACT_NAMES[c.type], nurVerweis: true });
    }
  }
  result.reversible = { placeholderInfo, contactNums, orgExact };
  // Bis 2.3.3 stand hier eine Warnung „Beim Rückbau würde dieser Text ebenfalls ersetzt“. Seit 2.3.4 vergibt das Tool
  // solche Platzhalter nicht mehr (siehe reserved); der Hinweis steht im Speichern-Schritt (result.placeholderWords).
}
// Länge der Ziffern/Buchstaben, die direkt (ohne Leerraum) auf den Treffer folgen und nicht zu einem anderen Treffer
// gehören. Wörter enden an Buchstaben, deshalb sind das praktisch nur Ziffern („Müller2“, „Müller2b“).
function trailing(h, hits, fullText) {
  const m = fullText.slice(h.e).match(/^[\p{L}\p{N}]+/u);
  if (!m) return 0;
  const e = h.e + m[0].length;
  if (hits.some((o) => o !== h && o.s < e && o.e > h.e)) return 0;
  return m[0].length;
}

// Schlüsseldatei (JSON). Zählt nur eingeschaltete Treffer im Text.
export function buildRestoreKey(result, meta) {
  const counts = new Map();
  for (const h of result.hits) {
    if (!h.on) continue;
    if (h.parts) for (const p of h.parts) counts.set(p.text, (counts.get(p.text) || 0) + 1);
    else counts.set(h.label, (counts.get(h.label) || 0) + 1);
  }
  const eintraege = [];
  for (const [ph, info] of result.reversible.placeholderInfo) {
    if (!counts.has(ph) && !info.nurVerweis) continue;
    eintraege.push({ platzhalter: ph, kategorie: info.kategorie, ...(info.rolle ? { rolle: info.rolle, person: info.person } : {}),
      ...(info.einrichtung ? { einrichtung: info.einrichtung } : {}), wert: info.wert, anzahl: counts.get(ph) || 0 });
  }
  const personen = [];
  for (const en of result.entities.values()) {
    const vs = eintraege.filter((x) => x.person === en.letter).map((x) => x.platzhalter);
    if (vs.length) personen.push({ person: en.letter, anzeige: en.display, platzhalter: vs });
  }
  // Einrichtungen als eigene Art (nur wenn es welche gibt: Schlüssel ohne Einrichtung bleiben wie bisher)
  // Platzhalter-Wörter aus dem Original mit Anzahl. Nach einem exakten Rückbau stehen sie wieder genau so da (auch wenn
  // ein Teil davon zwischendurch als Name ersetzt war, z. B. „Name“ in „Name A“).
  const imOriginal = [];
  if (result.placeholderWords) for (const [text, anzahl] of result.placeholderWords.words) imOriginal.push({ text, anzahl });
  const einrichtungen = [];
  for (const og of (result.orgs || new Map()).values()) {
    const vs = eintraege.filter((x) => x.einrichtung === og.letter).map((x) => x.platzhalter);
    if (vs.length) einrichtungen.push({ einrichtung: og.letter, anzeige: og.display, platzhalter: vs });
  }
  return {
    format: KEY_FORMAT,
    // Version 2 (Entscheidung Easy): NUR Schlüssel mit mindestens einer Einrichtung. Ältere Versionen (2.2) lehnen sie
    // dann klar ab, statt Einrichtungen still als Platzhalter stehen zu lassen. Ohne Einrichtung bleibt es Version 1.
    formatVersion: einrichtungen.length ? 2 : 1,
    warnung: KEY_WARNING,
    hinweis: 'Rückbau-Schlüsseldatei des Anonymisierers. Ohne diese Datei ist kein Rückbau möglich.',
    toolVersion: meta.version,
    modus: 'rückbaufähig',
    quelle: { dateityp: meta.kind },
    platzhalter: eintraege,
    personen,
    ...(einrichtungen.length ? { einrichtungen } : {}),
    // Version 2.3.4 (Zusatzfeld, nur wenn vorhanden; Format-Version unverändert): Wörter, die schon im Original wie ein
    // Platzhalter aussehen und in der Ausgabe stehen bleiben. Der Rückbau lässt sie unberührt.
    ...(imOriginal.length ? { imOriginal } : {}),
  };
}
