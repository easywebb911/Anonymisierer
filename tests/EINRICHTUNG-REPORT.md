# Einrichtungen (Version 2.3): Tests

Chromium headless, Start per file://, Bedienung über die echte Oberfläche. Testdokumente: tests/make-einrichtung.mjs (alle Namen erfunden).
Einrichtungen: „Familienzentrum Sonnenblume“ (mit Abkürzung „FZS“), „Lindenauer Bürgerverein“, „Astrid-Lindgren-Schule“. Personen: „Petra Hollmann“, „Astrid Lindgren“.

## Ziel: als Einrichtung markiert → überall „Einrichtung X“, Rückbau exakt, nichts unbemerkt (rückbaufähig)
### einrichtung.docx
- OK: Frage zur Firma lautet „… Als Einrichtung übernehmen?“ – In den Dateiangaben steht „Familienzentrum Sonnenblume“. Als Einrichtung übernehmen?
- OK: Beim Markieren erscheinen zwei Knöpfe: „Als Name markieren“ und „Als Einrichtung markieren“ – Als Name markieren | Als Einrichtung markieren | Abbrechen
- OK: Gruppe „Einrichtungen“ mit eigenen Zeilen (Schalter, Name, Zahl, drei Punkte); Personen getrennt – Einrichtungen: Familienzentrums Sonnenblume Einrichtung A 6/6 | Lindenauer Bürgerverein Einrichtung B 2/2 | Astrid-Lindgren-Schule Einrichtung C 1/1; Personen: Petra Hollmann, Astrid Lindgren
- OK: Ampel: „2 Personen und 3 Einrichtungen ersetzt“
- OK: Schlüsseldatei: Einrichtungen als eigene Art (kategorie „Einrichtung“, Liste „einrichtungen“) – Einrichtung A = „Familienzentrum Sonnenblume“ (2×); Einrichtung A2 = „Familienzentrums Sonnenblume“ (2×); Einrichtung A3 = „FZS“ (1×); Einrichtung B = „Lindenauer Bürgerverein“ (2×); Einrichtung A4 = „FAMILIENZENTRUM SONNENBLUME“ (1×); Einrichtung C = „Astrid-Lindgren-Schule“ (1×)

| Fall | ersetzt | Platzhalter / Ausgabe | Rückbau exakt |
|---|---|---|---|
| Text, mehrteilig | ja | „Bericht aus dem Einrichtung A“ | ja |
- OK: docx: Text, mehrteilig: ersetzt und Rückbau exakt
| Genitiv mit Endung im Inneren | ja | „Die Leiterin des Einrichtung A2, Frau Vorname A Nachname A, berichtet.“ | ja |
- OK: docx: Genitiv mit Endung im Inneren: ersetzt und Rückbau exakt
| Abkürzung (zusammengeführt) | ja | „Das Einrichtung A3 plant gemeinsam mit dem Einrichtung B ein Fest.“ | ja |
- OK: docx: Abkürzung (zusammengeführt): ersetzt und Rückbau exakt
| zweite Einrichtung | ja | „Das Einrichtung A3 plant gemeinsam mit dem Einrichtung B ein Fest.“ | ja |
- OK: docx: zweite Einrichtung: ersetzt und Rückbau exakt
| Genitiv mit Endung am Schluss | ja | „Der Vorstand des Einrichtung Bs stimmt zu.“ | ja |
- OK: docx: Genitiv mit Endung am Schluss: ersetzt und Rückbau exakt
| GROSSSCHREIBUNG | ja | „AUSHANG: Einrichtung A4 LÄDT EIN“ | ja |
- OK: docx: GROSSSCHREIBUNG: ersetzt und Rückbau exakt
| Personenname in der Einrichtung (Vorrang) | ja | „Auch die Einrichtung C macht mit. Frau Vorname B Nachname B liest vor.“ | ja |
- OK: docx: Personenname in der Einrichtung (Vorrang): ersetzt und Rückbau exakt
| Zeilenumbruch im Namen | nein | „Treffpunkt im Familienzentrum⏎Sonnenblume, Saal 2.“ – NICHT ersetzt; Schlusscheck meldet: ja (Speichern gesperrt bis „bewusst stehen lassen“) | ja |
- OK: docx: Zeilenumbruch im Namen: nicht ersetzt, aber der Schlusscheck meldet ihn (nie unbemerkt) – Familienzentrum Sonnenblume – steht in: Text (word/document.xml) · bestätigte Einrichtung,
| Kopfzeile | ja | „KOPF: Einrichtung A · Jahresbericht“ | ja |
- OK: docx: Kopfzeile: ersetzt und Rückbau exakt
| Bildbeschreibung | ja | „ALT: Logo des Einrichtung A2“ | ja |
- OK: docx: Bildbeschreibung: ersetzt und Rückbau exakt
- OK: docx: Rückbau insgesamt exakt (alle 10 Abschnitte) – Bericht: Einrichtung A: 2/2, Einrichtung A2: 2/2, Einrichtung A3: 1/1, Einrichtung B: 2/2, Einrichtung A4: 1/1, Einrichtung C: 1/1
- Wortbestandteile in ALLEN Teilen der Ausgabe: Familienzentrum 1, Sonnenblume 1, FZS 0, Lindenauer 0, Bürgerverein 0, Astrid 0, Lindgren 0, Hollmann 0, Petra 0
- OK: docx: keine Reste außer dem gemeldeten Zeilenumbruch-Fall – Familienzentrum 1× (word/document.xml); Sonnenblume 1× (word/document.xml)

