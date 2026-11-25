# Tabellen: Spalten behandeln (Version 2.10.0)

Neue Version: index.html; Gegenprobe: main (2.9.0), tests/out-alt/index-2.9.0.html. Nur Chromium, Firefox prüft Easy. Alle Daten erfunden.

## 1. Vorschlag anhand der Überschrift (stammdaten.xlsx und stammdaten.csv)
- OK: stammdaten.xlsx: Vorschlag für alle 40 Spalten wie erwartet
- OK: stammdaten.xlsx: Übersicht zeigt jede Spalte mit gewählter Behandlung (Auswahl = Vorschlag)

| Spalte | Vorschlag | Gruppen |
|---|---|---|
| Nachname | Name | name |
| Rufname | Name | name |
| Vornamen laut Geburtsurkunde | Name | name |
| Geschlecht | wie bisher | – |
| Geburtsdatum | ganz ersetzen (date) | date |
| Geburtsort | ganz ersetzen (info) | info |
| Muttersprache | ganz ersetzen (info) | info |
| Staatsangehörigkeit | ganz ersetzen (info) | info |
| Religion | ganz ersetzen (info) | info |
| Gewünschter Zweig | wie bisher | – |
| Gesundheitliche Beeinträchtigung | ganz ersetzen (info) | info |
| Erläuterung | ganz ersetzen (info) | info |
| 1. Erziehungsberechtigte/r akad. Titel | wie bisher | – |
| 1. Erziehungsberechtigte/r Nachname | Name | name |
| 1. Erziehungsberechtigte/r Vorname | Name | name |
| 1. Strasse | ganz ersetzen (address) | address |
| 1. Hausnummer | ganz ersetzen (address) | address |
| 1. PLZ | ganz ersetzen (address) | address |
| 1. Ort | ganz ersetzen (address) | address |
| 1. GKZ | ganz ersetzen (info) | info |
| 1. Telefon | ganz ersetzen (phone) | phone |
| 1. E-Mail | ganz ersetzen (email) | email |
| 1. Handy | ganz ersetzen (phone) | phone |
| 1. Telefon für Notfälle | ganz ersetzen (phone) | phone |
| 1. Bemerkung Notfallnummer | ganz ersetzen (info) | phone + info (Konflikt) |
| 2. Erziehungsberechtigte/r Nachname | Name | name |
| 2. Erziehungsberechtigte/r Vorname | Name | name |
| 2. Strasse | ganz ersetzen (address) | address |
| 2. Hausnummer | ganz ersetzen (address) | address |
| 2. PLZ | ganz ersetzen (address) | address |
| 2. Ort | ganz ersetzen (address) | address |
| Sorgerecht | ganz ersetzen (info) | info |
| Kind wohnt | wie bisher | – |
| Übertritt von | ganz ersetzen (org) | org |
| Schulnummer | ganz ersetzen (info) | info |
| Von Jgst. | wie bisher | – |
| Ergebnis des Übertrittszeugnisses | wie bisher | – |
| Wunschpartner in der Klasse | Name | name |
| Ganztag | wie bisher | – |
| Notizen der Schule | ganz ersetzen (info) | org + info (Konflikt) |

Konflikte: „1. Bemerkung Notfallnummer“ (phone + info → info); „Notizen der Schule“ (org + info → info)
- OK: stammdaten.xlsx: Zahl der gefüllten Zellen zählt auch Datums- und Zahlzellen (Geburtsdatum 30) – Geburtsdatum 30 Zellen gefüllt Name ganz ersetzen wie bisher als [DATUM]
  (oben 33, eingeklappt 7, offen: false)
- OK: stammdaten.xlsx: Spalten „Name“/„ganz ersetzen“ oben, „wie bisher“ darunter einklappbar – 33 Zeilen
- OK: stammdaten.csv: Vorschlag für alle 40 Spalten wie erwartet
- OK: stammdaten.csv: Übersicht zeigt jede Spalte mit gewählter Behandlung (Auswahl = Vorschlag)

