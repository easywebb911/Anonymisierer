# Teile an ungewöhnlicher Stelle, Excel-Kommentare, Schlusscheck nur über Nutzertext (Version 2.4.1): Tests

Testdokumente: tests/make-pfade.mjs -> tests/fixtures-pfade/ (alles erfunden). Vorher = Version 2.4.0, nachher = diese Version. Alles über die Oberfläche (Chromium).

## 1. Phase-0-Datei (Aufbau wie openpyxl)
- vorher: Kommentar in der Prüfansicht: fehlt; „TANNHÄUSERS“: sicher, an; Schlusscheck: thin – steht in: xl/styles.xml · bestätigter Name, Person C: „…r 11 1 Arial 2 none gray125 2 thin 1 thin 1 thin 1 thin 1 1 0 0 …“ | thin – steht in: xl/styles.xml · bestätigter Name, Person C: „…Arial 2 none gray125 2 thin 1 thin 1 thin 1 thin 1 1 0 0 0 0 2 0…“ | thin – steht in: xl/styles.xml · bestätigter Name, Person C: „… none gray125 2 thin 1 thin 1 thin 1 thin 1 1 0 0 0 0 2 0 0 0 0 …“ | thin – steht in: xl/styles.xml · bestätigter Name, Person C: „…ray125 2 thin 1 thin 1 thin 1 thin 1 1 0 0 0 0 2 0 0 0 0 0 0 1 0…“; Namen in der Ausgabe: xl/comments/comment1.xml: Jonas Wiesenthal
- OK: Phase 0 vorher: Befund 1 (Kommentar fehlt, Name bleibt) und Befund 2 („thin“) nachgestellt
- nachher: Kommentar in der Prüfansicht: „Rückruf bei Thi Lan Nguyen, Mutter von Jonas Wiesenthal“; „TANNHÄUSERS“: sicher, an; Schlusscheck: ohne Fund; Namen in der Ausgabe: keine
- OK: Phase 0: Kommentar unter xl/comments/comment1.xml erscheint in der Prüfansicht
- OK: Phase 0: kein Testname in irgendeinem Teil der entpackten Ausgabe – keine
- OK: Phase 0: keine Schlusscheck-Meldung „thin“ (überhaupt keine Meldung)
- OK: Phase 0: „TANNHÄUSERS“ sicher, an (Chromium)

## 2. Namen je Teil der entpackten Ausgabe (Modus „Person A“)

| Datei | vorher (2.4.0): Namen je Teil | nachher: Namen je Teil | Schlusscheck nachher |
|---|---|---|---|
| pfade-ueblich.xlsx | keine | keine | ohne Fund |
| pfade-unueblich.xlsx | notizen/kommentare/c1.xml: Jonas, Wiesenthal; notizen/unterhaltung/u1.xml: Malte, Ehrenreich; tabellen/blatt1.xml: Gerlinde, Ostwald; xl/zeichnung/z1.xml: Ilka, Brandt | keine | ohne Fund |
| pfade-hauptteil.xlsx | Datei abgelehnt („Unbekanntes ZIP-Format. Unterstützt: .txt, .pdf, .docx, .xlsx, .csv“) | keine | ohne Fund |
| pfade-ueblich.docx | keine | keine | ohne Fund |
| pfade-unueblich.docx | anmerkungen/fussnoten.xml: Jonas, Wiesenthal; kopfzeilen/kopf1.xml: Gerlinde, Ostwald; notizen/kommentare.xml: Rosalie, Fennhoff | keine | ohne Fund |
| pfade-hauptteil.docx | Datei abgelehnt („Unbekanntes ZIP-Format. Unterstützt: .txt, .pdf, .docx, .xlsx, .csv“) | keine | ohne Fund |

