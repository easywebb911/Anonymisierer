# Platzhalter-Kollisionen (Version 2.3.4): Tests

Testdokumente: tests/make-kollision.mjs (alles erfunden). Vorher = Version 2.3.3, nachher = diese Version. Anonymisieren und Rückbau über die Oberfläche.

## 1. Platzhalter-Wörter im Original (Phase-0-Dokument), Modus rückbaufähig, Kreislauf
- kollision.txt, vorher: falsch zurückgebaute Stellen 3: „Im Formular stehen die Felder Nachname A, Vorname B und Name A.“ → „Im Formular stehen die Felder Müller, Jan und Name A.“; „Die Einrichtung A ist ein Beispiel, Person A eine Spielfigur.“ → „Die Lindenauer Bürgerverein ist ein Beispiel, Person A eine Spielfigur.“; „Vorlage: [NAME] schreibt an [E-MAIL-1].“ → „Vorlage: [NAME] schreibt an helga.mueller@example.org.“
- kollision.txt, nachher: falsch zurückgebaute Stellen 0
  - nachher Ausgabe: „Im Formular stehen die Felder Nachname A, Vorname B und Vorname D A.“ | „Die Einrichtung A ist ein Beispiel, Person A eine Spielfigur.“ | „Vorlage: [NAME] schreibt an [E-MAIL-1].“
  - nachher Bericht: „Nachname A“ stand schon im Original (1×) – [info]; „Vorname B“ stand schon im Original (1×) – [info]; „Name A“ stand schon im Original (1×) – [info]; „Einrichtung A“ stand schon im Original (1×) – [info]; „Person A“ stand schon im Original (1×) – [info]; „[NAME]“ stand schon im Original (1×) – [info]; „[E-MAIL-1]“ stand schon im Original (1×) – [info]; rote Reste: 0
- OK: kollision.txt: Rückbau nachher exakt, keine Originalstelle überschrieben, Zeilen „stand schon im Original“ neutral, keine roten Reste
- kollision.docx, vorher: falsch zurückgebaute Stellen 3: „Im Formular stehen die Felder Nachname A, Vorname B und Name A.“ → „Im Formular stehen die Felder Müller, Jan und Name A.“; „Die Einrichtung A ist ein Beispiel, Person A eine Spielfigur.“ → „Die Lindenauer Bürgerverein ist ein Beispiel, Person A eine Spielfigur.“; „Vorlage: [NAME] schreibt an [E-MAIL-1].“ → „Vorlage: [NAME] schreibt an helga.mueller@example.org.“
- kollision.docx, nachher: falsch zurückgebaute Stellen 0
  - nachher Ausgabe: „Im Formular stehen die Felder Nachname A, Vorname B und Vorname D A.“ | „Die Einrichtung A ist ein Beispiel, Person A eine Spielfigur.“ | „Vorlage: [NAME] schreibt an [E-MAIL-1].“
  - nachher Bericht: „Nachname A“ stand schon im Original (1×) – [info]; „Vorname B“ stand schon im Original (1×) – [info]; „Name A“ stand schon im Original (1×) – [info]; „Einrichtung A“ stand schon im Original (1×) – [info]; „Person A“ stand schon im Original (1×) – [info]; „[NAME]“ stand schon im Original (1×) – [info]; „[E-MAIL-1]“ stand schon im Original (1×) – [info]; rote Reste: 0