## 2. Ohne jeden Klick außer „So übernehmen“: Klartext-Zellen je Spalte (Excel und CSV, drei Modi)
- OK: stammdaten.xlsx, person: keine Zelle mit Originalwert in Spalten „Name“/„ganz ersetzen“
- OK: stammdaten.xlsx, person: keine JS-Fehler
- OK: stammdaten.xlsx, name: keine Zelle mit Originalwert in Spalten „Name“/„ganz ersetzen“
- OK: stammdaten.xlsx, name: keine JS-Fehler
- OK: stammdaten.xlsx, reversible: keine Zelle mit Originalwert in Spalten „Name“/„ganz ersetzen“
- OK: stammdaten.xlsx, reversible: keine JS-Fehler
- OK: stammdaten.xlsx, „Unsichere Treffer“ aus: keine Zelle mit Originalwert in Spalten „Name“/„ganz ersetzen“
- OK: stammdaten.csv, person: keine Zelle mit Originalwert in Spalten „Name“/„ganz ersetzen“
- OK: stammdaten.csv, person: keine JS-Fehler
- OK: stammdaten.csv, name: keine Zelle mit Originalwert in Spalten „Name“/„ganz ersetzen“
- OK: stammdaten.csv, name: keine JS-Fehler
- OK: stammdaten.csv, reversible: keine Zelle mit Originalwert in Spalten „Name“/„ganz ersetzen“
- OK: stammdaten.csv, reversible: keine JS-Fehler
- OK: stammdaten.csv, „Unsichere Treffer“ aus: keine Zelle mit Originalwert in Spalten „Name“/„ganz ersetzen“

Zellen mit Klartext (ganz oder teilweise; von 30) je Spalte: main → jetzt. Spalten: Excel Person A / [NAME] / rückbaufähig, CSV Person A / [NAME] / rückbaufähig.

