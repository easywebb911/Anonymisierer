# Ziel-Test Version 2.7.0, PR A „Webadressen, Konten und Sperre“

Testdatei „anmeldung“ (tests/make-traeger.mjs), alle Namen erfunden. Word: Verknüpfung als Feldfunktion HYPERLINK (Ziel mit Pfad) und als Verknüpfung mit Link-Hinweis; Excel: Verknüpfung mit Link-Hinweis in B5. PDF über LibreOffice aus der Word-Fassung.

## 1. Soll / gemessen je Format und Modus (ohne jede Antwort)

Soll: 0 Webadresse (auch Link-Ziel, Feldfunktion, Link-Hinweis), 0 Kontoname, alle 10 Wörter „bleiben stehen“, Warnpunkt nennt die drei Stellen. Offen (kommt mit PR B/C): Vorkommen von „Tannhofen“, „Brandner“, „lern und spiel“, „GYMTH“.

| Format | Modus | Ausgabe | Webadresse 2.7.0 | Konto 2.7.0 | bleiben stehen | Warnpunkt nennt die drei | offen, kommt mit PR B/C |
|---|---|---|---|---|---|---|---|
| txt | person | .txt | 0 | 0 | 10/10 | ja | 9 (Tannhofen 2, Brandner 3, lern und spiel 3, GYMTH 1) |
- OK: txt/person/.txt: 0 Webadresse, 0 Konto, alles Stehende da, Warnpunkt vollständig
| txt | name | .txt | 0 | 0 | 10/10 | ja | 9 (Tannhofen 2, Brandner 3, lern und spiel 3, GYMTH 1) |
- OK: txt/name/.txt: 0 Webadresse, 0 Konto, alles Stehende da, Warnpunkt vollständig
| txt | reversible | .txt | 0 | 0 | 10/10 | ja | 9 (Tannhofen 2, Brandner 3, lern und spiel 3, GYMTH 1) |
- OK: txt/reversible/.txt: 0 Webadresse, 0 Konto, alles Stehende da, Warnpunkt vollständig
| csv | person | .csv | 0 | 0 | 10/10 | ja | 9 (Tannhofen 2, Brandner 3, lern und spiel 3, GYMTH 1) |
- OK: csv/person/.csv: 0 Webadresse, 0 Konto, alles Stehende da, Warnpunkt vollständig
| csv | name | .csv | 0 | 0 | 10/10 | ja | 9 (Tannhofen 2, Brandner 3, lern und spiel 3, GYMTH 1) |
- OK: csv/name/.csv: 0 Webadresse, 0 Konto, alles Stehende da, Warnpunkt vollständig
| csv | reversible | .csv | 0 | 0 | 10/10 | ja | 9 (Tannhofen 2, Brandner 3, lern und spiel 3, GYMTH 1) |
- OK: csv/reversible/.csv: 0 Webadresse, 0 Konto, alles Stehende da, Warnpunkt vollständig
| docx | person | .docx | 0 | 0 | 10/10 | ja | 9 (Tannhofen 2, Brandner 3, lern und spiel 3, GYMTH 1) |
- OK: docx/person/.docx: 0 Webadresse, 0 Konto, alles Stehende da, Warnpunkt vollständig
| docx | name | .docx | 0 | 0 | 10/10 | ja | 9 (Tannhofen 2, Brandner 3, lern und spiel 3, GYMTH 1) |
- OK: docx/name/.docx: 0 Webadresse, 0 Konto, alles Stehende da, Warnpunkt vollständig
| docx | reversible | .docx | 0 | 0 | 10/10 | ja | 9 (Tannhofen 2, Brandner 3, lern und spiel 3, GYMTH 1) |
- OK: docx/reversible/.docx: 0 Webadresse, 0 Konto, alles Stehende da, Warnpunkt vollständig
| xlsx | person | .xlsx | 0 | 0 | 10/10 | ja | 9 (Tannhofen 2, Brandner 3, lern und spiel 3, GYMTH 1) |
- OK: xlsx/person/.xlsx: 0 Webadresse, 0 Konto, alles Stehende da, Warnpunkt vollständig
| xlsx | name | .xlsx | 0 | 0 | 10/10 | ja | 9 (Tannhofen 2, Brandner 3, lern und spiel 3, GYMTH 1) |
- OK: xlsx/name/.xlsx: 0 Webadresse, 0 Konto, alles Stehende da, Warnpunkt vollständig
| xlsx | reversible | .xlsx | 0 | 0 | 10/10 | ja | 9 (Tannhofen 2, Brandner 3, lern und spiel 3, GYMTH 1) |
- OK: xlsx/reversible/.xlsx: 0 Webadresse, 0 Konto, alles Stehende da, Warnpunkt vollständig
| pdf | person | .txt | 0 | 0 | 10/10 | ja | 9 (Tannhofen 2, Brandner 3, lern und spiel 3, GYMTH 1) |
- OK: pdf/person/.txt: 0 Webadresse, 0 Konto, alles Stehende da, Warnpunkt vollständig
| pdf | person | .docx | 0 | 0 | 10/10 | ja | 9 (Tannhofen 2, Brandner 3, lern und spiel 3, GYMTH 1) |
- OK: pdf/person/.docx: 0 Webadresse, 0 Konto, alles Stehende da, Warnpunkt vollständig
| pdf | name | .txt | 0 | 0 | 10/10 | ja | 9 (Tannhofen 2, Brandner 3, lern und spiel 3, GYMTH 1) |
- OK: pdf/name/.txt: 0 Webadresse, 0 Konto, alles Stehende da, Warnpunkt vollständig
| pdf | name | .docx | 0 | 0 | 10/10 | ja | 9 (Tannhofen 2, Brandner 3, lern und spiel 3, GYMTH 1) |
- OK: pdf/name/.docx: 0 Webadresse, 0 Konto, alles Stehende da, Warnpunkt vollständig
| pdf | reversible | .txt | 0 | 0 | 10/10 | ja | 9 (Tannhofen 2, Brandner 3, lern und spiel 3, GYMTH 1) |
- OK: pdf/reversible/.txt: 0 Webadresse, 0 Konto, alles Stehende da, Warnpunkt vollständig
| pdf | reversible | .docx | 0 | 0 | 10/10 | ja | 9 (Tannhofen 2, Brandner 3, lern und spiel 3, GYMTH 1) |
- OK: pdf/reversible/.docx: 0 Webadresse, 0 Konto, alles Stehende da, Warnpunkt vollständig

