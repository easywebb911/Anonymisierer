# Kennung (Version 2.1): Tests

Chromium headless, Start per file://, alle Schritte über die echte Oberfläche. Alle Namen erfunden (tests/make-kennung.mjs).

## Vertausch: zwei Dokumente nach gleicher Vorlage, Schlüssel über Kreuz
### DOCX: anonymisiert_Y97J.docx + schluessel_Y97J.json / anonymisiert_2E4Z.docx + schluessel_2E4Z.json
- Anonymisierter Text beider Dokumente gleich: ja (ohne Kennung wäre der Vertausch nicht zu erkennen)
- OK: docx: Dateinamen tragen die Kennung – anonymisiert_Y97J.docx, schluessel_Y97J.json
- OK: docx: Datei 1 + Schlüssel 2 (Originalname) → rot und blockiert – „Kennung Diese Schlüsseldatei gehört zu einem anderen Dokument (Dokument: Y97J, Schlüssel: 2E4Z). Ich weiß, dass die Kenn…“; bisherige Prüfung allein: Urteil „passend“; nach ausdrücklicher Bestätigung frei: true
- OK: docx: umbenannt (bericht.docx) + eigener Schlüssel → grün (Kennung aus der Eigenschaft) – Kennung Kennung Y97J passt.
- OK: docx: umbenannt + fremder Schlüssel → rot und blockiert – Kennung Diese Schlüsseldatei gehört zu einem anderen Dokument (Dokument: Y97J, Schlüssel: 2E4Z). Ich
- OK: docx: richtiges Paar → grün, Rückbau exakt – Kennung Kennung Y97J passt.
### XLSX: anonymisiert_C83K.xlsx + schluessel_C83K.json / anonymisiert_H72F.xlsx + schluessel_H72F.json
- Anonymisierter Text beider Dokumente gleich: nein
- OK: xlsx: Dateinamen tragen die Kennung – anonymisiert_C83K.xlsx, schluessel_C83K.json
- FEHLER: xlsx: Datei 1 + Schlüssel 2 (Originalname) → rot und blockiert – „Kennung Diese Schlüsseldatei gehört zu einem anderen Dokument (Dokument: C83K, Schlüssel: H72F). Ich weiß, dass die Kenn…“; bisherige Prüfung allein: Urteil „zweifelhaft“; nach ausdrücklicher Bestätigung frei: false
- OK: xlsx: umbenannt (bericht.xlsx) + eigener Schlüssel → grün (Kennung aus der Eigenschaft) – Kennung Kennung C83K passt.
- OK: xlsx: umbenannt + fremder Schlüssel → rot und blockiert – Kennung Diese Schlüsseldatei gehört zu einem anderen Dokument (Dokument: C83K, Schlüssel: H72F). Ich
- OK: xlsx: richtiges Paar → grün, Rückbau exakt – Kennung Kennung C83K passt.
### TXT: anonymisiert_Y88M.txt + schluessel_Y88M.json / anonymisiert_T5J7.txt + schluessel_T5J7.json
- Anonymisierter Text beider Dokumente gleich: ja (ohne Kennung wäre der Vertausch nicht zu erkennen)
- OK: txt: Dateinamen tragen die Kennung – anonymisiert_Y88M.txt, schluessel_Y88M.json
- OK: txt: Datei 1 + Schlüssel 2 (Originalname) → rot und blockiert – „Kennung Diese Schlüsseldatei gehört zu einem anderen Dokument (Dokument: Y88M, Schlüssel: T5J7). Ich weiß, dass die Kenn…“; bisherige Prüfung allein: Urteil „passend“; nach ausdrücklicher Bestätigung frei: true
- OK: txt: umbenannt (notiz.txt) + Schlüssel 2 → bernstein mit Abhaken – „Kennung Im Dokument steht keine Kennung. Der Schlüssel hat die Kennung T5J7. Bitte prüfe, ob beide zusammengeh…“
- OK: txt: richtiges Paar → grün, Rückbau exakt – Kennung Kennung Y88M passt.
### CSV: anonymisiert_7F7W.csv + schluessel_7F7W.json / anonymisiert_J4N9.csv + schluessel_J4N9.json
- Anonymisierter Text beider Dokumente gleich: nein
- OK: csv: Dateinamen tragen die Kennung – anonymisiert_7F7W.csv, schluessel_7F7W.json
- FEHLER: csv: Datei 1 + Schlüssel 2 (Originalname) → rot und blockiert – „Kennung Diese Schlüsseldatei gehört zu einem anderen Dokument (Dokument: 7F7W, Schlüssel: J4N9). Ich weiß, dass die Kenn…“; bisherige Prüfung allein: Urteil „zweifelhaft“; nach ausdrücklicher Bestätigung frei: false
- FEHLER: csv: umbenannt (notiz.csv) + Schlüssel 2 → bernstein mit Abhaken – „Kennung Im Dokument steht keine Kennung. Der Schlüssel hat die Kennung J4N9. Bitte prüfe, ob beide zusammengeh…“
- OK: csv: richtiges Paar → grün, Rückbau exakt – Kennung Kennung 7F7W passt.

