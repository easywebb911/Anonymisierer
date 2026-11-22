// Testdokumente für Version 2.6.0 (Namensspalten, Anrede in der Nachbarzelle, Anrede am Zeilenende, „von“).
// Alle Namen erfunden. ⟦…⟧ kennzeichnet in den Quellen echte Personennamen (Wahrheit für die Tests) und wird entfernt.
// - brief.docx, liste.xlsx, protokoll.txt: die drei nachgebauten Testdateien aus der Diagnose (Easys Befunde)
// - protokoll-lf.txt: dasselbe Protokoll mit Unix-Zeilenenden; umbruch-risiko(-lf).txt: Risikofälle am Zeilenende
// - tabellen.xlsx / tabellen.docx / tabellen-<fall>.csv: dieselben Tabellenfälle in Excel, Word und CSV
// Aufruf: node tests/make-spalten.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import JSZip from 'jszip';

const here = path.dirname(fileURLToPath(import.meta.url));
export const FXS = path.join(here, 'fixtures-spalten');
const ZO = { date: new Date(Date.UTC(2026, 0, 1, 12)), createFolders: false };
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
export const strip = (s) => String(s).replace(/[⟦⟧]/g, '');
const X = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const S = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';

// ---------- Inhalte ----------
export const BRIEF = [
  { p: 'ANMELDUNG FÜR FRAU ⟦BRANDSTÄTTERS⟧ TÖPFERKURS', h: true },
  { p: 'Herrn ⟦Rüdiger Hallmayer⟧' },
  { p: 'Lindenweg 4' },
  { p: '12345 Musterstadt' },
  { p: 'Sehr geehrter Herr ⟦Hallmayer⟧,' },
  { p: 'vielen Dank für Ihre Anmeldung. ⟦Hallmayer⟧ steht damit als Erster auf der Liste. ⟦Rüdiger⟧ hat außerdem angeboten, die Getränke mitzubringen.' },
  { p: 'Im Chor für Erwachsene gilt: Wir singen Lieder aus aller Welt.' },
  { p: 'Neu im Programm ist Yoga für Kinder ab sechs Jahren.' },
  { p: 'Im Töpferkurs arbeiten wir im Winter mit Ton und Gips.' },
  { p: 'Bitte füllen Sie im Formular die Felder Nachname A und Vorname B aus.' },
  { p: 'Den Chor leitet Frau ⟦Winter⟧.' },
  { p: 'Beim Vortreffen waren Frau ⟦Papadakis⟧, Frau⏎⟦Sonnleitner⟧ und Herr⏎⟦Kirchbichler⟧ dabei.' },
  { table: [
    ['Kurs', 'Lehrkraft', 'Beschreibung', 'Start'],
    ['Töpfern', ['Frau', '⟦Brandstätter⟧'], 'Arbeiten mit Ton und Gips', '03.03.'],
    ['Chor', ['Herr', '⟦Vogel⟧'], 'Wir singen Lieder', '05.03.'],
    ['Malen', '⟦Trzaskalik⟧', 'Aquarell für Anfänger', '10.03.'],
    ['Yoga', '⟦Huckebein⟧', 'Yoga für Kinder', '12.03.'],
  ] },
  { p: 'Rückfragen bitte an ⟦Ingeborg Feldkämper⟧.' },
  { p: 'Mit freundlichen Grüßen' },
  { p: '⟦Ingeborg Feldkämper⟧' },
];
export const LISTE = [
  ['Nr.', 'Anrede', 'Nachname', 'Vorname', 'E-Mail', 'Telefon', 'Kurs', 'Termin', 'Bemerkung'],
  [1, 'Frau', '⟦Koch⟧', '⟦Sabine⟧', 's.koch@example.org', '0176 1234561', 'Yoga', 'Mo 18:00', ''],
  [2, 'Herr', '⟦Winter⟧', '⟦Lukas⟧', 'lukas.w@example.org', '0176 1234562', 'Chor', 'Mi 19:00', 'kommt erst im Winter dazu'],
  [3, 'Frau', '⟦Brzęczek⟧', '⟦Agnieszka⟧', '', '0176 1234563', 'Yoga', 'Mo 18:00', 'Abholung durch Frau ⟦Koch⟧'],
  [4, 'Herr', '⟦Papadakis⟧', '⟦Dimitrios⟧', '', '0176 1234564', 'Chor', 'Mi 19:00', ''],
  [5, 'Frau', '⟦Rose⟧', '⟦Hannelore⟧', '', '0176 1234565', 'Yoga', 'Mo 18:00', 'bringt Rosen mit'],
  [6, 'Frau', '⟦Winter⟧', '⟦Lena⟧', '', '', 'Chor', 'Mi 19:00', ''],
  [7, 'Herr', '⟦Vogel⟧', '⟦Bernd⟧', '', '0176 1234567', 'Yoga', 'Mo 18:00', ''],
  [8, 'Frau', '⟦Nguyen⟧', '⟦Thi Lan⟧', '', '', 'Chor', 'Mi 19:00', ''],
  [9, 'Frau', '⟦Kirchbichler⟧', '⟦Magdalena⟧', '', '0176 1234569', 'Yoga', 'Mo 18:00', 'Schwester von ⟦Lena Winter⟧'],
  [10, 'Herr', '⟦Szymański⟧', '⟦Tomasz⟧', '', '0176 1234560', 'Chor', 'Mi 19:00', 'Abholung durch Frau ⟦Brzęczek⟧'],
];
export const PROTOKOLL = [
  'Protokoll der Elternversammlung vom 12.03.',
  'Anwesend: Herr ⟦Hallmayer⟧, Frau ⟦Rose⟧, Frau ⟦Papadakis⟧, Frau',
  '⟦Sonnleitner⟧, Herr',
  '⟦Kirchbichler⟧, Frau ⟦Winter⟧ und Herr ⟦Vogel⟧.',
  'TOP 1: Der Chor probt im Winter in der Aula. Wir singen Lieder aus aller Welt.',
  'TOP 2: Yoga für Kinder beginnt im Mai.',
  '⟦Hallmayer⟧ berichtet über die Kasse.',
  'Frau ⟦Rose⟧ bringt Rosen mit.',
  'Einzelheiten siehe Protokoll von ⟦Kirchbichler⟧.',
  'Nächste Sitzung: Montag, 14.04.',
  'Protokoll: ⟦Sonnleitner⟧',
];
// Risikofälle „Anrede am Zeilenende“; erwartet je Zeilenanfang (Diagnose, Variante „eng“): 'S+' sicher, 'U+' unsicher an
// (Frage), '' kein Treffer, 'alt' = wie in Version 2.5.0 (die neue Regel greift nicht)
export const RISIKO = [
  ['Zum Schluss sprach der Herr', 'Pfarrer ein paar Worte.', 'Pfarrer', 'alt'],
  ['Es meldete sich Herr', 'Danach wurde abgestimmt.', 'Danach', 'U+'],
  ['Bitte wenden Sie sich an Frau', 'Termine werden noch bekannt gegeben.', 'Termine', 'alt'],
  ['Zuständig ist Herr', 'Mathematik wird verlegt.', 'Mathematik', 'U+'],
  ['Gesucht wird eine Frau', 'Für die Küche.', 'Für', ''],
  ['Es fehlte nur Frau', 'Gesundheit geht vor.', 'Gesundheit', 'U+'],
  ['Liebe Frau', 'Kollegen, bitte beachten.', 'Kollegen', 'U+'], // „Liebe“ ist kein Artikel -> Regel greift (als Frage)
  ['Termin bei Frau', 'Montag geht nicht.', 'Montag', 'alt'], // Wochentag zählt nicht (Regel b2 wie bisher)
  ['Gespräch mit Herrn Dr.', '⟦Okafor⟧ am Freitag.', 'Okafor', 'S+'],
];

