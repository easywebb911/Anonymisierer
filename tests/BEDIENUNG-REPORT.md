# Kompakte Bedienung und Fragen je Stelle (Version 2.5.0): Tests

Testdokumente: tests/make-bedienung.mjs -> tests/fixtures-bedienung/ (alles erfunden). Vorher = Version 2.4.1, nachher = diese Version. Chromium, 1366×768, Modus „Person A“. In der TXT-Datei steht „Wittekindhorn“ in der Liste „Eigene Namen“ (TXT hat keine Dateiangaben).

## 1. Easys Befunde je Fall
### bedienung.docx

| | vorher (2.4.1) | nachher |
|---|---|---|
| Fragen | 6 | 6 (2 zum Wort, 2 je Stelle, 1 Dateiangaben) |
| Zeilen auf dem Speichern-Bildschirm (ohne Antwort) | 6 | 5 |
| Häkchen auf dem Speichern-Bildschirm (ohne Antwort) | 3 | 1 |
| Höhe des Speichern-Bildschirms bei 1366×768 | 1984 px | 768 px |

- Zeilen nachher: „5 Fragen sind noch offen. Ohne Antwort bleibt jede Stelle so, wie sie im Moment ist. Beantworten“ · „3 Wörter sind noch nicht geprüft. Ist ein Name dabei? Ansehen“ · „2 Bilder im Dokument. Das Tool ändert Bilder nicht. Steht auf einem Bild ein Name oder ein Logo, entferne es v“ · „„Wittekindhorn“ steht noch in: Text Name aus den Dateiangaben · „…Wittekindhorn bringt Kuchen mit.…“ Als Namen“ · „„WITTEKINDHORNS“ steht noch in: Text Name aus den Dateiangaben · „…WITTEKINDHORNS Neffe hilft beim Aufbau.…““
- Text ohne Antwort, vorher: Im Winter gehen wir rodeln, sagt Person B. ⏎ Montag ⏎ Do 13:30 Elterncafé ⏎ Wittekindhorn bringt Kuchen mit. ⏎ WITTEKINDHORNS Neffe hilft beim Aufbau. ⏎ Im Formular stehen die Felder Person A und Person F B.
- Text ohne Antwort, nachher: Im Winter gehen wir rodeln, sagt Person B. ⏎ Montag ⏎ Do 13:30 Elterncafé ⏎ Wittekindhorn bringt Kuchen mit. ⏎ WITTEKINDHORNS Neffe hilft beim Aufbau. ⏎ Im Formular stehen die Felder Person A und Person F B.
- Text nach „Ja“ bei allen Fragen, vorher: Do 13:30 Elterncafé ⏎ WITTEKINDHORNS Neffe hilft beim Aufbau. ⏎ Im Formular stehen die Person F Person A und Person G B.
- Text nach „Ja“ bei allen Wort-Fragen (Fragen je Stelle offen), nachher: Im Winter gehen wir rodeln, sagt Person B. ⏎ Montag ⏎ Do 13:30 Elterncafé ⏎ WITTEKINDHORNS Neffe hilft beim Aufbau. ⏎ Im Formular stehen die Felder Person A und Person G B.
- Text nach „Ja“ bei allen Fragen, nachher: Montag ⏎ Do 13:30 Elterncafé ⏎ Im Formular stehen die Person F Person A und Person G B.
- Text nach „Nein“ bei allen Fragen je Stelle (übrige „Ja“), nachher: Im Winter gehen wir rodeln, sagt Person B. ⏎ Sie bringt Rosen mit. ⏎ Montag ⏎ Do 13:30 Elterncafé ⏎ WITTEKINDHORNS Neffe hilft beim Aufbau. ⏎ Im Formular stehen die Felder Person A und Person G B.
- OK: bedienung.docx: ohne Bedienung gleicher Text wie vorher
- OK: bedienung.docx: „Ja“ bei allen Wort-Fragen ersetzt „im Winter“ nicht (vorher ersetzt)
- OK: bedienung.docx: „Nein“ je Stelle: „im Winter“ und „Rosen“ bleiben unverändert
- OK: bedienung.docx: ohne Antwort und nach „Ja“ bei Wort-Fragen bleibt „Rosen“ wie heute ersetzt (Entscheidung Variante a)
- OK: bedienung.docx: keine Frage und keine Markierung für „Montag“ und „Do 13:30“
- OK: bedienung.docx: GROSS-Form „WITTEKINDHORNS“ des übernommenen Namens wird je Stelle gefragt; Fragekarte zeigt „Bleibt im Moment stehen.“ – Frage 3 von 7←→WITTEKINDHORNS Neffe hilft beim Aufbau.Ist hier die Person Wittekindhorn gemeint?Bleibt im Moment stehen.Ja, ersetzenNeinTasten: J = Ja, N = Nein, ← vorige, → nächste Frage

