# Testbericht Anonymisierer

Erzeugt mit tests/run-tests.mjs in Chromium (Playwright, headless) gegen index.html (SHA-256 fca6775fb9f3d16b…). Alle Testpersonen sind erfunden.

## protokoll.txt
- Laden: Gelesen: protokoll.txt (TXT, 22 Textabschnitte).
- **Erkannt (automatisch): 22 von 24 Personen vollständig**; Namens-Vorkommen: 65 von 69
- Nicht (vollständig) erkannt: Ijeoma Uchendu [nigerianisch (selten)] – übrig: Ijeoma, Uchendu; Xiong Wenjie [chinesisch (Pinyin, selten)] – übrig: Xiong, Wenjie
- Fehltreffer (aktiv, kein Name bzw. Falle): 1 – Bill (Falle)
- Fallen im Text: 13, davon als unsicher markiert aber AUS (richtig stehen gelassen): 11
- Personen in der Prüfansicht: 33; Treffer gesamt: 55 (sicher 40, unsicher 15)
- Schlusscheck vor Nacharbeit hat den Export BLOCKIERT („Schlusscheck-Funde mit dem Häkchen bestätigt“). Fundstellen: „Mai“ steht noch in: Zeile 10 bestätigter Name · „…(Leitung: Person U) bietet ab Mai wieder Suppe an. Auf dem Tisc…“ Ersetzen. Nach Bestätigung exportiert.
- Export (.txt) vor Nacharbeit: Status „Gespeichert: anonymisiert_text.txt – mit bestätigten Restfunden.“
  - Unabhängige Nachprüfung der Ausgabedatei: 4 Klarnamen-Vorkommen übrig (Ijeoma, Uchendu, Xiong, Wenjie)
  - Manuell per Antippen markiert: „Ijeoma“ (über die Oberfläche)
  - Weitere manuell markiert: Uchendu, Xiong, Wenjie
  - Nach manuellem Markieren: 69 von 69 Vorkommen abgedeckt
  - Schlusscheck nach Nacharbeit blockierte zunächst; Fundstellen: „Mai“ steht noch in: Zeile 10 bestätigter Name · „…(Leitung: Person U) bietet ab Mai wieder Suppe an. Auf dem Tisc…“ Ersetzen
  - Export nach Nacharbeit: Status „Gespeichert: anonymisiert_text.txt – mit bestätigten Restfunden.“; unabhängige Nachprüfung: 0 Klarnamen-Vorkommen übrig
- JavaScript-Fehler auf der Seite: keine

## mitarbeiter.csv
- Laden: Gelesen: mitarbeiter.csv (CSV, 47 Textabschnitte).
- **Erkannt (automatisch): 16 von 16 Personen vollständig**; Namens-Vorkommen: 35 von 35
- Nicht (vollständig) erkannt: keine
- Fehltreffer (aktiv, kein Name bzw. Falle): 0
- Fallen im Text: 3, davon als unsicher markiert aber AUS (richtig stehen gelassen): 3
- Personen in der Prüfansicht: 17; Treffer gesamt: 32 (sicher 29, unsicher 3)
- Schlusscheck vor Nacharbeit hat den Export BLOCKIERT („Schlusscheck-Funde mit dem Häkchen bestätigt“). Fundstellen: „Mai“ steht noch in: Zeile 4, Spalte 5 bestätigter Name · „…Elternzeit ab Mai…“ Ersetzen. Nach Bestätigung exportiert.
- Export (.csv) vor Nacharbeit: Status „Gespeichert: anonymisiert_tabelle.csv – mit bestätigten Restfunden.“
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
- Schlusscheck vor Nacharbeit hat den Export BLOCKIERT („Schlusscheck-Funde mit dem Häkchen bestätigt“). Fundstellen: „Mai“ steht noch in: Text bestätigter Name · „…(Leitung: Person U) bietet ab Mai wieder Suppe an. Auf dem Tisc…“ Ersetzen. Nach Bestätigung exportiert.
- Export (.docx) vor Nacharbeit: Status „Gespeichert: anonymisiert_dokument.docx – mit bestätigten Restfunden.“
  - Unabhängige Nachprüfung der Ausgabedatei: 4 Klarnamen-Vorkommen übrig (Ijeoma, Uchendu, Xiong, Wenjie)
  - Manuell per Antippen markiert: „Ijeoma“ (über die Oberfläche)
  - Weitere manuell markiert: Uchendu, Xiong, Wenjie
  - Nach manuellem Markieren: 92 von 92 Vorkommen abgedeckt
  - Schlusscheck nach Nacharbeit blockierte zunächst; Fundstellen: „Mai“ steht noch in: Text bestätigter Name · „…(Leitung: Person U) bietet ab Mai wieder Suppe an. Auf dem Tisc…“ Ersetzen
  - Export nach Nacharbeit: Status „Gespeichert: anonymisiert_dokument.docx – mit bestätigten Restfunden.“; unabhängige Nachprüfung: 0 Klarnamen-Vorkommen übrig
  - LibreOffice öffnet die Ausgabe: ja; Klarnamen im LibreOffice-Text: 0
  - Zusätzlich .txt-Export: Klarnamen übrig: 0
