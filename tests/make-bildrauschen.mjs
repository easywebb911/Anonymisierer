// Testdokumente für Version 2.11.2 (Schlusscheck, Zufallstreffer in Bild-Rohdaten). Alle Namen erfunden.
// Word und Excel mit mehreren eingebetteten Bildern (PNG und JPEG, verschiedene Größen) aus Zufallspixeln (fester
// Startwert, also immer dieselben Bytes) und mit kurzen Namen (2 bis 4 Buchstaben) im Text.
// Dazu „lesbar“: Bilder mit einem kurzen und einem langen Namen als lesbarer Text in den Bildangaben (PNG-Textfeld,
// EXIF, XMP, Alt-Text) – diese Funde muss der Schlusscheck weiter melden.
// JPEG entstehen einmal im Browser (Canvas); die fertigen Dateien liegen fest im Repo (fixtures-bildrauschen/).
// Aufruf: node tests/make-bildrauschen.mjs
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import JSZip from 'jszip';

const here = path.dirname(fileURLToPath(import.meta.url));
export const FXB = path.join(here, 'fixtures-bildrauschen');
const FIXED = new Date(Date.UTC(2026, 0, 1, 12, 0, 0));
const ZO = { date: FIXED, createFolders: false };
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Erfundene Personen: kurze Vornamen (2–4 Buchstaben) und Nachnamen
export const RAUSCHEN_PEOPLE = ['Ute Brandl', 'Jan Okafor', 'Li Wen', 'Emma Steinhauer', 'Ida Quast'];
// Lesbar in Bildangaben: ein kurzer und ein langer Name (stehen auch im Text, damit sie bestätigte Namen sind)
export const LESBAR = { kurz: 'Ole', lang: 'Wittenbrink', person: 'Ole Wittenbrink' };

// Zufallszahlen mit festem Startwert
function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s; }; }
// CRC32 für PNG
const CRC = new Uint32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc32 = (b) => { let c = 0xffffffff; for (const x of b) c = CRC[(c ^ x) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'latin1'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
// PNG aus Zufallspixeln (RGB, 8 Bit); extra: zusätzliche Textblöcke [[Schlüssel, Text]]
export function noisePng(w, h, seed, extra = []) {
  const r = rng(seed);
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) { raw[y * (w * 3 + 1)] = 0; for (let x = 0; x < w * 3; x++) raw[y * (w * 3 + 1) + 1 + x] = r() >>> 24; }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
  const texts = extra.map(([k, t]) => chunk('tEXt', Buffer.concat([Buffer.from(k, 'latin1'), Buffer.from([0]), Buffer.from(t, 'latin1')])));
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ihdr), ...texts, chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}
// JPEG mit lesbarem EXIF (Artist) und XMP (dc:creator) vor den Bilddaten
function jpegWithMeta(jpeg, { artist, xmpCreator }) {
  const segs = [];
  if (artist) {
    // EXIF: TIFF-Kopf (II), ein Eintrag Artist (0x013B, ASCII)
    const val = Buffer.from(artist + '\0', 'latin1');
    const tiff = Buffer.alloc(8 + 2 + 12 + 4);
    tiff.write('II', 0, 'latin1'); tiff.writeUInt16LE(42, 2); tiff.writeUInt32LE(8, 4);
    tiff.writeUInt16LE(1, 8); tiff.writeUInt16LE(0x013b, 10); tiff.writeUInt16LE(2, 12); tiff.writeUInt32LE(val.length, 14); tiff.writeUInt32LE(tiff.length, 18); tiff.writeUInt32LE(0, 22);
    const body = Buffer.concat([Buffer.from('Exif\0\0', 'latin1'), tiff, val]);
    const head = Buffer.alloc(4); head[0] = 0xff; head[1] = 0xe1; head.writeUInt16BE(body.length + 2, 2);
    segs.push(head, body);
  }
  if (xmpCreator) {
    const xmp = `<x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><rdf:Description xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:creator><rdf:Seq><rdf:li>${xmpCreator}</rdf:li></rdf:Seq></dc:creator></rdf:Description></rdf:RDF></x:xmpmeta>`;
    const body = Buffer.concat([Buffer.from('http://ns.adobe.com/xap/1.0/\0', 'latin1'), Buffer.from(xmp, 'utf8')]);
    const head = Buffer.alloc(4); head[0] = 0xff; head[1] = 0xe1; head.writeUInt16BE(body.length + 2, 2);
    segs.push(head, body);
  }
  return Buffer.concat([jpeg.subarray(0, 2), ...segs, jpeg.subarray(2)]);
}
// JPEG aus Zufallspixeln (Canvas im Browser, Qualität 0.92)
async function noiseJpegs(specs) {
  let chromium;
  try { ({ chromium } = createRequire(import.meta.url)('playwright')); } catch { ({ chromium } = createRequire('/opt/node22/lib/node_modules/')('playwright')); }
  const b = await chromium.launch();
  const p = await b.newPage();
  const out = await p.evaluate((sp) => sp.map(([w, h, seed]) => {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    const img = ctx.createImageData(w, h);
    let s = seed >>> 0;
    for (let i = 0; i < img.data.length; i++) { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; img.data[i] = i % 4 === 3 ? 255 : s >>> 24; }
    ctx.putImageData(img, 0, 0);
    return c.toDataURL('image/jpeg', 0.92).split(',')[1];
  }), specs);
  await b.close();
  return out.map((x) => Buffer.from(x, 'base64'));
}