### bedienung.xlsx

| | vorher (2.4.1) | nachher |
|---|---|---|
| Fragen | 6 | 6 (2 zum Wort, 2 je Stelle, 1 Dateiangaben) |
| Zeilen auf dem Speichern-Bildschirm (ohne Antwort) | 7 | 5 |
| Häkchen auf dem Speichern-Bildschirm (ohne Antwort) | 4 | 1 |
| Höhe des Speichern-Bildschirms bei 1366×768 | 2107 px | 768 px |

- Zeilen nachher: „5 Fragen sind noch offen. Ohne Antwort bleibt jede Stelle so, wie sie im Moment ist. Beantworten“ · „3 Wörter sind noch nicht geprüft. Ist ein Name dabei? Ansehen“ · „2 Bilder im Dokument. Das Tool ändert Bilder nicht. Steht auf einem Bild ein Name oder ein Logo, entferne es v“ · „„Wittekindhorn“ steht noch in: Blatt Protokoll, Zelle A8 Name aus den Dateiangaben · „…Wittekindhorn bringt Ku“ · „„WITTEKINDHORNS“ steht noch in: Blatt Protokoll, Zelle A9 Name aus den Dateiangaben · „…WITTEKINDHORNS Neffe h“
- Text ohne Antwort, vorher: [Protokoll!A3] Im Winter gehen wir rodeln, sagt Person B. ⏎ [Protokoll!A6] Montag ⏎ [Protokoll!A7] Do 13:30 Elterncafé ⏎ [Protokoll!A8] Wittekindhorn bringt Kuchen mit. ⏎ [Protokoll!A9] WITTEKINDHORNS Neffe hilft beim Aufbau. ⏎ [Protokoll!A10] Im Formular stehen die Felder Person A und Person F B.
- Text ohne Antwort, nachher: [Protokoll!A3] Im Winter gehen wir rodeln, sagt Person B. ⏎ [Protokoll!A6] Montag ⏎ [Protokoll!A7] Do 13:30 Elterncafé ⏎ [Protokoll!A8] Wittekindhorn bringt Kuchen mit. ⏎ [Protokoll!A9] WITTEKINDHORNS Neffe hilft beim Aufbau. ⏎ [Protokoll!A10] Im Formular stehen die Felder Person A und Person F B.
- Text nach „Ja“ bei allen Fragen, vorher: [Protokoll!A7] Do 13:30 Elterncafé ⏎ [Protokoll!A9] WITTEKINDHORNS Neffe hilft beim Aufbau. ⏎ [Protokoll!A10] Im Formular stehen die Person F Person A und Person G B.
- Text nach „Ja“ bei allen Wort-Fragen (Fragen je Stelle offen), nachher: [Protokoll!A3] Im Winter gehen wir rodeln, sagt Person B. ⏎ [Protokoll!A6] Montag ⏎ [Protokoll!A7] Do 13:30 Elterncafé ⏎ [Protokoll!A9] WITTEKINDHORNS Neffe hilft beim Aufbau. ⏎ [Protokoll!A10] Im Formular stehen die Felder Person A und Person G B.
- Text nach „Ja“ bei allen Fragen, nachher: [Protokoll!A6] Montag ⏎ [Protokoll!A7] Do 13:30 Elterncafé ⏎ [Protokoll!A10] Im Formular stehen die Person F Person A und Person G B.
- Text nach „Nein“ bei allen Fragen je Stelle (übrige „Ja“), nachher: [Protokoll!A3] Im Winter gehen wir rodeln, sagt Person B. ⏎ [Protokoll!A5] Sie bringt Rosen mit. ⏎ [Protokoll!A6] Montag ⏎ [Protokoll!A7] Do 13:30 Elterncafé ⏎ [Protokoll!A9] WITTEKINDHORNS Neffe hilft beim Aufbau. ⏎ [Protokoll!A10] Im Formular stehen die Felder Person A und Person G B.
- OK: bedienung.xlsx: ohne Bedienung gleicher Text wie vorher
- OK: bedienung.xlsx: „Ja“ bei allen Wort-Fragen ersetzt „im Winter“ nicht (vorher ersetzt)
- OK: bedienung.xlsx: „Nein“ je Stelle: „im Winter“ und „Rosen“ bleiben unverändert
- OK: bedienung.xlsx: ohne Antwort und nach „Ja“ bei Wort-Fragen bleibt „Rosen“ wie heute ersetzt (Entscheidung Variante a)
- OK: bedienung.xlsx: keine Frage und keine Markierung für „Montag“ und „Do 13:30“
- OK: bedienung.xlsx: GROSS-Form „WITTEKINDHORNS“ des übernommenen Namens wird je Stelle gefragt; Fragekarte zeigt „Bleibt im Moment stehen.“ – Frage 3 von 7←→WITTEKINDHORNS Neffe hilft beim Aufbau.Ist hier die Person Wittekindhorn gemeint?Bleibt im Moment stehen.Ja, ersetzenNeinTasten: J = Ja, N = Nein, ← vorige, → nächste Frage

