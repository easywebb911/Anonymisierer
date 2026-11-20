// Vertausch-Testpaar (Version 2.1): zwei Dokumente nach derselben Vorlage mit verschiedenen erfundenen Personen,
// jeweils als .docx, .xlsx, .txt und .csv. Nach dem Anonymisieren sehen beide Paare gleich aus („Vorname A
// Nachname A“ …); nur die Kennung unterscheidet die Schlüssel. Aufruf: node tests/make-kennung.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import JSZip from 'jszip';

const here = path.dirname(fileURLToPath(import.meta.url));
const fx = path.join(here, 'fixtures');
const FIXED = new Date(Date.UTC(2026, 0, 1, 12, 0, 0));
const ZO = { date: FIXED, createFolders: false };
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Alle Namen erfunden
export const PAIRS = {
  1: { v1: 'Mareike', n1: 'Lindholm', v2: 'Severin', n2: 'Achterberg' },
  2: { v1: 'Jolanda', n1: 'Brinkhaus', v2: 'Tilmann', n2: 'Overkamp' },
};
const lines = (p) => [
  'Gesprächsnotiz Beratung',
  `Teilnehmerin: Frau ${p.v1} ${p.n1}`,
  `${p.n1} berichtet über den Stand. Rückfragen an Herrn ${p.v2} ${p.n2}.`,
  `Nächster Termin mit Frau ${p.n1} und Herrn ${p.n2} im Frühjahr.`,
];

async function docx(p) {
  const body = lines(p).map((t) => `<w:p><w:r><w:t xml:space="preserve">${esc(t)}</w:t></w:r></w:p>`).join('');
  const z = new JSZip();
  z.file('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>', ZO);
  z.file('_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>', ZO);
  z.file('word/document.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}<w:sectPr/></w:body></w:document>`, ZO);
  return z.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
}
async function xlsx(p) {
  const cell = (r, t) => `<c r="${r}" t="inlineStr"><is><t xml:space="preserve">${esc(t)}</t></is></c>`;
  const rows = [['Rolle', 'Vorname', 'Nachname'], ['Teilnehmerin', p.v1, p.n1], ['Rückfragen', p.v2, p.n2]]
    .map((r, i) => `<row r="${i + 1}">${r.map((t, j) => cell('ABC'[j] + (i + 1), t)).join('')}</row>`).join('');
  const z = new JSZip();
  z.file('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>', ZO);
  z.file('_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>', ZO);
  z.file('xl/workbook.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Notiz" sheetId="1" r:id="rId1"/></sheets></workbook>', ZO);
  z.file('xl/_rels/workbook.xml.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>', ZO);
  z.file('xl/worksheets/sheet1.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${rows}</sheetData></worksheet>`, ZO);
  return z.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  for (const [n, p] of Object.entries(PAIRS)) {
    fs.writeFileSync(path.join(fx, `vertausch-${n}.docx`), await docx(p));
    fs.writeFileSync(path.join(fx, `vertausch-${n}.xlsx`), await xlsx(p));
    fs.writeFileSync(path.join(fx, `vertausch-${n}.txt`), lines(p).join('\n') + '\n');
    fs.writeFileSync(path.join(fx, `vertausch-${n}.csv`), ['Rolle;Vorname;Nachname', `Teilnehmerin;${p.v1};${p.n1}`, `Rückfragen;${p.v2};${p.n2}`].join('\r\n') + '\r\n');
  }
  console.log('geschrieben: tests/fixtures/vertausch-1/-2 (.docx, .xlsx, .txt, .csv)');
}
