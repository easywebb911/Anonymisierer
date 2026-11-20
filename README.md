# Anonymisierer

Ein Werkzeug, das **Klarnamen** in Texten und Dokumenten durch Pseudonyme ersetzt („Person A“, „Person B“ … oder „[NAME]“).
Im Modus **rückbaufähig** kann eine anonymisierte und danach bearbeitete Datei später wieder mit den Klarnamen versehen werden (**Rückbau**).
Es ist **eine einzige Datei: `index.html`**. Sie läuft komplett im Browser und **sendet nichts ins Internet**.

> **Wichtig:** Das Tool findet nie alle Namen. **Die Prüfung in Schritt 2 gehört immer dazu.**
> Lies das Ergebnis immer selbst durch, bevor du es weitergibst.

---

## Bedienung in einfacher Sprache (seit Version 2.0: Schritt für Schritt)

Das Tool zeigt immer **nur einen Bildschirm**. Oben siehst du, in welchem Schritt du bist (Haken = erledigt). Unten links ist **„← Zurück“** (nichts geht dabei verloren), unten rechts der **eine Hauptknopf** für den nächsten Schritt.

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
- **„Erweitert“** klappt auf:
  - Kontaktdaten (E-Mail, Telefon, IBAN, Adresse) und unsichere Treffer an/aus
  - Platzhalter „[NAME]“ statt „Person A“
  - Eigene Namen und Ausnahmen
  - Merkliste speichern/laden/löschen und der Schalter „im Browser speichern“ (Standard aus)

**2. Prüfen: „Stimmen die gefundenen Namen?“**
- Links steht der Text. Tabellen bleiben als Zeilen erkennbar; Kopfzeilen, Fußnoten, Kommentare und Excel-Blätter haben eine kleine Überschrift.
- Farben und Formen:

  | Darstellung | Bedeutung |
  |---|---|
  | gelbe Fläche | sicher |
  | orange Fläche mit gestricheltem Rand | unsicher |
  | blaue Fläche mit Unterstrich | von dir markiert |
  | grauer Rahmen | Kontaktdaten |
  | grau durchgestrichen | aus |

- Einen Treffer **antippen** schaltet ihn an oder aus.
- Einen **nicht erkannten Namen** antippen oder markieren: Direkt daneben erscheint **„Als Name markieren“**. Danach wird er **überall** ersetzt, auch mit Endung („Müllers“) und in GROSSSCHREIBUNG.
- **Fragekarte** rechts: Das Tool fragt bei jedem unsicheren Wort bzw. jeder unsicheren Person **einmal**: „Ist „…“ hier ein Name?“.
  - **„Ja, Name“** schaltet alle unsicheren Stellen dieses Worts bzw. dieser Person an, **„Nein“** schaltet sie aus. **Sicher erkannte Stellen derselben Person bleiben in jedem Fall an**; ein „Nein“ gibt also keinen sicher erkannten Namen frei.
  - Am PC gehen auch die Tasten **J** und **N**, aber nur auf diesem Bildschirm und nicht, während du in einem Eingabefeld bist.
  - Namen aus den **Dateiangaben** (Autor, Bearbeiter, Firma, Kommentar-Autoren, SharePoint-Personen) erscheinen ebenfalls als Frage: „Als Namen übernehmen?“. Aus der Datei werden sie so oder so entfernt; mit „Ja“ werden sie auch im Text ersetzt.
- **Personenliste**:
  - eine Zeile pro Person mit Schalter und Trefferzahl
  - hinter **„⋯“**: Schreibweisen, Zuordnung lösen, **zusammenführen mit …**, **nie anonymisieren**, **für nächstes Mal merken** (kommt in „Eigene Namen“)
- Weiter geht es auch mit offenen Fragen; beim Speichern musst du das dann ausdrücklich bestätigen.

