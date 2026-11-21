# Namensspalten, Anrede in der Nachbarzelle, Anrede am Zeilenende, „von“ (Version 2.6.0)

Testdokumente: tests/fixtures-spalten/ (erzeugt mit tests/make-spalten.mjs). Vergleich mit Vorversion: p260/index-250.html.

## 1. Ziel: Brief, Liste, Protokoll – kein echter Name bleibt stehen

| Datei | Stand | Fragen | Fehltreffer sicher/unsicher an | Fehltreffer aus | Namen ersetzt | Namen nur Frage/aus | Namen ganz übersehen | Schlusscheck-Meldungen |
|---|---|---|---|---|---|---|---|---|
| brief.docx | vorher | 9 | 0/5 | 4 | 16 | 0 | 2 (Trzaskalik, Huckebein) | 0 |
| brief.docx | nachher | 10 | 0/5 | 4 | 18 | 0 | 0 | 0 |
| liste.xlsx | vorher | 8 | 1/1 | 1 | 22 | 0 | 2 (Dimitrios, Kirchbichler) | 1 (Rosen (Blatt Teilnehmer, Zelle I6)) |
| liste.xlsx | nachher | 4 | 0/2 | 1 | 24 | 0 | 0 | 0 |
| protokoll.txt | vorher | 5 | 0/3 | 4 | 7 | 0 | 4 (Sonnleitner, Kirchbichler, Kirchbichler, Sonnleitner) | 0 |
| protokoll.txt | nachher | 7 | 0/3 | 4 | 11 | 0 | 0 | 0 |
| protokoll-lf.txt | vorher | 5 | 0/3 | 4 | 7 | 0 | 4 (Sonnleitner, Kirchbichler, Kirchbichler, Sonnleitner) | 0 |
| protokoll-lf.txt | nachher | 7 | 0/3 | 4 | 11 | 0 | 0 | 0 |

- OK: brief.docx: kein echter Name ganz übersehen
- OK: brief.docx: kein echter Name nur als Frage/aus
- OK: liste.xlsx: kein echter Name ganz übersehen
- OK: liste.xlsx: kein echter Name nur als Frage/aus
- OK: protokoll.txt: kein echter Name ganz übersehen
- OK: protokoll.txt: kein echter Name nur als Frage/aus
- OK: protokoll-lf.txt: kein echter Name ganz übersehen
- OK: protokoll-lf.txt: kein echter Name nur als Frage/aus
  - brief.docx nachher: Fragen: word:Lieder, word:Yoga, place:Winter, word:Ton, word:Felder, word:Brandstätter, word:Trzaskalik, word:Huckebein, meta:Ingeborg Feldkämper, meta:Henrike Saalfeld; Fehltreffer sicher: –; unsicher an: Lieder, Yoga, Lieder, Yoga, Yoga
  - liste.xlsx nachher: Fragen: word:Yoga, place:Winter, place:Rosen, meta:Verwaltung; Fehltreffer sicher: –; unsicher an: Yoga, Rosen
  - protokoll.txt nachher: Fragen: place:Rosen, word:Sonnleitner, word:Kirchbichler, place:Winter, word:Lieder, word:Yoga, word:Kasse; Fehltreffer sicher: –; unsicher an: Lieder, Yoga, Rosen
- OK: Liste: „Koch“ (Zelle) und „Sabine“ (Zelle) eine Person, „Frau Koch“ in der Bemerkung derselbe Buchstabe – Koch Person A, Sabine Person A
- OK: Liste: „Kirchbichler“/„Magdalena“ eine Person
- OK: Liste: „Nguyen“/„Thi Lan“ eine Person
- OK: Liste: „Schwester von Lena Winter“ behält das „von“

## 2. Tabellenfälle (Excel, CSV, Word)

### XLSX
- OK: xlsx stark: Starkes Kopfwort, Titelzeilen darüber, Sachwort und Füllwerte
- OK: xlsx stark: Koch + Sabine (zwei Zeilen) = ein Buchstabe – Koch Person A, Sabine Person A
- OK: xlsx stark: Nguyen + Thi Lan = ein Buchstabe
- OK: xlsx stark: von der Heide + Jonas = ein Buchstabe
- OK: xlsx stark: Winter/Lukas und Winter/Lena getrennt (gemeinsamer Text „Winter“ bleibt eigene Person)
- OK: xlsx schwach: Schwaches Kopfwort (Lehrkraft)
- OK: xlsx zweikopf: Zwei Kopfzeilen, verbundene Zellen in der oberen
- OK: xlsx ohnekopf: Kopfzeile fehlt (Spalte von Hand)
- OK: xlsx einezelle: „Nachname, Vorname“ in einer Zelle
- OK: xlsx teilwort: Kopf enthält ein Namenswort nur als Teil (keine Namensspalte) – Namensspalten: keine
- OK: xlsx anrede: Anrede in der Nachbarzelle (ohne Namens-Kopfwort)