// Tabellenfälle: Zeilen (Zellen; '' = leer; Zahl = Zahlenzelle). merges: [[Zeile, Spalte von, Spalte bis]]
// expect: Wort -> erwarteter Zustand ('S+' sicher an, 'U+' unsicher an, '' kein Treffer, 'alt' = wie in Version 2.5.0)
export const CASES = {
  stark: {
    title: 'Starkes Kopfwort, Titelzeilen darüber, Sachwort und Füllwerte',
    rows: [
      ['Teilnehmerliste Frühjahr'],
      [''],
      ['Nr.', 'Anrede', 'Nachname', 'Vorname', 'Kurs', 'Bemerkung'],
      [1, 'Frau', '⟦Koch⟧', '⟦Sabine⟧', 'Yoga', ''],
      [2, 'Herr', '⟦Winter⟧', '⟦Lukas⟧', 'Chor', 'kommt erst im Winter dazu'],
      [3, 'Frau', '⟦Winter⟧', '⟦Lena⟧', 'Chor', ''],
      [4, 'Frau', '⟦Brzęczek⟧', '⟦Agnieszka⟧', 'Yoga', ''],
      [5, 'Herr', '⟦Papadakis⟧', '⟦Dimitrios⟧', 'Chor', ''],
      [6, 'Frau', '⟦Nguyen⟧', '⟦Thi Lan⟧', 'Yoga', ''],
      [7, 'Herr', '⟦von der Heide⟧', '⟦Jonas⟧', 'Chor', ''],
      [8, 'Frau', '⟦Mai⟧', '⟦Marlene⟧', 'Yoga', ''],
      [9, 'Frau', '⟦Koch⟧', '⟦Sabine⟧', 'Chor', 'Schwester von ⟦Lena Winter⟧'],
      [10, '', 'N.N.', 'offen', 'Yoga', ''],
      [11, '', 'Turnhalle', '–', 'Chor', ''],
    ],
    expect: { Koch: 'S+', Sabine: 'S+', Winter: 'S+', Lukas: 'S+', Lena: 'S+', 'Brzęczek': 'S+', Agnieszka: 'S+', Papadakis: 'S+', Dimitrios: 'S+',
      Nguyen: 'S+', Thi: 'S+', Lan: 'S+', von: 'S+', Heide: 'S+', Jonas: 'S+', Mai: 'S+', Marlene: 'S+', 'N.N.': '', N: '', offen: '', Turnhalle: 'S+',
      Yoga: 'alt', Chor: '', Nachname: '', Vorname: '', Teilnehmerliste: '' },
    // Wörter, die nur in bestimmten Zellen geprüft werden: „von“ in „von der Heide“ gehört zum Namen
    cellExpect: { 'von der Heide': 'S+', 'Schwester von Lena Winter': { von: '', Schwester: '' } },
  },
  schwach: {
    title: 'Schwaches Kopfwort (Lehrkraft)',
    rows: [
      ['Kurs', 'Lehrkraft', 'Raum'],
      ['Malen', '⟦Trzaskalik⟧', 'Atelier'],
      ['Chor', '⟦Vogel⟧', 'Saal'],
      ['Theater', 'Dr. ⟦Haberkorn⟧', 'Bühne'],
      ['Werken', '⟦Hans Peter⟧', 'Werkraum'],
      ['Yoga', 'vakant', 'Halle'],
    ],
    expect: { Trzaskalik: 'U+', Vogel: 'S+', Haberkorn: 'S+', Hans: 'S+', Peter: 'S+', vakant: '', Atelier: '', Saal: '', Werkraum: '', Halle: 'alt' },
  },
  zweikopf: {
    title: 'Zwei Kopfzeilen, verbundene Zellen in der oberen',
    rows: [
      ['Teilnehmer', '', 'Kontakt', ''],
      ['Nachname', 'Vorname', 'Telefon', 'E-Mail'],
      ['⟦Kirchbichler⟧', '⟦Magdalena⟧', '0176 1234569', 'mk@example.org'],
      ['⟦Szymański⟧', '⟦Tomasz⟧', '0176 1234560', ''],
    ],
    merges: [[0, 0, 1], [0, 2, 3]],
    expect: { Kirchbichler: 'S+', Magdalena: 'S+', 'Szymański': 'S+', Tomasz: 'S+', Teilnehmer: '', Nachname: '', Vorname: '', Kontakt: '' },
  },
  ohnekopf: {
    title: 'Kopfzeile fehlt (Spalte von Hand)',
    rows: [
      ['⟦Kirchbichler⟧', '⟦Magdalena⟧'],
      ['⟦Brzęczek⟧', '⟦Agnieszka⟧'],
      ['⟦Huckebein⟧', '⟦Gesine⟧'],
    ],
    // ohne Schalter: wie bisherige Regeln; mit Schalter „Namen“ an Spalte 1: alle sicher
    expect: { Kirchbichler: 'alt', 'Brzęczek': 'alt', Huckebein: 'alt' },
    manual: { col: 0, expect: { Kirchbichler: 'S+', 'Brzęczek': 'S+', Huckebein: 'S+' } },
  },
  einezelle: {
    title: '„Nachname, Vorname“ in einer Zelle',
    rows: [
      ['Name', 'Kurs'],
      ['⟦Koch, Sabine⟧', 'Yoga'],
      ['⟦Brzęczek, Agnieszka⟧', 'Chor'],
      ['⟦Dimitrios Papadakis⟧', 'Yoga'],
    ],
    expect: { Koch: 'S+', Sabine: 'S+', 'Brzęczek': 'S+', Agnieszka: 'S+', Dimitrios: 'S+', Papadakis: 'S+' },
  },
  teilwort: {
    title: 'Kopf enthält ein Namenswort nur als Teil (keine Namensspalte)',
    rows: [
      ['Dateiname', 'Benutzername', 'Kursname', 'Name der Schule', 'Firmenname'],
      ['Lindenhof', 'Sonnenblume', 'Gartenfreunde', 'Lindenschule', 'Tannenhof'],
      ['Ahornweg', 'Löwenzahn', 'Bastelgruppe', 'Bergschule', 'Wiesengrund'],
    ],
    expect: { Lindenhof: '', Sonnenblume: '', Gartenfreunde: '', Lindenschule: '', Tannenhof: '', Ahornweg: '', 'Löwenzahn': '', Bastelgruppe: '',
      Bergschule: '', Wiesengrund: '' },
    noNameColumns: true,
  },
  anrede: {
    title: 'Anrede in der Nachbarzelle (ohne Namens-Kopfwort)',
    rows: [
      ['Anrede', 'Kontakt', 'Ort'],
      ['Frau', '⟦Brzęczek⟧', 'Lindenhof'],
      ['Herr', '⟦Kirchbichler⟧', 'Ahornweg'],
      ['Frau', '⟦Brzęczek⟧', 'Ahornweg'],
    ],
    expect: { 'Brzęczek': 'U+', Kirchbichler: 'U+', Lindenhof: '', Ahornweg: '' },
  },
};

