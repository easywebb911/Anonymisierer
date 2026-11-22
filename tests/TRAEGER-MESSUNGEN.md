# Messungen Version 2.8.1 „Einrichtungen: Leck und Lücken schließen“ (Stand nach Entscheidung Easy C)

Anlass: Funde 1 bis 4 und 7 des Guardian-Probelaufs auf 2.8.0 (PR #20); danach Guardian-Pflichtlauf 1 mit Mini-Stopp (Teil 4 brach „Frau von Horten“) und Entscheidung Easy C. Alle Namen erfunden. Nur Chromium, Firefox prüft Easy.

## Ziel-Test nachbarn.* (tests/nachbarn-test.mjs → tests/NACHBARN-REPORT.md): Soll / gemessen
Offene Stellen der Soll-Wörter (Soll = 0). a) ohne Antwort: jede Person und Einrichtung; b) nach „Nein“ auf alle Einrichtungs-Fragen: jede Person; c) „Unsichere“ aus: alles, was 2.7.0 so ersetzt; c2) „Unsichere“ aus, dann alle „Nein“.

| Format | Modus | a | b | c | c2 | 2.8.0: a / b / c |
|---|---|---|---|---|---|---|
| txt | person / name / rückbaufähig | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 11 / 0 / 3 (je Modus) |
| csv | person / name / rückbaufähig | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 11 / 0 / 3 (je Modus) |
| xlsx | person / name / rückbaufähig | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 11 / 0 / 3 (je Modus) |

Bedienwege (Oberfläche): Teil 1 (Einstellung, Schalter „Koch“), Teil 2 (Liste aus → von Hand markiert, drei Einrichtungen), Liste aus → „Als Name markieren“ (Jana Wolters; Melanie Grawert, selbst erkannt, mit „Unsichere“ an und aus), Fund 4 (Person aus: Einrichtung bleibt „Kita Sonnenblume“, an und aus), echte Namen mit Zusatz ganz („von Brandner“, „van der Lindenau“, „von Horten“, „Anja von Horten“, „von Schulenburg“). Rückbau exakt txt/csv/xlsx, auch Ausgabe + Schlüssel aus 2.8.0. **60/60.**
Gegenproben: gegen den Stand vor Entscheidung C (acb41605…) 13/57 NICHT bestanden (Horten, Fund 2, Fund 4); gegen 2.8.0 26/57 NICHT bestanden.
Nicht im Soll: „Koch“ in „Bitte wenden Sie sich an Koch.“ (mehrdeutig, in allen Versionen gleich gefragt). In Tabellen steht die Anrede links neben dem Namen (Regel a2 gilt dort nur für die linke Nachbarzelle, seit 2.6.0).

## Warum fand der Maßstab-Test (PR #19) Fund 1 nicht?
Der Ablauf „Unsichere aus“ verglich richtig mit 2.7.0. Aber keine Testdatei enthielt einen Namen, der „unsicher, an“ ist (Regel a2) oder von Hand/per Schalter eingeschaltet wurde, IN einer gefundenen Einrichtung; den Weg über den Schalter gab es als Ablauf nicht. Jetzt: nachbarn.* und die Abläufe „Unsichere aus, dann alle Nein“ und „Liste aus, dann von Hand markiert“.

## Maßstab (tests/massstab-test.mjs → tests/MASSSTAB-REPORT.md)
- Gegen 2.7.0: 133 Dateien (Testdateien und 15 Korpus-Abschnitte), 1899 Stellen, je sechs Abläufe. **0 fehlende Stellen.**
- Zweiter Maßstab gegen 2.8.0 (ohne Antwort): 2032 Stellen. **0 fehlende Stellen.**
- Ausnahmen: 195, alle in nachbarn.txt/.csv/.xlsx, alle Teil 4: offen ist nur „vom / von der“ (Einrichtung an) bzw. „vom“ + Kopfwort in der Grundform (Einrichtung abgelehnt oder aus). In den vorhandenen Testdateien: 0. Die Ausnahme erlaubt seit Entscheidung C nur Kopfwörter in der Grundform (ein offenes „Horten“ wäre eine fehlende Stelle).
- Gegenprobe (2.8.0 als neue Version, Stand vor C): 14 Abweichungen, NICHT bestanden.
- Der Ablauf „Liste aus“ klickt wie ein Mensch nochmals, wenn der Schalter danach noch an steht (bekannt seit 2.8.0, siehe PR-Text).

## Testläufe vorher (main 2.8.0) / nachher (2.8.1), bestanden/gesamt
anzeige 121 → 121 · bedienung 37 → 37 · bilder 58 → 58 · einrichtung 153 → 153 · endungen 21 → 21 · gross 44 → 44 · kennung 37 → 37 · kollision 17 → 17 · meta-proof 46 → 51 (+5 Teil 5) · pfade 40 → 40 · platzhalter 24 → 24 · roundtrip 36 → 36 · spalten 67 → 67 · traeger 98 → 98 · ui-flow 52 → 52 · wortliste 18 → 18 · korpus „alle Zahlen wie erwartet“ → gleich · run-tests grün → grün · massstab bestanden (130 Dateien, 1809 Stellen, 4 Abläufe) → bestanden (133 Dateien, 1899 Stellen, 6 Abläufe + 2032 Stellen gegen 2.8.0) · **neu: nachbarn 60/60**.
Angepasste Erwartungen: **keine**.