- OK: kollision.docx: Rückbau nachher exakt, keine Originalstelle überschrieben, Zeilen „stand schon im Original“ neutral, keine roten Reste
- kollision.csv, vorher: falsch zurückgebaute Stellen 3: „Im Formular stehen die Felder Nachname A, Vorname B und Name A.“ → „Im Formular stehen die Felder Müller, Jan und Name A.“; „Die Einrichtung A ist ein Beispiel, Person A eine Spielfigur.“ → „Die Lindenauer Bürgerverein ist ein Beispiel, Person A eine Spielfigur.“; „Vorlage: [NAME] schreibt an [E-MAIL-1].“ → „Vorlage: [NAME] schreibt an helga.mueller@example.org.“
- kollision.csv, nachher: falsch zurückgebaute Stellen 0
  - nachher Ausgabe: „Im Formular stehen die Felder Nachname A, Vorname B und Vorname D A.“ | „Die Einrichtung A ist ein Beispiel, Person A eine Spielfigur.“ | „Vorlage: [NAME] schreibt an [E-MAIL-1].“
  - nachher Bericht: „Nachname A“ stand schon im Original (1×) – [info]; „Vorname B“ stand schon im Original (1×) – [info]; „Name A“ stand schon im Original (1×) – [info]; „Einrichtung A“ stand schon im Original (1×) – [info]; „Person A“ stand schon im Original (1×) – [info]; „[NAME]“ stand schon im Original (1×) – [info]; „[E-MAIL-1]“ stand schon im Original (1×) – [info]; rote Reste: 0
- OK: kollision.csv: Rückbau nachher exakt, keine Originalstelle überschrieben, Zeilen „stand schon im Original“ neutral, keine roten Reste
- kollision-name.txt, vorher: falsch zurückgebaute Stellen 1: „Im Formular stehen die Felder Name A, Nachname B und Vorname B.“ → „Im Formular stehen die Felder Name A, Müller und Helga.“
- kollision-name.txt, nachher: falsch zurückgebaute Stellen 0
  - nachher Ausgabe: „Name A2 hat angerufen.“ | „Im Formular stehen die Felder Vorname D A, Nachname B und Vorname B.“
  - nachher Bericht: „Name A“ stand schon im Original (1×) – [info]; „Nachname B“ stand schon im Original (1×) – [info]; „Vorname B“ stand schon im Original (1×) – [info]; rote Reste: 0
- OK: kollision-name.txt: Rückbau nachher exakt, keine Originalstelle überschrieben, Zeilen „stand schon im Original“ neutral, keine roten Reste

## 2. Modus „Person A“ und „[NAME]“: Ausweichen und Hinweis im Speichern-Schritt
- person, vorher: Zeile 1 „Frau Person A und Herr Person B kommen. Kontakt: [E-MAIL].“, Zeile 2 „Der Einrichtung A lädt ein.“; Hinweis: keiner
- person, nachher: Zeile 1 „Frau Person B und Herr Person C kommen. Kontakt: [E-MAIL].“, Zeile 2 „Der Einrichtung B lädt ein.“; Hinweis: [info, ohne Abhaken] Wörter wie Platzhalter – Im Text stehen Wörter, die wie Platzhalter aussehen („Nachname A“, „Vorname B“, „Name A“, „Einrichtung A“, „Person A“, „[NAME]“, „[E-MAIL-1]“). Das Tool verwendet diese Platzhalter nicht.
- OK: person: Hinweis als Information unter „Details“ (seit 2.5.0, vorher bernstein), ohne Sperre; „Person A“ und „Einrichtung A“ werden nicht vergeben (Personen ab B, Einrichtung B)
- name, vorher: Zeile 1 „Frau [NAME] und Herr [NAME] kommen. Kontakt: [E-MAIL].“, Zeile 2 „Der [EINRICHTUNG] lädt ein.“; Hinweis: keiner
- name, nachher: Zeile 1 „Frau [NAME] und Herr [NAME] kommen. Kontakt: [E-MAIL].“, Zeile 2 „Der [EINRICHTUNG] lädt ein.“; Hinweis: [info, ohne Abhaken] Wörter wie Platzhalter – Im Text stehen Wörter, die wie Platzhalter aussehen („Nachname A“, „Vorname B“, „Name A“, „Einrichtung A“, „Person A“, „[NAME]“, „[E-MAIL-1]“). Das Tool verwendet diese Platzhalter nicht. Im Modu
- OK: name: Hinweis als Information unter „Details“ (seit 2.5.0, vorher bernstein), ohne Sperre mit Zusatz zur KI
- reversible, vorher: Zeile 1 „Frau Vorname A Nachname A und Herr Vorname B Nachname B kommen. Kontakt: [E-MAIL-1].“, Zeile 2 „Der Einrichtung A lädt ein.“; Hinweis: [ok docwarn, mit Abhaken] Hinweis zur DateiDas Original enthält schon Text, der wie ein Platzhalter aussieht (Nachname A, Vorname B, Name A, [E-MAIL-1], Einrichtung A). Beim Rückbau würde dieser Text ebenfalls ersetzt. Bitte vorher prüfen oder um
- reversible, nachher: Zeile 1 „Frau Vorname A Nachname A2 und Herr Vorname B2 Nachname B kommen. Kontakt: [E-MAIL-2].“, Zeile 2 „Der Einrichtung A2 lädt ein.“; Hinweis: [info, ohne Abhaken] Wörter wie Platzhalter – Im Text stehen Wörter, die wie Platzhalter aussehen („Nachname A“, „Vorname B“, „Name A“, „Einrichtung A“, „Person A“, „[NAME]“, „[E-MAIL-1]“). Das Tool verwendet diese Platzhalter nicht.
- OK: reversible: Hinweis als Information unter „Details“ (seit 2.5.0, vorher bernstein), ohne Sperre

