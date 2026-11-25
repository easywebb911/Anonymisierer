// Rückbau: Platzhalter des Modus "rückbaufähig" werden mit Hilfe der Schlüsseldatei wieder durch die
// ursprüngliche Schreibweise ersetzt. Nur exakte Platzhalter werden ersetzt; veränderte, getrennte und
// unbekannte Platzhalter werden gemeldet, nie geraten.
import { KEY_FORMAT, findPlaceholderLike } from './reversible.js';

// Exakte Platzhalter (Endung wie "s" bleibt im Text stehen und gehört nicht zum Platzhalter)
const NAME_RE = /(^|[^\p{L}\p{N}])((?:Vorname|Nachname|Initiale|Name) [A-Z]{1,3}\d*)(?=(?:'s|’s|'|’|s|es|ns|n)?(?![\p{L}\p{N}]))/gu;
// Version 2.3: mit Einrichtungen. Nur für Schlüssel MIT Einrichtung verwendet, damit ältere Schlüssel genau wie bisher
// arbeiten (sonst würde z. B. „Einrichtung B“ im Text plötzlich als unbekannter Platzhalter gemeldet).
const NAME_ORG_RE = /(^|[^\p{L}\p{N}])((?:Vorname|Nachname|Initiale|Name|Einrichtung) [A-Z]{1,3}\d*)(?=(?:'s|’s|'|’|s|es|ns|n)?(?![\p{L}\p{N}]))/gu;
const CONTACT_RE = /\[(?:E-MAIL|TELEFON|IBAN|ADRESSE)-\d+\]/g;
// Version 2.7.0: mit Webadressen und Konten. Nur für Schlüssel MIT diesen Arten verwendet, damit ältere Schlüssel genau
// wie bisher arbeiten (wie bei den Einrichtungen seit 2.3)
const CONTACT_WEB_RE = /\[(?:E-MAIL|TELEFON|IBAN|ADRESSE|WEBADRESSE|KONTO)-\d+\]/g;
// Version 2.10.0: mit Datum und Angabe. Nur für Schlüssel MIT diesen Arten (Format-Version 3)
const CONTACT_COL_RE = /\[(?:E-MAIL|TELEFON|IBAN|ADRESSE|WEBADRESSE|KONTO|DATUM|ANGABE)-\d+\]/g;
const contactRe = (key) => (key.hasCol ? CONTACT_COL_RE : key.hasWeb ? CONTACT_WEB_RE : CONTACT_RE);
// Veränderte Formen (Kleinschreibung, Genitiv, Bindestrich, ohne Leerzeichen, Zeilenumbruch dazwischen)
const LOOSE_NAME_RE = /(^|[^\p{L}\p{N}])(vorname|nachname|initiale|name)(ns|s|n)?([\s -]*)([a-z]{1,3})(\d*)(?![\p{L}\p{N}])/giu;
const LOOSE_NAME_ORG_RE = /(^|[^\p{L}\p{N}])(vorname|nachname|initiale|name|einrichtung)(ns|s|n|en)?([\s -]*)([a-z]{1,3})(\d*)(?![\p{L}\p{N}])/giu;
const nameRe = (key) => (key.hasOrg ? NAME_ORG_RE : NAME_RE);
const LOOSE_CONTACT_RE = /\[?\s*(e-?mail|telefon|iban|adresse)\s*[-–_ ]?\s*(\d+)\s*\]?/giu;
const LOOSE_CONTACT_WEB_RE = /\[?\s*(e-?mail|telefon|iban|webadresse|web-adresse|adresse|konto)\s*[-–_ ]?\s*(\d+)\s*\]?/giu;
const LOOSE_CONTACT_COL_RE = /\[?\s*(e-?mail|telefon|iban|webadresse|web-adresse|adresse|konto|datum|angabe)\s*[-–_ ]?\s*(\d+)\s*\]?/giu;