### einrichtung.xlsx
- OK: Frage zur Firma lautet „… Als Einrichtung übernehmen?“ – In den Dateiangaben steht „Familienzentrum Sonnenblume“. Als Einrichtung übernehmen?
- OK: Gruppe „Einrichtungen“ mit eigenen Zeilen (Schalter, Name, Zahl, drei Punkte); Personen getrennt – Einrichtungen: Familienzentrums Sonnenblume Einrichtung A 7/7 | Lindenauer Bürgerverein Einrichtung B 2/2 | Astrid-Lindgren-Schule Einrichtung C 1/1; Personen: Petra Hollmann, Astrid Lindgren
- OK: Ampel: „2 Personen und 3 Einrichtungen ersetzt“
- OK: Schlüsseldatei: Einrichtungen als eigene Art (kategorie „Einrichtung“, Liste „einrichtungen“) – Einrichtung A = „Familienzentrum Sonnenblume“ (2×); Einrichtung A2 = „Familienzentrums Sonnenblume“ (2×); Einrichtung A3 = „FZS“ (1×); Einrichtung B = „Lindenauer Bürgerverein“ (2×); Einrichtung A4 = „FAMILIENZENTRUM SONNENBLUME“ (1×); Einrichtung C = „Astrid-Lindgren-Schule“ (1×); Einrichtung A5 = „Familienzentrum⏎Sonnenblume“ (1×)