## 3. Ziffern am Namen („Müller2“, „Yılmaz12“), dazu „Mueller“, GROSS-Form und Endung; Kreislauf rückbaufähig
- ziffern.docx: Müller2: vorher FALSCH, nachher exakt; Yılmaz12: vorher FALSCH, nachher exakt; MÜLLER3: vorher FALSCH, nachher exakt; Mueller: vorher exakt, nachher exakt; MÜLLER: vorher exakt, nachher exakt; MÜLLERS: vorher exakt, nachher exakt; Müllers: vorher exakt, nachher exakt; Müller22: vorher FALSCH, nachher exakt; Yılmaz1: vorher FALSCH, nachher exakt
  - vorher falsch: „Kürzel: Müller2 und Yılmaz12, außerdem MÜLLER3.“ → „Kürzel: MÜLLER und Nachname B12, außerdem Nachname A23.“; „Liste: Müller2, Müller22; Yılmaz12 und Yılmaz1.“ → „Liste: MÜLLER, Nachname A22; Nachname B12 und Nachname B1.“
  - nachher Ausgabe Zeile 2: „Kürzel: Nachname A2 und Nachname B2, außerdem Nachname A3.“; Schlüssel: Nachname A2 = „Müller2“, Nachname B2 = „Yılmaz12“, Nachname A3 = „MÜLLER3“, Nachname A6 = „Müller22“, Nachname B3 = „Yılmaz1“
- OK: ziffern.docx: Kreislauf nachher exakt (alle Zeilen), keine Reste, Urteil „passend“
- ziffern.txt: Müller2: vorher FALSCH, nachher exakt; Yılmaz12: vorher FALSCH, nachher exakt; MÜLLER3: vorher FALSCH, nachher exakt; Mueller: vorher exakt, nachher exakt; MÜLLER: vorher exakt, nachher exakt; MÜLLERS: vorher exakt, nachher exakt; Müllers: vorher exakt, nachher exakt; Müller22: vorher FALSCH, nachher exakt; Yılmaz1: vorher FALSCH, nachher exakt
  - vorher falsch: „Kürzel: Müller2 und Yılmaz12, außerdem MÜLLER3.“ → „Kürzel: MÜLLER und Nachname B12, außerdem Nachname A23.“; „Liste: Müller2, Müller22; Yılmaz12 und Yılmaz1.“ → „Liste: MÜLLER, Nachname A22; Nachname B12 und Nachname B1.“
  - nachher Ausgabe Zeile 2: „Kürzel: Nachname A2 und Nachname B2, außerdem Nachname A3.“; Schlüssel: Nachname A2 = „Müller2“, Nachname B2 = „Yılmaz12“, Nachname A3 = „MÜLLER3“, Nachname A6 = „Müller22“, Nachname B3 = „Yılmaz1“