### CSV
- OK: csv stark: Starkes Kopfwort, Titelzeilen darüber, Sachwort und Füllwerte
- OK: csv stark: Koch + Sabine (zwei Zeilen) = ein Buchstabe – Koch Person A, Sabine Person A
- OK: csv stark: Nguyen + Thi Lan = ein Buchstabe
- OK: csv stark: von der Heide + Jonas = ein Buchstabe
- OK: csv stark: zwei Personen mit Nachname Winter (Lukas, Lena) = zwei Buchstaben
- OK: csv schwach: Schwaches Kopfwort (Lehrkraft)
- OK: csv zweikopf: Zwei Kopfzeilen, verbundene Zellen in der oberen
- OK: csv ohnekopf: Kopfzeile fehlt (Spalte von Hand)
- OK: csv einezelle: „Nachname, Vorname“ in einer Zelle
- OK: csv teilwort: Kopf enthält ein Namenswort nur als Teil (keine Namensspalte) – Namensspalten: keine
- OK: csv anrede: Anrede in der Nachbarzelle (ohne Namens-Kopfwort)

### DOCX
- OK: docx stark: Starkes Kopfwort, Titelzeilen darüber, Sachwort und Füllwerte
- OK: docx stark: Koch + Sabine (zwei Zeilen) = ein Buchstabe – Koch Person B, Sabine Person B
- OK: docx stark: Nguyen + Thi Lan = ein Buchstabe
- OK: docx stark: von der Heide + Jonas = ein Buchstabe
- OK: docx stark: zwei Personen mit Nachname Winter (Lukas, Lena) = zwei Buchstaben
- OK: docx schwach: Schwaches Kopfwort (Lehrkraft)
- OK: docx zweikopf: Zwei Kopfzeilen, verbundene Zellen in der oberen
- OK: docx ohnekopf: Kopfzeile fehlt (Spalte von Hand)
- OK: docx einezelle: „Nachname, Vorname“ in einer Zelle
- OK: docx teilwort: Kopf enthält ein Namenswort nur als Teil (keine Namensspalte) – Namensspalten: (siehe Word-Prüfung unten)
- OK: docx anrede: Anrede in der Nachbarzelle (ohne Namens-Kopfwort)
- OK: docx teilwort: keine dieser Spalten ist Namensspalte – Dateiname=nein, Benutzername=nein, Kursname=nein, Name der Schule=nein, Firmenname=nein

## 3. Modus rückbaufähig: Vor- und Nachname einer Zeile
- OK: xlsx: Koch → Nachname A, Sabine → Vorname A, Thi Lan → Vorname G, von der Heide → Nachname H
- OK: csv: Koch → Nachname A, Sabine → Vorname A, Thi Lan → Vorname H, von der Heide → Nachname I
- OK: docx: Koch → Nachname B, Sabine → Vorname B, Thi Lan → Vorname I, von der Heide → Nachname J

## 4. Spalte von Hand
- OK: Schalter „Namen“ an Spalte 1 sichtbar, aus (keine Kopfzeile)
- OK: Einschalten: Spalte 1 alle sicher – Kirchbichler:S+, Magdalena:S+, Brzęczek:S+, Agnieszka:S+, Huckebein:S+
  - Fragen: 0 → 0 (hier ohne Frage: die Wörter waren vorher gar nicht erkannt)
- OK: Einschalten: neue Kennung (nach gespeicherter Schlüsseldatei)
- OK: Einschalten: Häkchen fällt zurück
- OK: Kopf als Namensspalte gekennzeichnet
- OK: Ausschalten: Treffer wie ohne Regel – Magdalena:S+, Agnieszka:S+
- OK: Erkannte Namensspalte „Nachname“ angehakt
- OK: Ausgeschaltet: „Brzęczek“ nicht mehr sicher aus der Spalte – Brzęczek:U+
- OK: Ausgeschaltet: Fragen ändern sich (Spalte „Nachname“) – 2 → 5
- OK: Wieder eingeschaltet: Treffer wie vorher
- OK: Keine JS-Fehler

