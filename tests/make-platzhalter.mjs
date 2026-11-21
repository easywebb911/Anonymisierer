// Testdokumente zu Platzhaltern mit Endung (Version 2.3.3). Alle Personen und Einrichtungen erfunden.
// - einrichtung-gross.(docx|txt|csv|xlsx): Einrichtung „Lindenauer Bürgerverein“ in GROSSSCHREIBUNG mit jeder zulässigen
//   Endung (groß) und gemischt (klein); Word/Excel zusätzlich in Kopfzeile und Bildbeschreibung.
// - verwechslung.(txt|docx): 50 Personen und 50 Einrichtungen, damit „Person AS“ und „Einrichtung AS“ eigene Platzhalter
//   sind; dazu „MÜLLERS“ (Person A) und „LINDENAUER BÜRGERVEREINS“ (Einrichtung A).
// - gegenprobe-platzhalter.txt: Originaltext, in dem zufällig Wörter wie „Person A“ oder „Einrichtung B“ stehen.
// Aufruf: node tests/make-platzhalter.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import JSZip from 'jszip';

const here = path.dirname(fileURLToPath(import.meta.url));
const fx = path.join(here, 'fixtures');
const ZO = { date: new Date(Date.UTC(2026, 0, 1, 12, 0, 0)), createFolders: false };
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const ORG = 'Lindenauer Bürgerverein';
const UP = ORG.toUpperCase();
export const UPPER_ENDINGS = ["'S", '’S', 'S', 'ES', 'N', 'NS'];
export const LOWER_ENDINGS = ["'s", '’s', "'", '’', 's', 'es', 'n', 'ns'];
// Zeilen des Einrichtungs-Tests: {text, form, kind}
export function orgLines() {
  const out = [{ text: `Der ${ORG} tagt heute.`, form: ORG, kind: 'Grundform' }, { text: `Form 2: Akte des ${UP} liegt vor.`, form: UP, kind: 'GROSS' }];
  for (const e of UPPER_ENDINGS) out.push({ text: `Form ${out.length + 1}: Akte des ${UP}${e} liegt vor.`, form: UP + e, kind: 'GROSS+' + e });
  for (const e of LOWER_ENDINGS) out.push({ text: `Form ${out.length + 1}: Akte des ${UP}${e} liegt vor.`, form: UP + e, kind: 'gemischt+' + e });
  return out;
}
export const ORG_HEADER = `Akte des ${UP}S`;
export const ORG_DESCR = `Logo des ${UP}ES`;

// 50 erfundene Personen (mit Anrede, damit alle erkannt werden) und 50 erfundene Einrichtungen
const SYL1 = ['Quar', 'Wend', 'Tolm', 'Brix', 'Hesk', 'Lorv', 'Muld', 'Pirn', 'Sorb', 'Vesk'];
const SYL2 = ['stedt', 'kamp', 'horst', 'wiek', 'brügge'];
const GIVEN = ['Anton', 'Berta', 'Carl', 'Dora', 'Emil', 'Frieda', 'Gustav', 'Hanna', 'Ida', 'Jonas'];
export function people() {
  const out = [['Frau', 'Helga', 'Müller']];
  for (let i = 0; out.length < 50; i++) {
    const sur = SYL1[i % 10] + SYL2[Math.floor(i / 10) % 5];
    out.push([i % 2 ? 'Frau' : 'Herr', GIVEN[i % 10], sur]);
  }
  return out;
}
export function orgs() {
  const out = [ORG];
  for (let i = 0; out.length < 50; i++) out.push(`Verein ${SYL1[i % 10]}${SYL2[Math.floor(i / 10) % 5]}`);
  return out;
}
export function verwechslungLines() {
  const P = people();
  const O = orgs();
  const L = [];
  P.forEach(([an, vn, nn], i) => L.push(`${i + 1}. ${an} ${vn} ${nn} ist Mitglied im ${O[i]}.`));
  L.push('Die Akte MÜLLERS liegt beim LINDENAUER BÜRGERVEREINS Vorstand.');
  return L;
}
export const GEGEN_PLATZHALTER = [
  'Im Spiel heißt die erste Figur Person A, die zweite Person B.',
  'Die Einrichtung B ist ein Schulgebäude, Einrichtung A2 ein Anbau.',
  'Feld „Nachname C“ und „Vorname D“ im Formular ausfüllen.',
  'Platzhalter wie [NAME] oder [E-MAIL-1] stehen in der Vorlage.',
  'Frau Helga Müller hat die Vorlage geprüft.',
];

