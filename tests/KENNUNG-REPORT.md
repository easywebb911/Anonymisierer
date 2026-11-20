# Kennung (Version 2.1): Tests

Chromium headless, Start per file://, alle Schritte über die echte Oberfläche. Alle Namen erfunden (tests/make-kennung.mjs).

## Vertausch: zwei Dokumente nach gleicher Vorlage, Schlüssel über Kreuz
### DOCX: anonymisiert_F84E.docx + schluessel_F84E.json / anonymisiert_6X7U.docx + schluessel_6X7U.json
- Anonymisierter Text beider Dokumente gleich: ja (ohne Kennung wäre der Vertausch nicht zu erkennen)
- OK: docx: Dateinamen tragen die Kennung – anonymisiert_F84E.docx, schluessel_F84E.json
- OK: docx: Datei 1 + Schlüssel 2 (Originalname) → rot und blockiert – „Kennung Diese Schlüsseldatei gehört zu einem anderen Dokument (Dokument: F84E, Schlüssel: 6X7U). Ich weiß, dass die Kenn…“; bisherige Prüfung allein: Urteil „passend“; nach ausdrücklicher Bestätigung frei: true
- OK: docx: umbenannt (bericht.docx) + eigener Schlüssel → grün (Kennung aus der Eigenschaft) – Kennung Kennung F84E passt.
- OK: docx: umbenannt + fremder Schlüssel → rot und blockiert – Kennung Diese Schlüsseldatei gehört zu einem anderen Dokument (Dokument: F84E, Schlüssel: 6X7U). Ich
- OK: docx: richtiges Paar → grün, Rückbau exakt – Kennung Kennung F84E passt.
### XLSX: anonymisiert_6N37.xlsx + schluessel_6N37.json / anonymisiert_X33C.xlsx + schluessel_X33C.json
- Anonymisierter Text beider Dokumente gleich: nein
- OK: xlsx: Dateinamen tragen die Kennung – anonymisiert_6N37.xlsx, schluessel_6N37.json
- OK: xlsx: Datei 1 + Schlüssel 2 (Originalname) → rot und blockiert – „Kennung Diese Schlüsseldatei gehört zu einem anderen Dokument (Dokument: 6N37, Schlüssel: X33C). Ich weiß, dass die Kenn…“; bisherige Prüfung allein: Urteil „zweifelhaft“; nach ausdrücklicher Bestätigung (Kennung UND bisherige Prüfung) frei: true
- OK: xlsx: umbenannt (bericht.xlsx) + eigener Schlüssel → grün (Kennung aus der Eigenschaft) – Kennung Kennung 6N37 passt.
- OK: xlsx: umbenannt + fremder Schlüssel → rot und blockiert – Kennung Diese Schlüsseldatei gehört zu einem anderen Dokument (Dokument: 6N37, Schlüssel: X33C). Ich
- OK: xlsx: richtiges Paar → grün, Rückbau exakt – Kennung Kennung 6N37 passt.
### TXT: anonymisiert_66J9.txt + schluessel_66J9.json / anonymisiert_5W4S.txt + schluessel_5W4S.json
- Anonymisierter Text beider Dokumente gleich: ja (ohne Kennung wäre der Vertausch nicht zu erkennen)
- OK: txt: Dateinamen tragen die Kennung – anonymisiert_66J9.txt, schluessel_66J9.json
- OK: txt: Datei 1 + Schlüssel 2 (Originalname) → rot und blockiert – „Kennung Diese Schlüsseldatei gehört zu einem anderen Dokument (Dokument: 66J9, Schlüssel: 5W4S). Ich weiß, dass die Kenn…“; bisherige Prüfung allein: Urteil „passend“; nach ausdrücklicher Bestätigung frei: true
- OK: txt: umbenannt (notiz.txt) + Schlüssel 2 → bernstein mit Abhaken – „Kennung Im Dokument steht keine Kennung. Der Schlüssel hat die Kennung 5W4S. Bitte prüfe, ob beide zusammengeh…“; bisherige Prüfung: „passend“
- OK: txt: richtiges Paar → grün, Rückbau exakt – Kennung Kennung 66J9 passt.
### CSV: anonymisiert_Z8Z6.csv + schluessel_Z8Z6.json / anonymisiert_B64H.csv + schluessel_B64H.json
- Anonymisierter Text beider Dokumente gleich: nein
- OK: csv: Dateinamen tragen die Kennung – anonymisiert_Z8Z6.csv, schluessel_Z8Z6.json
- OK: csv: Datei 1 + Schlüssel 2 (Originalname) → rot und blockiert – „Kennung Diese Schlüsseldatei gehört zu einem anderen Dokument (Dokument: Z8Z6, Schlüssel: B64H). Ich weiß, dass die Kenn…“; bisherige Prüfung allein: Urteil „zweifelhaft“; nach ausdrücklicher Bestätigung (Kennung UND bisherige Prüfung) frei: true
- OK: csv: umbenannt (notiz.csv) + Schlüssel 2 → bernstein mit Abhaken – „Kennung Im Dokument steht keine Kennung. Der Schlüssel hat die Kennung B64H. Bitte prüfe, ob beide zusammengeh…“; bisherige Prüfung: „zweifelhaft“, eigene Bestätigung nötig
- OK: csv: richtiges Paar → grün, Rückbau exakt – Kennung Kennung Z8Z6 passt.

