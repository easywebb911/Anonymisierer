# Anonymisierer

Ein Werkzeug, das **Klarnamen** in Texten und Dokumenten durch Pseudonyme ersetzt („Person A“, „Person B“ … oder „[NAME]“).
Im Modus **rückbaufähig** kann eine anonymisierte und danach bearbeitete Datei später wieder mit den Klarnamen versehen werden (**Rückbau**).
Es ist **eine einzige Datei: `index.html`**. Sie läuft komplett im Browser und **sendet nichts ins Internet**.

> **Wichtig:** Das Tool findet nie alle Namen. **Die Prüfung in Schritt 2 gehört immer dazu.**
> Lies das Ergebnis immer selbst durch, bevor du es weitergibst.

---

## Bedienung in einfacher Sprache (seit Version 2.5: kompakt)

Das Tool zeigt immer **nur einen Bildschirm**. Oben steht, in welchem Schritt du bist (Haken = erledigt), rechts „Offline“. Unten links ist **„← Zurück“** (nichts geht dabei verloren), unten rechts der **eine Hauptknopf** für den nächsten Schritt. Schrift und Abstände sind seit Version 2.5 kleiner: Start, Datei und Speichern passen bei 1366×768 ohne Scrollen auf den Bildschirm (Speichern bis fünf offene Punkte).

**Start: „Was möchtest du tun?“**
- **Dokument anonymisieren:** Namen durch Platzhalter ersetzen, bevor die Datei an eine KI geht.
- **Dokument zurückbauen:** echte Namen wieder einsetzen (siehe unten „Rückbau“).

### Anonymisieren in drei Schritten

**1. Datei**
- Beantworte die Frage **„Brauchst du die Datei später wieder mit echten Namen?“**:
  - **„Ja, ich baue sie später zurück“**: Modus „rückbaufähig“. Du bekommst zusätzlich eine Schlüsseldatei.
  - **„Nein, anonym reicht“**: Platzhalter „Person A“. Ein Rückbau ist dann nicht möglich.
  - Es ist nichts vorausgewählt. „Weiter“ geht erst, wenn du geantwortet und eine Datei oder einen Text geladen hast.
- Datei in das Feld ziehen oder **„Datei auswählen“**. Fehler (z. B. gescanntes PDF) stehen direkt am Feld.
- **„Stattdessen Text einfügen“** klappt ein Textfeld auf.
- Eine Zeile zeigt den **Stand deiner Liste „Eigene Namen“**, z. B. „Eigene Namen: 1 Einrichtung, 3 Personen“ oder „Eigene Namen: keine“. So siehst du sofort, ob die Liste nach dem Neuladen leer ist.
- Der Knopf **„Einstellungen und eigene Namen“** klappt auf: eigene Namen und Ausnahmen, Speichern der Liste (Datei oder Browser), Kontaktdaten an/aus, unsichere Treffer, Platzhalter „[NAME]“.
  - Fügst du einen Eintrag hinzu, solange die Liste nicht im Browser gespeichert wird, steht direkt am Feld: **„Diese Liste gilt nur, bis du die Seite schließt oder neu lädst.“** mit dem Knopf **„Dauerhaft in diesem Browser speichern“**. Standard bleibt: nicht speichern.

**2. Prüfen: „Namen prüfen“**
- **Gelb wird ersetzt. Klick auf ein Wort schaltet es um.** Drei Markierungen im Text (seit Version 2.6.1):
  - **blassgelbe Fläche** = wird ersetzt (Personen, Einrichtungen, Kontaktdaten und eigene Namen gleich),
  - **dünner gestrichelter Rand** = hier ist eine Frage offen (mit blasser Fläche, wenn die Stelle im Moment ersetzt wird),
  - **kräftig gelb, dicker brauner Rand, fett** = die Stelle(n) der Frage, die gerade in der Fragekarte steht. Auch das Wort im Satz-Ausschnitt der Karte sieht so aus. Bei Fragen zu den Dateiangaben und ohne gezeigte Frage ist nichts kräftig markiert.
  - Ausgeschaltete Stellen sind nicht markiert. Wer es ist und was passiert, steht beim Überfahren mit der Maus und in der Liste (bei der gerade gefragten Stelle mit „aktuelle Frage“).
- **Zur Stelle rollen (seit 2.6.1):** Wird eine andere Frage gezeigt, rollt die Ansicht zur ersten Stelle dieser Frage, etwa in die Mitte (in breiten Tabellen auch seitlich; bei Excel wechselt erst der Blatt-Reiter). Ist die Stelle schon ganz zu sehen, wird nicht gerollt. Ein Klick auf eine Markierung oder das Umschalten einer Spalte rollt nicht.
- **Excel und CSV** erscheinen als echte Tabelle mit Spaltenbuchstaben und Zeilennummern; lange Texte brechen um, sonst scrollt die Tabelle seitlich. Jedes Excel-Blatt hat einen Reiter, ausgeblendete mit „(ausgeblendet)“. Kommentare, Kopf-/Fußzeilen, Blattnamen und Bildbeschreibungen stehen darunter als eigene, benannte Zeilen („Kommentar zu Zelle C7“, „Kopfzeile, Blatt Liste“, „Bildbeschreibung“). Word-Tabellen erscheinen ebenfalls als Tabelle.
- Einen **nicht erkannten Namen** antippen oder markieren: Direkt daneben erscheinen **„Als Name markieren“** und **„Als Einrichtung markieren“**. Danach wird er **überall** ersetzt, auch mit Endung („Müllers“) und in GROSSSCHREIBUNG („MÜLLER“).
- **Fragekarte** rechts („Frage 2 von 5“, Tasten **J** und **N**):
  - **Vorige und nächste Frage (seit 2.6.1):** Oben rechts in der Karte stehen **←** („Vorige Frage“, Taste Pfeil links) und **→** („Nächste Frage“, Taste Pfeil rechts, nur wenn die Frage schon beantwortet ist). So kannst du eine Antwort **nachträglich ändern**. Die Karte zeigt dann „Bisherige Antwort: Ja/Nein“. Das Ergebnis ist genau so, als hättest du gleich richtig geantwortet: Was die alte Antwort verändert hat, wird zurückgenommen (von Hand umgeschaltete Stellen bleiben, wie du sie gestellt hast), und Fragen, die es mit der neuen Antwort nicht mehr gibt, verlieren ihre Antwort. Dieselbe Antwort noch einmal ändert nichts.
  - Nach einer Antwort kommt die erste noch offene Frage; gibt es keine, die nächste in der Reihenfolge, am Ende „Alle Fragen beantwortet“ (auch dort mit ←).
  - **Einstellung geändert** (auf „Datei“, z. B. „Unsichere Treffer standardmäßig ersetzen“ oder ein Kontakt-Schalter): Alle Antworten und Umschaltungen werden verworfen, der Stand ist wie frisch berechnet. Die Listen bleiben. Die Karte sagt einmal: „Du hast eine Einstellung geändert. Die Fragen sind wieder offen.“
  - **Liste geändert** („Eigene Namen“, Einrichtungen, Ausnahmen): Antworten bleiben gültig. Entfernst du einen Namen, der durch „Ja“ bei einer Frage zu den Dateiangaben in die Liste kam, gilt diese Antwort als „Nein“. Fällt eine Frage durch die Änderung weg, wird ihre Antwort verworfen.
  - **Frage zum Wort**: „Ist „Winter“ ein Name?“ für unsichere Wörter ohne klaren Zusammenhang. **„Ja, Name“ schaltet nur die Stellen an, die nicht im Sachkontext stehen.** „Nein“ schaltet alle unsicheren Stellen des Worts aus.
  - **Frage je Stelle** (seit 2.5) bei Wörtern, die auch gewöhnliche Wörter sind (Liste „mehrdeutig“, z. B. Winter, Rose), wenn die Person im Dokument sicher erkannt oder bestätigt ist:
    - direkt nach Artikel oder Präposition („im Winter“, „die Rosen“): bleibt wie bisher aus;
    - gebeugte Form („Rosen“ bei Person Rose, „WINTERS“): bleibt wie bisher ersetzt.
    - Die Karte zeigt den Satz mit der Stelle, darunter „Ist hier die Person Winter gemeint?“ und den heutigen Zustand („Wird im Moment ersetzt.“ bzw. „Bleibt im Moment stehen.“). **Ohne Antwort bleibt alles, wie es ist.** „Nein“ schaltet die Stelle aus, „Ja, ersetzen“ an.
  - **GROSS-Form mit Endung eines von Hand übernommenen Namens** („TANNHÄUSERS“ bei übernommenem „Tannhäuser“): ebenfalls Frage je Stelle; ohne Antwort bleibt sie stehen.
  - **Keine Frage** mehr für Wochentage und Monate allein („Montag“, „Do.“) und für Wochentag vor Uhrzeit („Do 13:30“). Sie bleiben stehen; ein Klick schaltet sie wie jedes Wort um.
  - Namen aus den **Dateiangaben** (Autor, Firma …): „Als Namen übernehmen?“ bzw. „Als Einrichtung übernehmen?“ wie bisher.
- Darunter: „19 Personen, 1 Einrichtung“ mit **„Liste zeigen“**. Die Liste klappt an Ort und Stelle auf: je Eintrag Schalter, Name, Zahl und „⋯“ (Schreibweisen, zusammenführen, nie anonymisieren, für nächstes Mal merken, Art umstellen). Einrichtungen stehen als eigene Gruppe.

**3. Speichern**
- Oben ein Satz, z. B. „16 Personen und 1 Einrichtung sind ersetzt. Zwei Punkte bitte noch ansehen:“.
- Darunter **eine Fläche mit je einer Zeile pro offenem Punkt**, jeweils mit einem Knopf rechts:
  - offene Fragen („Beantworten“),
  - jeder Fund des Schlusschecks („Ersetzen“, „Als Namen übernehmen“ bzw. „Als Einrichtung übernehmen“, bei Einrichtungen „Im Text zeigen“) mit Fundort in einfacher Sprache („Blatt Teilnehmer, Zelle I6“, „Kopfzeile“, „Kommentar zu Zelle C7“, „Bildbeschreibung“) und dem sichtbaren Text der Stelle,
  - Bilder („Ansehen“),
  - Hinweise zur Datei, die eine Entscheidung brauchen (z. B. eingebettete Objekte werden geleert: Der Inhalt fehlt in der Ausgabe und auch nach dem Rückbau; Pivot-Tabellen; Bildtypen ohne Bereinigung).
- **EIN Häkchen**: „Ich habe alle Punkte gesehen und speichere so.“ Es ersetzt die früheren Einzel-Häkchen. Mit Bildern ist es erst wählbar, wenn du die Bilderliste geöffnet hast. Es **fällt zurück**, sobald sich an Treffern, Antworten oder Punkten etwas ändert. Ohne offene Punkte gibt es kein Häkchen.
- Eine Zeile mit den Dateinamen („… bleibt auf diesem PC“, „… geht an die KI“) und den Knöpfen **„1 Schlüssel speichern“**, **„2 Datei speichern“** (rückbaufähig; der zweite geht erst nach dem ersten) bzw. nur **„Datei speichern“**.
- „Lade die Datei danach direkt hoch, ohne sie vorher in Word bzw. Excel zu öffnen.“ mit **„Hinweis für die KI kopieren“**.
- **„Details und andere Formate“** klappt auf: alles, was in Ordnung ist oder das Tool erledigt hat (versteckte Angaben, ausgeblendete Blätter, Wörter wie Platzhalter, Schlusscheck ohne Fund …), die anderen Speicherwege (Text kopieren, .txt, .docx) und die Zuordnungstabelle. Für alle Wege gelten dieselben Sperren.
- Nach dem Speichern: **„Nächstes Dokument“** verwirft alles Geladene; Liste und Einstellungen bleiben.

