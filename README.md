# Anonymisierer

Ein Werkzeug, das **Klarnamen** in Texten und Dokumenten durch Pseudonyme ersetzt („Person A“, „Person B“ … oder „[NAME]“).
Im Modus **rückbaufähig** kann eine anonymisierte und danach bearbeitete Datei später wieder mit den Klarnamen versehen werden (**Rückbau**).
Es ist **eine einzige Datei: `index.html`**. Sie läuft komplett im Browser und **sendet nichts ins Internet**.

> **Wichtig:** Das Tool findet nie 100 % der Namen. **Die Prüfansicht vor dem Export ist Pflicht.**
> Lesen Sie das Ergebnis immer selbst durch, bevor Sie es weitergeben.

---

## Bedienung in einfacher Sprache

1. **`index.html` öffnen.** Doppelklick am Computer: Die Datei öffnet sich im Browser. Eine Internetverbindung wird nicht gebraucht.
2. **Art der Ersetzung wählen** (oben in „1. Eingabe“): „Person A, Person B, …“ (Standard), „[NAME]“ oder **„rückbaufähig“**. Wählen Sie „rückbaufähig“, wenn Sie die Datei später wieder mit Klarnamen brauchen.
3. **Eingabe:** Datei in das Feld ziehen **oder** „Datei auswählen“ tippen **oder** Text in das Textfeld einfügen und „Text prüfen“ drücken.
4. **Prüfansicht (Pflicht):**
   - Gelb = sicherer Treffer, orange mit gestricheltem Rand = unsicherer Treffer, blau = Kontaktdaten, grau durchgestrichen = ausgeschaltet.
   - Einen Treffer **antippen** schaltet ihn an oder aus.
   - Ein **nicht erkannter Name**: Wort antippen (oder Text markieren) → unten erscheint **„Als Name markieren“**. Danach werden **alle** Vorkommen im Dokument ersetzt, auch mit Endungen („Müllers“) und unabhängig von Groß-/Kleinschreibung.
   - Rechts bzw. unten steht die Liste der **Personen** mit Trefferzahl. Dort kann man eine Person ganz ausschalten, zwei Personen zusammenführen, eine automatische Zuordnung („Herr Yılmaz“ → „Mehmet Yılmaz“) lösen oder ein Wort auf „nie anonymisieren“ setzen.
   - Gelbe Hinweise zur Datei (z. B. „ausgeblendete Blätter“, „Bilder werden nicht geprüft“) müssen abgehakt werden.
   - **„In den Dateiangaben gefunden: …“** (seit Version 1.3): Namen aus den versteckten Angaben der Originaldatei (Autor, zuletzt bearbeitet von, Manager, Firma, Kommentar- und Änderungsautoren, SharePoint-Personen). Sie werden beim Export aus der Datei entfernt, im Text aber **nicht** automatisch ersetzt. Kommt so ein Name auch im Text vor: „als Namen übernehmen“ tippen.
5. **Export:** „Text kopieren“, „.txt speichern“, „.docx speichern“ (bei Excel: „.xlsx speichern“, bei CSV: „.csv speichern“).
   Vor jedem Export läuft ein **Schlusscheck**: Alle bestätigten Namen **und alle Namen aus den Dateiangaben** werden im Ergebnis noch einmal gesucht, und zwar in **allen Teilen** der Datei (Text, Dateieigenschaften, SharePoint-Daten, Bilder, Kommentare …).
   Findet er etwas, wird der Export **blockiert**, bis Sie die Fundstellen angesehen und bestätigt haben. Bei jedem Fund steht in einfacher Sprache, **wo** der Name steht (z. B. „steht in: Kopfzeile“ oder „steht in: Bild (versteckte Bildangaben)“). Außerdem steht dort, **was man tun kann**:
   - **„als Namen übernehmen“** (Knopf bei Namen aus den Dateiangaben): Der Name wird überall in der Datei ersetzt.
   - **bewusst stehen lassen:** abhaken und erneut speichern.

   Auch ein **Firmenname** aus den Dateiangaben wird gemeldet, wenn er sichtbar im Text steht (z. B. in der Kopfzeile). Steht er in der Liste „Eigene Namen“, wird er überall ersetzt, und der Schlusscheck bleibt still.
   Der Dateiname ist immer neutral („anonymisiert_…“).
   Nach dem Speichern von .docx/.xlsx erscheint: „Lade die Datei direkt hoch. Wenn du sie vorher in Word öffnest und speicherst, trägt Word deinen Namen wieder ein.“ (bei Excel entsprechend).