- OK: pfade-ueblich.xlsx: nachher kein Testname in irgendeinem Teil, Schlusscheck ohne Fund – keine
- OK: pfade-ueblich.xlsx: Kommentar, Unterhaltung, Kopfzeile, Textfeld in der Prüfansicht
- OK: pfade-unueblich.xlsx: nachher kein Testname in irgendeinem Teil, Schlusscheck ohne Fund – keine
- OK: pfade-unueblich.xlsx: Kommentar, Unterhaltung, Kopfzeile, Textfeld in der Prüfansicht
- OK: pfade-hauptteil.xlsx: nachher kein Testname in irgendeinem Teil, Schlusscheck ohne Fund – keine
- OK: pfade-hauptteil.xlsx: Kommentar, Unterhaltung, Kopfzeile, Textfeld in der Prüfansicht
- OK: pfade-ueblich.docx: nachher kein Testname in irgendeinem Teil, Schlusscheck ohne Fund – keine
- OK: pfade-ueblich.docx: Kopfzeile, Fußzeile, Fußnote, Endnote, Kommentar in der Prüfansicht – Text, Text, Text, Tabelle, Kopfzeile, Fußzeile, Fußnote, Endnote, Kommentar
- OK: pfade-unueblich.docx: nachher kein Testname in irgendeinem Teil, Schlusscheck ohne Fund – keine
- OK: pfade-unueblich.docx: Kopfzeile, Fußzeile, Fußnote, Endnote, Kommentar in der Prüfansicht – Text, Text, Text, Tabelle, Kopfzeile, Fußzeile, Fußnote, Endnote, Kommentar
- OK: pfade-hauptteil.docx: nachher kein Testname in irgendeinem Teil, Schlusscheck ohne Fund – keine
- OK: pfade-hauptteil.docx: Kopfzeile, Fußzeile, Fußnote, Endnote, Kommentar in der Prüfansicht – Text, Text, Text, Tabelle, Kopfzeile, Fußzeile, Fußnote, Endnote, Kommentar

## 3. Kreislauf (rückbaufähig -> Rückbau), jeder Abschnitt exakt wie im Original
- pfade-phase0.xlsx: Urteil passend; 9 Abschnitte, falsch zurückgebaut 0; Kommentar anonymisiert: „Kommentar B2: Rückruf bei Vorname B Nachname B, Mutter Vorname E Nachname E“
- OK: pfade-phase0.xlsx: Kreislauf exakt (auch Kommentare)
- pfade-ueblich.xlsx: Urteil passend; 11 Abschnitte, falsch zurückgebaut 0; Kommentar anonymisiert: „Kommentar B2: Rückruf bei Herrn Vorname E Nachname E erbeten.“, „Kommentar (Unterhaltung) B3: Bitte mit Herrn Vorname F Nachname F klären.“
- OK: pfade-ueblich.xlsx: Kreislauf exakt (auch Kommentare)
- pfade-unueblich.xlsx: Urteil passend; 11 Abschnitte, falsch zurückgebaut 0; Kommentar anonymisiert: „Kommentar B2: Rückruf bei Herrn Vorname E Nachname E erbeten.“, „Kommentar (Unterhaltung) B3: Bitte mit Herrn Vorname F Nachname F klären.“
- OK: pfade-unueblich.xlsx: Kreislauf exakt (auch Kommentare)
- pfade-hauptteil.xlsx: Urteil passend; 11 Abschnitte, falsch zurückgebaut 0; Kommentar anonymisiert: „Kommentar B2: Rückruf bei Herrn Vorname E Nachname E erbeten.“, „Kommentar (Unterhaltung) B3: Bitte mit Herrn Vorname F Nachname F klären.“
- OK: pfade-hauptteil.xlsx: Kreislauf exakt (auch Kommentare)
- pfade-ueblich.docx: Urteil passend; 9 Abschnitte, falsch zurückgebaut 0; Kommentar anonymisiert: „Kommentar: Mit Frau Vorname F Nachname F abgestimmt.“
- OK: pfade-ueblich.docx: Kreislauf exakt (auch Kommentare)
- pfade-unueblich.docx: Urteil passend; 9 Abschnitte, falsch zurückgebaut 0; Kommentar anonymisiert: „Kommentar: Mit Frau Vorname F Nachname F abgestimmt.“
- OK: pfade-unueblich.docx: Kreislauf exakt (auch Kommentare)
- pfade-hauptteil.docx: Urteil passend; 9 Abschnitte, falsch zurückgebaut 0; Kommentar anonymisiert: „Kommentar: Mit Frau Vorname F Nachname F abgestimmt.“
- OK: pfade-hauptteil.docx: Kreislauf exakt (auch Kommentare)
- pfade-gegenprobe.xlsx: Urteil passend; 20 Abschnitte, falsch zurückgebaut 0; Kommentar anonymisiert: „Kommentar B2: Bitte Zeile prüfen.“, „Kommentar (Unterhaltung) B3: Bitte mit Herrn Vorname E Nachname E klären.“
- OK: pfade-gegenprobe.xlsx: Kreislauf exakt (auch Kommentare)
- pfade-gegenprobe.docx: Urteil passend; 14 Abschnitte, falsch zurückgebaut 0; Kommentar anonymisiert: „Kommentar: Mit Frau Vorname E Nachname E abgestimmt.“
- OK: pfade-gegenprobe.docx: Kreislauf exakt (auch Kommentare)

