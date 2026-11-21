# Kennung (Version 2.1): Tests

Chromium headless, Start per file://, alle Schritte über die echte Oberfläche. Alle Namen erfunden (tests/make-kennung.mjs).

## Vertausch: zwei Dokumente nach gleicher Vorlage, Schlüssel über Kreuz
### DOCX: anonymisiert_H59T.docx + schluessel_H59T.json / anonymisiert_R9V7.docx + schluessel_R9V7.json
- Anonymisierter Text beider Dokumente gleich: ja (ohne Kennung wäre der Vertausch nicht zu erkennen)
- OK: docx: Dateinamen tragen die Kennung – anonymisiert_H59T.docx, schluessel_H59T.json
- OK: docx: Datei 1 + Schlüssel 2 (Originalname) → rot und blockiert – „Diese Schlüsseldatei gehört zu einem anderen Dokument (Dokument: H59T, Schlüssel: R9V7).…“; bisherige Prüfung allein: Urteil „passend“; nach ausdrücklicher Bestätigung frei: true
- OK: docx: umbenannt (bericht.docx) + eigener Schlüssel → grün (Kennung aus der Eigenschaft) – Kennung – Kennung H59T passt.
- OK: docx: umbenannt + fremder Schlüssel → rot und blockiert – Diese Schlüsseldatei gehört zu einem anderen Dokument (Dokument: H59T, Schlüssel: R9V7).
- OK: docx: richtiges Paar → grün, Rückbau exakt – Kennung – Kennung H59T passt.
### XLSX: anonymisiert_M4X8.xlsx + schluessel_M4X8.json / anonymisiert_4B2B.xlsx + schluessel_4B2B.json
- Anonymisierter Text beider Dokumente gleich: nein
- OK: xlsx: Dateinamen tragen die Kennung – anonymisiert_M4X8.xlsx, schluessel_M4X8.json
- OK: xlsx: Datei 1 + Schlüssel 2 (Originalname) → rot und blockiert – „Diese Schlüsseldatei gehört zu einem anderen Dokument (Dokument: M4X8, Schlüssel: 4B2B).…“; bisherige Prüfung allein: Urteil „zweifelhaft“; nach ausdrücklicher Bestätigung (Kennung UND bisherige Prüfung) frei: true
- OK: xlsx: umbenannt (bericht.xlsx) + eigener Schlüssel → grün (Kennung aus der Eigenschaft) – Kennung – Kennung M4X8 passt.
- OK: xlsx: umbenannt + fremder Schlüssel → rot und blockiert – Diese Schlüsseldatei gehört zu einem anderen Dokument (Dokument: M4X8, Schlüssel: 4B2B).
- OK: xlsx: richtiges Paar → grün, Rückbau exakt – Kennung – Kennung M4X8 passt.
### TXT: anonymisiert_E853.txt + schluessel_E853.json / anonymisiert_43L8.txt + schluessel_43L8.json
- Anonymisierter Text beider Dokumente gleich: ja (ohne Kennung wäre der Vertausch nicht zu erkennen)
- OK: txt: Dateinamen tragen die Kennung – anonymisiert_E853.txt, schluessel_E853.json
- OK: txt: Datei 1 + Schlüssel 2 (Originalname) → rot und blockiert – „Diese Schlüsseldatei gehört zu einem anderen Dokument (Dokument: E853, Schlüssel: 43L8).…“; bisherige Prüfung allein: Urteil „passend“; nach ausdrücklicher Bestätigung frei: true
- OK: txt: umbenannt (notiz.txt) + Schlüssel 2 → bernstein mit Abhaken – „Im Dokument steht keine Kennung. Der Schlüssel hat die Kennung 43L8. Prüfe, ob beide zusammengehören.…“; bisherige Prüfung: „passend“
- OK: txt: richtiges Paar → grün, Rückbau exakt – Kennung – Kennung E853 passt.
### CSV: anonymisiert_R93N.csv + schluessel_R93N.json / anonymisiert_P53F.csv + schluessel_P53F.json
- Anonymisierter Text beider Dokumente gleich: nein
- OK: csv: Dateinamen tragen die Kennung – anonymisiert_R93N.csv, schluessel_R93N.json
- OK: csv: Datei 1 + Schlüssel 2 (Originalname) → rot und blockiert – „Diese Schlüsseldatei gehört zu einem anderen Dokument (Dokument: R93N, Schlüssel: P53F).…“; bisherige Prüfung allein: Urteil „zweifelhaft“; nach ausdrücklicher Bestätigung (Kennung UND bisherige Prüfung) frei: true
- OK: csv: umbenannt (notiz.csv) + Schlüssel 2 → bernstein mit Abhaken – „Im Dokument steht keine Kennung. Der Schlüssel hat die Kennung P53F. Prüfe, ob beide zusammengehören.…“; bisherige Prüfung: „zweifelhaft“, eigene Bestätigung nötig
- OK: csv: richtiges Paar → grün, Rückbau exakt – Kennung – Kennung R93N passt.

