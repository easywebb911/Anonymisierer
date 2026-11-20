// Oberfläche des Anonymisierers (Version 2: geführte Bedienung, ein Bildschirm pro Schritt).
// Kein Netzwerk, kein Speichern ohne ausdrücklichen Schalter. Erkennung, Ersetzung, Export, Bereinigung,
// Schlusscheck und Rückbau kommen unverändert aus src/core und src/formats.
import './lockdown.js';
import JSZip from 'jszip';
import {
  analyze, defaultState, replacementsByUnit, applyReplacements, leakForms, findLeaks, makeGenericReplacer,
  metaLeakForms, makeNameTest,
} from '../core/detect.js';
import { fold } from '../core/fold.js';
import { readTxt, writeTxt, readCsv, writeCsv, encodeText, encodeTextPlain } from '../formats/text.js';
import { MODE_REVERSIBLE, buildRestoreKey } from '../core/reversible.js';
import { parseKeyFile, planRestore, makeRestoreString, findLeftovers } from '../core/restore.js';
import { readDocx, writeDocx, buildDocx } from '../formats/docx.js';
import { readXlsx, writeXlsx } from '../formats/xlsx.js';
import { collectZipTexts } from '../formats/xmlutil.js';
import { describePart, readKennungProperty } from '../formats/meta.js';
import { newKennung, isKennung, kennungFromFileName } from './kennung.js';
import { readPdf } from '../formats/pdf.js';

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
  reversible: 'Der Text enthält Platzhalter wie „Vorname A“, „Nachname A“, „Name A“, „Initiale A.“ und „[E-MAIL-1]“. Diese Platzhalter bitte nie verändern, nicht beugen, nicht übersetzen und nicht trennen. Zeige mir nur die Fehler, schreibe den Text nicht neu.',
  person: 'Der Text enthält Platzhalter wie „Person A“ und „[E-MAIL]“ anstelle echter Namen und Kontaktdaten. Diese Platzhalter bitte unverändert lassen. Zeige mir nur die Fehler, schreibe den Text nicht neu.',
  name: 'Der Text enthält Platzhalter wie „[NAME]“ und „[E-MAIL]“ anstelle echter Namen und Kontaktdaten. Diese Platzhalter bitte unverändert lassen. Zeige mir nur die Fehler, schreibe den Text nicht neu.',
};

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
  ackWarnings: new Set(),
  leakAck: false,
  persist: false,
  screen: 'start',
  modeChosen: false,
  answers: new Map(), // Frage-Kennung -> 'ja' | 'nein'
  qReview: -1, // >= 0: Fragen werden noch einmal gezeigt (Position)
  questionsAck: false, // ausdrücklich mit offenen Fragen speichern
  openMenu: null, // Personenliste: offenes Menü (Personen-Schlüssel)
  preview: null, // Schlusscheck-Vorschau auf dem Speichern-Bildschirm {stamp, format, out, leaks, busy}
  saved: null, // {name}
  keyStamp: undefined,
  stamp: 0,
  kennung: null, // Modus rückbaufähig: Zufallskennung des geladenen Dokuments
  keyKennung: null, // Kennung der zuletzt gespeicherten Schlüsseldatei
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
    app.state.exceptions = Array.isArray(d.exceptions) ? d.exceptions.filter((x) => typeof x === 'string') : [];
    app.persist = true;
  } catch { storeDel(); }
}
function saveStored() {
  if (!app.persist) return;
  storeSet(JSON.stringify({ names: app.state.manualTerms, exceptions: app.state.exceptions }));
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

async function loadBytes(bytes, name) {
  if (bytes.length > MAX_BYTES) throw new Error(`Die Datei ist zu groß (${(bytes.length / 1048576).toFixed(1)} MB). Grenze: ${MAX_BYTES / 1048576} MB.`);
  const kind = await sniff(bytes, name);
  let doc;
  if (kind === 'txt') doc = readTxt(bytes);
  else if (kind === 'csv') doc = readCsv(bytes);
  else if (kind === 'docx') doc = await readDocx(bytes);
  else if (kind === 'xlsx') doc = await readXlsx(bytes);
  else if (kind === 'pdf') doc = await readPdf(bytes);
  // row/cell nur für die Anzeige (Tabellenzeilen als Zeilen); die Erkennung nutzt nur text/label/follows/heading
  const units = doc.units.map((u) => ({ text: u.text, label: u.label || '', follows: !!u.follows, heading: !!u.heading,
    row: u.row !== undefined ? (u.part || '') + '#' + u.row : null, cell: u.cell }));
  const warnings = [...(doc.warnings || [])];
  if (bytes.length > WARN_BYTES) warnings.push(`Große Datei (${(bytes.length / 1048576).toFixed(1)} MB): Auf dem iPhone kann die Verarbeitung langsam sein oder abbrechen.`);
  return { kind, units, warnings, bytes, info: doc.info || '', raw: doc, metaNames: doc.metaNames || [] };
}

// ---------- Analyse ----------
function runAnalysis() {
  if (!app.doc) return;
  app.result = analyze(app.doc.units, app.state);
  changed();
  render();
}
// Jede Änderung der Treffer: Schlusscheck-Bestätigung verfällt, Schlüsseldatei muss neu gespeichert werden
function changed() {
  // Wurde zur aktuellen Kennung schon eine Schlüsseldatei gespeichert, bekommt jeder neue Stand eine neue Kennung.
  // So gibt es nie zwei verschiedene Schlüsseldateien mit derselben Kennung.
  if (app.keyKennung && app.keyKennung === app.kennung) app.kennung = newKennung();
  app.leakAck = false;
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
  if (d.kind === 'txt') return writeTxt(d.raw, texts);
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
  return [{ paragraphs: writeTxt(d.raw, texts).split(/\r\n|\n|\r/) }];
}
// Suchformen für den Schlusscheck: bestätigte Namen + Namen aus den Original-Metadaten (Dateiangaben)
function checkForms() {
  const forms = leakForms(app.result);
  const meta = metaLeakForms(app.doc.metaNames);
  for (const [k, f] of meta.forms) if (!forms.has(k)) forms.set(k, f);
  return { forms, phrases: meta.phrases };
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
    const bytes = await writeXlsx(d.bytes, reps, generic, { onSheetName: (x) => sheetIssues.push(x), containsName, kennung });
    return { bytes, zip: true, sheetIssues };
  }
  if (format === 'docx') return { bytes: await buildDocx(docxSections(), { kennung }), zip: true };
  if (format === 'csv') return { text: writeCsv(d.raw, newUnitTexts()) };
  return { text: plainTextExport() };
}
// Schlusscheck: ALLE Teile der Ausgabedatei (Text, Eigenschaften, SharePoint-Daten, Bilder …) nach bestätigten
// Namen und nach Namen aus den Original-Metadaten durchsuchen. Fundstelle in einfacher Sprache.
async function finalCheck(out) {
  const { forms, phrases } = checkForms();
  let texts;
  if (out.zip) texts = (await collectZipTexts(await JSZip.loadAsync(out.bytes), { inflatePng: true })).map((t) => ({ ...t, where: describePart(t.where) }));
  else texts = [{ where: 'Text', text: out.text }];
  return findLeaks(forms, texts, phrases);
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

// ---------- Fragen (unsichere Treffer und Namen aus den Dateiangaben) ----------
// Eine Frage pro Person bzw. Wort (nicht pro Vorkommen). Ja schaltet alle unsicheren Vorkommen an, Nein alle aus.
function questions() {
  const r = app.result;
  if (!r) return [];
  const qs = [];
  for (const en of r.entities.values()) {
    const unsure = en.hits.filter((x) => x.type === 'person' && x.cert === 'unsicher');
    if (!unsure.length) continue;
    const word = r.fullText.slice(unsure[0].s, unsure[0].e);
    qs.push({ id: 'p:' + en.key, kind: 'hit', en, hits: unsure, word, first: unsure[0] });
  }
  for (const m of app.doc.metaNames || []) {
    const taken = app.state.manualTerms.some((t) => fold(t) === fold(m.name));
    qs.push({ id: 'm:' + fold(m.name), kind: 'meta', name: m.name, where: m.where, taken });
  }
  return qs;
}
function answerOf(q) { return app.answers.get(q.id) || (q.kind === 'meta' && q.taken ? 'ja' : null); }
function openQuestions() { return questions().filter((q) => !answerOf(q)); }
function answer(q, yes) {
  app.answers.set(q.id, yes ? 'ja' : 'nein');
  if (app.qReview >= 0) app.qReview += 1;
  if (q.kind === 'hit') setHits(q.hits, yes);
  else if (yes && !q.taken) addManual(q.name); // rechnet neu und zeichnet alles
  renderQuestions();
  renderA2Info();
}
// Kontext: der Satz (bzw. die Zeile) um das Vorkommen, das Wort hervorgehoben
function contextOf(hit) {
  const r = app.result;
  const ui = hit.unit;
  const base = r.unitStarts[ui];
  const t = app.doc.units[ui].text;
  const s = hit.s - base;
  const e = hit.e - base;
  let a = s;
  while (a > 0 && !/[.!?\n]/.test(t[a - 1]) && s - a < 120) a--;
  let b = e;
  while (b < t.length && !/[.!?\n]/.test(t[b]) && b - e < 120) b++;
  if (b < t.length && /[.!?]/.test(t[b])) b++;
  return h('p', { class: 'qctx' }, (a > 0 ? '…' : '') + t.slice(a, s).trimStart(), h('mark', { class: 'hit unsure on' }, t.slice(s, e)), t.slice(e, b).trimEnd() + (b < t.length ? '…' : ''));
}
function renderQuestions() {
  const box = $('#qcard');
  const qs = questions();
  if (!qs.length) { box.replaceChildren(h('p', { class: 'qcount' }, 'Keine Fragen'), h('p', {}, 'Es gibt keine unsicheren Treffer und keine Namen in den Dateiangaben.')); return; }
  let idx;
  if (app.qReview >= 0) {
    if (app.qReview >= qs.length) app.qReview = -1; else idx = app.qReview;
  }
  if (idx === undefined) idx = qs.findIndex((q) => !answerOf(q));
  if (idx < 0) {
    box.replaceChildren(h('p', { class: 'qcount' }, `${qs.length} von ${qs.length} Fragen`), h('p', { class: 'qask' }, 'Alle Fragen beantwortet'),
      h('button', { type: 'button', class: 'secondary', id: 'q-again', onclick: () => { app.qReview = 0; renderQuestions(); } }, 'Fragen noch einmal zeigen'));
    return;
  }
  const q = qs[idx];
  const prev = answerOf(q);
  const kids = [h('p', { class: 'qcount' }, `Frage ${idx + 1} von ${qs.length}`)];
  if (q.kind === 'hit') {
    kids.push(contextOf(q.first), h('p', { class: 'qask' }, `Ist „${q.word}“ hier ein Name?`));
    if (q.hits.length > 1) kids.push(h('p', { class: 'hint' }, `Gilt für alle ${q.hits.length} unsicheren Stellen dieser Person.`));
  } else {
    kids.push(h('p', { class: 'qask' }, `In den Dateiangaben steht „${q.name}“. Als Namen übernehmen?`),
      h('p', { class: 'hint' }, `${q.where}. Bei „Ja“ wird der Name überall im Text ersetzt. Aus den Dateiangaben wird er so oder so entfernt.`));
  }
  if (prev) kids.push(h('p', { class: 'hint' }, `Bisherige Antwort: ${prev === 'ja' ? 'Ja' : 'Nein'}`));
  kids.push(h('div', { class: 'qbtns' },
    h('button', { type: 'button', class: 'secondary', id: 'q-yes', onclick: () => answer(q, true) }, q.kind === 'hit' ? 'Ja, Name' : 'Ja, übernehmen'),
    h('button', { type: 'button', class: 'secondary', id: 'q-no', onclick: () => answer(q, false) }, 'Nein')),
  h('p', { class: 'qkeys' }, 'Tasten: J = Ja, N = Nein'));
  box.replaceChildren(...kids);
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
    pg.replaceChildren(...STEPS[st[0]].map((label, i) => {
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
  renderQuestions();
  renderA2Info();
  if (app.screen === 'a3') renderSave();
}

function renderSummary() {
  const r = app.result;
  const persons = r.hits.filter((x) => x.type === 'person');
  const sure = persons.filter((x) => x.cert === 'sicher').length;
  const contacts = r.hits.length - persons.length;
  $('#summary').textContent = `${app.doc.name || 'Eingefügter Text'} · ${r.entities.size} ${r.entities.size === 1 ? 'Person' : 'Personen'} · ${persons.length} Namens-Treffer (${sure} sicher, ${persons.length - sure} unsicher) · ${contacts} Kontaktdaten · aktiv: ${r.hits.filter((x) => x.on).length}` + (app.doc.info ? ' · ' + app.doc.info : '');
}

function hitTitle(x) {
  return (x.on ? 'wird ersetzt durch: ' + x.label : 'bleibt stehen (aus)') + (x.cert === 'unsicher' ? ' · unsicherer Treffer' : '') + (x.origin === 'manual' ? ' · von dir markiert' : '') + (x.link ? ' · zugeordnet über ' + x.link : '') + ' · Tippen = an/aus';
}

// Schnelles Umschalten ohne Neuberechnung (Treffer bleiben gleich, nur an/aus ändert sich)
function setHits(list, on) {
  for (const x of list) {
    x.on = on;
    app.state.overrides[x.key] = on;
    const m = document.querySelector(`mark[data-h="${x.id}"]`);
    if (m) { m.classList.toggle('on', on); m.classList.toggle('off', !on); m.title = hitTitle(x); }
  }
  changed();
  renderSummary();
  renderEntities();
  renderA2Info();
  if (app.screen === 'a3') renderSave();
}

// Anzeige-Gruppe eines Abschnitts: Kopfzeilen, Fußnoten, Kommentare, Excel-Blätter, PDF-Seiten …
// Haupttext und Tabellen bekommen kein Etikett; Tabellenzeilen werden als Zeilen gezeigt.
function unitView(u) {
  const label = u.label.replace(/ \(mit gelöschtem Text aus Änderungsverfolgung\)$/, '');
  const deleted = label !== u.label;
  const kind = app.doc.kind;
  if (kind === 'docx') {
    if (label === 'Text' || label === 'Tabelle') return { section: '', row: u.row, cell: u.cell, deleted };
    return { section: label, row: u.row, cell: u.cell, deleted };
  }
  if (kind === 'xlsx') {
    const m = label.match(/^(.*)!([A-Z]+)(\d+)( \((?:Formel|Formelergebnis)\))?( \(ausgeblendet\))?$/);
    if (m) return { section: `Blatt „${m[1]}“${m[5] ? ' (ausgeblendet)' : ''}`, row: 'x:' + m[1] + ':' + m[3], cell: m[2], ref: m[2] + m[3] + (m[4] || '') };
    return { section: label };
  }
  if (kind === 'csv') {
    const m = label.match(/^Zeile (\d+), Spalte (\d+)$/);
    if (m) return { section: '', row: 'c:' + m[1], cell: m[2] };
    return { section: label };
  }
  return { section: label };
}

function renderDoc() {
  const r = app.result;
  const view = $('#docview');
  const frag = document.createDocumentFragment();
  let hi = 0;
  const hits = r.hits;
  let section = null;
  let rowEl = null;
  let rowKey = null;
  let cellEl = null;
  let cellKey = null;
  app.doc.units.forEach((u, ui) => {
    if (!u.text.trim()) return;
    const v = unitView(u);
    if (v.section !== section) {
      section = v.section;
      rowEl = null; rowKey = null;
      if (section) frag.append(h('h3', { class: 'section-label' }, section));
    }
    const base = r.unitStarts[ui];
    const box = h('div', { class: 'unit' });
    if (v.deleted) box.append(h('span', { class: 'cellref' }, 'mit gelöschtem Text aus der Änderungsverfolgung'));
    const tx = h('div', { class: 'utext', 'data-u': ui });
    let pos = 0;
    while (hi < hits.length && hits[hi].s < base) hi++;
    while (hi < hits.length && hits[hi].s < base + u.text.length + 1) {
      const x = hits[hi];
      const s = x.s - base;
      const e = x.e - base;
      if (s > pos) tx.append(document.createTextNode(u.text.slice(pos, s)));
      const cls = ['hit', x.type === 'person' ? (x.cert === 'sicher' ? 'sure' : 'unsure') : 'contact', x.origin === 'manual' ? 'manual' : '', x.on ? 'on' : 'off'].filter(Boolean).join(' ');
      tx.append(h('mark', { class: cls, 'data-h': x.id, 'data-l': x.type === 'person' ? (app.state.settings.mode === 'name' ? 'NAME' : r.entities.get(x.entity).letter) : x.label.replace(/[[\]]/g, ''), title: hitTitle(x) }, u.text.slice(s, e)));
      pos = e;
      hi++;
    }
    if (pos < u.text.length) tx.append(document.createTextNode(u.text.slice(pos)));
    box.append(tx);
    if (v.row !== null && v.row !== undefined) {
      if (v.row !== rowKey) { rowKey = v.row; rowEl = h('div', { class: 'trow' }); frag.append(rowEl); cellKey = null; }
      if (v.cell !== cellKey) { cellKey = v.cell; cellEl = h('div', { class: 'tcell' }); rowEl.append(cellEl); }
      if (v.ref) box.prepend(h('span', { class: 'cellref' }, v.ref));
      cellEl.append(box);
    } else {
      rowEl = null; rowKey = null;
      frag.append(box);
    }
  });
  view.replaceChildren(frag);
}

function renderEntities() {
  const r = app.result;
  const list = $('#entities');
  const ents = [...r.entities.values()];
  list.replaceChildren(...ents.map((en) => {
    const active = en.hits.filter((x) => x.on).length;
    const unsure = en.hits.filter((x) => x.cert === 'unsicher').length;
    const open = app.openMenu === en.key;
    const row = h('div', { class: 'entity' + (active ? '' : ' muted') },
      h('label', { class: 'switch' }, h('input', { type: 'checkbox', checked: active > 0, 'aria-label': `${en.label} (${en.display}) an/aus`, onchange: (e) => setHits(en.hits, e.target.checked) })),
      h('span', { class: 'ename' }, h('strong', {}, en.display), h('small', {}, en.label + (unsure ? ` · ${unsure} unsicher` : '') + (en.manual ? ' · von dir markiert' : ''))),
      h('span', { class: 'count', title: 'Treffer (aktiv / gesamt)' }, `${active}/${en.count}`),
      h('button', { type: 'button', class: 'menubtn', 'aria-label': `Mehr zu ${en.display}`, 'aria-expanded': open ? 'true' : 'false', onclick: () => { app.openMenu = open ? null : en.key; renderEntities(); } }, icon('dots')));
    if (open) row.append(entityMenu(en, ents));
    return row;
  }));
  if (!ents.length) list.replaceChildren(h('p', { class: 'muted' }, 'Keine Personen erkannt. Nicht erkannte Namen bitte im Text markieren.'));
}
function entityMenu(en, ents) {
  const r = app.result;
  const forms = [...en.forms.entries()].map(([f, c]) => `${f} (${c})`).join(', ');
  const linked = en.hits.filter((x) => x.link);
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
    } }, 'für nächstes Mal merken'));
}

