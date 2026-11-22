# Ziel-Test „Träger“ (Version 2.8.0, PR B „Einrichtungen selbst finden“; enthält PR A)

Testdatei „anmeldung“ (tests/make-traeger.mjs), alle Namen erfunden. Word: Verknüpfung als Feldfunktion HYPERLINK (Ziel mit Pfad) und als Verknüpfung mit Link-Hinweis; Excel: Verknüpfung mit Link-Hinweis in B5. PDF über LibreOffice aus der Word-Fassung.

## 1. Soll / gemessen je Format und Modus (ohne jede Antwort)

Soll: 0 Webadresse (auch Link-Ziel, Feldfunktion, Link-Hinweis), 0 Kontoname, 0 Vorkommen von „Tannhofen“, „Brandner“, „lern und spiel“, beide Schreibweisen der Schule mit demselben Buchstaben, alle 10 Wörter „bleiben stehen“. Offen (kommt mit PR C): GYMTH. In Klammern: Vorversion.

| Format | Modus | Ausgabe | Webadresse | Konto | Tannhofen, Brandner, lern und spiel | gleicher Buchstabe | bleiben stehen | Einrichtungs-Fragen | offen: GYMTH (kommt mit PR C) |
|---|---|---|---|---|---|---|---|---|---|
| txt | person | .txt | 0 (0) | 0 (0) | 0 (8) | ja (Einrichtung A) | 10/10 | 2 (0) | 1 (1) |
- OK: txt/person/.txt: 0 Webadresse, 0 Konto, 0 Schule/Träger, ein Buchstabe, alles Stehende da, 2 Einrichtungs-Fragen
| txt | name | .txt | 0 (0) | 0 (0) | 0 (8) | ja ([EINRICHTUNG]) | 10/10 | 2 (0) | 1 (1) |
- OK: txt/name/.txt: 0 Webadresse, 0 Konto, 0 Schule/Träger, ein Buchstabe, alles Stehende da, 2 Einrichtungs-Fragen
| txt | reversible | .txt | 0 (0) | 0 (0) | 0 (8) | ja (Einrichtung A) | 10/10 | 2 (0) | 1 (1) |
- OK: txt/reversible/.txt: 0 Webadresse, 0 Konto, 0 Schule/Träger, ein Buchstabe, alles Stehende da, 2 Einrichtungs-Fragen
| csv | person | .csv | 0 (0) | 0 (0) | 0 (8) | ja (Einrichtung A) | 10/10 | 2 (0) | 1 (1) |
- OK: csv/person/.csv: 0 Webadresse, 0 Konto, 0 Schule/Träger, ein Buchstabe, alles Stehende da, 2 Einrichtungs-Fragen
| csv | name | .csv | 0 (0) | 0 (0) | 0 (8) | ja ([EINRICHTUNG]) | 10/10 | 2 (0) | 1 (1) |
- OK: csv/name/.csv: 0 Webadresse, 0 Konto, 0 Schule/Träger, ein Buchstabe, alles Stehende da, 2 Einrichtungs-Fragen
| csv | reversible | .csv | 0 (0) | 0 (0) | 0 (8) | ja (Einrichtung A) | 10/10 | 2 (0) | 1 (1) |
- OK: csv/reversible/.csv: 0 Webadresse, 0 Konto, 0 Schule/Träger, ein Buchstabe, alles Stehende da, 2 Einrichtungs-Fragen
| docx | person | .docx | 0 (0) | 0 (0) | 0 (8) | ja (Einrichtung A) | 10/10 | 2 (0) | 1 (1) |
- OK: docx/person/.docx: 0 Webadresse, 0 Konto, 0 Schule/Träger, ein Buchstabe, alles Stehende da, 2 Einrichtungs-Fragen
| docx | name | .docx | 0 (0) | 0 (0) | 0 (8) | ja ([EINRICHTUNG]) | 10/10 | 2 (0) | 1 (1) |
- OK: docx/name/.docx: 0 Webadresse, 0 Konto, 0 Schule/Träger, ein Buchstabe, alles Stehende da, 2 Einrichtungs-Fragen
| docx | reversible | .docx | 0 (0) | 0 (0) | 0 (8) | ja (Einrichtung A) | 10/10 | 2 (0) | 1 (1) |
- OK: docx/reversible/.docx: 0 Webadresse, 0 Konto, 0 Schule/Träger, ein Buchstabe, alles Stehende da, 2 Einrichtungs-Fragen
| xlsx | person | .xlsx | 0 (0) | 0 (0) | 0 (8) | ja (Einrichtung A) | 10/10 | 2 (0) | 1 (1) |
- OK: xlsx/person/.xlsx: 0 Webadresse, 0 Konto, 0 Schule/Träger, ein Buchstabe, alles Stehende da, 2 Einrichtungs-Fragen
| xlsx | name | .xlsx | 0 (0) | 0 (0) | 0 (8) | ja ([EINRICHTUNG]) | 10/10 | 2 (0) | 1 (1) |
- OK: xlsx/name/.xlsx: 0 Webadresse, 0 Konto, 0 Schule/Träger, ein Buchstabe, alles Stehende da, 2 Einrichtungs-Fragen
| xlsx | reversible | .xlsx | 0 (0) | 0 (0) | 0 (8) | ja (Einrichtung A) | 10/10 | 2 (0) | 1 (1) |
- OK: xlsx/reversible/.xlsx: 0 Webadresse, 0 Konto, 0 Schule/Träger, ein Buchstabe, alles Stehende da, 2 Einrichtungs-Fragen
| pdf | person | .txt | 0 (0) | 0 (0) | 0 (8) | ja (Einrichtung A) | 10/10 | 2 (0) | 1 (1) |
- OK: pdf/person/.txt: 0 Webadresse, 0 Konto, 0 Schule/Träger, ein Buchstabe, alles Stehende da, 2 Einrichtungs-Fragen
| pdf | person | .docx | 0 (0) | 0 (0) | 0 (8) | ja (Einrichtung A) | 10/10 | 2 (0) | 1 (1) |
- OK: pdf/person/.docx: 0 Webadresse, 0 Konto, 0 Schule/Träger, ein Buchstabe, alles Stehende da, 2 Einrichtungs-Fragen
| pdf | name | .txt | 0 (0) | 0 (0) | 0 (8) | ja ([EINRICHTUNG]) | 10/10 | 2 (0) | 1 (1) |
- OK: pdf/name/.txt: 0 Webadresse, 0 Konto, 0 Schule/Träger, ein Buchstabe, alles Stehende da, 2 Einrichtungs-Fragen
| pdf | name | .docx | 0 (0) | 0 (0) | 0 (8) | ja ([EINRICHTUNG]) | 10/10 | 2 (0) | 1 (1) |
- OK: pdf/name/.docx: 0 Webadresse, 0 Konto, 0 Schule/Träger, ein Buchstabe, alles Stehende da, 2 Einrichtungs-Fragen
| pdf | reversible | .txt | 0 (0) | 0 (0) | 0 (8) | ja (Einrichtung A) | 10/10 | 2 (0) | 1 (1) |
- OK: pdf/reversible/.txt: 0 Webadresse, 0 Konto, 0 Schule/Träger, ein Buchstabe, alles Stehende da, 2 Einrichtungs-Fragen
| pdf | reversible | .docx | 0 (0) | 0 (0) | 0 (8) | ja (Einrichtung A) | 10/10 | 2 (0) | 1 (1) |
- OK: pdf/reversible/.docx: 0 Webadresse, 0 Konto, 0 Schule/Träger, ein Buchstabe, alles Stehende da, 2 Einrichtungs-Fragen

