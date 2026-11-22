# Rückbau: Kreislauf-Beweis und Fallen

Chromium headless gegen index.html (SHA-256 6a11b0de78bfdf17…). Alle Namen sind erfunden.

## TXT (protokoll.txt)
- Anonymisiert (rückbaufähig): 57 Platzhalter in der Schlüsseldatei; Status „Gespeichert: anonymisiert_A57E.txt – mit bestätigten Restfunden.“
- Simulierte Korrektur: Wort geändert, Satz mit Nachname A, Vorname A, [E-MAIL-1] und Endung „Nachname As“ eingefügt, Abschnitt TOP 3 vor TOP 2 verschoben
- Rückbau: 76 Platzhalter ersetzt; abweichende Zeilen gegenüber Erwartung: 0
- Bericht meldete: Vorname A 2→3, Nachname A 4→7, [E-MAIL-1] 1→2; Auffälligkeiten 0
- Dateiname: wiederhergestellt_text.txt; JS-Fehler: keine

## CSV (mitarbeiter.csv)
- Schlüsseldatei: 32 Platzhalter (E-Mail-Platzhalter: [E-MAIL-1], [E-MAIL-2])
- Korrektur: Zelle geändert, zwei Zeilen getauscht, neue Zeile mit Vorname A Nachname A, [E-MAIL-1], „Nachname As“ eingefügt
- Rückbau: 36 Platzhalter ersetzt; abweichende Zeilen: 0
- JS-Fehler: keine

## DOCX (protokoll.docx)
- Schlüsseldatei: 59 Platzhalter
- Korrektur: Wort geändert, neuer Absatz mit über zwei Runs zerlegtem „Nachname A“ (normal + fett), Absätze TOP 2/TOP 3 getauscht
- Rückbau: 98 Platzhalter ersetzt; abweichende Absätze (Haupttext, Kopf-/Fußzeile, Fußnote, Kommentar, Textfeld): 0
- Formatierung/Struktur von word/document.xml außer Text unverändert gegenüber der korrigierten Datei: ja
- Metadaten nach Rückbau (werden bewusst NICHT wiederhergestellt): creator „“, Kommentar-Autor „Autor“
- Hyperlink-Ziel nach Rückbau: mailto:anna.mueller@beispiel-firma.de
- Schlusscheck: kein Platzhalter mehr im Ergebnis; Dateiname wiederhergestellt_dokument.docx
- JS-Fehler: keine

## XLSX (mitarbeiter.xlsx)
- Schlüsseldatei: 30 Platzhalter; ausgeblendetes Blatt „Yılmaz“ hieß anonymisiert „Nachname C“
- Korrektur: Zelltext geändert, Text mit Platzhaltern in eine Zelle eingefügt, Zeilen 3/4 getauscht
- Rückbau: 47 Platzhalter ersetzt; abweichende Zellen/Blattnamen/Formeln/Kommentare/Kopfzeilen: 0
- Blattnamen und Bezüge nach Rückbau: Blatt 1: Mitarbeiter · Blatt 2: Yılmaz · Blatt 3: Notizen · Name: 'Yılmaz'!$A$1 · S1!E3: Notizen zu Mehmet Yılmaz | f='Yılmaz'!A1 · app: Mitarbeiter · app: Yılmaz · app: Notizen
- JS-Fehler: keine

## DOCX Kurs-Tabelle (kurse.docx, Namen nur über Anrede im Absatz/der Zelle davor erkannt)
- Platzhalter der nur so erkannten Namen: Kirchbichler → Nachname D, Tesfamariam → Nachname F, Brzęczek → Nachname L, Sonnleitner → Nachname T
- Korrektur: Wort geändert, Satz mit Nachname D und Nachname F eingefügt, zwei Tabellenzeilen getauscht
- Rückbau: 25 Platzhalter ersetzt; abweichende Absätze: 0
- JS-Fehler: keine

