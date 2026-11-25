// Hilfsfunktionen für Office-XML (DOCX/XLSX): Parsen, Segmente, Ersetzungen verteilen.

export function parseXml(str, name) {
  const doc = new DOMParser().parseFromString(str, 'application/xml');
  if (doc.getElementsByTagName('parsererror').length) throw new Error('XML-Fehler in ' + name);
  return doc;
}

export function serializeXml(doc) {
  let s = new XMLSerializer().serializeToString(doc);
  if (!s.startsWith('<?xml')) s = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' + s;
  return s;
}

export const isEl = (n) => n && n.nodeType === 1;
export const nsHas = (el, part) => !!(el.namespaceURI && el.namespaceURI.includes(part));
export const isW = (el) => nsHas(el, 'wordprocessingml') && /main$/.test(el.namespaceURI);
export const isA = (el) => nsHas(el, 'drawingml') && /main$/.test(el.namespaceURI);
export const isS = (el) => nsHas(el, 'spreadsheetml') && /main$/.test(el.namespaceURI);

export function allElements(doc) {
  return Array.from(doc.getElementsByTagName('*'));
}

export function ancestor(el, pred, stop) {
  let p = el.parentNode;
  while (p && p.nodeType === 1) {
    if (stop && stop(p)) return null;
    if (pred(p)) return p;
    p = p.parentNode;
  }
  return null;
}

// Segment: {text, writable, set(newText)}; Einheit: {text, segments}
export function makeUnit(segments, label) {
  let pos = 0;
  for (const sg of segments) { sg.start = pos; pos += sg.text.length; sg.end = pos; }
  return { text: segments.map((s) => s.text).join(''), segments, label };
}

export function textSegment(el, fixSpace) {
  return {
    text: (el.textContent || '').normalize('NFC'),
    writable: true,
    set(t) {
      el.textContent = t;
      if (fixSpace && /^\s|\s$/.test(t)) el.setAttributeNS('http://www.w3.org/XML/1998/namespace', 'xml:space', 'preserve');
    },
  };
}
export function virtualSegment(text) {
  return { text, writable: false, set() {} };
}

// Ersetzungen [{s,e,text}] (Einheitskoordinaten) auf die Segmente verteilen.
// Der Ersatztext kommt in das erste beschreibbare Segment des Bereichs; der Rest des Bereichs wird gelöscht.
export function distribute(unit, reps) {
  if (!reps.length) return false;
  const sorted = [...reps].sort((a, b) => a.s - b.s);
  const newTexts = unit.segments.map((sg) => (sg.writable ? [] : null));
  const segs = unit.segments;
  // Für jedes Zeichen der Einheit entscheiden: behalten, löschen, oder (am Bereichsanfang) Ersatztext einfügen
  let ri = 0;
  for (let si = 0; si < segs.length; si++) {
    const sg = segs[si];
    if (!sg.writable) continue;
    const out = newTexts[si];
    for (let p = sg.start; p < sg.end; p++) {
      while (ri < sorted.length && sorted[ri].e <= p) ri++;
      const r = sorted[ri];
      if (r && p >= r.s && p < r.e) {
        if (!r.placed) { out.push(r.text); r.placed = true; }
      } else out.push(sg.text[p - sg.start]);
    }
  }
  for (const r of sorted) {
    if (!r.placed) {
      // Bereich lag nur in nicht beschreibbaren Segmenten: an nächstes beschreibbares Segment anhängen
      const si = segs.findIndex((sg) => sg.writable && sg.start >= r.s);
      if (si >= 0) newTexts[si].unshift(r.text);
    }
    delete r.placed;
  }
  let changed = false;
  segs.forEach((sg, si) => {
    if (!sg.writable) return;
    const t = newTexts[si].join('');
    if (t !== sg.text) { sg.set(t); changed = true; }
  });
  return changed;
}

// Pfade in externen Verweisen: Benutzernamen in lokalen Pfaden neutralisieren
export function neutralizePath(s) {
  return s.replace(/((?:Users|Benutzer|Dokumente und Einstellungen|Documents and Settings|home)[\\/]+)[^\\/]+/gi, '$1benutzer');
}

export async function readZipText(zip, name) {
  const f = zip.file(name);
  return f ? f.async('string') : null;
}

