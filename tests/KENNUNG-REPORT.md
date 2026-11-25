# Kennung (Version 2.1): Tests

Chromium headless, Start per file://, alle Schritte über die echte Oberfläche. Alle Namen erfunden (tests/make-kennung.mjs).

## Vertausch: zwei Dokumente nach gleicher Vorlage, Schlüssel über Kreuz
### DOCX: anonymisiert_9Y4A.docx + schluessel_9Y4A.json / anonymisiert_2H42.docx + schluessel_2H42.json
- Anonymisierter Text beider Dokumente gleich: ja (ohne Kennung wäre der Vertausch nicht zu erkennen)
- OK: docx: Dateinamen tragen die Kennung – anonymisiert_9Y4A.docx, schluessel_9Y4A.json
- OK: docx: Datei 1 + Schlüssel 2 (Originalname) → rot und blockiert – „Diese Schlüsseldatei gehört zu einem anderen Dokument (Dokument: 9Y4A, Schlüssel: 2H42).…“; bisherige Prüfung allein: Urteil „passend“; nach ausdrücklicher Bestätigung frei: true
- OK: docx: umbenannt (bericht.docx) + eigener Schlüssel → grün (Kennung aus der Eigenschaft) – Kennung – Kennung 9Y4A passt.
- OK: docx: umbenannt + fremder Schlüssel → rot und blockiert – Diese Schlüsseldatei gehört zu einem anderen Dokument (Dokument: 9Y4A, Schlüssel: 2H42).
- OK: docx: richtiges Paar → grün, Rückbau exakt – Kennung – Kennung 9Y4A passt.
### XLSX: anonymisiert_9A6F.xlsx + schluessel_9A6F.json / anonymisiert_M9F8.xlsx + schluessel_M9F8.json
- Anonymisierter Text beider Dokumente gleich: ja (ohne Kennung wäre der Vertausch nicht zu erkennen)
- OK: xlsx: Dateinamen tragen die Kennung – anonymisiert_9A6F.xlsx, schluessel_9A6F.json
- OK: xlsx: Datei 1 + Schlüssel 2 (Originalname) → rot und blockiert – „Diese Schlüsseldatei gehört zu einem anderen Dokument (Dokument: 9A6F, Schlüssel: M9F8).…“; bisherige Prüfung allein: Urteil „passend“; nach ausdrücklicher Bestätigung frei: true
- OK: xlsx: umbenannt (bericht.xlsx) + eigener Schlüssel → grün (Kennung aus der Eigenschaft) – Kennung – Kennung 9A6F passt.
- OK: xlsx: umbenannt + fremder Schlüssel → rot und blockiert – Diese Schlüsseldatei gehört zu einem anderen Dokument (Dokument: 9A6F, Schlüssel: M9F8).
- OK: xlsx: richtiges Paar → grün, Rückbau exakt – Kennung – Kennung 9A6F passt.
### TXT: anonymisiert_U44Q.txt + schluessel_U44Q.json / anonymisiert_G2H5.txt + schluessel_G2H5.json
- Anonymisierter Text beider Dokumente gleich: ja (ohne Kennung wäre der Vertausch nicht zu erkennen)
- OK: txt: Dateinamen tragen die Kennung – anonymisiert_U44Q.txt, schluessel_U44Q.json
- OK: txt: Datei 1 + Schlüssel 2 (Originalname) → rot und blockiert – „Diese Schlüsseldatei gehört zu einem anderen Dokument (Dokument: U44Q, Schlüssel: G2H5).…“; bisherige Prüfung allein: Urteil „passend“; nach ausdrücklicher Bestätigung frei: true
- OK: txt: umbenannt (notiz.txt) + Schlüssel 2 → bernstein mit Abhaken – „Im Dokument steht keine Kennung. Der Schlüssel hat die Kennung G2H5. Prüfe, ob beide zusammengehören.…“; bisherige Prüfung: „passend“
- OK: txt: richtiges Paar → grün, Rückbau exakt – Kennung – Kennung U44Q passt.
### CSV: anonymisiert_Y46W.csv + schluessel_Y46W.json / anonymisiert_3E8V.csv + schluessel_3E8V.json
- Anonymisierter Text beider Dokumente gleich: ja (ohne Kennung wäre der Vertausch nicht zu erkennen)
- OK: csv: Dateinamen tragen die Kennung – anonymisiert_Y46W.csv, schluessel_Y46W.json
- OK: csv: Datei 1 + Schlüssel 2 (Originalname) → rot und blockiert – „Diese Schlüsseldatei gehört zu einem anderen Dokument (Dokument: Y46W, Schlüssel: 3E8V).…“; bisherige Prüfung allein: Urteil „passend“; nach ausdrücklicher Bestätigung frei: true
- OK: csv: umbenannt (notiz.csv) + Schlüssel 2 → bernstein mit Abhaken – „Im Dokument steht keine Kennung. Der Schlüssel hat die Kennung 3E8V. Prüfe, ob beide zusammengehören.…“; bisherige Prüfung: „passend“
- OK: csv: richtiges Paar → grün, Rückbau exakt – Kennung – Kennung Y46W passt.

