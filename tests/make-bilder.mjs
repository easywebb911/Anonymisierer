// Testdokumente für Bilder und Bildbeschreibungen (Version 2.2). Alle Namen erfunden.
// Word und Excel, je mit Bildern im Text, in der Kopfzeile und in einer Tabelle (Excel: im Blatt an einer Zelle);
// ein Name NUR im Alt-Text, einer NUR im Titel; ein nicht anzeigbarer Typ (EMF); ein verknüpftes Bild; ein SVG.
// Aufruf: node tests/make-bilder.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import JSZip from 'jszip';

const here = path.dirname(fileURLToPath(import.meta.url));
const fx = path.join(here, 'fixtures');
const FIXED = new Date(Date.UTC(2026, 0, 1, 12, 0, 0));
const ZO = { date: FIXED, createFolders: false };
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Erfundene Personen
export const BILDER_PEOPLE = {
  nurAlt: { full: 'Wiebke Sandmann', words: ['Wiebke', 'Sandmann'] }, // steht NUR im Alt-Text eines Bildes
  nurTitel: { full: 'Torben Kleinschmidt', words: ['Torben', 'Kleinschmidt'] }, // steht NUR im Titel eines Bildes
  imText: { full: 'Sabine Keller', words: ['Sabine', 'Keller'] }, // steht im Text (Vergleich)
};
const ALT = `Foto von Frau ${BILDER_PEOPLE.nurAlt.full} am Empfang`;
const TITLE = `Porträt von Herrn ${BILDER_PEOPLE.nurTitel.full}`;

// Bilder: JPEG und PNG aus den vorhandenen Quellbildern (ohne Bildangaben), GIF 1×1, EMF (nur Kopf und Ende),
// SVG (einfaches Rechteck)
const jpeg = fs.readFileSync(path.join(fx, 'meta-quelle.jpeg'));
const png = fs.readFileSync(path.join(fx, 'meta-quelle.png'));
const gif = Buffer.from('R0lGODlhAQABAIAAAP8AAP///ywAAAAAAQABAAACAkQBADs=', 'base64');
function emf() {
  const b = Buffer.alloc(108);
  b.writeUInt32LE(1, 0); b.writeUInt32LE(88, 4); // EMR_HEADER
  b.writeInt32LE(0, 8); b.writeInt32LE(0, 12); b.writeInt32LE(99, 16); b.writeInt32LE(74, 20); // Bounds
  b.writeInt32LE(0, 24); b.writeInt32LE(0, 28); b.writeInt32LE(2540, 32); b.writeInt32LE(1905, 36); // Frame (0,01 mm)
  b.writeUInt32LE(0x464d4520, 40); b.writeUInt32LE(0x10000, 44); b.writeUInt32LE(108, 48); b.writeUInt32LE(2, 52);
  b.writeUInt16LE(1, 56); // Handles
  b.writeInt32LE(1920, 72); b.writeInt32LE(1080, 76); b.writeInt32LE(508, 80); b.writeInt32LE(286, 84); // Gerät, Millimeter
  b.writeUInt32LE(14, 88); b.writeUInt32LE(20, 92); b.writeUInt32LE(0, 96); b.writeUInt32LE(16, 100); b.writeUInt32LE(20, 104); // EMR_EOF
  return b;
}
const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="80" height="60" viewBox="0 0 80 60"><rect width="80" height="60" fill="#0B6B6B"/><circle cx="40" cy="30" r="18" fill="#FFE39A"/></svg>', 'utf8');

const R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const A = 'http://schemas.openxmlformats.org/drawingml/2006/main';
const PIC = 'http://schemas.openxmlformats.org/drawingml/2006/picture';
const WP = 'http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing';
const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const SVGNS = 'http://schemas.microsoft.com/office/drawing/2016/SVG/main';
const IMG_DEFAULTS = '<Default Extension="png" ContentType="image/png"/><Default Extension="jpeg" ContentType="image/jpeg"/><Default Extension="gif" ContentType="image/gif"/><Default Extension="emf" ContentType="image/x-emf"/><Default Extension="svg" ContentType="image/svg+xml"/>';

// Ein Bild in Word (inline). blip: Inhalt von <a:blip …>
let picId = 0;
function wordPic({ blip, descr = '', title = '' }) {
  picId++;
  const d = descr ? ` descr="${esc(descr)}"` : '';
  const t = title ? ` title="${esc(title)}"` : '';
  return `<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="762000" cy="571500"/><wp:docPr id="${picId}" name="Bild ${picId}"${d}${t}/>`
    + `<a:graphic xmlns:a="${A}"><a:graphicData uri="${PIC}"><pic:pic xmlns:pic="${PIC}"><pic:nvPicPr><pic:cNvPr id="0" name="bild${picId}"${d}/><pic:cNvPicPr/></pic:nvPicPr>`
    + `<pic:blipFill>${blip}<a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="762000" cy="571500"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>`;
}
const para = (inner) => `<w:p>${inner}</w:p>`;
const run = (t) => `<w:r><w:t xml:space="preserve">${esc(t)}</w:t></w:r>`;

