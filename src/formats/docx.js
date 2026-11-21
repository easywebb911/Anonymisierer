// Word (.docx): vollständiges Lesen (Haupttext, Kopf-/Fußzeilen, Fußnoten, Endnoten, Kommentare,
// Textfelder, nachverfolgte Änderungen, Diagramme) und Schreiben unter Erhalt der Formatierung.
import JSZip from 'jszip';
import {
  parseXml, serializeXml, allElements, isW, isA, makeUnit, textSegment, virtualSegment, distribute,
  ancestor, neutralizePath, ZIP_OPTS, FIXED_DATE,
} from './xmlutil.js';
import { collectMetaNames, cleanProperties, cleanCustomXml, removeThumbnails, stripImages, imageWarnings, setKennungProperty, KENNUNG_PROP } from './meta.js';
import { altTextUnits } from './images.js';
import { partIndex, EMBED_REL } from './parts.js';

// Art eines Teils: fester Pfad (wie bisher), Beziehungstyp, Inhaltstyp (seit Version 2.4.1 auch an ungewöhnlicher Stelle)
const PART_ORDER = [
  [/^word\/document\.xml$/, 'Text', null, null],
  [/^word\/header\d*\.xml$/, 'Kopfzeile', /\/header$/, /wordprocessingml\.header\+xml$/],
  [/^word\/footer\d*\.xml$/, 'Fußzeile', /\/footer$/, /wordprocessingml\.footer\+xml$/],
  [/^word\/footnotes\.xml$/, 'Fußnote', /\/footnotes$/, /wordprocessingml\.footnotes\+xml$/],
  [/^word\/endnotes\.xml$/, 'Endnote', /\/endnotes$/, /wordprocessingml\.endnotes\+xml$/],
  [/^word\/comments\.xml$/, 'Kommentar', /\/comments$/, /wordprocessingml\.comments\+xml$/],
  [/^word\/glossary\/document\.xml$/, 'Baustein', /\/glossaryDocument$/, /document\.glossary\+xml$/],
  [/^word\/charts\/.*\.xml$/, 'Diagramm', /\/chart$/, /drawingml\.chart\+xml$/],
  [/^word\/diagrams\/.*\.xml$/, 'SmartArt', /\/diagram\w*$/, /diagram\w*\+xml$/i],
];
const SKIP_PARTS = /^word\/(styles|settings|fontTable|webSettings|numbering|people|commentsExtended|commentsIds|commentsExtensible|stylesWithEffects)\.xml$|^word\/theme\//;
// dieselben Teile, erkannt am Beziehungs- oder Inhaltstyp (an jedem Ort)
const SKIP_REL = /\/(styles|settings|fontTable|webSettings|numbering|people|commentsExtended|commentsIds|commentsExtensible|stylesWithEffects|theme)$/;
const SKIP_CT = /(styles|settings|fontTable|webSettings|numbering|people|commentsExtended|commentsIds|commentsExtensible|stylesWithEffects|theme)\+xml$/i;
const MAIN_CT = /wordprocessingml\.(document|template)\.main\+xml$/;

function natural(a, b) { return a.localeCompare(b, 'en', { numeric: true }); }

function isPara(el) { return (isW(el) || isA(el)) && el.localName === 'p'; }