| Spalte | Vorschlag | xlsx Person | xlsx [NAME] | xlsx rückbau | csv Person | csv [NAME] | csv rückbau |
|---|---|---|---|---|---|---|---|
| Nachname | name | 0 → 0 | 0 → 0 | 0 → 0 | 0 → 0 | 0 → 0 | 0 → 0 |
| Rufname | name | 0 → 0 | 0 → 0 | 0 → 0 | 0 → 0 | 0 → 0 | 0 → 0 |
| Vornamen laut Geburtsurkunde | name | 0 → 0 | 0 → 0 | 0 → 0 | 0 → 0 | 0 → 0 | 0 → 0 |
| Geburtsdatum | ganz ersetzen date | 0 → 0 | 0 → 0 | 0 → 0 | 30 → 0 | 30 → 0 | 30 → 0 |
| Geburtsort | ganz ersetzen info | 27 → 0 | 27 → 0 | 27 → 0 | 27 → 0 | 27 → 0 | 27 → 0 |
| Muttersprache | ganz ersetzen info | 29 → 0 | 29 → 0 | 29 → 0 | 29 → 0 | 29 → 0 | 29 → 0 |
| Staatsangehörigkeit | ganz ersetzen info | 30 → 0 | 30 → 0 | 30 → 0 | 30 → 0 | 30 → 0 | 30 → 0 |
| Religion | ganz ersetzen info | 30 → 0 | 30 → 0 | 30 → 0 | 30 → 0 | 30 → 0 | 30 → 0 |
| Gesundheitliche Beeinträchtigung | ganz ersetzen info | 30 → 0 | 30 → 0 | 30 → 0 | 30 → 0 | 30 → 0 | 30 → 0 |
| Erläuterung | ganz ersetzen info | 10 → 0 | 10 → 0 | 10 → 0 | 10 → 0 | 10 → 0 | 10 → 0 |
| 1. Erziehungsberechtigte/r Nachname | name | 0 → 0 | 0 → 0 | 0 → 0 | 3 → 0 | 3 → 0 | 3 → 0 |
| 1. Erziehungsberechtigte/r Vorname | name | 5 → 0 | 5 → 0 | 5 → 0 | 5 → 0 | 5 → 0 | 5 → 0 |
| 1. Strasse | ganz ersetzen address | 30 → 0 | 30 → 0 | 30 → 0 | 30 → 0 | 30 → 0 | 30 → 0 |
| 1. Hausnummer | ganz ersetzen address | 30 → 0 | 30 → 0 | 30 → 0 | 30 → 0 | 30 → 0 | 30 → 0 |
| 1. PLZ | ganz ersetzen address | 30 → 0 | 30 → 0 | 30 → 0 | 30 → 0 | 30 → 0 | 30 → 0 |
| 1. Ort | ganz ersetzen address | 30 → 0 | 30 → 0 | 30 → 0 | 30 → 0 | 30 → 0 | 30 → 0 |
| 1. GKZ | ganz ersetzen info | 30 → 0 | 30 → 0 | 30 → 0 | 30 → 0 | 30 → 0 | 30 → 0 |
| 1. Telefon | ganz ersetzen phone | 0 → 0 | 0 → 0 | 0 → 0 | 0 → 0 | 0 → 0 | 0 → 0 |
| 1. E-Mail | ganz ersetzen email | 0 → 0 | 0 → 0 | 0 → 0 | 0 → 0 | 0 → 0 | 0 → 0 |
| 1. Handy | ganz ersetzen phone | 0 → 0 | 0 → 0 | 0 → 0 | 0 → 0 | 0 → 0 | 0 → 0 |
| 1. Telefon für Notfälle | ganz ersetzen phone | 0 → 0 | 0 → 0 | 0 → 0 | 0 → 0 | 0 → 0 | 0 → 0 |
| 1. Bemerkung Notfallnummer | ganz ersetzen info | 15 → 0 | 15 → 0 | 15 → 0 | 15 → 0 | 15 → 0 | 15 → 0 |
| 2. Erziehungsberechtigte/r Nachname | name | 1 → 0 | 1 → 0 | 1 → 0 | 3 → 0 | 3 → 0 | 3 → 0 |
| 2. Erziehungsberechtigte/r Vorname | name | 3 → 0 | 3 → 0 | 3 → 0 | 3 → 0 | 3 → 0 | 3 → 0 |
| 2. Strasse | ganz ersetzen address | 18 → 0 | 18 → 0 | 18 → 0 | 18 → 0 | 18 → 0 | 18 → 0 |
| 2. Hausnummer | ganz ersetzen address | 18 → 0 | 18 → 0 | 18 → 0 | 18 → 0 | 18 → 0 | 18 → 0 |
| 2. PLZ | ganz ersetzen address | 18 → 0 | 18 → 0 | 18 → 0 | 18 → 0 | 18 → 0 | 18 → 0 |
| 2. Ort | ganz ersetzen address | 18 → 0 | 18 → 0 | 18 → 0 | 18 → 0 | 18 → 0 | 18 → 0 |
| Sorgerecht | ganz ersetzen info | 30 → 0 | 30 → 0 | 30 → 0 | 30 → 0 | 30 → 0 | 30 → 0 |
| Übertritt von | ganz ersetzen org | 14 → 0 | 14 → 0 | 14 → 0 | 14 → 0 | 14 → 0 | 14 → 0 |
| Schulnummer | ganz ersetzen info | 30 → 0 | 30 → 0 | 30 → 0 | 30 → 0 | 30 → 0 | 30 → 0 |
| Wunschpartner in der Klasse | name | 8 → 0 | 8 → 0 | 8 → 0 | 8 → 0 | 8 → 0 | 8 → 0 |
| Notizen der Schule | ganz ersetzen info | 25 → 0 | 25 → 0 | 25 → 0 | 25 → 0 | 25 → 0 | 25 → 0 |

Summe aller Klartext-Zellen in diesen Spalten (6 Läufe): main 3159, jetzt 0.
- OK: Gegenprobe: main lässt in diesen Spalten Originalwerte stehen (der Test erkennt sie) – main 3159

