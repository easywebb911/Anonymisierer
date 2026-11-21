# Einrichtungen (Version 2.3): Tests

Chromium headless, Start per file://, Bedienung über die echte Oberfläche. Testdokumente: tests/make-einrichtung.mjs (alle Namen erfunden).
Einrichtungen: „Familienzentrum Sonnenblume“ (mit Abkürzung „FZS“), „Lindenauer Bürgerverein“, „Astrid-Lindgren-Schule“. Personen: „Petra Hollmann“, „Astrid Lindgren“.

## Ziel: als Einrichtung markiert → überall „Einrichtung X“, Rückbau exakt, nichts unbemerkt (rückbaufähig)
### einrichtung.docx
- OK: Frage zur Firma lautet „… Als Einrichtung übernehmen?“ – In den Dateiangaben steht „Familienzentrum Sonnenblume“. Als Einrichtung übernehmen?
- OK: Beim Markieren erscheinen zwei Knöpfe: „Als Name markieren“ und „Als Einrichtung markieren“ – Als Name markieren | Als Einrichtung markieren | Abbrechen
- OK: Gruppe „Einrichtungen“ mit eigenen Zeilen (Schalter, Name, Zahl, drei Punkte); Personen getrennt – Einrichtungen: Familienzentrum Sonnenblume Einrichtung A 6/6 | Lindenauer Bürgerverein Einrichtung B 2/2 | Astrid-Lindgren-Schule Einrichtung C 1/1; Personen: Petra Hollmann, Astrid Lindgren
- OK: Ampel: „2 Personen und 3 Einrichtungen ersetzt“
- OK: Schlüsseldatei: Einrichtungen als eigene Art (kategorie „Einrichtung“, Liste „einrichtungen“), Format-Version 2 – Einrichtung A = „Familienzentrum Sonnenblume“ (2×); Einrichtung A2 = „Familienzentrums Sonnenblume“ (2×); Einrichtung A3 = „FZS“ (1×); Einrichtung B = „Lindenauer Bürgerverein“ (2×); Einrichtung A4 = „FAMILIENZENTRUM SONNENBLUME“ (1×); Einrichtung C = „Astrid-Lindgren-Schule“ (1×)

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
- OK: docx: Zeilenumbruch im Namen: nicht ersetzt, Schlusscheck meldet ihn mit Anleitung („Der Name steht über einen Zeilenumbruch. Entferne den Umbruch in Word oder markiere die Teile einzeln.“) – Familienzentrum Sonnenblume – steht in: Text (im Original) · Einrichtung aus deiner Liste 
| Kopfzeile | ja | „KOPF: Einrichtung A · Jahresbericht“ | ja |
- OK: docx: Kopfzeile: ersetzt und Rückbau exakt
| Bildbeschreibung | ja | „ALT: Logo des Einrichtung A2“ | ja |
- OK: docx: Bildbeschreibung: ersetzt und Rückbau exakt
- OK: docx: Rückbau insgesamt exakt (alle 10 Abschnitte) – Bericht: Einrichtung A: 2/2, Einrichtung A2: 2/2, Einrichtung A3: 1/1, Einrichtung B: 2/2, Einrichtung A4: 1/1, Einrichtung C: 1/1
- Wortbestandteile in ALLEN Teilen der Ausgabe: Familienzentrum 1, Sonnenblume 1, FZS 0, Lindenauer 0, Bürgerverein 0, Astrid 0, Lindgren 0, Hollmann 0, Petra 0
- OK: docx: keine Reste außer dem gemeldeten Zeilenumbruch-Fall – Familienzentrum 1× (word/document.xml); Sonnenblume 1× (word/document.xml)

### einrichtung.xlsx
- OK: Frage zur Firma lautet „… Als Einrichtung übernehmen?“ – In den Dateiangaben steht „Familienzentrum Sonnenblume“. Als Einrichtung übernehmen?
- OK: Gruppe „Einrichtungen“ mit eigenen Zeilen (Schalter, Name, Zahl, drei Punkte); Personen getrennt – Einrichtungen: Familienzentrum Sonnenblume Einrichtung A 7/7 | Lindenauer Bürgerverein Einrichtung B 2/2 | Astrid-Lindgren-Schule Einrichtung C 1/1; Personen: Petra Hollmann, Astrid Lindgren
- OK: Ampel: „2 Personen und 3 Einrichtungen ersetzt“
- OK: Schlüsseldatei: Einrichtungen als eigene Art (kategorie „Einrichtung“, Liste „einrichtungen“), Format-Version 2 – Einrichtung A = „Familienzentrum Sonnenblume“ (2×); Einrichtung A2 = „Familienzentrums Sonnenblume“ (2×); Einrichtung A3 = „FZS“ (1×); Einrichtung B = „Lindenauer Bürgerverein“ (2×); Einrichtung A4 = „FAMILIENZENTRUM SONNENBLUME“ (1×); Einrichtung C = „Astrid-Lindgren-Schule“ (1×); Einrichtung A5 = „Familienzentrum⏎Sonnenblume“ (1×)

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
- OK: Gruppe „Einrichtungen“ mit eigenen Zeilen (Schalter, Name, Zahl, drei Punkte); Personen getrennt – Einrichtungen: Familienzentrum Sonnenblume Einrichtung A 5/5 | Lindenauer Bürgerverein Einrichtung B 2/2 | Astrid-Lindgren-Schule Einrichtung C 1/1; Personen: Petra Hollmann, Astrid Lindgren
- OK: Ampel: „2 Personen und 3 Einrichtungen ersetzt“
- OK: Schlüsseldatei: Einrichtungen als eigene Art (kategorie „Einrichtung“, Liste „einrichtungen“), Format-Version 2 – Einrichtung A = „Familienzentrum Sonnenblume“ (1×); Einrichtung A2 = „Familienzentrums Sonnenblume“ (1×); Einrichtung A3 = „FZS“ (1×); Einrichtung B = „Lindenauer Bürgerverein“ (2×); Einrichtung A4 = „FAMILIENZENTRUM SONNENBLUME“ (1×); Einrichtung C = „Astrid-Lindgren-Schule“ (1×); Einrichtung A5 = „Familienzentrum⏎Sonnenblume“ (1×)

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
| Zeilenumbruch im Namen | ja | „Treffpunkt im Einrichtung A5, Saal 2.“ | ja |
- OK: txt: Zeilenumbruch im Namen: ersetzt und Rückbau exakt
- OK: txt: Rückbau insgesamt exakt (alle 9 Abschnitte) – Bericht: Einrichtung A: 1/1, Einrichtung A2: 1/1, Einrichtung A3: 1/1, Einrichtung B: 2/2, Einrichtung A4: 1/1, Einrichtung C: 1/1, Einrichtung A5: 1/1
- Wortbestandteile in ALLEN Teilen der Ausgabe: Familienzentrum 0, Sonnenblume 0, FZS 0, Lindenauer 0, Bürgerverein 0, Astrid 0, Lindgren 0, Hollmann 0, Petra 0
- OK: txt: keine Reste