- JavaScript-Fehler auf der Seite: keine

## mitarbeiter.xlsx
- Laden: Gelesen: mitarbeiter.xlsx (XLSX, 52 Textabschnitte).
- **Erkannt (automatisch): 17 von 17 Personen vollständig**; Namens-Vorkommen: 47 von 47
- Nicht (vollständig) erkannt: keine
- Fehltreffer (aktiv, kein Name bzw. Falle): 0
- Fallen im Text: 5, davon als unsicher markiert aber AUS (richtig stehen gelassen): 5
- Personen in der Prüfansicht: 19; Treffer gesamt: 39 (sicher 34, unsicher 5)
- Schlusscheck vor Nacharbeit hat den Export BLOCKIERT („Schlusscheck-Funde mit dem Häkchen bestätigt“). Fundstellen: „Mai“ steht noch in: Blatt Yılmaz (ausgeblendet), Zelle A2 bestätigter Name · „…Gespräch mit Person O am 3. Mai…“ Ersetzen. Nach Bestätigung exportiert.
- Export (.xlsx) vor Nacharbeit: Status „Gespeichert: anonymisiert_tabelle.xlsx – mit bestätigten Restfunden.“
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
- Schlusscheck vor Nacharbeit hat den Export BLOCKIERT („Schlusscheck-Funde mit dem Häkchen bestätigt“). Fundstellen: „Mai“ steht noch in: Seite 1 bestätigter Name · „…(Leitung: Person U) bietet ab Mai wieder Suppe an. Auf dem Tisc…“ Ersetzen. Nach Bestätigung exportiert.
- Export (.docx) vor Nacharbeit: Status „Gespeichert: anonymisiert_dokument.docx – mit bestätigten Restfunden.“
  - Unabhängige Nachprüfung der Ausgabedatei: 4 Klarnamen-Vorkommen übrig (Ijeoma, Uchendu, Xiong, Wenjie)
  - Manuell per Antippen markiert: „Ijeoma“ (über die Oberfläche)
  - Weitere manuell markiert: Uchendu, Xiong, Wenjie
  - Nach manuellem Markieren: 87 von 87 Vorkommen abgedeckt
  - Schlusscheck nach Nacharbeit blockierte zunächst; Fundstellen: „Mai“ steht noch in: Seite 1 bestätigter Name · „…(Leitung: Person U) bietet ab Mai wieder Suppe an. Auf dem Tisc…“ Ersetzen
  - Export nach Nacharbeit: Status „Gespeichert: anonymisiert_dokument.docx – mit bestätigten Restfunden.“; unabhängige Nachprüfung: 0 Klarnamen-Vorkommen übrig
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
| xl/comments1.xml | <author>Gisela Prüferin</author> <t xml:space="preserve">Gisela Prüferin: Prüfen mit Ngozi Eze</t> | <author>Autor</author> <t xml:space="preserve">Person R: Prüfen mit Person S</t> |
| xl/workbook.xml | <sheet name="Mitarbeiter" <sheet name="Yılmaz" <sheet name="Notizen" <definedName name="NotizBlatt">'Yılmaz'!$A$1</definedName> | <sheet name="Mitarbeiter" <sheet name="Person C" <sheet name="Notizen" <definedName name="NotizBlatt">'Person C'!$A$1</definedName> |
| xl/worksheets/sheet1.xml | <f>"Ansprechpartner: "&amp;"Herr Kowalczyk"</f> <f>'Yılmaz'!A1</f> <f>LEN(B4)</f> <oddHeader>&amp;LListe von Anna Müller&amp;RSeite &amp;P</oddHeader> <oddFooter>&amp;CErstellt: Fatima Haddad</oddFooter> | <f>"Ansprechpartner: "&amp;"Herr Person B"</f> <f>'Person C'!A1</f> <f>LEN(B4)</f> <oddHeader>&amp;LListe von Person A&amp;RSeite &amp;P</oddHeader> <oddFooter>&amp;CErstellt: Person J</oddFooter> |
- Vorschaubild/Thumbnail vorhanden nachher: nein