**3. Speichern: „Letzter Blick, dann speichern“**
- Eine **Ampel-Liste**: grün mit Haken = in Ordnung, bernstein mit Ausrufezeichen = hier ist etwas zu tun.
  - ersetzte Personen und Stellen
  - **Fragen**: offene Fragen musst du beantworten oder ausdrücklich bestätigen
  - versteckte Angaben werden geleert (nur Word/Excel)
  - jeder **Hinweis zur Datei** mit einem Haken **„Gelesen“**; erst wenn alle abgehakt sind, wird gespeichert
  - **Bilder** (nur Word/Excel, seit Version 2.2): „3 Bilder im Dokument“ mit dem Knopf **„Bilder ansehen“** (siehe unten). Erst nachdem du die Liste geöffnet hast, kannst du abhaken: **„Ich habe die Bilder angesehen. Darauf steht kein Name.“** Vorher wird nicht gespeichert.
  - **Schlüsseldatei** (nur rückbaufähig)
  - **Schlusscheck**: Alle bestätigten Namen und alle Namen aus den Dateiangaben werden in **allen Teilen** der Ausgabe noch einmal gesucht (Text, Dateieigenschaften, SharePoint-Daten, Bilder …). Bei jedem Fund steht, **wo** er steht (z. B. „steht in: Kopfzeile“). Du kannst ihn **„als Namen übernehmen“** (dann wird er überall ersetzt) oder **bewusst stehen lassen** (abhaken). Vorher wird nicht gespeichert.
- **Dateikarten:**
  - „Für die KI“ mit dem Namen der anonymisierten Datei (immer neutral: „anonymisiert_…“; bei rückbaufähig mit Kennung, z. B. „anonymisiert_K7F3.docx“)
  - nur bei rückbaufähig zusätzlich rot: **„Bleibt auf diesem PC · enthält echte Namen“** mit der Schlüsseldatei
- **Hauptknopf:**
  - Bei „anonym reicht“: **„Datei speichern“**. Das Format passt zur Eingabe: Word → .docx, Excel → .xlsx, CSV → .csv, Text und PDF → .txt.
  - Bei rückbaufähig zwei nummerierte Knöpfe: erst **„1 Schlüssel speichern“**, dann **„2 Datei speichern“**. Der zweite geht erst nach dem ersten. Änderst du danach noch Treffer, bekommt das Dokument eine **neue Kennung** und du musst den Schlüssel erneut speichern.
- **„Andere Wege“** (klein): „Nur Text kopieren“, „Als .txt speichern“, „Als .docx speichern“ und die **Zuordnungstabelle** (nur bei „anonym reicht“; enthält echte Namen, eigene Datei mit Warnhinweis). Für alle Wege gelten dieselben Sperren.
- **Danach:**
  - der Hinweis „Lade die Datei direkt hoch. Wenn du sie vorher in Word (Excel) öffnest und speicherst, trägt Word (Excel) deinen Namen wieder ein.“
  - der Knopf **„Hinweis für die KI kopieren“**. Er kopiert einen Satz, der die KI bittet, die Platzhalter nie zu verändern und nur Fehler zu zeigen. Geht das Kopieren nicht, steht der Satz zum Markieren da.
- Nach dem Speichern: Bestätigung in der Ampel und **„Nächstes Dokument“**. Das verwirft alles Geladene und führt zum Start; die Merkliste und die Einstellungen bleiben.

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

### Eigene Namen und Ausnahmen (unter „Erweitert“)
- **Eigene Namen (Merkliste):** Namen, die das Tool nicht kennt. Sie werden bei jedem weiteren Dokument automatisch mit ersetzt. Auch „Als Name markieren“ und „für nächstes Mal merken“ tragen dort ein.
  - **Achtung: Die Liste enthält echte Namen.**
  - Sie bleibt auch nach „Nächstes Dokument“ bestehen, und zwar so lange, bis du den Tab (bzw. den Browser) schließt oder sie löschst („Merkliste löschen“ oder einzelne Namen mit „×“ entfernen).
  - Nur wenn du den Schalter „im Browser speichern“ einschaltest, bleibt sie auch nach dem Schließen erhalten, bis du sie löschst.
- **Ausnahmen:** Wörter, die nie ersetzt werden sollen (z. B. ein Firmenname).
- **Gespeichert wird nur auf ausdrücklichen Wunsch:** als Datei („Merkliste als Datei speichern“) oder im Browser (Schalter, **Standard: aus**). Die Liste **enthält echte Namen**. „Merkliste löschen“ entfernt alles, auch aus dem Browser.

