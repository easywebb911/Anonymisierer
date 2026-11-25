// Oberfläche des Anonymisierers (Version 2: geführte Bedienung, ein Bildschirm pro Schritt).
// Kein Netzwerk, kein Speichern ohne ausdrücklichen Schalter. Erkennung, Ersetzung, Export, Bereinigung,
// Schlusscheck und Rückbau kommen unverändert aus src/core und src/formats.
import './lockdown.js';
import JSZip from 'jszip';
import {
  analyze, defaultState, replacementsByUnit, applyReplacements, leakForms, findLeaks, makeGenericReplacer,
  metaLeakForms, makeNameTest, orgLeakPhrases, orgTermTokens, orgCoverageLeaks, columnPlan, columnKeyOf, COL_KIND_LABEL,
  isPerCellColumn,
} from '../core/detect.js';
import { fold } from '../core/fold.js';
import { readTxt, writeTxt, readCsv, writeCsv, encodeText, encodeTextPlain } from '../formats/text.js';
import { collectLinkTexts } from '../formats/links.js';
import { findContacts } from '../core/patterns.js';
import { MODE_REVERSIBLE, buildRestoreKey } from '../core/reversible.js';
import { parseKeyFile, planRestore, makeRestoreString, findLeftovers, findPlaceholderRests } from '../core/restore.js';
import { readDocx, writeDocx, buildDocx } from '../formats/docx.js';
import { readXlsx, writeXlsx } from '../formats/xlsx.js';
import { collectZipTexts } from '../formats/xmlutil.js';
import { partIndex } from '../formats/parts.js';
import { describePart, readKennungProperty } from '../formats/meta.js';
import { listImages, getImageBytes } from '../formats/images.js';
import { newKennung, isKennung, kennungFromFileName } from './kennung.js';
import { readPdf } from '../formats/pdf.js';
import pako from 'pako';
import { makeDict, isKnown, restWords } from '../core/restwoerter.js';

const MAX_BYTES = 20 * 1024 * 1024;
const WARN_BYTES = 5 * 1024 * 1024;
const STORE_KEY = 'anonymisierer.merkliste.v1';
// eslint-disable-next-line no-undef
const VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'dev';

const $ = (sel) => document.querySelector(sel);
// Hinweis nach dem Speichern: Word/Excel tragen beim Speichern den Namen des Benutzers wieder in die Datei ein
const SAVE_HINT_WORD = 'Lade die Datei direkt hoch. Wenn du sie vorher in Word öffnest und speicherst, trägt Word deinen Namen wieder ein.';
const SAVE_HINT_EXCEL = 'Lade die Datei direkt hoch. Wenn du sie vorher in Excel öffnest und speicherst, trägt Excel deinen Namen wieder ein.';
// Hinweis für die KI, passend zum Modus
const KI_HINT = {
  reversible: 'Der Text enthält Platzhalter wie „Vorname A“, „Nachname A“, „Name A“, „Initiale A.“, „Einrichtung A“, „[E-MAIL-1]“, „[WEBADRESSE-1]“ und „[KONTO-1]“. Diese Platzhalter bitte nie verändern, nicht beugen, nicht übersetzen und nicht trennen. Zeige mir nur die Fehler, schreibe den Text nicht neu.',
  person: 'Der Text enthält Platzhalter wie „Person A“, „Einrichtung A“, „[E-MAIL]“, „[WEBADRESSE]“ und „[KONTO]“ anstelle echter Namen, Einrichtungen, Kontaktdaten, Webadressen und Konten. Diese Platzhalter bitte unverändert lassen. Zeige mir nur die Fehler, schreibe den Text nicht neu.',
  name: 'Der Text enthält Platzhalter wie „[NAME]“, „[EINRICHTUNG]“, „[E-MAIL]“, „[WEBADRESSE]“ und „[KONTO]“ anstelle echter Namen, Einrichtungen, Kontaktdaten, Webadressen und Konten. Diese Platzhalter bitte unverändert lassen. Zeige mir nur die Fehler, schreibe den Text nicht neu.',
};
// Version 2.10.0: Zusatz, wenn Tabellenspalten ganz ersetzt sind (Datum und Angabe; der Inhalt fehlt der KI)
const KI_HINT_COLS = {
  reversible: ' Ganze Tabellenzellen stehen als „[DATUM-1]“ oder „[ANGABE-1]“ da; ihren Inhalt kennst du nicht, bitte nicht raten und nicht verändern.',
  person: ' Ganze Tabellenzellen stehen als „[DATUM]“ oder „[ANGABE]“ da; ihren Inhalt kennst du nicht, bitte nicht raten.',
  name: ' Ganze Tabellenzellen stehen als „[DATUM]“ oder „[ANGABE]“ da; ihren Inhalt kennst du nicht, bitte nicht raten.',
};
// Version 2.11.1: Zusatz im Modus „rückbaufähig“, wenn eine heikle Spalte eigene Nummern je Zelle hat
const KI_HINT_PERCELL = ' In manchen Spalten hat jede Zelle eine eigene Nummer; verschiedene Nummern sagen dort nichts darüber, ob die Inhalte gleich oder verschieden sind.';

function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === undefined || v === null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'text') el.textContent = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of kids.flat()) if (c !== null && c !== undefined && c !== false) el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  return el;
}
// Version 2.7.0: Inhalt eines Elements ersetzen; leere Werte (null, undefined, false) fallen weg, statt als Text
// „null“/„undefined“ zu erscheinen (vorher stand z. B. „null“ in der Fragekarte, wenn kein Einstellungs-Hinweis da war)
function fill(el, ...kids) {
  el.replaceChildren(...kids.flat().filter((c) => c !== null && c !== undefined && c !== false));
  return el;
}
// Eingebettete Symbole (SVG, keine Bilddateien, keine Emojis)
const SVG_NS = 'http://www.w3.org/2000/svg';
const ICONS = {
  check: 'M4 12.5l5 5L20 6.5',
  alert: 'M12 6v8M12 17.5v.5',
  dots: null,
};
function icon(name) {
  const s = document.createElementNS(SVG_NS, 'svg');
  s.setAttribute('viewBox', '0 0 24 24');
  s.setAttribute('aria-hidden', 'true');
  s.setAttribute('focusable', 'false');
  if (name === 'dots') {
    for (const cx of [5, 12, 19]) {
      const c = document.createElementNS(SVG_NS, 'circle');
      c.setAttribute('cx', cx); c.setAttribute('cy', 12); c.setAttribute('r', 2); c.setAttribute('fill', 'currentColor');
      s.append(c);
    }
    return s;
  }
  const p = document.createElementNS(SVG_NS, 'path');
  p.setAttribute('d', ICONS[name]);
  p.setAttribute('fill', 'none');
  p.setAttribute('stroke', 'currentColor');
  p.setAttribute('stroke-width', '3');
  p.setAttribute('stroke-linecap', 'round');
  p.setAttribute('stroke-linejoin', 'round');
  s.append(p);
  return s;
}

const app = {
  doc: null, // {kind, units, warnings, bytes, name, info, raw, metaNames}
  state: defaultState(),
  result: null,
  persist: false,
  screen: 'start',
  modeChosen: false,
  answers: new Map(), // Frage-Kennung -> 'ja' | 'nein'
  // Version 2.6.1: Antworten änderbar. Je Antwort: Reihenfolge und was sie verändert hat (zum genauen Zurücknehmen).
  answerLog: new Map(), // Frage-Kennung -> {seq, hits: [{key, had, val, set}], meta: {...} | null}
  answerSeq: 0,
  qCurrent: null, // Kennung der gezeigten Frage; null = erste offene; '' = „Alle Fragen beantwortet“
  qShown: undefined, // zuletzt gezeigte Frage (zum Rollen nur bei einem Wechsel)
  restSel: null, // Version 2.9.0: gewähltes Wort der Sammelfrage (Schlüssel)
  qNote: false, // Hinweis „Du hast eine Einstellung geändert …“ (bis zur nächsten Antwort)
  inAnswer: false, // während eine Antwort angewendet oder zurückgenommen wird (keine Listen-Regel)
  listSig: undefined, // Stand der Listen bei der letzten Berechnung (Listen-Regel)
  openMenu: null, // Personenliste: offenes Menü (Personen-Schlüssel)
  preview: null, // Schlusscheck-Vorschau auf dem Speichern-Bildschirm {stamp, format, out, leaks, busy}
  saved: null, // {name}
  keyStamp: undefined,
  stamp: 0,
  kennung: null, // Modus rückbaufähig: Zufallskennung des geladenen Dokuments
  keyKennung: null, // Kennung der zuletzt gespeicherten Schlüsseldatei
  imagesOpen: false, // Bilderliste aufgeklappt
  imagesSeen: false, // Bilderliste wurde mindestens einmal geöffnet (Voraussetzung für das Abhaken)
  imageUrls: new Map(), // Bild-Nr. -> blob:-Adresse der Vorschau (nur im Arbeitsspeicher, verworfen bei „Nächstes Dokument“)
  ackSig: null, // Version 2.5.0: EIN Häkchen „Ich habe alle Punkte gesehen …“ (gilt nur für genau diesen Stand der Punkte)
  sheetTab: 0, // Excel: gezeigtes Blatt in der Prüfansicht
  addedSinceLoad: false, // Hinweis „Diese Liste gilt nur, bis du die Seite schließt …“
  imageBig: new Set(), // Bild-Nr. groß angezeigt
  colConfirmed: false, // Version 2.10.0: Spalten-Übersicht mit „So übernehmen“ bestätigt (je Dokument)
  colSeq: 0, // Version 2.10.0: laufende Nummer beim Neulesen (Excel) nach einer Änderung der Spalten
};

// ---------- Speicher (nur auf ausdrücklichen Wunsch) ----------
function storeGet() { try { return window.localStorage.getItem(STORE_KEY); } catch { return null; } }
function storeSet(v) { try { window.localStorage.setItem(STORE_KEY, v); return true; } catch { return false; } }
function storeDel() { try { window.localStorage.removeItem(STORE_KEY); } catch { /* nichts */ } }
function loadStored() {
  const raw = storeGet();
  if (!raw) return;
  try {
    const d = JSON.parse(raw);
    app.state.manualTerms = Array.isArray(d.names) ? d.names.filter((x) => typeof x === 'string') : [];
    // Version 2.3: Einrichtungen getrennt gemerkt; ältere Merklisten ohne dieses Feld enthalten nur Personen
    app.state.orgTerms = Array.isArray(d.einrichtungen) ? d.einrichtungen.filter((x) => typeof x === 'string') : [];
    app.state.exceptions = Array.isArray(d.exceptions) ? d.exceptions.filter((x) => typeof x === 'string') : [];
    // Version 2.10.0: gemerkte Wahl je Spaltenüberschrift (nur die Überschrift, nie Inhalte)
    app.state.colMemory = colMemoryFrom(d.spalten);
    app.persist = true;
  } catch { storeDel(); }
}
function saveStored() {
  if (!app.persist) return;
  storeSet(JSON.stringify(listData()));
}

// Merkliste (Datei und Browser-Speicher): Personen in „names“ wie bisher, Einrichtungen in „einrichtungen“
function listData(extra) {
  const d = { ...(extra || {}), names: app.state.manualTerms };
  if (app.state.orgTerms.length) d.einrichtungen = app.state.orgTerms;
  d.exceptions = app.state.exceptions;
  // Version 2.10.0: Wahl je Spaltenüberschrift (nur wenn es eine gibt; ältere Merklisten ohne dieses Feld bleiben gleich)
  if (Object.keys(app.state.colMemory || {}).length) d.spalten = app.state.colMemory;
  return d;
}
function colMemoryFrom(v) {
  const out = {};
  if (v && typeof v === 'object' && !Array.isArray(v)) for (const [k, t] of Object.entries(v)) if (typeof k === 'string' && (t === 'name' || t === 'ganz' || t === 'bisher')) out[k] = t;
  return out;
}

// ---------- Datei erkennen und lesen ----------
function startsWith(bytes, arr) { return arr.every((b, i) => bytes[i] === b); }
async function sniff(bytes, name) {
  const lower = (name || '').toLowerCase();
  const head = new TextDecoder('latin1').decode(bytes.subarray(0, 1024));
  if (head.includes('%PDF-')) return 'pdf';
  if (startsWith(bytes, [0xd0, 0xcf, 0x11, 0xe0])) {
    throw new Error('Altes Office-Format (.doc/.xls) oder verschlüsselte/passwortgeschützte Datei. Das wird nicht unterstützt. Bitte in Word/Excel als .docx bzw. .xlsx (ohne Passwort) speichern.');
  }
  if (startsWith(bytes, [0x50, 0x4b, 0x03, 0x04])) {
    let zip;
    try { zip = await JSZip.loadAsync(bytes); } catch { throw new Error('Die Datei ist beschädigt oder kein unterstütztes Format.'); }
    if (zip.file('word/document.xml')) return 'docx';
    if (zip.file('xl/workbook.xml') || zip.file('xl/workbook.bin')) return 'xlsx';
    // Version 2.4.1: Hauptteil an ungewöhnlicher Stelle über die Paket-Beziehung und den Inhaltstyp erkennen
    const idx = await partIndex(zip);
    const mct = idx.main ? idx.ct(idx.main) : '';
    if (/wordprocessingml\.(document|template)\.main\+xml$/.test(mct)) return 'docx';
    if (/spreadsheetml\.(sheet|template)\.main\+xml$|ms-excel\.sheet\.binary/.test(mct)) return 'xlsx';
    if (zip.file('ppt/presentation.xml')) throw new Error('PowerPoint-Dateien werden nicht unterstützt.');
    if (zip.file('content.xml')) throw new Error('OpenDocument-Dateien (.odt/.ods) werden nicht unterstützt. Bitte als .docx/.xlsx speichern.');
    throw new Error('Unbekanntes ZIP-Format. Unterstützt: .txt, .pdf, .docx, .xlsx, .csv');
  }
  if (head.startsWith('{\\rtf')) throw new Error('RTF-Dateien werden nicht unterstützt. Bitte als .docx oder .txt speichern.');
  if (/\.(doc|xls|ppt|pptx|odt|ods|rtf|pages|numbers)$/.test(lower)) throw new Error('Dieses Format wird nicht unterstützt. Unterstützt: .txt, .pdf, .docx, .xlsx, .csv');
  // Binärdaten?
  const sample = bytes.subarray(0, 4096);
  let ctrl = 0;
  for (const b of sample) if (b < 9 || (b > 13 && b < 32)) ctrl++;
  if (sample.length && ctrl / sample.length > 0.05 && !(sample[0] === 0xff || sample[0] === 0xfe)) throw new Error('Die Datei ist keine Textdatei und kein unterstütztes Format.');
  if (lower.endsWith('.csv') || lower.endsWith('.tsv')) return 'csv';
  return 'txt';
}

async function loadBytes(bytes, name, treat = null) {
  if (bytes.length > MAX_BYTES) throw new Error(`Die Datei ist zu groß (${(bytes.length / 1048576).toFixed(1)} MB). Grenze: ${MAX_BYTES / 1048576} MB.`);
  const kind = await sniff(bytes, name);
  let doc;
  if (kind === 'txt') doc = readTxt(bytes);
  else if (kind === 'csv') doc = readCsv(bytes);
  else if (kind === 'docx') doc = await readDocx(bytes);
  else if (kind === 'xlsx') doc = await readXlsx(bytes, { treat });
  else if (kind === 'pdf') doc = await readPdf(bytes);
  // row/cell nur für die Anzeige (Tabellenzeilen als Zeilen); die Erkennung nutzt nur text/label/follows/heading
  // fixed: Stellen fester Zeichen der Vorlage (z. B. Zeilenumbruch in Word), die beim Ersetzen stehen bleiben
  // TXT (2.3): joinNext/eol – Einrichtungen dürfen über genau einen Zeilenumbruch gehen (nur markierte Einrichtungen)
  const units = doc.units.map((u, i) => ({ text: u.text, label: u.label || '', follows: !!u.follows, heading: !!u.heading,
    row: u.row !== undefined ? (u.part || '') + '#' + u.row : null, cell: u.cell,
    // Version 2.6.0: Lage in Tabellen (Namensspalten) und linke Nachbarzellen in Excel (Anrede in der Nachbarzelle)
    ...(u.tcells ? { tcells: u.tcells } : {}), ...(u.leftUnits ? { leftUnits: u.leftUnits } : {}),
    // Version 2.10.0: Zahl-/Datumszelle (Zelltyp und Wert), Formelergebnis, Grenzen der Textläufe (gemischte Formatierung)
    ...(u.cellOrig ? { cellOrig: u.cellOrig } : {}), ...(u.formula ? { formula: true } : {}), ...segBoundsOf(u),
    ...(kind === 'txt' ? { joinNext: i + 1 < doc.units.length, eol: doc.eols[i] || '\n' } : {}),
    fixed: u.segments && u.segments.some((sg) => !sg.writable) ? u.segments.filter((sg) => !sg.writable).map((sg) => sg.start) : null }));
  const warnings = [...(doc.warnings || [])];
  if (bytes.length > WARN_BYTES) warnings.push(`Große Datei (${(bytes.length / 1048576).toFixed(1)} MB): Auf dem iPhone kann die Verarbeitung langsam sein oder abbrechen.`);
  // Bilder (nur Word/Excel): Liste mit Fundort, Typ und Beschreibung; Bildinhalte werden erst beim Ansehen gelesen
  const images = doc.imageCtx ? await listImages(kind, doc.zip, doc.docs, doc.imageCtx) : [];
  // Version 2.7.0: Link-Ziele, Link-Hinweise, Feldfunktionen (Word/Excel) für exakte Nummern im Modus „rückbaufähig“
  const linkTexts = doc.zip ? await collectLinkTexts(doc.zip, doc.docs) : [];
  return { kind, units, warnings, bytes, info: doc.info || '', raw: doc, metaNames: doc.metaNames || [], images, linkTexts, treat, treatKey: treatKeyOf(treat) };
}
function segBoundsOf(u) {
  const w = (u.segments || []).filter((sg) => sg.writable && sg.text);
  return w.length > 1 ? { segBounds: w.slice(1).map((sg) => sg.start) } : {};
}
// ---------- Version 2.10.0: Spalten behandeln ----------
// Excel: Spalten mit Behandlung „Name“ oder „ganz ersetzen“ -> Map(Blatt -> Map(Spalte -> Kopfzeile)) zum Lesen
function treatMapOf(plan) {
  const m = new Map();
  for (const c of plan) {
    if (!c.t.startsWith('x|')) continue;
    // Version 2.11.0: lesbare Spalte mit seltenen Werten -> nur diese Zellen
    const rows = c.treat === 'bisher' ? (c.rareRows && c.rareRows.size ? c.rareRows : null) : null;
    if (c.treat === 'bisher' && !rows) continue;
    const sh = c.t.slice(2);
    if (!m.has(sh)) m.set(sh, new Map());
    m.get(sh).set(c.c, { head: c.headerRow, rows });
  }
  return m.size ? m : null;
}
function treatKeyOf(m) { return m ? JSON.stringify([...m].map(([k, v]) => [k, [...v].map(([c, x]) => [c, x.head, x.rows ? [...x.rows].sort((a, b) => a - b) : null])])) : ''; }
// Version 2.11.0: Excel-Zellen ohne Abschnitt (Zahl, Datum) für den Vorschlag je Spalte und die Übersicht
function valueCellsOf(doc) {
  if (!doc || doc.kind !== 'xlsx' || !doc.raw.view) return [];
  const out = [];
  for (const sv of doc.raw.view) {
    for (const cell of sv.cells) {
      if (cell.u !== undefined) continue;
      const m = /^([A-Z]+)(\d+)$/.exec(cell.ref || '');
      if (m) out.push({ t: 'x|' + sv.name, r: Number(m[2]) - 1, c: colNum(m[1]) - 1, value: cell.value, date: !!cell.date, display: cell.display || cell.value });
    }
  }
  return out;
}
function planOf(doc, overrides) { return columnPlan(doc.units, overrides, app.state.colMemory || {}, { valueCells: valueCellsOf(doc), rare: app.state.colRare !== false }); }
function currentPlan(doc) { return planOf(doc || app.doc, app.state.colTreat || {}); }
// Excel: neu lesen, wenn sich die behandelten Spalten geändert haben (gleiche Datei, andere Abschnitte). Höchstens dreimal,
// bis die Spalten zum gelesenen Stand passen.
async function rereadXlsx(doc) {
  let d = doc;
  for (let i = 0; i < 3; i++) {
    const map = treatMapOf(currentPlan(d));
    if (treatKeyOf(map) === d.treatKey) return d;
    const nd = await loadBytes(d.bytes, d.name, map);
    nd.name = d.name;
    d = nd;
  }
  return d;
}
// Spalten in der Übersicht (je Blatt): Überschrift, gefüllte Zellen (auch Zahl- und Datumszellen), Vorschlag, Wahl
function columnRows() {
  const r = app.result;
  return r && r.colPlan ? r.colPlan : [];
}
// Version 2.11.0: Werte einer lesbaren Spalte mit Häufigkeit, häufigste zuerst (höchstens 12, dann „und n weitere“)
function valuesText(c, max = 12) {
  const vs = c.values || [];
  if (!vs.length) return 'keine Werte';
  const shown = vs.slice(0, max).map(([v, n]) => `${v.replace(/\s+/g, ' ')} ${n}`).join(', ');
  return shown + (vs.length > max ? `, und ${vs.length - max} weitere` : '');
}
// lesbare Spalten einer Personen-Tabelle
function readableColumns(t) { return columnRows().filter((c) => c.person && c.treat === 'bisher' && (!t || c.t === t)); }
function needsColumns() { return !!(app.result && app.result.colPlan && app.result.colPlan.length); }
const TREAT_LABEL = { name: 'Name', ganz: 'ganz ersetzen', bisher: 'wie bisher' };
function kindText(c) {
  if (c.treat === 'name') return 'als Person';
  if (c.treat !== 'ganz') return '';
  const k = c.kind || 'info';
  return k === 'org' ? (app.state.settings.mode === 'name' ? 'als [EINRICHTUNG]' : 'als Einrichtung') : 'als ' + COL_KIND_LABEL[k];
}
// Wahl einer Spalte ändern: gilt wie eine Einstellung (Antworten und Umschaltungen fallen weg), Excel wird neu gelesen
async function setColumn(id, val) {
  const col = (app.result.colPlan || []).find((c) => c.id === id);
  if (!col) return;
  app.state.colTreat[id] = val;
  if (app.persist) {
    const k = columnKeyOf(col.header);
    if (val === col.proposal.treat) delete app.state.colMemory[k]; else app.state.colMemory[k] = val;
    saveStored();
  }
  await applyColumns();
}
async function applyColumns() {
  const seq = ++app.colSeq;
  app.state.overrides = {};
  if (app.answers.size) app.qNote = true;
  app.answers = new Map();
  app.answerLog = new Map();
  app.qCurrent = null;
  if (app.doc.kind === 'xlsx') {
    const nd = await rereadXlsx(app.doc);
    if (seq !== app.colSeq) return; // eine neuere Änderung läuft schon
    if (nd !== app.doc) app.doc = nd;
  }
  runAnalysis();
}
function renderColumns() {
  const rows = columnRows();
  const box = $('#qcard');
  const tables = [...new Set(rows.map((c) => c.t))];
  const rowEl = (c) => h('li', { class: 'colrow' + (c.treat !== 'bisher' ? ' rep' : '') + (c.person && c.treat === 'bisher' ? ' lesbar' : ''), 'data-col': c.id },
    h('span', { class: 'colh' }, h('strong', {}, c.header.replace(/\s+/g, ' ')), h('small', {}, `${c.filled} ${c.filled === 1 ? 'Zelle' : 'Zellen'} gefüllt${c.fromMemory ? ' · gemerkte Wahl' : ''}`),
      // Version 2.11.0: lesbare Spalte einer Personen-Tabelle – ihre Werte und die ersetzten seltenen Werte
      c.person && c.treat === 'bisher' ? h('small', { class: 'colvals' }, 'Bleibt lesbar: ' + valuesText(c)) : null,
      c.person && c.treat === 'bisher' && c.rareValues ? h('small', { class: 'colrare' }, `${c.rareValues === 1 ? 'Ein seltener Wert wird' : c.rareValues + ' seltene Werte werden'} ersetzt.`) : null,
      // Version 2.11.1: heikle Spalte im Modus „rückbaufähig“
      isReversible() && isPerCellColumn(c) ? h('small', { class: 'colpercell' }, 'Eigene Nummer je Zelle: Gleiche Inhalte tragen verschiedene Nummern.') : null),
    h('span', { class: 'colsel' },
      h('select', { 'data-col': c.id, 'aria-label': `Behandlung der Spalte ${c.header}`, onchange: (e) => setColumn(c.id, e.target.value) },
        ...['name', 'ganz', 'bisher'].map((v) => { const o = h('option', { value: v }, TREAT_LABEL[v]); if (v === c.treat) o.selected = true; return o; })),
      h('small', { class: 'colkind' }, kindText(c))));
  const kids = [h('p', { class: 'qcount' }, 'Spalten'), h('p', { class: 'qask' }, 'So behandelt das Tool die Spalten.'),
    h('p', { class: 'hint' }, '„Name“: Jede Zelle wird als Person ersetzt. „ganz ersetzen“: Jede Zelle wird ganz durch einen Platzhalter ersetzt. „wie bisher“: Das Tool sucht Namen im Text der Zelle.')];
  const anyPerson = rows.some((c) => c.person);
  if (anyPerson) {
    // Version 2.11.0: Schalter „Seltene Werte“ (Standard an)
    const cb = h('input', { type: 'checkbox', id: 'col-rare', onchange: (e) => { app.state.colRare = e.target.checked; applyColumns(); } });
    cb.checked = app.state.colRare !== false;
    kids.push(h('label', { class: 'check colrareopt' }, cb, ' Seltene Werte (weniger als 3-mal) ersetzen'));
  }
  for (const t of tables) {
    const own = rows.filter((c) => c.t === t);
    const person = own.some((c) => c.person);
    const rep = own.filter((c) => c.treat !== 'bisher');
    const rest = own.filter((c) => c.treat === 'bisher');
    if (tables.length > 1 || t.startsWith('x|') || person) kids.push(h('p', { class: 'grouph' }, (t.startsWith('x|') ? `Blatt „${t.slice(2)}“` : 'Tabelle') + (person ? ' – Personen-Tabelle' : '')));
    if (person) {
      kids.push(h('p', { class: 'hint' }, 'In einer Tabelle mit Namen ersetzt das Tool im Zweifel. Lesbar bleiben nur Spalten mit wenigen, sich wiederholenden Werten. Prüfe sie unten.'));
      if (own[0].smallTable && app.state.colRare !== false) kids.push(h('p', { class: 'hint colsmall' }, 'Diese Tabelle hat weniger als 20 Zeilen. Hier ersetzt das Tool seltene Werte nicht, weil die Regel dort nicht trägt. Bitte prüfe die lesbaren Spalten selbst.'));
    }
    kids.push(h('ul', { class: 'collist' }, ...(rep.length ? rep.map(rowEl) : [h('li', { class: 'muted' }, 'Keine Spalte wird ersetzt.')])));
    if (rest.length && person) {
      // Version 2.11.0: lesbare Spalten einer Personen-Tabelle sind nicht eingeklappt
      kids.push(h('p', { class: 'grouph' }, `Diese ${rest.length === 1 ? 'Spalte bleibt' : rest.length + ' Spalten bleiben'} lesbar`), h('ul', { class: 'collist lesbar' }, ...rest.map(rowEl)));
    } else if (rest.length) {
      // aufgeklappt bleibt aufgeklappt (auch nach einer Änderung)
      const d = h('details', { class: 'colrest', open: !!app.colRestOpen, ontoggle: (e) => { app.colRestOpen = e.target.open; } },
        h('summary', {}, `${rest.length === 1 ? 'Eine Spalte' : rest.length + ' Spalten'} wie bisher`), h('ul', { class: 'collist' }, ...rest.map(rowEl)));
      kids.push(d);
    }
  }
  kids.push(h('p', { class: 'hint' }, 'Ersetzte Spalten kann eine KI danach nicht mehr inhaltlich prüfen.'),
    h('div', { class: 'qbtns' }, h('button', { type: 'button', class: 'primary', id: 'col-ok', onclick: () => { app.colConfirmed = true; app.qShown = undefined; render(); focusA2(); } }, 'So übernehmen')));
  fill(box, ...kids);
}
// Zeile über den Fragen nach dem Bestätigen
function renderColLine() {
  const line = $('#colline');
  if (!line) return;
  if (!needsColumns() || !app.colConfirmed) { line.hidden = true; line.replaceChildren(); return; }
  const n = app.result.colPlan.filter((c) => c.treat !== 'bisher').length;
  line.hidden = false;
  fill(line, h('span', {}, `Spalten: ${n === 1 ? 'eine wird' : n + ' werden'} ersetzt.`), ' ',
    h('button', { type: 'button', class: 'textlink', id: 'col-change', onclick: () => { app.colConfirmed = false; render(); focusA2(); } }, 'Ändern'));
}
// Der geklickte Knopf ist danach weg: Fokus wie beim Öffnen von „Prüfen“ auf die Überschrift (ohne zu rollen)
function focusA2() {
  const h1 = document.querySelector('#scr-a2 h1');
  if (h1) { h1.setAttribute('tabindex', '-1'); h1.focus({ preventScroll: true }); }
}