Erwarteter offener Punkt nach PR B (NICHT bestanden, kommt mit PR C): GYMTH, Vorkommen in der Ausgabe je Format: txt/txt 1, csv/csv 1, docx/docx 1, xlsx/xlsx 1, pdf/txt 1, pdf/docx 1. Sonst bleibt nichts offen.

## 2. Sperre beim Speichern

anmeldung.txt, Schalter „Webadressen und Konten“ aus, 5 Fragen mit „Nein“ beantwortet, danach 0 Stellen ersetzt. Punkte:
  - In dieser Datei wird nichts ersetzt. Bitte prüfe Schulname, Firma, Webadresse und Konto und markiere sie von Hand. Prüfen
  - 5 Webadressen oder Konten stehen noch im Text. Der Schalter „Webadressen und Konten“ ist aus. „www.lern-und-spiel-tannhofen.de“ – Zeile 5 Im Text zeigen „https://www.lern-und-spiel-tannhofen.de“ – Zeile 5 Im Text zeigen „www.lern-und-spiel-tannhofen.de“ – Zeile 10 Im Text zeigen „https://www.lern-und-spiel-tannhofen.de“ – Zeile 10 Im Text zeigen „brandner_lern_und_spiel“ – Zeile 11 Im Text zeigen Ersetzen
