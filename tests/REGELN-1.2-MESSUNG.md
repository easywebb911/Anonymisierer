# Messung der Regeln „Anrede allein“ (a2) und „Wochentage/Monate“ (b2) – Version 1.2.0

Vergleich der Erkennung **v1.1 (Basis)** mit **v1.2 (eingebaut)**. Gezählt wurden Namens-Vorkommen, die durch einen
*eingeschalteten* Treffer abgedeckt sind, und eingeschaltete Treffer ohne Namen (Fehltreffer). Alle Namen sind erfunden.

| Datei | zusätzlich gefunden | neue Fehltreffer | verlorene richtige Treffer | entfallene Fehltreffer |
|---|---|---|---|---|
| protokoll.txt | 0 | 0 | 0 | 0 |
| mitarbeiter.csv | 0 | 0 | 0 | 0 |
| protokoll.docx | 0 | 0 | 0 | 0 |
| mitarbeiter.xlsx | 0 | 0 | 0 | 1 („am 3. Mai“ war ein Datum, kein Name)¹ |
| protokoll.pdf | 0 | 0 | 0 | 0 |
| rueckbau-fallen.txt | 0 | 0 | 0 | 0 |
| **kurse.docx** (Nachbildung Praxistest) | **5** (Kirchbichler, Tesfamariam, Brzęczek, Sonnleitner ×2) | **0** | 0 | **5** (Montag ×3, Januar, Mai) |
| Briefzeilen (Risiko-Test aus der Diagnose) | 0 | 0 | 0 | 1 (Montag) |
| **a2-risiko.docx** | 1 (Tesfamariam) | **3** (Mathematik, Lübeck, Chemie) | 0 | 1 (Montag) |
| **a2-risiko.txt** | 1 (Tesfamariam) | **3** (Kursübersicht, Mathematik, Lübeck) | 0 | 1 (Montag) |
| **a2-risiko.csv** | 1 (Tesfamariam) | **2** (Chemie, Lübeck) | 0 | 0 |

¹ Die automatische Auswertung hatte „Mai“ hier zunächst als verlorenen Namen gezählt, weil „Mai“ auch Teil von „Trần Thị Mai“ ist.
Tatsächlich ist es ein Datum; v1.1 hatte es fälschlich ersetzt.

## Risiko-Test einzeln (a2-risiko.docx)

| Fall | erwartet | Ergebnis v1.2 |
|---|---|---|
| Anrede, dann Überschrift | kein Name | kein Treffer (Word-Überschrift unterbricht); **in TXT: Treffer** (Überschrift dort nicht erkennbar) |
| Anrede, dann Fach „Mathematik“ | kein Name | **Fehltreffer** |
| Anrede, dann Ort „Lübeck“ (nicht auf Liste) | kein Name | **Fehltreffer** |
| Anrede, dann Ort „Berlin“ (auf Liste) | kein Name | kein Treffer |
| Anrede, dann Datum | kein Name | kein Treffer |
| Anrede, dann ganzer Satz | kein Name | kein Treffer |
| Anrede, Leerabsatz, dann Name | kein Name (bewusst) | kein Treffer |
| „Sehr geehrte Frau,“ / „Das sagte der Herr.“ / „Liebe Frau“ / „Gesprächspartner: Herr“ / „Die Frau“ | kein Name | kein Treffer |
| „Anrede: Frau“, dann „Montag“ | kein Name | Montag „unsicher, aus“ |
| Anrede mit Titeln, dann „Henriette von Bodelschwingh“ | Name | sicherer Treffer |
| Tabelle: Anrede, leere Nachbarzelle, Name | kein Name (bewusst) | kein Treffer |
| Tabelle: Anrede, Nachbarzelle „Tesfamariam“ | Name | sicherer Treffer |
| Tabelle: Anrede, Nachbarzelle Fach „Chemie“ | kein Name | **Fehltreffer** |
| Tabelle: Anrede am Zeilenende, Name in nächster Zeile | kein Name durch a2 | kein a2-Treffer („Neumeier-Okafor“ wird über die Namensliste erkannt, wie in v1.1) |
| Tabellenende: Anrede in letzter Zelle, danach Absatz „Hinweise zum Kurs“ | kein Name | kein Treffer |

Vergleich mit der Diagnose (Wegwerf-Regel a2 + b2: 5 / 0 / 0 / 6): Die eingebaute Fassung erreicht an den 6 Testdokumenten, der
Kurs-Tabelle und den Briefzeilen genau 5 / 0 / 0 / 6 (Kurs-Tabelle 5 + Briefzeilen 1 entfallene Fehltreffer), dazu 1 weiteren
behobenen Fehltreffer in Excel (b2 greift seit dem Einbau auch bei Namensteilen, die nur durch einen anderen Namen bekannt sind).

## Regression (Modi „Person A“ und „[NAME]“, alle bisherigen Testdokumente)
18 von 22 Ausgaben byte-identisch. Geändert: mitarbeiter.xlsx (.xlsx und .txt, beide Modi), jeweils genau eine Stelle:
„Gespräch mit … am 3. Person Q“ → „… am 3. Mai“ (Datum bleibt stehen; gewollt durch Regel b2).
