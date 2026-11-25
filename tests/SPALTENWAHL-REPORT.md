# Tabellen: Spalten behandeln (Version 2.10.0) und Personen-Tabellen (Version 2.11.0)

Neue Version: index.html; Gegenprobe: main (2.10.0), tests/out-alt/index-2.10.0.html. Nur Chromium, Firefox prüft Easy. Alle Daten erfunden.

## 1. Vorschlag anhand der Überschrift (stammdaten.xlsx und stammdaten.csv)
- OK: stammdaten.xlsx: Vorschlag für alle 53 Spalten wie erwartet (Personen-Tabelle)
- OK: stammdaten.xlsx: Übersicht zeigt jede Spalte mit gewählter Behandlung (Auswahl = Vorschlag)

| Spalte | Vorschlag main (2.10.0) | Vorschlag jetzt | Grund |
|---|---|---|---|
| Nachname | Name | Name | name |
| Rufname | Name | Name | name |
| Vornamen laut Geburtsurkunde | Name | Name | name |
| Geschlecht | lesbar (wie bisher) | lesbar (wie bisher) | Auswahl |
| Geburtsdatum | ganz ersetzen (date) | ganz ersetzen (date) | date |
| Geburtsort | ganz ersetzen (info) | ganz ersetzen (info) | info |
| Muttersprache | ganz ersetzen (info) | ganz ersetzen (info) | info |
| Staatsangehörigkeit | ganz ersetzen (info) | ganz ersetzen (info) | info |
| Religion | ganz ersetzen (info) | ganz ersetzen (info) | info |
| Gewünschter Zweig | lesbar (wie bisher) | lesbar (wie bisher) | Auswahl |
| Gesundheitliche Beeinträchtigung | ganz ersetzen (info) | ganz ersetzen (info) | info |
| Erläuterung | ganz ersetzen (info) | ganz ersetzen (info) | info |
| 1. Erziehungsberechtigte/r akad. Titel | lesbar (wie bisher) | lesbar (wie bisher) | Auswahl |
| 1. Erziehungsberechtigte/r Nachname | Name | Name | name |
| 1. Erziehungsberechtigte/r Vorname | Name | Name | name |
| 1. Strasse | ganz ersetzen (address) | ganz ersetzen (address) | address |
| 1. Hausnummer | ganz ersetzen (address) | ganz ersetzen (address) | address |
| 1. PLZ | ganz ersetzen (address) | ganz ersetzen (address) | address |
| 1. Ort | ganz ersetzen (address) | ganz ersetzen (address) | address |
| 1. GKZ | ganz ersetzen (info) | ganz ersetzen (info) | info |
| 1. Telefon | ganz ersetzen (phone) | ganz ersetzen (phone) | phone |
| 1. E-Mail | ganz ersetzen (email) | ganz ersetzen (email) | email |
| 1. Handy | ganz ersetzen (phone) | ganz ersetzen (phone) | phone |
| 1. Telefon für Notfälle | ganz ersetzen (phone) | ganz ersetzen (phone) | phone |
| 1. Bemerkung Notfallnummer | ganz ersetzen (info) | ganz ersetzen (info) | phone + info (Konflikt) |
| 2. Erziehungsberechtigte/r Nachname | Name | Name | name |
| 2. Erziehungsberechtigte/r Vorname | Name | Name | name |
| 2. Strasse | ganz ersetzen (address) | ganz ersetzen (address) | address |
| 2. Hausnummer | ganz ersetzen (address) | ganz ersetzen (address) | address |
| 2. PLZ | ganz ersetzen (address) | ganz ersetzen (address) | address |
| 2. Ort | ganz ersetzen (address) | ganz ersetzen (address) | address |
| Sorgerecht | ganz ersetzen (info) | ganz ersetzen (info) | info |
| Kind wohnt | lesbar (wie bisher) | ganz ersetzen (info) | heikel: wohn |
| Übertritt von | ganz ersetzen (org) | ganz ersetzen (org) | org |
| Schulnummer | ganz ersetzen (info) | ganz ersetzen (info) | info |
| Von Jgst. | lesbar (wie bisher) | lesbar (wie bisher) | Auswahl |
| Ergebnis des Übertrittszeugnisses | lesbar (wie bisher) | lesbar (wie bisher) | Auswahl |
| Wunschpartner in der Klasse | Name | ganz ersetzen (info) | Name ohne Namenswort |
| Ganztag | lesbar (wie bisher) | lesbar (wie bisher) | Auswahl |
| Notizen der Schule | ganz ersetzen (info) | ganz ersetzen (info) | org + info (Konflikt) |
| Rel.-Unt. | lesbar (wie bisher) | ganz ersetzen (info) | heikel: rel. |
| Zuzugsart | lesbar (wie bisher) | ganz ersetzen (info) | heikel: zuzug |
| Gewünschte erste Fremdsprache | lesbar (wie bisher) | lesbar (wie bisher) | Auswahl |
| Elternteil 1 | lesbar (wie bisher) | lesbar (wie bisher) | Auswahl |
| 1. auskunftsberechtigt | lesbar (wie bisher) | lesbar (wie bisher) | Auswahl |
| Lese-/Rechtschreibstörung | lesbar (wie bisher) | ganz ersetzen (info) | heikel: störung |
| Inklusionsbedarf | lesbar (wie bisher) | ganz ersetzen (info) | heikel: inklus |
| Besteht Kontakt zum MSD | lesbar (wie bisher) | ganz ersetzen (info) | heikel: msd |
| Ansprechpartner/in und Kontaktdaten MSD | Name | ganz ersetzen (info) | Name ohne Namenswort |
| Schulweg | lesbar (wie bisher) | lesbar (wie bisher) | Auswahl |
| Schwimmen | lesbar (wie bisher) | lesbar (wie bisher) | Auswahl |
| Bitte geben Sie ein alternatives Wunschgymnasium an, sollte bei uns am Gymnasium kein Platz mehr frei sein. | lesbar (wie bisher) | ganz ersetzen (info) | heikel: wunsch |
| Wurde in der Grundschule Nachteilsausgleich oder Notenschutz wegen LRS gewährt? | ganz ersetzen (org) | ganz ersetzen (info) | heikel: lrs (vor Einrichtung) (Konflikt) |

Konflikte: „1. Bemerkung Notfallnummer“ (phone + info → info); „Notizen der Schule“ (org + info → info); „Wurde in der Grundschule Nachteilsausgleich oder Notenschutz wegen LRS gewährt?“ (org + heikel → info)
- OK: stammdaten.xlsx: Zahl der gefüllten Zellen zählt auch Datums- und Zahlzellen (Geburtsdatum 60) – Geburtsdatum 60 Zellen gefüllt Name ganz ersetzen wie bisher als [DATUM]
  (oben 42, lesbar 11, eingeklappt 0; Schalter „Seltene Werte“ an: true)

Lesbare Spalten, wie der Nutzer sie sieht:
- Bleibt lesbar: w 31, m 28, d 1
- Bleibt lesbar: naturwissenschaftlich 30, sprachlich 30
- Bleibt lesbar: Dr. 9, Prof. Dr. 5, Dr. med. 2
- Bleibt lesbar: 4 60
- Bleibt lesbar: 1,33 15, 2,00 15, 2,33 15, 2,66 14, 3,00 1
- Bleibt lesbar: ja 30, nein 30
- Bleibt lesbar: Englisch 20, Französisch 20, Latein 20
- Bleibt lesbar: Mutter 40, Vater 20
- Bleibt lesbar: ja 48, nein 12
- Bleibt lesbar: Bus 30, Fahrrad 15, zu Fuß 15
- Bleibt lesbar: Bronze 20, Seepferdchen 20, Silber 18, keins 2