// ---------- Nutzertext (Version 2.4.1) ----------
// Der Schlusscheck sucht nur in Inhalten, die Nutzertext tragen können: alle Textknoten (Zellen, Absätze, Kommentare,
// Kopf-/Fußzeilen, Dateieigenschaften …) und die unten genannten Attribute (Bildbeschreibungen, Blattnamen, Autoren,
// Verweisziele …). Formatangaben (Rahmenart „thin“, Ausrichtung „left“, Farbe „auto“, Stilverweise, Maße) werden
// nicht durchsucht. Teile, deren Aufbau unbekannt ist (fremde Namensräume, SharePoint-/Zusatzdaten), werden wie
// bisher vollständig mit allen Attributwerten durchsucht.
const OOXML_NS = /^(http:\/\/schemas\.openxmlformats\.org\/|http:\/\/purl\.oclc\.org\/ooxml\/|http:\/\/schemas\.microsoft\.com\/office\/(word|excel|drawing|spreadsheetml|20\d\d\/relationships)|urn:schemas-microsoft-com:)/;
// Attribute mit Nutzertext, gleich an welchem Element
const USER_ATTR = new Set(['descr', 'title', 'alt', 'tooltip', 'author', 'displayName', 'initials', 'userName', 'userId',
  'string', 'instr', 'caption', 'prompt', 'error', 'promptTitle', 'errorTitle', 'display', 'location', 'href',
  'destinationFile', 'sourceFile', 'odcFile', 'connection', 'command', 'description', 'Target', 'PartName']);
// Attribute mit Nutzertext nur an bestimmten Elementen
const NAME_ELS = new Set(['cNvPr', 'docPr', 'bookmarkStart', 'sheet', 'definedName', 'tableColumn', 'table', 'cacheField',
  'userInfo', 'property', 'docVar', 'queryTable', 'connection', 'pivotTableDefinition', 'pivotField', 'dataField',
  'slicer', 'slicerCacheDefinition', 'timeline', 'timelineCacheDefinition', 'tableStyle']);
const VAL_ELS = new Set(['alias', 'tag', 'docVar', 'statusText', 'helpText', 'default', 'listEntry', 'lvlText', 'filter',
  'customFilter', 'sheetName']);