### Einstellungen (unter „Erweitert“)
- Zusätzlich ersetzen (einzeln schaltbar, Standard: an): E-Mail, Telefon, IBAN (mit Prüfziffer), Adresse/PLZ.
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
- Kontaktdaten werden nummeriert: [E-MAIL-1], [TELEFON-2], [IBAN-1], [ADRESSE-1]. Gleicher Wert bekommt die gleiche Nummer.

**Kennung (seit Version 2.1)**
- Jede rückbaufähige Anonymisierung bekommt eine **Kennung** aus 4 Zeichen, z. B. **K7F3**. Die Dateien heißen dann `anonymisiert_K7F3.docx` und `schluessel_K7F3.json`. So siehst du sofort, was zusammengehört.
- In Word- und Excel-Dateien steht die Kennung zusätzlich **unsichtbar in den Dateieigenschaften**. Sie bleibt also auch erhalten, wenn du die Datei umbenennst (in LibreOffice auch nach Bearbeiten und Speichern geprüft).
- **Jede Anonymisierung bekommt eine neue Kennung**, auch wenn du dieselbe Datei noch einmal lädst oder nach dem Schlüssel noch einen Treffer änderst. Warum? Zwei verschiedene Schlüssel dürfen nie dieselbe Kennung haben. Nur so erkennt der Rückbau einen **vertauschten** oder einen **veralteten** Schlüssel sicher, auch bei Dokumenten nach derselben Vorlage.
- Die Kennung ist **reiner Zufall**. Nichts aus dem Dokument geht ein (kein Text, kein Name, kein Dateiname, keine Uhrzeit). Aus der Kennung lässt sich also nichts über den Inhalt ableiten.
- Beim Rückbau zeigt die Ampel eine Zeile **„Kennung“**:
  - grün: „Kennung K7F3 passt“
  - rot: „Diese Schlüsseldatei gehört zu einem anderen Dokument“. Weiter geht es erst nach ausdrücklicher Bestätigung.
  - gelb: „Im Dokument steht keine Kennung“ (z. B. umbenannte Textdatei, eingefügter Text). Du prüfst selbst und hakst ab.
  - gelb: „Schlüssel ohne Kennung“ (Schlüssel von vor Version 2.1). Der Rückbau geht wie bisher.
  - Widersprechen sich Eigenschaft und Dateiname, gilt die Eigenschaft; der Widerspruch wird angezeigt.
- **Grenzen:** Bei **eingefügtem Text** und bei **umbenannten .txt/.csv-Dateien** steht die Kennung nirgends im Dokument; dann kann das Tool einen Vertausch nicht erkennen und fragt nur nach. Alte Schlüssel (vor 2.1) haben keine Kennung. Die Kennung schützt vor Verwechslung, nicht vor Absicht.

**Ablauf**
1. Anonymisieren mit der Antwort **„Ja, ich baue sie später zurück“**. Im Schritt „Speichern“ erst **„1 Schlüssel speichern“**, dann **„2 Datei speichern“**. **Ohne die Schlüsseldatei ist kein Rückbau möglich.**
2. Die anonymisierte Datei bearbeiten oder prüfen lassen. Platzhalter dabei möglichst **unverändert** lassen („Hinweis für die KI kopieren“ hilft).
3. Start → **„Dokument zurückbauen“**. Schritt **„Dateien“**: links die bearbeitete Datei (.txt, .docx, .xlsx, .csv oder eingefügter Text), rechts die Schlüsseldatei. Probleme (z. B. alte CSV-Zuordnung statt Schlüsseldatei) stehen direkt am Feld. „Weiter“ geht erst mit beiden Dateien.
4. Schritt **„Prüfen“**: der **Rückbau-Bericht** als Ampel-Liste.
   - Je Platzhalter steht, wie oft er erwartet und gefunden wurde.
   - Auffällige Stellen werden mit Fundstelle gezeigt: veränderte („nachname a“), gebeugte („des Nachnamens A“), getrennte (Zeilenumbruch) und unbekannte Platzhalter. Sie werden **nicht** geraten, sondern bleiben stehen.
   - Bei Auffälligkeiten musst du bestätigen, erst dann geht es weiter.
   - Passt die Schlüsseldatei gar nicht, geht es nicht weiter.
