// Bilder und Bildbeschreibungen in Word/Excel (Version 2.2).
// - altTextUnits: Alt-Text (descr) und Titel (title) von Bildern und Formen werden eigene Textabschnitte
//   („Bildbeschreibung“). Sie laufen durch dieselbe Erkennung wie der übrige Text und werden beim Export ersetzt.
// - listImages: alle Bilder mit Fundort in einfacher Sprache, Bildtyp, Beschreibung, ob verknüpft.
// Bildinhalte werden NIE verändert. Verknüpfte Bilder (Pfad außerhalb der Datei) werden nie geladen.
import { allElements, makeUnit, parseXml } from './xmlutil.js';
import { imageType, isImagePart } from './meta.js';

const VML_NS = 'urn:schemas-microsoft-com:vml';
const OFFICE_NS = 'urn:schemas-microsoft-com:office:office';
const REL_NS_PART = 'relationships';

// Bilder, die ein Browser sicher als <img> zeigen kann (erkannt an den ersten Bytes, nicht am Dateinamen)
const SHOWABLE = { JPEG: 'image/jpeg', PNG: 'image/png', GIF: 'image/gif', BMP: 'image/bmp', WEBP: 'image/webp' };

function attrOf(el, local, nsPart) {
  for (const a of Array.from(el.attributes)) {
    if (a.localName !== local) continue;
    if (nsPart === undefined || (nsPart === null ? !a.namespaceURI : a.namespaceURI && a.namespaceURI.includes(nsPart))) return a;
  }
  return null;
}
function upTo(el, pred) {
  let p = el.parentNode;
  while (p && p.nodeType === 1) { if (pred(p)) return p; p = p.parentNode; }
  return null;
}
// Bild- bzw. Form-Rahmen, zu dem eine Beschreibung gehört (Word: w:drawing / w:pict / w:object, Excel: Anker)
const isFrame = (e) => /^(drawing|pict|object|twoCellAnchor|oneCellAnchor|absoluteAnchor|graphicFrame)$/.test(e.localName);

// Beschreibungs-Attribute eines Elements: [{attr, kind: 'Alt-Text'|'Titel'}]
function descAttrs(el) {
  const out = [];
  const ln = el.localName;
  if (ln === 'docPr' || ln === 'cNvPr') {
    const d = attrOf(el, 'descr', null);
    const t = attrOf(el, 'title', null);
    if (d && d.value.trim()) out.push({ attr: d, kind: 'Alt-Text' });
    if (t && t.value.trim()) out.push({ attr: t, kind: 'Titel' });
  } else if (el.namespaceURI === VML_NS && ln === 'shape') {
    const a = attrOf(el, 'alt', null);
    if (a && a.value.trim()) out.push({ attr: a, kind: 'Alt-Text' });
  } else if (el.namespaceURI === VML_NS && ln === 'imagedata') {
    const t = attrOf(el, 'title', 'microsoft-com:office:office');
    if (t && t.value.trim()) out.push({ attr: t, kind: 'Titel' });
  }
  return out;
}

