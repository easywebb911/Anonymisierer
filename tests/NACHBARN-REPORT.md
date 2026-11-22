# Ziel-Test „nachbarn“ (Version 2.8.1): Person neben Einrichtung

Geprüft: Anonymisierer/index.html; Vorversion 2.7.0: index-270.html; Vergleich 2.8.0: index-main-280.html. Nur Chromium, Firefox prüft Easy.

Soll-Wörter (müssen ersetzt sein): Personen Quarbeck, Broszat, Tewesmeier, Jana, Wolters, Tobias, Hellwig, Anja, Petersen, Okonkwo, Lehmann, Schuster, Demir, Kowalski, Albers, Brandner, Lindenau, Horten, Nikita, Schulenburg, Brennecke, Melanie, Grawert; Einrichtungen Sonnenblume, Wiesenkamp, Lindgrün, Regenbogen, Lindenhof, Kirchberg, Tannhofen, Holzbau, Birkenhain, Mühlbach.
Nicht im Soll: „Koch“ in „Bitte wenden Sie sich an Koch.“ – mehrdeutiges Wort nach Präposition, in 2.7.0, 2.8.0 und 2.8.1 gleich „unsicher, aus“ und gefragt (Wortliste „mehrdeutig“, nicht Teil dieses Auftrags).

## 1. Soll / gemessen (offene Stellen; Soll = 0)

| Format | Modus | a) ohne Antwort | b) nach „Nein“ | c) „Unsichere“ aus | c2) „Unsichere“ aus, dann „Nein“ | 2.8.0: a / b / c |
|---|---|---|---|---|---|---|
| txt | person | 0 | 0 | 0 | 0 | 11 / 0 / 3 |
- OK: txt, person: a) ohne Antwort jede Person und Einrichtung ersetzt
- OK: txt, person: b) nach „Nein“ auf alle Einrichtungs-Fragen jede Person ersetzt
- OK: txt, person: c) „Unsichere“ aus: alles ersetzt, was 2.7.0 so ersetzt
- OK: txt, person: c2) „Unsichere“ aus, dann alle „Nein“: alles ersetzt, was 2.7.0 so ersetzt
| txt | name | 0 | 0 | 0 | 0 | 11 / 0 / 3 |
- OK: txt, name: a) ohne Antwort jede Person und Einrichtung ersetzt
- OK: txt, name: b) nach „Nein“ auf alle Einrichtungs-Fragen jede Person ersetzt
- OK: txt, name: c) „Unsichere“ aus: alles ersetzt, was 2.7.0 so ersetzt
- OK: txt, name: c2) „Unsichere“ aus, dann alle „Nein“: alles ersetzt, was 2.7.0 so ersetzt
| txt | reversible | 0 | 0 | 0 | 0 | 11 / 0 / 3 |
- OK: txt, reversible: a) ohne Antwort jede Person und Einrichtung ersetzt
- OK: txt, reversible: b) nach „Nein“ auf alle Einrichtungs-Fragen jede Person ersetzt
- OK: txt, reversible: c) „Unsichere“ aus: alles ersetzt, was 2.7.0 so ersetzt
- OK: txt, reversible: c2) „Unsichere“ aus, dann alle „Nein“: alles ersetzt, was 2.7.0 so ersetzt
| csv | person | 0 | 0 | 0 | 0 | 11 / 0 / 3 |
- OK: csv, person: a) ohne Antwort jede Person und Einrichtung ersetzt
- OK: csv, person: b) nach „Nein“ auf alle Einrichtungs-Fragen jede Person ersetzt
- OK: csv, person: c) „Unsichere“ aus: alles ersetzt, was 2.7.0 so ersetzt
- OK: csv, person: c2) „Unsichere“ aus, dann alle „Nein“: alles ersetzt, was 2.7.0 so ersetzt
| csv | name | 0 | 0 | 0 | 0 | 11 / 0 / 3 |
- OK: csv, name: a) ohne Antwort jede Person und Einrichtung ersetzt
- OK: csv, name: b) nach „Nein“ auf alle Einrichtungs-Fragen jede Person ersetzt
- OK: csv, name: c) „Unsichere“ aus: alles ersetzt, was 2.7.0 so ersetzt
- OK: csv, name: c2) „Unsichere“ aus, dann alle „Nein“: alles ersetzt, was 2.7.0 so ersetzt
| csv | reversible | 0 | 0 | 0 | 0 | 11 / 0 / 3 |
- OK: csv, reversible: a) ohne Antwort jede Person und Einrichtung ersetzt
- OK: csv, reversible: b) nach „Nein“ auf alle Einrichtungs-Fragen jede Person ersetzt
- OK: csv, reversible: c) „Unsichere“ aus: alles ersetzt, was 2.7.0 so ersetzt
- OK: csv, reversible: c2) „Unsichere“ aus, dann alle „Nein“: alles ersetzt, was 2.7.0 so ersetzt
| xlsx | person | 0 | 0 | 0 | 0 | 11 / 0 / 3 |
- OK: xlsx, person: a) ohne Antwort jede Person und Einrichtung ersetzt
- OK: xlsx, person: b) nach „Nein“ auf alle Einrichtungs-Fragen jede Person ersetzt
- OK: xlsx, person: c) „Unsichere“ aus: alles ersetzt, was 2.7.0 so ersetzt
- OK: xlsx, person: c2) „Unsichere“ aus, dann alle „Nein“: alles ersetzt, was 2.7.0 so ersetzt
| xlsx | name | 0 | 0 | 0 | 0 | 11 / 0 / 3 |
- OK: xlsx, name: a) ohne Antwort jede Person und Einrichtung ersetzt
- OK: xlsx, name: b) nach „Nein“ auf alle Einrichtungs-Fragen jede Person ersetzt
- OK: xlsx, name: c) „Unsichere“ aus: alles ersetzt, was 2.7.0 so ersetzt
- OK: xlsx, name: c2) „Unsichere“ aus, dann alle „Nein“: alles ersetzt, was 2.7.0 so ersetzt
| xlsx | reversible | 0 | 0 | 0 | 0 | 11 / 0 / 3 |
- OK: xlsx, reversible: a) ohne Antwort jede Person und Einrichtung ersetzt
- OK: xlsx, reversible: b) nach „Nein“ auf alle Einrichtungs-Fragen jede Person ersetzt
- OK: xlsx, reversible: c) „Unsichere“ aus: alles ersetzt, was 2.7.0 so ersetzt
- OK: xlsx, reversible: c2) „Unsichere“ aus, dann alle „Nein“: alles ersetzt, was 2.7.0 so ersetzt

