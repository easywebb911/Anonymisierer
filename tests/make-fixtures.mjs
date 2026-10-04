// Erzeugt erfundene Testdokumente in tests/fixtures/ (txt, csv, docx, xlsx, pdf, gescanntes pdf, doc, xls).
// Aufruf: node tests/make-fixtures.mjs   (benötigt LibreOffice für PDF/DOC/XLS)
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import JSZip from 'jszip';
import { PROTOCOL, plain } from './fixtures-src.mjs';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');
fs.mkdirSync(dir, { recursive: true });
const FIXED = new Date(Date.UTC(2024, 2, 12, 9, 0, 0));
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const zipOut = async (files, name) => {
  const z = new JSZip();
  for (const [n, c] of Object.entries(files)) z.file(n, c, { date: FIXED });
  fs.writeFileSync(path.join(dir, name), await z.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }));
};

// ---------- TXT ----------
fs.writeFileSync(path.join(dir, 'protokoll.txt'), plain(PROTOCOL));

// ---------- CSV ----------
const csvRows = [
  ['Vorname', 'Nachname', 'Abteilung', 'E-Mail', 'Bemerkung'],
  ['Anna', 'Müller', 'Leitung', 'anna.mueller@beispiel-firma.de', 'Vertretung: Herr Kowalczyk'],
  ['Mehmet', 'Yılmaz', 'Einkauf', 'm.yilmaz@beispiel-firma.de', 'Rückruf bei Frau Öztürk; "dringend"'],
  ['Agnieszka', 'Wiśniewska', 'Vertrieb', '', 'Elternzeit ab Mai'],
  ['Nguyễn Văn', 'Thành', 'IT', '', 'Schulung mit Trần Thị Mai'],
  ['Chukwuemeka', 'Okonkwo', 'Logistik', '', 'arbeitet mit Oluwaseun Adebayo; Telefon 0171 2345678'],
  ['María José', 'García López', 'Recht', '', 'Akte Fernández, Alejandro'],
  ['Dmitri', 'Iwanow', 'Lager', '', 'im Winter im Außendienst'],
  ['Rose', 'Schmidt', 'Kantine', '', 'Die Rose auf dem Tisch ist Deko'],
  ['Fatima', 'Haddad', 'Personal', '', 'Ansprechpartnerin für Herrn Al-Hassan'],
  ['Zbigniew', 'Brzęczyszczykiewicz', 'Technik', '', 'neu im Team'],
];
const csvCell = (c) => (/[;"\n]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c);
fs.writeFileSync(path.join(dir, 'mitarbeiter.csv'), csvRows.map((r) => r.map(csvCell).join(';')).join('\r\n') + '\r\n');

// ---------- DOCX ----------
const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
// Absatz aus Markertext: Namen werden auf zwei Läufe (Runs) mit unterschiedlicher Formatierung verteilt
function para(markerLine) {
  let out = '<w:p>';
  let last = 0;
  const re = /\{\{([^|}]+)\|([^}]+)\}\}|\[\[([^\]]+)\]\]/g;
  for (const m of markerLine.matchAll(re)) {
    if (m.index > last) out += `<w:r><w:t xml:space="preserve">${esc(markerLine.slice(last, m.index))}</w:t></w:r>`;
    const t = m[2] || m[3];
    if (m[2] && t.length > 3 && !/^\d/.test(m[1]) === false) {
      const mid = Math.ceil(t.length / 2);
      out += `<w:r><w:t xml:space="preserve">${esc(t.slice(0, mid))}</w:t></w:r><w:r><w:rPr><w:b/></w:rPr><w:t xml:space="preserve">${esc(t.slice(mid))}</w:t></w:r>`;
    } else out += `<w:r><w:t xml:space="preserve">${esc(t)}</w:t></w:r>`;
    last = m.index + m[0].length;
  }
  if (last < markerLine.length) out += `<w:r><w:t xml:space="preserve">${esc(markerLine.slice(last))}</w:t></w:r>`;
  return out + '</w:p>';
}
const lines = PROTOCOL.split('\n');
let body = lines.map((l) => (l.trim() ? para(l) : '<w:p/>')).join('');
// Fußnote, Kommentar, Änderungsverfolgung, Textfeld, Tabelle, Hyperlink
body += `<w:p><w:r><w:t xml:space="preserve">Vermerk siehe Fußnote.</w:t></w:r><w:r><w:rPr><w:vertAlign w:val="superscript"/></w:rPr><w:footnoteReference w:id="2"/></w:r></w:p>`;
body += `<w:p><w:commentRangeStart w:id="0"/><w:r><w:t xml:space="preserve">Diese Zeile hat einen Kommentar.</w:t></w:r><w:commentRangeEnd w:id="0"/><w:r><w:commentReference w:id="0"/></w:r></w:p>`;
body += `<w:p><w:r><w:t xml:space="preserve">Protokollführung: </w:t></w:r><w:del w:id="10" w:author="Bernd Bearbeiter" w:date="2024-03-12T10:00:00Z"><w:r><w:delText>Fatima Haddad</w:delText></w:r></w:del><w:ins w:id="11" w:author="Bernd Bearbeiter" w:date="2024-03-12T10:00:00Z"><w:r><w:t>Oluwaseun Adebayo</w:t></w:r></w:ins></w:p>`;
body += `<w:p><w:r><w:pict><v:shape id="tb1" type="#_x0000_t202" style="width:260pt;height:40pt" xmlns:v="urn:schemas-microsoft-com:vml"><v:textbox><w:txbxContent><w:p><w:r><w:t xml:space="preserve">Ansprechpartnerin im Textfeld: Trần Thị Mai</w:t></w:r></w:p></w:txbxContent></v:textbox></v:shape></w:pict></w:r></w:p>`;
const cell = (t) => `<w:tc><w:tcPr><w:tcW w:w="3000" w:type="dxa"/></w:tcPr><w:p><w:r><w:t xml:space="preserve">${esc(t)}</w:t></w:r></w:p></w:tc>`;
body += `<w:tbl><w:tblPr><w:tblW w:w="9000" w:type="dxa"/><w:tblBorders><w:top w:val="single" w:sz="4"/><w:bottom w:val="single" w:sz="4"/><w:insideH w:val="single" w:sz="4"/></w:tblBorders></w:tblPr><w:tblGrid><w:gridCol w:w="3000"/><w:gridCol w:w="3000"/><w:gridCol w:w="3000"/></w:tblGrid>`
  + `<w:tr>${cell('Name')}${cell('Rolle')}${cell('Bemerkung')}</w:tr>`
  + `<w:tr>${cell('Ngozi Eze')}${cell('Kasse')}${cell('Vertretung durch Frau Haddad')}</w:tr>`
  + `<w:tr>${cell('Swetlana Kusnezowa')}${cell('Lager')}${cell('im Sommer in Elternzeit')}</w:tr></w:tbl>`;