### bedienung.txt

| | vorher (2.4.1) | nachher |
|---|---|---|
| Fragen | 5 | 6 (2 zum Wort, 3 je Stelle, 0 Dateiangaben) |
| Zeilen auf dem Speichern-Bildschirm (ohne Antwort) | 4 | 2 |
| Häkchen auf dem Speichern-Bildschirm (ohne Antwort) | 2 | 1 |
| Höhe des Speichern-Bildschirms bei 1366×768 | 1476 px | 768 px |

- Zeilen nachher: „5 Fragen sind noch offen. Ohne Antwort bleibt jede Stelle so, wie sie im Moment ist. Beantworten“ · „2 Wörter sind noch nicht geprüft. Ist ein Name dabei? Ansehen“
- Text ohne Antwort, vorher: Im Winter gehen wir rodeln, sagt Person B. ⏎ Montag ⏎ Do 13:30 Elterncafé ⏎ WITTEKINDHORNS Neffe hilft beim Aufbau. ⏎ Im Formular stehen die Felder Person A und Person G B.
- Text ohne Antwort, nachher: Im Winter gehen wir rodeln, sagt Person B. ⏎ Montag ⏎ Do 13:30 Elterncafé ⏎ WITTEKINDHORNS Neffe hilft beim Aufbau. ⏎ Im Formular stehen die Felder Person A und Person G B.
- Text nach „Ja“ bei allen Fragen, vorher: Do 13:30 Elterncafé ⏎ WITTEKINDHORNS Neffe hilft beim Aufbau. ⏎ Im Formular stehen die Person F Person A und Person G B.
- Text nach „Ja“ bei allen Wort-Fragen (Fragen je Stelle offen), nachher: Im Winter gehen wir rodeln, sagt Person B. ⏎ Montag ⏎ Do 13:30 Elterncafé ⏎ WITTEKINDHORNS Neffe hilft beim Aufbau. ⏎ Im Formular stehen die Felder Person A und Person G B.
- Text nach „Ja“ bei allen Fragen, nachher: Montag ⏎ Do 13:30 Elterncafé ⏎ Im Formular stehen die Person F Person A und Person G B.
- Text nach „Nein“ bei allen Fragen je Stelle (übrige „Ja“), nachher: Im Winter gehen wir rodeln, sagt Person B. ⏎ Sie bringt Rosen mit. ⏎ Montag ⏎ Do 13:30 Elterncafé ⏎ WITTEKINDHORNS Neffe hilft beim Aufbau. ⏎ Im Formular stehen die Felder Person A und Person G B.
- OK: bedienung.txt: ohne Bedienung gleicher Text wie vorher
- OK: bedienung.txt: „Ja“ bei allen Wort-Fragen ersetzt „im Winter“ nicht (vorher ersetzt)
- OK: bedienung.txt: „Nein“ je Stelle: „im Winter“ und „Rosen“ bleiben unverändert
- OK: bedienung.txt: ohne Antwort und nach „Ja“ bei Wort-Fragen bleibt „Rosen“ wie heute ersetzt (Entscheidung Variante a)
- OK: bedienung.txt: keine Frage und keine Markierung für „Montag“ und „Do 13:30“
- OK: bedienung.txt: GROSS-Form „WITTEKINDHORNS“ des übernommenen Namens wird je Stelle gefragt; Fragekarte zeigt „Bleibt im Moment stehen.“ – Frage 3 von 6←→WITTEKINDHORNS Neffe hilft beim Aufbau.Ist hier die Person Wittekindhorn gemeint?Bleibt im Moment stehen.Ja, ersetzenNeinTasten: J = Ja, N = Nein, ← vorige, → nächste Frage

