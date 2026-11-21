# Messungen Version 2.7.0, PR A „Webadressen, Konten und Sperre“

Ergänzt tests/TRAEGER-REPORT.md (Ziel-Test, Sperre, Warnpunkt, Rückbau). Nur Chromium, Firefox prüft Easy.

## Link-Ziele: Verhalten vor 2.7.0 (Version 2.6.1)
- Webadressen waren keine Art. Im sichtbaren Text, im Link-Ziel (externe Beziehung in `.rels`), in der Feldfunktion HYPERLINK und im Link-Hinweis (tooltip) blieben sie unverändert stehen (Ziel-Test, Spalte „2.6.1“: 2 bis 9 Vorkommen je Ausgabe).
- Link-Ziele liefen schon durch den allgemeinen Ersetzer (Namen, E-Mail usw.), Feldfunktionen (instrText) ebenso. Der Word-Link-Hinweis (`w:tooltip`) lief **nicht** durch; Excel-`tooltip` schon.
- Neu: `w:tooltip` läuft durch (src/formats/docx.js:208). Webadressen in Link-Zielen, Link-Hinweisen und Feldfunktionen werden ersetzt; rückbaufähig mit eigener Nummer (Anzahl 0 im Schlüssel), Rückbau exakt (TRAEGER-REPORT Teil 4). LibreOffice öffnet die Ausgabe mit `Target="[WEBADRESSE-2]"`, `HYPERLINK "[WEBADRESSE-3]"` (geprüft per Umwandlung nach PDF).

## Fehltreffer im ganzen vorhandenen Korpus und allen Testdateien
124 Testdateien (tests/fixtures*, ohne fixtures-traeger-alt; gescannt.pdf ohne Text) und 15 Abschnitte aus tests/korpus/korpus-quelle.mjs.