| Fall | ersetzt | Platzhalter / Ausgabe | Rückbau exakt |
|---|---|---|---|
| Text, mehrteilig | ja | „Bericht aus dem Einrichtung A“ | ja |
- OK: xlsx: Text, mehrteilig: ersetzt und Rückbau exakt
| Genitiv mit Endung im Inneren | ja | „Die Leiterin des Einrichtung A2, Frau Vorname A Nachname A, berichtet.“ | ja |
- OK: xlsx: Genitiv mit Endung im Inneren: ersetzt und Rückbau exakt
| Abkürzung (zusammengeführt) | ja | „Das Einrichtung A3 plant gemeinsam mit dem Einrichtung B ein Fest.“ | ja |
- OK: xlsx: Abkürzung (zusammengeführt): ersetzt und Rückbau exakt
| zweite Einrichtung | ja | „Das Einrichtung A3 plant gemeinsam mit dem Einrichtung B ein Fest.“ | ja |
- OK: xlsx: zweite Einrichtung: ersetzt und Rückbau exakt
| Genitiv mit Endung am Schluss | ja | „Der Vorstand des Einrichtung Bs stimmt zu.“ | ja |
- OK: xlsx: Genitiv mit Endung am Schluss: ersetzt und Rückbau exakt
| GROSSSCHREIBUNG | ja | „AUSHANG: Einrichtung A4 LÄDT EIN“ | ja |
- OK: xlsx: GROSSSCHREIBUNG: ersetzt und Rückbau exakt
| Personenname in der Einrichtung (Vorrang) | ja | „Auch die Einrichtung C macht mit. Frau Vorname B Nachname B liest vor.“ | ja |
- OK: xlsx: Personenname in der Einrichtung (Vorrang): ersetzt und Rückbau exakt
| Zeilenumbruch im Namen | ja | „Treffpunkt im Einrichtung A5, Saal 2.“ | ja |
- OK: xlsx: Zeilenumbruch im Namen: ersetzt und Rückbau exakt
| Bildbeschreibung | ja | „ALT: Logo des Einrichtung A2“ | ja |
- OK: xlsx: Bildbeschreibung: ersetzt und Rückbau exakt
| Blattname | ja | „BLATT: Einrichtung A“ | ja |
- OK: xlsx: Blattname: ersetzt und Rückbau exakt
- OK: xlsx: Rückbau insgesamt exakt (alle 9 Abschnitte) – Bericht: Einrichtung A: 2/2, Einrichtung A2: 2/2, Einrichtung A3: 1/1, Einrichtung B: 2/2, Einrichtung A4: 1/1, Einrichtung C: 1/1, Einrichtung A5: 1/1
- Wortbestandteile in ALLEN Teilen der Ausgabe: Familienzentrum 0, Sonnenblume 0, FZS 0, Lindenauer 0, Bürgerverein 0, Astrid 0, Lindgren 0, Hollmann 0, Petra 0
- OK: xlsx: keine Reste

### einrichtung.txt
- OK: Gruppe „Einrichtungen“ mit eigenen Zeilen (Schalter, Name, Zahl, drei Punkte); Personen getrennt – Einrichtungen: Familienzentrums Sonnenblume Einrichtung A 4/4 | Lindenauer Bürgerverein Einrichtung B 2/2 | Astrid-Lindgren-Schule Einrichtung C 1/1; Personen: Petra Hollmann, Astrid Lindgren
- OK: Ampel: „2 Personen und 3 Einrichtungen ersetzt“
- OK: Schlüsseldatei: Einrichtungen als eigene Art (kategorie „Einrichtung“, Liste „einrichtungen“) – Einrichtung A = „Familienzentrum Sonnenblume“ (1×); Einrichtung A2 = „Familienzentrums Sonnenblume“ (1×); Einrichtung A3 = „FZS“ (1×); Einrichtung B = „Lindenauer Bürgerverein“ (2×); Einrichtung A4 = „FAMILIENZENTRUM SONNENBLUME“ (1×); Einrichtung C = „Astrid-Lindgren-Schule“ (1×)

