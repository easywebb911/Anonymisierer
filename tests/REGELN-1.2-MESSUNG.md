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

## Nachtrag: Entscheidung D (Markierung statt Auslassen)

Umsetzung: Nach allein stehender Anrede wird **immer** ersetzt. Ein einzelnes Wort, das in keiner Namensliste steht und wie ein Sach- oder Ortswort endet, wird als „unsicher, an“ markiert, alles andere als „sicher“.

Risiko-Test erweitert: erfundene Personen Hartung, Hornung, Kubik, Pawlik, Homburg, Steineck, Kronfeld, Tannheim (dazu „Lieselotte Steineck“) nach allein stehender Anrede, in Word (Absatz und Nachbarzelle), TXT und CSV.

| Datei | ersetzt (D-Namen) | davon „sicher“ | davon „unsicher, an“ |
|---|---|---|---|
| a2-risiko.docx (Absatz + Nachbarzelle) | 16/16 | 6 (Hornung, Kubik, Pawlik, je 2×) | 10 (Hartung, Homburg, Steineck, Kronfeld, Tannheim, je 2×) |
| a2-risiko.txt | 8/8 | 3 (Hornung, Kubik, Pawlik) | 5 (Hartung, Homburg, Steineck, Kronfeld, Tannheim) |
| a2-risiko.csv | 8/8 | 3 (Hornung, Kubik, Pawlik) | 5 (Hartung, Homburg, Steineck, Kronfeld, Tannheim) |

„Lieselotte Steineck“ (zwei Wörter) ist „sicher“.

Messung gegenüber v1.1 (alle Testdokumente, Kurs-Tabelle, Briefzeilen, Risiko-Test):

| | letzter Bericht (A, alles „sicher“) | jetzt (D) |
|---|---|---|
| zusätzlich gefundene Namen | 25 | 25 (8 „sicher“, 17 „unsicher, an“) |
| verlorene richtige Treffer | 0 | 0 |
| neue Fehltreffer „sicher“ | 8 | **0** |
| neue Fehltreffer „unsicher“ | 0 | 8 (Mathematik ×2, Lübeck ×3, Chemie ×2, Kursübersicht) |
| entfallene Fehltreffer | 9 | 9 |

Die 25 statt 5 zusätzlichen Funde und die 9 statt 6 entfallenen Fehltreffer gegenüber dem ersten Bericht kommen von den neuen Testfällen (Hartung & Co.) und von „am 3. Mai“ (Excel) und „Montag“ (Risiko-Test, Briefzeilen).

Die Kurs-Tabelle bleibt unverändert: alle 5 Namen sind „sicher“ (Kirchbichler, Tesfamariam, Brzęczek, Sonnleitner ×2).

Die Ausgabe-Dateien von D sind byte-gleich mit A (22 von 22 Standardausgaben, dazu 12 von 12 Ausgaben aus Kurs-Tabelle und Risiko-Test). Geändert hat sich nur die Markierung in der Prüfansicht.

Zusatzproben (nicht im Repo):

| Probe | Ergebnis |
|---|---|
| „Herr“ / „Turnhalle“, „Frau“ / „Sekretariat“, „Herr“ / „Aula“ | Fehltreffer, **„sicher“** (keine Endung aus der Liste) |
| „Herr“ / „Hartung“ / „Später rief Hartung an.“ | Das zweite „Hartung“ bleibt **stehen**: „unsicher“ markierte Treffer werden nicht auf andere Stellen übertragen. In A wurde es übertragen. |
