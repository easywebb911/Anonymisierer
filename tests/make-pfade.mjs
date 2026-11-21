// Testdokumente zu Teilen an ungewöhnlicher Stelle (Version 2.4.1). Alle Personen erfunden.
// - pfade-phase0.xlsx: Aufbau wie openpyxl (Kommentar unter xl/comments/comment1.xml, nur über die Beziehung des
//   Blatts erreichbar; Rahmenart „thin“ in xl/styles.xml; „Thi Lan“ + „Nguyen“; „TANNHÄUSERS Neffe“)
// - pfade-ueblich.(xlsx|docx): jeder Teil mit eigenem Namen, Teile am üblichen Ort
// - pfade-unueblich.(xlsx|docx): derselbe Inhalt, Kommentare, Fußnoten, Kopfzeile, Dateieigenschaften (und weitere
//   Teile) an ungewöhnlicher Stelle, auch außerhalb von xl/ bzw. word/
// - pfade-gegenprobe.(xlsx|docx): kurze Namensteile, die wie Format-Schlüsselwörter aussehen (Thi, Val, Bold, Left,
//   Auto, Row), dazu genau diese Schlüsselwörter in Formatangaben
// Aufruf: node tests/make-pfade.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import JSZip from 'jszip';

const here = path.dirname(fileURLToPath(import.meta.url));
export const FX = path.join(here, 'fixtures-pfade');
const ZO = { date: new Date(Date.UTC(2026, 0, 1, 12, 0, 0)), createFolders: false };
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const PR = 'http://schemas.openxmlformats.org/package/2006/relationships';
const S = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const A = 'http://schemas.openxmlformats.org/drawingml/2006/main';
const XDR = 'http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing';
const CT = 'application/vnd.openxmlformats-officedocument.';
const X = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';

// relativer Verweis von einem Teil zu einem anderen
function rel(from, to) {
  const a = from.split('/').slice(0, -1);
  const b = to.split('/');
  let i = 0;
  while (i < a.length && i < b.length - 1 && a[i] === b[i]) i++;
  return [...a.slice(i).map(() => '..'), ...b.slice(i)].join('/');
}
const relsName = (p) => { const d = p.replace(/[^/]+$/, ''); return d + '_rels/' + p.slice(d.length) + '.rels'; };
const relsXml = (list) => X + `<Relationships xmlns="${PR}">` + list.map(([id, type, target, ext]) => `<Relationship Id="${id}" Type="${type}" Target="${esc(target)}"${ext ? ' TargetMode="External"' : ''}/>`).join('') + '</Relationships>';
const ctXml = (over, defaults = []) => X + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="vml" ContentType="application/vnd.openxmlformats-officedocument.vmlDrawing"/>'
  + defaults.join('') + over.map(([p, t]) => `<Override PartName="/${p}" ContentType="${t}"/>`).join('') + '</Types>';
async function save(name, files) {
  const z = new JSZip();
  for (const [n, c] of Object.entries(files)) z.file(n, c, ZO);
  fs.writeFileSync(path.join(FX, name), await z.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }));
}

// Namen je Teil (erfunden). Jeder Name steht nur in seinem Teil: bleibt er stehen, zeigt das den Teil.
export const XLSX_NAMES = {
  zelle: 'Henrike Tannhäuser', kopf: 'Gerlinde Ostwald', kommentar: 'Jonas Wiesenthal', unterhaltung: 'Malte Ehrenreich',
  textfeld: 'Ilka Brandt', blatt: 'Kühnel', eigenschaft: 'Bertram Quellmann', firma: 'Amsel-Kita Brückenfeld',
};
export const DOCX_NAMES = {
  text: 'Henrike Tannhäuser', kopf: 'Gerlinde Ostwald', fuss: 'Ilka Brandt', fussnote: 'Jonas Wiesenthal',
  endnote: 'Malte Ehrenreich', kommentar: 'Rosalie Fennhoff', eigenschaft: 'Bertram Quellmann', autor: 'Edda Lindqvist',
};
export const GEGEN = ['Thi Hoa', 'Anton Bold', 'Eva Val', 'Peter Left', 'Ina Auto', 'Jan Row'];