Erwartete offene Punkte nach PR A (NICHT bestanden, kommt mit PR B/C), Zahl der Vorkommen in der Ausgabe je Format: txt/txt 9, csv/csv 9, docx/docx 9, xlsx/xlsx 9, pdf/txt 9, pdf/docx 9.

## 2. Sperre beim Speichern

anmeldung.txt, Schalter „Webadressen und Konten“ aus, 3 Fragen mit „Nein“ beantwortet, danach 0 Stellen ersetzt. Punkte:
  - In dieser Datei wird nichts ersetzt. Bitte prüfe Schulname, Firma, Webadresse und Konto und markiere sie von Hand. Prüfen
  - 5 Webadressen oder Konten stehen noch im Text. Der Schalter „Webadressen und Konten“ ist aus. „www.lern-und-spiel-tannhofen.de“ – Zeile 5 Im Text zeigen „https://www.lern-und-spiel-tannhofen.de“ – Zeile 5 Im Text zeigen „www.lern-und-spiel-tannhofen.de“ – Zeile 10 Im Text zeigen „https://www.lern-und-spiel-tannhofen.de“ – Zeile 10 Im Text zeigen „brandner_lern_und_spiel“ – Zeile 11 Im Text zeigen Ersetzen
  - Hier könnte eine Einrichtung stehen. Das Tool ersetzt Einrichtungen noch nicht selbst. Bitte prüfen und bei Bedarf als Einrichtung markieren. „Gymnasium Tannhofen“ – Zeile 1 Im Text zeigen „Brandner lern und spiel“ – Zeile 1 Im Text zeigen „Ganztagsschule Schuljahr“ – Zeile 2 Im Text zeigen „Gymnasium Kirchberg Tannhofen“ – Zeile 8 Im Text zeigen „Brandner lern und spiel“ – Zeile 10 Im Text zeigen
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