### einrichtung.csv
- OK: Gruppe „Einrichtungen“ mit eigenen Zeilen (Schalter, Name, Zahl, drei Punkte); Personen getrennt – Einrichtungen: Familienzentrum Sonnenblume Einrichtung A 5/5 | Lindenauer Bürgerverein Einrichtung B 2/2 | Astrid-Lindgren-Schule Einrichtung C 1/1; Personen: Petra Hollmann, Astrid Lindgren
- OK: Ampel: „2 Personen und 3 Einrichtungen ersetzt“
- OK: Schlüsseldatei: Einrichtungen als eigene Art (kategorie „Einrichtung“, Liste „einrichtungen“), Format-Version 2 – Einrichtung A = „Familienzentrum Sonnenblume“ (1×); Einrichtung A2 = „Familienzentrums Sonnenblume“ (1×); Einrichtung A3 = „FZS“ (1×); Einrichtung B = „Lindenauer Bürgerverein“ (2×); Einrichtung A4 = „FAMILIENZENTRUM SONNENBLUME“ (1×); Einrichtung C = „Astrid-Lindgren-Schule“ (1×); Einrichtung A5 = „Familienzentrum⏎Sonnenblume“ (1×)

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
- OK: „ist eine Person“: Platzhalter, Zählung und Kennung folgen; Schlüssel muss neu gespeichert werden – vorher: 2 Personen/1 Einrichtung, „Das FZS plant gemeinsam mit dem Einrichtung A ein Fest.“; nachher: 3/0, „Das FZS plant gemeinsam mit dem Vorname B Nachname B ein Fest.“, Kennung T3P4 → V96L
- OK: „ist eine Einrichtung“ zurück: wieder „Einrichtung A“, Zählung und Kennung folgen – „Das FZS plant gemeinsam mit dem Einrichtung A ein Fest.“, Kennung V96L → E79G

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

## Rückwärts-Prüfung für den Revert-Weg: Version 2.2 mit Schlüsseldateien aus 2.3
- Schlüssel mit Einrichtung (Format-Version 2), Meldung von 2.2: „Unbekannte Version der Schlüsseldatei (2). Bitte eine neuere Version des Tools verwenden.“
- OK: 2.2 lehnt einen Schlüssel mit Einrichtung klar ab (unbekannte Version) – Prüfen-Knopf gesperrt: true
- Schlüssel ohne Einrichtung (Format-Version 1), Meldung von 2.2: „Schlüsseldatei geladen: 4 Platzhalter, Kennung J6W9 (erstellt mit Version 2.4.1, Quelle TXT).“, Urteil „passend“
- OK: 2.3-Schlüssel ohne Einrichtung: Format-Version 1, 2.2 baut exakt zurück

## TXT: Einrichtung über einen Zeilenumbruch (Entscheidung Easy), alle drei Modi, Unix- und Windows-Zeilenenden
### Unix (LF), Modus „Person A“