## Risiko-Test Anrede allein (a2-risiko.txt/.csv/.docx, unverändert zurückgebaut)
- TXT: 17 Platzhalter; D-Namen ersetzt 8/8 (Hartung → Nachname H, Hornung → Nachname I, Kubik → Nachname J, Pawlik → Nachname K, Homburg → Nachname L, Steineck → Nachname M, Kronfeld → Nachname N, Tannheim → Nachname O); Rückbau 18 Platzhalter, abweichende Zeilen: 0
- CSV: 12 Platzhalter; D-Namen ersetzt 8/8 (Hartung → Nachname E, Hornung → Nachname F, Kubik → Nachname G, Pawlik → Nachname H, Homburg → Nachname I, Steineck → Nachname J, Kronfeld → Nachname K, Tannheim → Nachname L); Rückbau 12 Platzhalter, abweichende Zeilen: 0
- DOCX: 16 Platzhalter; D-Namen ersetzt 8/8 (Hartung → Nachname E, Hornung → Nachname F, Kubik → Nachname G, Pawlik → Nachname H, Homburg → Nachname I, Steineck → Nachname J, Kronfeld → Nachname K, Tannheim → Nachname L); Rückbau 25 Platzhalter, abweichende Absätze: 0

## Übertragungs-Test Anrede allein (a2-uebertragung.docx/.txt/.csv)
Hartung und Tannheim stehen nach allein stehender Anrede und später im Text (auch „Hartungs“, „HARTUNG“, in Word zusätzlich in Kopfzeile und Fußnote). Gegenprobe: Mathematik, Turnhalle, Sekretariat, Aula. Kontrolle: Kubik (Namensliste) und Lindqvist (ohne Anrede allein).
- DOCX: Vorkommen im Original: Hartung 5, Tannheim 3, HARTUNG 1, Mathematik 2, Turnhalle 2, Sekretariat 2, Aula 2, Kubik 2, Lindqvist 2
  - OK: im Ergebnis stehen geblieben: Hartung 0, Tannheim 0, HARTUNG 0, Mathematik 0, Turnhalle 0, Sekretariat 0, Aula 0, Kubik 0, Lindqvist 0
  - OK: 17 Treffer aus „Anrede allein“ samt Übertragung, alle „unsicher, an“: Hartung, Tannheim, Hartung*, Tannheim*, Hartungs*, Tannheims*, HARTUNG*, Mathematik, Turnhalle, Sekretariat, Aula, Mathematik*, Turnhalle*, Sekretariat*, Aula*, Hartung*, Hartung* (* = übertragen)
  - OK: ein „Mathematik“ angetippt → überall Klartext (2/2), anderes Vorkommen angetippt → überall wieder ersetzt (0)
  - Rückbau: Hartung → Nachname A (mit Varianten 6× im Ergebnis, erwartet 6), Tannheim → Nachname B; 22 Platzhalter zurückgebaut, Abweichungen: 0
- TXT: Vorkommen im Original: Hartung 5, Tannheim 3, HARTUNG 1, Mathematik 2, Turnhalle 2, Sekretariat 2, Aula 2, Kubik 2, Lindqvist 2
  - OK: im Ergebnis stehen geblieben: Hartung 0, Tannheim 0, HARTUNG 0, Mathematik 0, Turnhalle 0, Sekretariat 0, Aula 0, Kubik 0, Lindqvist 0
  - OK: 17 Treffer aus „Anrede allein“ samt Übertragung, alle „unsicher, an“: Hartung*, Hartung, Tannheim, Hartung*, Tannheim*, Hartungs*, Tannheims*, HARTUNG*, Mathematik, Turnhalle, Sekretariat, Aula, Mathematik*, Turnhalle*, Sekretariat*, Aula*, Hartung* (* = übertragen)
  - OK: ein „Mathematik“ angetippt → überall Klartext (2/2), anderes Vorkommen angetippt → überall wieder ersetzt (0)
  - Rückbau: Hartung → Nachname A (mit Varianten 6× im Ergebnis, erwartet 6), Tannheim → Nachname B; 22 Platzhalter zurückgebaut, Abweichungen: 0
- CSV: Vorkommen im Original: Hartung 3, Tannheim 3, HARTUNG 1, Mathematik 2, Turnhalle 2, Sekretariat 2, Aula 2, Kubik 2, Lindqvist 2
  - OK: im Ergebnis stehen geblieben: Hartung 0, Tannheim 0, HARTUNG 0, Mathematik 0, Turnhalle 0, Sekretariat 0, Aula 0, Kubik 0, Lindqvist 0
  - OK: 15 Treffer aus „Anrede allein“ samt Übertragung, alle „unsicher, an“: Hartung, Tannheim, Mathematik, Turnhalle, Sekretariat, Aula, Hartung*, Tannheim*, Hartungs*, Tannheims*, HARTUNG*, Mathematik*, Turnhalle*, Sekretariat*, Aula* (* = übertragen)
  - OK: ein „Mathematik“ angetippt → überall Klartext (2/2), anderes Vorkommen angetippt → überall wieder ersetzt (0)
  - Rückbau: Hartung → Nachname B (mit Varianten 4× im Ergebnis, erwartet 4), Tannheim → Nachname C; 21 Platzhalter zurückgebaut, Abweichungen: 0