## 2. Beweis D.5: jede stehen gebliebene Stelle eines bestätigten Namens genau einmal

Für jedes Testdokument (tests/fixtures, tests/fixtures-pfade, tests/fixtures-bedienung, dazu die GROSS-Testdokumente mit von Hand übernommenen Nachnamen) in drei Zuständen: ohne Antwort, „Ja“ bei allen Fragen, „Nein“ bei allen Fragen je Stelle. Gezählt wird jede ausgeschaltete Stelle einer Person, die mindestens eine eingeschaltete Stelle hat.

- Stellen insgesamt: 264; davon offene Frage 122, mit „Nein“ entschieden 133, Schlusscheck-Fund 9; Abweichungen 0
- OK: D.5: jede stehen gebliebene Stelle genau einmal (offene Frage ODER „Nein“ ODER Schlusscheck) – 0 Abweichung(en)

## 3. Ohne Bedienung byte-gleich zu Version 2.4.1 (alle Testdokumente, alle Modi, alle Formate, Schlüsseldatei)
- 760 Ausgaben (inkl. Schlüsseldateien) verglichen, 110 unterschiedlich: a2-risiko.csv, person, .csv; a2-risiko.csv, person, .txt; a2-risiko.csv, person, .docx; a2-risiko.csv, name, .csv; a2-risiko.csv, name, .txt; a2-risiko.csv, name, .docx; a2-risiko.csv, reversible, .csv; a2-risiko.csv, reversible, .txt; a2-risiko.csv, reversible, .docx; a2-risiko.csv, Schlüsseldatei; a2-risiko.txt, person, .txt; a2-risiko.txt, person, .docx; a2-risiko.txt, name, .txt; a2-risiko.txt, name, .docx; a2-risiko.txt, reversible, .txt; a2-risiko.txt, reversible, .docx; a2-risiko.txt, Schlüsseldatei; a2-uebertragung.csv, person, .csv; a2-uebertragung.csv, person, .txt; a2-uebertragung.csv, person, .docx; a2-uebertragung.csv, name, .csv; a2-uebertragung.csv, name, .txt; a2-uebertragung.csv, name, .docx; a2-uebertragung.csv, reversible, .csv; a2-uebertragung.csv, reversible, .txt; a2-uebertragung.csv, reversible, .docx; a2-uebertragung.csv, Schlüsseldatei; mitarbeiter.csv, person, .csv; mitarbeiter.csv, person, .txt; mitarbeiter.csv, person, .docx; mitarbeiter.csv, reversible, .csv; mitarbeiter.csv, reversible, .txt; mitarbeiter.csv, reversible, .docx; mitarbeiter.csv, Schlüsseldatei; mitarbeiter.xlsx, person, .xlsx; mitarbeiter.xlsx, person, .txt; mitarbeiter.xlsx, name, .xlsx; mitarbeiter.xlsx, name, .txt; mitarbeiter.xlsx, reversible, .xlsx; mitarbeiter.xlsx, reversible, .txt; mitarbeiter.xlsx, Schlüsseldatei; vertausch-1.csv, person, .csv; vertausch-1.csv, person, .txt; vertausch-1.csv, person, .docx; vertausch-1.csv, name, .csv; vertausch-1.csv, name, .txt; vertausch-1.csv, name, .docx; vertausch-1.csv, reversible, .csv; vertausch-1.csv, reversible, .txt; vertausch-1.csv, reversible, .docx; vertausch-1.csv, Schlüsseldatei; vertausch-1.xlsx, person, .xlsx; vertausch-1.xlsx, person, .txt; vertausch-1.xlsx, name, .xlsx; vertausch-1.xlsx, name, .txt; vertausch-1.xlsx, reversible, .xlsx; vertausch-1.xlsx, reversible, .txt; vertausch-1.xlsx, Schlüsseldatei; vertausch-2.csv, person, .csv; vertausch-2.csv, person, .txt; vertausch-2.csv, person, .docx; vertausch-2.csv, name, .csv; vertausch-2.csv, name, .txt; vertausch-2.csv, name, .docx; vertausch-2.csv, reversible, .csv; vertausch-2.csv, reversible, .txt; vertausch-2.csv, reversible, .docx; vertausch-2.csv, Schlüsseldatei; vertausch-2.xlsx, person, .xlsx; vertausch-2.xlsx, person, .txt; vertausch-2.xlsx, name, .xlsx; vertausch-2.xlsx, name, .txt; vertausch-2.xlsx, reversible, .xlsx; vertausch-2.xlsx, reversible, .txt; vertausch-2.xlsx, Schlüsseldatei; pfade-gegenprobe.xlsx, person, .xlsx; pfade-gegenprobe.xlsx, person, .txt; pfade-gegenprobe.xlsx, name, .xlsx; pfade-gegenprobe.xlsx, name, .txt; pfade-gegenprobe.xlsx, reversible, .xlsx; pfade-gegenprobe.xlsx, reversible, .txt; pfade-gegenprobe.xlsx, Schlüsseldatei; pfade-hauptteil.xlsx, person, .xlsx; pfade-hauptteil.xlsx, person, .txt; pfade-hauptteil.xlsx, name, .xlsx; pfade-hauptteil.xlsx, name, .txt; pfade-hauptteil.xlsx, reversible, .xlsx; pfade-hauptteil.xlsx, reversible, .txt; pfade-hauptteil.xlsx, Schlüsseldatei; pfade-phase0.xlsx, person, .xlsx; pfade-phase0.xlsx, person, .txt; pfade-phase0.xlsx, name, .xlsx; pfade-phase0.xlsx, name, .txt; pfade-phase0.xlsx, reversible, .xlsx; pfade-phase0.xlsx, reversible, .txt; pfade-phase0.xlsx, Schlüsseldatei; pfade-ueblich.xlsx, person, .xlsx; pfade-ueblich.xlsx, person, .txt; pfade-ueblich.xlsx, name, .xlsx; pfade-ueblich.xlsx, name, .txt; pfade-ueblich.xlsx, reversible, .xlsx; pfade-ueblich.xlsx, reversible, .txt; pfade-ueblich.xlsx, Schlüsseldatei; pfade-unueblich.xlsx, person, .xlsx; pfade-unueblich.xlsx, person, .txt; pfade-unueblich.xlsx, name, .xlsx; pfade-unueblich.xlsx, name, .txt; pfade-unueblich.xlsx, reversible, .xlsx; pfade-unueblich.xlsx, reversible, .txt; pfade-unueblich.xlsx, Schlüsseldatei
  - a2-risiko.txt: 7 Ausgabe(n) geändert – Grund (Version 2.6.0): Anrede am Zeilenende: „Liebe Frau⏎Vielen Dank …“ und „Gesprächspartner: Herr⏎Schulleitung“ jetzt ersetzt (unsicher, an); Buchstaben danach verschoben
  - a2-uebertragung.csv: 10 Ausgabe(n) geändert – Grund (Version 2.6.0): Spalte „Name“ ist Namensspalte (starkes Kopfwort): „Hartungs Antrag“ (reine Namenszelle) wird eine Person; Buchstaben danach verschoben
  - mitarbeiter.csv: 7 Ausgabe(n) geändert – Grund (Version 2.6.0): Spalten „Vorname“/„Nachname“: Vor- und Nachname einer Zeile sind eine Person (ein Buchstabe, rückbaufähig „Vorname X“/„Nachname X“)
  - mitarbeiter.xlsx: 7 Ausgabe(n) geändert – Grund (Version 2.6.0): wie mitarbeiter.csv (eine Person je Zeile)
  - vertausch-1.csv: 10 Ausgabe(n) geändert – Grund (Version 2.6.0): Spalte „Nachname“: „Achterberg“ (in keiner Liste) jetzt ersetzt; eine Person je Zeile
  - vertausch-1.xlsx: 7 Ausgabe(n) geändert – Grund (Version 2.6.0): wie vertausch-1.csv
  - vertausch-2.csv: 10 Ausgabe(n) geändert – Grund (Version 2.6.0): Spalten „Vorname“/„Nachname“: „Brinkhaus“, „Tilmann“, „Overkamp“ jetzt ersetzt; eine Person je Zeile
  - vertausch-2.xlsx: 7 Ausgabe(n) geändert – Grund (Version 2.6.0): wie vertausch-2.csv
  - pfade-phase0.xlsx: 7 Ausgabe(n) geändert – Grund (Version 2.6.0): nur Modus rückbaufähig: „Thi Lan“ unter „Vorname“ ist jetzt ganz „Vorname C“ (vorher „Vorname C Nachname C“, Rolle aus der Spalte)
