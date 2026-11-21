// Testdokument „anmeldung“ (Version 2.7.0, Ziel-Test): Anmeldeformular einer Schule mit Einrichtungsnamen, Träger,
// Webadresse, Instagram-Konto und Kürzel. Alle Namen erfunden (Easys echter Fall nachgebaut).
// Formate: txt, csv, docx und xlsx (Webadresse dort zusätzlich als echte Verknüpfung), pdf (über LibreOffice aus docx).
// Aufruf: node tests/make-traeger.mjs   (-> tests/fixtures-traeger/)
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import JSZip from 'jszip';

const here = path.dirname(fileURLToPath(import.meta.url));
export const FXT = path.join(here, 'fixtures-traeger');
const ZO = { date: new Date(Date.UTC(2026, 0, 1, 12)), createFolders: false };
const X = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const S = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
const HL = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink';
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const WEB = 'www.lern-und-spiel-tannhofen.de';
export const URL = 'https://www.lern-und-spiel-tannhofen.de';
export const URL_PFAD = 'https://www.lern-und-spiel-tannhofen.de/anmeldung';
export const ACCOUNT = 'brandner_lern_und_spiel';
// Gegenprobe „sachtext“: Schul- und Verwaltungstext OHNE Einrichtung, Webadresse oder Konto; mit vielen Kopfwörtern,
// Anführungszeichen um Sachwörter, Dateinamen, Abkürzungen mit Punkt und Uhrzeiten
export const SACHTEXT = [
  'Informationen zum Schuljahr 2026/2027',
  'Liebe Eltern, die Schule beginnt am ersten Schultag um 7.45 Uhr; der Unterricht endet um 13.20 Uhr.',
  'Die Ganztagsschule bietet nach dem Mittagessen eine Hausaufgabenbetreuung an, z.B. in Mathematik, Deutsch u.a. Fächern.',
  'Bitte füllen Sie das Formular anmeldung.docx aus und senden Sie die Liste teilnehmer.xlsx bis 15.09. zurück.',
  'Der Elternbeirat trifft sich jeden zweiten Dienstag um 19.30 Uhr in der Aula der Schule.',
  'Wer ein Kind in der Krippe, im Kindergarten oder im Hort hat, meldet sich bitte bis Ende Oktober im Sekretariat.',
  'Die Kita öffnet um 7.00 Uhr. Die Betreuung im Hort endet um 17.00 Uhr, freitags um 15.30 Uhr.',
  'Für die Klassenfahrt gilt: Die Kosten betragen ca. 180 Euro, inkl. Unterkunft und Verpflegung.',
  'Im Fach „Medienbildung“ besprechen wir, wie man sicher mit dem Internet umgeht.',
  'Das Projekt „Gesunde Pause“ läuft weiter; jede Klasse übernimmt eine Woche lang den „Pausenverkauf“.',
  'Die Universität und die Akademie bieten im Frühjahr wieder Schnuppertage für die Oberstufe an.',
  'Der Verein für die Förderung der Schule sucht neue Mitglieder; der Beitrag beträgt 12 Euro im Jahr.',
  'Eine Stiftung unterstützt seit Jahren die Lernwerkstatt; der Antrag liegt als foerderantrag.pdf bei.',
  'Bei Krankheit informieren Sie bitte die Klassenleitung bis 8.00 Uhr, ggf. mit ärztlichem Attest aus der Praxis.',
  'Im Krankenhaus oder in der Klinik gelten eigene Regeln für den Unterricht kranker Kinder (sog. „Hausunterricht“).',
  'Die Kanzlei der Schule (Sekretariat) ist Mo.–Fr. von 7.30 bis 12.30 Uhr besetzt.',
  'Die Firma, die das Mittagessen liefert, stellt den Speiseplan wöchentlich als speiseplan_kw37.pdf bereit.',
  'Das Institut für Schulqualität führt im November eine Befragung durch; die Teilnahme ist freiwillig.',
  'Im Familienzentrum und im Jugendzentrum der Gemeinde gibt es Angebote für die Ferien.',
  'Hinweis: Fotos werden nur mit Einwilligung veröffentlicht, vgl. Nr. 4 der Schulordnung.',
  'Die Noten werden im 1. Halbjahr bis zum 13.02. und im 2. Halbjahr bis zum 24.07. bekanntgegeben.',
  'Für Fragen stehen wir Ihnen gern zur Verfügung. Mit freundlichen Grüßen, die Schulleitung',
];
// Sperre-Test: nur Webadresse und Konto, sonst nichts zu ersetzen
export const NURWEB = ['Mehr dazu unter www.beispiel-kinderhaus.de/termine.', 'Folgen Sie uns auf Instagram: @sonnenhof_kids'];
// Zeilen; {link} = Webadresse (in Word/Excel als Verknüpfung, in Text-Formaten wie in Easys Text als [www…](https://…))
export const LINES = [
  'Die offene Ganztagsschule am Gymnasium Tannhofen mit „Brandner lern und spiel“',
  'Verbindliche Anmeldung zur Offenen Ganztagsschule Schuljahr 2026/2027',
  'Die Offene Ganztagsschule wird vom Freistaat Bayern und von der Stadt Kirchberg getragen.',
  'Die Betreuung findet von Montag bis Donnerstag statt.',
  'Weitere Informationen zur OGTS von Brandner lern und spiel finden Sie auf unserer Website: {link}.',
  'Nachname, des Kindes Vorname',
  'Kind wohnt bei  Eltern  Mutter  Vater Klasse __________',
  '… der offenen Ganztagsschule am Gymnasium Kirchberg Tannhofen',
  '… einen direkten Einblick in unsere Arbeit am GYMTH.',
  '☐ Website von „Brandner lern und spiel“ ({link})',
  '☐ Instagram: brandner_lern_und_spiel',
  'Die Daten können über sogenannte „Suchmaschinen“ gefunden werden.',
  'Ton-, Video- und Filmaufnahmen sind ausgeschlossen. Die Einwilligung gilt für die Dauer der Teilnahme.',
];
// Was nach dem Anonymisieren (ohne Antwort) nicht mehr in der Ausgabe stehen darf bzw. stehen bleiben muss
export const MUST_GO = ['Tannhofen', 'Brandner', 'lern und spiel', 'lern-und-spiel', 'brandner_lern_und_spiel', 'GYMTH'];
export const MUST_STAY = ['Freistaat Bayern', 'Stadt Kirchberg', 'Offene Ganztagsschule', 'OGTS', 'Montag', 'Donnerstag', '„Suchmaschinen“', 'Schuljahr', 'Website', 'Instagram'];
const textLine = (l) => l.replace(/\{link\}/g, `[${WEB}](${URL})`);