### Neue Webadressen und Konten
| Fundort | Treffer | richtig/falsch |
|---|---|---|
| fixtures-traeger/anmeldung.txt, .csv | 4 Webadressen (www… und https://…), 1 Konto brandner_lern_und_spiel | 5 richtig |
| fixtures-traeger/anmeldung.docx | 2 Webadressen im Text, 1 Konto; Link-Ziele https://…de und https://…de/anmeldung | 5 richtig |
| fixtures-traeger/anmeldung.xlsx | 5 Webadressen (A5, B5, A10), 1 Konto; Link-Ziel https://…de | 7 richtig |
| fixtures-traeger/anmeldung.pdf | „www.lern-⏎und-spiel-tannhofen.de“ (Umbruch), www…de, 1 Konto | 3 richtig |
| fixtures-traeger/nurweb.txt | www.beispiel-kinderhaus.de/termine, @sonnenhof_kids | 2 richtig |
| alle übrigen 119 Dateien, Korpus, sachtext | keine | – |

Summe: 22 richtig, **0 falsch**. E-Mail-Adressen in den Testdateien (z. B. anna.mueller@beispiel-firma.de) bleiben E-Mail, kein Teil wird Webadresse.

### Neue Fragen
Keine. Fragen je Testdatei vorher (2.6.1) = nachher (2.7.0) in allen 124 Dateien (zusammen 286). Webadressen, Konten und Warnpunkt stellen keine Frage.

### Warnpunkt „Hier könnte eine Einrichtung stehen“ (Stellen je Datei)
| Fundort | Stellen | richtig | falsch |
|---|---|---|---|
| fixtures/einrichtung.txt, .csv | Familienzentrum Sonnenblume, Familienzentrums Sonnenblume, Astrid-Lindgren-Schule (je 3) | 6 | 0 |
| fixtures/einrichtung.docx, .xlsx | dieselben, einige in mehreren Teilen der Datei (je 5) | 10 | 0 |
| fixtures/kurse.docx | Familienzentrum Sonnenblume, Familienzentrum Sonnenblume Musterstadt | 2 | 0 |
| fixtures/gegenprobe-platzhalter.txt | „Nachname C“, „Vorname D“ (Platzhalter-Wörter in Anführungszeichen) | 0 | 2 |
| fixtures-traeger/anmeldung (txt, csv, docx, xlsx, pdf, je 5) | Gymnasium Tannhofen, „Brandner lern und spiel“ (2×), Gymnasium Kirchberg Tannhofen richtig; Ganztagsschule Schuljahr falsch | 20 | 5 |
| fixtures-traeger/sachtext.txt | „Gesunde Pause“ (Projektname) | 0 | 1 |
| Korpus elternbrief | Kita Sonnenblume | 1 | 0 |
| Korpus einladung | „Wenn Kinder streiten“ (Vortragstitel) | 0 | 1 |
| Korpus rundmail | „Deutsch im Alltag“, „Essen aus aller Welt“ (Kurstitel) | 0 | 2 |
| Korpus schule | „Natur vor unserer Tür“ (Projekttitel) | 0 | 1 |
| Korpus nachbarschaft | Verein Nachbarschaftshilfe richtig; „Gemeinsam statt einsam“ (Motto) falsch | 1 | 1 |
| Korpus kooperation | Lindenhof Beratung GmbH, Kita Freie Spatzen, Kita Sonnenblume richtig; „Erste Hilfe am Kind“ (Kurstitel) falsch | 3 | 1 |
| alle übrigen Dateien und Abschnitte | keine | – | – |

Summe: **43 richtig, 14 falsch** (falsch: 8 Titel in Anführungszeichen, 5× „Ganztagsschule Schuljahr“, 1 Projektname). Wie entschieden hingenommen (keine Sachwort-Liste in PR A). Nicht gefunden: „Familienzentrum am Lindenhof“ (Korpus, „am“ dazwischen; in PR A nicht verlangt) und das Kürzel GYMTH.

Gegenprobe sachtext.txt: 0 Webadressen, 0 Konten, 1 Stelle im Warnpunkt.

### Der Warnpunkt ändert keine Ausgabe
- Er steht nur im Speichern-Schritt (src/ui/app.js `orgHintPlaces`, `savePoints`); Analyse und Ausgabe rufen ihn nicht auf.
- Regression gegen main (2.6.1, f5b29a3d…): 110 von 126 Ausgaben byte-gleich, 16 gleich bis auf die Kennung, **0 geändert, 0 unterschiedlich**, obwohl der Warnpunkt in 6 dieser Dateien Stellen nennt (einrichtung.*, kurse.docx).
- Ziel-Test: Ausgabe vor und nach dem Speichern-Schritt gleich.

## Alle Stellen, die die Kontakt-Arten aufzählen (grep E-MAIL, TELEFON, IBAN, ADRESSE, CONTACT in src/ und tests/)
| Zweck | Datei:Zeile | Stand |
|---|---|---|
| Erkennung | src/core/patterns.js:20–40, 75–105 | neu: Webadresse, Konto |
| Platzhalter ohne Nummer | src/core/detect.js:15 (CONTACT_LABELS) | [WEBADRESSE], [KONTO] |
| Schalter Standard | src/core/detect.js:19 | web: true |
| Link-Texte an die Analyse | src/core/detect.js:714, src/ui/app.js:204, 212, src/formats/links.js | neu |
| Ersetzer außerhalb der Prüfansicht | src/core/detect.js:1094, 1129 | über CONTACT_LABELS / Nummern, unverändert |
| Platzhalter mit Nummer | src/core/reversible.js:8, 9 (CONTACT_BASE, CONTACT_NAMES) | WEBADRESSE, KONTO |
| Platzhalter-Erkennung | src/core/reversible.js:15 (CONTACT_PH_RE) | erweitert |
| Kollisions-Schutz | src/core/reversible.js:24 (LIKE_BRACKET_RE) | erweitert |
| Nummern nur im Link-Ziel | src/core/reversible.js:183–193 | neu |
| Schlüsseldatei | src/core/reversible.js:219 | Einträge mit Anzahl 0 für Link-Ziele; Format unverändert |
| Rückbau streng | src/core/restore.js:11, 14, 15 | neue Arten nur bei Schlüsseln mit ihnen (hasWeb, Zeile 45) |
| Rückbau locker | src/core/restore.js:20, 21, 95–106 | „[Webadresse 1]“, „Konto-1“ |
| Reste nach dem Rückbau | src/core/restore.js:196 (findLeftovers über contactRe) | erweitert |
| Hinweis für die KI | src/ui/app.js:38–40 | neue Platzhalter |
| Schalter Einstellungen | src/ui/app.js:1725, src/ui/template.html:108 | „Webadressen und Konten“ |
| Zusammenfassung „Kontaktdaten“ | src/ui/app.js:1398 | zählt Webadressen und Konten mit |
| Sperre Punkt 1 / 2, Warnpunkt | src/ui/app.js:1254–1270, 1284–1345 | neu |
| Link-Hinweis Word | src/formats/docx.js:208 | tooltip neu |
| Link-Hinweis Excel, Schlusscheck-Attribute | src/formats/xlsx.js:426, src/formats/xmlutil.js:112 | schon vorhanden |
| Schlusscheck | src/ui/app.js (finalCheck) | unverändert: sucht nur Namen/Einrichtungen, wie bisher keine Kontaktdaten |
| Tests | tests/make-kollision.mjs:24, 28; tests/make-platzhalter.mjs:61; tests/platzhalter-test.mjs:187; tests/fixtures-src.mjs:53 | unverändert gültig (nur E-Mail-Beispiele) |

## Laufzeit große Datei (10 MB Text, protokoll.txt wiederholt, je 2 Läufe, Chromium headless)
| | 2.6.1 | 2.7.0 |
|---|---|---|
| Laden + Analyse | 9,5 s / 9,4 s | 8,8 s / 9,2 s |
| Speichern-Punkte (inkl. Warnpunkt) | 0,07 s / 0,05 s | 0,20 s / 0,26 s |
| Ausgabe | 0,98 s / 0,98 s | 1,00 s / 0,95 s |

Ohne Vorfilter brauchte 2.7.0 zuerst 10,7 s und 2,1 s; die Vorfilter (src/core/patterns.js, src/core/hints.js) prüfen nur, ob das Kennzeichen eines Musters im Text steht, und ändern kein Ergebnis.

## Prüfsumme
Zweimal gebaut, gleiche Datei: SHA-256 `4f87a11db7b315a7e964ce721972e99704897aa43560b2b0ca01870aaf682060`, 3 837 068 Bytes.
