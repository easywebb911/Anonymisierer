// Testdokumente für versteckte Angaben (Version 1.3). Alle Namen und Firmen sind erfunden.
//   meta-word.docx      Word: Eigenschaften an Nicht-Standardpfaden, SharePoint-Felder (customXml), Firma/Manager,
//                       benutzerdefinierte Eigenschaften, Kommentar-/Änderungsautoren, JPEG/PNG/GIF mit Autor in den Bildangaben
//   meta-tabelle.xlsx   Excel: dasselbe (ohne Kommentare/GIF)
//   meta-falle.docx     wie meta-word.docx, zusätzlich ein TIFF-Bild mit Autor in den Bildangaben. TIFF bereinigt das
//                       Tool nicht -> der Schlusscheck MUSS den Namen melden und den Export blockieren.
// Aufruf: node tests/make-meta.mjs   (Chromium/Playwright erzeugt die Ausgangsbilder; Ergebnis ist byte-gleich reproduzierbar)
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import JSZip from 'jszip';

const here = path.dirname(fileURLToPath(import.meta.url));
const fx = path.join(here, 'fixtures');
const FIXED = new Date(Date.UTC(2026, 0, 1, 12, 0, 0));
const ZO = { date: FIXED, createFolders: false };

// ---------- erfundene Personen ----------
export const META_PEOPLE = {
  creator: 'Rüdiger Spähmann', // Autor (auch in den Bildangaben)
  lastModifiedBy: 'Tamara Feldkirch', // letzter Bearbeiter, Kommentarautorin
  manager: 'Konstantin Abendroth',
  company: 'Lindenhof Beratung GmbH',
  spPerson: 'Wilhelmine Querbach', // SharePoint-Personenfeld
  spPerson2: 'Ottilie Rennwagen', // SharePoint-Mehrfachfeld, Änderungsautorin
  textPerson: 'Adaeze Okonkwo-Brandt', // im Text (bestätigter Name)
};
const P = META_PEOPLE;
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// ---------- Bilder ----------
async function baseImages() {
  const { chromium } = createRequire('/opt/node22/lib/node_modules/')('playwright');
  const b = await chromium.launch();
  const p = await b.newPage();
  const r = await p.evaluate(() => {
    const c = document.createElement('canvas');
    c.width = 48; c.height = 32;
    const x = c.getContext('2d');
    for (let i = 0; i < 48; i++) for (let j = 0; j < 32; j++) { x.fillStyle = `rgb(${i * 5},${j * 7},${(i * j) % 255})`; x.fillRect(i, j, 1, 1); }
    return { jpeg: c.toDataURL('image/jpeg', 0.9), png: c.toDataURL('image/png') };
  });
  await b.close();
  const dec = (u) => Buffer.from(u.split(',')[1], 'base64');
  return { jpeg: dec(r.jpeg), png: dec(r.png) };
}
const u16be = (n) => Buffer.from([n >> 8, n & 255]);
const u32be = (n) => { const b = Buffer.alloc(4); b.writeUInt32BE(n); return b; };
// EXIF (Big-Endian) mit Ausrichtung, Artist und Copyright
function exifTiff(orientation, artist) {
  const a = Buffer.concat([Buffer.from(artist, 'utf8'), Buffer.from([0])]);
  const n = 3;
  const dataOff = 8 + 2 + n * 12 + 4;
  const e = (tag, type, count, val) => Buffer.concat([u16be(tag), u16be(type), u32be(count), val]);
  return Buffer.concat([Buffer.from('MM\0*'), u32be(8), u16be(n),
    e(0x0112, 3, 1, Buffer.from([0, orientation, 0, 0])),
    e(0x013b, 2, a.length, u32be(dataOff)),
    e(0x8298, 2, a.length, u32be(dataOff + a.length)),
    u32be(0), a, a]);
}
const xmp = (name) => `<?xpacket begin="" id="W5M0MpCehiHzreSzNTczkc9d"?><x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><rdf:Description xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:creator><rdf:Seq><rdf:li>${name}</rdf:li></rdf:Seq></dc:creator></rdf:Description></rdf:RDF></x:xmpmeta><?xpacket end="w"?>`;
function jpegWithMeta(jpeg) {
  const seg = (m, body) => Buffer.concat([Buffer.from([0xff, m]), u16be(body.length + 2), body]);
  const exif = seg(0xe1, Buffer.concat([Buffer.from('Exif\0\0', 'latin1'), exifTiff(6, P.creator)]));
  const xm = seg(0xe1, Buffer.concat([Buffer.from('http://ns.adobe.com/xap/1.0/\0', 'latin1'), Buffer.from(xmp(P.creator), 'utf8')]));
  const iptcName = Buffer.from(P.creator, 'utf8');
  const iptc = Buffer.concat([Buffer.from([0x1c, 2, 80]), u16be(iptcName.length), iptcName]);
  const res = Buffer.concat([Buffer.from('8BIM'), u16be(0x0404), Buffer.from([0, 0]), u32be(iptc.length), iptc, iptc.length % 2 ? Buffer.from([0]) : Buffer.alloc(0)]);
  const app13 = seg(0xed, Buffer.concat([Buffer.from('Photoshop 3.0\0', 'latin1'), res]));
  const com = seg(0xfe, Buffer.from('Foto: ' + P.creator, 'utf8'));
  // nach SOI und APP0 (JFIF) einfügen
  const app0Len = (jpeg[4] << 8) | jpeg[5];
  const cut = 4 + app0Len;
  return Buffer.concat([jpeg.subarray(0, cut), exif, xm, app13, com, jpeg.subarray(cut)]);
}
function pngChunk(type, data) {
  const td = Buffer.concat([Buffer.from(type, 'latin1'), data]);
  return Buffer.concat([u32be(data.length), td, u32be(zlib.crc32 ? zlib.crc32(td) : crc32(td))]);
}
function crc32(buf) { let c, x = 0xffffffff; for (const v of buf) { c = (x ^ v) & 0xff; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; x = c ^ (x >>> 8); } return (x ^ 0xffffffff) >>> 0; }
function pngWithMeta(png) {
  const text = pngChunk('tEXt', Buffer.concat([Buffer.from('Author\0', 'latin1'), Buffer.from(P.creator, 'latin1')]));
  const ztxt = pngChunk('zTXt', Buffer.concat([Buffer.from('Comment\0\0', 'latin1'), zlib.deflateSync(Buffer.from('Aufnahme ' + P.lastModifiedBy, 'latin1'))]));
  const itxt = pngChunk('iTXt', Buffer.concat([Buffer.from('XML:com.adobe.xmp\0\0\0\0\0', 'latin1'), Buffer.from(xmp(P.creator), 'utf8')]));
  const exif = pngChunk('eXIf', exifTiff(1, P.creator));
  const ihdrEnd = 8 + 25;
  return Buffer.concat([png.subarray(0, ihdrEnd), text, ztxt, itxt, exif, png.subarray(ihdrEnd)]);
}
// kleinstes gültiges GIF (1x1) mit Kommentar-Erweiterung
function gifWithComment() {
  const c = Buffer.from('Grafik: ' + P.creator, 'utf8');
  return Buffer.concat([Buffer.from('GIF89a', 'latin1'), Buffer.from([1, 0, 1, 0, 0x80, 0, 0]), Buffer.from([255, 0, 0, 0, 0, 255]),
    Buffer.from([0x21, 0xfe, c.length]), c, Buffer.from([0]),
    Buffer.from([0x2c, 0, 0, 0, 0, 1, 0, 1, 0, 0]), Buffer.from([2, 2, 0x44, 0x01, 0]), Buffer.from([0x3b])]);
}
// TIFF 2x2 RGB unkomprimiert mit Artist (Little-Endian)
function tiffWithArtist() {
  const artist = Buffer.concat([Buffer.from(P.creator, 'utf8'), Buffer.from([0])]);
  const entries = [[256, 3, 1, 2], [257, 3, 1, 2], [258, 3, 3, 'bps'], [259, 3, 1, 1], [262, 3, 1, 2], [273, 4, 1, 'px'], [277, 3, 1, 3], [278, 3, 1, 2], [279, 4, 1, 12], [284, 3, 1, 1], [315, 2, artist.length, 'artist']];
  const ifdOff = 8;
  const ifdLen = 2 + entries.length * 12 + 4;
  const bpsOff = ifdOff + ifdLen;
  const artistOff = bpsOff + 6;
  const pxOff = artistOff + artist.length + (artist.length % 2);
  const head = Buffer.from([0x49, 0x49, 42, 0, 8, 0, 0, 0]);
  const ifd = Buffer.alloc(ifdLen);
  ifd.writeUInt16LE(entries.length, 0);
  entries.forEach(([tag, type, count, val], i) => {
    const o = 2 + i * 12;
    ifd.writeUInt16LE(tag, o); ifd.writeUInt16LE(type, o + 2); ifd.writeUInt32LE(count, o + 4);
    const v = val === 'bps' ? bpsOff : val === 'px' ? pxOff : val === 'artist' ? artistOff : val;
    if (type === 3 && count === 1) ifd.writeUInt16LE(v, o + 8); else ifd.writeUInt32LE(v, o + 8);
  });
  const bps = Buffer.from([8, 0, 8, 0, 8, 0]);
  const px = Buffer.from([255, 0, 0, 0, 255, 0, 0, 0, 255, 255, 255, 255]);
  return Buffer.concat([head, ifd, bps, artist, artist.length % 2 ? Buffer.from([0]) : Buffer.alloc(0), px]);
}

