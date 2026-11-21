// Excel (.xlsx): liest ALLE Blätter (auch ausgeblendete), Zellen, Formeln mit Text, Kopf-/Fußzeilen,
// Kommentare (klassisch und Unterhaltungen), Blattnamen, Textfelder/Diagramme. Schreibt .xlsx mit
// erhaltener Zellstruktur.
import JSZip from 'jszip';
import {
  parseXml, serializeXml, allElements, isS, isA, makeUnit, textSegment, virtualSegment, distribute,
  neutralizePath, ZIP_OPTS, FIXED_DATE,
} from './xmlutil.js';
import { collectMetaNames, findPropertyParts, cleanProperties, cleanCustomXml, removeThumbnails, stripImages, imageWarnings, setKennungProperty } from './meta.js';
import { altTextUnits } from './images.js';
import { partIndex, EMBED_REL } from './parts.js';

const natural = (a, b) => a.localeCompare(b, 'en', { numeric: true });
const childEls = (el, ln) => Array.from(el.childNodes).filter((c) => c.nodeType === 1 && (!ln || c.localName === ln));

function resolveTarget(baseDir, target) {
  if (target.startsWith('/')) return target.slice(1);
  const parts = (baseDir + target).split('/');
  const out = [];
  for (const p of parts) { if (p === '..') out.pop(); else if (p && p !== '.') out.push(p); }
  return out.join('/');
}
function relsOf(docs, part) {
  const dir = part.replace(/[^/]+$/, '');
  const relName = dir + '_rels/' + part.slice(dir.length) + '.rels';
  const doc = docs.get(relName);
  const map = new Map();
  if (!doc) return map;
  for (const r of allElements(doc).filter((e) => e.localName === 'Relationship')) {
    if (r.getAttribute('TargetMode') === 'External') continue;
    map.set(r.getAttribute('Id'), { target: resolveTarget(dir, r.getAttribute('Target')), type: r.getAttribute('Type') || '' });
  }
  return map;
}

// Bereiche von Zeichenketten-Literalen ("...") in einer Formel
export function literalRanges(f) {
  const ranges = [];
  let i = 0;
  while (i < f.length) {
    const ch = f[i];
    if (ch === '"') {
      const st = i + 1;
      i++;
      while (i < f.length) { if (f[i] === '"') { if (f[i + 1] === '"') { i += 2; continue; } break; } i++; }
      ranges.push([st, i]);
      i++;
    } else if (ch === "'") {
      i++;
      while (i < f.length) { if (f[i] === "'") { if (f[i + 1] === "'") { i += 2; continue; } break; } i++; }
      i++;
    } else i++;
  }
  return ranges;
}

