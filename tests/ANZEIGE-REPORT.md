# Anzeige beim Prüfen (Version 2.6.1)

Chromium headless gegen index.html (SHA-256 631a2bcd05e3aaf8…). Alle Namen in den Testdateien sind erfunden.

## a) Drei Zustände im Text und im Satz-Ausschnitt
- OK: wird ersetzt: Fläche #FFF3C4, kein Rahmen – rgb(255, 243, 196), Rahmen 3px none rgb(23, 33, 43), Stärke 400
- OK: Frage offen, wird ersetzt: Fläche blass, 1px gestrichelt #8A4B00 – rgb(255, 243, 196), Rahmen 1px dashed rgb(138, 75, 0), Stärke 400
- OK: Frage offen, bleibt stehen: keine Fläche, 1px gestrichelt #8A4B00 – rgba(0, 0, 0, 0), Rahmen 1px dashed rgb(138, 75, 0), Stärke 400
- OK: aktuelle Frage: Fläche #FFD15C, 3px durchgezogen #B4530A, fett – rgb(255, 209, 92), Rahmen 3px solid rgb(180, 83, 10), Stärke 700
- OK: Satz-Ausschnitt der Karte wie „aktuelle Frage“ – rgb(255, 209, 92), Rahmen 3px solid rgb(180, 83, 10), Stärke 700
- OK: Hinweis beim Überfahren nennt „aktuelle Frage“ – wird ersetzt durch: Person C · Person: Lieder · aktuelle Frage · Klick = umschalten
- OK: vorhandene Klassen bleiben (hit, on/off, ask) + neue Klasse cur – hit on ask cur

## b) Kräftig markierte Stellen = Stellen der gezeigten Frage; c) Rollen zur ersten Stelle
- OK: brief.docx: 10 Fragen, kräftig markiert = Stellen der Frage
- OK: brief.docx: nach jedem Fragenwechsel erste Stelle sichtbar (9/9)
- OK: brief.docx: Klick auf eine Markierung rollt nicht
- OK: brief.docx: Fokus bleibt (Tasten J/N), 11/11
- OK: liste.xlsx: 4 Fragen, kräftig markiert = Stellen der Frage
- OK: liste.xlsx: nach jedem Fragenwechsel erste Stelle sichtbar (3/3)
- OK: liste.xlsx: Klick auf eine Markierung rollt nicht
- OK: liste.xlsx: Fokus bleibt (Tasten J/N), 4/4
- OK: protokoll.txt: 7 Fragen, kräftig markiert = Stellen der Frage
- OK: protokoll.txt: nach jedem Fragenwechsel erste Stelle sichtbar (8/8)
- OK: protokoll.txt: Klick auf eine Markierung rollt nicht
- OK: protokoll.txt: Fokus bleibt (Tasten J/N), 8/8
- OK: bedienung.docx: 5 Fragen, kräftig markiert = Stellen der Frage
- OK: bedienung.docx: nach jedem Fragenwechsel erste Stelle sichtbar (5/5)
- OK: bedienung.docx: Klick auf eine Markierung rollt nicht
- OK: bedienung.docx: Fokus bleibt (Tasten J/N), 6/6
- OK: bedienung.txt: 4 Fragen, kräftig markiert = Stellen der Frage
- OK: bedienung.txt: nach jedem Fragenwechsel erste Stelle sichtbar (5/5)
- OK: bedienung.txt: Klick auf eine Markierung rollt nicht
- OK: bedienung.txt: Fokus bleibt (Tasten J/N), 5/5
- OK: bedienung.xlsx: 5 Fragen, kräftig markiert = Stellen der Frage
- OK: bedienung.xlsx: nach jedem Fragenwechsel erste Stelle sichtbar (5/5)
- OK: bedienung.xlsx: Klick auf eine Markierung rollt nicht
- OK: bedienung.xlsx: Fokus bleibt (Tasten J/N), 6/6
- OK: mehrblatt.xlsx: 3 Fragen, kräftig markiert = Stellen der Frage
- OK: mehrblatt.xlsx: nach jedem Fragenwechsel erste Stelle sichtbar (4/4), Reiter = Blatt der Stelle
- OK: mehrblatt.xlsx: Klick auf eine Markierung rollt nicht
- OK: mehrblatt.xlsx: Fokus bleibt (Tasten J/N), 4/4
- OK: lang.txt: 3 Fragen, kräftig markiert = Stellen der Frage
- OK: lang.txt: nach jedem Fragenwechsel erste Stelle sichtbar (3/3)
- OK: lang.txt: Klick auf eine Markierung rollt nicht
- OK: lang.txt: Fokus bleibt (Tasten J/N), 3/3