// ---------- Analyse ----------
function runAnalysis() {
  if (!app.doc) return;
  const qBefore = app.result && !app.inAnswer ? new Set(questions().map((q) => q.id)) : null;
  app.result = analyze(app.doc.units, app.state, { linkTexts: app.doc.linkTexts, valueCells: valueCellsOf(app.doc) });
  // Version 2.6.1 (Entscheidung Easy): Liste geändert (Eigene Namen, Einrichtungen, Ausnahmen) -> Antworten bleiben gültig;
  // ein über „Ja“ bei Dateiangaben übernommener und wieder entfernter Eintrag gilt als „Nein“; Antworten zu Fragen, die
  // dadurch wegfallen, werden verworfen (samt ihrer Wirkung)
  const sig = listSig();
  if (app.listSig !== undefined && sig !== app.listSig && !app.inAnswer && qBefore) applyListRule(qBefore);
  app.listSig = sig;
  changed();
  render();
}
function listSig() { return JSON.stringify([app.state.manualTerms, app.state.orgTerms, app.state.exceptions]); }
function applyListRule(qBefore) {
  for (const [id, rec] of [...app.answerLog]) {
    if (!rec.meta || !rec.meta.added.length) continue;
    const list = rec.meta.org ? app.state.orgTerms : app.state.manualTerms;
    if (rec.meta.added.some((t) => list.some((x) => fold(x) === fold(t)))) continue;
    app.answers.set(id, 'nein');
    app.answerLog.set(id, { seq: rec.seq, hits: [], meta: null });
  }
  const ids = new Set(questions().map((q) => q.id));
  const gone = [...app.answers.keys()].filter((id) => qBefore.has(id) && !ids.has(id)).sort((a, b) => seqOf(b) - seqOf(a));
  for (const id of gone) undoAnswer(id);
  refreshOn();
}
// Jede Änderung der Treffer: Schlusscheck-Bestätigung verfällt, Schlüsseldatei muss neu gespeichert werden
function changed() {
  // Wurde zur aktuellen Kennung schon eine Schlüsseldatei gespeichert, bekommt jeder neue Stand eine neue Kennung.
  // So gibt es nie zwei verschiedene Schlüsseldateien mit derselben Kennung.
  if (app.keyKennung && app.keyKennung === app.kennung) app.kennung = newKennung();
  app.stamp += 1;
  app.preview = null;
  app.saved = null;
}