const quoteSheet = (n) => "'" + n.replace(/'/g, "''") + "'";
// Blattverweise in Formeln umbenennen ('Alt'!A1, Alt!A1, 'A:B'!A1)
export function renameSheetRefs(f, renames) {
  if (!renames.size || !f) return f;
  const lower = new Map([...renames].map(([k, v]) => [k.toLowerCase(), v]));
  let out = '';
  let i = 0;
  const mapNames = (inner) => {
    const parts = inner.split(':');
    let hit = false;
    const mapped = parts.map((p) => {
      const m = p.match(/^(\[[^\]]*\])?(.*)$/);
      const nv = lower.get(m[2].toLowerCase());
      if (nv !== undefined) { hit = true; return (m[1] || '') + nv; }
      return p;
    });
    return hit ? mapped.join(':') : null;
  };
  while (i < f.length) {
    const ch = f[i];
    if (ch === '"') {
      let j = i + 1;
      while (j < f.length) { if (f[j] === '"') { if (f[j + 1] === '"') { j += 2; continue; } break; } j++; }
      out += f.slice(i, j + 1);
      i = j + 1;
    } else if (ch === "'") {
      let j = i + 1;
      while (j < f.length) { if (f[j] === "'") { if (f[j + 1] === "'") { j += 2; continue; } break; } j++; }
      const inner = f.slice(i + 1, j).replace(/''/g, "'");
      if (f[j + 1] === '!') {
        const mapped = mapNames(inner);
        out += mapped !== null ? quoteSheet(mapped) : f.slice(i, j + 1);
      } else out += f.slice(i, j + 1);
      i = j + 1;
    } else {
      const m = f.slice(i).match(/^([^\s()=,;+\-*/&^<>!'"{}%]+)!/);
      const prev = i > 0 ? f[i - 1] : '';
      if (m && !/[A-Za-z0-9_.\]]/.test(prev)) {
        const mapped = mapNames(m[1]);
        if (mapped !== null) { out += quoteSheet(mapped) + '!'; i += m[0].length; continue; }
      }
      out += ch;
      i++;
    }
  }
  return out;
}

function sanitizeSheetName(n, used, fallback) {
  let s = n.replace(/[\[\]:*?/\\]/g, ' ').replace(/^'+|'+$/g, '').trim();
  if (!s) s = fallback;
  s = s.slice(0, 31);
  let cand = s;
  let k = 2;
  while (used.has(cand.toLowerCase())) { const suf = ` (${k++})`; cand = s.slice(0, 31 - suf.length) + suf; }
  used.add(cand.toLowerCase());
  return cand;
}

// Kopf-/Fußzeile: Steuercodes (&L, &P, &"Arial,Fett" …) sind nicht beschreibbar
function headerFooterUnit(el, label) {
  const raw = el.textContent || '';
  const pieces = [];
  const re = /&(?:"[^"]*"|\d{1,3}|K[0-9A-Fa-f]{6}|K\d\d[+-]\d{3}|&|[A-Za-z])/g;
  let last = 0;
  for (const m of raw.matchAll(re)) {
    if (m.index > last) pieces.push({ t: raw.slice(last, m.index), w: true });
    pieces.push({ t: m[0], w: false });
    last = m.index + m[0].length;
  }
  if (last < raw.length) pieces.push({ t: raw.slice(last), w: true });
  const segs = pieces.map((p) => (p.w ? { text: p.t.normalize('NFC'), writable: true, set(t) { p.t = t; } } : virtualSegment('\n')));
  const u = makeUnit(segs, label);
  u.commit = () => { el.textContent = pieces.map((p) => p.t).join(''); };
  return u;
}

function groupUnit(container, label, owned) {
  // Textgruppe aus <t>-Elementen (direkt oder in <r>), ohne Lautschrift (rPh)
  const ts = [];
  for (const c of childEls(container)) {
    if (c.localName === 't') ts.push(c);
    else if (c.localName === 'r') ts.push(...childEls(c, 't'));
  }
  if (!ts.length) return null;
  ts.forEach((t) => owned.add(t));
  const u = makeUnit(ts.map((t) => textSegment(t, true)), label);
  return u.text.trim() ? u : null;
}

// Arbeitsmappe über die Paket-Beziehung (officeDocument) finden; am üblichen Ort xl/workbook.xml wie bisher
const WB_CT = /spreadsheetml\.(sheet|template)\.main\+xml$/;
async function open(bytes) {
  let zip;
  try { zip = await JSZip.loadAsync(bytes); } catch { throw new Error('Die Datei ist keine gültige Excel-Datei (.xlsx).'); }
  if (zip.file('xl/workbook.bin')) throw new Error('Excel-Binärdateien (.xlsb) werden nicht unterstützt.');
  const ct = zip.file('[Content_Types].xml');
  const idx = await partIndex(zip);
  if (idx.main && /\.bin$/i.test(idx.main)) throw new Error('Excel-Binärdateien (.xlsb) werden nicht unterstützt.');
  const wbPart = zip.file('xl/workbook.xml') ? 'xl/workbook.xml' : (idx.main && /\.xml$/i.test(idx.main) && WB_CT.test(idx.ct(idx.main)) ? idx.main : null);
  if (!ct || !wbPart) throw new Error('Die Datei ist keine gültige Excel-Datei (.xlsx).');
  if (/macroEnabled/i.test(await ct.async('string'))) throw new Error('Excel-Dateien mit Makros (.xlsm) werden nicht unterstützt.');
  return { zip, idx, wbPart };
}

export async function readXlsx(bytes) {
  const { zip, idx, wbPart } = await open(bytes);
  const names = Object.keys(zip.files).filter((n) => !zip.files[n].dir);
  const docs = new Map();
  for (const n of names.filter((x) => /\.(xml|rels)$/i.test(x))) docs.set(n, parseXml(await zip.file(n).async('string'), n));
  const wb = docs.get(wbPart);
  const wbRels = relsOf(docs, wbPart);
  // Teile einer Art: fester Pfad (wie bisher) ODER Beziehungstyp ODER Inhaltstyp (Version 2.4.1)
  const xmlNames = names.filter((x) => /\.xml$/i.test(x) && docs.has(x));
  const partsOf = (fixed, relRe, ctRe) => xmlNames.filter((n) => fixed.test(n) || idx.is(n, relRe, ctRe));
  const sheets = allElements(wb).filter((e) => isS(e) && e.localName === 'sheet').map((el) => {
    const rid = Array.from(el.attributes).find((a) => a.localName === 'id' && a.namespaceURI && a.namespaceURI.includes('relationships'));
    const rel = rid ? wbRels.get(rid.value) : null;
    return { el, name: el.getAttribute('name'), state: el.getAttribute('state') || 'visible', part: rel ? rel.target : null };
  });
  const ssPart = [...wbRels.values()].find((r) => /\/sharedStrings$/.test(r.type));
  const ssDoc = ssPart ? docs.get(ssPart.target) : null;
  const siList = ssDoc ? allElements(ssDoc).filter((e) => isS(e) && e.localName === 'si') : [];
  const units = [];
  const owned = new Set();
  const siDone = new Set();
  const push = (u, extra, part) => { if (u) { Object.assign(u, extra || {}); if (part) u.part = part; units.push(u); } };

  // Version 2.5.0: Tabellenansicht für die Prüfansicht (nur Anzeige): je Blatt die Zellen mit Abschnitt bzw. Wert
  const view = [];
  const siUnit = new Map(); // Index gemeinsamer Text -> Abschnitt
  for (const sh of sheets) {
    const hidden = sh.state !== 'visible' ? ' (ausgeblendet)' : '';
    const sv = { name: sh.name, hidden: sh.state !== 'visible', cells: [] };
    view.push(sv);
    // Blattname
    const nameSeg = { text: sh.name.normalize('NFC'), writable: true, newName: null, set(t) { this.newName = t; } };
    push(makeUnit([nameSeg], 'Blattname' + hidden), { kind: 'sheetname', sheet: sh, seg: nameSeg }, wbPart);
    const sdoc = sh.part ? docs.get(sh.part) : null;
    if (!sdoc) continue;
    for (const c of allElements(sdoc).filter((e) => isS(e) && e.localName === 'c')) {
      const ref = c.getAttribute('r') || '';
      const t = c.getAttribute('t');
      const lab = `${sh.name}!${ref}`;
      const v = childEls(c, 'v')[0];
      const f = childEls(c, 'f')[0];
      const n0 = units.length;
      if (t === 's' && v) {
        const idx = parseInt(v.textContent, 10);
        if (siList[idx] && !siDone.has(idx)) { siDone.add(idx); push(groupUnit(siList[idx], lab + hidden, owned), null, ssPart.target); if (units.length > n0) siUnit.set(idx, n0); }
        if (siUnit.has(idx)) sv.cells.push({ ref, u: siUnit.get(idx) });
      } else if (t === 'inlineStr') {
        const is = childEls(c, 'is')[0];
        if (is) push(groupUnit(is, lab + hidden, owned), null, sh.part);
        if (units.length > n0) sv.cells.push({ ref, u: n0 });
      } else if (t === 'str' && v && v.textContent.trim()) {
        owned.add(v);
        push(makeUnit([textSegment(v, false)], lab + ' (Formelergebnis)' + hidden), null, sh.part);
        sv.cells.push({ ref, u: n0 });
      } else if (v && v.textContent !== '') sv.cells.push({ ref, value: v.textContent });
      if (f && f.textContent.includes('"')) {
        owned.add(f);
        push(makeUnit([textSegment(f, false)], lab + ' (Formel)' + hidden), { kind: 'formula' }, sh.part);
      }
    }
    for (const hf of allElements(sdoc).filter((e) => isS(e) && /^(odd|even|first)(Header|Footer)$/.test(e.localName))) {
      owned.add(hf);
      const u = headerFooterUnit(hf, `${sh.name}: ${/Header/.test(hf.localName) ? 'Kopfzeile' : 'Fußzeile'}${hidden}`);
      if (u.text.trim()) push(u, null, sh.part);
    }
    for (const fe of allElements(sdoc).filter((e) => /^formula[12]?$/.test(e.localName) || (e.localName === 'f' && !isS(e)))) {
      if (fe.textContent.includes('"')) {
        owned.add(fe);
        push(makeUnit([textSegment(fe, false)], `${sh.name}: Gültigkeitsregel/Formel${hidden}`), { kind: 'formula' }, sh.part);
      }
    }
  }
  // Version 2.6.0: Lage jeder Zelle (Blatt, Zeile, Spalte; verbundene Zellen) für die Namensspalten und die linke
  // Nachbarzelle (Anrede in der Nachbarzelle, Regel a2). Ein gemeinsamer Text (sharedStrings) wird nur EINMAL gelesen
  // und steht für alle Zellen mit diesem Text: Er sammelt die Lage aller seiner Zellen und alle linken Nachbarn.
  for (const sh of sheets) {
    const sv = view.find((v) => v.name === sh.name);
    const sdoc = sh.part ? docs.get(sh.part) : null;
    if (!sv || !sdoc) continue;
    const span = new Map();
    for (const mc of allElements(sdoc).filter((e) => isS(e) && e.localName === 'mergeCell')) {
      const m = /^([A-Z]+)(\d+):([A-Z]+)(\d+)$/.exec(mc.getAttribute('ref') || '');
      if (m) span.set((Number(m[2]) - 1) + '|' + (colIndex(m[1])), colIndex(m[3]));
    }
    const at = new Map();
    for (const cell of sv.cells) {
      const m = /^([A-Z]+)(\d+)$/.exec(cell.ref || '');
      if (!m) continue;
      const c = colIndex(m[1]);
      const r = Number(m[2]) - 1;
      at.set(r + '|' + c, cell);
      if (cell.u === undefined) continue;
      const u = units[cell.u];
      (u.tcells = u.tcells || []).push({ t: 'x|' + sh.name, r, c, c2: span.has(r + '|' + c) ? span.get(r + '|' + c) : c });
    }
    for (const [k, cell] of at) {
      if (cell.u === undefined) continue;
      const [r, c] = k.split('|').map(Number);
      const left = at.get(r + '|' + (c - 1));
      if (left && left.u !== undefined) { const u = units[cell.u]; (u.leftUnits = u.leftUnits || []).push(left.u); }
    }
  }
  siList.forEach((si, i) => { if (!siDone.has(i)) push(groupUnit(si, 'Gemeinsamer Text (nicht verwendet)', owned), null, ssPart.target); });

  // Definierte Namen mit Text
  for (const dn of allElements(wb).filter((e) => e.localName === 'definedName')) {
    if (dn.textContent.includes('"')) {
      owned.add(dn);
      push(makeUnit([textSegment(dn, false)], 'Definierter Name ' + dn.getAttribute('name')), { kind: 'formula' }, wbPart);
    }
  }
  // Kommentare
  // Kommentare: fester Pfad wie bisher oder über Beziehung/Inhaltstyp (z. B. xl/comments/comment1.xml von openpyxl)
  const commentParts = partsOf(/^xl\/comments\d*\.xml$/, /\/comments$/, /spreadsheetml\.comments\+xml$/);
  const threadedParts = partsOf(/^xl\/threadedComments\/.*\.xml$/, /\/threadedComment$/, /threadedcomments\+xml$/i).filter((n) => !commentParts.includes(n));
  for (const n of commentParts.sort(natural)) {
    for (const cm of allElements(docs.get(n)).filter((e) => isS(e) && e.localName === 'comment')) {
      const text = childEls(cm, 'text')[0];
      if (text) push(groupUnit(text, 'Kommentar ' + (cm.getAttribute('ref') || ''), owned), null, n);
    }
  }
  for (const n of threadedParts.sort(natural)) {
    for (const tc of allElements(docs.get(n)).filter((e) => e.localName === 'threadedComment')) {
      const text = childEls(tc, 'text')[0];
      if (text && text.textContent.trim()) { owned.add(text); push(makeUnit([textSegment(text, false)], 'Kommentar (Unterhaltung) ' + (tc.getAttribute('ref') || '')), null, n); }
    }
  }
  // Textfelder, Formen, Diagramme (fester Ordner wie bisher oder über Beziehung/Inhaltstyp)
  const drawingParts = partsOf(/^xl\/drawings\/[^/]+\.xml$/, /\/drawing$/, /\.drawing\+xml$/);
  const chartParts = partsOf(/^xl\/charts\/[^/]+\.xml$/, /\/chart$/, /drawingml\.chart\+xml$/);
  const isChart = (n) => /charts/.test(n) || (!drawingParts.includes(n) && chartParts.includes(n));
  for (const n of [...new Set([...drawingParts, ...chartParts])].sort(natural)) {
    const doc = docs.get(n);
    for (const p of allElements(doc).filter((e) => isA(e) && e.localName === 'p')) {
      const ts = allElements(p).filter((e) => isA(e) && e.localName === 't');
      if (!ts.length) continue;
      const segs = [];
      for (const t of ts) { segs.push(textSegment(t, false)); owned.add(t); }
      const u = makeUnit(segs, isChart(n) ? 'Diagramm' : 'Textfeld/Form');
      if (u.text.trim()) push(u, null, n);
    }
    for (const v of allElements(doc).filter((e) => e.localName === 'v' && e.namespaceURI && e.namespaceURI.includes('chart') && /\p{L}/u.test(e.textContent))) {
      owned.add(v);
      push(makeUnit([textSegment(v, false)], 'Diagramm (Wert)'), null, n);
    }
  }

  // Fundorte für Bilder und Bildbeschreibungen: Zeichnungen und VML-Zeichnungen gehören zu einem Blatt
  const places = new Map();
  for (const sh of sheets) {
    if (!sh.part) continue;
    const sdoc = docs.get(sh.part);
    const hf = sdoc ? allElements(sdoc).find((e) => e.localName === 'legacyDrawingHF') : null;
    const hfId = hf ? Array.from(hf.attributes).find((a) => a.localName === 'id') : null;
    for (const [id, rel] of relsOf(docs, sh.part)) {
      if (/\/drawing$/.test(rel.type)) places.set(rel.target, `Blatt „${sh.name}“`);
      else if (/\/vmlDrawing$/.test(rel.type)) places.set(rel.target, hfId && hfId.value === id ? `Kopf-/Fußzeile, Blatt „${sh.name}“` : `Kommentar, Blatt „${sh.name}“`);
    }
  }
  const placeOf = (part) => ({ label: places.get(part) || (/chart/.test(part) ? 'Diagramm' : 'Sonstiges') });
  // Bildbeschreibungen (Alt-Text, Titel von Bildern und Formen): eigene Abschnitte am Ende
  const ownedAttrs = new Map();
  units.push(...altTextUnits(docs, drawingParts.sort(natural).map((n) => [n, placeOf(n).label]), ownedAttrs));
  // Kopf-/Fußzeilenbilder (VML): Titel der Bilder ebenfalls als Bildbeschreibung. VML-Teile werden nur gelesen, wenn
  // sie sauberes XML sind, und nur neu geschrieben, wenn sich eine Beschreibung ändert.
  const vmlDocs = new Map();
  for (const n of names.filter((x) => /\.vml$/i.test(x) && places.has(x)).sort(natural)) {
    try { vmlDocs.set(n, parseXml(await zip.file(n).async('string'), n)); } catch { /* kein sauberes XML: der Schlusscheck sucht trotzdem darin */ }
  }
  for (const u of altTextUnits(vmlDocs, [...vmlDocs.keys()].map((n) => [n, placeOf(n).label]), ownedAttrs)) { u.vml = true; units.push(u); }

  const warnings = [];
  const hiddenSheets = sheets.filter((s) => s.state !== 'visible');
  if (hiddenSheets.length) warnings.push(`Die Datei enthält ${hiddenSheets.length} ausgeblendete(s) Blatt/Blätter. Diese wurden mitgelesen und werden mit anonymisiert.`);
  const embedded = names.filter((n) => /^xl\/embeddings\//.test(n) || idx.is(n, EMBED_REL));
  if (embedded.length) warnings.push(`Die Datei enthält ${embedded.length} eingebettete(s) Objekt(e). Deren Inhalt wird NICHT anonymisiert und vor dem Export geleert.`);
  // Bilder: eigene Zeile „Bilder“ auf dem Speichern-Bildschirm (Liste mit Vorschau), kein allgemeiner Hinweis mehr
  if (names.some((n) => /^xl\/pivotCache/.test(n) || idx.is(n, /\/pivotCacheDefinition$/))) warnings.push('Die Datei enthält Pivot-Tabellen. Deren zwischengespeicherte Werte werden ersetzt; bitte die Pivot-Tabellen nach dem Öffnen aktualisieren und prüfen.');
  if (names.some((n) => /^xl\/externalLinks\//.test(n) || idx.is(n, /\/externalLink$/))) warnings.push('Die Datei enthält Verknüpfungen zu anderen Dateien. Gespeicherte Werte werden geprüft, die verknüpften Dateien selbst nicht.');
  warnings.push(...await imageWarnings(zip));
  // Namen aus den Original-Metadaten (Autor, Bearbeiter, Manager, Firma, Kommentarautoren, SharePoint-Personen)
  const metaNames = await collectMetaNames(zip, docs);
  return { kind: 'xlsx', zip, docs, vmlDocs, units, owned, ownedAttrs, sheets, names, warnings, ssDoc, siList, metaNames, imageCtx: { placeOf }, wbPart, embedded, view };
}

function cellString(sheetDoc, ref, siList) {
  const c = allElements(sheetDoc).find((e) => isS(e) && e.localName === 'c' && e.getAttribute('r') === ref);
  if (!c) return null;
  const t = c.getAttribute('t');
  const v = childEls(c, 'v')[0];
  if (t === 's' && v) {
    const si = siList[parseInt(v.textContent, 10)];
    if (!si) return null;
    return allElements(si).filter((e) => e.localName === 't' && e.parentNode.localName !== 'rPh').map((e) => e.textContent).join('');
  }
  if (t === 'inlineStr') { const is = childEls(c, 'is')[0]; return is ? allElements(is).filter((e) => e.localName === 't').map((e) => e.textContent).join('') : null; }
  if (t === 'str' && v) return v.textContent;
  return null;
}
const colIndex = (c) => colToNum(c) - 1;
function colToNum(c) { let n = 0; for (const ch of c) n = n * 26 + (ch.charCodeAt(0) - 64); return n; }
function numToCol(n) { let s = ''; while (n > 0) { const r = (n - 1) % 26; s = String.fromCharCode(65 + r) + s; n = Math.floor((n - 1) / 26); } return s; }

// opts.clean (Standard true): Metadaten bereinigen (Anonymisieren). false: nur Texte, Blattnamen, Bezüge (Rückbau).
export async function writeXlsx(bytes, repsPerUnit, generic, opts = {}) {
  const clean = opts.clean !== false;
  const d = await readXlsx(bytes);
  const changed = new Set();
  // Versteckte Angaben: SharePoint-Felder (vor dem Ersetzen, damit Werte mit Namen erkannt werden),
  // Dateieigenschaften (über ihre Verweise gefunden), Vorschaubild
  if (clean) {
    await cleanCustomXml(d.zip, d.docs, changed, opts.containsName);
    await cleanProperties(d.zip, d.docs, changed);
    await removeThumbnails(d.zip, d.docs, changed);
  }

  // Phase 1: Texte und Blattnamen
  const vmlChanged = new Set();
  d.units.forEach((u, i) => {
    if (u.kind === 'formula') return;
    if (distribute(u, repsPerUnit[i] || [])) {
      if (u.commit) u.commit();
      if (u.vml) vmlChanged.add(u.part);
    }
  });
  // Blattnamen umbenennen
  const used = new Set(d.sheets.map((s) => s.name.toLowerCase()));
  const renames = new Map();
  d.units.forEach((u, i) => {
    if (u.kind !== 'sheetname' || u.seg.newName === null) return;
    used.delete(u.sheet.name.toLowerCase());
    const nn = sanitizeSheetName(u.seg.newName, used, 'Blatt ' + (d.sheets.indexOf(u.sheet) + 1));
    // Excel erlaubt nicht jeden Blattnamen (max. 31 Zeichen, keine []:*?/\, eindeutig) -> melden
    if (opts.onSheetName && nn !== u.seg.newName) opts.onSheetName({ requested: u.seg.newName, actual: nn });
    if (nn !== u.sheet.name) { renames.set(u.sheet.name, nn); u.sheet.el.setAttribute('name', nn); }
  });
  // Phase 2: Formeln (nur Text in Anführungszeichen wird ersetzt)
  d.units.forEach((u, i) => {
    if (u.kind !== 'formula') return;
    const lits = literalRanges(u.text);
    const reps = (repsPerUnit[i] || []).filter((r) => lits.some(([a, b]) => r.s >= a && r.e <= b));
    distribute(u, reps);
  });
  // Blattverweise in allen Formeln, Diagrammbezügen, Hyperlinks, Pivot-Quellen
  for (const [n, doc] of d.docs) {
    let mod = false;
    for (const el of allElements(doc)) {
      const ln = el.localName;
      if (renames.size && (ln === 'f' || ln === 'definedName' || /^formula[12]?$/.test(ln))) {
        const nv = renameSheetRefs(el.textContent, renames);
        if (nv !== el.textContent) { el.textContent = nv; mod = true; }
      }
      const own = d.ownedAttrs.get(el);
      for (const a of Array.from(el.attributes)) {
        if (own && own.has(a.name)) continue; // Bildbeschreibung: schon als eigener Abschnitt ersetzt
        const an = a.localName;
        let v = a.value;
        if (renames.size && an === 'location' && ln === 'hyperlink') v = renameSheetRefs(v, renames);
        else if (renames.size && an === 'sheet' && ln === 'worksheetSource' && renames.has(v)) v = renames.get(v);
        else if (clean && (an === 'author' || an === 'displayName')) v = v ? 'Autor' : v;
        else if (clean && (an === 'userId' || an === 'userName')) v = '';
        else if (clean && an === 'providerId') v = 'None';
        else if (clean && an === 'name' && ln === 'userInfo') v = 'Autor';
        else if ((an === 'v' && ln === 's') || (an === 'v' && ln === 'pivotField') || an === 'caption' || an === 'prompt' || an === 'error'
          || an === 'promptTitle' || an === 'errorTitle' || an === 'tooltip' || an === 'display' || an === 'descr' || an === 'title'
          || (an === 'comment' && ln === 'definedName') || (an === 'name' && (ln === 'cNvPr' || ln === 'item'))) v = generic(v);
        if (v !== a.value) { el.setAttributeNS(a.namespaceURI, a.name, v); mod = true; }
      }
      // Kommentar-Autoren
      if (ln === 'author' && el.parentNode && el.parentNode.localName === 'authors' && el.textContent) {
        if (clean) { el.textContent = 'Autor'; mod = true; }
        continue;
      }
      const isFormula = ln === 'f' || ln === 'definedName' || /^formula[12]?$/.test(ln);
      if (!d.owned.has(el) && !isFormula) {
        for (const c of Array.from(el.childNodes)) {
          if ((c.nodeType === 3 || c.nodeType === 4) && /\p{L}/u.test(c.nodeValue)) {
            if (ln === 'v' && isS(el)) continue; // Zahlen/Indizes
            const nv = generic(c.nodeValue);
            if (nv !== c.nodeValue) { c.nodeValue = nv; mod = true; }
          }
        }
      }
    }
    if (mod) changed.add(n);
  }
  // Tabellen: Spaltennamen müssen den Kopfzellen entsprechen
  for (const sh of d.sheets) {
    if (!sh.part) continue;
    const sdoc = d.docs.get(sh.part);
    for (const rel of relsOf(d.docs, sh.part).values()) {
      if (!/\/table$/.test(rel.type)) continue;
      const tdoc = d.docs.get(rel.target);
      if (!tdoc) continue;
      const tbl = allElements(tdoc).find((e) => e.localName === 'table');
      const ref = (tbl.getAttribute('ref') || '').split(':')[0];
      const m = ref.match(/^([A-Z]+)(\d+)$/);
      if (!m || tbl.getAttribute('headerRowCount') === '0') continue;
      const cols = allElements(tdoc).filter((e) => e.localName === 'tableColumn');
      cols.forEach((col, k) => {
        const s = cellString(sdoc, numToCol(colToNum(m[1]) + k) + m[2], d.siList);
        if (s !== null && s !== col.getAttribute('name')) { col.setAttribute('name', s); changed.add(rel.target); }
      });
    }
  }
  // app.xml (über den Verweis gefunden): Blattnamen in TitlesOfParts
  for (const n of (await findPropertyParts(d.zip, d.docs)).app) {
    for (const el of allElements(d.docs.get(n))) {
      if (el.localName === 'lpstr' && renames.has(el.textContent)) { el.textContent = renames.get(el.textContent); changed.add(n); }
    }
  }
  // Alle geänderten Teile ermitteln (Einheiten-Änderungen): konservativ alle XML-Teile mit Einheiten neu schreiben
  for (const [n] of d.docs) if (/^xl\//.test(n) && !/\.rels$/.test(n)) changed.add(n);
  changed.add(d.wbPart);
  // Teile mit Abschnitten außerhalb von xl/ (Version 2.4.1: über Beziehungen gefunden) ebenfalls neu schreiben
  for (const u of d.units) if (u.part && !u.vml && d.docs.has(u.part)) changed.add(u.part);
  // .rels: externe Pfade, Vorschaubild
  for (const n of d.names.filter((x) => /\.rels$/.test(x))) {
    const doc = d.docs.get(n);
    let mod = false;
    for (const rel of allElements(doc).filter((e) => e.localName === 'Relationship')) {
      const target = rel.getAttribute('Target') || '';
      if (clean && /\/thumbnail$/.test(rel.getAttribute('Type') || '')) { rel.parentNode.removeChild(rel); mod = true; }
      else if (rel.getAttribute('TargetMode') === 'External') {
        const nt = generic(clean ? neutralizePath(target) : target);
        if (nt !== target) { rel.setAttribute('Target', nt); mod = true; }
      }
    }
    if (mod) changed.add(n);
  }
  for (const n of clean ? d.names : []) {
    if (/^docProps\/thumbnail\./i.test(n)) d.zip.remove(n);
    else if (d.embedded.includes(n)) d.zip.file(n, new Uint8Array(0), { date: FIXED_DATE, createFolders: false });
  }
  // Modus rückbaufähig: Kennung als unsichtbare benutzerdefinierte Eigenschaft (nach der Bereinigung)
  if (clean && opts.kennung) await setKennungProperty(d.zip, d.docs, changed, opts.kennung);
  for (const n of changed) if (d.docs.has(n)) d.zip.file(n, serializeXml(d.docs.get(n)), { date: FIXED_DATE, createFolders: false });
  // VML (Kopf-/Fußzeilenbilder): nur bei geänderter Bildbeschreibung neu schreiben, ohne XML-Kopfzeile wie im Original
  for (const n of vmlChanged) d.zip.file(n, new XMLSerializer().serializeToString(d.vmlDocs.get(n)), { date: FIXED_DATE, createFolders: false });
  // Bild-Metadaten (EXIF, XMP, IPTC, Kommentare, PNG-Textblöcke) verlustfrei entfernen
  if (clean) await stripImages(d.zip);
  return d.zip.generateAsync({ ...ZIP_OPTS, mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}
