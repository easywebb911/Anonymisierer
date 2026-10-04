# Testbericht Anonymisierer

Erzeugt mit tests/run-tests.mjs in Chromium (Playwright, headless) gegen index.html (SHA-256 e8ff8011a5bdc008…). Alle Testpersonen sind erfunden.

## protokoll.txt
- Laden: Gelesen: protokoll.txt (TXT, 22 Textabschnitte).
- **Erkannt (automatisch): 22 von 24 Personen vollständig**; Namens-Vorkommen: 65 von 69
- Nicht (vollständig) erkannt: Ijeoma Uchendu [nigerianisch (selten)] – übrig: Ijeoma, Uchendu; Xiong Wenjie [chinesisch (Pinyin, selten)] – übrig: Xiong, Wenjie
- Fehltreffer (aktiv, kein Name bzw. Falle): 1 – Bill (Falle)
- Fallen im Text: 13, davon als unsicher markiert aber AUS (richtig stehen gelassen): 11
- Personen in der Prüfansicht: 33; Treffer gesamt: 55 (sicher 40, unsicher 15)
- Schlusscheck vor Nacharbeit hat den Export BLOCKIERT („Schlusscheck: 3 bestätigte(r) Klarname(n) noch im Ergebnis gefunden. Export blockiert – bitte prüfen (siehe unten).“). Fundstellen: Winter (Person S) – Text: „…erichtete über das Projekt im Winter; die Ergebnisse liegen Person…“ | Mai (Person K) – Text: „…(Leitung: Person U) bietet ab Mai wieder Suppe an. Auf dem Tisc…“ | Rose (Person U) – Text: „… an. Auf dem Tisch stand eine Rose. Unser Koch hat gekündigt. Pe…“. Nach Bestätigung exportiert.
- Export (.txt) vor Nacharbeit: Status „Gespeichert: anonymisiert_text.txt (mit bestätigten Restfunden)“
  - Unabhängige Nachprüfung der Ausgabedatei: 4 Klarnamen-Vorkommen übrig (Ijeoma, Uchendu, Xiong, Wenjie)
  - Manuell per Antippen markiert: „Ijeoma“ (über die Oberfläche)
  - Weitere manuell markiert: Uchendu, Xiong, Wenjie
  - Nach manuellem Markieren: 69 von 69 Vorkommen abgedeckt
  - Schlusscheck nach Nacharbeit blockierte zunächst; Fundstellen: Winter (Person S) – Text: „…erichtete über das Projekt im Winter; die Ergebnisse liegen Person…“ | Mai (Person K) – Text: „…(Leitung: Person U) bietet ab Mai wieder Suppe an. Auf dem Tisc…“ | Rose (Person U) – Text: „… an. Auf dem Tisch stand eine Rose. Unser Koch hat gekündigt. Pe…“
  - Export nach Nacharbeit: Status „Gespeichert: anonymisiert_text.txt (mit bestätigten Restfunden)“; unabhängige Nachprüfung: 0 Klarnamen-Vorkommen übrig
- JavaScript-Fehler auf der Seite: keine

## mitarbeiter.csv
- Laden: Gelesen: mitarbeiter.csv (CSV, 47 Textabschnitte).
- **Erkannt (automatisch): 16 von 16 Personen vollständig**; Namens-Vorkommen: 35 von 35
- Nicht (vollständig) erkannt: keine
- Fehltreffer (aktiv, kein Name bzw. Falle): 0
- Fallen im Text: 3, davon als unsicher markiert aber AUS (richtig stehen gelassen): 3
- Personen in der Prüfansicht: 27; Treffer gesamt: 32 (sicher 27, unsicher 5)
- Schlusscheck vor Nacharbeit hat den Export BLOCKIERT („Schlusscheck: 2 bestätigte(r) Klarname(n) noch im Ergebnis gefunden. Export blockiert – bitte prüfen (siehe unten).“). Fundstellen: Mai (Person I) – Text: „…son H;Vertrieb;;Elternzeit ab Mai Person J;Person K;IT;;Schulu…“ | Rose (Person U) – Text: „…erson U;Person V;Kantine;;Die Rose auf dem Tisch ist Deko Perso…“. Nach Bestätigung exportiert.
- Export (.csv) vor Nacharbeit: Status „Gespeichert: anonymisiert_tabelle.csv (mit bestätigten Restfunden)“
  - Unabhängige Nachprüfung der Ausgabedatei: 0 Klarnamen-Vorkommen übrig
  - Zusätzlich .txt-Export: Klarnamen übrig: 0
