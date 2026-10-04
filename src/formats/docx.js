// Word (.docx): vollständiges Lesen (Haupttext, Kopf-/Fußzeilen, Fußnoten, Endnoten, Kommentare,
// Textfelder, nachverfolgte Änderungen, Diagramme) und Schreiben unter Erhalt der Formatierung.
import JSZip from 'jszip';
import {
  parseXml, serializeXml, allElements, isW, isA, makeUnit, textSegment, virtualSegment, distribute,
  ancestor, neutralizePath, ZIP_OPTS, FIXED_DATE,
} from './xmlutil.js';

const PART_ORDER = [
  [/^word\/document\.xml$/, 'Text'],
  [/^word\/header\d*\.xml$/, 'Kopfzeile'],
  [/^word\/footer\d*\.xml$/, 'Fußzeile'],
  [/^word\/footnotes\.xml$/, 'Fußnote'],
  [/^word\/endnotes\.xml$/, 'Endnote'],
  [/^word\/comments\.xml$/, 'Kommentar'],
  [/^word\/glossary\/document\.xml$/, 'Baustein'],
  [/^word\/charts\/.*\.xml$/, 'Diagramm'],
  [/^word\/diagrams\/.*\.xml$/, 'SmartArt'],
];
const SKIP_PARTS = /^word\/(styles|settings|fontTable|webSettings|numbering|people|commentsExtended|commentsIds|commentsExtensible|stylesWithEffects)\.xml$|^word\/theme\//;

function natural(a, b) { return a.localeCompare(b, 'en', { numeric: true }); }

function isPara(el) { return (isW(el) || isA(el)) && el.localName === 'p'; }

