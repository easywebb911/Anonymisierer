// Testdateien für Version 2.10.0 (Tabellen: Spalten behandeln). Alle Daten erfunden.
// - stammdaten.xlsx / stammdaten.csv: Stammdaten-Export einer Schule, 30 Zeilen, 40 Spalten (Überschriften genau wie im
//   Auftrag). Excel wie ein echter Export: gemeinsame Texte (auch über Spalten hinweg, z. B. gleicher Nachname bei Kind und
//   Elternteil), Geburtsdatum als echte Datumszelle, Hausnummer als Zahl und als Text („12a“), PLZ/GKZ/Schulnummer als
//   Zahl, eine Zelle mit gemischter Formatierung (zwei Textläufe).
// - stammdaten-formel.xlsx: wie stammdaten.xlsx (5 Zeilen), dazu eine Formel und verbundene Zellen in ersetzten Spalten.
// - kollision-datum.csv: „[DATUM-1]“ und „[ANGABE-2]“ stehen schon im Original (Kollisions-Schutz).
// - stammdaten-wahrheit.json: je Datei und Zelle der Originalwert (für die Prüfung „kein Originalwert mehr“).
// Aufruf: node tests/make-spaltenwahl.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import JSZip from 'jszip';

const here = path.dirname(fileURLToPath(import.meta.url));
export const FXW = path.join(here, 'fixtures-spaltenwahl');
const ZO = { date: new Date(Date.UTC(2026, 0, 1, 12)), createFolders: false };
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const X = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
const R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const S = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';

export const HEADERS = ['Nachname', 'Rufname', 'Vornamen laut Geburtsurkunde', 'Geschlecht', 'Geburtsdatum', 'Geburtsort', 'Muttersprache',
  'Staatsangehörigkeit', 'Religion', 'Gewünschter Zweig', 'Gesundheitliche Beeinträchtigung', 'Erläuterung', '1. Erziehungsberechtigte/r akad. Titel',
  '1. Erziehungsberechtigte/r Nachname', '1. Erziehungsberechtigte/r Vorname', '1. Strasse', '1. Hausnummer', '1. PLZ', '1. Ort', '1. GKZ',
  '1. Telefon', '1. E-Mail', '1. Handy', '1. Telefon für Notfälle', '1. Bemerkung Notfallnummer', '2. Erziehungsberechtigte/r Nachname',
  '2. Erziehungsberechtigte/r Vorname', '2. Strasse', '2. Hausnummer', '2. PLZ', '2. Ort', 'Sorgerecht', 'Kind wohnt', 'Übertritt von',
  'Schulnummer', 'Von Jgst.', 'Ergebnis des Übertrittszeugnisses', 'Wunschpartner in der Klasse', 'Ganztag', 'Notizen der Schule'];
// Erwarteter Vorschlag je Spalte (Behandlung, Art)
export const EXPECT = {
  'Nachname': 'name', 'Rufname': 'name', 'Vornamen laut Geburtsurkunde': 'name', 'Geschlecht': 'bisher', 'Geburtsdatum': 'ganz:date',
  'Geburtsort': 'ganz:info', 'Muttersprache': 'ganz:info', 'Staatsangehörigkeit': 'ganz:info', 'Religion': 'ganz:info', 'Gewünschter Zweig': 'bisher',
  'Gesundheitliche Beeinträchtigung': 'ganz:info', 'Erläuterung': 'ganz:info', '1. Erziehungsberechtigte/r akad. Titel': 'bisher',
  '1. Erziehungsberechtigte/r Nachname': 'name', '1. Erziehungsberechtigte/r Vorname': 'name', '1. Strasse': 'ganz:address', '1. Hausnummer': 'ganz:address',
  '1. PLZ': 'ganz:address', '1. Ort': 'ganz:address', '1. GKZ': 'ganz:info', '1. Telefon': 'ganz:phone', '1. E-Mail': 'ganz:email', '1. Handy': 'ganz:phone',
  '1. Telefon für Notfälle': 'ganz:phone', '1. Bemerkung Notfallnummer': 'ganz:info', '2. Erziehungsberechtigte/r Nachname': 'name',
  '2. Erziehungsberechtigte/r Vorname': 'name', '2. Strasse': 'ganz:address', '2. Hausnummer': 'ganz:address', '2. PLZ': 'ganz:address', '2. Ort': 'ganz:address',
  'Sorgerecht': 'ganz:info', 'Kind wohnt': 'bisher', 'Übertritt von': 'ganz:org', 'Schulnummer': 'ganz:info', 'Von Jgst.': 'bisher',
  'Ergebnis des Übertrittszeugnisses': 'bisher', 'Wunschpartner in der Klasse': 'name', 'Ganztag': 'bisher', 'Notizen der Schule': 'ganz:info',
};

