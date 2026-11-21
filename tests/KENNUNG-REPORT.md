# Kennung (Version 2.1): Tests

Chromium headless, Start per file://, alle Schritte über die echte Oberfläche. Alle Namen erfunden (tests/make-kennung.mjs).

## Vertausch: zwei Dokumente nach gleicher Vorlage, Schlüssel über Kreuz
### DOCX: anonymisiert_K4L2.docx + schluessel_K4L2.json / anonymisiert_T8U6.docx + schluessel_T8U6.json
- Anonymisierter Text beider Dokumente gleich: ja (ohne Kennung wäre der Vertausch nicht zu erkennen)
- OK: docx: Dateinamen tragen die Kennung – anonymisiert_K4L2.docx, schluessel_K4L2.json
- OK: docx: Datei 1 + Schlüssel 2 (Originalname) → rot und blockiert – „Kennung Diese Schlüsseldatei gehört zu einem anderen Dokument (Dokument: K4L2, Schlüssel: T8U6). Ich weiß, dass die Kenn…“; bisherige Prüfung allein: Urteil „passend“; nach ausdrücklicher Bestätigung frei: true
- OK: docx: umbenannt (bericht.docx) + eigener Schlüssel → grün (Kennung aus der Eigenschaft) – Kennung Kennung K4L2 passt.
- OK: docx: umbenannt + fremder Schlüssel → rot und blockiert – Kennung Diese Schlüsseldatei gehört zu einem anderen Dokument (Dokument: K4L2, Schlüssel: T8U6). Ich
- OK: docx: richtiges Paar → grün, Rückbau exakt – Kennung Kennung K4L2 passt.
### XLSX: anonymisiert_L4D2.xlsx + schluessel_L4D2.json / anonymisiert_7547.xlsx + schluessel_7547.json
- Anonymisierter Text beider Dokumente gleich: nein
- OK: xlsx: Dateinamen tragen die Kennung – anonymisiert_L4D2.xlsx, schluessel_L4D2.json
- OK: xlsx: Datei 1 + Schlüssel 2 (Originalname) → rot und blockiert – „Kennung Diese Schlüsseldatei gehört zu einem anderen Dokument (Dokument: L4D2, Schlüssel: 7547). Ich weiß, dass die Kenn…“; bisherige Prüfung allein: Urteil „zweifelhaft“; nach ausdrücklicher Bestätigung (Kennung UND bisherige Prüfung) frei: true
- OK: xlsx: umbenannt (bericht.xlsx) + eigener Schlüssel → grün (Kennung aus der Eigenschaft) – Kennung Kennung L4D2 passt.
- OK: xlsx: umbenannt + fremder Schlüssel → rot und blockiert – Kennung Diese Schlüsseldatei gehört zu einem anderen Dokument (Dokument: L4D2, Schlüssel: 7547). Ich
- OK: xlsx: richtiges Paar → grün, Rückbau exakt – Kennung Kennung L4D2 passt.
### TXT: anonymisiert_U75B.txt + schluessel_U75B.json / anonymisiert_4V4V.txt + schluessel_4V4V.json
- Anonymisierter Text beider Dokumente gleich: ja (ohne Kennung wäre der Vertausch nicht zu erkennen)
- OK: txt: Dateinamen tragen die Kennung – anonymisiert_U75B.txt, schluessel_U75B.json
- OK: txt: Datei 1 + Schlüssel 2 (Originalname) → rot und blockiert – „Kennung Diese Schlüsseldatei gehört zu einem anderen Dokument (Dokument: U75B, Schlüssel: 4V4V). Ich weiß, dass die Kenn…“; bisherige Prüfung allein: Urteil „passend“; nach ausdrücklicher Bestätigung frei: true
- OK: txt: umbenannt (notiz.txt) + Schlüssel 2 → bernstein mit Abhaken – „Kennung Im Dokument steht keine Kennung. Der Schlüssel hat die Kennung 4V4V. Bitte prüfe, ob beide zusammengeh…“; bisherige Prüfung: „passend“
- OK: txt: richtiges Paar → grün, Rückbau exakt – Kennung Kennung U75B passt.
### CSV: anonymisiert_4B3A.csv + schluessel_4B3A.json / anonymisiert_6G3Z.csv + schluessel_6G3Z.json
- Anonymisierter Text beider Dokumente gleich: nein
- OK: csv: Dateinamen tragen die Kennung – anonymisiert_4B3A.csv, schluessel_4B3A.json
- OK: csv: Datei 1 + Schlüssel 2 (Originalname) → rot und blockiert – „Kennung Diese Schlüsseldatei gehört zu einem anderen Dokument (Dokument: 4B3A, Schlüssel: 6G3Z). Ich weiß, dass die Kenn…“; bisherige Prüfung allein: Urteil „zweifelhaft“; nach ausdrücklicher Bestätigung (Kennung UND bisherige Prüfung) frei: true
- OK: csv: umbenannt (notiz.csv) + Schlüssel 2 → bernstein mit Abhaken – „Kennung Im Dokument steht keine Kennung. Der Schlüssel hat die Kennung 6G3Z. Bitte prüfe, ob beide zusammengeh…“; bisherige Prüfung: „zweifelhaft“, eigene Bestätigung nötig
- OK: csv: richtiges Paar → grün, Rückbau exakt – Kennung Kennung 4B3A passt.

