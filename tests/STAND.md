# Stand der Tests (npm run test:all)

Version 2.11.0; sha256 der index.html: 89e519fd9cf15896dd2542010478f929dabdd9bf996bfd29a8f6f464391a6928

4 Läufe gleichzeitig auf 4 Rechenkernen; Gesamtdauer 982 s (mit Vorbereitung). Nur Chromium, Firefox prüft Easy.

| Testlauf | Ergebnis | bestanden/gesamt | Dauer |
|---|---|---|---|
| korpus | bestanden | alle Zahlen wie erwartet | 1 s |
| wortliste | bestanden | 18/18 | 0 s |
| spalten | bestanden | 67/67 | 7 s |
| run-tests | bestanden | Messbericht ohne Zähler (Ende erreicht) | 179 s |
| roundtrip | bestanden | 36/36 | 62 s |
| ui-flow | bestanden | 52/52 | 31 s |
| endungen | bestanden | 21/21 | 29 s |
| gross | bestanden | 44/44 | 333 s |
| platzhalter | bestanden | 24/24 | 45 s |
| kollision | bestanden | 17/17 | 51 s |
| kennung | bestanden | 37/37 | 38 s |
| bilder | bestanden | 58/58 | 37 s |
| einrichtung | bestanden | 153/153 | 102 s |
| meta-proof | bestanden | 51/51 | 25 s |
| pfade | bestanden | 40/40 | 93 s |
| bedienung | bestanden | 37/37 | 671 s |
| anzeige | bestanden | 121/121 | 289 s |
| regression | bestanden | 126/126 (91 byte-gleich, 14 nur Kennung, 21 Spalten-Behandlung) | 180 s |
| traeger | bestanden | 98/98 | 81 s |
| massstab | bestanden | 0 Abweichungen (139 Dateien, 1929 + 2068 Stellen) | 853 s |
| nachbarn | **NICHT bestanden** | ohne Zähler | 298 s |
| restwoerter | bestanden | 117/117 | 121 s |
| spaltenwahl | bestanden | 210/210 | 337 s |

Hinweis zu nachbarn: Im zweiten test:all brach der Lauf mit einer Zeitüberschreitung beim Klick auf einen Listen-Schalter ab (Playwright, Element nicht sichtbar). Die index.html ist gleich wie im ersten test:all (dort 168/168). Einzellauf danach (`npm run test:quick -- nachbarn`): 168/168.
