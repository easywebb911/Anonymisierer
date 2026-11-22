# Ziel-Test „nachbarn“ (Version 2.8.1): Person neben Einrichtung

Geprüft: Anonymisierer/index.html; Vorversion 2.7.0: index-270.html; Vergleich 2.8.0: index-main-280.html. Nur Chromium, Firefox prüft Easy.

Soll-Wörter (müssen ersetzt sein): Personen Quarbeck, Broszat, Tewesmeier, Jana, Wolters, Tobias, Hellwig, Anja, Petersen, Brandner, Lindenau, Horten, Nikita, Schulenburg, Melanie, Grawert, Lindqvist, Halvorsen, Fuchs; Einrichtungen Sonnenblume, Wiesenkamp, Lindgrün, Regenbogen, Lindenhof.
Nicht im Soll: „Koch“ in „Bitte wenden Sie sich an Koch.“ – mehrdeutiges Wort nach Präposition, in 2.7.0, 2.8.0 und 2.8.1 gleich „unsicher, aus“ und gefragt (Wortliste „mehrdeutig“, nicht Teil dieses Auftrags).

## 1. Soll / gemessen (offene Stellen; Soll = 0)

| Format | Modus | a) ohne Antwort | b) nach „Nein“ | c) „Unsichere“ aus | c2) „Unsichere“ aus, dann „Nein“ | 2.8.0: a / b / c |
|---|---|---|---|---|---|---|
- OK: txt, person, nein: kein Name im Klartext, den 2.7.0 oder 2.8.0 ersetzt
- OK: txt, person, janein: kein Name im Klartext, den 2.7.0 oder 2.8.0 ersetzt
- OK: txt, person, neinjanein: kein Name im Klartext, den 2.7.0 oder 2.8.0 ersetzt
- OK: txt, person, liste: kein Name im Klartext, den 2.7.0 oder 2.8.0 ersetzt
- OK: txt, person, aus: kein Name im Klartext, den 2.7.0 oder 2.8.0 ersetzt
- OK: txt, person, ausnein: kein Name im Klartext, den 2.7.0 oder 2.8.0 ersetzt
- OK: txt, person: Weg-Gleichheit „Ja“ → „Nein“ = „Nein“
- OK: txt, person: Weg-Gleichheit „Nein“ → „Ja“ → „Nein“ = „Nein“
- OK: txt, person: Weg-Gleichheit „Ja“ → „Nein“ → „Ja“ = „Ja“
| txt | person | 0 | 0 | 0 | 0 | 2 / 2 / 3 |
- OK: txt, person: a) ohne Antwort jede Person und Einrichtung ersetzt
- OK: txt, person: b) nach „Nein“ auf alle Einrichtungs-Fragen jede Person ersetzt
- OK: txt, person: c) „Unsichere“ aus: alles ersetzt, was 2.7.0 so ersetzt
- OK: txt, person: c2) „Unsichere“ aus, dann alle „Nein“: alles ersetzt, was 2.7.0 so ersetzt
- OK: txt, name, nein: kein Name im Klartext, den 2.7.0 oder 2.8.0 ersetzt
- OK: txt, name, janein: kein Name im Klartext, den 2.7.0 oder 2.8.0 ersetzt
- OK: txt, name, neinjanein: kein Name im Klartext, den 2.7.0 oder 2.8.0 ersetzt
- OK: txt, name, liste: kein Name im Klartext, den 2.7.0 oder 2.8.0 ersetzt
- OK: txt, name, aus: kein Name im Klartext, den 2.7.0 oder 2.8.0 ersetzt
- OK: txt, name, ausnein: kein Name im Klartext, den 2.7.0 oder 2.8.0 ersetzt
- OK: txt, name: Weg-Gleichheit „Ja“ → „Nein“ = „Nein“
- OK: txt, name: Weg-Gleichheit „Nein“ → „Ja“ → „Nein“ = „Nein“
- OK: txt, name: Weg-Gleichheit „Ja“ → „Nein“ → „Ja“ = „Ja“
| txt | name | 0 | 0 | 0 | 0 | 2 / 2 / 3 |
- OK: txt, name: a) ohne Antwort jede Person und Einrichtung ersetzt
- OK: txt, name: b) nach „Nein“ auf alle Einrichtungs-Fragen jede Person ersetzt
- OK: txt, name: c) „Unsichere“ aus: alles ersetzt, was 2.7.0 so ersetzt
- OK: txt, name: c2) „Unsichere“ aus, dann alle „Nein“: alles ersetzt, was 2.7.0 so ersetzt
- OK: txt, reversible, nein: kein Name im Klartext, den 2.7.0 oder 2.8.0 ersetzt
- OK: txt, reversible, janein: kein Name im Klartext, den 2.7.0 oder 2.8.0 ersetzt
- OK: txt, reversible, neinjanein: kein Name im Klartext, den 2.7.0 oder 2.8.0 ersetzt
- OK: txt, reversible, liste: kein Name im Klartext, den 2.7.0 oder 2.8.0 ersetzt
- OK: txt, reversible, aus: kein Name im Klartext, den 2.7.0 oder 2.8.0 ersetzt
- OK: txt, reversible, ausnein: kein Name im Klartext, den 2.7.0 oder 2.8.0 ersetzt
- OK: txt, reversible: Weg-Gleichheit „Ja“ → „Nein“ = „Nein“
- OK: txt, reversible: Weg-Gleichheit „Nein“ → „Ja“ → „Nein“ = „Nein“
- OK: txt, reversible: Weg-Gleichheit „Ja“ → „Nein“ → „Ja“ = „Ja“
| txt | reversible | 0 | 0 | 0 | 0 | 2 / 2 / 3 |
- OK: txt, reversible: a) ohne Antwort jede Person und Einrichtung ersetzt
- OK: txt, reversible: b) nach „Nein“ auf alle Einrichtungs-Fragen jede Person ersetzt
- OK: txt, reversible: c) „Unsichere“ aus: alles ersetzt, was 2.7.0 so ersetzt
- OK: txt, reversible: c2) „Unsichere“ aus, dann alle „Nein“: alles ersetzt, was 2.7.0 so ersetzt
- OK: csv, person, nein: kein Name im Klartext, den 2.7.0 oder 2.8.0 ersetzt
- OK: csv, person, janein: kein Name im Klartext, den 2.7.0 oder 2.8.0 ersetzt
- OK: csv, person, neinjanein: kein Name im Klartext, den 2.7.0 oder 2.8.0 ersetzt
- OK: csv, person, liste: kein Name im Klartext, den 2.7.0 oder 2.8.0 ersetzt
- OK: csv, person, aus: kein Name im Klartext, den 2.7.0 oder 2.8.0 ersetzt
- OK: csv, person, ausnein: kein Name im Klartext, den 2.7.0 oder 2.8.0 ersetzt
- OK: csv, person: Weg-Gleichheit „Ja“ → „Nein“ = „Nein“
- OK: csv, person: Weg-Gleichheit „Nein“ → „Ja“ → „Nein“ = „Nein“
- OK: csv, person: Weg-Gleichheit „Ja“ → „Nein“ → „Ja“ = „Ja“
| csv | person | 0 | 0 | 0 | 0 | 2 / 2 / 3 |
- OK: csv, person: a) ohne Antwort jede Person und Einrichtung ersetzt
- OK: csv, person: b) nach „Nein“ auf alle Einrichtungs-Fragen jede Person ersetzt
- OK: csv, person: c) „Unsichere“ aus: alles ersetzt, was 2.7.0 so ersetzt
- OK: csv, person: c2) „Unsichere“ aus, dann alle „Nein“: alles ersetzt, was 2.7.0 so ersetzt
- OK: csv, name, nein: kein Name im Klartext, den 2.7.0 oder 2.8.0 ersetzt
- OK: csv, name, janein: kein Name im Klartext, den 2.7.0 oder 2.8.0 ersetzt
- OK: csv, name, neinjanein: kein Name im Klartext, den 2.7.0 oder 2.8.0 ersetzt
- OK: csv, name, liste: kein Name im Klartext, den 2.7.0 oder 2.8.0 ersetzt
- OK: csv, name, aus: kein Name im Klartext, den 2.7.0 oder 2.8.0 ersetzt
- OK: csv, name, ausnein: kein Name im Klartext, den 2.7.0 oder 2.8.0 ersetzt
- OK: csv, name: Weg-Gleichheit „Ja“ → „Nein“ = „Nein“
- OK: csv, name: Weg-Gleichheit „Nein“ → „Ja“ → „Nein“ = „Nein“
- OK: csv, name: Weg-Gleichheit „Ja“ → „Nein“ → „Ja“ = „Ja“
| csv | name | 0 | 0 | 0 | 0 | 2 / 2 / 3 |
- OK: csv, name: a) ohne Antwort jede Person und Einrichtung ersetzt
- OK: csv, name: b) nach „Nein“ auf alle Einrichtungs-Fragen jede Person ersetzt
- OK: csv, name: c) „Unsichere“ aus: alles ersetzt, was 2.7.0 so ersetzt
- OK: csv, name: c2) „Unsichere“ aus, dann alle „Nein“: alles ersetzt, was 2.7.0 so ersetzt
- OK: csv, reversible, nein: kein Name im Klartext, den 2.7.0 oder 2.8.0 ersetzt
- OK: csv, reversible, janein: kein Name im Klartext, den 2.7.0 oder 2.8.0 ersetzt
- OK: csv, reversible, neinjanein: kein Name im Klartext, den 2.7.0 oder 2.8.0 ersetzt
- OK: csv, reversible, liste: kein Name im Klartext, den 2.7.0 oder 2.8.0 ersetzt
- OK: csv, reversible, aus: kein Name im Klartext, den 2.7.0 oder 2.8.0 ersetzt
- OK: csv, reversible, ausnein: kein Name im Klartext, den 2.7.0 oder 2.8.0 ersetzt
- OK: csv, reversible: Weg-Gleichheit „Ja“ → „Nein“ = „Nein“
- OK: csv, reversible: Weg-Gleichheit „Nein“ → „Ja“ → „Nein“ = „Nein“
- OK: csv, reversible: Weg-Gleichheit „Ja“ → „Nein“ → „Ja“ = „Ja“
| csv | reversible | 0 | 0 | 0 | 0 | 2 / 2 / 3 |
- OK: csv, reversible: a) ohne Antwort jede Person und Einrichtung ersetzt
- OK: csv, reversible: b) nach „Nein“ auf alle Einrichtungs-Fragen jede Person ersetzt
- OK: csv, reversible: c) „Unsichere“ aus: alles ersetzt, was 2.7.0 so ersetzt
- OK: csv, reversible: c2) „Unsichere“ aus, dann alle „Nein“: alles ersetzt, was 2.7.0 so ersetzt
- OK: xlsx, person, nein: kein Name im Klartext, den 2.7.0 oder 2.8.0 ersetzt
- OK: xlsx, person, janein: kein Name im Klartext, den 2.7.0 oder 2.8.0 ersetzt
- OK: xlsx, person, neinjanein: kein Name im Klartext, den 2.7.0 oder 2.8.0 ersetzt
- OK: xlsx, person, liste: kein Name im Klartext, den 2.7.0 oder 2.8.0 ersetzt
- OK: xlsx, person, aus: kein Name im Klartext, den 2.7.0 oder 2.8.0 ersetzt
- OK: xlsx, person, ausnein: kein Name im Klartext, den 2.7.0 oder 2.8.0 ersetzt
- OK: xlsx, person: Weg-Gleichheit „Ja“ → „Nein“ = „Nein“
- OK: xlsx, person: Weg-Gleichheit „Nein“ → „Ja“ → „Nein“ = „Nein“
- OK: xlsx, person: Weg-Gleichheit „Ja“ → „Nein“ → „Ja“ = „Ja“
| xlsx | person | 0 | 0 | 0 | 0 | 2 / 2 / 3 |
- OK: xlsx, person: a) ohne Antwort jede Person und Einrichtung ersetzt
- OK: xlsx, person: b) nach „Nein“ auf alle Einrichtungs-Fragen jede Person ersetzt
- OK: xlsx, person: c) „Unsichere“ aus: alles ersetzt, was 2.7.0 so ersetzt
- OK: xlsx, person: c2) „Unsichere“ aus, dann alle „Nein“: alles ersetzt, was 2.7.0 so ersetzt
- OK: xlsx, name, nein: kein Name im Klartext, den 2.7.0 oder 2.8.0 ersetzt
- OK: xlsx, name, janein: kein Name im Klartext, den 2.7.0 oder 2.8.0 ersetzt
- OK: xlsx, name, neinjanein: kein Name im Klartext, den 2.7.0 oder 2.8.0 ersetzt
- OK: xlsx, name, liste: kein Name im Klartext, den 2.7.0 oder 2.8.0 ersetzt
- OK: xlsx, name, aus: kein Name im Klartext, den 2.7.0 oder 2.8.0 ersetzt
- OK: xlsx, name, ausnein: kein Name im Klartext, den 2.7.0 oder 2.8.0 ersetzt
- OK: xlsx, name: Weg-Gleichheit „Ja“ → „Nein“ = „Nein“
- OK: xlsx, name: Weg-Gleichheit „Nein“ → „Ja“ → „Nein“ = „Nein“
- OK: xlsx, name: Weg-Gleichheit „Ja“ → „Nein“ → „Ja“ = „Ja“
| xlsx | name | 0 | 0 | 0 | 0 | 2 / 2 / 3 |
- OK: xlsx, name: a) ohne Antwort jede Person und Einrichtung ersetzt
- OK: xlsx, name: b) nach „Nein“ auf alle Einrichtungs-Fragen jede Person ersetzt
- OK: xlsx, name: c) „Unsichere“ aus: alles ersetzt, was 2.7.0 so ersetzt
- OK: xlsx, name: c2) „Unsichere“ aus, dann alle „Nein“: alles ersetzt, was 2.7.0 so ersetzt
- OK: xlsx, reversible, nein: kein Name im Klartext, den 2.7.0 oder 2.8.0 ersetzt
- OK: xlsx, reversible, janein: kein Name im Klartext, den 2.7.0 oder 2.8.0 ersetzt
- OK: xlsx, reversible, neinjanein: kein Name im Klartext, den 2.7.0 oder 2.8.0 ersetzt
- OK: xlsx, reversible, liste: kein Name im Klartext, den 2.7.0 oder 2.8.0 ersetzt
- OK: xlsx, reversible, aus: kein Name im Klartext, den 2.7.0 oder 2.8.0 ersetzt
- OK: xlsx, reversible, ausnein: kein Name im Klartext, den 2.7.0 oder 2.8.0 ersetzt
- OK: xlsx, reversible: Weg-Gleichheit „Ja“ → „Nein“ = „Nein“
- OK: xlsx, reversible: Weg-Gleichheit „Nein“ → „Ja“ → „Nein“ = „Nein“
- OK: xlsx, reversible: Weg-Gleichheit „Ja“ → „Nein“ → „Ja“ = „Ja“
| xlsx | reversible | 0 | 0 | 0 | 0 | 2 / 2 / 3 |
- OK: xlsx, reversible: a) ohne Antwort jede Person und Einrichtung ersetzt
- OK: xlsx, reversible: b) nach „Nein“ auf alle Einrichtungs-Fragen jede Person ersetzt
- OK: xlsx, reversible: c) „Unsichere“ aus: alles ersetzt, was 2.7.0 so ersetzt
- OK: xlsx, reversible: c2) „Unsichere“ aus, dann alle „Nein“: alles ersetzt, was 2.7.0 so ersetzt