## 4. Gegenprobe: Namensteile wie Format-Schlüsselwörter (Thi, Val, Bold, Left, Auto, Row)
- pfade-gegenprobe.xlsx, vorher: Schlusscheck 12 Meldung(en): margin-left, auto, left, thin, ROW, LEFT, Bold; nicht ersetzt: keiner; Namensteile im Nutzertext der Ausgabe: keine
- pfade-gegenprobe.xlsx, nachher: Schlusscheck 0 Meldung(en); nicht ersetzt: keiner; Namensteile im Nutzertext der Ausgabe: keine
- OK: pfade-gegenprobe.xlsx: alle sechs Namen ersetzt, kein Namensteil im Nutzertext, keine Schlusscheck-Meldung aus Formatangaben
- pfade-gegenprobe.docx, vorher: Schlusscheck 27 Meldung(en): left, auto; nicht ersetzt: keiner; Namensteile im Nutzertext der Ausgabe: keine
- pfade-gegenprobe.docx, nachher: Schlusscheck 0 Meldung(en); nicht ersetzt: keiner; Namensteile im Nutzertext der Ausgabe: keine
- OK: pfade-gegenprobe.docx: alle sechs Namen ersetzt, kein Namensteil im Nutzertext, keine Schlusscheck-Meldung aus Formatangaben

## 5. Sicherheitsbeweis: durchsuchte und übersprungene Felder

Prüfname „Quenzlerin“ absichtlich in jedes Feld gesetzt; Suche wie im Schlusscheck (Version 2.4.1).