| Fall | ersetzt | Ausgabe |
|---|---|---|
| Umbruch nach dem ersten Wort | ja | „Brief an die Einrichtung A, z. Hd. Frau Person A.“ |
- OK: Unix (LF), person: Umbruch nach dem ersten Wort – Brief an die Einrichtung A, z. Hd. Frau Person A.
| Umbruch nach dem zweiten Wort | ja | „Die Einrichtung A lädt ein.“ |
- OK: Unix (LF), person: Umbruch nach dem zweiten Wort – Die Einrichtung A lädt ein.
| mit Endung am Schluss | ja | „Vorstand des Einrichtung Bs tagt.“ |
- OK: Unix (LF), person: mit Endung am Schluss – Vorstand des Einrichtung Bs tagt.
| zwei Umbrüche (nicht ersetzen, Schlusscheck meldet) | nein | „Gruß an die Musikschule⏎am⏎Stadtpark (zwei Umbrüche).“ – Schlusscheck meldet: ja, mit Anleitung |
- OK: Unix (LF), person: zwei Umbrüche (nicht ersetzen, Schlusscheck meldet)
| ohne Einrichtung (unverändert) | unverändert | „Ein Satz ohne Einrichtung.“ |
- OK: Unix (LF), person: ohne Einrichtung (unverändert) – Ein Satz ohne Einrichtung.
| ohne Umbruch (Vergleich) | ja | „Einrichtung A ohne Umbruch.“ |
- OK: Unix (LF), person: ohne Umbruch (Vergleich) – Einrichtung A ohne Umbruch.
- Wortbestandteile in der Ausgabe: Musikschule 1, Stadtpark 1, Lindenauer 0, Bürgerverein 0, Hollmann 0 (Reste nur im Fall „zwei Umbrüche“: Musikschule 1, Stadtpark 1)
- OK: Unix (LF), person: Zeilenenden der Datei bleiben erhalten; Zeilen nur dort verbunden, wo eine Einrichtung über den Umbruch ging (3×) – 12 → 9 Zeilen
- OK: Unix (LF), person: Reste nur im gemeldeten Zwei-Umbrüche-Fall
- Markierungen in der Prüfansicht (Teile über zwei Zeilen): „Musikschule“, „am Stadtpark“, „Musikschule am“, „Stadtpark“, „Lindenauer“, „Bürgervereins“, „Musikschule am Stadtpark“

### Unix (LF), Modus „[NAME]“

| Fall | ersetzt | Ausgabe |
|---|---|---|
| Umbruch nach dem ersten Wort | ja | „Brief an die [EINRICHTUNG], z. Hd. Frau [NAME].“ |
- OK: Unix (LF), name: Umbruch nach dem ersten Wort – Brief an die [EINRICHTUNG], z. Hd. Frau [NAME].
| Umbruch nach dem zweiten Wort | ja | „Die [EINRICHTUNG] lädt ein.“ |
- OK: Unix (LF), name: Umbruch nach dem zweiten Wort – Die [EINRICHTUNG] lädt ein.
| mit Endung am Schluss | ja | „Vorstand des [EINRICHTUNG]s tagt.“ |
- OK: Unix (LF), name: mit Endung am Schluss – Vorstand des [EINRICHTUNG]s tagt.
| zwei Umbrüche (nicht ersetzen, Schlusscheck meldet) | nein | „Gruß an die Musikschule⏎am⏎Stadtpark (zwei Umbrüche).“ – Schlusscheck meldet: ja, mit Anleitung |
- OK: Unix (LF), name: zwei Umbrüche (nicht ersetzen, Schlusscheck meldet)
| ohne Einrichtung (unverändert) | unverändert | „Ein Satz ohne Einrichtung.“ |
- OK: Unix (LF), name: ohne Einrichtung (unverändert) – Ein Satz ohne Einrichtung.
| ohne Umbruch (Vergleich) | ja | „[EINRICHTUNG] ohne Umbruch.“ |
- OK: Unix (LF), name: ohne Umbruch (Vergleich) – [EINRICHTUNG] ohne Umbruch.
- Wortbestandteile in der Ausgabe: Musikschule 1, Stadtpark 1, Lindenauer 0, Bürgerverein 0, Hollmann 0 (Reste nur im Fall „zwei Umbrüche“: Musikschule 1, Stadtpark 1)
- OK: Unix (LF), name: Zeilenenden der Datei bleiben erhalten; Zeilen nur dort verbunden, wo eine Einrichtung über den Umbruch ging (3×) – 12 → 9 Zeilen
- OK: Unix (LF), name: Reste nur im gemeldeten Zwei-Umbrüche-Fall

### Unix (LF), Modus rückbaufähig

| Fall | ersetzt | Ausgabe |
|---|---|---|
| Umbruch nach dem ersten Wort | ja | „Brief an die Einrichtung A, z. Hd. Frau Vorname A Nachname A.“ |
- OK: Unix (LF), reversible: Umbruch nach dem ersten Wort – Brief an die Einrichtung A, z. Hd. Frau Vorname A Nachname A.
| Umbruch nach dem zweiten Wort | ja | „Die Einrichtung A2 lädt ein.“ |
- OK: Unix (LF), reversible: Umbruch nach dem zweiten Wort – Die Einrichtung A2 lädt ein.
| mit Endung am Schluss | ja | „Vorstand des Einrichtung Bs tagt.“ |
- OK: Unix (LF), reversible: mit Endung am Schluss – Vorstand des Einrichtung Bs tagt.
| zwei Umbrüche (nicht ersetzen, Schlusscheck meldet) | nein | „Gruß an die Musikschule⏎am⏎Stadtpark (zwei Umbrüche).“ – Schlusscheck meldet: ja, mit Anleitung |
- OK: Unix (LF), reversible: zwei Umbrüche (nicht ersetzen, Schlusscheck meldet)
| ohne Einrichtung (unverändert) | unverändert | „Ein Satz ohne Einrichtung.“ |
- OK: Unix (LF), reversible: ohne Einrichtung (unverändert) – Ein Satz ohne Einrichtung.
| ohne Umbruch (Vergleich) | ja | „Einrichtung A3 ohne Umbruch.“ |
- OK: Unix (LF), reversible: ohne Umbruch (Vergleich) – Einrichtung A3 ohne Umbruch.
- Wortbestandteile in der Ausgabe: Musikschule 1, Stadtpark 1, Lindenauer 0, Bürgerverein 0, Hollmann 0 (Reste nur im Fall „zwei Umbrüche“: Musikschule 1, Stadtpark 1)
- OK: Unix (LF), reversible: Zeilenenden der Datei bleiben erhalten; Zeilen nur dort verbunden, wo eine Einrichtung über den Umbruch ging (3×) – 12 → 9 Zeilen
- OK: Unix (LF), reversible: Reste nur im gemeldeten Zwei-Umbrüche-Fall
- Schlüssel: Einrichtung A = "Musikschule\nam Stadtpark"; Einrichtung A2 = "Musikschule am\nStadtpark"; Einrichtung B = "Lindenauer\nBürgerverein"; Einrichtung A3 = "Musikschule am Stadtpark"
- OK: Unix (LF): Rückbau byte-genau, samt Zeilenumbruch im Namen – Urteil „passend“

