# Platzhalter mit Endung und Rückbau-Sicherheitsnetz (Version 2.3.3): Tests

Testdokumente: tests/make-platzhalter.mjs (alles erfunden). Vorher = Version 2.3.2, nachher = diese Version.

## 1. Einrichtung „Lindenauer Bürgerverein“ in GROSS mit Endung, Modus rückbaufähig, Kreislauf über die Oberfläche
- einrichtung-gross.docx: vorher 0/18 Formen exakt zurück (nicht exakt: Grundform, GROSS, GROSS+'S, GROSS+’S, GROSS+S, GROSS+ES, GROSS+N, GROSS+NS, gemischt+'s, gemischt+’s, gemischt+', gemischt+’, gemischt+s, gemischt+es, gemischt+n, gemischt+ns, Kopfzeile, Bildbeschreibung); nachher 18/18. Beispiel nachher: „Form 5: Akte des Einrichtung A5 liegt vor.“
- OK: einrichtung-gross.docx: Kreislauf nachher exakt (alle Formen, ganze Datei), keine Reste, Urteil „passend“ – Reste 0, Auffälligkeiten 0
  - vorher blieb im Ergebnis stehen: –
- einrichtung-gross.txt: vorher 0/16 Formen exakt zurück (nicht exakt: Grundform, GROSS, GROSS+'S, GROSS+’S, GROSS+S, GROSS+ES, GROSS+N, GROSS+NS, gemischt+'s, gemischt+’s, gemischt+', gemischt+’, gemischt+s, gemischt+es, gemischt+n, gemischt+ns); nachher 16/16. Beispiel nachher: „Form 5: Akte des Einrichtung A5 liegt vor.“
- OK: einrichtung-gross.txt: Kreislauf nachher exakt (alle Formen, ganze Datei), keine Reste, Urteil „passend“ – Reste 0, Auffälligkeiten 0
  - vorher blieb im Ergebnis stehen: –
- einrichtung-gross.csv: vorher 0/16 Formen exakt zurück (nicht exakt: Grundform, GROSS, GROSS+'S, GROSS+’S, GROSS+S, GROSS+ES, GROSS+N, GROSS+NS, gemischt+'s, gemischt+’s, gemischt+', gemischt+’, gemischt+s, gemischt+es, gemischt+n, gemischt+ns); nachher 16/16. Beispiel nachher: „Form 5: Akte des Einrichtung A5 liegt vor."“
- OK: einrichtung-gross.csv: Kreislauf nachher exakt (alle Formen, ganze Datei), keine Reste, Urteil „passend“ – Reste 0, Auffälligkeiten 0
  - vorher blieb im Ergebnis stehen: –
- einrichtung-gross.xlsx: vorher 0/18 Formen exakt zurück (nicht exakt: Grundform, GROSS, GROSS+'S, GROSS+’S, GROSS+S, GROSS+ES, GROSS+N, GROSS+NS, gemischt+'s, gemischt+’s, gemischt+', gemischt+’, gemischt+s, gemischt+es, gemischt+n, gemischt+ns, Kopfzeile, Bildbeschreibung); nachher 18/18. Beispiel nachher: „Form 5: Akte des Einrichtung A5 liegt vor.“
- OK: einrichtung-gross.xlsx: Kreislauf nachher exakt (alle Formen, ganze Datei), keine Reste, Urteil „passend“ – Reste 0, Auffälligkeiten 0
  - vorher blieb im Ergebnis stehen: –

## 2. Verwechslung: 50 Personen und 50 Einrichtungen („Person AS“ ist eine eigene Person); „MÜLLERS“ gehört zu Person A
- verwechslung.txt, Modus person: Zeile 45 „45. Frau Person AS ist Mitglied im Einrichtung AS.“; letzte Zeile vorher „Die Akte Person AS liegt beim Einrichtung AS Vorstand.“ → nachher „Die Akte Person As liegt beim Einrichtung As Vorstand.“
- OK: verwechslung.txt: „MÜLLERS“ → „Person As“, „LINDENAUER BÜRGERVEREINS“ → „Einrichtung As“, unterscheidbar von „Person AS“ und „Einrichtung AS“
- OK: verwechslung.txt (person): nur Stellen mit großer Endung geändert – 1 Zeile(n)
- verwechslung.txt, Modus name: Zeile 45 „45. Frau [NAME] ist Mitglied im [EINRICHTUNG].“; letzte Zeile vorher „Die Akte [NAME]S liegt beim [EINRICHTUNG]S Vorstand.“ → nachher „Die Akte [NAME]s liegt beim [EINRICHTUNG]s Vorstand.“
- OK: verwechslung.txt: „[NAME]s“ und „[EINRICHTUNG]s“ statt „[NAME]S“/„[EINRICHTUNG]S“
- OK: verwechslung.txt (name): nur Stellen mit großer Endung geändert – 1 Zeile(n)
- verwechslung.docx, Modus person: Zeile 45 „45. Frau Person AS ist Mitglied im Einrichtung AS.“; letzte Zeile vorher „Die Akte Person AS liegt beim Einrichtung AS Vorstand.“ → nachher „Die Akte Person As liegt beim Einrichtung As Vorstand.“
- OK: verwechslung.docx: „MÜLLERS“ → „Person As“, „LINDENAUER BÜRGERVEREINS“ → „Einrichtung As“, unterscheidbar von „Person AS“ und „Einrichtung AS“
- OK: verwechslung.docx (person): nur Stellen mit großer Endung geändert – 1 Zeile(n)
- verwechslung.docx, Modus name: Zeile 45 „45. Frau [NAME] ist Mitglied im [EINRICHTUNG].“; letzte Zeile vorher „Die Akte [NAME]S liegt beim [EINRICHTUNG]S Vorstand.“ → nachher „Die Akte [NAME]s liegt beim [EINRICHTUNG]s Vorstand.“
- OK: verwechslung.docx: „[NAME]s“ und „[EINRICHTUNG]s“ statt „[NAME]S“/„[EINRICHTUNG]S“
- OK: verwechslung.docx (name): nur Stellen mit großer Endung geändert – 1 Zeile(n)
- OK: verwechslung.txt: Kreislauf rückbaufähig exakt (50 Personen, 50 Einrichtungen) – Reste 0

## 3. Sicherheitsnetz: absichtlich beschädigte Platzhalter im anonymisierten Text
- OK: txt, unbeschädigt: keine Meldung, nicht gesperrt
- txt, beschädigt: rote Zeilen 4 („Einrichtung A2S“ sieht nach dem Rückbau noch wie ein Platzhalter aus und bleibt so stehen | „Nachname AS“ sieht nach dem Rückbau noch wie ein Platzhalter aus und bleibt so stehen.Zei | „Vorname B9“ sieht nach dem Rückbau noch wie ein Platzhalter aus und bleibt so stehen.Zeil | „[E-MAIL-99]“ sieht nach dem Rückbau noch wie ein Platzhalter aus und bleibt so stehen.Zei)
- OK: txt, beschädigt: jeder der 4 Reste als rote Zeile mit Fundstelle; „Weiter“ gesperrt bis zur Bestätigung, danach frei – gefunden: Einrichtung A2S, Nachname AS, Vorname B9, [E-MAIL-99]
- OK: txt, beschädigt, ohne Bestätigung: Speichern nicht erreichbar
- OK: docx, unbeschädigt: keine Meldung, nicht gesperrt
- docx, beschädigt: rote Zeilen 4 („Einrichtung A2S“ sieht nach dem Rückbau noch wie ein Platzhalter aus und bleibt so stehen | „Nachname AS“ sieht nach dem Rückbau noch wie ein Platzhalter aus und bleibt so stehen.Tex | „Vorname B9“ sieht nach dem Rückbau noch wie ein Platzhalter aus und bleibt so stehen.Text | „[E-MAIL-99]“ sieht nach dem Rückbau noch wie ein Platzhalter aus und bleibt so stehen.Tex)
  - zusätzlich beim Speichern (ganze Datei): Nachname ZZ9 – Dateieigenschaften: „…Nachname ZZ9…“
- OK: docx, beschädigt: jeder der 4 Reste als rote Zeile mit Fundstelle; „Weiter“ gesperrt bis zur Bestätigung, danach frei – gefunden: Einrichtung A2S, Nachname AS, Vorname B9, [E-MAIL-99]
- OK: docx: Rest außerhalb der Abschnitte (Titel „Nachname ZZ9“) wird beim Speichern gemeldet und sperrt bis zur Bestätigung
- OK: docx, beschädigt, ohne Bestätigung: Speichern nicht erreichbar

## 4. Gegenprobe: Originaltext mit Wörtern wie „Person A“ oder „Einrichtung B“ (rückbaufähig, Kreislauf)
- vorher: Rückbau exakt NEIN; gemeldete Reste 0; beim Speichern zusätzlich 0
- nachher: Rückbau exakt ja; gemeldete Reste 0; beim Speichern zusätzlich 0
  - Alle gemeldeten Stellen stehen so im Original (kein Name, kein beschädigter Platzhalter): Fehlalarme, nicht abgeschwächt (MINI-STOPP).
- OK: Gegenprobe: Kreislauf trotzdem exakt (nach Bestätigung)

## 5. Bisherige Testdokumente: Reste nach dem Rückbau (Modus rückbaufähig, Kreislauf am Kern mit den echten Abschnitten)
- 80 Dokumente, davon mit gemeldeten Resten: 0

## 6. Prüfung: Weitere Formen, bei denen Platzhalter + Folgezeichen wie ein anderer Platzhalter aussieht
- rückbaufähig, alle kleinen Endungen hinter allen Platzhalterformen (auch nummeriert): falsch gelesen 0
- „Person A“/„Einrichtung A“ + kleine Endung: Platzhalter haben nur Großbuchstaben, eine kleine Endung kann keinen anderen Platzhalter bilden.
- GEFUNDEN (nicht gebaut): Ziffer direkt hinter dem Namen, „Frau Helga Müller kommt. Müller2 ist ihr Kürzel.“, Modus person: „Frau Person A kommt. Person A2 ist ihr Kürzel.“
- GEFUNDEN (nicht gebaut): Ziffer direkt hinter dem Namen, „Frau Helga Müller kommt. Müller2 ist ihr Kürzel.“, Modus reversible: „Frau Vorname A Nachname A kommt. Nachname A2 ist ihr Kürzel.“; Rückbau „Frau Helga Müller kommt. Müller2 ist ihr Kürzel.“ (exakt: ja); Sicherheitsnetz meldet: nichts

## 7. Doppellauf
- OK: einrichtung-gross.docx: zwei Läufe byte-gleich
- OK: einrichtung-gross.xlsx: zwei Läufe byte-gleich
- OK: verwechslung.txt: zwei Läufe byte-gleich

Prüfungen: 24 von 24 bestanden.
Netzwerkanfragen außer lokalen Dateien: 0.