body += `<w:p><w:hyperlink r:id="rIdMail"><w:r><w:t>E-Mail an das Sekretariat</w:t></w:r></w:hyperlink></w:p>`;
const docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="${W}" xmlns:r="${R}" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office"><w:body>${body}<w:sectPr><w:headerReference w:type="default" r:id="rIdH1"/><w:footerReference w:type="default" r:id="rIdF1"/><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1417" w:right="1417" w:bottom="1134" w:left="1417" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr></w:body></w:document>`;
await zipOut({
  '[Content_Types].xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/><Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/><Override PartName="/word/footnotes.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footnotes+xml"/><Override PartName="/word/comments.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.comments+xml"/><Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/><Override PartName="/word/people.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.people+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/><Override PartName="/docProps/custom.xml" ContentType="application/vnd.openxmlformats-officedocument.custom-properties+xml"/></Types>`,
  '_rels/.rels': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/><Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/custom-properties" Target="docProps/custom.xml"/></Relationships>`,
  'word/_rels/document.xml.rels': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdH1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header1.xml"/><Relationship Id="rIdF1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/><Relationship Id="rIdFn" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footnotes" Target="footnotes.xml"/><Relationship Id="rIdC" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/comments" Target="comments.xml"/><Relationship Id="rIdS" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/><Relationship Id="rIdP" Type="http://schemas.microsoft.com/office/2011/relationships/people" Target="people.xml"/><Relationship Id="rIdMail" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="mailto:anna.mueller@beispiel-firma.de" TargetMode="External"/></Relationships>`,
  'word/_rels/settings.xml.rels': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdT" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/attachedTemplate" Target="file:///C:\\Users\\gpruefer\\Vorlagen\\Brief.dotx" TargetMode="External"/></Relationships>`,
  'word/document.xml': docXml,
  'word/header1.xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:hdr xmlns:w="${W}"><w:p><w:r><w:t xml:space="preserve">Vertraulich – erstellt von Anna Müller</w:t></w:r></w:p></w:hdr>`,
  'word/footer1.xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:ftr xmlns:w="${W}"><w:p><w:r><w:t xml:space="preserve">Verteiler: Mehmet Yılmaz, </w:t></w:r><w:r><w:t xml:space="preserve">Ayşe Öz</w:t></w:r><w:r><w:t>türk</w:t></w:r></w:p></w:ftr>`,
  'word/footnotes.xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:footnotes xmlns:w="${W}"><w:footnote w:type="separator" w:id="-1"><w:p><w:r><w:separator/></w:r></w:p></w:footnote><w:footnote w:type="continuationSeparator" w:id="0"><w:p><w:r><w:continuationSeparator/></w:r></w:p></w:footnote><w:footnote w:id="2"><w:p><w:r><w:rPr><w:vertAlign w:val="superscript"/></w:rPr><w:footnoteRef/></w:r><w:r><w:t xml:space="preserve"> Siehe Vermerk von Krzysztof Kowalczyk vom 1. März.</w:t></w:r></w:p></w:footnote></w:footnotes>`,
  'word/comments.xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:comments xmlns:w="${W}"><w:comment w:id="0" w:author="Gisela Prüferin" w:date="2024-03-12T09:30:00Z" w:initials="GP"><w:p><w:r><w:t xml:space="preserve">Bitte mit Ayşe Öztürk und Herrn Okonkwo klären.</w:t></w:r></w:p></w:comment></w:comments>`,
  'word/settings.xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:settings xmlns:w="${W}" xmlns:r="${R}"><w:attachedTemplate r:id="rIdT"/><w:trackRevisions/><w:defaultTabStop w:val="708"/></w:settings>`,
  'word/people.xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w15:people xmlns:w15="http://schemas.microsoft.com/office/word/2012/wordml"><w15:person w15:author="Gisela Prüferin"><w15:presenceInfo w15:providerId="AD" w15:userId="gisela.prueferin@beispiel-firma.de"/></w15:person></w15:people>`,
  'docProps/core.xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>Protokoll Team Müller</dc:title><dc:subject>Personalsachen</dc:subject><dc:creator>Gisela Prüferin</dc:creator><cp:keywords>Yılmaz, Kowalczyk</cp:keywords><cp:lastModifiedBy>Bernd Bearbeiter</cp:lastModifiedBy><cp:revision>3</cp:revision><dcterms:created xsi:type="dcterms:W3CDTF">2024-03-12T09:00:00Z</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">2024-03-12T10:00:00Z</dcterms:modified></cp:coreProperties>`,
  'docProps/app.xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>Microsoft Office Word</Application><Company>Beispiel GmbH</Company><Manager>Hanna Chefin</Manager></Properties>`,
  'docProps/custom.xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/custom-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><property fmtid="{D5CDD505-2E9C-101B-9397-08002B2CF9AE}" pid="2" name="Sachbearbeiter"><vt:lpwstr>Gisela Prüferin</vt:lpwstr></property></Properties>`,
}, 'protokoll.docx');