- OK: Punkt 2 erscheint (Webadresse oder Konto steht noch im Text)
- OK: Punkt 1 erscheint genau dann, wenn gar nichts ersetzt wird (0 ersetzt)
- OK: Speichern ohne Häkchen gesperrt – Speichern blockiert – bitte zuerst die Punkte oben ansehen und „Ich habe alle Punkte gesehen und speichere so.“ abhaken.
- OK: Speichern nach dem einen Häkchen möglich – Gespeichert: anonymisiert_text.txt – Schlusscheck ohne Fund.
- OK: Schalter aus: Webadresse bleibt in der Ausgabe (so gewollt)
nurweb.txt (nur Webadresse und Konto), Schalter aus. Punkte:
  - In dieser Datei wird nichts ersetzt. Bitte prüfe Schulname, Firma, Webadresse und Konto und markiere sie von Hand. Prüfen
  - 2 Webadressen oder Konten stehen noch im Text. Der Schalter „Webadressen und Konten“ ist aus. „www.beispiel-kinderhaus.de/termine“ – Zeile 1 Im Text zeigen „@sonnenhof_kids“ – Zeile 2 Im Text zeigen Ersetzen
- OK: Gar nichts ersetzt: Punkt 1 und Punkt 2 erscheinen
- OK: Punkt 2 nennt jede Stelle mit Fundort und „Im Text zeigen“ – „www.beispiel-kinderhaus.de/termine“ – Zeile 1 Im Text zeigen | „@sonnenhof_kids“ – Zeile 2 Im Text zeigen
- OK: „Im Text zeigen“ führt zum Prüfen-Schritt
- OK: „Ersetzen“ schaltet den Schalter ein: Punkt 1 und Punkt 2 verschwinden – keine Punkte

Fragen: Ist „Gymnasium Tannhofen“ eine Einrichtung? | Ist „Brandner lern und spiel“ eine Einrichtung?
- OK: Einrichtungs-Fragen lauten „Ist „…“ eine Einrichtung?“ – Ist „Gymnasium Tannhofen“ eine Einrichtung? | Ist „Brandner lern und spiel“ eine Einrichtung?
- OK: Schule „Ja“, Träger „Nein“: Träger steht im Text (3×), Schule vollständig ersetzt – Brandner 3, Tannhofen 0
- OK: … und kein Punkt zum Träger – 3 Fragen sind noch offen. Ohne Antwort bleibt jede Stelle so, wie sie im Moment ist. Beantworten
  - Eine Einrichtung steht noch im Text: „Gymnasium Tannhofen“ „Gymnasium Tannhofen“ – Zeile 1 Im Text zeigen „Gymnasium Kirchberg Tannhofen“ – Zeile 8 Im Text zeigen Ersetzen
  - Eine Einrichtung steht noch im Text: „Brandner lern und spiel“ „Brandner lern und spiel“ – Zeile 1 Im Text zeigen „Brandner lern und spiel“ – Zeile 5 Im Text zeigen „Brandner lern und spiel“ – Zeile 10 Im Text zeigen Ersetzen
