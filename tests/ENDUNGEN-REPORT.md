# Endungsprüfung (Version 2.3.1): Tests

Testdokumente: tests/make-endungen.mjs (alle Namen erfunden, keiner in den Namenslisten). Vorher = Version 2.3.0, nachher = diese Version.

## Je Form: ersetzt vorher (2.3.0) / nachher, Modus „Person A“
### endungen.docx

| Name (Ende) | Form | vorher | nachher |
|---|---|---|---|
| Lüdinghaus (-s) | Lüdinghaus | ja | ja |
| Lüdinghaus (-s) | Lüdinghaus's | ja | ja |
| Lüdinghaus (-s) | Lüdinghaus’s | ja | ja |
| Lüdinghaus (-s) | Lüdinghaus' | ja | ja |
| Lüdinghaus (-s) | Lüdinghaus’ | ja | ja |
| Lüdinghaus (-s) | Lüdinghauss | ja | ja |
| Lüdinghaus (-s) | Lüdinghauses | ja | ja |
| Lüdinghaus (-s) | Lüdinghausn | ja | ja |
| Lüdinghaus (-s) | Lüdinghausns | ja | ja |
| Lüdinghaus (-s) | LÜDINGHAUS | ja | ja |
| Lüdinghaus (-s) | LÜDINGHAUSS | nein | NEIN |
| Wittekindhorn (-n) | Wittekindhorn | ja | ja |
| Wittekindhorn (-n) | Wittekindhorn's | ja | ja |
| Wittekindhorn (-n) | Wittekindhorn’s | ja | ja |
| Wittekindhorn (-n) | Wittekindhorn' | ja | ja |
| Wittekindhorn (-n) | Wittekindhorn’ | ja | ja |
| Wittekindhorn (-n) | Wittekindhorns | nein | ja (neu) |
| Wittekindhorn (-n) | Wittekindhornes | ja | ja |
| Wittekindhorn (-n) | Wittekindhornn | ja | ja |
| Wittekindhorn (-n) | Wittekindhornns | ja | ja |
| Wittekindhorn (-n) | WITTEKINDHORN | ja | ja |
| Wittekindhorn (-n) | WITTEKINDHORNS | nein | NEIN |
| Quabbenjansen (-en) | Quabbenjansen | ja | ja |
| Quabbenjansen (-en) | Quabbenjansen's | ja | ja |
| Quabbenjansen (-en) | Quabbenjansen’s | ja | ja |
| Quabbenjansen (-en) | Quabbenjansen' | ja | ja |
| Quabbenjansen (-en) | Quabbenjansen’ | ja | ja |
| Quabbenjansen (-en) | Quabbenjansens | nein | ja (neu) |
| Quabbenjansen (-en) | Quabbenjansenes | ja | ja |
| Quabbenjansen (-en) | Quabbenjansenn | ja | ja |
| Quabbenjansen (-en) | Quabbenjansenns | ja | ja |
| Quabbenjansen (-en) | QUABBENJANSEN | ja | ja |
| Quabbenjansen (-en) | QUABBENJANSENS | nein | NEIN |
| Ostervelkens (-ens) | Ostervelkens | ja | ja |
| Ostervelkens (-ens) | Ostervelkens's | ja | ja |
| Ostervelkens (-ens) | Ostervelkens’s | ja | ja |
| Ostervelkens (-ens) | Ostervelkens' | ja | ja |
| Ostervelkens (-ens) | Ostervelkens’ | ja | ja |
| Ostervelkens (-ens) | Ostervelkenss | ja | ja |
| Ostervelkens (-ens) | Ostervelkenses | ja | ja |
| Ostervelkens (-ens) | Ostervelkensn | ja | ja |
| Ostervelkens (-ens) | Ostervelkensns | ja | ja |
| Ostervelkens (-ens) | OSTERVELKENS | ja | ja |
| Ostervelkens (-ens) | OSTERVELKENSS | nein | NEIN |
| Hallermes (-es) | Hallermes | ja | ja |
| Hallermes (-es) | Hallermes's | ja | ja |
| Hallermes (-es) | Hallermes’s | ja | ja |
| Hallermes (-es) | Hallermes' | ja | ja |
| Hallermes (-es) | Hallermes’ | ja | ja |
| Hallermes (-es) | Hallermess | ja | ja |
| Hallermes (-es) | Hallermeses | ja | ja |
| Hallermes (-es) | Hallermesn | ja | ja |
| Hallermes (-es) | Hallermesns | ja | ja |
| Hallermes (-es) | HALLERMES | ja | ja |
| Hallermes (-es) | HALLERMESS | nein | NEIN |
| Tönnieskampe (-e) | Tönnieskampe | ja | ja |
| Tönnieskampe (-e) | Tönnieskampe's | ja | ja |
| Tönnieskampe (-e) | Tönnieskampe’s | ja | ja |
| Tönnieskampe (-e) | Tönnieskampe' | ja | ja |
| Tönnieskampe (-e) | Tönnieskampe’ | ja | ja |
| Tönnieskampe (-e) | Tönnieskampes | nein | ja (neu) |
| Tönnieskampe (-e) | Tönnieskampees | ja | ja |
| Tönnieskampe (-e) | Tönnieskampen | ja | ja |
| Tönnieskampe (-e) | Tönnieskampens | ja | ja |
| Tönnieskampe (-e) | TÖNNIESKAMPE | ja | ja |
| Tönnieskampe (-e) | TÖNNIESKAMPES | nein | NEIN |