### Windows (CRLF), Modus „Person A“

| Fall | ersetzt | Ausgabe |
|---|---|---|
| Umbruch nach dem ersten Wort | ja | „Brief an die Einrichtung A, z. Hd. Frau Person A.“ |
- OK: Windows (CRLF), person: Umbruch nach dem ersten Wort – Brief an die Einrichtung A, z. Hd. Frau Person A.
| Umbruch nach dem zweiten Wort | ja | „Die Einrichtung A lädt ein.“ |
- OK: Windows (CRLF), person: Umbruch nach dem zweiten Wort – Die Einrichtung A lädt ein.
| mit Endung am Schluss | ja | „Vorstand des Einrichtung Bs tagt.“ |
- OK: Windows (CRLF), person: mit Endung am Schluss – Vorstand des Einrichtung Bs tagt.
| zwei Umbrüche (nicht ersetzen, Schlusscheck meldet) | nein | „Gruß an die Musikschule⏎am⏎Stadtpark (zwei Umbrüche).“ – Schlusscheck meldet: ja, mit Anleitung |
- OK: Windows (CRLF), person: zwei Umbrüche (nicht ersetzen, Schlusscheck meldet)
| ohne Einrichtung (unverändert) | unverändert | „Ein Satz ohne Einrichtung.“ |
- OK: Windows (CRLF), person: ohne Einrichtung (unverändert) – Ein Satz ohne Einrichtung.
| ohne Umbruch (Vergleich) | ja | „Einrichtung A ohne Umbruch.“ |
- OK: Windows (CRLF), person: ohne Umbruch (Vergleich) – Einrichtung A ohne Umbruch.
- Wortbestandteile in der Ausgabe: Musikschule 1, Stadtpark 1, Lindenauer 0, Bürgerverein 0, Hollmann 0 (Reste nur im Fall „zwei Umbrüche“: Musikschule 1, Stadtpark 1)
- OK: Windows (CRLF), person: Zeilenenden der Datei bleiben erhalten; Zeilen nur dort verbunden, wo eine Einrichtung über den Umbruch ging (3×) – 12 → 9 Zeilen
- OK: Windows (CRLF), person: Reste nur im gemeldeten Zwei-Umbrüche-Fall

### Windows (CRLF), Modus „[NAME]“

| Fall | ersetzt | Ausgabe |
|---|---|---|
| Umbruch nach dem ersten Wort | ja | „Brief an die [EINRICHTUNG], z. Hd. Frau [NAME].“ |
- OK: Windows (CRLF), name: Umbruch nach dem ersten Wort – Brief an die [EINRICHTUNG], z. Hd. Frau [NAME].
| Umbruch nach dem zweiten Wort | ja | „Die [EINRICHTUNG] lädt ein.“ |
- OK: Windows (CRLF), name: Umbruch nach dem zweiten Wort – Die [EINRICHTUNG] lädt ein.
| mit Endung am Schluss | ja | „Vorstand des [EINRICHTUNG]s tagt.“ |
- OK: Windows (CRLF), name: mit Endung am Schluss – Vorstand des [EINRICHTUNG]s tagt.
| zwei Umbrüche (nicht ersetzen, Schlusscheck meldet) | nein | „Gruß an die Musikschule⏎am⏎Stadtpark (zwei Umbrüche).“ – Schlusscheck meldet: ja, mit Anleitung |
- OK: Windows (CRLF), name: zwei Umbrüche (nicht ersetzen, Schlusscheck meldet)
| ohne Einrichtung (unverändert) | unverändert | „Ein Satz ohne Einrichtung.“ |
- OK: Windows (CRLF), name: ohne Einrichtung (unverändert) – Ein Satz ohne Einrichtung.
| ohne Umbruch (Vergleich) | ja | „[EINRICHTUNG] ohne Umbruch.“ |
- OK: Windows (CRLF), name: ohne Umbruch (Vergleich) – [EINRICHTUNG] ohne Umbruch.
- Wortbestandteile in der Ausgabe: Musikschule 1, Stadtpark 1, Lindenauer 0, Bürgerverein 0, Hollmann 0 (Reste nur im Fall „zwei Umbrüche“: Musikschule 1, Stadtpark 1)
- OK: Windows (CRLF), name: Zeilenenden der Datei bleiben erhalten; Zeilen nur dort verbunden, wo eine Einrichtung über den Umbruch ging (3×) – 12 → 9 Zeilen
- OK: Windows (CRLF), name: Reste nur im gemeldeten Zwei-Umbrüche-Fall

### Windows (CRLF), Modus rückbaufähig