## Determinismus (Doppellauf)
- protokoll.txt: Lauf 1 a29844c8bb3ee675 / Lauf 2 a29844c8bb3ee675; Pseudonym-Zuordnung 0e36160d38ce70ac / 0e36160d38ce70ac → identisch
- mitarbeiter.csv: Lauf 1 44b3e4b748d34dbd / Lauf 2 44b3e4b748d34dbd; Pseudonym-Zuordnung 326b38db990fe99c / 326b38db990fe99c → identisch
- protokoll.docx: Lauf 1 93b6f8c7c9a57aa1 / Lauf 2 93b6f8c7c9a57aa1; Pseudonym-Zuordnung e86fa7d93e8f4d7a / e86fa7d93e8f4d7a → identisch
- mitarbeiter.xlsx: Lauf 1 ac4f3a36a00c8be6 / Lauf 2 ac4f3a36a00c8be6; Pseudonym-Zuordnung 13a16e26ee4e1c67 / 13a16e26ee4e1c67 → identisch
- protokoll.pdf: Lauf 1 3a3977dfea99ec6d / Lauf 2 3a3977dfea99ec6d; Pseudonym-Zuordnung 074aa110b73adf3a / 074aa110b73adf3a → identisch

## Nicht unterstützte Dateien (müssen klar abgelehnt werden)
- gescannt.pdf: „PDF enthält keinen Text, evtl. gescannt. Gescannte PDFs (Bilder) werden nicht unterstützt.“ – Prüfen nicht erreichbar („Weiter zum Prüfen“ gesperrt, kein Teilergebnis)
- alt-format.doc: „Altes Office-Format (.doc/.xls) oder verschlüsselte/passwortgeschützte Datei. Das wird nicht unterstützt. Bitte in Word/Excel als .docx bzw. .xlsx (ohne Passwort) speichern.“ – Prüfen nicht erreichbar („Weiter zum Prüfen“ gesperrt, kein Teilergebnis)
- alt-format.xls: „Altes Office-Format (.doc/.xls) oder verschlüsselte/passwortgeschützte Datei. Das wird nicht unterstützt. Bitte in Word/Excel als .docx bzw. .xlsx (ohne Passwort) speichern.“ – Prüfen nicht erreichbar („Weiter zum Prüfen“ gesperrt, kein Teilergebnis)

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
- TXT 1 MB: Laden+Analyse 1.7 s, Export+Schlusscheck 3.2 s, JS-Speicher ca. 58 MB – Gelesen: gross.txt (TXT, 13289 Textabschnitte).
- TXT 5 MB: Laden+Analyse 5.9 s, Export+Schlusscheck 16.3 s, JS-Speicher ca. 215 MB – Gelesen: gross.txt (TXT, 66419 Textabschnitte).
- TXT 10 MB: Laden+Analyse 13.7 s, Export+Schlusscheck 51.7 s, JS-Speicher ca. 228 MB – Gelesen: gross.txt (TXT, 132815 Textabschnitte).
- XLSX mit 20 000 Zeilen × 4 Spalten (0.5 MB gepackt): Laden+Analyse 3.7 s, Export+Schlusscheck 5.4 s, JS-Speicher ca. 257 MB – Gelesen: gross.xlsx (XLSX, 60052 Textabschnitte).

## Netzwerkzugriffe während aller Tests
- Anfragen gesamt: 23; davon nicht lokal (http/https/ws …): 0
- Lokale Anfragen: file://…/index.html
