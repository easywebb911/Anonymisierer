// Testdokumente zur GROSSSCHREIBUNG mit Endung (Version 2.3.2). Alle Personen erfunden.
// Je Name: Grundform, GROSS-Form, GROSS-Form mit jeder zulässigen Endung (groß und klein geschrieben = gemischte Form);
// Variante „mit“: der Name steht auch normal geschrieben im Dokument (mit Anrede);
// Variante „einzig“: nur GROSS-Formen mit Endung, kein anderes Vorkommen.
// Word zusätzlich mit Kopfzeile, Fußzeile, Fußnote und Bildbeschreibung. Dazu Schriftzeichen-Test und Gegenprobe.
// Aufruf: node tests/make-gross.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import JSZip from 'jszip';

const here = path.dirname(fileURLToPath(import.meta.url));
const fx = path.join(here, 'fixtures');
const ZO = { date: new Date(Date.UTC(2026, 0, 1, 12, 0, 0)), createFolders: false };
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// vorhandene Endungsliste; groß geschrieben (soweit es Buchstaben sind) und wie bisher klein (= gemischte Form)
export const ENDINGS = ["'s", '’s', "'", '’', 's', 'es', 'n', 'ns'];
export const UPPER_ENDINGS = ["'S", '’S', 'S', 'ES', 'N', 'NS'];
// [Anrede, Vorname, Nachname]; Lüdinghaus/Quabbenjansen/Wittekindhorn in keiner Namensliste, Müller und Kowalski schon
export const PEOPLE = [
  ['Herr', 'Malte', 'Lüdinghaus'],
  ['Herr', 'Gerrit', 'Quabbenjansen'],
  ['Frau', 'Ottilie', 'Wittekindhorn'],
  ['Frau', 'Helga', 'Müller'],
  ['Herr', 'Jan', 'Kowalski'],
];
const up = (s) => s.toUpperCase();
// Formen eines Namens: {form, kind}
export function forms(nn) {
  const out = [{ form: nn, kind: 'Grundform' }, { form: up(nn), kind: 'GROSS' }];
  for (const e of UPPER_ENDINGS) out.push({ form: up(nn) + e, kind: 'GROSS+' + e });
  for (const e of ENDINGS) out.push({ form: up(nn) + e, kind: 'gemischt+' + e });
  return out;
}
// Zeilen. variant 'mit' | 'einzig'
export function lines(variant) {
  const out = [];
  for (const [an, vn, nn] of PEOPLE) {
    if (variant === 'mit') out.push({ text: `${an} ${vn} ${nn} kommt zur Sitzung.`, form: null, name: nn });
    for (const f of forms(nn)) {
      if (variant === 'einzig' && !/\+/.test(f.kind)) continue;
      if (variant === 'einzig' && (f.kind === "gemischt+'" || f.kind === 'gemischt+’')) continue; // gleich wie GROSS+' / GROSS+’
      // Beschriftung „Form N“ (nicht „GROSS“: „Groß“ steht in der Nachnamenliste)
      out.push({ text: `Form ${out.length + 1}: ${f.form} Unterlagen liegen vor.`, form: f.form, kind: f.kind, name: nn });
    }
  }
  return out;
}
// Teile (nur Word): je Teil eine GROSS-Form mit Endung
export const TEILE = {
  header: { text: 'Akte: QUABBENJANSENS Antrag', form: 'QUABBENJANSENS', name: 'Quabbenjansen' },
  footer: { text: 'Notiz aus WITTEKINDHORNS Büro', form: 'WITTEKINDHORNS', name: 'Wittekindhorn' },
  footnote: { text: 'Hinweis aus MÜLLERS Unterlagen.', form: 'MÜLLERS', name: 'Müller' },
  image: { text: 'Foto aus LÜDINGHAUSES Büro', form: 'LÜDINGHAUSES', name: 'Lüdinghaus' },
};

// Schriftzeichen: je Name ein eigenes Dokument (normal geschrieben mit Anrede, dann GROSS-Formen)
// [Datei, Anrede+Name im Text, Nachname normal, GROSS-Formen]
export const SCHRIFT = [
  ['schrift-strauss', 'Herr Johann Strauß', 'Strauß', ['STRAUSS', 'STRAUSSES', 'STRAUSS’', 'STRAUẞ', 'STRAUẞES']],
  ['schrift-yilmaz', 'Herr Can Yılmaz', 'Yılmaz', ['YILMAZ', 'YILMAZS', 'YILMAZ’S', 'YILMAZs']],
  ['schrift-celik', 'Frau Elif Çelik', 'Çelik', ['ÇELİK', 'ÇELİKS', 'ÇELİK’S', 'ÇELİKs']],
  ['schrift-brzeczek', 'Herr Jakub Brzęczek', 'Brzęczek', ['BRZĘCZEK', 'BRZĘCZEKS', 'BRZĘCZEK’S', 'BRZĘCZEKs']],
  ['schrift-mueller', 'Frau Helga Müller', 'Müller', ['MÜLLER', 'MÜLLERS', 'MÜLLERs', 'MUELLER', 'MUELLERS']],
];
export function schriftLines([, intro, , gross]) {
  return [`${intro} kommt zur Sitzung.`, ...gross.map((g) => `Form ${g}: ${g} Unterlagen liegen vor.`)];
}

