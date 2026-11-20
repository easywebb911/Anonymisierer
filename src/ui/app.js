// Oberfläche des Anonymisierers. Kein Netzwerk, kein Speichern ohne ausdrücklichen Schalter.
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
import { describePart } from '../formats/meta.js';
import { readPdf } from '../formats/pdf.js';

const MAX_BYTES = 20 * 1024 * 1024;
const WARN_BYTES = 5 * 1024 * 1024;
const STORE_KEY = 'anonymisierer.merkliste.v1';
// eslint-disable-next-line no-undef
const VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'dev';

const $ = (sel) => document.querySelector(sel);
// Hinweis beim Speichern: Word/Excel tragen beim Speichern den Namen des Benutzers wieder in die Datei ein
const SAVE_HINT_WORD = 'Lade die Datei direkt hoch. Wenn du sie vorher in Word öffnest und speicherst, trägt Word deinen Namen wieder ein.';
const SAVE_HINT_EXCEL = 'Lade die Datei direkt hoch. Wenn du sie vorher in Excel öffnest und speicherst, trägt Excel deinen Namen wieder ein.';
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

const app = {
  doc: null, // {kind, units, warnings, bytes, name, info}
  state: defaultState(),
  result: null,
  ackWarnings: new Set(),
  leakAck: false,
  persist: false,
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
  const units = doc.units.map((u) => ({ text: u.text, label: u.label || '', follows: !!u.follows, heading: !!u.heading }));
  const warnings = [...(doc.warnings || [])];
  if (bytes.length > WARN_BYTES) warnings.push(`Große Datei (${(bytes.length / 1048576).toFixed(1)} MB): Auf dem iPhone kann die Verarbeitung langsam sein oder abbrechen.`);
  return { kind, units, warnings, bytes, info: doc.info || '', raw: doc, metaNames: doc.metaNames || [] };
}

// ---------- Analyse ----------
function runAnalysis() {
  if (!app.doc) return;
  app.result = analyze(app.doc.units, app.state);
  app.leakAck = false;
  app.stamp = (app.stamp || 0) + 1; // jede Änderung der Treffer -> Schlüsseldatei muss neu gespeichert werden
  render();
}

// ---------- Ausgabe erzeugen ----------
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
  if (format === 'docx' && d.kind === 'docx') return { bytes: await writeDocx(d.bytes, reps, generic, { containsName }), zip: true };
  if (format === 'xlsx' && d.kind === 'xlsx') {
    const sheetIssues = [];
    const bytes = await writeXlsx(d.bytes, reps, generic, { onSheetName: (x) => sheetIssues.push(x), containsName });
    return { bytes, zip: true, sheetIssues };
  }
  if (format === 'docx') return { bytes: await buildDocx(docxSections()), zip: true };
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

const MIME = {
  txt: 'text/plain;charset=utf-8', csv: 'text/csv;charset=utf-8',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};
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