## Teil 5: Schlusscheck → „Als Einrichtung übernehmen“ (tests/meta-proof.mjs)
kurse-lernwerkstatt.docx (zur Laufzeit aus kurse.docx, „Lernwerkstatt Sonnenhof“ ohne Kopfwort): nicht selbst gefunden, Schlusscheck blockiert (3 Funde), Meldung mit beiden Wegen, Knopf übernimmt, danach 0 Funde. Besteht auch auf 2.8.0 (der Weg ging dort, war nur nicht mehr geprüft).

## Regression gegen main (2.8.0, c3ce5b2b…)
tests/regression.mjs: 126 Ausgaben, 110 byte-identisch, 16 gleich bis auf die Kennung, **0 unbegründet**. Zusätzlich alle 119 Testdateien (Modus „Person A“, ohne Antwort) und 15 Korpus-Abschnitte verglichen: geändert nur nachbarn.txt/.csv/.xlsx (neu, Grund Teil 1–4). Keine vorhandene Testdatei ändert ihre Ausgabe.

## Fragen und Fehltreffer
- Fragen: in allen vorhandenen Testdateien und Korpus-Abschnitten unverändert. nachbarn.* je Datei: 2.8.0 10 (5 Einrichtung), 2.8.1 17 (13 Einrichtung).
- Fehltreffer: vorhandene Dateien wie 2.8.0 (**36 richtig, 2 falsch**). Neu in nachbarn.* je Datei 13 Einrichtungen, alle richtig → **75 richtig, 2 falsch**. Warnpunkt nachbarn je Datei: 2.8.0 12 Stellen, 2.8.1 1 („Nikita Brandner“, falsch: Vorname auf -kita, Einrichtungs-Suche unverändert).

## Kopfwort als Wortteil (Prüfung außerhalb von Teil 4, Entscheidung Easy C)
Namenslisten durchsucht: Vornamen anikita, kita, lukita, mikita, nikita, rakita; Nachnamen hort, kita, tschaschule, waskita passen auf ein Kopfwort-Muster der Einrichtungs-Suche. Folge (wie in 2.8.0): „Nikita Brandner“, „Rakita Weber“, „Tschaschule Meier“ … stehen als falscher Fund im Warnpunkt; der Name wird trotzdem ersetzt. „Die Horten Kessler sind da.“ → „Die Einrichtung A sind da.“ (kein Klartext, falscher Platzhalter-Typ). „Vereinbarung“, „Praxisnah“, „Firmament“, „Schulenburg“ greifen nicht. Nicht geändert, nur gemeldet.

## Prüfsumme
Zweimal gebaut (Kopien außerhalb des Arbeitsbaums): beide a3f76a0dca3d9782a57d8449893ada21d2703905787b6e7b152ed16d8b6d0d49.

---

# Messungen Version 2.8.0, PR B „Einrichtungen selbst finden“ – Stand nach der Nachbesserung (gilt)

Nur Chromium, Firefox prüft Easy. Vorversion = main 2.7.0 (631a2bcd…). Bisheriger PR-Stand = d70bfc43….

## Nachbesserung: was sich geändert hat
- **Befund 1 (Leck):** Eine gefundene Einrichtung endet vor einer Anrede oder einem Titel (alle, die die Personen-Erkennung kennt: Herr, Herrn, Frau, Fräulein, Hr., Fr., Dr., Prof. …). Eine gefundene Einrichtung verdeckt nie eine Stelle, die die Personen-Erkennung ohne sie „sicher“ ersetzt (Ausnahme Bindestrich-Form „Erika-Brandner-Schule“); dafür rechnet das Tool einmal ohne gefundene Einrichtungen (nur wenn es Funde gibt). Eine so verdrängte Einrichtung steht im Warnpunkt. „Nein“, Schalter oder Klick auf eine gefundene Einrichtung gibt ihre Wörter frei: Das Tool rechnet neu, die Personen-Erkennung gilt dort wieder, mit ihren eigenen Fragen (auch Bindestrich-Form und Anführungszeichen). Antworten zu Fragen, die beim Wieder-Einschalten wegfallen, werden verworfen (wie bei Listen, 2.6.1).
- **Befund 2 (Fehltreffer):** Ausschluss-Liste erweitert (vollständige Liste in src/core/orgauto.js, EXCLUDE_AFTER und EXCLUDE_ENDINGS):
  - bisher: Wochentage, Monate, Schuljahr(es/e), Halbjahr(es), Jahrgang(s), Jahrgangsstufe, Klasse(n), Unterricht(s), Anmeldung(en), Leitung, Schulleitung, Eltern, Elternbeirat, Elternabend, Kinder(n), Schüler(in/innen/n), Lehrer(in/innen/n), Lehrkräfte, Lehrkraft, Mitglied(er/ern), Vorstand, Satzung, Öffnungszeiten, Betreuung, Gebühr(en), Beitrag, Beiträge, Träger, Gebäude, Hof, Ferien, Termin(e), Team, Sekretariat, Verwaltung, Kontakt, Telefon, Fax, Adresse, Anschrift, Website, Webseite, Homepage, Mittagessen, Essen, Mensa, Aula, Turnhalle, Sporthalle, Bibliothek, Kosten, Programm, Stundenplan, Speiseplan, Elternbrief, Info(s), Informationen, Hinweis(e), Formular, Antrag, Woche(n), Jahr, Tag(e), Uhr, Beginn, Ende, Neubau, Alltag;
  - **neu, Schulfächer:** Deutsch, Mathe, Mathematik, Englisch, Französisch, Latein, Spanisch, Italienisch, Sport, Musik, Kunst, Religion, Ethik, Biologie, Bio, Chemie, Physik, Geschichte, Erdkunde, Geografie, Geographie, Sachkunde, Sachunterricht, Informatik, Werken, Textil, Wirtschaft, Politik, Sozialkunde, Hauswirtschaft;
  - **neu, Raum-Wörter:** Raum, Räume, Zimmer, Saal, Halle, Küche, Garten, Pausenhof, Flur, Eingang (Aula, Turnhalle, Mensa schon bisher);
  - **neu, Funktions-Wörter:** Rektor, Rektorin, Konrektor, Konrektorin, Direktor, Direktorin, Vorsitzender, Vorsitzende, Vorsitz, Aufnahme, Gruppe, Gruppen, Hausmeister, Hausmeisterin, Personal, Elternvertreter, Elternvertreterin (Leitung, Sekretariat, Verwaltung, Team schon bisher);
  - **neu, Endungen:** Wörter auf -fest, -feste, -feier, -feiern, -tag, -tage, -woche, -wochen, -raum, -zimmer, -saal, -halle (z. B. Sommerfest, Weihnachtsfeier, Wandertag, Projektwoche, Klassenzimmer).
  - „Kita Sonnenblume“ und „Kinderhaus Regenbogen“ bleiben Funde.