| Fall | ersetzt | Ausgabe |
|---|---|---|
| Umbruch nach dem ersten Wort | ja | „Brief an die Einrichtung A, z. Hd. Frau Vorname A Nachname A.“ |
- OK: Windows (CRLF), reversible: Umbruch nach dem ersten Wort – Brief an die Einrichtung A, z. Hd. Frau Vorname A Nachname A.
| Umbruch nach dem zweiten Wort | ja | „Die Einrichtung A2 lädt ein.“ |
- OK: Windows (CRLF), reversible: Umbruch nach dem zweiten Wort – Die Einrichtung A2 lädt ein.
| mit Endung am Schluss | ja | „Vorstand des Einrichtung Bs tagt.“ |
- OK: Windows (CRLF), reversible: mit Endung am Schluss – Vorstand des Einrichtung Bs tagt.
| zwei Umbrüche (nicht ersetzen, Schlusscheck meldet) | nein | „Gruß an die Musikschule⏎am⏎Stadtpark (zwei Umbrüche).“ – Schlusscheck meldet: ja, mit Anleitung |
- OK: Windows (CRLF), reversible: zwei Umbrüche (nicht ersetzen, Schlusscheck meldet)
| ohne Einrichtung (unverändert) | unverändert | „Ein Satz ohne Einrichtung.“ |
- OK: Windows (CRLF), reversible: ohne Einrichtung (unverändert) – Ein Satz ohne Einrichtung.
| ohne Umbruch (Vergleich) | ja | „Einrichtung A3 ohne Umbruch.“ |
- OK: Windows (CRLF), reversible: ohne Umbruch (Vergleich) – Einrichtung A3 ohne Umbruch.
- Wortbestandteile in der Ausgabe: Musikschule 1, Stadtpark 1, Lindenauer 0, Bürgerverein 0, Hollmann 0 (Reste nur im Fall „zwei Umbrüche“: Musikschule 1, Stadtpark 1)
- OK: Windows (CRLF), reversible: Zeilenenden der Datei bleiben erhalten; Zeilen nur dort verbunden, wo eine Einrichtung über den Umbruch ging (3×) – 12 → 9 Zeilen
- OK: Windows (CRLF), reversible: Reste nur im gemeldeten Zwei-Umbrüche-Fall
- Schlüssel: Einrichtung A = "Musikschule\r\nam Stadtpark"; Einrichtung A2 = "Musikschule am\r\nStadtpark"; Einrichtung B = "Lindenauer\r\nBürgerverein"; Einrichtung A3 = "Musikschule am Stadtpark"
- OK: Windows (CRLF): Rückbau byte-genau, samt Zeilenumbruch im Namen – Urteil „passend“

## Nur getestet (nicht gebaut): Name auf zwei getrennten Absätzen (Briefkopf)
- einrichtung-absatz.txt, person: Briefkopf ersetzt: nein; in der Ausgabe: Musikschule 1×; Schlusscheck meldet: ja – „Musikschule am Stadtpark – steht in: Zeile 1 und Zeile 3 (im Original) · Einrichtung aus deiner Liste „Musikschule am Stadtpark“, nicht voll…“
- einrichtung-absatz.txt, reversible: Briefkopf ersetzt: nein; in der Ausgabe: Musikschule 1×; Schlusscheck meldet: ja – „Musikschule am Stadtpark – steht in: Zeile 1 und Zeile 3 (im Original) · Einrichtung aus deiner Liste „Musikschule am Stadtpark“, nicht voll…“
- einrichtung-absatz.docx, person: Briefkopf ersetzt: nein; in der Ausgabe: Musikschule 1×; Schlusscheck meldet: ja – „Musikschule am Stadtpark – steht in: Text (im Original) · Einrichtung aus deiner Liste „Musikschule am Stadtpark“, nicht vollständig ersetzt…“
- einrichtung-absatz.docx, reversible: Briefkopf ersetzt: nein; in der Ausgabe: Musikschule 1×; Schlusscheck meldet: ja – „Musikschule am Stadtpark – steht in: Text (im Original) · Einrichtung aus deiner Liste „Musikschule am Stadtpark“, nicht vollständig ersetzt…“
- einrichtung-absatz-text.txt, person: Briefkopf ersetzt: nein; in der Ausgabe: Musikschule 1×; Schlusscheck meldet: ja – „Musikschule am Stadtpark – steht in: Zeile 1 und Zeile 3 (im Original) · Einrichtung aus deiner Liste „Musikschule am Stadtpark“, nicht voll…“
- einrichtung-absatz-text.txt, reversible: Briefkopf ersetzt: nein; in der Ausgabe: Musikschule 1×; Schlusscheck meldet: ja – „Musikschule am Stadtpark – steht in: Zeile 1 und Zeile 3 (im Original) · Einrichtung aus deiner Liste „Musikschule am Stadtpark“, nicht voll…“
- einrichtung-absatz-text.docx, person: Briefkopf ersetzt: nein; in der Ausgabe: Musikschule 1×; Schlusscheck meldet: ja – „Musikschule am Stadtpark – steht in: Text (im Original) · Einrichtung aus deiner Liste „Musikschule am Stadtpark“, nicht vollständig ersetzt…“
- einrichtung-absatz-text.docx, reversible: Briefkopf ersetzt: nein; in der Ausgabe: Musikschule 1×; Schlusscheck meldet: ja – „Musikschule am Stadtpark – steht in: Text (im Original) · Einrichtung aus deiner Liste „Musikschule am Stadtpark“, nicht vollständig ersetzt…“
- Befund (seit der Prüfung über die Liste): Der Briefkopf wird nicht ersetzt (keine Ersetzung über Absätze), der Schlusscheck meldet ihn in allen Fällen, auch wenn die Einrichtung nur dort steht.
- OK: Briefkopf über zwei Absätze: nicht ersetzt, aber immer gemeldet (nur Briefkopf und mit Text)

## Schlusscheck: jede Einrichtung aus der Liste im Originaltext, auch über Absätze