Ausnahmen (einzeln; erlaubt nur, wenn offen allein der Zusatz „vom / von der“ ist – jedes Namens-Zeichen ist ersetzt):
- keine

## 1b. nachbarn-offen.* (Teil 4 herausgenommen – offen, eigener Auftrag)
Soll hier nur: jede Person ersetzt (wie 2.8.0). Der Name der Einrichtung hinter „vom / von der“ bleibt wie in 2.8.0 Klartext (gelistet, kein Fehler).
- OK: nachbarn-offen.txt, person: ohne Antwort jede Person ersetzt
- OK: nachbarn-offen.txt, person: „Unsichere“ aus, „Nein“, „Ja“ → „Nein“, Liste aus: nichts im Klartext, was 2.7.0 oder 2.8.0 so ersetzt
- OFFEN (eigener Auftrag): Wörter im Klartext ohne Antwort: Kirchberg, Tannhofen, Regenbogen, Birkenhain, Lindgrün, Wiesenkamp, Mühlbach
- OK: nachbarn-offen.txt, name: ohne Antwort jede Person ersetzt
- OK: nachbarn-offen.txt, name: „Unsichere“ aus, „Nein“, „Ja“ → „Nein“, Liste aus: nichts im Klartext, was 2.7.0 oder 2.8.0 so ersetzt
- OK: nachbarn-offen.txt, reversible: ohne Antwort jede Person ersetzt
- OK: nachbarn-offen.txt, reversible: „Unsichere“ aus, „Nein“, „Ja“ → „Nein“, Liste aus: nichts im Klartext, was 2.7.0 oder 2.8.0 so ersetzt
- OK: nachbarn-offen.csv, person: ohne Antwort jede Person ersetzt
- OK: nachbarn-offen.csv, person: „Unsichere“ aus, „Nein“, „Ja“ → „Nein“, Liste aus: nichts im Klartext, was 2.7.0 oder 2.8.0 so ersetzt
- OK: nachbarn-offen.csv, name: ohne Antwort jede Person ersetzt
- OK: nachbarn-offen.csv, name: „Unsichere“ aus, „Nein“, „Ja“ → „Nein“, Liste aus: nichts im Klartext, was 2.7.0 oder 2.8.0 so ersetzt
- OK: nachbarn-offen.csv, reversible: ohne Antwort jede Person ersetzt
- OK: nachbarn-offen.csv, reversible: „Unsichere“ aus, „Nein“, „Ja“ → „Nein“, Liste aus: nichts im Klartext, was 2.7.0 oder 2.8.0 so ersetzt
- OK: nachbarn-offen.xlsx, person: ohne Antwort jede Person ersetzt
- OK: nachbarn-offen.xlsx, person: „Unsichere“ aus, „Nein“, „Ja“ → „Nein“, Liste aus: nichts im Klartext, was 2.7.0 oder 2.8.0 so ersetzt
- OK: nachbarn-offen.xlsx, name: ohne Antwort jede Person ersetzt
- OK: nachbarn-offen.xlsx, name: „Unsichere“ aus, „Nein“, „Ja“ → „Nein“, Liste aus: nichts im Klartext, was 2.7.0 oder 2.8.0 so ersetzt
- OK: nachbarn-offen.xlsx, reversible: ohne Antwort jede Person ersetzt
- OK: nachbarn-offen.xlsx, reversible: „Unsichere“ aus, „Nein“, „Ja“ → „Nein“, Liste aus: nichts im Klartext, was 2.7.0 oder 2.8.0 so ersetzt