- docx: neu ersetzt 3, schlechter 0, weiterhin nicht ersetzt 6
- OK: docx: keine Form schlechter als vorher; die bisher nur gemeldeten Formen „Wittekindhorns“, „Quabbenjansens“, „Tönnieskampes“ sind jetzt ersetzt – 3 neu ersetzt
- Schlusscheck-Meldungen: vorher 6 (LÜDINGHAUSS, Wittekindhorns, Quabbenjansens, OSTERVELKENSS, HALLERMESS, Tönnieskampes), nachher 6 (LÜDINGHAUSS, WITTEKINDHORNS, QUABBENJANSENS, OSTERVELKENSS, HALLERMESS, TÖNNIESKAMPES)
- Unbemerkte Reste (stehen geblieben, nicht gemeldet): vorher 3 (WITTEKINDHORNS, QUABBENJANSENS, TÖNNIESKAMPES), nachher 0 (–)
- OK: docx: nachher kein unbemerkter Rest mehr; jede verbliebene Form wird gemeldet – vorher 3 unbemerkt

### endungen.txt

| Name (Ende) | Form | vorher | nachher |
|---|---|---|---|
| Lüdinghaus (-s) | Lüdinghaus | ja | ja |
| Lüdinghaus (-s) | Lüdinghaus's | ja | ja |
| Lüdinghaus (-s) | Lüdinghaus’s | ja | ja |
| Lüdinghaus (-s) | Lüdinghaus' | ja | ja |
| Lüdinghaus (-s) | Lüdinghaus’ | ja | ja |
| Lüdinghaus (-s) | Lüdinghauss | ja | ja |
| Lüdinghaus (-s) | Lüdinghauses | ja | ja |
| Lüdinghaus (-s) | Lüdinghausn | ja | ja |
| Lüdinghaus (-s) | Lüdinghausns | ja | ja |
| Lüdinghaus (-s) | LÜDINGHAUS | ja | ja |
| Lüdinghaus (-s) | LÜDINGHAUSS | nein | NEIN |
| Wittekindhorn (-n) | Wittekindhorn | ja | ja |
| Wittekindhorn (-n) | Wittekindhorn's | ja | ja |
| Wittekindhorn (-n) | Wittekindhorn’s | ja | ja |
| Wittekindhorn (-n) | Wittekindhorn' | ja | ja |
| Wittekindhorn (-n) | Wittekindhorn’ | ja | ja |
| Wittekindhorn (-n) | Wittekindhorns | nein | ja (neu) |
| Wittekindhorn (-n) | Wittekindhornes | ja | ja |
| Wittekindhorn (-n) | Wittekindhornn | ja | ja |
| Wittekindhorn (-n) | Wittekindhornns | ja | ja |
| Wittekindhorn (-n) | WITTEKINDHORN | ja | ja |
| Wittekindhorn (-n) | WITTEKINDHORNS | nein | NEIN |
| Quabbenjansen (-en) | Quabbenjansen | ja | ja |
| Quabbenjansen (-en) | Quabbenjansen's | ja | ja |
| Quabbenjansen (-en) | Quabbenjansen’s | ja | ja |
| Quabbenjansen (-en) | Quabbenjansen' | ja | ja |
| Quabbenjansen (-en) | Quabbenjansen’ | ja | ja |
| Quabbenjansen (-en) | Quabbenjansens | nein | ja (neu) |
| Quabbenjansen (-en) | Quabbenjansenes | ja | ja |
| Quabbenjansen (-en) | Quabbenjansenn | ja | ja |
| Quabbenjansen (-en) | Quabbenjansenns | ja | ja |
| Quabbenjansen (-en) | QUABBENJANSEN | ja | ja |
| Quabbenjansen (-en) | QUABBENJANSENS | nein | NEIN |
| Ostervelkens (-ens) | Ostervelkens | ja | ja |
| Ostervelkens (-ens) | Ostervelkens's | ja | ja |
| Ostervelkens (-ens) | Ostervelkens’s | ja | ja |
| Ostervelkens (-ens) | Ostervelkens' | ja | ja |
| Ostervelkens (-ens) | Ostervelkens’ | ja | ja |
| Ostervelkens (-ens) | Ostervelkenss | ja | ja |
| Ostervelkens (-ens) | Ostervelkenses | ja | ja |
| Ostervelkens (-ens) | Ostervelkensn | ja | ja |
| Ostervelkens (-ens) | Ostervelkensns | ja | ja |
| Ostervelkens (-ens) | OSTERVELKENS | ja | ja |
| Ostervelkens (-ens) | OSTERVELKENSS | nein | NEIN |
| Hallermes (-es) | Hallermes | ja | ja |
| Hallermes (-es) | Hallermes's | ja | ja |
| Hallermes (-es) | Hallermes’s | ja | ja |
| Hallermes (-es) | Hallermes' | ja | ja |
| Hallermes (-es) | Hallermes’ | ja | ja |
| Hallermes (-es) | Hallermess | ja | ja |
| Hallermes (-es) | Hallermeses | ja | ja |
| Hallermes (-es) | Hallermesn | ja | ja |
| Hallermes (-es) | Hallermesns | ja | ja |
| Hallermes (-es) | HALLERMES | ja | ja |
| Hallermes (-es) | HALLERMESS | nein | NEIN |
| Tönnieskampe (-e) | Tönnieskampe | ja | ja |
| Tönnieskampe (-e) | Tönnieskampe's | ja | ja |
| Tönnieskampe (-e) | Tönnieskampe’s | ja | ja |
| Tönnieskampe (-e) | Tönnieskampe' | ja | ja |
| Tönnieskampe (-e) | Tönnieskampe’ | ja | ja |
| Tönnieskampe (-e) | Tönnieskampes | nein | ja (neu) |
| Tönnieskampe (-e) | Tönnieskampees | ja | ja |
| Tönnieskampe (-e) | Tönnieskampen | ja | ja |
| Tönnieskampe (-e) | Tönnieskampens | ja | ja |
| Tönnieskampe (-e) | TÖNNIESKAMPE | ja | ja |
| Tönnieskampe (-e) | TÖNNIESKAMPES | nein | NEIN |

