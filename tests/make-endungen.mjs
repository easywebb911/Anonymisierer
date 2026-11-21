// Testdokumente zur Endungsprüfung (Version 2.3.1). Alle Namen erfunden, keiner steht in den Namenslisten.
// Nachnamen, deren Ende wie eine Endung aussieht (-s, -n, -en, -ens, -es, -e), je in Grundform, mit jeder
// zulässigen Endung der vorhandenen Liste ('s, ’s, ', ’, s, es, n, ns) und in GROSSSCHREIBUNG; als Word, TXT und CSV.
// Dazu die Gegenprobe mit gewöhnlichen Wörtern, die wie Name + Endung aussehen.
// Aufruf: node tests/make-endungen.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import JSZip from 'jszip';

const here = path.dirname(fileURLToPath(import.meta.url));
const fx = path.join(here, 'fixtures');
const ZO = { date: new Date(Date.UTC(2026, 0, 1, 12, 0, 0)), createFolders: false };
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const ENDINGS = ["'s", '’s', "'", '’', 's', 'es', 'n', 'ns'];
// [Anrede, Vorname, Nachname, Art des Endes]
export const PEOPLE = [
  ['Herr', 'Malte', 'Lüdinghaus', '-s'],
  ['Frau', 'Ottilie', 'Wittekindhorn', '-n'],
  ['Herr', 'Gerrit', 'Quabbenjansen', '-en'],
  ['Frau', 'Hedwig', 'Ostervelkens', '-ens'],
  ['Herr', 'Jannik', 'Hallermes', '-es'],
  ['Frau', 'Greta', 'Tönnieskampe', '-e'],
];
// Zeilen: je Person Einführung, Grundform, jede Endung, GROSSSCHREIBUNG (mit und ohne Endung)
export function lines() {
  const out = [];
  for (const [an, vn, nn] of PEOPLE) {
    out.push({ text: `${an} ${vn} ${nn} kommt zur Sitzung.`, form: null, name: nn });
    out.push({ text: `Grundform: ${nn} ist da.`, form: nn, name: nn });
    for (const e of ENDINGS) out.push({ text: `Endung ${e}: ${nn}${e} Unterlagen liegen vor.`, form: nn + e, name: nn, ending: e });
    out.push({ text: `GROSS: ${nn.toUpperCase()} unterschreibt.`, form: nn.toUpperCase(), name: nn });
    out.push({ text: `GROSS mit Endung: ${nn.toUpperCase()}S Unterlagen.`, form: nn.toUpperCase() + 'S', name: nn, ending: 'S' });
  }
  return out;
}
// Gegenprobe: gewöhnliche Wörter ohne Namenskontext; Variante mit Personen, deren Namen die Grundform dieser Wörter sind
export const COMMON = ['Rosen', 'Marken', 'Franken', 'Wolfs', 'Bergen', 'Steinen'];
export const GEGEN = [
  'Im Garten blühen die Rosen.',
  'Die Marken liegen im Album.',
  'Die Reise führt nach Franken.',
  'Das Heulen des Wolfs war zu hören.',
  'Wir wandern in den Bergen.',
  'Der Weg ist mit Steinen gepflastert.',
];
export const GEGEN_PERSONEN = ['Frau Anna Rose, Herr Rainer Mark, Herr Paul Frank, Herr Peter Wolf, Herr Karl Berg und Herr Max Stein sind da.', ...GEGEN];

