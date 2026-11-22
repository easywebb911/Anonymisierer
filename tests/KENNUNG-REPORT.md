# Kennung (Version 2.1): Tests

Chromium headless, Start per file://, alle Schritte über die echte Oberfläche. Alle Namen erfunden (tests/make-kennung.mjs).

## Vertausch: zwei Dokumente nach gleicher Vorlage, Schlüssel über Kreuz
### DOCX: anonymisiert_R27T.docx + schluessel_R27T.json / anonymisiert_F233.docx + schluessel_F233.json
- Anonymisierter Text beider Dokumente gleich: ja (ohne Kennung wäre der Vertausch nicht zu erkennen)
- OK: docx: Dateinamen tragen die Kennung – anonymisiert_R27T.docx, schluessel_R27T.json
- OK: docx: Datei 1 + Schlüssel 2 (Originalname) → rot und blockiert – „Diese Schlüsseldatei gehört zu einem anderen Dokument (Dokument: R27T, Schlüssel: F233).…“; bisherige Prüfung allein: Urteil „passend“; nach ausdrücklicher Bestätigung frei: true
- OK: docx: umbenannt (bericht.docx) + eigener Schlüssel → grün (Kennung aus der Eigenschaft) – Kennung – Kennung R27T passt.
- OK: docx: umbenannt + fremder Schlüssel → rot und blockiert – Diese Schlüsseldatei gehört zu einem anderen Dokument (Dokument: R27T, Schlüssel: F233).
- OK: docx: richtiges Paar → grün, Rückbau exakt – Kennung – Kennung R27T passt.
### XLSX: anonymisiert_T6N9.xlsx + schluessel_T6N9.json / anonymisiert_3S9S.xlsx + schluessel_3S9S.json
- Anonymisierter Text beider Dokumente gleich: ja (ohne Kennung wäre der Vertausch nicht zu erkennen)
- OK: xlsx: Dateinamen tragen die Kennung – anonymisiert_T6N9.xlsx, schluessel_T6N9.json
- OK: xlsx: Datei 1 + Schlüssel 2 (Originalname) → rot und blockiert – „Diese Schlüsseldatei gehört zu einem anderen Dokument (Dokument: T6N9, Schlüssel: 3S9S).…“; bisherige Prüfung allein: Urteil „passend“; nach ausdrücklicher Bestätigung frei: true
- OK: xlsx: umbenannt (bericht.xlsx) + eigener Schlüssel → grün (Kennung aus der Eigenschaft) – Kennung – Kennung T6N9 passt.
- OK: xlsx: umbenannt + fremder Schlüssel → rot und blockiert – Diese Schlüsseldatei gehört zu einem anderen Dokument (Dokument: T6N9, Schlüssel: 3S9S).
- OK: xlsx: richtiges Paar → grün, Rückbau exakt – Kennung – Kennung T6N9 passt.
### TXT: anonymisiert_775V.txt + schluessel_775V.json / anonymisiert_X934.txt + schluessel_X934.json
- Anonymisierter Text beider Dokumente gleich: ja (ohne Kennung wäre der Vertausch nicht zu erkennen)
- OK: txt: Dateinamen tragen die Kennung – anonymisiert_775V.txt, schluessel_775V.json
- OK: txt: Datei 1 + Schlüssel 2 (Originalname) → rot und blockiert – „Diese Schlüsseldatei gehört zu einem anderen Dokument (Dokument: 775V, Schlüssel: X934).…“; bisherige Prüfung allein: Urteil „passend“; nach ausdrücklicher Bestätigung frei: true
- OK: txt: umbenannt (notiz.txt) + Schlüssel 2 → bernstein mit Abhaken – „Im Dokument steht keine Kennung. Der Schlüssel hat die Kennung X934. Prüfe, ob beide zusammengehören.…“; bisherige Prüfung: „passend“
- OK: txt: richtiges Paar → grün, Rückbau exakt – Kennung – Kennung 775V passt.
### CSV: anonymisiert_7Q2P.csv + schluessel_7Q2P.json / anonymisiert_Z25U.csv + schluessel_Z25U.json
- Anonymisierter Text beider Dokumente gleich: ja (ohne Kennung wäre der Vertausch nicht zu erkennen)
- OK: csv: Dateinamen tragen die Kennung – anonymisiert_7Q2P.csv, schluessel_7Q2P.json
- OK: csv: Datei 1 + Schlüssel 2 (Originalname) → rot und blockiert – „Diese Schlüsseldatei gehört zu einem anderen Dokument (Dokument: 7Q2P, Schlüssel: Z25U).…“; bisherige Prüfung allein: Urteil „passend“; nach ausdrücklicher Bestätigung frei: true
- OK: csv: umbenannt (notiz.csv) + Schlüssel 2 → bernstein mit Abhaken – „Im Dokument steht keine Kennung. Der Schlüssel hat die Kennung Z25U. Prüfe, ob beide zusammengehören.…“; bisherige Prüfung: „passend“
- OK: csv: richtiges Paar → grün, Rückbau exakt – Kennung – Kennung 7Q2P passt.