// Schlüsseldatei lesen. Liefert {ok:true, key} oder {ok:false, error}
export function parseKeyFile(text) {
  const t = (text || '').replace(/^﻿/, '').trim();
  if (!t) return { ok: false, error: 'Die Schlüsseldatei ist leer.' };
  if (/^(VERTRAULICH|"?Pseudonym"?;)/.test(t) || /"Pseudonym";"Klarname/.test(t)) {
    return { ok: false, error: 'Das ist die alte Zuordnungstabelle (zuordnung_VERTRAULICH.csv). Sie reicht für einen Rückbau NICHT: Sie enthält nicht, welche Schreibweise an welcher Stelle stand. Ein Rückbau ist nur mit einer Rückbau-Schlüsseldatei aus dem Modus „rückbaufähig“ möglich.' };
  }
  let data;
  try { data = JSON.parse(t); } catch { return { ok: false, error: 'Die Datei ist keine Rückbau-Schlüsseldatei (kein gültiges JSON).' }; }
  if (!data || data.format !== KEY_FORMAT) {
    if (data && Array.isArray(data.names)) return { ok: false, error: 'Das ist eine Merkliste („Eigene Namen“), keine Rückbau-Schlüsseldatei.' };
    return { ok: false, error: 'Die Datei ist keine Rückbau-Schlüsseldatei des Anonymisierers.' };
  }
  if (data.formatVersion !== 1 && data.formatVersion !== 2 && data.formatVersion !== 3) return { ok: false, error: `Unbekannte Version der Schlüsseldatei (${data.formatVersion}). Bitte eine neuere Version des Tools verwenden.` };
  const entries = new Map();
  for (const e of data.platzhalter || []) {
    if (!e || typeof e.platzhalter !== 'string' || typeof e.wert !== 'string') return { ok: false, error: 'Die Schlüsseldatei ist beschädigt (Eintrag ohne Platzhalter oder Wert).' };
    if (entries.has(e.platzhalter)) return { ok: false, error: `Die Schlüsseldatei ist beschädigt (Platzhalter „${e.platzhalter}“ doppelt).` };
    // Version 2.10.0: Zelltyp und Wert einer Zahl- oder Datumszelle (Excel)
    const zelle = e.zelle && typeof e.zelle === 'object' && typeof e.zelle.v === 'string' ? { t: typeof e.zelle.t === 'string' ? e.zelle.t : null, v: e.zelle.v } : null;
    entries.set(e.platzhalter, { wert: e.wert, anzahl: Number(e.anzahl) || 0, kategorie: e.kategorie || '', ...(zelle ? { zelle } : {}) });
  }
  if (!entries.size) return { ok: false, error: 'Die Schlüsseldatei enthält keine Platzhalter.' };
  const hasOrg = [...entries.keys()].some((ph) => /^Einrichtung [A-Z]{1,3}\d*$/.test(ph));
  const hasWeb = [...entries.keys()].some((ph) => /^\[(?:WEBADRESSE|KONTO)-\d+\]$/.test(ph));
  // Version 2.10.0: Datum und Angabe (Format-Version 3)
  const hasCol = data.formatVersion === 3 || [...entries.keys()].some((ph) => /^\[(?:DATUM|ANGABE)-\d+\]$/.test(ph));
  // Version 2.3.4 (Zusatzfeld): Wörter, die schon im Original wie ein Platzhalter aussahen -> bleiben unberührt
  const original = new Map();
  for (const x of Array.isArray(data.imOriginal) ? data.imOriginal : []) {
    if (x && typeof x.text === 'string' && !entries.has(x.text)) original.set(x.text, Number(x.anzahl) || 0);
  }
  return { ok: true, key: { entries, hasOrg, hasWeb: hasWeb || hasCol, hasCol, original, toolVersion: data.toolVersion || '?', kind: data.quelle && data.quelle.dateityp } };
}

const ctx = (text, s, e) => text.slice(Math.max(0, s - 25), Math.min(text.length, e + 25)).replace(/\s+/g, ' ');

// Steht an dieser Stelle ein Wort aus dem Original, das nur wie ein Platzhalter aussieht (Schlüssel ab 2.3.4)?
function isOriginal(key, text, s, e) {
  if (!key.original || !key.original.size) return false;
  return findPlaceholderLike(text).some((x) => x.s <= s && x.e >= e && key.original.has(x.text));
}