function chipList(arr, onRemove) {
  return arr.map((t, i) => h('span', { class: 'chip' }, t, h('button', { type: 'button', class: 'x', 'aria-label': t + ' entfernen', onclick: () => onRemove(i) }, '×')));
}
function renderLists() {
  $('#names-chips').replaceChildren(...chipList(app.state.manualTerms, (i) => { app.state.manualTerms.splice(i, 1); saveStored(); runAnalysisOrRender(); }));
  $('#exc-chips').replaceChildren(...chipList(app.state.exceptions, (i) => { app.state.exceptions.splice(i, 1); saveStored(); runAnalysisOrRender(); }));
  $('#persist').checked = app.persist;
  $('#names-empty').hidden = app.state.manualTerms.length > 0;
  $('#exc-empty').hidden = app.state.exceptions.length > 0;
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
function showMarkBar(term, rect) {
  pendingTerm = term;
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
  if (a.ui !== b.ui) return { term: cleanTerm(sel.toString()), rect: r.getBoundingClientRect() };
  return { term: cleanTerm(texts[a.ui].text.slice(a.off, b.off)), rect: r.getBoundingClientRect() };
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
  if (!app.state.manualTerms.some((m) => fold(m) === fold(t))) app.state.manualTerms.push(t);
  app.state.exceptions = app.state.exceptions.filter((e) => fold(e) !== fold(t));
  saveStored();
  showMarkBar(null);
  const sel = window.getSelection();
  if (sel) sel.removeAllRanges();
  runAnalysis();
}

// ---------- Speichern-Bildschirm (Ampel) ----------
function allWarnings() {
  if (!app.doc) return [];
  const list = [...app.doc.warnings];
  const rv = app.result && app.result.reversible;
  if (rv && rv.clashes.length) {
    list.push(`Das Original enthält schon Text, der wie ein Platzhalter aussieht (${rv.clashes.slice(0, 5).join(', ')}${rv.clashes.length > 5 ? ' …' : ''}). Beim Rückbau würde dieser Text ebenfalls ersetzt. Bitte vorher prüfen oder umformulieren.`);
  }
  return list;
}
function unackedWarnings() { return allWarnings().filter((w) => !app.ackWarnings.has(w)); }

function ampelRow(state, title, text, ...extra) {
  return h('li', { class: state === 'ok' ? 'ok' : state },
    h('span', { class: 'icon' }, icon(state === 'ok' ? 'check' : 'alert')),
    h('div', { class: 'body' }, h('p', { class: 'title' }, title), text ? h('p', { class: 'state' }, text) : null, ...extra));
}

function renderSave() {
  if (!app.doc || !app.result) return;
  const r = app.result;
  const rows = [];
  const persons = [...r.entities.values()].filter((en) => en.hits.some((x) => x.on)).length;
  const spots = r.hits.filter((x) => x.on && x.type === 'person').length;
  const contacts = r.hits.filter((x) => x.on && x.type !== 'person').length;
  rows.push(spots || contacts
    ? ampelRow('ok', 'Ersetzte Personen und Stellen', `${persons} ${persons === 1 ? 'Person' : 'Personen'} · ${spots} Namens-Stellen · ${contacts} Kontaktdaten werden ersetzt. In Ordnung.`)
    : ampelRow('warn', 'Ersetzte Personen und Stellen', 'Es wird nichts ersetzt. Prüfe in Schritt 2, ob Namen fehlen.'));
  // Fragen
  const qs = questions();
  const open = qs.filter((q) => !answerOf(q)).length;
  if (qs.length) {
    rows.push(open
      ? ampelRow(app.questionsAck ? 'ok' : 'warn', 'Fragen', `Noch ${open} ${open === 1 ? 'Frage' : 'Fragen'} offen. Beantworte sie oder bestätige, dass du trotzdem speichern willst.`,
        h('div', { class: 'row' }, h('button', { type: 'button', class: 'secondary small', onclick: () => { app.qReview = -1; show('a2'); } }, 'Zurück zu den Fragen')),
        h('label', { class: 'check' }, h('input', { type: 'checkbox', id: 'ack-questions', checked: app.questionsAck, onchange: (e) => { app.questionsAck = e.target.checked; renderSave(); } }), ' Ich speichere trotzdem mit offenen Fragen.'))
      : ampelRow('ok', 'Fragen', 'Alle Fragen beantwortet. In Ordnung.'));
  }
  // Versteckte Angaben (nur Word/Excel)
  if (app.doc.kind === 'docx' || app.doc.kind === 'xlsx') {
    const names = (app.doc.metaNames || []).map((m) => m.name);
    rows.push(ampelRow('ok', 'Versteckte Angaben werden geleert', 'Autor, Bearbeiter, Firma, Manager, Kommentar-Autoren, SharePoint-Felder und Bild-Metadaten. In Ordnung.',
      names.length ? h('p', { class: 'hint' }, 'In den Dateiangaben gefunden: ' + names.join(', ')) : null));
  }
  // Datei-Hinweise, je einer mit Abhaken (Sperre wie bisher)
  for (const w of allWarnings()) {
    const done = app.ackWarnings.has(w);
    rows.push(Object.assign(ampelRow(done ? 'ok' : 'warn', 'Hinweis zur Datei', w,
      h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: done, onchange: (e) => { if (e.target.checked) app.ackWarnings.add(w); else app.ackWarnings.delete(w); renderSave(); } }), ' Gelesen')), { className: (done ? 'ok' : 'warn') + ' docwarn' }));
  }
  if (app.doc.kind === 'pdf') rows.push(ampelRow('warn', 'PDF-Eingabe', 'Ausgabe nur als Text (.txt/.docx). Das Originallayout bleibt NICHT erhalten.'));
  // Schlüsseldatei
  if (isReversible()) {
    rows.push(keySaved()
      ? ampelRow('ok', 'Schlüsseldatei', 'Gespeichert. Bewahre sie getrennt und sicher auf.')
      : ampelRow('warn', 'Schlüsseldatei', 'Noch nicht gespeichert. Erst „1 Schlüssel speichern“, dann „2 Datei speichern“. Ohne Schlüsseldatei ist kein Rückbau möglich.'));
  }
  // Schlusscheck
  rows.push(schlusscheckRow());
  if (app.saved) rows.push(ampelRow('ok', 'Gespeichert', `${app.saved.name} – ${app.saved.note}`));
  $('#ampel').replaceChildren(...rows);
  renderFileCards();
  renderSaveButtons();
  // Danach
  const fmt = mainFormat();
  $('#save-hint').textContent = fmt === 'docx' ? SAVE_HINT_WORD : fmt === 'xlsx' ? SAVE_HINT_EXCEL : '';
  $('#save-hint').hidden = !(fmt === 'docx' || fmt === 'xlsx');
  // Andere Wege
  const k = app.doc.kind;
  $('#btn-txt').hidden = fmt === 'txt';
  $('#btn-docx').hidden = k === 'xlsx' || fmt === 'docx';
  $('#btn-xlsx').hidden = true;
  $('#btn-csv').hidden = true;
  $('#mapping').hidden = isReversible(); // im Modus rückbaufähig ersetzt die Schlüsseldatei die Zuordnungstabelle
  if (!app.preview) startPreview();
}
function schlusscheckRow() {
  const p = app.preview;
  if (!p || p.busy) return ampelRow('warn', 'Schlusscheck', 'Der Schlusscheck läuft …');
  if (p.error) return ampelRow('bad', 'Schlusscheck', 'Fehler: ' + p.error);
  if (!p.leaks.length) return ampelRow('ok', 'Schlusscheck', 'Kein Klarname im Ergebnis gefunden. In Ordnung.');
  return ampelRow(app.leakAck ? 'ok' : 'warn', 'Schlusscheck', `${p.leaks.length} Klarname(n) noch im Ergebnis. Übernimm sie als Namen oder lass sie bewusst stehen.`, leaksBox(p.leaks));
}
// Fundstellen des Schlusschecks mit beiden Wegen (als Namen übernehmen / bewusst stehen lassen)
function leaksBox(leaks) {
  const place = (w) => { const m = w.match(/^(.*?) – (.+)$/); return m ? { ort: m[1], teil: m[2] } : { ort: w, teil: '' }; };
  const offered = new Set(); // „als Namen übernehmen“ nur einmal je Name anbieten
  const items = leaks.slice(0, 200).map((l) => {
    const pl = place(l.where);
    const taken = !l.full || offered.has(fold(l.full)) || app.state.manualTerms.some((t) => fold(t) === fold(l.full));
    if (l.full) offered.add(fold(l.full));
    return h('li', {}, h('strong', {}, l.word), ' – steht in: ', h('strong', {}, pl.ort), pl.teil ? ` (${pl.teil})` : '',
      ` · ${l.meta ? 'Name ' + l.entity : 'bestätigter Name, ' + l.entity}: „…${l.context.replace(/\s+/g, ' ')}…“ `,
      l.meta && !taken ? h('button', { type: 'button', class: 'secondary small', onclick: () => addManual(l.full) }, `„${l.full}“ als Namen übernehmen`) : null);
  });
  return h('div', { id: 'leaks', class: 'leaks' },
    h('p', {}, 'Bestätigte Namen (z. B. weil einzelne Treffer ausgeschaltet sind) oder Namen aus den Dateiangaben der Originaldatei (Autor, Bearbeiter, Firma …).'),
    h('p', {}, h('strong', {}, 'Was tun? '), 'Entweder „als Namen übernehmen“ (bzw. den Treffer in Schritt 2 einschalten): Dann wird der Name überall ersetzt. Oder bewusst stehen lassen: unten abhaken.'),
    h('ul', {}, ...items),
    leaks.length > 200 ? h('p', {}, `… und ${leaks.length - 200} weitere.`) : null,
    h('label', { class: 'check' }, h('input', { type: 'checkbox', id: 'leak-ack', checked: app.leakAck, onchange: (e) => { app.leakAck = e.target.checked; renderSave(); } }),
      ' Ich habe diese Fundstellen geprüft und lasse sie bewusst stehen.'));
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
  const cards = [h('div', { class: 'filecard' }, h('p', { class: 'hint' }, 'Für die KI'), h('p', { class: 'fname', id: 'fname-out' }, outName(fmt)))];
  if (isReversible()) {
    cards.push(h('div', { class: 'filecard key' }, h('p', {}, h('strong', {}, 'Bleibt auf diesem PC · enthält echte Namen')), h('p', { class: 'fname', id: 'fname-key' }, keyName()),
      h('p', {}, 'Ohne diese Datei ist kein Rückbau möglich. Nie weitergeben, nie an eine KI.'),
      h('p', { id: 'key-status', class: 'status' + (keySaved() ? ' ok' : '') }, keySaved() ? app.keyNote : '')));
  }
  $('#filecards').replaceChildren(...cards);
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

// Speichern über die echte Oberfläche. Alle Sperren wie bisher (Hinweise, Schlusscheck) plus offene Fragen und
// Schlüsseldatei-Reihenfolge. Gilt für den Hauptknopf UND alle anderen Wege.
async function doExport(format) {
  const status = $('#export-status');
  if (!app.doc || !app.result) return;
  if (unackedWarnings().length) { status.textContent = 'Bitte zuerst alle Hinweise in der Liste oben abhaken.'; status.className = 'status bad'; return; }
  if (openQuestions().length && !app.questionsAck) { status.textContent = 'Es sind noch Fragen offen. Beantworte sie in Schritt 2 oder bestätige oben, dass du trotzdem speichern willst.'; status.className = 'status bad'; return; }
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
      if (f === mainFormat()) app.preview = { stamp: app.stamp, format: f, out: res.out, leaks: res.leaks };
    }
    const { out, leaks } = res;
    if (leaks.length && !app.leakAck) {
      if (f !== mainFormat()) app.preview = { stamp: app.stamp, format: f, out, leaks };
      renderSave();
      status.textContent = `Schlusscheck: ${leaks.length} Klarname(n) noch im Ergebnis gefunden (bestätigte Namen oder Namen aus den Dateiangaben). Export blockiert – bitte prüfen (siehe Liste oben).`;
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
  const { platzhalter, personen, ...kopf } = buildRestoreKey(app.result, { version: VERSION, kind: app.doc.kind });
  const key = { ...kopf, kennung: app.kennung, platzhalter, personen };
  app.keyStamp = app.stamp;
  app.keyKennung = app.kennung;
  app.keyNote = `Schlüsseldatei gespeichert (${key.platzhalter.length} Platzhalter). Wenn du danach noch Treffer änderst, musst du sie erneut speichern.`;
  download(encodeText(JSON.stringify(key, null, 2)), keyName(), 'application/json');
  renderSave();
}

async function copyKiHint() {
  const text = KI_HINT[app.state.settings.mode] || KI_HINT.person;
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
  app.doc = null;
  app.result = null;
  app.ackWarnings = new Set();
  app.answers = new Map();
  app.qReview = -1;
  app.questionsAck = false;
  app.openMenu = null;
  app.preview = null;
  app.saved = null;
  app.keyStamp = undefined;
  app.keyNote = '';
  app.kennung = null;
  app.keyKennung = null;
  app.leakAck = false;
  app.state.overrides = {};
  app.state.merges = {};
  app.state.unlinks = [];
  $('#docview').replaceChildren();
  $('#entities').replaceChildren();
  $('#qcard').replaceChildren();
  $('#summary').textContent = '';
  $('#ampel').replaceChildren();
  $('#filecards').replaceChildren();
  $('#export-status').textContent = '';
  $('#kihint-status').textContent = '';
  $('#kihint-text').hidden = true;
  $('#kihint-text').value = '';
}
async function openBytes(bytes, name) {
  const doc = await loadBytes(bytes, name);
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
  for (const id of ['email', 'phone', 'iban', 'address', 'unsureOn']) {
    const cb = $('#opt-' + id);
    cb.checked = app.state.settings[id];
    cb.addEventListener('change', () => { app.state.settings[id] = cb.checked; app.state.overrides = {}; runAnalysis(); });
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
    if (t && t.term) showMarkBar(t.term, t.rect);
  });
  $('#btn-mark').addEventListener('click', () => addManual(pendingTerm));
  $('#btn-mark-cancel').addEventListener('click', () => showMarkBar(null));
  $('#a2-next').addEventListener('click', () => show('a3'));
  // Tasten J/N: nur auf dem Prüfen-Bildschirm und nur, wenn kein Eingabefeld den Fokus hat
  document.addEventListener('keydown', (e) => {
    if (app.screen !== 'a2' || e.ctrlKey || e.metaKey || e.altKey) return;
    const t = e.target;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    const k = e.key.toLowerCase();
    if (k !== 'j' && k !== 'n') return;
    const btn = $(k === 'j' ? '#q-yes' : '#q-no');
    if (btn) { e.preventDefault(); btn.click(); }
  });
  // Listen (Erweitert)
  $('#name-add').addEventListener('submit', (e) => { e.preventDefault(); const v = $('#name-input').value; $('#name-input').value = ''; if (app.doc) addManual(v); else { const t = cleanTerm(v); if (t && !app.state.manualTerms.some((m) => fold(m) === fold(t))) app.state.manualTerms.push(t); saveStored(); renderLists(); } });
  $('#exc-add').addEventListener('submit', (e) => {
    e.preventDefault();
    const t = cleanTerm($('#exc-input').value);
    $('#exc-input').value = '';
    if (t && !app.state.exceptions.some((m) => fold(m) === fold(t))) app.state.exceptions.push(t);
    saveStored();
    runAnalysisOrRender();
  });
  $('#persist').addEventListener('change', (e) => {
    if (e.target.checked) {
      const ok = window.confirm('Die Merkliste enthält ECHTE NAMEN. Sie wird dann unverschlüsselt im Speicher dieses Browsers abgelegt (nur auf diesem Gerät, wird nicht gesendet). Fortfahren?');
      if (!ok) { e.target.checked = false; return; }
      app.persist = true;
      saveStored();
    } else {
      app.persist = false;
      storeDel();
    }
  });
  $('#btn-clear').addEventListener('click', () => {
    if (!window.confirm('Merkliste „Eigene Namen“ und Ausnahmeliste wirklich löschen (auch im Browser-Speicher)?')) return;
    app.state.manualTerms = [];
    app.state.exceptions = [];
    storeDel();
    app.persist = false;
    runAnalysisOrRender();
  });
  $('#btn-list-export').addEventListener('click', () => {
    if (!window.confirm('Die Datei enthält ECHTE NAMEN (Merkliste). Sicher aufbewahren. Speichern?')) return;
    const data = JSON.stringify({ hinweis: 'Enthält echte Namen', names: app.state.manualTerms, exceptions: app.state.exceptions }, null, 1);
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
      for (const n of (d.exceptions || [])) if (typeof n === 'string' && !app.state.exceptions.some((m) => fold(m) === fold(n))) app.state.exceptions.push(n);
      saveStored();
      runAnalysisOrRender();
    } catch { window.alert('Die Datei ist keine gültige Merkliste.'); }
  });
  // A3
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
const rb = { file: null, key: null, plan: null, leftAck: false, confirmAck: false, saved: null, keyKennung: null, kennungAck: false };

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
  rb.leftAck = false;
  rb.confirmAck = false;
  rb.kennungAck = false;
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