## 3. Warnpunkt „Hier könnte eine Einrichtung stehen“

anmeldung.txt: Hier könnte eine Einrichtung stehen. Das Tool ersetzt Einrichtungen noch nicht selbst. Bitte prüfen und bei Bedarf als Einrichtung markieren. „Gymnasium Tannhofen“ – Zeile 1 Im Text zeigen „Brandner lern und spiel“ – Zeile 1 Im Text zeigen „Ganztagsschule Schuljahr“ – Zeile 2 Im Text zeigen „Gymnasium Kirchberg Tannhofen“ – Zeile 8 Im Text zeigen „Brandner lern und spiel“ – Zeile 10 Im Text zeigen
- OK: Warnpunkt erscheint mit dem Text aus dem Auftrag
- OK: Warnpunkt nennt „Gymnasium Tannhofen“, „Gymnasium Kirchberg Tannhofen“, „Brandner lern und spiel“
- OK: Warnpunkt ohne Frage, ohne Ersetzen-Knopf (nur „Im Text zeigen“)
- OK: Warnpunkt ändert die Ausgabe nicht (vor und nach dem Speichern-Schritt gleich)
- OK: Nach „als Einrichtung markiert“ fällt „Gymnasium Tannhofen“ weg, die übrigen bleiben – Hier könnte eine Einrichtung stehen. Das Tool ersetzt Einrichtungen noch nicht selbst. Bitte prüfen und bei Bedarf als Einrichtung markieren. „Brandner lern und spiel“ – Zeile 1 Im Text zeigen „Ganztagsschule Schuljahr“ – Zeile 2 Im Text zeigen „Gymnasium Kirchberg Tannhofen“ – Zeile 8 Im Text zeigen „Brandner lern und spiel“ – Zeile 10 Im Text zeigen
- OK: Warnpunkt läuft über das eine Häkchen (ohne Häkchen gesperrt) – Speichern blockiert – bitte zuerst die Punkte oben ansehen und „Ich habe alle Punkte gesehen und speichere so.“ abhaken.
- OK: Höchstens zehn Stellen, dann „und 2 weitere“ – 11 Zeilen: „Grundschule Am“ – Zeile 1 Im Text zeigen | „Grundschule Bei“ – Zeile 2 Im Text zeigen | „Grundschule Nord“ – Zeile 3 Im Text zeigen | „Grundschule Süd“ – Zeile 4 Im Text zeigen | „Grundschule Ost“ – Zeile 5 Im Text zeigen | „Grundschule Weiher“ – Zeile 6 Im Text zeigen | „Grundschule Mitte“ – Zeile 7 Im Text zeigen | „Grundschule Lindenau“ – Zeile 8 Im Text zeigen | „Grundschule Rosenhof“ – Zeile 9 Im Text zeigen | „Grundschule Eichwald“ – Zeile 10 Im Text zeigen | und 2 weitere
Gegenprobe sachtext.txt: 0 Webadressen, 0 Konten, 1 Stellen im Warnpunkt: „Gesunde Pause“ – Zeile 10 Im Text zeigen.
- OK: sachtext: 0 Webadressen, 0 Konten

## 4. Rückbau (Modus rückbaufähig)