async function save(name, files) {
  const z = new JSZip();
  for (const [n, c] of Object.entries(files)) z.file(n, c, ZO);
  fs.writeFileSync(path.join(FXT, name), await z.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }));
}
async function docx() {
  const run = (t) => `<w:r><w:t xml:space="preserve">${esc(t)}</w:t></w:r>`;
  // Zeile 5: Verknüpfung als Feldfunktion HYPERLINK (Ziel mit Pfad); Zeile 10: Verknüpfung mit Link-Hinweis (tooltip)
  const field = `<w:r><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:instrText xml:space="preserve"> HYPERLINK "${esc(URL_PFAD)}" </w:instrText></w:r><w:r><w:fldChar w:fldCharType="separate"/></w:r><w:r><w:t>${esc(WEB)}</w:t></w:r><w:r><w:fldChar w:fldCharType="end"/></w:r>`;
  const link = `<w:hyperlink r:id="rIdL" w:tooltip="${esc(URL)}"><w:r><w:rPr><w:rStyle w:val="Hyperlink"/></w:rPr><w:t>${esc(WEB)}</w:t></w:r></w:hyperlink>`;
  const body = LINES.map((l, li) => {
    const parts = l.split('{link}');
    return `<w:p>${parts.map((p, i) => (i ? (li === 4 ? field : link) : '') + run(p)).join('')}</w:p>`;
  }).join('');
  await save('anmeldung.docx', {
    '[Content_Types].xml': X + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>',
    '_rels/.rels': X + `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${R}/officeDocument" Target="word/document.xml"/></Relationships>`,
    'word/_rels/document.xml.rels': X + `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdL" Type="${HL}" Target="${URL}" TargetMode="External"/></Relationships>`,
    'word/document.xml': X + `<w:document xmlns:w="${W}" xmlns:r="${R}"><w:body>${body}<w:sectPr/></w:body></w:document>`,
  });
}
async function xlsx() {
  const ss = [];
  const si = (s) => { let i = ss.indexOf(s); if (i < 0) { ss.push(s); i = ss.length - 1; } return i; };
  // Spalte A: Zeilen; die Webadresse steht zusätzlich in B5 als eigene Zelle mit Verknüpfung
  const rows = LINES.map((l, i) => `<row r="${i + 1}"><c r="A${i + 1}" t="s"><v>${si(textLine(l))}</v></c>${i === 4 ? `<c r="B5" t="s"><v>${si(WEB)}</v></c>` : ''}</row>`).join('');
  await save('anmeldung.xlsx', {
    '[Content_Types].xml': X + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/></Types>',
    '_rels/.rels': X + `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${R}/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
    'xl/workbook.xml': X + `<workbook xmlns="${S}" xmlns:r="${R}"><sheets><sheet name="Anmeldung" sheetId="1" r:id="rId1"/></sheets></workbook>`,
    'xl/_rels/workbook.xml.rels': X + `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${R}/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rIdS" Type="${R}/sharedStrings" Target="sharedStrings.xml"/></Relationships>`,
    'xl/worksheets/sheet1.xml': X + `<worksheet xmlns="${S}" xmlns:r="${R}"><sheetData>${rows}</sheetData><hyperlinks><hyperlink ref="B5" r:id="rIdL" tooltip="${esc(URL)}"/></hyperlinks></worksheet>`,
    'xl/worksheets/_rels/sheet1.xml.rels': X + `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdL" Type="${HL}" Target="${URL}" TargetMode="External"/></Relationships>`,
    'xl/sharedStrings.xml': X + `<sst xmlns="${S}" count="${ss.length}" uniqueCount="${ss.length}">${ss.map((s) => `<si><t xml:space="preserve">${esc(s)}</t></si>`).join('')}</sst>`,
  });
}
export async function makeAll() {
  fs.rmSync(FXT, { recursive: true, force: true });
  fs.mkdirSync(FXT, { recursive: true });
  fs.writeFileSync(path.join(FXT, 'anmeldung.txt'), LINES.map(textLine).join('\r\n') + '\r\n');
  fs.writeFileSync(path.join(FXT, 'anmeldung.csv'), LINES.map((l) => { const t = textLine(l); return /[;"]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t; }).join('\r\n') + '\r\n');
  fs.writeFileSync(path.join(FXT, 'sachtext.txt'), SACHTEXT.join('\r\n') + '\r\n');
  fs.writeFileSync(path.join(FXT, 'nurweb.txt'), NURWEB.join('\n') + '\n');
  await docx();
  await xlsx();
  // PDF über LibreOffice aus der Word-Fassung
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'traeger-'));
  try {
    execFileSync('soffice', ['--headless', '-env:UserInstallation=file://' + tmp + '/lo', '--convert-to', 'pdf', '--outdir', FXT, path.join(FXT, 'anmeldung.docx')], { stdio: 'pipe', timeout: 120000 });
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await makeAll();
  console.log(fs.readdirSync(FXT).join('\n'));
}