5. Schritt **„Speichern“**: **„Wiederhergestellte Datei speichern“**.
   - Gleiches Format, Dateiname „wiederhergestellt_…“. Alle deine Änderungen, die Formatierung und die Zellstruktur bleiben erhalten.
   - Vor dem Speichern prüft ein **Schlusscheck**, ob noch Platzhalter aus der Schlüsseldatei übrig sind. Wenn ja, wird erst nach Bestätigung gespeichert.
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
- Steht im **Original schon Text, der wie ein Platzhalter aussieht** (z. B. „Nachname A“), warnt das Tool vor dem Export, weil der Rückbau ihn ebenfalls ersetzen würde.
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
- Eingebettete Objekte (z. B. eine Excel-Tabelle in Word) werden **geleert**, weil ihr Inhalt nicht geprüft werden kann (Hinweis erscheint)

---

## Wie erkennt das Tool Namen? (regelbasiert, deterministisch)

- **Namenslisten** (siehe Lizenzen): rund 20 000 Vornamen- und 21 000 Nachnamen-Schreibweisen aus vielen Ländern, Vergleich ohne Akzente (Müller = Muller = Mueller, Yılmaz = Yilmaz). Unicode wird auf NFC normalisiert.
- **Anreden und Titel:** Herr, Frau, Dr., Prof., Dipl.-Ing., Mr., Mrs., Familie … → das folgende großgeschriebene Wort ist ein Name, auch wenn es in keiner Liste steht. Rollen wie „Kollegin“, „Mandant“, „Sohn“ sind schwächere Hinweise.
- **Muster:** Vorname Nachname, „Nachname, Vorname“, Initialen („M. Müller“), Bindestrich-Namen, GROSSSCHREIBUNG, Namenszusätze (von, van der, de la, al-, bin, ibn …), typische Endungen (-ović, -ski, -oğlu, -ov/-ova, -enko, -escu, -poulos, -yan, -shvili, -zadeh …), nachgestellte Anreden („Ahmet Bey“).
- **Endungen:** „Müllers“, „John’s“ werden mit dem Grundnamen erkannt.
- **Allerweltswörter** („Rose“, „Mark“, „Winter“, „Paris“, „Koch“ …): nur im Namenskontext sicher, sonst **unsicherer Treffer**.
- **Anrede allein (seit Version 1.2):** Steht in einem Absatz, einer Zeile oder einer Zelle **nur** „Herr“, „Frau“ (auch „Hr.“, „Fr.“, „Frau Dr.“, „Herr Prof. Dr.“ …), dann gilt der Anfang der **direkt folgenden** Einheit als Name. Er wird **immer ersetzt**:
  - in Word: der nächste Absatz (in derselben Zelle oder im Fließtext) oder die **rechte Nachbarzelle** derselben Tabellenzeile;
  - in TXT: die nächste Zeile; in CSV: das rechte Nachbarfeld.
  - **Enge Grenze:** Die Zeile muss **ganz** aus 1 bis 3 großgeschriebenen Namenswörtern bestehen (dazu Initialen und Zusätze wie „von“, „van der“, „al-“). Danach sind nur Satzzeichen erlaubt. Kommt danach noch Text, eine Zahl oder ein Datum, greift die Regel nicht.
  - Ein **leerer Absatz**, eine **leere Zelle**, das **Zeilen- oder Tabellenende** und **Word-Überschriften** unterbrechen die Regel. Wörter von der Liste der Allerweltswörter (z. B. „Berlin“, „Montag“) lösen sie nicht aus.
  - **Markierung:** Steht das Wort in einer Namensliste (z. B. „Kubik“) oder sind es mehrere Wörter (z. B. „Lieselotte Steineck“), ist der Treffer **„sicher“** (wie bisher). Ist es **ein einzelnes unbekanntes Wort** (z. B. „Hartung“, aber auch „Mathematik“ oder „Turnhalle“), wird es ersetzt und als **„unsicher, an“** markiert (gestrichelt). Ein Fehltreffer aus dieser Regel ist also nie „sicher“.
  - **Übertragung:** Ein solches „unsicher, an“ markiertes Wort wird im **ganzen Dokument** ersetzt, auch mit Endung („Hartungs“), in GROSSSCHREIBUNG, in Kopf- und Fußzeilen und Fußnoten, immer mit demselben Platzhalter und ebenfalls „unsicher, an“. Treffer, die nicht aus dieser Regel stammen, ändern sich dadurch nicht.
  - **Ein Klick für alle:** Tippt man im Schritt „Prüfen“ eines dieser Vorkommen an, gehen **alle** Vorkommen des Worts aus (bzw. wieder an).