## Maßstab (Punkt 4/7, tests/massstab-test.mjs → tests/MASSSTAB-REPORT.md)
130 Dateien (alle Testdateien und 15 Korpus-Abschnitte), **1809 Stellen**, die 2.7.0 ohne Antwort ersetzt. Vier Abläufe in 2.8.0: ohne Antwort, nach „Nein“ auf alle Einrichtungs-Fragen, nach „Ja“ → „Nein“, mit „Unsichere Treffer ersetzen“ aus (verglichen mit 2.7.0 mit derselben Einstellung). **0 Stellen fehlen.**
Gegenprobe gegen den bisherigen PR-Stand (d70bfc43…): schlägt fehl. Dort standen nach „Nein“ im Klartext: „Kessler“, „Holzbau Lehmann“, „Brandner“ (einrichtung-person.txt), 49 Nachnamen („Quarstedt“, „Wendstedt“ …) in verwechslung.txt/.docx, „Wendorf“, „Georg Wendorf“, „WENDORF“, „Haus“, „Marlene“, „Kita“ (einrichtungen-auto.*), „Kita“ (sc-freie-person.*, einrichtung-person.csv/.xlsx).

**Weitere Wege (Punkt 4), die ich gefunden habe:** Alle betreffen denselben Mechanismus wie Befund 1. Eine gefundene Einrichtung hatte Wörter belegt, die 2.7.0 als Person ersetzt (auch „unsicher, an“ und Personen-Treffer, die über den Namen im ganzen Dokument verbreitet werden, z. B. „Quarstedt“ aus „Herr Anton Quarstedt“ in „Verein Quarstedt“). Nach „Nein“, Schalter oder Klick blieben sie stehen. Behoben durch die Freigabe (s. o.); geprüft in allen vier Abläufen. Einen Weg mit unklarer Lösung habe ich nicht gefunden.

## Fehltreffer neu (vorher: 134 richtig, 2 falsch)
130 Dateien und Korpus-Abschnitte; Fragen insgesamt 2.7.0: 341, 2.8.0: 413 (bisheriger PR-Stand: 505); in 98 Dateien unverändert.

