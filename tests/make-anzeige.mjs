// Testdokumente für Version 2.6.1 (Anzeige beim Prüfen): Fragen auf mehreren Excel-Blättern (auch ausgeblendet) und in
// einer breiten Tabelle, dazu ein langer Text (Rollen senkrecht). Keine echten Namen; Fragen entstehen an gewöhnlichen
// Wörtern der Liste „mehrdeutig“ („Lieder“, „Yoga“, „Ton“).
// Aufruf: node tests/make-anzeige.mjs   (-> tests/fixtures-anzeige/)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import JSZip from 'jszip';

const here = path.dirname(fileURLToPath(import.meta.url));
export const FXA = path.join(here, 'fixtures-anzeige');
const ZO = { date: new Date(Date.UTC(2026, 0, 1, 12)), createFolders: false };
const X = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
const R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const S = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const col = (i) => (i < 26 ? String.fromCharCode(65 + i) : 'A' + String.fromCharCode(39 + i));

// Blatt 1 „Kurse“: breit (20 Spalten) und lang (40 Zeilen); die Frage steht ganz rechts unten
const wide = [Array.from({ length: 20 }, (_, i) => `Spalte ${i + 1}`)];
for (let r = 1; r < 40; r++) wide.push(Array.from({ length: 20 }, (_, i) => (i === 19 && r === 36 ? 'Wir singen Lieder aus aller Welt.' : `Wert ${r}-${i + 1}`)));
export const SHEETS = [
  { name: 'Kurse', rows: wide },
  { name: 'Notizen', rows: [['Notiz'], ['Yoga für Kinder beginnt im Mai.']] },
  { name: 'Archiv', state: 'hidden', rows: [['Archiv'], ['Mit Ton und Gips arbeiten.']] },
];
export const LANG = Array.from({ length: 160 }, (_, i) => (i === 4 ? 'Im Chor gilt: Wir singen Lieder aus aller Welt.' : i === 150 ? 'Neu im Programm ist Yoga für Kinder ab sechs Jahren.'
  : i === 80 ? 'Im Töpferkurs arbeiten wir mit Ton und Gips.' : `Zeile ${i + 1}: Die Sitzung beginnt pünktlich um neun Uhr.`));

export const FALLE = ['Frau Anna Rose leitet den Kurs.', 'Rose bringt Rosen mit.', 'Wir singen Lieder aus aller Welt.'];

export async function makeAll() {
  // Tempo: bei „npm run test:all“ schon einmal vorher erzeugt
  if (process.env.ANON_FIXTURES_FERTIG === '1') return;
  fs.rmSync(FXA, { recursive: true, force: true });
  fs.mkdirSync(FXA, { recursive: true });
  const ss = [];
  const si = (s) => { let i = ss.indexOf(s); if (i < 0) { ss.push(s); i = ss.length - 1; } return i; };
  const files = {
    '_rels/.rels': X + `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${R}/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
    'xl/workbook.xml': X + `<workbook xmlns="${S}" xmlns:r="${R}"><sheets>${SHEETS.map((s, i) => `<sheet name="${s.name}" sheetId="${i + 1}"${s.state ? ` state="${s.state}"` : ''} r:id="rId${i + 1}"/>`).join('')}</sheets></workbook>`,
    'xl/_rels/workbook.xml.rels': X + `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${SHEETS.map((s, i) => `<Relationship Id="rId${i + 1}" Type="${R}/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('')}<Relationship Id="rIdS" Type="${R}/sharedStrings" Target="sharedStrings.xml"/></Relationships>`,
  };
  SHEETS.forEach((s, i) => {
    const body = s.rows.map((r, ri) => `<row r="${ri + 1}">${r.map((v, ci) => `<c r="${col(ci)}${ri + 1}" t="s"><v>${si(v)}</v></c>`).join('')}</row>`).join('');
    files[`xl/worksheets/sheet${i + 1}.xml`] = X + `<worksheet xmlns="${S}"><sheetData>${body}</sheetData></worksheet>`;
  });
  files['xl/sharedStrings.xml'] = X + `<sst xmlns="${S}" count="${ss.length}" uniqueCount="${ss.length}">${ss.map((s) => `<si><t xml:space="preserve">${esc(s)}</t></si>`).join('')}</sst>`;
  files['[Content_Types].xml'] = X + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
    + SHEETS.map((s, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')
    + '<Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/></Types>';
  const z = new JSZip();
  for (const [n, c] of Object.entries(files)) z.file(n, c, ZO);
  fs.writeFileSync(path.join(FXA, 'mehrblatt.xlsx'), await z.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }));
  fs.writeFileSync(path.join(FXA, 'lang.txt'), LANG.join('\r\n') + '\r\n');
  // Falle 1: „Rose“ allein ist eine Wort-Frage; „Rosen“ (gebeugt) ist eine Stelle im Sachkontext und wird standardmäßig ersetzt
  fs.writeFileSync(path.join(FXA, 'falle.txt'), FALLE.join('\n') + '\n');
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await makeAll();
  console.log(fs.readdirSync(FXA).join('\n'));
}