- OK: „Unsichere Treffer ersetzen“ aus: Punkt 3 für beide Einrichtungen (mit Fundort, „Im Text zeigen“, „Ersetzen“)
- OK: … Speichern ohne Häkchen gesperrt – Speichern blockiert – bitte zuerst die Punkte oben ansehen und „Ich habe alle Punkte gesehen und speichere so.“ abhaken.
- OK: … Speichern nach dem einen Häkchen möglich – Gespeichert: anonymisiert_text.txt – Schlusscheck ohne Fund.
- OK: „Ersetzen“ beim Punkt 3: dieser Punkt verschwindet – 5 Fragen sind noch offen. Ohne Antwort bleibt jede Stelle so, wie sie im Moment ist. Beantworten | Eine Einrichtung steht noch im Text: „Brandner lern und spiel“ „Brandner lern und spiel“ – Zeile 1 Im Text zeigen „Brandner lern und spiel“ – Zeile 5 Im Text zeigen „Brandner lern und spiel“ – Zeile 10 Im Text zeigen Ersetzen

## 3. Warnpunkt „Hier könnte eine Einrichtung stehen“ (seit 2.8.0 nur schwache Funde: Anführungszeichen ohne Merkmal)

schwach.txt: Hier könnte eine Einrichtung stehen. Bitte prüfen und bei Bedarf als Einrichtung markieren. „Blaue Stunde“ – Zeile 1 Im Text zeigen „Stille Ecke“ – Zeile 2 Im Text zeigen „Bunte Kiste“ – Zeile 3 Im Text zeigen
- OK: Schwache Funde: nicht ersetzt, nicht gefragt
- OK: Warnpunkt-Text ohne „Das Tool ersetzt Einrichtungen noch nicht selbst“
- OK: Warnpunkt nennt die drei Stellen
- OK: Warnpunkt ohne Frage, ohne Ersetzen-Knopf (nur „Im Text zeigen“)
- OK: Warnpunkt ändert die Ausgabe nicht (vor und nach dem Speichern-Schritt gleich)
- OK: Nach „als Einrichtung markiert“ fällt die Stelle weg, die übrigen bleiben – Hier könnte eine Einrichtung stehen. Bitte prüfen und bei Bedarf als Einrichtung markieren. „Stille Ecke“ – Zeile 2 Im Text zeigen „Bunte Kiste“ – Zeile 3 Im Text zeigen
- OK: Warnpunkt läuft über das eine Häkchen (ohne Häkchen gesperrt) – Speichern blockiert – bitte zuerst die Punkte oben ansehen und „Ich habe alle Punkte gesehen und speichere so.“ abhaken.
- OK: Höchstens zehn Stellen, dann „und 2 weitere“ – 11 Zeilen: „Blaue Stunde“ – Zeile 1 Im Text zeigen | „Stille Ecke“ – Zeile 2 Im Text zeigen | „Bunte Kiste“ – Zeile 3 Im Text zeigen | „Ruhige Insel“ – Zeile 4 Im Text zeigen | „Große Runde“ – Zeile 5 Im Text zeigen | „Leise Wolke“ – Zeile 6 Im Text zeigen | „Warme Decke“ – Zeile 7 Im Text zeigen | „Sanfte Musik“ – Zeile 8 Im Text zeigen | „Frische Luft“ – Zeile 9 Im Text zeigen | „Gute Laune“ – Zeile 10 Im Text zeigen | und 2 weitere
Gegenprobe sachtext.txt: 0 Webadressen, 0 Konten, 0 Einrichtungs-Stellen ersetzt, 0 Einrichtungs-Fragen, 9 Fragen insgesamt (Vorversion 9), 0 Stellen im Warnpunkt (Vorversion 11).
- OK: sachtext: 0 Webadressen, 0 Konten, 0 Einrichtungen ersetzt, 0 Einrichtungs-Fragen
- OK: sachtext: 0 neue Fragen gegenüber der Vorversion (dieselben Fragen) – 9 → 9

