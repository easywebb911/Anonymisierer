# Kennung (Version 2.1): Tests

Chromium headless, Start per file://, alle Schritte über die echte Oberfläche. Alle Namen erfunden (tests/make-kennung.mjs).

## Vertausch: zwei Dokumente nach gleicher Vorlage, Schlüssel über Kreuz
### DOCX: anonymisiert_K4N2.docx + schluessel_K4N2.json / anonymisiert_G7E6.docx + schluessel_G7E6.json
- Anonymisierter Text beider Dokumente gleich: ja (ohne Kennung wäre der Vertausch nicht zu erkennen)
- OK: docx: Dateinamen tragen die Kennung – anonymisiert_K4N2.docx, schluessel_K4N2.json
- OK: docx: Datei 1 + Schlüssel 2 (Originalname) → rot und blockiert – „Diese Schlüsseldatei gehört zu einem anderen Dokument (Dokument: K4N2, Schlüssel: G7E6).…“; bisherige Prüfung allein: Urteil „passend“; nach ausdrücklicher Bestätigung frei: true
- OK: docx: umbenannt (bericht.docx) + eigener Schlüssel → grün (Kennung aus der Eigenschaft) – Kennung – Kennung K4N2 passt.
- OK: docx: umbenannt + fremder Schlüssel → rot und blockiert – Diese Schlüsseldatei gehört zu einem anderen Dokument (Dokument: K4N2, Schlüssel: G7E6).
- OK: docx: richtiges Paar → grün, Rückbau exakt – Kennung – Kennung K4N2 passt.
### XLSX: anonymisiert_X83K.xlsx + schluessel_X83K.json / anonymisiert_52P5.xlsx + schluessel_52P5.json
- Anonymisierter Text beider Dokumente gleich: ja (ohne Kennung wäre der Vertausch nicht zu erkennen)
- OK: xlsx: Dateinamen tragen die Kennung – anonymisiert_X83K.xlsx, schluessel_X83K.json
- OK: xlsx: Datei 1 + Schlüssel 2 (Originalname) → rot und blockiert – „Diese Schlüsseldatei gehört zu einem anderen Dokument (Dokument: X83K, Schlüssel: 52P5).…“; bisherige Prüfung allein: Urteil „passend“; nach ausdrücklicher Bestätigung frei: true
- OK: xlsx: umbenannt (bericht.xlsx) + eigener Schlüssel → grün (Kennung aus der Eigenschaft) – Kennung – Kennung X83K passt.
- OK: xlsx: umbenannt + fremder Schlüssel → rot und blockiert – Diese Schlüsseldatei gehört zu einem anderen Dokument (Dokument: X83K, Schlüssel: 52P5).
- OK: xlsx: richtiges Paar → grün, Rückbau exakt – Kennung – Kennung X83K passt.
### TXT: anonymisiert_53M3.txt + schluessel_53M3.json / anonymisiert_6J6K.txt + schluessel_6J6K.json
- Anonymisierter Text beider Dokumente gleich: ja (ohne Kennung wäre der Vertausch nicht zu erkennen)
- OK: txt: Dateinamen tragen die Kennung – anonymisiert_53M3.txt, schluessel_53M3.json
- OK: txt: Datei 1 + Schlüssel 2 (Originalname) → rot und blockiert – „Diese Schlüsseldatei gehört zu einem anderen Dokument (Dokument: 53M3, Schlüssel: 6J6K).…“; bisherige Prüfung allein: Urteil „passend“; nach ausdrücklicher Bestätigung frei: true
- OK: txt: umbenannt (notiz.txt) + Schlüssel 2 → bernstein mit Abhaken – „Im Dokument steht keine Kennung. Der Schlüssel hat die Kennung 6J6K. Prüfe, ob beide zusammengehören.…“; bisherige Prüfung: „passend“
- OK: txt: richtiges Paar → grün, Rückbau exakt – Kennung – Kennung 53M3 passt.
### CSV: anonymisiert_6G9C.csv + schluessel_6G9C.json / anonymisiert_M24F.csv + schluessel_M24F.json
- Anonymisierter Text beider Dokumente gleich: ja (ohne Kennung wäre der Vertausch nicht zu erkennen)
- OK: csv: Dateinamen tragen die Kennung – anonymisiert_6G9C.csv, schluessel_6G9C.json
- OK: csv: Datei 1 + Schlüssel 2 (Originalname) → rot und blockiert – „Diese Schlüsseldatei gehört zu einem anderen Dokument (Dokument: 6G9C, Schlüssel: M24F).…“; bisherige Prüfung allein: Urteil „passend“; nach ausdrücklicher Bestätigung frei: true
- OK: csv: umbenannt (notiz.csv) + Schlüssel 2 → bernstein mit Abhaken – „Im Dokument steht keine Kennung. Der Schlüssel hat die Kennung M24F. Prüfe, ob beide zusammengehören.…“; bisherige Prüfung: „passend“
- OK: csv: richtiges Paar → grün, Rückbau exakt – Kennung – Kennung 6G9C passt.