- **Wochentage und Monate (seit Version 1.2):** „Montag“ … „Sonntag“, „Januar“ … „Dezember“ (auch „Jänner“, „Feber“) und Abkürzungen **mit Punkt** („Mo.“, „Jan.“, „Sept.“ …) werden **nicht automatisch ersetzt**, wenn sie allein stehen (ohne Anrede, ohne Namen daneben). Sie erscheinen im Schritt „Prüfen“ als „unsicher, aus“ und lassen sich einschalten. „Herr Montag“ oder „Trần Thị Mai“ gelten weiter als Name. „Jan“ ohne Punkt bleibt ein Vorname.
- **Gleiche Person = gleiches Pseudonym** im ganzen Dokument. „Herr Yılmaz“ wird „Mehmet Yılmaz“ zugeordnet, wenn der Nachname eindeutig ist (im Schritt „Prüfen“ sichtbar und lösbar).
- **Deterministisch:** gleiche Eingabe + gleiche Einstellungen = gleiche Pseudonyme und byte-gleiche Ausgabe (im Test per Doppellauf belegt).

---

## Grenzen (bitte lesen)

- **Bedienung (seit Version 2.0):**
  - Es gibt kein dunkles Farbschema mehr; die Farben sind fest hell.
  - Rückbaufähig wird mit zwei Klicks gespeichert („1 Schlüssel“, „2 Datei“), weil Browser zwei Downloads aus einem Klick blockieren oder nachfragen können.