## 5. Anrede am Zeilenende (TXT, Windows- und Unix-Zeilenenden, eingefügter Text)
- OK: umbruch-risiko.txt: Risikofälle wie erwartet
  - „Zum Schluss sprach der Herr⏎Pfarrer ein paar Worte.“: Pfarrer – → – (erwartet –)
  - „Es meldete sich Herr⏎Danach wurde abgestimmt.“: Danach – → U+ (erwartet U+)
  - „Bitte wenden Sie sich an Frau⏎Termine werden noch bekannt gegeben.“: Termine U+ → U+ (erwartet U+)
  - „Zuständig ist Herr⏎Mathematik wird verlegt.“: Mathematik – → U+ (erwartet U+)
  - „Gesucht wird eine Frau⏎Für die Küche.“: Für – → – (erwartet –)
  - „Es fehlte nur Frau⏎Gesundheit geht vor.“: Gesundheit – → U+ (erwartet U+)
  - „Liebe Frau⏎Kollegen, bitte beachten.“: Kollegen – → U+ (erwartet U+)
  - „Termin bei Frau⏎Montag geht nicht.“: Montag U- → U- (erwartet U-)
  - „Gespräch mit Herrn Dr.⏎Okafor am Freitag.“: Okafor S+ → S+ (erwartet S+)
- OK: umbruch-risiko-lf.txt: Risikofälle wie erwartet
  - „Zum Schluss sprach der Herr⏎Pfarrer ein paar Worte.“: Pfarrer – → – (erwartet –)
  - „Es meldete sich Herr⏎Danach wurde abgestimmt.“: Danach – → U+ (erwartet U+)
  - „Bitte wenden Sie sich an Frau⏎Termine werden noch bekannt gegeben.“: Termine U+ → U+ (erwartet U+)
  - „Zuständig ist Herr⏎Mathematik wird verlegt.“: Mathematik – → U+ (erwartet U+)
  - „Gesucht wird eine Frau⏎Für die Küche.“: Für – → – (erwartet –)
  - „Es fehlte nur Frau⏎Gesundheit geht vor.“: Gesundheit – → U+ (erwartet U+)
  - „Liebe Frau⏎Kollegen, bitte beachten.“: Kollegen – → U+ (erwartet U+)
  - „Termin bei Frau⏎Montag geht nicht.“: Montag U- → U- (erwartet U-)
  - „Gespräch mit Herrn Dr.⏎Okafor am Freitag.“: Okafor S+ → S+ (erwartet S+)
- OK: Eingefügter Text: Sonnleitner und Kirchbichler ersetzt – Sonnleitner U+,U+, Kirchbichler U+,U+

## 6. „von“: die sechs Fälle aus der Diagnose

| Datei | Stelle | vorher (Treffer) | nachher (Treffer) | erwartet |
|---|---|---|---|---|
| fixtures/protokoll.txt | Frau Dr. von Bodelschwingh | von Bodelschwingh | von Bodelschwingh | von Bodelschwingh |
| fixtures/protokoll.pdf | Frau Dr. von Bodelschwingh | von Bodelschwingh | von Bodelschwingh | von Bodelschwingh |
| fixtures/protokoll.docx | Frau Dr. von Bodelschwingh | von Bodelschwingh | von Bodelschwingh | von Bodelschwingh |
| fixtures/mitarbeiter.xlsx | Frau Dr. von Bodelschwingh | von Bodelschwingh | von Bodelschwingh | von Bodelschwingh |
| fixtures-pfade/pfade-phase0.xlsx | Mutter von Jonas Wiesenthal | von Jonas Wiesenthal | von Jonas Wiesenthal | von Jonas Wiesenthal |
| fixtures-spalten/liste.xlsx | Schwester von Lena Winter | von Lena Winter | Lena Winter | Lena Winter |
- OK: „von“: alle sechs Fälle wie erwartet

## 7. Schlusscheck-Meldungen vorher/nachher
- brief.docx: vorher 0, nachher 0
- liste.xlsx: vorher 1 (Rosen (Blatt Teilnehmer, Zelle I6)), nachher 0
- protokoll.txt: vorher 0, nachher 0
- tabellen.xlsx: vorher 0, nachher 0
- tabellen.docx: vorher 0, nachher 0
- OK: Doppellauf gleich (Treffer und Platzhalter)

- OK: Netzwerkanfragen nach außen: 0
- OK: Keine JS-Fehler (Seite neu)

**Ergebnis: 67 von 67 Prüfungen bestanden.**