// Einheiten für Bildbeschreibungen. parts: [[partName, ortText]]. Gleiche Beschreibung im selben Rahmen
// (z. B. Word schreibt den Alt-Text in wp:docPr UND pic:cNvPr) wird EIN Abschnitt, der alle Stellen schreibt.
// ownedAttrs: Map(Element -> Set(Attributname)), damit der allgemeine Ersetzer diese Attribute nicht doppelt bearbeitet.
export function altTextUnits(docs, parts, ownedAttrs) {
  const units = [];
  for (const [part, where] of parts) {
    const doc = docs.get(part);
    if (!doc) continue;
    const groups = new Map();
    for (const el of allElements(doc)) {
      for (const { attr, kind } of descAttrs(el)) {
        const frame = upTo(el, isFrame) || el;
        let byFrame = groups.get(frame);
        if (!byFrame) { byFrame = new Map(); groups.set(frame, byFrame); }
        const key = kind + '\u0000' + attr.value;
        if (!byFrame.has(key)) byFrame.set(key, { kind, value: attr.value, targets: [] });
        byFrame.get(key).targets.push({ el, ns: attr.namespaceURI, name: attr.name });
      }
    }
    for (const byFrame of groups.values()) {
      for (const g of byFrame.values()) {
        for (const t of g.targets) {
          if (!ownedAttrs.has(t.el)) ownedAttrs.set(t.el, new Set());
          ownedAttrs.get(t.el).add(t.name);
        }
        const seg = {
          text: g.value.normalize('NFC'),
          writable: true,
          set(v) { for (const t of g.targets) t.el.setAttributeNS(t.ns, t.name, v); },
        };
        const u = makeUnit([seg], `Bildbeschreibung (${g.kind})${where ? ' – ' + where : ''}`);
        u.part = part;
        u.altText = true;
        units.push(u);
      }
    }
  }
  return units;
}

// ---------- Bilderliste ----------
function resolveTarget(baseDir, target) {
  if (target.startsWith('/')) return target.slice(1);
  const out = [];
  for (const p of (baseDir + target).split('/')) { if (p === '..') out.pop(); else if (p && p !== '.') out.push(p); }
  return out.join('/');
}
function relsMap(relDocs, part) {
  const dir = part.replace(/[^/]+$/, '');
  const doc = relDocs.get(dir + '_rels/' + part.slice(dir.length) + '.rels');
  const map = new Map();
  if (!doc) return map;
  for (const r of allElements(doc).filter((e) => e.localName === 'Relationship')) {
    const external = r.getAttribute('TargetMode') === 'External';
    map.set(r.getAttribute('Id'), { external, target: external ? null : resolveTarget(dir, r.getAttribute('Target') || ''), type: r.getAttribute('Type') || '' });
  }
  return map;
}
const short = (s, n = 40) => { const t = s.replace(/\s+/g, ' ').trim(); return t.length > n ? t.slice(0, n - 1) + '…' : t; };

function typeFrom(name, bytes) {
  const t = imageType(bytes);
  if (t) return t;
  const head = new TextDecoder('utf-8').decode(bytes.subarray(0, 512)).replace(/^﻿/, '').trimStart();
  if (/\.svg$/i.test(name) || /^<(\?xml|svg|!--)/i.test(head) && /<svg[\s>]/i.test(new TextDecoder('utf-8').decode(bytes.subarray(0, 4096)))) return 'SVG';
  const m = name.match(/\.([a-z0-9]+)$/i);
  return m ? m[1].toUpperCase() : 'unbekannt';
}
// MIME-Typ für die Vorschau oder null (dann Platzhalter-Kachel). SVG nur, wenn der Inhalt wirklich mit <svg beginnt;
// es wird ausschließlich als Bild (<img>) gezeigt, nie als Markup eingebettet.
function previewMime(type, bytes) {
  if (SHOWABLE[type]) return SHOWABLE[type];
  if (type === 'SVG') {
    const s = new TextDecoder('utf-8').decode(bytes.subarray(0, 4096)).replace(/^﻿/, '');
    if (/<svg[\s>]/i.test(s)) return 'image/svg+xml';
  }
  return null;
}

