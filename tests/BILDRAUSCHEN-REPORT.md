# Speichern verständlicher (Version 2.11.2)

## A. Häkchen gesperrt wegen ungesehener Bilder
- OK: Datei mit Bildern: Häkchen gesperrt, Satz „Sieh dir zuerst die Bilder an.“ und Knopf „Bilder ansehen“ sichtbar – {"disabled":true,"row":true,"text":"Sieh dir zuerst die Bilder an.\nBilder ansehen"}
- OK: Knopf mit der Tastatur erreichbar und mit Enter auslösbar
- OK: Nach dem Knopf: Bilderliste offen und im sichtbaren Bereich, Häkchen wählbar, Satz und Knopf weg – {"disabled":false,"row":false,"visible":true,"focus":"ack-all"}
- OK: Häkchen lässt sich setzen; nach einer Änderung fällt es zurück wie auf main – neu {"checked":false,"disabled":false,"row":false} / main {"checked":false,"disabled":false,"row":false}
- OK: Sperre wie auf main (vorher gesperrt, nach dem Öffnen frei)
- OK: Kein „null“/„undefined“ im Satz – Sieh dir zuerst die Bilder an.
Bilder ansehen
- OK: Datei ohne Bilder: kein Satz, kein Knopf; Häkchen wie auf main – neu {"disabled":false,"rowHidden":false,"img":false} / main {"disabled":false,"rowHidden":false,"img":false}

## B. Schlusscheck: Zufallstreffer kurzer Namen in reinen Bilddaten

### rauschen.docx, Modus person: main 91 Funde, Branch 0 Funde

| Name (Grundform des Treffers) | Fundort | Zahl (main) |
|---|---|---|
| lin | binär UTF-8 | 1 |
| lis | binär UTF-8 | 1 |
| li | binär UTF-8 | 85 |
| lı | binär UTF-8 | 1 |
| wen | binär UTF-8 | 3 |
- OK: rauschen.docx, person: Messung ohne neue Regel = main (gleiche Funde) – 91 / 91
- OK: rauschen.docx, person: auf main mindestens ein Zufallstreffer (nachgestellt) – 91
- OK: rauschen.docx, person: Branch meldet keinen Zufallstreffer mehr (Ziel 0)
- OK: rauschen.docx, person: jeder Fund von main liegt in einem Bild (PNG/JPEG, binär) und ist kurz (bis 4 Buchstaben)

### rauschen.docx, Modus name: main 91 Funde, Branch 0 Funde
- OK: rauschen.docx, name: Messung ohne neue Regel = main (gleiche Funde) – 91 / 91
- OK: rauschen.docx, name: auf main mindestens ein Zufallstreffer (nachgestellt) – 91
- OK: rauschen.docx, name: Branch meldet keinen Zufallstreffer mehr (Ziel 0)
- OK: rauschen.docx, name: jeder Fund von main liegt in einem Bild (PNG/JPEG, binär) und ist kurz (bis 4 Buchstaben)

### rauschen.docx, Modus reversible: main 91 Funde, Branch 0 Funde
- OK: rauschen.docx, reversible: Messung ohne neue Regel = main (gleiche Funde) – 91 / 91
- OK: rauschen.docx, reversible: auf main mindestens ein Zufallstreffer (nachgestellt) – 91
- OK: rauschen.docx, reversible: Branch meldet keinen Zufallstreffer mehr (Ziel 0)
- OK: rauschen.docx, reversible: jeder Fund von main liegt in einem Bild (PNG/JPEG, binär) und ist kurz (bis 4 Buchstaben)

### rauschen.xlsx, Modus person: main 91 Funde, Branch 0 Funde

