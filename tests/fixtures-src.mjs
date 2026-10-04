// Erfundene Testdaten. Alle Personen sind frei erfunden; Ähnlichkeiten mit echten Personen sind Zufall.
// Markierung im Text: {{id|Text}} = Name der Person id; [[Wort]] = Falle (darf NICHT ersetzt werden);
// {{k|Text}} mit k in tel/iban/adr/mail = Kontaktdaten.

export const PERSONS = {
  1: { name: 'Anna Müller', origin: 'deutsch' },
  2: { name: 'Klaus-Dieter Schröder', origin: 'deutsch' },
  3: { name: 'Jolanthe Kirchbichler', origin: 'deutsch (seltener Nachname)' },
  4: { name: 'Mehmet Yılmaz', origin: 'türkisch' },
  5: { name: 'Ayşe Öztürk', origin: 'türkisch' },
  6: { name: 'Mohammed Al-Hassan', origin: 'arabisch' },
  7: { name: 'Fatima Haddad', origin: 'arabisch' },
  8: { name: 'Agnieszka Wiśniewska', origin: 'polnisch' },
  9: { name: 'Krzysztof Kowalczyk', origin: 'polnisch' },
  10: { name: 'Zbigniew Brzęczyszczykiewicz', origin: 'polnisch (selten)' },
  11: { name: 'Nguyễn Văn Thành', origin: 'vietnamesisch' },
  12: { name: 'Trần Thị Mai', origin: 'vietnamesisch' },
  13: { name: 'Chukwuemeka Okonkwo', origin: 'nigerianisch (Igbo)' },
  14: { name: 'Oluwaseun Adebayo', origin: 'nigerianisch (Yoruba)' },
  15: { name: 'Ngozi Eze', origin: 'nigerianisch (Igbo)' },
  16: { name: 'María José García López', origin: 'spanisch' },
  17: { name: 'Alejandro Fernández', origin: 'spanisch' },
  18: { name: 'Dmitri Iwanow', origin: 'russisch (lateinisch)' },
  19: { name: 'Swetlana Kusnezowa', origin: 'russisch (lateinisch)' },
  20: { name: 'Rose Schmidt', origin: 'deutsch (Vorname = Allerweltswort)' },
  21: { name: 'Frank Winter', origin: 'deutsch (Vor- und Nachname = Allerweltswörter)' },
  22: { name: 'Henriette von Bodelschwingh', origin: 'deutsch (Adelsprädikat, seltener Nachname)' },
  23: { name: 'Ijeoma Uchendu', origin: 'nigerianisch (selten)' },
  24: { name: 'Xiong Wenjie', origin: 'chinesisch (Pinyin, selten)' },
  // Nur in Metadaten der Test-Dateien (Autor, Bearbeiter, Manager); in der XLSX zusätzlich im Kommentartext
  25: { name: 'Gisela Prüferin', origin: 'Metadaten/Kommentar' },
  26: { name: 'Bernd Bearbeiter', origin: 'Metadaten' },
  27: { name: 'Hanna Chefin', origin: 'Metadaten' },
};

// Fallen: Wort im Kontext, das KEIN Name ist
export const TRAPS = [
  { word: 'Winter', context: 'Projekt im Winter' },
  { word: 'Rose', context: 'stand eine Rose' },
  { word: 'Paris', context: 'Reise nach Paris' },
  { word: 'Mark', context: 'alte Mark ist' },
  { word: 'Bill', context: 'engl. Bill)' },
  { word: 'Richter', context: 'Der Richter' },
  { word: 'Bauer', context: 'Der Bauer' },
  { word: 'Sommer', context: 'im Sommer' },
  { word: 'Koch', context: 'Unser Koch' },
  { word: 'Engel', context: 'kleinen Engel' },
  { word: 'Fuchs', context: 'ein Fuchs' },
  { word: 'Kraft', context: 'mit voller Kraft' },
  { word: 'Mai', context: 'ab Mai' },
];

