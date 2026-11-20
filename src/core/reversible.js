// Modus "rückbaufähig": Platzhalter je Namensteil ("Vorname A", "Nachname A", "Initiale A", weitere
// Schreibweisen mit Nummer "Nachname A2") und eindeutige Kontakt-Platzhalter ("[E-MAIL-1]").
// Jeder Platzhalter steht für genau EINE Schreibweise, deshalb ist der Rückbau exakt möglich.
import * as lex from './lexicon.js';

export const MODE_REVERSIBLE = 'reversible';
export const CONTACT_BASE = { email: 'E-MAIL', phone: 'TELEFON', iban: 'IBAN', address: 'ADRESSE' };
export const CONTACT_NAMES = { email: 'E-Mail', phone: 'Telefon', iban: 'IBAN', address: 'Adresse' };
export const KEY_FORMAT = 'anonymisierer-rueckbau-schluessel';
export const KEY_WARNING = 'Enthält echte Namen. Nie weitergeben, nie an eine KI.';

// Erkennt Platzhalter dieses Modus in beliebigem Text (für Kollisionsprüfung und Rückbau)
export const NAME_PH_RE = /(^|[^\p{L}\p{N}])((?:Vorname|Nachname|Initiale|Name) [A-Z]{1,3}\d*)(?=(?:'s|’s|'|’|s|es|ns|n)?(?![\p{L}\p{N}]))/gu;
export const CONTACT_PH_RE = /\[(?:E-MAIL|TELEFON|IBAN|ADRESSE)-\d+\]/g;

// Rolle eines einzelnen Namenswortes innerhalb einer Person
function roleOfSingle(h, comp, entityKey, singleRoles) {
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
  const variants = new Map(); // "A|Nachname" -> [Schreibweise, ...]
  const placeholderInfo = new Map(); // Platzhalter -> {wert, rolle, person, kategorie}
  const contactNums = new Map(); // "email|Wert" -> Platzhalter
  const contactCount = {};
  for (const h of hits) {
    if (h.type === 'person') {
      const en = entities.get(h.entity);
      const parts = splitHit(h, h.origEntity || h.entity, singleRoles);
      h.parts = parts.map((p) => {
        const value = fullText.slice(p.s, p.e);
        const vk = en.letter + '|' + p.role;
        if (!variants.has(vk)) variants.set(vk, []);
        const list = variants.get(vk);
        let idx = list.indexOf(value);
        if (idx < 0) { list.push(value); idx = list.length - 1; }
        const ph = `${p.role} ${en.letter}${idx > 0 ? idx + 1 : ''}`;
        if (!placeholderInfo.has(ph)) placeholderInfo.set(ph, { wert: value, rolle: p.role, person: en.letter, kategorie: 'Name' });
        return { s: p.s, e: p.e, text: ph };
      });
      h.label = h.parts.map((p) => p.text).join(' … ');
    } else {
      const value = fullText.slice(h.s, h.e);
      const ck = h.type + '|' + value;
      if (!contactNums.has(ck)) {
        contactCount[h.type] = (contactCount[h.type] || 0) + 1;
        const ph = `[${CONTACT_BASE[h.type]}-${contactCount[h.type]}]`;
        contactNums.set(ck, ph);
        placeholderInfo.set(ph, { wert: value, kategorie: CONTACT_NAMES[h.type] });
      }
      h.label = contactNums.get(ck);
    }
  }
  result.reversible = { placeholderInfo, contactNums };
  // Warnung: Platzhalter-ähnlicher Text steht schon im Original -> Rückbau würde ihn ebenfalls ersetzen
  const clashes = new Set();
  for (const m of fullText.matchAll(NAME_PH_RE)) clashes.add(m[2]);
  for (const m of fullText.matchAll(CONTACT_PH_RE)) clashes.add(m[0]);
  result.reversible.clashes = [...clashes];
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
    if (!counts.has(ph)) continue;
    eintraege.push({ platzhalter: ph, kategorie: info.kategorie, ...(info.rolle ? { rolle: info.rolle, person: info.person } : {}), wert: info.wert, anzahl: counts.get(ph) });
  }
  const personen = [];
  for (const en of result.entities.values()) {
    const vs = eintraege.filter((x) => x.person === en.letter).map((x) => x.platzhalter);
    if (vs.length) personen.push({ person: en.letter, anzeige: en.display, platzhalter: vs });
  }
  return {
    format: KEY_FORMAT,
    formatVersion: 1,
    warnung: KEY_WARNING,
    hinweis: 'Rückbau-Schlüsseldatei des Anonymisierers. Ohne diese Datei ist kein Rückbau möglich.',
    toolVersion: meta.version,
    modus: 'rückbaufähig',
    quelle: { dateityp: meta.kind },
    platzhalter: eintraege,
    personen,
  };
}