## Widerspruch zwischen Eigenschaft und Dateiname
- OK: Datei mit Eigenschaft K1, aber Namen K2 + Schlüssel K1 → Eigenschaft gilt (grün), Widerspruch wird gezeigt – Kennung Kennung K4L2 passt. Die Eigenschaft in der Datei (K4L2) und der Dateiname (T8U6) widersprechen sich; es gilt die Eigenschaft.
- OK: dieselbe Datei + Schlüssel K2 → rot (Eigenschaft K1 gilt), Widerspruch wird gezeigt – Kennung Diese Schlüsseldatei gehört zu einem anderen Dokument (Dokument: K4L2, Schlüssel: T8U6). Die Eigenschaft in der Datei (K4L2) und der Dateiname (T8U6) wi

## Schlüsseldatei aus Version 2.0 (ohne Kennung)
- OK: txt: Schlüssel aus 2.0 (rueckbau_schluessel_VERTRAULICH.json, Feld „kennung“: nein) → bernstein „Schlüssel ohne Kennung“, Rückbau exakt – Kennung Schlüssel ohne Kennung (erstellt vor Version 2.1). Der Rückbau funktioniert wie bisher; prüfe selbst, ob Datei u
- OK: docx: Schlüssel aus 2.0 (rueckbau_schluessel_VERTRAULICH.json, Feld „kennung“: nein) → bernstein „Schlüssel ohne Kennung“, Rückbau exakt – Kennung Schlüssel ohne Kennung (erstellt vor Version 2.1). Der Rückbau funktioniert wie bisher; prüfe selbst, ob Datei u

## Veralteter Schlüssel (nach dem Schlüssel noch einen Treffer geändert)
- OK: Nach der Änderung: neue Kennung sofort in den Dateikarten, „2 Datei speichern“ gesperrt – anonymisiert_92Z7.docx → anonymisiert_522T.docx
- OK: Alter und neuer Schlüssel haben verschiedene Kennungen – 92Z7 / 522T
- OK: ALTER Schlüssel + neue Datei → rot und blockiert – Kennung Diese Schlüsseldatei gehört zu einem anderen Dokument (Dokument: 522T, Schlüssel: 92Z7). Ich weiß, dass die Kenn
- OK: neuer Schlüssel + neue Datei → grün – Kennung Kennung 522T passt.

## Bearbeitung in LibreOffice (Inhalt geändert, dann in LibreOffice gespeichert)
- OK: docx: nach Änderung und Speichern in LibreOffice ist die Kennung noch da – Eigenschaft K4L2, erwartet K4L2
- OK: docx: LibreOffice-Datei (umbenannt) + Schlüssel → grün – Kennung Kennung K4L2 passt.
- OK: xlsx: nach Änderung und Speichern in LibreOffice ist die Kennung noch da – Eigenschaft L4D2, erwartet L4D2
- OK: xlsx: LibreOffice-Datei (umbenannt) + Schlüssel → grün – Kennung Kennung L4D2 passt.
- Microsoft Word und Excel selbst: **durch Code ungeprüft**.

## Doppellauf: Inhalt gleich, Kennung verschieden
- OK: docx: Inhalt beider Läufe gleich (Kennung ausgenommen), Schlüssel gleich (Kennung ausgenommen)
- OK: docx: Kennungen beider Läufe verschieden, Dateinamen unterscheiden sich nur in der Kennung – anonymisiert_573T.docx / anonymisiert_659J.docx
- OK: txt: Inhalt beider Läufe gleich (Kennung ausgenommen), Schlüssel gleich (Kennung ausgenommen)
- OK: txt: Kennungen beider Läufe verschieden, Dateinamen unterscheiden sich nur in der Kennung – anonymisiert_4D2L.txt / anonymisiert_K92U.txt
- OK: Erneutes Laden derselben Datei und „Nächstes Dokument“ ergeben jeweils eine neue Kennung – 443S, 522A, 7N4R

## Zufalls-Beweis
- OK: Kennung entsteht nur in src/ui/kennung.js (newKennung) aus crypto.getRandomValues; alle Aufrufe ohne Dokumentdaten – Aufrufe in app.js: newKennung(), newKennung()
- OK: Mit festem Ersatz-Zufall gleiche Kennung vor und nach dem Laden eines Dokuments (kein Dokumentinhalt geht ein) – A3C5 / A3C5
- OK: 1000 Kennungen: nur erlaubte Zeichen, nie zwei Buchstaben nebeneinander
- Zeichen genutzt: 32 von 32. Je Buchstabe 57–95-mal, je Ziffer 267–312-mal (Ziffern häufiger, weil nie zwei Buchstaben nebeneinander stehen; innerhalb der Gruppe gleichmäßig).
- Mögliche Kennungen: 163 840. Doppelte unter 1000: 5 (erwartet rund 3).
- OK: Grobe Gleichverteilung innerhalb der Buchstaben und der Ziffern – Buchstaben 57–95, Ziffern 267–312

Prüfungen: 39 von 39 bestanden.
Netzwerkanfragen außer lokalen Dateien: 0.
