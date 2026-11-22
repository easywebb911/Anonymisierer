# Bilder und Bildbeschreibungen (Version 2.2): Tests

Chromium headless, Start per file://. Testdokumente: tests/make-bilder.mjs (alle Namen erfunden):
- „Wiebke Sandmann“ steht NUR im Alt-Text eines Bildes, „Torben Kleinschmidt“ NUR im Titel eines Bildes (Word: in der Kopfzeile), „Sabine Keller“ im Text.
- Bilder: PNG im Text, GIF in einer Tabelle (Excel: Bilder an Zellen), JPEG in der Kopfzeile (Excel: Bild an Zelle B4, GIF in der Kopf-/Fußzeile), EMF (nicht anzeigbar), verknüpftes Bild (Pfad außerhalb der Datei), SVG mit PNG-Ersatzbild.

## Content-Security-Policy
- OK: img-src erlaubt nur blob: (lokale Vorschauen), sonst nichts – img-src blob:
- OK: Alle übrigen Regeln unverändert streng (default-src, connect-src, frame-src, object-src, worker-src: none)

## Ziel (a): Namen, die nur in Bildbeschreibungen stehen, sind im Export ersetzt
Ausgabedatei entpackt, ALLE Teile (XML, VML, Bilder, Verweise) nach den Testnamen durchsucht (Wortteile einzeln).

| Datei | Modus | Version 2.1: Funde | Version 2.2: Funde |
|---|---|---|---|
| bilder-word.docx | „Person A“ | nicht geprüft | 0 |
- OK: bilder-word.docx, person: keine Testnamen mehr in irgendeinem Teil der Ausgabe
| bilder-word.docx | rückbaufähig | nicht geprüft | 0 |
- OK: bilder-word.docx, reversible: keine Testnamen mehr in irgendeinem Teil der Ausgabe
| bilder-excel.xlsx | „Person A“ | nicht geprüft | 0 |
- OK: bilder-excel.xlsx, person: keine Testnamen mehr in irgendeinem Teil der Ausgabe
| bilder-excel.xlsx | rückbaufähig | nicht geprüft | 0 |
- OK: bilder-excel.xlsx, reversible: keine Testnamen mehr in irgendeinem Teil der Ausgabe

## Ziel (b): Jedes Bild vor dem Speichern sehen – Liste, Kacheln, Sperre
### bilder-word.docx
- OK: Offener Punkt „Bilder“ mit Anzahl und Knopf „Ansehen“ – „6 Bilder im Dokument“
- OK: Hinweis „Das Tool ändert Bilder nicht …“ steht in der Zeile – 6 Bilder im Dokument. Das Tool ändert Bilder nicht. Steht auf einem Bild ein Name oder ein Logo, entferne es vorher in Word. Ansehen
- OK: Häkchen ist gesperrt, bevor die Liste geöffnet wurde
- OK: Speichern blockiert, solange die Bilder nicht angesehen sind – Speichern blockiert – bitte zuerst die Punkte oben ansehen und „Ich habe alle Punkte gesehen und speichere so.“ abhaken.
- OK: Liste öffnet auf derselben Seite (kein neues Fenster), eine Kachel je Bild – 6 Kacheln
  - Kachel 1: Größer anzeigen Bild 1 · PNG Fundort: im Text bei „Foto vom Empfang:“ Beschreibung (Alt-Text): „Foto von Frau Wiebke Sandmann am Empfang“ Die Beschreibung wird wie Text geprüft und ersetzt (Schritt 2). [Vorschau angezeigt, 48 px breit, Quelle blob:…]
  - Kachel 2: Größer anzeigen Bild 2 · GIF Fundort: Tabelle bei „Zeichen der Abteilung“ Beschreibung (Alt-Text): „Abteilungszeichen“ Die Beschreibung wird wie Text geprüft und ersetzt (Schritt 2). [Vorschau angezeigt, 1 px breit, Quelle blob:…]
  - Kachel 3: EMF Kann hier nicht angezeigt werden. Bitte in Word ansehen. Bild 3 · EMF Fundort: im Text bei „Grafik aus der Präsentation:“ Keine Beschreibung. [Platzhalter]
  - Kachel 4: Verknüpftes Bild verknüpft, nicht in der Datei Bild 4 · verknüpft Fundort: im Text bei „Plan aus dem Netzlaufwerk:“ Beschreibung (Alt-Text): „Lageplan“ Die Beschreibung wird wie Text geprüft und ersetzt (Schritt 2). [Platzhalter]
  - Kachel 5: Größer anzeigen Bild 5 · SVG Fundort: im Text bei „Logo als Vektorgrafik:“ Keine Beschreibung. [Vorschau angezeigt, 80 px breit, Quelle blob:…]
  - Kachel 6: Größer anzeigen Bild 6 · JPEG Fundort: Kopfzeile bei „Interne Notiz“ Titel: „Porträt von Herrn Torben Kleinschmidt“ Die Beschreibung wird wie Text geprüft und ersetzt (Schritt 2). [Vorschau angezeigt, 48 px breit, Quelle blob:…]