const on = (v) => v === '1' || v === 'true' || v === 'on';
function userAttr(el, a) {
  const ln = a.localName;
  const el1 = el.localName;
  if (USER_ATTR.has(ln)) return a.value;
  if (ln === 'name') {
    if (NAME_ELS.has(el1)) return a.value;
    // Excel: eigene Zellenformatvorlage (ohne builtinId); Word: Name einer eigenen Formatvorlage siehe unten
    if (el1 === 'cellStyle' && !el.hasAttribute('builtinId')) return a.value;
    return null;
  }
  if (ln === 'val') {
    if (VAL_ELS.has(el1)) return a.value;
    const p = el.parentNode;
    // Word: Formularfeld-Name, Name einer eigenen Formatvorlage (w:customStyle)
    if (el1 === 'name' && p && p.nodeType === 1 && (p.localName === 'ffData'
      || (p.localName === 'style' && Array.from(p.attributes).some((x) => x.localName === 'customStyle' && on(x.value))))) return a.value;
    return null;
  }
  if (ln === 'text' && el1 === 'cfRule') return a.value;
  if (ln === 'v' && (el1 === 's' || el1 === 'pivotField')) return a.value;
  if (ln === 'n' && el1 === 'item') return a.value;
  if ((ln === 'value' || ln === 'displayText') && el1 === 'listItem') return a.value;
  if (ln === 'comment' && el1 === 'definedName') return a.value;
  if (ln === 'anchor' && el1 === 'hyperlink') return a.value;
  if (ln === 'sheet' && el1 === 'worksheetSource') return a.value;
  // Zahlenformat: nur Text in Anführungszeichen („"Herr "@“), nicht die Formatzeichen
  if (ln === 'formatCode' && el1 === 'numFmt') return (a.value.match(/"[^"]*"/g) || []).join(' ');
  return null;
}
// Excel: Steuercodes der Kopf-/Fußzeile (&L, &"Arial,Bold", &12 …) entfernen
const HF_CODES = /&(?:"[^"]*"|\d{1,3}|K[0-9A-Fa-f]{6}|K\d\d[+-]\d{3}|&|[A-Za-z])/g;
// Excel: Funktionsnamen in Formeln („ROW(“, „_xlfn.CONCAT(“) außerhalb von Zeichenketten entfernen
function formulaUserText(f) {
  return f.split(/("(?:[^"]|"")*")/).map((p, i) => (i % 2 ? p : p.replace(/[A-Z_][A-Z0-9._]*(?=\()/g, ' '))).join('');
}
const isSml = (el) => el.namespaceURI && /spreadsheetml|officeDocument\/2006\/main$|purl\.oclc\.org\/ooxml\/spreadsheetml|\/excel\/\d+\/main$/.test(el.namespaceURI);
function userTextNode(el, v) {
  const ln = el.localName;
  if (/^(odd|even|first)(Header|Footer)$/.test(ln) && isSml(el)) return v.replace(HF_CODES, ' ');
  if ((ln === 'f' || ln === 'formula' || ln === 'formula1' || ln === 'formula2' || ln === 'definedName') && isSml(el)) return formulaUserText(v);
  return v;
}
const CUSTOM_DATA = /(^|\/)customXml\/item\d*\.xml$/i;

// Alle Texte eines (Ausgabe-)ZIPs für den Schlusscheck: Textknoten und Attributwerte aller XML-Teile,
// dazu UTF-8/UTF-16-Dekodierung kleiner Binärteile.
// opts.inflatePng: zusätzlich komprimierte PNG-Textblöcke (zTXt, iTXt) entpacken (Schlusscheck beim Anonymisieren)
// opts.userText (Version 2.4.1): in bekannten Office-Teilen nur Nutzertext (siehe oben) als text liefern
export async function collectZipTexts(zip, opts = {}) {
  const texts = [];
  const names = Object.keys(zip.files).filter((n) => !zip.files[n].dir).sort();
  for (const name of names) {
    if (/\.(xml|rels|vml)$/i.test(name)) {
      const str = await zip.file(name).async('string');
      let doc;
      try { doc = parseXml(str, name); } catch { texts.push({ where: name, text: str }); continue; }
      const parts = [];
      const plain = []; // nur Textknoten (Version 2.3: für Einrichtungen über mehrere Textläufe hinweg)
      const root = doc.documentElement;
      // bekannter Office-Teil (Namensraum der Wurzel oder VML) und keine SharePoint-/Zusatzdaten: nur Nutzertext
      const known = !!opts.userText && !CUSTOM_DATA.test(name) && !!root
        && ((root.namespaceURI && OOXML_NS.test(root.namespaceURI)) || /\.vml$/i.test(name));
      const walk = (n) => {
        for (const c of Array.from(n.childNodes)) {
          if (c.nodeType === 3 || c.nodeType === 4) {
            parts.push(known ? userTextNode(n, c.nodeValue) : c.nodeValue);
            plain.push(c.nodeValue);
          } else if (c.nodeType === 1) {
            for (const a of Array.from(c.attributes)) {
              if (/^xmlns/.test(a.name)) continue;
              if (!known) { parts.push(a.value); continue; }
              const v = userAttr(c, a);
              if (v) parts.push(v);
            }
            walk(c);
          }
        }
      };
      walk(doc);
      texts.push({ where: name, text: parts.join('\n'), plain: plain.join('\n') });
    } else {
      const bytes = await zip.file(name).async('uint8array');
      if (bytes.length > 8 * 1024 * 1024) { texts.push({ where: name, text: '', skipped: true }); continue; }
      const utf16 = (b) => new TextDecoder('utf-16le').decode(b.length % 2 ? b.subarray(0, b.length - 1) : b);
      // Version 2.11.2 (opts.pixelSkip, nur Schlusscheck beim Anonymisieren): In PNG und JPEG sind die reinen Bilddaten
      // (PNG: IDAT/fdAT, JPEG: die Daten nach SOS) Zufallsbytes. Kurze Namen (bis 4 Buchstaben) werden dort nicht gesucht
      // (Zufallstreffer), sonst überall wie bisher; lange Namen (ab 5 Buchstaben) weiter in allen Bytes.
      const pix = opts.pixelSkip ? pixelRanges(bytes) : null;
      if (pix && pix.length) {
        texts.push({ where: name + ' (binär, UTF-8)', text: new TextDecoder('utf-8').decode(bytes), minLetters: 5 });
        texts.push({ where: name + ' (binär, UTF-16)', text: utf16(bytes), minLetters: 5 });
        const masked = bytes.slice();
        for (const [a, b] of pix) masked.fill(0, a, b);
        texts.push({ where: name + ' (binär, UTF-8)', text: new TextDecoder('utf-8').decode(masked), maxLetters: 4 });
        texts.push({ where: name + ' (binär, UTF-16)', text: utf16(masked), maxLetters: 4 });
      } else {
        texts.push({ where: name + ' (binär, UTF-8)', text: new TextDecoder('utf-8').decode(bytes) });
        texts.push({ where: name + ' (binär, UTF-16)', text: utf16(bytes) });
      }
      if (opts.inflatePng && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
        for (const t of await pngCompressedTexts(bytes)) texts.push({ where: name + ' (binär, Bildangaben)', text: t });
      }
    }
  }
  return texts;
}

// Version 2.11.2: Bereiche der reinen Bilddaten [Anfang, Ende) in PNG (IDAT, fdAT) und JPEG (Daten nach SOS bis zur
// nächsten Marke). Alles andere (Textfelder, EXIF, XMP, Kommentare, Tabellen) bleibt außerhalb. Bei unklarer Struktur
// endet die Liste dort (der Rest wird wie bisher ganz geprüft).
export function pixelRanges(b) {
  const out = [];
  if (b.length > 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) {
    let i = 8;
    while (i + 12 <= b.length) {
      const len = ((b[i] << 24) | (b[i + 1] << 16) | (b[i + 2] << 8) | b[i + 3]) >>> 0;
      const type = String.fromCharCode(b[i + 4], b[i + 5], b[i + 6], b[i + 7]);
      if (i + 12 + len > b.length) break;
      if (type === 'IDAT' || type === 'fdAT') out.push([i + 8, i + 8 + len]);
      i += 12 + len;
    }
    return out;
  }
  if (b.length > 4 && b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i + 4 <= b.length) {
      if (b[i] !== 0xff) break;
      const m = b[i + 1];
      if (m === 0xff) { i++; continue; } // Füllbyte
      if (m === 0xd9) break; // Ende
      if ((m >= 0xd0 && m <= 0xd7) || m === 0x01) { i += 2; continue; }
      const len = (b[i + 2] << 8) | b[i + 3];
      if (len < 2 || i + 2 + len > b.length) break;
      i += 2 + len;
      if (m !== 0xda) continue;
      // Bilddaten bis zur nächsten Marke (0xFF gefolgt von etwas anderem als 0x00 oder RST)
      let j = i;
      while (j + 1 < b.length && !(b[j] === 0xff && b[j + 1] !== 0x00 && !(b[j + 1] >= 0xd0 && b[j + 1] <= 0xd7))) j++;
      out.push([i, j]);
      i = j;
    }
  }
  return out;
}