- Version 2.8.0: 105 Ausgabe(n) geändert allein durch selbst gefundene Einrichtungen (nachgewiesen: gleich der Vorversion mit diesen Einrichtungen als von Hand markiert, Schreibweisen zusammengeführt): einrichtung-absatz-text.docx, person, .docx; einrichtung-absatz-text.docx, person, .txt; einrichtung-absatz-text.docx, name, .docx; einrichtung-absatz-text.docx, name, .txt; einrichtung-absatz-text.docx, reversible, .docx; einrichtung-absatz-text.docx, reversible, .txt; einrichtung-absatz-text.docx, Schlüsseldatei; einrichtung-absatz-text.txt, person, .txt; einrichtung-absatz-text.txt, person, .docx; einrichtung-absatz-text.txt, name, .txt; einrichtung-absatz-text.txt, name, .docx; einrichtung-absatz-text.txt, reversible, .txt; einrichtung-absatz-text.txt, reversible, .docx; einrichtung-absatz-text.txt, Schlüsseldatei; einrichtung-umbruch-crlf.txt, person, .txt; einrichtung-umbruch-crlf.txt, person, .docx; einrichtung-umbruch-crlf.txt, name, .txt; einrichtung-umbruch-crlf.txt, name, .docx; einrichtung-umbruch-crlf.txt, reversible, .txt; einrichtung-umbruch-crlf.txt, reversible, .docx; einrichtung-umbruch-crlf.txt, Schlüsseldatei; einrichtung-umbruch.txt, person, .txt; einrichtung-umbruch.txt, person, .docx; einrichtung-umbruch.txt, name, .txt; einrichtung-umbruch.txt, name, .docx; einrichtung-umbruch.txt, reversible, .txt; einrichtung-umbruch.txt, reversible, .docx; einrichtung-umbruch.txt, Schlüsseldatei; einrichtung.docx, person, .docx; einrichtung.docx, person, .txt; einrichtung.docx, name, .docx; einrichtung.docx, name, .txt; einrichtung.docx, reversible, .docx; einrichtung.docx, reversible, .txt; einrichtung.docx, Schlüsseldatei; einrichtung.txt, person, .txt; einrichtung.txt, person, .docx; einrichtung.txt, name, .txt; einrichtung.txt, name, .docx; einrichtung.txt, reversible, .txt; einrichtung.txt, reversible, .docx; einrichtung.txt, Schlüsseldatei; einrichtung.xlsx, person, .xlsx; einrichtung.xlsx, person, .txt; einrichtung.xlsx, name, .xlsx; einrichtung.xlsx, name, .txt; einrichtung.xlsx, reversible, .xlsx; einrichtung.xlsx, reversible, .txt; einrichtung.xlsx, Schlüsseldatei; kurse.docx, person, .docx; kurse.docx, person, .txt; kurse.docx, name, .docx; kurse.docx, name, .txt; kurse.docx, reversible, .docx; kurse.docx, reversible, .txt; kurse.docx, Schlüsseldatei; sc-briefkopf-und-text.docx, person, .docx; sc-briefkopf-und-text.docx, person, .txt; sc-briefkopf-und-text.docx, name, .docx; sc-briefkopf-und-text.docx, name, .txt; sc-briefkopf-und-text.docx, reversible, .docx; sc-briefkopf-und-text.docx, reversible, .txt; sc-briefkopf-und-text.docx, Schlüsseldatei; sc-briefkopf-und-text.txt, person, .txt; sc-briefkopf-und-text.txt, person, .docx; sc-briefkopf-und-text.txt, name, .txt; sc-briefkopf-und-text.txt, name, .docx; sc-briefkopf-und-text.txt, reversible, .txt; sc-briefkopf-und-text.txt, reversible, .docx; sc-briefkopf-und-text.txt, Schlüsseldatei; sc-freie-person.docx, person, .docx; sc-freie-person.docx, person, .txt; sc-freie-person.docx, name, .docx; sc-freie-person.docx, name, .txt; sc-freie-person.docx, reversible, .docx; sc-freie-person.docx, reversible, .txt; sc-freie-person.docx, Schlüsseldatei; sc-freie-person.txt, person, .txt; sc-freie-person.txt, person, .docx; sc-freie-person.txt, name, .txt; sc-freie-person.txt, name, .docx; sc-freie-person.txt, reversible, .txt; sc-freie-person.txt, reversible, .docx; sc-freie-person.txt, Schlüsseldatei; sc-kopf-fuss-bild.docx, person, .docx; sc-kopf-fuss-bild.docx, person, .txt; sc-kopf-fuss-bild.docx, name, .docx; sc-kopf-fuss-bild.docx, name, .txt; sc-kopf-fuss-bild.docx, reversible, .docx; sc-kopf-fuss-bild.docx, reversible, .txt; sc-kopf-fuss-bild.docx, Schlüsseldatei; sc-vollstaendig-ersetzt.docx, person, .docx; sc-vollstaendig-ersetzt.docx, person, .txt; sc-vollstaendig-ersetzt.docx, name, .docx; sc-vollstaendig-ersetzt.docx, name, .txt; sc-vollstaendig-ersetzt.docx, reversible, .docx; sc-vollstaendig-ersetzt.docx, reversible, .txt; sc-vollstaendig-ersetzt.docx, Schlüsseldatei; sc-vollstaendig-ersetzt.txt, person, .txt; sc-vollstaendig-ersetzt.txt, person, .docx; sc-vollstaendig-ersetzt.txt, name, .txt; sc-vollstaendig-ersetzt.txt, name, .docx; sc-vollstaendig-ersetzt.txt, reversible, .txt; sc-vollstaendig-ersetzt.txt, reversible, .docx; sc-vollstaendig-ersetzt.txt, Schlüsseldatei
- Version 2.10.0: 13 Ausgabe(n) geändert allein durch die Spalten-Behandlung (nachgewiesen: mit allen Spalten „wie bisher“ gleich der Vorversion; „dazu 2.8.0“: gleich der Vorversion mit den dann gefundenen Einrichtungen als von Hand markiert): einrichtung.csv, person, .csv (dazu 2.8.0); einrichtung.csv, person, .txt (dazu 2.8.0); einrichtung.csv, person, .docx (dazu 2.8.0); einrichtung.csv, name, .csv (dazu 2.8.0); einrichtung.csv, name, .txt (dazu 2.8.0); einrichtung.csv, name, .docx (dazu 2.8.0); einrichtung.csv, reversible, .csv (dazu 2.8.0); einrichtung.csv, reversible, .txt (dazu 2.8.0); einrichtung.csv, reversible, .docx (dazu 2.8.0); einrichtung.csv, Schlüsseldatei (dazu 2.8.0); mitarbeiter.csv, name, .csv; mitarbeiter.csv, name, .txt; mitarbeiter.csv, name, .docx
  - einrichtung.csv: Spalten mit Behandlung „Name“/„ganz ersetzen“: „Ort“
  - mitarbeiter.csv: Spalten mit Behandlung „Name“/„ganz ersetzen“: „Vorname“, „Nachname“, „Abteilung“, „E-Mail“, „Bemerkung“