- OK: ziffern.txt: Kreislauf nachher exakt (alle Zeilen), keine Reste, Urteil „passend“
- ziffern.csv: Müller2: vorher FALSCH, nachher exakt; Yılmaz12: vorher FALSCH, nachher exakt; MÜLLER3: vorher FALSCH, nachher exakt; Mueller: vorher exakt, nachher exakt; MÜLLER: vorher exakt, nachher exakt; MÜLLERS: vorher exakt, nachher exakt; Müllers: vorher exakt, nachher exakt; Müller22: vorher FALSCH, nachher exakt; Yılmaz1: vorher FALSCH, nachher exakt
  - vorher falsch: „Kürzel: Müller2 und Yılmaz12, außerdem MÜLLER3.“ → „Kürzel: MÜLLER und Nachname B12, außerdem Nachname A23.“; „Liste: Müller2, Müller22; Yılmaz12 und Yılmaz1.“ → „Liste: MÜLLER, Nachname A22; Nachname B12 und Nachname B1.“
  - nachher Ausgabe Zeile 2: „Kürzel: Nachname A2 und Nachname B2, außerdem Nachname A3.“; Schlüssel: Nachname A2 = „Müller2“, Nachname B2 = „Yılmaz12“, Nachname A3 = „MÜLLER3“, Nachname A6 = „Müller22“, Nachname B3 = „Yılmaz1“
- OK: ziffern.csv: Kreislauf nachher exakt (alle Zeilen), keine Reste, Urteil „passend“
- ziffern.xlsx: Müller2: vorher FALSCH, nachher exakt; Yılmaz12: vorher FALSCH, nachher exakt; MÜLLER3: vorher FALSCH, nachher exakt; Mueller: vorher exakt, nachher exakt; MÜLLER: vorher exakt, nachher exakt; MÜLLERS: vorher exakt, nachher exakt; Müllers: vorher exakt, nachher exakt; Müller22: vorher FALSCH, nachher exakt; Yılmaz1: vorher FALSCH, nachher exakt
  - vorher falsch: „Kürzel: Müller2 und Yılmaz12, außerdem MÜLLER3.“ → „Kürzel: MÜLLER und Nachname B12, außerdem Nachname A23.“; „Liste: Müller2, Müller22; Yılmaz12 und Yılmaz1.“ → „Liste: MÜLLER, Nachname A22; Nachname B12 und Nachname B1.“
  - nachher Ausgabe Zeile 2: „Kürzel: Nachname A2 und Nachname B2, außerdem Nachname A3.“; Schlüssel: Nachname A2 = „Müller2“, Nachname B2 = „Yılmaz12“, Nachname A3 = „MÜLLER3“, Nachname A6 = „Müller22“, Nachname B3 = „Yılmaz1“
- OK: ziffern.xlsx: Kreislauf nachher exakt (alle Zeilen), keine Reste, Urteil „passend“
- Modus person: „Kürzel: Person A2 und Person B12, außerdem Person A3.“ – Platzhalter „Person X“ tragen nur Buchstaben; „Person A2“ ist kein anderer gültiger Platzhalter (nicht geändert)
- Modus name: „Kürzel: [NAME]2 und [NAME]12, außerdem [NAME]3.“ – „[NAME]2“ ist kein anderer Platzhalter (nicht geändert)

## 4. Systematisch (Kern): jede Platzhalter-Art, direkt gefolgt von Großbuchstabe, Kleinbuchstabe, Ziffer, Satzzeichen, Bindestrich, Apostroph
- Vorname/Nachname: Großbuchstabe ja, Kleinbuchstabe ja, Ziffer ja, Satzzeichen ja, Bindestrich ja, Apostroph ja
- Name: Großbuchstabe ja, Kleinbuchstabe ja, Ziffer ja, Satzzeichen ja, Bindestrich ja, Apostroph ja
- Initiale: Großbuchstabe ja, Kleinbuchstabe ja, Ziffer ja, Satzzeichen ja, Bindestrich ja, Apostroph ja
- Einrichtung: Großbuchstabe ja, Kleinbuchstabe ja, Ziffer ja, Satzzeichen ja, Bindestrich ja, Apostroph ja
- E-Mail: Großbuchstabe ja, Kleinbuchstabe ja, Ziffer ja, Satzzeichen ja, Bindestrich ja, Apostroph ja
- Telefon: Großbuchstabe ja, Kleinbuchstabe ja, Ziffer ja, Satzzeichen ja, Bindestrich ja, Apostroph ja
- OK: Alle 36 Kombinationen: Rückbau exakt, keine Reste – 36 von 36