function paragraphUnits(doc, baseLabel) {
  const units = [];
  const owned = new Set();
  for (const p of allElements(doc)) {
    if (!isPara(p)) continue;
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
    let label = baseLabel;
    if (ancestor(p, (a) => isW(a) && a.localName === 'txbxContent')) label = 'Textfeld';
    else if (ancestor(p, (a) => isW(a) && a.localName === 'tbl')) label = baseLabel === 'Text' ? 'Tabelle' : baseLabel;
    if (segs.some((sg, i) => i > 0 && !sg.writable && sg.text === '\n') && p.getElementsByTagNameNS('*', 'delText').length) {
      label += ' (mit gelöschtem Text aus Änderungsverfolgung)';
    }
    units.push(makeUnit(segs, label));
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
  if (!ct || !zip.file('word/document.xml')) throw new Error('Die Datei ist kein gültiges Word-Dokument (.docx).');
  const ctText = await ct.async('string');
  if (/macroEnabled/i.test(ctText)) throw new Error('Word-Dateien mit Makros (.docm) werden nicht unterstützt.');
  return zip;
}

// Liest das Dokument. Liefert Einheiten und eine Funktion, die mit Ersetzungen die neue Datei baut.
export async function readDocx(bytes) {
  const zip = await open(bytes);
  const names = Object.keys(zip.files).filter((n) => !zip.files[n].dir);
  const xmlNames = names.filter((n) => /\.xml$/i.test(n));
  const unitParts = [];
  for (const [re, label] of PART_ORDER) {
    for (const n of xmlNames.filter((x) => re.test(x)).sort(natural)) unitParts.push([n, label]);
  }
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
  const warnings = [];
  const embedded = names.filter((n) => /^word\/embeddings\//.test(n));
  if (embedded.length) warnings.push(`Das Dokument enthält ${embedded.length} eingebettete(s) Objekt(e) (z. B. Excel-Tabellen). Deren Inhalt wird NICHT anonymisiert und vor dem Export entfernt.`);
  const media = names.filter((n) => /^word\/media\//.test(n));
  if (media.length) warnings.push(`Das Dokument enthält ${media.length} Bild(er). Namen IN Bildern (z. B. Scans, Unterschriften) erkennt das Tool nicht.`);
  return { kind: 'docx', zip, docs, units, owned, warnings, names };
}

// Baut die anonymisierte .docx. repsPerUnit: Ersetzungen je Einheit; generic(str): Ersetzer für sonstige Texte.
export async function writeDocx(bytes, repsPerUnit, generic) {
  const d = await readDocx(bytes);
  const changed = new Set();
  d.units.forEach((u, i) => { if (distribute(u, repsPerUnit[i] || [])) changed.add(u.part); });

  // Sonstige Texte (Feldfunktionen, benutzerdefinierte XML-Daten, Alternativtexte …)
  const ATTRS = new Set(['descr', 'title', 'instr', 'alias', 'tag']);
  for (const [n, doc] of d.docs) {
    let mod = false;
    for (const el of allElements(doc)) {
      // Metadaten-Attribute: Autor/Initialen/Benutzerkennung
      for (const a of Array.from(el.attributes)) {
        const ln = a.localName;
        let v = a.value;
        if (ln === 'author' || ln === 'displayName') v = v ? 'Autor' : v;
        else if (ln === 'initials') v = v ? 'A' : v;
        else if (ln === 'userId' || ln === 'providerId') v = '';
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

  // Dokumenteigenschaften leeren
  const core = d.docs.get('docProps/core.xml');
  if (core) {
    for (const el of allElements(core)) {
      if (['creator', 'lastModifiedBy', 'title', 'subject', 'keywords', 'description', 'category', 'contentStatus', 'identifier', 'language'].includes(el.localName) && el.textContent) {
        el.textContent = '';
        changed.add('docProps/core.xml');
      }
    }
  }
  const app = d.docs.get('docProps/app.xml');
  if (app) {
    for (const el of allElements(app)) {
      if (['Company', 'Manager', 'HyperlinkBase'].includes(el.localName) && el.textContent) { el.textContent = ''; changed.add('docProps/app.xml'); }
    }
  }
  const custom = d.docs.get('docProps/custom.xml');
  if (custom) {
    for (const el of allElements(custom)) {
      if (['lpwstr', 'lpstr', 'bstr'].includes(el.localName) && el.textContent) { el.textContent = ''; changed.add('docProps/custom.xml'); }
    }
  }

  // Verweise (.rels): externe Pfade neutralisieren, Vorschaubild entfernen
  for (const n of d.names.filter((x) => /\.rels$/.test(x))) {
    const doc = parseXml(await d.zip.file(n).async('string'), n);
    let mod = false;
    for (const rel of allElements(doc).filter((e) => e.localName === 'Relationship')) {
      const target = rel.getAttribute('Target') || '';
      if (/\/thumbnail$/.test(rel.getAttribute('Type') || '')) {
        rel.parentNode.removeChild(rel);
        mod = true;
      } else if (rel.getAttribute('TargetMode') === 'External') {
        const nt = generic(neutralizePath(target));
        if (nt !== target) { rel.setAttribute('Target', nt); mod = true; }
      }
    }
    if (mod) d.zip.file(n, serializeXml(doc), { date: FIXED_DATE, createFolders: false });
  }
  for (const n of d.names) {
    if (/^docProps\/thumbnail\./i.test(n)) d.zip.remove(n);
    // Eingebettete Objekte werden geleert (Inhalt nicht prüfbar); die Beziehung bleibt, damit das Dokument gültig bleibt
    else if (/^word\/embeddings\//.test(n)) d.zip.file(n, new Uint8Array(0), { date: FIXED_DATE, createFolders: false });
  }
  for (const n of changed) d.zip.file(n, serializeXml(d.docs.get(n)), { date: FIXED_DATE, createFolders: false });
  return d.zip.generateAsync({ ...ZIP_OPTS, mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
}

// Neues, schlichtes Word-Dokument aus Textabschnitten (für TXT/PDF/CSV-Eingaben).
// sections: [{heading?, paragraphs: [string]}]
export async function buildDocx(sections) {
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
  const zip = new JSZip();
  for (const [n, c] of Object.entries(files)) zip.file(n, c, { date: FIXED_DATE, createFolders: false });
  return zip.generateAsync({ ...ZIP_OPTS, mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
}
