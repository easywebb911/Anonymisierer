# Kennung (Version 2.1): Tests

Chromium headless, Start per file://, alle Schritte über die echte Oberfläche. Alle Namen erfunden (tests/make-kennung.mjs).

## Vertausch: zwei Dokumente nach gleicher Vorlage, Schlüssel über Kreuz
### DOCX: anonymisiert_R78S.docx + schluessel_R78S.json / anonymisiert_3R6M.docx + schluessel_3R6M.json
- Anonymisierter Text beider Dokumente gleich: ja (ohne Kennung wäre der Vertausch nicht zu erkennen)
- OK: docx: Dateinamen tragen die Kennung – anonymisiert_R78S.docx, schluessel_R78S.json
- OK: docx: Datei 1 + Schlüssel 2 (Originalname) → rot und blockiert – „Kennung Diese Schlüsseldatei gehört zu einem anderen Dokument (Dokument: R78S, Schlüssel: 3R6M). Ich weiß, dass die Kenn…“; bisherige Prüfung allein: Urteil „passend“; nach ausdrücklicher Bestätigung frei: true
- OK: docx: umbenannt (bericht.docx) + eigener Schlüssel → grün (Kennung aus der Eigenschaft) – Kennung Kennung R78S passt.
- OK: docx: umbenannt + fremder Schlüssel → rot und blockiert – Kennung Diese Schlüsseldatei gehört zu einem anderen Dokument (Dokument: R78S, Schlüssel: 3R6M). Ich
- OK: docx: richtiges Paar → grün, Rückbau exakt – Kennung Kennung R78S passt.
### XLSX: anonymisiert_Y94S.xlsx + schluessel_Y94S.json / anonymisiert_U36D.xlsx + schluessel_U36D.json
- Anonymisierter Text beider Dokumente gleich: nein
- OK: xlsx: Dateinamen tragen die Kennung – anonymisiert_Y94S.xlsx, schluessel_Y94S.json
- OK: xlsx: Datei 1 + Schlüssel 2 (Originalname) → rot und blockiert – „Kennung Diese Schlüsseldatei gehört zu einem anderen Dokument (Dokument: Y94S, Schlüssel: U36D). Ich weiß, dass die Kenn…“; bisherige Prüfung allein: Urteil „zweifelhaft“; nach ausdrücklicher Bestätigung (Kennung UND bisherige Prüfung) frei: true
- OK: xlsx: umbenannt (bericht.xlsx) + eigener Schlüssel → grün (Kennung aus der Eigenschaft) – Kennung Kennung Y94S passt.
- OK: xlsx: umbenannt + fremder Schlüssel → rot und blockiert – Kennung Diese Schlüsseldatei gehört zu einem anderen Dokument (Dokument: Y94S, Schlüssel: U36D). Ich
- OK: xlsx: richtiges Paar → grün, Rückbau exakt – Kennung Kennung Y94S passt.
### TXT: anonymisiert_4H3P.txt + schluessel_4H3P.json / anonymisiert_N443.txt + schluessel_N443.json
- Anonymisierter Text beider Dokumente gleich: ja (ohne Kennung wäre der Vertausch nicht zu erkennen)
- OK: txt: Dateinamen tragen die Kennung – anonymisiert_4H3P.txt, schluessel_4H3P.json
- OK: txt: Datei 1 + Schlüssel 2 (Originalname) → rot und blockiert – „Kennung Diese Schlüsseldatei gehört zu einem anderen Dokument (Dokument: 4H3P, Schlüssel: N443). Ich weiß, dass die Kenn…“; bisherige Prüfung allein: Urteil „passend“; nach ausdrücklicher Bestätigung frei: true
- OK: txt: umbenannt (notiz.txt) + Schlüssel 2 → bernstein mit Abhaken – „Kennung Im Dokument steht keine Kennung. Der Schlüssel hat die Kennung N443. Bitte prüfe, ob beide zusammengeh…“; bisherige Prüfung: „passend“
- OK: txt: richtiges Paar → grün, Rückbau exakt – Kennung Kennung 4H3P passt.
### CSV: anonymisiert_2K6N.csv + schluessel_2K6N.json / anonymisiert_87L5.csv + schluessel_87L5.json
- Anonymisierter Text beider Dokumente gleich: nein
- OK: csv: Dateinamen tragen die Kennung – anonymisiert_2K6N.csv, schluessel_2K6N.json
- OK: csv: Datei 1 + Schlüssel 2 (Originalname) → rot und blockiert – „Kennung Diese Schlüsseldatei gehört zu einem anderen Dokument (Dokument: 2K6N, Schlüssel: 87L5). Ich weiß, dass die Kenn…“; bisherige Prüfung allein: Urteil „zweifelhaft“; nach ausdrücklicher Bestätigung (Kennung UND bisherige Prüfung) frei: true
- OK: csv: umbenannt (notiz.csv) + Schlüssel 2 → bernstein mit Abhaken – „Kennung Im Dokument steht keine Kennung. Der Schlüssel hat die Kennung 87L5. Bitte prüfe, ob beide zusammengeh…“; bisherige Prüfung: „zweifelhaft“, eigene Bestätigung nötig
- OK: csv: richtiges Paar → grün, Rückbau exakt – Kennung Kennung 2K6N passt.