| Datei | Fragen 2.7.0 | Fragen 2.8.0 | neue Fragen | weggefallene Fragen |
|---|---|---|---|---|
| fixtures/einrichtung-absatz-text.docx | 0 | 1 | Einrichtung: musikschule am stadtpark | – |
| fixtures/einrichtung-absatz-text.txt | 0 | 1 | Einrichtung: musikschule am stadtpark | – |
| fixtures/einrichtung-umbruch-crlf.txt | 0 | 1 | Einrichtung: musikschule am stadtpark | – |
| fixtures/einrichtung-umbruch.txt | 0 | 1 | Einrichtung: musikschule am stadtpark | – |
| fixtures/einrichtung.csv | 0 | 2 | Einrichtung: familienzentrum sonnenblume, Einrichtung: astrid-lindgren-schule | – |
| fixtures/einrichtung.docx | 1 | 3 | Einrichtung: familienzentrum sonnenblume, Einrichtung: astrid-lindgren-schule | – |
| fixtures/einrichtung.txt | 0 | 2 | Einrichtung: familienzentrum sonnenblume, Einrichtung: astrid-lindgren-schule | – |
| fixtures/einrichtung.xlsx | 1 | 3 | Einrichtung: familienzentrum sonnenblume, Einrichtung: astrid-lindgren-schule | – |
| fixtures/kurse.docx | 11 | 12 | Einrichtung: familienzentrum sonnenblume | – |
| fixtures/sc-briefkopf-und-text.docx | 0 | 1 | Einrichtung: musikschule am stadtpark | – |
| fixtures/sc-briefkopf-und-text.txt | 0 | 1 | Einrichtung: musikschule am stadtpark | – |
| fixtures/sc-freie-person.docx | 1 | 1 | Einrichtung: kita freie | p:S|kita |
| fixtures/sc-freie-person.txt | 1 | 1 | Einrichtung: kita freie | p:S|kita |
| fixtures/sc-kopf-fuss-bild.docx | 0 | 1 | Einrichtung: musikschule am stadtpark | – |
| fixtures/sc-vollstaendig-ersetzt.docx | 0 | 1 | Einrichtung: musikschule am stadtpark | – |
| fixtures/sc-vollstaendig-ersetzt.txt | 0 | 1 | Einrichtung: musikschule am stadtpark | – |
| fixtures-traeger/anmeldung.csv | 3 | 5 | Einrichtung: gymnasium tannhofen, Einrichtung: brandner lern und spiel | – |
| fixtures-traeger/anmeldung.docx | 3 | 5 | Einrichtung: gymnasium tannhofen, Einrichtung: brandner lern und spiel | – |
| fixtures-traeger/anmeldung.pdf | 3 | 5 | Einrichtung: gymnasium tannhofen, Einrichtung: brandner lern und spiel | – |
| fixtures-traeger/anmeldung.txt | 3 | 5 | Einrichtung: gymnasium tannhofen, Einrichtung: brandner lern und spiel | – |
| fixtures-traeger/anmeldung.xlsx | 3 | 5 | Einrichtung: gymnasium tannhofen, Einrichtung: brandner lern und spiel | – |
| fixtures-traeger/einrichtung-person.csv | 1 | 2 | Einrichtung: kita sonnenblume, Einrichtung: gymnasium tannhofen | p:S|kita |
| fixtures-traeger/einrichtung-person.txt | 3 | 5 | Einrichtung: gymnasium tannhofen, Einrichtung: firma holzbau lehmann gmbh, Einrichtung: erika-brandner-schule | p:N|holzbau|lehmann |
| fixtures-traeger/einrichtung-person.xlsx | 1 | 2 | Einrichtung: kita sonnenblume, Einrichtung: gymnasium tannhofen | p:S|kita |
| fixtures-traeger/einrichtungen-auto.docx | 3 | 14 | Einrichtung: kita sonnenblume, Einrichtung: kinderhaus regenbogen, Einrichtung: gymnasium wendorf … (11) | – |
| fixtures-traeger/einrichtungen-auto.txt | 2 | 13 | Einrichtung: kita sonnenblume, Einrichtung: kinderhaus regenbogen, Einrichtung: gymnasium wendorf … (11) | – |
| fixtures-traeger/einrichtungen-auto.xlsx | 2 | 13 | Einrichtung: kita sonnenblume, Einrichtung: kinderhaus regenbogen, Einrichtung: gymnasium wendorf … (11) | – |
| korpus/kursbeschreibungen | 12 | 13 | Einrichtung: familienzentrum am lindenhof | – |
| korpus/elternbrief | 10 | 11 | Einrichtung: kita sonnenblume | – |
| korpus/schule | 12 | 13 | Einrichtung: grundschule am lindenweg | – |
| korpus/nachbarschaft | 7 | 8 | Einrichtung: verein nachbarschaftshilfe | – |
| korpus/kooperation | 2 | 5 | Einrichtung: lindenhof beratung gmbh, Einrichtung: kita freie spatzen, Einrichtung: kita sonnenblume, Einrichtung: sportverein tsv grunwiese | p:S|kita |

Bewertung je gefundener Einrichtung (vorhandene Dateien und Korpus, ohne die neuen Testdateien einrichtungen-auto und einrichtung-person):
- **richtig:** „Musikschule am Stadtpark“ (9 Dateien), „Familienzentrum Sonnenblume“ mit Schreibweisen und „Astrid-Lindgren-Schule“ (einrichtung.* je 2), „Familienzentrum Sonnenblume“ (kurse.docx), „Gymnasium Tannhofen“ und „Brandner lern und spiel“ (anmeldung.*, je 2), Korpus: „Familienzentrum am Lindenhof“, „Kita Sonnenblume“ (2×), „Grundschule am Lindenweg“, „Verein Nachbarschaftshilfe“, „Lindenhof Beratung GmbH“, „Kita Freie Spatzen“, „Sportverein TSV Grünwiese“.
- **falsch (Bruchstück):** „Kita Freie“ (sc-freie-person.txt/.docx), je 1 Frage, unverändert.
- Summe (je Datei gezählt): **richtig 36 in 19 Dateien und 5 Korpus-Abschnitten, falsch 2.** Weniger als vorher (134), weil die 49 „Verein …“ in verwechslung.txt/.docx jetzt keine Einrichtung mehr sind: Ihr Name ist zugleich eine sichere Person („Herr Anton Quarstedt“), die Person geht vor (Regel 2). Der Name wird als Person ersetzt; die Vereine stehen im Warnpunkt.