- JavaScript-Fehler auf der Seite: keine

## protokoll.docx
- Laden: Gelesen: protokoll.docx (DOCX, 35 Textabschnitte).
- **Erkannt (automatisch): 22 von 24 Personen vollständig**; Namens-Vorkommen: 88 von 92
- Nicht (vollständig) erkannt: Ijeoma Uchendu [nigerianisch (selten)] – übrig: Ijeoma, Uchendu; Xiong Wenjie [chinesisch (Pinyin, selten)] – übrig: Xiong, Wenjie
- Fehltreffer (aktiv, kein Name bzw. Falle): 3 – Bill (Falle), Name, Kasse
- Fallen im Text: 14, davon als unsicher markiert aber AUS (richtig stehen gelassen): 12
- Personen in der Prüfansicht: 35; Treffer gesamt: 70 (sicher 52, unsicher 18)
- Schlusscheck vor Nacharbeit hat den Export BLOCKIERT („Schlusscheck: 3 bestätigte(r) Klarname(n) noch im Ergebnis gefunden. Export blockiert – bitte prüfen (siehe unten).“). Fundstellen: Winter (Person S) – word/document.xml: „…über das Projekt im preserve Winter preserve ; die Ergebnisse lie…“ | Mai (Person K) – word/document.xml: „…preserve preserve ) bietet ab Mai wieder Suppe an. Auf dem Tisc…“ | Rose (Person U) – word/document.xml: „…em Tisch stand eine preserve Rose preserve . Unser preserve Ko…“. Nach Bestätigung exportiert.
- Export (.docx) vor Nacharbeit: Status „Gespeichert: anonymisiert_dokument.docx (mit bestätigten Restfunden)“
  - Unabhängige Nachprüfung der Ausgabedatei: 4 Klarnamen-Vorkommen übrig (Ijeoma, Uchendu, Xiong, Wenjie)
  - Manuell per Antippen markiert: „Ijeoma“ (über die Oberfläche)
  - Weitere manuell markiert: Uchendu, Xiong, Wenjie
  - Nach manuellem Markieren: 92 von 92 Vorkommen abgedeckt
  - Schlusscheck nach Nacharbeit blockierte zunächst; Fundstellen: Winter (Person S) – word/document.xml: „…über das Projekt im preserve Winter preserve ; die Ergebnisse lie…“ | Mai (Person K) – word/document.xml: „…preserve preserve ) bietet ab Mai wieder Suppe an. Auf dem Tisc…“ | Rose (Person U) – word/document.xml: „…em Tisch stand eine preserve Rose preserve . Unser preserve Ko…“
  - Export nach Nacharbeit: Status „Gespeichert: anonymisiert_dokument.docx (mit bestätigten Restfunden)“; unabhängige Nachprüfung: 0 Klarnamen-Vorkommen übrig
  - LibreOffice öffnet die Ausgabe: ja; Klarnamen im LibreOffice-Text: 0
  - Zusätzlich .txt-Export: Klarnamen übrig: 0
- JavaScript-Fehler auf der Seite: keine

## mitarbeiter.xlsx
- Laden: Gelesen: mitarbeiter.xlsx (XLSX, 52 Textabschnitte).
- **Erkannt (automatisch): 17 von 17 Personen vollständig**; Namens-Vorkommen: 48 von 48
- Nicht (vollständig) erkannt: keine
- Fehltreffer (aktiv, kein Name bzw. Falle): 0
- Fallen im Text: 4, davon als unsicher markiert aber AUS (richtig stehen gelassen): 4
- Personen in der Prüfansicht: 23; Treffer gesamt: 39 (sicher 33, unsicher 6)
- Schlusscheck vor Nacharbeit hat den Export BLOCKIERT („Schlusscheck: 1 bestätigte(r) Klarname(n) noch im Ergebnis gefunden. Export blockiert – bitte prüfen (siehe unten).“). Fundstellen: Rose (Person R) – xl/sharedStrings.xml: „…reserve Kantine preserve eine Rose als Deko preserve Leitung: p…“. Nach Bestätigung exportiert.
- Export (.xlsx) vor Nacharbeit: Status „Gespeichert: anonymisiert_tabelle.xlsx (mit bestätigten Restfunden)“
  - Unabhängige Nachprüfung der Ausgabedatei: 0 Klarnamen-Vorkommen übrig
  - LibreOffice öffnet die Ausgabe: ja; Klarnamen im LibreOffice-Text: 0
  - Zusätzlich .txt-Export: Klarnamen übrig: 0