## Widerspruch zwischen Eigenschaft und Dateiname
- OK: Datei mit Eigenschaft K1, aber Namen K2 + Schlüssel K1 → Eigenschaft gilt (grün), Widerspruch wird gezeigt – Kennung Kennung R78S passt. Die Eigenschaft in der Datei (R78S) und der Dateiname (3R6M) widersprechen sich; es gilt die Eigenschaft.
- OK: dieselbe Datei + Schlüssel K2 → rot (Eigenschaft K1 gilt), Widerspruch wird gezeigt – Kennung Diese Schlüsseldatei gehört zu einem anderen Dokument (Dokument: R78S, Schlüssel: 3R6M). Die Eigenschaft in der Datei (R78S) und der Dateiname (3R6M) wi

## Schlüsseldatei aus Version 2.0 (ohne Kennung)
- OK: txt: Schlüssel aus 2.0 (rueckbau_schluessel_VERTRAULICH.json, Feld „kennung“: nein) → bernstein „Schlüssel ohne Kennung“, Rückbau exakt – Kennung Schlüssel ohne Kennung (erstellt vor Version 2.1). Der Rückbau funktioniert wie bisher; prüfe selbst, ob Datei u
- OK: docx: Schlüssel aus 2.0 (rueckbau_schluessel_VERTRAULICH.json, Feld „kennung“: nein) → bernstein „Schlüssel ohne Kennung“, Rückbau exakt – Kennung Schlüssel ohne Kennung (erstellt vor Version 2.1). Der Rückbau funktioniert wie bisher; prüfe selbst, ob Datei u

## Veralteter Schlüssel (nach dem Schlüssel noch einen Treffer geändert)
- OK: Nach der Änderung: neue Kennung sofort in den Dateikarten, „2 Datei speichern“ gesperrt – anonymisiert_9N4L.docx → anonymisiert_Z7K3.docx
- OK: Alter und neuer Schlüssel haben verschiedene Kennungen – 9N4L / Z7K3
- OK: ALTER Schlüssel + neue Datei → rot und blockiert – Kennung Diese Schlüsseldatei gehört zu einem anderen Dokument (Dokument: Z7K3, Schlüssel: 9N4L). Ich weiß, dass die Kenn
- OK: neuer Schlüssel + neue Datei → grün – Kennung Kennung Z7K3 passt.

## Bearbeitung in LibreOffice (Inhalt geändert, dann in LibreOffice gespeichert)
- OK: docx: nach Änderung und Speichern in LibreOffice ist die Kennung noch da – Eigenschaft R78S, erwartet R78S
- OK: docx: LibreOffice-Datei (umbenannt) + Schlüssel → grün – Kennung Kennung R78S passt.
- OK: xlsx: nach Änderung und Speichern in LibreOffice ist die Kennung noch da – Eigenschaft Y94S, erwartet Y94S
- OK: xlsx: LibreOffice-Datei (umbenannt) + Schlüssel → grün – Kennung Kennung Y94S passt.
- Microsoft Word und Excel selbst: **durch Code ungeprüft**.

## Doppellauf: Inhalt gleich, Kennung verschieden
- OK: docx: Inhalt beider Läufe gleich (Kennung ausgenommen), Schlüssel gleich (Kennung ausgenommen)
- OK: docx: Kennungen beider Läufe verschieden, Dateinamen unterscheiden sich nur in der Kennung – anonymisiert_653K.docx / anonymisiert_X33N.docx
- OK: txt: Inhalt beider Läufe gleich (Kennung ausgenommen), Schlüssel gleich (Kennung ausgenommen)
- OK: txt: Kennungen beider Läufe verschieden, Dateinamen unterscheiden sich nur in der Kennung – anonymisiert_K625.txt / anonymisiert_J46N.txt
- OK: Erneutes Laden derselben Datei und „Nächstes Dokument“ ergeben jeweils eine neue Kennung – P83R, N87L, 4G9V

## Zufalls-Beweis
- OK: Kennung entsteht nur in src/ui/kennung.js (newKennung) aus crypto.getRandomValues; alle Aufrufe ohne Dokumentdaten – Aufrufe in app.js: newKennung(), newKennung()
- OK: Mit festem Ersatz-Zufall gleiche Kennung vor und nach dem Laden eines Dokuments (kein Dokumentinhalt geht ein) – A3C5 / A3C5
- OK: 1000 Kennungen: nur erlaubte Zeichen, nie zwei Buchstaben nebeneinander
- Zeichen genutzt: 32 von 32. Je Buchstabe 58–87-mal, je Ziffer 274–313-mal (Ziffern häufiger, weil nie zwei Buchstaben nebeneinander stehen; innerhalb der Gruppe gleichmäßig).
- Mögliche Kennungen: 163 840. Doppelte unter 1000: 4 (erwartet rund 3).
- OK: Grobe Gleichverteilung innerhalb der Buchstaben und der Ziffern – Buchstaben 58–87, Ziffern 274–313

Prüfungen: 39 von 39 bestanden.
Netzwerkanfragen außer lokalen Dateien: 0.