## 3b. Testdatei „einrichtungen-auto“ (je Fall eine Zeile; Word mit Kopfzeile, Fußnote, Kommentar; Excel auf zwei Blättern)

Soll: alle Einrichtungen ersetzt (0 Vorkommen von „Sonnenblume“, „Regenbogen“, „Wendorf“, „Sankt Georg“, „Lindenau“, „Erika“, „Brandner“, „Sonnenschein“, „Kleine Strolche“, „Marlene“, „Bunte Welt“, „Grüne Insel“), Einrichtungs-Fragen = 12 (verschiedene Einrichtungen).

| Format | Modus | Ausgabe | Namen noch im Text | Einrichtungs-Fragen | Einrichtungen |
|---|---|---|---|---|---|
| txt | person | .txt | 0 (Vorversion 10) | 12 (0) | Einrichtung A: Kita Sonnenblume; Einrichtung B: Kinderhaus Regenbogen; Einrichtung C: Gymnasium Wendorf / Wendorf-Gymnasium / Gymnasiums Wendorf / GYMNASIUM WENDORF; Einrichtung D: Mittelschule Sankt Georg Wendorf; Einrichtung E: Grundschule an der Lindenau; Einrichtung F: Erika-Brandner-Schule; Einrichtung G: Sonnenschein Küchen GmbH; Einrichtung H: Förderverein Wendorf e. V.; Einrichtung I: Kleine Strolche; Einrichtung J: Haus Marlene; Einrichtung K: Bunte Welt Wendorf; Einrichtung L: Grüne Insel |
- OK: einrichtungen-auto.txt/person: alle ersetzt, 12 Einrichtungs-Fragen –  / 12
| txt | name | .txt | 0 (Vorversion 10) | 12 (0) |  |
- OK: einrichtungen-auto.txt/name: alle ersetzt, 12 Einrichtungs-Fragen –  / 12
| txt | reversible | .txt | 0 (Vorversion 10) | 12 (0) |  |
- OK: einrichtungen-auto.txt/reversible: alle ersetzt, 12 Einrichtungs-Fragen –  / 12
| docx | person | .docx | 0 (Vorversion 10) | 12 (0) | Einrichtung A: Kita Sonnenblume; Einrichtung B: Kinderhaus Regenbogen; Einrichtung C: Gymnasium Wendorf / Wendorf-Gymnasium / Gymnasiums Wendorf / GYMNASIUM WENDORF; Einrichtung D: Mittelschule Sankt Georg Wendorf; Einrichtung E: Grundschule an der Lindenau; Einrichtung F: Erika-Brandner-Schule; Einrichtung G: Sonnenschein Küchen GmbH; Einrichtung H: Förderverein Wendorf e. V.; Einrichtung I: Kleine Strolche; Einrichtung J: Haus Marlene; Einrichtung K: Bunte Welt Wendorf; Einrichtung L: Grüne Insel |
- OK: einrichtungen-auto.docx/person: alle ersetzt, 12 Einrichtungs-Fragen –  / 12
| docx | name | .docx | 0 (Vorversion 10) | 12 (0) |  |
- OK: einrichtungen-auto.docx/name: alle ersetzt, 12 Einrichtungs-Fragen –  / 12
| docx | reversible | .docx | 0 (Vorversion 10) | 12 (0) |  |
- OK: einrichtungen-auto.docx/reversible: alle ersetzt, 12 Einrichtungs-Fragen –  / 12
| xlsx | person | .xlsx | 0 (Vorversion 10) | 12 (0) | Einrichtung A: Kita Sonnenblume; Einrichtung B: Kinderhaus Regenbogen; Einrichtung C: Gymnasium Wendorf / Wendorf-Gymnasium / Gymnasiums Wendorf / GYMNASIUM WENDORF; Einrichtung D: Mittelschule Sankt Georg Wendorf; Einrichtung E: Grundschule an der Lindenau; Einrichtung F: Erika-Brandner-Schule; Einrichtung G: Sonnenschein Küchen GmbH; Einrichtung H: Förderverein Wendorf e. V.; Einrichtung I: Kleine Strolche; Einrichtung J: Haus Marlene; Einrichtung K: Bunte Welt Wendorf; Einrichtung L: Grüne Insel |
- OK: einrichtungen-auto.xlsx/person: alle ersetzt, 12 Einrichtungs-Fragen –  / 12
| xlsx | name | .xlsx | 0 (Vorversion 10) | 12 (0) |  |
- OK: einrichtungen-auto.xlsx/name: alle ersetzt, 12 Einrichtungs-Fragen –  / 12
| xlsx | reversible | .xlsx | 0 (Vorversion 10) | 12 (0) |  |
- OK: einrichtungen-auto.xlsx/reversible: alle ersetzt, 12 Einrichtungs-Fragen –  / 12