- JavaScript-Fehler auf der Seite: keine

## protokoll.pdf
- Laden: Gelesen: protokoll.pdf (PDF, 1 Textabschnitte).
- **Erkannt (automatisch): 22 von 24 Personen vollständig**; Namens-Vorkommen: 83 von 87
- Nicht (vollständig) erkannt: Ijeoma Uchendu [nigerianisch (selten)] – übrig: Ijeoma, Uchendu; Xiong Wenjie [chinesisch (Pinyin, selten)] – übrig: Xiong, Wenjie
- Fehltreffer (aktiv, kein Name bzw. Falle): 3 – Bill (Falle), Name, Kasse
- Fallen im Text: 13, davon als unsicher markiert aber AUS (richtig stehen gelassen): 11
- Personen in der Prüfansicht: 37; Treffer gesamt: 68 (sicher 50, unsicher 18)
- Schlusscheck vor Nacharbeit hat den Export BLOCKIERT („Schlusscheck: 3 bestätigte(r) Klarname(n) noch im Ergebnis gefunden. Export blockiert – bitte prüfen (siehe unten).“). Fundstellen: Winter (Person S) – word/document.xml: „…erichtete über das Projekt im Winter; die preserve Ergebnisse lieg…“ | Mai (Person K) – word/document.xml: „…(Leitung: Person U) bietet ab Mai wieder Suppe an. preserve Auf…“ | Rose (Person U) – word/document.xml: „…erve Auf dem Tisch stand eine Rose. Unser Koch hat gekündigt. pr…“. Nach Bestätigung exportiert.
- Export (.docx) vor Nacharbeit: Status „Gespeichert: anonymisiert_dokument.docx (mit bestätigten Restfunden)“
  - Unabhängige Nachprüfung der Ausgabedatei: 4 Klarnamen-Vorkommen übrig (Ijeoma, Uchendu, Xiong, Wenjie)
  - Manuell per Antippen markiert: „Ijeoma“ (über die Oberfläche)
  - Weitere manuell markiert: Uchendu, Xiong, Wenjie
  - Nach manuellem Markieren: 87 von 87 Vorkommen abgedeckt
  - Schlusscheck nach Nacharbeit blockierte zunächst; Fundstellen: Winter (Person S) – word/document.xml: „…erichtete über das Projekt im Winter; die preserve Ergebnisse lieg…“ | Mai (Person K) – word/document.xml: „…(Leitung: Person U) bietet ab Mai wieder Suppe an. preserve Auf…“ | Rose (Person U) – word/document.xml: „…erve Auf dem Tisch stand eine Rose. Unser Koch hat gekündigt. pr…“
  - Export nach Nacharbeit: Status „Gespeichert: anonymisiert_dokument.docx (mit bestätigten Restfunden)“; unabhängige Nachprüfung: 0 Klarnamen-Vorkommen übrig
  - LibreOffice öffnet die Ausgabe: ja; Klarnamen im LibreOffice-Text: 0
  - Zusätzlich .txt-Export: Klarnamen übrig: 0
- JavaScript-Fehler auf der Seite: keine