// Komprimierte PNG-Textblöcke entpacken. Ohne DecompressionStream (sehr alte Browser): Hinweistext, damit nichts still fehlt.
async function pngCompressedTexts(b) {
  const out = [];
  const dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
  let i = 8;
  while (i + 12 <= b.length) {
    const len = dv.getUint32(i);
    const type = String.fromCharCode(b[i + 4], b[i + 5], b[i + 6], b[i + 7]);
    const data = b.subarray(i + 8, Math.min(b.length, i + 8 + len));
    i += 12 + len;
    let comp = null;
    if (type === 'zTXt') { const z = data.indexOf(0); if (z >= 0) comp = data.subarray(z + 2); }
    if (type === 'iTXt') {
      const z = data.indexOf(0);
      if (z >= 0 && data[z + 1] === 1) {
        let k = z + 3;
        k = data.indexOf(0, k) + 1; // Sprache
        k = data.indexOf(0, k) + 1; // übersetztes Schlüsselwort
        if (k > 0) comp = data.subarray(k);
      }
    }
    if (!comp) continue;
    if (typeof DecompressionStream === 'undefined') { out.push('[komprimierte Bildangaben nicht prüfbar]'); continue; }
    try {
      const stream = new Blob([comp]).stream().pipeThrough(new DecompressionStream('deflate'));
      out.push(new TextDecoder('utf-8').decode(await new Response(stream).arrayBuffer()));
    } catch { out.push('[komprimierte Bildangaben nicht lesbar]'); }
  }
  return out;
}

export const ZIP_OPTS = { type: 'uint8array', compression: 'DEFLATE', compressionOptions: { level: 6 } };
export const FIXED_DATE = new Date(Date.UTC(1980, 0, 1, 12, 0, 0));
