// Excel (.xlsx): liest ALLE Blätter (auch ausgeblendete), Zellen, Formeln mit Text, Kopf-/Fußzeilen,
// Kommentare (klassisch und Unterhaltungen), Blattnamen, Textfelder/Diagramme. Schreibt .xlsx mit
// erhaltener Zellstruktur.
import JSZip from 'jszip';
import {
  parseXml, serializeXml, allElements, isS, isA, makeUnit, textSegment, virtualSegment, distribute,
  neutralizePath, ZIP_OPTS, FIXED_DATE,
} from './xmlutil.js';

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

async function open(bytes) {
  let zip;
  try { zip = await JSZip.loadAsync(bytes); } catch { throw new Error('Die Datei ist keine gültige Excel-Datei (.xlsx).'); }
  if (zip.file('xl/workbook.bin')) throw new Error('Excel-Binärdateien (.xlsb) werden nicht unterstützt.');
  const ct = zip.file('[Content_Types].xml');
  if (!ct || !zip.file('xl/workbook.xml')) throw new Error('Die Datei ist keine gültige Excel-Datei (.xlsx).');
  if (/macroEnabled/i.test(await ct.async('string'))) throw new Error('Excel-Dateien mit Makros (.xlsm) werden nicht unterstützt.');
  return zip;
}