txt: Schlüssel mit 7 Platzhaltern, davon Webadresse/Konto: [WEBADRESSE-1] = www.lern-und-spiel-tannhofen.de (2); [WEBADRESSE-2] = https://www.lern-und-spiel-tannhofen.de (2); [KONTO-1] = brandner_lern_und_spiel (1)
- OK: txt: Ausgabe ohne Webadresse und Konto (auch Link-Ziel, Feldfunktion, Link-Hinweis)
- OK: txt: Rückbau exakt (Texte, Link-Ziele, Feldfunktionen, Link-Hinweise) – passend
- OK: txt: lockere Formen erkannt und gemeldet ([Webadresse 1], [Webadresse 2], Konto-1) – [Webadresse 1] → [WEBADRESSE-1]; [Webadresse 2] → [WEBADRESSE-2]; Konto-1 → [KONTO-1]
- OK: txt: lockere Formen nicht geraten (bleiben im Ergebnis stehen, alles andere zurück)
- OK: txt: nach Korrektur wie vorgeschlagen Rückbau exakt – passend
csv: Schlüssel mit 7 Platzhaltern, davon Webadresse/Konto: [WEBADRESSE-1] = www.lern-und-spiel-tannhofen.de (2); [WEBADRESSE-2] = https://www.lern-und-spiel-tannhofen.de (2); [KONTO-1] = brandner_lern_und_spiel (1)
- OK: csv: Ausgabe ohne Webadresse und Konto (auch Link-Ziel, Feldfunktion, Link-Hinweis)
- OK: csv: Rückbau exakt (Texte, Link-Ziele, Feldfunktionen, Link-Hinweise) – passend
- OK: csv: lockere Formen erkannt und gemeldet ([Webadresse 1], [Webadresse 2], Konto-1) – [Webadresse 1] → [WEBADRESSE-1]; [Webadresse 2] → [WEBADRESSE-2]; Konto-1 → [KONTO-1]
- OK: csv: lockere Formen nicht geraten (bleiben im Ergebnis stehen, alles andere zurück)
- OK: csv: nach Korrektur wie vorgeschlagen Rückbau exakt – passend
docx: Schlüssel mit 8 Platzhaltern, davon Webadresse/Konto: [WEBADRESSE-1] = www.lern-und-spiel-tannhofen.de (2); [KONTO-1] = brandner_lern_und_spiel (1); [WEBADRESSE-2] = https://www.lern-und-spiel-tannhofen.de (0); [WEBADRESSE-3] = https://www.lern-und-spiel-tannhofen.de/anmeldung (0)
- OK: docx: Ausgabe ohne Webadresse und Konto (auch Link-Ziel, Feldfunktion, Link-Hinweis)
- OK: docx: Rückbau exakt (Texte, Link-Ziele, Feldfunktionen, Link-Hinweise) – passend
- OK: docx: lockere Formen erkannt und gemeldet ([Webadresse 1], Konto-1) – [Webadresse 1] → [WEBADRESSE-1]; Konto-1 → [KONTO-1]
- OK: docx: lockere Formen nicht geraten (bleiben im Ergebnis stehen, alles andere zurück)
- OK: docx: nach Korrektur wie vorgeschlagen Rückbau exakt – passend
xlsx: Schlüssel mit 7 Platzhaltern, davon Webadresse/Konto: [WEBADRESSE-1] = www.lern-und-spiel-tannhofen.de (3); [WEBADRESSE-2] = https://www.lern-und-spiel-tannhofen.de (2); [KONTO-1] = brandner_lern_und_spiel (1)
- OK: xlsx: Ausgabe ohne Webadresse und Konto (auch Link-Ziel, Feldfunktion, Link-Hinweis)
- OK: xlsx: Rückbau exakt (Texte, Link-Ziele, Feldfunktionen, Link-Hinweise) – passend
- OK: xlsx: lockere Formen erkannt und gemeldet ([Webadresse 1], [Webadresse 2], Konto-1) – [Webadresse 1] → [WEBADRESSE-1]; [Webadresse 2] → [WEBADRESSE-2]; Konto-1 → [KONTO-1]
- OK: xlsx: lockere Formen nicht geraten (bleiben im Ergebnis stehen, alles andere zurück)
- OK: xlsx: nach Korrektur wie vorgeschlagen Rückbau exakt – passend
- OK: Schlüsseldatei aus 2.6.1 (docx): Rückbau exakt – passend
- OK: Schlüsseldatei aus 2.6.1 (txt): Rückbau exakt – passend

- OK: 0 Anfragen ins Netz
- OK: 0 Fehler in der Seite

**Ergebnis: 59/59 bestanden.** Nur Chromium, Firefox prüft Easy.