### Durchsucht (Name muss gefunden werden)
| Feld | Teil | gefunden |
|---|---|---|
| Word: Text (w:t) | word/document.xml | ja |
| Word: Feldfunktion (w:instrText) | word/document.xml | ja |
| Word: Feldfunktion (w:fldSimple w:instr) | word/document.xml | ja |
| Word: gelöschter Text (w:delText) | word/document.xml | ja |
| Word: Änderungsautor (w:author) | word/document.xml | ja |
| Word: Bildbeschreibung (wp:docPr descr) | word/document.xml | ja |
| Word: Bildtitel (wp:docPr title) | word/document.xml | ja |
| Word: Objektname (wp:docPr name) | word/document.xml | ja |
| Word: Bildname (pic:cNvPr name) | word/document.xml | ja |
| Word: Inhaltssteuerelement Titel (w:alias) | word/document.xml | ja |
| Word: Inhaltssteuerelement Tag (w:tag) | word/document.xml | ja |
| Word: Auswahlliste (w:listItem displayText) | word/document.xml | ja |
| Word: Auswahlliste (w:listItem value) | word/document.xml | ja |
| Word: Textmarke (w:bookmarkStart name) | word/document.xml | ja |
| Word: Link-Hinweis (w:hyperlink tooltip) | word/document.xml | ja |
| Word: Link auf Textmarke (w:hyperlink anchor) | word/document.xml | ja |
| Word: Formularfeld-Name (w:ffData/w:name) | word/document.xml | ja |
| Word: Formularfeld-Hilfe (w:statusText) | word/document.xml | ja |
| Word: Formularfeld-Hilfe (w:helpText) | word/document.xml | ja |
| Word: Formularfeld-Vorgabe (w:default) | word/document.xml | ja |
| Word: Formularfeld-Liste (w:listEntry) | word/document.xml | ja |
| Word: Link-Hinweis Bild (a:hlinkClick tooltip) | word/document.xml | ja |
| Word: Dokumentvariable (w:docVar name) | word/settings.xml | ja |
| Word: Dokumentvariable (w:docVar val) | word/settings.xml | ja |
| Word: Name einer eigenen Formatvorlage | word/styles.xml | ja |
| Word: Text einer Aufzählung (w:lvlText) | word/numbering.xml | ja |
| Word: Kommentar-Autor (w:author) | word/comments.xml | ja |
| Word: Kommentar-Kürzel (w:initials) | word/comments.xml | ja |
| Word: Personenliste (w15:person author) | word/people.xml | ja |
| Word: Personenliste (w15:presenceInfo userId) | word/people.xml | ja |
| Dateieigenschaft (dc:creator) | docProps/core.xml | ja |
| Dateieigenschaft (Company, Manager) | docProps/app.xml | ja |
| Benutzerdefinierte Eigenschaft (Name) | docProps/custom.xml | ja |
| Benutzerdefinierte Eigenschaft (Wert) | docProps/custom.xml | ja |
| SharePoint-/Zusatzdaten: Attribut (unbekannter Aufbau, alles durchsucht) | customXml/item1.xml | ja |
| SharePoint-/Zusatzdaten: Office-Namensraum, Attribut | customXml/item2.xml | ja |
| Unbekannter Teil mit eigenem Namensraum: Attribut | word/webextensions/webextension1.xml | ja |
| Teil, der kein sauberes XML ist (ganzer Inhalt) | word/kaputt.xml | ja |
| Externer Verweis (Target, TargetMode External) | word/_rels/document.xml.rels | ja |
| Interner Verweis (Target) | word/_rels/document.xml.rels | ja |
| Teilname (PartName in [Content_Types].xml) | [Content_Types].xml | ja |
| VML: Bildtitel (o:title) | word/vml1.vml | ja |
| VML: Alternativtext (alt) | word/vml1.vml | ja |
| VML: WordArt-Text (v:textpath string) | word/vml1.vml | ja |
| VML: Link (o:href) | word/vml1.vml | ja |
| Excel: Zelle (Inline-Text) | xl/worksheets/sheet1.xml | ja |
| Excel: gemeinsamer Text | xl/sharedStrings.xml | ja |
| Excel: Lautschrift (rPh) | xl/sharedStrings.xml | ja |
| Excel: Text in Formel (Zeichenkette) | xl/worksheets/sheet1.xml | ja |
| Excel: Blattverweis in Formel | xl/worksheets/sheet1.xml | ja |
| Excel: Kopfzeile (ohne Steuercodes) | xl/worksheets/sheet1.xml | ja |
| Excel: Fußzeile erste Seite | xl/worksheets/sheet1.xml | ja |
| Excel: Link-Ziel im Blatt (hyperlink location) | xl/worksheets/sheet1.xml | ja |
| Excel: Link-Hinweis (hyperlink tooltip) | xl/worksheets/sheet1.xml | ja |
| Excel: Link-Anzeige (hyperlink display) | xl/worksheets/sheet1.xml | ja |
| Excel: Gültigkeitsregel Eingabehinweis (prompt) | xl/worksheets/sheet1.xml | ja |
| Excel: Gültigkeitsregel Titel (promptTitle) | xl/worksheets/sheet1.xml | ja |
| Excel: Gültigkeitsregel Fehler (error) | xl/worksheets/sheet1.xml | ja |
| Excel: Gültigkeitsregel Fehlertitel (errorTitle) | xl/worksheets/sheet1.xml | ja |
| Excel: Gültigkeitsliste (formula1) | xl/worksheets/sheet1.xml | ja |
| Excel: bedingte Formatierung „Text enthält“ (cfRule text) | xl/worksheets/sheet1.xml | ja |
| Excel: Filterwert (filter val) | xl/worksheets/sheet1.xml | ja |
| Excel: benutzerdefinierter Filter (customFilter val) | xl/worksheets/sheet1.xml | ja |
| Excel: Blattname (sheet name) | xl/workbook.xml | ja |
| Excel: definierter Name (name) | xl/workbook.xml | ja |
| Excel: definierter Name (Kommentar) | xl/workbook.xml | ja |
| Excel: definierter Name (Inhalt) | xl/workbook.xml | ja |
| Excel: Schreibschutz-Benutzer (fileSharing userName) | xl/workbook.xml | ja |
| Excel: Kommentar-Autor | xl/comments1.xml | ja |
| Excel: Kommentartext | xl/comments1.xml | ja |
| Excel: Unterhaltung (threadedComment) | xl/threadedComments/threadedComment1.xml | ja |
| Excel: Personenliste (person displayName) | xl/persons/person.xml | ja |
| Excel: Personenliste (person userId) | xl/persons/person.xml | ja |
| Excel: Zahlenformat mit Text („"Herr "@“) | xl/styles.xml | ja |
| Excel: eigene Zellenformatvorlage (cellStyle ohne builtinId) | xl/styles.xml | ja |
| Excel: eigene Tabellenformatvorlage (tableStyle name) | xl/styles.xml | ja |
| Excel: Tabellenname (table name/displayName) | xl/tables/table1.xml | ja |
| Excel: Tabellenspalte (tableColumn name) | xl/tables/table1.xml | ja |
| Excel: Pivot-Feld (cacheField name) | xl/pivotCache/pivotCacheDefinition1.xml | ja |
| Excel: Pivot-Wert (s v) | xl/pivotCache/pivotCacheDefinition1.xml | ja |
| Excel: Pivot-Quelle (worksheetSource sheet) | xl/pivotCache/pivotCacheDefinition1.xml | ja |
| Excel: Pivot-Tabelle (Name, Element n, Datenfeld) | xl/pivotTables/pivotTable1.xml | ja |
| Excel: Verbindung (connection description) | xl/connections.xml | ja |
| Excel: Verbindung (dbPr connection) | xl/connections.xml | ja |
| Excel: Verbindung (sourceFile, odcFile) | xl/connections.xml | ja |
| Excel: verknüpfte Datei (sheetName val) | xl/externalLinks/externalLink1.xml | ja |
| Excel: Textfeld (a:t) | xl/drawings/drawing1.xml | ja |
| Excel: Bildbeschreibung (cNvPr descr) | xl/drawings/drawing1.xml | ja |
| Excel: Diagramm (c:v, c:f) | xl/charts/chart1.xml | ja |
| Excel: Datenschnitt (slicer caption) | xl/slicers/slicer1.xml | ja |
| Excel: Abfrage (queryTable name) | xl/queryTables/queryTable1.xml | ja |
| Excel: Kommentar-Rahmen (VML, Text) | xl/drawings/vmlDrawing1.vml | ja |

