// Oberfläche des Anonymisierers. Kein Netzwerk, kein Speichern ohne ausdrücklichen Schalter.
import './lockdown.js';
import JSZip from 'jszip';
import {
  analyze, defaultState, replacementsByUnit, applyReplacements, leakForms, findLeaks, makeGenericReplacer,
} from '../core/detect.js';
import { fold } from '../core/fold.js';
import { readTxt, writeTxt, readCsv, writeCsv, encodeText } from '../formats/text.js';
import { readDocx, writeDocx, buildDocx } from '../formats/docx.js';
import { readXlsx, writeXlsx } from '../formats/xlsx.js';
import { collectZipTexts } from '../formats/xmlutil.js';
import { readPdf } from '../formats/pdf.js';

const MAX_BYTES = 20 * 1024 * 1024;
const WARN_BYTES = 5 * 1024 * 1024;
const STORE_KEY = 'anonymisierer.merkliste.v1';

const $ = (sel) => document.querySelector(sel);
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
  const units = doc.units.map((u) => ({ text: u.text, label: u.label || '' }));
  const warnings = [...(doc.warnings || [])];
  if (bytes.length > WARN_BYTES) warnings.push(`Große Datei (${(bytes.length / 1048576).toFixed(1)} MB): Auf dem iPhone kann die Verarbeitung langsam sein oder abbrechen.`);
  return { kind, units, warnings, bytes, info: doc.info || '', raw: doc };
}

// ---------- Analyse ----------
function runAnalysis() {
  if (!app.doc) return;
  app.result = analyze(app.doc.units, app.state);
  app.leakAck = false;
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
async function buildOutput(format) {
  const d = app.doc;
  const generic = makeGenericReplacer(app.result, app.state.settings);
  const reps = replacementsByUnit(app.result, d.units);
  if (format === 'docx' && d.kind === 'docx') return { bytes: await writeDocx(d.bytes, reps, generic), zip: true };
  if (format === 'xlsx' && d.kind === 'xlsx') return { bytes: await writeXlsx(d.bytes, reps, generic), zip: true };
  if (format === 'docx') return { bytes: await buildDocx(docxSections()), zip: true };
  if (format === 'csv') return { text: writeCsv(d.raw, newUnitTexts()) };
  return { text: plainTextExport() };
}
async function finalCheck(out) {
  const forms = leakForms(app.result);
  let texts;
  if (out.zip) texts = await collectZipTexts(await JSZip.loadAsync(out.bytes));
  else texts = [{ where: 'Text', text: out.text }];
  return findLeaks(forms, texts);
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
    renderLeaks(leaks);
    if (leaks.length && !app.leakAck) {
      status.textContent = `Schlusscheck: ${leaks.length} bestätigte(r) Klarname(n) noch im Ergebnis gefunden. Export blockiert – bitte prüfen (siehe unten).`;
      status.className = 'status bad';
      return;
    }
    if (format === 'copy') {
      const ok = await copyText(out.text);
      status.textContent = ok ? 'Text in die Zwischenablage kopiert.' : 'Kopieren nicht möglich. Bitte .txt speichern.';
    } else {
      const base = { txt: 'anonymisiert_text', csv: 'anonymisiert_tabelle', docx: 'anonymisiert_dokument', xlsx: 'anonymisiert_tabelle' }[format];
      download(out.zip ? out.bytes : encodeText(out.text), `${base}.${format}`, MIME[format]);
      status.textContent = `Gespeichert: ${base}.${format}` + (leaks.length ? ' (mit bestätigten Restfunden)' : ' – Schlusscheck ohne Fund.');
    }
    status.className = leaks.length ? 'status warn' : 'status ok';
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
function unackedWarnings() { return (app.doc ? app.doc.warnings : []).filter((w) => !app.ackWarnings.has(w)); }

function render() {
  const r = app.result;
  $('#review').hidden = !app.doc;
  $('#lists').hidden = false;
  renderLists();
  if (!app.doc || !r) return;
  // Hinweise zum Dokument
  const warnBox = $('#doc-warnings');
  warnBox.replaceChildren(...app.doc.warnings.map((w) => h('label', { class: 'warnitem' },
    h('input', { type: 'checkbox', checked: app.ackWarnings.has(w), onchange: (e) => { if (e.target.checked) app.ackWarnings.add(w); else app.ackWarnings.delete(w); } }),
    ' ', w)));
  $('#doc-warnings-wrap').hidden = !app.doc.warnings.length;
  renderSummary();
  renderDoc();
  renderEntities();
  // Exportknöpfe
  const k = app.doc.kind;
  $('#btn-xlsx').hidden = k !== 'xlsx';
  $('#btn-csv').hidden = k !== 'csv';
  $('#btn-docx').hidden = k === 'xlsx';
  $('#pdf-note').hidden = k !== 'pdf';
  $('#leaks').hidden = true;
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
  const items = leaks.slice(0, 200).map((l) => h('li', {}, h('strong', {}, l.word), ` (${l.entity}) – ${l.where}: „…${l.context.replace(/\s+/g, ' ')}…“`));
  box.replaceChildren(
    h('h3', {}, 'Schlusscheck: Klarnamen im Ergebnis gefunden'),
    h('p', {}, 'Diese bestätigten Namen stehen noch im Ergebnis (z. B. weil einzelne Treffer ausgeschaltet sind oder an Stellen, die das Tool nicht ersetzen kann). Bitte prüfen und ggf. Treffer einschalten.'),
    h('ul', {}, ...items),
    leaks.length > 200 ? h('p', {}, `… und ${leaks.length - 200} weitere.`) : null,
    h('label', { class: 'warnitem' }, h('input', { type: 'checkbox', checked: app.leakAck, onchange: (e) => { app.leakAck = e.target.checked; } }),
      ' Ich habe diese Fundstellen geprüft und will trotzdem exportieren.'));
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
      setHits([x], !x.on);
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
  render();
}

// Für automatische Tests (nur lesend nutzbar, kein Netzwerk)
window.__anon = { app, openBytes, buildOutput, finalCheck, addManual, runAnalysis };

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