### Bilder und Bildbeschreibungen (seit Version 2.2)
**Bilder werden nie verändert und nie entfernt.** Das Tool kann nicht lesen, was auf einem Bild steht. Deshalb zeigt es dir vor dem Speichern jedes Bild, damit du selbst nachsehen kannst.
- **„Bilder ansehen“** öffnet auf derselben Seite eine Liste. Je Bild siehst du:
  - eine kleine Vorschau (mit „Größer anzeigen“, z. B. um einen Namen auf einem Scan zu lesen),
  - den Fundort in einfacher Sprache: „im Text bei „…““, „Tabelle“, „Kopfzeile“, „Fußzeile“, in Excel der Blattname mit Zelle oder „Kopf-/Fußzeile“,
  - den Bildtyp (z. B. PNG, JPEG),
  - die Beschreibung des Bildes (Alt-Text und Titel), falls vorhanden.
- Manche Bildtypen kann der Browser nicht zeigen (z. B. **EMF, WMF, TIFF**). Dann steht dort eine graue Kachel: „Kann hier nicht angezeigt werden. Bitte in Word (Excel) ansehen.“
- **Verknüpfte Bilder** liegen gar nicht in der Datei, sondern woanders (z. B. auf einem Netzlaufwerk). Sie haben eine eigene Kachel „verknüpft, nicht in der Datei“. Das Tool lädt sie **nie** nach.
- **SVG-Grafiken** werden nur als Bild gezeigt, nie als Programmcode in die Seite eingebaut.
- **Steht auf einem Bild ein Name oder ein Logo:** Entferne das Bild vorher in Word bzw. Excel und lade die Datei neu.
- Die Vorschauen liegen **nur im Arbeitsspeicher** und werden bei „Nächstes Dokument“ verworfen. Es wird nichts gesendet.

**Bildbeschreibungen** (Alt-Text und Titel von Bildern und Formen, in Word und Excel) werden wie Text behandelt:
- Sie stehen im Schritt „Prüfen“ als eigene Abschnitte, gekennzeichnet als **„Bildbeschreibung“**.
- Namen darin werden erkannt, lassen sich wie im Text markieren und werden beim Speichern ersetzt, **auch wenn der Name sonst nirgends im Text steht**.
- Der Rückbau setzt sie exakt zurück.

### Einrichtungen (seit Version 2.3)
Schulen, Vereine, Firmen und Behörden bekommen einen **eigenen Platzhalter**, damit eine KI sie nicht für eine Person hält.
- **Das Tool sucht Einrichtungen nicht selbst.** Eine Einrichtung entsteht nur so:
  - **von Hand:** die Bezeichnung markieren und **„Als Einrichtung markieren“** wählen (z. B. „Familienzentrum Sonnenblume“),
  - **aus den Dateiangaben:** Steht in Word/Excel eine Firma, fragt das Tool: „In den Dateiangaben steht „…“. Als Einrichtung übernehmen?“ (Autor, Bearbeiter und Manager bleiben Personen-Fragen),
  - **aus der Merkliste „Eigene Namen“:** Beim Hinzufügen wählst du die Art, Person oder Einrichtung.
- **Umstellen:** Im Menü hinter den drei Punkten steht „ist eine Einrichtung“ bzw. „ist eine Person“.
- **Platzhalter:**
  - Modus „Person A“: „Einrichtung A“, „Einrichtung B“ … (eigene Buchstaben, getrennt von den Personen),
  - Modus „[NAME]“: „[EINRICHTUNG]“,
  - Modus „rückbaufähig“: der **ganze Name** wird **ein** Platzhalter „Einrichtung A“. Jede andere Schreibweise derselben Einrichtung bekommt eine Nummer: „des Familienzentrums Sonnenblume“ wird „des Einrichtung A2“, „FAMILIENZENTRUM SONNENBLUME“ wird „Einrichtung A3“. So ist der Rückbau an jeder Stelle exakt. Eine Endung am Schluss bleibt wie bei Personen stehen („des Einrichtung Bs“).
- **Abkürzungen** („FZS“) erkennt das Tool nicht von selbst. Markiere sie ebenfalls als Einrichtung und führe sie im Menü („zusammenführen mit …“) mit der Einrichtung zusammen.
- Ein mehrteiliger Name wird **immer als Ganzes** ersetzt, nie Wort für Wort, auch in Kopf-/Fußzeilen, Bildbeschreibungen und Blattnamen.
- **Vorrang:** Steckt ein Personenname in der Einrichtung („Astrid-Lindgren-Schule“), wird die ganze Einrichtung ein Platzhalter; „Astrid Lindgren“ an anderer Stelle bleibt eine Person.
- Im Schritt „Prüfen“ stehen Einrichtungen in der Liste als eigene Gruppe **„Einrichtungen“**. Im Text sind sie seit 2.5 wie jede ersetzte Stelle gelb markiert; beim Überfahren steht „Einrichtung“ und der Platzhalter.
- Der Speichern-Bildschirm meldet z. B. „6 Personen und 1 Einrichtung sind ersetzt.“ Der „Hinweis für die KI“ nennt auch „Einrichtung A“.

### Namensspalten in Tabellen (seit Version 2.6)
In Excel, CSV und Word-Tabellen schaut das Tool auf die **Überschrift einer Spalte**. Steht dort ein Namenswort, gilt jede **reine Namenszelle** darunter als Name, auch wenn der Name in keiner Liste steht (z. B. „Brzęczek“ unter „Nachname“, „Dimitrios“ unter „Vorname“).
- **Kopfzeile:** die erste Zeile, in der mindestens die Hälfte der Spalten gefüllt ist (Titelzeilen darüber zählen nicht). Sie muss wie eine Kopfzeile aussehen (mindestens ein üblicher Spaltenkopf wie „Name“, „Kurs“, „E-Mail“). Folgt direkt eine zweite Zeile nur aus Spaltenköpfen mit einem Namenswort („Nachname | Vorname“ unter „Teilnehmer“), zählt sie mit. Verbundene Zellen in der Kopfzeile gelten für alle Spalten darunter.
- **Starke Kopfwörter:** Name, Namen, Nachname, Vorname, Familienname, Rufname, Geburtsname. Jede reine Namenszelle darunter ist **„sicher“** ein Name, auch „Koch“, „Winter“ oder „Mai“ (die Spalte hat Vorrang vor „mehrdeutig“ und vor der Regel für Wochentage und Monate).
- **Schwache Kopfwörter:** Lehrkraft, Lehrer/in, Kursleitung, Kursleiter/in, Leitung, Teilnehmer/in, Teilnehmende, Kind, Kinder, Schüler/in, Mitarbeiter/in, Ansprechpartner/in, Person, Eltern, Erziehungsberechtigte, Trainer/in, Referent/in, Dozent/in, Betreuer/in, Bearbeiter/in, verantwortlich. Eine reine Namenszelle darunter ist **„sicher“**, wenn ein Wort in einer Namensliste steht, wenn es zwei Namenswörter sind oder eine Anrede/ein Titel davor steht („Dr. Haberkorn“). Sonst **„unsicher, an“** (ersetzt und als Frage).
- **Nur ganze Kopfwörter zählen:** „Dateiname“, „Benutzername“, „Kursname“, „Firmenname“ oder „Name der Schule“ machen **keine** Namensspalte.
- **Reine Namenszelle:** 1 bis 4 großgeschriebene Wörter oder Namenszusätze („von der Heide“), davor darf eine Anrede stehen. Keine Ziffern, kein Satz. „Koch, Sabine“ in einer Zelle ist eine Person (Nachname, Vorname).
- **Nie ein Name:** leere Zellen, die Kopfzeile selbst und übliche Füllwerte: N.N., NN, offen, vakant, alle, siehe oben, s. o., dito, do., frei, keine, keiner, niemand, unbekannt, folgt, entfällt, tbd, tba, k. A., x, Striche („-“, „–“, „—“), „?“, „…“.
- **Eine Person je Zeile:** Vorname (Spalte „Vorname“/„Rufname“) und Nachname (Spalte „Nachname“/„Familienname“/„Geburtsname“) in derselben Zeile sind **eine** Person: ein Buchstabe („Person F“), im Modus „rückbaufähig“ „Vorname F“ und „Nachname F“. Kommt dieselbe Person woanders im Dokument vor („Frau Koch“), bekommt sie denselben Buchstaben.
- **Spalte von Hand:** Im Schritt „Prüfen“ steht an jeder Spaltenüberschrift der Tabelle ein Schalter **„Namen“** (bei Word-Tabellen „Spalte 1“, „Spalte 2“ …). Eine erkannte Namensspalte ist angehakt und farbig. Anhaken wirkt wie ein starkes Kopfwort (auch bei Tabellen ohne Kopfzeile: dann alle Zeilen); Abhaken schaltet die Regel für diese Spalte aus. Das gilt als Änderung der Treffer: Das Häkchen beim Speichern muss neu gesetzt werden, und wurde schon eine Schlüsseldatei gespeichert, gibt es eine neue Kennung.
- **Anrede in der Nachbarzelle (Excel):** Steht in einer Zelle nur „Frau“ oder „Herr“, gilt die rechte Nachbarzelle wie in Word und CSV als Name (Regel „Anrede allein“). Ist die Spalte eine Namensspalte, gilt die Namensspalte.

### Webadressen und Konten (seit Version 2.7)
Zwei neue Arten wie E-Mail und Telefon. Schalter **„Webadressen und Konten“** bei den anderen Kontakt-Schaltern, Standard: an.
- **Webadresse:** alles mit `http://`, `https://` oder `www.` am Anfang, und Adressen ohne `www` mit einer bekannten Endung, z. B. `kita-sonne.de/kontakt`. Der Pfad gehört dazu. Platzhalter: **[WEBADRESSE]**, im Modus „rückbaufähig“ **[WEBADRESSE-1]**, [WEBADRESSE-2] … (gleiche Adresse = gleiche Nummer).
  - Bekannte Endungen (Liste im Code, `src/core/patterns.js`): de, com, org, net, eu, info, at, ch, li, lu, nl, fr, pl, cz, dk, se, fi, uk, us, gr, pt, ie, tr, ru, biz, edu, gov, int, tv, io, app, online, shop, site, website, blog, news, digital, cloud, email, family, social, bayern, berlin, koeln, hamburg, nrw, ruhr, saarland, schule, wien, bzh, swiss, gmbh, kaufen, jetzt.
  - **Keine Webadresse:** Dateinamen („bericht.docx“, „liste.xlsx“), Abkürzungen („z.B.“, „u.a.“), Zahlen und Uhrzeiten („13.20“). Der Teil hinter dem @ einer E-Mail-Adresse bleibt E-Mail.
- **Konto:** der Kontoname nach Instagram, Facebook, TikTok, YouTube, LinkedIn, X, Twitter, Threads, Mastodon, Telegram, Snapchat oder WhatsApp-Kanal mit Doppelpunkt oder @ („Instagram: kita_sonne“, „TikTok @kita.sonne“), und ein allein stehendes @name. Nur der Kontoname wird ersetzt, das Wort „Instagram“ bleibt. Platzhalter: **[KONTO]**, rückbaufähig **[KONTO-1]** …
- **Verknüpfungen in Word und Excel:** Eine ersetzte Webadresse steht auch nicht mehr im Ziel der Verknüpfung, in der Feldfunktion HYPERLINK oder im Link-Hinweis (Tooltip). Im Modus „rückbaufähig“ bekommt auch ein Ziel, das nur in der Verknüpfung steht (z. B. mit Pfad), eine eigene Nummer; es steht mit Anzahl 0 in der Schlüsseldatei, und der Rückbau setzt das Ziel exakt wieder ein.
- Der „Hinweis für die KI“ nennt die neuen Platzhalter mit.