- OK: stammdaten.xlsx: Personen-Tabelle: ersetzte Spalten oben, lesbare Spalten darunter NICHT eingeklappt, je mit ihren Werten
- OK: stammdaten.csv: Vorschlag für alle 53 Spalten wie erwartet (Personen-Tabelle)
- OK: stammdaten.csv: Übersicht zeigt jede Spalte mit gewählter Behandlung (Auswahl = Vorschlag)

## 2. Ohne jeden Klick außer „So übernehmen“: Klartext-Zellen je Spalte (Excel und CSV, drei Modi)
- OK: stammdaten.xlsx, person: keine Zelle mit Originalwert in Spalten „Name“/„ganz ersetzen“
- OK: stammdaten.xlsx, person: kein seltener Wert (weniger als 3-mal) in einer lesbaren Spalte
- OK: stammdaten.xlsx, person: Kopfzeile unverändert
- OK: stammdaten.xlsx, person: keine JS-Fehler
- OK: stammdaten.xlsx, name: keine Zelle mit Originalwert in Spalten „Name“/„ganz ersetzen“
- OK: stammdaten.xlsx, name: kein seltener Wert (weniger als 3-mal) in einer lesbaren Spalte
- OK: stammdaten.xlsx, name: Kopfzeile unverändert
- OK: stammdaten.xlsx, name: keine JS-Fehler
- OK: stammdaten.xlsx, reversible: keine Zelle mit Originalwert in Spalten „Name“/„ganz ersetzen“
- OK: stammdaten.xlsx, reversible: kein seltener Wert (weniger als 3-mal) in einer lesbaren Spalte
- OK: stammdaten.xlsx, reversible: Kopfzeile unverändert
- OK: stammdaten.xlsx, reversible: keine JS-Fehler
- OK: stammdaten.xlsx, „Unsichere Treffer“ aus: keine Originalwerte in ersetzten Spalten, kein seltener Wert
- OK: stammdaten.csv, person: keine Zelle mit Originalwert in Spalten „Name“/„ganz ersetzen“
- OK: stammdaten.csv, person: kein seltener Wert (weniger als 3-mal) in einer lesbaren Spalte
- OK: stammdaten.csv, person: Kopfzeile unverändert
- OK: stammdaten.csv, person: keine JS-Fehler
- OK: stammdaten.csv, name: keine Zelle mit Originalwert in Spalten „Name“/„ganz ersetzen“
- OK: stammdaten.csv, name: kein seltener Wert (weniger als 3-mal) in einer lesbaren Spalte
- OK: stammdaten.csv, name: Kopfzeile unverändert
- OK: stammdaten.csv, name: keine JS-Fehler
- OK: stammdaten.csv, reversible: keine Zelle mit Originalwert in Spalten „Name“/„ganz ersetzen“
- OK: stammdaten.csv, reversible: kein seltener Wert (weniger als 3-mal) in einer lesbaren Spalte
- OK: stammdaten.csv, reversible: Kopfzeile unverändert
- OK: stammdaten.csv, reversible: keine JS-Fehler
- OK: stammdaten.csv, „Unsichere Treffer“ aus: keine Originalwerte in ersetzten Spalten, kein seltener Wert
- OK: stammdaten.csv: Kopfzeile byte-gleich mit dem Original

Zellen mit Klartext (von 60) je Spalte, main → jetzt; Lauf: Excel „Person A“ (alle 6 Läufe gleich, siehe Prüfungen). Bei lesbaren Spalten: lesbare Zellen und davon seltene Werte.

| Spalte | Vorschlag main | Vorschlag jetzt | Klartext main | Klartext jetzt |
|---|---|---|---|---|
| Nachname | Name | Name | 0 | 0 |
| Rufname | Name | Name | 0 | 0 |
| Vornamen laut Geburtsurkunde | Name | Name | 0 | 0 |
| Geschlecht | lesbar | lesbar | 60 lesbar, 1 selten | 59 lesbar, 0 selten |
| Geburtsdatum | ganz date | ganz date | 0 | 0 |
| Geburtsort | ganz info | ganz info | 0 | 0 |
| Muttersprache | ganz info | ganz info | 0 | 0 |
| Staatsangehörigkeit | ganz info | ganz info | 0 | 0 |
| Religion | ganz info | ganz info | 0 | 0 |
| Gewünschter Zweig | lesbar | lesbar | 60 lesbar, 0 selten | 60 lesbar, 0 selten |
| Gesundheitliche Beeinträchtigung | ganz info | ganz info | 0 | 0 |
| Erläuterung | ganz info | ganz info | 0 | 0 |
| 1. Erziehungsberechtigte/r akad. Titel | lesbar | lesbar | 16 lesbar, 2 selten | 14 lesbar, 0 selten |
| 1. Erziehungsberechtigte/r Nachname | Name | Name | 0 | 0 |
| 1. Erziehungsberechtigte/r Vorname | Name | Name | 0 | 0 |
| 1. Strasse | ganz address | ganz address | 0 | 0 |
| 1. Hausnummer | ganz address | ganz address | 0 | 0 |
| 1. PLZ | ganz address | ganz address | 0 | 0 |
| 1. Ort | ganz address | ganz address | 0 | 0 |
| 1. GKZ | ganz info | ganz info | 0 | 0 |
| 1. Telefon | ganz phone | ganz phone | 0 | 0 |
| 1. E-Mail | ganz email | ganz email | 0 | 0 |
| 1. Handy | ganz phone | ganz phone | 0 | 0 |
| 1. Telefon für Notfälle | ganz phone | ganz phone | 0 | 0 |
| 1. Bemerkung Notfallnummer | ganz info | ganz info | 0 | 0 |
| 2. Erziehungsberechtigte/r Nachname | Name | Name | 0 | 0 |
| 2. Erziehungsberechtigte/r Vorname | Name | Name | 0 | 0 |
| 2. Strasse | ganz address | ganz address | 0 | 0 |
| 2. Hausnummer | ganz address | ganz address | 0 | 0 |
| 2. PLZ | ganz address | ganz address | 0 | 0 |
| 2. Ort | ganz address | ganz address | 0 | 0 |
| Sorgerecht | ganz info | ganz info | 0 | 0 |
| Kind wohnt | lesbar | ganz info | 60 | 0 |
| Übertritt von | ganz org | ganz org | 0 | 0 |
| Schulnummer | ganz info | ganz info | 0 | 0 |
| Von Jgst. | lesbar | lesbar | 60 lesbar, 0 selten | 60 lesbar, 0 selten |
| Ergebnis des Übertrittszeugnisses | lesbar | lesbar | 60 lesbar, 1 selten | 59 lesbar, 0 selten |
| Wunschpartner in der Klasse | Name | ganz info | 24 | 0 |
| Ganztag | lesbar | lesbar | 60 lesbar, 0 selten | 60 lesbar, 0 selten |
| Notizen der Schule | ganz info | ganz info | 0 | 0 |
| Rel.-Unt. | lesbar | ganz info | 60 | 0 |
| Zuzugsart | lesbar | ganz info | 4 | 0 |
| Gewünschte erste Fremdsprache | lesbar | lesbar | 60 lesbar, 0 selten | 60 lesbar, 0 selten |
| Elternteil 1 | lesbar | lesbar | 60 lesbar, 0 selten | 60 lesbar, 0 selten |
| 1. auskunftsberechtigt | lesbar | lesbar | 60 lesbar, 0 selten | 60 lesbar, 0 selten |
| Lese-/Rechtschreibstörung | lesbar | ganz info | 60 | 0 |
| Inklusionsbedarf | lesbar | ganz info | 60 | 0 |
| Besteht Kontakt zum MSD | lesbar | ganz info | 60 | 0 |
| Ansprechpartner/in und Kontaktdaten MSD | Name | ganz info | 1 | 0 |
| Schulweg | lesbar | lesbar | 60 lesbar, 0 selten | 60 lesbar, 0 selten |
| Schwimmen | lesbar | lesbar | 60 lesbar, 2 selten | 58 lesbar, 0 selten |
| Bitte geben Sie ein alternatives Wunschgymnasium an, sollte bei uns am Gymnasium kein Platz mehr frei sein. | lesbar | ganz info | 10 | 0 |
| Wurde in der Grundschule Nachteilsausgleich oder Notenschutz wegen LRS gewährt? | ganz org | ganz info | 0 | 0 |