async function doExport(format) {
  const status = $('#export-status');
  const open = unackedWarnings();
  if (open.length) { status.textContent = 'Bitte zuerst alle Hinweise oben bestätigen.'; status.className = 'status bad'; return; }
  status.textContent = 'Erzeuge Ausgabe und führe Schlusscheck durch …';
  status.className = 'status';
  try {
    const out = await buildOutput(format === 'copy' ? 'txt' : format);
    const leaks = await finalCheck(out);
    // rückbaufähig: Blattname, den Excel nicht 1:1 zulässt (zu lang, Sonderzeichen) -> Rückbau dieses Namens nicht exakt
    if (isReversible()) {
      for (const x of out.sheetIssues || []) leaks.push({ word: x.requested, entity: 'Blattname', where: 'Excel', context: `Excel lässt den Blattnamen „${x.requested}“ nicht zu; gespeichert als „${x.actual}“. Der Rückbau dieses Blattnamens ist NICHT exakt.` });
    }
    renderLeaks(leaks);
    if (leaks.length && !app.leakAck) {
      status.textContent = `Schlusscheck: ${leaks.length} Klarname(n) noch im Ergebnis gefunden (bestätigte Namen oder Namen aus den Dateiangaben). Export blockiert – bitte prüfen (siehe unten).`;
      status.className = 'status bad';
      return;
    }
    if (format === 'copy') {
      const ok = await copyText(out.text);
      status.textContent = ok ? 'Text in die Zwischenablage kopiert.' : 'Kopieren nicht möglich. Bitte .txt speichern.';
    } else {
      const base = { txt: 'anonymisiert_text', csv: 'anonymisiert_tabelle', docx: 'anonymisiert_dokument', xlsx: 'anonymisiert_tabelle' }[format];
      download(out.zip ? out.bytes : encodeText(out.text), `${base}.${format}`, MIME[format]);
      status.textContent = `Gespeichert: ${base}.${format}` + (leaks.length ? ' (mit bestätigten Restfunden)' : ' – Schlusscheck ohne Fund.')
        + (isReversible() && app.keyStamp !== app.stamp ? ' ACHTUNG: Die passende Rückbau-Schlüsseldatei ist noch nicht gespeichert – ohne sie ist kein Rückbau möglich.' : '')
        + (format === 'docx' ? ' ' + SAVE_HINT_WORD : format === 'xlsx' ? ' ' + SAVE_HINT_EXCEL : '');
    }
    status.className = leaks.length || (isReversible() && app.keyStamp !== app.stamp) ? 'status warn' : 'status ok';
  } catch (e) {
    status.textContent = 'Fehler beim Export: ' + e.message;
    status.className = 'status bad';
  }
}

