// Erfundene Nachbildung einer Kurs-Tabelle (Word) aus einem Praxistest. Alle Namen und die Einrichtung sind erfunden.
// Aufruf: node tests/make-kurse.mjs  -> tests/fixtures/kurse.docx
import fs from 'node:fs';
import zlib from 'node:zlib';
import JSZip from 'jszip';

const out = process.argv[2] || new URL('./fixtures/kurse.docx', import.meta.url).pathname;
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const WP = 'http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing';
const A = 'http://schemas.openxmlformats.org/drawingml/2006/main';
const PIC = 'http://schemas.openxmlformats.org/drawingml/2006/picture';

// kleines gültiges PNG (rot), mit tEXt-Metadaten "Author"
function png() {
  const crc = (b) => { let c, crcT = []; for (let n = 0; n < 256; n++) { c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; crcT[n] = c >>> 0; } let x = 0xffffffff; for (const v of b) x = crcT[(x ^ v) & 0xff] ^ (x >>> 8); return (x ^ 0xffffffff) >>> 0; };
  const chunk = (t, d) => { const len = Buffer.alloc(4); len.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(8, 0); ihdr.writeUInt32BE(8, 4); ihdr[8] = 8; ihdr[9] = 2;
  const raw = Buffer.alloc(8 * (1 + 8 * 3)); for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) raw[y * 25 + 1 + x * 3] = 200;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('tEXt', Buffer.from('Author\0Gisela Musterfrau')), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
const p = (t, rpr = '') => `<w:p><w:r>${rpr}<w:t xml:space="preserve">${esc(t)}</w:t></w:r></w:p>`;
const pbr = (a, b) => `<w:p><w:r><w:t xml:space="preserve">${esc(a)}</w:t></w:r><w:r><w:br/></w:r><w:r><w:t xml:space="preserve">${esc(b)}</w:t></w:r></w:p>`;
const tc = (inner) => `<w:tc><w:tcPr><w:tcW w:w="2200" w:type="dxa"/></w:tcPr>${inner}</w:tc>`;
const img = (rid, id, name, descr, cx = 1440000, cy = 720000) => `<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${cx}" cy="${cy}"/><wp:docPr id="${id}" name="${esc(name)}" descr="${esc(descr)}"/><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic><pic:nvPicPr><pic:cNvPr id="${id}" name="${esc(name)}" descr="${esc(descr)}"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="${rid}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>`;

// Lehrkraft-Zellen: Anrede und Name in getrennten Absätzen derselben Zelle (wie im Praxistest)
export const ROWS = [
  ['Chor für Erwachsene', [p('Herr'), p('Vogel')], 'Wir singen gemeinsam in der Gruppe Lieder aus aller Welt.', [p('Montag'), p('12.01.2026')]],
  ['Malen mit Aquarell', [p('Frau'), p('Kirchbichler')], 'Wir malen Landschaften und Blumen.', [p('Montag'), p('19.01.2026')]],
  ['Yoga am Morgen', [p('Frau'), p('Tesfamariam')], 'Sanfte Übungen für Rücken und Herz.', [p('Montag'), p('26.01.2026')]],
  ['Töpfern', [p('Herr'), p('Schneider')], 'Gefäße aus Ton formen und brennen.', [p('Dienstag'), p('13.01.2026')]],
  ['Gitarre für Anfänger', [p('Herr'), p('Okonkwo')], 'Erste Akkorde und einfache Lieder.', [p('Mittwoch'), p('14.01.2026')]],
  ['Kochen international', [p('Frau'), p('Engel')], 'Wir kochen Gerichte aus vielen Ländern.', [p('Donnerstag'), p('15.01.2026')]],
  ['Englisch Konversation', [p('Frau'), p('Ndiaye')], 'Sprechen im Alltag, in kleiner Gruppe.', [p('Freitag'), p('16.01.2026')]],
  ['Schach', [p('Herr'), p('Brzęczek')], 'Eröffnungen und Taktik für Fortgeschrittene.', [p('Samstag'), p('17.01.2026')]],
  // Varianten: gleicher Absatz, Zeilenumbruch
  ['Fotografie', [p('Frau Kowalski')], 'Licht, Blende und Bildaufbau.', [p('Januar'), p('20.01.2026')]],
  ['Nähen', [pbr('Herr', 'Lindqvist')], 'Einfache Schnitte, eigene Kleidung.', [p('März'), p('03.03.2026')]],
  ['Tanz', [pbr('Frau', 'Wiese')], 'Wir tanzen Walzer und Tango in der Gruppe.', [p('Mai'), p('05.05.2026')]],
  ['Theater', [p('Frau'), p('Dr. Haberkorn')], 'Improvisation und kleine Szenen.', [p('Juni'), p('02.06.2026')]],
];
// Zellgrenze: Anrede und Name in verschiedenen Spalten
export const ROWS2 = [['Herr', 'Mbeki-Tshabalala', 'Kursleitung Garten'], ['Frau', 'Sonnleitner', 'Kursleitung Musik'], ['Herr', 'Fuchs', 'Hausmeister']];

const rowsXml = ROWS.map(([t, l, b, s]) => `<w:tr>${tc(p(t))}${tc(l.join(''))}${tc(p(b))}${tc(s.join(''))}</w:tr>`).join('');
const head = `<w:tr>${['Titel', 'Lehrkraft', 'Beschreibung', 'Start'].map((x) => tc(p(x))).join('')}</w:tr>`;
const tbl = (inner) => `<w:tbl><w:tblPr><w:tblW w:w="8800" w:type="dxa"/><w:tblBorders><w:top w:val="single" w:sz="4"/><w:bottom w:val="single" w:sz="4"/><w:insideH w:val="single" w:sz="4"/><w:insideV w:val="single" w:sz="4"/></w:tblBorders></w:tblPr><w:tblGrid><w:gridCol w:w="2200"/><w:gridCol w:w="2200"/><w:gridCol w:w="2200"/><w:gridCol w:w="2200"/></w:tblGrid>${inner}</w:tbl>`;
const rows2 = ROWS2.map((r) => `<w:tr>${r.map((x) => tc(p(x))).join('')}${tc(p(''))}</w:tr>`).join('');
const body = p('Kursprogramm Frühjahr 2026') + `<w:p>${img('rIdImg2', 2, 'Foto 1', 'Foto: Kursleiterin Marta Kowalski mit Gruppe')}</w:p>` + tbl(head + rowsXml) + p('Ansprechpersonen') + tbl(rows2)
  + p('Anmeldung bei Frau') + p('Sonnleitner oder per E-Mail.');
const docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="${W}" xmlns:r="${R}" xmlns:wp="${WP}" xmlns:a="${A}" xmlns:pic="${PIC}"><w:body>${body}<w:sectPr><w:headerReference w:type="default" r:id="rIdH1"/><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1417" w:right="1417" w:bottom="1134" w:left="1417" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr></w:body></w:document>`;
const hdr = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:hdr xmlns:w="${W}" xmlns:r="${R}" xmlns:wp="${WP}" xmlns:a="${A}" xmlns:pic="${PIC}"><w:p>${img('rIdLogo', 1, 'Logo', 'Logo Familienzentrum Sonnenblume Musterstadt')}<w:r><w:t xml:space="preserve"> Familienzentrum Sonnenblume</w:t></w:r></w:p></w:hdr>`;
const files = {
  '[Content_Types].xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Default Extension="jpeg" ContentType="image/jpeg"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>`,
  '_rels/.rels': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/thumbnail" Target="docProps/thumbnail.jpeg"/><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>`,
  'word/_rels/document.xml.rels': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdH1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header1.xml"/><Relationship Id="rIdImg2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image2.png"/></Relationships>`,
  'word/_rels/header1.xml.rels': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdLogo" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image1.png"/></Relationships>`,
  'word/document.xml': docXml,
  'word/header1.xml': hdr,
  'word/media/image1.png': png(),
  'word/media/image2.png': png(),
  'docProps/thumbnail.jpeg': Buffer.from('FFD8FFE000104A46494600010100000100010000FFD9', 'hex'),
  // so wie Word sie schreibt (Präfixe cp/dc/dcterms, Reihenfolge wie im Original)
  'docProps/core.xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title></dc:title><dc:subject></dc:subject><dc:creator>Gisela Musterfrau</dc:creator><cp:keywords></cp:keywords><dc:description></dc:description><cp:lastModifiedBy>Bernd Beispielmann</cp:lastModifiedBy><cp:revision>7</cp:revision><dcterms:created xsi:type="dcterms:W3CDTF">2025-11-03T08:12:00Z</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">2025-12-01T14:40:00Z</dcterms:modified></cp:coreProperties>`,
  'docProps/app.xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Template>Normal.dotm</Template><TotalTime>42</TotalTime><Pages>1</Pages><Application>Microsoft Office Word</Application><Company>Familienzentrum Sonnenblume</Company><AppVersion>16.0000</AppVersion></Properties>`,
};
const FIXED = new Date(Date.UTC(2026, 0, 1, 12, 0, 0));
const z = new JSZip();
for (const [n, c] of Object.entries(files)) z.file(n, c, { date: FIXED, createFolders: false });
fs.writeFileSync(out, await z.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }));
console.log('geschrieben', out);