- FEHLER: Ohne Bedienung byte-gleich zur Vorversion (Kennung fest), außer den Dokumenten mit Grund aus Version 2.6.0 und den nachgewiesenen Änderungen durch gefundene Einrichtungen (2.8.0) und durch die Spalten-Behandlung (2.10.0) – a2-risiko.csv, person, .csv; a2-risiko.csv, person, .txt; a2-risiko.csv, person, .docx; a2-risiko.csv, name, .csv; a2-risiko.csv, name, .txt; a2-risiko.csv, name, .docx; a2-risiko.csv, reversible, .csv; a2-risiko.csv, reversible, .txt; a2-risiko.csv, reversible, .docx; a2-risiko.csv, Schlüsseldatei; pfade-gegenprobe.xlsx, person, .xlsx; pfade-gegenprobe.xlsx, person, .txt; pfade-gegenprobe.xlsx, name, .xlsx; pfade-gegenprobe.xlsx, name, .txt; pfade-gegenprobe.xlsx, reversible, .xlsx; pfade-gegenprobe.xlsx, reversible, .txt; pfade-gegenprobe.xlsx, Schlüsseldatei; pfade-hauptteil.xlsx, person, .xlsx; pfade-hauptteil.xlsx, person, .txt; pfade-hauptteil.xlsx, name, .xlsx; pfade-hauptteil.xlsx, name, .txt; pfade-hauptteil.xlsx, reversible, .xlsx; pfade-hauptteil.xlsx, reversible, .txt; pfade-hauptteil.xlsx, Schlüsseldatei; pfade-ueblich.xlsx, person, .xlsx; pfade-ueblich.xlsx, person, .txt; pfade-ueblich.xlsx, name, .xlsx; pfade-ueblich.xlsx, name, .txt; pfade-ueblich.xlsx, reversible, .xlsx; pfade-ueblich.xlsx, reversible, .txt; pfade-ueblich.xlsx, Schlüsseldatei; pfade-unueblich.xlsx, person, .xlsx; pfade-unueblich.xlsx, person, .txt; pfade-unueblich.xlsx, name, .xlsx; pfade-unueblich.xlsx, name, .txt; pfade-unueblich.xlsx, reversible, .xlsx; pfade-unueblich.xlsx, reversible, .txt; pfade-unueblich.xlsx, Schlüsseldatei