// ---------- XLSX ----------
const S = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
const strings = [];
const si = (t) => { strings.push(`<si><t xml:space="preserve">${esc(t)}</t></si>`); return strings.length - 1; };
const siRich = (parts) => { strings.push('<si>' + parts.map(([t, b]) => `<r>${b ? '<rPr><b/></rPr>' : ''}<t xml:space="preserve">${esc(t)}</t></r>`).join('') + '</si>'); return strings.length - 1; };
const sc = (ref, t) => `<c r="${ref}" t="s"><v>${si(t)}</v></c>`;
const rows1 = [
  ['Vorname', 'Nachname', 'Abteilung', 'Bemerkung'],
  ['Anna', 'Müller', 'Leitung', 'Vertretung: Herr Kowalczyk'],
  ['Mehmet', 'Yılmaz', 'Einkauf', null],
  ['Agnieszka', 'Wiśniewska', 'Vertrieb', 'Elternzeit'],
  ['Chukwuemeka', 'Okonkwo', 'Logistik', 'mit Oluwaseun Adebayo'],
  ['Dmitri', 'Iwanow', 'Lager', 'im Winter Außendienst'],
  ['Fatima', 'Haddad', 'Personal', 'für Herrn Al-Hassan'],
  ['Nguyễn Văn', 'Thành', 'IT', 'Schulung: Trần Thị Mai'],
  ['Rose', 'Schmidt', 'Kantine', 'eine Rose als Deko'],
];
let sheet1 = '';
rows1.forEach((r, ri) => {
  const rn = ri + 1;
  sheet1 += `<row r="${rn}">` + r.map((v, ci) => {
    const ref = String.fromCharCode(65 + ci) + rn;
    if (v === null) return `<c r="${ref}" t="inlineStr"><is><t>Rückruf bei Frau Öztürk</t></is></c>`;
    return sc(ref, v);
  }).join('');
  if (rn === 1) sheet1 += sc('E1', 'Formel');
  if (rn === 2) sheet1 += `<c r="E2" t="str"><f>"Ansprechpartner: "&amp;"Herr Kowalczyk"</f><v>Ansprechpartner: Herr Kowalczyk</v></c>`;
  if (rn === 3) sheet1 += `<c r="E3" t="str"><f>'Yılmaz'!A1</f><v>Notizen zu Mehmet Yılmaz</v></c>`;
  if (rn === 4) sheet1 += `<c r="E4"><f>LEN(B4)</f><v>10</v></c>`;
  sheet1 += '</row>';
});
sheet1 += `<row r="11"><c r="A11" t="s"><v>${siRich([['Leitung: ', false], ['Anna Mü', true], ['ller', false]])}</v></c></row>`;
const sheetXml = (data, extra = '') => `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="${S}" xmlns:r="${R}"><sheetData>${data}</sheetData>${extra}</worksheet>`;
const sheet2 = `<row r="1">${sc('A1', 'Notizen zu Mehmet Yılmaz')}</row><row r="2">${sc('A2', 'Gespräch mit Swetlana Kusnezowa am 3. Mai')}</row>`;
const sheet3 = `<row r="1">${sc('A1', 'Die Reise nach Paris im Winter')}</row><row r="2">${sc('A2', 'Ansprechpartnerin: Rose Schmidt')}</row><row r="3">${sc('A3', 'Frau Dr. von Bodelschwingh hat zugestimmt.')}</row>`;
await zipOut({
  '[Content_Types].xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="vml" ContentType="application/vnd.openxmlformats-officedocument.vmlDrawing"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/worksheets/sheet3.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/><Override PartName="/xl/comments1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.comments+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>`,
  '_rels/.rels': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>`,
  'xl/workbook.xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="${S}" xmlns:r="${R}"><sheets><sheet name="Mitarbeiter" sheetId="1" r:id="rId1"/><sheet name="Yılmaz" sheetId="2" state="hidden" r:id="rId2"/><sheet name="Notizen" sheetId="3" r:id="rId3"/></sheets><definedNames><definedName name="NotizBlatt">'Yılmaz'!$A$1</definedName></definedNames></workbook>`,
  'xl/_rels/workbook.xml.rels': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet3.xml"/><Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/><Relationship Id="rId5" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
  'xl/worksheets/sheet1.xml': sheetXml(sheet1, '<headerFooter><oddHeader>&amp;LListe von Anna Müller&amp;RSeite &amp;P</oddHeader><oddFooter>&amp;CErstellt: Fatima Haddad</oddFooter></headerFooter><legacyDrawing r:id="rIdV"/>'),
  'xl/worksheets/_rels/sheet1.xml.rels': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdC" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/comments" Target="../comments1.xml"/><Relationship Id="rIdV" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/vmlDrawing" Target="../drawings/vmlDrawing1.vml"/></Relationships>`,
  'xl/worksheets/sheet2.xml': sheetXml(sheet2),
  'xl/worksheets/sheet3.xml': sheetXml(sheet3),
  'xl/sharedStrings.xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<sst xmlns="${S}" count="${strings.length}" uniqueCount="${strings.length}">${strings.join('')}</sst>`,
  'xl/styles.xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="${S}"><fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/></cellXfs></styleSheet>`,
  'xl/comments1.xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<comments xmlns="${S}"><authors><author>Gisela Prüferin</author></authors><commentList><comment ref="B2" authorId="0"><text><r><t xml:space="preserve">Gisela Prüferin: Prüfen mit Ngozi Eze</t></r></text></comment></commentList></comments>`,
  'xl/drawings/vmlDrawing1.vml': `<xml xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><v:shapetype id="_x0000_t202" coordsize="21600,21600" o:spt="202" path="m,l,21600r21600,l21600,xe"><v:stroke joinstyle="miter"/><v:path gradientshapeok="t" o:connecttype="rect"/></v:shapetype><v:shape id="_x0000_s1025" type="#_x0000_t202" style="position:absolute;margin-left:100pt;margin-top:10pt;width:120pt;height:50pt;z-index:1;visibility:hidden" fillcolor="#ffffe1"><v:textbox/><x:ClientData ObjectType="Note"><x:MoveWithCells/><x:SizeWithCells/><x:AutoFill>False</x:AutoFill><x:Row>1</x:Row><x:Column>1</x:Column></x:ClientData></v:shape></xml>`,
  'docProps/core.xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:creator>Gisela Prüferin</dc:creator><cp:lastModifiedBy>Bernd Bearbeiter</cp:lastModifiedBy><dcterms:created xsi:type="dcterms:W3CDTF">2024-03-12T09:00:00Z</dcterms:created></cp:coreProperties>`,
  'docProps/app.xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Application>Microsoft Excel</Application><Company>Beispiel GmbH</Company><TitlesOfParts><vt:vector size="3" baseType="lpstr"><vt:lpstr>Mitarbeiter</vt:lpstr><vt:lpstr>Yılmaz</vt:lpstr><vt:lpstr>Notizen</vt:lpstr></vt:vector></TitlesOfParts></Properties>`,
}, 'mitarbeiter.xlsx');

