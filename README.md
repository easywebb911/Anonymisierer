# Anonymisierer

Ein Werkzeug, das **Klarnamen** in Texten und Dokumenten durch Pseudonyme ersetzt („Person A“, „Person B“ … oder „[NAME]“).
Es ist **eine einzige Datei: `index.html`**. Sie läuft komplett im Browser und **sendet nichts ins Internet**.

> **Wichtig:** Das Tool findet nie 100 % der Namen. **Die Prüfansicht vor dem Export ist Pflicht.**
> Lesen Sie das Ergebnis immer selbst durch, bevor Sie es weitergeben.

---

## Bedienung in einfacher Sprache

1. **`index.html` öffnen.** Doppelklick am Computer: Die Datei öffnet sich im Browser. Eine Internetverbindung wird nicht gebraucht.
2. **Eingabe:** Datei in das Feld ziehen **oder** „Datei auswählen“ tippen **oder** Text in das Textfeld einfügen und „Text prüfen“ drücken.
3. **Prüfansicht (Pflicht):**
   - Gelb = sicherer Treffer, orange mit gestricheltem Rand = unsicherer Treffer, blau = Kontaktdaten, grau durchgestrichen = ausgeschaltet.
   - Einen Treffer **antippen** schaltet ihn an oder aus.
   - Ein **nicht erkannter Name**: Wort antippen (oder Text markieren) → unten erscheint **„Als Name markieren“**. Danach werden **alle** Vorkommen im Dokument ersetzt, auch mit Endungen („Müllers“) und unabhängig von Groß-/Kleinschreibung.
   - Rechts bzw. unten steht die Liste der **Personen** mit Trefferzahl. Dort kann man eine Person ganz ausschalten, zwei Personen zusammenführen, eine automatische Zuordnung („Herr Yılmaz“ → „Mehmet Yılmaz“) lösen oder ein Wort auf „nie anonymisieren“ setzen.
   - Gelbe Hinweise zur Datei (z. B. „ausgeblendete Blätter“, „Bilder werden nicht geprüft“) müssen abgehakt werden.
4. **Export:** „Text kopieren“, „.txt speichern“, „.docx speichern“ (bei Excel: „.xlsx speichern“, bei CSV: „.csv speichern“).
   Vor jedem Export läuft ein **Schlusscheck**: Alle bestätigten Namen werden im Ergebnis noch einmal gesucht.
   Findet er etwas, wird der Export **blockiert**, bis Sie die Fundstellen angesehen und bestätigt haben.
   Der Dateiname ist immer neutral („anonymisiert_…“).
5. **Zuordnungstabelle** (welches Pseudonym zu welchem Namen gehört) gibt es nur auf ausdrücklichen Klick, als **separate** Datei mit Warnhinweis. Sie steht nie im anonymisierten Dokument.

### Eigene Namen und Ausnahmen
- **Eigene Namen (Merkliste):** Namen, die das Tool nicht kennt. Sie werden bei jedem weiteren Dokument automatisch mit ersetzt.
- **Ausnahmen:** Wörter, die nie ersetzt werden sollen (z. B. ein Firmenname).
- **Gespeichert wird nur auf ausdrücklichen Wunsch:** als Datei („Merkliste als Datei speichern“) oder im Browser (Schalter, **Standard: aus**). Die Liste **enthält echte Namen**. „Merkliste löschen“ entfernt alles, auch aus dem Browser.

### Einstellungen
- Ersetzen durch „Person A, B, …“ oder „[NAME]“.
- Zusätzlich ersetzen (einzeln schaltbar, Standard: an): E-Mail, Telefon, IBAN (mit Prüfziffer), Adresse/PLZ.
- „Unsichere Treffer standardmäßig ersetzen“ (Standard: an). Ausnahme: Wörter wie „die Rose“, „im Winter“, „mit voller Kraft“ (Artikel oder Präposition davor) bleiben aus, sind aber markiert.

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

