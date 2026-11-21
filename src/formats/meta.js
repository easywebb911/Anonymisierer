// Versteckte Angaben in Office-Dateien (.docx/.xlsx): Dateieigenschaften, SharePoint-Felder (customXml),
// Bild-Metadaten. Die Teile werden über ihre Verweise gefunden (Beziehungen und Inhaltstypen),
// nicht über feste Pfade. Alles hier ist rein lokal (keine Netzwerkzugriffe).
import { parseXml, serializeXml, allElements, FIXED_DATE } from './xmlutil.js';
import { partIndex } from './parts.js';

const ZOPT = { date: FIXED_DATE, createFolders: false };
const XSI = 'http://www.w3.org/2001/XMLSchema-instance';

// Beziehungstypen und Inhaltstypen der Eigenschaftsteile (Transitional und Strict)
const PROP_KINDS = [
  ['core', /\/metadata\/core-properties$/, /core-properties\+xml$/],
  ['app', /\/extended-properties$/, /extended-properties\+xml$/],
  ['custom', /\/custom-properties$/, /custom-properties\+xml$/],
];

function resolveTarget(baseDir, target) {
  if (target.startsWith('/')) return target.slice(1);
  const out = [];
  for (const p of (baseDir + target).split('/')) { if (p === '..') out.pop(); else if (p && p !== '.') out.push(p); }
  return out.join('/');
}

async function readXml(zip, docs, name) {
  if (docs.has(name)) return docs.get(name);
  const f = zip.file(name);
  if (!f) return null;
  let doc;
  try { doc = parseXml(await f.async('string'), name); } catch { return null; }
  docs.set(name, doc);
  return doc;
}

// Findet die Eigenschaftsteile über _rels/.rels und [Content_Types].xml. Liefert {core:[], app:[], custom:[]}.
export async function findPropertyParts(zip, docs) {
  const found = { core: new Set(), app: new Set(), custom: new Set() };
  const rels = await readXml(zip, docs, '_rels/.rels');
  if (rels) {
    for (const r of allElements(rels).filter((e) => e.localName === 'Relationship')) {
      if (r.getAttribute('TargetMode') === 'External') continue;
      const type = r.getAttribute('Type') || '';
      for (const [k, re] of PROP_KINDS) if (re.test(type)) found[k].add(resolveTarget('', r.getAttribute('Target') || ''));
    }
  }
  const ct = await readXml(zip, docs, '[Content_Types].xml');
  if (ct) {
    for (const o of allElements(ct).filter((e) => e.localName === 'Override')) {
      const type = o.getAttribute('ContentType') || '';
      for (const [k, , re] of PROP_KINDS) if (re.test(type)) found[k].add(resolveTarget('', o.getAttribute('PartName') || ''));
    }
  }
  const out = {};
  for (const k of Object.keys(found)) out[k] = [...found[k]].filter((n) => zip.file(n)).sort();
  return out;
}

// SharePoint-/Zusatzdaten: customXml/item*.xml (ohne itemProps), auch an anderen Orten, wenn per Beziehung verknüpft
export async function findCustomXmlParts(zip, docs) {
  const names = new Set(Object.keys(zip.files).filter((n) => !zip.files[n].dir && /(^|\/)customXml\/item\d*\.xml$/i.test(n)));
  for (const relName of Object.keys(zip.files).filter((n) => /\.rels$/.test(n))) {
    const rels = await readXml(zip, docs, relName);
    if (!rels) continue;
    const dir = relName.replace(/_rels\/[^/]*\.rels$/, ''); // "_rels/.rels" (Paketebene) -> ""
    for (const r of allElements(rels).filter((e) => e.localName === 'Relationship')) {
      if (r.getAttribute('TargetMode') === 'External') continue;
      if (/\/customXml$/.test(r.getAttribute('Type') || '')) names.add(resolveTarget(dir, r.getAttribute('Target') || ''));
    }
  }
  return [...names].filter((n) => zip.file(n) && !/itemProps/i.test(n)).sort();
}