Ausnahmen in c (einzeln, Grund: Teil 4 – ein Kopfwort der Einrichtungs-Suche gehört nicht mehr zu einem Personennamen; 2.7.0 hatte es als Teil eines Namens ersetzt):
- txt: Familienzentrum → offen: Familienzentrum
- txt: Musikschule → offen: Musikschule
- txt: Kindergarten → offen: Kindergarten
- txt: Okonkwo vom Gymnasium → offen: vom Gymnasium
- txt: Lehmann von der Firma → offen: von der Firma
- txt: Schuster vom Kindergarten → offen: vom Kindergarten
- txt: Demir vom Verein → offen: vom Verein
- txt: Kowalski von der Musikschule → offen: von der Musikschule
- txt: Albers vom Familienzentrum → offen: vom Familienzentrum
- txt: Brennecke von der Grundschule → offen: von der Grundschule
- csv: Familienzentrum → offen: Familienzentrum
- csv: Musikschule → offen: Musikschule
- csv: Kindergarten → offen: Kindergarten
- csv: Okonkwo vom Gymnasium → offen: vom Gymnasium
- csv: Lehmann von der Firma → offen: von der Firma
- csv: Schuster vom Kindergarten → offen: vom Kindergarten
- csv: Demir vom Verein → offen: vom Verein
- csv: Kowalski von der Musikschule → offen: von der Musikschule
- csv: Albers vom Familienzentrum → offen: vom Familienzentrum
- csv: Brennecke von der Grundschule → offen: von der Grundschule
- xlsx: Familienzentrum → offen: Familienzentrum
- xlsx: Musikschule → offen: Musikschule
- xlsx: Kindergarten → offen: Kindergarten
- xlsx: Okonkwo vom Gymnasium → offen: vom Gymnasium
- xlsx: Lehmann von der Firma → offen: von der Firma
- xlsx: Schuster vom Kindergarten → offen: vom Kindergarten
- xlsx: Demir vom Verein → offen: vom Verein
- xlsx: Kowalski von der Musikschule → offen: von der Musikschule
- xlsx: Albers vom Familienzentrum → offen: vom Familienzentrum
- xlsx: Brennecke von der Grundschule → offen: von der Grundschule