## Warnpunkt vorher/nachher
- 2.7.0: 93 Stellen auf denselben Dateien (früher gemessen 43 richtig / 14 falsch).
- Bisheriger PR-Stand: 5, alle falsch.
- **Jetzt: 5 falsch wie bisher** (gegenprobe-platzhalter: „Nachname C“, „Vorname D“; Korpus: „Essen aus aller Welt“, „Natur vor unserer Tür“, „Gemeinsam statt einsam“) **und 98 richtige verdrängte Einrichtungen** (verwechslung.txt/.docx je 49 „Verein …“, angezeigt zehn und „und 39 weitere“). Neu in den neuen Testdateien: „Brandner lern und spiel“ (einrichtung-person.txt, wegen der Person „Erika Brandner“), „Haus Marlene“ (einrichtungen-auto, wegen der Person „Marlene“).

## Widerspruch im Auftrag (gemeldet)
Merkmal 2 (Vor- oder Nachname im Namen in Anführungszeichen) und Regel 2 (Person geht vor) passen kaum zusammen: Ein Name mit Wort aus den Namenslisten ist für die Personen-Erkennung fast immer schon allein eine sichere Person („Haus Marlene“, „Haus Kessler“). Solche Namen werden deshalb als Person ersetzt und stehen im Warnpunkt, nicht als Einrichtung. Klartext entsteht nicht. Testdatei angepasst: „Haus Marlene“ ist jetzt der Warnpunkt-Fall, der Dreiwort-Fall heißt „Mittelschule Birkenhain Nord Ost“ (vorher „Sankt Georg Wendorf“: „Georg Wendorf“ ist eine Person, dadurch wurde „Wendorf“ überall Person).

## Testläufe nach der Nachbesserung (bestanden/gesamt; vorher = main 2.7.0)
anzeige 99 → 121 · bedienung 37 → 37 · bilder 58 → 58 · einrichtung 153 → 153 · endungen 21 → 21 · gross 44 → 44 · kennung 37 → 37 · kollision 17 → 17 · meta-proof 48 → 46 · pfade 40 → 40 · platzhalter 24 → 24 · roundtrip 36 → 36 · spalten 67 → 67 · traeger 61 → 98 · ui-flow 52 → 52 · wortliste 18 → 18 · korpus, run-tests, regression grün · **neu: massstab bestanden (130 Dateien, 1809 Stellen, 4 Abläufe)**.

Zusätzlich angepasste Erwartungen in der Nachbesserung: (6) tests/make-traeger.mjs: „einrichtungen-auto“ 11 statt 12 Einrichtungen, „Haus Marlene“ im Warnpunkt (Grund: Widerspruch oben); (7) tests/anzeige-test.mjs: Teil c sucht die Markierung nach einem Klick neu (ein Klick auf eine gefundene Einrichtung rechnet jetzt neu und zeichnet die Ansicht neu; geprüft bleibt, dass nichts rollt).

## Regression gegen main (2.7.0)
| | bisheriger PR-Stand | jetzt |
|---|---|---|
| byte-gleich | 89 | 89 |
| gleich bis auf die Kennung | 13 | 13 |
| durch 2.8.0 geändert, einzeln nachgewiesen | 24 | 24 |
| unbegründet | 0 | 0 |
bedienung-test (gegen 2.4.1): 115 Ausgaben durch gefundene Einrichtungen geändert, alle nachgewiesen (bisher 129; weniger, weil verwechslung.* keine Einrichtungen mehr hat), 0 unbegründet.

## Prüfsumme
Zweimal gebaut, gleiche Datei: SHA-256 `c3ce5b2b219992ef91b85cbbe5460b4bc85d200e17428bf11696661717f2290d`, 3 847 778 Bytes (bisheriger PR-Stand d70bfc43…).

## Laufzeit
| | 2.7.0 | 2.8.0 jetzt |
|---|---|---|
| 10 MB Text (protokoll.txt wiederholt), Laden + Analyse | 10,5 s / 9,5 s | 8,9 s / 9,4 s |
| … Speichern-Punkte / Ausgabe | 0,2 s / 1,0 s | 0,2 s / 1,0 s |
| 1 MB, jede Zeile eine Einrichtung, nur Analyse (Node) | 0,6 s (findet nichts) | 2,3 s (bisheriger PR-Stand 1,5 s; mit Funden rechnet das Tool einmal zusätzlich ohne gefundene Einrichtungen) |

---

# Messungen Version 2.8.0, PR B – erster Stand (vor der Nachbesserung, d70bfc43…; teils überholt, siehe oben)

Ergänzt tests/TRAEGER-REPORT.md (Ziel-Test, einrichtungen-auto, sachtext, Sperre, Warnpunkt, Rückbau). Nur Chromium, Firefox prüft Easy. Vorversion = main 2.7.0 (631a2bcd…).