## Widerspruch zwischen Eigenschaft und Dateiname
- OK: Datei mit Eigenschaft K1, aber Namen K2 + Schlüssel K1 → Eigenschaft gilt (grün), Widerspruch wird gezeigt – Kennung – Kennung 9Y4A passt. Die Eigenschaft in der Datei (9Y4A) und der Dateiname (2H42) widersprechen sich; es gilt die Eigenschaft.
- OK: dieselbe Datei + Schlüssel K2 → rot (Eigenschaft K1 gilt), Widerspruch wird gezeigt – Diese Schlüsseldatei gehört zu einem anderen Dokument (Dokument: 9Y4A, Schlüssel: 2H42). Die Eigenschaft in der Datei (9Y4A) und der Dateiname (2H42) widersprec

## Schlüsseldatei aus Version 2.0 (ohne Kennung)
- übersprungen (keine index.html der Version 2.0 angegeben)

## Veralteter Schlüssel (nach dem Schlüssel noch einen Treffer geändert)
- OK: Nach der Änderung: neue Kennung sofort in den Dateikarten, „2 Datei speichern“ gesperrt – anonymisiert_A7C3.docx → anonymisiert_6E7Z.docx
- OK: Alter und neuer Schlüssel haben verschiedene Kennungen – A7C3 / 6E7Z
- OK: ALTER Schlüssel + neue Datei → rot und blockiert – Diese Schlüsseldatei gehört zu einem anderen Dokument (Dokument: 6E7Z, Schlüssel: A7C3).
- OK: neuer Schlüssel + neue Datei → grün – Kennung – Kennung 6E7Z passt.

## Bearbeitung in LibreOffice (Inhalt geändert, dann in LibreOffice gespeichert)
- OK: docx: nach Änderung und Speichern in LibreOffice ist die Kennung noch da – Eigenschaft 9Y4A, erwartet 9Y4A
- OK: docx: LibreOffice-Datei (umbenannt) + Schlüssel → grün – Kennung – Kennung 9Y4A passt.
- OK: xlsx: nach Änderung und Speichern in LibreOffice ist die Kennung noch da – Eigenschaft 9A6F, erwartet 9A6F
- OK: xlsx: LibreOffice-Datei (umbenannt) + Schlüssel → grün – Kennung – Kennung 9A6F passt.
- Microsoft Word und Excel selbst: **durch Code ungeprüft**.

## Doppellauf: Inhalt gleich, Kennung verschieden
- OK: docx: Inhalt beider Läufe gleich (Kennung ausgenommen), Schlüssel gleich (Kennung ausgenommen)
- OK: docx: Kennungen beider Läufe verschieden, Dateinamen unterscheiden sich nur in der Kennung – anonymisiert_Q82K.docx / anonymisiert_9M2Y.docx
- OK: txt: Inhalt beider Läufe gleich (Kennung ausgenommen), Schlüssel gleich (Kennung ausgenommen)
- OK: txt: Kennungen beider Läufe verschieden, Dateinamen unterscheiden sich nur in der Kennung – anonymisiert_28G3.txt / anonymisiert_Q24S.txt
- OK: Erneutes Laden derselben Datei und „Nächstes Dokument“ ergeben jeweils eine neue Kennung – L8C9, 4Z84, 9L27

## Zufalls-Beweis
- OK: Kennung entsteht nur in src/ui/kennung.js (newKennung) aus crypto.getRandomValues; alle Aufrufe ohne Dokumentdaten – Aufrufe in app.js: newKennung(), newKennung()
- OK: Mit festem Ersatz-Zufall gleiche Kennung vor und nach dem Laden eines Dokuments (kein Dokumentinhalt geht ein) – A3C5 / A3C5
- OK: 1000 Kennungen: nur erlaubte Zeichen, nie zwei Buchstaben nebeneinander
- Zeichen genutzt: 32 von 32. Je Buchstabe 56–86-mal, je Ziffer 280–309-mal (Ziffern häufiger, weil nie zwei Buchstaben nebeneinander stehen; innerhalb der Gruppe gleichmäßig).
- Mögliche Kennungen: 163 840. Doppelte unter 1000: 2 (erwartet rund 3).
- OK: Grobe Gleichverteilung innerhalb der Buchstaben und der Ziffern – Buchstaben 56–86, Ziffern 280–309

Prüfungen: 37 von 37 bestanden.
Netzwerkanfragen außer lokalen Dateien: 0.