// ---------- gemeinsame Teile ----------
const CT_CORE = 'application/vnd.openxmlformats-package.core-properties+xml';
const CT_APP = 'application/vnd.openxmlformats-officedocument.extended-properties+xml';
const CT_CUSTOM = 'application/vnd.openxmlformats-officedocument.custom-properties+xml';
const REL = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const coreXml = () => `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>Akte Okonkwo-Brandt</dc:title><dc:subject>Beratung</dc:subject><dc:creator>${esc(P.creator)}</dc:creator><cp:keywords>Spähmann; Personal</cp:keywords><dc:description>Entwurf von ${esc(P.creator)}</dc:description><cp:lastModifiedBy>${esc(P.lastModifiedBy)}</cp:lastModifiedBy><cp:revision>4</cp:revision><dcterms:created xsi:type="dcterms:W3CDTF">2026-01-05T09:00:00Z</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">2026-01-06T10:00:00Z</dcterms:modified></cp:coreProperties>`;
const appXml = (application, titles) => `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Application>${application}</Application><DocSecurity>0</DocSecurity>${titles}<Manager>${esc(P.manager)}</Manager><Company>${esc(P.company)}</Company><AppVersion>16.0000</AppVersion></Properties>`;
const customXmlProps = () => `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/custom-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><property fmtid="{D5CDD505-2E9C-101B-9397-08002B2CF9AE}" pid="2" name="Sachbearbeitung"><vt:lpwstr>${esc(P.lastModifiedBy)}</vt:lpwstr></property><property fmtid="{D5CDD505-2E9C-101B-9397-08002B2CF9AE}" pid="3" name="Aktenzeichen"><vt:lpwstr>AZ-2026-77</vt:lpwstr></property><property fmtid="{D5CDD505-2E9C-101B-9397-08002B2CF9AE}" pid="4" name="Seiten"><vt:i4>3</vt:i4></property></Properties>`;
// SharePoint-Felder so, wie SharePoint sie in customXml schreibt
const spItem = () => `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:properties xmlns:p="http://schemas.microsoft.com/office/2006/metadata/properties" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:pc="http://schemas.microsoft.com/office/infopath/2007/PartnerControls"><documentManagement><Verantwortlich xmlns="1a2b3c4d-0000-4000-8000-000000000001"><UserInfo><DisplayName>${esc(P.spPerson)}</DisplayName><AccountId>23</AccountId><AccountType/></UserInfo></Verantwortlich><Beteiligte xmlns="1a2b3c4d-0000-4000-8000-000000000001"><UserInfo><DisplayName>${esc(P.manager)}</DisplayName><AccountId>11</AccountId><AccountType/></UserInfo><UserInfo><DisplayName>${esc(P.spPerson2)}</DisplayName><AccountId>12</AccountId><AccountType/></UserInfo></Beteiligte><Bemerkung xmlns="1a2b3c4d-0000-4000-8000-000000000001">Angelegt von ${esc(P.creator)}</Bemerkung><Mandant xmlns="1a2b3c4d-0000-4000-8000-000000000001">Okonkwo-Brandt</Mandant><Ablage xmlns="1a2b3c4d-0000-4000-8000-000000000001">Projektakte 2026</Ablage><Leer xmlns="1a2b3c4d-0000-4000-8000-000000000001"><UserInfo><DisplayName></DisplayName><AccountId xsi:nil="true"></AccountId><AccountType/></UserInfo></Leer></documentManagement></p:properties>`;
const spItemProps = () => `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<ds:datastoreItem ds:itemID="{6A1F0C2B-1111-4222-8333-944455566677}" xmlns:ds="http://schemas.openxmlformats.org/officeDocument/2006/customXml"><ds:schemaRefs><ds:schemaRef ds:uri="http://schemas.microsoft.com/office/2006/metadata/properties"/><ds:schemaRef ds:uri="http://schemas.microsoft.com/office/infopath/2007/PartnerControls"/></ds:schemaRefs></ds:datastoreItem>`;
const spItemRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/customXmlProps" Target="itemProps1.xml"/></Relationships>';
const pkgRels = (main) => `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="${main}"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="eigenschaften/kern.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="eigenschaften/anwendung.xml"/><Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/custom-properties" Target="eigenschaften/benutzer.xml"/></Relationships>`;
const propOverrides = `<Override PartName="/eigenschaften/kern.xml" ContentType="${CT_CORE}"/><Override PartName="/eigenschaften/anwendung.xml" ContentType="${CT_APP}"/><Override PartName="/eigenschaften/benutzer.xml" ContentType="${CT_CUSTOM}"/><Override PartName="/customXml/itemProps1.xml" ContentType="application/vnd.openxmlformats-officedocument.customXmlProperties+xml"/>`;
const imgDefaults = '<Default Extension="jpeg" ContentType="image/jpeg"/><Default Extension="png" ContentType="image/png"/><Default Extension="gif" ContentType="image/gif"/><Default Extension="tiff" ContentType="image/tiff"/>';