## Metadaten-Nachweis (DOCX und XLSX)
### protokoll.docx
| Teil | vorher | nachher |
|---|---|---|
| docProps/core.xml | <dc:title>Protokoll Team Müller</dc:title> <dc:creator>Gisela Prüferin</dc:creator> <cp:keywords>Yılmaz, Kowalczyk</cp:keywords> <cp:lastModifiedBy>Bernd Bearbeiter</cp:lastModifiedBy> | (leer) |
| docProps/app.xml | <Company>Beispiel GmbH</Company> <Manager>Hanna Chefin</Manager> | (leer) |
| docProps/custom.xml | <vt:lpwstr>Gisela Prüferin</vt:lpwstr> | (leer) |
| word/comments.xml | w:author="Gisela Prüferin" w:initials="GP" <w:t xml:space="preserve">Bitte mit Ayşe Öztürk und Herrn Okonkwo klären.</w:t> | w:author="Autor" w:initials="A" <w:t xml:space="preserve">Bitte mit Person E und Herrn Person L klären.</w:t> |
| word/document.xml | w:author="Bernd Bearbeiter" w:author="Bernd Bearbeiter" | w:author="Autor" w:author="Autor" |
| word/people.xml | w15:author="Gisela Prüferin" w15:userId="gisela.prueferin@beispiel-firma.de" | w15:author="Autor" w15:userId="" |
| word/header1.xml | <w:t xml:space="preserve">Vertraulich – erstellt von Anna Müller</w:t> | <w:t xml:space="preserve">Vertraulich – erstellt von Person A</w:t> |
| word/footer1.xml | <w:t xml:space="preserve">Verteiler: Mehmet Yılmaz, </w:t> <w:t xml:space="preserve">Ayşe Öz</w:t> <w:t>türk</w:t> | <w:t xml:space="preserve">Verteiler: Person D, </w:t> <w:t xml:space="preserve">Person E</w:t> |
| word/footnotes.xml | <w:t xml:space="preserve"> Siehe Vermerk von Krzysztof Kowalczyk vom 1. März.</w:t> | <w:t xml:space="preserve"> Siehe Vermerk von Person I vom 1. März.</w:t> |
| word/_rels/settings.xml.rels | Target="file:///C:\Users\gpruefer\Vorlagen\Brief.dotx" | Target="file:///C:\Users\benutzer\Vorlagen\Brief.dotx" |
| word/_rels/document.xml.rels | Target="mailto:anna.mueller@beispiel-firma.de" | Target="mailto:[E-MAIL]" |
- Vorschaubild/Thumbnail vorhanden nachher: nein

### mitarbeiter.xlsx
| Teil | vorher | nachher |
|---|---|---|
| docProps/core.xml | <dc:creator>Gisela Prüferin</dc:creator> <cp:lastModifiedBy>Bernd Bearbeiter</cp:lastModifiedBy> | (leer) |
| docProps/app.xml | <Company>Beispiel GmbH</Company> <vt:lpstr>Mitarbeiter</vt:lpstr> <vt:lpstr>Yılmaz</vt:lpstr> <vt:lpstr>Notizen</vt:lpstr> | <vt:lpstr>Mitarbeiter</vt:lpstr> <vt:lpstr>Person C</vt:lpstr> <vt:lpstr>Notizen</vt:lpstr> |
| xl/comments1.xml | <author>Gisela Prüferin</author> <t xml:space="preserve">Gisela Prüferin: Prüfen mit Ngozi Eze</t> | <author>Autor</author> <t xml:space="preserve">Person V: Prüfen mit Person W</t> |
| xl/workbook.xml | <sheet name="Mitarbeiter" <sheet name="Yılmaz" <sheet name="Notizen" <definedName name="NotizBlatt">'Yılmaz'!$A$1</definedName> | <sheet name="Mitarbeiter" <sheet name="Person C" <sheet name="Notizen" <definedName name="NotizBlatt">'Person C'!$A$1</definedName> |
| xl/worksheets/sheet1.xml | <f>"Ansprechpartner: "&amp;"Herr Kowalczyk"</f> <f>'Yılmaz'!A1</f> <f>LEN(B4)</f> <oddHeader>&amp;LListe von Anna Müller&amp;RSeite &amp;P</oddHeader> <oddFooter>&amp;CErstellt: Fatima Haddad</oddFooter> | <f>"Ansprechpartner: "&amp;"Herr Person B"</f> <f>'Person C'!A1</f> <f>LEN(B4)</f> <oddHeader>&amp;LListe von Person A&amp;RSeite &amp;P</oddHeader> <oddFooter>&amp;CErstellt: Person M</oddFooter> |
- Vorschaubild/Thumbnail vorhanden nachher: nein