// Untersucht eine Texteinheit. Liefert Ersetzungen und Auffälligkeiten.
export function scanUnit(text, key, where) {
  const reps = [];
  const found = [];
  const issues = [];
  const taken = [];
  for (const m of text.matchAll(nameRe(key))) {
    const s = m.index + m[1].length;
    const ph = m[2];
    const e = s + ph.length;
    taken.push([s, e]);
    if (key.entries.has(ph)) { reps.push({ s, e, text: key.entries.get(ph).wert }); found.push(ph); }
    else if (!isOriginal(key, text, s, e)) issues.push({ art: 'unbekannt', text: ph, where, kontext: ctx(text, s, e) });
  }
  for (const m of text.matchAll(contactRe(key))) {
    const s = m.index;
    const e = s + m[0].length;
    taken.push([s, e]);
    if (key.entries.has(m[0])) { reps.push({ s, e, text: key.entries.get(m[0]).wert }); found.push(m[0]); }
    else if (!isOriginal(key, text, s, e)) issues.push({ art: 'unbekannt', text: m[0], where, kontext: ctx(text, s, e) });
  }
  const free = (s, e) => !taken.some(([a, b]) => s < b && e > a);
  for (const m of text.matchAll(key.hasOrg ? LOOSE_NAME_ORG_RE : LOOSE_NAME_RE)) {
    const s = m.index + m[1].length;
    const e = m.index + m[0].length;
    if (!free(s, e)) continue;
    const role = m[2].charAt(0).toUpperCase() + m[2].slice(1).toLowerCase();
    const guess = `${role} ${m[5].toUpperCase()}${m[6]}`;
    if (!key.entries.has(guess)) continue; // nur melden, wenn ein passender Platzhalter existiert
    const art = /[\n\r]/.test(m[4]) ? 'getrennt' : m[3] ? 'gebeugt' : 'verändert';
    issues.push({ art, text: m[0].slice(m[1].length), vermutlich: guess, where, kontext: ctx(text, s, e) });
    taken.push([s, e]);
  }
  for (const m of text.matchAll(key.hasCol ? LOOSE_CONTACT_COL_RE : key.hasWeb ? LOOSE_CONTACT_WEB_RE : LOOSE_CONTACT_RE)) {
    const s = m.index;
    const e = s + m[0].length;
    if (!free(s, e)) continue;
    const base = { 'e-mail': 'E-MAIL', email: 'E-MAIL', telefon: 'TELEFON', iban: 'IBAN', adresse: 'ADRESSE', webadresse: 'WEBADRESSE', 'web-adresse': 'WEBADRESSE', konto: 'KONTO', datum: 'DATUM', angabe: 'ANGABE' }[m[1].toLowerCase()];
    const guess = `[${base}-${m[2]}]`;
    // Version 2.7.0: die neuen Arten auch ohne Klammer, wenn Bindestrich/Unterstrich direkt vor der Nummer steht
    // („Konto-1“, „Webadresse_2“) und das Wort allein steht (nicht „Bankkonto-1“)
    const bare = key.hasWeb && (base === 'WEBADRESSE' || base === 'KONTO') && /^[\p{L}-]+[-–_]\d+$/u.test(m[0].trim()) && !/[\p{L}\p{N}]/u.test(text.charAt(s + m[0].search(/\S/) - 1)) && !/[\p{L}\p{N}]/u.test(text.charAt(e));
    if (!key.entries.has(guess) || !(/[[\]]/.test(m[0]) || bare)) continue;
    issues.push({ art: 'verändert', text: m[0], vermutlich: guess, where, kontext: ctx(text, s, e) });
  }
  return { reps, found, issues };
}

// Version 2.3.3: Sicherheitsnetz nach dem Rückbau. Alles, was wie ein Platzhalter des Tools aussieht, gilt als Rest
// (Suchmuster seit 2.3.4 in reversible.js, findPlaceholderLike). Wörter, die laut Schlüssel schon im Original standen,
// zählt planRestore getrennt (Version 2.3.4).
export function findPlaceholderRests(text) {
  return findPlaceholderLike(text).map((x) => ({ ...x, kontext: ctx(text, x.s, x.e) }));
}
function applyReps(text, reps) {
  let out = '';
  let pos = 0;
  for (const x of [...reps].sort((a, b) => a.s - b.s)) { if (x.s < pos) continue; out += text.slice(pos, x.s) + x.text; pos = x.e; }
  return out + text.slice(pos);
}

// Platzhalter über Einheitsgrenzen getrennt ("Nachname" am Zeilenende, "A" am Anfang der nächsten)
function splitAcrossUnits(units, key) {
  const issues = [];
  for (let i = 0; i + 1 < units.length; i++) {
    const a = units[i].text.match(key.hasOrg ? /(Vorname|Nachname|Initiale|Name|Einrichtung)\s*$/ : /(Vorname|Nachname|Initiale|Name)\s*$/);
    const b = units[i + 1].text.match(/^\s*([A-Z]{1,3}\d*)(?![\p{L}\p{N}])/u);
    if (a && b && key.entries.has(`${a[1]} ${b[1]}`)) {
      issues.push({ art: 'getrennt', text: `${a[1]} | ${b[1]}`, vermutlich: `${a[1]} ${b[1]}`, where: units[i].label || `Abschnitt ${i + 1}`, kontext: units[i].text.slice(-30) + ' ⏎ ' + units[i + 1].text.slice(0, 30) });
    }
  }
  return issues;
}