- txt: neu ersetzt 3, schlechter 0, weiterhin nicht ersetzt 6
- OK: txt: keine Form schlechter als vorher; die bisher nur gemeldeten Formen „Wittekindhorns“, „Quabbenjansens“, „Tönnieskampes“ sind jetzt ersetzt – 3 neu ersetzt
- Schlusscheck-Meldungen: vorher 6 (LÜDINGHAUSS, Wittekindhorns, Quabbenjansens, OSTERVELKENSS, HALLERMESS, Tönnieskampes), nachher 6 (LÜDINGHAUSS, WITTEKINDHORNS, QUABBENJANSENS, OSTERVELKENSS, HALLERMESS, TÖNNIESKAMPES)
- Unbemerkte Reste (stehen geblieben, nicht gemeldet): vorher 3 (WITTEKINDHORNS, QUABBENJANSENS, TÖNNIESKAMPES), nachher 0 (–)
- OK: txt: nachher kein unbemerkter Rest mehr; jede verbliebene Form wird gemeldet – vorher 3 unbemerkt

### endungen.csv

| Name (Ende) | Form | vorher | nachher |
|---|---|---|---|
| Lüdinghaus (-s) | Lüdinghaus | ja | ja |
| Lüdinghaus (-s) | Lüdinghaus's | ja | ja |
| Lüdinghaus (-s) | Lüdinghaus’s | ja | ja |
| Lüdinghaus (-s) | Lüdinghaus' | ja | ja |
| Lüdinghaus (-s) | Lüdinghaus’ | ja | ja |
| Lüdinghaus (-s) | Lüdinghauss | ja | ja |
| Lüdinghaus (-s) | Lüdinghauses | ja | ja |
| Lüdinghaus (-s) | Lüdinghausn | ja | ja |
| Lüdinghaus (-s) | Lüdinghausns | ja | ja |
| Lüdinghaus (-s) | LÜDINGHAUS | ja | ja |
| Lüdinghaus (-s) | LÜDINGHAUSS | nein | NEIN |
| Wittekindhorn (-n) | Wittekindhorn | ja | ja |
| Wittekindhorn (-n) | Wittekindhorn's | ja | ja |
| Wittekindhorn (-n) | Wittekindhorn’s | ja | ja |
| Wittekindhorn (-n) | Wittekindhorn' | ja | ja |
| Wittekindhorn (-n) | Wittekindhorn’ | ja | ja |
| Wittekindhorn (-n) | Wittekindhorns | nein | ja (neu) |
| Wittekindhorn (-n) | Wittekindhornes | ja | ja |
| Wittekindhorn (-n) | Wittekindhornn | ja | ja |
| Wittekindhorn (-n) | Wittekindhornns | ja | ja |
| Wittekindhorn (-n) | WITTEKINDHORN | ja | ja |
| Wittekindhorn (-n) | WITTEKINDHORNS | nein | NEIN |
| Quabbenjansen (-en) | Quabbenjansen | ja | ja |
| Quabbenjansen (-en) | Quabbenjansen's | ja | ja |
| Quabbenjansen (-en) | Quabbenjansen’s | ja | ja |
| Quabbenjansen (-en) | Quabbenjansen' | ja | ja |
| Quabbenjansen (-en) | Quabbenjansen’ | ja | ja |
| Quabbenjansen (-en) | Quabbenjansens | nein | ja (neu) |
| Quabbenjansen (-en) | Quabbenjansenes | ja | ja |
| Quabbenjansen (-en) | Quabbenjansenn | ja | ja |
| Quabbenjansen (-en) | Quabbenjansenns | ja | ja |
| Quabbenjansen (-en) | QUABBENJANSEN | ja | ja |
| Quabbenjansen (-en) | QUABBENJANSENS | nein | NEIN |
| Ostervelkens (-ens) | Ostervelkens | ja | ja |
| Ostervelkens (-ens) | Ostervelkens's | ja | ja |
| Ostervelkens (-ens) | Ostervelkens’s | ja | ja |
| Ostervelkens (-ens) | Ostervelkens' | ja | ja |
| Ostervelkens (-ens) | Ostervelkens’ | ja | ja |
| Ostervelkens (-ens) | Ostervelkenss | ja | ja |
| Ostervelkens (-ens) | Ostervelkenses | ja | ja |
| Ostervelkens (-ens) | Ostervelkensn | ja | ja |
| Ostervelkens (-ens) | Ostervelkensns | ja | ja |
| Ostervelkens (-ens) | OSTERVELKENS | ja | ja |
| Ostervelkens (-ens) | OSTERVELKENSS | nein | NEIN |
| Hallermes (-es) | Hallermes | ja | ja |
| Hallermes (-es) | Hallermes's | ja | ja |
| Hallermes (-es) | Hallermes’s | ja | ja |
| Hallermes (-es) | Hallermes' | ja | ja |
| Hallermes (-es) | Hallermes’ | ja | ja |
| Hallermes (-es) | Hallermess | ja | ja |
| Hallermes (-es) | Hallermeses | ja | ja |
| Hallermes (-es) | Hallermesn | ja | ja |
| Hallermes (-es) | Hallermesns | ja | ja |
| Hallermes (-es) | HALLERMES | ja | ja |
| Hallermes (-es) | HALLERMESS | nein | NEIN |
| Tönnieskampe (-e) | Tönnieskampe | ja | ja |
| Tönnieskampe (-e) | Tönnieskampe's | ja | ja |
| Tönnieskampe (-e) | Tönnieskampe’s | ja | ja |
| Tönnieskampe (-e) | Tönnieskampe' | ja | ja |
| Tönnieskampe (-e) | Tönnieskampe’ | ja | ja |
| Tönnieskampe (-e) | Tönnieskampes | nein | ja (neu) |
| Tönnieskampe (-e) | Tönnieskampees | ja | ja |
| Tönnieskampe (-e) | Tönnieskampen | ja | ja |
| Tönnieskampe (-e) | Tönnieskampens | ja | ja |
| Tönnieskampe (-e) | TÖNNIESKAMPE | ja | ja |
| Tönnieskampe (-e) | TÖNNIESKAMPES | nein | NEIN |