## Widerspruch zwischen Eigenschaft und Dateiname
- OK: Datei mit Eigenschaft K1, aber Namen K2 + Schlüssel K1 → Eigenschaft gilt (grün), Widerspruch wird gezeigt – Kennung – Kennung R27T passt. Die Eigenschaft in der Datei (R27T) und der Dateiname (F233) widersprechen sich; es gilt die Eigenschaft.
- OK: dieselbe Datei + Schlüssel K2 → rot (Eigenschaft K1 gilt), Widerspruch wird gezeigt – Diese Schlüsseldatei gehört zu einem anderen Dokument (Dokument: R27T, Schlüssel: F233). Die Eigenschaft in der Datei (R27T) und der Dateiname (F233) widersprec

## Schlüsseldatei aus Version 2.0 (ohne Kennung)
- übersprungen (keine index.html der Version 2.0 angegeben)

## Veralteter Schlüssel (nach dem Schlüssel noch einen Treffer geändert)
- OK: Nach der Änderung: neue Kennung sofort in den Dateikarten, „2 Datei speichern“ gesperrt – anonymisiert_H55Y.docx → anonymisiert_924F.docx
- OK: Alter und neuer Schlüssel haben verschiedene Kennungen – H55Y / 924F
- OK: ALTER Schlüssel + neue Datei → rot und blockiert – Diese Schlüsseldatei gehört zu einem anderen Dokument (Dokument: 924F, Schlüssel: H55Y).
- OK: neuer Schlüssel + neue Datei → grün – Kennung – Kennung 924F passt.

## Bearbeitung in LibreOffice (Inhalt geändert, dann in LibreOffice gespeichert)
- OK: docx: nach Änderung und Speichern in LibreOffice ist die Kennung noch da – Eigenschaft R27T, erwartet R27T
- OK: docx: LibreOffice-Datei (umbenannt) + Schlüssel → grün – Kennung – Kennung R27T passt.
- OK: xlsx: nach Änderung und Speichern in LibreOffice ist die Kennung noch da – Eigenschaft T6N9, erwartet T6N9
- OK: xlsx: LibreOffice-Datei (umbenannt) + Schlüssel → grün – Kennung – Kennung T6N9 passt.
- Microsoft Word und Excel selbst: **durch Code ungeprüft**.

## Doppellauf: Inhalt gleich, Kennung verschieden
- OK: docx: Inhalt beider Läufe gleich (Kennung ausgenommen), Schlüssel gleich (Kennung ausgenommen)
- OK: docx: Kennungen beider Läufe verschieden, Dateinamen unterscheiden sich nur in der Kennung – anonymisiert_M79M.docx / anonymisiert_A35W.docx
- OK: txt: Inhalt beider Läufe gleich (Kennung ausgenommen), Schlüssel gleich (Kennung ausgenommen)
- OK: txt: Kennungen beider Läufe verschieden, Dateinamen unterscheiden sich nur in der Kennung – anonymisiert_H2T4.txt / anonymisiert_7J5E.txt
- OK: Erneutes Laden derselben Datei und „Nächstes Dokument“ ergeben jeweils eine neue Kennung – 34F8, R96W, D8J4

## Zufalls-Beweis
- OK: Kennung entsteht nur in src/ui/kennung.js (newKennung) aus crypto.getRandomValues; alle Aufrufe ohne Dokumentdaten – Aufrufe in app.js: newKennung(), newKennung()
- OK: Mit festem Ersatz-Zufall gleiche Kennung vor und nach dem Laden eines Dokuments (kein Dokumentinhalt geht ein) – A3C5 / A3C5
- OK: 1000 Kennungen: nur erlaubte Zeichen, nie zwei Buchstaben nebeneinander
- Zeichen genutzt: 32 von 32. Je Buchstabe 55–83-mal, je Ziffer 272–318-mal (Ziffern häufiger, weil nie zwei Buchstaben nebeneinander stehen; innerhalb der Gruppe gleichmäßig).
- Mögliche Kennungen: 163 840. Doppelte unter 1000: 4 (erwartet rund 3).
- OK: Grobe Gleichverteilung innerhalb der Buchstaben und der Ziffern – Buchstaben 55–83, Ziffern 272–318

Prüfungen: 37 von 37 bestanden.
Netzwerkanfragen außer lokalen Dateien: 0.
