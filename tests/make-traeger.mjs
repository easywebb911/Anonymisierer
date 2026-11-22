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
  // Version 2.8.0: Kopfwörter allein und mit Wörtern der Ausschluss-Liste
  'An der Schule gibt es eine Mensa. Die Kita öffnet früh. Im Hort wird gebastelt. Das Gymnasium ist groß.',
  'Die Grundschule Schuljahr 2026/2027 startet, die Kita Montag bis Freitag, der Kindergarten Januar bis Juli.',
  'Gymnasium Klasse 5, Schule Unterricht, Kita Anmeldung, Verein Mitglieder, Verein Vorstand, Verein Satzung, Kita Öffnungszeiten.',
  'Hort Betreuung, Kita Gebühren, Verein Beitrag, Kita Träger, Schule Gebäude, Schule Hof, Schule Eltern, Kita Kinder, Schule Lehrkräfte.',
  'Praxis Leitung, Klinik Termine, Stiftung Satzung, Institut Mitglieder, Akademie Programm, Firma Kontakt, Kanzlei Telefon.',
  // Titel in Anführungszeichen hinter jedem Titel-Wort
  'Vortrag „Gesunde Ernährung im Alltag“, Kurs „Erste Hilfe am Kind“, Projekt „Natur vor unserer Tür“, Thema „Lernen mit Freude“.',
  'Motto „Gemeinsam statt einsam“, Buch „Die kleine Raupe“, Titel „Unser Jahr“, Lied „Bunte Blätter fallen“, Film „Der weite Weg“.',
  'Workshop „Sicher im Netz“, Seminar „Gute Gespräche führen“, Fach „Natur und Technik“, AG „Junge Forscher“, Stück „Der Zauberwald“, Artikel „Neue Wege gehen“.',
  // einzelne Sachwörter in Anführungszeichen und Orte allein
  'Wir sprechen über „Pausen“, „Hausaufgaben“ und „Medien“. Ausflüge gehen nach Kirchberg, München, Bayern und in die Stadt Tannfeld.',
];
// Version 2.8.0: Testdatei „einrichtungen-auto“ (alle Namen erfunden). Je Fall eine Zeile; in Word zusätzlich Kopfzeile,
// Fußnote und Kommentar, in Excel zwei Blätter.
export const EINR_AUTO = [
  'Die Kita Sonnenblume feiert ihr Sommerfest.',
  'Das Kinderhaus Regenbogen sucht Helfer.',
  'Das Gymnasium Wendorf lädt zum Tag der offenen Tür.',
  'Die Mittelschule Birkenhain Nord Ost bietet Praktika an.',
  'Die Grundschule an der Lindenau beginnt um acht Uhr.',
  'Das Wendorf-Gymnasium bietet Latein an.',
  'Die Erika-Brandner-Schule hat einen neuen Schulgarten.',
  'Das Essen liefert die Sonnenschein Küchen GmbH.',
  'Der Förderverein Wendorf e. V. sammelt Spenden.',
  'Die Schüler des Gymnasiums Wendorf fahren nach Rom.',
  'GYMNASIUM WENDORF – ELTERNINFORMATION',
  'Die Kita „Kleine Strolche“ hat geöffnet.',
  'Treffpunkt ist das „Haus Marlene“ am Markt.',
  'Die Initiative „Bunte Welt Wendorf“ lädt ein, Instagram: @bunte_welt_wendorf',
  'Im „Grüne Insel“ gibt es Kaffee. Das Grüne Insel ist montags zu.',
];
// Nachbesserung 2.8.0: „Haus Marlene“ (Merkmal 2) ist keine gefundene Einrichtung mehr: „Marlene“ ist für die
// Personen-Erkennung allein schon eine sichere Person (Regel 2); „Marlene“ wird als Person ersetzt, „Haus Marlene“ steht im
// Warnpunkt. Dreiwort-Fall ohne Personennamen („Birkenhain Nord Ost“ statt „Sankt Georg Wendorf“).
export const EINR_AUTO_COUNT = 11; // verschiedene Einrichtungen (= Zahl der Einrichtungs-Fragen)
export const EINR_AUTO_NAMES = ['Sonnenblume', 'Regenbogen', 'Wendorf', 'Birkenhain', 'Lindenau', 'Erika', 'Brandner', 'Sonnenschein', 'Kleine Strolche', 'Marlene', 'Bunte Welt', 'Grüne Insel'];
export const EINR_AUTO_WARN = ['Haus Marlene'];
// Nachbesserung 2.8.0: Einrichtung und Person dicht beieinander (Befund 1) und Sachwörter nach einem Kopfwort (Befund 2)
export const EINR_PERSON = [
  'Der Verein Vorsitzender Herr Kessler lädt ein.',
  'Kita Leitung Frau Sommerfeld Telefon folgt',
  'Gymnasium Tannhofen Herr Kessler Klasse 5a',
  'In der Schule Deutsch und Mathe lernen alle Kinder.',
  'Wir treffen uns im Hort Raum 3.',
  'Die Kita Gruppe Igel geht in den Wald.',
  'Die Klinik Aufnahme ist besetzt.',
  'Im Kindergarten Sommerfest gibt es Kuchen.',
  'Termin in der Praxis Dr. Erika Brandner am Montag.',
  'Auftrag an die Firma Holzbau Lehmann GmbH, Herr Lehmann kommt.',
  'Die Erika-Brandner-Schule feiert ihr Jubiläum.',
  'Das Angebot von „Brandner lern und spiel“ steht auch auf Instagram: brandner_lern_und_spiel',
];
export const EINR_PERSON_BEFUND2 = [3, 4, 5, 6, 7]; // Zeilen ohne Einrichtung
export const EINR_PERSON_TABLE = [['Einrichtung', 'Ansprechpartner'], ['Kita Sonnenblume', 'Frau Sommerfeld'], ['Gymnasium Tannhofen', 'Herr Kessler']];
export const EINR_PERSON_PERSONS = ['Kessler', 'Sommerfeld', 'Erika Brandner', 'Lehmann'];
export const EINR_KOPF = 'Kita Sonnenblume – Elternbrief';
export const EINR_FUSS = 'Gemeint ist das Kinderhaus Regenbogen.';
export const EINR_KOMMENTAR = 'Rückfrage an die Kita Sonnenblume';
// Version 2.8.1 („Einrichtungen: Leck und Lücken schließen“): Person neben Einrichtung. Je Teil die Sätze aus dem Auftrag
// und je zwei eigene. Alle Namen erfunden.
// Zeilen; [Anrede, Name] = in TXT zwei Zeilen, in CSV/Excel zwei Zellen nebeneinander (Regel a2 gilt in Tabellen für die
// linke Nachbarzelle, seit 2.6.0)
export const NACHBARN_ROWS = [
  // Teil 1: Name (Regel a2, „unsicher, an“) in einer gefundenen Einrichtung; Probe mit „Unsichere Treffer“ aus
  ['Frau', 'Quarbeck'], 'Der Verein Quarbeck lädt ein.',
  'Bitte wenden Sie sich an Koch.', 'Die Praxis Koch ist am Montag zu.',
  ['Herrn', 'Broszat'], 'Die Kanzlei Broszat berät Sie gern.',
  ['Frau', 'Tewesmeier'], 'Das Institut Tewesmeier schreibt aus.',
  // Teil 2: gefundene Einrichtungen (Liste aus, dann von Hand markiert)
  'Einladung: Die Kita Sonnenblume feiert am Freitag. Die Kita Sonnenblume freut sich.',
  'Das Familienzentrum Wiesenkamp öffnet um neun.',
  'Die Musikschule Lindgrün sucht Helfer.',
  // Teil 3: Person direkt hinter der Einrichtung, ohne Anrede
  'Kita Sonnenblume Jana Wolters',
  'Kindergarten Regenbogen Tobias Hellwig',
  'Familienzentrum Lindenhof Anja Petersen',
  // Teil 4: Person mit „von / vom / von der“ vor einer Einrichtung
  'Mit Grüßen, Frau Okonkwo vom Gymnasium Kirchberg Tannhofen',
  'Herr Lehmann von der Firma Holzbau Lehmann GmbH',
  'Frau Schuster vom Kindergarten Regenbogen',
  'Herr Demir vom Verein Birkenhain e. V.',
  'Herr Kowalski von der Musikschule Lindgrün',
  'Frau Albers vom Familienzentrum Wiesenkamp',
  // echte Namen mit Zusatz bleiben Namen
  'Herr von Brandner und Frau van der Lindenau kommen auch.',
  // Entscheidung Easy C (nach dem Guardian-Lauf): Kopfwort hinter dem Zusatz nur in der Grundform und nur mit Namens-Wort
  'Sehr geehrte Frau von Horten,', 'Frau Anja von Horten kommt morgen.', 'Herr Nikita Brandner', 'Frau von Schulenburg',
  'Herr Brennecke von der Grundschule Am Mühlbach',
  // Guardian-Fund 2: selbst erkannte Person aus, dann „Als Name markieren“
  'Melanie Grawert kommt morgen.',
  // Guardian-Lauf 2, Fund 1: nach „Nein“ belegt die Person genau dieselbe Stelle wie die Einrichtung
  'Liebe Eltern,', 'die Praxis Lindqvist ist am Montag zu.', 'Die Krippe Halvorsen bleibt heute zu.',
].map((r) => (Array.isArray(r) ? r : [r]));
export const NACHBARN = NACHBARN_ROWS.flat();
// Was ohne Antwort ersetzt sein muss (ganze Wörter, alle Modi)
export const NACHBARN_PERSONS = ['Quarbeck', 'Broszat', 'Tewesmeier', 'Jana', 'Wolters', 'Tobias', 'Hellwig', 'Anja', 'Petersen', 'Okonkwo',
  'Lehmann', 'Schuster', 'Demir', 'Kowalski', 'Albers', 'Brandner', 'Lindenau', 'Horten', 'Nikita', 'Schulenburg', 'Brennecke', 'Melanie', 'Grawert', 'Lindqvist', 'Halvorsen'];