| Fall | ersetzt | Platzhalter / Ausgabe | Rückbau exakt |
|---|---|---|---|
| Text, mehrteilig | ja | „Bericht aus dem Einrichtung A“ | ja |
- OK: txt: Text, mehrteilig: ersetzt und Rückbau exakt
| Genitiv mit Endung im Inneren | ja | „Die Leiterin des Einrichtung A2, Frau Vorname A Nachname A, berichtet.“ | ja |
- OK: txt: Genitiv mit Endung im Inneren: ersetzt und Rückbau exakt
| Abkürzung (zusammengeführt) | ja | „Das Einrichtung A3 plant gemeinsam mit dem Einrichtung B ein Fest.“ | ja |
- OK: txt: Abkürzung (zusammengeführt): ersetzt und Rückbau exakt
| zweite Einrichtung | ja | „Das Einrichtung A3 plant gemeinsam mit dem Einrichtung B ein Fest.“ | ja |
- OK: txt: zweite Einrichtung: ersetzt und Rückbau exakt
| Genitiv mit Endung am Schluss | ja | „Der Vorstand des Einrichtung Bs stimmt zu.“ | ja |
- OK: txt: Genitiv mit Endung am Schluss: ersetzt und Rückbau exakt
| GROSSSCHREIBUNG | ja | „AUSHANG: Einrichtung A4 LÄDT EIN“ | ja |
- OK: txt: GROSSSCHREIBUNG: ersetzt und Rückbau exakt
| Personenname in der Einrichtung (Vorrang) | ja | „Auch die Einrichtung C macht mit. Frau Vorname B Nachname B liest vor.“ | ja |
- OK: txt: Personenname in der Einrichtung (Vorrang): ersetzt und Rückbau exakt
| Zeilenumbruch im Namen | nein | „Treffpunkt im Familienzentrum“ – NICHT ersetzt; Schlusscheck meldet: ja (Speichern gesperrt bis „bewusst stehen lassen“) | ja |
- OK: txt: Zeilenumbruch im Namen: nicht ersetzt, aber der Schlusscheck meldet ihn (nie unbemerkt) – Familienzentrum Sonnenblume – steht in: Text · bestätigte Einrichtung, Einrichtung A: „…me
- OK: txt: Rückbau insgesamt exakt (alle 9 Abschnitte) – Bericht: Einrichtung A: 1/1, Einrichtung A2: 1/1, Einrichtung A3: 1/1, Einrichtung B: 2/2, Einrichtung A4: 1/1, Einrichtung C: 1/1
- Wortbestandteile in ALLEN Teilen der Ausgabe: Familienzentrum 1, Sonnenblume 1, FZS 0, Lindenauer 0, Bürgerverein 0, Astrid 0, Lindgren 0, Hollmann 0, Petra 0
- OK: txt: keine Reste außer dem gemeldeten Zeilenumbruch-Fall – Familienzentrum 1× (Text); Sonnenblume 1× (Text)

### einrichtung.csv
- OK: Gruppe „Einrichtungen“ mit eigenen Zeilen (Schalter, Name, Zahl, drei Punkte); Personen getrennt – Einrichtungen: Familienzentrums Sonnenblume Einrichtung A 5/5 | Lindenauer Bürgerverein Einrichtung B 2/2 | Astrid-Lindgren-Schule Einrichtung C 1/1; Personen: Petra Hollmann, Astrid Lindgren
- OK: Ampel: „2 Personen und 3 Einrichtungen ersetzt“
- OK: Schlüsseldatei: Einrichtungen als eigene Art (kategorie „Einrichtung“, Liste „einrichtungen“) – Einrichtung A = „Familienzentrum Sonnenblume“ (1×); Einrichtung A2 = „Familienzentrums Sonnenblume“ (1×); Einrichtung A3 = „FZS“ (1×); Einrichtung B = „Lindenauer Bürgerverein“ (2×); Einrichtung A4 = „FAMILIENZENTRUM SONNENBLUME“ (1×); Einrichtung C = „Astrid-Lindgren-Schule“ (1×); Einrichtung A5 = „Familienzentrum⏎Sonnenblume“ (1×)