- csv: neu ersetzt 3, schlechter 0, weiterhin nicht ersetzt 6
- OK: csv: keine Form schlechter als vorher; die bisher nur gemeldeten Formen „Wittekindhorns“, „Quabbenjansens“, „Tönnieskampes“ sind jetzt ersetzt – 3 neu ersetzt
- Schlusscheck-Meldungen: vorher 6 (LÜDINGHAUSS, Wittekindhorns, Quabbenjansens, OSTERVELKENSS, HALLERMESS, Tönnieskampes), nachher 6 (LÜDINGHAUSS, WITTEKINDHORNS, QUABBENJANSENS, OSTERVELKENSS, HALLERMESS, TÖNNIESKAMPES)
- Unbemerkte Reste (stehen geblieben, nicht gemeldet): vorher 3 (WITTEKINDHORNS, QUABBENJANSENS, TÖNNIESKAMPES), nachher 0 (–)
- OK: csv: nachher kein unbemerkter Rest mehr; jede verbliebene Form wird gemeldet – vorher 3 unbemerkt

## Kopfzeile, Fußzeile, Fußnote, Bildbeschreibung (Word)
- Kopfzeile: vorher „Akte: Quabbenjansens Antrag“ → nachher „Akte: Person As Antrag“
- OK: Kopfzeile: gebeugte Form jetzt ersetzt
- Fußzeile: vorher „Notiz aus Wittekindhorns Büro“ → nachher „Notiz aus Person Bs Büro“
- OK: Fußzeile: gebeugte Form jetzt ersetzt
- Fußnote: vorher „Hinweis aus Tönnieskampes Unterlagen.“ → nachher „Hinweis aus Person Cs Unterlagen.“
- OK: Fußnote: gebeugte Form jetzt ersetzt
- Bildbeschreibung: vorher „ALT: Foto aus Quabbenjansens Büro“ → nachher „ALT: Foto aus Person As Büro“
- OK: Bildbeschreibung: gebeugte Form jetzt ersetzt