function exportMapping() {
  const ok = window.confirm('ACHTUNG: Die Zuordnungstabelle enthält die ECHTEN NAMEN (Pseudonym → Klarname).\n\nSie wird als SEPARATE Datei gespeichert. Bewahren Sie sie getrennt und sicher auf und geben Sie sie nie zusammen mit dem anonymisierten Dokument weiter.\n\nJetzt speichern?');
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

// ---------- Darstellung ----------
function isReversible() { return app.state.settings.mode === MODE_REVERSIBLE; }
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

function render() {
  const r = app.result;
  $('#review').hidden = !app.doc;
  $('#lists').hidden = false;
  renderLists();
  if (!app.doc || !r) return;
  // Hinweise zum Dokument
  const warnBox = $('#doc-warnings');
  warnBox.replaceChildren(...allWarnings().map((w) => h('label', { class: 'warnitem' },
    h('input', { type: 'checkbox', checked: app.ackWarnings.has(w), onchange: (e) => { if (e.target.checked) app.ackWarnings.add(w); else app.ackWarnings.delete(w); } }),
    ' ', w)));
  $('#doc-warnings-wrap').hidden = !allWarnings().length;
  renderMetaNames();
  renderSummary();
  renderDoc();
  renderEntities();
  // Exportknöpfe
  const k = app.doc.kind;
  $('#btn-xlsx').hidden = k !== 'xlsx';
  $('#btn-csv').hidden = k !== 'csv';
  $('#btn-docx').hidden = k === 'xlsx';
  $('#pdf-note').hidden = k !== 'pdf';
  renderModeNotes();
  $('#leaks').hidden = true;
}

// Namen aus den Original-Metadaten: eigene Zeile, nicht automatisch im Text ersetzt, per Knopf als Name übernehmen
function renderMetaNames() {
  const box = $('#meta-names');
  const list = app.doc.metaNames || [];
  box.hidden = !list.length;
  if (!list.length) return;
  box.replaceChildren(
    h('p', {}, h('strong', {}, 'In den Dateiangaben gefunden: '), list.map((m) => m.name).join(', ')),
    h('p', { class: 'muted' }, 'Diese Angaben (Autor, Bearbeiter, Firma, Kommentar-Autoren, SharePoint-Personen) werden beim Export aus der Datei entfernt. Im Text werden sie NICHT automatisch ersetzt. Kommt ein Name auch im Text vor, hier übernehmen.'),
    h('div', { class: 'chips' }, ...list.map((m) => {
      const taken = app.state.manualTerms.some((t) => fold(t) === fold(m.name));
      return h('span', { class: 'chip' }, `${m.name} (${m.where.replace(/^Dateieigenschaften: /, '')}) `,
        taken ? h('em', {}, 'übernommen') : h('button', { type: 'button', class: 'small', onclick: () => addManual(m.name) }, 'als Namen übernehmen'));
    })));
}

function renderModeNotes() {
  const rev = isReversible();
  $('#rev-note').hidden = !rev;
  $('#norev-note').hidden = rev;
  $('#mapping').hidden = rev; // im Modus rückbaufähig ersetzt die Schlüsseldatei die Zuordnungstabelle
}

// Rückbau-Schlüsseldatei (nur Modus rückbaufähig)
function exportKey() {
  if (!isReversible() || !app.result || !app.result.reversible) return;
  const ok = window.confirm('ACHTUNG: Die Rückbau-Schlüsseldatei enthält die ECHTEN NAMEN und Kontaktdaten.\n\nNie weitergeben, nie an eine KI. Getrennt vom anonymisierten Dokument sicher aufbewahren.\n\nOhne diese Datei ist kein Rückbau möglich.\n\nJetzt speichern?');
  if (!ok) return;
  const key = buildRestoreKey(app.result, { version: VERSION, kind: app.doc.kind });
  app.keyStamp = app.stamp;
  download(encodeText(JSON.stringify(key, null, 2)), 'rueckbau_schluessel_VERTRAULICH.json', 'application/json');
  $('#key-status').textContent = `Schlüsseldatei gespeichert (${key.platzhalter.length} Platzhalter). Wichtig: Wenn Sie danach noch Treffer an- oder ausschalten, die Schlüsseldatei erneut speichern.`;
  $('#key-status').className = 'status ok';
}

function renderSummary() {
  const r = app.result;
  const persons = r.hits.filter((x) => x.type === 'person');
  const sure = persons.filter((x) => x.cert === 'sicher').length;
  const unsure = persons.length - sure;
  const contacts = r.hits.length - persons.length;
  $('#summary').textContent = `${r.entities.size} Person(en) · ${persons.length} Namens-Treffer (${sure} sicher, ${unsure} unsicher) · ${contacts} Kontaktdaten · aktiv: ${r.hits.filter((x) => x.on).length}` + (app.doc.info ? ' · ' + app.doc.info : '');
}

function hitTitle(x) {
  return (x.on ? 'wird ersetzt durch: ' + x.label : 'bleibt stehen (aus)') + (x.cert === 'unsicher' ? ' · unsicherer Treffer' : '') + (x.link ? ' · zugeordnet über ' + x.link : '') + ' · Tippen = an/aus';
}

// Schnelles Umschalten ohne Neuberechnung (Treffer bleiben gleich, nur an/aus ändert sich)
function setHits(list, on) {
  for (const x of list) {
    x.on = on;
    app.state.overrides[x.key] = on;
    const m = document.querySelector(`mark[data-h="${x.id}"]`);
    if (m) { m.classList.toggle('on', on); m.classList.toggle('off', !on); m.title = hitTitle(x); }
  }
  app.leakAck = false;
  app.stamp = (app.stamp || 0) + 1; // jede Änderung der Treffer -> Schlüsseldatei muss neu gespeichert werden
  $('#leaks').hidden = true;
  renderSummary();
  renderEntities();
}

function renderDoc() {
  const r = app.result;
  const view = $('#docview');
  const frag = document.createDocumentFragment();
  let hi = 0;
  const hits = r.hits;
  app.doc.units.forEach((u, ui) => {
    if (!u.text.trim()) return;
    const base = r.unitStarts[ui];
    const box = h('div', { class: 'unit' });
    if (u.label) box.append(h('div', { class: 'ulabel', text: u.label }));
    const tx = h('div', { class: 'utext', 'data-u': ui });
    let pos = 0;
    while (hi < hits.length && hits[hi].s < base) hi++;
    while (hi < hits.length && hits[hi].s < base + u.text.length + 1) {
      const x = hits[hi];
      const s = x.s - base;
      const e = x.e - base;
      if (s > pos) tx.append(document.createTextNode(u.text.slice(pos, s)));
      const cls = ['hit', x.type === 'person' ? (x.cert === 'sicher' ? 'sure' : 'unsure') : 'contact', x.on ? 'on' : 'off'].join(' ');
      const title = hitTitle(x);
      tx.append(h('mark', { class: cls, 'data-h': x.id, 'data-l': x.type === 'person' ? (app.state.settings.mode === 'name' ? 'NAME' : r.entities.get(x.entity).letter) : x.label.replace(/[[\]]/g, ''), title }, u.text.slice(s, e)));
      pos = e;
      hi++;
    }
    if (pos < u.text.length) tx.append(document.createTextNode(u.text.slice(pos)));
    box.append(tx);
    frag.append(box);
  });
  const y = window.scrollY;
  view.replaceChildren(frag);
  window.scrollTo(0, y);
}

function renderEntities() {
  const r = app.result;
  const list = $('#entities');
  const ents = [...r.entities.values()];
  list.replaceChildren(...ents.map((en) => {
    const active = en.hits.filter((x) => x.on).length;
    const unsure = en.hits.filter((x) => x.cert === 'unsicher').length;
    const forms = [...en.forms.entries()].map(([f, c]) => `${f} (${c})`).join(', ');
    const linked = en.hits.filter((x) => x.link);
    const sel = h('select', { 'aria-label': 'Zusammenführen', onchange: (e) => { if (e.target.value) { app.state.merges[en.key] = e.target.value; runAnalysis(); } } },
      h('option', { value: '' }, 'zusammenführen mit …'),
      ...ents.filter((o) => o !== en).map((o) => h('option', { value: o.key }, `${o.label}: ${o.display}`)));
    return h('div', { class: 'entity' + (active ? '' : ' muted') },
      h('div', { class: 'erow' },
        h('label', { class: 'switch' }, h('input', { type: 'checkbox', checked: active > 0, onchange: (e) => setHits(en.hits, e.target.checked) })),
        h('strong', {}, en.label), ' ', h('span', { class: 'ename', text: en.display }),
        h('span', { class: 'count', title: 'Treffer (aktiv / gesamt)' }, `${active}/${en.count}`),
        unsure ? h('span', { class: 'tag unsure-tag' }, `${unsure} unsicher`) : null,
        en.manual ? h('span', { class: 'tag' }, 'eigener Name') : null),
      h('div', { class: 'forms', text: 'Schreibweisen: ' + forms }),
      linked.length ? h('div', { class: 'linknote' }, `${linked.length} Kurzform(en) zugeordnet (${[...new Set(linked.map((x) => x.link))].join(', ')}). `,
        h('button', { class: 'link', onclick: () => { for (const x of linked) if (x.linkable && !app.state.unlinks.includes(x.linkable)) app.state.unlinks.push(x.linkable); runAnalysis(); } }, 'Zuordnung lösen')) : null,
      h('div', { class: 'eactions' }, sel,
        h('button', { class: 'small', onclick: () => {
          const toks = new Set();
          for (const x of en.hits) for (const c of x.comps || []) if (c.type === 'W') toks.add(r.fullText.slice(c.s, c.stemEnd || c.e));
          for (const t of toks) if (!app.state.exceptions.some((e2) => fold(e2) === fold(t))) app.state.exceptions.push(t);
          app.state.manualTerms = app.state.manualTerms.filter((m) => ![...toks].some((t) => fold(t) === fold(m)));
          saveStored();
          runAnalysis();
        } }, 'nie anonymisieren')));
  }));
  if (!ents.length) list.replaceChildren(h('p', { class: 'muted' }, 'Keine Personen erkannt. Nicht erkannte Namen bitte im Text markieren.'));
}

function chipList(arr, onRemove) {
  return arr.map((t, i) => h('span', { class: 'chip' }, t, h('button', { class: 'x', 'aria-label': t + ' entfernen', onclick: () => onRemove(i) }, '×')));
}
function renderLists() {
  $('#names-chips').replaceChildren(...chipList(app.state.manualTerms, (i) => { app.state.manualTerms.splice(i, 1); saveStored(); runAnalysisOrRender(); }));
  $('#exc-chips').replaceChildren(...chipList(app.state.exceptions, (i) => { app.state.exceptions.splice(i, 1); saveStored(); runAnalysisOrRender(); }));
  $('#persist').checked = app.persist;
  $('#names-empty').hidden = app.state.manualTerms.length > 0;
  $('#exc-empty').hidden = app.state.exceptions.length > 0;
}
function runAnalysisOrRender() { if (app.doc) runAnalysis(); else renderLists(); }

function renderLeaks(leaks) {
  const box = $('#leaks');
  box.hidden = !leaks.length;
  if (!leaks.length) return;
  // Fundstelle in einfacher Sprache: "Kopfzeile – word/header1.xml" -> Ort "Kopfzeile", Teil "word/header1.xml"
  const place = (w) => { const m = w.match(/^(.*?) – (.+)$/); return m ? { ort: m[1], teil: m[2] } : { ort: w, teil: '' }; };
  const items = leaks.slice(0, 200).map((l) => {
    const pl = place(l.where);
    const taken = l.full && app.state.manualTerms.some((t) => fold(t) === fold(l.full));
    return h('li', {}, h('strong', {}, l.word), ` – steht in: `, h('strong', {}, pl.ort), pl.teil ? ` (${pl.teil})` : '',
      ` · ${l.meta ? 'Name ' + l.entity : 'bestätigter Name, ' + l.entity}: „…${l.context.replace(/\s+/g, ' ')}…“ `,
      l.meta && l.full && !taken ? h('button', { type: 'button', class: 'small', onclick: () => addManual(l.full) }, `„${l.full}“ als Namen übernehmen`) : null);
  });
  box.replaceChildren(
    h('h3', {}, 'Schlusscheck: Klarnamen im Ergebnis gefunden'),
    h('p', {}, 'Diese Namen stehen noch im Ergebnis: bestätigte Namen (z. B. weil einzelne Treffer ausgeschaltet sind) oder Namen aus den Dateiangaben der Originaldatei (Autor, Bearbeiter, Firma …). Bei jedem Fund steht, wo er steht.'),
    h('p', {}, h('strong', {}, 'Was tun? '), 'Entweder „als Namen übernehmen“ (bzw. den Treffer einschalten): Dann wird der Name überall in der Datei ersetzt, danach erneut speichern. Oder bewusst stehen lassen: unten abhaken und erneut speichern.'),
    h('ul', {}, ...items),
    leaks.length > 200 ? h('p', {}, `… und ${leaks.length - 200} weitere.`) : null,
    h('label', { class: 'warnitem' }, h('input', { type: 'checkbox', checked: app.leakAck, onchange: (e) => { app.leakAck = e.target.checked; } }),
      ' Ich habe diese Fundstellen geprüft und lasse sie bewusst stehen.'));
}

// ---------- Markieren (Text auswählen oder Wort antippen) ----------
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
function showMarkBar(term) {
  pendingTerm = term;
  const bar = $('#markbar');
  if (!term) { bar.hidden = true; return; }
  $('#markterm').textContent = term.length > 60 ? term.slice(0, 60) + '…' : term;
  bar.hidden = false;
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
  if (a.ui !== b.ui) return cleanTerm(sel.toString());
  return cleanTerm(texts[a.ui].text.slice(a.off, b.off));
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

// ---------- Ereignisse ----------
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
    app.doc = null;
    app.result = null;
    render();
    st.textContent = e.message;
    st.className = 'status bad';
  }
}
async function openBytes(bytes, name) {
  app.doc = await loadBytes(bytes, name);
  app.ackWarnings = new Set();
  app.state.overrides = {};
  app.state.merges = {};
  app.state.unlinks = [];
  runAnalysis();
  $('#review').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function init() {
  loadStored();
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
  $('#btn-text').addEventListener('click', async () => {
    const t = $('#paste').value;
    if (!t.trim()) { $('#load-status').textContent = 'Bitte zuerst Text einfügen.'; $('#load-status').className = 'status bad'; return; }
    await openBytes(new TextEncoder().encode(t), 'eingefuegt.txt');
    $('#load-status').textContent = 'Eingefügter Text wird geprüft.';
    $('#load-status').className = 'status ok';
  });
  // Einstellungen
  for (const id of ['email', 'phone', 'iban', 'address', 'unsureOn']) {
    const cb = $('#opt-' + id);
    cb.checked = app.state.settings[id];
    cb.addEventListener('change', () => { app.state.settings[id] = cb.checked; app.state.overrides = {}; runAnalysis(); });
  }
  for (const rb of document.querySelectorAll('input[name=mode]')) {
    rb.checked = rb.value === app.state.settings.mode;
    rb.addEventListener('change', () => { if (rb.checked) { app.state.settings.mode = rb.value; runAnalysis(); } });
  }
  // Treffer an/aus, Wort antippen
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
    if (p) { const w = wordAt(p.ui, p.off); if (w) showMarkBar(w); }
  });
  document.addEventListener('selectionchange', () => {
    const t = selectionTerm();
    if (t) showMarkBar(t);
  });
  $('#btn-mark').addEventListener('click', () => addManual(pendingTerm));
  $('#btn-mark-cancel').addEventListener('click', () => showMarkBar(null));
  // Listen
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
  // Export
  $('#btn-copy').addEventListener('click', () => doExport('copy'));
  $('#btn-txt').addEventListener('click', () => doExport('txt'));
  $('#btn-docx').addEventListener('click', () => doExport('docx'));
  $('#btn-xlsx').addEventListener('click', () => doExport('xlsx'));
  $('#btn-csv').addEventListener('click', () => doExport('csv'));
  $('#btn-map').addEventListener('click', exportMapping);
  $('#btn-key').addEventListener('click', exportKey);
  initRestore();
  renderModeNotes();
  render();
}