## 4. Sperren, Liste „Eigene Namen“, Bildschirmhöhe
- OK: Offener Punkt ohne Häkchen: nicht gespeichert – Schlusscheck: 2 Klarname(n) noch im Ergebnis. Speichern blockiert – bitte die Punkte oben ansehen und „Ich habe alle Punkte gesehen und speichere so.“ abhaken.
- OK: Mit Bildern ist das Häkchen erst nach dem Öffnen der Bilderliste wählbar
- OK: … nach dem Öffnen wählbar
- OK: Nach einer Änderung (Antwort) fällt das Häkchen zurück
- OK: … und es wird nicht gespeichert – Schlusscheck: 2 Klarname(n) noch im Ergebnis. Speichern blockiert – bitte die Punkte oben ansehen und „Ich habe alle Punkte gesehen und speichere so.“ abhaken.
- OK: Mit Häkchen wird gespeichert – Gespeichert: anonymisiert_dokument.docx – mit bestätigten Restfunden.
- OK: Stand der Liste auf dem Datei-Bildschirm stimmt – Eigene Namen: keine → Eigene Namen: 1 Einrichtung, 1 Person
- OK: Hinweis beim Hinzufügen: „Diese Liste gilt nur, bis du die Seite schließt oder neu lädst.“ mit Knopf zum Speichern – Diese Liste gilt nur, bis du die Seite schließt oder neu lädst. Dauerhaft in diesem Browser speichern
- OK: Nach dem Neuladen ohne Speichern: „Eigene Namen: keine“ – Eigene Namen: keine
- OK: 1366×768: Start (768 px), Datei (768 px) und Speichern mit 5 offenen Punkten (768 px) ohne Scrollen

## 5. Kreislauf (rückbaufähig, „Ja“ bei allen Fragen) und Doppellauf
- OK: bedienung.docx: Kreislauf exakt (alle Abschnitte wie im Original)
- OK: bedienung.docx: Doppellauf byte-gleich
- OK: bedienung.xlsx: Kreislauf exakt (alle Abschnitte wie im Original)
- OK: bedienung.xlsx: Doppellauf byte-gleich
- OK: bedienung.txt: Kreislauf exakt (alle Abschnitte wie im Original)
- OK: bedienung.txt: Doppellauf byte-gleich

## 6. Firefox und Anfragen nach außen
- Firefox: nicht startbar (browserType.launch: Executable doesn't exist at /opt/pw-browsers/firefox-1543/firefox/firefox). Die neuen Tests sind in Firefox ungeprüft.
- OK: 0 Anfragen nach außen

Prüfungen: 36 von 37 bestanden – FEHLER: Ohne Bedienung byte-gleich zur Vorversion (Kennung fest), außer den Dokumenten mit Grund aus Version 2.6.0 und den nachgewiesenen Änderungen durch gefundene Einrichtungen (2.8.0) und durch die Spalten-Behandlung (2.10.0).