### Sperre beim Speichern und Warnpunkt (seit Version 2.7)
Neue Punkte auf „Speichern“. Sie laufen über das **eine Häkchen** wie alle Punkte und verschwinden, sobald ihr Grund weg ist.
- **Es wird gar nichts ersetzt:** „In dieser Datei wird nichts ersetzt. Bitte prüfe Schulname, Firma, Webadresse und Konto und markiere sie von Hand.“
- **Webadresse oder Konto steht noch im Text** (nur wenn der Schalter „Webadressen und Konten“ aus ist): jede Stelle mit Fundort und „Im Text zeigen“; „Ersetzen“ schaltet den Schalter ein.
- **Warnpunkt „Hier könnte eine Einrichtung stehen.“** Das Tool ersetzt Einrichtungen noch nicht selbst. Es zeigt aber Stellen, die so aussehen:
  - ein Kopfwort (Gymnasium, Schule und Wörter auf -schule, Universität, Kita, Kindergarten, Krippe, Hort, Kinderhaus, Familienzentrum, Jugendzentrum, Verein, Stiftung, Praxis, Klinik, Krankenhaus, Kanzlei, Firma, Institut, Akademie, auch mit Endung) direkt vor einem großgeschriebenen Wort („Gymnasium Tannhofen“), oder ein Wort mit Bindestrich davor („Tannhofen-Gymnasium“);
  - ein großgeschriebenes Wort vor einer Rechtsform (GmbH, gGmbH, AG, KG, UG, GbR, eG, e. V., e.V., mbH);
  - zwei bis sechs Wörter in Anführungszeichen, das erste großgeschrieben („Brandner lern und spiel“).
  
  Es sind höchstens zehn Stellen aufgeführt, dann „und n weitere“, jede mit Fundort und „Im Text zeigen“. Der Punkt **warnt nur**: Er ersetzt nichts, stellt keine Frage und ändert keine Ausgabe. Eine Stelle fällt weg, sobald sie ersetzt ist (von Hand als Einrichtung oder Name markiert). Auch Sachwörter können auftauchen („Ganztagsschule Schuljahr“, „Gesunde Pause“); dann einfach weiter.

### Eigene Namen und Ausnahmen (unter „Einstellungen und eigene Namen“)
- **Eigene Namen (Merkliste):** Namen, die das Tool nicht kennt. Sie werden bei jedem weiteren Dokument automatisch mit ersetzt. Auch „Als Name markieren“, „Als Einrichtung markieren“ und „für nächstes Mal merken“ tragen dort ein.
  - Jeder Eintrag hat eine **Art** (Person oder Einrichtung), beim Hinzufügen wählbar. Datei und Browser-Speicher merken die Art. Ältere Merklisten (ohne Art) laden wie bisher als Personen.
  - **Achtung: Die Liste enthält echte Namen.**
  - Sie bleibt auch nach „Nächstes Dokument“ bestehen, und zwar so lange, bis du den Tab (bzw. den Browser) schließt oder sie löschst („Merkliste löschen“ oder einzelne Namen mit „×“ entfernen).
  - Nur wenn du den Schalter „im Browser speichern“ einschaltest, bleibt sie auch nach dem Schließen erhalten, bis du sie löschst.
- **Ausnahmen:** Wörter, die nie ersetzt werden sollen (z. B. ein Firmenname).
- **Gespeichert wird nur auf ausdrücklichen Wunsch:** als Datei („Merkliste als Datei speichern“) oder im Browser (Schalter, **Standard: aus**). Die Liste **enthält echte Namen**. „Merkliste löschen“ entfernt alles, auch aus dem Browser.

### Einstellungen (unter „Einstellungen und eigene Namen“)
- Zusätzlich ersetzen (einzeln schaltbar, Standard: an): E-Mail, Telefon, IBAN (mit Prüfziffer), Adresse/PLZ, seit 2.7 **Webadressen und Konten**. Wie jede Einstellung verwirft ein Umschalten alle Antworten (Regel seit 2.6.1).
- „Unsichere Treffer standardmäßig ersetzen“ (Standard: an). Ausnahme: Wörter wie „die Rose“, „im Winter“, „mit voller Kraft“ (Artikel oder Präposition davor) bleiben aus, sind aber markiert.
- „[NAME]“ statt „Person A, Person B …“ (kein Rückbau möglich).

---

## Rückbau: Klarnamen wieder einsetzen (Modus „rückbaufähig“)

**Wofür?** Sie lassen eine Datei anonymisieren, geben sie z. B. einer KI zur Prüfung, arbeiten deren Hinweise ein und brauchen danach wieder die Fassung mit den echten Namen.

**So sieht der Text im Modus „rückbaufähig“ aus** (Beispiel):

> Frau Nachname A leitet. Nachname As Bericht liegt vor. Nachname A2 unterschrieb. Initiale B. Nachname B kam später.
> Vorname C Nachname C ist erreichbar unter [E-MAIL-1] und [TELEFON-1].

- Jeder Namensteil hat einen eigenen Platzhalter: „Vorname A“, „Nachname A“, „Initiale A“. Ein Wort, dessen Rolle unklar ist, heißt „Name A“.
- Jede Schreibweise hat genau einen Platzhalter. Eine weitere Schreibweise derselben Person bekommt eine Nummer: „MÜLLER“ wird „Nachname A2“, „Müller“ bleibt „Nachname A“.
- Endungen und Anreden bleiben im Text stehen („Herrn Nachname As“) und kommen beim Rückbau genauso zurück („Herrn Müllers“).
- Eine **große Endung** in GROSSSCHREIBUNG („MÜLLERS“, „DES LINDENAUER BÜRGERVEREINS“) gehört zum Platzhalter selbst und bekommt eine eigene Nummer (z. B. „Nachname A3“ = „MÜLLERS“; bei Einrichtungen ebenso „Einrichtung A“ mit Nummer). Für Personen seit 2.3.2, für Einrichtungen seit 2.3.3. So kommt sie beim Rückbau exakt zurück und sieht nie wie ein anderer Platzhalter aus („Nachname AS“).
- Kontaktdaten werden nummeriert: [E-MAIL-1], [TELEFON-2], [IBAN-1], [ADRESSE-1], seit 2.7 [WEBADRESSE-1] und [KONTO-1]. Gleicher Wert bekommt die gleiche Nummer. Locker umgeschriebene Formen („[Webadresse 1]“, „Konto-1“) erkennt der Rückbau und meldet sie mit „gemeint vermutlich …“; er rät aber nicht (wie bei allen Platzhaltern). Ältere Schlüsseldateien (ohne Webadressen und Konten) bauen genau wie bisher zurück; das Format der Schlüsseldatei bleibt gleich.
- **Ziffern direkt hinter einem Namen** („Müller2“, „Yılmaz12“, seit 2.3.4) gehören zum Platzhalter und bekommen eine eigene Nummer („Nachname A2“ = „Müller2“). Vorher stand „Nachname A“ + „2“ im Text. Das sah aus wie die Schreibweise „Nachname A2“, und der Rückbau konnte still die falsche Schreibweise einsetzen. Allgemein gilt im Modus „rückbaufähig“: Direkt hinter einem Platzhalter steht nie ein Buchstabe oder eine Ziffer, die ihn wie einen anderen aussehen lässt.
- **Wörter im Original, die wie Platzhalter aussehen** („Nachname A“, „Person A“, „Einrichtung A“, „[NAME]“, „[E-MAIL-1]“ …, seit 2.3.4): Das Tool vergibt diese Platzhalter nicht. Es nimmt die nächste freie Nummer („Nachname A2“) bzw. im Modus „Person A“ den nächsten freien Buchstaben („Person B“). Die Wörter bleiben im Text stehen und werden mit Anzahl in der Schlüsseldatei vermerkt (Zusatzfeld „imOriginal“, Format-Version unverändert). Beim Rückbau bleiben sie unberührt und erscheinen als neutrale Zeile „stand schon im Original (n×)“ unter „Details“, bei abweichender Anzahl als offener Punkt.
- Einrichtungen (seit 2.3): „Einrichtung A“ für den ganzen Namen, weitere Schreibweisen „Einrichtung A2“ … Sie stehen als eigene Art in der Schlüsseldatei. Schlüsseldateien aus früheren Versionen funktionieren unverändert.
- Eine Schlüsseldatei **mit** Einrichtung hat die Format-Version 2. Ältere Versionen des Tools (2.2) lehnen sie klar ab („Unbekannte Version der Schlüsseldatei (2) …“). Schlüsseldateien **ohne** Einrichtung bleiben Version 1 und funktionieren auch mit 2.2.

**Kennung (seit Version 2.1)**
- Jede rückbaufähige Anonymisierung bekommt eine **Kennung** aus 4 Zeichen, z. B. **K7F3**. Die Dateien heißen dann `anonymisiert_K7F3.docx` und `schluessel_K7F3.json`. So siehst du sofort, was zusammengehört.
- In Word- und Excel-Dateien steht die Kennung zusätzlich **unsichtbar in den Dateieigenschaften**. Sie bleibt also auch erhalten, wenn du die Datei umbenennst (in LibreOffice auch nach Bearbeiten und Speichern geprüft).
- **Jede Anonymisierung bekommt eine neue Kennung**, auch wenn du dieselbe Datei noch einmal lädst oder nach dem Schlüssel noch einen Treffer änderst. Warum? Zwei verschiedene Schlüssel dürfen nie dieselbe Kennung haben. Nur so erkennt der Rückbau einen **vertauschten** oder einen **veralteten** Schlüssel sicher, auch bei Dokumenten nach derselben Vorlage.
- Die Kennung ist **reiner Zufall**. Nichts aus dem Dokument geht ein (kein Text, kein Name, kein Dateiname, keine Uhrzeit). Aus der Kennung lässt sich also nichts über den Inhalt ableiten.
- Beim Rückbau zur **Kennung**:
  - passt sie, steht „Kennung K7F3 passt“ unter „Details“;
  - als offener Punkt (seit 2.5 mit dem einen Häkchen): „Diese Schlüsseldatei gehört zu einem anderen Dokument“ (rot), „Im Dokument steht keine Kennung“ (z. B. umbenannte Textdatei, eingefügter Text) und „Schlüssel ohne Kennung“ (Schlüssel von vor Version 2.1);
  - widersprechen sich Eigenschaft und Dateiname, gilt die Eigenschaft; der Widerspruch wird angezeigt.
- **Grenzen:** Bei **eingefügtem Text** und bei **umbenannten .txt/.csv-Dateien** steht die Kennung nirgends im Dokument; dann kann das Tool einen Vertausch nicht erkennen und fragt nur nach. Alte Schlüssel (vor 2.1) haben keine Kennung. Die Kennung schützt vor Verwechslung, nicht vor Absicht.