// ---------- Rückbau ----------
const rb = { file: null, key: null, plan: null, leftAck: false, confirmAck: false };

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
    rb.file = { kind, bytes, raw, name, units: raw.units.map((u) => ({ text: u.text, label: u.label || '' })) };
    st.textContent = `Geladen: ${name} (${kind.toUpperCase()}, ${rb.file.units.length} Textabschnitte).`;
    st.className = 'status ok';
  } catch (e) {
    st.textContent = e.message;
    st.className = 'status bad';
  }
}
async function rbLoadKey(text) {
  const st = $('#rb-key-status');
  rb.key = null;
  rbReset();
  const r = parseKeyFile(text);
  if (!r.ok) { st.textContent = r.error; st.className = 'status bad'; return; }
  rb.key = r.key;
  st.textContent = `Schlüsseldatei geladen: ${r.key.entries.size} Platzhalter (erstellt mit Version ${r.key.toolVersion}${r.key.kind ? ', Quelle ' + r.key.kind.toUpperCase() : ''}).`;
  st.className = 'status ok';
}
function rbReset() {
  rb.plan = null;
  rb.leftAck = false;
  rb.confirmAck = false;
  $('#rb-report').hidden = true;
  $('#rb-actions').hidden = true;
  $('#rb-left').hidden = true;
  $('#rb-status').textContent = '';
}