## Gegenprobe: gewöhnliche Wörter, die wie Name + Endung aussehen
- gegenprobe-endungen.txt: Rosen: vorher kein Treffer, nachher kein Treffer; Marken: vorher kein Treffer, nachher kein Treffer; Franken: vorher kein Treffer, nachher kein Treffer; Wolfs: vorher ersetzt? nein (unsicher), nachher ersetzt? nein (unsicher); Bergen: vorher kein Treffer, nachher kein Treffer; Steinen: vorher kein Treffer, nachher kein Treffer
- OK: gegenprobe-endungen.txt: Ausgabe vorher und nachher byte-gleich (keine neuen Treffer)
- gegenprobe-endungen.docx: Rosen: vorher kein Treffer, nachher kein Treffer; Marken: vorher kein Treffer, nachher kein Treffer; Franken: vorher kein Treffer, nachher kein Treffer; Wolfs: vorher ersetzt? nein (unsicher), nachher ersetzt? nein (unsicher); Bergen: vorher kein Treffer, nachher kein Treffer; Steinen: vorher kein Treffer, nachher kein Treffer
- OK: gegenprobe-endungen.docx: Ausgabe vorher und nachher byte-gleich (keine neuen Treffer)
- gegenprobe-endungen-personen.txt (mit Personen „Frau Anna Rose, Herr Rainer Mark, Herr Paul Frank, Herr Peter Wolf, Herr Karl Berg und Herr Max Stein“): Rosen: vorher ersetzt? nein (unsicher), nachher ersetzt? nein (unsicher); Marken: vorher kein Treffer, nachher kein Treffer; Franken: vorher kein Treffer, nachher kein Treffer; Wolfs: vorher ersetzt? nein (unsicher), nachher ersetzt? nein (unsicher); Bergen: vorher kein Treffer, nachher kein Treffer; Steinen: vorher kein Treffer, nachher kein Treffer
- OK: gegenprobe-endungen-personen.txt: Ausgabe vorher und nachher byte-gleich (keine neuen Treffer)
- gegenprobe-endungen-personen.docx (mit Personen „Frau Anna Rose, Herr Rainer Mark, Herr Paul Frank, Herr Peter Wolf, Herr Karl Berg und Herr Max Stein“): Rosen: vorher ersetzt? nein (unsicher), nachher ersetzt? nein (unsicher); Marken: vorher kein Treffer, nachher kein Treffer; Franken: vorher kein Treffer, nachher kein Treffer; Wolfs: vorher ersetzt? nein (unsicher), nachher ersetzt? nein (unsicher); Bergen: vorher kein Treffer, nachher kein Treffer; Steinen: vorher kein Treffer, nachher kein Treffer
- OK: gegenprobe-endungen-personen.docx: Ausgabe vorher und nachher byte-gleich (keine neuen Treffer)