Summe über alle 6 Läufe (ersetzte Spalten: Zellen mit Originalwert; lesbare Spalten: seltene Werte im Klartext): main 2070, jetzt 0.
- OK: Gegenprobe: main lässt Originalwerte bzw. seltene Werte stehen (der Test erkennt sie) – main 2070

## 3. Paare: Kind, Erziehungsberechtigte 1 und 2 je Zeile drei Personen
- OK: stammdaten.xlsx, person: je Zeile Kind, EB 1 (und EB 2) je eine Person (gleicher Buchstabe im Paar, verschiedene Personen) – 60/60 
- OK: stammdaten.xlsx, reversible: je Zeile Kind, EB 1 (und EB 2) je eine Person (gleicher Buchstabe im Paar, verschiedene Personen) – 60/60 
- OK: stammdaten.csv, person: je Zeile Kind, EB 1 (und EB 2) je eine Person (gleicher Buchstabe im Paar, verschiedene Personen) – 60/60 
- OK: stammdaten.csv, reversible: je Zeile Kind, EB 1 (und EB 2) je eine Person (gleicher Buchstabe im Paar, verschiedene Personen) – 60/60 

## 4. Rückbau (Excel: Wert, Zelltyp, Format; CSV: byte-gleich)
Original (Excel): 416 Zahl- und Datumszellen, davon 60 mit Datumsformat.
Schlüsseldatei (Excel): Format-Version 3, 910 Platzhalter (Name 369, Datum 55, Angabe 182, Adresse 90, Telefon 150, E-Mail 60, Einrichtung 4), davon mit Zelltyp: 119
- OK: Schlüsseldatei mit den neuen Arten hat Format-Version 3
- OK: Anonymisiert: Datumszellen sind Text-Platzhalter mit unverändertem Format (Stil) – inlineStr [DATUM-1] s=1; inlineStr [DATUM-2] s=1
- OK: Anonymisiert: kein Originalwert der ersetzten Spalten in der gemeinsamen Textliste (sharedStrings)
- OK: Rückbau Excel exakt: jede Zelle mit Wert, Zelltyp, Format (Stil) und Textläufen – 0 Abweichungen ; Urteil passend
- OK: LibreOffice öffnet die anonymisierte Datei (Datumsspalte zeigt den Platzhalter) – Nachname A,Vorname A,Vorname A2,w,[DATUM-1],[ANGABE-1],[ANGABE-2],[ANGABE-3],[ANGABE-4],naturwissenschaftlich,[ANGABE-5]
- OK: LibreOffice: Rückbau zeigt dieselben Werte wie das Original (auch Datum und Zahlen) – Öztürk,Ayşe,Ayşe Nur,w,03/14/2015,Gaziantep,Türkisch,"deutsch, türkisch",islamisch,naturwissenschaftlich,ja,"Asthma bron
- OK: Rückbau Excel: Zelle mit gemischter Formatierung hat wieder zwei Textläufe (der zweite fett) – <t>Asthma bronchiale, </t> | <rPr><b/></rPr><t>Notfallspray im Ranzen</t>
- OK: Rückbau CSV byte-gleich (nach der Byte-Order-Mark) – passend
- OK: Excel: locker umgeschriebene Platzhalter erkannt und gemeldet („gemeint vermutlich“), nicht geraten – [Datum … → [DATUM-1]; [Angabe-… → [ANGABE-1]
- OK: Excel: nach Korrektur wie vorgeschlagen Rückbau exakt (auch Zelltyp und Format) – passend
- OK: CSV: locker umgeschriebene Platzhalter erkannt und gemeldet („gemeint vermutlich“), nicht geraten – [Datum … → [DATUM-1]; [Angabe-… → [ANGABE-1]
- OK: CSV: nach Korrektur wie vorgeschlagen Rückbau exakt (auch Zelltyp und Format) – passend
- OK: CSV: Schlüsseldatei aus 2.10.0 (Format-Version 3) baut mit 2.11.0 exakt zurück – passend
- OK: Excel: Schlüsseldatei aus 2.10.0 (Format-Version 3) baut mit 2.11.0 exakt zurück – passend
- OK: Kollisions-Schutz: „[DATUM-1]“ und „[ANGABE-2]“ aus dem Original nicht vergeben, im Schlüssel als „imOriginal“ – [DATUM-2], [ANGABE-1], [DATUM-3], [ANGABE-3], Nachname A
- OK: Kollisions-Schutz: Rückbau exakt (die Wörter aus dem Original bleiben) – passend
- OK: „Berger, Tilda“ und „Quandt, Hauke“ (Spalte „Name“) sind dieselben Personen wie „Tilda Berger“ und „Hauke Quandt“ in der Titelzeile – Liste für Person A und Person B;; | Name;Klasse;Ganztag | Person A;[ANGABE];[ANGABE] | Person B;[ANGABE];[ANGABE]

## 5. Weg-Gleichheit
- OK: stammdaten.xlsx: „Erläuterung“ auf „wie bisher“, „Nachname“ auf „ganz ersetzen“ und beide zurück = nie umgestellt (byte-gleich)
- OK: stammdaten.xlsx: Schalter „Seltene Werte“ aus und wieder an = nie umgeschaltet (byte-gleich)
- OK: stammdaten.xlsx: Schalter „Seltene Werte“ aus: der seltene Wert „d“ (Geschlecht) bleibt lesbar
- OK: stammdaten.xlsx: alle Spalten „wie bisher“, „Seltene Werte“ aus = main mit allen Spalten „wie bisher“ (ohne Kopfzeile, Buchstaben neu gezählt), Kopfzeile unverändert
- OK: stammdaten.csv: „Erläuterung“ auf „wie bisher“, „Nachname“ auf „ganz ersetzen“ und beide zurück = nie umgestellt (byte-gleich)
- OK: stammdaten.csv: Schalter „Seltene Werte“ aus und wieder an = nie umgeschaltet (byte-gleich)
- OK: stammdaten.csv: Schalter „Seltene Werte“ aus: der seltene Wert „d“ (Geschlecht) bleibt lesbar
- OK: stammdaten.csv: alle Spalten „wie bisher“, „Seltene Werte“ aus = main mit allen Spalten „wie bisher“ (ohne Kopfzeile, Buchstaben neu gezählt), Kopfzeile unverändert

## 6. Kein stilles Speichern, Formeln und verbundene Zellen
- OK: Übersicht nicht bestätigt: Punkt „Die Spalten sind noch nicht geprüft“ mit Knopf „Ansehen“ – Die Spalten sind noch nicht geprüft. Im Moment gilt die Auswahl in der Übersicht „Spalten“. Ansehen
- OK: „Ansehen“ führt zur Spalten-Übersicht (Prüfen)
- OK: Nach „So übernehmen“ kommen die Fragen (Fragekarte statt Übersicht)
- OK: Bestätigt: kein Punkt „Spalten“ mehr
- OK: Tabellen-Ansicht zeigt ersetzte Spalten sichtbar als ersetzt (Kopf und Zellen) – 42 Köpfe, 2109 Zellen, „ersetzt: Name“
- OK: Punkt „Diese Spalten bleiben lesbar: …“ nennt genau die lesbaren Spalten, mit „Ansehen“ und ihren Werten – Diese Spalten bleiben lesbar: „Geschlecht“, „Gewünschter Zweig“, „1. Erziehungsberechtigte/r akad. Titel“, „Von Jgst.“, „Ergebnis des Übertrittszeugnisses“, „Ganztag“, „Gewünschte erste Fremdsprache“, „Elternteil 1“, „1. auskunftsberechtigt“, „Schulweg“, „Schwimmen“. Prüfe, ob darin etwas über eine 
  - Diese Spalten bleiben lesbar: „Geschlecht“, „Gewünschter Zweig“, „1. Erziehungsberechtigte/r akad. Titel“, „Von Jgst.“, „Ergebnis des Übertrittszeugnisses“, „Ganztag“, „Gewünschte erste Fremdsprache“, „Elternteil 1“, „1. auskunftsberechtigt“, „Schulweg“, „Schwimmen“. Prüfe, ob darin etwas über eine Person steht. Geschlecht: w 31, m 28, d 1 Gewünschter Zweig: naturwissenschaftlich 30, sprachlich 30 1. Erziehungsberechtigte/r akad. Titel: Dr. 9, Prof. Dr. 5, Dr. med. 2 Von Jgst.: 4 60 Ergebnis des Übertrittszeugnisses: 1,33 15, 2,00 15, 2,33 15, 2,66 14, 3,00 1 Ganztag: ja 30, nein 30 Gewünschte erste Fremdsprache: Englisch 20, Französisch 20, Latein 20 Elternteil 1: Mutter 40, Vater 20 1. auskunftsberechtigt: ja 48, nein 12 Schulweg: Bus 30, Fahrrad 15, zu Fuß 15 Schwimmen: Bronze 20, Seepferdchen 20, Silber 18, keins 2 Ansehen
- OK: Kein Text „null“ oder „undefined“ (Prüfen, Übersicht)
- OK: Formel in einer ersetzten Spalte: eigener Punkt mit Zelle – In einer ersetzten Spalte stehen 2 Formeln. Das Tool ersetzt sie nicht. Bitte prüfe diese Zellen in Excel und lösche die Formel, wenn darin ein Name oder eine Angabe steht. Blatt „Schüler“, Zelle A4 Blatt „Schüler“, Zelle S4
- OK: Formelergebnis mit Namen in einer Spalte „Name“ wird wie in 2.9.0 ersetzt (Namensspalten-Regel), aber gemeldet – [Schüler!A4 (Formelergebnis)] Person G
- OK: Verbundene Zellen in einer ersetzten Spalte: eigener Punkt mit Bereich – In einer ersetzten Spalte gibt es verbundene Zellen. Bitte prüfe, ob alles ersetzt ist. Blatt „Schüler“, Zelle R5:S5
- OK: Kein Text „null“ oder „undefined“ (Speichern)

## Gegenprobe „plan“ (ohne Namensspalte) und kleine Personen-Tabelle (10 Zeilen)
- OK: plan.xlsx: keine Personen-Tabelle, Vorschläge wie 2.10.0 (keine Spalte nur wegen der neuen Regeln ersetzt) – Tag=bisher, Stunde=bisher, Raum=bisher, Fach=bisher, Thema=bisher / main Tag=bisher, Stunde=bisher, Raum=bisher, Fach=bisher, Thema=bisher
- OK: plan.xlsx: Ausgabe gleich wie main (jede Zelle)
- OK: klein.csv (10 Zeilen): Regel „seltene Werte“ aus, Hinweis sichtbar – Diese Tabelle hat weniger als 20 Zeilen. Hier ersetzt das Tool seltene Werte nicht, weil die Regel dort nicht trägt. Bitte prüfe die lesbaren Spalten selbst.
- OK: klein.csv: Teil 2 gilt (Name, Klasse/Ganztag lesbar, Bemerkung ganz ersetzt) – Nachname=name, Vorname=name, Klasse=bisher, Ganztag=bisher, Bemerkung=ganz

## Sammelfrage und Schlusscheck
- OK: Sammelfrage „Diese Wörter bleiben stehen“: kein Wort aus ersetzten Zellen
- OK: Schlusscheck: kein Fund (ersetzte Zellen sind ersetzt)
- OK: Name in einer unsicheren Kopfzeile (eine Spalte), „Unsichere Treffer“ aus: ersetzt

## Guardian-Fälle zur Kopfzeile (CSV und XLSX, „Person A“ und „rückbaufähig“)
- OK: g-p5.csv, person: nirgends schwächer als main
- OK: g-p5.csv, person: Überschriften Nachname, Vorname bleiben stehen
- g-p5.csv, Person A: Zeile 1 gleich: main „Klasse 5a, Klassenleitung Frau Person A;“ / jetzt „Klasse 5a, Klassenleitung Frau Person A;“
- OK: g-p5.csv, person, „Unsichere Treffer“ aus: nirgends schwächer als main
- OK: g-p5.csv, person, „Unsichere Treffer“ aus: Überschriften Nachname, Vorname bleiben stehen
- OK: g-p5.csv, reversible: nirgends schwächer als main
- OK: g-p5.csv, reversible: Überschriften Nachname, Vorname bleiben stehen
- OK: g-p5.csv, reversible: Rückbau ergibt das Original – passend
- OK: g-p5.xlsx, person: nirgends schwächer als main
- OK: g-p5.xlsx, person: Überschriften Nachname, Vorname bleiben stehen
- OK: g-p5.xlsx, person, „Unsichere Treffer“ aus: nirgends schwächer als main
- OK: g-p5.xlsx, person, „Unsichere Treffer“ aus: Überschriften Nachname, Vorname bleiben stehen
- OK: g-p5.xlsx, reversible: nirgends schwächer als main
- OK: g-p5.xlsx, reversible: Überschriften Nachname, Vorname bleiben stehen
- OK: g-p5.xlsx, reversible: Rückbau ergibt das Original – passend
- OK: g-p1.csv, person: nirgends schwächer als main
- g-p1.csv, Person A: Zeile 1 gleich: main „Person A;Person B;Raum 12;Termin 3“ / jetzt „Person A;Person B;Raum 12;Termin 3“
- OK: g-p1.csv, person, „Unsichere Treffer“ aus: nirgends schwächer als main
- OK: g-p1.csv, reversible: nirgends schwächer als main
- OK: g-p1.csv, reversible: Rückbau ergibt das Original – passend
- OK: g-p1.xlsx, person: nirgends schwächer als main
- OK: g-p1.xlsx, person, „Unsichere Treffer“ aus: nirgends schwächer als main
- OK: g-p1.xlsx, reversible: nirgends schwächer als main
- OK: g-p1.xlsx, reversible: Rückbau ergibt das Original – passend
- OK: g-p2.csv, person: nirgends schwächer als main
- g-p2.csv, Person A: Zeile 1 gleich: main „Stunde;Frau Person A;Herr Person B“ / jetzt „Stunde;Frau Person A;Herr Person B“
- OK: g-p2.csv, person, „Unsichere Treffer“ aus: nirgends schwächer als main
- OK: g-p2.csv, reversible: nirgends schwächer als main
- OK: g-p2.csv, reversible: Rückbau ergibt das Original – passend
- OK: g-p2.xlsx, person: nirgends schwächer als main
- OK: g-p2.xlsx, person, „Unsichere Treffer“ aus: nirgends schwächer als main
- OK: g-p2.xlsx, reversible: nirgends schwächer als main
- OK: g-p2.xlsx, reversible: Rückbau ergibt das Original – passend
- OK: g-a.csv, person: nirgends schwächer als main
- OK: g-a.csv, person: Überschriften Nachname, Vorname bleiben stehen
- g-a.csv, Person A: Zeile 1 gleich: main „Nachname;Vorname;Klassenleitung Frau Person A, Tel. [TELEFON]“ / jetzt „Nachname;Vorname;Klassenleitung Frau Person A, Tel. [TELEFON]“; Zeile 2: main „Person B;Person B;5a“ / jetzt „Person B;Person B;[ANGABE]“; Zeile 3: main „Person C;Person C;5a“ / jetzt „Person C;Person C;[ANGABE]“; Zeile 4: main „Person D;Person D;5b“ / jetzt „Person D;Person D;[ANGABE]“
- OK: g-a.csv, person, „Unsichere Treffer“ aus: nirgends schwächer als main
- OK: g-a.csv, person, „Unsichere Treffer“ aus: Überschriften Nachname, Vorname bleiben stehen
- OK: g-a.csv, reversible: nirgends schwächer als main
- OK: g-a.csv, reversible: Überschriften Nachname, Vorname bleiben stehen
- OK: g-a.csv, reversible: Rückbau ergibt das Original – passend
- OK: g-a.xlsx, person: nirgends schwächer als main
- OK: g-a.xlsx, person: Überschriften Nachname, Vorname bleiben stehen
- OK: g-a.xlsx, person, „Unsichere Treffer“ aus: nirgends schwächer als main
- OK: g-a.xlsx, person, „Unsichere Treffer“ aus: Überschriften Nachname, Vorname bleiben stehen
- OK: g-a.xlsx, reversible: nirgends schwächer als main
- OK: g-a.xlsx, reversible: Überschriften Nachname, Vorname bleiben stehen
- OK: g-a.xlsx, reversible: Rückbau ergibt das Original – passend
- OK: g-b.csv, person: nirgends schwächer als main
- g-b.csv, Person A: Zeile 1 gleich: main „Kurs Mathematik;Leitung Herr Dr. Person A Brannemann;Raum 12;Termin 12.03.2025“ / jetzt „Kurs Mathematik;Leitung Herr Dr. Person A Brannemann;Raum 12;Termin 12.03.2025“
- OK: g-b.csv, person, „Unsichere Treffer“ aus: nirgends schwächer als main
- OK: g-b.csv, reversible: nirgends schwächer als main
- OK: g-b.csv, reversible: Rückbau ergibt das Original – passend
- OK: g-b.xlsx, person: nirgends schwächer als main
- OK: g-b.xlsx, person, „Unsichere Treffer“ aus: nirgends schwächer als main
- OK: g-b.xlsx, reversible: nirgends schwächer als main
- OK: g-b.xlsx, reversible: Rückbau ergibt das Original – passend
- OK: g-c.csv, person: nirgends schwächer als main
- OK: g-c.csv, person: Überschriften Name bleiben stehen
- g-c.csv, Person A: Zeile 1 gleich: main „Rückmeldung: Person A und Person B fehlen, Person C kommt später;;“ / jetzt „Rückmeldung: Person A und Person B fehlen, Person C kommt später;;“; Zeile 2: main „Person D;Klasse;Ganztag“ / jetzt „Name;Klasse;Ganztag“; Zeile 3: main „Person A;5c;ja“ / jetzt „Person A;[ANGABE];[ANGABE]“; Zeile 4: main „Person C;5a;nein“ / jetzt „Person C;[ANGABE];[ANGABE]“; Zeile 5: main „Person B;5b;ja“ / jetzt „Person B;[ANGABE];[ANGABE]“; Zeile 6: main „Person E;5b;ja“ / jetzt „Person D;[ANGABE];[ANGABE]“
- OK: g-c.csv, person, „Unsichere Treffer“ aus: nirgends schwächer als main
- OK: g-c.csv, person, „Unsichere Treffer“ aus: Überschriften Name bleiben stehen
- OK: g-c.csv, reversible: nirgends schwächer als main
- OK: g-c.csv, reversible: Überschriften Name bleiben stehen
- OK: g-c.csv, reversible: Rückbau ergibt das Original – passend
- OK: g-c.xlsx, person: nirgends schwächer als main
- OK: g-c.xlsx, person: Überschriften Name bleiben stehen
- OK: g-c.xlsx, person, „Unsichere Treffer“ aus: nirgends schwächer als main
- OK: g-c.xlsx, person, „Unsichere Treffer“ aus: Überschriften Name bleiben stehen
- OK: g-c.xlsx, reversible: nirgends schwächer als main
- OK: g-c.xlsx, reversible: Überschriften Name bleiben stehen
- OK: g-c.xlsx, reversible: Rückbau ergibt das Original – passend
- OK: g-zweig.csv, person: nirgends schwächer als main
- g-zweig.csv, Person A: Zeile 1 gleich: main „Zweig;Ottmar;Klasse 5a“ / jetzt „Zweig;Ottmar;Klasse 5a“
- OK: g-zweig.csv, person, „Unsichere Treffer“ aus: nirgends schwächer als main
- OK: g-zweig.csv, reversible: nirgends schwächer als main
- OK: g-zweig.csv, reversible: Rückbau ergibt das Original – passend
- OK: g-zweig.xlsx, person: nirgends schwächer als main
- OK: g-zweig.xlsx, person, „Unsichere Treffer“ aus: nirgends schwächer als main
- OK: g-zweig.xlsx, reversible: nirgends schwächer als main
- OK: g-zweig.xlsx, reversible: Rückbau ergibt das Original – passend

## Ersetzte Kopf-Zellen (Modus „Person A“)
- fixtures-spaltenwahl/g-a.csv: 1 Kopf-Zelle(n) geprüft und ersetzt: „Klassenleitung Frau Brunhilde Wetzlarski, Tel. 0171 2345678“
- fixtures-spaltenwahl/g-a.xlsx: 1 Kopf-Zelle(n) geprüft und ersetzt: „Klassenleitung Frau Brunhilde Wetzlarski, Tel. 0171 2345678“
- fixtures-spaltenwahl/g-b.csv: 1 Kopf-Zelle(n) geprüft und ersetzt: „Leitung Herr Dr. Ottokar Brannemann“
- fixtures-spaltenwahl/g-b.xlsx: 1 Kopf-Zelle(n) geprüft und ersetzt: „Leitung Herr Dr. Ottokar Brannemann“
- fixtures-spaltenwahl/g-p1.csv: 2 Kopf-Zelle(n) geprüft und ersetzt: „Kowalczyk“, „Bernd“
- fixtures-spaltenwahl/g-p1.xlsx: 2 Kopf-Zelle(n) geprüft und ersetzt: „Kowalczyk“, „Bernd“
- fixtures-spaltenwahl/g-p2.csv: 2 Kopf-Zelle(n) geprüft und ersetzt: „Frau Kowalczyk“, „Herr Brandauer“
- fixtures-spaltenwahl/g-p2.xlsx: 2 Kopf-Zelle(n) geprüft und ersetzt: „Frau Kowalczyk“, „Herr Brandauer“
- fixtures/mitarbeiter.xlsx: 1 Kopf-Zelle(n) geprüft und ersetzt: „Notizen zu Mehmet Yılmaz“
- Summe: 13 ersetzte Kopf-Zellen in 37 Dateien
- OK: Kopf-Zellen: keine Zelle aus reinen Spaltenkopf-Wörtern wird ersetzt (jede ersetzte Kopf-Zelle steht oben einzeln)

## Merkliste: Wahl je Überschrift
- OK: Merkliste an: Wahl je Überschrift gemerkt und beim nächsten Dokument angewendet (auch in Excel) – {"geschlecht":"ganz"}
- OK: Merkliste enthält nur die Überschrift, nie Inhalte
- OK: Merkliste aus: nichts gemerkt (neues Fenster wie vorher)

## 7. Vorhandene Tabellen-Testdateien: Personen-Tabelle ja/nein, Vorschlag je Spalte main → jetzt, nie schwächer
- fixtures-spaltenwahl/stammdaten-formel.xlsx: 53 Spalten mit Kopfzeile; Personen-Tabelle: ja (Schüler); Vorschlag main → jetzt: „Nachname“ Name; „Rufname“ Name; „Vornamen laut Geburtsurkunde“ Name; „Geschlecht“ lesbar → ganz (info); „Geburtsdatum“ ganz (date); „Geburtsort“ ganz (info); „Muttersprache“ ganz (info); „Staatsangehörigkeit“ ganz (info); „Religion“ ganz (info); „Gewünschter Zweig“ lesbar → ganz (info); „Gesundheitliche Beeinträchtigung“ ganz (info); „Erläuterung“ ganz (info); „1. Erziehungsberechtigte/r akad. Titel“ lesbar → ganz (info); „1. Erziehungsberechtigte/r Nachname“ Name; „1. Erziehungsberechtigte/r Vorname“ Name; „1. Strasse“ ganz (address); „1. Hausnummer“ ganz (address); „1. PLZ“ ganz (address); „1. Ort“ ganz (address); „1. GKZ“ ganz (info); „1. Telefon“ ganz (phone); „1. E-Mail“ ganz (email); „1. Handy“ ganz (phone); „1. Telefon für Notfälle“ ganz (phone); „1. Bemerkung Notfallnummer“ ganz (info); „2. Erziehungsberechtigte/r Nachname“ Name; „2. Erziehungsberechtigte/r Vorname“ Name; „2. Strasse“ ganz (address); „2. Hausnummer“ ganz (address); „2. PLZ“ ganz (address); „2. Ort“ ganz (address); „Sorgerecht“ ganz (info); „Kind wohnt“ lesbar → ganz (info); „Übertritt von“ ganz (org); „Schulnummer“ ganz (info); „Von Jgst.“ lesbar; „Ergebnis des Übertrittszeugnisses“ lesbar → ganz (info); „Wunschpartner in der Klasse“ Name → ganz (info); „Ganztag“ lesbar → ganz (info); „Notizen der Schule“ ganz (info); „Rel.-Unt.“ lesbar → ganz (info); „Zuzugsart“ lesbar → ganz (info); „Gewünschte erste Fremdsprache“ lesbar → ganz (info); „Elternteil 1“ lesbar → ganz (info); „1. auskunftsberechtigt“ lesbar → ganz (info); „Lese-/Rechtschreibstörung“ lesbar → ganz (info); „Inklusionsbedarf“ lesbar → ganz (info); „Besteht Kontakt zum MSD“ lesbar → ganz (info); „Ansprechpartner/in und Kontaktdaten MSD“ Name → ganz (info); „Schulweg“ lesbar → ganz (info); „Schwimmen“ lesbar → ganz (info); „Bitte geben Sie ein alternatives Wunschgymnasium an, sollte bei uns am Gymnasium kein Platz mehr frei sein.“ lesbar → ganz (info); „Wurde in der Grundschule Nachteilsausgleich oder Notenschutz wegen LRS gewährt?“ ganz (org) → ganz (info)
- OK: fixtures-spaltenwahl/stammdaten-formel.xlsx: mit den Vorschlägen nie schwächer als „wie bisher“ (kein Wort, das „wie bisher“ ersetzt, bleibt stehen)
- OK: fixtures-spaltenwahl/stammdaten-formel.xlsx: nie schwächer als main 2.10.0 (kein Wort, das main ersetzt, bleibt stehen; ohne Kopfzeile)
- fixtures-spalten/liste.xlsx: 9 Spalten mit Kopfzeile; Personen-Tabelle: ja (Teilnehmer); Vorschlag main → jetzt: „Nr.“ lesbar → ganz (info); „Anrede“ lesbar; „Nachname“ Name; „Vorname“ Name; „E-Mail“ ganz (email); „Telefon“ ganz (phone); „Kurs“ lesbar; „Termin“ lesbar; „Bemerkung“ ganz (info)
- OK: fixtures-spalten/liste.xlsx: mit den Vorschlägen nie schwächer als „wie bisher“ (kein Wort, das „wie bisher“ ersetzt, bleibt stehen)
- OK: fixtures-spalten/liste.xlsx: nie schwächer als main 2.10.0 (kein Wort, das main ersetzt, bleibt stehen; ohne Kopfzeile)
- fixtures-spalten/tabellen.xlsx: 23 Spalten mit Kopfzeile; Personen-Tabelle: ja (stark, zweikopf, einezelle); Vorschlag main → jetzt: „Nr.“ lesbar → ganz (info); „Anrede“ lesbar; „Nachname“ Name; „Vorname“ Name; „Kurs“ lesbar; „Bemerkung“ ganz (info); „Anrede“ lesbar; „Kontakt“ lesbar; „Ort“ ganz (address); „Teilnehmer / Nachname“ Name; „Teilnehmer / Vorname“ Name; „Kontakt / Telefon“ ganz (phone); „Kontakt / E-Mail“ ganz (email); „Kurs“ lesbar; „Lehrkraft“ lesbar; „Raum“ lesbar; „Name“ Name; „Kurs“ lesbar → ganz (info); „Dateiname“ lesbar; „Benutzername“ lesbar; „Kursname“ lesbar; „Name der Schule“ ganz (org); „Firmenname“ lesbar
- OK: fixtures-spalten/tabellen.xlsx: mit den Vorschlägen nie schwächer als „wie bisher“ (kein Wort, das „wie bisher“ ersetzt, bleibt stehen)
- OK: fixtures-spalten/tabellen.xlsx: nie schwächer als main 2.10.0 (kein Wort, das main ersetzt, bleibt stehen; ohne Kopfzeile)
- fixtures-spalten/tabellen-stark.csv: 6 Spalten mit Kopfzeile; Personen-Tabelle: ja; Vorschlag main → jetzt: „Nr.“ lesbar → ganz (info); „Anrede“ lesbar; „Nachname“ Name; „Vorname“ Name; „Kurs“ lesbar; „Bemerkung“ ganz (info)
- OK: fixtures-spalten/tabellen-stark.csv: mit den Vorschlägen nie schwächer als „wie bisher“ (kein Wort, das „wie bisher“ ersetzt, bleibt stehen)
- OK: fixtures-spalten/tabellen-stark.csv: nie schwächer als main 2.10.0 (kein Wort, das main ersetzt, bleibt stehen; ohne Kopfzeile)
- fixtures-spalten/tabellen-schwach.csv: 3 Spalten mit Kopfzeile; Personen-Tabelle: nein; Vorschlag main → jetzt: „Kurs“ lesbar; „Lehrkraft“ lesbar; „Raum“ lesbar
- fixtures-spalten/tabellen-zweikopf.csv: 4 Spalten mit Kopfzeile; Personen-Tabelle: ja; Vorschlag main → jetzt: „Teilnehmer / Nachname“ Name; „Vorname“ Name; „Kontakt / Telefon“ ganz (phone); „E-Mail“ ganz (email)
- OK: fixtures-spalten/tabellen-zweikopf.csv: mit den Vorschlägen nie schwächer als „wie bisher“ (kein Wort, das „wie bisher“ ersetzt, bleibt stehen)
- OK: fixtures-spalten/tabellen-zweikopf.csv: nie schwächer als main 2.10.0 (kein Wort, das main ersetzt, bleibt stehen; ohne Kopfzeile)
- fixtures-spalten/tabellen-einezelle.csv: 2 Spalten mit Kopfzeile; Personen-Tabelle: ja; Vorschlag main → jetzt: „Name“ Name; „Kurs“ lesbar → ganz (info)
- OK: fixtures-spalten/tabellen-einezelle.csv: mit den Vorschlägen nie schwächer als „wie bisher“ (kein Wort, das „wie bisher“ ersetzt, bleibt stehen)
- OK: fixtures-spalten/tabellen-einezelle.csv: nie schwächer als main 2.10.0 (kein Wort, das main ersetzt, bleibt stehen; ohne Kopfzeile)
- fixtures-spalten/tabellen-teilwort.csv: 5 Spalten mit Kopfzeile; Personen-Tabelle: nein; Vorschlag main → jetzt: „Dateiname“ lesbar; „Benutzername“ lesbar; „Kursname“ lesbar; „Name der Schule“ ganz (org); „Firmenname“ lesbar
- OK: fixtures-spalten/tabellen-teilwort.csv: mit den Vorschlägen nie schwächer als „wie bisher“ (kein Wort, das „wie bisher“ ersetzt, bleibt stehen)
- OK: fixtures-spalten/tabellen-teilwort.csv: nie schwächer als main 2.10.0 (kein Wort, das main ersetzt, bleibt stehen; ohne Kopfzeile)
- fixtures-spalten/tabellen-anrede.csv: 3 Spalten mit Kopfzeile; Personen-Tabelle: nein; Vorschlag main → jetzt: „Anrede“ lesbar; „Kontakt“ lesbar; „Ort“ ganz (address)
- OK: fixtures-spalten/tabellen-anrede.csv: mit den Vorschlägen nie schwächer als „wie bisher“ (kein Wort, das „wie bisher“ ersetzt, bleibt stehen)
- OK: fixtures-spalten/tabellen-anrede.csv: nie schwächer als main 2.10.0 (kein Wort, das main ersetzt, bleibt stehen; ohne Kopfzeile)
- fixtures-spalten/tabellen-ohnekopf.csv: keine Tabelle mit Kopfzeile
- fixtures/mitarbeiter.xlsx: 6 Spalten mit Kopfzeile; Personen-Tabelle: ja (Mitarbeiter); Vorschlag main → jetzt: „Vorname“ Name; „Nachname“ Name; „Abteilung“ lesbar → ganz (info); „Bemerkung“ ganz (info); „Formel“ lesbar → ganz (info); „Notizen zu Mehmet Yılmaz“ ganz (info)
- OK: fixtures/mitarbeiter.xlsx: mit den Vorschlägen nie schwächer als „wie bisher“ (kein Wort, das „wie bisher“ ersetzt, bleibt stehen)
- OK: fixtures/mitarbeiter.xlsx: nie schwächer als main 2.10.0 (kein Wort, das main ersetzt, bleibt stehen; ohne Kopfzeile)
- fixtures/mitarbeiter.csv: 5 Spalten mit Kopfzeile; Personen-Tabelle: ja; Vorschlag main → jetzt: „Vorname“ Name; „Nachname“ Name; „Abteilung“ lesbar → ganz (info); „E-Mail“ ganz (email); „Bemerkung“ ganz (info)
- OK: fixtures/mitarbeiter.csv: mit den Vorschlägen nie schwächer als „wie bisher“ (kein Wort, das „wie bisher“ ersetzt, bleibt stehen)
- OK: fixtures/mitarbeiter.csv: nie schwächer als main 2.10.0 (kein Wort, das main ersetzt, bleibt stehen; ohne Kopfzeile)
- fixtures/meta-tabelle.xlsx: 2 Spalten mit Kopfzeile; Personen-Tabelle: nein; Vorschlag main → jetzt: „Thema“ lesbar; „Ansprechpartnerin“ lesbar
- fixtures/bilder-excel.xlsx: keine Tabelle mit Kopfzeile
- fixtures/ziffern.xlsx: keine Tabelle mit Kopfzeile
- fixtures/ziffern.csv: 2 Spalten mit Kopfzeile; Personen-Tabelle: nein; Vorschlag main → jetzt: „Nr“ lesbar; „Text“ lesbar
- fixtures/einrichtung.xlsx: keine Tabelle mit Kopfzeile
- fixtures/einrichtung.csv: 2 Spalten mit Kopfzeile; Personen-Tabelle: nein; Vorschlag main → jetzt: „Text“ lesbar; „Ort“ ganz (address)
- OK: fixtures/einrichtung.csv: mit den Vorschlägen nie schwächer als „wie bisher“ (kein Wort, das „wie bisher“ ersetzt, bleibt stehen)
- OK: fixtures/einrichtung.csv: nie schwächer als main 2.10.0 (kein Wort, das main ersetzt, bleibt stehen; ohne Kopfzeile)
- fixtures/a2-risiko.csv: 3 Spalten mit Kopfzeile; Personen-Tabelle: ja; Vorschlag main → jetzt: „Anrede“ lesbar; „Name“ Name; „Fach“ lesbar → ganz (info)
- OK: fixtures/a2-risiko.csv: mit den Vorschlägen nie schwächer als „wie bisher“ (kein Wort, das „wie bisher“ ersetzt, bleibt stehen)
- OK: fixtures/a2-risiko.csv: nie schwächer als main 2.10.0 (kein Wort, das main ersetzt, bleibt stehen; ohne Kopfzeile)
- fixtures/a2-uebertragung.csv: 3 Spalten mit Kopfzeile; Personen-Tabelle: ja; Vorschlag main → jetzt: „Anrede“ lesbar; „Name“ Name; „Notiz“ ganz (info)
- OK: fixtures/a2-uebertragung.csv: mit den Vorschlägen nie schwächer als „wie bisher“ (kein Wort, das „wie bisher“ ersetzt, bleibt stehen)
- OK: fixtures/a2-uebertragung.csv: nie schwächer als main 2.10.0 (kein Wort, das main ersetzt, bleibt stehen; ohne Kopfzeile)
- fixtures/vertausch-1.csv: 3 Spalten mit Kopfzeile; Personen-Tabelle: ja; Vorschlag main → jetzt: „Rolle“ lesbar → ganz (info); „Vorname“ Name; „Nachname“ Name
- OK: fixtures/vertausch-1.csv: mit den Vorschlägen nie schwächer als „wie bisher“ (kein Wort, das „wie bisher“ ersetzt, bleibt stehen)
- OK: fixtures/vertausch-1.csv: nie schwächer als main 2.10.0 (kein Wort, das main ersetzt, bleibt stehen; ohne Kopfzeile)
- fixtures/vertausch-1.xlsx: 3 Spalten mit Kopfzeile; Personen-Tabelle: ja (Notiz); Vorschlag main → jetzt: „Rolle“ lesbar → ganz (info); „Vorname“ Name; „Nachname“ Name
- OK: fixtures/vertausch-1.xlsx: mit den Vorschlägen nie schwächer als „wie bisher“ (kein Wort, das „wie bisher“ ersetzt, bleibt stehen)
- OK: fixtures/vertausch-1.xlsx: nie schwächer als main 2.10.0 (kein Wort, das main ersetzt, bleibt stehen; ohne Kopfzeile)
- fixtures/vertausch-2.csv: 3 Spalten mit Kopfzeile; Personen-Tabelle: ja; Vorschlag main → jetzt: „Rolle“ lesbar → ganz (info); „Vorname“ Name; „Nachname“ Name
- OK: fixtures/vertausch-2.csv: mit den Vorschlägen nie schwächer als „wie bisher“ (kein Wort, das „wie bisher“ ersetzt, bleibt stehen)
- OK: fixtures/vertausch-2.csv: nie schwächer als main 2.10.0 (kein Wort, das main ersetzt, bleibt stehen; ohne Kopfzeile)
- fixtures/vertausch-2.xlsx: 3 Spalten mit Kopfzeile; Personen-Tabelle: ja (Notiz); Vorschlag main → jetzt: „Rolle“ lesbar → ganz (info); „Vorname“ Name; „Nachname“ Name
- OK: fixtures/vertausch-2.xlsx: mit den Vorschlägen nie schwächer als „wie bisher“ (kein Wort, das „wie bisher“ ersetzt, bleibt stehen)
- OK: fixtures/vertausch-2.xlsx: nie schwächer als main 2.10.0 (kein Wort, das main ersetzt, bleibt stehen; ohne Kopfzeile)
- fixtures/kollision.csv: 2 Spalten mit Kopfzeile; Personen-Tabelle: nein; Vorschlag main → jetzt: „Nr“ lesbar; „Text“ lesbar
- fixtures/endungen.csv: 2 Spalten mit Kopfzeile; Personen-Tabelle: nein; Vorschlag main → jetzt: „Nr“ lesbar; „Text“ lesbar
- fixtures/einrichtung-gross.csv: 2 Spalten mit Kopfzeile; Personen-Tabelle: nein; Vorschlag main → jetzt: „Nr“ lesbar; „Text“ lesbar
- fixtures/einrichtung-gross.xlsx: keine Tabelle mit Kopfzeile
- fixtures/grossform-mit.csv: 2 Spalten mit Kopfzeile; Personen-Tabelle: nein; Vorschlag main → jetzt: „Nr“ lesbar; „Text“ lesbar
- fixtures/grossform-einzig.csv: 2 Spalten mit Kopfzeile; Personen-Tabelle: nein; Vorschlag main → jetzt: „Nr“ lesbar; „Text“ lesbar
- fixtures-anzeige/mehrblatt.xlsx: 1 Spalten mit Kopfzeile; Personen-Tabelle: nein; Vorschlag main → jetzt: „Notiz“ ganz (info)
- OK: fixtures-anzeige/mehrblatt.xlsx: mit den Vorschlägen nie schwächer als „wie bisher“ (kein Wort, das „wie bisher“ ersetzt, bleibt stehen)
- OK: fixtures-anzeige/mehrblatt.xlsx: nie schwächer als main 2.10.0 (kein Wort, das main ersetzt, bleibt stehen; ohne Kopfzeile)
- fixtures-bedienung/bedienung.xlsx: keine Tabelle mit Kopfzeile
- fixtures-reste/reste.xlsx: keine Tabelle mit Kopfzeile
- fixtures-traeger/anmeldung.xlsx: keine Tabelle mit Kopfzeile
- fixtures-traeger/anmeldung.csv: keine Tabelle mit Kopfzeile
- fixtures-traeger/einrichtung-person.xlsx: 2 Spalten mit Kopfzeile; Personen-Tabelle: ja (Kontakte); Vorschlag main → jetzt: „Einrichtung“ ganz (org); „Ansprechpartner“ Name → ganz (info)
- OK: fixtures-traeger/einrichtung-person.xlsx: mit den Vorschlägen nie schwächer als „wie bisher“ (kein Wort, das „wie bisher“ ersetzt, bleibt stehen)
- OK: fixtures-traeger/einrichtung-person.xlsx: nie schwächer als main 2.10.0 (kein Wort, das main ersetzt, bleibt stehen; ohne Kopfzeile)
- fixtures-traeger/einrichtung-person.csv: 2 Spalten mit Kopfzeile; Personen-Tabelle: ja; Vorschlag main → jetzt: „Einrichtung“ ganz (org); „Ansprechpartner“ Name → ganz (info)
- OK: fixtures-traeger/einrichtung-person.csv: mit den Vorschlägen nie schwächer als „wie bisher“ (kein Wort, das „wie bisher“ ersetzt, bleibt stehen)
- OK: fixtures-traeger/einrichtung-person.csv: nie schwächer als main 2.10.0 (kein Wort, das main ersetzt, bleibt stehen; ohne Kopfzeile)
- fixtures-traeger/nachbarn.xlsx: keine Tabelle mit Kopfzeile
- fixtures-traeger/nachbarn.csv: keine Tabelle mit Kopfzeile
- fixtures-traeger/nachbarn-offen.xlsx: keine Tabelle mit Kopfzeile
- fixtures-traeger/nachbarn-offen.csv: keine Tabelle mit Kopfzeile
- fixtures-traeger/einrichtungen-auto.xlsx: keine Tabelle mit Kopfzeile
- fixtures-pfade/pfade-ueblich.xlsx: 2 Spalten mit Kopfzeile; Personen-Tabelle: ja (Liste Kühnel); Vorschlag main → jetzt: „Name“ Name; „Bemerkung“ ganz (info)
- OK: fixtures-pfade/pfade-ueblich.xlsx: mit den Vorschlägen nie schwächer als „wie bisher“ (kein Wort, das „wie bisher“ ersetzt, bleibt stehen)
- OK: fixtures-pfade/pfade-ueblich.xlsx: nie schwächer als main 2.10.0 (kein Wort, das main ersetzt, bleibt stehen; ohne Kopfzeile)
- fixtures-pfade/pfade-unueblich.xlsx: 2 Spalten mit Kopfzeile; Personen-Tabelle: ja (Liste Kühnel); Vorschlag main → jetzt: „Name“ Name; „Bemerkung“ ganz (info)
- OK: fixtures-pfade/pfade-unueblich.xlsx: mit den Vorschlägen nie schwächer als „wie bisher“ (kein Wort, das „wie bisher“ ersetzt, bleibt stehen)
- OK: fixtures-pfade/pfade-unueblich.xlsx: nie schwächer als main 2.10.0 (kein Wort, das main ersetzt, bleibt stehen; ohne Kopfzeile)
- fixtures-pfade/pfade-hauptteil.xlsx: 2 Spalten mit Kopfzeile; Personen-Tabelle: ja (Liste Kühnel); Vorschlag main → jetzt: „Name“ Name; „Bemerkung“ ganz (info)
- OK: fixtures-pfade/pfade-hauptteil.xlsx: mit den Vorschlägen nie schwächer als „wie bisher“ (kein Wort, das „wie bisher“ ersetzt, bleibt stehen)
- OK: fixtures-pfade/pfade-hauptteil.xlsx: nie schwächer als main 2.10.0 (kein Wort, das main ersetzt, bleibt stehen; ohne Kopfzeile)
- fixtures-pfade/pfade-phase0.xlsx: 2 Spalten mit Kopfzeile; Personen-Tabelle: ja (Liste); Vorschlag main → jetzt: „Name“ Name; „Vorname“ Name
- OK: fixtures-pfade/pfade-phase0.xlsx: mit den Vorschlägen nie schwächer als „wie bisher“ (kein Wort, das „wie bisher“ ersetzt, bleibt stehen)
- OK: fixtures-pfade/pfade-phase0.xlsx: nie schwächer als main 2.10.0 (kein Wort, das main ersetzt, bleibt stehen; ohne Kopfzeile)
- fixtures-pfade/pfade-gegenprobe.xlsx: 2 Spalten mit Kopfzeile; Personen-Tabelle: ja (Teilnehmer); Vorschlag main → jetzt: „Name“ Name; „Rolle“ lesbar
- OK: fixtures-pfade/pfade-gegenprobe.xlsx: mit den Vorschlägen nie schwächer als „wie bisher“ (kein Wort, das „wie bisher“ ersetzt, bleibt stehen)
- OK: fixtures-pfade/pfade-gegenprobe.xlsx: nie schwächer als main 2.10.0 (kein Wort, das main ersetzt, bleibt stehen; ohne Kopfzeile)

- OK: 0 Anfragen nach außen (alle Seiten dieses Laufs)

Ergebnis: 210 von 210 Prüfungen bestanden