// ---------- Word ----------
const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const inlineImg = (rid, id, cx = 914400, cy = 609600) => `<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${cx}" cy="${cy}"/><wp:docPr id="${id}" name="Bild ${id}" descr="Bild ${id}"/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="${id}" name="Bild ${id}"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="${rid}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>`;
async function word(imgs, withTiff) {
  const p = (t) => `<w:p><w:r><w:t xml:space="preserve">${esc(t)}</w:t></w:r></w:p>`;
  const body = p('Gesprächsprotokoll Beratung')
    + `<w:p><w:commentRangeStart w:id="0"/><w:r><w:t xml:space="preserve">Teilnehmerin: Frau ${esc(P.textPerson)}.</w:t></w:r><w:commentRangeEnd w:id="0"/><w:r><w:commentReference w:id="0"/></w:r></w:p>`
    + `<w:p><w:r><w:t xml:space="preserve">Ergebnis: </w:t></w:r><w:ins w:id="1" w:author="${esc(P.spPerson2)}" w:date="2026-01-06T10:00:00Z"><w:r><w:t xml:space="preserve">Termin bestätigt.</w:t></w:r></w:ins></w:p>`
    + `<w:p>${inlineImg('rIdImg1', 1)}${inlineImg('rIdImg2', 2)}${inlineImg('rIdImg3', 3, 190500, 190500)}${withTiff ? inlineImg('rIdImg4', 4, 190500, 190500) : ''}</w:p>`
    + p('Die Fotos zeigen den Beratungsraum.');
  const doc = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="${W}" xmlns:r="${REL}" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"><w:body>${body}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1417" w:right="1417" w:bottom="1134" w:left="1417" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr></w:body></w:document>`;
  const comments = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:comments xmlns:w="${W}"><w:comment w:id="0" w:author="${esc(P.lastModifiedBy)}" w:date="2026-01-06T10:00:00Z" w:initials="TF"><w:p><w:r><w:t>Bitte prüfen.</w:t></w:r></w:p></w:comment></w:comments>`;
  const people = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w15:people xmlns:w15="http://schemas.microsoft.com/office/word/2012/wordml"><w15:person w15:author="${esc(P.lastModifiedBy)}"><w15:presenceInfo w15:providerId="AD" w15:userId="S::tamara.feldkirch@lindenhof-beratung.example::1111"/></w15:person></w15:people>`;
  const docRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdImg1" Type="${REL}/image" Target="media/foto1.jpeg"/><Relationship Id="rIdImg2" Type="${REL}/image" Target="media/foto2.png"/><Relationship Id="rIdImg3" Type="${REL}/image" Target="media/grafik3.gif"/>${withTiff ? `<Relationship Id="rIdImg4" Type="${REL}/image" Target="media/scan4.tiff"/>` : ''}<Relationship Id="rIdCm" Type="${REL}/comments" Target="comments.xml"/><Relationship Id="rIdPe" Type="http://schemas.microsoft.com/office/2011/relationships/people" Target="people.xml"/><Relationship Id="rIdCx" Type="${REL}/customXml" Target="../customXml/item1.xml"/></Relationships>`;
  const ct = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>${imgDefaults}<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/comments.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.comments+xml"/><Override PartName="/word/people.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.people+xml"/>${propOverrides}</Types>`;
  const z = new JSZip();
  z.file('[Content_Types].xml', ct, ZO);
  z.file('_rels/.rels', pkgRels('word/document.xml'), ZO);
  z.file('word/document.xml', doc, ZO);
  z.file('word/_rels/document.xml.rels', docRels, ZO);
  z.file('word/comments.xml', comments, ZO);
  z.file('word/people.xml', people, ZO);
  z.file('word/media/foto1.jpeg', imgs.jpeg, ZO);
  z.file('word/media/foto2.png', imgs.png, ZO);
  z.file('word/media/grafik3.gif', imgs.gif, ZO);
  if (withTiff) z.file('word/media/scan4.tiff', imgs.tiff, ZO);
  z.file('eigenschaften/kern.xml', coreXml(), ZO);
  z.file('eigenschaften/anwendung.xml', appXml('Microsoft Office Word', `<TitlesOfParts><vt:vector size="1" baseType="lpstr"><vt:lpstr>Akte Okonkwo-Brandt</vt:lpstr></vt:vector></TitlesOfParts>`), ZO);
  z.file('eigenschaften/benutzer.xml', customXmlProps(), ZO);
  z.file('customXml/item1.xml', spItem(), ZO);
  z.file('customXml/itemProps1.xml', spItemProps(), ZO);
  z.file('customXml/_rels/item1.xml.rels', spItemRels, ZO);
  return z.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
}