async function docx(paras) {
  const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
  const z = new JSZip();
  z.file('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>', ZO);
  z.file('_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>', ZO);
  z.file('word/document.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:document xmlns:w="${W}"><w:body>${paras.map((t) => `<w:p><w:r><w:t xml:space="preserve">${esc(t)}</w:t></w:r></w:p>`).join('')}<w:sectPr/></w:body></w:document>`, ZO);
  return z.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
}

// Word mit gebeugten Formen in Kopfzeile, Fußzeile, Fußnote und Bildbeschreibung
async function teileDocx() {
  const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
  const R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
  const A = 'http://schemas.openxmlformats.org/drawingml/2006/main';
  const PIC = 'http://schemas.openxmlformats.org/drawingml/2006/picture';
  const WP = 'http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing';
  const ns = `xmlns:w="${W}" xmlns:r="${R}" xmlns:wp="${WP}" xmlns:a="${A}" xmlns:pic="${PIC}"`;
  const p = (t) => `<w:p><w:r><w:t xml:space="preserve">${esc(t)}</w:t></w:r></w:p>`;
  const pic = '<w:p><w:r><w:drawing><wp:inline><wp:extent cx="762000" cy="571500"/><wp:docPr id="1" name="Bild 1" descr="Foto aus Quabbenjansens Büro"/><a:graphic><a:graphicData uri="' + PIC + '"><pic:pic><pic:nvPicPr><pic:cNvPr id="0" name="foto.png"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="rIdImg"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>';
  const body = p('Herr Gerrit Quabbenjansen und Frau Ottilie Wittekindhorn und Frau Greta Tönnieskampe kommen.')
    + `<w:p><w:r><w:t xml:space="preserve">Siehe Fußnote.</w:t></w:r><w:r><w:footnoteReference w:id="1"/></w:r></w:p>` + pic;
  const z = new JSZip();
  z.file('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/><Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/><Override PartName="/word/footnotes.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footnotes+xml"/></Types>', ZO);
  z.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${R}/officeDocument" Target="word/document.xml"/></Relationships>`, ZO);
  z.file('word/_rels/document.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdH" Type="${R}/header" Target="header1.xml"/><Relationship Id="rIdF" Type="${R}/footer" Target="footer1.xml"/><Relationship Id="rIdFn" Type="${R}/footnotes" Target="footnotes.xml"/><Relationship Id="rIdImg" Type="${R}/image" Target="media/foto.png"/></Relationships>`, ZO);
  z.file('word/document.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:document ${ns}><w:body>${body}<w:sectPr><w:headerReference w:type="default" r:id="rIdH"/><w:footerReference w:type="default" r:id="rIdF"/></w:sectPr></w:body></w:document>`, ZO);
  z.file('word/header1.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:hdr ${ns}>${p('Akte: Quabbenjansens Antrag')}</w:hdr>`, ZO);
  z.file('word/footer1.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:ftr ${ns}>${p('Notiz aus Wittekindhorns Büro')}</w:ftr>`, ZO);
  z.file('word/footnotes.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:footnotes ${ns}><w:footnote w:id="1">${p('Hinweis aus Tönnieskampes Unterlagen.')}</w:footnote></w:footnotes>`, ZO);
  z.file('word/media/foto.png', fs.readFileSync(path.join(fx, 'meta-quelle.png')), ZO);
  return z.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  fs.writeFileSync(path.join(fx, 'endungen-teile.docx'), await teileDocx());
  const L = lines().map((l) => l.text);
  fs.writeFileSync(path.join(fx, 'endungen.txt'), L.join('\n') + '\n');
  fs.writeFileSync(path.join(fx, 'endungen.docx'), await docx(L));
  fs.writeFileSync(path.join(fx, 'endungen.csv'), ['Nr;Text', ...L.map((t, i) => `${i + 1};"${t.replace(/"/g, '""')}"`)].join('\r\n') + '\r\n');
  fs.writeFileSync(path.join(fx, 'gegenprobe-endungen.txt'), GEGEN.join('\n') + '\n');
  fs.writeFileSync(path.join(fx, 'gegenprobe-endungen.docx'), await docx(GEGEN));
  fs.writeFileSync(path.join(fx, 'gegenprobe-endungen-personen.txt'), GEGEN_PERSONEN.join('\n') + '\n');
  fs.writeFileSync(path.join(fx, 'gegenprobe-endungen-personen.docx'), await docx(GEGEN_PERSONEN));
  console.log('geschrieben: tests/fixtures/endungen.(docx|txt|csv), gegenprobe-endungen(-personen).(txt|docx)');
}
