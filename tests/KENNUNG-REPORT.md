# Kennung (Version 2.1): Tests

Chromium headless, Start per file://, alle Schritte über die echte Oberfläche. Alle Namen erfunden (tests/make-kennung.mjs).

## Vertausch: zwei Dokumente nach gleicher Vorlage, Schlüssel über Kreuz
### DOCX: anonymisiert_E8F8.docx + schluessel_E8F8.json / anonymisiert_E9U7.docx + schluessel_E9U7.json
- Anonymisierter Text beider Dokumente gleich: ja (ohne Kennung wäre der Vertausch nicht zu erkennen)
- OK: docx: Dateinamen tragen die Kennung – anonymisiert_E8F8.docx, schluessel_E8F8.json
- OK: docx: Datei 1 + Schlüssel 2 (Originalname) → rot und blockiert – „Kennung Diese Schlüsseldatei gehört zu einem anderen Dokument (Dokument: E8F8, Schlüssel: E9U7). Ich weiß, dass die Kenn…“; bisherige Prüfung allein: Urteil „passend“; nach ausdrücklicher Bestätigung frei: true
- OK: docx: umbenannt (bericht.docx) + eigener Schlüssel → grün (Kennung aus der Eigenschaft) – Kennung Kennung E8F8 passt.
- OK: docx: umbenannt + fremder Schlüssel → rot und blockiert – Kennung Diese Schlüsseldatei gehört zu einem anderen Dokument (Dokument: E8F8, Schlüssel: E9U7). Ich
- OK: docx: richtiges Paar → grün, Rückbau exakt – Kennung Kennung E8F8 passt.
### XLSX: anonymisiert_7S85.xlsx + schluessel_7S85.json / anonymisiert_98L3.xlsx + schluessel_98L3.json
- Anonymisierter Text beider Dokumente gleich: nein
- OK: xlsx: Dateinamen tragen die Kennung – anonymisiert_7S85.xlsx, schluessel_7S85.json
- OK: xlsx: Datei 1 + Schlüssel 2 (Originalname) → rot und blockiert – „Kennung Diese Schlüsseldatei gehört zu einem anderen Dokument (Dokument: 7S85, Schlüssel: 98L3). Ich weiß, dass die Kenn…“; bisherige Prüfung allein: Urteil „zweifelhaft“; nach ausdrücklicher Bestätigung (Kennung UND bisherige Prüfung) frei: true
- OK: xlsx: umbenannt (bericht.xlsx) + eigener Schlüssel → grün (Kennung aus der Eigenschaft) – Kennung Kennung 7S85 passt.
- OK: xlsx: umbenannt + fremder Schlüssel → rot und blockiert – Kennung Diese Schlüsseldatei gehört zu einem anderen Dokument (Dokument: 7S85, Schlüssel: 98L3). Ich
- OK: xlsx: richtiges Paar → grün, Rückbau exakt – Kennung Kennung 7S85 passt.
### TXT: anonymisiert_C28R.txt + schluessel_C28R.json / anonymisiert_P5A6.txt + schluessel_P5A6.json
- Anonymisierter Text beider Dokumente gleich: ja (ohne Kennung wäre der Vertausch nicht zu erkennen)
- OK: txt: Dateinamen tragen die Kennung – anonymisiert_C28R.txt, schluessel_C28R.json
- OK: txt: Datei 1 + Schlüssel 2 (Originalname) → rot und blockiert – „Kennung Diese Schlüsseldatei gehört zu einem anderen Dokument (Dokument: C28R, Schlüssel: P5A6). Ich weiß, dass die Kenn…“; bisherige Prüfung allein: Urteil „passend“; nach ausdrücklicher Bestätigung frei: true
- OK: txt: umbenannt (notiz.txt) + Schlüssel 2 → bernstein mit Abhaken – „Kennung Im Dokument steht keine Kennung. Der Schlüssel hat die Kennung P5A6. Bitte prüfe, ob beide zusammengeh…“; bisherige Prüfung: „passend“
- OK: txt: richtiges Paar → grün, Rückbau exakt – Kennung Kennung C28R passt.
### CSV: anonymisiert_7P8Z.csv + schluessel_7P8Z.json / anonymisiert_N34E.csv + schluessel_N34E.json
- Anonymisierter Text beider Dokumente gleich: nein
- OK: csv: Dateinamen tragen die Kennung – anonymisiert_7P8Z.csv, schluessel_7P8Z.json
- OK: csv: Datei 1 + Schlüssel 2 (Originalname) → rot und blockiert – „Kennung Diese Schlüsseldatei gehört zu einem anderen Dokument (Dokument: 7P8Z, Schlüssel: N34E). Ich weiß, dass die Kenn…“; bisherige Prüfung allein: Urteil „zweifelhaft“; nach ausdrücklicher Bestätigung (Kennung UND bisherige Prüfung) frei: true
- OK: csv: umbenannt (notiz.csv) + Schlüssel 2 → bernstein mit Abhaken – „Kennung Im Dokument steht keine Kennung. Der Schlüssel hat die Kennung N34E. Bitte prüfe, ob beide zusammengeh…“; bisherige Prüfung: „zweifelhaft“, eigene Bestätigung nötig
- OK: csv: richtiges Paar → grün, Rückbau exakt – Kennung Kennung 7P8Z passt.