// ---------- Excel ----------
// p: Pfade der Teile
async function xlsx(name, p, opts = {}) {
  const N = opts.names || XLSX_NAMES;
  const cells = opts.cells || [
    'Name', 'Bemerkung', `Frau ${N.zelle}`, 'Ansprechpartnerin', 'Tannhäuser', 'TANNHÄUSERS Neffe',
  ];
  const sst = X + `<sst xmlns="${S}" count="${cells.length}" uniqueCount="${cells.length}">${cells.map((s) => `<si><t xml:space="preserve">${esc(s)}</t></si>`).join('')}</sst>`;
  const rows = [];
  for (let i = 0; i < cells.length; i += 2) {
    const r = i / 2 + 1;
    rows.push(`<row r="${r}"><c r="A${r}" t="s" s="1"><v>${i}</v></c>${i + 1 < cells.length ? `<c r="B${r}" t="s" s="1"><v>${i + 1}</v></c>` : ''}</row>`);
  }
  if (opts.formula) rows.push(`<row r="${rows.length + 1}"><c r="A${rows.length + 1}"><f>${esc(opts.formula)}</f><v>${rows.length + 1}</v></c></row>`);
  const sheetRels = [['rIdC', `${R}/comments`, opts.absolute ? '/' + p.comments : rel(p.sheet, p.comments)], ['rIdV', `${R}/vmlDrawing`, rel(p.sheet, p.vml)]];
  if (p.drawing) sheetRels.push(['rIdD', `${R}/drawing`, rel(p.sheet, p.drawing)]);
  if (p.threaded) sheetRels.push(['rIdT', 'http://schemas.microsoft.com/office/2017/10/relationships/threadedComment', rel(p.sheet, p.threaded)]);
  const sheet = X + `<worksheet xmlns="${S}" xmlns:r="${R}"><sheetData>${rows.join('')}</sheetData>`
    + `<headerFooter><oddHeader>${esc(opts.header || `&L&"Arial,Bold"Liste von Frau ${N.kopf}&RSeite &P`)}</oddHeader></headerFooter>`
    + (p.drawing ? '<drawing r:id="rIdD"/>' : '') + '<legacyDrawing r:id="rIdV"/></worksheet>';
  const comments = X + `<comments xmlns="${S}"><authors><author>${esc(opts.commentAuthor || 'Sachbearbeitung')}</author></authors><commentList><comment ref="B2" authorId="0"><text><r><rPr><b/><sz val="9"/><rFont val="Tahoma"/></rPr><t xml:space="preserve">${esc(opts.comment || `Rückruf bei Herrn ${N.kommentar} erbeten.`)}</t></r></text></comment></commentList></comments>`;
  const vml = `<xml xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><o:shapelayout v:ext="edit"><o:idmap v:ext="edit" data="1"/></o:shapelayout><v:shapetype id="_x0000_t202" coordsize="21600,21600" o:spt="202" path="m,l,21600r21600,l21600,xe"><v:stroke joinstyle="miter"/><v:path gradientshapeok="t" o:connecttype="rect"/></v:shapetype><v:shape id="_x0000_s1025" type="#_x0000_t202" style="position:absolute;margin-left:59.25pt;margin-top:1.5pt;width:108pt;height:59.25pt;z-index:1;visibility:hidden" fillcolor="#ffffe1" o:insetmode="auto"><v:fill color2="#ffffe1"/><v:shadow on="t" color="black" obscured="t"/><v:path o:connecttype="none"/><v:textbox style="mso-direction-alt:auto"><div style="text-align:left"></div></v:textbox><x:ClientData ObjectType="Note"><x:MoveWithCells/><x:SizeWithCells/><x:Anchor>1, 15, 0, 2, 3, 15, 4, 6</x:Anchor><x:AutoFill>False</x:AutoFill><x:Row>1</x:Row><x:Column>1</x:Column></x:ClientData></v:shape></xml>`;
  const styles = X + `<styleSheet xmlns="${S}"><fonts count="2"><font><sz val="11"/><color theme="1"/><name val="Calibri"/><family val="2"/><scheme val="minor"/></font><font><b/><sz val="11"/><color auto="1"/><name val="Arial"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"><color auto="1"/></left><right style="thin"><color auto="1"/></right><top style="thin"><color auto="1"/></top><bottom style="thin"><color auto="1"/></bottom><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="top" wrapText="1"/></xf></cellXfs><cellStyles count="1"><cellStyle name="Standard" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;
  const files = {
    '[Content_Types].xml': ctXml([
      [p.workbook, CT + 'spreadsheetml.sheet.main+xml'], [p.sheet, CT + 'spreadsheetml.worksheet+xml'], [p.styles, CT + 'spreadsheetml.styles+xml'],
      [p.sst, CT + 'spreadsheetml.sharedStrings+xml'], [p.comments, CT + 'spreadsheetml.comments+xml'], [p.core, 'application/vnd.openxmlformats-package.core-properties+xml'],
      [p.app, CT + 'extended-properties+xml'],
      ...(p.drawing ? [[p.drawing, CT + 'drawing+xml']] : []),
      ...(p.threaded ? [[p.threaded, 'application/vnd.ms-excel.threadedcomments+xml']] : []),
    ]),
    '_rels/.rels': relsXml([['rId1', `${R}/officeDocument`, p.workbook], ['rId2', 'http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties', p.core], ['rId3', `${R}/extended-properties`, p.app]]),
    [p.core]: X + `<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:creator>${esc(N.eigenschaft || 'openpyxl')}</dc:creator><cp:lastModifiedBy>${esc(N.eigenschaft || 'openpyxl')}</cp:lastModifiedBy></cp:coreProperties>`,
    [p.app]: X + `<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>Microsoft Excel</Application>${N.firma ? `<Company>${esc(N.firma)}</Company>` : ''}</Properties>`,
    [p.workbook]: X + `<workbook xmlns="${S}" xmlns:r="${R}"><sheets><sheet name="${esc(opts.sheetName || `Liste ${N.blatt}`)}" sheetId="1" r:id="rId1"/></sheets></workbook>`,
    [relsName(p.workbook)]: relsXml([['rId1', `${R}/worksheet`, rel(p.workbook, p.sheet)], ['rId2', `${R}/styles`, rel(p.workbook, p.styles)], ['rId3', `${R}/sharedStrings`, rel(p.workbook, p.sst)]]),
    [p.styles]: styles,
    [p.sst]: sst,
    [p.sheet]: sheet,
    [relsName(p.sheet)]: relsXml(sheetRels),
    [p.comments]: comments,
    [p.vml]: vml,
  };
  if (p.drawing) {
    files[p.drawing] = X + `<xdr:wsDr xmlns:xdr="${XDR}" xmlns:a="${A}"><xdr:twoCellAnchor><xdr:from><xdr:col>3</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>1</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:from><xdr:to><xdr:col>6</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>5</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:to><xdr:sp macro="" textlink=""><xdr:nvSpPr><xdr:cNvPr id="2" name="Textfeld 1"/><xdr:cNvSpPr txBox="1"/></xdr:nvSpPr><xdr:spPr><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></xdr:spPr><xdr:txBody><a:bodyPr anchor="t"/><a:p><a:pPr algn="l"/><a:r><a:t>Notiz von Frau ${esc(N.textfeld)}</a:t></a:r></a:p></xdr:txBody></xdr:sp><xdr:clientData/></xdr:twoCellAnchor></xdr:wsDr>`;
  }
  if (p.threaded) {
    files[p.threaded] = X + `<ThreadedComments xmlns="http://schemas.microsoft.com/office/spreadsheetml/2018/threadedcomments"><threadedComment ref="B3" dT="2026-01-01T12:00:00.00" personId="{11111111-1111-1111-1111-111111111111}" id="{22222222-2222-2222-2222-222222222222}"><text>Bitte mit Herrn ${esc(N.unterhaltung)} klären.</text></threadedComment></ThreadedComments>`;
  }
  await save(name, files);
}
const XLSX_USUAL = { workbook: 'xl/workbook.xml', sheet: 'xl/worksheets/sheet1.xml', styles: 'xl/styles.xml', sst: 'xl/sharedStrings.xml', comments: 'xl/comments1.xml', vml: 'xl/drawings/vmlDrawing1.vml', drawing: 'xl/drawings/drawing1.xml', threaded: 'xl/threadedComments/threadedComment1.xml', core: 'docProps/core.xml', app: 'docProps/app.xml' };
const XLSX_ODD = { workbook: 'xl/workbook.xml', sheet: 'tabellen/blatt1.xml', styles: 'xl/styles.xml', sst: 'xl/texte/gemeinsam.xml', comments: 'notizen/kommentare/c1.xml', vml: 'notizen/vml/k1.vml', drawing: 'xl/zeichnung/z1.xml', threaded: 'notizen/unterhaltung/u1.xml', core: 'eigenschaften/kern.xml', app: 'eigenschaften/anwendung.xml' };

// ---------- Word ----------
function para(t, extra = '') { return `<w:p><w:pPr><w:jc w:val="left"/>${extra}</w:pPr><w:r><w:rPr><w:color w:val="auto"/></w:rPr><w:t xml:space="preserve">${esc(t)}</w:t></w:r></w:p>`; }
async function docx(name, p, opts = {}) {
  const N = opts.names || DOCX_NAMES;
  const body = (opts.paras || [`Bericht über Frau ${N.text}.`]).map((t) => para(t)).join('')
    + `<w:p><w:r><w:t xml:space="preserve">Siehe Fußnote</w:t></w:r><w:r><w:footnoteReference w:id="1"/></w:r><w:r><w:t xml:space="preserve"> und Endnote</w:t></w:r><w:r><w:endnoteReference w:id="1"/></w:r><w:r><w:t xml:space="preserve">.</w:t></w:r></w:p>`
    + `<w:p><w:commentRangeStart w:id="0"/><w:r><w:t>Kommentierter Satz.</w:t></w:r><w:commentRangeEnd w:id="0"/><w:r><w:commentReference w:id="0"/></w:r></w:p>`
    + `<w:tbl><w:tblPr><w:tblW w:w="0" w:type="auto"/><w:tblLook w:val="04A0" w:firstRow="1" w:lastRow="0" w:firstColumn="1" w:lastColumn="0" w:noHBand="0" w:noVBand="1"/></w:tblPr><w:tblGrid><w:gridCol w:w="4500"/></w:tblGrid><w:tr><w:tc><w:tcPr><w:tcW w:w="4500" w:type="dxa"/></w:tcPr>${para('Zelle')}</w:tc></w:tr></w:tbl>`
    + `<w:sectPr><w:headerReference w:type="default" r:id="rIdH"/><w:footerReference w:type="default" r:id="rIdF"/><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1417" w:right="1417" w:bottom="1134" w:left="1417" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr>`;
  const doc = X + `<w:document xmlns:w="${W}" xmlns:r="${R}"><w:body>${body}</w:body></w:document>`;
  const note = (kind, t) => X + `<w:${kind}s xmlns:w="${W}"><w:${kind} w:type="separator" w:id="-1"><w:p><w:r><w:separator/></w:r></w:p></w:${kind}><w:${kind} w:type="continuationSeparator" w:id="0"><w:p><w:r><w:continuationSeparator/></w:r></w:p></w:${kind}><w:${kind} w:id="1">${para(t)}</w:${kind}></w:${kind}s>`;
  const files = {
    '[Content_Types].xml': ctXml([
      [p.doc, CT + 'wordprocessingml.document.main+xml'], [p.styles, CT + 'wordprocessingml.styles+xml'], [p.header, CT + 'wordprocessingml.header+xml'],
      [p.footer, CT + 'wordprocessingml.footer+xml'], [p.footnotes, CT + 'wordprocessingml.footnotes+xml'], [p.endnotes, CT + 'wordprocessingml.endnotes+xml'],
      [p.comments, CT + 'wordprocessingml.comments+xml'], [p.core, 'application/vnd.openxmlformats-package.core-properties+xml'], [p.app, CT + 'extended-properties+xml'],
    ]),
    '_rels/.rels': relsXml([['rId1', `${R}/officeDocument`, p.doc], ['rId2', 'http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties', p.core], ['rId3', `${R}/extended-properties`, p.app]]),
    [p.core]: X + `<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:creator>${esc(N.eigenschaft)}</dc:creator><cp:lastModifiedBy>${esc(N.eigenschaft)}</cp:lastModifiedBy></cp:coreProperties>`,
    [p.app]: X + `<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>Microsoft Office Word</Application><Template>Normal.dotm</Template></Properties>`,
    [p.doc]: doc,
    [relsName(p.doc)]: relsXml([['rIdS', `${R}/styles`, rel(p.doc, p.styles)], ['rIdH', `${R}/header`, rel(p.doc, p.header)], ['rIdF', `${R}/footer`, rel(p.doc, p.footer)], ['rIdFn', `${R}/footnotes`, rel(p.doc, p.footnotes)], ['rIdEn', `${R}/endnotes`, rel(p.doc, p.endnotes)], ['rIdC', `${R}/comments`, rel(p.doc, p.comments)]]),
    [p.styles]: X + `<w:styles xmlns:w="${W}"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="22"/><w:lang w:val="de-DE"/></w:rPr></w:rPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Standard"><w:name w:val="Normal"/><w:qFormat/></w:style><w:style w:type="character" w:styleId="Fett"><w:name w:val="Strong"/><w:rPr><w:b/><w:bCs/></w:rPr></w:style><w:style w:type="table" w:styleId="Tabellenraster"><w:name w:val="Table Grid"/><w:tblPr><w:tblBorders><w:top w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:left w:val="single" w:sz="4" w:space="0" w:color="auto"/></w:tblBorders></w:tblPr></w:style></w:styles>`,
    [p.header]: X + `<w:hdr xmlns:w="${W}">${para(`Akte von Frau ${N.kopf}`)}</w:hdr>`,
    [p.footer]: X + `<w:ftr xmlns:w="${W}">${para(`Bearbeitet von Frau ${N.fuss}`)}</w:ftr>`,
    [p.footnotes]: note('footnote', `Auskunft von Herrn ${N.fussnote}.`),
    [p.endnotes]: note('endnote', `Nachtrag von Herrn ${N.endnote}.`),
    [p.comments]: X + `<w:comments xmlns:w="${W}"><w:comment w:id="0" w:author="${esc(N.autor)}" w:date="2026-01-01T12:00:00Z" w:initials="EL">${para(`Mit Frau ${N.kommentar} abgestimmt.`)}</w:comment></w:comments>`,
  };
  await save(name, files);
}
const DOCX_USUAL = { doc: 'word/document.xml', styles: 'word/styles.xml', header: 'word/header1.xml', footer: 'word/footer1.xml', footnotes: 'word/footnotes.xml', endnotes: 'word/endnotes.xml', comments: 'word/comments.xml', core: 'docProps/core.xml', app: 'docProps/app.xml' };
const DOCX_ODD = { doc: 'word/document.xml', styles: 'word/styles.xml', header: 'kopfzeilen/kopf1.xml', footer: 'word/teile/fuss.xml', footnotes: 'anmerkungen/fussnoten.xml', endnotes: 'word/anmerkungen/schluss.xml', comments: 'notizen/kommentare.xml', core: 'eigenschaften/kern.xml', app: 'eigenschaften/anwendung.xml' };

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  fs.mkdirSync(FX, { recursive: true });
  // Phase 0 (Aufbau wie openpyxl: absolute Verweise, Kommentar unter xl/comments/comment1.xml, kein Textfeld)
  await xlsx('pfade-phase0.xlsx', { ...XLSX_USUAL, comments: 'xl/comments/comment1.xml', vml: 'xl/drawings/commentsDrawing1.vml', drawing: null, threaded: null }, {
    absolute: true,
    names: { blatt: '', eigenschaft: 'openpyxl' },
    sheetName: 'Liste',
    cells: ['Name', 'Vorname', 'Nguyen', 'Thi Lan', 'Tannhäuser', 'TANNHÄUSERS Neffe'],
    header: '&LListe erstellt von Henrike Tannhäuser',
    comment: 'Rückruf bei Thi Lan Nguyen, Mutter von Jonas Wiesenthal',
  });
  await xlsx('pfade-ueblich.xlsx', XLSX_USUAL);
  await xlsx('pfade-unueblich.xlsx', XLSX_ODD);
  await docx('pfade-ueblich.docx', DOCX_USUAL);
  await docx('pfade-unueblich.docx', DOCX_ODD);
  // Hauptteil (Arbeitsmappe, Haupttext) selbst an ungewöhnlicher Stelle
  await xlsx('pfade-hauptteil.xlsx', { ...XLSX_ODD, workbook: 'mappe/arbeitsmappe.xml', styles: 'mappe/stile.xml' });
  await docx('pfade-hauptteil.docx', { ...DOCX_ODD, doc: 'inhalt/dokument.xml', styles: 'inhalt/stile.xml' });
  // Gegenprobe: Namensteile wie Format-Schlüsselwörter
  await xlsx('pfade-gegenprobe.xlsx', XLSX_USUAL, {
    names: { eigenschaft: 'Sachbearbeitung', textfeld: 'Eva Val', unterhaltung: 'Peter Left' },
    sheetName: 'Teilnehmer',
    cells: ['Name', 'Rolle', ...GEGEN.flatMap((n, i) => [`${i % 2 ? 'Herr' : 'Frau'} ${n}`, 'Teilnahme'])],
    header: '&L&"Arial,Bold"&12Teilnehmerliste&R&"Arial,Italic"Seite &P von &N',
    comment: 'Bitte Zeile prüfen.',
    formula: 'ROW()+LEFT("1",1)',
  });
  await docx('pfade-gegenprobe.docx', DOCX_USUAL, {
    names: { kopf: 'Thi Hoa', fuss: 'Anton Bold', fussnote: 'Eva Val', endnote: 'Peter Left', kommentar: 'Ina Auto', eigenschaft: 'Jan Row', autor: 'Jan Row' },
    paras: GEGEN.map((n, i) => `${i % 2 ? 'Herr' : 'Frau'} ${n} nimmt teil.`),
  });
  console.log('Testdokumente:', fs.readdirSync(FX).join(', '));
}