// ---------- Ausgabe erzeugen (unverändert) ----------
function newUnitTexts() {
  const reps = replacementsByUnit(app.result, app.doc.units);
  return app.doc.units.map((u, i) => applyReplacements(u.text, reps[i]));
}
function plainTextExport() {
  const texts = newUnitTexts();
  const d = app.doc;
  // Beschriftungen können Namen enthalten (z. B. Blattname "Müller!A1") -> ebenfalls ersetzen
  const generic = makeGenericReplacer(app.result, app.state.settings);
  if (d.kind === 'txt') return writeTxt(joinedRaw(d.raw), texts);
  if (d.kind === 'csv') return writeCsv(d.raw, texts);
  if (d.kind === 'pdf') return d.units.map((u, i) => `--- ${u.label} ---\n${texts[i]}`).join('\n\n');
  const main = /^(Text|Tabelle|Textfeld)$/;
  return d.units.map((u, i) => (d.kind === 'docx' && main.test(u.label) ? texts[i] : `[${generic(u.label)}] ${texts[i]}`)).join('\n');
}
function docxSections() {
  const texts = newUnitTexts();
  const d = app.doc;
  if (d.kind === 'pdf') return d.units.map((u, i) => ({ heading: u.label, pageBreak: true, paragraphs: texts[i].split('\n') }));
  if (d.kind === 'csv') return [{ paragraphs: writeCsv(d.raw, texts).split(/\r\n|\n|\r/).map((l) => l.split(d.raw.delim).join('\t')) }];
  return [{ paragraphs: writeTxt(joinedRaw(d.raw), texts).split(/\r\n|\n|\r/) }];
}
// TXT (Version 2.3): Steht eine Einrichtung über einen Zeilenumbruch, werden die beiden Zeilen in der Ausgabe eine
// (der Platzhalter steht für den ganzen Namen samt Umbruch; der Rückbau stellt den Umbruch wieder her)
function joinedRaw(raw) {
  const j = app.result && app.result.joins;
  return j && j.size ? { ...raw, eols: raw.eols.map((e, i) => (j.has(i) ? '' : e)) } : raw;
}
// Suchformen für den Schlusscheck: bestätigte Namen + Namen aus den Original-Metadaten (Dateiangaben)
function checkForms() {
  const forms = leakForms(app.result);
  const meta = metaLeakForms(app.doc.metaNames);
  for (const [k, f] of meta.forms) if (!forms.has(k)) forms.set(k, f);
  // Einrichtungen: jede Schreibweise als ganze Wortfolge
  return { forms, phrases: [...orgLeakPhrases(app.result), ...meta.phrases] };
}
async function buildOutput(format) {
  const d = app.doc;
  const generic = makeGenericReplacer(app.result, app.state.settings);
  const reps = replacementsByUnit(app.result, d.units);
  // SharePoint-Felder: Werte mit einem bestätigten Namen oder einem Namen aus den Dateiangaben werden geleert
  const cf = checkForms();
  const containsName = makeNameTest(cf.forms, cf.phrases);
  // Modus rückbaufähig: Kennung als unsichtbare Eigenschaft in Word/Excel (in den anderen Modi nichts)
  const kennung = isReversible() ? app.kennung : undefined;
  if (format === 'docx' && d.kind === 'docx') return { bytes: await writeDocx(d.bytes, reps, generic, { containsName, kennung }), zip: true };
  if (format === 'xlsx' && d.kind === 'xlsx') {
    const sheetIssues = [];
    const bytes = await writeXlsx(d.bytes, reps, generic, { onSheetName: (x) => sheetIssues.push(x), containsName, kennung, treat: d.treat });
    return { bytes, zip: true, sheetIssues };
  }
  if (format === 'docx') return { bytes: await buildDocx(docxSections(), { kennung }), zip: true };
  if (format === 'csv') return { text: writeCsv(d.raw, newUnitTexts()) };
  return { text: plainTextExport() };
}
// Schlusscheck: ALLE Teile der Ausgabedatei (Text, Eigenschaften, SharePoint-Daten, Bilder …) nach bestätigten
// Namen und nach Namen aus den Original-Metadaten durchsuchen.
// Version 2.5.0: Fundort und Ausschnitt in einfacher Sprache. Zuerst werden die Abschnitte der Ausgabe durchsucht
// (Fundort „Blatt Liste, Zelle B2“, Ausschnitt = sichtbarer Text), danach die ganze Datei; dort zählen nur Funde, die über
// die Abschnitte hinausgehen (je Wort nie weniger als bisher). Stellen, die als Frage offen oder mit „Nein“ entschieden
// sind, erscheinen nicht zusätzlich im Schlusscheck (D.5).
async function finalCheck(out) {
  const { forms, phrases } = checkForms();
  const unitLeaks = [];
  newUnitTexts().forEach((t, ui) => {
    for (const l of findLeaks(forms, [{ where: '', text: t, plain: t }], phrases)) unitLeaks.push({ ...l, unit: ui, where: unitPlace(ui) });
  });
  let texts;
  if (out.zip) texts = await collectZipTexts(await JSZip.loadAsync(out.bytes), { inflatePng: true, userText: true });
  else texts = [{ where: '', text: out.text, plain: out.text }];
  const fileLeaks = [];
  for (const t of texts) {
    for (const l of findLeaks(forms, [t], phrases)) fileLeaks.push({ ...l, where: out.zip ? plainPart(t.where) : 'Text', context: visibleContext(t, l.word, l.context) });
  }
  const keyOf = (l) => (l.org ? 'O|' : 'P|') + fold(l.word);
  const inUnits = new Map();
  for (const l of unitLeaks) inUnits.set(keyOf(l), (inUnits.get(keyOf(l)) || 0) + 1);
  const seen = new Map();
  const extra = fileLeaks.filter((l) => { const k = keyOf(l); const n = (seen.get(k) || 0) + 1; seen.set(k, n); return n > (inUnits.get(k) || 0); });
  // Version 2.11.0: Zellen der Kopfzeile aus reinen Spaltenkopf-Wörtern ersetzt das Tool nie; ein Wort darin ist kein Fund
  const head = (app.result && app.result.headOnly) || new Set();
  const leaks = [...withoutDecided(unitLeaks.filter((l) => !head.has(l.unit))), ...extra];
  // Version 2.3: jede Einrichtung aus der Liste im Originaltext; nicht vollständig ersetzte Fundstellen melden
  const org = orgCheckLeaks();
  if (!org.length) return leaks;
  const norm = (w) => w.replace(/\s+/g, ' ').trim().toLowerCase();
  const have = new Set(org.map((l) => norm(l.word)));
  // dieselbe Stelle nicht doppelt melden (die Suche in der Ausgabe findet sie ggf. auch)
  return [...org, ...leaks.filter((l) => !(l.org && have.has(norm(l.word))))];
}
// D.5: ausgeschaltete Stellen, die als Frage offen oder mit „Nein“ entschieden sind
function decidedOffHits() {
  const list = [];
  for (const q of questions()) {
    const a = answerOf(q);
    if (a === 'ja') continue;
    const hs = q.kind === 'place' ? [q.hit] : q.kind === 'word' || q.kind === 'org' ? (a === 'nein' || !q.hits.length ? q.neinHits : q.hits) : [];
    for (const x of hs) if (!x.on) list.push(x);
  }
  return list;
}
function withoutDecided(unitLeaks) {
  const rest = [...unitLeaks];
  const r = app.result;
  for (const x of decidedOffHits()) {
    // Nachbesserung 2.8.0: eine abgelehnte gefundene Einrichtung gibt ihre Wörter frei (Personen-Erkennung gilt wieder);
    // sie entschuldigt keinen Fund dort
    if (x.released) continue;
    for (const w of r.fullText.slice(x.s, x.e).split(/[^\p{L}\p{M}\p{N}'’-]+/u).filter(Boolean)) {
      const i = rest.findIndex((l) => l.unit === x.unit && !l.org && (fold(l.word) === fold(w) || l.word.split('-').some((p) => fold(p) === fold(w))));
      if (i >= 0) rest.splice(i, 1);
    }
  }
  return rest;
}
// Ausschnitt nur aus sichtbarem Text (Textknoten), ohne Formatwerte
function visibleContext(t, word, fallback) {
  const src = typeof t.plain === 'string' && t.plain.includes(word) ? t.plain : null;
  if (!src) return (fallback || '').replace(/\s+/g, ' ');
  const i = src.indexOf(word);
  return src.slice(Math.max(0, i - 30), Math.min(src.length, i + word.length + 30)).replace(/\s+/g, ' ');
}
// Teil einer Office-Datei in einfacher Sprache (ohne Pfad)
function plainPart(where) {
  const n = where.replace(/ \(binär.*$/, '');
  const rules = [
    [/(^|\/)docProps\/|(^|\/)(core|app|custom)\.xml$/i, 'Dateieigenschaften'], [/customXml\//i, 'Zusatzdaten (SharePoint)'],
    [/\/media\/|\.(jpe?g|png|gif|tiff?|emf|wmf|svg|bmp)$/i, 'Bild (versteckte Bildangaben)'], [/embeddings\//i, 'eingebettetes Objekt'],
    [/threadedComment|comments/i, 'Kommentar'], [/header/i, 'Kopfzeile'], [/footer/i, 'Fußzeile'], [/footnotes/i, 'Fußnote'], [/endnotes/i, 'Endnote'],
    [/people|persons/i, 'Personenliste'], [/sharedStrings|worksheets|sheet/i, 'Tabelle'], [/workbook/i, 'Arbeitsmappe (Blattnamen)'],
    [/drawing|chart|diagram/i, 'Zeichnung oder Diagramm'], [/document\.xml$/i, 'Text'], [/\.rels$/i, 'Verweise in der Datei'],
  ];
  for (const [re, label] of rules) if (re.test(n)) return label;
  return 'weiterer Teil der Datei';
}
// Fundort eines Abschnitts in einfacher Sprache
function unitPlace(ui) {
  const u = app.doc.units[ui];
  const k = app.doc.kind;
  if (k === 'txt') return `Zeile ${ui + 1}`;
  return plainLabel(u.label, k) || `Abschnitt ${ui + 1}`;
}
function plainLabel(label, kind) {
  let l = (label || '').replace(/ \(mit gelöschtem Text aus Änderungsverfolgung\)$/, '');
  const hidden = / \(ausgeblendet\)$/.test(l);
  l = l.replace(/ \(ausgeblendet\)$/, '');
  const hs = hidden ? ' (ausgeblendet)' : '';
  if (/^Bildbeschreibung/.test(l)) return 'Bildbeschreibung';
  if (kind === 'docx') return !l || l === 'Text' ? 'Text' : l === 'Sonstiges' ? 'weiterer Teil' : l;
  if (kind === 'xlsx') {
    let m = l.match(/^(.*)!([A-Z]+\d+)(?: \((Formel|Formelergebnis)\))?$/);
    if (m) return `Blatt ${m[1]}${hs}, Zelle ${m[2]}${m[3] ? ' (' + m[3] + ')' : ''}`;
    m = l.match(/^(.*): (Kopfzeile|Fußzeile)$/);
    if (m) return `${m[2]}, Blatt ${m[1]}${hs}`;
    m = l.match(/^(.*): Gültigkeitsregel\/Formel$/);
    if (m) return `Gültigkeitsregel, Blatt ${m[1]}${hs}`;
    m = l.match(/^Kommentar(?: \(Unterhaltung\))? (\S+)$/);
    if (m) return `Kommentar zu Zelle ${m[1]}`;
    if (l === 'Blattname') return `Name eines Blatts${hs}`;
    if (/^Definierter Name/.test(l)) return 'Name eines Bereichs';
    if (l === 'Gemeinsamer Text (nicht verwendet)') return 'nicht verwendeter Text';
    if (l === 'Textfeld/Form') return 'Textfeld';
    return l;
  }
  return l;
}
function orgCheckLeaks() {
  if (!app.result) return [];
  // Version 2.8.0: gefundene Einrichtungen (mit mindestens einer ersetzten Stelle) gelten wie markierte
  const autoOn = (app.result.autoOrgTerms || []).filter((t) => { const og = app.result.orgs.get(t.entity); return og && og.hits.some((x) => x.on); }).map((t) => t.text);
  const terms = [...app.state.orgTerms, ...autoOn];
  if (!terms.length) return [];
  const k = app.doc.kind;
  const prog = k === 'xlsx' ? 'Excel' : k === 'docx' ? 'Word' : '';
  return orgCoverageLeaks(app.result, terms).map((f) => {
    const t = app.result.fullText;
    const where = f.units.map(unitPlace).filter((x, i, a) => a.indexOf(x) === i).join(' und ');
    let hint;
    if (f.units.length > 1) {
      hint = k === 'docx' ? 'Der Name steht über zwei Absätze. Entferne den Absatz in Word oder markiere die Teile einzeln.'
        : k === 'txt' ? (/\n[ \t\r]*\n/.test(f.text) ? 'Der Name steht über zwei Absätze (Leerzeile dazwischen). Entferne die Leerzeile in der Datei oder markiere die Teile einzeln.'
          : 'Der Name steht über mehrere Zeilen. Füge die Zeilen in der Datei zusammen oder markiere die Teile einzeln.')
          : `Der Name steht über zwei Abschnitte (z. B. zwei Zellen). ${prog ? 'Fasse sie in ' + prog + ' zusammen' : 'Fasse sie zusammen'} oder markiere die Teile einzeln.`;
    } else if (/[\r\n]/.test(f.text)) {
      hint = `Der Name steht über einen Zeilenumbruch. Entferne den Umbruch ${prog ? 'in ' + prog : 'in der Datei'} oder markiere die Teile einzeln.`;
    } else {
      hint = 'Ein Teil des Namens ist nicht als Einrichtung ersetzt (z. B. als Person ersetzt oder ausgeschaltet). Schalte im Schritt „Prüfen“ die Einrichtung ein oder markiere die Bezeichnung als Einrichtung.';
    }
    return { where: where + ' – im Original', word: f.text, entity: '„' + f.term + '“', full: f.term, org: true, orgCheck: true, hint,
      context: t.slice(Math.max(0, f.s - 30), Math.min(t.length, f.e + 30)) };
  });
}
// Ausgabe + Schlusscheck; rückbaufähig: nicht exakt rückbaubare Blattnamen zählen als Fund (wie bisher)
async function outputWithCheck(format) {
  const out = await buildOutput(format);
  const leaks = await finalCheck(out);
  if (isReversible()) {
    for (const x of out.sheetIssues || []) leaks.push({ word: x.requested, entity: 'Blattname', where: 'Excel', context: `Excel lässt den Blattnamen „${x.requested}“ nicht zu; gespeichert als „${x.actual}“. Der Rückbau dieses Blattnamens ist NICHT exakt.` });
  }
  return { out, leaks };
}

const MIME = {
  txt: 'text/plain;charset=utf-8', csv: 'text/csv;charset=utf-8',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};
const OUT_BASE = { txt: 'anonymisiert_text', csv: 'anonymisiert_tabelle', docx: 'anonymisiert_dokument', xlsx: 'anonymisiert_tabelle' };
// Dateinamen: im Modus rückbaufähig mit Kennung („anonymisiert_K7F3.docx“, „schluessel_K7F3.json“), sonst wie bisher
function outName(fmt) { return isReversible() && app.kennung ? `anonymisiert_${app.kennung}.${fmt}` : `${OUT_BASE[fmt]}.${fmt}`; }
function keyName() { return `schluessel_${app.kennung}.json`; }
function download(bytes, filename, mime) {
  const blob = new Blob([bytes], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = h('a', { href: url, download: filename });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch { /* Ersatzweg */ }
  const ta = h('textarea', { class: 'offscreen', readonly: true });
  ta.value = text;
  document.body.append(ta);
  ta.select();
  let ok = false;
  try { ok = document.execCommand('copy'); } catch { ok = false; }
  ta.remove();
  return ok;
}

function isReversible() { return app.state.settings.mode === MODE_REVERSIBLE; }
// Hauptformat passend zur Eingabe (wie bisher): Word -> .docx, Excel -> .xlsx, CSV -> .csv, sonst .txt
function mainFormat() { return app.doc ? ({ docx: 'docx', xlsx: 'xlsx', csv: 'csv' }[app.doc.kind] || 'txt') : 'txt'; }
function keySaved() { return app.keyStamp === app.stamp; }

// ---------- Fragen (Version 2.5.0) ----------
// 1. Frage zum Wort („Ist „X“ ein Name?“) für unsichere Wörter ohne klaren Kontext. „Ja“ schaltet nur die Stellen an,
//    die NICHT im Sachkontext stehen; „Nein“ schaltet alle unsicheren Stellen aus (wie bisher).
// 2. Frage je Stelle für Stellen im Sachkontext (nur Wörter der Liste „mehrdeutig“: nach Artikel/Präposition oder
//    gebeugte Form), wenn die Person im Dokument sicher erkannt oder bestätigt ist; ohne Antwort bleibt die Stelle,
//    wie sie im Moment ist.
// 3. Frage je Stelle für die GROSS-Form mit Endung eines von Hand übernommenen Namens (bleibt ohne Antwort stehen).
// Keine Frage für Wochentage/Monate (Regel b2). Namen aus den Dateiangaben wie bisher.
function hitText(x) { return app.result.fullText.slice(x.s, x.e); }
function confirmedEntity(en) {
  return en.manual || app.answers.get('p:' + en.key) === 'ja' || en.hits.some((x) => x.cert === 'sicher' && !x.capsManual);
}
function questions() {
  const r = app.result;
  if (!r) return [];
  const qs = [];
  // Version 2.8.0: je selbst gefundener Einrichtung EINE Frage für alle Stellen und Schreibweisen
  for (const og of r.orgs.values()) {
    if (!og.auto) continue;
    const hs = og.hits.filter((x) => x.auto);
    if (hs.length) qs.push({ id: 'o:' + og.key, kind: 'org', og, hits: hs, neinHits: hs, word: og.display, first: hs[0] });
  }
  for (const en of r.entities.values()) {
    const unsure = en.hits.filter((x) => x.cert === 'unsicher' && !x.calendar && !x.capsManual);
    const plain = unsure.filter((x) => !x.sachkontext);
    const wordAns = app.answers.get('p:' + en.key);
    const conf = confirmedEntity(en);
    if (plain.length || (unsure.length && (!conf || wordAns))) {
      const first = plain[0] || unsure[0];
      qs.push({ id: 'p:' + en.key, kind: 'word', en, hits: plain.length ? plain : [], neinHits: unsure, word: hitText(first), first });
    }
    if (wordAns === 'nein' || !conf) continue;
    for (const x of en.hits) {
      if ((x.sachkontext && !x.calendar) || x.capsManual) qs.push({ id: 'h:' + x.key, kind: 'place', en, hit: x, first: x });
    }
  }
  for (const m of app.doc.metaNames || []) {
    // Firma/Organisation (Version 2.3): als Einrichtung übernehmen; Autor, Bearbeiter, Manager bleiben Personen
    const org = m.kind === 'org';
    const taken = (org ? app.state.orgTerms : app.state.manualTerms).some((t) => fold(t) === fold(m.name));
    qs.push({ id: 'm:' + fold(m.name), kind: 'meta', org, name: m.name, where: m.where, taken });
  }
  // Version 2.9.0: Sammelfrage „Diese Wörter bleiben stehen“ – immer die letzte Frage. Die Kennung enthält die Wörter:
  // ändert sich die Liste, ist die Frage wieder offen.
  const rest = restList();
  if (rest.length) qs.push({ id: 'r:' + rest.map((w) => w.key).join('|'), kind: 'rest', words: rest });
  return qs;
}
// ---------- Version 2.9.0: Wörter, die stehen bleiben (Wortliste all-the-german-words 1.1.0, MIT) ----------
// Die Wortliste liegt gepackt im Datenblock #woerter-daten und wird erst gebraucht, wenn ein Dokument geprüft wird.
let wordDict = null;
function getDict() {
  if (wordDict) return wordDict;
  const el = document.getElementById('woerter-daten');
  const b64 = el ? el.textContent.trim() : '';
  let text = '';
  if (/^[A-Za-z0-9+/=]+$/.test(b64)) {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    text = new TextDecoder().decode(pako.inflateRaw(bytes));
  }
  wordDict = makeDict(text);
  return wordDict;
}
const restCache = { doc: null, known: new Map(), sig: null, list: [] };
function restList() {
  const r = app.result;
  if (!r || !app.doc) return [];
  if (restCache.doc !== app.doc) { restCache.doc = app.doc; restCache.known = new Map(); restCache.sig = null; }
  let bits = '';
  for (const x of r.hits) bits += x.on ? '1' : '0';
  const sig = JSON.stringify(app.state.exceptions) + '#' + bits;
  if (restCache.sig === sig && restCache.result === r) return restCache.list;
  const known = (w, frag) => {
    const k = (frag ? '-' : '') + w;
    let v = restCache.known.get(k);
    if (v === undefined) { v = isKnown(getDict(), w, frag); restCache.known.set(k, v); }
    return v;
  };
  restCache.list = restWords(app.doc.units, r, app.state.exceptions, known);
  restCache.sig = sig;
  restCache.result = r;
  return restCache.list;
}
// gezeigte Sammelfrage (oder null)
function shownRest() {
  const { qs, idx } = shownQuestion();
  const q = qs[idx];
  return q && q.kind === 'rest' ? q : null;
}
// gewähltes Wort der Sammelfrage: erste Stelle {unit, s, e} (nur solange die Sammelfrage gezeigt wird)
function restPlace() {
  const q = shownRest();
  const w = q && app.restSel ? q.words.find((x) => x.key === app.restSel) : null;
  return w ? w.first : null;
}
// Treffer (z. B. „unsicher, aus“), in dem die gewählte Stelle liegt – wird dann kräftig markiert
function restHit(p) {
  if (!p) return null;
  const base = app.result.unitStarts[p.unit];
  return app.result.hits.find((x) => (x.unit === p.unit || x.unit2 === p.unit) && x.s < base + p.e && x.e > base + p.s) || null;
}
// Klick auf ein Wort: erste Stelle zeigen (Rollen und kräftige Markierung wie bei den anderen Fragen)
function showRest(w) {
  app.restSel = w.key;
  const sheets = app.doc.kind === 'xlsx' && app.doc.raw.view ? app.doc.raw.view : null;
  if (sheets) {
    const si = sheets.findIndex((sh) => sh.cells.some((c) => c.u === w.first.unit));
    if (si >= 0) app.sheetTab = si;
  }
  renderDoc();
  renderQuestions();
  requestAnimationFrame(() => {
    const x = restHit(w.first);
    const el = x ? document.querySelector(`#docview mark[data-h="${x.id}"]`) : document.querySelector('#docview mark.restmark');
    if (el) scrollToEl(el);
    else showUnit(w.first.unit);
  });
}
// „Name“ und „Einrichtung“ wirken genau wie Markieren von Hand (derselbe Weg); „bleibt immer stehen“ trägt das Wort in
// „Ausnahmen“ ein (wie das Feld unter „Einstellungen und eigene Namen“)
function restTake(w, act) {
  app.restSel = null;
  if (act === 'name') addManual(w.word);
  else if (act === 'einr') addOrg(w.word);
  else {
    app.addedSinceLoad = true;
    if (!app.state.exceptions.some((m) => fold(m) === fold(w.word))) app.state.exceptions.push(w.word);
    saveStored();
    runAnalysis();
  }
  refreshMarks();
  renderQuestions();
  renderA2Info();
}
function answerOf(q) { return app.answers.get(q.id) || (q.kind === 'meta' && q.taken ? 'ja' : null); }
function openQuestions() { return questions().filter((q) => !answerOf(q)); }
// Treffer, die zu einer offenen Frage gehören (Markierung „Frage“ im Text)
function askHits() {
  const s = new Set();
  for (const q of openQuestions()) {
    if (q.kind === 'place') s.add(q.hit);
    else if (q.kind === 'word' || q.kind === 'org') for (const x of (q.hits.length ? q.hits : q.neinHits)) s.add(x);
  }
  return s;
}
// Version 2.6.1: Eine Antwort lässt sich ändern. Ergebnis = als wäre die jetzt gültige Antwort gleich gegeben worden:
// die alte Wirkung wird genau zurückgenommen (nur Stellen, die seitdem niemand von Hand umgeschaltet hat), später
// gegebene Antworten werden zurückgenommen und in derselben Reihenfolge wieder angewendet; Antworten zu Fragen, die es mit
// der neuen Antwort nicht mehr gibt, werden verworfen. Dieselbe Antwort noch einmal ändert nichts.
function answer(q, yes) {
  const val = yes ? 'ja' : 'nein';
  const before = app.answers.get(q.id);
  app.qNote = false;
  if (before === val) { advanceAfter(q.id); refreshMarks(); renderQuestions(); return; }
  if (before === undefined) applyAnswer(q, val, ++app.answerSeq);
  else changeAnswer(q, val);
  advanceAfter(q.id);
  refreshMarks();
  renderQuestions();
  renderA2Info();
}
const MANUELL = 'von Hand'; // Stelle wurde nach der Antwort von Hand umgeschaltet: weder zurücknehmen noch neu setzen
function seqOf(id) { const r = app.answerLog.get(id); return r ? r.seq : 0; }
function hitRecord(list, on, skip) {
  const ov = app.state.overrides;
  return list.map((x) => ({ key: x.key, had: Object.prototype.hasOwnProperty.call(ov, x.key), val: ov[x.key], set: skip && skip.has(x.key) ? MANUELL : on }));
}
// Antwort anwenden (wie bisher) und festhalten, was sie verändert
function applyAnswer(q, val, seq, skip) {
  const yes = val === 'ja';
  app.answers.set(q.id, val);
  const rec = { seq, hits: [], meta: null };
  app.answerLog.set(q.id, rec);
  if (q.kind === 'word' || q.kind === 'place' || q.kind === 'org') {
    const list = q.kind === 'place' ? [q.hit] : yes ? q.hits : q.neinHits;
    rec.hits = hitRecord(list, yes, skip);
    if (q.kind === 'org') rec.org = true;
    setHits(skip ? list.filter((x) => !skip.has(x.key)) : list, yes);
  } else if (yes && !q.taken) {
    const before = { m: [...app.state.manualTerms], o: [...app.state.orgTerms], e: [...app.state.exceptions], added: app.addedSinceLoad };
    const ovBefore = { ...app.state.overrides }; // Version 2.8.1 (Guardian-Lauf 3, Fund 2): Umschaltungen von „Markieren gewinnt“
    const wasIn = app.inAnswer;
    app.inAnswer = true;
    if (q.org) addOrg(q.name); else addManual(q.name); // rechnet neu und zeichnet alles
    app.inAnswer = wasIn;
    const target = q.org ? 'o' : 'm';
    const other = q.org ? 'm' : 'o';
    const now = { m: app.state.manualTerms, o: app.state.orgTerms, e: app.state.exceptions };
    const lost = (k) => before[k].map((v, i) => ({ i, v })).filter((x) => !now[k].includes(x.v));
    const ovNow = app.state.overrides;
    const ovChanged = [...new Set([...Object.keys(ovBefore), ...Object.keys(ovNow)])].filter((k) => ovBefore[k] !== ovNow[k])
      .map((k) => ({ key: k, had: k in ovBefore, val: ovBefore[k], has: k in ovNow, set: ovNow[k] }));
    rec.meta = { org: q.org, added: now[target].filter((t) => !before[target].includes(t)), removedOther: lost(other), removedExc: lost('e'), addedSinceLoad: before.added, ovChanged };
  } else changed();
}
// Wirkung einer Antwort zurücknehmen; liefert die Stellen, die inzwischen von Hand umgeschaltet waren
function undoAnswer(id) {
  const rec = app.answerLog.get(id);
  const skipped = new Set();
  app.answers.delete(id);
  app.answerLog.delete(id);
  if (!rec) return skipped;
  const ov = app.state.overrides;
  for (const e of rec.hits) {
    if (e.set !== MANUELL && ov[e.key] === e.set) { if (e.had) ov[e.key] = e.val; else delete ov[e.key]; } else skipped.add(e.key);
  }
  if (rec.org && !rec.meta) {
    const wasIn = app.inAnswer;
    app.inAnswer = true;
    runAnalysis();
    app.inAnswer = wasIn;
  }
  if (rec.meta) {
    const m = rec.meta;
    const st = app.state;
    const target = m.org ? 'orgTerms' : 'manualTerms';
    const other = m.org ? 'manualTerms' : 'orgTerms';
    st[target] = st[target].filter((t) => !m.added.includes(t));
    for (const x of m.removedOther) if (!st[other].includes(x.v)) st[other].splice(Math.min(x.i, st[other].length), 0, x.v);
    for (const x of m.removedExc) if (!st.exceptions.includes(x.v)) st.exceptions.splice(Math.min(x.i, st.exceptions.length), 0, x.v);
    app.addedSinceLoad = m.addedSinceLoad;
    // Version 2.8.1 (Guardian-Lauf 3, Fund 2): Umschaltungen, die das Übernehmen ausgelöst hat („Markieren gewinnt“),
    // zurücknehmen – sofern sie seitdem nicht von Hand geändert wurden. So gilt „Ja“ → „Nein“ = direkt „Nein“.
    for (const c of m.ovChanged || []) {
      const cur = Object.prototype.hasOwnProperty.call(st.overrides, c.key);
      if (cur !== c.has || (cur && st.overrides[c.key] !== c.set)) continue;
      if (c.had) st.overrides[c.key] = c.val; else delete st.overrides[c.key];
    }
    saveStored();
    const wasIn = app.inAnswer;
    app.inAnswer = true;
    runAnalysis();
    app.inAnswer = wasIn;
  }
  return skipped;
}
function changeAnswer(q, val) {
  const rec = app.answerLog.get(q.id);
  const seq = rec ? rec.seq : ++app.answerSeq;
  const later = [...app.answerLog].filter(([id, r]) => id !== q.id && r.seq > seq).sort((a, b) => a[1].seq - b[1].seq)
    .map(([id, r]) => ({ id, seq: r.seq, val: app.answers.get(id) }));
  app.inAnswer = true;
  const skipped = new Map();
  for (const l of [...later].reverse()) skipped.set(l.id, undoAnswer(l.id));
  const own = undoAnswer(q.id);
  refreshOn();
  const find = (id) => questions().find((x) => x.id === id);
  const qq = find(q.id);
  if (qq) applyAnswer(qq, val, seq, own.size ? own : null);
  for (const l of later) {
    const ql = find(l.id);
    if (ql) applyAnswer(ql, l.val, l.seq, skipped.get(l.id).size ? skipped.get(l.id) : null);
  }
  app.inAnswer = false;
  app.listSig = listSig();
  refreshOn();
  changed();
  render();
}
// An/Aus aller Treffer aus den Umschaltungen neu ableiten (wie die Berechnung selbst)
function refreshOn() {
  if (!app.result) return;
  for (const x of app.result.hits) { const ov = app.state.overrides[x.key]; x.on = ov === undefined ? !x.defaultOff : ov; }
}
// Nach einer Antwort: erste offene Frage; sonst die nächste in der Reihenfolge; am Ende „Alle Fragen beantwortet“
function advanceAfter(id) {
  const qs = questions();
  const open = qs.find((q) => !answerOf(q));
  if (open) { app.qCurrent = open.id; return; }
  const i = qs.findIndex((q) => q.id === id);
  app.qCurrent = i >= 0 && i + 1 < qs.length ? qs[i + 1].id : '';
}
// Gezeigte Frage: {qs, idx} (idx = -1: „Alle Fragen beantwortet“ bzw. keine Fragen)
function shownQuestion() {
  const qs = questions();
  let idx = app.qCurrent ? qs.findIndex((q) => q.id === app.qCurrent) : -1;
  // Version 2.9.0: Hat sich die Liste der Sammelfrage geändert (neue Kennung), bleibt die Sammelfrage gezeigt
  if (idx < 0 && app.qCurrent && app.qCurrent.startsWith('r:')) idx = qs.findIndex((q) => q.kind === 'rest');
  if (idx < 0) idx = qs.findIndex((q) => !answerOf(q));
  return { qs, idx };
}
// Stellen der gezeigten Frage (kräftig markiert)
function currentHits() {
  const { qs, idx } = shownQuestion();
  const q = qs[idx];
  if (!q || q.kind === 'meta') return [];
  if (q.kind === 'rest') { const x = restHit(restPlace()); return x ? [x] : []; }
  if (q.kind === 'place') return [q.hit];
  return q.hits.length ? q.hits : q.neinHits;
}
function goQuestion(delta) {
  const { qs, idx } = shownQuestion();
  if (!qs.length) return;
  if (idx < 0) { if (delta < 0) app.qCurrent = qs[qs.length - 1].id; } else {
    const j = idx + delta;
    if (j < 0) return;
    if (j >= qs.length) { const open = qs.find((q) => !answerOf(q)); app.qCurrent = open ? open.id : ''; } else app.qCurrent = qs[j].id;
  }
  refreshMarks();
  renderQuestions();
}
// Kontext: der Satz (bzw. die Zeile) um das Vorkommen, das Wort hervorgehoben
function contextOf(hit) {
  const r = app.result;
  const ui = hit.unit;
  const base = r.unitStarts[ui];
  const t = app.doc.units[ui].text;
  const s = hit.s - base;
  const e = Math.min(hit.e - base, t.length);
  let a = s;
  while (a > 0 && !/[.!?\n]/.test(t[a - 1]) && s - a < 120) a--;
  let b = e;
  while (b < t.length && !/[.!?\n]/.test(t[b]) && b - e < 120) b++;
  if (b < t.length && /[.!?]/.test(t[b])) b++;
  return h('p', { class: 'qctx' }, (a > 0 ? '…' : '') + t.slice(a, s).trimStart(), h('mark', {}, t.slice(s, e)), t.slice(e, b).trimEnd() + (b < t.length ? '…' : ''));
}
// Kopfzeile der Karte: Zähler, „Vorige Frage“ / „Nächste Frage“ (Version 2.6.1)
function qHead(text, prevOn, nextOn) {
  const nav = (id, label, arrow, on, d) => h('button', { type: 'button', class: 'qnav', id, 'aria-label': label, title: label, disabled: on ? null : '', onclick: () => goQuestion(d) }, arrow);
  return h('div', { class: 'qhead' }, h('p', { class: 'qcount' }, text),
    h('span', { class: 'qnavs' }, nav('q-prev', 'Vorige Frage', '←', prevOn, -1), nav('q-next', 'Nächste Frage', '→', nextOn, 1)));
}
function renderQuestions() {
  // Version 2.10.0: Tabellen mit Kopfzeile – zuerst die Spalten-Übersicht, erst nach „So übernehmen“ die Fragen
  if (needsColumns() && !app.colConfirmed) { renderColumns(); return; }
  const box = $('#qcard');
  const { qs, idx } = shownQuestion();
  const note = app.qNote ? h('p', { class: 'hint qnote', id: 'q-note' }, 'Du hast eine Einstellung geändert. Die Fragen sind wieder offen.') : null;
  if (!qs.length) { fill(box, h('p', { class: 'qcount' }, 'Keine Fragen'), h('p', {}, 'Es gibt nichts zu entscheiden.')); noteShown(null); return; }
  if (idx < 0) {
    app.qCurrent = '';
    fill(box, qHead(`${qs.length} von ${qs.length} Fragen`, true, false), h('p', { class: 'qask' }, 'Alle Fragen beantwortet'), note,
      h('button', { type: 'button', class: 'secondary small', id: 'q-again', onclick: () => { app.qCurrent = qs[0].id; refreshMarks(); renderQuestions(); } }, 'Fragen noch einmal zeigen'));
    noteShown(null);
    return;
  }
  const q = qs[idx];
  app.qCurrent = q.id;
  const prev = answerOf(q);
  const kids = [qHead(`Frage ${idx + 1} von ${qs.length}`, idx > 0, !!prev), note];
  let yes = 'Ja, Name';
  if (q.kind === 'org') {
    // Version 2.8.0: selbst gefundene Einrichtung
    kids.push(contextOf(q.first), h('p', { class: 'qask' }, `Ist „${q.word}“ eine Einrichtung?`));
    if (q.hits.length > 1) kids.push(h('p', { class: 'hint' }, `Gilt für ${q.hits.length} Stellen.`));
    yes = 'Ja, ersetzen';
  } else if (q.kind === 'word') {
    kids.push(contextOf(q.first), h('p', { class: 'qask' }, `Ist „${q.word}“ ein Name?`));
    const n = q.hits.length;
    if (n > 1) kids.push(h('p', { class: 'hint' }, `Gilt für ${n} Stellen.`));
    const sk = q.neinHits.length - n;
    if (sk > 0) kids.push(h('p', { class: 'hint' }, `${sk === 1 ? 'Eine Stelle' : sk + ' Stellen'} wie „im Winter“ oder „die Rosen“ ${sk === 1 ? 'wird' : 'werden'} danach einzeln gefragt.`));
  } else if (q.kind === 'place') {
    kids.push(contextOf(q.hit), h('p', { class: 'qask' }, `Ist hier die Person ${q.en.display} gemeint?`),
      h('p', { class: 'qstate', id: 'q-state' }, q.hit.on ? 'Wird im Moment ersetzt.' : 'Bleibt im Moment stehen.'));
    yes = 'Ja, ersetzen';
  } else if (q.kind === 'rest') {
    kids.push(h('p', { class: 'qask' }, 'Diese Wörter bleiben stehen. Ist ein Name dabei?'),
      h('p', { class: 'hint' }, 'Sie stehen in keiner Liste gewöhnlicher deutscher Wörter. Klick auf ein Wort zeigt seine erste Stelle.'),
      h('ul', { class: 'restlist' + (q.words.length > 40 ? ' scroll' : ''), id: 'rest-list' }, ...q.words.map((w) => h('li', { class: 'restrow' + (app.restSel === w.key ? ' sel' : ''), 'data-key': w.key },
        h('span', { class: 'restw' }, h('button', { type: 'button', class: 'restword', title: 'Erste Stelle zeigen', onclick: () => showRest(w) }, w.word),
          h('small', { class: 'restn' }, w.count === 1 ? '1 Stelle' : w.count + ' Stellen')),
        h('span', { class: 'restbtns' },
          h('button', { type: 'button', class: 'secondary small', 'data-act': 'name', onclick: () => restTake(w, 'name') }, 'Name'),
          h('button', { type: 'button', class: 'secondary small', 'data-act': 'einr', onclick: () => restTake(w, 'einr') }, 'Einrichtung'),
          // nicht anbieten, wenn das Wort an anderer Stelle ersetzt wird (eine Ausnahme würde dort die Ersetzung aufheben)
          w.replacedElsewhere ? null : h('button', { type: 'button', class: 'restkeep', 'data-act': 'immer', onclick: () => restTake(w, 'immer') }, 'bleibt immer stehen'))))));
    if (prev) kids.push(h('p', { class: 'hint' }, 'Bisherige Antwort: Kein Name dabei'));
    kids.push(h('div', { class: 'qbtns' }, h('button', { type: 'button', class: 'secondary', id: 'q-no', onclick: () => answer(q, false) }, 'Kein Name dabei')),
      h('p', { class: 'qkeys' }, 'Tasten: N = Kein Name dabei, ← vorige, → nächste Frage'));
    fill(box, ...kids);
    noteShown(q);
    return;
  } else {
    kids.push(h('p', { class: 'qask' }, `In den Dateiangaben steht „${q.name}“. ${q.org ? 'Als Einrichtung übernehmen?' : 'Als Namen übernehmen?'}`),
      h('p', { class: 'hint' }, `${q.where}. Bei „Ja“ wird ${q.org ? 'die Einrichtung' : 'der Name'} überall im Text ersetzt. Aus den Dateiangaben wird ${q.org ? 'sie' : 'er'} so oder so entfernt.`));
    yes = 'Ja, übernehmen';
  }
  if (prev) kids.push(h('p', { class: 'hint' }, `Bisherige Antwort: ${prev === 'ja' ? 'Ja' : 'Nein'}`));
  kids.push(h('div', { class: 'qbtns' },
    h('button', { type: 'button', class: 'secondary', id: 'q-yes', onclick: () => answer(q, true) }, yes),
    h('button', { type: 'button', class: 'secondary', id: 'q-no', onclick: () => answer(q, false) }, 'Nein')),
  h('p', { class: 'qkeys' }, 'Tasten: J = Ja, N = Nein, ← vorige, → nächste Frage'));
  fill(box, ...kids);
  noteShown(q);
}
// Version 2.6.1: Wechselt die gezeigte Frage, zur ersten Stelle dieser Frage rollen (Excel: vorher das Blatt wechseln)
function noteShown(q) {
  if (app.screen !== 'a2') return;
  const id = q ? q.id : null;
  if (id === app.qShown) return;
  app.qShown = id;
  if (!q || q.kind === 'meta' || q.kind === 'rest') return;
  const first = q.kind === 'place' ? q.hit : q.first;
  const sheets = app.doc.kind === 'xlsx' && app.doc.raw.view ? app.doc.raw.view : null;
  if (sheets) {
    const si = sheets.findIndex((sh) => sh.cells.some((c) => c.u === first.unit));
    if (si >= 0 && si !== app.sheetTab) { app.sheetTab = si; renderDoc(); }
  }
  requestAnimationFrame(() => scrollToHit(first));
}
function scrollToHit(x) {
  if (app.screen !== 'a2') return;
  const el = document.querySelector(`#docview mark[data-h="${x.id}"]`);
  if (el) scrollToEl(el);
}
function scrollToEl(el) {
  if (app.screen !== 'a2') return;
  const r = el.getBoundingClientRect();
  const top = $('.top') ? $('.top').getBoundingClientRect().bottom : 0;
  let visible = r.top >= top && r.bottom <= window.innerHeight && r.left >= 0 && r.right <= document.documentElement.clientWidth;
  for (let p = el.parentElement; p && visible; p = p.parentElement) {
    const cs = getComputedStyle(p);
    if (/(auto|scroll|hidden)/.test(cs.overflowX + cs.overflowY)) {
      const b = p.getBoundingClientRect();
      if (r.left < b.left || r.right > b.right || r.top < b.top || r.bottom > b.bottom) visible = false;
    }
  }
  if (visible) return;
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  el.style.scrollMarginTop = Math.ceil(top) + 'px';
  el.scrollIntoView({ block: 'center', inline: 'center', behavior: reduce ? 'auto' : 'smooth' });
}
function renderA2Info() {
  const n = openQuestions().length;
  $('#a2-info').textContent = n ? `Noch ${n} ${n === 1 ? 'Frage' : 'Fragen'} offen` : 'Keine Frage offen';
}

// ---------- Bildschirme ----------
const STEPS = { anon: ['Datei', 'Prüfen', 'Speichern'], restore: ['Dateien', 'Prüfen', 'Speichern'] };
const SCREEN_STEP = { a1: ['anon', 0], a2: ['anon', 1], a3: ['anon', 2], r1: ['restore', 0], r2: ['restore', 1], r3: ['restore', 2] };
const BACK = { a1: 'start', a2: 'a1', a3: 'a2', r1: 'start', r2: 'r1', r3: 'r2' };
function show(screen) {
  app.screen = screen;
  for (const s of document.querySelectorAll('.screen')) s.hidden = s.dataset.screen !== screen;
  showMarkBar(null);
  // Fortschrittsleiste
  const pg = $('#progress');
  const st = SCREEN_STEP[screen];
  pg.hidden = !st;
  if (st) {
    fill(pg, ...STEPS[st[0]].map((label, i) => {
      const done = i < st[1];
      const cur = i === st[1];
      return h('li', { class: done ? 'done' : cur ? 'current' : '', 'aria-current': cur ? 'step' : null },
        h('span', { class: 'step' }, done ? icon('check') : String(i + 1)), h('span', { class: 'steplabel' }, label),
        h('span', { class: 'sr' }, done ? ' (erledigt)' : cur ? ' (aktuell)' : ' (offen)'));
    }));
  }
  if (screen === 'a1') renderA1();
  if (screen === 'a2') { render(); }
  if (screen === 'a3') renderSave();
  if (screen === 'r1') renderR1();
  if (screen === 'r3') renderR3();
  window.scrollTo(0, 0);
  const h1 = document.querySelector(`.screen[data-screen="${screen}"] h1`);
  if (h1) { h1.setAttribute('tabindex', '-1'); h1.focus({ preventScroll: true }); }
}

function renderA1() {
  const ok = app.modeChosen && !!app.doc;
  $('#a1-next').disabled = !ok;
  $('#a1-info').textContent = !app.modeChosen ? 'Wähle oben eine Antwort.' : !app.doc ? 'Lade eine Datei oder füge Text ein.' : '';
  for (const c of document.querySelectorAll('.choicecard')) c.classList.toggle('checked', c.querySelector('input').checked);
}

// ---------- Prüfen-Bildschirm ----------
function render() {
  renderLists();
  renderA1();
  if (!app.doc || !app.result) return;
  renderSummary();
  renderDoc();
  renderEntities();
  renderColLine();
  renderQuestions();
  renderA2Info();
  if (app.screen === 'a3') renderSave();
}

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
function renderSummary() {
  const r = app.result;
  const parts = [plural(r.entities.size, 'Person', 'Personen')];
  if (r.orgs.size) parts.push(plural(r.orgs.size, 'Einrichtung', 'Einrichtungen'));
  $('#summary').textContent = parts.join(', ');
}

// Hinweis beim Überfahren: wer es ist und was passiert
function hitTitle(x, cur) {
  const who = x.type === 'person' ? (app.result.entities.get(x.entity) || {}).display : x.type === 'org' ? (app.result.orgs.get(x.entity) || {}).display : '';
  return (x.on ? 'wird ersetzt durch: ' + x.label : 'bleibt stehen') + (who ? ` · ${x.type === 'org' ? 'Einrichtung' : 'Person'}: ${who}` : '') + (cur && cur.has(x) ? ' · aktuelle Frage' : '') + ' · Klick = umschalten';
}
// Klassen einer Markierung: „wird ersetzt“ (on), „Frage“ (ask), seit 2.6.1 „aktuelle Frage“ (cur); aus = unmarkiert
function markClass(x, ask, cur) { return 'hit ' + (x.on ? 'on' : 'off') + (ask.has(x) ? ' ask' : '') + (cur && cur.has(x) ? ' cur' : ''); }
function refreshMarks() {
  if (!app.result) return;
  const ask = askHits();
  const cur = new Set(currentHits());
  for (const m of document.querySelectorAll('#docview mark[data-h]')) {
    const x = app.result.hits[Number(m.dataset.h)];
    if (!x) continue;
    m.className = markClass(x, ask, cur);
    m.title = hitTitle(x, cur);
  }
  const rp = restPlace();
  for (const m of document.querySelectorAll('#docview mark.restmark')) m.classList.toggle('cur', !!rp && !restHit(rp));
}

// Schnelles Umschalten ohne Neuberechnung (Treffer bleiben gleich, nur an/aus ändert sich)
function setHits(list, on) {
  for (const x of list) {
    x.on = on;
    app.state.overrides[x.key] = on;
  }
  // Nachbesserung 2.8.0: Ein- oder Ausschalten einer gefundenen Einrichtung ändert, welche Wörter frei sind (ausgeschaltet
  // gilt dort wieder die Personen-Erkennung) -> neu rechnen (Antworten und Listen bleiben)
  if (list.some((x) => x.type === 'org' && (x.auto || x.released))) {
    const wasIn = app.inAnswer;
    const qBefore = new Set(questions().map((q) => q.id));
    app.inAnswer = true;
    runAnalysis();
    app.inAnswer = wasIn;
    // Antworten zu Fragen, die dadurch wegfallen (Personen in einer wieder eingeschalteten Einrichtung), werden verworfen –
    // wie bei Listen (2.6.1). In „Antwort ändern“ (inAnswer) übernimmt das die Wiederholung der Antworten.
    if (!wasIn) {
      const ids = new Set(questions().map((q) => q.id));
      const gone = [...app.answers.keys()].filter((id) => qBefore.has(id) && !ids.has(id)).sort((a, b) => seqOf(b) - seqOf(a));
      for (const id of gone) undoAnswer(id);
      if (gone.length) { refreshOn(); changed(); render(); }
    }
    return;
  }
  changed();
  refreshMarks();
  renderSummary();
  renderEntities();
  renderQuestions();
  renderA2Info();
  if (app.screen === 'a3') renderSave();
}

// Text eines Abschnitts mit Markierungen (data-u für Markieren und Antippen)
function unitText(ui, ctx) {
  const r = app.result;
  const u = app.doc.units[ui];
  const base = r.unitStarts[ui];
  const tx = h('span', { class: 'utext', 'data-u': ui });
  let pos = 0;
  // Fortsetzung einer Einrichtung aus der vorigen Zeile (TXT, über einen Zeilenumbruch)
  const cont = ctx.contOf.get(ui);
  if (cont) {
    pos = Math.min(cont.e - base, u.text.length);
    tx.append(h('mark', { class: markClass(cont, ctx.ask, ctx.cur), 'data-h': cont.id, title: hitTitle(cont, ctx.cur) }, u.text.slice(0, pos)));
  }
  for (const x of ctx.byUnit.get(ui) || []) {
    const s = x.s - base;
    const e = Math.min(x.e - base, u.text.length);
    if (s < pos) continue;
    if (s > pos) plainText(tx, ui, u.text, pos, s, ctx);
    tx.append(h('mark', { class: markClass(x, ctx.ask, ctx.cur), 'data-h': x.id, title: hitTitle(x, ctx.cur) }, u.text.slice(s, e)));
    pos = e;
  }
  if (pos < u.text.length) plainText(tx, ui, u.text, pos, u.text.length, ctx);
  return tx;
}
// Text ohne Treffer; Version 2.9.0: darin die gewählte Stelle der Sammelfrage als Markierung
function plainText(tx, ui, t, a, b, ctx) {
  const r = ctx.rest;
  if (!r || r.unit !== ui || r.s < a || r.e > b) { tx.append(document.createTextNode(t.slice(a, b))); return; }
  if (r.s > a) tx.append(document.createTextNode(t.slice(a, r.s)));
  tx.append(h('mark', { class: 'restmark cur', title: 'gewähltes Wort der Frage „Diese Wörter bleiben stehen“' }, t.slice(r.s, r.e)));
  if (b > r.e) tx.append(document.createTextNode(t.slice(r.e, b)));
}
function docContext() {
  const r = app.result;
  const byUnit = new Map();
  for (const x of r.hits) {
    // Nachbesserung 2.8.0: freigegebene Einrichtung nicht zeichnen, wenn darin andere Stellen liegen (die Personen dort
    // sollen sichtbar und anklickbar sein); wieder einschalten über Frage oder Liste
    if (x.released && r.hits.some((y) => y !== x && y.s < x.e && y.e > x.s)) continue;
    if (!byUnit.has(x.unit)) byUnit.set(x.unit, []);
    byUnit.get(x.unit).push(x);
  }
  const rp = restPlace();
  return { byUnit, contOf: new Map(r.hits.filter((x) => x.unit2 !== undefined).map((x) => [x.unit2, x])), ask: askHits(), cur: new Set(currentHits()), rest: rp && !restHit(rp) ? rp : null };
}
const placeLine = (label, content) => h('div', { class: 'placeline' }, h('span', { class: 'where' }, label), h('span', {}, content));
const colNum = (c) => { let n = 0; for (const ch of c) n = n * 26 + (ch.charCodeAt(0) - 64); return n; };
const colName = (n) => { let s = ''; while (n > 0) { const r = (n - 1) % 26; s = String.fromCharCode(65 + r) + s; n = Math.floor((n - 1) / 26); } return s; };
// Version 2.6.0: Spalte von Hand – Schalter „Namen“ an jedem Spaltenkopf der Prüfansicht. Eine erkannte Namensspalte
// ist angehakt und gekennzeichnet. Umschalten gilt als Änderung der Treffer (neu rechnen, Häkchen fällt zurück).
function columnInfo(id) { return app.result && app.result.columns ? app.result.columns.find((c) => c.id === id) : null; }
function columnToggle(id) {
  const col = columnInfo(id);
  if (!col) return null;
  const on = !!col.kind;
  const why = col.manual === true ? 'von dir als Namensspalte gekennzeichnet'
    : col.manual === false ? 'von dir ausgeschaltet'
      : col.auto ? `erkannte Namensspalte (Kopf „${col.header}“${col.auto === 'schwach' ? ', unbekannte Einzelwörter als Frage' : ''})` : 'keine Namensspalte';
  const cb = h('input', { type: 'checkbox', 'data-col': id });
  cb.checked = on;
  cb.addEventListener('change', () => {
    (app.state.nameColumns = app.state.nameColumns || {})[id] = cb.checked;
    runAnalysis();
  });
  return h('label', { class: 'coltgl' + (on ? ' on' : ''), title: 'Diese Spalte enthält Namen – ' + why }, cb, ' Namen');
}
// Tabelle aus Zellen {r, c, u | value}: Spaltenköpfe, Zeilennummern, kompakte Zellen, lange Texte umbrechen
function gridTable(cells, ctx, colLabel, colId) {
  if (!cells.length) return null;
  const rows = [...new Set(cells.map((x) => x.r))].sort((a, b) => a - b);
  const maxC = Math.max(...cells.map((x) => x.c));
  const at = new Map(cells.map((x) => [x.r + ':' + x.c, x]));
  // Version 2.10.0: Spalten mit Behandlung „Name“ oder „ganz ersetzen“ sind sichtbar als ersetzt gekennzeichnet (Kopf und
  // Zellen unterhalb der Kopfzeile); der Schalter „Namen“ aus 2.6.0 gilt nur noch für Spalten „wie bisher“
  const plan = new Map(((app.result && app.result.colPlan) || []).map((c) => [c.id, c]));
  const repOf = (i) => { const id = colId ? colId(i + 1) : null; const c = id ? plan.get(id) : null; return c && c.treat !== 'bisher' ? c : null; };
  const head = h('tr', {}, h('th', { class: 'rn' }, ''), ...Array.from({ length: maxC }, (_, i) => {
    const id = colId ? colId(i + 1) : null;
    const col = id ? columnInfo(id) : null;
    const rep = repOf(i);
    if (rep) return h('th', { class: 'colrep', title: `Spalte „${rep.header}“: ${TREAT_LABEL[rep.treat]} (${kindText(rep)})` }, colLabel(i + 1), h('span', { class: 'colbadge' }, rep.treat === 'name' ? 'ersetzt: Name' : 'ganz ersetzt'));
    return h('th', { class: col && col.kind ? 'namecol' : '' }, colLabel(i + 1), id ? columnToggle(id) : null);
  }));
  const body = rows.map((r) => h('tr', {}, h('th', { class: 'rn' }, String(r)), ...Array.from({ length: maxC }, (_, i) => {
    const x = at.get(r + ':' + (i + 1));
    const rep = repOf(i);
    const below = rep && r - 1 > rep.headerRow;
    if (!x) return h('td', {});
    if (x.u === undefined) return h('td', { class: 'numval' + (below ? ' colrep' : '') }, x.value);
    return h('td', { class: (app.doc.units[x.u].text.length > 40 ? 'wrap' : '') + (below ? ' colrep' : '') }, unitText(x.u, ctx));
  })));
  return h('div', { class: 'tscroll' }, h('table', { class: 'sheet' }, h('thead', {}, head), h('tbody', {}, ...body)));
}
function renderDoc() {
  const view = $('#docview');
  const ctx = docContext();
  const kind = app.doc.kind;
  const units = app.doc.units;
  const frag = document.createDocumentFragment();
  const shown = new Set();
  if (kind === 'xlsx' && app.doc.raw.view && app.doc.raw.view.length) {
    const sheets = app.doc.raw.view;
    if (!(app.sheetTab >= 0 && app.sheetTab < sheets.length)) app.sheetTab = 0;
    for (const sh of sheets) for (const c of sh.cells) if (c.u !== undefined) shown.add(c.u);
    frag.append(h('div', { class: 'tabs', role: 'tablist', 'aria-label': 'Blätter' }, ...sheets.map((sh, i) => h('button', { type: 'button', role: 'tab', 'aria-selected': i === app.sheetTab ? 'true' : 'false', 'data-tab': i,
      onclick: () => { app.sheetTab = i; renderDoc(); } }, sh.name + (sh.hidden ? ' (ausgeblendet)' : '')))));
    const sh = sheets[app.sheetTab];
    const cells = sh.cells.map((c) => { const m = c.ref.match(/^([A-Z]+)(\d+)$/); return m ? { r: Number(m[2]), c: colNum(m[1]), u: c.u, value: c.value } : null; }).filter(Boolean);
    frag.append(gridTable(cells, ctx, colName, (i) => 'x|' + sh.name + '|' + (i - 1)) || h('p', { class: 'muted' }, 'Dieses Blatt ist leer.'));
  } else if (kind === 'csv') {
    const cells = [];
    units.forEach((u, ui) => { const m = u.label.match(/^Zeile (\d+), Spalte (\d+)$/); if (m && u.text.trim()) { cells.push({ r: Number(m[1]), c: Number(m[2]), u: ui }); shown.add(ui); } });
    const t = gridTable(cells, ctx, (i) => String(i), (i) => 'csv|' + (i - 1));
    if (t) frag.append(t);
  }
  // übrige Abschnitte: Absätze, Word-Tabellen, benannte Stellen (Kopfzeile, Kommentar, Bildbeschreibung …)
  let section = null;
  let table = null;
  let tableKey = null;
  let rowEl = null;
  let rowKey = null;
  let cellKey = null;
  const others = kind === 'xlsx' || kind === 'csv';
  if (others && units.some((u, ui) => !shown.has(ui) && u.text.trim())) frag.append(h('h3', { class: 'section-label' }, kind === 'xlsx' ? 'Weitere Stellen' : 'Weitere Abschnitte'));
  units.forEach((u, ui) => {
    if (shown.has(ui) || !u.text.trim()) return;
    if (others || /^Bildbeschreibung/.test(u.label)) { table = null; frag.append(placeLine(plainLabel(u.label, kind) || u.label, unitText(ui, ctx))); return; }
    const label = u.label.replace(/ \(mit gelöschtem Text aus Änderungsverfolgung\)$/, '');
    const sec = kind === 'docx' && (label === 'Text' || label === 'Tabelle') ? '' : kind === 'txt' ? '' : label;
    if (sec !== section) { section = sec; table = null; if (sec) frag.append(h('h3', { class: 'section-label' }, sec === 'Sonstiges' ? 'Weitere Teile' : sec)); }
    const box = h('div', { class: 'unit' }, label !== u.label ? h('small', { class: 'muted' }, 'gelöschter Text aus der Änderungsverfolgung: ') : null, unitText(ui, ctx));
    if (kind === 'docx' && u.row !== null && u.row !== undefined) {
      const tk = String(u.row).replace(/#.*$/, '') + '|' + section;
      if (!table || tableKey !== tk) {
        table = h('table', { class: 'wtable' }, h('tbody'));
        // Version 2.6.0: Kopf mit dem Schalter „Namen“ je Spalte (Spaltenbezeichnung „Spalte 1“, „Spalte 2“ …)
        const tid = u.tcells && u.tcells[0] ? u.tcells[0].t : null;
        const cols = tid && app.result.columns ? app.result.columns.filter((c) => c.t === tid) : [];
        if (cols.length) {
          const maxC = Math.max(...cols.map((c) => c.c));
          table.prepend(h('thead', {}, h('tr', {}, ...Array.from({ length: maxC + 1 }, (_, i) => {
            const col = cols.find((c) => c.c === i);
            return h('th', { class: col && col.kind ? 'namecol' : '' }, 'Spalte ' + (i + 1), col ? columnToggle(col.id) : null);
          }))));
        }
        tableKey = tk; frag.append(h('div', { class: 'tscroll plain' }, table)); rowKey = null;
      }
      if (u.row !== rowKey) { rowKey = u.row; rowEl = h('tr'); table.tBodies[0].append(rowEl); cellKey = null; }
      if (u.cell !== cellKey) {
        cellKey = u.cell;
        // Version 2.6.0: leere Zellen davor als leere Felder zeigen, damit jede Zelle unter ihrem Spaltenkopf steht
        const tc = u.tcells && u.tcells[0];
        if (tc && table.tHead) { let n = 0; for (const td of rowEl.children) n += td.colSpan || 1; for (; n < tc.c; n++) rowEl.append(h('td')); }
        const td = h('td');
        if (tc && table.tHead && tc.c2 > tc.c) td.colSpan = tc.c2 - tc.c + 1;
        rowEl.append(td);
      }
      rowEl.lastChild.append(box);
    } else {
      table = null;
      frag.append(box);
    }
  });
  fill(view, frag);
}

function renderEntities() {
  const r = app.result;
  const list = $('#entities');
  const ents = [...r.entities.values()];
  const orgs = [...r.orgs.values()];
  const rowsOf = (arr) => arr.map((en) => {
    const active = en.hits.filter((x) => x.on).length;
    const open = app.openMenu === en.key;
    // Einschalten: alle Stellen außer den einzeln gefragten GROSS-Formen von Hand übernommener Namen
    // Version 2.10.0: Einrichtung aus einer Spalte „ganz ersetzen“ – nur über die Spalten-Übersicht änderbar
    const fixed = !!en.col;
    const row = h('div', { class: 'entity' + (active ? '' : ' muted') },
      h('label', { class: 'switch', title: fixed ? 'Aus einer Spalte „ganz ersetzen“. Ändern in der Spalten-Übersicht.' : null }, h('input', { type: 'checkbox', checked: active > 0, disabled: fixed, 'aria-label': `${en.display} an/aus`, onchange: (e) => setHits(e.target.checked ? en.hits.filter((x) => !x.capsManual) : en.hits, e.target.checked) })),
      h('span', { class: 'ename', title: en.label }, h('strong', {}, en.display), ' ', h('small', {}, en.label)),
      h('span', { class: 'count', title: 'Stellen (ersetzt / gesamt)' }, `${active}/${en.count}`),
      h('button', { type: 'button', class: 'menubtn', 'aria-label': `Mehr zu ${en.display}`, 'aria-expanded': open ? 'true' : 'false', onclick: () => { app.openMenu = open ? null : en.key; renderEntities(); } }, icon('dots')));
    if (open) row.append(entityMenu(en, en.org ? orgs : ents));
    return row;
  });
  const kids = ents.length ? rowsOf(ents) : [h('p', { class: 'muted entity' }, 'Keine Personen erkannt. Nicht erkannte Namen bitte im Text markieren.')];
  // Einrichtungen als eigene Gruppe
  kids.push(h('p', { class: 'grouph', id: 'orgs-h' }, 'Einrichtungen'),
    h('div', { id: 'orgs' }, ...(orgs.length ? rowsOf(orgs) : [h('p', { class: 'muted entity' }, 'Keine. Eine Bezeichnung markieren und „Als Einrichtung markieren“ wählen.')])));
  fill(list, ...kids);
}
function entityMenu(en, ents) {
  const r = app.result;
  const forms = [...en.forms.entries()].map(([f, c]) => `${f} (${c})`).join(', ');
  const linked = en.hits.filter((x) => x.link);
  if (en.org) return orgMenu(en, ents);
  const remembered = app.state.manualTerms.some((t) => fold(t) === fold(en.display));
  const sel = h('select', { 'aria-label': 'zusammenführen mit', onchange: (e) => { if (e.target.value) { app.state.merges[en.key] = e.target.value; app.openMenu = null; runAnalysis(); } } },
    h('option', { value: '' }, 'zusammenführen mit …'),
    ...ents.filter((o) => o !== en).map((o) => h('option', { value: o.key }, `${o.label}: ${o.display}`)));
  return h('div', { class: 'emenu' },
    h('p', { class: 'forms' }, 'Schreibweisen: ' + forms),
    linked.length ? h('p', { class: 'forms' }, `${linked.length} Kurzform(en) zugeordnet (${[...new Set(linked.map((x) => x.link))].join(', ')}). `,
      h('button', { type: 'button', class: 'secondary small', onclick: () => { for (const x of linked) if (x.linkable && !app.state.unlinks.includes(x.linkable)) app.state.unlinks.push(x.linkable); runAnalysis(); } }, 'Zuordnung lösen')) : null,
    sel,
    h('button', { type: 'button', class: 'secondary small', onclick: () => {
      const toks = new Set();
      for (const x of en.hits) for (const c of x.comps || []) if (c.type === 'W') toks.add(r.fullText.slice(c.s, c.stemEnd || c.e));
      for (const t of toks) if (!app.state.exceptions.some((e2) => fold(e2) === fold(t))) app.state.exceptions.push(t);
      app.state.manualTerms = app.state.manualTerms.filter((m) => ![...toks].some((t) => fold(t) === fold(m)));
      app.openMenu = null;
      saveStored();
      runAnalysis();
    } }, 'nie anonymisieren'),
    remembered ? h('p', { class: 'forms' }, 'In „Eigene Namen“ gemerkt.') : h('button', { type: 'button', class: 'secondary small', onclick: () => {
      if (!app.state.manualTerms.some((t) => fold(t) === fold(en.display))) app.state.manualTerms.push(en.display);
      saveStored();
      runAnalysis();
    } }, 'für nächstes Mal merken'),
    h('button', { type: 'button', class: 'secondary small kindbtn', onclick: () => personToOrg(en) }, 'ist eine Einrichtung'));
}
// Menü einer Einrichtung: Schreibweisen, zusammenführen (nur mit Einrichtungen), Art umstellen, nicht mehr ersetzen
function orgMenu(en, orgs) {
  const forms = [...en.forms.entries()].map(([f, c]) => `${f} (${c})`).join(', ');
  if (en.col) return h('div', { class: 'emenu' }, h('p', { class: 'forms' }, 'Schreibweisen: ' + forms), h('p', { class: 'forms' }, 'Aus einer Spalte „ganz ersetzen“. Ändern in der Spalten-Übersicht.'));
  const sel = h('select', { 'aria-label': 'zusammenführen mit', onchange: (e) => { if (e.target.value) { app.state.merges[en.key] = e.target.value; app.openMenu = null; runAnalysis(); } } },
    h('option', { value: '' }, 'zusammenführen mit …'),
    ...orgs.filter((o) => o !== en).map((o) => h('option', { value: o.key }, `${o.label}: ${o.display}`)));
  return h('div', { class: 'emenu' },
    h('p', { class: 'forms' }, 'Schreibweisen: ' + forms),
    orgs.length > 1 ? sel : null,
    h('button', { type: 'button', class: 'secondary small kindbtn', onclick: () => orgToPerson(en) }, 'ist eine Person'),
    h('button', { type: 'button', class: 'secondary small', onclick: () => {
      removeOrgTerms(en);
      app.openMenu = null;
      saveStored();
      runAnalysis();
    } }, 'nicht als Einrichtung ersetzen'),
    h('p', { class: 'forms' }, 'In „Eigene Namen“ als Einrichtung gemerkt.'));
}
// Bezeichnungen (Einträge der Merkliste), aus denen diese Einrichtung entstanden ist, entfernen
function orgTermKeysOf(en) {
  const keys = new Set();
  for (const x of en.hits) keys.add(x.origEntity || x.entity);
  return keys;
}
function removeOrgTerms(en) {
  const keys = orgTermKeysOf(en);
  const terms = app.state.orgTerms.filter((t) => keys.has(orgKeyOf(t)));
  app.state.orgTerms = app.state.orgTerms.filter((t) => !keys.has(orgKeyOf(t)));
  for (const k of keys) delete app.state.merges[k];
  return terms;
}
// Art umstellen: Person -> Einrichtung. Alle Schreibweisen werden Einrichtungen derselben Einrichtung
function personToOrg(en) {
  const forms = [...en.forms.keys()].sort((a, b) => (a === en.display ? -1 : b === en.display ? 1 : 0));
  const main = forms[0];
  app.state.manualTerms = app.state.manualTerms.filter((m) => !forms.some((f) => fold(f) === fold(m)));
  for (const f of forms) {
    if (!app.state.orgTerms.some((t) => fold(t) === fold(f))) app.state.orgTerms.push(f);
    if (f !== main) app.state.merges[orgKeyOf(f)] = orgKeyOf(main);
  }
  app.openMenu = null;
  saveStored();
  runAnalysis();
}
// Art umstellen: Einrichtung -> Person (wie „Als Name markieren“ für jede Schreibweise)
function orgToPerson(en) {
  const terms = removeOrgTerms(en);
  for (const t of [...new Set([...terms, ...en.forms.keys()])]) if (!app.state.manualTerms.some((m) => fold(m) === fold(t))) app.state.manualTerms.push(t);
  app.openMenu = null;
  saveStored();
  runAnalysis();
}

function chipList(arr, onRemove, kind) {
  return arr.map((t, i) => h('span', { class: 'chip' + (kind === 'Einrichtung' ? ' orgchip' : ''), 'data-kind': kind || '' }, t, kind ? h('small', { class: 'kind' }, ' · ' + kind) : null,
    h('button', { type: 'button', class: 'x', 'aria-label': t + ' entfernen', onclick: () => onRemove(i) }, '×')));
}
function renderLists() {
  // Jeder Eintrag mit seiner Art (Person oder Einrichtung)
  fill($('#names-chips'), ...chipList(app.state.manualTerms, (i) => { app.state.manualTerms.splice(i, 1); saveStored(); runAnalysisOrRender(); }, 'Person'),
    ...chipList(app.state.orgTerms, (i) => { app.state.orgTerms.splice(i, 1); saveStored(); runAnalysisOrRender(); }, 'Einrichtung'));
  fill($('#exc-chips'), ...chipList(app.state.exceptions, (i) => { app.state.exceptions.splice(i, 1); saveStored(); runAnalysisOrRender(); }));
  $('#persist').checked = app.persist;
  const np = app.state.manualTerms.length;
  const no = app.state.orgTerms.length;
  $('#names-empty').hidden = np + no > 0;
  $('#exc-empty').hidden = app.state.exceptions.length > 0;
  // Stand der Liste „Eigene Namen“ auf dem Datei-Bildschirm
  const parts = [];
  if (no) parts.push(plural(no, 'Einrichtung', 'Einrichtungen'));
  if (np) parts.push(plural(np, 'Person', 'Personen'));
  $('#names-state').textContent = 'Eigene Namen: ' + (parts.length ? parts.join(', ') : 'keine');
  // Hinweis beim Hinzufügen, solange die Liste nicht im Browser gespeichert wird
  $('#persist-hint').hidden = !(app.addedSinceLoad && !app.persist && np + no + app.state.exceptions.length > 0);
}
function runAnalysisOrRender() { if (app.doc) runAnalysis(); else renderLists(); }

// ---------- Markieren (Text auswählen oder Wort antippen): Knopf direkt daneben ----------
function offsetFromDom(node, offset) {
  const el = node.nodeType === 1 ? node : node.parentNode;
  const tx = el && el.closest ? el.closest('.utext') : null;
  if (!tx) return null;
  const ui = Number(tx.dataset.u);
  let n = 0;
  const walker = document.createTreeWalker(tx, NodeFilter.SHOW_TEXT);
  let t;
  while ((t = walker.nextNode())) {
    if (t === node) return { ui, off: n + offset };
    n += t.nodeValue.length;
  }
  if (node === tx) return { ui, off: offset === 0 ? 0 : n };
  return { ui, off: n };
}
let pendingTerm = null;
let pendingTermRaw = null; // ausgewählter Text ohne Kürzung (für Einrichtungen, z. B. „e.V.“ mit Punkt)
function showMarkBar(term, rect, raw) {
  pendingTerm = term;
  pendingTermRaw = raw || term;
  const bar = $('#markbar');
  if (!term) { bar.hidden = true; return; }
  $('#markterm').textContent = term.length > 60 ? term.slice(0, 60) + '…' : term;
  bar.hidden = false;
  // direkt unter die Markierung setzen (innerhalb des Fensters)
  if (rect) {
    const w = bar.offsetWidth;
    const left = Math.max(8, Math.min(rect.left + window.scrollX, window.scrollX + document.documentElement.clientWidth - w - 8));
    bar.style.left = left + 'px';
    bar.style.top = (rect.bottom + window.scrollY + 8) + 'px';
  }
}
function cleanTerm(s) {
  return s.replace(/\s+/g, ' ').trim().replace(/^[^\p{L}]+|[^\p{L}.]+$/gu, '').replace(/\.$/, '');
}
function selectionTerm() {
  const sel = window.getSelection();
  if (!sel || sel.isCollapsed || !sel.rangeCount) return null;
  const r = sel.getRangeAt(0);
  if (!$('#docview').contains(r.commonAncestorContainer)) return null;
  const a = offsetFromDom(r.startContainer, r.startOffset);
  const b = offsetFromDom(r.endContainer, r.endOffset);
  if (!a || !b) return null;
  const texts = app.doc.units;
  if (a.ui !== b.ui) return { term: cleanTerm(sel.toString()), raw: sel.toString(), rect: r.getBoundingClientRect() };
  return { term: cleanTerm(texts[a.ui].text.slice(a.off, b.off)), raw: texts[a.ui].text.slice(a.off, b.off), rect: r.getBoundingClientRect() };
}
function wordAt(ui, off) {
  const t = app.doc.units[ui].text;
  const isW = (c) => /[\p{L}\p{M}'’-]/u.test(c);
  let s = off;
  let e = off;
  while (s > 0 && isW(t[s - 1])) s--;
  while (e < t.length && isW(t[e])) e++;
  return cleanTerm(t.slice(s, e));
}
function caretOffsetAt(x, y) {
  if (document.caretPositionFromPoint) {
    const p = document.caretPositionFromPoint(x, y);
    return p ? offsetFromDom(p.offsetNode, p.offset) : null;
  }
  if (document.caretRangeFromPoint) {
    const r = document.caretRangeFromPoint(x, y);
    return r ? offsetFromDom(r.startContainer, r.startOffset) : null;
  }
  return null;
}
function addManual(term) {
  const t = cleanTerm(term || '');
  if (!t || !/\p{L}{2,}/u.test(t)) { showMarkBar(null); return; }
  app.addedSinceLoad = true;
  app.state.orgTerms = app.state.orgTerms.filter((m) => fold(m) !== fold(t)); // Art: Person (nicht beides)
  if (!app.state.manualTerms.some((m) => fold(m) === fold(t))) app.state.manualTerms.push(t);
  app.state.exceptions = app.state.exceptions.filter((e) => fold(e) !== fold(t));
  saveStored();
  showMarkBar(null);
  const sel = window.getSelection();
  if (sel) sel.removeAllRanges();
  runAnalysis();
  // Version 2.8.1 (Teil 2): Von Hand markieren gewinnt immer. Stellen dieses Namens, die vorher aus waren (Schalter, Klick,
  // Antwort), werden ersetzt.
  const norm = (x) => ' ' + fold(x).split(/[^\p{L}\p{N}]+/u).filter(Boolean).join(' ') + ' ';
  // auch selbst erkannte Treffer (Guardian-Fund 2) und Treffer, in denen der markierte Name als ganze Wörter steht
  // (Guardian-Lauf 2, Fund 2/3: „Grawert“ in „Melanie Grawert“, „Lindqvist“ in „Praxis Lindqvist“)
  const ents = new Set(app.result.hits.filter((x) => x.type === 'person' && !x.capsManual
    && norm(app.result.fullText.slice(x.s, x.e)).includes(norm(t))).map((x) => x.entity));
  let n = markWins((x) => x.type === 'person' && ents.has(x.entity) && !x.capsManual);
  if (n) runAnalysis();
  // Stellen, in denen der markierte Name steht und die trotzdem aus sind (z. B. „unsicher, aus“ bei „Unsichere“ aus):
  // einschalten – von Hand markieren gewinnt immer (Guardian-Lauf 2, Fund 2)
  n = 0;
  for (const x of app.result.hits) {
    if (x.type === 'person' && !x.on && !x.capsManual && norm(app.result.fullText.slice(x.s, x.e)).includes(norm(t))) { app.state.overrides[x.key] = true; n++; }
  }
  if (n) runAnalysis();
}
// Version 2.8.1 (Teil 2): ausgeschaltete Stellen (Umschaltung „aus“) der gerade von Hand markierten Sache wieder auf Standard
function markWins(test) {
  let n = 0;
  for (const x of app.result.hits) if (test(x) && app.state.overrides[x.key] === false) { delete app.state.overrides[x.key]; n++; }
  return n;
}

// Als Einrichtung markieren (Version 2.3): ganze Wortfolge, eigener Platzhalter „Einrichtung A“
function addOrg(term) {
  const t = cleanOrgTerm(term || '');
  if (!t || !/\p{L}{2,}/u.test(t)) { showMarkBar(null); return; }
  app.addedSinceLoad = true;
  app.state.manualTerms = app.state.manualTerms.filter((m) => fold(m) !== fold(t)); // Art: Einrichtung (nicht beides)
  if (!app.state.orgTerms.some((m) => fold(m) === fold(t))) app.state.orgTerms.push(t);
  app.state.exceptions = app.state.exceptions.filter((e) => fold(e) !== fold(t));
  saveStored();
  showMarkBar(null);
  const sel = window.getSelection();
  if (sel) sel.removeAllRanges();
  runAnalysis();
  // Version 2.8.1 (Teil 2): Von Hand markieren gewinnt immer – die Einrichtung ist danach sicher und ersetzt, gleich was
  // vorher geantwortet oder geschaltet war
  const key = orgKeyOf(t);
  if (markWins((x) => x.type === 'org' && x.entity === key && !x.auto)) runAnalysis();
}
// Wie cleanTerm, aber ein Punkt am Ende bleibt (z. B. „e.V.“)
function cleanOrgTerm(s) {
  return s.replace(/\s+/g, ' ').trim().replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}.)]+$/gu, '');
}
const orgKeyOf = (t) => orgTermTokens(t).key;

// ---------- Speichern-Bildschirm (Version 2.5.0: offene Punkte in EINER Fläche, EIN Häkchen) ----------
function allWarnings() {
  if (!app.doc) return [];
  // Bis 2.3.3 stand hier die Warnung „Beim Rückbau würde dieser Text ebenfalls ersetzt“ (mit Abhaken). Seit 2.3.4
  // vergibt das Tool solche Platzhalter nicht mehr; der Hinweis steht unter „Details“ (placeholderWords).
  return [...app.doc.warnings];
}
// (I) reine Information: das Tool hat die Sache erledigt (Phase 0: Nr. 8, 13, 16)
function isInfoWarning(w) { return /ausgeblendete\(s\) Blatt|^Große Datei|^PDF-Eingabe:/.test(w); }
// (E) in einfacher Sprache; eingebettete Objekte mit der Folge für Ausgabe und Rückbau (Phase 0: Nr. 6, 7)
function plainWarning(w) {
  const m = w.match(/enthält (\d+) eingebettete/);
  if (m) return `${m[1] === '1' ? 'Ein eingebettetes Objekt' : m[1] + ' eingebettete Objekte'} (z. B. eine Tabelle in Word) ${m[1] === '1' ? 'wird' : 'werden'} geleert. Der Inhalt fehlt in der Ausgabe und auch nach dem Rückbau.`;
  return w;
}
const NUMWORDS = ['Kein', 'Ein', 'Zwei', 'Drei', 'Vier', 'Fünf', 'Sechs', 'Sieben', 'Acht', 'Neun', 'Zehn', 'Elf', 'Zwölf'];
const countWord = (n) => (n < NUMWORDS.length ? NUMWORDS[n] : String(n));
function ampelRow(state, title, text, ...extra) {
  return h('li', { class: state }, h('span', {}, h('strong', {}, title), text ? ' – ' + text : ''), ...extra);
}
// Offene Punkte (E): jede Zeile mit Handlungslink
function savePoints() {
  const r = app.result;
  const pts = [];
  // Version 2.7.0 (Sperre Punkt 1)
  if (!r.hits.some((x) => x.on)) pts.push({ id: 'nichts', text: 'In dieser Datei wird nichts ersetzt. Bitte prüfe Schulname, Firma, Webadresse und Konto und markiere sie von Hand.', acts: [['Prüfen', () => show('a2')]] });
  // Version 2.7.0 (Sperre Punkt 2): Schalter „Webadressen und Konten“ aus, aber im Text steht eine
  const web = webPlaces();
  if (web.length) {
    pts.push({ id: 'web:' + web.map((x) => x.unit + ':' + x.text).join('|'), text: `${web.length === 1 ? 'Eine Webadresse oder ein Konto steht' : web.length + ' Webadressen oder Konten stehen'} noch im Text.`,
      small: 'Der Schalter „Webadressen und Konten“ ist aus.', items: placeItems(web), acts: [['Ersetzen', () => setWebSwitch(true)]] });
  }
  // Version 2.10.0: Spalten-Übersicht nicht bestätigt -> kein stilles Speichern
  if (needsColumns() && !app.colConfirmed) {
    pts.push({ id: 'spalten', text: 'Die Spalten sind noch nicht geprüft.', small: 'Im Moment gilt die Auswahl in der Übersicht „Spalten“.',
      acts: [['Ansehen', () => { app.colConfirmed = false; show('a2'); }, 'btn-cols']] });
  }
  // Version 2.11.0: je Personen-Tabelle die Spalten, die lesbar bleiben (läuft über das eine Häkchen)
  for (const t of [...new Set(columnRows().filter((c) => c.person).map((c) => c.t))]) {
    const rc = readableColumns(t);
    const where = t.startsWith('x|') ? `Blatt „${t.slice(2)}“: ` : '';
    pts.push({ id: 'lesbar:' + t + ':' + rc.map((c) => c.id + '=' + (c.values || []).length + '/' + (c.rareValues || 0)).join('|'),
      text: rc.length ? `${where}Diese Spalten bleiben lesbar: ${rc.map((c) => '„' + c.header.replace(/\s+/g, ' ') + '“').join(', ')}.` : `${where}Keine Spalte bleibt lesbar.`,
      small: rc.length ? 'Prüfe, ob darin etwas über eine Person steht.' : null,
      items: rc.slice(0, 20).map((c) => ({ text: `${c.header.replace(/\s+/g, ' ')}: ${valuesText(c, 8)}` })),
      acts: [['Ansehen', () => { app.colConfirmed = false; show('a2'); }, null]] });
  }
  // Version 2.10.0: Formeln und verbundene Zellen in einer ersetzten Spalte – nicht raten, melden
  const ci = app.doc.raw && app.doc.raw.colIssues;
  const refItems = (list) => [...list.slice(0, 10).map((x) => ({ text: `Blatt „${x.sheet}“, Zelle ${x.ref}` })), ...(list.length > 10 ? [{ text: `und ${list.length - 10} weitere` }] : [])];
  if (ci && ci.formulas.length) {
    pts.push({ id: 'spformel:' + ci.formulas.map((x) => x.sheet + '!' + x.ref).join('|'), text: `In einer ersetzten Spalte ${ci.formulas.length === 1 ? 'steht eine Formel' : 'stehen ' + ci.formulas.length + ' Formeln'}. Das Tool ersetzt sie nicht.`,
      small: 'Bitte prüfe diese Zellen in Excel und lösche die Formel, wenn darin ein Name oder eine Angabe steht.', items: refItems(ci.formulas) });
  }
  if (ci && ci.merged.length) {
    pts.push({ id: 'spverb:' + ci.merged.map((x) => x.sheet + '!' + x.ref).join('|'), text: 'In einer ersetzten Spalte gibt es verbundene Zellen.',
      small: 'Bitte prüfe, ob alles ersetzt ist.', items: refItems(ci.merged) });
  }
  const openQs = openQuestions();
  // Version 2.9.0: die Sammelfrage hat einen eigenen Punkt (unten), sie zählt hier nicht mit
  const open = openQs.filter((q) => q.kind !== 'rest').length;
  if (open) pts.push({ id: 'fragen:' + open, text: `${open === 1 ? 'Eine Frage ist' : open + ' Fragen sind'} noch offen.`, small: 'Ohne Antwort bleibt jede Stelle so, wie sie im Moment ist.', acts: [['Beantworten', () => { app.qCurrent = null; show('a2'); }]] });
  // Version 2.9.0: Sammelfrage offen -> kein stilles Speichern (läuft über das eine Häkchen)
  const rq = openQs.find((q) => q.kind === 'rest');
  if (rq) {
    const n = rq.words.length;
    pts.push({ id: 'rest:' + rq.id, text: `${n === 1 ? 'Ein Wort ist' : n + ' Wörter sind'} noch nicht geprüft. Ist ein Name dabei?`,
      acts: [['Ansehen', () => { app.qCurrent = rq.id; show('a2'); }, 'btn-rest']] });
  }
  for (const w of allWarnings()) if (!isInfoWarning(w)) pts.push({ id: 'w:' + w, text: plainWarning(w) });
  // Version 2.7.0 (PR A): Warnpunkt „Hier könnte eine Einrichtung stehen“ (nur Hinweis, ändert keine Ausgabe)
  const oh = orgHintPlaces();
  if (oh.length) {
    pts.push({ id: 'einr:' + oh.map((x) => x.unit + ':' + x.text).join('|'), text: 'Hier könnte eine Einrichtung stehen. Bitte prüfen und bei Bedarf als Einrichtung markieren.',
      items: placeItems(oh) });
  }
  for (const { q, left } of orgOpenPoints()) {
    const base = (x) => app.result.unitStarts[x.unit];
    pts.push({ id: 'org3:' + q.id + ':' + left.length, text: [`Eine Einrichtung steht noch im Text: `, h('strong', {}, `„${q.word}“`)],
      items: placeItems(left.map((x) => ({ unit: x.unit, text: app.result.fullText.slice(x.s, x.e), s: x.s - base(x), e: x.e - base(x) }))),
      acts: [['Ersetzen', () => setHits(left, true)]] });
  }
  if (app.doc.images && app.doc.images.length) {
    const n = app.doc.images.length;
    pts.push({ id: 'bilder', text: `${n === 1 ? 'Ein Bild' : n + ' Bilder'} im Dokument.`, small: `Das Tool ändert Bilder nicht. Steht auf einem Bild ein Name oder ein Logo, entferne es vorher in ${app.doc.kind === 'xlsx' ? 'Excel' : 'Word'}.`,
      acts: [[app.imagesOpen ? 'Ausblenden' : 'Ansehen', () => openImages(!app.imagesOpen), 'btn-images']] });
  }
  const p = app.preview;
  if (!p || p.busy) pts.push({ id: 'busy', busy: true, text: 'Der Schlusscheck läuft …' });
  else if (p.error) pts.push({ id: 'check-error', text: 'Schlusscheck: Fehler – ' + p.error });
  else { const offered = new Set(); p.leaks.slice(0, 200).forEach((l, i) => pts.push(leakPoint(l, i, offered))); }
  if (p && !p.busy && p.leaks.length > 200) pts.push({ id: 'more', text: `… und ${p.leaks.length - 200} weitere Fundstellen.` });
  return pts;
}
// Version 2.7.0: Stellen im Text (Original), die von keinem eingeschalteten Treffer berührt werden
function freeSpans(find) {
  const r = app.result;
  const out = [];
  const byUnit = new Map();
  for (const x of r.hits) {
    if (!x.on) continue;
    for (const k of [x.unit, x.unit2]) if (k !== undefined) { if (!byUnit.has(k)) byUnit.set(k, []); byUnit.get(k).push(x); }
  }
  app.doc.units.forEach((u, ui) => {
    const base = r.unitStarts[ui];
    const on = byUnit.get(ui) || [];
    for (const x of find(u.text, ui)) {
      if (on.some((o) => o.s < base + x.e && o.e > base + x.s)) continue;
      out.push({ unit: ui, s: x.s, e: x.e, text: u.text.slice(x.s, x.e) });
    }
  });
  return out;
}
// Sperre Punkt 2: nur bei ausgeschaltetem Schalter
// Zwischenspeicher je Analyse-Stand (savePoints wird oft aufgerufen)
const spanCache = new Map();
function cachedSpans(name, find) {
  const k = name + '#' + app.stamp;
  if (spanCache.get(name + '@') !== app.result || !spanCache.has(k)) {
    for (const key of [...spanCache.keys()]) if (key.startsWith(name)) spanCache.delete(key);
    spanCache.set(k, freeSpans(find));
    spanCache.set(name + '@', app.result);
  }
  return spanCache.get(k);
}
function webPlaces() {
  if (app.state.settings.web) return [];
  return cachedSpans('web', (t) => findContacts(t, { web: true }).filter((c) => c.type === 'web' || c.type === 'account'));
}
// Version 2.8.0: nur noch die schwachen Funde (Anführungszeichen ohne Merkmal, orgauto.js)
function orgHintPlaces() {
  const r = app.result;
  const weak = cachedSpans('einr', (t, ui) => (r.orgWeak || []).filter((w) => w.unit === ui && !w.blocked));
  // Nachbesserung 2.8.0: wegen einer Person nicht ersetzte Einrichtung – darin liegt die Person; sie fällt weg, sobald eine
  // Einrichtung die Stelle ersetzt (von Hand markiert)
  const blocked = (r.orgWeak || []).filter((w) => w.blocked && !r.hits.some((x) => x.on && x.type === 'org' && x.s < r.unitStarts[w.unit] + w.e && x.e > r.unitStarts[w.unit] + w.s));
  return [...weak, ...blocked].sort((a, b) => a.unit - b.unit || a.s - b.s);
}
// Version 2.8.0, Sperre Punkt 3: gefundene Einrichtung, deren Stellen nicht ersetzt werden, Frage unbeantwortet, nicht
// bewusst ausgeschaltet (z. B. „Unsichere Treffer ersetzen“ aus)
function orgOpenPoints() {
  const out = [];
  for (const q of questions()) {
    if (q.kind !== 'org' || answerOf(q)) continue;
    const left = q.hits.filter((x) => !x.on && app.state.overrides[x.key] === undefined);
    if (left.length) out.push({ q, left });
  }
  return out;
}
// höchstens zehn Stellen, dann „und n weitere“; jede mit Fundort und „Im Text zeigen“
function placeItems(list) {
  const items = list.slice(0, 10).map((x) => ({ text: `${/^[„“"»«]/.test(x.text) ? x.text.replace(/\s+/g, ' ') : '„' + x.text.replace(/\s+/g, ' ') + '“'} – ${unitPlace(x.unit)}`, act: ['Im Text zeigen', () => showUnit(x.unit)] }));
  if (list.length > 10) items.push({ text: `und ${list.length - 10} weitere` });
  return items;
}
function showUnit(ui) {
  show('a2');
  const sheets = app.doc.kind === 'xlsx' && app.doc.raw.view ? app.doc.raw.view : null;
  if (sheets) {
    const si = sheets.findIndex((sh) => sh.cells.some((c) => c.u === ui));
    if (si >= 0 && si !== app.sheetTab) { app.sheetTab = si; renderDoc(); }
  }
  requestAnimationFrame(() => {
    const el = document.querySelector(`#docview [data-u="${ui}"]`);
    if (!el) return;
    const top = $('.top') ? $('.top').getBoundingClientRect().bottom : 0;
    el.style.scrollMarginTop = Math.ceil(top) + 'px';
    el.scrollIntoView({ block: 'center', inline: 'center', behavior: 'auto' });
  });
}
function setWebSwitch(on) {
  const cb = $('#opt-web');
  if (cb.checked === on) return;
  cb.checked = on;
  cb.dispatchEvent(new Event('change'));
}
// Ausgeschaltete Stellen im selben Abschnitt mit diesem Wort (für „Ersetzen“)
function offHitsFor(l) {
  if (l.unit === undefined) return [];
  const w = fold(l.word);
  return app.result.hits.filter((x) => !x.on && x.unit === l.unit && x.type === 'person' && hitText(x).split(/[^\p{L}\p{M}\p{N}'’-]+/u).some((t) => fold(t) === w));
}
function leakPoint(l, i, offered = new Set()) {
  const kind = l.orgCheck ? 'Einrichtung aus deiner Liste, nicht vollständig ersetzt' : l.meta ? (l.metaOrg ? 'Einrichtung aus den Dateiangaben' : 'Name aus den Dateiangaben') : l.org ? 'bestätigte Einrichtung' : 'bestätigter Name';
  const pt = { id: `leak:${i}:${l.word}:${l.where}`, leak: true, text: [h('strong', {}, `„${l.word.replace(/\s+/g, ' ')}“`), ` steht noch in: ${l.where}`], small: `${kind} · „…${(l.context || '').replace(/\s+/g, ' ')}…“`, hint: l.hint || null, acts: [] };
  const taken = (t) => app.state.manualTerms.some((m) => fold(m) === fold(t)) || app.state.orgTerms.some((m) => fold(m) === fold(t));
  if (l.orgCheck || l.org) pt.acts.push(['Im Text zeigen', () => show('a2')]);
  else if (l.meta) { if (!taken(l.full) && !offered.has(fold(l.full))) pt.acts.push(l.metaOrg ? ['Als Einrichtung übernehmen', () => addOrg(l.full)] : ['Als Namen übernehmen', () => addManual(l.full)]); offered.add(fold(l.full)); }
  else if (l.entity === 'Blattname') pt.acts = [];
  else {
    const off = offHitsFor(l);
    if (off.length) pt.acts.push(['Ersetzen', () => setHits(off, true)]);
    else pt.acts.push(['Als Namen übernehmen', () => addManual(l.word)]);
  }
  return pt;
}
function pointSig(pts) { return app.stamp + '#' + pts.filter((p) => !p.busy).map((p) => p.id).join('|'); }
function eCount(pts) { return pts.filter((p) => !p.busy && p.id !== 'more').length; }
function ackValid() { const pts = savePoints(); return !eCount(pts) || app.ackSig === pointSig(pts); }

function renderSave() {
  if (!app.doc || !app.result) return;
  const r = app.result;
  const pts = savePoints();
  const n = eCount(pts);
  const persons = [...r.entities.values()].filter((en) => en.hits.some((x) => x.on)).length;
  const orgsOn = [...r.orgs.values()].filter((og) => og.hits.some((x) => x.on)).length;
  const who = [persons ? plural(persons, 'Person', 'Personen') : '', orgsOn ? plural(orgsOn, 'Einrichtung', 'Einrichtungen') : ''].filter(Boolean).join(' und ');
  const lead = who ? `${who} ${persons + orgsOn === 1 ? 'ist' : 'sind'} ersetzt.` : (r.hits.some((x) => x.on) ? 'Kontaktdaten sind ersetzt.' : 'Es wird nichts ersetzt.');
  $('#save-lead').textContent = lead + (n ? ` ${countWord(n)} ${n === 1 ? 'Punkt' : 'Punkte'} bitte noch ansehen:` : pts.some((p) => p.busy) ? ' Der Schlusscheck läuft …' : '');
  fill($('#points'), ...pts.filter((p) => !p.busy).map((p) => h('li', { class: p.leak ? 'bad' : '' },
    h('span', { class: 'ptext' }, ...(Array.isArray(p.text) ? p.text : [p.text]), p.small ? h('small', {}, p.small) : null, p.hint ? h('small', {}, p.hint) : null,
      p.items ? h('ul', { class: 'plist' }, ...p.items.map((it) => h('li', {}, h('span', {}, it.text), it.act ? h('button', { type: 'button', class: 'secondary small', onclick: it.act[1] }, it.act[0]) : null))) : null),
    p.acts && p.acts.length ? h('span', { class: 'pact' }, ...p.acts.map(([label, fn, id]) => h('button', { type: 'button', class: 'secondary small', id: id || null, onclick: fn }, label))) : null)));
  // Bilderliste (aufgeklappt unter der Fläche)
  fill($('#imgbox'), ...(app.imagesOpen && app.doc.images && app.doc.images.length ? [h('ul', { class: 'imglist', id: 'img-list' }, ...app.doc.images.map((im) => imageTile(im, app.doc.kind === 'xlsx' ? 'Excel' : 'Word')))] : []));
  // EIN Häkchen; erst wählbar, wenn die Bilderliste geöffnet wurde (falls Bilder da sind); fällt bei jeder Änderung zurück
  const needImages = !!(app.doc.images && app.doc.images.length && !app.imagesSeen);
  $('#ack-all-row').hidden = !n;
  $('#ack-all-row').classList.toggle('disabled', needImages);
  $('#ack-all').disabled = needImages;
  $('#ack-all').checked = !!n && app.ackSig === pointSig(pts);
  $('#ack-all-row').title = needImages ? 'Erst die Bilder ansehen.' : '';
  // Details: alles, was in Ordnung ist oder das Tool erledigt hat (I)
  const info = [];
  const spots = r.hits.filter((x) => x.on && x.type === 'person').length;
  const orgSpots = r.hits.filter((x) => x.on && x.type === 'org').length;
  const contacts = r.hits.filter((x) => x.on && x.type !== 'person' && x.type !== 'org' && !x.colHit).length;
  // Version 2.10.0: ganz ersetzte Tabellenzellen eigens gezählt (sonst wie bisher)
  const colCells = new Set(r.hits.filter((x) => x.on && x.colHit).map((x) => x.unit)).size;
  info.push(ampelRow('ok', 'Ersetzt', `${spots} Namens-Stellen${orgSpots ? `, ${orgSpots} Einrichtungs-Stellen` : ''}, ${contacts} Kontaktdaten${colCells ? `, ${colCells} ganze Tabellenzellen` : ''}.`));
  const qs = questions();
  if (qs.length && !open0()) info.push(ampelRow('ok', 'Fragen', 'Alle Fragen beantwortet.'));
  if (app.doc.kind === 'docx' || app.doc.kind === 'xlsx') {
    const names = (app.doc.metaNames || []).map((m) => m.name);
    info.push(ampelRow('ok', 'Versteckte Angaben werden geleert', 'Autor, Bearbeiter, Firma, Manager, Kommentar-Autoren, SharePoint-Felder und Bild-Metadaten.' + (names.length ? ' In den Dateiangaben gefunden: ' + names.join(', ') : '')));
  }
  for (const w of allWarnings()) if (isInfoWarning(w)) info.push(ampelRow('info', 'Hinweis', w));
  const pw = placeholderWordsInfo();
  if (pw) info.push(pw);
  const p = app.preview;
  if (p && !p.busy && !p.error && !p.leaks.length) info.push(ampelRow('ok', 'Schlusscheck', 'Kein Klarname im Ergebnis gefunden.'));
  if (isReversible()) info.push(ampelRow(keySaved() ? 'ok' : 'info', 'Schlüsseldatei', keySaved() ? 'Gespeichert. Bewahre sie getrennt und sicher auf.' : 'Noch nicht gespeichert.'));
  if (app.saved) info.push(ampelRow('ok', 'Gespeichert', `${app.saved.name} – ${app.saved.note}`));
  fill($('#ampel'), ...info);
  renderFileCards();
  renderSaveButtons();
  // Danach
  const fmt = mainFormat();
  $('#save-hint').textContent = fmt === 'docx' ? 'Lade die Datei danach direkt hoch, ohne sie vorher in Word zu öffnen. Sonst trägt Word deinen Namen wieder ein.'
    : fmt === 'xlsx' ? 'Lade die Datei danach direkt hoch, ohne sie vorher in Excel zu öffnen. Sonst trägt Excel deinen Namen wieder ein.' : 'Lade die Datei danach direkt hoch.';
  // Andere Wege
  const k = app.doc.kind;
  $('#btn-txt').hidden = fmt === 'txt';
  $('#btn-docx').hidden = k === 'xlsx' || fmt === 'docx';
  $('#btn-xlsx').hidden = true;
  $('#btn-csv').hidden = true;
  $('#mapping').hidden = isReversible(); // im Modus rückbaufähig ersetzt die Schlüsseldatei die Zuordnungstabelle
  if (!app.preview) startPreview();
}
function open0() { return openQuestions().length; }
// Version 2.3.4: Wörter im Text, die wie Platzhalter aussehen (Information, das Tool weicht ihnen aus)
function placeholderWordsInfo() {
  const pw = app.result && app.result.placeholderWords;
  if (!pw || !pw.words.size) return null;
  const list = [...pw.words.keys()];
  const shown = list.slice(0, 8).map((w) => `„${w}“`).join(', ') + (list.length > 8 ? ' …' : '');
  let text = `Im Text stehen Wörter, die wie Platzhalter aussehen (${shown}). Das Tool verwendet diese Platzhalter nicht.`;
  if (app.state.settings.mode === 'name') text += ' Im Modus „[NAME]“ heißen alle Namen gleich; die KI kann dort Wörter aus dem Original und Platzhalter des Tools nicht unterscheiden.';
  const li = ampelRow('info', 'Wörter wie Platzhalter', text);
  li.id = 'placeholder-words';
  return li;
}
// ---------- Bilder ----------
function imagesPending() { return !!(app.doc && app.doc.images && app.doc.images.length && !(app.imagesSeen && ackValid())); }
function placeholder(lines) { return h('div', { class: 'imgph' }, ...lines.map((l, i) => h(i ? 'span' : 'strong', {}, l))); }
function imageTile(im, prog) {
  let pic;
  if (im.linked) pic = placeholder(['Verknüpftes Bild', 'verknüpft, nicht in der Datei']);
  else if (im.mime && app.imageUrls.has(im.nr)) {
    pic = h('img', { class: 'thumb', src: app.imageUrls.get(im.nr), alt: `Vorschau Bild ${im.nr}` });
    pic.addEventListener('error', () => pic.replaceWith(placeholder([im.type, `Kann hier nicht angezeigt werden. Bitte in ${prog} ansehen.`])));
  } else if (im.mime) pic = placeholder([im.type, 'Vorschau wird geladen …']);
  else pic = placeholder([im.type, `Kann hier nicht angezeigt werden. Bitte in ${prog} ansehen.`]);
  const big = app.imageBig.has(im.nr);
  const canZoom = !im.linked && im.mime && app.imageUrls.has(im.nr);
  return h('li', { class: 'imgtile' + (big ? ' big' : ''), 'data-nr': im.nr, 'data-type': im.type, 'data-linked': im.linked ? '1' : '0' },
    h('div', { class: 'imgbox' }, pic,
      canZoom ? h('button', { type: 'button', class: 'textlink zoom', 'aria-pressed': big ? 'true' : 'false', onclick: () => { if (big) app.imageBig.delete(im.nr); else app.imageBig.add(im.nr); renderSave(); } }, big ? 'Kleiner anzeigen' : 'Größer anzeigen') : null),
    h('div', { class: 'imginfo' },
      h('p', {}, h('strong', {}, `Bild ${im.nr}`), ` · ${im.linked ? 'verknüpft' : im.type}`),
      h('p', {}, 'Fundort: ', im.place),
      im.alt ? h('p', {}, 'Beschreibung (Alt-Text): „', im.alt, '“') : null,
      im.title ? h('p', {}, 'Titel: „', im.title, '“') : null,
      !im.alt && !im.title ? h('p', { class: 'hint' }, 'Keine Beschreibung.') : h('p', { class: 'hint' }, 'Die Beschreibung wird wie Text geprüft und ersetzt (Schritt 2).')));
}
// Liste öffnen/schließen. Vorschauen entstehen beim ersten Öffnen als blob:-Adressen (nur im Arbeitsspeicher).
async function openImages(open) {
  app.imagesOpen = open;
  if (open) app.imagesSeen = true;
  renderSave();
  if (!open) return;
  const doc = app.doc;
  for (const im of doc.images) {
    if (!im.mime || app.imageUrls.has(im.nr)) continue;
    const bytes = await getImageBytes(doc.raw.zip, im);
    if (app.doc !== doc) return; // inzwischen anderes Dokument
    if (bytes) app.imageUrls.set(im.nr, URL.createObjectURL(new Blob([bytes], { type: im.mime })));
  }
  if (app.screen === 'a3' && app.doc === doc) renderSave();
}
function dropImagePreviews() {
  for (const url of app.imageUrls.values()) URL.revokeObjectURL(url);
  app.imageUrls = new Map();
  app.imageBig = new Set();
  app.imagesOpen = false;
  app.imagesSeen = false;
}
async function startPreview() {
  const stamp = app.stamp;
  const format = mainFormat();
  app.preview = { stamp, format, busy: true };
  try {
    const { out, leaks } = await outputWithCheck(format);
    if (app.preview && app.preview.stamp === stamp) app.preview = { stamp, format, out, leaks };
  } catch (e) {
    if (app.preview && app.preview.stamp === stamp) app.preview = { stamp, format, leaks: [], error: e.message };
  }
  if (app.screen === 'a3' && app.preview && app.preview.stamp === stamp) renderSave();
}
function renderFileCards() {
  const fmt = mainFormat();
  const kids = [h('span', {}, h('span', { class: 'fname', id: 'fname-out' }, outName(fmt)), ' geht an die KI')];
  if (isReversible()) {
    kids.unshift(h('span', { class: 'key' }, h('span', { class: 'fname', id: 'fname-key' }, keyName()), ' bleibt auf diesem PC (enthält echte Namen, nie weitergeben)'));
    kids.push(h('span', { id: 'key-status', class: 'status' + (keySaved() ? ' ok' : ' hint') }, keySaved() ? app.keyNote : 'Erst „1 Schlüssel speichern“, dann „2 Datei speichern“. Ohne Schlüsseldatei ist kein Rückbau möglich.'));
  }
  fill($('#filecards'), ...kids);
}
// Genau ein Hauptknopf: rückbaufähig erst „1 Schlüssel speichern“, dann „2 Datei speichern“
function renderSaveButtons() {
  const rev = isReversible();
  const key = $('#btn-key');
  const save = $('#btn-save');
  const next = $('#btn-next-doc');
  key.hidden = !rev;
  save.textContent = rev ? '2 Datei speichern' : 'Datei speichern';
  save.dataset.format = mainFormat();
  save.disabled = rev && !keySaved();
  const done = !!app.saved;
  next.hidden = !done;
  key.className = rev && !keySaved() && !done ? 'primary' : 'secondary';
  save.className = (!rev || keySaved()) && !done ? 'primary' : 'secondary';
  next.className = done ? 'primary' : 'secondary';
  $('#a3-info').textContent = done ? 'Gespeichert' : '';
}

// Speichern über die echte Oberfläche. Offene Punkte brauchen das eine Häkchen; dazu die Reihenfolge der Schlüsseldatei.
// Gilt für den Hauptknopf UND alle anderen Wege.
async function doExport(format) {
  const status = $('#export-status');
  if (!app.doc || !app.result) return;
  if (isReversible() && !keySaved()) { status.textContent = 'Bitte zuerst „1 Schlüssel speichern“. Ohne Schlüsseldatei ist kein Rückbau möglich.'; status.className = 'status bad'; return; }
  status.textContent = 'Erzeuge Ausgabe und führe Schlusscheck durch …';
  status.className = 'status';
  try {
    const f = format === 'copy' ? 'txt' : format;
    let res;
    const p = app.preview;
    if (p && !p.busy && !p.error && p.stamp === app.stamp && p.format === f) res = { out: p.out, leaks: p.leaks };
    else {
      res = await outputWithCheck(f);
      // Funde dieses Formats erscheinen als Punkte; das Häkchen gilt dann neu
      if (f === mainFormat() || res.leaks.length) app.preview = { stamp: app.stamp, format: f, out: res.out, leaks: res.leaks };
    }
    const { out, leaks } = res;
    if (!ackValid()) {
      renderSave();
      status.textContent = leaks.length
        ? `Schlusscheck: ${leaks.length} Klarname(n) noch im Ergebnis. Speichern blockiert – bitte die Punkte oben ansehen und „Ich habe alle Punkte gesehen und speichere so.“ abhaken.`
        : 'Speichern blockiert – bitte zuerst die Punkte oben ansehen und „Ich habe alle Punkte gesehen und speichere so.“ abhaken.';
      status.className = 'status bad';
      return;
    }
    const note = leaks.length ? 'mit bestätigten Restfunden' : 'Schlusscheck ohne Fund';
    if (format === 'copy') {
      const ok = await copyText(out.text);
      status.textContent = ok ? `Text in die Zwischenablage kopiert (${note}).` : 'Kopieren nicht möglich. Bitte als .txt speichern.';
      status.className = ok ? 'status ok' : 'status bad';
      return;
    }
    const name = outName(format);
    download(out.zip ? out.bytes : encodeText(out.text), name, MIME[format]);
    app.saved = { name, note };
    status.textContent = `Gespeichert: ${name} – ${note}.`;
    status.className = leaks.length ? 'status warn' : 'status ok';
    renderSave();
  } catch (e) {
    status.textContent = 'Fehler beim Export: ' + e.message;
    status.className = 'status bad';
  }
}

function exportMapping() {
  const ok = window.confirm('ACHTUNG: Die Zuordnungstabelle enthält die ECHTEN NAMEN (Pseudonym → Klarname).\n\nSie wird als SEPARATE Datei gespeichert. Bewahre sie getrennt und sicher auf und gib sie nie zusammen mit dem anonymisierten Dokument weiter.\n\nJetzt speichern?');
  if (!ok) return;
  const rows = [['Pseudonym', 'Klarname (Schreibweisen)', 'Treffer aktiv']];
  for (const en of app.result.entities.values()) {
    const active = en.hits.filter((x) => x.on).length;
    if (!active) continue;
    rows.push([en.label, [...en.forms.keys()].join(' / '), String(active)]);
  }
  const csv = rows.map((r) => r.map((c) => '"' + c.replace(/"/g, '""') + '"').join(';')).join('\r\n');
  download(encodeText('VERTRAULICH – enthält echte Namen\r\n' + csv), 'zuordnung_VERTRAULICH.csv', MIME.csv);
}

// Rückbau-Schlüsseldatei (nur Modus rückbaufähig)
function exportKey() {
  if (!isReversible() || !app.result || !app.result.reversible) return;
  const ok = window.confirm('ACHTUNG: Die Rückbau-Schlüsseldatei enthält die ECHTEN NAMEN und Kontaktdaten.\n\nNie weitergeben, nie an eine KI. Getrennt vom anonymisierten Dokument sicher aufbewahren.\n\nOhne diese Datei ist kein Rückbau möglich.\n\nJetzt speichern?');
  if (!ok) return;
  // Die Kennung kommt als Feld in die Schlüsseldatei (gleich hinter die Tool-Version)
  const { platzhalter, personen, einrichtungen, ...kopf } = buildRestoreKey(app.result, { version: VERSION, kind: app.doc.kind });
  const key = { ...kopf, kennung: app.kennung, platzhalter, personen, ...(einrichtungen ? { einrichtungen } : {}) };
  app.keyStamp = app.stamp;
  app.keyKennung = app.kennung;
  app.keyNote = `Schlüsseldatei gespeichert (${key.platzhalter.length} Platzhalter). Wenn du danach noch Treffer änderst, musst du sie erneut speichern.`;
  download(encodeText(JSON.stringify(key, null, 2)), keyName(), 'application/json');
  renderSave();
}

async function copyKiHint() {
  const mode = KI_HINT[app.state.settings.mode] ? app.state.settings.mode : 'person';
  // Version 2.10.0: Zusatz nur, wenn ganze Tabellenzellen ersetzt sind (sonst genau der bisherige Satz)
  const cols = app.result && app.result.hits.some((x) => x.on && x.colHit);
  const perCell = mode === 'reversible' && app.result && app.result.hits.some((x) => x.on && x.perCell);
  const text = KI_HINT[mode] + (cols ? KI_HINT_COLS[mode] : '') + (perCell ? KI_HINT_PERCELL : '');
  const ok = await copyText(text);
  const st = $('#kihint-status');
  const ta = $('#kihint-text');
  if (ok) { st.textContent = 'Hinweis für die KI kopiert.'; st.className = 'status ok'; ta.hidden = true; } else {
    st.textContent = 'Kopieren ging nicht. Markiere den Satz unten und kopiere ihn selbst.';
    st.className = 'status warn';
    ta.value = text;
    ta.hidden = false;
    ta.select();
  }
}

// ---------- Laden ----------
async function handleFile(file) {
  const st = $('#load-status');
  st.textContent = `Lese „${file.name}“ …`;
  st.className = 'status';
  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    await openBytes(bytes, file.name);
    st.textContent = `Gelesen: ${file.name} (${app.doc.kind.toUpperCase()}, ${app.doc.units.length} Textabschnitte).`;
    st.className = 'status ok';
  } catch (e) {
    resetDoc();
    render();
    st.textContent = e.message;
    st.className = 'status bad';
  }
  renderA1();
}
function resetDoc() {
  dropImagePreviews(); // Vorschauen verwerfen (blob:-Adressen freigeben)
  app.doc = null;
  app.result = null;
  app.answers = new Map();
  app.answerLog = new Map();
  app.answerSeq = 0;
  app.qCurrent = null;
  app.qShown = undefined;
  app.qNote = false;
  app.restSel = null;
  app.listSig = undefined;
  app.ackSig = null;
  app.sheetTab = 0;
  app.openMenu = null;
  app.preview = null;
  app.saved = null;
  app.keyStamp = undefined;
  app.keyNote = '';
  app.kennung = null;
  app.keyKennung = null;
  app.state.overrides = {};
  app.state.merges = {};
  app.state.unlinks = [];
  app.state.nameColumns = {};
  app.state.colTreat = {};
  app.colConfirmed = false;
  app.colRestOpen = false;
  app.colSeq += 1;
  $('#docview').replaceChildren();
  $('#entities').replaceChildren();
  $('#qcard').replaceChildren();
  $('#summary').textContent = '';
  $('#ampel').replaceChildren();
  $('#points').replaceChildren();
  $('#imgbox').replaceChildren();
  $('#filecards').replaceChildren();
  $('#export-status').textContent = '';
  $('#kihint-status').textContent = '';
  $('#kihint-text').hidden = true;
  $('#kihint-text').value = '';
}
async function openBytes(bytes, name) {
  let doc = await loadBytes(bytes, name);
  doc.name = name;
  // Version 2.10.0: Excel mit behandelten Spalten neu lesen (eigene Abschnitte je Zelle dieser Spalten)
  if (doc.kind === 'xlsx') {
    const keep = app.state.colTreat;
    app.state.colTreat = {};
    try { doc = await rereadXlsx(doc); } finally { app.state.colTreat = keep; }
  }
  resetDoc();
  app.doc = doc;
  app.doc.name = name;
  app.kennung = newKennung(); // neue Zufallskennung je geladenem Dokument
  runAnalysis();
}
// „Nächstes Dokument“: alles Geladene verwerfen (Merkliste und Einstellungen bleiben), zurück zum Start
function nextDocument() {
  resetDoc();
  $('#paste').value = '';
  $('#load-status').textContent = '';
  $('#load-status').className = 'status';
  app.modeChosen = false;
  for (const rb2 of document.querySelectorAll('input[name=mode]')) rb2.checked = false;
  app.state.settings.mode = defaultState().settings.mode;
  rbClear();
  render();
  show('start');
}

function init() {
  loadStored();
  // Start
  $('#go-anon').addEventListener('click', () => show('a1'));
  $('#go-restore').addEventListener('click', () => show('r1'));
  for (const b of document.querySelectorAll('[data-back]')) b.addEventListener('click', () => show(BACK[app.screen] || 'start'));
  // A1
  const drop = $('#drop');
  const input = $('#file');
  drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.classList.add('over'); });
  drop.addEventListener('dragleave', () => drop.classList.remove('over'));
  drop.addEventListener('drop', (e) => {
    e.preventDefault();
    drop.classList.remove('over');
    const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (f) handleFile(f);
  });
  // Ziehen außerhalb der Fläche darf die Datei nicht im Browser öffnen
  window.addEventListener('dragover', (e) => e.preventDefault());
  window.addEventListener('drop', (e) => e.preventDefault());
  $('#btn-file').addEventListener('click', () => input.click());
  input.addEventListener('change', () => { if (input.files[0]) handleFile(input.files[0]); input.value = ''; });
  const toggle = (btnSel, panelSel) => $(btnSel).addEventListener('click', () => { const p = $(panelSel); p.hidden = !p.hidden; $(btnSel).setAttribute('aria-expanded', p.hidden ? 'false' : 'true'); });
  toggle('#tgl-paste', '#pastebox');
  toggle('#tgl-adv', '#advanced');
  toggle('#tgl-rb-paste', '#rb-pastebox');
  $('#btn-text').addEventListener('click', async () => {
    const t = $('#paste').value;
    const st = $('#load-status');
    if (!t.trim()) { st.textContent = 'Bitte zuerst Text einfügen.'; st.className = 'status bad'; return; }
    await openBytes(new TextEncoder().encode(t), 'Eingefügter Text');
    st.textContent = 'Gelesen: eingefügter Text.';
    st.className = 'status ok';
    renderA1();
  });
  for (const id of ['email', 'phone', 'iban', 'address', 'web', 'unsureOn']) {
    const cb = $('#opt-' + id);
    cb.checked = app.state.settings[id];
    cb.addEventListener('change', () => {
      app.state.settings[id] = cb.checked;
      app.state.overrides = {};
      // Version 2.6.1 (Entscheidung Easy): Eine Einstellung löscht alle Umschaltungen und deshalb auch alle Antworten
      // (Zustand wie frisch berechnet; die Listen bleiben). Gab es Antworten, sagt die Fragekarte es einmal.
      if (app.answers.size) app.qNote = true;
      app.answers = new Map();
      app.answerLog = new Map();
      app.qCurrent = null;
      runAnalysis();
    });
  }
  // Modus: keine Antwort vorausgewählt
  for (const r of document.querySelectorAll('input[name=mode]')) {
    r.checked = false;
    r.addEventListener('change', () => {
      if (!r.checked) return;
      app.state.settings.mode = r.value;
      app.modeChosen = true;
      if (app.doc) runAnalysis(); else renderA1();
    });
  }
  $('#a1-next').addEventListener('click', () => { if (app.modeChosen && app.doc) show('a2'); });
  // A2
  $('#docview').addEventListener('click', (e) => {
    const m = e.target.closest('mark.hit');
    if (m) {
      const x = app.result.hits[Number(m.dataset.h)];
      // Version 2.10.0: Zelle einer Spalte „ganz ersetzen“ – nur über die Spalten-Übersicht änderbar
      if (x.colHit) return;
      // Regel a2: "unsicher" markiertes Wort nach Anrede und alle seine übertragenen Vorkommen gemeinsam schalten
      setHits(x.a2group ? app.result.hits.filter((y) => y.a2group === x.a2group) : [x], !x.on);
      return;
    }
    const sel = window.getSelection();
    if (sel && !sel.isCollapsed) return;
    const p = caretOffsetAt(e.clientX, e.clientY);
    if (p) { const w = wordAt(p.ui, p.off); if (w) showMarkBar(w, { left: e.clientX - 20, bottom: e.clientY + 10 }); }
  });
  document.addEventListener('selectionchange', () => {
    if (app.screen !== 'a2') return;
    const t = selectionTerm();
    if (t && t.term) showMarkBar(t.term, t.rect, t.raw);
  });
  $('#btn-mark').addEventListener('click', () => addManual(pendingTerm));
  $('#btn-mark-org').addEventListener('click', () => addOrg(pendingTermRaw || pendingTerm));
  $('#btn-mark-cancel').addEventListener('click', () => showMarkBar(null));
  $('#a2-next').addEventListener('click', () => show('a3'));
  $('#tgl-entities').addEventListener('click', () => {
    const el = $('#entities');
    el.hidden = !el.hidden;
    $('#tgl-entities').setAttribute('aria-expanded', el.hidden ? 'false' : 'true');
    $('#tgl-entities').textContent = el.hidden ? 'Liste zeigen' : 'Liste ausblenden';
  });
  // Tasten J/N: nur auf dem Prüfen-Bildschirm und nur, wenn kein Eingabefeld den Fokus hat
  document.addEventListener('keydown', (e) => {
    if (app.screen !== 'a2' || e.ctrlKey || e.metaKey || e.altKey) return;
    const t = e.target;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    const k = e.key.toLowerCase();
    const sel = { j: '#q-yes', n: '#q-no', arrowleft: '#q-prev', arrowright: '#q-next' }[k];
    if (!sel) return;
    const btn = $(sel);
    if (btn && !btn.disabled) { e.preventDefault(); btn.click(); }
  });
  // Listen (Erweitert)
  // Eigene Namen: beim Hinzufügen die Art wählen (Person oder Einrichtung)
  $('#name-add').addEventListener('submit', (e) => {
    e.preventDefault();
    const v = $('#name-input').value;
    const org = $('#name-kind').value === 'org';
    $('#name-input').value = '';
    if (v.trim()) app.addedSinceLoad = true;
    if (app.doc) { if (org) addOrg(v); else addManual(v); return; }
    const t = org ? cleanOrgTerm(v) : cleanTerm(v);
    if (t && org) { app.state.manualTerms = app.state.manualTerms.filter((m) => fold(m) !== fold(t)); if (!app.state.orgTerms.some((m) => fold(m) === fold(t))) app.state.orgTerms.push(t); }
    else if (t) { app.state.orgTerms = app.state.orgTerms.filter((m) => fold(m) !== fold(t)); if (!app.state.manualTerms.some((m) => fold(m) === fold(t))) app.state.manualTerms.push(t); }
    saveStored();
    renderLists();
  });
  $('#exc-add').addEventListener('submit', (e) => {
    e.preventDefault();
    const t = cleanTerm($('#exc-input').value);
    $('#exc-input').value = '';
    if (t) app.addedSinceLoad = true;
    if (t && !app.state.exceptions.some((m) => fold(m) === fold(t))) app.state.exceptions.push(t);
    saveStored();
    runAnalysisOrRender();
  });
  const enablePersist = () => {
    const ok = window.confirm('Die Merkliste enthält ECHTE NAMEN. Sie wird dann unverschlüsselt im Speicher dieses Browsers abgelegt (nur auf diesem Gerät, wird nicht gesendet). Fortfahren?');
    if (ok) { app.persist = true; saveStored(); }
    renderLists();
  };
  $('#persist').addEventListener('change', (e) => {
    if (e.target.checked) { e.target.checked = false; enablePersist(); } else {
      app.persist = false;
      storeDel();
      renderLists();
    }
  });
  $('#btn-persist').addEventListener('click', enablePersist);
  $('#btn-clear').addEventListener('click', () => {
    if (!window.confirm('Merkliste „Eigene Namen“ und Ausnahmeliste wirklich löschen (auch im Browser-Speicher)?')) return;
    app.state.manualTerms = [];
    app.state.orgTerms = [];
    app.state.exceptions = [];
    app.state.colMemory = {};
    storeDel();
    app.persist = false;
    runAnalysisOrRender();
  });
  $('#btn-list-export').addEventListener('click', () => {
    if (!window.confirm('Die Datei enthält ECHTE NAMEN (Merkliste). Sicher aufbewahren. Speichern?')) return;
    const data = JSON.stringify(listData({ hinweis: 'Enthält echte Namen' }), null, 1);
    download(encodeText(data), 'merkliste_VERTRAULICH.json', 'application/json');
  });
  $('#btn-list-import').addEventListener('click', () => $('#list-file').click());
  $('#list-file').addEventListener('change', async (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    try {
      const d = JSON.parse(new TextDecoder().decode(new Uint8Array(await f.arrayBuffer())).replace(/^﻿/, ''));
      for (const n of (d.names || [])) if (typeof n === 'string' && !app.state.manualTerms.some((m) => fold(m) === fold(n))) app.state.manualTerms.push(n);
      // Version 2.3: Einrichtungen; ältere Merklisten ohne „einrichtungen“ laden wie bisher nur Personen
      for (const n of (Array.isArray(d.einrichtungen) ? d.einrichtungen : [])) if (typeof n === 'string' && !app.state.orgTerms.some((m) => fold(m) === fold(n))) app.state.orgTerms.push(n);
      for (const n of (d.exceptions || [])) if (typeof n === 'string' && !app.state.exceptions.some((m) => fold(m) === fold(n))) app.state.exceptions.push(n);
      // Version 2.10.0: gemerkte Wahl je Spaltenüberschrift
      Object.assign(app.state.colMemory, colMemoryFrom(d.spalten));
      saveStored();
      runAnalysisOrRender();
    } catch { window.alert('Die Datei ist keine gültige Merkliste.'); }
  });
  // A3
  $('#ack-all').addEventListener('change', (e) => { app.ackSig = e.target.checked ? pointSig(savePoints()) : null; renderSave(); });
  $('#btn-save').addEventListener('click', () => doExport(mainFormat()));
  $('#btn-key').addEventListener('click', exportKey);
  $('#btn-next-doc').addEventListener('click', nextDocument);
  $('#btn-copy').addEventListener('click', () => doExport('copy'));
  $('#btn-txt').addEventListener('click', () => doExport('txt'));
  $('#btn-docx').addEventListener('click', () => doExport('docx'));
  $('#btn-xlsx').addEventListener('click', () => doExport('xlsx'));
  $('#btn-csv').addEventListener('click', () => doExport('csv'));
  $('#btn-map').addEventListener('click', exportMapping);
  $('#btn-kihint').addEventListener('click', copyKiHint);
  initRestore();
  render();
  show('start');
}

// ---------- Rückbau ----------
const rb = { file: null, key: null, plan: null, left: null, ackSig: null, saved: null, keyKennung: null };

async function rbLoadFile(bytes, name) {
  const st = $('#rb-file-status');
  rb.file = null;
  rb.plan = null;
  rbReset();
  try {
    if (bytes.length > MAX_BYTES) throw new Error(`Die Datei ist zu groß (Grenze ${MAX_BYTES / 1048576} MB).`);
    const kind = await sniff(bytes, name);
    if (kind === 'pdf') throw new Error('PDF ist für den Rückbau nicht möglich. Bitte die anonymisierte .txt- oder .docx-Datei verwenden.');
    let raw;
    if (kind === 'txt') raw = readTxt(bytes);
    else if (kind === 'csv') raw = readCsv(bytes);
    else if (kind === 'docx') raw = await readDocx(bytes);
    else raw = await readXlsx(bytes);
    // Kennung der bearbeiteten Datei: aus der unsichtbaren Eigenschaft (Word/Excel) und aus dem Dateinamen
    const propK = kind === 'docx' || kind === 'xlsx' ? await readKennungProperty(raw.zip, raw.docs) : null;
    rb.file = { kind, bytes, raw, name, units: raw.units.map((u) => ({ text: u.text, label: u.label || '' })),
      kennung: { prop: isKennung(propK) ? propK : null, propRaw: propK, file: kennungFromFileName(name) } };
    st.textContent = `Geladen: ${name} (${kind.toUpperCase()}, ${rb.file.units.length} Textabschnitte).`;
    st.className = 'status ok';
  } catch (e) {
    st.textContent = e.message;
    st.className = 'status bad';
  }
  renderR1();
}
async function rbLoadKey(text) {
  const st = $('#rb-key-status');
  rb.key = null;
  rb.keyKennung = null;
  rbReset();
  const r = parseKeyFile(text);
  if (!r.ok) { st.textContent = r.error; st.className = 'status bad'; renderR1(); return; }
  // Kennung der Schlüsseldatei (Schlüssel vor Version 2.1 haben keine)
  let kk = null;
  try { const d = JSON.parse(text.replace(/^\uFEFF/, '')); kk = d.kennung === undefined ? null : d.kennung; } catch { kk = null; }
  if (kk !== null && !isKennung(kk)) { st.textContent = 'Die Schlüsseldatei ist beschädigt (ungültige Kennung).'; st.className = 'status bad'; renderR1(); return; }
  rb.key = r.key;
  rb.keyKennung = kk;
  st.textContent = `Schlüsseldatei geladen: ${r.key.entries.size} Platzhalter${kk ? ', Kennung ' + kk : ' (ohne Kennung)'} (erstellt mit Version ${r.key.toolVersion}${r.key.kind ? ', Quelle ' + r.key.kind.toUpperCase() : ''}).`;
  st.className = 'status ok';
  renderR1();
}
function rbReset() {
  rb.plan = null;
  rb.left = null;
  rb.ackSig = null;
  rb.saved = null;
  $('#rb-report').replaceChildren();
  $('#rb-left').hidden = true;
  $('#rb-status').textContent = '';
}
function rbClear() {
  rb.file = null;
  rb.key = null;
  rb.keyKennung = null;
  rbReset();
  $('#rb-file-status').textContent = '';
  $('#rb-key-status').textContent = '';
  $('#rb-paste').value = '';
  $('#rb-ampel').replaceChildren();
}
function renderR1() {
  const ok = !!(rb.file && rb.key);
  $('#rb-btn-check').disabled = !ok;
  $('#r1-info').textContent = ok ? '' : !rb.file && !rb.key ? 'Lade beide Dateien.' : !rb.file ? 'Es fehlt die bearbeitete Datei.' : 'Es fehlt die Schlüsseldatei.';
}

function rbCheck() {
  rbReset();
  if (!rb.file || !rb.key) { $('#r1-info').textContent = 'Bitte zuerst die bearbeitete Datei UND die Schlüsseldatei laden.'; return; }
  const plan = planRestore(rb.file.units, rb.key);
  rb.plan = plan;
  rb.left = null;
  renderR2();
  show('r2');
  // Schlusscheck nach dem Rückbau gleich hier (Version 2.5.0), damit alle Punkte zusammen mit EINEM Häkchen bestätigt werden
  if (plan.verdict !== 'falsch') rbLeftovers().then((left) => { if (rb.plan === plan) { rb.left = left; renderR2(); } }).catch((e) => { if (rb.plan === plan) { rb.left = [{ where: 'Datei', text: 'Fehler', kontext: e.message }]; renderR2(); } });
}
// Kennung: Gehören Datei und Schlüssel zusammen? Die Eigenschaft in der Datei gilt vor dem Dateinamen.
function kennungState() {
  const fk = rb.file.kennung;
  const doc = fk.prop || fk.file;
  const conflict = fk.prop && fk.file && fk.prop !== fk.file ? `Die Eigenschaft in der Datei (${fk.prop}) und der Dateiname (${fk.file}) widersprechen sich; es gilt die Eigenschaft.` : '';
  const key = rb.keyKennung;
  if (!key) return { state: 'oldkey', doc, key, conflict, needsAck: false };
  if (!doc) return { state: 'none', doc, key, conflict, needsAck: true };
  if (doc === key) return { state: 'ok', doc, key, conflict, needsAck: false };
  return { state: 'other', doc, key, conflict, needsAck: true };
}
function kennungBlocked() { const k = kennungState(); return k.needsAck && !rbAckValid(); }

// Fundstelle eines Abschnitts der zurückzubauenden Datei in einfacher Sprache
function rbPlace(ui) {
  const u = rb.file.units[ui];
  if (rb.file.kind === 'txt') return `Zeile ${ui + 1}`;
  return u && u.label ? plainLabel(u.label, rb.file.kind) : `Abschnitt ${ui + 1}`;
}
function rbWhere(w) { return String(w || '').replace(/^Zeile (\d+)$/, 'Zeile $1').replace(/^(.*)!([A-Z]+\d+)$/, 'Blatt $1, Zelle $2'); }
function restBlocked() { return !!(rb.plan && rb.plan.rests.length && !rbAckValid()); }
const ART = { unbekannt: 'unbekannter Platzhalter (nicht in der Schlüsseldatei) – bleibt stehen', verändert: 'veränderter Platzhalter (z. B. Kleinschreibung) – wird NICHT ersetzt', gebeugt: 'gebeugter Platzhalter (z. B. „des Nachnamens A“) – wird NICHT ersetzt', getrennt: 'getrennter Platzhalter (Zeilenumbruch) – wird NICHT ersetzt' };
const STATUS = { weniger: 'weniger als erwartet (gelöscht oder umgeschrieben?)', mehr: 'mehr als erwartet (eingefügt?)' };
// Auffälligkeiten des Rückbaus (E); fatal: kein Rückbau möglich
function rbPoints() {
  const plan = rb.plan;
  const pts = [];
  const k = kennungState();
  const extra = k.conflict ? ' ' + k.conflict : '';
  if (k.state === 'other') pts.push({ id: 'kennung', cls: 'bad', text: `Diese Schlüsseldatei gehört zu einem anderen Dokument (Dokument: ${k.doc}, Schlüssel: ${k.key}).${extra}` });
  else if (k.state === 'none') pts.push({ id: 'kennung', text: `Im Dokument steht keine Kennung. Der Schlüssel hat die Kennung ${k.key}. Prüfe, ob beide zusammengehören.${extra}` });
  else if (k.state === 'oldkey') pts.push({ id: 'kennung', text: `Schlüssel ohne Kennung (erstellt vor Version 2.1). Prüfe selbst, ob Datei und Schlüssel zusammengehören.${k.doc ? ` Das Dokument hat die Kennung ${k.doc}.` : ''}${extra}` });
  if (plan.verdict === 'falsch') { pts.push({ id: 'falsch', fatal: true, text: 'Die Schlüsseldatei passt nicht: Kein einziger Platzhalter aus der Schlüsseldatei wurde in der Datei gefunden. Es wird nichts erzeugt. Prüfe, ob Datei und Schlüsseldatei zusammengehören.' }); return pts; }
  if (plan.verdict === 'zweifelhaft') pts.push({ id: 'zweifel', text: `Wahrscheinlich die falsche Schlüsseldatei: ${plan.matchedKeys} von ${rb.key.entries.size} Platzhaltern gefunden, nur bei ${plan.okRows} stimmt die Anzahl, ${plan.unknown} unbekannte Platzhalter in der Datei.` });
  for (const r of plan.rows.filter((x) => x.status !== 'ok')) pts.push({ id: 'row:' + r.platzhalter, text: `„${r.platzhalter}“ (${r.kategorie}): erwartet ${r.erwartet}, gefunden ${r.gefunden} – ${STATUS[r.status] || r.status}` });
  plan.issues.slice(0, 300).forEach((x, i) => pts.push({ id: 'issue:' + i, text: `„${x.text}“ – ${ART[x.art] || x.art}${x.vermutlich ? ' (gemeint vermutlich „' + x.vermutlich + '“)' : ''}`, small: `${rbWhere(x.where)}: „…${x.kontext}…“` }));
  plan.rests.slice(0, 300).forEach((x, i) => pts.push({ id: 'rest:' + i, rest: true, text: `„${x.text}“ sieht nach dem Rückbau noch wie ein Platzhalter aus und bleibt so stehen.`, small: `${rbPlace(x.unit)}: „…${x.kontext}…“` }));
  for (const o of plan.originals || []) if (o.gefunden !== o.erwartet) pts.push({ id: 'orig:' + o.text, text: `„${o.text}“ stand schon im Original (${o.erwartet}×), gefunden: ${o.gefunden}× (geändert, gelöscht oder eingefügt?).` });
  (rb.left || []).slice(0, 200).forEach((x, i) => pts.push({ id: 'left:' + i, text: `„${x.text}“ steht nach dem Rückbau noch als Platzhalter in der Datei.`, small: `${rbWhere(x.where)}: „…${x.kontext}…“` }));
  if (plan.needsConfirm && !pts.length) pts.push({ id: 'confirm', text: 'Es gibt Abweichungen. Nicht ersetzte Stellen bleiben als Platzhalter stehen und müssen von Hand korrigiert werden.' });
  return pts;
}
function rbSig(pts) { return pts.map((p) => p.id).join('|'); }
function rbAckValid() { const pts = rbPoints(); return !pts.length || rb.ackSig === rbSig(pts); }
function rbBlocked() {
  const pts = rbPoints();
  return pts.some((p) => p.fatal) || rb.left === null || (pts.length > 0 && rb.ackSig !== rbSig(pts));
}
function renderR2() {
  const plan = rb.plan;
  const pts = rbPoints();
  const fatal = pts.some((p) => p.fatal);
  const n = pts.length;
  const lead = fatal ? 'Rückbau nicht möglich.' : n ? `${countWord(n)} ${n === 1 ? 'Punkt' : 'Punkte'} bitte ansehen:` : rb.left === null ? 'Prüfe …' : 'Alles passt.';
  const kids = [h('p', { class: 'lead', id: 'rb-lead2' }, lead)];
  if (n) kids.push(h('ul', { class: 'points', id: 'rb-points' }, ...pts.map((p) => h('li', { class: p.fatal || p.rest || p.cls === 'bad' ? 'bad' : '', 'data-id': p.id },
    h('span', { class: 'ptext' }, p.rest ? h('strong', {}, p.text) : p.text, p.small ? h('small', {}, p.small) : null)))));
  if (n && !fatal) {
    kids.push(h('label', { class: 'check ackrow' }, h('input', { type: 'checkbox', id: 'rb-ack', checked: rb.ackSig === rbSig(pts), onchange: (e) => { rb.ackSig = e.target.checked ? rbSig(rbPoints()) : null; renderR2(); } }),
      h('span', {}, 'Ich habe alle Punkte gesehen und baue so zurück.')));
  }
  if (rb.left === null && !fatal) kids.push(h('p', { class: 'hint' }, 'Der Schlusscheck nach dem Rückbau läuft …'));
  // Details: vollständige Tabelle und alles, was in Ordnung ist
  if (!fatal) {
    const k = kennungState();
    const info = [];
    if (k.state === 'ok') { const li = ampelRow('ok', 'Kennung', `Kennung ${k.doc} passt.${k.conflict ? ' ' + k.conflict : ''}`); li.id = 'rb-kennung-ok'; info.push(li); }
    info.push(ampelRow('ok', 'Platzhalter', `${plan.totalFound} Platzhalter werden ersetzt (${plan.matchedKeys} verschiedene).`));
    if (!plan.issues.length) info.push(ampelRow('ok', 'Auffällige Stellen', 'Keine.'));
    if (!plan.rests.length) info.push(ampelRow('ok', 'Platzhalter-Reste nach dem Rückbau', 'Keine.'));
    for (const o of plan.originals || []) if (o.gefunden === o.erwartet) info.push(ampelRow('info', `„${o.text}“ stand schon im Original (${o.erwartet}×)`, 'Bleibt unverändert. Kein Platzhalter des Tools.'));
    kids.push(h('details', { class: 'otherways', id: 'rb-details' }, h('summary', {}, 'Details'), h('ul', { class: 'infolist' }, ...info),
      h('div', { class: 'rbscroll' }, h('table', { class: 'rbtable' },
        h('thead', {}, h('tr', {}, h('th', {}, 'Platzhalter'), h('th', {}, 'Art'), h('th', {}, 'erwartet'), h('th', {}, 'gefunden'), h('th', {}, 'Status'))),
        h('tbody', {}, ...plan.rows.map((r) => h('tr', { class: r.status === 'ok' ? '' : 'bad' },
          h('td', {}, r.platzhalter), h('td', {}, r.kategorie), h('td', {}, String(r.erwartet)), h('td', {}, String(r.gefunden)),
          h('td', {}, r.status === 'ok' ? 'in Ordnung' : STATUS[r.status] || r.status))))))));
  }
  fill($('#rb-report'), ...kids);
  const blocked = rbBlocked();
  $('#r2-next').disabled = blocked;
  $('#r2-info').textContent = fatal ? 'Rückbau nicht möglich' : rb.left === null ? 'Prüfe …' : blocked ? 'Bitte bestätigen' : '';
}
function renderR3() {
  if (!rb.plan || !rb.file) return;
  $('#rb-lead').textContent = `${rb.plan.totalFound} Platzhalter werden durch die echten Namen ersetzt.`;
  $('#rb-fname').textContent = `wiederhergestellt_${f2base(rb.file.kind)}.${rb.file.kind}`;
  const rows = [ampelRow('info', 'Nicht zurück kommen', 'Autor, Kommentar-Autoren und andere Dateiangaben (z. B. Firma) werden nicht wiederhergestellt.')];
  if (rb.saved) rows.unshift(ampelRow('ok', 'Gespeichert', rb.saved));
  fill($('#rb-ampel'), ...rows);
  $('#rb-btn-copy').hidden = rb.file.kind !== 'txt';
  $('#rb-btn-save').textContent = `Wiederhergestellte Datei speichern (.${rb.file.kind})`;
  $('#rb-btn-save').className = rb.saved ? 'secondary' : 'primary';
  $('#rb-next-doc').hidden = !rb.saved;
  $('#rb-next-doc').className = rb.saved ? 'primary' : 'secondary';
}

async function rbBuild() {
  const f = rb.file;
  const restoreStr = makeRestoreString(rb.key);
  const reps = rb.plan.repsPerUnit;
  const texts = () => f.raw.units.map((u, i) => applyReplacements(u.text, reps[i]));
  if (f.kind === 'docx') return { bytes: await writeDocx(f.bytes, reps, restoreStr, { clean: false }), zip: true };
  if (f.kind === 'xlsx') {
    const sheetIssues = [];
    // Version 2.10.0: Zahl- und Datumszellen bekommen Zelltyp und Wert zurück (Schlüssel mit „zelle“)
    const restoreCells = new Map([...rb.key.entries].filter(([, e]) => e.zelle).map(([ph, e]) => [ph, e.zelle]));
    const bytes = await writeXlsx(f.bytes, reps, restoreStr, { clean: false, onSheetName: (x) => sheetIssues.push(x), restoreCells: restoreCells.size ? restoreCells : null });
    return { bytes, zip: true, sheetIssues };
  }
  if (f.kind === 'csv') return { text: writeCsv(f.raw, texts()), bom: f.raw.bom };
  return { text: writeTxt(f.raw, texts()), bom: f.raw.bom };
}
// Schlusscheck nach dem Rückbau: Platzhalter (oder Reste davon), die noch in der Datei stehen
async function rbLeftovers(out) {
  out = out || await rbBuild();
  const texts = out.zip ? await collectZipTexts(await JSZip.loadAsync(out.bytes)) : [{ where: 'Text', text: out.text }];
  const left = findLeftovers(rb.key, texts).map((x) => ({ ...x, where: out.zip ? plainPart(x.where) : x.where }));
  // Sicherheitsnetz (2.3.3) über die ganze Datei: Reste, die nicht schon im Bericht stehen (z. B. in Teilen außerhalb der
  // Abschnitte), und die nicht schon als Platzhalter aus der Schlüsseldatei gemeldet sind
  const known = rb.plan.rests.map((x) => x.text).concat(left.map((x) => x.text));
  for (const t of texts) {
    for (const r of findPlaceholderRests(t.text)) {
      if (rb.key.original && rb.key.original.has(r.text)) continue; // stand schon im Original (2.3.4)
      const i = known.indexOf(r.text);
      if (i >= 0) { known.splice(i, 1); continue; }
      left.push({ where: out.zip ? plainPart(t.where) : t.where, text: r.text, kontext: r.kontext });
    }
  }
  for (const x of out.sheetIssues || []) left.push({ where: 'Excel', text: x.requested, kontext: `Blattname nicht zulässig, gespeichert als „${x.actual}“` });
  return left;
}

async function rbSave(copy) {
  const st = $('#rb-status');
  if (!rb.plan || rb.plan.verdict === 'falsch') return;
  if (rbBlocked()) { st.textContent = 'Bitte zuerst im Schritt „Prüfen“ die Punkte ansehen und das Häkchen setzen.'; st.className = 'status bad'; return; }
  st.textContent = 'Erzeuge Datei und führe Schlusscheck durch …';
  st.className = 'status';
  try {
    const out = await rbBuild();
    const left = await rbLeftovers(out);
    // Neue Funde gegenüber dem Schritt „Prüfen“: erst dort ansehen und bestätigen
    if (left.length !== (rb.left || []).length) {
      rb.left = left;
      renderR2();
      st.textContent = `Schlusscheck: ${left.length} Platzhalter (oder Reste davon) stehen noch im Ergebnis. Bitte im Schritt „Prüfen“ ansehen und bestätigen.`;
      st.className = 'status bad';
      return;
    }
    if (copy) {
      const ok = await copyText(out.text);
      st.textContent = ok ? 'Wiederhergestellter Text kopiert.' : 'Kopieren nicht möglich.';
    } else {
      const name = `wiederhergestellt_${f2base(rb.file.kind)}.${rb.file.kind}`;
      const bytes = out.zip ? out.bytes : (out.bom ? encodeText(out.text) : encodeTextPlain(out.text));
      download(bytes, name, MIME[rb.file.kind]);
      st.textContent = `Gespeichert: ${name}` + (left.length ? ' (mit bestätigten Restfunden).' : ' – Schlusscheck ohne Fund.');
      rb.saved = `${name}` + (left.length ? ' (mit bestätigten Restfunden)' : ' – Schlusscheck ohne Fund');
      renderR3();
    }
    st.className = left.length ? 'status warn' : 'status ok';
  } catch (e) {
    st.textContent = 'Fehler beim Rückbau: ' + e.message;
    st.className = 'status bad';
  }
}
function f2base(kind) { return { txt: 'text', csv: 'tabelle', docx: 'dokument', xlsx: 'tabelle' }[kind]; }

function initRestore() {
  const dropZone = (sel, onFile) => {
    const d = $(sel);
    d.addEventListener('dragover', (e) => { e.preventDefault(); d.classList.add('over'); });
    d.addEventListener('dragleave', () => d.classList.remove('over'));
    d.addEventListener('drop', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      d.classList.remove('over');
      const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (f) await onFile(f);
    });
  };
  dropZone('#rb-drop', async (f) => rbLoadFile(new Uint8Array(await f.arrayBuffer()), f.name));
  dropZone('#rb-key-drop', async (f) => rbLoadKey(new TextDecoder().decode(new Uint8Array(await f.arrayBuffer()))));
  const input = $('#rb-file');
  $('#rb-btn-file').addEventListener('click', () => input.click());
  input.addEventListener('change', async () => {
    const f = input.files[0];
    input.value = '';
    if (f) await rbLoadFile(new Uint8Array(await f.arrayBuffer()), f.name);
  });
  $('#rb-btn-text').addEventListener('click', async () => {
    const t = $('#rb-paste').value;
    if (!t.trim()) { $('#rb-file-status').textContent = 'Bitte zuerst Text einfügen.'; $('#rb-file-status').className = 'status bad'; return; }
    await rbLoadFile(new TextEncoder().encode(t), 'eingefuegt.txt');
  });
  $('#rb-btn-key').addEventListener('click', () => $('#rb-key').click());
  $('#rb-key').addEventListener('change', async (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    if (f) await rbLoadKey(new TextDecoder().decode(new Uint8Array(await f.arrayBuffer())));
  });
  $('#rb-btn-check').addEventListener('click', rbCheck);
  $('#r2-next').addEventListener('click', () => { if (!$('#r2-next').disabled) show('r3'); });
  $('#rb-btn-save').addEventListener('click', () => rbSave(false));
  $('#rb-btn-copy').addEventListener('click', () => rbSave(true));
  $('#rb-next-doc').addEventListener('click', nextDocument);
}

// Für automatische Tests (nur lesend nutzbar, kein Netzwerk)
window.__anon = { app, openBytes, imagesPending, buildOutput, applyColumns, finalCheck, addManual, addOrg, KI_HINT, KI_HINT_PERCELL, runAnalysis, rb, rbLoadFile, rbLoadKey, rbCheck, show, questions, newKennung, answer, answerOf, savePoints,
  // Version 2.6.1 (Tests): gezeigte Frage, ihre Stellen, Fragenwechsel
  goQuestion, shownQuestion: () => { const r = shownQuestion(); return { ids: r.qs.map((q) => q.id), idx: r.idx }; },
  currentHits: () => currentHits().map((x) => x.id), showQ: (id) => { app.qCurrent = id; refreshMarks(); renderQuestions(); } };

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