## Widerspruch zwischen Eigenschaft und Dateiname
- OK: Datei mit Eigenschaft K1, aber Namen K2 + Schlüssel K1 → Eigenschaft gilt (grün), Widerspruch wird gezeigt – Kennung Kennung E8F8 passt. Die Eigenschaft in der Datei (E8F8) und der Dateiname (E9U7) widersprechen sich; es gilt die Eigenschaft.
- OK: dieselbe Datei + Schlüssel K2 → rot (Eigenschaft K1 gilt), Widerspruch wird gezeigt – Kennung Diese Schlüsseldatei gehört zu einem anderen Dokument (Dokument: E8F8, Schlüssel: E9U7). Die Eigenschaft in der Datei (E8F8) und der Dateiname (E9U7) wi

## Schlüsseldatei aus Version 2.0 (ohne Kennung)
- OK: txt: Schlüssel aus 2.0 (rueckbau_schluessel_VERTRAULICH.json, Feld „kennung“: nein) → bernstein „Schlüssel ohne Kennung“, Rückbau exakt – Kennung Schlüssel ohne Kennung (erstellt vor Version 2.1). Der Rückbau funktioniert wie bisher; prüfe selbst, ob Datei u
- OK: docx: Schlüssel aus 2.0 (rueckbau_schluessel_VERTRAULICH.json, Feld „kennung“: nein) → bernstein „Schlüssel ohne Kennung“, Rückbau exakt – Kennung Schlüssel ohne Kennung (erstellt vor Version 2.1). Der Rückbau funktioniert wie bisher; prüfe selbst, ob Datei u

## Veralteter Schlüssel (nach dem Schlüssel noch einen Treffer geändert)
- OK: Nach der Änderung: neue Kennung sofort in den Dateikarten, „2 Datei speichern“ gesperrt – anonymisiert_P7J7.docx → anonymisiert_4Z3X.docx
- OK: Alter und neuer Schlüssel haben verschiedene Kennungen – P7J7 / 4Z3X
- OK: ALTER Schlüssel + neue Datei → rot und blockiert – Kennung Diese Schlüsseldatei gehört zu einem anderen Dokument (Dokument: 4Z3X, Schlüssel: P7J7). Ich weiß, dass die Kenn
- OK: neuer Schlüssel + neue Datei → grün – Kennung Kennung 4Z3X passt.

## Bearbeitung in LibreOffice (Inhalt geändert, dann in LibreOffice gespeichert)
- OK: docx: nach Änderung und Speichern in LibreOffice ist die Kennung noch da – Eigenschaft E8F8, erwartet E8F8
- OK: docx: LibreOffice-Datei (umbenannt) + Schlüssel → grün – Kennung Kennung E8F8 passt.
- OK: xlsx: nach Änderung und Speichern in LibreOffice ist die Kennung noch da – Eigenschaft 7S85, erwartet 7S85
- OK: xlsx: LibreOffice-Datei (umbenannt) + Schlüssel → grün – Kennung Kennung 7S85 passt.
- Microsoft Word und Excel selbst: **durch Code ungeprüft**.

## Doppellauf: Inhalt gleich, Kennung verschieden
- OK: docx: Inhalt beider Läufe gleich (Kennung ausgenommen), Schlüssel gleich (Kennung ausgenommen)
- OK: docx: Kennungen beider Läufe verschieden, Dateinamen unterscheiden sich nur in der Kennung – anonymisiert_562T.docx / anonymisiert_B8E8.docx
- OK: txt: Inhalt beider Läufe gleich (Kennung ausgenommen), Schlüssel gleich (Kennung ausgenommen)
- OK: txt: Kennungen beider Läufe verschieden, Dateinamen unterscheiden sich nur in der Kennung – anonymisiert_5T2R.txt / anonymisiert_2R86.txt
- OK: Erneutes Laden derselben Datei und „Nächstes Dokument“ ergeben jeweils eine neue Kennung – W72Q, X48W, J766

## Zufalls-Beweis
- OK: Kennung entsteht nur in src/ui/kennung.js (newKennung) aus crypto.getRandomValues; alle Aufrufe ohne Dokumentdaten – Aufrufe in app.js: newKennung(), newKennung()
- OK: Mit festem Ersatz-Zufall gleiche Kennung vor und nach dem Laden eines Dokuments (kein Dokumentinhalt geht ein) – A3C5 / A3C5
- OK: 1000 Kennungen: nur erlaubte Zeichen, nie zwei Buchstaben nebeneinander
- Zeichen genutzt: 32 von 32. Je Buchstabe 53–87-mal, je Ziffer 266–330-mal (Ziffern häufiger, weil nie zwei Buchstaben nebeneinander stehen; innerhalb der Gruppe gleichmäßig).
- Mögliche Kennungen: 163 840. Doppelte unter 1000: 4 (erwartet rund 3).
- OK: Grobe Gleichverteilung innerhalb der Buchstaben und der Ziffern – Buchstaben 53–87, Ziffern 266–330

Prüfungen: 39 von 39 bestanden.
Netzwerkanfragen außer lokalen Dateien: 0.
