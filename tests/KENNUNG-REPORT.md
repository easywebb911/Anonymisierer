# Kennung (Version 2.1): Tests

Chromium headless, Start per file://, alle Schritte über die echte Oberfläche. Alle Namen erfunden (tests/make-kennung.mjs).

## Vertausch: zwei Dokumente nach gleicher Vorlage, Schlüssel über Kreuz
### DOCX: anonymisiert_W66X.docx + schluessel_W66X.json / anonymisiert_U45R.docx + schluessel_U45R.json
- Anonymisierter Text beider Dokumente gleich: ja (ohne Kennung wäre der Vertausch nicht zu erkennen)
- OK: docx: Dateinamen tragen die Kennung – anonymisiert_W66X.docx, schluessel_W66X.json
- OK: docx: Datei 1 + Schlüssel 2 (Originalname) → rot und blockiert – „Diese Schlüsseldatei gehört zu einem anderen Dokument (Dokument: W66X, Schlüssel: U45R).…“; bisherige Prüfung allein: Urteil „passend“; nach ausdrücklicher Bestätigung frei: true
- OK: docx: umbenannt (bericht.docx) + eigener Schlüssel → grün (Kennung aus der Eigenschaft) – Kennung – Kennung W66X passt.
- OK: docx: umbenannt + fremder Schlüssel → rot und blockiert – Diese Schlüsseldatei gehört zu einem anderen Dokument (Dokument: W66X, Schlüssel: U45R).
- OK: docx: richtiges Paar → grün, Rückbau exakt – Kennung – Kennung W66X passt.
### XLSX: anonymisiert_9Q8N.xlsx + schluessel_9Q8N.json / anonymisiert_K59X.xlsx + schluessel_K59X.json
- Anonymisierter Text beider Dokumente gleich: ja (ohne Kennung wäre der Vertausch nicht zu erkennen)
- OK: xlsx: Dateinamen tragen die Kennung – anonymisiert_9Q8N.xlsx, schluessel_9Q8N.json
- OK: xlsx: Datei 1 + Schlüssel 2 (Originalname) → rot und blockiert – „Diese Schlüsseldatei gehört zu einem anderen Dokument (Dokument: 9Q8N, Schlüssel: K59X).…“; bisherige Prüfung allein: Urteil „passend“; nach ausdrücklicher Bestätigung frei: true
- OK: xlsx: umbenannt (bericht.xlsx) + eigener Schlüssel → grün (Kennung aus der Eigenschaft) – Kennung – Kennung 9Q8N passt.
- OK: xlsx: umbenannt + fremder Schlüssel → rot und blockiert – Diese Schlüsseldatei gehört zu einem anderen Dokument (Dokument: 9Q8N, Schlüssel: K59X).
- OK: xlsx: richtiges Paar → grün, Rückbau exakt – Kennung – Kennung 9Q8N passt.
### TXT: anonymisiert_2E63.txt + schluessel_2E63.json / anonymisiert_C32V.txt + schluessel_C32V.json
- Anonymisierter Text beider Dokumente gleich: ja (ohne Kennung wäre der Vertausch nicht zu erkennen)
- OK: txt: Dateinamen tragen die Kennung – anonymisiert_2E63.txt, schluessel_2E63.json
- OK: txt: Datei 1 + Schlüssel 2 (Originalname) → rot und blockiert – „Diese Schlüsseldatei gehört zu einem anderen Dokument (Dokument: 2E63, Schlüssel: C32V).…“; bisherige Prüfung allein: Urteil „passend“; nach ausdrücklicher Bestätigung frei: true
- OK: txt: umbenannt (notiz.txt) + Schlüssel 2 → bernstein mit Abhaken – „Im Dokument steht keine Kennung. Der Schlüssel hat die Kennung C32V. Prüfe, ob beide zusammengehören.…“; bisherige Prüfung: „passend“
- OK: txt: richtiges Paar → grün, Rückbau exakt – Kennung – Kennung 2E63 passt.
### CSV: anonymisiert_8N6C.csv + schluessel_8N6C.json / anonymisiert_P337.csv + schluessel_P337.json
- Anonymisierter Text beider Dokumente gleich: ja (ohne Kennung wäre der Vertausch nicht zu erkennen)
- OK: csv: Dateinamen tragen die Kennung – anonymisiert_8N6C.csv, schluessel_8N6C.json
- OK: csv: Datei 1 + Schlüssel 2 (Originalname) → rot und blockiert – „Diese Schlüsseldatei gehört zu einem anderen Dokument (Dokument: 8N6C, Schlüssel: P337).…“; bisherige Prüfung allein: Urteil „passend“; nach ausdrücklicher Bestätigung frei: true
- OK: csv: umbenannt (notiz.csv) + Schlüssel 2 → bernstein mit Abhaken – „Im Dokument steht keine Kennung. Der Schlüssel hat die Kennung P337. Prüfe, ob beide zusammengehören.…“; bisherige Prüfung: „passend“
- OK: csv: richtiges Paar → grün, Rückbau exakt – Kennung – Kennung 8N6C passt.