| Fall | Format | Modus | Meldungen (erwartet) | Fundort und Anleitung | Speichern gesperrt |
|---|---|---|---|---|---|
| nur im Briefkopf über zwei Absätze | docx | person | 1 (1) | Text (im Original) · Einrichtung aus deiner Liste „Musikschule am Stadtpark“, nicht vollständig ersetzt: „…Musikschule am Stadtpark Rundbrief an alle Eltern.…“ Der Name s | ja |
- OK: nur-briefkopf, docx, person: 1 Meldung(en), mit Fundort und Anleitung, Speichern gesperrt – Musikschule am
| nur im Briefkopf über zwei Absätze | docx | reversible | 1 (1) | Text (im Original) · Einrichtung aus deiner Liste „Musikschule am Stadtpark“, nicht vollständig ersetzt: „…Musikschule am Stadtpark Rundbrief an alle Eltern.…“ Der Name s | ja |
- OK: nur-briefkopf, docx, reversible: 1 Meldung(en), mit Fundort und Anleitung, Speichern gesperrt – Musikschule am
| nur im Briefkopf über zwei Absätze | txt | person | 1 (1) | Zeile 1 und Zeile 3 (im Original) · Einrichtung aus deiner Liste „Musikschule am Stadtpark“, nicht vollständig ersetzt: „…Musikschule am Stadtpark Rundbrief an alle Elter | ja |
- OK: nur-briefkopf, txt, person: 1 Meldung(en), mit Fundort und Anleitung, Speichern gesperrt – Musikschule am
| nur im Briefkopf über zwei Absätze | txt | reversible | 1 (1) | Zeile 1 und Zeile 3 (im Original) · Einrichtung aus deiner Liste „Musikschule am Stadtpark“, nicht vollständig ersetzt: „…Musikschule am Stadtpark Rundbrief an alle Elter | ja |
- OK: nur-briefkopf, txt, reversible: 1 Meldung(en), mit Fundort und Anleitung, Speichern gesperrt – Musikschule am
| im Briefkopf (über zwei Absätze) und im Text | docx | person | 1 (1) | Text (im Original) · Einrichtung aus deiner Liste „Musikschule am Stadtpark“, nicht vollständig ersetzt: „…Musikschule am Stadtpark Die Musikschule am Stadtpark …“ Der Na | ja |
- OK: briefkopf-und-text, docx, person: 1 Meldung(en), mit Fundort und Anleitung, Speichern gesperrt – Musikschule am
| im Briefkopf (über zwei Absätze) und im Text | docx | reversible | 1 (1) | Text (im Original) · Einrichtung aus deiner Liste „Musikschule am Stadtpark“, nicht vollständig ersetzt: „…Musikschule am Stadtpark Die Musikschule am Stadtpark …“ Der Na | ja |
- OK: briefkopf-und-text, docx, reversible: 1 Meldung(en), mit Fundort und Anleitung, Speichern gesperrt – Musikschule am
| im Briefkopf (über zwei Absätze) und im Text | txt | person | 1 (1) | Zeile 1 und Zeile 3 (im Original) · Einrichtung aus deiner Liste „Musikschule am Stadtpark“, nicht vollständig ersetzt: „…Musikschule am Stadtpark Die Musikschule am Stad | ja |
- OK: briefkopf-und-text, txt, person: 1 Meldung(en), mit Fundort und Anleitung, Speichern gesperrt – Musikschule am
| im Briefkopf (über zwei Absätze) und im Text | txt | reversible | 1 (1) | Zeile 1 und Zeile 3 (im Original) · Einrichtung aus deiner Liste „Musikschule am Stadtpark“, nicht vollständig ersetzt: „…Musikschule am Stadtpark Die Musikschule am Stad | ja |
- OK: briefkopf-und-text, txt, reversible: 1 Meldung(en), mit Fundort und Anleitung, Speichern gesperrt – Musikschule am
| „Freie Waldorfschule“ über zwei Absätze, davor „Kita“ als Person ersetzt | docx | person | 1 (1) | Text (im Original) · Einrichtung aus deiner Liste „Freie Waldorfschule“, nicht vollständig ersetzt: „…Kita Freie Waldorfschule Rundbrief an alle Eltern.…“ Der Name steht  | ja |
- OK: freie-person, docx, person: 1 Meldung(en), mit Fundort und Anleitung, Speichern gesperrt („Kita“ als Person ersetzt, „Freie“ bleibt) – Person A Freie
| „Freie Waldorfschule“ über zwei Absätze, davor „Kita“ als Person ersetzt | docx | reversible | 1 (1) | Text (im Original) · Einrichtung aus deiner Liste „Freie Waldorfschule“, nicht vollständig ersetzt: „…Kita Freie Waldorfschule Rundbrief an alle Eltern.…“ Der Name steht  | ja |
- OK: freie-person, docx, reversible: 1 Meldung(en), mit Fundort und Anleitung, Speichern gesperrt („Kita“ als Person ersetzt, „Freie“ bleibt) – Nachname A Freie
| „Freie Waldorfschule“ über zwei Absätze, davor „Kita“ als Person ersetzt | txt | person | 1 (1) | Zeile 1 und Zeile 3 (im Original) · Einrichtung aus deiner Liste „Freie Waldorfschule“, nicht vollständig ersetzt: „…Kita Freie Waldorfschule Rundbrief an alle Eltern. …“ | ja |
- OK: freie-person, txt, person: 1 Meldung(en), mit Fundort und Anleitung, Speichern gesperrt („Kita“ als Person ersetzt, „Freie“ bleibt) – Person A Freie
| „Freie Waldorfschule“ über zwei Absätze, davor „Kita“ als Person ersetzt | txt | reversible | 1 (1) | Zeile 1 und Zeile 3 (im Original) · Einrichtung aus deiner Liste „Freie Waldorfschule“, nicht vollständig ersetzt: „…Kita Freie Waldorfschule Rundbrief an alle Eltern. …“ | ja |
- OK: freie-person, txt, reversible: 1 Meldung(en), mit Fundort und Anleitung, Speichern gesperrt („Kita“ als Person ersetzt, „Freie“ bleibt) – Nachname A Freie
| in der Liste, aber nicht im Dokument (keine Meldung erwartet) | docx | person | 0 (0) | – | – |
- OK: nicht-im-dokument, docx, person: 0 Meldung(en) – Rundbrief an alle Eltern.
| in der Liste, aber nicht im Dokument (keine Meldung erwartet) | docx | reversible | 0 (0) | – | – |
- OK: nicht-im-dokument, docx, reversible: 0 Meldung(en) – Rundbrief an alle Eltern.
| in der Liste, aber nicht im Dokument (keine Meldung erwartet) | txt | person | 0 (0) | – | – |
- OK: nicht-im-dokument, txt, person: 0 Meldung(en) – Rundbrief an alle Eltern.
| in der Liste, aber nicht im Dokument (keine Meldung erwartet) | txt | reversible | 0 (0) | – | – |
- OK: nicht-im-dokument, txt, reversible: 0 Meldung(en) – Rundbrief an alle Eltern.
| vollständig ersetzt, auch mit Endung (keine Meldung erwartet) | docx | person | 0 (0) | – | – |
- OK: vollstaendig-ersetzt, docx, person: 0 Meldung(en) – Die Einrichtung A lädt ein.
| vollständig ersetzt, auch mit Endung (keine Meldung erwartet) | docx | reversible | 0 (0) | – | – |
- OK: vollstaendig-ersetzt, docx, reversible: 0 Meldung(en) – Die Einrichtung A lädt ein.
| vollständig ersetzt, auch mit Endung (keine Meldung erwartet) | txt | person | 0 (0) | – | – |
- OK: vollstaendig-ersetzt, txt, person: 0 Meldung(en) – Die Einrichtung A lädt ein.
| vollständig ersetzt, auch mit Endung (keine Meldung erwartet) | txt | reversible | 0 (0) | – | – |
- OK: vollstaendig-ersetzt, txt, reversible: 0 Meldung(en) – Die Einrichtung A lädt ein.
| mit Endung über zwei Absätze („Lindenauer⏎Bürgervereins“) | docx | person | 1 (1) | Text (im Original) · Einrichtung aus deiner Liste „Lindenauer Bürgerverein“, nicht vollständig ersetzt: „…Vorstand des Lindenauer Bürgervereins tagt.…“ Der Name steht übe | ja |
- OK: endung-ueber-absaetze, docx, person: 1 Meldung(en), mit Fundort und Anleitung, Speichern gesperrt – Vorstand des Lindenauer
| mit Endung über zwei Absätze („Lindenauer⏎Bürgervereins“) | docx | reversible | 1 (1) | Text (im Original) · Einrichtung aus deiner Liste „Lindenauer Bürgerverein“, nicht vollständig ersetzt: „…Vorstand des Lindenauer Bürgervereins tagt.…“ Der Name steht übe | ja |
- OK: endung-ueber-absaetze, docx, reversible: 1 Meldung(en), mit Fundort und Anleitung, Speichern gesperrt – Vorstand des Lindenauer
| mit Endung über zwei Absätze („Lindenauer⏎Bürgervereins“) | txt | person | 1 (1) | Zeile 1 und Zeile 3 (im Original) · Einrichtung aus deiner Liste „Lindenauer Bürgerverein“, nicht vollständig ersetzt: „…Vorstand des Lindenauer Bürgervereins tagt. …“ De | ja |
- OK: endung-ueber-absaetze, txt, person: 1 Meldung(en), mit Fundort und Anleitung, Speichern gesperrt – Vorstand des Lindenauer
| mit Endung über zwei Absätze („Lindenauer⏎Bürgervereins“) | txt | reversible | 1 (1) | Zeile 1 und Zeile 3 (im Original) · Einrichtung aus deiner Liste „Lindenauer Bürgerverein“, nicht vollständig ersetzt: „…Vorstand des Lindenauer Bürgervereins tagt. …“ De | ja |
- OK: endung-ueber-absaetze, txt, reversible: 1 Meldung(en), mit Fundort und Anleitung, Speichern gesperrt – Vorstand des Lindenauer
| Kopfzeile und Fußzeile über zwei Absätze, Bildbeschreibung vollständig ersetzt | docx | person | 2 (2) | Kopfzeile (im Original) · Einrichtung aus deiner Liste „Musi / Fußzeile (im Original) · Einrichtung aus deiner Liste „Linde | ja |
- OK: Kopf-/Fußzeile/Bildbeschreibung, person: Kopfzeile und Fußzeile gemeldet, Bildbeschreibung (ersetzt) nicht
| … Treffer in der Bildbeschreibung ausgeschaltet | docx | person | 3 (3) | Kopfzeile (im Original) · Einrichtung aus deiner Liste „Musi / Fußzeile (im Original) · Einrichtung aus deiner Liste „Linde / Bildbeschreibung (Alt-Text) (im Original) · Einrichtung aus  | ja |
- OK: Bildbeschreibung, person: ausgeschalteter Treffer wird mit Fundort „Bildbeschreibung“ gemeldet
| Kopfzeile und Fußzeile über zwei Absätze, Bildbeschreibung vollständig ersetzt | docx | reversible | 2 (2) | Kopfzeile (im Original) · Einrichtung aus deiner Liste „Musi / Fußzeile (im Original) · Einrichtung aus deiner Liste „Linde | ja |
- OK: Kopf-/Fußzeile/Bildbeschreibung, reversible: Kopfzeile und Fußzeile gemeldet, Bildbeschreibung (ersetzt) nicht
| … Treffer in der Bildbeschreibung ausgeschaltet | docx | reversible | 3 (3) | Kopfzeile (im Original) · Einrichtung aus deiner Liste „Musi / Fußzeile (im Original) · Einrichtung aus deiner Liste „Linde / Bildbeschreibung (Alt-Text) (im Original) · Einrichtung aus  | ja |
- OK: Bildbeschreibung, reversible: ausgeschalteter Treffer wird mit Fundort „Bildbeschreibung“ gemeldet

