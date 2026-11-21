// Testdokumente zu Easys Befunden aus der Prüfung von Version 2.4.0 (für Version 2.5.0). Alle Namen erfunden.
// Word, Excel und TXT mit: Person Winter und „im Winter“; Person Rose und „bringt Rosen“; „Montag“ allein (in Excel in
// einer eigenen Zelle); „Do 13:30“; ein Name aus den Dateiangaben, den das Tool im Text nicht von selbst erkennt und der
// übernommen wird, mit GROSS-Form und Endung im Text („Wittekindhorn“, „WITTEKINDHORNS“); Platzhalter-Wörter im Original; Excel mit ausgeblendetem Blatt; Word/Excel mit zwei
// Bildern. TXT hat keine Dateiangaben: dort steht der Name in der Liste „Eigene Namen“ (Test).
// Aufruf: node tests/make-bedienung.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import JSZip from 'jszip';

const here = path.dirname(fileURLToPath(import.meta.url));
export const FXB = path.join(here, 'fixtures-bedienung');
const ZO = { date: new Date(Date.UTC(2026, 0, 1, 12, 0, 0)), createFolders: false };
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const X = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
const R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const A = 'http://schemas.openxmlformats.org/drawingml/2006/main';
const PIC = 'http://schemas.openxmlformats.org/drawingml/2006/picture';
const WP = 'http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing';
const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const S = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
// kleines PNG (2×2 Bildpunkte), zwei Farben
const PNG1 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFklEQVR4nGP4z8DAwMDAxMDAwMDAAAANBwEBy0r0KQAAAABJRU5ErkJggg==', 'base64');
const PNG2 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFklEQVR4nGNgYPj/n4GBgYGJgYGBAQAJ/QH/cY1yUgAAAABJRU5ErkJggg==', 'base64');

export const META_NAME = 'Edda Wittekindhorn';
export const LINES = [
  'Protokoll der Elternversammlung',
  'Herr Paul Winter leitet die Gruppe.',
  'Im Winter gehen wir rodeln, sagt Paul Winter.',
  'Frau Anna Rose kommt morgen.',
  'Sie bringt Rosen mit.',
  'Montag',
  'Do 13:30 Elterncafé',
  'Wittekindhorn bringt Kuchen mit.',
  'WITTEKINDHORNS Neffe hilft beim Aufbau.',
  'Im Formular stehen die Felder Person A und Name B.',
];
// Ausgeblendetes Blatt (nur Excel)
export const HIDDEN = ['Archiv: Frau Gerda Kühn hat die Liste geführt.'];

const ct = (over, extra = '') => X + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/>'
  + extra + over.map(([p, t]) => `<Override PartName="/${p}" ContentType="${t}"/>`).join('') + '</Types>';
const props = () => ({
  'docProps/core.xml': X + `<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:creator>${esc(META_NAME)}</dc:creator></cp:coreProperties>`,
  'docProps/app.xml': X + '<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>Microsoft Office</Application></Properties>',
});
const pkgRels = (main) => X + `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${R}/officeDocument" Target="${main}"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="${R}/extended-properties" Target="docProps/app.xml"/></Relationships>`;
const CT_PROPS = [['docProps/core.xml', 'application/vnd.openxmlformats-package.core-properties+xml'], ['docProps/app.xml', 'application/vnd.openxmlformats-officedocument.extended-properties+xml']];
async function save(name, files) {
  const z = new JSZip();
  for (const [n, c] of Object.entries(files)) z.file(n, c, ZO);
  fs.writeFileSync(path.join(FXB, name), await z.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }));
}

