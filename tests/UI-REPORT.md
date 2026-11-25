# Geführte Bedienung (Version 2): Oberflächen-Tests

Chromium headless, Start per file://. Alle Namen in den Testdateien sind erfunden.

## Durchlauf 1: anonymisieren, rückbaufähig (kurse.docx)
- OK: „Weiter zum Prüfen“ ist ohne Antwort und Datei gesperrt
- OK: … und mit Antwort, aber ohne Datei weiter gesperrt
- OK: … mit Antwort und Datei aktiv
- OK: Alle 12 Fragen mit Taste J beantwortet – Keine Frage offen
- OK: „2 Datei speichern“ ist vor dem Schlüssel gesperrt
- OK: Datei gespeichert – Gespeichert: anonymisiert_A6V3.docx – Schlusscheck ohne Fund.
- Details nach dem Speichern:  ·  ·  ·  ·  · ; offene Punkte: 1
- OK: In jedem Schritt genau ein Bildschirm und genau ein Hauptknopf – Start: Bildschirm start, Hauptknopf „Dokument anonymisieren
        Namen durch Platzhalter ersetzen, bevor die Datei an eine KI geht.“ → Datei (leer): Bildschirm a1, Hauptknopf „Weiter zum Prüfen“ → Datei (geladen): Bildschirm a1, Hauptknopf „Weiter zum Prüfen“ → Prüfen: Bildschirm a2, Hauptknopf „Weiter zum Speichern“ → Speichern (vor dem Schlüssel): Bildschirm a3, Hauptknopf „1 Schlüssel speichern“ → Speichern (nach dem Schlüssel): Bildschirm a3, Hauptknopf „2 Datei speichern“ → Gespeichert: Bildschirm a3, Hauptknopf „Nächstes Dokument“
- OK: Keine JavaScript-Fehler

## Durchlauf 2: anonymisieren, einfach (protokoll.txt)
- OK: Kein Schlüssel-Knopf im Modus „Person A“
- OK: Datei gespeichert (nach „bewusst stehen lassen“ der bekannten Restfunde) – Gespeichert: anonymisiert_text.txt – mit bestätigten Restfunden.
- OK: „Hinweis für die KI kopieren“ kopiert den Satz passend zum Modus – Der Text enthält Platzhalter wie „Person A“, „Einrichtung A“, „[E-MAIL]“, „[WEBADRESSE]“ und „[KONTO]“ anstelle echter Namen, Einrichtungen, Kontaktdaten, Webadressen und Konten. Diese Platzhalter bitte unverändert lassen. Zeige mir nur die Fehler, schreibe den Text nicht neu.
- OK: In jedem Schritt genau ein Bildschirm und genau ein Hauptknopf – Start: Bildschirm start, Hauptknopf „Dokument anonymisieren
        Namen durch Platzhalter ersetzen, bevor die Datei an eine KI geht.“ → Datei: Bildschirm a1, Hauptknopf „Weiter zum Prüfen“ → Prüfen: Bildschirm a2, Hauptknopf „Weiter zum Speichern“ → Speichern: Bildschirm a3, Hauptknopf „Datei speichern“ → Gespeichert: Bildschirm a3, Hauptknopf „Nächstes Dokument“
- OK: „Nächstes Dokument“ führt zum Start und hinterlässt keinen Rest – Bildschirm start; Dokument false; Antwort gewählt false; Reste im Seitentext: keine
- OK: Keine JavaScript-Fehler

## Durchlauf 3: zurückbauen (Datei und Schlüssel aus Durchlauf 1)
- OK: „Weiter zum Prüfen“ ohne beide Dateien gesperrt
- OK: … mit nur einer Datei weiter gesperrt
- OK: Hinweis „Autor und Kommentar-Autoren kommen nicht zurück“ auf dem Speichern-Bildschirm
- OK: Echte Namen sind zurück
- OK: In jedem Schritt genau ein Bildschirm und genau ein Hauptknopf – Start: Bildschirm start, Hauptknopf „Dokument anonymisieren
        Namen durch Platzhalter ersetzen, bevor die Datei an eine KI geht.“ → Dateien (leer): Bildschirm r1, Hauptknopf „Weiter zum Prüfen“ → Dateien (geladen): Bildschirm r1, Hauptknopf „Weiter zum Prüfen“ → Prüfen: Bildschirm r2, Hauptknopf „Weiter zum Speichern“ → Speichern: Bildschirm r3, Hauptknopf „Wiederhergestellte Datei speichern (.docx)“ → Gespeichert: Bildschirm r3, Hauptknopf „Nächstes Dokument“
- OK: „Nächstes Dokument“ führt zum Start
- OK: Keine JavaScript-Fehler