// Kind: [Nachname, Rufname, Vornamen, Geschlecht, Geburtsdatum (JJJJ-MM-TT), Geburtsort, Muttersprache, Staatsangehörigkeit, Religion]
const KIDS = [
  ['Öztürk', 'Ayşe', 'Ayşe Nur', 'w', '2015-03-14', 'Gaziantep', 'Türkisch', 'deutsch, türkisch', 'islamisch'],
  ['Kowalczyk-Brandt', 'Mateusz', 'Mateusz Jan', 'm', '2015-07-02', 'Wrocław', 'Polnisch', 'polnisch', 'rk'],
  ['Nguyen', 'Thi Lan', 'Thi Lan', 'w', '2014-11-23', 'Hải Phòng', 'Vietnamesisch', 'vietnamesisch', 'ohne'],
  ['Abdi', 'Hodan', 'Hodan Faisa', 'w', '2015-01-09', 'Mogadischu', 'Somali', 'somalisch', 'islamisch'],
  ['van der Meulen', 'Joris', 'Joris Pieter', 'm', '2015-05-30', 'Utrecht', 'Niederländisch', 'niederländisch', 'ev'],
  ['Okonkwo', 'Chidera', 'Chidera Blessing', 'w', '2014-12-17', 'Enugu', 'Igbo', 'nigerianisch', 'rk'],
  ['Wennemann', 'Lasse', 'Lasse Hinrich', 'm', '2015-02-26', 'Quakenbrück', 'Deutsch', 'deutsch', 'ev'],
  ['Szabó', 'Réka', 'Réka Anna', 'w', '2015-08-11', 'Szeged', 'Ungarisch', 'ungarisch', 'rk'],
  ['Lindqvist', 'Elin', 'Elin Maja', 'w', '2015-04-04', 'Umeå', 'Schwedisch', 'schwedisch', 'ev'],
  ['Al-Rashid', 'Yusuf', 'Yusuf Karim', 'm', '2014-10-19', 'Homs', 'Arabisch', 'syrisch', 'islamisch'],
  ['Papadopoulou', 'Eleni', 'Eleni Sofia', 'w', '2015-06-08', 'Larisa', 'Griechisch', 'griechisch', 'orthodox'],
  ['Hrnčíř', 'Vojtěch', 'Vojtěch', 'm', '2015-09-01', 'Plzeň', 'Tschechisch', 'tschechisch', 'ohne'],
  ['Mbatha', 'Sipho', 'Sipho Thandeka', 'm', '2014-09-28', 'Durban', 'Zulu', 'südafrikanisch', 'ev'],
  ['de Oliveira', 'Bruna', 'Bruna Letícia', 'w', '2015-03-27', 'Recife', 'Portugiesisch', 'brasilianisch', 'rk'],
  ['Tesfaye', 'Meron', 'Meron', 'w', '2015-07-21', 'Gondar', 'Amharisch', 'äthiopisch', 'orthodox'],
  ['Quaas', 'Fiete', 'Fiete Ole', 'm', '2015-01-31', 'Husum', 'Deutsch', 'deutsch', 'ohne'],
  ['Ylönen', 'Aino', 'Aino Kaisa', 'w', '2014-11-05', 'Kuopio', 'Finnisch', 'finnisch', 'ev'],
  ['Dragović', 'Luka', 'Luka', 'm', '2015-02-14', 'Kragujevac', 'Serbisch', 'serbisch', 'orthodox'],
  ['Kühnreich', 'Henrike', 'Henrike Sophie', 'w', '2015-10-12', 'Bad Tölz', 'Deutsch', 'deutsch', 'rk'],
  ['Ferreira-Lopes', 'Tiago', 'Tiago Miguel', 'm', '2015-04-18', 'Braga', 'Portugiesisch', 'portugiesisch', 'rk'],
  ['Ngata', 'Aroha', 'Aroha', 'w', '2015-06-29', 'Rotorua', 'Englisch', 'neuseeländisch', 'ohne'],
  ['Zahradník', 'Tomáš', 'Tomáš Karel', 'm', '2014-12-03', 'Brno', 'Tschechisch', 'tschechisch', 'rk'],
  ['Bjørnstad', 'Sigrid', 'Sigrid Ingrid', 'w', '2015-08-24', 'Tromsø', 'Norwegisch', 'norwegisch', 'ev'],
  ['Achterkamp', 'Jannes', 'Jannes Hauke', 'm', '2015-05-07', 'Papenburg', 'Deutsch', 'deutsch', 'rk'],
  ['Iwu', 'Obinna', 'Obinna', 'm', '2015-03-03', 'Owerri', 'Igbo', 'nigerianisch', 'ev'],
  ['Laskowski', 'Zofia', 'Zofia Maria', 'w', '2015-09-15', 'Lublin', 'Polnisch', 'deutsch, polnisch', 'rk'],
  ['Ramanathan', 'Kavya', 'Kavya', 'w', '2014-10-30', 'Madurai', 'Tamil', 'indisch', 'hinduistisch'],
  ['Tchouameni', 'Ange', 'Ange Désiré', 'm', '2015-07-27', 'Douala', 'Französisch', 'kamerunisch', 'rk'],
  ['Heppenstall', 'Wilbur', 'Wilbur James', 'm', '2015-02-08', 'Leeds', 'Englisch', 'britisch', 'ev'],
  ['Ó Briain', 'Saoirse', 'Saoirse Áine', 'w', '2015-11-20', 'Galway', 'Irisch', 'irisch', 'rk'],
];
// Erziehungsberechtigte: [Titel, Nachname, Vorname] (Nachname oft wie beim Kind); 2. oft leer
const EB1 = [['', 'Öztürk', 'Mehmet'], ['Dr.', 'Kowalczyk', 'Agnieszka'], ['', 'Nguyen', 'Văn Minh'], ['', 'Abdi', 'Faisa'], ['', 'van der Meulen', 'Sanne'],
  ['', 'Okonkwo', 'Ngozi'], ['', 'Wennemann', 'Gesche'], ['', 'Szabó', 'Bence'], ['Dr. med.', 'Lindqvist', 'Karin'], ['', 'Al-Rashid', 'Rania'],
  ['', 'Papadopoulos', 'Nikos'], ['', 'Hrnčířová', 'Lenka'], ['', 'Mbatha', 'Nomvula'], ['', 'Oliveira Santos', 'Rafael'], ['', 'Tesfaye', 'Selamawit'],
  ['', 'Quaas', 'Imke'], ['', 'Ylönen', 'Mikko'], ['', 'Dragović', 'Jelena'], ['Prof. Dr.', 'Kühnreich', 'Ansgar'], ['', 'Lopes', 'Inês'],
  ['', 'Ngata', 'Wiremu'], ['', 'Zahradníková', 'Petra'], ['', 'Bjørnstad', 'Håkon'], ['', 'Achterkamp', 'Wiebke'], ['', 'Iwu', 'Chiamaka'],
  ['', 'Laskowska', 'Ewa'], ['', 'Ramanathan', 'Priya'], ['', 'Tchouameni', 'Clarisse'], ['', 'Heppenstall', 'Rosalind'], ['', 'Ó Briain', 'Niamh']];