async function word() {
  const pic = (id, rid, descr) => `<w:r><w:drawing><wp:inline><wp:extent cx="381000" cy="381000"/><wp:docPr id="${id}" name="Bild ${id}" descr="${esc(descr)}"/>`
    + `<a:graphic><a:graphicData uri="${PIC}"><pic:pic><pic:nvPicPr><pic:cNvPr id="0" name="bild${id}.png"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="${rid}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>`
    + '<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="381000" cy="381000"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>';
  const p = (t) => `<w:p><w:r><w:t xml:space="preserve">${esc(t)}</w:t></w:r></w:p>`;
  const body = LINES.map(p).join('') + `<w:p>${pic(1, 'rIdP1', 'Foto vom Basteln')}${pic(2, 'rIdP2', 'Plakat')}</w:p>`
    + '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1417" w:right="1417" w:bottom="1134" w:left="1417" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr>';
  await save('bedienung.docx', {
    '[Content_Types].xml': ct([['word/document.xml', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml'], ...CT_PROPS]),
    '_rels/.rels': pkgRels('word/document.xml'),
    ...props(),
    'word/document.xml': X + `<w:document xmlns:w="${W}" xmlns:r="${R}" xmlns:wp="${WP}" xmlns:a="${A}" xmlns:pic="${PIC}"><w:body>${body}</w:body></w:document>`,
    'word/_rels/document.xml.rels': X + `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdP1" Type="${R}/image" Target="media/bild1.png"/><Relationship Id="rIdP2" Type="${R}/image" Target="media/bild2.png"/></Relationships>`,
    'word/media/bild1.png': PNG1,
    'word/media/bild2.png': PNG2,
  });
}

async function excel() {
  const XDR = 'http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing';
  const cell = (r, t) => `<c r="${r}" t="inlineStr"><is><t xml:space="preserve">${esc(t)}</t></is></c>`;
  // Blatt 1: je Zeile eine Zelle in Spalte A, Spalte B mit kurzer Bemerkung; „Montag“ allein in einer Zelle
  const rows = LINES.map((t, i) => `<row r="${i + 1}">${cell('A' + (i + 1), t)}${i === 5 ? cell('B6', 'Elternabend') : ''}</row>`).join('');
  const rows2 = HIDDEN.map((t, i) => `<row r="${i + 1}">${cell('A' + (i + 1), t)}</row>`).join('');
  const anchor = (id, col, rid, descr) => `<xdr:oneCellAnchor><xdr:from><xdr:col>${col}</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>10</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:from><xdr:ext cx="381000" cy="381000"/>`
    + `<xdr:pic><xdr:nvPicPr><xdr:cNvPr id="${id}" name="Bild ${id}" descr="${esc(descr)}"/><xdr:cNvPicPr/></xdr:nvPicPr><xdr:blipFill><a:blip r:embed="${rid}"/><a:stretch><a:fillRect/></a:stretch></xdr:blipFill>`
    + '<xdr:spPr><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></xdr:spPr></xdr:pic><xdr:clientData/></xdr:oneCellAnchor>';
  await save('bedienung.xlsx', {
    '[Content_Types].xml': ct([['xl/workbook.xml', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml'], ['xl/worksheets/sheet1.xml', 'application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml'],
      ['xl/worksheets/sheet2.xml', 'application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml'], ['xl/drawings/drawing1.xml', 'application/vnd.openxmlformats-officedocument.drawing+xml'], ...CT_PROPS]),
    '_rels/.rels': pkgRels('xl/workbook.xml'),
    ...props(),
    'xl/workbook.xml': X + `<workbook xmlns="${S}" xmlns:r="${R}"><sheets><sheet name="Protokoll" sheetId="1" r:id="rId1"/><sheet name="Archiv" sheetId="2" state="hidden" r:id="rId2"/></sheets></workbook>`,
    'xl/_rels/workbook.xml.rels': X + `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${R}/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="${R}/worksheet" Target="worksheets/sheet2.xml"/></Relationships>`,
    'xl/worksheets/sheet1.xml': X + `<worksheet xmlns="${S}" xmlns:r="${R}"><sheetData>${rows}</sheetData><drawing r:id="rIdD"/></worksheet>`,
    'xl/worksheets/_rels/sheet1.xml.rels': X + `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdD" Type="${R}/drawing" Target="../drawings/drawing1.xml"/></Relationships>`,
    'xl/worksheets/sheet2.xml': X + `<worksheet xmlns="${S}"><sheetData>${rows2}</sheetData></worksheet>`,
    'xl/drawings/drawing1.xml': X + `<xdr:wsDr xmlns:xdr="${XDR}" xmlns:a="${A}" xmlns:r="${R}">${anchor(2, 0, 'rIdP1', 'Foto vom Basteln')}${anchor(3, 1, 'rIdP2', 'Plakat')}</xdr:wsDr>`,
    'xl/drawings/_rels/drawing1.xml.rels': X + `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdP1" Type="${R}/image" Target="../media/bild1.png"/><Relationship Id="rIdP2" Type="${R}/image" Target="../media/bild2.png"/></Relationships>`,
    'xl/media/bild1.png': PNG1,
    'xl/media/bild2.png': PNG2,
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  fs.mkdirSync(FXB, { recursive: true });
  await word();
  await excel();
  fs.writeFileSync(path.join(FXB, 'bedienung.txt'), LINES.join('\n') + '\n');
  console.log('Testdokumente:', fs.readdirSync(FXB).join(', '));
}