**Ablauf**
1. Anonymisieren mit der Antwort **„Ja, ich baue sie später zurück“**. Im Schritt „Speichern“ erst **„1 Schlüssel speichern“**, dann **„2 Datei speichern“**. **Ohne die Schlüsseldatei ist kein Rückbau möglich.**
2. Die anonymisierte Datei bearbeiten oder prüfen lassen. Platzhalter dabei möglichst **unverändert** lassen („Hinweis für die KI kopieren“ hilft).
3. Start → **„Dokument zurückbauen“**. Schritt **„Dateien“**: links die bearbeitete Datei (.txt, .docx, .xlsx, .csv oder eingefügter Text), rechts die Schlüsseldatei. Probleme (z. B. alte CSV-Zuordnung statt Schlüsseldatei) stehen direkt am Feld. „Weiter“ geht erst mit beiden Dateien.
4. Schritt **„Rückbau prüfen“**: oben ein Satz („Alles passt.“ oder „Zwei Punkte bitte ansehen:“), darunter nur die Auffälligkeiten als Zeilen; die vollständige Tabelle steht hinter **„Details“**. Alle Punkte bestätigst du mit **einem** Häkchen („Ich habe alle Punkte gesehen und baue so zurück.“).
   - Je Platzhalter steht, wie oft er erwartet und gefunden wurde.
   - Auffällige Stellen werden mit Fundstelle gezeigt: veränderte („nachname a“), gebeugte („des Nachnamens A“), getrennte (Zeilenumbruch) und unbekannte Platzhalter. Sie werden **nicht** geraten, sondern bleiben stehen.
   - **Platzhalter-Reste (seit 2.3.3):** Das Tool baut das Ergebnis probeweise zurück und sucht darin alles, was danach noch wie ein Platzhalter aussieht: „Vorname …“, „Nachname …“, „Name …“, „Initiale …“, „Person …“, „Einrichtung …“ mit Großbuchstaben, auch mit angehängten Buchstaben oder Ziffern („Einrichtung A2S“, „Nachname AS“, „Vorname B9“), und Platzhalter in eckigen Klammern („[E-MAIL-99]“, „[NAME]“). Jede Stelle steht als **rote Zeile** mit Fundstelle im Bericht. Weiter geht es erst, wenn du sie ausdrücklich bestätigst. Eine bloß abweichende Anzahl genügt dafür nicht mehr.
   - Bei Auffälligkeiten musst du bestätigen, erst dann geht es weiter.
   - Passt die Schlüsseldatei gar nicht, geht es nicht weiter.
5. Schritt **„Speichern“**: **„Wiederhergestellte Datei speichern“**.
   - Gleiches Format, Dateiname „wiederhergestellt_…“. Alle deine Änderungen, die Formatierung und die Zellstruktur bleiben erhalten.
   - Der **Schlusscheck** über die ganze Datei (auch Dateiangaben und andere Teile außerhalb des Berichts) läuft seit 2.5 schon im Schritt „Rückbau prüfen“; seine Funde stehen dort als Punkte und gelten mit demselben Häkchen.
   - Danach führt **„Nächstes Dokument“** zum Start.

> **Warnung zur Schlüsseldatei:** Sie **enthält echte Namen** und Kontaktdaten. **Nie weitergeben, nie an eine KI.** Getrennt vom anonymisierten Dokument sicher aufbewahren.

- Die alte **Zuordnungstabelle** (`zuordnung_VERTRAULICH.csv`, Modus „Person A“) **reicht für einen Rückbau nicht**. Das Tool meldet das beim Laden.
- In den Modi „Person A“ und „[NAME]“ ist **kein Rückbau** möglich. Das steht im Tool vor dem Export.
- Eine **falsche Schlüsseldatei** wird erkannt, wenn kaum Platzhalter oder Anzahlen passen. Dann gibt es entweder kein Ergebnis oder eine deutliche Warnung mit Bestätigung.

**Grenzen des Rückbaus**
- **Metadaten** (Autor, zuletzt bearbeitet von, Kommentar-Autoren, Firma) werden **nicht** wiederhergestellt.
- Beim Rückbau wird **nichts bereinigt**: Dateiangaben und Bild-Metadaten der geladenen Datei bleiben, wie sie sind (im Test belegt).
- **PDF** ist als Rückbau-Eingabe nicht möglich. Verwenden Sie die .txt- oder .docx-Ausgabe der PDF-Anonymisierung.
- **Umgeschriebene Platzhalter** (z. B. „des Nachnamens A“, „nachname a“, „Person A“ statt „Vorname A Nachname A“) werden gemeldet, aber nicht ersetzt. Bitte von Hand korrigieren.
- **Formatierung innerhalb eines Namens:** War nur ein Teil eines Namens fett („Anna Mü**ller**“), steht nach dem Rückbau der ganze Name in der Formatierung des ersten Teils. Der Text stimmt exakt.
- **Excel-Blattnamen** dürfen höchstens 31 Zeichen haben. Wird ein Blattname durch Platzhalter zu lang, warnt das Tool vor dem Export. Der Rückbau dieses Blattnamens ist dann nicht exakt.
- **Alternativtexte, Feldfunktionen, Links:** Dort wird nur zurückgebaut, wenn die Schreibweise exakt bekannt war. Sonst steht dort „Name A“; das meldet der Rückbau-Bericht als unbekannt.
- Steht im **Original schon Text, der wie ein Platzhalter aussieht** (z. B. „Nachname A“), steht beim Speichern unter „Details“ ein Hinweis (ohne Sperre): „Im Text stehen Wörter, die wie Platzhalter aussehen (…). Das Tool verwendet diese Platzhalter nicht.“ Bis Version 2.3.3 hat der Rückbau solche Stellen mit dem Klarnamen überschrieben; seit 2.3.4 nicht mehr.
- Im Modus **„[NAME]“** heißen alle Namen gleich. Dort kann die KI ein „[NAME]“ aus dem Original nicht von einem ersetzten Namen unterscheiden; der Hinweis sagt das.
- **Das Wort „Name“ selbst** (z. B. „im Feld Name A“) erkennt das Tool manchmal als Personennamen (Fehltreffer, siehe Grenzen). Dann steht dort z. B. „Vorname D A“. Der Rückbau ist trotzdem exakt; bitte den Treffer im Schritt „Prüfen“ ausschalten.
- **Schlüssel aus 2.3.4 in einer älteren Version (2.3.3):** wird gelesen, das Zusatzfeld übergangen. Der Rückbau bleibt exakt, die Wörter aus dem Original erscheinen dort aber als rote Reste und als „unbekannte Platzhalter“ (Urteil ggf. „wahrscheinlich die falsche Schlüsseldatei“); nach Bestätigung geht es weiter.
- **Platzhalter-Reste, die keine sind:** Wörter wie „Person A“ oder „[NAME]“, die schon im Original standen, meldet der Rückbau seit 2.3.4 neutral („stand schon im Original“), nicht mehr rot. Rot erscheinen sie nur noch mit einem Schlüssel aus einer älteren Version (ohne diese Angabe).
- **Ziffer hinter einem Namen in den Modi „Person A“ und „[NAME]“:** „Müller2“ wird „Person A2“ bzw. „[NAME]2“. Das ist kein anderer gültiger Platzhalter (Personen tragen nur Buchstaben); kein Rückbau in diesen Modi.
- Eine Schlüsseldatei einer **anderen, gleich aufgebauten Datei** (gleiche Personenzahl, gleiche Häufigkeiten) erkennt seit Version 2.1 die **Kennung**. Ohne Kennung im Dokument (eingefügter Text, umbenannte .txt/.csv) oder mit einem alten Schlüssel ist das weiterhin nicht sicher.
- Zeichen in zerlegter Unicode-Form (NFD) kommen in zusammengesetzter Form (NFC) zurück. Sie sehen gleich aus.
- Text-Ausgaben (.txt/.csv) sind immer UTF-8.

---

## Was wird gelesen?

| Format | Was gelesen wird | Ausgabe |
|---|---|---|
| **.txt** | ganzer Text (UTF-8, UTF-16, sonst Windows-1252) | .txt, .docx, Kopieren |
| **.csv** | alle Zellen; Trennzeichen (; , Tab \|) und Anführungszeichen werden erkannt | .csv (gleiche Struktur), .txt, .docx |
| **.docx** | Haupttext, Tabellen, **Kopf-/Fußzeilen, Fußnoten, Endnoten, Kommentare, Textfelder, nachverfolgte Änderungen** (auch gelöschter Text), Diagrammtexte | .docx (Formatierung bleibt), .txt |
| **.xlsx** | **alle Blätter, auch ausgeblendete**, Blattnamen, Zellen, Text in Formeln, Kopf-/Fußzeilen, Kommentare, Textfelder, Diagramme | .xlsx (**Zellstruktur bleibt**), .txt |
| **.pdf** | **nur die Textebene** | .txt oder .docx (**Layout bleibt NICHT erhalten**) |

**Teile an ungewöhnlicher Stelle (seit Version 2.4.1):** Eine .docx/.xlsx-Datei ist ein Paket aus vielen Teilen. Manche Programme (z. B. `openpyxl`) legen Kommentare, Kopfzeilen, Fußnoten oder Dateieigenschaften nicht am üblichen Ort ab, etwa `xl/comments/comment1.xml` statt `xl/comments1.xml`. Das Tool findet jeden Teil jetzt über die **Verweise im Paket** (Beziehungen und Inhaltstypen), nicht nur über den üblichen Pfad. Solche Teile werden genauso gelesen, in der Prüfansicht gezeigt, ersetzt, bereinigt und zurückgebaut wie am üblichen Ort. Das gilt auch, wenn der Haupttext oder die Arbeitsmappe selbst woanders liegt. Bisher blieben Namen in solchen Teilen stehen (Excel-Kommentar, Excel-Kopfzeile, Word-Fußnote, -Kopfzeile, -Kommentar).

**Nicht unterstützt** (wird klar gemeldet, nie stillschweigend halb verarbeitet): `.doc`, `.xls`, passwortgeschützte Dateien,
gescannte PDFs ohne Textebene („PDF enthält keinen Text, evtl. gescannt“), `.docm`/`.xlsm`/`.xlsb`, PowerPoint, OpenDocument, RTF.

### Was beim Export bereinigt wird (versteckte Angaben)
- **Dateieigenschaften** – Autor, zuletzt bearbeitet von, Titel, Betreff, Stichwörter, Beschreibung, Kategorie, Firma, Manager, alle Textwerte der benutzerdefinierten Eigenschaften. Seit Version 1.3 findet das Tool diese Teile **über ihre Verweise** in der Datei, nicht nur am üblichen Ort `docProps/…`. In Word wird auch der Titel in der Teileliste geleert.
- **SharePoint-Felder** (`customXml`, seit Version 1.3):
  - Personen-Felder werden geleert, und zwar in der Form, die SharePoint selbst für „leer“ schreibt (Anzeigename leer, Kennung `xsi:nil`).
  - Andere Textwerte werden geleert, wenn sie einen bestätigten Namen oder einen Namen aus den Dateiangaben enthalten.
  - Die Struktur bleibt erhalten.
- **Bild-Metadaten** (seit Version 1.3), verlustfrei; die Bildpunkte bleiben gleich, im Test per Prüfsumme belegt:
  - JPEG: EXIF, XMP, IPTC und Kommentare. Die Bild-Ausrichtung bleibt als einzige EXIF-Angabe erhalten, damit gedrehte Fotos gedreht bleiben.
  - PNG: Textblöcke (tEXt, zTXt, iTXt) und EXIF
  - GIF: Kommentare und XMP
  - Andere Bildtypen (TIFF, EMF, WMF, SVG, WebP …) werden nicht verändert. Dazu erscheint ein Hinweis mit dem Typ, und der Schlusscheck sucht trotzdem darin.
- Kommentar-Autoren und Initialen, Autoren nachverfolgter Änderungen, Personenliste (inkl. E-Mail-Kennung)
- Vorschaubild (Thumbnail) wird entfernt, egal wo es liegt
- Benutzernamen in Pfaden (z. B. `C:\Users\name\…`) und E-Mail-Adressen in Links
- Blattnamen werden auch in Formeln, definierten Namen und der Blattliste konsistent umbenannt
- Eingebettete Objekte (z. B. eine Excel-Tabelle in Word) werden **geleert**, weil ihr Inhalt nicht geprüft werden kann (Hinweis erscheint). Seit 2.4.1 auch, wenn sie nicht im üblichen Ordner liegen (über ihren Verweis gefunden).

---