6. **Zuordnungstabelle** (nur Modus „Person A“/„[NAME]“; welches Pseudonym zu welchem Namen gehört) gibt es nur auf ausdrücklichen Klick, als **separate** Datei mit Warnhinweis. Sie steht nie im anonymisierten Dokument.

### Eigene Namen und Ausnahmen
- **Eigene Namen (Merkliste):** Namen, die das Tool nicht kennt. Sie werden bei jedem weiteren Dokument automatisch mit ersetzt.
- **Ausnahmen:** Wörter, die nie ersetzt werden sollen (z. B. ein Firmenname).
- **Gespeichert wird nur auf ausdrücklichen Wunsch:** als Datei („Merkliste als Datei speichern“) oder im Browser (Schalter, **Standard: aus**). Die Liste **enthält echte Namen**. „Merkliste löschen“ entfernt alles, auch aus dem Browser.

### Einstellungen
- Art der Ersetzung: siehe oben (sichtbar vor dem Anonymisieren).
- Zusätzlich ersetzen (einzeln schaltbar, Standard: an): E-Mail, Telefon, IBAN (mit Prüfziffer), Adresse/PLZ.
- „Unsichere Treffer standardmäßig ersetzen“ (Standard: an). Ausnahme: Wörter wie „die Rose“, „im Winter“, „mit voller Kraft“ (Artikel oder Präposition davor) bleiben aus, sind aber markiert.

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

**Ablauf**
1. Modus **„rückbaufähig“** wählen, Datei laden, Prüfansicht durchgehen.
2. Exportieren **und** die **Rückbau-Schlüsseldatei** speichern (Knopf im Export-Bereich). **Ohne diese Datei ist kein Rückbau möglich.** Wenn Sie nach dem Speichern noch Treffer ändern, die Schlüsseldatei neu speichern.
3. Die anonymisierte Datei bearbeiten oder prüfen lassen. Platzhalter dabei möglichst **unverändert** lassen.
4. In **„5. Rückbau“** die bearbeitete Datei (.txt, .docx, .xlsx, .csv oder eingefügten Text) und die Schlüsseldatei laden, dann „Rückbau prüfen“.
5. Der **Rückbau-Bericht** zeigt je Platzhalter, wie oft er erwartet und gefunden wurde. Außerdem zeigt er auffällige Stellen: veränderte („nachname a“), gebeugte („des Nachnamens A“), getrennte (Zeilenumbruch) und unbekannte Platzhalter. Auffällige Stellen werden **nicht** geraten, sondern bleiben stehen. Bei Auffälligkeiten muss bestätigt werden.
6. Speichern: gleiches Format, Dateiname „wiederhergestellt_…“. Alle Ihre Änderungen, die Formatierung und die Zellstruktur bleiben erhalten. Vor dem Speichern prüft ein **Schlusscheck**, ob noch Platzhalter aus der Schlüsseldatei übrig sind. Wenn ja, wird gewarnt und erst nach Bestätigung gespeichert.

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
- Eine Schlüsseldatei einer **anderen, gleich aufgebauten Datei** (gleiche Personenzahl, gleiche Häufigkeiten) kann nicht sicher erkannt werden.
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
  - **Ein Klick für alle:** Tippt man in der Prüfansicht eines dieser Vorkommen an, gehen **alle** Vorkommen des Worts aus (bzw. wieder an).