const EB2 = [['Öztürk', 'Emine'], ['Brandt', 'Torsten'], ['', ''], ['', ''], ['van der Meulen', 'Bram'], ['Okonkwo', 'Emeka'], ['Wennemann', 'Hauke'], ['', ''],
  ['Lindqvist', 'Per'], ['Al-Rashid', 'Omar'], ['Papadopoulou', 'Maria'], ['', ''], ['', ''], ['de Oliveira', 'Camila'], ['', ''], ['Quaas', 'Jörn'],
  ['', ''], ['Dragović', 'Marko'], ['Kühnreich-Albers', 'Dorothee'], ['Ferreira', 'João'], ['', ''], ['Zahradník', 'Jiří'], ['', ''], ['Achterkamp', 'Hinnerk'],
  ['', ''], ['Laskowski', 'Piotr'], ['Ramanathan', 'Arjun'], ['', ''], ['', ''], ['Ó Briain', 'Cathal']];
const STR = ['Lindenweg', 'Am Mühlbach', 'Birkenallee', 'Kastanienstraße', 'Ulmenring', 'Fliederweg', 'Rosenhang', 'Ahornplatz', 'Eschenstraße', 'Hollerweg'];
const ORTE = [['Tannhofen', 84512, 9183117], ['Lindenau-Süd', 84513, 9183118], ['Kirchberg am See', 84520, 9183121]];
const ERL = ['Asthma bronchiale, Notfallspray im Ranzen', 'Laktoseintoleranz', 'ADHS – Nachteilsausgleich beantragt', 'Erdnussallergie, Adrenalin-Pen im Sekretariat',
  'Diabetes Typ 1, Insulinpumpe', 'Epilepsie, Medikament Levetiracetam', 'Legasthenie', 'Hörgerät links'];