- OK: PNG, JPEG, GIF und SVG werden als kleine Vorschau gezeigt (nur blob:-Adressen) – PNG, GIF, SVG, JPEG
- OK: EMF: Platzhalter-Kachel mit Typ und „Kann hier nicht angezeigt werden.“ – EMF Kann hier nicht angezeigt werden. Bitte in Word ansehen. Bild 3 · EMF Fundort: im Text
- OK: Verknüpftes Bild: eigene Kachel „verknüpft, nicht in der Datei“, Pfad wird nicht geladen – Verknüpftes Bild verknüpft, nicht in der Datei Bild 4 · verknüpft Fundort: im Te
- OK: SVG nie als Markup eingebettet: kein <svg> in der Liste, SVG nur als <img>
- OK: Fundort in einfacher Sprache und Beschreibung (Alt-Text, Titel) je Bild – Fundort: im Text bei „Foto vom Empfang:“ | Fundort: Kopfzeile bei „Interne Notiz“
- OK: Word: Fundorte Text („im Text bei …“), Tabelle, Kopfzeile
- OK: „Größer anzeigen“ vergrößert die Vorschau auf derselben Seite – 104 → 884 px
- OK: Nach dem Öffnen ist das Häkchen wählbar; Speichern bleibt bis zum Haken blockiert
- OK: Mit dem einen Häkchen wird gespeichert – Gespeichert: anonymisiert_dokument.docx – Schlusscheck ohne Fund.
- OK: Mit geöffneter Liste und Haken wird gespeichert – Gespeichert: anonymisiert_dokument.docx – Schlusscheck ohne Fund.
- OK: Gespeicherte Datei (über die Oberfläche): keine Testnamen in allen Teilen
- OK: Bildinhalte unverändert (Bilder ohne Bildangaben byte-gleich zum Original) – 6 von 6 Bilddateien byte-gleich
- OK: Nach „Nächstes Dokument“: keine Vorschau mehr im Speicher (blob:-Adressen freigegeben, keine Bilder auf der Seite) – vorher ladbar: geladen; nachher 4 von 4 Adressen ungültig
### bilder-excel.xlsx
- OK: Offener Punkt „Bilder“ mit Anzahl und Knopf „Ansehen“ – „6 Bilder im Dokument“
- OK: Hinweis „Das Tool ändert Bilder nicht …“ steht in der Zeile – 6 Bilder im Dokument. Das Tool ändert Bilder nicht. Steht auf einem Bild ein Name oder ein Logo, entferne es vorher in Excel. Ansehen
- OK: Häkchen ist gesperrt, bevor die Liste geöffnet wurde
- OK: Speichern blockiert, solange die Bilder nicht angesehen sind – Speichern blockiert – bitte zuerst die Punkte oben ansehen und „Ich habe alle Punkte gesehen und speichere so.“ abhaken.
- OK: Liste öffnet auf derselben Seite (kein neues Fenster), eine Kachel je Bild – 6 Kacheln
  - Kachel 1: Größer anzeigen Bild 1 · PNG Fundort: Blatt „Teilnehmer“, Zelle A4 Beschreibung (Alt-Text): „Foto von Frau Wiebke Sandmann am Empfang“ Die Beschreibung wird wie Text geprüft und ersetzt (Schritt 2). [Vorschau angezeigt, 48 px breit, Quelle blob:…]
  - Kachel 2: Größer anzeigen Bild 2 · JPEG Fundort: Blatt „Teilnehmer“, Zelle B4 Titel: „Porträt von Herrn Torben Kleinschmidt“ Die Beschreibung wird wie Text geprüft und ersetzt (Schritt 2). [Vorschau angezeigt, 48 px breit, Quelle blob:…]
  - Kachel 3: EMF Kann hier nicht angezeigt werden. Bitte in Excel ansehen. Bild 3 · EMF Fundort: Blatt „Teilnehmer“, Zelle C4 Keine Beschreibung. [Platzhalter]
  - Kachel 4: Verknüpftes Bild verknüpft, nicht in der Datei Bild 4 · verknüpft Fundort: Blatt „Teilnehmer“, Zelle D4 Beschreibung (Alt-Text): „Lageplan“ Die Beschreibung wird wie Text geprüft und ersetzt (Schritt 2). [Platzhalter]
  - Kachel 5: Größer anzeigen Bild 5 · SVG Fundort: Blatt „Teilnehmer“, Zelle E4 Keine Beschreibung. [Vorschau angezeigt, 80 px breit, Quelle blob:…]
  - Kachel 6: Größer anzeigen Bild 6 · GIF Fundort: Kopf-/Fußzeile, Blatt „Teilnehmer“ Titel: „Kopfzeilenzeichen“ Die Beschreibung wird wie Text geprüft und ersetzt (Schritt 2). [Vorschau angezeigt, 1 px breit, Quelle blob:…]