- **Wochentage und Monate (seit Version 1.2):** „Montag“ … „Sonntag“, „Januar“ … „Dezember“ (auch „Jänner“, „Feber“) und Abkürzungen **mit Punkt** („Mo.“, „Jan.“, „Sept.“ …) werden **nicht automatisch ersetzt**, wenn sie allein stehen (ohne Anrede, ohne Namen daneben). Sie erscheinen in der Prüfansicht als „unsicher, aus“ und lassen sich einschalten. „Herr Montag“ oder „Trần Thị Mai“ gelten weiter als Name. „Jan“ ohne Punkt bleibt ein Vorname.
- **Gleiche Person = gleiches Pseudonym** im ganzen Dokument. „Herr Yılmaz“ wird „Mehmet Yılmaz“ zugeordnet, wenn der Nachname eindeutig ist (in der Prüfansicht sichtbar und lösbar).
- **Deterministisch:** gleiche Eingabe + gleiche Einstellungen = gleiche Pseudonyme und byte-gleiche Ausgabe (im Test per Doppellauf belegt).

---

## Grenzen (bitte lesen)

- **Anrede allein, danach ein Sachwort:** Steht nach einer allein stehenden Anrede ein einzelnes Wort, das kein Name ist (z. B. ein Fach „Mathematik“, ein Ort „Lübeck“, „Turnhalle“, in TXT eine Überschrift), wird es als Name ersetzt, und zwar **überall im Dokument**. Es ist immer „unsicher“ markiert. Bitte in der Prüfansicht prüfen und mit einem Klick abschalten (dann ist es überall wieder Klartext).
- **Mitgenommenes Nachbarwort:** Steht ein übertragenes Wort direkt hinter einem unbekannten großgeschriebenen Wort (z. B. „Treffpunkt Turnhalle“), wird das Nachbarwort mit ersetzt, wie bei der bisherigen Übertragung von Namen. Auch das ist „unsicher“ markiert und geht mit dem Klick aus.
- **Wort schon anderweitig als Name bekannt:** Ist dasselbe Wort im Dokument schon durch einen anderen sicheren Treffer bekannt (z. B. „Anna Hartung“), gilt für die weiteren Vorkommen die bisherige Übertragung dieses Namens („sicher“).
- **Anrede allein in Excel:** Die Regel gilt dort (noch) nicht. Ein Name in der Nachbarzelle einer Anrede-Zelle wird nur erkannt, wenn er in einer Namensliste steht.
- **Anrede allein ohne direkte Folge:** Ein leerer Absatz, eine leere Zelle oder ein Zeilenende zwischen Anrede und Name unterbricht die Regel (der Name wird dann nur erkannt, wenn er in einer Liste steht).
- **Personen mit Monatsnamen** („Mai“, „April“, „August“): Stehen sie allein ohne Anrede, ist der Treffer standardmäßig aus. In der Prüfansicht prüfen und einschalten.
- **Nie 100 %.** Seltene Namen, die in keiner Liste stehen und ohne Anrede vorkommen (im Test z. B. „Ijeoma Uchendu“, „Xiong Wenjie“), werden **nicht** erkannt → in der Prüfansicht von Hand markieren.
- **Fehltreffer** sind möglich (z. B. „Bill“ in „engl. Bill“, ein Tabellenkopf „Name“). Sie sind meist als „unsicher“ markiert und lassen sich abschalten.
- **Kleingeschriebene Namen** werden nur gefunden, wenn derselbe Name schon anderswo erkannt oder von Hand markiert wurde.
- **Namen in E-Mail-Adressen**, wenn die E-Mail-Erkennung ausgeschaltet ist, und Namen in Wortzusammensetzungen („Müllerstraße“, „Schmidt-Gruppe“ teilweise) werden nicht ersetzt.
- **Chinesische, japanische, koreanische und thailändische Schrift** (ohne Leerzeichen zwischen Wörtern): Namen in Originalschrift werden nicht erkannt. Arabische, kyrillische, griechische und hebräische Schrift werden über Listen teilweise erkannt.
- **Bildinhalt** wird nicht geprüft (Namen in Fotos, Scans, Unterschriften, Logos). Die versteckten Bildangaben werden bei JPEG, PNG und GIF entfernt, bei anderen Bildtypen nicht (Hinweis erscheint, der Schlusscheck sucht trotzdem).
- **Word/Excel tragen beim Speichern den eigenen Namen wieder ein.** Die anonymisierte Datei deshalb direkt hochladen, nicht vorher in Word/Excel öffnen und speichern.
- **SharePoint-Felder, die an Inhaltssteuerelemente im Text gebunden sind:** Wird so ein Feld geleert, kann Word beim Öffnen auch den gebundenen Text im Dokument leer anzeigen (durch Code ungeprüft).