const ART = { unbekannt: 'unbekannter Platzhalter (nicht in der Schlüsseldatei) – bleibt stehen', verändert: 'veränderter Platzhalter (z. B. Kleinschreibung) – NICHT ersetzt', gebeugt: 'gebeugter Platzhalter (z. B. „des Nachnamens A“) – NICHT ersetzt', getrennt: 'getrennter Platzhalter (Zeilenumbruch) – NICHT ersetzt' };

function rbCheck() {
  rbReset();
  const st = $('#rb-status');
  if (!rb.file || !rb.key) { st.textContent = 'Bitte zuerst die anonymisierte Datei UND die Schlüsseldatei laden.'; st.className = 'status bad'; return; }
  const plan = planRestore(rb.file.units, rb.key);
  rb.plan = plan;
  const box = $('#rb-report');
  const kids = [h('h3', {}, 'Rückbau-Bericht (vor dem Speichern)')];
  if (plan.verdict === 'falsch') {
    kids.push(h('p', { class: 'danger' }, 'Die Schlüsseldatei passt nicht zu dieser Datei: Kein einziger Platzhalter aus der Schlüsseldatei wurde gefunden. Es wird nichts erzeugt.'));
    box.replaceChildren(...kids);
    box.hidden = false;
    return;
  }
  if (plan.verdict === 'zweifelhaft') {
    kids.push(h('p', { class: 'danger' }, `Wahrscheinlich die falsche Schlüsseldatei: ${plan.matchedKeys} von ${rb.key.entries.size} Platzhaltern gefunden, nur bei ${plan.okRows} stimmt die Anzahl, ${plan.unknown} unbekannte Platzhalter in der Datei. Bitte prüfen, ob Datei und Schlüsseldatei zusammengehören.`));
  }
  const bad = plan.rows.filter((r) => r.status !== 'ok');
  kids.push(h('p', { class: plan.needsConfirm ? 'warnbox' : 'okbox' },
    `${plan.totalFound} Platzhalter werden ersetzt (${plan.matchedKeys} verschiedene). Abweichende Anzahl: ${bad.length}. Auffällige Stellen: ${plan.issues.length}.`));
  kids.push(h('div', { class: 'rbscroll' }, h('table', { class: 'rbtable' },
    h('thead', {}, h('tr', {}, h('th', {}, 'Platzhalter'), h('th', {}, 'Art'), h('th', {}, 'erwartet'), h('th', {}, 'gefunden'), h('th', {}, 'Status'))),
    h('tbody', {}, ...plan.rows.map((r) => h('tr', { class: r.status === 'ok' ? '' : 'bad' },
      h('td', {}, r.platzhalter), h('td', {}, r.kategorie), h('td', {}, String(r.erwartet)), h('td', {}, String(r.gefunden)),
      h('td', {}, r.status === 'ok' ? 'ok' : r.status === 'weniger' ? 'weniger als erwartet (gelöscht oder umgeschrieben?)' : 'mehr als erwartet (eingefügt?)')))))));
  if (plan.issues.length) {
    kids.push(h('h3', {}, 'Auffällige Stellen'));
    kids.push(h('ul', {}, ...plan.issues.slice(0, 300).map((x) => h('li', {}, h('strong', {}, x.text), ` – ${ART[x.art] || x.art}${x.vermutlich ? ' (gemeint vermutlich „' + x.vermutlich + '“)' : ''} – ${x.where}: „…${x.kontext}…“`))));
  }
  kids.push(h('p', { class: 'hint' }, 'Metadaten (Autor, Kommentar-Autoren, Firma) werden nicht wiederhergestellt.'));
  if (plan.needsConfirm) {
    kids.push(h('label', { class: 'warnitem' }, h('input', { type: 'checkbox', id: 'rb-confirm', onchange: (e) => { rb.confirmAck = e.target.checked; } }),
      ' Ich habe die Abweichungen geprüft. Nicht ersetzte Stellen bleiben als Platzhalter stehen und müssen von Hand korrigiert werden.'));
  }
  box.replaceChildren(...kids);
  box.hidden = false;
  $('#rb-actions').hidden = false;
  $('#rb-btn-copy').hidden = !(rb.file.kind === 'txt');
  $('#rb-btn-save').textContent = `Wiederhergestellte Datei speichern (.${rb.file.kind})`;
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
      box.replaceChildren(h('h3', {}, 'Schlusscheck: Platzhalter noch im Ergebnis'),
        h('ul', {}, ...left.slice(0, 200).map((x) => h('li', {}, h('strong', {}, x.text), ` – ${x.where}: „…${x.kontext}…“`))),
        h('label', { class: 'warnitem' }, h('input', { type: 'checkbox', checked: rb.leftAck, onchange: (e) => { rb.leftAck = e.target.checked; } }), ' Ich habe diese Stellen geprüft und will trotzdem speichern.'));
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
    }
    st.className = left.length ? 'status warn' : 'status ok';
  } catch (e) {
    st.textContent = 'Fehler beim Rückbau: ' + e.message;
    st.className = 'status bad';
  }
}
function f2base(kind) { return { txt: 'text', csv: 'tabelle', docx: 'dokument', xlsx: 'tabelle' }[kind]; }

function initRestore() {
  const drop = $('#rb-drop');
  const input = $('#rb-file');
  drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.classList.add('over'); });
  drop.addEventListener('dragleave', () => drop.classList.remove('over'));
  drop.addEventListener('drop', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    drop.classList.remove('over');
    const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (f) await rbLoadFile(new Uint8Array(await f.arrayBuffer()), f.name);
  });
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
  $('#rb-btn-save').addEventListener('click', () => rbSave(false));
  $('#rb-btn-copy').addEventListener('click', () => rbSave(true));
}

// Für automatische Tests (nur lesend nutzbar, kein Netzwerk)
window.__anon = { app, openBytes, buildOutput, finalCheck, addManual, runAnalysis, rb, rbLoadFile, rbLoadKey, rbCheck };

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