## Widerspruch zwischen Eigenschaft und Dateiname
- OK: Datei mit Eigenschaft K1, aber Namen K2 + Schlüssel K1 → Eigenschaft gilt (grün), Widerspruch wird gezeigt – Kennung – Kennung K4N2 passt. Die Eigenschaft in der Datei (K4N2) und der Dateiname (G7E6) widersprechen sich; es gilt die Eigenschaft.
- OK: dieselbe Datei + Schlüssel K2 → rot (Eigenschaft K1 gilt), Widerspruch wird gezeigt – Diese Schlüsseldatei gehört zu einem anderen Dokument (Dokument: K4N2, Schlüssel: G7E6). Die Eigenschaft in der Datei (K4N2) und der Dateiname (G7E6) widersprec

## Schlüsseldatei aus Version 2.0 (ohne Kennung)
- übersprungen (keine index.html der Version 2.0 angegeben)

## Veralteter Schlüssel (nach dem Schlüssel noch einen Treffer geändert)
- OK: Nach der Änderung: neue Kennung sofort in den Dateikarten, „2 Datei speichern“ gesperrt – anonymisiert_S65J.docx → anonymisiert_Z5F6.docx
- OK: Alter und neuer Schlüssel haben verschiedene Kennungen – S65J / Z5F6
- OK: ALTER Schlüssel + neue Datei → rot und blockiert – Diese Schlüsseldatei gehört zu einem anderen Dokument (Dokument: Z5F6, Schlüssel: S65J).
- OK: neuer Schlüssel + neue Datei → grün – Kennung – Kennung Z5F6 passt.

## Bearbeitung in LibreOffice (Inhalt geändert, dann in LibreOffice gespeichert)
- OK: docx: nach Änderung und Speichern in LibreOffice ist die Kennung noch da – Eigenschaft K4N2, erwartet K4N2
- OK: docx: LibreOffice-Datei (umbenannt) + Schlüssel → grün – Kennung – Kennung K4N2 passt.
- OK: xlsx: nach Änderung und Speichern in LibreOffice ist die Kennung noch da – Eigenschaft X83K, erwartet X83K
- OK: xlsx: LibreOffice-Datei (umbenannt) + Schlüssel → grün – Kennung – Kennung X83K passt.
- Microsoft Word und Excel selbst: **durch Code ungeprüft**.

## Doppellauf: Inhalt gleich, Kennung verschieden
- OK: docx: Inhalt beider Läufe gleich (Kennung ausgenommen), Schlüssel gleich (Kennung ausgenommen)
- OK: docx: Kennungen beider Läufe verschieden, Dateinamen unterscheiden sich nur in der Kennung – anonymisiert_W7Y2.docx / anonymisiert_3V2L.docx
- OK: txt: Inhalt beider Läufe gleich (Kennung ausgenommen), Schlüssel gleich (Kennung ausgenommen)
- OK: txt: Kennungen beider Läufe verschieden, Dateinamen unterscheiden sich nur in der Kennung – anonymisiert_T47R.txt / anonymisiert_4J5T.txt
- OK: Erneutes Laden derselben Datei und „Nächstes Dokument“ ergeben jeweils eine neue Kennung – D246, M3S4, 5E6K

## Zufalls-Beweis
- OK: Kennung entsteht nur in src/ui/kennung.js (newKennung) aus crypto.getRandomValues; alle Aufrufe ohne Dokumentdaten – Aufrufe in app.js: newKennung(), newKennung()
- OK: Mit festem Ersatz-Zufall gleiche Kennung vor und nach dem Laden eines Dokuments (kein Dokumentinhalt geht ein) – A3C5 / A3C5
- OK: 1000 Kennungen: nur erlaubte Zeichen, nie zwei Buchstaben nebeneinander
- Zeichen genutzt: 32 von 32. Je Buchstabe 49–80-mal, je Ziffer 277–334-mal (Ziffern häufiger, weil nie zwei Buchstaben nebeneinander stehen; innerhalb der Gruppe gleichmäßig).
- Mögliche Kennungen: 163 840. Doppelte unter 1000: 3 (erwartet rund 3).
- OK: Grobe Gleichverteilung innerhalb der Buchstaben und der Ziffern – Buchstaben 49–80, Ziffern 277–334

Prüfungen: 37 von 37 bestanden.
Netzwerkanfragen außer lokalen Dateien: 0.