export async function readXlsx(bytes) {
  const zip = await open(bytes);
  const names = Object.keys(zip.files).filter((n) => !zip.files[n].dir);
  const docs = new Map();
  for (const n of names.filter((x) => /\.(xml|rels)$/i.test(x))) docs.set(n, parseXml(await zip.file(n).async('string'), n));
  const wb = docs.get('xl/workbook.xml');
  const wbRels = relsOf(docs, 'xl/workbook.xml');
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
  const push = (u, extra) => { if (u) { Object.assign(u, extra || {}); units.push(u); } };

  for (const sh of sheets) {
    const hidden = sh.state !== 'visible' ? ' (ausgeblendet)' : '';
    // Blattname
    const nameSeg = { text: sh.name.normalize('NFC'), writable: true, newName: null, set(t) { this.newName = t; } };
    push(makeUnit([nameSeg], 'Blattname' + hidden), { kind: 'sheetname', sheet: sh, seg: nameSeg });
    const sdoc = sh.part ? docs.get(sh.part) : null;
    if (!sdoc) continue;
    for (const c of allElements(sdoc).filter((e) => isS(e) && e.localName === 'c')) {
      const ref = c.getAttribute('r') || '';
      const t = c.getAttribute('t');
      const lab = `${sh.name}!${ref}`;
      const v = childEls(c, 'v')[0];
      const f = childEls(c, 'f')[0];
      if (t === 's' && v) {
        const idx = parseInt(v.textContent, 10);
        if (siList[idx] && !siDone.has(idx)) { siDone.add(idx); push(groupUnit(siList[idx], lab + hidden, owned)); }
      } else if (t === 'inlineStr') {
        const is = childEls(c, 'is')[0];
        if (is) push(groupUnit(is, lab + hidden, owned));
      } else if (t === 'str' && v && v.textContent.trim()) {
        owned.add(v);
        push(makeUnit([textSegment(v, false)], lab + ' (Formelergebnis)' + hidden));
      }
      if (f && f.textContent.includes('"')) {
        owned.add(f);
        push(makeUnit([textSegment(f, false)], lab + ' (Formel)' + hidden), { kind: 'formula' });
      }
    }
    for (const hf of allElements(sdoc).filter((e) => isS(e) && /^(odd|even|first)(Header|Footer)$/.test(e.localName))) {
      owned.add(hf);
      const u = headerFooterUnit(hf, `${sh.name}: ${/Header/.test(hf.localName) ? 'Kopfzeile' : 'Fußzeile'}${hidden}`);
      if (u.text.trim()) push(u);
    }
    for (const fe of allElements(sdoc).filter((e) => /^formula[12]?$/.test(e.localName) || (e.localName === 'f' && !isS(e)))) {
      if (fe.textContent.includes('"')) {
        owned.add(fe);
        push(makeUnit([textSegment(fe, false)], `${sh.name}: Gültigkeitsregel/Formel${hidden}`), { kind: 'formula' });
      }
    }
  }
  siList.forEach((si, idx) => { if (!siDone.has(idx)) push(groupUnit(si, 'Gemeinsamer Text (nicht verwendet)', owned)); });

  // Definierte Namen mit Text
  for (const dn of allElements(wb).filter((e) => e.localName === 'definedName')) {
    if (dn.textContent.includes('"')) {
      owned.add(dn);
      push(makeUnit([textSegment(dn, false)], 'Definierter Name ' + dn.getAttribute('name')), { kind: 'formula' });
    }
  }
  // Kommentare
  for (const n of names.filter((x) => /^xl\/comments\d*\.xml$/.test(x)).sort(natural)) {
    for (const cm of allElements(docs.get(n)).filter((e) => isS(e) && e.localName === 'comment')) {
      const text = childEls(cm, 'text')[0];
      if (text) push(groupUnit(text, 'Kommentar ' + (cm.getAttribute('ref') || ''), owned));
    }
  }
  for (const n of names.filter((x) => /^xl\/threadedComments\/.*\.xml$/.test(x)).sort(natural)) {
    for (const tc of allElements(docs.get(n)).filter((e) => e.localName === 'threadedComment')) {
      const text = childEls(tc, 'text')[0];
      if (text && text.textContent.trim()) { owned.add(text); push(makeUnit([textSegment(text, false)], 'Kommentar (Unterhaltung) ' + (tc.getAttribute('ref') || ''))); }
    }
  }
  // Textfelder, Formen, Diagramme
  for (const n of names.filter((x) => /^xl\/(drawings|charts)\/[^/]+\.xml$/.test(x)).sort(natural)) {
    const doc = docs.get(n);
    for (const p of allElements(doc).filter((e) => isA(e) && e.localName === 'p')) {
      const ts = allElements(p).filter((e) => isA(e) && e.localName === 't');
      if (!ts.length) continue;
      const segs = [];
      for (const t of ts) { segs.push(textSegment(t, false)); owned.add(t); }
      const u = makeUnit(segs, /charts/.test(n) ? 'Diagramm' : 'Textfeld/Form');
      if (u.text.trim()) push(u);
    }
    for (const v of allElements(doc).filter((e) => e.localName === 'v' && e.namespaceURI && e.namespaceURI.includes('chart') && /\p{L}/u.test(e.textContent))) {
      owned.add(v);
      push(makeUnit([textSegment(v, false)], 'Diagramm (Wert)'));
    }
  }

  const warnings = [];
  const hiddenSheets = sheets.filter((s) => s.state !== 'visible');
  if (hiddenSheets.length) warnings.push(`Die Datei enthält ${hiddenSheets.length} ausgeblendete(s) Blatt/Blätter. Diese wurden mitgelesen und werden mit anonymisiert.`);
  const embedded = names.filter((n) => /^xl\/embeddings\//.test(n));
  if (embedded.length) warnings.push(`Die Datei enthält ${embedded.length} eingebettete(s) Objekt(e). Deren Inhalt wird NICHT anonymisiert und vor dem Export geleert.`);
  const media = names.filter((n) => /^xl\/media\//.test(n));
  if (media.length) warnings.push(`Die Datei enthält ${media.length} Bild(er). Namen IN Bildern erkennt das Tool nicht.`);
  if (names.some((n) => /^xl\/pivotCache/.test(n))) warnings.push('Die Datei enthält Pivot-Tabellen. Deren zwischengespeicherte Werte werden ersetzt; bitte die Pivot-Tabellen nach dem Öffnen aktualisieren und prüfen.');
  if (names.some((n) => /^xl\/externalLinks\//.test(n))) warnings.push('Die Datei enthält Verknüpfungen zu anderen Dateien. Gespeicherte Werte werden geprüft, die verknüpften Dateien selbst nicht.');
  return { kind: 'xlsx', zip, docs, units, owned, sheets, names, warnings, ssDoc, siList };
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
function colToNum(c) { let n = 0; for (const ch of c) n = n * 26 + (ch.charCodeAt(0) - 64); return n; }
function numToCol(n) { let s = ''; while (n > 0) { const r = (n - 1) % 26; s = String.fromCharCode(65 + r) + s; n = Math.floor((n - 1) / 26); } return s; }

export async function writeXlsx(bytes, repsPerUnit, generic) {
  const d = await readXlsx(bytes);
  const changed = new Set();

  // Phase 1: Texte und Blattnamen
  d.units.forEach((u, i) => {
    if (u.kind === 'formula') return;
    if (distribute(u, repsPerUnit[i] || []) && u.commit) u.commit();
  });
  // Blattnamen umbenennen
  const used = new Set(d.sheets.map((s) => s.name.toLowerCase()));
  const renames = new Map();
  d.units.forEach((u, i) => {
    if (u.kind !== 'sheetname' || u.seg.newName === null) return;
    used.delete(u.sheet.name.toLowerCase());
    const nn = sanitizeSheetName(u.seg.newName, used, 'Blatt ' + (d.sheets.indexOf(u.sheet) + 1));
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
      for (const a of Array.from(el.attributes)) {
        const an = a.localName;
        let v = a.value;
        if (renames.size && an === 'location' && ln === 'hyperlink') v = renameSheetRefs(v, renames);
        else if (renames.size && an === 'sheet' && ln === 'worksheetSource' && renames.has(v)) v = renames.get(v);
        else if (an === 'author' || an === 'displayName') v = v ? 'Autor' : v;
        else if (an === 'userId' || an === 'userName') v = '';
        else if (an === 'providerId') v = 'None';
        else if (an === 'name' && ln === 'userInfo') v = 'Autor';
        else if ((an === 'v' && ln === 's') || (an === 'v' && ln === 'pivotField') || an === 'caption' || an === 'prompt' || an === 'error'
          || an === 'promptTitle' || an === 'errorTitle' || an === 'tooltip' || an === 'display' || an === 'descr' || an === 'title'
          || (an === 'comment' && ln === 'definedName') || (an === 'name' && (ln === 'cNvPr' || ln === 'item'))) v = generic(v);
        if (v !== a.value) { el.setAttributeNS(a.namespaceURI, a.name, v); mod = true; }
      }
      // Kommentar-Autoren
      if (ln === 'author' && el.parentNode && el.parentNode.localName === 'authors' && el.textContent) { el.textContent = 'Autor'; mod = true; continue; }
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
  // app.xml: Blattnamen in TitlesOfParts, Firma/Manager
  const app = d.docs.get('docProps/app.xml');
  if (app) {
    for (const el of allElements(app)) {
      if (el.localName === 'lpstr' && renames.has(el.textContent)) { el.textContent = renames.get(el.textContent); changed.add('docProps/app.xml'); }
      if (['Company', 'Manager', 'HyperlinkBase'].includes(el.localName) && el.textContent) { el.textContent = ''; changed.add('docProps/app.xml'); }
    }
  }
  const core = d.docs.get('docProps/core.xml');
  if (core) {
    for (const el of allElements(core)) {
      if (['creator', 'lastModifiedBy', 'title', 'subject', 'keywords', 'description', 'category', 'contentStatus', 'identifier', 'language'].includes(el.localName) && el.textContent) {
        el.textContent = '';
        changed.add('docProps/core.xml');
      }
    }
  }
  const custom = d.docs.get('docProps/custom.xml');
  if (custom) {
    for (const el of allElements(custom)) {
      if (['lpwstr', 'lpstr', 'bstr'].includes(el.localName) && el.textContent) { el.textContent = ''; changed.add('docProps/custom.xml'); }
    }
  }
  // Alle geänderten Teile ermitteln (Einheiten-Änderungen): konservativ alle XML-Teile mit Einheiten neu schreiben
  for (const [n] of d.docs) if (/^xl\//.test(n) && !/\.rels$/.test(n)) changed.add(n);
  changed.add('xl/workbook.xml');
  // .rels: externe Pfade, Vorschaubild
  for (const n of d.names.filter((x) => /\.rels$/.test(x))) {
    const doc = d.docs.get(n);
    let mod = false;
    for (const rel of allElements(doc).filter((e) => e.localName === 'Relationship')) {
      const target = rel.getAttribute('Target') || '';
      if (/\/thumbnail$/.test(rel.getAttribute('Type') || '')) { rel.parentNode.removeChild(rel); mod = true; }
      else if (rel.getAttribute('TargetMode') === 'External') {
        const nt = generic(neutralizePath(target));
        if (nt !== target) { rel.setAttribute('Target', nt); mod = true; }
      }
    }
    if (mod) changed.add(n);
  }
  for (const n of d.names) {
    if (/^docProps\/thumbnail\./i.test(n)) d.zip.remove(n);
    else if (/^xl\/embeddings\//.test(n)) d.zip.file(n, new Uint8Array(0), { date: FIXED_DATE });
  }
  for (const n of changed) if (d.docs.has(n)) d.zip.file(n, serializeXml(d.docs.get(n)), { date: FIXED_DATE });
  return d.zip.generateAsync({ ...ZIP_OPTS, mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}