| Fall | ersetzt | Platzhalter / Ausgabe | Rückbau exakt |
|---|---|---|---|
| Text, mehrteilig | ja | „"Bericht aus dem Einrichtung A";Raum 1“ | ja |
- OK: csv: Text, mehrteilig: ersetzt und Rückbau exakt
| Genitiv mit Endung im Inneren | ja | „"Die Leiterin des Einrichtung A2, Frau Vorname A Nachname A, berichtet.";Raum 2“ | ja |
- OK: csv: Genitiv mit Endung im Inneren: ersetzt und Rückbau exakt
| Abkürzung (zusammengeführt) | ja | „"Das Einrichtung A3 plant gemeinsam mit dem Einrichtung B ein Fest.";Raum 3“ | ja |
- OK: csv: Abkürzung (zusammengeführt): ersetzt und Rückbau exakt
| zweite Einrichtung | ja | „"Das Einrichtung A3 plant gemeinsam mit dem Einrichtung B ein Fest.";Raum 3“ | ja |
- OK: csv: zweite Einrichtung: ersetzt und Rückbau exakt
| Genitiv mit Endung am Schluss | ja | „"Der Vorstand des Einrichtung Bs stimmt zu.";Raum 4“ | ja |
- OK: csv: Genitiv mit Endung am Schluss: ersetzt und Rückbau exakt
| GROSSSCHREIBUNG | ja | „"AUSHANG: Einrichtung A4 LÄDT EIN";Raum 5“ | ja |
- OK: csv: GROSSSCHREIBUNG: ersetzt und Rückbau exakt
| Personenname in der Einrichtung (Vorrang) | ja | „"Auch die Einrichtung C macht mit. Frau Vorname B Nachname B liest vor.";Raum 6“ | ja |
- OK: csv: Personenname in der Einrichtung (Vorrang): ersetzt und Rückbau exakt
| Zeilenumbruch im Namen | ja | „"Treffpunkt im Einrichtung A5, Saal 2.";Raum 7“ | ja |
- OK: csv: Zeilenumbruch im Namen: ersetzt und Rückbau exakt
- OK: csv: Rückbau insgesamt exakt (alle 9 Abschnitte) – Bericht: Einrichtung A: 1/1, Einrichtung A2: 1/1, Einrichtung A3: 1/1, Einrichtung B: 2/2, Einrichtung A4: 1/1, Einrichtung C: 1/1, Einrichtung A5: 1/1
- Wortbestandteile in ALLEN Teilen der Ausgabe: Familienzentrum 0, Sonnenblume 0, FZS 0, Lindenauer 0, Bürgerverein 0, Astrid 0, Lindgren 0, Hollmann 0, Petra 0
- OK: csv: keine Reste

## Vorrang: Einrichtung mit Personenname
- OK: „Astrid-Lindgren-Schule“ = ein Platzhalter; „Astrid Lindgren“ an anderer Stelle bleibt Person – Auch die Einrichtung C macht mit. Frau Vorname B Nachname B liest vor.

## Art-Wechsel: Einrichtung → Person → Einrichtung (rückbaufähig)
- OK: „ist eine Person“: Platzhalter, Zählung und Kennung folgen; Schlüssel muss neu gespeichert werden – vorher: 2 Personen/1 Einrichtung, „Das FZS plant gemeinsam mit dem Einrichtung A ein Fest.“; nachher: 3/0, „Das FZS plant gemeinsam mit dem Vorname B Nachname B ein Fest.“, Kennung 8Y7Z → P8H6
- OK: „ist eine Einrichtung“ zurück: wieder „Einrichtung A“, Zählung und Kennung folgen – „Das FZS plant gemeinsam mit dem Einrichtung A ein Fest.“, Kennung P8H6 → Y9F9

## Merkliste mit Art
- OK: Alte Merkliste ohne Art lädt als Personen; Ausgabe byte-gleich wie in 2.2 – Chips: Sonnenblume · Person; SHA d120ec136c8d / d120ec136c8d
- OK: Neue Merkliste mit Art wird richtig gelesen (Person und Einrichtung, Art an jedem Eintrag sichtbar) – Hollmann · Person | Familienzentrum Sonnenblume · Einrichtung
- OK: Beim Hinzufügen Art wählbar; Datei und Browser-Speicher merken die Art – Datei: {"names":["Hollmann"],"einrichtungen":["Lindenauer Bürgerverein"]}

## Oberfläche: Legende, KI-Hinweis, Modi
- OK: Legende: eigene Markierung „Einrichtung“, auch ohne Farbe unterscheidbar (doppelter Rahmen, sonst keiner) – sicher: Rahmen none, unsicher: Rahmen dashed, von dir markiert: Rahmen none, Einrichtung: Rahmen double, Kontakt: Rahmen solid, aus: Rahmen none
- OK: Kontrast Schrift/Hintergrund mindestens 4,5:1, Rahmen mindestens 3:1 – Schrift 13.5:1, Rahmen 7.1:1
- OK: „Hinweis für die KI“ nennt „Einrichtung A“ (bzw. „[EINRICHTUNG]“)
- OK: Treffer der Einrichtung in der Prüfansicht markiert (Kürzel, Titel) – Einr. A · wird ersetzt durch: Einrichtung A · Einrichtung · Tippen = an/aus
- OK: Modus „[NAME]“: „[EINRICHTUNG]“ – Bericht aus dem [EINRICHTUNG]