const ART = { unbekannt: 'unbekannter Platzhalter (nicht in der Schlüsseldatei) – bleibt stehen', verändert: 'veränderter Platzhalter (z. B. Kleinschreibung) – NICHT ersetzt', gebeugt: 'gebeugter Platzhalter (z. B. „des Nachnamens A“) – NICHT ersetzt', getrennt: 'getrennter Platzhalter (Zeilenumbruch) – NICHT ersetzt' };

function rbCheck() {
  rbReset();
  if (!rb.file || !rb.key) { $('#r1-info').textContent = 'Bitte zuerst die bearbeitete Datei UND die Schlüsseldatei laden.'; return; }
  const plan = planRestore(rb.file.units, rb.key);
  rb.plan = plan;
  renderR2();
  show('r2');
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
function kennungRow() {
  const k = kennungState();
  const ack = () => h('label', { class: 'check' }, h('input', { type: 'checkbox', id: 'rb-kennung-ack', checked: rb.kennungAck, onchange: (e) => { rb.kennungAck = e.target.checked; renderR2(); } }),
    k.state === 'other' ? ' Ich weiß, dass die Kennungen nicht passen, und will trotzdem zurückbauen.' : ' Ich habe geprüft, dass Datei und Schlüssel zusammengehören.');
  const extra = k.conflict ? h('p', { class: 'hint' }, k.conflict) : null;
  if (k.state === 'ok') return ampelRow('ok', 'Kennung', `Kennung ${k.doc} passt.`, extra);
  if (k.state === 'other') return ampelRow(rb.kennungAck ? 'warn' : 'bad', 'Kennung', `Diese Schlüsseldatei gehört zu einem anderen Dokument (Dokument: ${k.doc}, Schlüssel: ${k.key}).`, extra, ack());
  if (k.state === 'none') return ampelRow(rb.kennungAck ? 'ok' : 'warn', 'Kennung', `Im Dokument steht keine Kennung. Der Schlüssel hat die Kennung ${k.key}. Bitte prüfe, ob beide zusammengehören.`, extra, ack());
  return ampelRow('warn', 'Kennung', `Schlüssel ohne Kennung (erstellt vor Version 2.1). Der Rückbau funktioniert wie bisher; prüfe selbst, ob Datei und Schlüssel zusammengehören.${k.doc ? ` Das Dokument hat die Kennung ${k.doc}.` : ''}`, extra);
}
function kennungBlocked() { const k = kennungState(); return k.needsAck && !rb.kennungAck; }

function renderR2() {
  const plan = rb.plan;
  const rows = [kennungRow()];
  if (plan.verdict === 'falsch') {
    rows.push(ampelRow('bad', 'Schlüsseldatei passt nicht', 'Kein einziger Platzhalter aus der Schlüsseldatei wurde in der Datei gefunden. Es wird nichts erzeugt. Prüfe, ob Datei und Schlüsseldatei zusammengehören.'));
  } else {
    if (plan.verdict === 'zweifelhaft') {
      rows.push(ampelRow('bad', 'Wahrscheinlich die falsche Schlüsseldatei', `${plan.matchedKeys} von ${rb.key.entries.size} Platzhaltern gefunden, nur bei ${plan.okRows} stimmt die Anzahl, ${plan.unknown} unbekannte Platzhalter in der Datei. Bitte prüfen, ob Datei und Schlüsseldatei zusammengehören.`));
    }
    const bad = plan.rows.filter((r) => r.status !== 'ok');
    rows.push(ampelRow(bad.length ? 'warn' : 'ok', 'Platzhalter', `${plan.totalFound} Platzhalter werden ersetzt (${plan.matchedKeys} verschiedene). Abweichende Anzahl: ${bad.length}.`,
      h('div', { class: 'rbscroll' }, h('table', { class: 'rbtable' },
        h('thead', {}, h('tr', {}, h('th', {}, 'Platzhalter'), h('th', {}, 'Art'), h('th', {}, 'erwartet'), h('th', {}, 'gefunden'), h('th', {}, 'Status'))),
        h('tbody', {}, ...plan.rows.map((r) => h('tr', { class: r.status === 'ok' ? '' : 'bad' },
          h('td', {}, r.platzhalter), h('td', {}, r.kategorie), h('td', {}, String(r.erwartet)), h('td', {}, String(r.gefunden)),
          h('td', {}, r.status === 'ok' ? 'in Ordnung' : r.status === 'weniger' ? 'weniger als erwartet (gelöscht oder umgeschrieben?)' : 'mehr als erwartet (eingefügt?)'))))))));
    rows.push(plan.issues.length
      ? ampelRow('warn', 'Auffällige Stellen', `${plan.issues.length} Stelle(n) werden NICHT ersetzt und bleiben als Platzhalter stehen.`,
        h('ul', {}, ...plan.issues.slice(0, 300).map((x) => h('li', {}, h('strong', {}, x.text), ` – ${ART[x.art] || x.art}${x.vermutlich ? ' (gemeint vermutlich „' + x.vermutlich + '“)' : ''} – ${x.where}: „…${x.kontext}…“`))))
      : ampelRow('ok', 'Auffällige Stellen', 'Keine. In Ordnung.'));
    if (plan.needsConfirm) {
      rows.push(ampelRow(rb.confirmAck ? 'ok' : 'warn', 'Bestätigung nötig', 'Es gibt Abweichungen. Bestätige, dass du sie geprüft hast.',
        h('label', { class: 'check' }, h('input', { type: 'checkbox', id: 'rb-confirm', checked: rb.confirmAck, onchange: (e) => { rb.confirmAck = e.target.checked; renderR2(); } }),
          ' Ich habe die Abweichungen geprüft. Nicht ersetzte Stellen bleiben als Platzhalter stehen und müssen von Hand korrigiert werden.')));
    }
  }
  $('#rb-report').replaceChildren(h('ul', { class: 'ampel' }, ...rows));
  const blocked = plan.verdict === 'falsch' || (plan.needsConfirm && !rb.confirmAck) || kennungBlocked();
  $('#r2-next').disabled = blocked;
  $('#r2-info').textContent = plan.verdict === 'falsch' ? 'Rückbau nicht möglich' : blocked ? 'Bitte bestätigen' : '';
}
function renderR3() {
  if (!rb.plan || !rb.file) return;
  const rows = [ampelRow('ok', 'Rückbau bereit', `${rb.plan.totalFound} Platzhalter werden durch die echten Namen ersetzt.`),
    ampelRow('warn', 'Nicht zurück kommen', 'Autor, Kommentar-Autoren und andere Dateiangaben (z. B. Firma) werden nicht wiederhergestellt.')];
  if (rb.saved) rows.push(ampelRow('ok', 'Gespeichert', rb.saved));
  $('#rb-ampel').replaceChildren(...rows);
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
    const bytes = await writeXlsx(f.bytes, reps, restoreStr, { clean: false, onSheetName: (x) => sheetIssues.push(x) });
    return { bytes, zip: true, sheetIssues };
  }
  if (f.kind === 'csv') return { text: writeCsv(f.raw, texts()), bom: f.raw.bom };
  return { text: writeTxt(f.raw, texts()), bom: f.raw.bom };
}

