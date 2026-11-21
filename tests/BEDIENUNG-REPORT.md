# Kompakte Bedienung und Fragen je Stelle (Version 2.5.0): Tests

Testdokumente: tests/make-bedienung.mjs -> tests/fixtures-bedienung/ (alles erfunden). Vorher = Version 2.4.1, nachher = diese Version. Chromium, 1366×768, Modus „Person A“. In der TXT-Datei steht „Wittekindhorn“ in der Liste „Eigene Namen“ (TXT hat keine Dateiangaben).

## 1. Easys Befunde je Fall
### bedienung.docx

| | vorher (2.4.1) | nachher |
|---|---|---|
| Fragen | 6 | 5 (2 zum Wort, 2 je Stelle, 1 Dateiangaben) |
| Zeilen auf dem Speichern-Bildschirm (ohne Antwort) | 6 | 4 |
| Häkchen auf dem Speichern-Bildschirm (ohne Antwort) | 3 | 1 |
| Höhe des Speichern-Bildschirms bei 1366×768 | 1984 px | 768 px |

- Zeilen nachher: „5 Fragen sind noch offen. Ohne Antwort bleibt jede Stelle so, wie sie im Moment ist. Beantworten“ · „2 Bilder im Dokument. Das Tool ändert Bilder nicht. Steht auf einem Bild ein Name oder ein Logo, entferne es v“ · „„Wittekindhorn“ steht noch in: Text Name aus den Dateiangaben · „…Wittekindhorn bringt Kuchen mit.…“ Als Namen“ · „„WITTEKINDHORNS“ steht noch in: Text Name aus den Dateiangaben · „…WITTEKINDHORNS Neffe hilft beim Aufbau.…“ A“
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
- OK: bedienung.docx: GROSS-Form „WITTEKINDHORNS“ des übernommenen Namens wird je Stelle gefragt; Fragekarte zeigt „Bleibt im Moment stehen.“ – Frage 3 von 6WITTEKINDHORNS Neffe hilft beim Aufbau.Ist hier die Person Wittekindhorn gemeint?Bleibt im Moment stehen.Ja, ersetzenNeinTasten: J = Ja, N = Nein

### bedienung.xlsx

| | vorher (2.4.1) | nachher |
|---|---|---|
| Fragen | 6 | 5 (2 zum Wort, 2 je Stelle, 1 Dateiangaben) |
| Zeilen auf dem Speichern-Bildschirm (ohne Antwort) | 7 | 4 |
| Häkchen auf dem Speichern-Bildschirm (ohne Antwort) | 4 | 1 |
| Höhe des Speichern-Bildschirms bei 1366×768 | 2107 px | 768 px |

- Zeilen nachher: „5 Fragen sind noch offen. Ohne Antwort bleibt jede Stelle so, wie sie im Moment ist. Beantworten“ · „2 Bilder im Dokument. Das Tool ändert Bilder nicht. Steht auf einem Bild ein Name oder ein Logo, entferne es v“ · „„Wittekindhorn“ steht noch in: Blatt Protokoll, Zelle A8 Name aus den Dateiangaben · „…Wittekindhorn bringt Ku“ · „„WITTEKINDHORNS“ steht noch in: Blatt Protokoll, Zelle A9 Name aus den Dateiangaben · „…WITTEKINDHORNS Neffe h“
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
- OK: bedienung.xlsx: GROSS-Form „WITTEKINDHORNS“ des übernommenen Namens wird je Stelle gefragt; Fragekarte zeigt „Bleibt im Moment stehen.“ – Frage 3 von 6WITTEKINDHORNS Neffe hilft beim Aufbau.Ist hier die Person Wittekindhorn gemeint?Bleibt im Moment stehen.Ja, ersetzenNeinTasten: J = Ja, N = Nein

### bedienung.txt

| | vorher (2.4.1) | nachher |
|---|---|---|
| Fragen | 5 | 5 (2 zum Wort, 3 je Stelle, 0 Dateiangaben) |
| Zeilen auf dem Speichern-Bildschirm (ohne Antwort) | 4 | 1 |
| Häkchen auf dem Speichern-Bildschirm (ohne Antwort) | 2 | 1 |
| Höhe des Speichern-Bildschirms bei 1366×768 | 1476 px | 768 px |

- Zeilen nachher: „5 Fragen sind noch offen. Ohne Antwort bleibt jede Stelle so, wie sie im Moment ist. Beantworten“
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
- OK: bedienung.txt: GROSS-Form „WITTEKINDHORNS“ des übernommenen Namens wird je Stelle gefragt; Fragekarte zeigt „Bleibt im Moment stehen.“ – Frage 3 von 5WITTEKINDHORNS Neffe hilft beim Aufbau.Ist hier die Person Wittekindhorn gemeint?Bleibt im Moment stehen.Ja, ersetzenNeinTasten: J = Ja, N = Nein

## 2. Beweis D.5: jede stehen gebliebene Stelle eines bestätigten Namens genau einmal

Für jedes Testdokument (tests/fixtures, tests/fixtures-pfade, tests/fixtures-bedienung, dazu die GROSS-Testdokumente mit von Hand übernommenen Nachnamen) in drei Zuständen: ohne Antwort, „Ja“ bei allen Fragen, „Nein“ bei allen Fragen je Stelle. Gezählt wird jede ausgeschaltete Stelle einer Person, die mindestens eine eingeschaltete Stelle hat.

- Stellen insgesamt: 274; davon offene Frage 123, mit „Nein“ entschieden 135, Schlusscheck-Fund 16; Abweichungen 0
- OK: D.5: jede stehen gebliebene Stelle genau einmal (offene Frage ODER „Nein“ ODER Schlusscheck) – 0 Abweichung(en)

## 3. Ohne Bedienung byte-gleich zu Version 2.4.1 (alle Testdokumente, alle Modi, alle Formate, Schlüsseldatei)
- 760 Ausgaben (inkl. Schlüsseldateien) verglichen, 0 unterschiedlich
- OK: Ohne Bedienung sind alle Ausgaben und Schlüsseldateien byte-gleich zu 2.4.1 (Kennung fest)

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
- OK: 1366×768: Start (768 px), Datei (768 px) und Speichern mit 4 offenen Punkten (768 px) ohne Scrollen

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

Prüfungen: 37 von 37 bestanden.