export const CONTACTS = ['030 12345678', 'DE89 3704 0044 0532 0130 00', 'Musterweg 12', '10115 Berlin', 'anna.mueller@beispiel-firma.de'];

export const PROTOCOL = `Protokoll der Teamsitzung vom 12.03.2024

Anwesend: {{1|Anna Müller}} (Leitung), {{2|Klaus-Dieter Schröder}}, Frau {{3|Kirchbichler}}, {{4|Mehmet Yılmaz}}, {{5|Ayşe Öztürk}}, {{6|Mohammed Al-Hassan}}, {{7|Fatima Haddad}}, {{8|Agnieszka Wiśniewska}}, Herr {{9|Kowalczyk}}, {{11|Nguyễn Văn Thành}}, {{12|Trần Thị Mai}}, {{13|Chukwuemeka Okonkwo}}, {{14|Oluwaseun Adebayo}}, {{16|María José García López}}, {{18|Dmitri Iwanow}}.
Entschuldigt: {{15|Ngozi Eze}}, {{17|Alejandro Fernández}}, {{19|Swetlana Kusnezowa}}.

TOP 1: Begrüßung
Frau {{1|Müller}} begrüßte alle Anwesenden. {{1|Müllers}} Vorschlag zur neuen Ablage wurde angenommen. Herr {{4|Yılmaz}} berichtete über das Projekt im [[Winter]]; die Ergebnisse liegen {{3|Jolanthe Kirchbichler}} vor.

TOP 2: Personal
{{9|Krzysztof Kowalczyk}} übernimmt ab April die Vertretung von {{8|Wiśniewska, Agnieszka}}. Die Kantine (Leitung: {{20|Rose Schmidt}}) bietet ab Mai wieder Suppe an. Auf dem Tisch stand eine [[Rose]]. Unser [[Koch]] hat gekündigt.
{{21|Frank Winter}} wechselt in die Buchhaltung; Herr {{21|Winter}} bleibt aber Ansprechpartner. Er arbeitet mit voller [[Kraft]].
Neu im Team: {{10|Zbigniew Brzęczyszczykiewicz}} und {{23|Ijeoma Uchendu}}. {{24|Xiong Wenjie}} kommt als Praktikant.

TOP 3: Verschiedenes
Frau Dr. {{22|von Bodelschwingh}} bittet um Rückmeldung bis Freitag. Die Unterlagen hat {{13|Okonkwo}} bereits an {{5|Ayşe}} geschickt; {{7|F. Haddad}} prüft sie.
Die Reise nach [[Paris]] wurde verschoben. Die alte [[Mark]] ist kein Zahlungsmittel mehr. Die Rechnung (engl. [[Bill]]) liegt bei.
[[Der Richter]] am Amtsgericht hat den Termin bestätigt. [[Der Bauer]] liefert im [[Sommer]] Gemüse. Im Garten sitzt ein [[Fuchs]] neben einem kleinen [[Engel]] aus Stein.
{{6|AL-HASSAN}} und {{18|IWANOW}} müssen noch unterschreiben. Rückfragen an {{22|Henriette von Bodelschwingh}}.
Kontakt: Telefon {{tel|030 12345678}}, IBAN {{iban|DE89 3704 0044 0532 0130 00}}, Adresse {{adr|Musterweg 12}}, {{adr|10115 Berlin}}, E-Mail {{mail|anna.mueller@beispiel-firma.de}}.

Mit freundlichen Grüßen
{{1|Anna Müller}}`;

export function plain(s) {
  return s.replace(/\{\{[^|}]+\|([^}]+)\}\}/g, '$1').replace(/\[\[(?:Der |Die )?([^\]]+)\]\]/g, (m, w) => m.replace(/^\[\[|\]\]$/g, ''));
}

// Alle Namens-Vorkommen: [{id, text}]
export function goldOccurrences(s) {
  return [...s.matchAll(/\{\{(\d+)\|([^}]+)\}\}/g)].map((m) => ({ id: Number(m[1]), text: m[2] }));
}