## Wie erkennt das Tool Namen? (regelbasiert, deterministisch)

- **Namenslisten** (siehe Lizenzen): rund 20 000 Vornamen- und 21 000 Nachnamen-Schreibweisen aus vielen Ländern, Vergleich ohne Akzente (Müller = Muller = Mueller, Yılmaz = Yilmaz). Unicode wird auf NFC normalisiert.
- **Anreden und Titel:** Herr, Frau, Dr., Prof., Dipl.-Ing., Mr., Mrs., Familie … → das folgende großgeschriebene Wort ist ein Name, auch wenn es in keiner Liste steht. Rollen wie „Kollegin“, „Mandant“, „Sohn“ sind schwächere Hinweise.
- **Muster:** Vorname Nachname, „Nachname, Vorname“, Initialen („M. Müller“), Bindestrich-Namen, GROSSSCHREIBUNG, Namenszusätze (von, van der, de la, al-, bin, ibn …), typische Endungen (-ović, -ski, -oğlu, -ov/-ova, -enko, -escu, -poulos, -yan, -shvili, -zadeh …), nachgestellte Anreden („Ahmet Bey“).
- **Endungen:** „Müllers“, „John’s“ werden mit dem Grundnamen erkannt.
- **Allerweltswörter** („Rose“, „Mark“, „Winter“, „Paris“, „Koch“ …): nur im Namenskontext sicher, sonst **unsicherer Treffer**.
- **Gewöhnliche Wörter, die auch als Name vorkommen (seit Version 2.4.0):** 57 weitere Wörter gelten als Allerweltswörter, z. B. „Yoga“, „Kita“, „Campus“, „Mama“, „Papa“, „Termine“, „Kalender“, „Liga“. Steht so ein Wort allein (ohne Anrede, ohne Nachbarnamen), wird es nicht mehr „sicher“, sondern „unsicher“ markiert: Es wird weiter ersetzt (oder nach „der“, „die“, „im“ … nicht), erscheint aber als Frage zur Prüfung. Mit Anrede („Frau Kalender“) bleibt es ein sicherer Name.
  - **Wie die Liste entstand:** Ausgangspunkt waren Wörter, die zugleich in den Namenslisten stehen und häufige deutsche Haupt- oder Eigenschaftswörter sind (166 Wörter, die bisher nicht als Allerweltswort galten). Herausgenommen wurden die häufigsten echten Namen (alle Nachnamen unter den 3000 häufigsten und alle Vornamen einer frei verfügbaren deutschen Namensliste, z. B. „Müller“, „Horst“) und jedes Wort, das in irgendeiner Sprache ein gebräuchlicher Name ist (z. B. „Ding“, „Adel“, „Alba“, „Islam“, „Maxime“, „Ted“). Jedes verbliebene Wort wurde einzeln angesehen. Die Liste steht fest im Programm (`src/core/lexicon.js`).
  - **Nur zum Messen genutzt, NICHT im Tool enthalten:** die Häufigkeits- und Namenslisten aus `@zxcvbn-ts/language-de` (npm, MIT; Daten aus OpenSubtitles, ODC-BY) und die Wörterbücher `german-words-dict` und `german-adjectives-dict` (npm, Apache-2.0; Daten aus german-pos-dict, CC-BY-SA-4.0). In der `index.html` steht nur die kurze, von Hand geprüfte Wortliste.
  - Grenze: Wörter mit Umlaut, die ohne Umlaut einem Namen gleichen („Bücher“/„Bucher“, „Wünsche“, „Blätter“/„Blatter“), stehen bewusst nicht auf der Liste und bleiben wie bisher.
- **Wochentag vor Uhrzeit oder Datum (seit Version 2.4.0):** Eine Abkürzung **ohne Punkt** direkt vor einer Uhrzeit oder einem Datum („Do 13:30“, „Mo 05.10.“) ist kein Name und erscheint nicht mehr in der Prüfung. Mit Punkt („Do. 13:30“) gilt wie bisher die Regel für Wochentage (unsicher, aus). Mit Anrede („Frau Do 13:30“) bleibt es ein Name.
- **Anrede allein (seit Version 1.2):** Steht in einem Absatz, einer Zeile oder einer Zelle **nur** „Herr“, „Frau“ (auch „Hr.“, „Fr.“, „Frau Dr.“, „Herr Prof. Dr.“ …), dann gilt der Anfang der **direkt folgenden** Einheit als Name. Er wird **immer ersetzt**:
  - in Word: der nächste Absatz (in derselben Zelle oder im Fließtext) oder die **rechte Nachbarzelle** derselben Tabellenzeile;
  - in TXT: die nächste Zeile; in CSV: das rechte Nachbarfeld.
  - **Enge Grenze:** Die Zeile muss **ganz** aus 1 bis 3 großgeschriebenen Namenswörtern bestehen (dazu Initialen und Zusätze wie „von“, „van der“, „al-“). Danach sind nur Satzzeichen erlaubt. Kommt danach noch Text, eine Zahl oder ein Datum, greift die Regel nicht.
  - Ein **leerer Absatz**, eine **leere Zelle**, das **Zeilen- oder Tabellenende** und **Word-Überschriften** unterbrechen die Regel. Wörter von der Liste der Allerweltswörter (z. B. „Berlin“, „Montag“) lösen sie nicht aus.
  - **Markierung:** Steht das Wort in einer Namensliste (z. B. „Kubik“) oder sind es mehrere Wörter (z. B. „Lieselotte Steineck“), ist der Treffer **„sicher“** (wie bisher). Ist es **ein einzelnes unbekanntes Wort** (z. B. „Hartung“, aber auch „Mathematik“ oder „Turnhalle“), wird es ersetzt und als **„unsicher, an“** markiert (gestrichelt). Ein Fehltreffer aus dieser Regel ist also nie „sicher“.
  - **Übertragung:** Ein solches „unsicher, an“ markiertes Wort wird im **ganzen Dokument** ersetzt, auch mit Endung („Hartungs“), in GROSSSCHREIBUNG, in Kopf- und Fußzeilen und Fußnoten, immer mit demselben Platzhalter und ebenfalls „unsicher, an“. Treffer, die nicht aus dieser Regel stammen, ändern sich dadurch nicht.
  - **Ein Klick für alle:** Tippt man im Schritt „Prüfen“ eines dieser Vorkommen an, gehen **alle** Vorkommen des Worts aus (bzw. wieder an).
- **Anrede am Zeilenende (seit Version 2.6, Textdateien und eingefügter Text):** Endet eine Zeile auf „Herr“, „Herrn“ oder „Frau“ (auch mit Titel, z. B. „Herrn Dr.“) und steht kein Artikel davor („der Herr“, „eine Frau“ zählen nicht), ist der Anfang der nächsten Zeile ein Name: „… Papadakis, Frau⏎Sonnleitner, Herr⏎Kirchbichler“. Wörter der Liste „mehrdeutig“, Wochentage und Monate zählen nicht. Ein einzelnes unbekanntes Wort wird ersetzt und als **„unsicher, an“** gefragt (auch ein Sachwort wie „Herr⏎Danach“ oder „Herr⏎Mathematik“: bitte prüfen). In Word mit Zeilenumbruch (Umschalt+Enter) und in PDF galt das schon vorher.
- **„von“ (seit Version 2.6):** Ein Namenszusatz am **Anfang** („von“, „van“, „de“ …) gehört nur dann zum Namen, wenn danach ein Nachname folgt, nicht ein reiner Vorname. „Schwester von Lena Winter“ behält sein „von“; „Frau von Bodelschwingh“ bleibt ein Name.
- **Wochentage und Monate (seit Version 1.2):** „Montag“ … „Sonntag“, „Januar“ … „Dezember“ (auch „Jänner“, „Feber“) und Abkürzungen **mit Punkt** („Mo.“, „Jan.“, „Sept.“ …) werden **nicht automatisch ersetzt**, wenn sie allein stehen (ohne Anrede, ohne Namen daneben). Sie erscheinen im Schritt „Prüfen“ als „unsicher, aus“ und lassen sich einschalten. „Herr Montag“ oder „Trần Thị Mai“ gelten weiter als Name. „Jan“ ohne Punkt bleibt ein Vorname.
- **Gleiche Person = gleiches Pseudonym** im ganzen Dokument. „Herr Yılmaz“ wird „Mehmet Yılmaz“ zugeordnet, wenn der Nachname eindeutig ist (im Schritt „Prüfen“ sichtbar und lösbar).
- **Deterministisch:** gleiche Eingabe + gleiche Einstellungen = gleiche Pseudonyme und byte-gleiche Ausgabe (im Test per Doppellauf belegt).

---

## Grenzen (bitte lesen)

**Seit Version 2.7 (Webadressen, Konten, Warnpunkt):**
- **Einrichtungen werden noch nicht selbst ersetzt.** Schulname, Träger und Kürzel („GYMTH“) bleiben im Klartext, bis du sie markierst. Der Warnpunkt zeigt Kandidaten; das Kürzel zeigt er nicht.
- **Webadresse ohne bekannte Endung** (z. B. `kita.example`) oder ohne Punkt wird nicht erkannt. Eine bloße Domain mit GROSS geschriebener Endung („BEISPIEL.DE“) ebenfalls nicht; mit `www.` oder `https://` schon.
- **Konto ohne Plattform-Wort und ohne @** (z. B. nur „kita_sonne“) wird nicht erkannt.
- **Mailto-Verknüpfung:** Steht eine E-Mail-Adresse nur im Ziel einer Verknüpfung, wird sie wie bisher als „[E-MAIL]“ ohne Nummer ersetzt und kommt beim Rückbau nicht zurück.
- **Word und ein Link-Ziel wie „[WEBADRESSE-2]“:** Das Ziel ist danach keine gültige Adresse mehr. LibreOffice öffnet die Datei (geprüft); Word wurde hier nicht geprüft.
- **Umbruch in einer Webadresse (PDF):** Bricht eine Adresse mit „www.“ oder „http“ am Bindestrich um („www.lern-⏎und-spiel.de“), gilt sie als eine Adresse. Ein Umbruch an anderer Stelle (nach „/“ oder „.“) trennt sie; der Teil in der nächsten Zeile wird dann nur ersetzt, wenn er selbst wie eine Webadresse aussieht.
- **Schlusscheck:** Er sucht wie bisher nur Namen und Einrichtungen, keine Kontaktdaten. Webadressen und Konten bei ausgeschaltetem Schalter meldet der Punkt „Webadresse oder Konto steht noch im Text“.

**Seit Version 2.6 (Namensspalten, Zeilenende, „von“):**
- **Unbekannter Vorname im Satz bleibt eine Grenze:** „Leitung: Dimitrios Papadopoulos“ – „Dimitrios“ steht in keiner Liste und ohne Anrede; er wird nicht erkannt. Nur in einer Namensspalte hilft die Spalte.
- **Sachwörter in einer Namensspalte** werden ersetzt (unter starkem Kopfwort „sicher“, ohne Frage), z. B. „Turnhalle“ unter „Nachname“ oder ein Notizsatz-Teil wie „Hartungs Antrag“ unter „Name“. Bitte im Schritt „Prüfen“ abschalten oder die Spalte über den Schalter „Namen“ ausschalten. Ein so ersetztes Wort wird wie jeder sichere Name auch an anderen Stellen ersetzt.
- **Excel, gleicher Zelltext in mehreren Zeilen:** Excel speichert gleiche Texte nur einmal. Steht z. B. „Winter“ in zwei Zeilen mit verschiedenen Vornamen (Lukas, Lena), kann „Winter“ nicht beiden Personen zugleich gehören: Dann bleibt „Winter“ eine eigene Person, Lukas und Lena ebenfalls. Ersetzt wird trotzdem alles. In CSV und Word gilt das nicht (jede Zelle für sich).
- **Spalte „Name“ neben „Vorname“:** Eine Spalte „Name“ hat keine feste Rolle (sie kann den ganzen Namen oder nur den Nachnamen enthalten). Deshalb werden „Name“ und „Vorname“ einer Zeile **nicht** zu einer Person zusammengefasst; beide werden ersetzt.
- **Kopf mit weiteren Wörtern:** „Name des Kindes“ oder „Name der Schule“ zählen nicht als Namensspalte. Dann hilft der Schalter „Namen“.
- **Kopfzeile wird nicht erkannt**, wenn die erste ausreichend gefüllte Zeile keinen üblichen Spaltenkopf hat (z. B. die Tabelle beginnt direkt mit Namen). Dann gibt es keine automatische Namensspalte; der Schalter „Namen“ hilft.
- **Anrede am Zeilenende** gilt nur für Textdateien und eingefügten Text. Zwischen zwei Word-Absätzen gilt sie nicht (nur „Anrede allein“).