async function rbSave(copy) {
  const st = $('#rb-status');
  if (!rb.plan || rb.plan.verdict === 'falsch') return;
  if (rb.plan.needsConfirm && !rb.confirmAck) { st.textContent = 'Bitte zuerst die Abweichungen im Bericht prüfen und bestätigen.'; st.className = 'status bad'; return; }
  if (kennungBlocked()) { st.textContent = 'Bitte zuerst die Kennung prüfen und bestätigen (Schritt „Prüfen“).'; st.className = 'status bad'; return; }
  st.textContent = 'Erzeuge Datei und führe Schlusscheck durch …';
  st.className = 'status';
  try {
    const out = await rbBuild();
    const texts = out.zip ? await collectZipTexts(await JSZip.loadAsync(out.bytes)) : [{ where: 'Text', text: out.text }];
    const left = findLeftovers(rb.key, texts);
    for (const x of out.sheetIssues || []) left.push({ where: 'Excel', text: x.requested, kontext: `Blattname nicht zulässig, gespeichert als „${x.actual}“` });
    const box = $('#rb-left');
    box.hidden = !left.length;
    if (left.length) {
      box.replaceChildren(h('h2', { class: 'small-h' }, 'Schlusscheck: Platzhalter noch im Ergebnis'),
        h('ul', {}, ...left.slice(0, 200).map((x) => h('li', {}, h('strong', {}, x.text), ` – ${x.where}: „…${x.kontext}…“`))),
        h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: rb.leftAck, onchange: (e) => { rb.leftAck = e.target.checked; } }), ' Ich habe diese Stellen geprüft und will trotzdem speichern.'));
      if (!rb.leftAck) { st.textContent = `Schlusscheck: ${left.length} Platzhalter aus der Schlüsseldatei stehen noch im Ergebnis. Speichern blockiert – bitte prüfen.`; st.className = 'status bad'; return; }
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
window.__anon = { app, openBytes, buildOutput, finalCheck, addManual, runAnalysis, rb, rbLoadFile, rbLoadKey, rbCheck, show, questions, newKennung };

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