// ---------- Namen aus den Original-Metadaten ----------
// kind: 'person' (Wortvergleich) oder 'org' (Firmenname, Vergleich als ganze Wortfolge)
const PERSON_PROPS = { creator: 'Autor', lastModifiedBy: 'zuletzt bearbeitet von', Manager: 'Manager' };
export async function collectMetaNames(zip, docs) {
  const list = [];
  const add = (name, where, kind = 'person') => {
    let v = (name || '').replace(/\s+/g, ' ').trim();
    if (!v || !/\p{L}{2,}/u.test(v)) return;
    if (!list.some((x) => x.name === v && x.kind === kind)) list.push({ name: v, where, kind });
  };
  const props = await findPropertyParts(zip, docs);
  for (const n of props.core) {
    const doc = await readXml(zip, docs, n);
    if (doc) for (const el of allElements(doc)) if (PERSON_PROPS[el.localName]) add(el.textContent, 'Dateieigenschaften: ' + PERSON_PROPS[el.localName]);
  }
  for (const n of props.app) {
    const doc = await readXml(zip, docs, n);
    if (!doc) continue;
    for (const el of allElements(doc)) {
      if (el.localName === 'Manager') add(el.textContent, 'Dateieigenschaften: Manager');
      if (el.localName === 'Company') add(el.textContent, 'Dateieigenschaften: Firma', 'org');
    }
  }
  // Kommentar- und Änderungsautoren, Personenlisten (Word: w:author, people.xml; Excel: authors, persons, userInfo)
  // Version 2.4.1: auch Kommentar-, Personen- und Textteile außerhalb von word/ bzw. xl/ (über Beziehung/Inhaltstyp)
  const idx = await partIndex(zip);
  const TEXT_REL = /\/(officeDocument|header|footer|footnotes|endnotes|comments|threadedComment|person|people|worksheet|revisionLog|usernames)$/;
  const TEXT_CT = /(document\.main|template\.main|sheet\.main|header|footer|footnotes|endnotes|comments|threadedcomments|person|people|worksheet|revisionLog|userNames)\+xml$/i;
  for (const n of Object.keys(zip.files).filter((x) => !zip.files[x].dir && /\.xml$/i.test(x)).sort()) {
    if (!/^(word|xl)\//.test(n) && !idx.is(n, TEXT_REL, TEXT_CT)) continue;
    const doc = await readXml(zip, docs, n);
    if (!doc) continue;
    for (const el of allElements(doc)) {
      for (const a of Array.from(el.attributes)) {
        if (a.localName === 'author' || (a.localName === 'displayName' && el.localName === 'person') || (a.localName === 'name' && el.localName === 'userInfo')) {
          add(a.value, 'Kommentar-/Änderungsautor');
        }
      }
      if (el.localName === 'author' && el.parentNode && el.parentNode.localName === 'authors') add(el.textContent, 'Kommentarautor');
    }
  }
  // SharePoint-Personenfelder
  for (const n of await findCustomXmlParts(zip, docs)) {
    const doc = await readXml(zip, docs, n);
    if (!doc) continue;
    for (const ui of allElements(doc).filter((e) => e.localName === 'UserInfo')) {
      for (const c of Array.from(ui.childNodes)) if (c.nodeType === 1 && c.localName === 'DisplayName') add(c.textContent, 'SharePoint-Personenfeld');
    }
  }
  return list;
}

// ---------- Bereinigen ----------
const CORE_CLEAR = ['creator', 'lastModifiedBy', 'title', 'subject', 'keywords', 'description', 'category', 'contentStatus', 'identifier', 'language'];
const APP_CLEAR = ['Company', 'Manager', 'HyperlinkBase'];

// Leert Autor, letzten Bearbeiter, Firma, Manager, Titel, Stichwörter und benutzerdefinierte Textwerte,
// egal wo die Teile liegen. Die Struktur (Elemente) bleibt erhalten. opts.titlesOfParts: Titel in app.xml leeren (Word).
export async function cleanProperties(zip, docs, changed, opts = {}) {
  const props = await findPropertyParts(zip, docs);
  for (const n of props.core) {
    const doc = await readXml(zip, docs, n);
    if (!doc) continue;
    for (const el of allElements(doc)) if (CORE_CLEAR.includes(el.localName) && el.textContent) { el.textContent = ''; changed.add(n); }
  }
  for (const n of props.app) {
    const doc = await readXml(zip, docs, n);
    if (!doc) continue;
    for (const el of allElements(doc)) {
      if (APP_CLEAR.includes(el.localName) && el.textContent) { el.textContent = ''; changed.add(n); }
      // Word: TitlesOfParts enthält den Dokumenttitel
      if (opts.titlesOfParts && el.localName === 'lpstr' && el.textContent && hasAncestor(el, 'TitlesOfParts')) { el.textContent = ''; changed.add(n); }
    }
  }
  for (const n of props.custom) {
    const doc = await readXml(zip, docs, n);
    if (!doc) continue;
    for (const el of allElements(doc)) if (['lpwstr', 'lpstr', 'bstr'].includes(el.localName) && el.textContent) { el.textContent = ''; changed.add(n); }
  }
  return props;
}
function hasAncestor(el, ln) { for (let p = el.parentNode; p && p.nodeType === 1; p = p.parentNode) if (p.localName === ln) return true; return false; }

// ---------- Kennung (Modus rückbaufähig) ----------
// Die Kennung verbindet anonymisierte Datei und Schlüsseldatei. Sie wird als unsichtbare benutzerdefinierte
// Eigenschaft geschrieben (nach der Bereinigung), damit sie ein Umbenennen der Datei übersteht.
// Sie ist ein Zufallswert ohne Bezug zum Inhalt (kein personenbezogener Wert).
export const KENNUNG_PROP = 'AnonymisiererKennung';
const CUSTOM_NS = 'http://schemas.openxmlformats.org/officeDocument/2006/custom-properties';
const VT_NS = 'http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes';
const CUSTOM_REL = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/custom-properties';
const CUSTOM_CT = 'application/vnd.openxmlformats-officedocument.custom-properties+xml';
const FMTID = '{D5CDD505-2E9C-101B-9397-08002B2CF9AE}';
export async function setKennungProperty(zip, docs, changed, kennung) {
  const props = await findPropertyParts(zip, docs);
  let name = props.custom[0];
  if (!name) {
    // Kein Teil für benutzerdefinierte Eigenschaften vorhanden: anlegen, mit Verweis und Inhaltstyp
    name = 'docProps/custom.xml';
    for (let i = 2; zip.file(name) || docs.has(name); i++) name = `docProps/custom${i}.xml`;
    docs.set(name, parseXml(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Properties xmlns="${CUSTOM_NS}" xmlns:vt="${VT_NS}"></Properties>`, name));
    // Verweise frisch aus dem Paket lesen (frühere Schritte haben sie evtl. schon geändert und geschrieben)
    const relFile = zip.file('_rels/.rels');
    const rels = relFile ? parseXml(await relFile.async('string'), '_rels/.rels') : null;
    if (rels) {
      docs.set('_rels/.rels', rels);
      const ids = new Set(allElements(rels).filter((e) => e.localName === 'Relationship').map((e) => e.getAttribute('Id')));
      let id = 'rIdKennung';
      for (let i = 2; ids.has(id); i++) id = 'rIdKennung' + i;
      const rel = rels.createElementNS(rels.documentElement.namespaceURI, 'Relationship');
      rel.setAttribute('Id', id);
      rel.setAttribute('Type', CUSTOM_REL);
      rel.setAttribute('Target', name);
      rels.documentElement.appendChild(rel);
      zip.file('_rels/.rels', serializeXml(rels), ZOPT);
      changed.add('_rels/.rels');
    }
    const ct = await readXml(zip, docs, '[Content_Types].xml');
    if (ct) {
      const o = ct.createElementNS(ct.documentElement.namespaceURI, 'Override');
      o.setAttribute('PartName', '/' + name);
      o.setAttribute('ContentType', CUSTOM_CT);
      ct.documentElement.appendChild(o);
      changed.add('[Content_Types].xml');
    }
  }
  const doc = docs.get(name) || await readXml(zip, docs, name);
  const root = doc.documentElement;
  let pid = 1;
  for (const el of allElements(doc).filter((e) => e.localName === 'property')) {
    if (el.getAttribute('name') === KENNUNG_PROP) { el.parentNode.removeChild(el); continue; }
    pid = Math.max(pid, Number(el.getAttribute('pid')) || 1);
  }
  const prop = doc.createElementNS(root.namespaceURI, root.prefix ? root.prefix + ':property' : 'property');
  prop.setAttribute('fmtid', FMTID);
  prop.setAttribute('pid', String(pid + 1));
  prop.setAttribute('name', KENNUNG_PROP);
  const v = doc.createElementNS(VT_NS, 'vt:lpwstr');
  v.textContent = kennung;
  prop.appendChild(v);
  root.appendChild(prop);
  changed.add(name);
}
// Liest die Kennung aus der Datei (null, wenn keine vorhanden)
export async function readKennungProperty(zip, docs) {
  for (const n of (await findPropertyParts(zip, docs)).custom) {
    const doc = await readXml(zip, docs, n);
    if (!doc) continue;
    for (const el of allElements(doc).filter((e) => e.localName === 'property' && e.getAttribute('name') === KENNUNG_PROP)) {
      const t = (el.textContent || '').trim();
      if (t) return t;
    }
  }
  return null;
}

// SharePoint-Felder: Personen-Felder leeren (in der Form, die SharePoint selbst für "leer" verwendet:
// DisplayName leer, AccountId xsi:nil, AccountType leer). Andere Textwerte, die einen Namen enthalten, leeren.
// containsName(str) -> true, wenn str einen bestätigten Namen oder einen Namen aus den Metadaten enthält.
export async function cleanCustomXml(zip, docs, changed, containsName) {
  const parts = await findCustomXmlParts(zip, docs);
  for (const n of parts) {
    const doc = await readXml(zip, docs, n);
    if (!doc) continue;
    let mod = false;
    const inUserInfo = new Set();
    for (const ui of allElements(doc).filter((e) => e.localName === 'UserInfo')) {
      for (const c of Array.from(ui.childNodes)) {
        if (c.nodeType !== 1) continue;
        inUserInfo.add(c);
        if (c.localName === 'AccountId') {
          if (c.textContent || c.getAttributeNS(XSI, 'nil') !== 'true') { c.textContent = ''; c.setAttributeNS(XSI, 'xsi:nil', 'true'); mod = true; }
        } else if (c.textContent) { c.textContent = ''; mod = true; }
      }
    }
    if (containsName) {
      for (const el of allElements(doc)) {
        if (inUserInfo.has(el)) continue;
        for (const c of Array.from(el.childNodes)) {
          if ((c.nodeType === 3 || c.nodeType === 4) && /\p{L}/u.test(c.nodeValue) && containsName(c.nodeValue)) { c.nodeValue = ''; mod = true; }
        }
      }
    }
    if (mod) changed.add(n);
  }
  return parts;
}

// Vorschaubild (zeigt die erste Seite, also evtl. Namen): Beziehung, Datei und ggf. Inhaltstyp-Eintrag entfernen,
// egal wo das Bild liegt.
export async function removeThumbnails(zip, docs, changed) {
  const rels = await readXml(zip, docs, '_rels/.rels');
  if (!rels) return;
  const targets = [];
  for (const r of allElements(rels).filter((e) => e.localName === 'Relationship')) {
    if (!/\/thumbnail$/.test(r.getAttribute('Type') || '') || r.getAttribute('TargetMode') === 'External') continue;
    targets.push(resolveTarget('', r.getAttribute('Target') || ''));
    r.parentNode.removeChild(r);
  }
  if (!targets.length) return;
  zip.file('_rels/.rels', serializeXml(rels), ZOPT);
  changed.add('_rels/.rels');
  const ct = await readXml(zip, docs, '[Content_Types].xml');
  for (const t of targets) {
    if (zip.file(t)) zip.remove(t);
    if (ct) {
      for (const o of allElements(ct).filter((e) => e.localName === 'Override' && resolveTarget('', e.getAttribute('PartName') || '') === t)) {
        o.parentNode.removeChild(o);
        changed.add('[Content_Types].xml');
      }
    }
  }
}

// ---------- Bild-Metadaten ----------
const u8 = (a) => (a instanceof Uint8Array ? a : new Uint8Array(a));
const concat = (parts) => {
  const out = new Uint8Array(parts.reduce((s, p) => s + p.length, 0));
  let o = 0;
  for (const p of parts) { out.set(p, o); o += p.length; }
  return out;
};

export function imageType(b) {
  b = u8(b);
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'JPEG';
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'PNG';
  if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38) return 'GIF';
  if (b[0] === 0x42 && b[1] === 0x4d) return 'BMP';
  if ((b[0] === 0x49 && b[1] === 0x49 && b[2] === 0x2a) || (b[0] === 0x4d && b[1] === 0x4d && b[3] === 0x2a)) return 'TIFF';
  if (b[0] === 0x01 && b[1] === 0 && b[2] === 0 && b[3] === 0 && b[40] === 0x20 && b[41] === 0x45 && b[42] === 0x4d && b[43] === 0x46) return 'EMF';
  if ((b[0] === 0xd7 && b[1] === 0xcd && b[2] === 0xc6 && b[3] === 0x9a) || (b[0] === 0x01 && b[1] === 0 && b[2] === 0x09 && b[3] === 0)) return 'WMF';
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45) return 'WEBP';
  return null;
}
const IMAGE_EXT = /\.(jpe?g|png|gif|bmp|tiff?|emf|wmf|svg|webp|wdp|jxr|heic|heif|ico|pict?|eps)$/i;
export function isImagePart(name, bytes) { return IMAGE_EXT.test(name) || !!imageType(bytes); }
function typeLabel(name, bytes) {
  const t = imageType(bytes);
  if (t) return t;
  const m = name.match(/\.([a-z0-9]+)$/i);
  return m ? m[1].toUpperCase() : 'unbekannt';
}

// Minimales EXIF nur mit der Ausrichtung (damit gedrehte Fotos gedreht bleiben). Big-Endian-TIFF.
function exifOrientationOnly(o) {
  return new Uint8Array([0x4d, 0x4d, 0, 0x2a, 0, 0, 0, 8, 0, 1, 0x01, 0x12, 0, 3, 0, 0, 0, 1, 0, o, 0, 0, 0, 0, 0, 0]);
}
// Ausrichtung aus einem TIFF-Block (EXIF) lesen; 1 = normal
function tiffOrientation(t) {
  if (t.length < 8) return 1;
  const le = t[0] === 0x49;
  const r16 = (o) => (le ? t[o] | (t[o + 1] << 8) : (t[o] << 8) | t[o + 1]);
  const r32 = (o) => (le ? (t[o] | (t[o + 1] << 8) | (t[o + 2] << 16) | (t[o + 3] << 24)) >>> 0 : ((t[o] << 24) | (t[o + 1] << 16) | (t[o + 2] << 8) | t[o + 3]) >>> 0);
  const ifd = r32(4);
  if (ifd + 2 > t.length) return 1;
  const n = r16(ifd);
  for (let i = 0; i < n; i++) {
    const e = ifd + 2 + i * 12;
    if (e + 12 > t.length) return 1;
    if (r16(e) === 0x0112) { const v = r16(e + 8); return v >= 1 && v <= 8 ? v : 1; }
  }
  return 1;
}

// JPEG: APP1 (EXIF/XMP), APP12, APP13 (IPTC) und Kommentare (COM) entfernen. Bilddaten bleiben Byte für Byte gleich.
// Liefert die neuen Bytes oder null, wenn die Datei nicht sicher lesbar ist.
export function stripJpeg(b) {
  b = u8(b);
  if (b[0] !== 0xff || b[1] !== 0xd8) return null;
  const out = [b.subarray(0, 2)];
  let i = 2;
  let orientation = 1;
  let exifAt = -1;
  while (i < b.length) {
    if (b[i] !== 0xff) return null;
    let m = b[i + 1];
    let j = i + 1;
    while (m === 0xff && j + 1 < b.length) { j++; m = b[j]; } // Füllbytes
    const segStart = j - 1;
    if (m === 0xda) { out.push(b.subarray(segStart)); break; } // Bilddaten bis zum Ende unverändert
    if (m === 0xd9) { out.push(b.subarray(segStart, j + 1)); break; }
    if (m === 0x01 || (m >= 0xd0 && m <= 0xd7)) { out.push(b.subarray(segStart, j + 1)); i = j + 1; continue; }
    if (j + 3 > b.length) return null;
    const len = (b[j + 1] << 8) | b[j + 2];
    const end = j + 1 + len;
    if (len < 2 || end > b.length) return null;
    const seg = b.subarray(segStart, end);
    const drop = m === 0xe1 || m === 0xec || m === 0xed || m === 0xfe;
    if (m === 0xe1 && len > 8 && b[j + 3] === 0x45 && b[j + 4] === 0x78 && b[j + 5] === 0x69 && b[j + 6] === 0x66 && b[j + 7] === 0 && b[j + 8] === 0) {
      const o = tiffOrientation(b.subarray(j + 9, end));
      if (o !== 1) orientation = o;
      if (exifAt < 0) exifAt = out.length;
    }
    if (!drop) out.push(seg);
    i = end;
  }
  if (orientation !== 1) {
    const tiff = exifOrientationOnly(orientation);
    const body = concat([new Uint8Array([0x45, 0x78, 0x69, 0x66, 0, 0]), tiff]);
    const seg = concat([new Uint8Array([0xff, 0xe1, (body.length + 2) >> 8, (body.length + 2) & 0xff]), body]);
    out.splice(exifAt < 0 ? 1 : exifAt, 0, seg);
  }
  return concat(out);
}

// CRC32 für PNG-Blöcke
let CRC_T = null;
function crc32(bytes) {
  if (!CRC_T) { CRC_T = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; CRC_T[n] = c >>> 0; } }
  let x = 0xffffffff;
  for (const v of bytes) x = CRC_T[(x ^ v) & 0xff] ^ (x >>> 8);
  return (x ^ 0xffffffff) >>> 0;
}
function pngChunk(type, data) {
  const td = concat([new TextEncoder().encode(type), data]);
  const head = new Uint8Array(4);
  new DataView(head.buffer).setUint32(0, data.length);
  const tail = new Uint8Array(4);
  new DataView(tail.buffer).setUint32(0, crc32(td));
  return concat([head, td, tail]);
}
// PNG: Text-Blöcke (tEXt, zTXt, iTXt) und EXIF (eXIf) entfernen; Ausrichtung bleibt als minimales eXIf erhalten.
export function stripPng(b) {
  b = u8(b);
  if (b.length < 8 || b[0] !== 0x89 || b[1] !== 0x50) return null;
  const out = [b.subarray(0, 8)];
  const dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
  let i = 8;
  let seenEnd = false;
  while (i + 12 <= b.length) {
    const len = dv.getUint32(i);
    const type = String.fromCharCode(b[i + 4], b[i + 5], b[i + 6], b[i + 7]);
    const end = i + 12 + len;
    if (end > b.length || !/^[A-Za-z]{4}$/.test(type)) return null;
    if (type === 'eXIf') {
      const o = tiffOrientation(b.subarray(i + 8, i + 8 + len));
      if (o !== 1) out.push(pngChunk('eXIf', exifOrientationOnly(o)));
    } else if (!['tEXt', 'zTXt', 'iTXt'].includes(type)) out.push(b.subarray(i, end));
    i = end;
    if (type === 'IEND') { seenEnd = true; break; }
  }
  if (!seenEnd) return null;
  return concat(out);
}

// GIF: Kommentar-Erweiterungen und XMP-Anwendungsblöcke entfernen. Alles andere bleibt unverändert.
export function stripGif(b) {
  b = u8(b);
  if (b.length < 13 || b[0] !== 0x47 || b[1] !== 0x49 || b[2] !== 0x46) return null;
  let i = 13;
  if (b[10] & 0x80) i += 3 * (1 << ((b[10] & 7) + 1));
  const out = [b.subarray(0, i)];
  const skipSub = (k) => { while (k < b.length && b[k] !== 0) k += b[k] + 1; return k < b.length ? k + 1 : -1; };
  while (i < b.length) {
    const c = b[i];
    if (c === 0x3b) { out.push(b.subarray(i, i + 1)); return concat(out); }
    if (c === 0x21) {
      const label = b[i + 1];
      const end = skipSub(i + 2);
      if (end < 0) return null;
      const isXmp = label === 0xff && b[i + 2] === 11 && String.fromCharCode(...b.subarray(i + 3, i + 11)) === 'XMP Data';
      if (label !== 0xfe && !isXmp) out.push(b.subarray(i, end));
      i = end;
    } else if (c === 0x2c) {
      let k = i + 10;
      if (k > b.length) return null;
      if (b[i + 9] & 0x80) k += 3 * (1 << ((b[i + 9] & 7) + 1));
      const end = skipSub(k + 1);
      if (end < 0) return null;
      out.push(b.subarray(i, end));
      i = end;
    } else return null;
  }
  return null;
}

// Prüft beim Lesen, welche Bilder sicher bereinigt werden können. Liefert Hinweise für die Prüfansicht.
export async function imageWarnings(zip) {
  const other = new Map();
  let broken = 0;
  for (const n of Object.keys(zip.files).filter((x) => !zip.files[x].dir).sort()) {
    if (/^docProps\/thumbnail\./i.test(n)) continue; // wird beim Export entfernt
    if (/\.(xml|rels|vml|bin)$/i.test(n)) continue;
    const bytes = await zip.file(n).async('uint8array');
    if (!isImagePart(n, bytes)) continue;
    const t = imageType(bytes);
    if (t === 'JPEG' || t === 'PNG' || t === 'GIF') {
      const r = t === 'JPEG' ? stripJpeg(bytes) : t === 'PNG' ? stripPng(bytes) : stripGif(bytes);
      if (!r) broken++;
    } else if (t !== 'BMP') {
      const l = typeLabel(n, bytes);
      other.set(l, (other.get(l) || 0) + 1);
    }
  }
  const w = [];
  if (other.size) {
    w.push(`Die Datei enthält Bilder vom Typ ${[...other].map(([k, v]) => `${k} (${v})`).join(', ')}. Deren versteckte Bildangaben (z. B. Autor) kann das Tool nicht sicher entfernen. Der Schlusscheck sucht trotzdem darin nach Namen.`);
  }
  if (broken) w.push(`${broken} Bild(er) (JPEG/PNG/GIF) konnten nicht sicher gelesen werden. Deren versteckte Bildangaben bleiben unverändert. Der Schlusscheck sucht trotzdem darin nach Namen.`);
  return w;
}

// Entfernt Bild-Metadaten in allen JPEG-, PNG- und GIF-Teilen (erkannt an den ersten Bytes, nicht am Pfad).
export async function stripImages(zip) {
  for (const n of Object.keys(zip.files).filter((x) => !zip.files[x].dir).sort()) {
    if (/\.(xml|rels|vml)$/i.test(n)) continue;
    const bytes = await zip.file(n).async('uint8array');
    const t = imageType(bytes);
    const r = t === 'JPEG' ? stripJpeg(bytes) : t === 'PNG' ? stripPng(bytes) : t === 'GIF' ? stripGif(bytes) : null;
    if (r && (r.length !== bytes.length || r.some((v, k) => v !== bytes[k]))) zip.file(n, r, ZOPT);
  }
}

// Fundstelle in einfacher Sprache
export function describePart(name) {
  const n = name.replace(/ \(binär.*$/, '');
  const rules = [
    [/^docProps\/core|core\.xml$/i, 'Dateieigenschaften (Autor, Titel …)'],
    [/^docProps\/app|app\.xml$/i, 'Dateieigenschaften (Firma, Manager …)'],
    [/^docProps\/custom|custom\.xml$/i, 'benutzerdefinierte Dateieigenschaften'],
    [/customXml\//i, 'SharePoint-/Zusatzdaten'],
    [/\/media\/|\.(jpe?g|png|gif|tiff?|emf|wmf|svg|bmp)$/i, 'Bild (versteckte Bildangaben)'],
    [/word\/document\.xml$/, 'Text'],
    [/word\/header/, 'Kopfzeile'], [/word\/footer/, 'Fußzeile'], [/word\/footnotes/, 'Fußnote'], [/word\/endnotes/, 'Endnote'],
    [/word\/comments|xl\/comments|threadedComments/, 'Kommentar'],
    [/word\/people|xl\/persons/, 'Personenliste (Kommentare)'],
    [/xl\/sharedStrings|xl\/worksheets/, 'Tabelle'],
    [/xl\/workbook/, 'Arbeitsmappe (Blattnamen, Namen)'],
    [/\.rels$/, 'Verweise'],
    [/embeddings\//, 'eingebettetes Objekt'],
  ];
  for (const [re, label] of rules) if (re.test(n)) return `${label} – ${name}`;
  return name;
}