**Seit Version 2.5 (Bedienung und Fragen):**
- **Gebeugte Formen wie „Rosen“** bei einer Person Rose werden wie bisher **ohne Antwort ersetzt** (Entscheidung Easy: ein stehen gebliebener Name wiegt schwerer als ein verfälschtes Wort). Sie werden aber je Stelle gefragt; „Nein“ lässt das Wort stehen.
- **Fragen je Stelle** gibt es nur für Wörter der Liste „mehrdeutig“. Andere Namen nach Artikel oder Präposition („aus Müllers Büro“) bleiben wie bisher ersetzt, ohne Frage.
- Eine **GROSS-Form mit Endung** eines von Hand übernommenen Namens wird nur gefragt, wenn der Name auch in normaler Schreibweise im Dokument steht. Sonst meldet sie wie bisher der Schlusscheck.
- **Excel-Formeln:** Erkannte Wörter in einer Formel (z. B. ein Funktionsname) erscheinen gelb, ersetzt wird aber wie bisher nur Text in Anführungszeichen.
- **Schlusscheck bei sehr großen Dateien:** Er sucht jetzt zuerst in den Abschnitten (für einfache Fundorte), dann in der ganzen Datei. Bei 10 MB Text dauert das Speichern dadurch etwa doppelt so lange (gemessen 48 s statt 25 s).

- **Einrichtungen (seit Version 2.3):**
  - Es gibt **keine eigene Suche** nach Einrichtungen. Was du nicht markierst (oder aus den Dateiangaben übernimmst), bleibt stehen.
  - Gefunden wird die **ganze Wortfolge**, auch mit den üblichen Endungen („des Familienzentrums Sonnenblume“, „des Lindenauer Bürgervereins“) und in GROSSSCHREIBUNG. **Andere gebeugte Formen** (z. B. Mehrzahl) und **Teile** des Namens allein („die Sonnenblume“, „Lindenhof“) werden **nicht** gefunden und nicht gemeldet. Bitte als weitere Schreibweise markieren und zusammenführen.
  - **Zeilenumbruch mitten im Namen:**
    - **TXT:** Steht der Name auf zwei direkt aufeinanderfolgenden Zeilen (genau ein Umbruch), wird er ersetzt; die beiden Zeilen werden in der Ausgabe eine. Im Modus „rückbaufähig“ ist das eine eigene Schreibweise mit Nummer, und der Rückbau stellt den Umbruch exakt wieder her (auch Windows-Zeilenenden).
    - **Excel und CSV:** Ein Umbruch innerhalb einer Zelle stört nicht; der Name wird ersetzt und exakt zurückgebaut.
    - **Word**, Zeilenumbruch (Umschalt+Enter) im Namen: In „Person A“ und „[NAME]“ wird ersetzt. Im Modus „rückbaufähig“ **nicht**, weil der Umbruch beim Rückbau nicht exakt zurückkäme. Der Schlusscheck meldet die Stelle und sperrt das Speichern: „Der Name steht über einen Zeilenumbruch. Entferne den Umbruch in Word oder markiere die Teile einzeln.“
    - **Zwei oder mehr Umbrüche** im Namen: nicht ersetzt; der Schlusscheck meldet die Stelle (siehe unten).
  - **Briefkopf über zwei getrennte Absätze** (Word: zwei Absätze, TXT: Leerzeile dazwischen): wird **nicht ersetzt**, aber **immer gemeldet** (siehe unten): „Der Name steht über zwei Absätze. Entferne den Absatz in Word oder markiere die Teile einzeln.“
  - **Schlusscheck für Einrichtungen:** Jede Einrichtung aus deiner Liste („Eigene Namen“, markiert oder aus den Dateiangaben übernommen) wird im **Originaltext** gesucht: in allen Abschnitten, auch in Kopf-/Fußzeilen und Bildbeschreibungen, auch über Zeilenumbruch und Absatz hinweg, mit Endungen und in GROSSSCHREIBUNG. Jede Fundstelle, die in der Ausgabe nicht **vollständig** als Einrichtung ersetzt ist (auch wenn nur ein Teil als Person ersetzt wurde oder ein Treffer ausgeschaltet ist), wird mit Fundort gemeldet; gespeichert wird erst nach „bewusst stehen lassen“.
  - **Grenze:** Geprüft werden nur Einrichtungen, die in der Liste stehen, markiert sind oder aus den Dateiangaben übernommen wurden. Was nirgends als Einrichtung eingetragen ist, kennt das Tool nicht.
  - **Kurzformen** („FZS“, „die Sonnenblume“) findet das Tool nicht von selbst: markieren und mit der Einrichtung zusammenführen.

- **Bedienung (seit Version 2.0):**
  - Es gibt kein dunkles Farbschema mehr; die Farben sind fest hell.
  - Rückbaufähig wird mit zwei Klicks gespeichert („1 Schlüssel“, „2 Datei“), weil Browser zwei Downloads aus einem Klick blockieren oder nachfragen können.
- **Anrede allein, danach ein Sachwort:** Steht nach einer allein stehenden Anrede ein einzelnes Wort, das kein Name ist (z. B. ein Fach „Mathematik“, ein Ort „Lübeck“, „Turnhalle“, in TXT eine Überschrift), wird es als Name ersetzt, und zwar **überall im Dokument**. Es ist immer „unsicher“ markiert. Bitte im Schritt „Prüfen“ prüfen und mit einem Klick abschalten (dann ist es überall wieder Klartext).
- **Mitgenommenes Nachbarwort:** Steht ein übertragenes Wort direkt hinter einem unbekannten großgeschriebenen Wort (z. B. „Treffpunkt Turnhalle“), wird das Nachbarwort mit ersetzt, wie bei der bisherigen Übertragung von Namen. Auch das ist „unsicher“ markiert und geht mit dem Klick aus.
- **Wort schon anderweitig als Name bekannt:** Ist dasselbe Wort im Dokument schon durch einen anderen sicheren Treffer bekannt (z. B. „Anna Hartung“), gilt für die weiteren Vorkommen die bisherige Übertragung dieses Namens („sicher“).
- **Anrede allein in Excel:** gilt seit Version 2.6 (siehe „Namensspalten in Tabellen“).
- **Anrede allein ohne direkte Folge:** Ein leerer Absatz, eine leere Zelle oder ein Zeilenende zwischen Anrede und Name unterbricht die Regel (der Name wird dann nur erkannt, wenn er in einer Liste steht).
- **Personen mit Monatsnamen** („Mai“, „April“, „August“): Stehen sie allein ohne Anrede, ist der Treffer standardmäßig aus. Im Schritt „Prüfen“ prüfen und einschalten.
- **Nie 100 %.** Seltene Namen, die in keiner Liste stehen und ohne Anrede vorkommen (im Test z. B. „Ijeoma Uchendu“, „Xiong Wenjie“), werden **nicht** erkannt → im Schritt „Prüfen“ von Hand markieren.
- **Fehltreffer** sind möglich (z. B. „Bill“ in „engl. Bill“, ein Tabellenkopf „Name“). Sie sind meist als „unsicher“ markiert und lassen sich abschalten.
- **Kleingeschriebene Namen** werden nur gefunden, wenn derselbe Name schon anderswo erkannt oder von Hand markiert wurde.
- **Endungen (seit Version 2.3.1):** Ist ein Name erkannt oder markiert, werden auch seine gebeugten Formen ersetzt („Quabbenjansens“, „Müllers“), mit den Endungen ’s, ', s, es, n und ns.
- **Großschreibung und Endungen (seit Version 2.3.2):** Ein Name in GROSSBUCHSTABEN mit Endung („MÜLLERS“, „QUABBENJANSENS“, „MÜLLERs“) bleibt nicht mehr unbemerkt stehen. Er wird entweder ersetzt oder vom Schlusscheck gemeldet.
  - **Ersetzt** wird er, wenn das Tool den Namen selbst erkannt hat (z. B. „Herr Gerrit Quabbenjansen“ steht im Text) oder wenn er in einer Namensliste steht („MÜLLERS“ allein). Gleiche Person, gleicher Platzhalter. Mehrdeutige Wörter bleiben „unsicher“ wie in Kleinschreibung (z. B. „WINTERS“ in einer Überschrift: „unsicher, an“, bitte prüfen).
  - In den Modi „Person A“ und „[NAME]“ steht die Endung **klein** hinter dem Platzhalter („Person As“, „Einrichtung As“, „[NAME]s“, „[EINRICHTUNG]s“; seit 2.3.3). So sieht „MÜLLERS“ nie wie eine andere Person „Person AS“ aus (die gibt es ab 45 Personen). Im Modus „rückbaufähig“ gehört eine große Endung zum Platzhalter („Nachname A3“ = „MÜLLERS“), damit der Rückbau genau „MÜLLERS“ zurückschreibt. Kleine Endungen bleiben wie bisher dahinter („Nachname A2s“).
  - **Nur gemeldet** (nicht ersetzt) wird er, wenn du den Namen **von Hand markiert** hast (eigene Namen). Grund: Eigene Namen gelten immer als „sicher“; in der Messung wurde so auch eine Überschrift „ROSEN“ bei markierter „Anna Rose“ „sicher“ ersetzt. Der Schlusscheck meldet die Stelle, du entscheidest.
  - **Schlusscheck:** Er sucht alle bestätigten Namen ohne Rücksicht auf Groß-/Kleinschreibung und mit allen Endungen der Liste. Folge: Auch ein gewöhnliches Wort kann gemeldet werden, wenn es wie ein bestätigter Name mit Endung aussieht (z. B. „die Rosen“ bei einer Person „Anna Rose“, „des Winters“ bei „Winter“). Prüfen und bewusst stehen lassen.
  - Schriftzeichen: „STRAUSS“ und „STRAUẞ“ gelten als „Strauß“, „YILMAZ“ als „Yılmaz“, „ÇELİK“ als „Çelik“, „BRZĘCZEK“ als „Brzęczek“, „MUELLER“ als „Müller“; unabhängig von der Spracheinstellung des Browsers (geprüft mit Türkisch).
  - Grenzen: Andere Endungen als ’s, ', s, es, n, ns („MÜLLERIN“) zählen nicht. Texte außerhalb der Prüfansicht (Dateiangaben, Feldfunktionen) ersetzen GROSS mit großer Endung nicht; der Schlusscheck meldet sie.
  - **Einrichtungen** in GROSSSCHREIBUNG mit Endung („DES LINDENAUER BÜRGERVEREINS“) werden seit 2.3 ersetzt. Seit 2.3.3 auch im Modus „rückbaufähig“ exakt zurückgebaut (vorher blieb dort „Einrichtung A2S“ stehen).