| Name (Grundform des Treffers) | Fundort | Zahl (main) |
|---|---|---|
| lin | binär UTF-8 | 1 |
| lis | binär UTF-8 | 1 |
| li | binär UTF-8 | 85 |
| lı | binär UTF-8 | 1 |
| wen | binär UTF-8 | 3 |
- OK: rauschen.xlsx, person: Messung ohne neue Regel = main (gleiche Funde) – 91 / 91
- OK: rauschen.xlsx, person: auf main mindestens ein Zufallstreffer (nachgestellt) – 91
- OK: rauschen.xlsx, person: Branch meldet keinen Zufallstreffer mehr (Ziel 0)
- OK: rauschen.xlsx, person: jeder Fund von main liegt in einem Bild (PNG/JPEG, binär) und ist kurz (bis 4 Buchstaben)

### rauschen.xlsx, Modus name: main 91 Funde, Branch 0 Funde
- OK: rauschen.xlsx, name: Messung ohne neue Regel = main (gleiche Funde) – 91 / 91
- OK: rauschen.xlsx, name: auf main mindestens ein Zufallstreffer (nachgestellt) – 91
- OK: rauschen.xlsx, name: Branch meldet keinen Zufallstreffer mehr (Ziel 0)
- OK: rauschen.xlsx, name: jeder Fund von main liegt in einem Bild (PNG/JPEG, binär) und ist kurz (bis 4 Buchstaben)

### rauschen.xlsx, Modus reversible: main 91 Funde, Branch 0 Funde
- OK: rauschen.xlsx, reversible: Messung ohne neue Regel = main (gleiche Funde) – 91 / 91
- OK: rauschen.xlsx, reversible: auf main mindestens ein Zufallstreffer (nachgestellt) – 91
- OK: rauschen.xlsx, reversible: Branch meldet keinen Zufallstreffer mehr (Ziel 0)
- OK: rauschen.xlsx, reversible: jeder Fund von main liegt in einem Bild (PNG/JPEG, binär) und ist kurz (bis 4 Buchstaben)

## B. Lesbarer Text in Bildangaben (kurzer Name „Ole“, langer Name „Wittenbrink“)
- OK: lesbar.docx, PNG-Textfeld: kurzer und langer Name gemeldet wie auf main – main {"kurz":true,"lang":true} / neu {"kurz":true,"lang":true}
- OK: lesbar.docx, EXIF: kurzer und langer Name gemeldet wie auf main – main {"kurz":true,"lang":true} / neu {"kurz":true,"lang":true}
- OK: lesbar.docx, XMP: kurzer und langer Name gemeldet wie auf main – main {"kurz":true,"lang":true} / neu {"kurz":true,"lang":true}
- OK: lesbar.docx, Alt-Text: kurzer und langer Name gemeldet wie auf main – main {"kurz":true,"lang":true} / neu {"kurz":true,"lang":true}
- OK: lesbar.xlsx, PNG-Textfeld: kurzer und langer Name gemeldet wie auf main – main {"kurz":true,"lang":true} / neu {"kurz":true,"lang":true}
- OK: lesbar.xlsx, EXIF: kurzer und langer Name gemeldet wie auf main – main {"kurz":true,"lang":true} / neu {"kurz":true,"lang":true}
- OK: lesbar.xlsx, XMP: kurzer und langer Name gemeldet wie auf main – main {"kurz":true,"lang":true} / neu {"kurz":true,"lang":true}
- OK: lesbar.xlsx, Alt-Text: kurzer und langer Name gemeldet wie auf main – main {"kurz":true,"lang":true} / neu {"kurz":true,"lang":true}

## B. Gegenprobe: alle Word-/Excel-Testdateien, Modus „Person A“
- 77 Dateien verglichen, 0 Funde fallen weg
- OK: Gegenprobe: jeder wegfallende Fund ist ein Zufallstreffer in reinen Bilddaten; sonst keine Abweichung – 0

- OK: Keine JS-Fehler
- OK: 0 Anfragen nach außen (alle Seiten dieses Laufs)

Ergebnis: 42 von 42 Prüfungen bestanden