- OK: PNG, JPEG, GIF und SVG werden als kleine Vorschau gezeigt (nur blob:-Adressen) – PNG, JPEG, SVG, GIF
- OK: EMF: Platzhalter-Kachel mit Typ und „Kann hier nicht angezeigt werden.“ – EMF Kann hier nicht angezeigt werden. Bitte in Excel ansehen. Bild 3 · EMF Fundort: Blatt 
- OK: Verknüpftes Bild: eigene Kachel „verknüpft, nicht in der Datei“, Pfad wird nicht geladen – Verknüpftes Bild verknüpft, nicht in der Datei Bild 4 · verknüpft Fundort: Blatt
- OK: SVG nie als Markup eingebettet: kein <svg> in der Liste, SVG nur als <img>
- OK: Fundort in einfacher Sprache und Beschreibung (Alt-Text, Titel) je Bild – Fundort: Blatt „Teilnehmer“, Zelle A4 | Fundort: Blatt „Teilnehmer“, Zelle B4
- OK: Excel: Fundorte Blattname mit Zelle und Kopf-/Fußzeile
- OK: „Größer anzeigen“ vergrößert die Vorschau auf derselben Seite – 104 → 884 px
- OK: Nach dem Öffnen ist das Häkchen wählbar; Speichern bleibt bis zum Haken blockiert
- OK: Mit dem einen Häkchen wird gespeichert – Gespeichert: anonymisiert_tabelle.xlsx – Schlusscheck ohne Fund.
- OK: Mit geöffneter Liste und Haken wird gespeichert – Gespeichert: anonymisiert_tabelle.xlsx – Schlusscheck ohne Fund.
- OK: Gespeicherte Datei (über die Oberfläche): keine Testnamen in allen Teilen
- OK: Bildinhalte unverändert (Bilder ohne Bildangaben byte-gleich zum Original) – 6 von 6 Bilddateien byte-gleich
- OK: Nach „Nächstes Dokument“: keine Vorschau mehr im Speicher (blob:-Adressen freigegeben, keine Bilder auf der Seite) – vorher ladbar: geladen; nachher 4 von 4 Adressen ungültig