// ---------- Risiko-Test für die Regel "Anrede allein -> nächste Einheit ist Name" ----------
// Jeder Fall: [Beschreibung, erwartet ('Name' oder 'kein Name'), Bausteine]
const H = (t) => `<w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t xml:space="preserve">${esc(t)}</w:t></w:r></w:p>`;
const empty = '<w:p/>';
export const D_NAMES = ['Hartung', 'Hornung', 'Kubik', 'Pawlik', 'Homburg', 'Steineck', 'Kronfeld', 'Tannheim'];
export const RISK = [
  ['Anrede, dann Überschrift', 'kein Name', p('Herr') + H('Kursübersicht')],
  ['Anrede, dann Fach', 'kein Name', p('Frau') + p('Mathematik')],
  ['Anrede, dann Ort (nicht auf Liste)', 'kein Name', p('Herr') + p('Lübeck')],
  ['Anrede, dann Ort (auf Liste)', 'kein Name', p('Herr') + p('Berlin')],
  ['Anrede, dann Datum', 'kein Name', p('Frau') + p('15.03.2026')],
  ['Anrede, dann ganzer Satz', 'kein Name', p('Herr') + p('Bitte melden Sie sich bis Freitag.')],
  ['Anrede, Leerabsatz, dann Name', 'kein Name (Regel greift bewusst nicht)', p('Herr') + empty + p('Sonnleitner')],
  ['Briefzeile "Sehr geehrte Frau,"', 'kein Name', p('Sehr geehrte Frau,') + p('Ihr Antrag liegt vor.')],
  ['"Das sagte der Herr."', 'kein Name', p('Das sagte der Herr.') + p('Danach gingen alle.')],
  ['"Liebe Frau"', 'kein Name', p('Liebe Frau') + p('Vielen Dank für Ihre Mühe.')],
  ['"Gesprächspartner: Herr"', 'kein Name', p('Gesprächspartner: Herr') + p('Schulleitung')],
  ['"Die Frau"', 'kein Name', p('Die Frau') + p('Mitte vierzig kam herein.')],
  ['"Anrede: Frau", dann Wochentag', 'kein Name', p('Anrede: Frau') + p('Montag')],
  ['Positiv: Anrede mit Titeln, dann Name mit Zusatz', 'Name', p('Frau Prof. Dr.') + p('Henriette von Bodelschwingh')],
  // Entscheidung D: erfundene Personen, deren Nachnamen wie Sach- oder Ortswörter enden -> müssen ersetzt werden
  ...D_NAMES.map((n, i) => [`Positiv D: Anrede allein, dann ${n}`, 'Name', p(i % 2 ? 'Frau' : 'Herr') + p(n)]),
  ['Positiv D: Anrede allein, dann Vor- und Nachname mit Endung', 'Name', p('Frau Dr.') + p('Lieselotte Steineck')],
];
const riskRows = [
  ['Tabelle: Anrede, leere Nachbarzelle, Name', 'kein Name (leere Zelle unterbricht)', ['Herr', '', 'Kirchbichler']],
  ['Tabelle: Anrede, rechte Nachbarzelle Name', 'Name', ['Herr', 'Tesfamariam', 'Garten']],
  ['Tabelle: Anrede, rechte Nachbarzelle Fach', 'kein Name', ['Frau', 'Chemie', 'Raum 12']],
  ['Tabelle: Anrede am Zeilenende, Name in nächster Zeile', 'kein Name (keine Nachbarzelle)', ['Kurs', 'Raum 3', 'Frau'], ['Neumeier-Okafor', 'x', 'y']],
  ...D_NAMES.map((n, i) => [`Tabelle D: Anrede, rechte Nachbarzelle ${n}`, 'Name', [i % 2 ? 'Frau' : 'Herr', n, 'Kurs']]),
];
let riskBody = p('Risiko-Test Anrede allein');
for (const [, , xml] of RISK) riskBody += xml + empty;
const row3 = (cells) => `<w:tr>${cells.map((c) => tc(c ? p(c) : empty)).join('')}</w:tr>`;
for (const r of riskRows) riskBody += tbl(r.slice(2).map(row3).join('')) + empty;
riskBody += tbl(row3(['Ende', 'der', 'Herr'])) + p('Hinweise zum Kurs');
const riskDoc = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="${W}" xmlns:r="${R}"><w:body>${riskBody}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1417" w:right="1417" w:bottom="1134" w:left="1417" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr></w:body></w:document>`;
const z2 = new JSZip();
z2.file('[Content_Types].xml', files['[Content_Types].xml'].replace(/<Override PartName="\/word\/header1.xml"[^>]*\/>/, ''), { date: FIXED, createFolders: false });
z2.file('_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>', { date: FIXED, createFolders: false });
z2.file('word/document.xml', riskDoc, { date: FIXED, createFolders: false });
const riskOut = out.replace(/kurse\.docx$/, 'a2-risiko.docx');
fs.writeFileSync(riskOut, await z2.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }));
// TXT- und CSV-Fassung
const plainText = (xml) => [...xml.matchAll(/<w:p(?: [^>]*)?>([\s\S]*?)<\/w:p>|<w:p\/>/g)].map((m) => (m[1] ? [...m[1].matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map((x) => x[1]).join('') : ''));
const txtLines = ['Risiko-Test Anrede allein'];
for (const [, , xml] of RISK) txtLines.push(...plainText(xml).map((x) => x.replace(/&amp;/g, '&')), '');
txtLines.push('Herr', 'Tesfamariam', '');
fs.writeFileSync(riskOut.replace(/docx$/, 'txt'), txtLines.join('\n'));
fs.writeFileSync(riskOut.replace(/docx$/, 'csv'), ['Anrede;Name;Fach', 'Herr;Tesfamariam;Garten', 'Frau;Chemie;Raum 12', 'Herr;;Kirchbichler', 'Frau;12.01.2026;Kurs', 'Herr;Lübeck;Ort', ...D_NAMES.map((n, i) => `${i % 2 ? 'Frau' : 'Herr'};${n};Kurs`)].join('\r\n') + '\r\n');
console.log('geschrieben', riskOut, '+ .txt + .csv');

// ---------- Übertragungs-Test (Entscheidung E): "unsicher" markiertes Wort nach Anrede an allen Stellen ----------
// Hartung und Tannheim: unbekannte Einzelwörter nach allein stehender Anrede -> "unsicher, an", überall übertragen.
// Kubik: steht in der Namensliste -> "sicher" (Kontrolle). Lindqvist: Name OHNE Anrede-allein (Kontrolle, darf sich nicht ändern).
// Mathematik, Turnhalle, Sekretariat, Aula: Gegenprobe (Sachwörter, müssen "unsicher, an" sein und sich abschalten lassen).
export const UEB_BODY = [
  'Übertragungs-Test Anrede allein', ['Herr', 'Hartung'], ['Frau', 'Tannheim'], ['Herr', 'Kubik'],
  'Später rief Hartung an. Tannheim war verhindert.', 'Hartungs Antrag und Tannheims Brief liegen vor.', 'Unterschrift: HARTUNG',
  'Kubik kommt auch.', ['Frau', 'Mathematik'], ['Herr', 'Turnhalle'], ['Frau', 'Sekretariat'], ['Herr', 'Aula'],
  'Mathematik ist Pflicht. Treffpunkt ist die Turnhalle, danach das Sekretariat und die Aula.',
  'Petra Lindqvist leitet den Kurs. Lindqvist ist erreichbar.',
];
{
  const flat = UEB_BODY.flat();
  const bodyU = flat.map((t, i) => (t.startsWith('Später') ? `<w:p><w:r><w:t xml:space="preserve">${esc(t)}</w:t></w:r><w:r><w:rPr><w:rStyle w:val="FootnoteReference"/></w:rPr><w:footnoteReference w:id="1"/></w:r></w:p>` : p(t))).join('');
  const docU = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="${W}" xmlns:r="${R}"><w:body>${bodyU}<w:sectPr><w:headerReference w:type="default" r:id="rIdH1"/><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1417" w:right="1417" w:bottom="1134" w:left="1417" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr></w:body></w:document>`;
  const hdrU = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:hdr xmlns:w="${W}" xmlns:r="${R}">${p('Ansprechpartner: Hartung')}</w:hdr>`;
  const fnU = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:footnotes xmlns:w="${W}" xmlns:r="${R}"><w:footnote w:type="separator" w:id="-1"><w:p><w:r><w:separator/></w:r></w:p></w:footnote><w:footnote w:type="continuationSeparator" w:id="0"><w:p><w:r><w:continuationSeparator/></w:r></w:p></w:footnote><w:footnote w:id="1"><w:p><w:r><w:rPr><w:rStyle w:val="FootnoteReference"/></w:rPr><w:footnoteRef/></w:r><w:r><w:t xml:space="preserve"> Laut Hartung gilt der Plan ab sofort.</w:t></w:r></w:p></w:footnote></w:footnotes>`;
  const z3 = new JSZip();
  const opt = { date: FIXED, createFolders: false };
  z3.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/><Override PartName="/word/footnotes.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footnotes+xml"/></Types>`, opt);
  z3.file('_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>', opt);
  z3.file('word/_rels/document.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdH1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header1.xml"/><Relationship Id="rIdFn" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footnotes" Target="footnotes.xml"/></Relationships>`, opt);
  z3.file('word/document.xml', docU, opt);
  z3.file('word/header1.xml', hdrU, opt);
  z3.file('word/footnotes.xml', fnU, opt);
  const uOut = out.replace(/kurse\.docx$/, 'a2-uebertragung.docx');
  fs.writeFileSync(uOut, await z3.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }));
  fs.writeFileSync(uOut.replace(/docx$/, 'txt'), ['Ansprechpartner: Hartung', ...flat, 'Laut Hartung gilt der Plan ab sofort.'].join('\n') + '\n');
  fs.writeFileSync(uOut.replace(/docx$/, 'csv'), ['Anrede;Name;Notiz', 'Herr;Hartung;Kurs', 'Frau;Tannheim;Kurs', 'Herr;Kubik;Kurs', 'Frau;Mathematik;Raum 3', 'Herr;Turnhalle;Raum 4',
    'Frau;Sekretariat;Raum 5', 'Herr;Aula;Raum 6', 'Notiz;Später rief Hartung an;Tannheim war verhindert', 'Notiz;Hartungs Antrag;Tannheims Brief',
    'Notiz;HARTUNG;Kubik kommt auch', 'Notiz;Mathematik ist Pflicht;Turnhalle, Sekretariat, Aula', 'Notiz;Petra Lindqvist;Lindqvist ist erreichbar'].join('\r\n') + '\r\n');
  console.log('geschrieben', uOut, '+ .txt + .csv');
}