## Fallen (einzeln geprüft)
- Anonymisierte Fallen-Zeilen (so sieht die KI den Text):
  > Frau Nachname AC leitet. Nachname ACs Bericht liegt vor. Nachname AC2 unterschrieb. Initiale A. Nachname A kam später.
  > Herr Nachname AC (unklar, welcher) rief an. Vorname B Nachname B war im Urlaub.
  > Nachname Y' Theorie und Herrn Nachname Z' Akte. Vorname Y Nachname Y und Vorname Z Nachname Z stimmen zu.
  > Zum Schluss: Vorname AB Nachname AB und Vorname AA Nachname AA.
  > E-Mail: [E-MAIL-1], zweite Adresse [E-MAIL-2], nochmals [E-MAIL-1].
  > Telefon [TELEFON-1], IBAN [IBAN-1], Adresse [ADRESSE-1], [ADRESSE-2].
- OK: voller Name gegen nur Nachname: gleiche Person, Nachname-Platzhalter gleich – „Andreas Haas“ → „Vorname Z Nachname Z“, „Herrn Haas'“ → „Herrn Nachname Z'“
- OK: nur Nachname bei zwei Personen gleichen Nachnamens (mehrdeutig): eigener Platzhalter, exakt rückbaubar – „Frau Müller“ → „Frau Nachname AC“ (Anna: Nachname A); in der Prüfansicht mit „zusammenführen“ änderbar
- OK: zwei Personen mit gleichem Nachnamen bekommen verschiedene Platzhalter – Anna → Nachname A, Peter → Nachname B
- OK: GROSSSCHREIBUNG als eigene Schreibweise mit Nummer – „MÜLLER“ → „Nachname AC2“
- OK: Initiale – „A. Müller“ → „Initiale A. Nachname A“
- OK: Namen auf -x/-s mit Apostroph-Endung – „Marx'“ → „Nachname Y'“, „Haas'“ → „Nachname Z'“
- OK: „Nachname A“ gegen „Nachname AA“ und „Nachname A2“ alle verschieden – AA-Person: Vorname AA = Olga; A2: Nachname AC2
- OK: zwei verschiedene E-Mail-Adressen, gleiche Adresse gleiche Nummer – [E-MAIL-1]=anna@beispiel.de×2, [E-MAIL-2]=anna.mueller@beispiel.de×1
- OK: Namenszusatz „von der“ und Präfix „Al-“ im Platzhalter enthalten
- OK: Sicherheitsnetz (2.3.3): unbekannter Platzhalter „Nachname ZZ“ als roter Rest gemeldet – Reste: Nachname ZZ
- OK: Kleinschreibung „nachname a“ erkannt und NICHT geraten – verändert: nachname ac
- OK: gebeugt „des Nachnamens A“ erkannt – gebeugt: Nachnamens A
- OK: Platzhalter über Zeilen getrennt erkannt – getrennt: Nachname | A
- OK: unbekannter Platzhalter „Nachname ZZ“ gemeldet
- OK: veränderter Kontakt-Platzhalter „[E-Mail-1]“ gemeldet
- OK: gelöschter Platzhalter (Telefon) als „weniger“ gemeldet – 1→0
- OK: eingefügter Platzhalter als „mehr“ gemeldet – 2→3
- OK: Export erst nach Bestätigung (Bericht verlangte Bestätigung)
- OK: Ergebnis entspricht exakt der Erwartung (alle exakten Platzhalter zurück, Auffälliges unverändert)
- Rückbau-Bericht: 79 ersetzt; Auffälligkeiten: verändert: nachname ac | unbekannt: Nachname ZZ | gebeugt: Nachnamens A | verändert: [E-Mail-1] | getrennt: Nachname | A
- OK: falsche Schlüsseldatei (vom Protokoll) erkannt – Urteil: zweifelhaft; Meldung: Wahrscheinlich die falsche Schlüsseldatei: 47 von 57 Platzhaltern gefunden, nur bei 33 stimmt die Anzahl, 28 unbekannte Platzhalter in der Datei.
- OK: Datei ohne passende Platzhalter: kein Ergebnis – Rückbau nicht möglich.Im Dokument steht keine Kennung. Der Schlüssel hat die Kennung 9L23. Prüfe, ob beide zusammengehör
- OK: alte Zuordnungstabelle (CSV) wird abgelehnt – Das ist die alte Zuordnungstabelle (zuordnung_VERTRAULICH.csv). Sie reicht für einen Rückbau NICHT: Sie enthäl
- OK: Rückbau deterministisch (Doppellauf byte-gleich) – ac385ab26ac6aaf2 / ac385ab26ac6aaf2
- OK: Anonymisierung rückbaufähig deterministisch (Datei und Schlüssel ohne Kennung) – 6e6b33171283923f / 6e6b33171283923f
- OK: Kennungen zweier Läufe verschieden (Zufall) – 9L23 / 655J