## Bildbeschreibungen in der Prüfansicht
- OK: Eigene Textabschnitte, gekennzeichnet als „Bildbeschreibung“ – Bildbeschreibung | Bildbeschreibung | Bildbeschreibung | Bildbeschreibung
- OK: Namen in Bildbeschreibungen werden erkannt und markiert – Wiebke Sandmann | Torben Kleinschmidt
- OK: Von Hand markiertes Wort in einer Bildbeschreibung wird im Export ersetzt (auch im Attribut descr) – descr="Foto von Frau Person B am Empfang", descr="Person C", descr="Lageplan"
- OK: Treffer nur in der Bildbeschreibung ausgeschaltet (Name sonst im Text ersetzt): Schlusscheck meldet ihn mit Fundstelle – „Kowalski“ steht noch in: Bildbeschreibungbestätigter Name · „…Foto: Kursleiterin Marta Kowalski mit Gruppe…“Ersetzen | „Kowalski“ steht noch in: Textbestätigter Name · „…to 1 Foto: Kursleiterin Marta Kowalski mit Gruppe Titel Lehrkraft Be…“Als Namen übernehmen

## Kreislauf (rückbaufähig) mit Namen in Bildbeschreibungen
- OK: bilder-word.docx: Kreislauf exakt (alle Texte und alle Bildbeschreibungen wie im Original) – 9 Textstücke, 7 Beschreibungs-Attribute geprüft
- OK: bilder-excel.xlsx: Kreislauf exakt (alle Texte und alle Bildbeschreibungen wie im Original) – 7 Textstücke, 4 Beschreibungs-Attribute geprüft
- OK: bilder-word.docx → .txt: Rückbau setzt die Namen in den Bildbeschreibungs-Zeilen exakt zurück – [Bildbeschreibung (Alt-Text)] Foto von Frau Wiebke Sandmann am Empfang | [Bildbeschreibung (Alt-Text)] Abteilungszeichen
- OK: bilder-excel.xlsx → .txt: Rückbau setzt die Namen in den Bildbeschreibungs-Zeilen exakt zurück – [Bildbeschreibung (Alt-Text) – Blatt „Teilnehmer“] Foto von Frau Wiebke Sandmann am Empfang | [Bildbeschreibung (Titel) – Blatt „Teilnehmer“] Porträt von Herrn Torben Kleinschmidt

## Doppellauf
- OK: bilder-word.docx: zwei Läufe („Person A“) byte-gleich – e50e8a415f6a460b
- OK: bilder-word.docx: zwei Läufe (rückbaufähig) inhaltlich gleich (Kennung ausgenommen)
- OK: bilder-excel.xlsx: zwei Läufe („Person A“) byte-gleich – 2df27c43617fd90a
- OK: bilder-excel.xlsx: zwei Läufe (rückbaufähig) inhaltlich gleich (Kennung ausgenommen)

## PDF-Eingabe unverändert
- OK: PDF: Hinweis „Bilder bleiben nicht erhalten“ wie bisher (unter „Details“), keine Zeile „Bilder“

## Breiten (Liste geöffnet)
- OK: 390 px: kein waagrechtes Scrollen, alle Kacheln im Bild – Seite 390/390 px, Kacheln 16–374 px
- OK: 1280 px: kein waagrechtes Scrollen, alle Kacheln im Bild – Seite 1280/1280 px, Kacheln 190–1090 px
- OK: 1920 px: kein waagrechtes Scrollen, alle Kacheln im Bild – Seite 1920/1920 px, Kacheln 510–1410 px

Prüfungen: 58 von 58 bestanden.
Netzwerkanfragen außer lokalen Dateien: 0.