## Widerspruch zwischen Eigenschaft und Dateiname
- OK: Datei mit Eigenschaft K1, aber Namen K2 + Schlüssel K1 → Eigenschaft gilt (grün), Widerspruch wird gezeigt – Kennung – Kennung H59T passt. Die Eigenschaft in der Datei (H59T) und der Dateiname (R9V7) widersprechen sich; es gilt die Eigenschaft.
- OK: dieselbe Datei + Schlüssel K2 → rot (Eigenschaft K1 gilt), Widerspruch wird gezeigt – Diese Schlüsseldatei gehört zu einem anderen Dokument (Dokument: H59T, Schlüssel: R9V7). Die Eigenschaft in der Datei (H59T) und der Dateiname (R9V7) widersprec

## Schlüsseldatei aus Version 2.0 (ohne Kennung)
- OK: txt: Schlüssel aus 2.0 (rueckbau_schluessel_VERTRAULICH.json, Feld „kennung“: nein) → bernstein „Schlüssel ohne Kennung“, seit 2.5.0 offener Punkt mit dem einen Häkchen, Rückbau exakt – Schlüssel ohne Kennung (erstellt vor Version 2.1). Prüfe selbst, ob Datei und Schlüssel zusammengehören.
- OK: docx: Schlüssel aus 2.0 (rueckbau_schluessel_VERTRAULICH.json, Feld „kennung“: nein) → bernstein „Schlüssel ohne Kennung“, seit 2.5.0 offener Punkt mit dem einen Häkchen, Rückbau exakt – Schlüssel ohne Kennung (erstellt vor Version 2.1). Prüfe selbst, ob Datei und Schlüssel zusammengehören.

## Veralteter Schlüssel (nach dem Schlüssel noch einen Treffer geändert)
- OK: Nach der Änderung: neue Kennung sofort in den Dateikarten, „2 Datei speichern“ gesperrt – anonymisiert_W9M4.docx → anonymisiert_9N47.docx
- OK: Alter und neuer Schlüssel haben verschiedene Kennungen – W9M4 / 9N47
- OK: ALTER Schlüssel + neue Datei → rot und blockiert – Diese Schlüsseldatei gehört zu einem anderen Dokument (Dokument: 9N47, Schlüssel: W9M4).
- OK: neuer Schlüssel + neue Datei → grün – Kennung – Kennung 9N47 passt.

## Bearbeitung in LibreOffice (Inhalt geändert, dann in LibreOffice gespeichert)
- OK: docx: nach Änderung und Speichern in LibreOffice ist die Kennung noch da – Eigenschaft H59T, erwartet H59T
- OK: docx: LibreOffice-Datei (umbenannt) + Schlüssel → grün – Kennung – Kennung H59T passt.
- OK: xlsx: nach Änderung und Speichern in LibreOffice ist die Kennung noch da – Eigenschaft M4X8, erwartet M4X8
- OK: xlsx: LibreOffice-Datei (umbenannt) + Schlüssel → grün – Kennung – Kennung M4X8 passt.
- Microsoft Word und Excel selbst: **durch Code ungeprüft**.

## Doppellauf: Inhalt gleich, Kennung verschieden
- OK: docx: Inhalt beider Läufe gleich (Kennung ausgenommen), Schlüssel gleich (Kennung ausgenommen)
- OK: docx: Kennungen beider Läufe verschieden, Dateinamen unterscheiden sich nur in der Kennung – anonymisiert_954G.docx / anonymisiert_S4U2.docx
- OK: txt: Inhalt beider Läufe gleich (Kennung ausgenommen), Schlüssel gleich (Kennung ausgenommen)
- OK: txt: Kennungen beider Läufe verschieden, Dateinamen unterscheiden sich nur in der Kennung – anonymisiert_3X5P.txt / anonymisiert_3R76.txt
- OK: Erneutes Laden derselben Datei und „Nächstes Dokument“ ergeben jeweils eine neue Kennung – 2M6Q, 2P89, 29D3

## Zufalls-Beweis
- OK: Kennung entsteht nur in src/ui/kennung.js (newKennung) aus crypto.getRandomValues; alle Aufrufe ohne Dokumentdaten – Aufrufe in app.js: newKennung(), newKennung()
- OK: Mit festem Ersatz-Zufall gleiche Kennung vor und nach dem Laden eines Dokuments (kein Dokumentinhalt geht ein) – A3C5 / A3C5
- OK: 1000 Kennungen: nur erlaubte Zeichen, nie zwei Buchstaben nebeneinander
- Zeichen genutzt: 32 von 32. Je Buchstabe 52–88-mal, je Ziffer 272–316-mal (Ziffern häufiger, weil nie zwei Buchstaben nebeneinander stehen; innerhalb der Gruppe gleichmäßig).
- Mögliche Kennungen: 163 840. Doppelte unter 1000: 2 (erwartet rund 3).
- OK: Grobe Gleichverteilung innerhalb der Buchstaben und der Ziffern – Buchstaben 52–88, Ziffern 272–316

Prüfungen: 39 von 39 bestanden.
Netzwerkanfragen außer lokalen Dateien: 0.