## Rückwärts-Prüfung für den Revert-Weg: Version 2.2 mit Schlüsseldatei aus 2.3
- Version 2.2 lädt die Schlüsseldatei: „Schlüsseldatei geladen: 10 Platzhalter, Kennung Y9X8 (erstellt mit Version 2.3.0, Quelle TXT).“
- Urteil der bisherigen Prüfung: „zweifelhaft“, Zeilen: Einrichtung A: 0/1, Einrichtung A2: 0/1, Vorname A: 1/1, Nachname A: 1/1, Einrichtung A3: 0/1, Einrichtung B: 0/2, Einrichtung A4: 0/1, Einrichtung C: 0/1, Vorname B: 1/1, Nachname B: 1/1
- Ergebnis: Personen und Kontaktdaten zurück; Einrichtungs-Platzhalter bleiben stehen: Einrichtung A, Einrichtung A2, Einrichtung A3, Einrichtung B, Einrichtung A4, Einrichtung C
- OK: 2.2 lädt den Schlüssel, baut Personen zurück, Einrichtungen bleiben als Platzhalter (gemeldet als Anzahl-Abweichung)

## Firma aus den Dateiangaben: Frage mit „Ja“ beantwortet, Version 2.2 gegen 2.3
- meta-word.docx: Fragen 2.2: In den Dateiangaben steht „Rüdiger Spähmann“. Als Namen übernehmen? / In den Dateiangaben steht „Tamara Feldkirch“. Als Namen übernehmen? / In den Dateiangaben steht „Konstantin Abendroth“. Als Namen übernehmen? / In den Dateiangaben steht „Lindenhof Beratung GmbH“. Als Namen übernehmen? / In den Dateiangaben steht „Ottilie Rennwagen“. Als Namen übernehmen? / In den Dateiangaben steht „Wilhelmine Querbach“. Als Namen übernehmen?; 2.3: In den Dateiangaben steht „Rüdiger Spähmann“. Als Namen übernehmen? / In den Dateiangaben steht „Tamara Feldkirch“. Als Namen übernehmen? / In den Dateiangaben steht „Konstantin Abendroth“. Als Namen übernehmen? / In den Dateiangaben steht „Lindenhof Beratung GmbH“. Als Einrichtung übernehmen? / In den Dateiangaben steht „Ottilie Rennwagen“. Als Namen übernehmen? / In den Dateiangaben steht „Wilhelmine Querbach“. Als Namen übernehmen?
  - 2 geänderte Zeile(n): „Gesprächsprotokoll Person A“ → „Gesprächsprotokoll Beratung“; „Teilnehmerin: Frau Person B.“ → „Teilnehmerin: Frau Person A.“.
  - Gründe: (a) Die Firma wird als ganze Wortfolge „Einrichtung A“ ersetzt statt Wort für Wort als Person. (b) Ein einzelnes Wort der Firma (z. B. das Allerweltswort „Beratung“) wird deshalb nicht mehr als Person ersetzt. (c) Die Buchstaben der Personen rücken nach, weil die Firma in 2.2 selbst „Person A“ war.