## Listen im Code (src/core/orgauto.js)
- **Kopfwörter:** wie hints.js (Gymnasium, Schule und -schule, Universität, Kita, Kindergarten, Krippe, Hort, Kinderhaus, Familienzentrum, Jugendzentrum, Verein, Stiftung, Praxis, Klinik, Krankenhaus, Kanzlei, Firma, Institut, Akademie), **ergänzt** um Zusammensetzungen auf -gymnasium, -kita, -kindergarten, -krippe, -verein, -stiftung, -praxis, -klinik, -institut, -akademie (z. B. Förderverein, Sportverein, Musikakademie).
- **Ausschluss-Liste** (Wort direkt nach dem Kopfwort): Montag … Sonntag, Sonnabend, Januar … Dezember, Jänner, Schuljahr(es/e), Halbjahr(es), Jahrgang(s), Jahrgangsstufe, Klasse(n), Unterricht(s), Anmeldung(en), Leitung, Schulleitung, Eltern, Elternbeirat, Elternabend, Kinder(n), Schüler(in/innen/n), Lehrer(in/innen/n), Lehrkräfte, Lehrkraft, Mitglied(er/ern), Vorstand, Satzung, Öffnungszeiten, Betreuung, Gebühr(en), Beitrag, Beiträge, Träger, Gebäude, Hof, Ferien, Termin(e), Team, Sekretariat, Verwaltung, Kontakt, Telefon, Fax, Adresse, Anschrift, Website, Webseite, Homepage, Mittagessen, Essen, Mensa, Aula, Turnhalle, Sporthalle, Bibliothek, Kosten, Programm, Stundenplan, Speiseplan, Elternbrief, Info(s), Informationen, Hinweis(e), Formular, Antrag, Woche(n), Jahr, Tag(e), Uhr, Beginn, Ende, Neubau, Alltag.
- **Titel-Wörter** (Regel b): Vortrag, Kurs, Projekt, Thema, Motto, Buch, Titel, Lied, Film, Workshop, Seminar, Fach, AG, Stück, Artikel.
- **Rechtsformen:** GmbH, gGmbH, AG, KG, UG, GbR, eG, e. V., e.V., mbH (auch GROSS: GMBH, GBR …).
- **Zusätzliche Schutzregeln** (gefunden beim Messen): Anführungszeichen in Excel-Formeln zählen nicht („"Herr Kowalczyk"“ in einer Formel war sonst Merkmal 4); ein Name in Anführungszeichen, der mit einer Anrede oder einem Titel beginnt („Herr …“, „Dr. …“), ist eine Person. Merkmal 2 zählt keine Wörter der Liste „mehrdeutig“ und Umlaut-Wörter nur als Vorname („Blätter“ ≠ „Blatter“). Rechtsform „AG“ direkt VOR Anführungszeichen ist ein Titel-Wort (AG „Junge Forscher“), kein Merkmal 1.

## Fehltreffer: jede neu ersetzte Einrichtung und jede neue Frage
127 Testdateien (tests/fixtures*, ohne fixtures-traeger-alt*; gescannt.pdf ohne Text) und 15 Korpus-Abschnitte (als Text). Fragen insgesamt vorher 336, nachher 505; in 96 Dateien unverändert.

| Datei | Fragen 2.7.0 | Fragen 2.8.0 | neue Fragen | weggefallene Fragen |
|---|---|---|---|---|
| fixtures/einrichtung-absatz-text.docx | 0 | 1 | Einrichtung: musikschule am stadtpark | – |
| fixtures/einrichtung-absatz-text.txt | 0 | 1 | Einrichtung: musikschule am stadtpark | – |
| fixtures/einrichtung-umbruch-crlf.txt | 0 | 1 | Einrichtung: musikschule am stadtpark | – |
| fixtures/einrichtung-umbruch.txt | 0 | 1 | Einrichtung: musikschule am stadtpark | – |
| fixtures/einrichtung.csv | 0 | 2 | Einrichtung: familienzentrum sonnenblume, Einrichtung: astrid-lindgren-schule | – |
| fixtures/einrichtung.docx | 1 | 3 | Einrichtung: familienzentrum sonnenblume, Einrichtung: astrid-lindgren-schule | – |
| fixtures/einrichtung.txt | 0 | 2 | Einrichtung: familienzentrum sonnenblume, Einrichtung: astrid-lindgren-schule | – |
| fixtures/einrichtung.xlsx | 1 | 3 | Einrichtung: familienzentrum sonnenblume, Einrichtung: astrid-lindgren-schule | – |
| fixtures/kurse.docx | 11 | 12 | Einrichtung: familienzentrum sonnenblume | – |
| fixtures/sc-briefkopf-und-text.docx | 0 | 1 | Einrichtung: musikschule am stadtpark | – |
| fixtures/sc-briefkopf-und-text.txt | 0 | 1 | Einrichtung: musikschule am stadtpark | – |
| fixtures/sc-freie-person.docx | 1 | 1 | Einrichtung: kita freie | p:S|kita |
| fixtures/sc-freie-person.txt | 1 | 1 | Einrichtung: kita freie | p:S|kita |
| fixtures/sc-kopf-fuss-bild.docx | 0 | 1 | Einrichtung: musikschule am stadtpark | – |
| fixtures/sc-vollstaendig-ersetzt.docx | 0 | 1 | Einrichtung: musikschule am stadtpark | – |
| fixtures/sc-vollstaendig-ersetzt.txt | 0 | 1 | Einrichtung: musikschule am stadtpark | – |
| fixtures/verwechslung.docx | 0 | 49 | Einrichtung: 49 × „Verein …“ (Quarstedt, Wendstedt …) | – |
| fixtures/verwechslung.txt | 0 | 49 | Einrichtung: 49 × „Verein …“ (Quarstedt, Wendstedt …) | – |
| fixtures-traeger/anmeldung.csv | 3 | 5 | Einrichtung: gymnasium tannhofen, Einrichtung: brandner lern und spiel | – |
| fixtures-traeger/anmeldung.docx | 3 | 5 | Einrichtung: gymnasium tannhofen, Einrichtung: brandner lern und spiel | – |
| fixtures-traeger/anmeldung.pdf | 3 | 5 | Einrichtung: gymnasium tannhofen, Einrichtung: brandner lern und spiel | – |
| fixtures-traeger/anmeldung.txt | 3 | 5 | Einrichtung: gymnasium tannhofen, Einrichtung: brandner lern und spiel | – |
| fixtures-traeger/anmeldung.xlsx | 3 | 5 | Einrichtung: gymnasium tannhofen, Einrichtung: brandner lern und spiel | – |
| fixtures-traeger/einrichtungen-auto.docx | 3 | 15 | Einrichtung: die 12 Einrichtungen der Testdatei | – |
| fixtures-traeger/einrichtungen-auto.txt | 2 | 14 | Einrichtung: die 12 Einrichtungen der Testdatei | – |
| fixtures-traeger/einrichtungen-auto.xlsx | 2 | 14 | Einrichtung: die 12 Einrichtungen der Testdatei | – |
| korpus/kursbeschreibungen | 12 | 13 | Einrichtung: familienzentrum am lindenhof | – |
| korpus/elternbrief | 10 | 11 | Einrichtung: kita sonnenblume | – |
| korpus/schule | 12 | 13 | Einrichtung: grundschule am lindenweg | – |
| korpus/nachbarschaft | 7 | 8 | Einrichtung: verein nachbarschaftshilfe | – |
| korpus/kooperation | 2 | 5 | Einrichtung: lindenhof beratung gmbh, Einrichtung: kita freie spatzen, Einrichtung: kita sonnenblume, Einrichtung: sportverein tsv grunwiese | p:S|kita |