const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const A = 'http://schemas.openxmlformats.org/drawingml/2006/main';
const PIC = 'http://schemas.openxmlformats.org/drawingml/2006/picture';
const WP = 'http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing';
const NS = `xmlns:w="${W}" xmlns:r="${R}" xmlns:wp="${WP}" xmlns:a="${A}" xmlns:pic="${PIC}"`;
const para = (t) => `<w:p><w:r><w:t xml:space="preserve">${esc(t)}</w:t></w:r></w:p>`;
async function docx(lines, { header, descr } = {}) {
  const z = new JSZip();
  const ct = ['<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>', '<Default Extension="xml" ContentType="application/xml"/>',
    '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>'];
  const rels = [];
  let body = lines.map(para).join('');
  let sect = '<w:sectPr/>';
  if (header) {
    ct.push('<Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/>');
    rels.push(`<Relationship Id="rIdH" Type="${R}/header" Target="header1.xml"/>`);
    z.file('word/header1.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:hdr ${NS}>${para(header)}</w:hdr>`, ZO);
    sect = '<w:sectPr><w:headerReference w:type="default" r:id="rIdH"/></w:sectPr>';
  }
  if (descr) {
    ct.push('<Default Extension="png" ContentType="image/png"/>');
    rels.push(`<Relationship Id="rIdImg" Type="${R}/image" Target="media/logo.png"/>`);
    body += `<w:p><w:r><w:drawing><wp:inline><wp:extent cx="762000" cy="571500"/><wp:docPr id="1" name="Bild 1" descr="${esc(descr)}"/><a:graphic><a:graphicData uri="${PIC}"><pic:pic><pic:nvPicPr><pic:cNvPr id="0" name="logo.png"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="rIdImg"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>`;
    z.file('word/media/logo.png', fs.readFileSync(path.join(fx, 'meta-quelle.png')), ZO);
  }
  z.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">${ct.join('')}</Types>`, ZO);
  z.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${R}/officeDocument" Target="word/document.xml"/></Relationships>`, ZO);
  if (rels.length) z.file('word/_rels/document.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${rels.join('')}</Relationships>`, ZO);
  z.file('word/document.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:document ${NS}><w:body>${body}${sect}</w:body></w:document>`, ZO);
  return z.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
}
// Excel: je Zeile eine Zelle, Kopfzeile (oddHeader) und ein Bild mit Beschreibung
async function xlsx(lines, { header, descr }) {
  const S = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
  const XDR = 'http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing';
  const rows = lines.map((t, i) => `<row r="${i + 1}"><c r="A${i + 1}" t="inlineStr"><is><t xml:space="preserve">${esc(t)}</t></is></c></row>`).join('');
  const drawing = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<xdr:wsDr xmlns:xdr="${XDR}" xmlns:a="${A}" xmlns:r="${R}"><xdr:oneCellAnchor><xdr:from><xdr:col>2</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>1</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:from><xdr:ext cx="762000" cy="571500"/><xdr:pic><xdr:nvPicPr><xdr:cNvPr id="2" name="Bild 1" descr="${esc(descr)}"/><xdr:cNvPicPr/></xdr:nvPicPr><xdr:blipFill><a:blip r:embed="rIdImg"/><a:stretch><a:fillRect/></a:stretch></xdr:blipFill><xdr:spPr><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></xdr:spPr></xdr:pic><xdr:clientData/></xdr:oneCellAnchor></xdr:wsDr>`;
  const z = new JSZip();
  z.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/drawings/drawing1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/></Types>`, ZO);
  z.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${R}/officeDocument" Target="xl/workbook.xml"/></Relationships>`, ZO);
  z.file('xl/workbook.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<workbook xmlns="${S}" xmlns:r="${R}"><sheets><sheet name="Akten" sheetId="1" r:id="rId1"/></sheets></workbook>`, ZO);
  z.file('xl/_rels/workbook.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${R}/worksheet" Target="worksheets/sheet1.xml"/></Relationships>`, ZO);
  z.file('xl/worksheets/sheet1.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<worksheet xmlns="${S}" xmlns:r="${R}"><sheetData>${rows}</sheetData><pageMargins left="0.7" right="0.7" top="0.78" bottom="0.78" header="0.3" footer="0.3"/><headerFooter><oddHeader>&amp;C${esc(header)}</oddHeader></headerFooter><drawing r:id="rIdD"/></worksheet>`, ZO);
  z.file('xl/worksheets/_rels/sheet1.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdD" Type="${R}/drawing" Target="../drawings/drawing1.xml"/></Relationships>`, ZO);
  z.file('xl/drawings/drawing1.xml', drawing, ZO);
  z.file('xl/drawings/_rels/drawing1.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdImg" Type="${R}/image" Target="../media/logo.png"/></Relationships>`, ZO);
  z.file('xl/media/logo.png', fs.readFileSync(path.join(fx, 'meta-quelle.png')), ZO);
  return z.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
}
const csv = (L) => ['Nr;Text', ...L.map((t, i) => `${i + 1};"${t.replace(/"/g, '""')}"`)].join('\r\n') + '\r\n';

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const L = orgLines().map((l) => l.text);
  const w = [];
  const put = (n, d) => { fs.writeFileSync(path.join(fx, n), d); w.push(n); };
  put('einrichtung-gross.txt', L.join('\n') + '\n');
  put('einrichtung-gross.csv', csv(L));
  put('einrichtung-gross.docx', await docx(L, { header: ORG_HEADER, descr: ORG_DESCR }));
  put('einrichtung-gross.xlsx', await xlsx(L, { header: ORG_HEADER, descr: ORG_DESCR }));
  const V = verwechslungLines();
  put('verwechslung.txt', V.join('\n') + '\n');
  put('verwechslung.docx', await docx(V));
  put('gegenprobe-platzhalter.txt', GEGEN_PLATZHALTER.join('\n') + '\n');
  console.log('geschrieben: ' + w.join(', '));
}