- **Namen in E-Mail-Adressen**, wenn die E-Mail-Erkennung ausgeschaltet ist, und Namen in Wortzusammensetzungen („Müllerstraße“, „Schmidt-Gruppe“ teilweise) werden nicht ersetzt.
- **Chinesische, japanische, koreanische und thailändische Schrift** (ohne Leerzeichen zwischen Wörtern): Namen in Originalschrift werden nicht erkannt. Arabische, kyrillische, griechische und hebräische Schrift werden über Listen teilweise erkannt.
- **Bildinhalt** wird nie verändert und nicht automatisch geprüft (Namen in Fotos, Scans, Unterschriften, Logos). Du siehst jedes Bild vor dem Speichern in der Liste „Bilder ansehen“ und bestätigst es. Die versteckten Bildangaben werden bei JPEG, PNG und GIF entfernt, bei anderen Bildtypen nicht (Hinweis erscheint, der Schlusscheck sucht trotzdem).
- **Bilder, die der Browser nicht zeigen kann** (EMF, WMF, TIFF …), und **verknüpfte Bilder** musst du in Word bzw. Excel selbst ansehen.
- **Kopf-/Fußzeilenbilder in Excel:** Ihr Titel wird nur dann als Bildbeschreibung geprüft, wenn der zugehörige Teil sauberes XML ist (bei Excel-Dateien der Regelfall). Sonst sucht der Schlusscheck trotzdem darin nach bestätigten Namen.
- **Fundstelle im Schlusscheck:** Steht ein übersehener Name in einer Bildbeschreibung, nennt der Schlusscheck den Teil der Datei (z. B. „Text“), nicht das Wort „Bildbeschreibung“; der angezeigte Ausschnitt zeigt die Beschreibung.
- **Word/Excel tragen beim Speichern den eigenen Namen wieder ein.** Die anonymisierte Datei deshalb direkt hochladen, nicht vorher in Word/Excel öffnen und speichern.
- **SharePoint-Felder, die an Inhaltssteuerelemente im Text gebunden sind:** Wird so ein Feld geleert, kann Word beim Öffnen auch den gebundenen Text im Dokument leer anzeigen (durch Code ungeprüft).

### Alle Stellen mit möglichen Klarnamen (.docx/.xlsx), Stand Version 2.4.1

| Stelle | wird bereinigt? |
|---|---|
| Autor, letzter Bearbeiter, Titel, Stichwörter (Dateieigenschaften) | **ja**, auch an ungewöhnlichem Ort (über Verweise gefunden) |
| Firma, Manager | **ja**, auch an ungewöhnlichem Ort |
| Benutzerdefinierte Eigenschaften (Textwerte) | **ja**, auch an ungewöhnlichem Ort |
| Vorlagenname, Blattliste | teilweise: nur erkannte Namen (Word: Titel in der Teileliste wird geleert) |
| Kommentar-Autoren und Initialen, Excel-Personenliste | ja |
| Autoren nachverfolgter Änderungen, Personenliste mit E-Mail | ja |
| Vorschaubild | ja (wird entfernt) |
| SharePoint-Felder | **ja**: Personen-Felder immer; Textfelder mit erkanntem Namen oder Namen aus den Dateiangaben |
| Bild-Metadaten JPEG, PNG, GIF | **ja** (verlustfrei) |
| Bild-Metadaten anderer Typen (TIFF, EMF, WMF, SVG …) | **nein**: Hinweis mit Typ, der Schlusscheck sucht darin |
| Alt-Texte und Titel von Bildern und Formen | **ja** (seit 2.2): eigene Abschnitte „Bildbeschreibung“, Erkennung wie Text |
| Bildinhalt (Logo, Fotos, Scans) | **nein**, wird nie verändert; seit 2.2 Liste „Bilder ansehen“ mit Vorschau und Pflicht-Bestätigung |
| Kopf-/Fußzeilen, Fußnoten, Kommentartext, Textfelder | ja, gleiche Erkennung wie der Haupttext; seit 2.4.1 auch an ungewöhnlichem Ort (über Verweise gefunden) |
| Feldfunktionen, Links, Vorlagenpfad | teilweise: erkannte Namen und Benutzerordner |
| Literaturangaben (Quellen-Autoren in `customXml`) | teilweise: nur erkannte Namen (**offen**) |
| Eingebettete Objekte | ja (werden geleert, mit Hinweis) |
| Excel: Zellen, ausgeblendete Blätter, Blattnamen, Kopfzeilen | ja |
| Excel: Pivot-Zwischenspeicher, externe Verknüpfungen | teilweise |
| **Schlusscheck** | durchsucht **alle** Teile der Ausgabedatei nach bestätigten Namen und Namen aus den Dateiangaben, auch in Bildern (Text in UTF-8/UTF-16, entpackte PNG-Textblöcke). Seit 2.4.1 nur Inhalte mit **Nutzertext** (siehe unten) |

### Schlusscheck: was durchsucht wird (seit Version 2.4.1)
Der Schlusscheck sucht nur dort, wo Nutzertext stehen kann. Formatangaben meldet er nicht mehr als Namen. Bisher meldete er z. B. die Rahmenart „thin“ als bestätigten Namen „Thi“.
- **Durchsucht:**
  - aller Text in allen Teilen: Zellen, Absätze, Kommentare, Kopf- und Fußzeilen, Fußnoten, Textfelder, Diagramme, Dateieigenschaften, SharePoint-Felder;
  - dazu Felder mit Nutzertext: Bildbeschreibungen und -titel, Objekt- und Bildnamen, Blattnamen, definierte Namen, Tabellen- und Spaltennamen, Autoren, Kürzel und Benutzerkennungen;
  - Feldfunktionen, Inhaltssteuerelemente (Titel, Tag, Auswahlliste), Formularfelder, Textmarken, Link-Ziele und -Hinweise, Gültigkeitsregeln, Filterwerte und bedingte Formatierung „Text enthält“;
  - Pivot-Felder und -Werte, Verbindungen und verknüpfte Dateien (mit Pfaden), Namen eigener Formatvorlagen, Text in Anführungszeichen im Zahlenformat, Verweisziele und Teilnamen;
  - bei Binärteilen der Text in UTF-8 und UTF-16.
- **Nicht durchsucht** (Formatangaben):
  - Rahmenart, Ausrichtung, Farbe, Schriftart, Sprache, Maße, Stilverweise;
  - Name eingebauter Formatvorlagen;
  - Funktionsnamen in Formeln (Zeichenketten und Blattverweise werden durchsucht) und Steuercodes der Excel-Kopfzeile (der Text wird durchsucht);
  - Aufbau- und Zufallskennungen, Verweis- und Inhaltstypen.
- **Teile mit unbekanntem Aufbau** werden wie bisher vollständig durchsucht, mit allen Werten. Das sind fremde Namensräume, SharePoint- und Zusatzdaten (`customXml`) und Teile, die kein sauberes XML sind.
- Der Beweis steht in `tests/PFADE-REPORT.md`: Ein Prüfname wurde absichtlich in jedes durchsuchte Feld gesetzt (92 Felder, alle gefunden). In 23 Formatfeldern wird er nicht gemeldet.
- **PDF:** nur Textebene; gescannte Seiten fehlen (es wird gewarnt); das Layout geht verloren; schlecht kodierte PDFs liefern unlesbaren Text (es wird gewarnt).
- **Pivot-Tabellen** in Excel: Werte im Zwischenspeicher werden ersetzt; bitte nach dem Öffnen aktualisieren und prüfen.
- **Dateigröße:** Grenze 20 MB, Warnhinweis ab 5 MB. Gemessen am Desktop (Chromium, headless): 1 MB Text ≈ 3 s Analyse + 3 s Export (≈ 80 MB Arbeitsspeicher); 10 MB Text ≈ 50 s + 30 s (≈ 560 MB); Excel mit 20 000 Zeilen ≈ 8 s + 17 s (≈ 260 MB).
  **Realistische Grenze für das iPhone (ungeprüft, geschätzt): bis etwa 2–5 MB Text bzw. ca. 20 000 Excel-Zeilen.** Darüber kann der Safari-Tab sehr langsam werden oder abstürzen.

## Browser

| Browser | Status |
|---|---|
| Chromium/Chrome (Desktop) | **geprüft** (automatische Tests, headless) |
| Chromium mit 390, 1280 und 1920 px Breite | **geprüft** (kein waagrechtes Scrollen, Knöpfe mindestens 44 px, Antippen, Markieren, Tasten J/N) |
| Edge und Chrome unter Windows (Firmen-PC, `file://`) | Version 1.0 laut Easy **am PC geprüft**; Versionen 1.1 bis 2.6.1 **durch Code ungeprüft** |
| Microsoft Word / Excel: Öffnen der bereinigten Datei ohne Reparatur-Meldung | **durch Code ungeprüft** (auch die unsichtbare Kennung, seit 2.1). Geprüft: LibreOffice öffnet alle Ausgaben, alle XML-Teile sind wohlgeformt, keine Verweise ins Leere |
| Firefox (Desktop) | **durch Code ungeprüft** (Firefox ließ sich in der Testumgebung nicht starten; Befund zu Version 2.4.1 siehe PR) |
| Safari (macOS) | **ungeprüft** |
| Safari auf dem iPhone | **ungeprüft**. Code ist auf Safari ≥ 15 ausgelegt (keine Lookbehind-Regex, keine neueren Sprachfunktionen). |

**iPhone-Hinweis (ungeprüft):** Öffnet man `index.html` aus der Dateien-App, zeigt iOS oft nur eine **Vorschau ohne JavaScript**. Das Tool funktioniert dann nicht.
Die Datei muss in einem Browser geöffnet werden (z. B. über „Teilen → in Safari öffnen“, falls angeboten, oder über eine App, die lokale HTML-Dateien im Browser öffnet).

---

## Version und Prüfsumme

Version **2.7.0**, Stand 2026-11-21 (steht auch im Fußbereich des Tools).

SHA-256 der `index.html` dieser Version:

```
631a2bcd05e3aaf859309893e57509b745c978e99932280cb89a3aedce8a934a
```

Hinweis: Bei Version 2.6.1 stand hier versehentlich ein veralteter Wert (d411bf2f…). Die `index.html` von 2.6.1 hat die Prüfsumme f5b29a3d6cd1127b23a7226fbd44d155471d705c0dc961a6cf8853a983f18cc9.

Eine Datei kann ihre eigene Prüfsumme nicht enthalten, deshalb steht sie nur hier und im PR-Text. Prüfen unter Windows: `certutil -hashfile index.html SHA256`.

## Datenschutz und Offline-Nachweis

- **Content-Security-Policy** in der Datei: `default-src 'none'`, `connect-src 'none'`, `img-src blob:` (seit 2.2, nur für die Bild-Vorschauen aus dem Arbeitsspeicher; vorher `'none'`), `font-src 'none'`, `worker-src 'none'`, `form-action 'none'`. Skript und Stil sind nur über ihren SHA-256-Hash erlaubt (kein `unsafe-inline`, kein `unsafe-eval`).
- **Netzwerksperre im Code:** `fetch`, `XMLHttpRequest`, `WebSocket`, `EventSource`, `Worker`, `sendBeacon`, `window.open` u. a. werden beim Start unbrauchbar gemacht.
- Keine externen Skripte, Schriften, Bilder oder Links. Alle Bibliotheken sind eingebettet.
- Keine Telemetrie, kein Protokollieren von Inhalten. Browser-Speicher nur mit Schalter (Standard aus).
- **Zur Code-Suche:** In der gebauten `index.html` kommen die Wörter `fetch(`, `XMLHttpRequest`, `new Worker` und `new Function` vor. Sie stammen **ausschließlich aus der eingebetteten Bibliothek pdf.js**, wo sie zum Nachladen von PDFs aus dem Netz dienen. Das Tool nutzt diese Wege nicht (PDF-Daten werden direkt übergeben, Worker im Haupt-Thread). Sie sind durch CSP und Netzwerksperre zusätzlich blockiert, was in den Tests zur Laufzeit geprüft wird. `http://…`-Texte in der Datei sind XML-Namensräume (z. B. `http://schemas.openxmlformats.org/…`) und Lizenzhinweise, keine Verbindungen.