## Gegenprobe: alle Testdokumente, volle Liste, beide Modi (über dieselbe Prüfung wie beim Speichern)
- einrichtung-absatz-text.docx, person: 1 erwartete Meldung(en): Musikschule am Stadtpark
- einrichtung-absatz-text.docx, reversible: 1 erwartete Meldung(en): Musikschule am Stadtpark
- einrichtung-absatz-text.txt, person: 1 erwartete Meldung(en): Musikschule am Stadtpark
- einrichtung-absatz-text.txt, reversible: 1 erwartete Meldung(en): Musikschule am Stadtpark
- einrichtung-absatz.docx, person: 1 erwartete Meldung(en): Musikschule am Stadtpark
- einrichtung-absatz.docx, reversible: 1 erwartete Meldung(en): Musikschule am Stadtpark
- einrichtung-absatz.txt, person: 1 erwartete Meldung(en): Musikschule am Stadtpark
- einrichtung-absatz.txt, reversible: 1 erwartete Meldung(en): Musikschule am Stadtpark
- einrichtung-umbruch-crlf.txt, person: 1 erwartete Meldung(en): Musikschule am Stadtpark
- einrichtung-umbruch-crlf.txt, reversible: 1 erwartete Meldung(en): Musikschule am Stadtpark
- einrichtung-umbruch.txt, person: 1 erwartete Meldung(en): Musikschule am Stadtpark
- einrichtung-umbruch.txt, reversible: 1 erwartete Meldung(en): Musikschule am Stadtpark
- einrichtung.docx, reversible: 1 erwartete Meldung(en): Familienzentrum Sonnenblume
- sc-briefkopf-und-text.docx, person: 1 erwartete Meldung(en): Musikschule am Stadtpark
- sc-briefkopf-und-text.docx, reversible: 1 erwartete Meldung(en): Musikschule am Stadtpark
- sc-briefkopf-und-text.txt, person: 1 erwartete Meldung(en): Musikschule am Stadtpark
- sc-briefkopf-und-text.txt, reversible: 1 erwartete Meldung(en): Musikschule am Stadtpark
- sc-endung-ueber-absaetze.docx, person: 1 erwartete Meldung(en): Lindenauer Bürgervereins
- sc-endung-ueber-absaetze.docx, reversible: 1 erwartete Meldung(en): Lindenauer Bürgervereins
- sc-endung-ueber-absaetze.txt, person: 1 erwartete Meldung(en): Lindenauer Bürgervereins
- sc-endung-ueber-absaetze.txt, reversible: 1 erwartete Meldung(en): Lindenauer Bürgervereins
- sc-freie-person.docx, person: 1 erwartete Meldung(en): Freie Waldorfschule
- sc-freie-person.docx, reversible: 1 erwartete Meldung(en): Freie Waldorfschule
- sc-freie-person.txt, person: 1 erwartete Meldung(en): Freie Waldorfschule
- sc-freie-person.txt, reversible: 1 erwartete Meldung(en): Freie Waldorfschule
- sc-kopf-fuss-bild.docx, person: 2 erwartete Meldung(en): Musikschule am Stadtpark | Lindenauer Bürgerverein
- sc-kopf-fuss-bild.docx, reversible: 2 erwartete Meldung(en): Musikschule am Stadtpark | Lindenauer Bürgerverein
- sc-nur-briefkopf.docx, person: 1 erwartete Meldung(en): Musikschule am Stadtpark
- sc-nur-briefkopf.docx, reversible: 1 erwartete Meldung(en): Musikschule am Stadtpark
- sc-nur-briefkopf.txt, person: 1 erwartete Meldung(en): Musikschule am Stadtpark
- sc-nur-briefkopf.txt, reversible: 1 erwartete Meldung(en): Musikschule am Stadtpark
- OK: Gegenprobe: 162 Durchläufe (81 Testdokumente × 2 Modi), kein Fehlalarm, keine fehlende Meldung – 0 Abweichung(en)

## Ausgaben gegenüber dem vorigen Stand von PR #8 (mit markierten Einrichtungen)
- OK: Alle 63 Ausgaben (21 Dateien × 3 Modi, mit Einrichtungen) byte-gleich zum vorigen Stand (Kennung festgehalten)

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
- OK: einrichtung.txt: zwei Läufe byte-gleich – 75e61bf617952334
- OK: einrichtung.csv: zwei Läufe byte-gleich – 1fb2f829a54e086c

Prüfungen: 160 von 160 bestanden.
Netzwerkanfragen außer lokalen Dateien: 0.