// ---------- PDF (über LibreOffice aus der DOCX), .doc und .xls ----------
const tmp = fs.mkdtempSync(path.join(dir, '.tmp-'));
const lo = (args) => execFileSync('soffice', ['--headless', '-env:UserInstallation=file://' + tmp + '/lo', ...args], { stdio: 'pipe' });
lo(['--convert-to', 'pdf', '--outdir', tmp, path.join(dir, 'protokoll.docx')]);
fs.renameSync(path.join(tmp, 'protokoll.pdf'), path.join(dir, 'protokoll.pdf'));
lo(['--convert-to', 'doc', '--outdir', tmp, path.join(dir, 'protokoll.docx')]);
fs.renameSync(path.join(tmp, 'protokoll.doc'), path.join(dir, 'alt-format.doc'));
lo(['--convert-to', 'xls', '--outdir', tmp, path.join(dir, 'mitarbeiter.xlsx')]);
fs.renameSync(path.join(tmp, 'mitarbeiter.xls'), path.join(dir, 'alt-format.xls'));
fs.rmSync(tmp, { recursive: true, force: true });

// ---------- "Gescanntes" PDF: nur ein Bild, keine Textebene ----------
{
  const w = 200;
  const hgt = 100;
  const px = Buffer.alloc(w * hgt);
  for (let y = 0; y < hgt; y++) for (let x = 0; x < w; x++) px[y * w + x] = ((x >> 3) + (y >> 3)) % 2 ? 230 : 40;
  const img = zlib.deflateSync(px);
  const objs = [];
  objs.push('<< /Type /Catalog /Pages 2 0 R >>');
  objs.push('<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
  objs.push('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /XObject << /Im1 4 0 R >> >> /Contents 5 0 R >>');
  objs.push(null); // Bild
  const content = 'q 400 0 0 200 100 500 cm /Im1 Do Q';
  objs.push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
  const parts = [Buffer.from('%PDF-1.4\n%\xe2\xe3\xcf\xd3\n', 'latin1')];
  const offsets = [];
  let pos = parts[0].length;
  objs.forEach((o, i) => {
    offsets.push(pos);
    let buf;
    if (o === null) {
      buf = Buffer.concat([Buffer.from(`${i + 1} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${w} /Height ${hgt} /ColorSpace /DeviceGray /BitsPerComponent 8 /Filter /FlateDecode /Length ${img.length} >>\nstream\n`, 'latin1'), img, Buffer.from('\nendstream\nendobj\n', 'latin1')]);
    } else buf = Buffer.from(`${i + 1} 0 obj\n${o}\nendobj\n`, 'latin1');
    parts.push(buf);
    pos += buf.length;
  });
  let xref = `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
  for (const o of offsets) xref += String(o).padStart(10, '0') + ' 00000 n \n';
  parts.push(Buffer.from(xref + `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${pos}\n%%EOF\n`, 'latin1'));
  fs.writeFileSync(path.join(dir, 'gescannt.pdf'), Buffer.concat(parts));
}
console.log('Fixtures:', fs.readdirSync(dir).filter((f) => !f.startsWith('.')).join(', '));