async function word() {
  picId = 0;
  const body = [
    para(run('Protokoll der Teamsitzung')),
    para(run(`Anwesend: Frau ${BILDER_PEOPLE.imText.full} und das Team Empfang.`)),
    para(run('Foto vom Empfang: ') + wordPic({ blip: '<a:blip r:embed="rIdPng"/>', descr: ALT })),
    `<w:tbl><w:tblPr><w:tblW w:w="0" w:type="auto"/></w:tblPr><w:tblGrid><w:gridCol w:w="4500"/><w:gridCol w:w="4500"/></w:tblGrid><w:tr><w:tc>${para(run('Zeichen der Abteilung'))}</w:tc><w:tc>${para(wordPic({ blip: '<a:blip r:embed="rIdGif"/>', descr: 'Abteilungszeichen' }))}</w:tc></w:tr></w:tbl>`,
    para(run('Grafik aus der Präsentation: ') + wordPic({ blip: '<a:blip r:embed="rIdEmf"/>' })),
    para(run('Plan aus dem Netzlaufwerk: ') + wordPic({ blip: '<a:blip r:link="rIdLink"/>', descr: 'Lageplan' })),
    para(run('Logo als Vektorgrafik: ') + wordPic({ blip: `<a:blip r:embed="rIdSvgPng"><a:extLst><a:ext uri="{96DAC541-7B7A-43D3-8B79-37D633B846F1}"><asvg:svgBlip xmlns:asvg="${SVGNS}" r:embed="rIdSvg"/></a:ext></a:extLst></a:blip>` })),
    para(run('Ende des Protokolls.')),
  ].join('');
  const ns = `xmlns:w="${W}" xmlns:r="${R}" xmlns:wp="${WP}" xmlns:a="${A}" xmlns:pic="${PIC}"`;
  const z = new JSZip();
  z.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>${IMG_DEFAULTS}<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/></Types>`, ZO);
  z.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${R}/officeDocument" Target="word/document.xml"/></Relationships>`, ZO);
  z.file('word/_rels/document.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdPng" Type="${R}/image" Target="media/foto.png"/><Relationship Id="rIdGif" Type="${R}/image" Target="media/zeichen.gif"/><Relationship Id="rIdEmf" Type="${R}/image" Target="media/grafik.emf"/><Relationship Id="rIdLink" Type="${R}/image" Target="file:///C:/Ablage/lageplan.png" TargetMode="External"/><Relationship Id="rIdSvgPng" Type="${R}/image" Target="media/logo.png"/><Relationship Id="rIdSvg" Type="${R}/image" Target="media/logo.svg"/><Relationship Id="rIdH1" Type="${R}/header" Target="header1.xml"/></Relationships>`, ZO);
  z.file('word/document.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:document ${ns}><w:body>${body}<w:sectPr><w:headerReference w:type="default" r:id="rIdH1"/><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1417" w:right="1417" w:bottom="1134" w:left="1417" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr></w:body></w:document>`, ZO);
  z.file('word/_rels/header1.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdJpg" Type="${R}/image" Target="media/portraet.jpeg"/></Relationships>`, ZO);
  z.file('word/header1.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:hdr ${ns}>${para(run('Interne Notiz ') + wordPic({ blip: '<a:blip r:embed="rIdJpg"/>', title: TITLE }))}</w:hdr>`, ZO);
  z.file('word/media/foto.png', png, ZO);
  z.file('word/media/zeichen.gif', gif, ZO);
  z.file('word/media/grafik.emf', emf(), ZO);
  z.file('word/media/logo.png', png, ZO);
  z.file('word/media/logo.svg', svg, ZO);
  z.file('word/media/portraet.jpeg', jpeg, ZO);
  return z.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
}

async function excel() {
  const XDR = 'http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing';
  const S = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
  const cell = (r, t) => `<c r="${r}" t="inlineStr"><is><t xml:space="preserve">${esc(t)}</t></is></c>`;
  const rows = [['Teilnehmerliste'], [`Anwesend: Frau ${BILDER_PEOPLE.imText.full}`], ['Foto', 'Porträt', 'Grafik', 'Plan', 'Logo']]
    .map((r, i) => `<row r="${i + 1}">${r.map((t, j) => cell('ABCDE'[j] + (i + 1), t)).join('')}</row>`).join('');
  let id = 1;
  const anchor = (col, row, blip, { descr = '', title = '' } = {}) => {
    id++;
    const d = descr ? ` descr="${esc(descr)}"` : '';
    const t = title ? ` title="${esc(title)}"` : '';
    return `<xdr:oneCellAnchor><xdr:from><xdr:col>${col}</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>${row}</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:from><xdr:ext cx="762000" cy="571500"/>`
      + `<xdr:pic><xdr:nvPicPr><xdr:cNvPr id="${id}" name="Bild ${id}"${d}${t}/><xdr:cNvPicPr/></xdr:nvPicPr><xdr:blipFill>${blip}<a:stretch><a:fillRect/></a:stretch></xdr:blipFill>`
      + '<xdr:spPr><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></xdr:spPr></xdr:pic><xdr:clientData/></xdr:oneCellAnchor>';
  };
  const drawing = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<xdr:wsDr xmlns:xdr="${XDR}" xmlns:a="${A}" xmlns:r="${R}">`
    + anchor(0, 3, '<a:blip r:embed="rIdPng"/>', { descr: ALT })
    + anchor(1, 3, '<a:blip r:embed="rIdJpg"/>', { title: TITLE })
    + anchor(2, 3, '<a:blip r:embed="rIdEmf"/>')
    + anchor(3, 3, '<a:blip r:link="rIdLink"/>', { descr: 'Lageplan' })
    + anchor(4, 3, `<a:blip r:embed="rIdSvgPng"><a:extLst><a:ext uri="{96DAC541-7B7A-43D3-8B79-37D633B846F1}"><asvg:svgBlip xmlns:asvg="${SVGNS}" r:embed="rIdSvg"/></a:ext></a:extLst></a:blip>`)
    + '</xdr:wsDr>';
  const vml = '<xml xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">'
    + '<o:shapelayout v:ext="edit"><o:idmap v:ext="edit" data="1"/></o:shapelayout>'
    + '<v:shapetype id="_x0000_t75" coordsize="21600,21600" o:spt="75" o:preferrelative="t" path="m@4@5l@4@11@9@11@9@5xe" filled="f" stroked="f"><v:stroke joinstyle="miter"/><v:path o:extrusionok="f" gradientshapeok="t" o:connecttype="rect"/><o:lock v:ext="edit" aspectratio="t"/></v:shapetype>'
    + '<v:shape id="CH" o:spid="_x0000_s1025" type="#_x0000_t75" style="position:absolute;margin-left:0;margin-top:0;width:24pt;height:24pt;z-index:1"><v:imagedata o:relid="rId1" o:title="Kopfzeilenzeichen"/><o:lock v:ext="edit" rotation="t"/></v:shape></xml>';
  const z = new JSZip();
  z.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="vml" ContentType="application/vnd.openxmlformats-officedocument.vmlDrawing"/>${IMG_DEFAULTS}<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/drawings/drawing1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/></Types>`, ZO);
  z.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${R}/officeDocument" Target="xl/workbook.xml"/></Relationships>`, ZO);
  z.file('xl/workbook.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<workbook xmlns="${S}" xmlns:r="${R}"><sheets><sheet name="Teilnehmer" sheetId="1" r:id="rId1"/></sheets></workbook>`, ZO);
  z.file('xl/_rels/workbook.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${R}/worksheet" Target="worksheets/sheet1.xml"/></Relationships>`, ZO);
  z.file('xl/worksheets/sheet1.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<worksheet xmlns="${S}" xmlns:r="${R}"><sheetData>${rows}</sheetData><pageMargins left="0.7" right="0.7" top="0.78" bottom="0.78" header="0.3" footer="0.3"/><headerFooter><oddHeader>&amp;C&amp;G</oddHeader></headerFooter><drawing r:id="rIdD"/><legacyDrawingHF r:id="rIdHF"/></worksheet>`, ZO);
  z.file('xl/worksheets/_rels/sheet1.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdD" Type="${R}/drawing" Target="../drawings/drawing1.xml"/><Relationship Id="rIdHF" Type="${R}/vmlDrawing" Target="../drawings/vmlDrawingHF1.vml"/></Relationships>`, ZO);
  z.file('xl/drawings/drawing1.xml', drawing, ZO);
  z.file('xl/drawings/_rels/drawing1.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdPng" Type="${R}/image" Target="../media/foto.png"/><Relationship Id="rIdJpg" Type="${R}/image" Target="../media/portraet.jpeg"/><Relationship Id="rIdEmf" Type="${R}/image" Target="../media/grafik.emf"/><Relationship Id="rIdLink" Type="${R}/image" Target="file:///C:/Ablage/lageplan.png" TargetMode="External"/><Relationship Id="rIdSvgPng" Type="${R}/image" Target="../media/logo.png"/><Relationship Id="rIdSvg" Type="${R}/image" Target="../media/logo.svg"/></Relationships>`, ZO);
  z.file('xl/drawings/vmlDrawingHF1.vml', vml, ZO);
  z.file('xl/drawings/_rels/vmlDrawingHF1.vml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${R}/image" Target="../media/kopf.gif"/></Relationships>`, ZO);
  z.file('xl/media/foto.png', png, ZO);
  z.file('xl/media/portraet.jpeg', jpeg, ZO);
  z.file('xl/media/grafik.emf', emf(), ZO);
  z.file('xl/media/logo.png', png, ZO);
  z.file('xl/media/logo.svg', svg, ZO);
  z.file('xl/media/kopf.gif', gif, ZO);
  return z.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  fs.writeFileSync(path.join(fx, 'bilder-word.docx'), await word());
  fs.writeFileSync(path.join(fx, 'bilder-excel.xlsx'), await excel());
  console.log('geschrieben: tests/fixtures/bilder-word.docx, bilder-excel.xlsx');
}