// Fundort in Word: Teil (Kopfzeile, Fußzeile …), im Text bei „…“, Tabelle, Textfeld
function wordPlace(el, partLabel) {
  const isWp = (e) => e.localName === 'p' && e.namespaceURI && /wordprocessingml\/2006\/main$/.test(e.namespaceURI);
  const p = upTo(el, isWp);
  const inTable = !!upTo(el, (e) => e.localName === 'tbl' && e.namespaceURI && /wordprocessingml/.test(e.namespaceURI));
  const inBox = !!upTo(el, (e) => e.localName === 'txbxContent');
  const text = (n) => (n ? Array.from(n.getElementsByTagNameNS('*', 't')).map((t) => t.textContent).join('') : '');
  let near = text(p);
  if (!near.trim() && p) {
    for (let s = p.previousSibling; s && !near.trim(); s = s.previousSibling) if (s.nodeType === 1) near = text(s);
    for (let s = p.nextSibling; s && !near.trim(); s = s.nextSibling) if (s.nodeType === 1) near = text(s);
  }
  // Bild allein in einer Tabellenzelle: Text der Tabellenzeile
  if (!near.trim() && inTable) near = text(upTo(el, (e) => e.localName === 'tr' && e.namespaceURI && /wordprocessingml/.test(e.namespaceURI)));
  const bei = near.trim() ? ` bei „${short(near)}“` : '';
  if (partLabel !== 'Text') return partLabel + (inTable ? ' (Tabelle)' : '') + bei;
  if (inBox) return 'Textfeld' + bei;
  if (inTable) return 'Tabelle' + bei;
  return 'im Text' + bei;
}

function colName(n) { let s = ''; n += 1; while (n > 0) { const r = (n - 1) % 26; s = String.fromCharCode(65 + r) + s; n = Math.floor((n - 1) / 26); } return s; }

