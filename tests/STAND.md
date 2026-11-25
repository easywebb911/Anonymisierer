# Stand der Tests (npm run test:all)

Version 2.11.0; sha256 der index.html: 89e519fd9cf15896dd2542010478f929dabdd9bf996bfd29a8f6f464391a6928

4 Läufe gleichzeitig auf 4 Rechenkernen; Gesamtdauer 1022 s (mit Vorbereitung). Nur Chromium, Firefox prüft Easy.

| Testlauf | Ergebnis | bestanden/gesamt | Dauer |
|---|---|---|---|
| korpus | bestanden | alle Zahlen wie erwartet | 0 s |
| wortliste | bestanden | 18/18 | 0 s |
| spalten | bestanden | 67/67 | 8 s |
| run-tests | bestanden | Messbericht ohne Zähler (Ende erreicht) | 182 s |
| roundtrip | bestanden | 36/36 | 63 s |
| ui-flow | bestanden | 52/52 | 31 s |
| endungen | bestanden | 21/21 | 30 s |
| gross | bestanden | 44/44 | 344 s |
| platzhalter | bestanden | 24/24 | 45 s |
| kollision | bestanden | 17/17 | 51 s |
| kennung | bestanden | 37/37 | 37 s |
| bilder | bestanden | 58/58 | 38 s |
| einrichtung | bestanden | 153/153 | 104 s |
| meta-proof | bestanden | 51/51 | 25 s |
| pfade | bestanden | 40/40 | 101 s |
| bedienung | bestanden | 37/37 | 713 s |
| anzeige | bestanden | 121/121 | 299 s |
| regression | bestanden | 126/126 (91 byte-gleich, 14 nur Kennung, 21 Spalten-Behandlung) | 186 s |
| traeger | bestanden | 98/98 | 85 s |
| massstab | **NICHT bestanden** | 35 Abweichungen (139 Dateien, 1929 + 2068 Stellen) | 911 s |
| nachbarn | bestanden | 168/168 | 307 s |
| restwoerter | bestanden | 117/117 | 132 s |
| spaltenwahl | bestanden | 202/202 | 347 s |