| Datei | Fragen | kräftig = Stellen | ohne Frage nichts kräftig | Fragenwechsel | Stelle sichtbar | Klick rollt nicht | Fokus unverändert |
|---|---|---|---|---|---|---|---|
| brief.docx | 10 | 10/10 | ja | 9 | 9/9 | ja | 11/11 |
| liste.xlsx | 4 | 4/4 | ja | 3 | 3/3 | ja | 4/4 |
| protokoll.txt | 7 | 7/7 | ja | 8 | 8/8 | ja | 8/8 |
| bedienung.docx | 5 | 5/5 | ja | 5 | 5/5 | ja | 6/6 |
| bedienung.txt | 4 | 4/4 | ja | 5 | 5/5 | ja | 5/5 |
| bedienung.xlsx | 5 | 5/5 | ja | 5 | 5/5 | ja | 6/6 |
| mehrblatt.xlsx | 3 | 3/3 | ja | 4 | 4/4 | ja | 4/4 |
| lang.txt | 3 | 3/3 | ja | 3 | 3/3 | ja | 3/3 |
- OK: mit Gleit-Bewegung: Stelle nach dem Rollen sichtbar (lang.txt) – Frage 2 von 3
- OK: Excel: eigener Reiterwechsel bleibt (Blatt 0 → 1); nächste Frage wechselt zum Blatt ihrer Stelle

## d) Zähler, Vorige/Nächste Frage, Pfeiltasten
- OK: Frage 1: „Vorige Frage“ sichtbar und ausgegraut, mit aria-label und title
- OK: Frage 1 ohne Antwort: „Nächste Frage“ ausgegraut
  - Beim Beantworten gezeigt: Frage 1 von 5 → Frage 2 von 5 → Frage 3 von 5 → Frage 4 von 6 → Frage 5 von 6 → Frage 6 von 6 → Frage 3 von 7 → Frage 4 von 7 → Frage 5 von 7 → Frage 6 von 7 → Frage 7 von 7
- OK: „Alle Fragen beantwortet“ hat „Vorige Frage“ (aktiv)
- OK: „Vorige Frage“ auf „Alle Fragen beantwortet“ führt zur letzten Frage (Frage 7 von 7)
- OK: vorwärts mit → lückenlos 1 … 7 – Frage 1 von 7, Frage 2 von 7, Frage 3 von 7, Frage 4 von 7, Frage 5 von 7, Frage 6 von 7, Frage 7 von 7
- OK: rückwärts mit ← jeweils k → k−1
- OK: bei Frage 1 ist „Vorige Frage“ ausgegraut
- OK: Knöpfe ← und → wie die Tasten
- OK: beantwortete Frage zeigt „Bisherige Antwort“
- OK: im Eingabefeld: ← → J N ohne Wirkung