const WUNSCH = ['lena | ben', 'Mateusz; Ayşe', 'keine', '–', 'aylin und jonas', 'Joris / Lasse', 'chidera', 'Elin', '', 'yusuf | luka', 'Réka und Eleni', 'n.n.'];
const SCHULEN = ['Grundschule am Lindenhof, Birkenweg 3', 'Grundschule Tannhofen-Nord, Am Anger 12', 'Montessori-Grundschule Kirchberg, Seestraße 40a', 'Grundschule St. Ulrich, Kirchplatz 1'];
const NOTIZ = ['Rücksprache mit Frau Wennemann am 12.09.', 'Mutter spricht wenig Deutsch, Dolmetscherin Frau Szabó-Kertész', 'Bruder in Klasse 7b',
  'Abholung nur durch die Großmutter Hildegard Quaas', '', 'Kontakt zum Jugendamt, Sachbearbeiter Herr Brinkhoff'];

const serial = (iso) => Math.round((Date.UTC(...iso.split('-').map((x, i) => (i === 1 ? Number(x) - 1 : Number(x)))) - Date.UTC(1899, 11, 30)) / 86400000);
const deDate = (iso) => iso.split('-').reverse().join('.');
// Zeilen: je Zelle {v, typ: 's'|'n'|'d', rich?}
export function rows(n = 30) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const k = KIDS[i];
    const e1 = EB1[i];
    const e2 = EB2[i];
    const o = ORTE[i % 3];
    const o2 = ORTE[(i + 1) % 3];
    const hn = i % 4 === 1 ? `${i + 2}a` : i + 2;
    const hn2 = i % 5 === 2 ? `${i + 7}b` : i + 7;
    const two = !!e2[0];
    const r = [
      k[0], k[1], k[2], k[3], { v: serial(k[4]), typ: 'd', text: deDate(k[4]) }, k[5], k[6], k[7], k[8], i % 2 ? 'sprachlich' : 'naturwissenschaftlich',
      i % 3 === 0 ? 'ja' : 'nein', i % 3 === 0 ? ERL[i % ERL.length] : '', e1[0], e1[1], e1[2],
      STR[i % STR.length], hn, o[1], o[0], o[2],
      `0861 ${4400 + i}${i % 10}`, `${e1[2].toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/[^a-z]/g, '')}.${e1[1].toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/[^a-z]/g, '')}@example.org`,
      `0151 2${String(1000000 + i * 7919).slice(1)}`, i % 2 ? `0861 9${String(100 + i)}` : '', i % 2 ? `Oma ${['Hildegard', 'Gerlinde', 'Waltraud'][i % 3]} ${k[0]}, erreichbar ab 14 Uhr` : '',
      two ? e2[0] : '', two ? e2[1] : '', two ? STR[(i + 3) % STR.length] : '', two ? hn2 : '', two ? o2[1] : '', two ? o2[0] : '',
      two ? 'gemeinsam' : 'Mutter', two ? 'bei beiden' : 'bei Mutter', SCHULEN[i % SCHULEN.length], 912000 + (i % 4) * 7, 4,
      ['1,33', '2,00', '2,33', '2,66'][i % 4], WUNSCH[i % WUNSCH.length], i % 2 ? 'ja' : 'nein', NOTIZ[i % NOTIZ.length],
    ];
    // eine Zelle mit gemischter Formatierung (Excel: zwei Textläufe, der zweite fett)
    if (i === 3) r[11] = { v: 'Asthma bronchiale, ', rich: 'Notfallspray im Ranzen', typ: 's' };
    out.push(r.map((x) => (x && typeof x === 'object' ? x : { v: x, typ: typeof x === 'number' ? 'n' : 's' })));
  }
  return out;
}
export const cellText = (c) => (c.typ === 'd' ? c.text : c.rich ? c.v + c.rich : String(c.v));