Bewertung je gefundener Einrichtung (vorhandene Dateien und Korpus, ohne die neue Testdatei einrichtungen-auto):
- **richtig:** „Musikschule am Stadtpark“ (9 Dateien, so in den Testdateien gemeint), „Familienzentrum Sonnenblume“ mit allen Schreibweisen (einrichtung.*, kurse.docx; dort auch „… Musterstadt“ als Schreibweise), „Astrid-Lindgren-Schule“ (einrichtung.*), 49 × „Verein …“ (verwechslung.*, die Datei enthält 50 Personen und 50 Vereine; „Lindenauer Bürgerverein“ steht ohne Kopfwort-Form davor und wird nicht gefunden), „Gymnasium Tannhofen“ (+ „Gymnasium Kirchberg Tannhofen“) und „Brandner lern und spiel“ (anmeldung.*), Korpus: „Familienzentrum am Lindenhof“, „Kita Sonnenblume“ (2×), „Grundschule am Lindenweg“, „Verein Nachbarschaftshilfe“, „Lindenhof Beratung GmbH“, „Kita Freie Spatzen“, „Sportverein TSV Grünwiese“.
- **falsch (Bruchstück):** „Kita Freie“ (sc-freie-person.txt/.docx): Der Name steht über zwei Absätze („Kita Freie⏎Waldorfschule“); gefunden wird nur der Teil in der ersten Zeile. Je Datei 1 Frage; die alte falsche Personen-Frage „Kita“ fällt dafür weg. Der Schlusscheck meldet die über Absätze getrennte „Freie Waldorfschule“ wie bisher.
- Summe (je Datei gezählt): **richtig 134 Funde in 21 Dateien und 5 Korpus-Abschnitten, falsch 2 (je 1 Frage in 2 Dateien)**. Keine Datei mit mehr als einer falschen Frage. Kein Mini-Stopp.
- Weggefallene falsche Personen-Fragen: „Kita“ in sc-freie-person (2) und Korpus „kooperation“ (1).

## Warnpunkt „Hier könnte eine Einrichtung stehen“ vorher/nachher
- 2.7.0 (alle Funde der Hinweis-Regeln): auf denselben Dateien 93 Stellen (Stand 2.7.0 mit der alten Gegenprobe: 43 richtig, 14 falsch).
- 2.8.0 (nur noch schwache Funde, Anführungszeichen ohne Merkmal): **5 Stellen, alle falsch** (gegenprobe-platzhalter: „Nachname C“, „Vorname D“; Korpus: „Essen aus aller Welt“, „Natur vor unserer Tür“, „Gemeinsam statt einsam“). Die 43 richtigen werden jetzt ersetzt und gefragt; die übrigen falschen (z. B. „Ganztagsschule Schuljahr“, „Gesunde Pause“, Titel hinter Titel-Wörtern) fallen weg.
- Gegenprobe sachtext (erweitert): 0 Einrichtungen ersetzt, 0 Einrichtungs-Fragen, dieselben 9 Fragen wie 2.7.0, 0 Stellen im Warnpunkt.