## Determinismus (Doppellauf)
- protokoll.txt: Lauf 1 a29844c8bb3ee675 / Lauf 2 a29844c8bb3ee675; Pseudonym-Zuordnung 0e36160d38ce70ac / 0e36160d38ce70ac → identisch
- mitarbeiter.csv: Lauf 1 48dff6cc89e7ed3c / Lauf 2 48dff6cc89e7ed3c; Pseudonym-Zuordnung d6daf99b6ceba931 / d6daf99b6ceba931 → identisch
- protokoll.docx: Lauf 1 7e6750cbd126603f / Lauf 2 7e6750cbd126603f; Pseudonym-Zuordnung e86fa7d93e8f4d7a / e86fa7d93e8f4d7a → identisch
- mitarbeiter.xlsx: Lauf 1 d62d2e84a0bcf277 / Lauf 2 d62d2e84a0bcf277; Pseudonym-Zuordnung 862622377e2eb6cb / 862622377e2eb6cb → identisch
- protokoll.pdf: Lauf 1 3a3977dfea99ec6d / Lauf 2 3a3977dfea99ec6d; Pseudonym-Zuordnung 074aa110b73adf3a / 074aa110b73adf3a → identisch

## Nicht unterstützte Dateien (müssen klar abgelehnt werden)
- gescannt.pdf: „PDF enthält keinen Text, evtl. gescannt. Gescannte PDFs (Bilder) werden nicht unterstützt.“ – Prüfansicht nicht angezeigt (kein Teilergebnis)
- alt-format.doc: „Altes Office-Format (.doc/.xls) oder verschlüsselte/passwortgeschützte Datei. Das wird nicht unterstützt. Bitte in Word/Excel als .docx bzw. .xlsx (ohne Passwort) speichern.“ – Prüfansicht nicht angezeigt (kein Teilergebnis)
- alt-format.xls: „Altes Office-Format (.doc/.xls) oder verschlüsselte/passwortgeschützte Datei. Das wird nicht unterstützt. Bitte in Word/Excel als .docx bzw. .xlsx (ohne Passwort) speichern.“ – Prüfansicht nicht angezeigt (kein Teilergebnis)

## Netzwerksperre zur Laufzeit (Versuche aus der Seite heraus)
- fetch: gesperrt (Offline-Modus: fetch ist gesperrt.)
- XMLHttpRequest: gesperrt (Offline-Modus: XMLHttpRequest ist gesperrt.)
- WebSocket: gesperrt (Offline-Modus: WebSocket ist gesperrt.)
- navigator.sendBeacon: gesperrt (Offline-Modus: sendBeacon ist gesperrt.)
- Bild laden (img): gesperrt (blockiert)
- Vom Browser registrierte Anfragen dieses Versuchs: https://example.com/x.png → abgebrochen: csp

## Browser-Speicher
- Nach Laden und manuellem Markieren, Schalter AUS: localStorage 0 Einträge, sessionStorage 0, Cookies 0 Zeichen
- Nach Einschalten des Schalters (mit Warnhinweis bestätigt): localStorage 1 Eintrag (anonymisierer.merkliste.v1)
- Nach „Merkliste löschen“: localStorage 0 Einträge

## Größe/Geschwindigkeit (Desktop-Chromium, headless)
- TXT 1 MB: Laden+Analyse 3.3 s, Export+Schlusscheck 2.7 s, JS-Speicher ca. 73 MB – Gelesen: gross.txt (TXT, 13289 Textabschnitte).
- TXT 5 MB: Laden+Analyse 17.6 s, Export+Schlusscheck 14.9 s, JS-Speicher ca. 290 MB – Gelesen: gross.txt (TXT, 66419 Textabschnitte).
- TXT 10 MB: Laden+Analyse 42.9 s, Export+Schlusscheck 30.6 s, JS-Speicher ca. 595 MB – Gelesen: gross.txt (TXT, 132815 Textabschnitte).
- XLSX mit 20 000 Zeilen × 4 Spalten (0.5 MB gepackt): Laden+Analyse 7.9 s, Export+Schlusscheck 15.5 s, JS-Speicher ca. 257 MB – Gelesen: gross.xlsx (XLSX, 60052 Textabschnitte).

## Netzwerkzugriffe während aller Tests
- Anfragen gesamt: 23; davon nicht lokal (http/https/ws …): 0
- Lokale Anfragen: file://…/index.html