## e) Antwort ändern = wie direkt richtig geantwortet (Ausgaben in drei Modi und Schlüsseldatei)
- OK: Wort-Frage Ja → Nein (brief.docx, drei Modi)
- OK: Wort-Frage Nein → Ja (brief.docx, drei Modi)
- OK: Stellen-Frage Ja → Nein (bedienung.txt, drei Modi)
- OK: Stellen-Frage Nein → Ja (bedienung.txt, drei Modi)
- OK: Dateiangabe Person Ja → Nein (bedienung.docx, drei Modi)
- OK: Dateiangabe Person Nein → Ja (bedienung.docx, drei Modi)
- OK: Dateiangabe Einrichtung Ja → Nein (kurse.docx, drei Modi)
- OK: Dateiangabe Einrichtung Nein → Ja (kurse.docx, drei Modi)

Fallen:
- OK: Falle 1: Wort-Frage Nein → Ja schaltet die mit „Nein“ ausgeschaltete Stelle im Sachkontext („Rosen“) zurück (falle.txt, drei Modi)
- OK: Falle 1 (zweite Datei): dasselbe mit „Felder“ (bedienung.txt, drei Modi)
- OK: Falle 2 („Rose“): Ja, Stellen-Frage „Rosen“ Nein, dann Nein → wie direkt Nein (falle.txt, drei Modi)
- OK: Falle 2 („Rose“) … und wieder Ja → wie direkt Ja (Stellen-Frage offen) (falle.txt, drei Modi)
- OK: Falle 2: Wort-Frage Ja, Stellen-Frage beantwortet, dann Nein: Stellen-Antwort verworfen (bedienung.txt, drei Modi)
- OK: Falle 2b: … und wieder Ja: Stellen-Frage ist offen (wie direkt Ja) (bedienung.txt, drei Modi)
- OK: Falle 3: Dateiangabe Ja → Nein nimmt den übernommenen Namen wieder aus der Liste (samt Folge-Frage zur GROSS-Form) (bedienung.docx, drei Modi)
- OK: Falle 3b: Name stand schon vorher in der Liste: Ja → Nein lässt ihn drin (bedienung.docx, drei Modi)
- OK: Falle 4: von Hand umgeschaltete Stelle einer anderen Frage bleibt (bedienung.txt, drei Modi)
- OK: Dieselbe Antwort noch einmal ändert nichts (bedienung.txt, drei Modi)
- OK: Mehrfach geändert (Ja → Nein → Ja → Nein) (brief.docx, drei Modi)

## Einstellungen und Listen nach Antworten (Entscheidung Easy)
- OK: Einstellung „unsureOn“ → false nach Antworten: wie frisch berechnet (drei Modi, Schlüsseldatei)
- OK: … alle Fragen offen
- OK: … Hinweis „Du hast eine Einstellung geändert …“ sichtbar (frischer Lauf ohne Hinweis)
- OK: Einstellung „email“ → false nach Antworten: wie frisch berechnet (drei Modi, Schlüsseldatei)
- OK: … alle Fragen offen
- OK: … Hinweis „Du hast eine Einstellung geändert …“ sichtbar (frischer Lauf ohne Hinweis)
- OK: Einstellung „unsureOn“ aus und wieder an nach Antworten: wie frisch (drei Modi)
- OK: „Lieder“: Nein, Einstellung aus und wieder ein → Frage wieder offen, nicht still beantwortet
- OK: Einstellung ohne vorherige Antworten: kein Hinweis
- OK: Liste: über Dateiangaben-„Ja“ übernommener Name entfernt → Antwort „Nein“
- OK: … Ausgaben (drei Modi, Schlüsseldatei) wie bei direktem „Nein“
- OK: Liste: Name hinzugefügt nach Antworten → Antworten und ihre Wirkung unverändert

## f) Rückbau nach einer Sitzung mit geänderten Antworten (Modus rückbaufähig)
- OK: brief.docx: 6 Antwort-Schritte (mit Änderungen), 23 Platzhalter zurück, Abweichungen 0
- OK: liste.xlsx: 5 Antwort-Schritte (mit Änderungen), 35 Platzhalter zurück, Abweichungen 0
- OK: bedienung.txt: 5 Antwort-Schritte (mit Änderungen), 9 Platzhalter zurück, Abweichungen 0