## 2. Bedienwege über die Oberfläche (TXT, Modus „Person A“)
- OK: Teil 1: „Unsichere“ aus – „Der Verein Quarbeck“, „Die Kanzlei Broszat“, „Das Institut Tewesmeier“: Name ersetzt – Der Verein Person A lädt ein. | Die Kanzlei Person D berät Sie gern. | Das Institut Person E schreibt aus. | Herr Person M vom Verein Birkenhain e. V.
- OK: Teil 1: „Unsichere“ aus, Schalter „Koch“ an – „Die Praxis Koch“: Name ersetzt – Die Praxis Person B ist am Montag zu.
- OK: Teil 2: „Kita Sonnenblume“ in der Liste aus, dann von Hand markiert – ersetzt und sicher – aus: Klartext; danach 3 Stellen, an: true, sicher
- OK: Teil 2: „Familienzentrum Wiesenkamp“ in der Liste aus, dann von Hand markiert – ersetzt und sicher – aus: Klartext; danach 2 Stellen, an: true, sicher
- OK: Teil 2: „Musikschule Lindgrün“ in der Liste aus, dann von Hand markiert – ersetzt und sicher – aus: Klartext; danach 2 Stellen, an: true, sicher
- OK: Teil 2: „Jana Wolters“ in der Liste aus, dann „Als Name markieren“ – ersetzt – aus: Klartext; danach ersetzt
- OK: Teil 4: echte Namen mit Zusatz bleiben ganz („von Brandner“, „van der Lindenau“, „von Horten“, „Anja von Horten“, „von Schulenburg“) – von Brandner, van der Lindenau, von Horten, Anja von Horten, Nikita Brandner, von Schulenburg
- OK: Teil 4: Person endet vor „vom / von der“ + Kopfwort – Okonkwo, Lehmann, Schuster, Demir, Kowalski, Albers
- OK: Oberfläche: kein Text „null“ oder „undefined“
- OK: Fund 2: „Melanie Grawert“ (selbst erkannt) in der Liste aus, dann „Als Name markieren“ – ersetzt – aus: Klartext; danach ersetzt
- OK: Fund 2: „Melanie Grawert“ (selbst erkannt) in der Liste aus, dann „Als Name markieren“ – ersetzt („Unsichere“ aus) – aus: Klartext; danach ersetzt
- OK: Fund 4: Person „Jana Wolters“ aus – Einrichtung bleibt „Kita Sonnenblume“; danach als Name markiert: Person ersetzt – vorher Kita Sonnenblume; nach Ausschalten Kita Sonnenblume; Person an: 1; Einrichtung E Person F
- OK: Fund 4: Person „Jana Wolters“ aus – Einrichtung bleibt „Kita Sonnenblume“; danach als Name markiert: Person ersetzt („Unsichere“ aus) – vorher Kita Sonnenblume; nach Ausschalten Kita Sonnenblume; Person an: 1; 

## 3. Rückbau exakt (Modus rückbaufähig)
- OK: txt: Ausgabe ohne Soll-Wörter
- OK: txt: Rückbau exakt – passend
- OK: txt: Schlüsseldatei und Ausgabe aus 2.8.0, Rückbau mit dieser Version exakt – passend
- OK: csv: Ausgabe ohne Soll-Wörter
- OK: csv: Rückbau exakt – passend
- OK: csv: Schlüsseldatei und Ausgabe aus 2.8.0, Rückbau mit dieser Version exakt – passend
- OK: xlsx: Ausgabe ohne Soll-Wörter
- OK: xlsx: Rückbau exakt – passend
- OK: xlsx: Schlüsseldatei und Ausgabe aus 2.8.0, Rückbau mit dieser Version exakt – passend

- OK: 0 Anfragen ins Netz – 0
- OK: 0 Fehler in der Seite

**Ergebnis: bestanden** (60/60).