## Kreislauf (rückbaufähig) mit den gebeugten Formen, über die Oberfläche
- OK: endungen.docx: Kreislauf exakt (gebeugte Formen als „Nachname Xs“, Endung am Platzhalter) – Beispiel: „Endung s: Nachname As Unterlagen liegen vor.“; Urteil „passend“; 19 Platzhalter
- OK: endungen.txt: Kreislauf exakt (gebeugte Formen als „Nachname Xs“, Endung am Platzhalter) – Beispiel: „Endung s: Nachname As Unterlagen liegen vor.“; Urteil „passend“; 19 Platzhalter
- OK: endungen.csv: Kreislauf exakt (gebeugte Formen als „Nachname Xs“, Endung am Platzhalter) – Beispiel: „7;"Endung s: Nachname As Unterlagen liegen vor."“; Urteil „passend“; 19 Platzhalter
- OK: endungen-teile.docx: Kreislauf exakt (gebeugte Formen als „Nachname Xs“, Endung am Platzhalter) – Beispiel: „Foto aus Nachname As Büro“; Urteil „passend“; 6 Platzhalter

## Doppellauf
- OK: endungen.docx: zwei Läufe byte-gleich
- OK: endungen.txt: zwei Läufe byte-gleich
- OK: endungen.csv: zwei Läufe byte-gleich

## Gemeldet, nicht gebaut: GROSSSCHREIBUNG mit Endung („QUABBENJANSENS“)
- 6 Formen in GROSSSCHREIBUNG mit Endung „S“: nicht ersetzt 6 (LÜDINGHAUSS, WITTEKINDHORNS, QUABBENJANSENS, OSTERVELKENSS, HALLERMESS, TÖNNIESKAMPES); davon vom Schlusscheck gemeldet: 6.
- Grund: Die Endungsliste enthält nur kleine Endungen („s“), ein großes „S“ zählt nicht als Endung (wie in 2.3.0). Das zu ändern wäre eine Erweiterung der Regel (Entscheidung Easy).
- Ohne kleine gebeugte Form im Dokument, 2.3.0: „Herr Person A kommt. QUABBENJANSENS Akte liegt vor.“ → Schlusscheck: keine Meldung | „Herr Person A kommt. MÜLLERS Akte liegt vor.“ → Schlusscheck: keine Meldung
- dasselbe, 2.3.1: „Herr Person A kommt. QUABBENJANSENS Akte liegt vor.“ → Schlusscheck: keine Meldung | „Herr Person A kommt. MÜLLERS Akte liegt vor.“ → Schlusscheck: keine Meldung
- Befund (bestand schon in 2.3.0, nicht Teil dieses Auftrags): Solche Formen bleiben unbemerkt stehen. Vorschlag: Endungen ohne Rücksicht auf Groß-/Kleinschreibung prüfen (beim Ersetzen und im Schlusscheck) – Entscheidung Easy.

Prüfungen: 21 von 21 bestanden.
Netzwerkanfragen außer lokalen Dateien: 0.