### Alle Stellen mit möglichen Klarnamen (.docx/.xlsx), Stand Version 1.3

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
| Alt-Texte von Bildern und Formen | teilweise: nur Namen, die auch im Text erkannt wurden (**offen**) |
| Bildinhalt (Logo, Fotos, Scans) | **nein**, nur ein allgemeiner Hinweis (**offen**) |
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
| Chromium mit iPhone-Bildschirmgröße und Touch | **geprüft** (Darstellung, Antippen, Markieren) |
| Edge und Chrome unter Windows (Firmen-PC, `file://`) | Version 1.0 laut Easy **am PC geprüft**; Versionen 1.1, 1.2 und 1.3 **durch Code ungeprüft** |
| Microsoft Word / Excel: Öffnen der bereinigten Datei ohne Reparatur-Meldung | **durch Code ungeprüft**. Geprüft: LibreOffice öffnet alle Ausgaben, alle XML-Teile sind wohlgeformt, keine Verweise ins Leere |
| Firefox (Desktop) | **ungeprüft** |
| Safari (macOS) | **ungeprüft** |
| Safari auf dem iPhone | **ungeprüft**. Code ist auf Safari ≥ 15 ausgelegt (keine Lookbehind-Regex, keine neueren Sprachfunktionen). |

**iPhone-Hinweis (ungeprüft):** Öffnet man `index.html` aus der Dateien-App, zeigt iOS oft nur eine **Vorschau ohne JavaScript**. Das Tool funktioniert dann nicht.
Die Datei muss in einem Browser geöffnet werden (z. B. über „Teilen → in Safari öffnen“, falls angeboten, oder über eine App, die lokale HTML-Dateien im Browser öffnet).

---

## Version und Prüfsumme

Version **1.3.0**, Stand 2026-11-20 (steht auch im Fußbereich des Tools).

SHA-256 der `index.html` dieser Version:

```
47cd1b16dc0478bea4795ba326998f262975c2941f2317a1a23715cdedec18ba
```

Eine Datei kann ihre eigene Prüfsumme nicht enthalten, deshalb steht sie nur hier und im PR-Text. Prüfen unter Windows: `certutil -hashfile index.html SHA256`.

## Datenschutz und Offline-Nachweis

- **Content-Security-Policy** in der Datei: `default-src 'none'`, `connect-src 'none'`, `img-src 'none'`, `font-src 'none'`, `worker-src 'none'`, `form-action 'none'`. Skript und Stil sind nur über ihren SHA-256-Hash erlaubt (kein `unsafe-inline`, kein `unsafe-eval`).
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
node tests/run-tests.mjs     # End-to-End-Tests in Chromium → tests/REPORT.md
node tests/roundtrip.mjs     # Rückbau: Kreislauf-Beweis und Fallen → tests/ROUNDTRIP-REPORT.md
node tests/regression.mjs <alte-index.html>  # Modi „Person A“/„[NAME]“ byte-gleich zur Referenz?
```

Aufbau: `src/core` (Erkennung, Muster, Namenslisten-Zugriff, `reversible.js` = Modus rückbaufähig und Schlüsseldatei, `restore.js` = Rückbau), `src/formats` (TXT/CSV/DOCX/XLSX/PDF, `meta.js` = versteckte Angaben: Dateieigenschaften, SharePoint-Felder, Bild-Metadaten), `src/ui` (Oberfläche, Netzwerksperre, Vorlage, Stil), `build/` (Build-Skripte), `tests/` (Testdaten, Tests, Bericht).