## Alle Testläufe vorher (main 2.7.0) / nachher (2.8.0), bestanden/gesamt
| Lauf | vorher | nachher |
|---|---|---|
| anzeige-test | 99/99 | 117/117 (neu: Einrichtungs-Fragen in b und e) |
| bedienung-test | 37/37 | 37/37 |
| bilder-test | 58/58 | 58/58 |
| einrichtung-test | 153/153 | 153/153 |
| endungen-test | 21/21 | 21/21 |
| gross-test | 44/44 | 44/44 |
| kennung-test | 37/37 | 37/37 |
| kollision-test | 17/17 | 17/17 |
| meta-proof | 48/48 | 46/46 (zwei Prüfungen zur Schlusscheck-Meldung entfallen, siehe unten) |
| pfade-test | 40/40 | 40/40 |
| platzhalter-test | 24/24 | 24/24 |
| roundtrip | 36/36 | 36/36 |
| spalten-test | 67/67 | 67/67 |
| traeger-test | 61/61 | 87/87 (neu: PR B) |
| ui-flow | 52/52 | 52/52 |
| wortliste-test | 18/18 | 18/18 |
| korpus-test, run-tests, regression | grün | grün |

## Angepasste Erwartungen (jede einzeln, mit Grund)
1. **tests/korpus/erwartung.json und erwartung-zellen.json:** „Fehltreffer unsicher aus“ 58 → 55. Grund: 3 falsche Personen-Treffer „Kita“ (vor „Kita Sonnenblume“, „Kita Freie Spatzen“) entfallen, weil diese jetzt Einrichtungen sind. Alle übrigen Zahlen gleich.
2. **tests/wortliste-test.mjs** („Freie Waldorfschule“): verglichen werden die Treffer der von Hand markierten Einrichtung (streng wie bisher); der neue Fund „Kita Freie“ (Regel a) steht eigens im Bericht.
3. **tests/einrichtung-test.mjs** „Art-Wechsel“: Die Datei enthält jetzt weitere selbst gefundene Einrichtungen; geprüft wird, dass genau der Verein die Art wechselt (Zählung relativ statt „1 → 0“). „freie-person“: erste Zeile ist jetzt „Einrichtung A“ (gefundene „Kita Freie“) statt „Person A Freie“; die Schlusscheck-Meldung bleibt streng geprüft.
4. **tests/meta-proof.mjs** und **tests/ui-flow.mjs** (kurse.docx): Die Firma aus den Dateiangaben („Familienzentrum Sonnenblume“) wird jetzt selbst gefunden und ersetzt; der bisherige Schlusscheck-Fund entsteht nicht mehr. Statt „Schlusscheck blockiert wegen des Firmennamens“ wird geprüft: gefunden, alle Stellen ersetzt, gefragt, 0 Funde, Speichern ohne Häkchen gesperrt. Zwei Prüfungen, die nur den Inhalt dieser Meldung betrafen (Ort in einfacher Sprache, Knopf „Als Einrichtung übernehmen“ in der Meldung), entfallen in meta-proof (48 → 46). Diese Meldung wird für von Hand markierte Einrichtungen weiter in einrichtung-test geprüft.
5. **tests/regression.mjs** und **tests/bedienung-test.mjs:** neue Kategorie „geändert durch die Regeln von Version 2.8.0“ mit Nachweis je Ausgabe (siehe unten). Byte-gleich bleibt sonst Pflicht.

## Regression gegen main (2.7.0, 631a2bcd…)
126 Ausgaben: **89 byte-gleich, 13 gleich bis auf die Kennung, 24 durch die Regeln von 2.8.0 geändert, 0 unterschiedlich.** Nachweis je geänderter Ausgabe: Version 2.7.0 liefert genau dieselbe Ausgabe, wenn man ihr die von 2.8.0 gefundenen Einrichtungen als von Hand markiert vorgibt und ihre Schreibweisen zusammenführt (Regel c). Betroffen: kurse.docx (6), einrichtung-umbruch.txt (6), einrichtung-umbruch-crlf.txt (3), einrichtung.txt (3), einrichtung.docx (6). bedienung-test (gegen 2.4.1): 129 Ausgaben mit demselben Nachweis, 0 unbegründet.

## Laufzeit
| | 2.7.0 | 2.8.0 |
|---|---|---|
| 10 MB Text (protokoll.txt wiederholt), Laden + Analyse | 9,2 s / 8,9 s | 9,3 s / 9,5 s |
| … Speichern-Punkte | 0,18 s | 0,17 s |
| … Ausgabe | 0,95 s | 1,0 s |
| 1 MB, jede Zeile eine Einrichtung (einrichtungen-auto wiederholt), nur Analyse (Node) | 0,6 s (findet nichts) | 1,5 s (rund 20 000 Stellen) |

## Prüfsumme
Zweimal gebaut, gleiche Datei: SHA-256 `d70bfc4381ef3c686819f027dbe9b6b3aa8e3a7458c5c62460c971e7d2e0a38b`, 3 845 500 Bytes.

---

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
Zweimal gebaut, gleiche Datei: SHA-256 `631a2bcd05e3aaf859309893e57509b745c978e99932280cb89a3aedce8a934a`, 3 836 973 Bytes (Nachbesserung „null“; davor 4f87a11d…, 3 837 068 Bytes).