## 4. Rückbau (Modus rückbaufähig)

txt: Schlüssel mit 10 Platzhaltern, davon Webadresse/Konto: [WEBADRESSE-1] = www.lern-und-spiel-tannhofen.de (2); [WEBADRESSE-2] = https://www.lern-und-spiel-tannhofen.de (2); [KONTO-1] = brandner_lern_und_spiel (1)
- OK: txt: Ausgabe ohne Webadresse und Konto (auch Link-Ziel, Feldfunktion, Link-Hinweis)
- OK: txt: Rückbau exakt (Texte, Link-Ziele, Feldfunktionen, Link-Hinweise) – passend
- OK: txt: lockere Formen erkannt und gemeldet ([Webadresse 1], [Webadresse 2], Konto-1) – [Webadresse 1] → [WEBADRESSE-1]; [Webadresse 2] → [WEBADRESSE-2]; Konto-1 → [KONTO-1]
- OK: txt: lockere Formen nicht geraten (bleiben im Ergebnis stehen, alles andere zurück)
- OK: txt: nach Korrektur wie vorgeschlagen Rückbau exakt – passend
csv: Schlüssel mit 10 Platzhaltern, davon Webadresse/Konto: [WEBADRESSE-1] = www.lern-und-spiel-tannhofen.de (2); [WEBADRESSE-2] = https://www.lern-und-spiel-tannhofen.de (2); [KONTO-1] = brandner_lern_und_spiel (1)
- OK: csv: Ausgabe ohne Webadresse und Konto (auch Link-Ziel, Feldfunktion, Link-Hinweis)
- OK: csv: Rückbau exakt (Texte, Link-Ziele, Feldfunktionen, Link-Hinweise) – passend
- OK: csv: lockere Formen erkannt und gemeldet ([Webadresse 1], [Webadresse 2], Konto-1) – [Webadresse 1] → [WEBADRESSE-1]; [Webadresse 2] → [WEBADRESSE-2]; Konto-1 → [KONTO-1]
- OK: csv: lockere Formen nicht geraten (bleiben im Ergebnis stehen, alles andere zurück)
- OK: csv: nach Korrektur wie vorgeschlagen Rückbau exakt – passend
docx: Schlüssel mit 11 Platzhaltern, davon Webadresse/Konto: [WEBADRESSE-1] = www.lern-und-spiel-tannhofen.de (2); [KONTO-1] = brandner_lern_und_spiel (1); [WEBADRESSE-2] = https://www.lern-und-spiel-tannhofen.de (0); [WEBADRESSE-3] = https://www.lern-und-spiel-tannhofen.de/anmeldung (0)
- OK: docx: Ausgabe ohne Webadresse und Konto (auch Link-Ziel, Feldfunktion, Link-Hinweis)
- OK: docx: Rückbau exakt (Texte, Link-Ziele, Feldfunktionen, Link-Hinweise) – passend
- OK: docx: lockere Formen erkannt und gemeldet ([Webadresse 1], Konto-1) – [Webadresse 1] → [WEBADRESSE-1]; Konto-1 → [KONTO-1]
- OK: docx: lockere Formen nicht geraten (bleiben im Ergebnis stehen, alles andere zurück)
- OK: docx: nach Korrektur wie vorgeschlagen Rückbau exakt – passend
xlsx: Schlüssel mit 10 Platzhaltern, davon Webadresse/Konto: [WEBADRESSE-1] = www.lern-und-spiel-tannhofen.de (3); [WEBADRESSE-2] = https://www.lern-und-spiel-tannhofen.de (2); [KONTO-1] = brandner_lern_und_spiel (1)
- OK: xlsx: Ausgabe ohne Webadresse und Konto (auch Link-Ziel, Feldfunktion, Link-Hinweis)
- OK: xlsx: Rückbau exakt (Texte, Link-Ziele, Feldfunktionen, Link-Hinweise) – passend
- OK: xlsx: lockere Formen erkannt und gemeldet ([Webadresse 1], [Webadresse 2], Konto-1) – [Webadresse 1] → [WEBADRESSE-1]; [Webadresse 2] → [WEBADRESSE-2]; Konto-1 → [KONTO-1]
- OK: xlsx: lockere Formen nicht geraten (bleiben im Ergebnis stehen, alles andere zurück)
- OK: xlsx: nach Korrektur wie vorgeschlagen Rückbau exakt – passend
einrichtungen-auto.txt: Schlüssel mit 16 Platzhaltern, 12 Einrichtungen; Gymnasium Wendorf: Einrichtung C = Gymnasium Wendorf; Einrichtung C2 = Wendorf-Gymnasium; Einrichtung C3 = Gymnasiums Wendorf; Einrichtung C4 = GYMNASIUM WENDORF
- OK: einrichtungen-auto.txt: Schreibweisen einer gefundenen Einrichtung mit eigenen Nummern (mindestens 3)
- OK: einrichtungen-auto.txt: Rückbau exakt – passend
einrichtungen-auto.docx: Schlüssel mit 16 Platzhaltern, 12 Einrichtungen; Gymnasium Wendorf: Einrichtung C = Gymnasium Wendorf; Einrichtung C2 = Wendorf-Gymnasium; Einrichtung C3 = Gymnasiums Wendorf; Einrichtung C4 = GYMNASIUM WENDORF
- OK: einrichtungen-auto.docx: Schreibweisen einer gefundenen Einrichtung mit eigenen Nummern (mindestens 3)
- OK: einrichtungen-auto.docx: Rückbau exakt – passend
einrichtungen-auto.xlsx: Schlüssel mit 16 Platzhaltern, 12 Einrichtungen; Gymnasium Wendorf: Einrichtung C = Gymnasium Wendorf; Einrichtung C2 = Wendorf-Gymnasium; Einrichtung C3 = Gymnasiums Wendorf; Einrichtung C4 = GYMNASIUM WENDORF
- OK: einrichtungen-auto.xlsx: Schreibweisen einer gefundenen Einrichtung mit eigenen Nummern (mindestens 3)
- OK: einrichtungen-auto.xlsx: Rückbau exakt – passend
Kollision: Vorlage: [WEBADRESSE-1] und [KONTO] bleiben so stehen. ⏎ Seite: [WEBADRESSE-2], Instagram: [KONTO-1]
- OK: Kollision: Original-„[WEBADRESSE-1]“ bleibt, die echte Webadresse bekommt [WEBADRESSE-2]
- OK: Kollision: Rückbau exakt – passend
- OK: Schlüsseldatei aus 2.6.1 (docx): Rückbau exakt – passend
- OK: Schlüsseldatei aus 2.6.1 (txt): Rückbau exakt – passend
- OK: Schlüsseldatei aus 2.7.0 (docx): Rückbau exakt – passend
- OK: Schlüsseldatei aus 2.7.0 (txt): Rückbau exakt – passend

- OK: 0 Anfragen ins Netz
- OK: 0 Fehler in der Seite

**Ergebnis: 87/87 bestanden.** Nur Chromium, Firefox prüft Easy.

Weitere Messungen (Fehltreffer im ganzen Korpus, Aufzählungsstellen, Laufzeit, Prüfsumme, Link-Ziele vorher): tests/TRAEGER-MESSUNGEN.md