## 3. Paare: Kind, Erziehungsberechtigte 1 und 2 je Zeile drei Personen
- OK: stammdaten.xlsx, person: je Zeile Kind, EB 1 (und EB 2) je eine Person (gleicher Buchstabe im Paar, verschiedene Personen) – 30/30 
- OK: stammdaten.xlsx, reversible: je Zeile Kind, EB 1 (und EB 2) je eine Person (gleicher Buchstabe im Paar, verschiedene Personen) – 30/30 
- OK: stammdaten.csv, person: je Zeile Kind, EB 1 (und EB 2) je eine Person (gleicher Buchstabe im Paar, verschiedene Personen) – 30/30 
- OK: stammdaten.csv, reversible: je Zeile Kind, EB 1 (und EB 2) je eine Person (gleicher Buchstabe im Paar, verschiedene Personen) – 30/30 

## 4. Rückbau (Excel: Wert, Zelltyp, Format; CSV: byte-gleich)
Original (Excel): 207 Zahl- und Datumszellen, davon 30 mit Datumsformat.
Schlüsseldatei (Excel): Format-Version 3, 502 Platzhalter (Name 186, Datum 30, Angabe 124, Adresse 53, Telefon 75, E-Mail 30, Einrichtung 4), davon mit Zelltyp: 68
- OK: Schlüsseldatei mit den neuen Arten hat Format-Version 3
- OK: Anonymisiert: Datumszellen sind Text-Platzhalter mit unverändertem Format (Stil) – inlineStr [DATUM-1] s=1; inlineStr [DATUM-2] s=1
- OK: Anonymisiert: kein Originalwert der ersetzten Spalten in der gemeinsamen Textliste (sharedStrings)
- OK: Rückbau Excel exakt: jede Zelle mit Wert, Zelltyp, Format (Stil) und Textläufen – 0 Abweichungen ; Urteil passend
- OK: LibreOffice öffnet die anonymisierte Datei (Datumsspalte zeigt den Platzhalter) – Nachname A,Vorname A,Vorname A2,w,[DATUM-1],[ANGABE-1],[ANGABE-2],[ANGABE-3],[ANGABE-4],naturwissenschaftlich,[ANGABE-5]
- OK: LibreOffice: Rückbau zeigt dieselben Werte wie das Original (auch Datum und Zahlen) – Öztürk,Ayşe,Ayşe Nur,w,03/14/2015,Gaziantep,Türkisch,"deutsch, türkisch",islamisch,naturwissenschaftlich,ja,"Asthma bron
- OK: Rückbau Excel: Zelle mit gemischter Formatierung hat wieder zwei Textläufe (der zweite fett) – <t>Asthma bronchiale, </t> | <rPr><b/></rPr><t>Notfallspray im Ranzen</t>
- OK: Rückbau CSV byte-gleich (nach der Byte-Order-Mark) – passend
- OK: Excel: locker umgeschriebene Platzhalter erkannt und gemeldet („gemeint vermutlich“), nicht geraten – [Datum … → [DATUM-1]; [Angabe-… → [ANGABE-1]
- OK: Excel: nach Korrektur wie vorgeschlagen Rückbau exakt (auch Zelltyp und Format) – passend
- OK: CSV: locker umgeschriebene Platzhalter erkannt und gemeldet („gemeint vermutlich“), nicht geraten – [Datum … → [DATUM-1]; [Angabe-… → [ANGABE-1]
- OK: CSV: nach Korrektur wie vorgeschlagen Rückbau exakt (auch Zelltyp und Format) – passend
- OK: CSV: Schlüsseldatei aus 2.9.0 (Format-Version 2) baut mit 2.10.0 exakt zurück – passend
- OK: Excel: Schlüsseldatei aus 2.9.0 (Format-Version 2) baut mit 2.10.0 exakt zurück – passend
- OK: Kollisions-Schutz: „[DATUM-1]“ und „[ANGABE-2]“ aus dem Original nicht vergeben, im Schlüssel als „imOriginal“ – [DATUM-2], [ANGABE-1], [DATUM-3], [ANGABE-3], Nachname A
- OK: Kollisions-Schutz: Rückbau exakt (die Wörter aus dem Original bleiben) – passend
- OK: Schlüsseldatei aus 2.10.0 (Version 3) wird von 2.9.0 klar abgelehnt – Unbekannte Version der Schlüsseldatei (3). Bitte eine neuere Version des Tools verwenden.

## 5. Weg-Gleichheit
- OK: stammdaten.xlsx: „Erläuterung“ auf „wie bisher“, „Nachname“ auf „ganz ersetzen“ und beide zurück = nie umgestellt (byte-gleich)
- OK: stammdaten.xlsx: alle Spalten „wie bisher“ = Ausgabe von main (jede Zelle gleich)
- OK: stammdaten.csv: „Erläuterung“ auf „wie bisher“, „Nachname“ auf „ganz ersetzen“ und beide zurück = nie umgestellt (byte-gleich)
- OK: stammdaten.csv: alle Spalten „wie bisher“ = Ausgabe von main (byte-gleich)

## 6. Kein stilles Speichern, Formeln und verbundene Zellen
- OK: Übersicht nicht bestätigt: Punkt „Die Spalten sind noch nicht geprüft“ mit Knopf „Ansehen“ – Die Spalten sind noch nicht geprüft. Im Moment gilt die Auswahl in der Übersicht „Spalten“. Ansehen
- OK: „Ansehen“ führt zur Spalten-Übersicht (Prüfen)
- OK: Nach „So übernehmen“ kommen die Fragen (Fragekarte statt Übersicht)
- OK: Bestätigt: kein Punkt „Spalten“ mehr
- OK: Tabellen-Ansicht zeigt ersetzte Spalten sichtbar als ersetzt (Kopf und Zellen) – 33 Köpfe, 861 Zellen, „ersetzt: Name“
- OK: Kein Text „null“ oder „undefined“ (Prüfen, Übersicht)
- OK: Formel in einer ersetzten Spalte: eigener Punkt mit Zelle – In einer ersetzten Spalte steht eine Formel. Das Tool ersetzt sie nicht. Bitte prüfe diese Zellen in Excel und lösche die Formel, wenn darin ein Name oder eine Angabe steht. Blatt „Schüler“, Zelle S4
- OK: Verbundene Zellen in einer ersetzten Spalte: eigener Punkt mit Bereich – In einer ersetzten Spalte gibt es verbundene Zellen. Bitte prüfe, ob alles ersetzt ist. Blatt „Schüler“, Zelle R5:S5
- OK: Kein Text „null“ oder „undefined“ (Speichern)

## Sammelfrage und Schlusscheck
- OK: Sammelfrage „Diese Wörter bleiben stehen“: kein Wort aus ersetzten Zellen
- OK: Schlusscheck: kein Fund (ersetzte Zellen sind ersetzt)

## Merkliste: Wahl je Überschrift
- OK: Merkliste an: Wahl je Überschrift gemerkt und beim nächsten Dokument angewendet (auch in Excel) – {"geschlecht":"ganz"}
- OK: Merkliste enthält nur die Überschrift, nie Inhalte
- OK: Merkliste aus: nichts gemerkt (neues Fenster wie vorher)

## 7. Vorhandene Tabellen-Testdateien: Vorschläge je Spalte (nur Spalten mit Behandlung „Name“ oder „ganz ersetzen“)
- fixtures-spalten/liste.xlsx: 9 Spalten mit Kopfzeile, ersetzt: Teilnehmer: „Nachname“ Name; Teilnehmer: „Vorname“ Name; Teilnehmer: „E-Mail“ ganz ersetzen (email); Teilnehmer: „Telefon“ ganz ersetzen (phone); Teilnehmer: „Bemerkung“ ganz ersetzen (info)
- OK: fixtures-spalten/liste.xlsx: mit den Vorschlägen nie schwächer als „wie bisher“ (kein Wort, das „wie bisher“ ersetzt, bleibt stehen)
- fixtures-spalten/tabellen.xlsx: 23 Spalten mit Kopfzeile, ersetzt: stark: „Nachname“ Name; stark: „Vorname“ Name; stark: „Bemerkung“ ganz ersetzen (info); anrede: „Ort“ ganz ersetzen (address); zweikopf: „Teilnehmer / Nachname“ Name; zweikopf: „Teilnehmer / Vorname“ Name; zweikopf: „Kontakt / Telefon“ ganz ersetzen (phone); zweikopf: „Kontakt / E-Mail“ ganz ersetzen (email); einezelle: „Name“ Name; teilwort: „Name der Schule“ ganz ersetzen (org)
- OK: fixtures-spalten/tabellen.xlsx: mit den Vorschlägen nie schwächer als „wie bisher“ (kein Wort, das „wie bisher“ ersetzt, bleibt stehen)
- fixtures-spalten/tabellen-stark.csv: 6 Spalten mit Kopfzeile, ersetzt: „Nachname“ Name; „Vorname“ Name; „Bemerkung“ ganz ersetzen (info)
- OK: fixtures-spalten/tabellen-stark.csv: mit den Vorschlägen nie schwächer als „wie bisher“ (kein Wort, das „wie bisher“ ersetzt, bleibt stehen)
- fixtures-spalten/tabellen-schwach.csv: 3 Spalten mit Kopfzeile, ersetzt: keine
- fixtures-spalten/tabellen-zweikopf.csv: 4 Spalten mit Kopfzeile, ersetzt: „Teilnehmer / Nachname“ Name; „Vorname“ Name; „Kontakt / Telefon“ ganz ersetzen (phone); „E-Mail“ ganz ersetzen (email)
- OK: fixtures-spalten/tabellen-zweikopf.csv: mit den Vorschlägen nie schwächer als „wie bisher“ (kein Wort, das „wie bisher“ ersetzt, bleibt stehen)
- fixtures-spalten/tabellen-einezelle.csv: 2 Spalten mit Kopfzeile, ersetzt: „Name“ Name
- OK: fixtures-spalten/tabellen-einezelle.csv: mit den Vorschlägen nie schwächer als „wie bisher“ (kein Wort, das „wie bisher“ ersetzt, bleibt stehen)
- fixtures-spalten/tabellen-teilwort.csv: 5 Spalten mit Kopfzeile, ersetzt: „Name der Schule“ ganz ersetzen (org)
- OK: fixtures-spalten/tabellen-teilwort.csv: mit den Vorschlägen nie schwächer als „wie bisher“ (kein Wort, das „wie bisher“ ersetzt, bleibt stehen)
- fixtures-spalten/tabellen-anrede.csv: 3 Spalten mit Kopfzeile, ersetzt: „Ort“ ganz ersetzen (address)
- OK: fixtures-spalten/tabellen-anrede.csv: mit den Vorschlägen nie schwächer als „wie bisher“ (kein Wort, das „wie bisher“ ersetzt, bleibt stehen)
- fixtures-spalten/tabellen-ohnekopf.csv: keine Tabelle mit Kopfzeile
- fixtures/mitarbeiter.xlsx: 6 Spalten mit Kopfzeile, ersetzt: Mitarbeiter: „Vorname“ Name; Mitarbeiter: „Nachname“ Name; Mitarbeiter: „Bemerkung“ ganz ersetzen (info); Yılmaz: „Notizen zu Mehmet Yılmaz“ ganz ersetzen (info)
- OK: fixtures/mitarbeiter.xlsx: mit den Vorschlägen nie schwächer als „wie bisher“ (kein Wort, das „wie bisher“ ersetzt, bleibt stehen)
- fixtures/mitarbeiter.csv: 5 Spalten mit Kopfzeile, ersetzt: „Vorname“ Name; „Nachname“ Name; „E-Mail“ ganz ersetzen (email); „Bemerkung“ ganz ersetzen (info)
- OK: fixtures/mitarbeiter.csv: mit den Vorschlägen nie schwächer als „wie bisher“ (kein Wort, das „wie bisher“ ersetzt, bleibt stehen)
- fixtures/meta-tabelle.xlsx: 2 Spalten mit Kopfzeile, ersetzt: keine
- fixtures/bilder-excel.xlsx: keine Tabelle mit Kopfzeile
- fixtures/ziffern.xlsx: keine Tabelle mit Kopfzeile
- fixtures/ziffern.csv: 2 Spalten mit Kopfzeile, ersetzt: keine
- fixtures/einrichtung.xlsx: keine Tabelle mit Kopfzeile
- fixtures/einrichtung.csv: 2 Spalten mit Kopfzeile, ersetzt: „Ort“ ganz ersetzen (address)
- OK: fixtures/einrichtung.csv: mit den Vorschlägen nie schwächer als „wie bisher“ (kein Wort, das „wie bisher“ ersetzt, bleibt stehen)
- fixtures/a2-risiko.csv: 3 Spalten mit Kopfzeile, ersetzt: „Name“ Name
- OK: fixtures/a2-risiko.csv: mit den Vorschlägen nie schwächer als „wie bisher“ (kein Wort, das „wie bisher“ ersetzt, bleibt stehen)
- fixtures/a2-uebertragung.csv: 3 Spalten mit Kopfzeile, ersetzt: „Name“ Name; „Notiz“ ganz ersetzen (info)
- OK: fixtures/a2-uebertragung.csv: mit den Vorschlägen nie schwächer als „wie bisher“ (kein Wort, das „wie bisher“ ersetzt, bleibt stehen)
- fixtures/vertausch-1.csv: 3 Spalten mit Kopfzeile, ersetzt: „Vorname“ Name; „Nachname“ Name
- OK: fixtures/vertausch-1.csv: mit den Vorschlägen nie schwächer als „wie bisher“ (kein Wort, das „wie bisher“ ersetzt, bleibt stehen)
- fixtures/vertausch-1.xlsx: 3 Spalten mit Kopfzeile, ersetzt: Notiz: „Vorname“ Name; Notiz: „Nachname“ Name
- OK: fixtures/vertausch-1.xlsx: mit den Vorschlägen nie schwächer als „wie bisher“ (kein Wort, das „wie bisher“ ersetzt, bleibt stehen)
- fixtures/vertausch-2.csv: 3 Spalten mit Kopfzeile, ersetzt: „Vorname“ Name; „Nachname“ Name
- OK: fixtures/vertausch-2.csv: mit den Vorschlägen nie schwächer als „wie bisher“ (kein Wort, das „wie bisher“ ersetzt, bleibt stehen)
- fixtures/vertausch-2.xlsx: 3 Spalten mit Kopfzeile, ersetzt: Notiz: „Vorname“ Name; Notiz: „Nachname“ Name
- OK: fixtures/vertausch-2.xlsx: mit den Vorschlägen nie schwächer als „wie bisher“ (kein Wort, das „wie bisher“ ersetzt, bleibt stehen)
- fixtures/kollision.csv: 2 Spalten mit Kopfzeile, ersetzt: keine
- fixtures/endungen.csv: 2 Spalten mit Kopfzeile, ersetzt: keine
- fixtures/einrichtung-gross.csv: 2 Spalten mit Kopfzeile, ersetzt: keine
- fixtures/einrichtung-gross.xlsx: keine Tabelle mit Kopfzeile
- fixtures/grossform-mit.csv: 2 Spalten mit Kopfzeile, ersetzt: keine
- fixtures/grossform-einzig.csv: 2 Spalten mit Kopfzeile, ersetzt: keine
- fixtures-anzeige/mehrblatt.xlsx: 1 Spalten mit Kopfzeile, ersetzt: Notizen: „Notiz“ ganz ersetzen (info)
- OK: fixtures-anzeige/mehrblatt.xlsx: mit den Vorschlägen nie schwächer als „wie bisher“ (kein Wort, das „wie bisher“ ersetzt, bleibt stehen)
- fixtures-bedienung/bedienung.xlsx: keine Tabelle mit Kopfzeile
- fixtures-reste/reste.xlsx: keine Tabelle mit Kopfzeile
- fixtures-traeger/anmeldung.xlsx: keine Tabelle mit Kopfzeile
- fixtures-traeger/anmeldung.csv: keine Tabelle mit Kopfzeile
- fixtures-traeger/einrichtung-person.xlsx: 2 Spalten mit Kopfzeile, ersetzt: Kontakte: „Einrichtung“ ganz ersetzen (org); Kontakte: „Ansprechpartner“ Name
- OK: fixtures-traeger/einrichtung-person.xlsx: mit den Vorschlägen nie schwächer als „wie bisher“ (kein Wort, das „wie bisher“ ersetzt, bleibt stehen)
- fixtures-traeger/einrichtung-person.csv: 2 Spalten mit Kopfzeile, ersetzt: „Einrichtung“ ganz ersetzen (org); „Ansprechpartner“ Name
- OK: fixtures-traeger/einrichtung-person.csv: mit den Vorschlägen nie schwächer als „wie bisher“ (kein Wort, das „wie bisher“ ersetzt, bleibt stehen)
- fixtures-traeger/nachbarn.xlsx: keine Tabelle mit Kopfzeile
- fixtures-traeger/nachbarn.csv: keine Tabelle mit Kopfzeile
- fixtures-traeger/nachbarn-offen.xlsx: keine Tabelle mit Kopfzeile
- fixtures-traeger/nachbarn-offen.csv: keine Tabelle mit Kopfzeile
- fixtures-traeger/einrichtungen-auto.xlsx: keine Tabelle mit Kopfzeile
- fixtures-pfade/pfade-ueblich.xlsx: 2 Spalten mit Kopfzeile, ersetzt: Liste Kühnel: „Name“ Name; Liste Kühnel: „Bemerkung“ ganz ersetzen (info)
- OK: fixtures-pfade/pfade-ueblich.xlsx: mit den Vorschlägen nie schwächer als „wie bisher“ (kein Wort, das „wie bisher“ ersetzt, bleibt stehen)
- fixtures-pfade/pfade-unueblich.xlsx: 2 Spalten mit Kopfzeile, ersetzt: Liste Kühnel: „Name“ Name; Liste Kühnel: „Bemerkung“ ganz ersetzen (info)
- OK: fixtures-pfade/pfade-unueblich.xlsx: mit den Vorschlägen nie schwächer als „wie bisher“ (kein Wort, das „wie bisher“ ersetzt, bleibt stehen)
- fixtures-pfade/pfade-hauptteil.xlsx: 2 Spalten mit Kopfzeile, ersetzt: Liste Kühnel: „Name“ Name; Liste Kühnel: „Bemerkung“ ganz ersetzen (info)
- OK: fixtures-pfade/pfade-hauptteil.xlsx: mit den Vorschlägen nie schwächer als „wie bisher“ (kein Wort, das „wie bisher“ ersetzt, bleibt stehen)
- fixtures-pfade/pfade-phase0.xlsx: 2 Spalten mit Kopfzeile, ersetzt: Liste: „Name“ Name; Liste: „Vorname“ Name
- OK: fixtures-pfade/pfade-phase0.xlsx: mit den Vorschlägen nie schwächer als „wie bisher“ (kein Wort, das „wie bisher“ ersetzt, bleibt stehen)
- fixtures-pfade/pfade-gegenprobe.xlsx: 2 Spalten mit Kopfzeile, ersetzt: Teilnehmer: „Name“ Name
- OK: fixtures-pfade/pfade-gegenprobe.xlsx: mit den Vorschlägen nie schwächer als „wie bisher“ (kein Wort, das „wie bisher“ ersetzt, bleibt stehen)

- OK: 0 Anfragen nach außen (alle Seiten dieses Laufs)

Ergebnis: 85 von 85 Prüfungen bestanden