### Übersprungen (Formatangaben; Name darf hier nicht gemeldet werden)
| Feld | Teil | gemeldet | Grund |
|---|---|---|---|
| Excel: Rahmenart (border style) | xl/styles.xml | nein | Formatangabe (z. B. „thin“), kein Nutzertext |
| Excel: Ausrichtung (alignment horizontal) | xl/styles.xml | nein | Formatangabe („left“) |
| Excel: Schriftart (font name val) | xl/styles.xml | nein | Name einer Schriftart („Calibri“), kein Nutzertext |
| Excel: Farbe (color) | xl/styles.xml | nein | Formatangabe („auto“, Farbwert) |
| Excel: Formatzeichen im Zahlenformat (außerhalb von "…") | xl/styles.xml | nein | Formatzeichen (z. B. „[Red]“, „TT.MM.JJJJ“); Text in Anführungszeichen wird durchsucht |
| Excel: eingebaute Zellenformatvorlage (cellStyle mit builtinId) | xl/styles.xml | nein | eingebauter Name („Standard“, „Normal“) |
| Excel: Zellbezug, Typ, Stil (c r/t/s) | xl/worksheets/sheet1.xml | nein | Aufbauangabe |
| Excel: Seiteneinrichtung (pageSetup orientation) | xl/worksheets/sheet1.xml | nein | Formatangabe („landscape“) |
| Excel: Blattansicht (pane activePane) | xl/worksheets/sheet1.xml | nein | Formatangabe („bottomLeft“) |
| Excel: Funktionsname in Formel | xl/worksheets/sheet1.xml | nein | Funktionsname („ROW(“, „LEFT(“); Zeichenketten und Blattverweise werden durchsucht |
| Excel: Steuercode Kopfzeile (&"Schrift,Stil") | xl/worksheets/sheet1.xml | nein | Steuercode für Schrift („Bold“); der Text der Kopfzeile wird durchsucht |
| Word: Ausrichtung (w:jc) | word/document.xml | nein | Formatangabe („left“) |
| Word: Farbe (w:color) | word/document.xml | nein | Formatangabe („auto“) |
| Word: Schriftart (w:rFonts) | word/document.xml | nein | Name einer Schriftart |
| Word: Verweis auf Formatvorlage (w:pStyle) | word/document.xml | nein | Kennung der Vorlage; der Name einer eigenen Vorlage steht in styles.xml und wird dort durchsucht |
| Word: Tabellenbreite (w:tblW type) | word/document.xml | nein | Formatangabe („auto“) |
| Word: Sprache (w:lang) | word/styles.xml | nein | Sprachkennung („de-DE“) |
| Word: Name einer eingebauten Formatvorlage | word/styles.xml | nein | eingebauter Name („heading 1“, „Normal“); eigene Vorlagen (w:customStyle) werden durchsucht |
| Word: Änderungskennungen (w:rsid…) | word/document.xml | nein | Zufallskennung |
| VML: Form-Stil (style) | xl/drawings/vmlDrawing1.vml | nein | Formatangabe („margin-left“, „visibility:hidden“) |
| VML: Innenabstand (o:insetmode) | xl/drawings/vmlDrawing1.vml | nein | Formatangabe („auto“) |
| Verweistyp (Type) | word/_rels/document.xml.rels | nein | Kennung des Verweistyps (Adresse eines Standards) |
| Inhaltstyp (ContentType) | [Content_Types].xml | nein | Kennung des Dateityps |

- OK: Sicherheitsbeweis: Prüfname in allen 92 durchsuchten Feldern gefunden
- OK: Sicherheitsbeweis: in keinem der 23 übersprungenen Formatfelder gemeldet

## 6. Doppellauf, Anfragen nach außen, Firefox
- OK: Doppellauf pfade-gegenprobe.docx: zweimal dieselbe Ausgabe (byte-gleich)
- OK: Doppellauf pfade-gegenprobe.xlsx: zweimal dieselbe Ausgabe (byte-gleich)
- OK: Doppellauf pfade-hauptteil.docx: zweimal dieselbe Ausgabe (byte-gleich)
- OK: Doppellauf pfade-hauptteil.xlsx: zweimal dieselbe Ausgabe (byte-gleich)
- OK: Doppellauf pfade-phase0.xlsx: zweimal dieselbe Ausgabe (byte-gleich)
- OK: Doppellauf pfade-ueblich.docx: zweimal dieselbe Ausgabe (byte-gleich)
- OK: Doppellauf pfade-ueblich.xlsx: zweimal dieselbe Ausgabe (byte-gleich)
- OK: Doppellauf pfade-unueblich.docx: zweimal dieselbe Ausgabe (byte-gleich)
- OK: Doppellauf pfade-unueblich.xlsx: zweimal dieselbe Ausgabe (byte-gleich)
- OK: 0 Anfragen nach außen
- Firefox: nicht startbar (browserType.launch: Executable doesn't exist at /opt/pw-browsers/firefox-1543/firefox/firefox). Firefox-Läufe ungeprüft.

Prüfungen: 40 von 40 bestanden.
