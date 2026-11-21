// Testdokumente für Einrichtungen (Version 2.3). Alle Namen erfunden.
// Word, Excel, TXT, CSV mit: mehrteiliger Einrichtung im Text, in der Kopfzeile (Word), in einer Bildbeschreibung und
// im Blattnamen (Excel); Abkürzung und GROSSSCHREIBUNG; Genitiv mit Endung im Inneren und am Schluss; Zeilenumbruch im
// Namen; Einrichtung mit Personenname darin (und dieselbe Person an anderer Stelle); dieselbe Einrichtung in den
// Dateiangaben (Firma); mehrere verschiedene Einrichtungen. Aufruf: node tests/make-einrichtung.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import JSZip from 'jszip';

const here = path.dirname(fileURLToPath(import.meta.url));
const fx = path.join(here, 'fixtures');
const FIXED = new Date(Date.UTC(2026, 0, 1, 12, 0, 0));
const ZO = { date: FIXED, createFolders: false };
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const ORG = {
  haupt: 'Familienzentrum Sonnenblume', // mehrteilig; Genitiv innen „des Familienzentrums Sonnenblume“
  kurz: 'FZS', // Abkürzung derselben Einrichtung
  verein: 'Lindenauer Bürgerverein', // Genitiv am Schluss „des Lindenauer Bürgervereins“
  schule: 'Astrid-Lindgren-Schule', // Personenname in der Einrichtung
};
export const PERSONS = ['Astrid Lindgren', 'Petra Hollmann'];
// Jeder Wortbestandteil der Testnamen (für die Suche in allen Teilen der Ausgabe)
export const WORDS = ['Familienzentrum', 'Sonnenblume', 'FZS', 'Lindenauer', 'Bürgerverein', 'Astrid', 'Lindgren', 'Hollmann', 'Petra'];

// Gemeinsamer Text (Zeilen); „⏎“ markiert einen Zeilenumbruch innerhalb eines Absatzes bzw. einer Zelle
export const LINES = [
  'Bericht aus dem Familienzentrum Sonnenblume',
  'Die Leiterin des Familienzentrums Sonnenblume, Frau Petra Hollmann, berichtet.',
  'Das FZS plant gemeinsam mit dem Lindenauer Bürgerverein ein Fest.',
  'Der Vorstand des Lindenauer Bürgervereins stimmt zu.',
  'AUSHANG: FAMILIENZENTRUM SONNENBLUME LÄDT EIN',
  'Auch die Astrid-Lindgren-Schule macht mit. Frau Astrid Lindgren liest vor.',
  'Treffpunkt im Familienzentrum⏎Sonnenblume, Saal 2.',
];