// Lage eines Absatzes für die Regel "Anrede allein -> nächste Einheit ist Name":
// laufende Nummer aller Absätze (auch leerer), Tabellenzelle, Tabellenzeile, Textfeld, Überschrift
function paraPosition(p, pi) {
  const cell = ancestor(p, (a) => isW(a) && a.localName === 'tc');
  const row = cell ? ancestor(cell, (a) => isW(a) && a.localName === 'tr') : null;
  const txbx = ancestor(p, (a) => isW(a) && a.localName === 'txbxContent');
  const pStyle = Array.from(p.getElementsByTagNameNS('*', 'pStyle')).find((x) => x.parentNode && x.parentNode.parentNode === p);
  const style = pStyle ? (pStyle.getAttributeNS(pStyle.namespaceURI, 'val') || pStyle.getAttribute('w:val') || '') : '';
  return { pi, cell, row, txbx, heading: /heading|berschrift|title|titel/i.test(style) };
}
// Folgt Absatz b direkt auf Absatz a? (gleiche Zelle bzw. beide im Fließtext, oder rechte Nachbarzelle)
function directlyFollows(a, b) {
  if (!a || !b || b.pi !== a.pi + 1 || a.txbx !== b.txbx) return false;
  if (a.cell === b.cell) return true;
  if (!a.cell || !b.cell || a.row !== b.row) return false;
  const cells = Array.from(a.row.childNodes).filter((c) => c.nodeType === 1 && isW(c) && c.localName === 'tc');
  return cells.indexOf(b.cell) === cells.indexOf(a.cell) + 1;
}

function paragraphUnits(doc, baseLabel) {
  const units = [];
  const owned = new Set();
  let pi = -1;
  let prevPos = null;
  const rowIds = new Map(); // nur für die Anzeige in der Prüfansicht (Tabellenzeilen als Zeilen zeigen)
  for (const p of allElements(doc)) {
    if (!isPara(p)) continue;
    pi++;
    const segs = [];
    let lastDel = null;
    const walk = (n) => {
      for (const c of Array.from(n.childNodes)) {
        if (c.nodeType !== 1) continue;
        if (isPara(c)) continue; // verschachtelter Absatz (Textfeld) -> eigene Einheit
        const ln = c.localName;
        if ((isW(c) && (ln === 't' || ln === 'delText')) || (isA(c) && ln === 't')) {
          const del = ln === 'delText';
          if (lastDel !== null && del !== lastDel) segs.push(virtualSegment('\n'));
          lastDel = del;
          segs.push(textSegment(c, isW(c)));
          owned.add(c);
        } else if (isW(c) && ln === 'tab') segs.push(virtualSegment('\t'));
        else if ((isW(c) && (ln === 'br' || ln === 'cr')) || (isA(c) && ln === 'br')) segs.push(virtualSegment('\n'));
        else if (isW(c) && ln === 'noBreakHyphen') segs.push(virtualSegment('-'));
        else walk(c);
      }
    };
    walk(p);
    if (!segs.some((s) => s.writable && s.text.trim())) continue;
    const pos = isW(p) ? paraPosition(p, pi) : null;
    let label = baseLabel;
    if (ancestor(p, (a) => isW(a) && a.localName === 'txbxContent')) label = 'Textfeld';
    else if (ancestor(p, (a) => isW(a) && a.localName === 'tbl')) label = baseLabel === 'Text' ? 'Tabelle' : baseLabel;
    if (segs.some((sg, i) => i > 0 && !sg.writable && sg.text === '\n') && p.getElementsByTagNameNS('*', 'delText').length) {
      label += ' (mit gelöschtem Text aus Änderungsverfolgung)';
    }
    const unit = makeUnit(segs, label);
    unit.follows = !!(pos && prevPos && directlyFollows(prevPos, pos));
    unit.heading = !!(pos && pos.heading);
    if (pos && pos.row) {
      if (!rowIds.has(pos.row)) rowIds.set(pos.row, rowIds.size);
      unit.row = rowIds.get(pos.row);
      unit.cell = Array.from(pos.row.childNodes).filter((c) => c.nodeType === 1 && isW(c) && c.localName === 'tc').indexOf(pos.cell);
    }
    prevPos = pos;
    units.push(unit);
  }
  // Diagramm-Zwischenspeicher (c:v) mit Buchstaben
  for (const v of allElements(doc)) {
    if (v.localName === 'v' && v.namespaceURI && v.namespaceURI.includes('drawingml/2006/chart') && /\p{L}/u.test(v.textContent)) {
      units.push(makeUnit([textSegment(v, false)], baseLabel + ' (Wert)'));
      owned.add(v);
    }
  }
  return { units, owned };
}