## Sperren halten das Speichern weiter auf
- Offene Punkte: 12 Fragen sind noch offen. Ohne Antwort bleibt jede Stelle so, wie sie im Moment ist. Beantworten | 2 Bilder im Dokument. Das Tool ändert Bilder nicht. Steht auf einem Bild ein Name oder ein Logo, entferne es vorher in Word. Ansehen
- OK: Offene Punkte ohne Häkchen: Speichern blockiert – Speichern blockiert – bitte zuerst die Punkte oben ansehen und „Ich habe alle Punkte gesehen und speichere so.“ abhaken.
- OK: Häkchen ist gesperrt, solange die Bilderliste nicht geöffnet wurde
- OK: Nach dem Öffnen der Bilderliste ist das Häkchen wählbar
- OK: Offene Fragen blockieren weiter ohne Häkchen (Firmenname seit 2.8.0 ersetzt, kein Schlusscheck-Fund mehr) – Speichern blockiert – bitte zuerst die Punkte oben ansehen und „Ich habe alle Punkte gesehen und speichere so.“ abhaken.
- OK: Offene Punkte blockieren auch „Als .txt speichern“ – Speichern blockiert – bitte zuerst die Punkte oben ansehen und „Ich habe alle Punkte gesehen und speichere so.“ abhaken.
- OK: Nach einer Änderung der Treffer fällt das Häkchen zurück
- OK: … und Speichern ist wieder blockiert – Speichern blockiert – bitte zuerst die Punkte oben ansehen und „Ich habe alle Punkte gesehen und speichere so.“ abhaken.
- OK: Mit Häkchen wird gespeichert – Gespeichert: anonymisiert_dokument.docx – Schlusscheck ohne Fund.
- OK: Fehlende Schlüsseldatei blockiert auch „Als .docx speichern“ – Bitte zuerst „1 Schlüssel speichern“. Ohne Schlüsseldatei ist kein Rückbau möglich.
- OK: „2 Datei speichern“ gesperrt, solange der Schlüssel fehlt
- OK: Nach dem Schlüssel ist „2 Datei speichern“ frei
- OK: Nach einer Änderung der Treffer ist der Schlüssel veraltet: „2 Datei speichern“ wieder gesperrt
- OK: Rückbau-Auffälligkeit verlangt Bestätigung: „Weiter“ gesperrt
- OK: Nach der Bestätigung ist „Weiter“ frei
- OK: Schlüsseldatei passt nicht: „Weiter zum Speichern“ gesperrt, nichts wird erzeugt

## Fragekarte, Tasten J/N, Markieren
- OK: Taste J wirkt nicht auf dem Bildschirm „Datei“
- OK: Keine Frage zu „Montag“ (Regel b2), alle Vorkommen bleiben stehen – Fragen zu: Familienzentrum Sonnenblume, Lieder, Kirchbichler, Yoga, Tesfamariam, Ton, Brzęczek, Sonnleitner, Fuchs, Gisela Musterfrau, Bernd Beispielmann, Familienzentrum Sonnenblume
- OK: Taste J (Ja) schaltet alle Stellen der Frage an – true,true
- OK: Taste N schaltet die Stellen wieder aus – false,false
- OK: Taste J wirkt nicht, wenn ein Eingabefeld (Auswahlliste) den Fokus hat
- OK: Knopf „Als Name markieren“ erscheint direkt neben der Stelle – Abstand 17 px
- OK: Von Hand markierter Name wird überall ersetzt (auch „Uchendus“, „UCHENDU“) – 4 Vorkommen im Original, 0 im Ergebnis

## Zurück und Weiter ohne Verlust
- OK: Antwort, Datei, Markierungen und Antworten bleiben über Zurück/Weiter erhalten – reversible, protokoll.txt, markiert: Uchendu, 1 Antwort(en)

## Breiten 390, 1280, 1366, 1920 px
- OK: 390 px: kein waagrechtes Scrollen – start ok, datei ok, pruefen ok, speichern ok, rueckbau ok
- OK: 390 px: alle sichtbaren Knöpfe mindestens 36 px hoch (Version 2.5.0: 36 px statt 44 px erlaubt)
- OK: 1280 px: kein waagrechtes Scrollen – start ok, datei ok, pruefen ok, speichern ok, rueckbau ok
- OK: 1280 px: rechte Spalte bleibt beim Scrollen stehen – oben bei 56 px nach 300 px Scrollen
- OK: Dokumenttext ohne eigenen Scrollkasten – overflow-y: visible
- OK: Kein Wort „Tabelle“ vor den Absätzen; Word-Tabellen als Tabelle
- OK: 1366 px: kein waagrechtes Scrollen – start ok, datei ok, pruefen ok, speichern ok, rueckbau ok
- OK: 1920 px: kein waagrechtes Scrollen – start ok, datei ok, pruefen ok, speichern ok, rueckbau ok

## Zwei Downloads aus einem Klick (Messung)
- Headless-Chromium unter file:// lieferte 2 von 2 Downloads (eins.txt, zwei.txt).
- Gewählt: zwei nummerierte Knöpfe („1 Schlüssel speichern“, „2 Datei speichern“, der zweite erst nach dem ersten aktiv). Grund: Edge/Chrome fragen bei mehreren Downloads aus einem Klick je nach Einstellung „Mehrere Dateien herunterladen?“ oder blockieren still; das zeigt der Headless-Test nicht und ist unter file:// am Firmen-PC nicht verlässlich vorhersagbar.

Prüfungen: 52 von 52 bestanden.
Netzwerkanfragen außer lokalen Dateien: 0.