// Zwei-Zeilen-Fälle (TXT): je Zeile eine Einheit
export const ORG3 = 'Musikschule am Stadtpark';
export const UMBRUCH_LINES = [
  'Brief an die Musikschule', // Umbruch nach dem ersten Wort
  'am Stadtpark, z. Hd. Frau Petra Hollmann.',
  'Die Musikschule am', // Umbruch nach dem zweiten Wort
  'Stadtpark lädt ein.',
  'Vorstand des Lindenauer', // mit Endung am Schluss
  'Bürgervereins tagt.',
  'Gruß an die Musikschule', // zwei Umbrüche im Namen (nicht ersetzen, Schlusscheck meldet)
  'am',
  'Stadtpark (zwei Umbrüche).',
  'Ein Satz ohne Einrichtung.',
  'Musikschule am Stadtpark ohne Umbruch.',
];
async function absatzDocx(withText = false) {
  const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
  const p = (t) => `<w:p><w:r><w:t xml:space="preserve">${esc(t)}</w:t></w:r></w:p>`;
  const z = new JSZip();
  z.file('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>', ZO);
  z.file('_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>', ZO);
  // Briefkopf: Name auf zwei Absätze verteilt
  z.file('word/document.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:document xmlns:w="${W}"><w:body>${p('Musikschule am')}${p('Stadtpark')}${p('Rundbrief an alle Eltern.')}${withText ? p('Die Musikschule am Stadtpark lädt ein.') : ''}<w:sectPr/></w:body></w:document>`, ZO);
  return z.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
}

// Absätze je Fall (TXT: Leerzeile zwischen den Absätzen; Word: je ein Absatz)
export const SC_CASES = {
  'nur-briefkopf': ['Musikschule am', 'Stadtpark', 'Rundbrief an alle Eltern.'],
  'briefkopf-und-text': ['Musikschule am', 'Stadtpark', 'Die Musikschule am Stadtpark lädt ein.'],
  'freie-person': ['Kita Freie', 'Waldorfschule', 'Rundbrief an alle Eltern.'],
  'nicht-im-dokument': ['Rundbrief an alle Eltern.', 'Wir freuen uns auf euch.'],
  'vollstaendig-ersetzt': ['Die Musikschule am Stadtpark lädt ein.', 'Vorstand des Lindenauer Bürgervereins tagt.'],
  'endung-ueber-absaetze': ['Vorstand des Lindenauer', 'Bürgervereins tagt.'],
};
async function scDocx(paras, opt = {}) {
  const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
  const R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
  const A = 'http://schemas.openxmlformats.org/drawingml/2006/main';
  const PIC = 'http://schemas.openxmlformats.org/drawingml/2006/picture';
  const WP = 'http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing';
  const p = (t) => `<w:p><w:r><w:t xml:space="preserve">${esc(t)}</w:t></w:r></w:p>`;
  const ns = `xmlns:w="${W}" xmlns:r="${R}" xmlns:wp="${WP}" xmlns:a="${A}" xmlns:pic="${PIC}"`;
  const pic = opt.descr ? `<w:p><w:r><w:drawing><wp:inline><wp:extent cx="762000" cy="571500"/><wp:docPr id="1" name="Bild 1" descr="${esc(opt.descr)}"/><a:graphic><a:graphicData uri="${PIC}"><pic:pic><pic:nvPicPr><pic:cNvPr id="0" name="logo.png"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="rIdImg"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>` : '';
  const z = new JSZip();
  z.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>${opt.header ? '<Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/>' : ''}${opt.footer ? '<Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>' : ''}</Types>`, ZO);
  z.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${R}/officeDocument" Target="word/document.xml"/></Relationships>`, ZO);
  z.file('word/_rels/document.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${opt.header ? `<Relationship Id="rIdH" Type="${R}/header" Target="header1.xml"/>` : ''}${opt.footer ? `<Relationship Id="rIdF" Type="${R}/footer" Target="footer1.xml"/>` : ''}${opt.descr ? `<Relationship Id="rIdImg" Type="${R}/image" Target="media/logo.png"/>` : ''}</Relationships>`, ZO);
  const sect = `<w:sectPr>${opt.header ? '<w:headerReference w:type="default" r:id="rIdH"/>' : ''}${opt.footer ? '<w:footerReference w:type="default" r:id="rIdF"/>' : ''}</w:sectPr>`;
  z.file('word/document.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:document ${ns}><w:body>${paras.map(p).join('')}${pic}${sect}</w:body></w:document>`, ZO);
  if (opt.header) z.file('word/header1.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:hdr ${ns}>${opt.header.map(p).join('')}</w:hdr>`, ZO);
  if (opt.footer) z.file('word/footer1.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:ftr ${ns}>${opt.footer.map(p).join('')}</w:ftr>`, ZO);
  if (opt.descr) z.file('word/media/logo.png', fs.readFileSync(path.join(fx, 'meta-quelle.png')), ZO);
  return z.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
}

async function word() {
  const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
  const R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
  const A = 'http://schemas.openxmlformats.org/drawingml/2006/main';
  const PIC = 'http://schemas.openxmlformats.org/drawingml/2006/picture';
  const WP = 'http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing';
  const run = (t) => t.split('⏎').map((x, i) => (i ? '<w:r><w:br/></w:r>' : '') + `<w:r><w:t xml:space="preserve">${esc(x)}</w:t></w:r>`).join('');
  const pic = `<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="762000" cy="571500"/><wp:docPr id="1" name="Bild 1" descr="Logo des Familienzentrums Sonnenblume"/><a:graphic xmlns:a="${A}"><a:graphicData uri="${PIC}"><pic:pic xmlns:pic="${PIC}"><pic:nvPicPr><pic:cNvPr id="0" name="logo.png" descr="Logo des Familienzentrums Sonnenblume"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="rIdImg"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="762000" cy="571500"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>`;
  const body = LINES.map((l) => `<w:p>${run(l)}</w:p>`).join('') + `<w:p>${run('Logo: ')}${pic}</w:p>`;
  const ns = `xmlns:w="${W}" xmlns:r="${R}" xmlns:wp="${WP}" xmlns:a="${A}" xmlns:pic="${PIC}"`;
  const z = new JSZip();
  z.file('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>', ZO);
  z.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${R}/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="${R}/extended-properties" Target="docProps/app.xml"/></Relationships>`, ZO);
  z.file('docProps/app.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>Microsoft Office Word</Application><Company>${ORG.haupt}</Company></Properties>`, ZO);
  z.file('word/_rels/document.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdImg" Type="${R}/image" Target="media/logo.png"/><Relationship Id="rIdH1" Type="${R}/header" Target="header1.xml"/></Relationships>`, ZO);
  z.file('word/document.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:document ${ns}><w:body>${body}<w:sectPr><w:headerReference w:type="default" r:id="rIdH1"/><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1417" w:right="1417" w:bottom="1134" w:left="1417" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr></w:body></w:document>`, ZO);
  z.file('word/header1.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:hdr ${ns}><w:p>${run('Familienzentrum Sonnenblume · Jahresbericht')}</w:p></w:hdr>`, ZO);
  z.file('word/media/logo.png', fs.readFileSync(path.join(fx, 'meta-quelle.png')), ZO);
  return z.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
}

async function excel() {
  const S = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
  const R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
  const XDR = 'http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing';
  const A = 'http://schemas.openxmlformats.org/drawingml/2006/main';
  const cell = (r, t) => `<c r="${r}" t="inlineStr"><is><t xml:space="preserve">${esc(t.replace('⏎', '\n'))}</t></is></c>`;
  const rows = LINES.map((l, i) => `<row r="${i + 1}">${cell('A' + (i + 1), l)}</row>`).join('');
  const drawing = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<xdr:wsDr xmlns:xdr="${XDR}" xmlns:a="${A}" xmlns:r="${R}"><xdr:oneCellAnchor><xdr:from><xdr:col>2</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>1</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:from><xdr:ext cx="762000" cy="571500"/><xdr:pic><xdr:nvPicPr><xdr:cNvPr id="2" name="Bild 1" descr="Logo des Familienzentrums Sonnenblume"/><xdr:cNvPicPr/></xdr:nvPicPr><xdr:blipFill><a:blip r:embed="rIdImg"/><a:stretch><a:fillRect/></a:stretch></xdr:blipFill><xdr:spPr><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></xdr:spPr></xdr:pic><xdr:clientData/></xdr:oneCellAnchor></xdr:wsDr>`;
  const z = new JSZip();
  z.file('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/drawings/drawing1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>', ZO);
  z.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${R}/officeDocument" Target="xl/workbook.xml"/><Relationship Id="rId2" Type="${R}/extended-properties" Target="docProps/app.xml"/></Relationships>`, ZO);
  z.file('docProps/app.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>Microsoft Excel</Application><Company>${ORG.haupt}</Company></Properties>`, ZO);
  // Blattname = Einrichtung
  z.file('xl/workbook.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<workbook xmlns="${S}" xmlns:r="${R}"><sheets><sheet name="${ORG.haupt}" sheetId="1" r:id="rId1"/></sheets></workbook>`, ZO);
  z.file('xl/_rels/workbook.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${R}/worksheet" Target="worksheets/sheet1.xml"/></Relationships>`, ZO);
  z.file('xl/worksheets/sheet1.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<worksheet xmlns="${S}" xmlns:r="${R}"><sheetData>${rows}</sheetData><drawing r:id="rIdD"/></worksheet>`, ZO);
  z.file('xl/worksheets/_rels/sheet1.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdD" Type="${R}/drawing" Target="../drawings/drawing1.xml"/></Relationships>`, ZO);
  z.file('xl/drawings/drawing1.xml', drawing, ZO);
  z.file('xl/drawings/_rels/drawing1.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdImg" Type="${R}/image" Target="../media/logo.png"/></Relationships>`, ZO);
  z.file('xl/media/logo.png', fs.readFileSync(path.join(fx, 'meta-quelle.png')), ZO);
  return z.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  fs.writeFileSync(path.join(fx, 'einrichtung.docx'), await word());
  fs.writeFileSync(path.join(fx, 'einrichtung.xlsx'), await excel());
  // TXT: der Umbruch ist ein echter Zeilenwechsel (zwei Zeilen)
  fs.writeFileSync(path.join(fx, 'einrichtung.txt'), LINES.map((l) => l.replace('⏎', '\n')).join('\n') + '\n');
  // CSV: der Umbruch steht in einer Zelle (in Anführungszeichen); zweite Spalte: Ort
  const csv = ['Text;Ort', ...LINES.map((l, i) => `"${l.replace('⏎', '\n').replace(/"/g, '""')}";Raum ${i + 1}`)].join('\r\n') + '\r\n';
  fs.writeFileSync(path.join(fx, 'einrichtung.csv'), csv);
  // Zwei-Zeilen-Fälle (TXT, Version 2.3): Umbruch nach dem 1. / 2. Wort, mit Endung, zwei Umbrüche; Unix und Windows
  const UMBRUCH = UMBRUCH_LINES.join('\n') + '\n';
  fs.writeFileSync(path.join(fx, 'einrichtung-umbruch.txt'), UMBRUCH);
  fs.writeFileSync(path.join(fx, 'einrichtung-umbruch-crlf.txt'), UMBRUCH.replace(/\n/g, '\r\n'));
  // Briefkopf über zwei getrennte Absätze (nur testen): TXT mit Leerzeile, Word mit zwei Absätzen
  fs.writeFileSync(path.join(fx, 'einrichtung-absatz.txt'), 'Musikschule\n\nam Stadtpark\nRundbrief an alle Eltern.\n');
  fs.writeFileSync(path.join(fx, 'einrichtung-absatz.docx'), await absatzDocx());
  // Variante: die Einrichtung steht zusätzlich einmal im Text
  fs.writeFileSync(path.join(fx, 'einrichtung-absatz-text.txt'), 'Musikschule\n\nam Stadtpark\nRundbrief an alle Eltern.\nDie Musikschule am Stadtpark lädt ein.\n');
  fs.writeFileSync(path.join(fx, 'einrichtung-absatz-text.docx'), await absatzDocx(true));
  // Schlusscheck über die Liste (Version 2.3): Fälle in Word und TXT
  for (const [name, paras] of Object.entries(SC_CASES)) {
    fs.writeFileSync(path.join(fx, `sc-${name}.txt`), paras.join('\n\n') + '\n');
    fs.writeFileSync(path.join(fx, `sc-${name}.docx`), await scDocx(paras));
  }
  fs.writeFileSync(path.join(fx, 'sc-kopf-fuss-bild.docx'), await scDocx(['Die Musikschule am Stadtpark lädt ein.', 'Rundbrief an alle Eltern.'], { header: ['Musikschule am', 'Stadtpark'], footer: ['Lindenauer', 'Bürgerverein'], descr: 'Logo der Musikschule am Stadtpark' }));
  console.log('geschrieben: tests/fixtures/einrichtung.docx, .xlsx, .txt, .csv, einrichtung-umbruch(-crlf).txt, einrichtung-absatz.txt/.docx');
}