## Widerspruch zwischen Eigenschaft und Dateiname
- OK: Datei mit Eigenschaft K1, aber Namen K2 + Schlüssel K1 → Eigenschaft gilt (grün), Widerspruch wird gezeigt – Kennung Kennung Y97J passt. Die Eigenschaft in der Datei (Y97J) und der Dateiname (2E4Z) widersprechen sich; es gilt die Eigenschaft.
- OK: dieselbe Datei + Schlüssel K2 → rot (Eigenschaft K1 gilt), Widerspruch wird gezeigt – Kennung Diese Schlüsseldatei gehört zu einem anderen Dokument (Dokument: Y97J, Schlüssel: 2E4Z). Die Eigenschaft in der Datei (Y97J) und der Dateiname (2E4Z) wi

## Schlüsseldatei aus Version 2.0 (ohne Kennung)
- OK: txt: Schlüssel aus 2.0 (rueckbau_schluessel_VERTRAULICH.json, Feld „kennung“: nein) → bernstein „Schlüssel ohne Kennung“, Rückbau exakt – Kennung Schlüssel ohne Kennung (erstellt vor Version 2.1). Der Rückbau funktioniert wie bisher; prüfe selbst, ob Datei u
- OK: docx: Schlüssel aus 2.0 (rueckbau_schluessel_VERTRAULICH.json, Feld „kennung“: nein) → bernstein „Schlüssel ohne Kennung“, Rückbau exakt – Kennung Schlüssel ohne Kennung (erstellt vor Version 2.1). Der Rückbau funktioniert wie bisher; prüfe selbst, ob Datei u

## Veralteter Schlüssel (nach dem Schlüssel noch einen Treffer geändert)
- OK: Nach der Änderung: neue Kennung sofort in den Dateikarten, „2 Datei speichern“ gesperrt – anonymisiert_9463.docx → anonymisiert_Z622.docx
- OK: Alter und neuer Schlüssel haben verschiedene Kennungen – 9463 / Z622
- OK: ALTER Schlüssel + neue Datei → rot und blockiert – Kennung Diese Schlüsseldatei gehört zu einem anderen Dokument (Dokument: Z622, Schlüssel: 9463). Ich weiß, dass die Kenn
- OK: neuer Schlüssel + neue Datei → grün – Kennung Kennung Z622 passt.

## Bearbeitung in LibreOffice (Inhalt geändert, dann in LibreOffice gespeichert)
- OK: docx: nach Änderung und Speichern in LibreOffice ist die Kennung noch da – Eigenschaft Y97J, erwartet Y97J
- OK: docx: LibreOffice-Datei (umbenannt) + Schlüssel → grün – Kennung Kennung Y97J passt.
- OK: xlsx: nach Änderung und Speichern in LibreOffice ist die Kennung noch da – Eigenschaft C83K, erwartet C83K
- OK: xlsx: LibreOffice-Datei (umbenannt) + Schlüssel → grün – Kennung Kennung C83K passt.
- Microsoft Word und Excel selbst: **durch Code ungeprüft**.

## Doppellauf: Inhalt gleich, Kennung verschieden
- OK: docx: Inhalt beider Läufe gleich (Kennung ausgenommen), Schlüssel gleich (Kennung ausgenommen)
- OK: docx: Kennungen beider Läufe verschieden, Dateinamen unterscheiden sich nur in der Kennung – anonymisiert_8E2B.docx / anonymisiert_43L7.docx
- OK: txt: Inhalt beider Läufe gleich (Kennung ausgenommen), Schlüssel gleich (Kennung ausgenommen)
- OK: txt: Kennungen beider Läufe verschieden, Dateinamen unterscheiden sich nur in der Kennung – anonymisiert_6R8J.txt / anonymisiert_P47A.txt
- OK: Erneutes Laden derselben Datei und „Nächstes Dokument“ ergeben jeweils eine neue Kennung – H74J, U5U7, 4N5D

## Zufalls-Beweis
- OK: Kennung entsteht nur in src/ui/kennung.js (newKennung) aus crypto.getRandomValues; alle Aufrufe ohne Dokumentdaten – Aufrufe in app.js: newKennung(), newKennung()
- OK: Mit festem Ersatz-Zufall gleiche Kennung vor und nach dem Laden eines Dokuments (kein Dokumentinhalt geht ein) – A3C5 / A3C5
- OK: 1000 Kennungen: nur erlaubte Zeichen, nie zwei Buchstaben nebeneinander
- Zeichen genutzt: 32 von 32. Je Buchstabe 55–94-mal, je Ziffer 260–342-mal (Ziffern häufiger, weil nie zwei Buchstaben nebeneinander stehen; innerhalb der Gruppe gleichmäßig).
- Mögliche Kennungen: 163 840. Doppelte unter 1000: 3 (erwartet rund 3).
- OK: Grobe Gleichverteilung innerhalb der Buchstaben und der Ziffern – Buchstaben 55–94, Ziffern 260–342

Prüfungen: 36 von 39 bestanden – FEHLER: xlsx: Datei 1 + Schlüssel 2 (Originalname) → rot und blockiert; csv: Datei 1 + Schlüssel 2 (Originalname) → rot und blockiert; csv: umbenannt (notiz.csv) + Schlüssel 2 → bernstein mit Abhaken.
Netzwerkanfragen außer lokalen Dateien: 0.