- **Anrede allein, danach ein Sachwort:** Steht nach einer allein stehenden Anrede ein einzelnes Wort, das kein Name ist (z. B. ein Fach „Mathematik“, ein Ort „Lübeck“, „Turnhalle“, in TXT eine Überschrift), wird es als Name ersetzt, und zwar **überall im Dokument**. Es ist immer „unsicher“ markiert. Bitte im Schritt „Prüfen“ prüfen und mit einem Klick abschalten (dann ist es überall wieder Klartext).
- **Mitgenommenes Nachbarwort:** Steht ein übertragenes Wort direkt hinter einem unbekannten großgeschriebenen Wort (z. B. „Treffpunkt Turnhalle“), wird das Nachbarwort mit ersetzt, wie bei der bisherigen Übertragung von Namen. Auch das ist „unsicher“ markiert und geht mit dem Klick aus.
- **Wort schon anderweitig als Name bekannt:** Ist dasselbe Wort im Dokument schon durch einen anderen sicheren Treffer bekannt (z. B. „Anna Hartung“), gilt für die weiteren Vorkommen die bisherige Übertragung dieses Namens („sicher“).
- **Anrede allein in Excel:** Die Regel gilt dort (noch) nicht. Ein Name in der Nachbarzelle einer Anrede-Zelle wird nur erkannt, wenn er in einer Namensliste steht.
- **Anrede allein ohne direkte Folge:** Ein leerer Absatz, eine leere Zelle oder ein Zeilenende zwischen Anrede und Name unterbricht die Regel (der Name wird dann nur erkannt, wenn er in einer Liste steht).
- **Personen mit Monatsnamen** („Mai“, „April“, „August“): Stehen sie allein ohne Anrede, ist der Treffer standardmäßig aus. Im Schritt „Prüfen“ prüfen und einschalten.
- **Nie 100 %.** Seltene Namen, die in keiner Liste stehen und ohne Anrede vorkommen (im Test z. B. „Ijeoma Uchendu“, „Xiong Wenjie“), werden **nicht** erkannt → im Schritt „Prüfen“ von Hand markieren.
- **Fehltreffer** sind möglich (z. B. „Bill“ in „engl. Bill“, ein Tabellenkopf „Name“). Sie sind meist als „unsicher“ markiert und lassen sich abschalten.
- **Kleingeschriebene Namen** werden nur gefunden, wenn derselbe Name schon anderswo erkannt oder von Hand markiert wurde.
- **Namen in E-Mail-Adressen**, wenn die E-Mail-Erkennung ausgeschaltet ist, und Namen in Wortzusammensetzungen („Müllerstraße“, „Schmidt-Gruppe“ teilweise) werden nicht ersetzt.
- **Chinesische, japanische, koreanische und thailändische Schrift** (ohne Leerzeichen zwischen Wörtern): Namen in Originalschrift werden nicht erkannt. Arabische, kyrillische, griechische und hebräische Schrift werden über Listen teilweise erkannt.
- **Bildinhalt** wird nie verändert und nicht automatisch geprüft (Namen in Fotos, Scans, Unterschriften, Logos). Du siehst jedes Bild vor dem Speichern in der Liste „Bilder ansehen“ und bestätigst es. Die versteckten Bildangaben werden bei JPEG, PNG und GIF entfernt, bei anderen Bildtypen nicht (Hinweis erscheint, der Schlusscheck sucht trotzdem).
- **Bilder, die der Browser nicht zeigen kann** (EMF, WMF, TIFF …), und **verknüpfte Bilder** musst du in Word bzw. Excel selbst ansehen.
- **Kopf-/Fußzeilenbilder in Excel:** Ihr Titel wird nur dann als Bildbeschreibung geprüft, wenn der zugehörige Teil sauberes XML ist (bei Excel-Dateien der Regelfall). Sonst sucht der Schlusscheck trotzdem darin nach bestätigten Namen.
- **Fundstelle im Schlusscheck:** Steht ein übersehener Name in einer Bildbeschreibung, nennt der Schlusscheck den Teil der Datei (z. B. „Text“), nicht das Wort „Bildbeschreibung“; der angezeigte Ausschnitt zeigt die Beschreibung.
- **Word/Excel tragen beim Speichern den eigenen Namen wieder ein.** Die anonymisierte Datei deshalb direkt hochladen, nicht vorher in Word/Excel öffnen und speichern.
- **SharePoint-Felder, die an Inhaltssteuerelemente im Text gebunden sind:** Wird so ein Feld geleert, kann Word beim Öffnen auch den gebundenen Text im Dokument leer anzeigen (durch Code ungeprüft).

### Alle Stellen mit möglichen Klarnamen (.docx/.xlsx), Stand Version 2.2

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
| Kopf-/Fußzeilen, Fußnoten, Kommentartext, Textfelder | ja, gleiche Erkennung wie der Haupttext |
| Feldfunktionen, Links, Vorlagenpfad | teilweise: erkannte Namen und Benutzerordner |
| Literaturangaben (Quellen-Autoren in `customXml`) | teilweise: nur erkannte Namen (**offen**) |
| Eingebettete Objekte | ja (werden geleert, mit Hinweis) |
| Excel: Zellen, ausgeblendete Blätter, Blattnamen, Kopfzeilen | ja |
| Excel: Pivot-Zwischenspeicher, externe Verknüpfungen | teilweise |
| **Schlusscheck** | durchsucht **alle** Teile der Ausgabedatei nach bestätigten Namen und Namen aus den Dateiangaben, auch in Bildern (Text in UTF-8/UTF-16, entpackte PNG-Textblöcke) |
- **PDF:** nur Textebene; gescannte Seiten fehlen (es wird gewarnt); das Layout geht verloren; schlecht kodierte PDFs liefern unlesbaren Text (es wird gewarnt).
- **Pivot-Tabellen** in Excel: Werte im Zwischenspeicher werden ersetzt; bitte nach dem Öffnen aktualisieren und prüfen.
- **Dateigröße:** Grenze 20 MB, Warnhinweis ab 5 MB. Gemessen am Desktop (Chromium, headless): 1 MB Text ≈ 3 s Analyse + 3 s Export (≈ 80 MB Arbeitsspeicher); 10 MB Text ≈ 50 s + 30 s (≈ 560 MB); Excel mit 20 000 Zeilen ≈ 8 s + 17 s (≈ 260 MB).
  **Realistische Grenze für das iPhone (ungeprüft, geschätzt): bis etwa 2–5 MB Text bzw. ca. 20 000 Excel-Zeilen.** Darüber kann der Safari-Tab sehr langsam werden oder abstürzen.