## 5. Sicherheitsnetz-Gegenprobe aus Version 2.3.3 (gegenprobe-platzhalter.txt)
- vorher: rote Reste 8 (Person A, Person B, Einrichtung B, Einrichtung A2, Nachname C, Vorname D, [NAME], [E-MAIL-1]); „stand schon im Original“: –; Rückbau exakt ja
- nachher: rote Reste 0; „stand schon im Original“: „Person A“ stand schon im Original (1×) –; „Person B“ stand schon im Original (1×) –; „Einrichtung B“ stand schon im Original (1×) –; „Einrichtung A2“ stand schon im Original (1×) –; „Nachname C“ stand schon im Original (1×) –; „Vorname D“ stand schon im Original (1×) –; „[NAME]“ stand schon im Original (1×) –; „[E-MAIL-1]“ stand schon im Original (1×) –; Rückbau exakt ja
- OK: Die 8 falschen roten Meldungen sind weg, Kreislauf exakt – 8 Zeilen „stand schon im Original“
- Die 4 absichtlich beschädigten Platzhalter: siehe tests/platzhalter-test.mjs (läuft unverändert mit, weiter rot und gesperrt).

## 6. Rückwärts (REVERT-WEG): Datei und Schlüssel aus 2.3.4 mit Zusatzfeld in Version 2.3.3 zurückbauen
- Schlüssel 2.3.4: formatVersion 2, Zusatzfeld imOriginal: „Nachname A“ 1×, „Vorname B“ 1×, „Name A“ 1×, „Einrichtung A“ 1×, „Person A“ 1×, „[NAME]“ 1×, „[E-MAIL-1]“ 1×
- Version 2.3.3 beim Laden: „Schlüsseldatei geladen: 7 Platzhalter, Kennung E84Z (erstellt mit Version 2.8.1, Quelle TXT).“
- Bericht 2.3.3: [warn] KennungIm Dokument steht keine Kennung. Der Schlüssel hat die Kennung E84Z. Bitte prüfe, ob beide zusammengehören. Ich h | [bad] Wahrscheinlich die falsche Schlüsseldatei7 von 7 Platzhaltern gefunden, nur bei 7 stimmt die Anzahl, 4 unbekannte Platzh | [ok] Platzhalter8 Platzhalter werden ersetzt (7 verschiedene). Abweichende Anzahl: 0.PlatzhalterArterwartetgefundenStatusVorn | [warn] Auffällige Stellen4 Stelle(n) werden NICHT ersetzt und bleiben als Platzhalter stehen.Nachname A – unbekannter Platzhalt | [bad] Platzhalter-Reste nach dem Rückbau7 Stelle(n) sehen nach dem Rückbau noch wie ein Platzhalter aus. Sie werden nicht zurü | [warn] Bestätigung nötigEs gibt Abweichungen. Bestätige, dass du sie geprüft hast. Ich habe die Abweichungen geprüft. Nicht ers
- Ergebnis 2.3.3: Rückbau exakt ja; rote Reste 7 (Nachname A, Vorname B, Name A, Einrichtung A, Person A, [NAME], [E-MAIL-1]); Auffälligkeiten: unbekannt Nachname A, unbekannt Vorname B, unbekannt Einrichtung A, unbekannt [E-MAIL-1]
- OK: Version 2.3.3 liest den Schlüssel (Zusatzfeld wird übergangen), Rückbau exakt; Original-Wörter dort als rote Reste gemeldet

## 7. Doppellauf
- OK: kollision.docx: zwei Läufe byte-gleich
- OK: ziffern.xlsx: zwei Läufe byte-gleich
- OK: ziffern.txt: zwei Läufe byte-gleich

Prüfungen: 17 von 17 bestanden.
Netzwerkanfragen außer lokalen Dateien: 0.