### Was beim Export bereinigt wird (Metadaten)
- Autor, zuletzt bearbeitet von, Titel, Betreff, Stichwörter, Beschreibung, Kategorie, Firma, Manager, benutzerdefinierte Eigenschaften
- Kommentar-Autoren und Initialen, Autoren nachverfolgter Änderungen, Personenliste (inkl. E-Mail-Kennung)
- Vorschaubild (Thumbnail) wird entfernt
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
- **Gleiche Person = gleiches Pseudonym** im ganzen Dokument. „Herr Yılmaz“ wird „Mehmet Yılmaz“ zugeordnet, wenn der Nachname eindeutig ist (in der Prüfansicht sichtbar und lösbar).
- **Deterministisch:** gleiche Eingabe + gleiche Einstellungen = gleiche Pseudonyme und byte-gleiche Ausgabe (im Test per Doppellauf belegt).

---

## Grenzen (bitte lesen)

- **Nie 100 %.** Seltene Namen, die in keiner Liste stehen und ohne Anrede vorkommen (im Test z. B. „Ijeoma Uchendu“, „Xiong Wenjie“), werden **nicht** erkannt → in der Prüfansicht von Hand markieren.
- **Fehltreffer** sind möglich (z. B. „Bill“ in „engl. Bill“, ein Tabellenkopf „Name“). Sie sind meist als „unsicher“ markiert und lassen sich abschalten.
- **Kleingeschriebene Namen** werden nur gefunden, wenn derselbe Name schon anderswo erkannt oder von Hand markiert wurde.
- **Namen in E-Mail-Adressen**, wenn die E-Mail-Erkennung ausgeschaltet ist, und Namen in Wortzusammensetzungen („Müllerstraße“, „Schmidt-Gruppe“ teilweise) werden nicht ersetzt.
- **Chinesische, japanische, koreanische und thailändische Schrift** (ohne Leerzeichen zwischen Wörtern): Namen in Originalschrift werden nicht erkannt. Arabische, kyrillische, griechische und hebräische Schrift werden über Listen teilweise erkannt.
- **Bilder** werden nicht geprüft (Namen in Fotos, Scans, Unterschriften, Bild-Metadaten).
- **PDF:** nur Textebene; gescannte Seiten fehlen (es wird gewarnt); das Layout geht verloren; schlecht kodierte PDFs liefern unlesbaren Text (es wird gewarnt).
- **Pivot-Tabellen** in Excel: Werte im Zwischenspeicher werden ersetzt; bitte nach dem Öffnen aktualisieren und prüfen.
- **Dateigröße:** Grenze 20 MB, Warnhinweis ab 5 MB. Gemessen am Desktop (Chromium, headless): 1 MB Text ≈ 3 s Analyse + 3 s Export (≈ 80 MB Arbeitsspeicher); 10 MB Text ≈ 50 s + 30 s (≈ 560 MB); Excel mit 20 000 Zeilen ≈ 8 s + 17 s (≈ 260 MB).
  **Realistische Grenze für das iPhone (ungeprüft, geschätzt): bis etwa 2–5 MB Text bzw. ca. 20 000 Excel-Zeilen.** Darüber kann der Safari-Tab sehr langsam werden oder abstürzen.

## Browser

| Browser | Status |
|---|---|
| Chromium/Chrome (Desktop) | **geprüft** (automatische Tests, headless) |
| Chromium mit iPhone-Bildschirmgröße und Touch | **geprüft** (Darstellung, Antippen, Markieren) |
| Firefox (Desktop) | **ungeprüft** |
| Safari (macOS) | **ungeprüft** |
| Safari auf dem iPhone | **ungeprüft**. Code ist auf Safari ≥ 15 ausgelegt (keine Lookbehind-Regex, keine neueren Sprachfunktionen). |

**iPhone-Hinweis (ungeprüft):** Öffnet man `index.html` aus der Dateien-App, zeigt iOS oft nur eine **Vorschau ohne JavaScript**. Das Tool funktioniert dann nicht.
Die Datei muss in einem Browser geöffnet werden (z. B. über „Teilen → in Safari öffnen“, falls angeboten, oder über eine App, die lokale HTML-Dateien im Browser öffnet).

---

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
node tests/run-tests.mjs     # End-to-End-Tests in Chromium → tests/REPORT.md
```

Aufbau: `src/core` (Erkennung, Muster, Namenslisten-Zugriff), `src/formats` (TXT/CSV/DOCX/XLSX/PDF), `src/ui` (Oberfläche, Netzwerksperre, Vorlage, Stil), `build/` (Build-Skripte), `tests/` (Testdaten, Tests, Bericht).