// Liefert [{nr, place, type, linked, alt, title, media, mime}] – Bytes holt getImageBytes(zip, entry) bei Bedarf
export async function listImages(kind, zip, docs, ctx = {}) {
  const entries = [];
  const used = new Set();
  // Verweise (.rels) aller Teile; Word hält sie nicht in docs, daher hier aus der Datei lesen
  const relDocs = new Map();
  for (const n of Object.keys(zip.files).filter((x) => !zip.files[x].dir && /\.rels$/i.test(x))) {
    try { relDocs.set(n, docs.get(n) || parseXml(await zip.file(n).async('string'), n)); } catch { /* defekter Verweis-Teil: übergehen */ }
  }
  const add = (e) => { entries.push(e); if (e.media) used.add(e.media); };
  const describe = (frame) => {
    const alt = [];
    const title = [];
    const els = frame ? [frame, ...allElements(frame)] : [];
    for (const el of els) for (const { attr, kind: k } of descAttrs(el)) (k === 'Titel' ? title : alt).push(attr.value);
    return { alt: [...new Set(alt)].join(' / '), title: [...new Set(title)].join(' / ') };
  };
  const fromRel = async (rels, id, linkId) => {
    const r = id ? rels.get(id) : null;
    if (r && !r.external && r.target && zip.file(r.target)) {
      const bytes = await zip.file(r.target).async('uint8array');
      const type = typeFrom(r.target, bytes);
      return { media: r.target, type, mime: previewMime(type, bytes), linked: false };
    }
    const l = linkId ? rels.get(linkId) : null;
    if ((r && r.external) || (l && l.external)) return { media: null, type: 'verknüpft', mime: null, linked: true };
    return null;
  };
  // Alle XML-Teile nach Bildverweisen durchsuchen (DrawingML-Blip, SVG-Blip, VML-Bilddaten)
  const xmlParts = [...docs.keys()].filter((n) => /\.xml$/i.test(n)).sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
  const vmlParts = Object.keys(zip.files).filter((n) => !zip.files[n].dir && /\.vml$/i.test(n)).sort();
  const scan = async (part, doc) => {
    const rels = relsMap(relDocs, part);
    const where = ctx.placeOf ? ctx.placeOf(part) : { label: part };
    for (const el of allElements(doc)) {
      const ln = el.localName;
      let found = null;
      let frame = null;
      if (ln === 'blip') {
        const svg = allElements(el).find((x) => x.localName === 'svgBlip');
        const svgId = svg ? attrOf(svg, 'embed', REL_NS_PART) : null;
        const emb = attrOf(el, 'embed', REL_NS_PART);
        const lnk = attrOf(el, 'link', REL_NS_PART);
        found = (svgId && await fromRel(rels, svgId.value, null)) || await fromRel(rels, emb && emb.value, lnk && lnk.value);
        // Ersatzbild (PNG) einer SVG-Grafik gehört zu diesem Bild, nicht als eigenes Bild „ohne feste Stelle“ zeigen
        if (found && svgId && emb) { const fb = rels.get(emb.value); if (fb && fb.target) used.add(fb.target); }
        frame = upTo(el, isFrame);
      } else if (el.namespaceURI === VML_NS && ln === 'imagedata') {
        const id = attrOf(el, 'id', REL_NS_PART) || attrOf(el, 'relid', 'microsoft-com:office:office');
        found = await fromRel(rels, id && id.value, null);
        frame = upTo(el, (e) => e.namespaceURI === VML_NS && e.localName === 'shape') || el;
      }
      if (!found) continue;
      const d = describe(frame);
      const place = kind === 'docx' ? wordPlace(el, where.label) : excelPlace(el, where);
      add({ ...found, place, alt: d.alt, title: d.title });
    }
  };
  for (const part of xmlParts) await scan(part, docs.get(part));
  for (const part of vmlParts) {
    let doc;
    // Excel-VML ist oft kein sauberes XML (z. B. <br>): dann nur die Bildverweise per Muster lesen
    try { doc = parseXml(await zip.file(part).async('string'), part); } catch { doc = null; }
    if (doc) { await scan(part, doc); continue; }
    const s = await zip.file(part).async('string');
    const rels = relsMap(relDocs, part);
    const where = ctx.placeOf ? ctx.placeOf(part) : { label: part };
    for (const m of s.matchAll(/<v:imagedata\b[^>]*>/gi)) {
      const id = (m[0].match(/\b(?:o:relid|r:id)="([^"]+)"/) || [])[1];
      const found = await fromRel(rels, id, null);
      if (!found) continue;
      const title = (m[0].match(/\bo:title="([^"]*)"/) || [])[1] || '';
      add({ ...found, place: where.label, alt: '', title });
    }
  }
  // Bilder ohne festen Platz (z. B. Hintergrund, nicht mehr verwendet): trotzdem zeigen
  for (const n of Object.keys(zip.files).filter((x) => !zip.files[x].dir).sort()) {
    if (used.has(n) || /^docProps\/thumbnail\./i.test(n) || /\.(xml|rels|vml|bin)$/i.test(n) || /\/embeddings\//.test(n)) continue;
    const bytes = await zip.file(n).async('uint8array');
    if (!isImagePart(n, bytes)) continue;
    const type = typeFrom(n, bytes);
    add({ media: n, type, mime: previewMime(type, bytes), linked: false, place: 'in der Datei, ohne feste Stelle (z. B. Hintergrund oder nicht mehr verwendet)', alt: '', title: '' });
  }
  entries.forEach((e, i) => { e.nr = i + 1; });
  return entries;
}

function excelPlace(el, where) {
  const anchor = upTo(el, (e) => /^(twoCellAnchor|oneCellAnchor|absoluteAnchor)$/.test(e.localName));
  let cell = '';
  if (anchor) {
    const from = Array.from(anchor.childNodes).find((c) => c.nodeType === 1 && c.localName === 'from');
    if (from) {
      const v = (ln) => { const x = Array.from(from.childNodes).find((c) => c.nodeType === 1 && c.localName === ln); return x ? parseInt(x.textContent, 10) : NaN; };
      const col = v('col');
      const row = v('row');
      if (Number.isFinite(col) && Number.isFinite(row)) cell = `, Zelle ${colName(col)}${row + 1}`;
    }
  }
  return where.label + cell;
}

export async function getImageBytes(zip, entry) {
  return entry.media && zip.file(entry.media) ? zip.file(entry.media).async('uint8array') : null;
}