// ---------- Excel ----------
async function excel(imgs) {
  const S = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
  const cell = (r, t) => `<c r="${r}" t="inlineStr"><is><t xml:space="preserve">${esc(t)}</t></is></c>`;
  const sheet = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="${S}" xmlns:r="${REL}"><sheetData><row r="1">${cell('A1', 'Thema')}${cell('B1', 'Ansprechpartnerin')}</row><row r="2">${cell('A2', 'Beratung')}${cell('B2', P.textPerson)}</row><row r="3">${cell('A3', 'Raum')}${cell('B3', 'Fotos siehe unten')}</row></sheetData><drawing r:id="rIdDr"/></worksheet>`;
  const anchor = (n, rid, row) => `<xdr:oneCellAnchor><xdr:from><xdr:col>0</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>${row}</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:from><xdr:ext cx="914400" cy="609600"/><xdr:pic><xdr:nvPicPr><xdr:cNvPr id="${n}" name="Bild ${n}"/><xdr:cNvPicPr/></xdr:nvPicPr><xdr:blipFill><a:blip xmlns:r="${REL}" r:embed="${rid}"/><a:stretch><a:fillRect/></a:stretch></xdr:blipFill><xdr:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="914400" cy="609600"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></xdr:spPr></xdr:pic><xdr:clientData/></xdr:oneCellAnchor>`;
  const drawing = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">${anchor(2, 'rIdI1', 4)}${anchor(3, 'rIdI2', 9)}</xdr:wsDr>`;
  const wb = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="${S}" xmlns:r="${REL}"><sheets><sheet name="Beratung" sheetId="1" r:id="rId1"/></sheets></workbook>`;
  const ct = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>${imgDefaults}<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/drawings/drawing1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/>${propOverrides}</Types>`;
  const z = new JSZip();
  z.file('[Content_Types].xml', ct, ZO);
  z.file('_rels/.rels', pkgRels('xl/workbook.xml'), ZO);
  z.file('xl/workbook.xml', wb, ZO);
  z.file('xl/_rels/workbook.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${REL}/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rIdCx" Type="${REL}/customXml" Target="../customXml/item1.xml"/></Relationships>`, ZO);
  z.file('xl/worksheets/sheet1.xml', sheet, ZO);
  z.file('xl/worksheets/_rels/sheet1.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdDr" Type="${REL}/drawing" Target="../drawings/drawing1.xml"/></Relationships>`, ZO);
  z.file('xl/drawings/drawing1.xml', drawing, ZO);
  z.file('xl/drawings/_rels/drawing1.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdI1" Type="${REL}/image" Target="../media/foto1.jpeg"/><Relationship Id="rIdI2" Type="${REL}/image" Target="../media/foto2.png"/></Relationships>`, ZO);
  z.file('xl/media/foto1.jpeg', imgs.jpeg, ZO);
  z.file('xl/media/foto2.png', imgs.png, ZO);
  z.file('eigenschaften/kern.xml', coreXml(), ZO);
  z.file('eigenschaften/anwendung.xml', appXml('Microsoft Excel', `<TitlesOfParts><vt:vector size="1" baseType="lpstr"><vt:lpstr>Beratung</vt:lpstr></vt:vector></TitlesOfParts>`), ZO);
  z.file('eigenschaften/benutzer.xml', customXmlProps(), ZO);
  z.file('customXml/item1.xml', spItem(), ZO);
  z.file('customXml/itemProps1.xml', spItemProps(), ZO);
  z.file('customXml/_rels/item1.xml.rels', spItemRels, ZO);
  return z.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  // Ausgangsbilder einmalig erzeugen und als Quelle ablegen (damit spätere Läufe byte-gleich sind)
  const srcJ = path.join(fx, 'meta-quelle.jpeg');
  const srcP = path.join(fx, 'meta-quelle.png');
  if (!fs.existsSync(srcJ) || !fs.existsSync(srcP)) {
    const b = await baseImages();
    fs.writeFileSync(srcJ, b.jpeg);
    fs.writeFileSync(srcP, b.png);
  }
  const imgs = { jpeg: jpegWithMeta(fs.readFileSync(srcJ)), png: pngWithMeta(fs.readFileSync(srcP)), gif: gifWithComment(), tiff: tiffWithArtist() };
  fs.writeFileSync(path.join(fx, 'meta-word.docx'), await word(imgs, false));
  fs.writeFileSync(path.join(fx, 'meta-falle.docx'), await word(imgs, true));
  fs.writeFileSync(path.join(fx, 'meta-tabelle.xlsx'), await excel(imgs));
  console.log('geschrieben: tests/fixtures/meta-word.docx, meta-falle.docx, meta-tabelle.xlsx');
}