const colL = (i) => { let s = ''; let n = i + 1; while (n > 0) { const r = (n - 1) % 26; s = String.fromCharCode(65 + r) + s; n = Math.floor((n - 1) / 26); } return s; };
async function xlsx(file, data, extra = {}) {
  const ss = [];
  const sidx = (key, xml) => { let i = ss.findIndex((x) => x.key === key); if (i < 0) { ss.push({ key, xml }); i = ss.length - 1; } return i; };
  const all = [HEADERS.map((hd) => ({ v: hd, typ: 's' })), ...data];
  const body = all.map((r, ri) => `<row r="${ri + 1}">${r.map((c, ci) => {
    const ref = colL(ci) + (ri + 1);
    const fo = (extra.formulas || []).find((x) => x.r === ri && x.c === ci);
    if (fo) return `<c r="${ref}" t="str"><f>${esc(fo.f)}</f><v>${esc(fo.v)}</v></c>`;
    if (c.v === '' || c.v === undefined) return '';
    if (c.typ === 'd') return `<c r="${ref}" s="1"><v>${c.v}</v></c>`;
    if (c.typ === 'n') return `<c r="${ref}"><v>${c.v}</v></c>`;
    if (c.rich) return `<c r="${ref}" t="s"><v>${sidx('R|' + c.v + c.rich, `<r><t xml:space="preserve">${esc(c.v)}</t></r><r><rPr><b/></rPr><t>${esc(c.rich)}</t></r>`)}</v></c>`;
    return `<c r="${ref}" t="s"><v>${sidx('T|' + c.v, `<t xml:space="preserve">${esc(c.v)}</t>`)}</v></c>`;
  }).join('')}</row>`).join('');
  const mc = extra.merge ? `<mergeCells count="1"><mergeCell ref="${extra.merge}"/></mergeCells>` : '';
  const files = {
    '_rels/.rels': X + `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${R}/officeDocument" Target="xl/workbook.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>`,
    'docProps/core.xml': X + '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:creator>Sekretariat</dc:creator><cp:lastModifiedBy>Sekretariat</cp:lastModifiedBy></cp:coreProperties>',
    'xl/workbook.xml': X + `<workbook xmlns="${S}" xmlns:r="${R}"><sheets><sheet name="Schüler" sheetId="1" r:id="rId1"/></sheets></workbook>`,
    'xl/_rels/workbook.xml.rels': X + `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${R}/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rIdS" Type="${R}/sharedStrings" Target="sharedStrings.xml"/><Relationship Id="rIdT" Type="${R}/styles" Target="styles.xml"/></Relationships>`,
    'xl/styles.xml': X + `<styleSheet xmlns="${S}"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="1"><fill><patternFill patternType="none"/></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="14" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs></styleSheet>`,
    'xl/worksheets/sheet1.xml': X + `<worksheet xmlns="${S}"><sheetData>${body}</sheetData>${mc}</worksheet>`,
    'xl/sharedStrings.xml': X + `<sst xmlns="${S}" count="${ss.length}" uniqueCount="${ss.length}">${ss.map((x) => `<si>${x.xml}</si>`).join('')}</sst>`,
    '[Content_Types].xml': X + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>',
  };
  const z = new JSZip();
  for (const [n, c] of Object.entries(files)) z.file(n, c, ZO);
  fs.writeFileSync(path.join(FXW, file), await z.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }));
}
function csv(file, data) {
  const q = (v) => (/[;"\r\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v);
  const lines = [HEADERS, ...data.map((r) => r.map(cellText))].map((r) => r.map((v) => q(String(v))).join(';'));
  fs.writeFileSync(path.join(FXW, file), lines.join('\r\n') + '\r\n');
}
export async function makeAll() {
  fs.mkdirSync(FXW, { recursive: true });
  const data = rows(30);
  await xlsx('stammdaten.xlsx', data);
  csv('stammdaten.csv', data);
  const small = rows(5);
  // Formel in „1. Ort“ (Zeile 3) und verbundene Zellen über „1. PLZ“ und „1. Ort“ (Zeile 5)
  // Guardian-Lauf 1, Fund 1: Formelergebnis mit Namen in einer Namensspalte (Nachname, Zeile 4)
  await xlsx('stammdaten-formel.xlsx', small, { formulas: [{ r: 3, c: HEADERS.indexOf('1. Ort'), f: 'CONCATENATE("Tann","hofen")', v: 'Tannhofen' },
    { r: 3, c: HEADERS.indexOf('Nachname'), f: 'AQ9', v: 'Pawlitzki' }],
    merge: `${colL(HEADERS.indexOf('1. PLZ'))}5:${colL(HEADERS.indexOf('1. Ort'))}5` });
  // Kollisions-Schutz: „[DATUM-1]“ und „[ANGABE-2]“ stehen schon im Original (Spalte „wie bisher“)
  // „Nachname, Vorname“ in einer Spalte „Name“ und dieselbe Person in einer Spalte „wie bisher“ (Guardian-Lauf 1, Fund 2)
  fs.writeFileSync(path.join(FXW, 'komma.csv'), ['Name;Kontakt;Klasse;Wunschpartner', 'Berger, Tilda;Tilda Berger;5c;Hauke, Ole', 'Quandt, Hauke;Hauke Quandt;5a;Tilda, Ole', 'Wiesel, Ole;Ole Wiesel;5b;Hauke', ''].join('\r\n'));
  fs.writeFileSync(path.join(FXW, 'kollision-datum.csv'), ['Geburtsdatum;Religion;Text', '14.03.2015;rk;siehe [DATUM-1] und [ANGABE-2]', '02.07.2015;ev;Feld [ANGABE-2] bleibt', ''].join('\r\n'));
  const truth = { headers: HEADERS, expect: EXPECT, rows: data.map((r) => r.map(cellText)), types: data.map((r) => r.map((c) => c.typ)) };
  fs.writeFileSync(path.join(FXW, 'stammdaten-wahrheit.json'), JSON.stringify(truth, null, 1));
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await makeAll();
