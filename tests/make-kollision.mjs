// Testdokumente zu Platzhalter-Kollisionen (Version 2.3.4). Alle Personen erfunden.
// - kollision.(txt|docx|csv): Im Original stehen wörtlich Platzhalter, die das Tool im selben Dokument auch selbst
//   vergeben würde („Nachname A“, „Vorname B“, „Einrichtung A“, „Person A“, „[NAME]“, „[E-MAIL-1]“, „Name A“).
// - kollision-name.txt: dasselbe, Person A ist ein von Hand markiertes Einzelwort (Platzhalter „Name A“).
// - ziffern.(txt|docx|csv|xlsx): Namen mit Ziffern direkt dahinter („Müller2“, „Yılmaz12“), dazu eine echte zweite
//   Schreibweise („Mueller“), GROSS-Form und Endung.
// Aufruf: node tests/make-kollision.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import JSZip from 'jszip';

const here = path.dirname(fileURLToPath(import.meta.url));
const fx = path.join(here, 'fixtures');
const ZO = { date: new Date(Date.UTC(2026, 0, 1, 12, 0, 0)), createFolders: false };
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const ORG = 'Lindenauer Bürgerverein';
export const KOLLISION = [
  'Frau Helga Müller und Herr Jan Kowalski kommen. Kontakt: helga.mueller@example.org.',
  'Der Lindenauer Bürgerverein lädt ein.',
  'Im Formular stehen die Felder Nachname A, Vorname B und Name A.',
  'Die Einrichtung A ist ein Beispiel, Person A eine Spielfigur.',
  'Vorlage: [NAME] schreibt an [E-MAIL-1].',
  'Frau Müller bestätigt den Termin.',
];
// Wörter im Original, die wie Platzhalter aussehen (für die Auswertung)
export const ORIG_WORDS = ['Nachname A', 'Vorname B', 'Name A', 'Einrichtung A', 'Person A', '[NAME]', '[E-MAIL-1]'];
export const MANUAL_NAME = 'Quabbe';
export const KOLLISION_NAME = [
  'Quabbe hat angerufen.',
  'Frau Helga Müller kommt später.',
  'Im Formular stehen die Felder Name A, Nachname B und Vorname B.',
  'Quabbe ruft morgen wieder an.',
];
export const ZIFFERN = [
  'Frau Helga Müller und Herr Can Yılmaz kommen.',
  'Kürzel: Müller2 und Yılmaz12, außerdem MÜLLER3.',
  'Schreibweise: Mueller hat unterschrieben.',
  'Großbuchstaben: MÜLLER und MÜLLERS Akte, Müllers Akte.',
  'Liste: Müller2, Müller22; Yılmaz12 und Yılmaz1.',
];

const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
async function docx(lines) {
  const z = new JSZip();
  z.file('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>', ZO);
  z.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${R}/officeDocument" Target="word/document.xml"/></Relationships>`, ZO);
  z.file('word/document.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:document xmlns:w="${W}"><w:body>${lines.map((t) => `<w:p><w:r><w:t xml:space="preserve">${esc(t)}</w:t></w:r></w:p>`).join('')}<w:sectPr/></w:body></w:document>`, ZO);
  return z.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
}
async function xlsx(lines) {
  const S = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
  const rows = lines.map((t, i) => `<row r="${i + 1}"><c r="A${i + 1}" t="inlineStr"><is><t xml:space="preserve">${esc(t)}</t></is></c></row>`).join('');
  const z = new JSZip();
  z.file('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>', ZO);
  z.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${R}/officeDocument" Target="xl/workbook.xml"/></Relationships>`, ZO);
  z.file('xl/workbook.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<workbook xmlns="${S}" xmlns:r="${R}"><sheets><sheet name="Liste" sheetId="1" r:id="rId1"/></sheets></workbook>`, ZO);
  z.file('xl/_rels/workbook.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${R}/worksheet" Target="worksheets/sheet1.xml"/></Relationships>`, ZO);
  z.file('xl/worksheets/sheet1.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<worksheet xmlns="${S}" xmlns:r="${R}"><sheetData>${rows}</sheetData></worksheet>`, ZO);
  return z.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
}
const csv = (L) => ['Nr;Text', ...L.map((t, i) => `${i + 1};"${t.replace(/"/g, '""')}"`)].join('\r\n') + '\r\n';

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const w = [];
  const put = (n, d) => { fs.writeFileSync(path.join(fx, n), d); w.push(n); };
  put('kollision.txt', KOLLISION.join('\n') + '\n');
  put('kollision.csv', csv(KOLLISION));
  put('kollision.docx', await docx(KOLLISION));
  put('kollision-name.txt', KOLLISION_NAME.join('\n') + '\n');
  put('ziffern.txt', ZIFFERN.join('\n') + '\n');
  put('ziffern.csv', csv(ZIFFERN));
  put('ziffern.docx', await docx(ZIFFERN));
  put('ziffern.xlsx', await xlsx(ZIFFERN));
  console.log('geschrieben: ' + w.join(', '));
}