// Gegenprobe: gewöhnliche Wörter in GROSSSCHREIBUNG als Überschriften
export const GEGEN_WORDS = ['ROSEN', 'WINTERS', 'MARKEN', 'FRANKEN', 'BERGEN', 'STEINEN'];
export const GEGEN_BODY = ['Im Garten blühen die Rosen.', 'Die Kälte des Winters ist vorbei.', 'Die Marken liegen im Album.',
  'Die Reise führt nach Franken.', 'Wir wandern in den Bergen.', 'Der Weg ist mit Steinen gepflastert.'];
export const GEGEN_PERSONEN = 'Frau Anna Rose, Frau Lena Winter, Herr Rainer Mark, Herr Paul Frank, Herr Karl Berg und Herr Max Stein sind da.';
// [{text, heading}]
export function gegenParas(withPersons) {
  const out = withPersons ? [{ text: GEGEN_PERSONEN, heading: false }] : [];
  GEGEN_WORDS.forEach((w, i) => { out.push({ text: w, heading: true }); out.push({ text: GEGEN_BODY[i], heading: false }); });
  return out;
}

const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const A = 'http://schemas.openxmlformats.org/drawingml/2006/main';
const PIC = 'http://schemas.openxmlformats.org/drawingml/2006/picture';
const WP = 'http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing';
const NS = `xmlns:w="${W}" xmlns:r="${R}" xmlns:wp="${WP}" xmlns:a="${A}" xmlns:pic="${PIC}"`;
const para = (t, heading) => `<w:p>${heading ? '<w:pPr><w:pStyle w:val="Heading1"/></w:pPr>' : ''}<w:r><w:t xml:space="preserve">${esc(t)}</w:t></w:r></w:p>`;
const STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:styles xmlns:w="${W}"><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style><w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/></w:style></w:styles>`;

// paras: [{text, heading}]; teile: mit Kopf-/Fußzeile, Fußnote und Bild
async function docx(paras, teile = false) {
  const z = new JSZip();
  const ct = ['<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>', '<Default Extension="xml" ContentType="application/xml"/>',
    '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>',
    '<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>'];
  const rels = [`<Relationship Id="rIdS" Type="${R}/styles" Target="styles.xml"/>`];
  let body = paras.map((p) => para(p.text, p.heading)).join('');
  let sect = '<w:sectPr/>';
  if (teile) {
    ct.push('<Default Extension="png" ContentType="image/png"/>',
      '<Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/>',
      '<Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>',
      '<Override PartName="/word/footnotes.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footnotes+xml"/>');
    rels.push(`<Relationship Id="rIdH" Type="${R}/header" Target="header1.xml"/>`, `<Relationship Id="rIdF" Type="${R}/footer" Target="footer1.xml"/>`,
      `<Relationship Id="rIdFn" Type="${R}/footnotes" Target="footnotes.xml"/>`, `<Relationship Id="rIdImg" Type="${R}/image" Target="media/foto.png"/>`);
    body += `<w:p><w:r><w:t xml:space="preserve">Siehe Fußnote.</w:t></w:r><w:r><w:footnoteReference w:id="1"/></w:r></w:p>`;
    body += '<w:p><w:r><w:drawing><wp:inline><wp:extent cx="762000" cy="571500"/><wp:docPr id="1" name="Bild 1" descr="' + esc(TEILE.image.text) + '"/><a:graphic><a:graphicData uri="' + PIC + '"><pic:pic><pic:nvPicPr><pic:cNvPr id="0" name="foto.png"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="rIdImg"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>';
    sect = '<w:sectPr><w:headerReference w:type="default" r:id="rIdH"/><w:footerReference w:type="default" r:id="rIdF"/></w:sectPr>';
    z.file('word/header1.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:hdr ${NS}>${para(TEILE.header.text)}</w:hdr>`, ZO);
    z.file('word/footer1.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:ftr ${NS}>${para(TEILE.footer.text)}</w:ftr>`, ZO);
    z.file('word/footnotes.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:footnotes ${NS}><w:footnote w:id="1">${para(TEILE.footnote.text)}</w:footnote></w:footnotes>`, ZO);
    z.file('word/media/foto.png', fs.readFileSync(path.join(fx, 'meta-quelle.png')), ZO);
  }
  z.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">${ct.join('')}</Types>`, ZO);
  z.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${R}/officeDocument" Target="word/document.xml"/></Relationships>`, ZO);
  z.file('word/_rels/document.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${rels.join('')}</Relationships>`, ZO);
  z.file('word/styles.xml', STYLES, ZO);
  z.file('word/document.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:document ${NS}><w:body>${body}${sect}</w:body></w:document>`, ZO);
  return z.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
}
const csv = (L) => ['Nr;Text', ...L.map((t, i) => `${i + 1};"${t.replace(/"/g, '""')}"`)].join('\r\n') + '\r\n';

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const written = [];
  const put = (name, data) => { fs.writeFileSync(path.join(fx, name), data); written.push(name); };
  for (const v of ['mit', 'einzig']) {
    const L = lines(v).map((l) => l.text);
    put(`grossform-${v}.txt`, L.join('\n') + '\n');
    put(`grossform-${v}.csv`, csv(L));
    put(`grossform-${v}.docx`, await docx(L.map((text) => ({ text })), true));
  }
  for (const s of SCHRIFT) put(`${s[0]}.txt`, schriftLines(s).join('\n') + '\n');
  for (const withP of [false, true]) {
    const P = gegenParas(withP);
    const n = withP ? 'gegenprobe-gross-personen' : 'gegenprobe-gross';
    put(`${n}.txt`, P.map((p) => p.text).join('\n') + '\n');
    put(`${n}.docx`, await docx(P));
  }
  console.log('geschrieben: ' + written.join(', '));
}