async function open(bytes) {
  let zip;
  try { zip = await JSZip.loadAsync(bytes); } catch { throw new Error('Die Datei ist kein gültiges Word-Dokument (.docx).'); }
  const ct = zip.file('[Content_Types].xml');
  const idx = await partIndex(zip);
  // Haupttext am üblichen Ort wie bisher, sonst über die Paket-Beziehung (officeDocument) und den Inhaltstyp
  const mainPart = zip.file('word/document.xml') ? 'word/document.xml' : (idx.main && /\.xml$/i.test(idx.main) && MAIN_CT.test(idx.ct(idx.main)) ? idx.main : null);
  if (!ct || !mainPart) throw new Error('Die Datei ist kein gültiges Word-Dokument (.docx).');
  const ctText = await ct.async('string');
  if (/macroEnabled/i.test(ctText)) throw new Error('Word-Dateien mit Makros (.docm) werden nicht unterstützt.');
  return { zip, idx, mainPart };
}

// Liest das Dokument. Liefert Einheiten und eine Funktion, die mit Ersetzungen die neue Datei baut.
export async function readDocx(bytes) {
  const { zip, idx, mainPart } = await open(bytes);
  const names = Object.keys(zip.files).filter((n) => !zip.files[n].dir);
  const xmlNames = names.filter((n) => /\.xml$/i.test(n));
  // Art je Teil: zuerst Beziehungs-/Inhaltstyp (gilt an jedem Ort), sonst fester Pfad wie bisher; jeder Teil genau einmal
  const kindOf = (n) => {
    if (n === mainPart) return 0;
    const k = PART_ORDER.findIndex(([, , relRe, ctRe]) => relRe && idx.is(n, relRe, ctRe));
    if (k >= 0 && !idx.is(n, SKIP_REL, SKIP_CT)) return k;
    return PART_ORDER.findIndex(([re]) => re.test(n));
  };
  const unitParts = [];
  PART_ORDER.forEach(([, label], k) => {
    for (const n of xmlNames.filter((x) => kindOf(x) === k).sort(natural)) unitParts.push([n, label]);
  });
  for (const n of xmlNames.filter((x) => x.startsWith('word/') && !SKIP_PARTS.test(x) && !unitParts.some((u) => u[0] === x)).sort(natural)) {
    unitParts.push([n, 'Sonstiges']);
  }
  const docs = new Map();
  for (const n of xmlNames) docs.set(n, parseXml(await zip.file(n).async('string'), n));
  const units = [];
  const owned = new Set();
  for (const [n, label] of unitParts) {
    const r = paragraphUnits(docs.get(n), label);
    r.units.forEach((u) => { u.part = n; units.push(u); });
    r.owned.forEach((x) => owned.add(x));
  }
  // Bildbeschreibungen (Alt-Text, Titel von Bildern und Formen): eigene Abschnitte am Ende, damit die übrigen
  // Abschnitte (und damit Ausgaben von Dokumenten ohne Bildbeschreibung) unverändert bleiben
  const ownedAttrs = new Map();
  units.push(...altTextUnits(docs, unitParts.map(([n, label]) => [n, label === 'Text' ? '' : label]), ownedAttrs));
  const warnings = [];
  const embedded = names.filter((n) => /^word\/embeddings\//.test(n) || idx.is(n, EMBED_REL));
  if (embedded.length) warnings.push(`Das Dokument enthält ${embedded.length} eingebettete(s) Objekt(e) (z. B. Excel-Tabellen). Deren Inhalt wird NICHT anonymisiert und vor dem Export entfernt.`);
  // Bilder: eigene Zeile „Bilder“ auf dem Speichern-Bildschirm (Liste mit Vorschau), kein allgemeiner Hinweis mehr
  warnings.push(...await imageWarnings(zip));
  // Namen aus den Original-Metadaten (Autor, Bearbeiter, Manager, Firma, Kommentar-/Änderungsautoren, SharePoint-Personen)
  const metaNames = await collectMetaNames(zip, docs);
  // Fundort von Bildern je Teil in einfacher Sprache (für die Bilderliste)
  const partLabel = new Map(unitParts);
  const placeOf = (part) => ({ label: partLabel.get(part) || (/numbering/.test(part) ? 'Aufzählungszeichen' : /glossary/.test(part) ? 'Baustein' : 'Sonstiges') });
  return { kind: 'docx', zip, docs, units, owned, ownedAttrs, warnings, names, metaNames, imageCtx: { placeOf }, embedded };
}

// Baut die anonymisierte .docx. repsPerUnit: Ersetzungen je Einheit; generic(str): Ersetzer für sonstige Texte.
// opts.clean (Standard true): Metadaten bereinigen (Anonymisieren). false: nur Texte ändern (Rückbau).
export async function writeDocx(bytes, repsPerUnit, generic, opts = {}) {
  const clean = opts.clean !== false;
  const d = await readDocx(bytes);
  const changed = new Set();
  d.units.forEach((u, i) => { if (distribute(u, repsPerUnit[i] || [])) changed.add(u.part); });
  // Versteckte Angaben: SharePoint-Felder (vor dem Ersetzen, damit Werte mit Namen erkannt werden) und
  // Dateieigenschaften, gefunden über ihre Verweise (nicht über feste Pfade)
  if (clean) {
    await cleanCustomXml(d.zip, d.docs, changed, opts.containsName);
    await cleanProperties(d.zip, d.docs, changed, { titlesOfParts: true });
    await removeThumbnails(d.zip, d.docs, changed);
  }

  // Sonstige Texte (Feldfunktionen, benutzerdefinierte XML-Daten, Alternativtexte …)
  const ATTRS = new Set(['descr', 'title', 'instr', 'alias', 'tag']);
  for (const [n, doc] of d.docs) {
    if (/\.rels$/.test(n)) continue; // Verweise werden unten eigens behandelt
    let mod = false;
    for (const el of allElements(doc)) {
      // Metadaten-Attribute: Autor/Initialen/Benutzerkennung
      const own = d.ownedAttrs.get(el);
      for (const a of Array.from(el.attributes)) {
        if (own && own.has(a.name)) continue; // Bildbeschreibung: schon als eigener Abschnitt ersetzt
        const ln = a.localName;
        let v = a.value;
        if (clean && (ln === 'author' || ln === 'displayName')) v = v ? 'Autor' : v;
        else if (clean && ln === 'initials') v = v ? 'A' : v;
        else if (clean && (ln === 'userId' || ln === 'providerId')) v = '';
        else if (ATTRS.has(ln) || (ln === 'name' && /^(docPr|cNvPr|bookmarkStart)$/.test(el.localName)) || (ln === 'val' && /^(alias|tag|docVar)$/.test(el.localName))) v = generic(v);
        if (v !== a.value) { el.setAttributeNS(a.namespaceURI, a.name, v); mod = true; }
      }
      // Textknoten, die keiner Einheit gehören
      if (!d.owned.has(el)) {
        for (const c of Array.from(el.childNodes)) {
          if ((c.nodeType === 3 || c.nodeType === 4) && c.nodeValue.trim()) {
            const nv = generic(c.nodeValue);
            if (nv !== c.nodeValue) { c.nodeValue = nv; mod = true; }
          }
        }
      }
    }
    if (mod) changed.add(n);
  }

  // Verweise (.rels): externe Pfade neutralisieren, Vorschaubild entfernen
  for (const n of d.names.filter((x) => /\.rels$/.test(x))) {
    const doc = parseXml(await d.zip.file(n).async('string'), n);
    let mod = false;
    for (const rel of allElements(doc).filter((e) => e.localName === 'Relationship')) {
      const target = rel.getAttribute('Target') || '';
      if (clean && /\/thumbnail$/.test(rel.getAttribute('Type') || '')) {
        rel.parentNode.removeChild(rel);
        mod = true;
      } else if (rel.getAttribute('TargetMode') === 'External') {
        const nt = generic(clean ? neutralizePath(target) : target);
        if (nt !== target) { rel.setAttribute('Target', nt); mod = true; }
      }
    }
    if (mod) d.zip.file(n, serializeXml(doc), { date: FIXED_DATE, createFolders: false });
  }
  for (const n of clean ? d.names : []) {
    if (/^docProps\/thumbnail\./i.test(n)) d.zip.remove(n);
    // Eingebettete Objekte werden geleert (Inhalt nicht prüfbar); die Beziehung bleibt, damit das Dokument gültig bleibt
    else if (d.embedded.includes(n)) d.zip.file(n, new Uint8Array(0), { date: FIXED_DATE, createFolders: false });
  }
  // Modus rückbaufähig: Kennung als unsichtbare benutzerdefinierte Eigenschaft (nach der Bereinigung)
  if (clean && opts.kennung) await setKennungProperty(d.zip, d.docs, changed, opts.kennung);
  for (const n of changed) d.zip.file(n, serializeXml(d.docs.get(n)), { date: FIXED_DATE, createFolders: false });
  // Bild-Metadaten (EXIF, XMP, IPTC, Kommentare, PNG-Textblöcke) verlustfrei entfernen
  if (clean) await stripImages(d.zip);
  return d.zip.generateAsync({ ...ZIP_OPTS, mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
}

// Neues, schlichtes Word-Dokument aus Textabschnitten (für TXT/PDF/CSV-Eingaben).
// sections: [{heading?, paragraphs: [string]}]; opts.kennung: Modus rückbaufähig, Kennung als benutzerdefinierte Eigenschaft
export async function buildDocx(sections, opts = {}) {
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
  const run = (t) => {
    const parts = t.split('\t');
    return '<w:r>' + parts.map((p, i) => (i ? '<w:tab/>' : '') + `<w:t xml:space="preserve">${esc(p)}</w:t>`).join('') + '</w:r>';
  };
  let body = '';
  sections.forEach((sec, si) => {
    if (sec.heading) {
      body += `<w:p>${si > 0 && sec.pageBreak ? '<w:r><w:br w:type="page"/></w:r>' : ''}<w:pPr><w:pStyle w:val="Heading2"/></w:pPr>${run(sec.heading)}</w:p>`;
    }
    for (const para of sec.paragraphs) body += `<w:p>${run(para)}</w:p>`;
  });
  const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
  const files = {
    '[Content_Types].xml': '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>',
    '_rels/.rels': '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>',
    'word/_rels/document.xml.rels': '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>',
    'word/styles.xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:styles xmlns:w="${W}"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri" w:eastAsia="Calibri"/><w:sz w:val="22"/><w:lang w:val="de-DE"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="120"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style><w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:before="240"/></w:pPr><w:rPr><w:b/><w:sz w:val="26"/></w:rPr></w:style></w:styles>`,
    'word/document.xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:document xmlns:w="${W}"><w:body>${body}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1417" w:right="1417" w:bottom="1134" w:left="1417" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr></w:body></w:document>`,
    'docProps/core.xml': '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title></dc:title><dc:creator></dc:creator><cp:lastModifiedBy></cp:lastModifiedBy></cp:coreProperties>',
    'docProps/app.xml': '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>Anonymisierer</Application></Properties>',
  };
  if (opts.kennung) {
    files['docProps/custom.xml'] = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/custom-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><property fmtid="{D5CDD505-2E9C-101B-9397-08002B2CF9AE}" pid="2" name="${KENNUNG_PROP}"><vt:lpwstr>${opts.kennung}</vt:lpwstr></property></Properties>`;
    files['[Content_Types].xml'] = files['[Content_Types].xml'].replace('</Types>', '<Override PartName="/docProps/custom.xml" ContentType="application/vnd.openxmlformats-officedocument.custom-properties+xml"/></Types>');
    files['_rels/.rels'] = files['_rels/.rels'].replace('</Relationships>', '<Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/custom-properties" Target="docProps/custom.xml"/></Relationships>');
  }
  const zip = new JSZip();
  for (const [n, c] of Object.entries(files)) zip.file(n, c, { date: FIXED_DATE, createFolders: false });
  return zip.generateAsync({ ...ZIP_OPTS, mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
}