const R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const A = 'http://schemas.openxmlformats.org/drawingml/2006/main';
const PIC = 'http://schemas.openxmlformats.org/drawingml/2006/picture';
const WP = 'http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing';
const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const XDR = 'http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing';
const S = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
const IMG_DEFAULTS = '<Default Extension="png" ContentType="image/png"/><Default Extension="jpeg" ContentType="image/jpeg"/>';

function wordDoc(texts, images) {
  let id = 0;
  const pic = (rid, descr) => {
    id++;
    const d = descr ? ` descr="${esc(descr)}"` : '';
    return `<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="762000" cy="571500"/><wp:docPr id="${id}" name="Bild ${id}"${d}/>`
      + `<a:graphic xmlns:a="${A}"><a:graphicData uri="${PIC}"><pic:pic xmlns:pic="${PIC}"><pic:nvPicPr><pic:cNvPr id="0" name="bild${id}"/><pic:cNvPicPr/></pic:nvPicPr>`
      + `<pic:blipFill><a:blip r:embed="${rid}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="762000" cy="571500"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>`;
  };
  const run = (t) => `<w:r><w:t xml:space="preserve">${esc(t)}</w:t></w:r>`;
  const body = [...texts.map((t) => `<w:p>${run(t)}</w:p>`), ...images.map((im, i) => `<w:p>${run(`Bild ${i + 1}: `)}${pic('rIdI' + i, im.descr)}</w:p>`)].join('');
  const z = new JSZip();
  z.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>${IMG_DEFAULTS}<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`, ZO);
  z.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${R}/officeDocument" Target="word/document.xml"/></Relationships>`, ZO);
  z.file('word/_rels/document.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${images.map((im, i) => `<Relationship Id="rIdI${i}" Type="${R}/image" Target="media/${im.name}"/>`).join('')}</Relationships>`, ZO);
  z.file('word/document.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:document xmlns:w="${W}" xmlns:r="${R}" xmlns:wp="${WP}" xmlns:a="${A}" xmlns:pic="${PIC}"><w:body>${body}<w:sectPr/></w:body></w:document>`, ZO);
  for (const im of images) z.file('word/media/' + im.name, im.bytes, ZO);
  return z.generateAsync({ type: 'nodebuffer', compression: 'STORE' });
}
function excelDoc(texts, images) {
  const cell = (r, t) => `<c r="${r}" t="inlineStr"><is><t xml:space="preserve">${esc(t)}</t></is></c>`;
  const rows = texts.map((t, i) => `<row r="${i + 1}">${cell('A' + (i + 1), t)}</row>`).join('');
  let id = 1;
  const anchor = (col, row, rid, descr) => {
    id++;
    const d = descr ? ` descr="${esc(descr)}"` : '';
    return `<xdr:oneCellAnchor><xdr:from><xdr:col>${col}</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>${row}</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:from><xdr:ext cx="762000" cy="571500"/>`
      + `<xdr:pic><xdr:nvPicPr><xdr:cNvPr id="${id}" name="Bild ${id}"${d}/><xdr:cNvPicPr/></xdr:nvPicPr><xdr:blipFill><a:blip r:embed="${rid}"/><a:stretch><a:fillRect/></a:stretch></xdr:blipFill>`
      + '<xdr:spPr><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></xdr:spPr></xdr:pic><xdr:clientData/></xdr:oneCellAnchor>';
  };
  const drawing = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<xdr:wsDr xmlns:xdr="${XDR}" xmlns:a="${A}" xmlns:r="${R}">${images.map((im, i) => anchor(i % 6, texts.length + 1 + Math.floor(i / 6) * 4, 'rIdI' + i, im.descr)).join('')}</xdr:wsDr>`;
  const z = new JSZip();
  z.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>${IMG_DEFAULTS}<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/drawings/drawing1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/></Types>`, ZO);
  z.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${R}/officeDocument" Target="xl/workbook.xml"/></Relationships>`, ZO);
  z.file('xl/workbook.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<workbook xmlns="${S}" xmlns:r="${R}"><sheets><sheet name="Liste" sheetId="1" r:id="rId1"/></sheets></workbook>`, ZO);
  z.file('xl/_rels/workbook.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${R}/worksheet" Target="worksheets/sheet1.xml"/></Relationships>`, ZO);
  z.file('xl/worksheets/sheet1.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<worksheet xmlns="${S}" xmlns:r="${R}"><sheetData>${rows}</sheetData><drawing r:id="rIdD"/></worksheet>`, ZO);
  z.file('xl/worksheets/_rels/sheet1.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdD" Type="${R}/drawing" Target="../drawings/drawing1.xml"/></Relationships>`, ZO);
  z.file('xl/drawings/drawing1.xml', drawing, ZO);
  z.file('xl/drawings/_rels/drawing1.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${images.map((im, i) => `<Relationship Id="rIdI${i}" Type="${R}/image" Target="../media/${im.name}"/>`).join('')}</Relationships>`, ZO);
  for (const im of images) z.file('xl/media/' + im.name, im.bytes, ZO);
  return z.generateAsync({ type: 'nodebuffer', compression: 'STORE' });
}

export async function makeAll({ force = false } = {}) {
  fs.mkdirSync(FXB, { recursive: true });
  const files = ['rauschen.docx', 'rauschen.xlsx', 'lesbar.docx', 'lesbar.xlsx'];
  if (!force && files.every((f) => fs.existsSync(path.join(FXB, f)))) return;
  const sizes = [[64, 64], [160, 120], [320, 240], [480, 360], [640, 480]];
  const jpegs = await noiseJpegs(sizes.map(([w, h], i) => [w, h, 1000 + i]));
  const imgs = [
    ...sizes.map(([w, h], i) => ({ name: `rauschen${i + 1}.png`, bytes: noisePng(w, h, 2000 + i) })),
    ...sizes.map(([w, h], i) => ({ name: `rauschen${i + 1}.jpeg`, bytes: jpegs[i] })),
  ];
  const texts = ['Protokoll der Elternsprechstunde', ...RAUSCHEN_PEOPLE.map((p, i) => `Anwesend: ${i % 2 ? 'Herr' : 'Frau'} ${p}.`), 'Fotos vom Schulfest:'];
  fs.writeFileSync(path.join(FXB, 'rauschen.docx'), await wordDoc(texts, imgs));
  fs.writeFileSync(path.join(FXB, 'rauschen.xlsx'), await excelDoc(texts, imgs));
  // Lesbar in Bildangaben: PNG-Textfeld (tEXt Author), EXIF Artist, XMP dc:creator, Alt-Text
  const [small] = await noiseJpegs([[32, 32, 77]]);
  const lesbar = [
    { name: 'png-text.png', bytes: noisePng(16, 16, 3001, [['Author', `${LESBAR.kurz} am Tor`], ['Comment', `Foto: ${LESBAR.lang}`]]) },
    { name: 'exif.jpeg', bytes: jpegWithMeta(small, { artist: `${LESBAR.kurz} ${LESBAR.lang}` }) },
    { name: 'xmp.jpeg', bytes: jpegWithMeta(small, { xmpCreator: `${LESBAR.lang}, ${LESBAR.kurz}` }) },
    { name: 'alt.png', bytes: noisePng(16, 16, 3002), descr: `Foto von ${LESBAR.kurz} ${LESBAR.lang}` },
  ];
  const ltexts = ['Protokoll', `Anwesend: Herr ${LESBAR.person}.`, 'Fotos:'];
  fs.writeFileSync(path.join(FXB, 'lesbar.docx'), await wordDoc(ltexts, lesbar));
  fs.writeFileSync(path.join(FXB, 'lesbar.xlsx'), await excelDoc(ltexts, lesbar));
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) { await makeAll({ force: true }); console.log('geschrieben: tests/fixtures-bildrauschen/'); }