---

## Lizenzen

### Eingebettete Bibliotheken (in `index.html`)
| Paket | Version | Lizenz | Zweck |
|---|---|---|---|
| [jszip](https://www.npmjs.com/package/jszip) | 3.10.1 | MIT **oder** GPL-3.0 (hier genutzt: **MIT**) | ZIP lesen/schreiben (.docx/.xlsx) |
| – darin enthalten: pako, lie, setimmediate | (in JSZip gebündelt) | MIT bzw. MIT AND Zlib | Kompression, Promise-Hilfen |
| [pdfjs-dist](https://www.npmjs.com/package/pdfjs-dist) (Legacy-Build) | 5.4.624 | Apache-2.0 | PDF-Textebene lesen (enthält core-js, MIT) |
| pdfjs-dist `cmaps` (Adobe CMaps) | 5.4.624 | BSD-3-Clause (Adobe, siehe `node_modules/pdfjs-dist/cmaps/LICENSE`) | Schriftzuordnungen für asiatische PDFs |

Lizenztexte der Bibliotheken bleiben im eingebetteten Code erhalten (esbuild `legalComments`).
Bewusst **nicht** verwendet: SheetJS/`xlsx` (die npm-Version 0.18.5 ist veraltet und hat bekannte Sicherheitslücken; neuere Versionen gibt es nicht auf npm). Excel wird stattdessen direkt über JSZip und XML gelesen.

### Nur zum Bauen (nicht in `index.html` als Code)
| Paket | Version | Lizenz | Zweck |
|---|---|---|---|
| [esbuild](https://www.npmjs.com/package/esbuild) | 0.28.1 | MIT | Bündeln |
| [@faker-js/faker](https://www.npmjs.com/package/@faker-js/faker) | 10.6.0 | MIT | **Quelle der Namenslisten** (nur die Daten werden übernommen, kein Faker-Code) |

Alle Pakete stammen aus der offiziellen npm-Registry, mit festen Versionen (`package.json`, `package-lock.json`).
Absichtlich keine ganz frischen Releases (jszip 3.10.2 und pdfjs-dist 6.x waren zum Zeitpunkt erst wenige Tage bis Wochen alt).

### Namenslisten
| Quelle | Lizenz | Inhalt |
|---|---|---|
| @faker-js/faker 10.6.0, Ordner `locale` | MIT (© Faker-Mitwirkende) | Vor- und Nachnamen u. a. aus: Deutsch (DE/AT/CH), Englisch (US/GB/IE/AU/ZA/IN), Türkisch, Polnisch, Tschechisch, Slowakisch, Kroatisch, Serbisch, Slowenisch, Ungarisch, Rumänisch, Russisch/Ukrainisch/Mazedonisch (kyrillisch, plus deutsche und englische Umschrift), Spanisch, Portugiesisch, Italienisch, Französisch, Niederländisch, Skandinavisch, Finnisch, Lettisch, Vietnamesisch, Indonesisch, Nigeria (Englisch, Yoruba), Ghana, Senegal, Südafrika (Zulu, Afrikaans), Arabisch/Persisch/Urdu/Hebräisch/Griechisch/Armenisch/Georgisch/Kurdisch (Originalschrift) |
| `src/data/names-extra.txt` | **selbst erstellt** für dieses Projekt | Ergänzungen, für die es keine saubere Paketquelle gab: arabische und persische Namen in **lateinischer Umschrift**, chinesische (Pinyin), japanische und koreanische Namen, ältere deutsche Vornamen, zusätzliche türkische, polnische, russische (Umschrift), südslawische, ungarische, rumänische, spanische, portugiesische, italienische, französische, vietnamesische, indische, nigerianische (Igbo, Yoruba, Hausa), ghanaische, ostafrikanische und westafrikanische Namen. Aus allgemeinem Wissen zusammengestellt, ohne Anspruch auf Vollständigkeit. |
| `src/data/common-words.txt` | **selbst erstellt** | Allerweltswörter, die auch Namen sind („Rose“, „Winter“, „Koch“ …) → mehrdeutig |
| `src/data/stopwords.txt` | **selbst erstellt** | Funktionswörter, die nie Namen sind |

**Offen gemeldet:** Für arabische Namen in lateinischer Schrift sowie für chinesische, japanische und koreanische Namen in Umschrift habe ich **keine saubere, frei lizenzierte Paketquelle** gefunden. Diese Listen sind selbst erstellt und deshalb kleiner.

---

## Für Entwickler

```
npm ci                       # feste Versionen aus package-lock.json
npm run build                # erzeugt index.html (Namenslisten, CMaps, Bündel, CSP-Hashes)
node tests/make-fixtures.mjs # erfundene Testdokumente (braucht LibreOffice für PDF/DOC/XLS)
node tests/make-kurse.mjs    # Kurs-Tabelle und Risiko-Test für „Anrede allein“ (erfunden)
node tests/make-meta.mjs     # Testdokumente mit versteckten Angaben (Eigenschaften, SharePoint, Bild-Metadaten; erfunden)
node tests/meta-proof.mjs    # Beweis: alle Teile der Ausgabe ohne Testnamen, Bildpunkte gleich, Schlusscheck-Falle → tests/META-REPORT.md
node tests/ui-flow.mjs       # geführte Bedienung: Durchläufe, Sperren, Fragekarte, Zurück/Weiter, Breiten → tests/UI-REPORT.md
node tests/run-tests.mjs     # End-to-End-Tests in Chromium → tests/REPORT.md
node tests/roundtrip.mjs     # Rückbau: Kreislauf-Beweis und Fallen → tests/ROUNDTRIP-REPORT.md
node tests/regression.mjs <alte-index.html>  # alle Testdokumente, alle Modi byte-gleich zur Referenz (Ausnahmen einzeln mit Grund: Kennung; Dokumente mit Bildbeschreibungen)?
node tests/make-einrichtung.mjs  # Einrichtungs-Testdokumente: Word/Excel/TXT/CSV (erfunden)
node tests/einrichtung-test.mjs <index.html-2.2> [index.html-voriger-Stand]  # Einrichtungen: Fälle, Vorrang, Art-Wechsel, Merkliste, Rückwärts-Prüfung → tests/EINRICHTUNG-REPORT.md
node tests/make-endungen.mjs     # Endungs-Testdokumente (Word/TXT/CSV, Gegenprobe; erfunden)
node tests/endungen-test.mjs <index.html-2.3.0>  # Endungsprüfung vorher/nachher, Gegenprobe, Kreislauf → tests/ENDUNGEN-REPORT.md
node tests/make-bilder.mjs   # Bilder-Testdokumente: Word/Excel mit Bildern in Text, Kopfzeile, Tabelle, Name nur im Alt-Text/Titel, EMF, verknüpft, SVG (erfunden)
node tests/bilder-test.mjs <index.html-2.1>  # Bilder: Liste, Kacheln, Sperre, Bildbeschreibungen, Kreislauf, Breiten → tests/BILDER-REPORT.md
node tests/make-kennung.mjs  # Vertausch-Testpaar: gleiche Vorlage, andere (erfundene) Personen, vier Formate
node tests/kennung-test.mjs <index.html-2.0>  # Kennung: Vertausch, Veraltet, Umbenennen, Alt-Schlüssel, LibreOffice, Zufall → tests/KENNUNG-REPORT.md
node tests/korpus-test.mjs [--zellen] [--src <alter src-Ordner>]  # Messkorpus (seit 2.4.0): Fehltreffer und echte Namen je Wort, Vergleich mit tests/korpus/erwartung.json → tests/KORPUS-REPORT.md
node tests/wortliste-test.mjs <src-Ordner 2.3.4>  # Wortliste „mehrdeutig“ und Wochentag vor Uhrzeit: Einzelprüfungen, Zusammenspiel → tests/WORTLISTE-REPORT.md
node tests/make-pfade.mjs    # Teile an ungewöhnlicher Stelle (seit 2.4.1): Excel/Word, üblich/ungewöhnlich/Hauptteil, Phase-0-Datei, Gegenprobe (erfunden) → tests/fixtures-pfade/
node tests/pfade-test.mjs <index.html-2.4.0>  # Namen je Teil vorher/nachher, Kreislauf, Gegenprobe, Sicherheitsbeweis Schlusscheck, Doppellauf → tests/PFADE-REPORT.md
node tests/make-bedienung.mjs  # Testdokumente zu Easys Befunden (seit 2.5.0): Winter/Rosen, Montag, Do 13:30, GROSS-Form eines übernommenen Namens, ausgeblendetes Blatt, Bilder → tests/fixtures-bedienung/
node tests/make-spalten.mjs   # Testdokumente 2.6.0: Brief/Liste/Protokoll aus der Diagnose, Tabellenfälle in Excel/CSV/Word, Zeilenende-Risiken → tests/fixtures-spalten/
node tests/spalten-test.mjs [--alt <index.html-2.5.0>]  # Namensspalten, Spalte von Hand, Anrede in der Nachbarzelle, Zeilenende, „von“, Ziel-Test → tests/SPALTEN-REPORT.md
node tests/make-anzeige.mjs   # Testdokumente 2.6.1: Fragen auf mehreren Excel-Blättern, breite Tabelle, langer Text, Falle „Rose/Rosen“ → tests/fixtures-anzeige/
node tests/anzeige-test.mjs   # Anzeige beim Prüfen: drei Zustände, Rollen, Vorige/Nächste Frage, Antwort ändern = wie direkt geantwortet, Einstellungen/Listen, Rückbau → tests/ANZEIGE-REPORT.md
node tests/bedienung-test.mjs <index.html-2.4.1>  # Fragen und Speichern vorher/nachher, Beweis D.5, ohne Bedienung byte-gleich, Sperren, Eigene Namen, 1366×768 → tests/BEDIENUNG-REPORT.md
```

**Messkorpus (seit 2.4.0):** `tests/korpus/korpus-quelle.mjs` enthält rund 3000 Wörter erfundener Alltagstexte (Kursbeschreibungen, Elternbrief, Protokoll, Einladung, Tabelle, Liste …). Jeder echte Personenname ist dort mit ⟦…⟧ gekennzeichnet. `tests/korpus-test.mjs` zählt je Wort: Fehltreffer (sicher / unsicher an / unsicher aus), echte Namen (ersetzt / nur als Frage / ganz übersehen), Fragen und Schlusscheck-Meldungen. Jede Änderung an der Erkennung muss dieselben Zahlen liefern wie `tests/korpus/erwartung.json`, oder die Abweichung wird gezeigt (Erwartung nur nach bewusster Änderung mit `--update` neu schreiben).

Aufbau: `src/core` (Erkennung, Muster, Namenslisten-Zugriff, `reversible.js` = Modus rückbaufähig und Schlüsseldatei, `restore.js` = Rückbau), `src/formats` (TXT/CSV/DOCX/XLSX/PDF, `parts.js` = Teile über Beziehungen und Inhaltstypen finden, `meta.js` = versteckte Angaben: Dateieigenschaften, SharePoint-Felder, Bild-Metadaten, `images.js` = Bilderliste und Bildbeschreibungen), `src/ui` (Oberfläche mit den Bildschirmen Start/Datei/Prüfen/Speichern und Rückbau, Netzwerksperre, Vorlage, Stil), `build/` (Build-Skripte), `tests/` (Testdaten, Tests, Bericht).