## 2. Bedienwege über die Oberfläche (TXT, Modus „Person A“)
- OK: Teil 1: „Unsichere“ aus – „Der Verein Quarbeck“, „Die Kanzlei Broszat“, „Das Institut Tewesmeier“: Name ersetzt – Der Verein Person A lädt ein. | Die Kanzlei Person E berät Sie gern. | Das Institut Person F schreibt aus.
- OK: Teil 1: „Unsichere“ aus, Schalter „Koch“ an – „Die Praxis Koch“: Name ersetzt – die Praxis Lindqvist ist am Montag zu.
- OK: Teil 2: „Kita Sonnenblume“ in der Liste aus, dann von Hand markiert – ersetzt und sicher – aus: Klartext; danach 3 Stellen, an: true, sicher
- OK: Teil 2: „Familienzentrum Wiesenkamp“ in der Liste aus, dann von Hand markiert – ersetzt und sicher – aus: Klartext; danach 1 Stellen, an: true, sicher
- OK: Teil 2: „Musikschule Lindgrün“ in der Liste aus, dann von Hand markiert – ersetzt und sicher – aus: Klartext; danach 1 Stellen, an: true, sicher
- OK: Teil 2: „Jana Wolters“ in der Liste aus, dann „Als Name markieren“ – ersetzt – aus: Klartext; danach ersetzt
- OK: Echte Namen mit Zusatz bleiben ganz („von Brandner“, „van der Lindenau“, „von Horten“, „Anja von Horten“, „von Schulenburg“) – von Brandner, van der Lindenau, von Horten, Anja von Horten, Nikita Brandner, von Schulenburg
- OK: Oberfläche: kein Text „null“ oder „undefined“
- OK: Fund 2: „Melanie Grawert“ (selbst erkannt) in der Liste aus, dann „Als Name markieren“ – ersetzt – aus: Klartext; danach ersetzt
- OK: Fund 2: „Melanie Grawert“ (selbst erkannt) in der Liste aus, dann „Als Name markieren“ – ersetzt („Unsichere“ aus) – aus: Klartext; danach ersetzt
- OK: Lauf 2, Fund 3: „Melanie Grawert“ aus, dann nur „Grawert“ als Name markiert – „Grawert“ ersetzt
- OK: Lauf 2, Fund 3: „Melanie Grawert“ aus, dann nur „Grawert“ als Name markiert – „Grawert“ ersetzt („Unsichere“ aus)
- OK: Lauf 2, Fund 1: „Praxis Lindqvist“ „Nein“ – Name ersetzt – Die Person C Person B ist am Montag zu.
- OK: Lauf 2, Fund 2: „Praxis Lindqvist“ „Nein“, „Unsichere“ aus, dann „Lindqvist“ als Name markiert – Name ersetzt – Die Person C Koch ist am Montag zu.
- OK: Lauf 2, Fund 1: „Praxis Lindqvist“ in der Liste aus – Name ersetzt – Die Person C Person B ist am Montag zu.
- OK: Lauf 2, Fund 2: „Praxis Lindqvist“ in der Liste aus, „Unsichere“ aus, dann „Lindqvist“ als Name markiert – Name ersetzt – Die Person C Koch ist am Montag zu.
- OK: Lauf 3, Fund 2: Dateiangaben-Frage „Ja“ → „Nein“ = direkt „Nein“ (Person vorher in der Liste aus)
- OK: Lauf 3, Fund 2: Dateiangaben-Frage „Nein“ → „Ja“ → „Nein“ = direkt „Nein“
- OK: Lauf 3, Fund 2: Dateiangaben-Frage „Ja“ → „Nein“ → „Ja“ = direkt „Ja“
- OK: Lauf 5, Fund 1: „Quarbeck“ als eigener Name – „PRAXIS QUARBECKS hat zu.“ ohne Antwort ohne Namen im Klartext – Einrichtung A hat zu.
- OK: Fund 4: Person „Jana Wolters“ aus – Einrichtung bleibt „Kita Sonnenblume“; danach als Name markiert: Person ersetzt – vorher Kita Sonnenblume; nach Ausschalten Kita Sonnenblume; Person an: 1; Einrichtung D Person G
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

**Ergebnis: bestanden** (168/168).