// Gesamtprüfung: Ersetzungen je Einheit, Zählung je Platzhalter, Auffälligkeiten, Schlüssel-Plausibilität
export function planRestore(units, key) {
  const repsPerUnit = [];
  const foundCount = new Map();
  const issues = [];
  units.forEach((u, i) => {
    const r = scanUnit(u.text, key, u.label || `Abschnitt ${i + 1}`);
    repsPerUnit.push(r.reps);
    for (const ph of r.found) foundCount.set(ph, (foundCount.get(ph) || 0) + 1);
    issues.push(...r.issues);
  });
  issues.push(...splitAcrossUnits(units, key));
  const rows = [];
  for (const [ph, e] of key.entries) {
    const got = foundCount.get(ph) || 0;
    rows.push({ platzhalter: ph, kategorie: e.kategorie, erwartet: e.anzahl, gefunden: got, status: got === e.anzahl ? 'ok' : got < e.anzahl ? 'weniger' : 'mehr' });
  }
  const totalFound = [...foundCount.values()].reduce((a, b) => a + b, 0);
  const matchedKeys = foundCount.size;
  const unknown = issues.filter((x) => x.art === 'unbekannt').length;
  // Plausibilität: Bei der richtigen Schlüsseldatei stimmt für die meisten Platzhalter die Anzahl
  // (Korrekturen ändern nur wenige Stellen). Platzhalternamen allein reichen nicht, weil "Nachname A"
  // in jeder Datei vorkommen kann.
  const okRows = rows.filter((r) => r.status === 'ok').length;
  let verdict = 'passend';
  if (!totalFound) verdict = 'falsch';
  else if (matchedKeys < key.entries.size / 2 || okRows < key.entries.size / 2 || unknown > totalFound / 5) verdict = 'zweifelhaft';
  const anomalies = issues.length + rows.filter((r) => r.status !== 'ok').length;
  // Sicherheitsnetz (2.3.3): Reste im Ergebnis nach dem Rückbau, je Abschnitt mit Fundstelle
  const rests = [];
  // Version 2.3.4: Wörter aus dem Original (laut Schlüssel) sind keine Reste; sie werden gezählt (Anzahl wie erwartet?)
  const origFound = new Map();
  units.forEach((u, i) => {
    for (const r of findPlaceholderRests(applyReps(u.text, repsPerUnit[i]))) {
      if (key.original && key.original.has(r.text)) { origFound.set(r.text, (origFound.get(r.text) || 0) + 1); continue; }
      rests.push({ ...r, unit: i, where: u.label || `Abschnitt ${i + 1}` });
    }
  });
  const originals = [...(key.original || new Map())].map(([text, erwartet]) => ({ text, erwartet, gefunden: origFound.get(text) || 0 }));
  return { repsPerUnit, rows, issues, rests, originals, totalFound, matchedKeys, okRows, unknown, verdict, needsConfirm: anomalies > 0 || verdict !== 'passend' };
}

// Ersetzt exakte Platzhalter in beliebigem Text (für Alternativtexte, Feldfunktionen, Verweise)
export function makeRestoreString(key) {
  return (str) => {
    if (!str || !/[A-Z[]/.test(str)) return str;
    const r = scanUnit(str, key, '');
    if (!r.reps.length) return str;
    let out = '';
    let pos = 0;
    for (const x of r.reps.sort((a, b) => a.s - b.s)) { out += str.slice(pos, x.s) + x.text; pos = x.e; }
    return out + str.slice(pos);
  };
}

// Schlusscheck: steht noch ein Platzhalter aus der Schlüsseldatei im Ergebnis?
export function findLeftovers(key, texts) {
  const left = [];
  for (const { where, text } of texts) {
    for (const m of text.matchAll(nameRe(key))) if (key.entries.has(m[2])) left.push({ where, text: m[2], kontext: ctx(text, m.index, m.index + m[0].length) });
    for (const m of text.matchAll(contactRe(key))) if (key.entries.has(m[0])) left.push({ where, text: m[0], kontext: ctx(text, m.index, m.index + m[0].length) });
  }
  return left;
}