## Widerspruch zwischen Eigenschaft und Dateiname
- OK: Datei mit Eigenschaft K1, aber Namen K2 + Schlüssel K1 → Eigenschaft gilt (grün), Widerspruch wird gezeigt – Kennung – Kennung W66X passt. Die Eigenschaft in der Datei (W66X) und der Dateiname (U45R) widersprechen sich; es gilt die Eigenschaft.
- OK: dieselbe Datei + Schlüssel K2 → rot (Eigenschaft K1 gilt), Widerspruch wird gezeigt – Diese Schlüsseldatei gehört zu einem anderen Dokument (Dokument: W66X, Schlüssel: U45R). Die Eigenschaft in der Datei (W66X) und der Dateiname (U45R) widersprec

## Schlüsseldatei aus Version 2.0 (ohne Kennung)
- übersprungen (keine index.html der Version 2.0 angegeben)

## Veralteter Schlüssel (nach dem Schlüssel noch einen Treffer geändert)
- OK: Nach der Änderung: neue Kennung sofort in den Dateikarten, „2 Datei speichern“ gesperrt – anonymisiert_W69G.docx → anonymisiert_633Z.docx
- OK: Alter und neuer Schlüssel haben verschiedene Kennungen – W69G / 633Z
- OK: ALTER Schlüssel + neue Datei → rot und blockiert – Diese Schlüsseldatei gehört zu einem anderen Dokument (Dokument: 633Z, Schlüssel: W69G).
- OK: neuer Schlüssel + neue Datei → grün – Kennung – Kennung 633Z passt.

## Bearbeitung in LibreOffice (Inhalt geändert, dann in LibreOffice gespeichert)
- OK: docx: nach Änderung und Speichern in LibreOffice ist die Kennung noch da – Eigenschaft W66X, erwartet W66X
- OK: docx: LibreOffice-Datei (umbenannt) + Schlüssel → grün – Kennung – Kennung W66X passt.
- OK: xlsx: nach Änderung und Speichern in LibreOffice ist die Kennung noch da – Eigenschaft 9Q8N, erwartet 9Q8N
- OK: xlsx: LibreOffice-Datei (umbenannt) + Schlüssel → grün – Kennung – Kennung 9Q8N passt.
- Microsoft Word und Excel selbst: **durch Code ungeprüft**.

## Doppellauf: Inhalt gleich, Kennung verschieden
- OK: docx: Inhalt beider Läufe gleich (Kennung ausgenommen), Schlüssel gleich (Kennung ausgenommen)
- OK: docx: Kennungen beider Läufe verschieden, Dateinamen unterscheiden sich nur in der Kennung – anonymisiert_2257.docx / anonymisiert_7W6Z.docx
- OK: txt: Inhalt beider Läufe gleich (Kennung ausgenommen), Schlüssel gleich (Kennung ausgenommen)
- OK: txt: Kennungen beider Läufe verschieden, Dateinamen unterscheiden sich nur in der Kennung – anonymisiert_S64S.txt / anonymisiert_K64N.txt
- OK: Erneutes Laden derselben Datei und „Nächstes Dokument“ ergeben jeweils eine neue Kennung – 66N6, 7S85, L323

## Zufalls-Beweis
- OK: Kennung entsteht nur in src/ui/kennung.js (newKennung) aus crypto.getRandomValues; alle Aufrufe ohne Dokumentdaten – Aufrufe in app.js: newKennung(), newKennung()
- OK: Mit festem Ersatz-Zufall gleiche Kennung vor und nach dem Laden eines Dokuments (kein Dokumentinhalt geht ein) – A3C5 / A3C5
- OK: 1000 Kennungen: nur erlaubte Zeichen, nie zwei Buchstaben nebeneinander
- Zeichen genutzt: 32 von 32. Je Buchstabe 57–83-mal, je Ziffer 279–314-mal (Ziffern häufiger, weil nie zwei Buchstaben nebeneinander stehen; innerhalb der Gruppe gleichmäßig).
- Mögliche Kennungen: 163 840. Doppelte unter 1000: 4 (erwartet rund 3).
- OK: Grobe Gleichverteilung innerhalb der Buchstaben und der Ziffern – Buchstaben 57–83, Ziffern 279–314

Prüfungen: 37 von 37 bestanden.
Netzwerkanfragen außer lokalen Dateien: 0.