- OK: meta-word.docx: Unterschiede nur durch die als Einrichtung übernommene Firma (Gründe a–d)
- meta-tabelle.xlsx: Fragen 2.2: In den Dateiangaben steht „Rüdiger Spähmann“. Als Namen übernehmen? / In den Dateiangaben steht „Tamara Feldkirch“. Als Namen übernehmen? / In den Dateiangaben steht „Konstantin Abendroth“. Als Namen übernehmen? / In den Dateiangaben steht „Lindenhof Beratung GmbH“. Als Namen übernehmen? / In den Dateiangaben steht „Wilhelmine Querbach“. Als Namen übernehmen? / In den Dateiangaben steht „Ottilie Rennwagen“. Als Namen übernehmen?; 2.3: In den Dateiangaben steht „Rüdiger Spähmann“. Als Namen übernehmen? / In den Dateiangaben steht „Tamara Feldkirch“. Als Namen übernehmen? / In den Dateiangaben steht „Konstantin Abendroth“. Als Namen übernehmen? / In den Dateiangaben steht „Lindenhof Beratung GmbH“. Als Einrichtung übernehmen? / In den Dateiangaben steht „Wilhelmine Querbach“. Als Namen übernehmen? / In den Dateiangaben steht „Ottilie Rennwagen“. Als Namen übernehmen?
  - 7 geänderte Zeile(n): „[Blattname] Person A“ → „[Blattname] Beratung“; „[Person A!A1] Thema“ → „[Beratung!A1] Thema“; „[Person A!B1] Ansprechpartnerin“ → „[Beratung!B1] Ansprechpartnerin“; „[Person A!A2] Person A“ → „[Beratung!A2] Beratung“; „[Person A!B2] Person B“ → „[Beratung!B2] Person A“; „[Person A!A3] Raum“ → „[Beratung!A3] Raum“; „[Person A!B3] Fotos siehe unten“ → „[Beratung!B3] Fotos siehe unten“.
  - Gründe: (a) Die Firma wird als ganze Wortfolge „Einrichtung A“ ersetzt statt Wort für Wort als Person. (b) Ein einzelnes Wort der Firma (z. B. das Allerweltswort „Beratung“) wird deshalb nicht mehr als Person ersetzt. (c) Die Buchstaben der Personen rücken nach, weil die Firma in 2.2 selbst „Person A“ war.
- OK: meta-tabelle.xlsx: Unterschiede nur durch die als Einrichtung übernommene Firma (Gründe a–d)
- einrichtung.docx: Fragen 2.2: In den Dateiangaben steht „Familienzentrum Sonnenblume“. Als Namen übernehmen?; 2.3: In den Dateiangaben steht „Familienzentrum Sonnenblume“. Als Einrichtung übernehmen?
  - 8 geänderte Zeile(n): „Bericht aus dem Person A“ → „Bericht aus dem Einrichtung A“; „Die Leiterin des Person As Person A, Frau Person B, berichtet.“ → „Die Leiterin des Einrichtung A, Frau Person A, berichtet.“; „AUSHANG: Person A LÄDT EIN“ → „AUSHANG: Einrichtung A LÄDT EIN“; „Auch die Astrid-Lindgren-Schule macht mit. Frau Person C liest vor.“ → „Auch die Astrid-Lindgren-Schule macht mit. Frau Person B liest vor.“; „Treffpunkt im Person A“ → „Treffpunkt im Einrichtung A, Saal 2.“; „Person A, Saal 2.“ → „Logo: “; „Logo: “ → „[Kopfzeile] Einrichtung A · Jahresbericht“; „[Kopfzeile] Person A · Jahresbericht“ → „[Bildbeschreibung (Alt-Text)] Logo des Einrichtung A“.
  - Gründe: (a) Die Firma wird als ganze Wortfolge „Einrichtung A“ ersetzt statt Wort für Wort als Person. (b) Ein einzelnes Wort der Firma (z. B. das Allerweltswort „Beratung“) wird deshalb nicht mehr als Person ersetzt. (c) Die Buchstaben der Personen rücken nach, weil die Firma in 2.2 selbst „Person A“ war.
  - (d) Ein Zeilenumbruch innerhalb der Einrichtung gehört zur ersetzten Wortfolge (Textausgabe aus Word); dadurch eine Zeile weniger.
- OK: einrichtung.docx: Unterschiede nur durch die als Einrichtung übernommene Firma (Gründe a–d)

## Doppellauf
- OK: einrichtung.docx: zwei Läufe byte-gleich – 2198e39ca61779b2
- OK: einrichtung.xlsx: zwei Läufe byte-gleich – f83dd1a0bc705367
- OK: einrichtung.txt: zwei Läufe byte-gleich – 7e970314a8ee5e1e
- OK: einrichtung.csv: zwei Läufe byte-gleich – 1fb2f829a54e086c

Prüfungen: 78 von 78 bestanden.
Netzwerkanfragen außer lokalen Dateien: 0.