## Widerspruch zwischen Eigenschaft und Dateiname
- OK: Datei mit Eigenschaft K1, aber Namen K2 + Schlüssel K1 → Eigenschaft gilt (grün), Widerspruch wird gezeigt – Kennung Kennung F84E passt. Die Eigenschaft in der Datei (F84E) und der Dateiname (6X7U) widersprechen sich; es gilt die Eigenschaft.
- OK: dieselbe Datei + Schlüssel K2 → rot (Eigenschaft K1 gilt), Widerspruch wird gezeigt – Kennung Diese Schlüsseldatei gehört zu einem anderen Dokument (Dokument: F84E, Schlüssel: 6X7U). Die Eigenschaft in der Datei (F84E) und der Dateiname (6X7U) wi

## Schlüsseldatei aus Version 2.0 (ohne Kennung)
- OK: txt: Schlüssel aus 2.0 (rueckbau_schluessel_VERTRAULICH.json, Feld „kennung“: nein) → bernstein „Schlüssel ohne Kennung“, Rückbau exakt – Kennung Schlüssel ohne Kennung (erstellt vor Version 2.1). Der Rückbau funktioniert wie bisher; prüfe selbst, ob Datei u
- OK: docx: Schlüssel aus 2.0 (rueckbau_schluessel_VERTRAULICH.json, Feld „kennung“: nein) → bernstein „Schlüssel ohne Kennung“, Rückbau exakt – Kennung Schlüssel ohne Kennung (erstellt vor Version 2.1). Der Rückbau funktioniert wie bisher; prüfe selbst, ob Datei u

## Veralteter Schlüssel (nach dem Schlüssel noch einen Treffer geändert)
- OK: Nach der Änderung: neue Kennung sofort in den Dateikarten, „2 Datei speichern“ gesperrt – anonymisiert_8R9S.docx → anonymisiert_9U4M.docx
- OK: Alter und neuer Schlüssel haben verschiedene Kennungen – 8R9S / 9U4M
- OK: ALTER Schlüssel + neue Datei → rot und blockiert – Kennung Diese Schlüsseldatei gehört zu einem anderen Dokument (Dokument: 9U4M, Schlüssel: 8R9S). Ich weiß, dass die Kenn
- OK: neuer Schlüssel + neue Datei → grün – Kennung Kennung 9U4M passt.

## Bearbeitung in LibreOffice (Inhalt geändert, dann in LibreOffice gespeichert)
- OK: docx: nach Änderung und Speichern in LibreOffice ist die Kennung noch da – Eigenschaft F84E, erwartet F84E
- OK: docx: LibreOffice-Datei (umbenannt) + Schlüssel → grün – Kennung Kennung F84E passt.
- OK: xlsx: nach Änderung und Speichern in LibreOffice ist die Kennung noch da – Eigenschaft 6N37, erwartet 6N37
- OK: xlsx: LibreOffice-Datei (umbenannt) + Schlüssel → grün – Kennung Kennung 6N37 passt.
- Microsoft Word und Excel selbst: **durch Code ungeprüft**.

## Doppellauf: Inhalt gleich, Kennung verschieden
- OK: docx: Inhalt beider Läufe gleich (Kennung ausgenommen), Schlüssel gleich (Kennung ausgenommen)
- OK: docx: Kennungen beider Läufe verschieden, Dateinamen unterscheiden sich nur in der Kennung – anonymisiert_23K5.docx / anonymisiert_L85N.docx
- OK: txt: Inhalt beider Läufe gleich (Kennung ausgenommen), Schlüssel gleich (Kennung ausgenommen)
- OK: txt: Kennungen beider Läufe verschieden, Dateinamen unterscheiden sich nur in der Kennung – anonymisiert_788X.txt / anonymisiert_Q6W8.txt
- OK: Erneutes Laden derselben Datei und „Nächstes Dokument“ ergeben jeweils eine neue Kennung – 8V9G, E6Y6, D84B

## Zufalls-Beweis
- OK: Kennung entsteht nur in src/ui/kennung.js (newKennung) aus crypto.getRandomValues; alle Aufrufe ohne Dokumentdaten – Aufrufe in app.js: newKennung(), newKennung()
- OK: Mit festem Ersatz-Zufall gleiche Kennung vor und nach dem Laden eines Dokuments (kein Dokumentinhalt geht ein) – A3C5 / A3C5
- OK: 1000 Kennungen: nur erlaubte Zeichen, nie zwei Buchstaben nebeneinander
- Zeichen genutzt: 32 von 32. Je Buchstabe 51–93-mal, je Ziffer 279–325-mal (Ziffern häufiger, weil nie zwei Buchstaben nebeneinander stehen; innerhalb der Gruppe gleichmäßig).
- Mögliche Kennungen: 163 840. Doppelte unter 1000: 1 (erwartet rund 3).
- OK: Grobe Gleichverteilung innerhalb der Buchstaben und der Ziffern – Buchstaben 51–93, Ziffern 279–325

Prüfungen: 39 von 39 bestanden.
Netzwerkanfragen außer lokalen Dateien: 0.