## z) Kein Text „null“ oder „undefined“ (Fragekarte in jedem Zustand, Bildschirme Datei/Prüfen/Speichern je Format)
- OK: #qcard „Frage offen (Frage 1)“: kein „null“/„undefined“ – Frage 1 von 7 ← → Frau Rose bringt Rosen mit. Ist hier die Person Rose
- OK: #qcard „Frage beantwortet (zurück zur Frage 1)“: kein „null“/„undefined“ – Frage 1 von 7 ← → Frau Rose bringt Rosen mit. Ist hier die Person Rose
- OK: #qcard „Alle Fragen beantwortet“: kein „null“/„undefined“ – 7 von 7 Fragen ← → Alle Fragen beantwortet Fragen noch einmal zeigen
- OK: #qcard „mit Einstellungs-Hinweis (Frage offen)“: kein „null“/„undefined“ – Frage 1 von 7 ← → Du hast eine Einstellung geändert. Die Fragen sind w
- OK: #qcard „mit Einstellungs-Hinweis (alle beantwortet)“: kein „null“/„undefined“ – 7 von 7 Fragen ← → Alle Fragen beantwortet Fragen noch einmal zeigen
- OK: #qcard „Keine Fragen“: kein „null“/„undefined“ – Keine Fragen Es gibt nichts zu entscheiden.
- OK: Einstellungs-Hinweis wurde tatsächlich gezeigt
- OK: protokoll.txt: Datei, Prüfen, Speichern ohne „null“/„undefined“
- OK: tabellen-stark.csv: Datei, Prüfen, Speichern ohne „null“/„undefined“
- OK: kurse.docx: Datei, Prüfen, Speichern ohne „null“/„undefined“
- OK: mehrblatt.xlsx: Datei, Prüfen, Speichern ohne „null“/„undefined“
- OK: protokoll.pdf: Datei, Prüfen, Speichern ohne „null“/„undefined“

- OK: Netzwerkanfragen nach außen: 0
- OK: Keine JS-Fehler

## Soll / gemessen
| Teil | Soll | gemessen |
|---|---|---|
| a) Farben, Rahmen, Schriftstärke je Zustand und im Satz-Ausschnitt | alle | 7 von 7 bestanden |
| b) kräftig markiert = Stellen der gezeigten Frage, für jede Frage jeder Datei; 0 bei Dateiangaben und ohne Frage | alle | 8 von 8 bestanden |
| c) erste Stelle nach jedem Fragenwechsel sichtbar, Excel-Reiter, kein Rollen bei Klick, Fokus bleibt | alle | 26 von 26 bestanden |
| d) Zähler lückenlos, ← k−1, Knöpfe, Pfeiltasten, keine Wirkung in Eingabefeldern | alle | 10 von 10 bestanden |
| e) Weg-Gleichheit je Fragen-Art und Richtung + Fallen, drei Modi und Schlüsseldatei | alle | 19 von 19 bestanden |
| s) Einstellung nach Antworten: wie frisch, Fragen offen, Hinweis | alle | 9 von 9 bestanden |
| l) Liste: entfernt → Nein, hinzugefügt → unverändert | alle | 3 von 3 bestanden |
| f) Rückbau nach geänderten Antworten exakt (docx, xlsx, txt) | alle | 3 von 3 bestanden |
| z) kein „null“/„undefined“ in Fragekarte und Bildschirmen | alle | 12 von 12 bestanden |
| n) 0 Anfragen nach außen, keine JS-Fehler | alle | 2 von 2 bestanden |

Geprüfte Fragen (b): 41 in 8 Dateien. Weg-Gleichheit (e): 19 Fälle × 3 Modi. Rückbau (f): 3 Dateien.

**Ergebnis: 99 von 99 Prüfungen bestanden.** Nur Chromium; Firefox prüft Easy.