// ---------- Schreiben ----------
const truth = {}; // Datei -> markierte Abschnittstexte
const mark = (file, s) => { (truth[file] = truth[file] || []).push(String(s)); return strip(s); };
const core = (creator, lmb) => X + `<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:creator>${esc(creator)}</dc:creator><cp:lastModifiedBy>${esc(lmb)}</cp:lastModifiedBy></cp:coreProperties>`;
const pkgRels = (main) => X + `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${R}/officeDocument" Target="${main}"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>`;
async function save(name, files) {
  const z = new JSZip();
  for (const [n, c] of Object.entries(files)) z.file(n, c, ZO);
  fs.writeFileSync(path.join(FXS, name), await z.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }));
}
function para(file, s, style) {
  const parts = String(s).split('⏎');
  if (strip(s).trim()) mark(file, parts.join('\n'));
  const runs = parts.map((p, i) => (i ? '<w:r><w:br/></w:r>' : '') + `<w:r><w:t xml:space="preserve">${esc(strip(p))}</w:t></w:r>`).join('');
  return `<w:p>${style ? `<w:pPr><w:pStyle w:val="${style}"/></w:pPr>` : ''}${runs}</w:p>`;
}
function wordTable(file, rows, merges = []) {
  const tr = rows.map((row, ri) => {
    const cells = [];
    for (let ci = 0; ci < row.length; ci++) {
      const m = merges.find(([r, a]) => r === ri && a === ci);
      const span = m ? m[2] - m[1] + 1 : 1;
      const v = row[ci];
      const paras = Array.isArray(v) ? v : [v === '' ? '' : String(v)];
      cells.push(`<w:tc><w:tcPr><w:tcW w:w="${1800 * span}" w:type="dxa"/>${span > 1 ? `<w:gridSpan w:val="${span}"/>` : ''}</w:tcPr>${paras.map((p) => para(file, p)).join('')}</w:tc>`);
      ci += span - 1;
    }
    return `<w:tr>${cells.join('')}</w:tr>`;
  }).join('');
  const ncol = Math.max(...rows.map((r) => r.length));
  return `<w:tbl><w:tblPr><w:tblW w:w="0" w:type="auto"/></w:tblPr><w:tblGrid>${'<w:gridCol w:w="1800"/>'.repeat(ncol)}</w:tblGrid>${tr}</w:tbl>`;
}
async function docx(name, blocks, creator, lmb) {
  let body = '';
  for (const b of blocks) body += b.table ? wordTable(name, b.table, b.merges) : para(name, b.p, b.h ? 'Heading2' : null);
  await save(name, {
    '[Content_Types].xml': X + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>',
    '_rels/.rels': pkgRels('word/document.xml'),
    'word/_rels/document.xml.rels': X + `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${R}/styles" Target="styles.xml"/></Relationships>`,
    'word/styles.xml': X + `<w:styles xmlns:w="${W}"><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style><w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/></w:style></w:styles>`,
    'word/document.xml': X + `<w:document xmlns:w="${W}" xmlns:r="${R}"><w:body>${body}<w:sectPr/></w:body></w:document>`,
    'docProps/core.xml': core(creator, lmb),
  });
}
const colL = (i) => String.fromCharCode(65 + i);
async function xlsx(name, sheets) {
  const ss = [];
  const sidx = (s) => { let i = ss.indexOf(s); if (i < 0) { ss.push(s); i = ss.length - 1; mark(name, s); } return i; };
  const sheetXml = (rows, merges = []) => {
    const body = rows.map((r, ri) => `<row r="${ri + 1}">${r.map((v, ci) => {
      const ref = colL(ci) + (ri + 1);
      if (v === '') return '';
      if (typeof v === 'number') return `<c r="${ref}"><v>${v}</v></c>`;
      return `<c r="${ref}" t="s"><v>${sidx(v)}</v></c>`;
    }).join('')}</row>`).join('');
    const mc = merges.length ? `<mergeCells count="${merges.length}">${merges.map(([r, a, b]) => `<mergeCell ref="${colL(a)}${r + 1}:${colL(b)}${r + 1}"/>`).join('')}</mergeCells>` : '';
    return X + `<worksheet xmlns="${S}"><sheetData>${body}</sheetData>${mc}</worksheet>`;
  };
  const files = {
    '_rels/.rels': pkgRels('xl/workbook.xml'),
    'xl/workbook.xml': X + `<workbook xmlns="${S}" xmlns:r="${R}"><sheets>${sheets.map((s, i) => `<sheet name="${esc(s.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('')}</sheets></workbook>`,
    'xl/_rels/workbook.xml.rels': X + `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((s, i) => `<Relationship Id="rId${i + 1}" Type="${R}/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('')}<Relationship Id="rIdS" Type="${R}/sharedStrings" Target="sharedStrings.xml"/></Relationships>`,
    'docProps/core.xml': core('Verwaltung', 'Verwaltung'),
  };
  sheets.forEach((s, i) => { files[`xl/worksheets/sheet${i + 1}.xml`] = sheetXml(s.rows, s.merges); });
  files['xl/sharedStrings.xml'] = X + `<sst xmlns="${S}" count="${ss.length}" uniqueCount="${ss.length}">${ss.map((s) => `<si><t xml:space="preserve">${esc(strip(s))}</t></si>`).join('')}</sst>`;
  files['[Content_Types].xml'] = X + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
    + sheets.map((s, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')
    + '<Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>';
  await save(name, files);
}
function csv(name, rows) {
  const q = (v) => { const s = strip(v); return /[;"\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
  for (const r of rows) for (const v of r) if (String(v).trim()) mark(name, String(v));
  fs.writeFileSync(path.join(FXS, name), rows.map((r) => r.map(q).join(';')).join('\r\n') + '\r\n');
}
function txt(name, lines, eol) {
  for (const l of lines) mark(name, l);
  fs.writeFileSync(path.join(FXS, name), lines.map(strip).join(eol) + eol);
}

export async function makeAll() {
  // Tempo: bei „npm run test:all“ schon einmal vorher erzeugt; die Wahrheit steht in wahrheit.json
  if (process.env.ANON_FIXTURES_FERTIG === '1') {
    for (const k of Object.keys(truth)) delete truth[k];
    Object.assign(truth, JSON.parse(fs.readFileSync(path.join(FXS, 'wahrheit.json'), 'utf8')));
    return truth;
  }
  fs.rmSync(FXS, { recursive: true, force: true });
  fs.mkdirSync(FXS, { recursive: true });
  for (const k of Object.keys(truth)) delete truth[k];
  await docx('brief.docx', BRIEF, 'Ingeborg Feldkämper', 'Henrike Saalfeld');
  await xlsx('liste.xlsx', [{ name: 'Teilnehmer', rows: LISTE }]);
  txt('protokoll.txt', PROTOKOLL, '\r\n');
  txt('protokoll-lf.txt', PROTOKOLL, '\n');
  txt('umbruch-risiko.txt', RISIKO.flatMap((r) => [r[0], r[1]]), '\r\n');
  txt('umbruch-risiko-lf.txt', RISIKO.flatMap((r) => [r[0], r[1]]), '\n');
  await xlsx('tabellen.xlsx', Object.entries(CASES).map(([k, c]) => ({ name: k, rows: c.rows, merges: c.merges })));
  await docx('tabellen.docx', Object.entries(CASES).flatMap(([k, c]) => [{ p: 'Fall ' + k }, { table: c.rows, merges: c.merges }]), 'Verwaltung', 'Verwaltung');
  for (const [k, c] of Object.entries(CASES)) csv(`tabellen-${k}.csv`, c.rows);
  fs.writeFileSync(path.join(FXS, 'wahrheit.json'), JSON.stringify(truth, null, 1) + '\n');
  return truth;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await makeAll();
  console.log(fs.readdirSync(FXS).join('\n'));
}