## Namensspalten und Anrede am Zeilenende (Version 2.6.0, tests/fixtures-spalten)
- protokoll.txt: Sonnleitner → Nachname D; 9 Platzhalter; bearbeitet (Zeile mit dem Platzhalter angefügt); 15 zurückgebaut, Abweichungen: 0
- protokoll-lf.txt: Kirchbichler → Nachname E; 9 Platzhalter; bearbeitet (Zeile mit dem Platzhalter angefügt); 15 zurückgebaut, Abweichungen: 0
- tabellen-stark.csv: Brzęczek → Nachname F; 18 Platzhalter; bearbeitet (Zeile mit dem Platzhalter angefügt); 27 zurückgebaut, Abweichungen: 0
- brief.docx: Trzaskalik → Name M; 17 Platzhalter; bearbeitet („Kurs“ → „Angebot“); 25 zurückgebaut, Abweichungen: 0
- tabellen.docx: Dimitrios → Vorname H; 34 Platzhalter; bearbeitet („Kurs“ → „Angebot“); 65 zurückgebaut, Abweichungen: 0
- liste.xlsx: Kirchbichler → Nachname J; 30 Platzhalter; bearbeitet („Kurs“ → „Angebot“); 35 zurückgebaut, Abweichungen: 0
- tabellen.xlsx: Brzęczek → Nachname E; 32 Platzhalter; bearbeitet („Kurs“ → „Angebot“); 41 zurückgebaut, Abweichungen: 0
- OK: Modus „Person A“ zeigt „nicht rückbaufähig“ (true) und keine Schlüsseldatei (true)
- OK: Modus „[NAME]“ zeigt „nicht rückbaufähig“ (true) und keine Schlüsseldatei (true)

## Zusammenfassung Kreislauf
| Format | Werte gesamt (ersetzte Platzhalter) | exakt zurück | Abweichungen |
|---|---|---|---|
| TXT | 76 | 76 | 0 |
| CSV | 36 | 36 | 0 |
| DOCX | 98 | 98 | 0 |
| XLSX | 47 | 47 | 0 |
| DOCX Kurs-Tabelle | 25 | 25 | 0 |
| Risiko-Test TXT | 18 | 18 | 0 |
| Risiko-Test CSV | 12 | 12 | 0 |
| Risiko-Test DOCX | 25 | 25 | 0 |
| Übertragung DOCX | 22 | 22 | 0 |
| Übertragung TXT | 22 | 22 | 0 |
| Übertragung CSV | 21 | 21 | 0 |
| Fallen-TXT | 79 | 79 | 0 |
| 2.6.0 protokoll.txt | 15 | 15 | 0 |
| 2.6.0 protokoll-lf.txt | 15 | 15 | 0 |
| 2.6.0 tabellen-stark.csv | 27 | 27 | 0 |
| 2.6.0 brief.docx | 25 | 25 | 0 |
| 2.6.0 tabellen.docx | 65 | 65 | 0 |
| 2.6.0 liste.xlsx | 35 | 35 | 0 |
| 2.6.0 tabellen.xlsx | 41 | 41 | 0 |

Fallen-Prüfungen: 36 von 36 bestanden.
Netzwerkanfragen außer lokalen Dateien: 0.