export const NACHBARN_ORGS = ['Sonnenblume', 'Wiesenkamp', 'Lindgrün', 'Regenbogen', 'Lindenhof', 'Kirchberg', 'Tannhofen', 'Holzbau', 'Birkenhain', 'Mühlbach'];
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
async function einrDocx() {
  const run = (t) => `<w:r><w:t xml:space="preserve">${esc(t)}</w:t></w:r>`;
  const body = EINR_AUTO.map((l, i) => `<w:p>${i === 0 ? '<w:commentRangeStart w:id="0"/>' : ''}${run(l)}${i === 0 ? '<w:commentRangeEnd w:id="0"/><w:r><w:commentReference w:id="0"/></w:r>' : ''}${i === 1 ? '<w:r><w:footnoteReference w:id="1"/></w:r>' : ''}</w:p>`).join('');
  await save('einrichtungen-auto.docx', {
    '[Content_Types].xml': X + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/><Override PartName="/word/footnotes.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footnotes+xml"/><Override PartName="/word/comments.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.comments+xml"/></Types>',
    '_rels/.rels': X + `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${R}/officeDocument" Target="word/document.xml"/></Relationships>`,
    'word/_rels/document.xml.rels': X + `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdH" Type="${R}/header" Target="header1.xml"/><Relationship Id="rIdF" Type="${R}/footnotes" Target="footnotes.xml"/><Relationship Id="rIdC" Type="${R}/comments" Target="comments.xml"/></Relationships>`,
    'word/document.xml': X + `<w:document xmlns:w="${W}" xmlns:r="${R}"><w:body>${body}<w:sectPr><w:headerReference w:type="default" r:id="rIdH"/></w:sectPr></w:body></w:document>`,
    'word/header1.xml': X + `<w:hdr xmlns:w="${W}"><w:p>${run(EINR_KOPF)}</w:p></w:hdr>`,
    'word/footnotes.xml': X + `<w:footnotes xmlns:w="${W}"><w:footnote w:id="1"><w:p>${run(EINR_FUSS)}</w:p></w:footnote></w:footnotes>`,
    'word/comments.xml': X + `<w:comments xmlns:w="${W}"><w:comment w:id="0" w:author="Test" w:initials="T"><w:p>${run(EINR_KOMMENTAR)}</w:p></w:comment></w:comments>`,
  });
}
async function einrXlsx() {
  const ss = [];
  const si = (s) => { let i = ss.indexOf(s); if (i < 0) { ss.push(s); i = ss.length - 1; } return i; };
  const half = Math.ceil(EINR_AUTO.length / 2);
  const sheets = [EINR_AUTO.slice(0, half), [...EINR_AUTO.slice(half), EINR_KOPF, EINR_FUSS]];
  const rowsOf = (ls) => ls.map((l, i) => `<row r="${i + 1}"><c r="A${i + 1}" t="s"><v>${si(l)}</v></c></row>`).join('');
  await save('einrichtungen-auto.xlsx', {
    '[Content_Types].xml': X + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/></Types>',
    '_rels/.rels': X + `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${R}/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
    'xl/workbook.xml': X + `<workbook xmlns="${S}" xmlns:r="${R}"><sheets><sheet name="Teil 1" sheetId="1" r:id="rId1"/><sheet name="Teil 2" sheetId="2" r:id="rId2"/></sheets></workbook>`,
    'xl/_rels/workbook.xml.rels': X + `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${R}/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="${R}/worksheet" Target="worksheets/sheet2.xml"/><Relationship Id="rIdS" Type="${R}/sharedStrings" Target="sharedStrings.xml"/></Relationships>`,
    'xl/worksheets/sheet1.xml': X + `<worksheet xmlns="${S}"><sheetData>${rowsOf(sheets[0])}</sheetData></worksheet>`,
    'xl/worksheets/sheet2.xml': X + `<worksheet xmlns="${S}"><sheetData>${rowsOf(sheets[1])}</sheetData></worksheet>`,
    'xl/sharedStrings.xml': X + `<sst xmlns="${S}" count="${ss.length}" uniqueCount="${ss.length}">${ss.map((s) => `<si><t xml:space="preserve">${esc(s)}</t></si>`).join('')}</sst>`,
  });
}
async function personXlsx(name = 'einrichtung-person.xlsx', table = EINR_PERSON_TABLE) {
  const ss = [];
  const si = (s) => { let i = ss.indexOf(s); if (i < 0) { ss.push(s); i = ss.length - 1; } return i; };
  const rows = table.map((r, i) => `<row r="${i + 1}">${r.map((v, c) => `<c r="${String.fromCharCode(65 + c)}${i + 1}" t="s"><v>${si(v)}</v></c>`).join('')}</row>`).join('');
  await save(name, {
    '[Content_Types].xml': X + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/></Types>',
    '_rels/.rels': X + `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${R}/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
    'xl/workbook.xml': X + `<workbook xmlns="${S}" xmlns:r="${R}"><sheets><sheet name="Kontakte" sheetId="1" r:id="rId1"/></sheets></workbook>`,
    'xl/_rels/workbook.xml.rels': X + `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${R}/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rIdS" Type="${R}/sharedStrings" Target="sharedStrings.xml"/></Relationships>`,
    'xl/worksheets/sheet1.xml': X + `<worksheet xmlns="${S}"><sheetData>${rows}</sheetData></worksheet>`,
    'xl/sharedStrings.xml': X + `<sst xmlns="${S}" count="${ss.length}" uniqueCount="${ss.length}">${ss.map((s) => `<si><t xml:space="preserve">${esc(s)}</t></si>`).join('')}</sst>`,
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
  fs.writeFileSync(path.join(FXT, 'einrichtungen-auto.txt'), [EINR_KOPF, ...EINR_AUTO, EINR_FUSS, EINR_KOMMENTAR].join('\r\n') + '\r\n');
  await docx();
  await xlsx();
  await einrDocx();
  await einrXlsx();
  fs.writeFileSync(path.join(FXT, 'einrichtung-person.txt'), EINR_PERSON.join('\r\n') + '\r\n');
  fs.writeFileSync(path.join(FXT, 'einrichtung-person.csv'), EINR_PERSON_TABLE.map((r) => r.join(';')).join('\r\n') + '\r\n');
  await personXlsx();
  // Version 2.8.1: nachbarn (txt, csv, xlsx; je Zeile eine Zelle)
  fs.writeFileSync(path.join(FXT, 'nachbarn.txt'), NACHBARN.join('\r\n') + '\r\n');
  fs.writeFileSync(path.join(FXT, 'nachbarn.csv'), NACHBARN_ROWS.map((r) => r.map((t) => (/[;"]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t)).join(';')).join('\r\n') + '\r\n');
  await personXlsx('nachbarn.xlsx', NACHBARN_ROWS);
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