## Browser

| Browser | Status |
|---|---|
| Chromium/Chrome (Desktop) | **geprüft** (automatische Tests, headless) |
| Chromium mit 390, 1280 und 1920 px Breite | **geprüft** (kein waagrechtes Scrollen, Knöpfe mindestens 44 px, Antippen, Markieren, Tasten J/N) |
| Edge und Chrome unter Windows (Firmen-PC, `file://`) | Version 1.0 laut Easy **am PC geprüft**; Versionen 1.1 bis 2.2 **durch Code ungeprüft** |
| Microsoft Word / Excel: Öffnen der bereinigten Datei ohne Reparatur-Meldung | **durch Code ungeprüft** (auch die unsichtbare Kennung, seit 2.1). Geprüft: LibreOffice öffnet alle Ausgaben, alle XML-Teile sind wohlgeformt, keine Verweise ins Leere |
| Firefox (Desktop) | **ungeprüft** |
| Safari (macOS) | **ungeprüft** |
| Safari auf dem iPhone | **ungeprüft**. Code ist auf Safari ≥ 15 ausgelegt (keine Lookbehind-Regex, keine neueren Sprachfunktionen). |

**iPhone-Hinweis (ungeprüft):** Öffnet man `index.html` aus der Dateien-App, zeigt iOS oft nur eine **Vorschau ohne JavaScript**. Das Tool funktioniert dann nicht.
Die Datei muss in einem Browser geöffnet werden (z. B. über „Teilen → in Safari öffnen“, falls angeboten, oder über eine App, die lokale HTML-Dateien im Browser öffnet).

---

## Version und Prüfsumme

Version **2.2.0**, Stand 2026-11-20 (steht auch im Fußbereich des Tools).

SHA-256 der `index.html` dieser Version:

```
7a3445ae6f77f61f85d55bc180ce73d60a75b6f2dd7a713dc35c176a160eb222
```

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
node tests/make-bilder.mjs   # Bilder-Testdokumente: Word/Excel mit Bildern in Text, Kopfzeile, Tabelle, Name nur im Alt-Text/Titel, EMF, verknüpft, SVG (erfunden)
node tests/bilder-test.mjs <index.html-2.1>  # Bilder: Liste, Kacheln, Sperre, Bildbeschreibungen, Kreislauf, Breiten → tests/BILDER-REPORT.md
node tests/make-kennung.mjs  # Vertausch-Testpaar: gleiche Vorlage, andere (erfundene) Personen, vier Formate
node tests/kennung-test.mjs <index.html-2.0>  # Kennung: Vertausch, Veraltet, Umbenennen, Alt-Schlüssel, LibreOffice, Zufall → tests/KENNUNG-REPORT.md
```

Aufbau: `src/core` (Erkennung, Muster, Namenslisten-Zugriff, `reversible.js` = Modus rückbaufähig und Schlüsseldatei, `restore.js` = Rückbau), `src/formats` (TXT/CSV/DOCX/XLSX/PDF, `meta.js` = versteckte Angaben: Dateieigenschaften, SharePoint-Felder, Bild-Metadaten, `images.js` = Bilderliste und Bildbeschreibungen), `src/ui` (Oberfläche mit den Bildschirmen Start/Datei/Prüfen/Speichern und Rückbau, Netzwerksperre, Vorlage, Stil), `build/` (Build-Skripte), `tests/` (Testdaten, Tests, Bericht).
