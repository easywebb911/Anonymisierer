// Regressionstest: Alle Modi ("Person A", "[NAME]", "rückbaufähig") müssen für alle Testdokumente byte-gleiche
// Ausgaben liefern wie eine Referenzversion der index.html (z. B. der Stand vor einer Änderung).
// Ausnahmen, die einzeln mit Grund ausgewiesen werden:
// - Kennung (seit 2.1, rückbaufähig): Eigenschaft, Dateiname.
// - Bildbeschreibungen (seit 2.2): Nur Dokumente MIT Alt-Text/Titel an Bildern oder Formen dürfen sich ändern, und nur
//   in diesen Beschreibungen (Word/Excel) bzw. durch die zusätzlichen Zeilen „[Bildbeschreibung …] …“ (Text-Ausgabe).
// - Endungsprüfung (2.3.1) und GROSSSCHREIBUNG mit Endung (2.3.2): nur Zeilen mit diesen Formen dürfen sich ändern.
// - Kleine Endung hinter dem Platzhalter (2.3.3): eine Zeile darf sich NUR dadurch ändern, dass eine große Endung hinter
//   „Person X“, „[NAME]“, „Einrichtung X“ oder „[EINRICHTUNG]“ klein geschrieben wird.
// Aufruf: node tests/regression.mjs <alte-index.html> [neue-index.html]
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import JSZip from 'jszip';
import { orgTermTokens, isPureHeaderCell, isPerCellColumn } from '../src/core/detect.js';
import { cached, fileSha, flush, refNote } from './referenz.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const oldHtml = path.resolve(process.argv[2] || '');
const newHtml = path.resolve(process.argv[3] || path.join(root, 'index.html'));
if (!process.argv[2] || !fs.existsSync(oldHtml)) { console.error('Bitte Pfad zur Referenz-index.html angeben.'); process.exit(2); }
let chromium;
try { ({ chromium } = createRequire(import.meta.url)('playwright')); } catch { ({ chromium } = createRequire('/opt/node22/lib/node_modules/')('playwright')); }

// Alle Testdokumente; je Modus und Ausgabeformat wird die Ausgabe der Referenz mit der neuen verglichen
const FIXTURES = [['protokoll.txt', ['txt', 'docx']], ['mitarbeiter.csv', ['csv', 'txt', 'docx']], ['protokoll.docx', ['docx', 'txt']],
  ['mitarbeiter.xlsx', ['xlsx', 'txt']], ['protokoll.pdf', ['docx', 'txt']], ['rueckbau-fallen.txt', ['txt', 'docx']],
  ['kurse.docx', ['docx', 'txt']], ['a2-risiko.docx', ['docx', 'txt']], ['a2-risiko.txt', ['txt']], ['a2-risiko.csv', ['csv']],
  ['a2-uebertragung.docx', ['docx', 'txt']], ['a2-uebertragung.txt', ['txt']], ['a2-uebertragung.csv', ['csv']],
  ['meta-word.docx', ['docx', 'txt']], ['meta-tabelle.xlsx', ['xlsx', 'txt']], ['meta-falle.docx', ['docx', 'txt']],
  ['bilder-word.docx', ['docx', 'txt']], ['bilder-excel.xlsx', ['xlsx', 'txt']],
  // Version 2.3: Einrichtungs-Testdateien OHNE markierte Einrichtung (Zwei-Zeilen-Suche darf nichts ändern)
  ['einrichtung-umbruch.txt', ['txt', 'docx']], ['einrichtung-umbruch-crlf.txt', ['txt']], ['einrichtung.txt', ['txt']], ['einrichtung.docx', ['docx', 'txt']],
  // Version 2.3.1: Endungsprüfung (geänderte Ausgaben erwartet, Grund im Bericht von tests/endungen-test.mjs)
  ['endungen.txt', ['txt']], ['gegenprobe-endungen.txt', ['txt']], ['gegenprobe-endungen-personen.txt', ['txt']]];
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');

const browser = await chromium.launch();
async function outputs(html, file, mode, formats, orgTerms = null, treatFrom = null) {
  const res0 = {};
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto('file://' + html);
  // Version 2.8.0 (Nachweis): von Hand markierte Einrichtungen vor dem Laden setzen
  // (Regel c: Schreibweisen einer gefundenen Einrichtung sind eine Einrichtung -> in der alten Version „zusammenführen“)
  if (orgTerms) {
    const groups = orgTerms;
    const merges = {};
    for (const g of groups) for (const t of g.slice(1)) merges[orgTermTokens(t).key] = orgTermTokens(g[0]).key;
    await page.evaluate((t) => { window.__anon.app.state.orgTerms.push(...t); }, groups.flat());
    res0.merges = merges;
  }
  await page.evaluate((m) => { const rb = document.querySelector(`input[name=mode][value="${m}"]`); rb.checked = true; rb.dispatchEvent(new Event('change')); }, mode);
  await page.setInputFiles('#file', path.join(here, 'fixtures', file));
  await page.waitForFunction(() => /Gelesen|nicht|Fehler/.test(document.querySelector('#load-status').textContent), null, { timeout: 120000 });
  const res = {};
  // Version 2.10.0 (Nachweis): alle Spalten „wie bisher“ (nur die neue Version kennt die Behandlung je Spalte)
  // Version 2.11.0 (Nachweis): jede Spalte mit der Behandlung, die main (2.10.0) für sie hatte, Regel „seltene Werte“ aus
  if (treatFrom) await page.evaluate(async (tf) => { const A = window.__anon; A.app.state.colRare = false; for (const c of A.app.result.colPlan || []) A.app.state.colTreat[c.id] = tf[c.id] || 'bisher'; await A.applyColumns(); }, treatFrom);
  res.plan = await page.evaluate(() => Object.fromEntries(((window.__anon.app.result && window.__anon.app.result.colPlan) || []).map((c) => [c.id, c.treat])));
  // Version 2.10.0: Spalten mit Behandlung „Name“ oder „ganz ersetzen“ (für den Bericht)
  res.cols = await page.evaluate(() => ((window.__anon.app.result && window.__anon.app.result.colPlan) || []).filter((c) => c.treat !== 'bisher').map((c) => `„${c.header}“ ${c.treat === 'name' ? 'Name' : 'ganz ersetzen (' + c.kind + ')'}`));
  // Zusammenführen gilt je Dokument (wird beim Laden zurückgesetzt): nach dem Laden setzen und neu rechnen
  if (res0.merges && Object.keys(res0.merges).length) await page.evaluate((m) => { Object.assign(window.__anon.app.state.merges, m); window.__anon.runAnalysis(); }, res0.merges);
  // Hat das Dokument Bildbeschreibungen? (nur die neue Version kennt die Abschnitte „Bildbeschreibung …“)
  res.altTexts = await page.evaluate(() => window.__anon.app.doc.units.filter((u) => /^Bildbeschreibung/.test(u.label)).map((u) => u.text));
  // Version 2.8.0: selbst gefundene Einrichtungen (Schreibweisen) – nur die neue Version kennt sie
  res.orgGroups = await page.evaluate(() => [...window.__anon.app.result.orgs.values()].filter((o) => o.auto).map((o) => [...o.forms.keys()]));
  res.orgAuto = res.orgGroups.flat();
  // Version 2.11.1: Angaben (Platzhalter [ANGABE-n]) in der Reihenfolge im Text, mit Spalte; heikle Spalten (Wortstamm im
  // Spaltenkopf) nach der Regel von 2.11.1, auch für die alte Version (gleiche Spalten, gleiche Behandlung)
  if (mode === 'reversible') {
    const r0 = await page.evaluate(() => {
      const r = window.__anon.app.result;
      return { hits: r.hits.filter((h) => h.on && h.type === 'info').sort((a, b) => a.s - b.s).map((h) => [h.s, h.label, h.column || null]),
        plan: (r.colPlan || []).map((c) => ({ id: c.id, header: c.header, treat: c.treat, kind: c.kind })) };
    });
    const heikel = new Set(r0.plan.filter((c) => isPerCellColumn(c)).map((c) => c.id));
    res.angOther = r0.hits.filter((x) => !heikel.has(x[2])).map((x) => x[1]);
    res.angHeikel = r0.hits.filter((x) => heikel.has(x[2])).map((x) => x[1]);
  }
  for (const f of formats) {
    res[f] = await page.evaluate(async (fmt) => {
      const o = await window.__anon.buildOutput(fmt);
      return o.zip ? Array.from(o.bytes) : o.text;
    }, f);
    const raw = res[f];
    res[f] = { sha: sha(typeof raw === 'string' ? raw : Buffer.from(raw)), parts: typeof raw === 'string' ? null : await normalizedParts(Buffer.from(raw)),
      noDesc: typeof raw === 'string' ? null : await normalizedParts(Buffer.from(raw), true),
      partsAng: typeof raw === 'string' ? null : await normalizedParts(Buffer.from(raw), false, true),
      angabe: [...new Set((typeof raw === 'string' ? raw : await allXml(Buffer.from(raw))).match(ANG_RE) || [])].length,
      angabeAll: ((typeof raw === 'string' ? raw : await allXml(Buffer.from(raw))).match(ANG_RE) || []).length, nsOrder: typeof raw === 'string' ? null : await nsOrder(Buffer.from(raw)), descs: typeof raw === 'string' ? null : await descValues(Buffer.from(raw)),
      text: typeof raw === 'string' ? raw : null };
  }
  await ctx.close();
  return res;
}
// Tempo (Teil 4): Ausgaben der alten Version aus tests/referenz/ (ändern sich nie). Für den Beweis gespeichert = frisch
// zählt bei Word/Excel der Inhalt ohne die zufällige Kennung (parts), nicht die rohe Prüfsumme.
const noKennungSha = (r) => { for (const k of Object.keys(r)) if (r[k] && typeof r[k] === 'object' && r[k].parts) delete r[k].sha; return r; };
const oldOutputs = (file, mode, formats, orgTerms = null) => cached('regression', oldHtml,
  `${file}|${fileSha(path.join(here, 'fixtures', file))}|${mode}|${formats.join(',')}|${orgTerms ? JSON.stringify(orgTerms) : ''}`,
  () => outputs(oldHtml, file, mode, formats, orgTerms), noKennungSha);
// Word/Excel-Teile ohne die Kennung (Version 2.1, Modus rückbaufähig): Eigenschaft „AnonymisiererKennung“
// entfernen; besteht der Teil danach nur noch aus der leeren Hülle, auch den Teil, seinen Verweis und Inhaltstyp.
// Nur für den Vergleich „gleich bis auf die Kennung“; byte-gleich wird weiterhin streng gezählt.
// noDesc: zusätzlich die Werte der Bildbeschreibungen (descr, title, VML alt/o:title) leeren
const DESC_ATTR = /\b(descr|title|alt|o:title)="[^"]*"/g;
const ANG_RE = /\[ANGABE-\d+\]/g;
async function normalizedParts(bytes, noDesc = false, angabe = false) {
  const z = await JSZip.loadAsync(bytes);
  const parts = {};
  // Ein für die Kennung neu geschriebener Teil verliert nur den Zeilenumbruch nach der XML-Kopfzeile: nicht als Unterschied zählen
  for (const n of Object.keys(z.files).filter((x) => !z.files[x].dir)) {
    parts[n] = /\.(xml|rels|vml)$/i.test(n) ? (await z.file(n).async('string')).replace(/^(<\?xml[^>]*\?>)\r?\n/, '$1') : sha(await z.file(n).async('nodebuffer'));
    // Ein Teil, dessen Bildbeschreibung sich ändert, wird neu geschrieben; dabei kann sich nur die Reihenfolge der
    // Namensraum-Angaben ändern (Inhalt gleich). Für diesen Vergleich werden sie entfernt.
    if (noDesc && /\.(xml|vml)$/i.test(n)) parts[n] = parts[n].replace(DESC_ATTR, '$1=""').replace(/\sxmlns(?::[\w.-]+)?="[^"]*"/g, '');
    // Version 2.11.1: Nummern der Angaben gleich gesetzt (Nachweis „nur Nummern geändert“)
    if (angabe && typeof parts[n] === 'string') parts[n] = parts[n].replace(ANG_RE, '[ANGABE-#]');
  }
  for (const n of Object.keys(parts)) {
    if (typeof parts[n] !== 'string' || !parts[n].includes('name="AnonymisiererKennung"')) continue;
    parts[n] = parts[n].replace(/<property [^>]*name="AnonymisiererKennung"[^>]*>[\s\S]*?<\/property>/, '');
    if (!/<property[\s>]/.test(parts[n])) {
      delete parts[n];
      const esc = n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      for (const r of Object.keys(parts).filter((x) => /\.rels$/.test(x))) parts[r] = parts[r].replace(new RegExp(`<Relationship [^>]*Target="/?${esc}"[^>]*/>`), '');
      if (parts['[Content_Types].xml']) parts['[Content_Types].xml'] = parts['[Content_Types].xml'].replace(new RegExp(`<Override PartName="/${esc}"[^>]*/>`), '');
    }
  }
  return Object.fromEntries(Object.entries(parts).map(([k, v]) => [k, typeof v === 'string' ? sha(v) : v]));
}
// Version 2.11.1: aller XML-Text einer Word-/Excel-Ausgabe (Zahl der Platzhalter [ANGABE-n])
async function allXml(bytes) {
  const z = await JSZip.loadAsync(bytes);
  let t = '';
  for (const n of Object.keys(z.files).filter((x) => !z.files[x].dir && /\.xml$/i.test(x)).sort()) t += await z.file(n).async('string');
  return t;
}
// Werte aller Bildbeschreibungen einer Ausgabe (für die Begründung im Bericht)
async function descValues(bytes) {
  const z = await JSZip.loadAsync(bytes);
  const out = [];
  for (const n of Object.keys(z.files).filter((x) => !z.files[x].dir && /\.(xml|vml)$/i.test(x)).sort()) {
    for (const m of (await z.file(n).async('string')).matchAll(DESC_ATTR)) if (m[0].split('="')[1].length > 1) out.push(`${n}: ${m[0]}`);
  }
  return out;
}
// Namensraum-Angaben je Teil (Reihenfolge), um neu geschriebene Teile zu benennen
async function nsOrder(bytes) {
  const z = await JSZip.loadAsync(bytes);
  const out = {};
  for (const n of Object.keys(z.files).filter((x) => !z.files[x].dir && /\.(xml|vml)$/i.test(x))) out[n] = ((await z.file(n).async('string')).match(/\sxmlns(?::[\w.-]+)?="[^"]*"/g) || []).join('');
  return out;
}
// Version 2.3.1: gebeugte Formen, die erst die vollständige Endungsprüfung findet (nur diese Zeilen dürfen sich ändern)
const ENDING_FORMS = /Wittekindhorns|Quabbenjansens|Tönnieskampes/;
let endingChanged = 0;
// Version 2.3.2: GROSSSCHREIBUNG mit großer Endung (Testdokument endungen.*), jetzt ersetzt
const CAPS_FORMS = /LÜDINGHAUSS|WITTEKINDHORNS|QUABBENJANSENS|OSTERVELKENSS|HALLERMESS|TÖNNIESKAMPES/;
let capsChanged = 0;
// Version 2.3.3: große Endung hinter dem Platzhalter klein („Person AS“ → „Person As“)
const lowerSuffix = (l) => l.replace(/(Person [A-Z]{1,3}|Einrichtung [A-Z]{1,3}|\[NAME\]|\[EINRICHTUNG\])('S|’S|ES|NS|S|N)(?![\p{L}\p{N}])/gu, (m, a, b) => a + b.toLowerCase());
let lowerChanged = 0;
const withoutAltLines = (t) => t.split('\n').filter((l) => !/^\[Bildbeschreibung /.test(l)).join('\n');
const sameParts = (a, b) => !!a && !!b && JSON.stringify(Object.entries(a).sort()) === JSON.stringify(Object.entries(b).sort());
let total = 0;
let same = 0;
let onlyKennung = 0;
let altChanged = 0;
let v26Changed = 0;
let v28Changed = 0;
let v210Changed = 0;
let v2111Changed = 0;
// Version 2.11.1: Vergleich mit 2.11.0 streng (siehe unten)
const STRICT = path.basename(oldHtml) === 'index-2.11.0.html';
// Version 2.6.0 (Namensspalten, Anrede am Zeilenende, „von“): Diese Dokumente dürfen sich ändern, alle übrigen nicht
const CHANGED_260 = {
  'a2-risiko.txt': 'Anrede am Zeilenende: „Liebe Frau⏎Vielen Dank …“ und „Gesprächspartner: Herr⏎Schulleitung“ jetzt ersetzt (unsicher, an); Buchstaben danach verschoben.',
  'a2-uebertragung.csv': 'Spalte „Name“ ist Namensspalte (starkes Kopfwort): „Hartungs Antrag“ (reine Namenszelle) wird eine Person; Buchstaben danach verschoben.',
  'mitarbeiter.csv': 'Spalten „Vorname“/„Nachname“: Vor- und Nachname einer Zeile sind eine Person (ein Buchstabe; rückbaufähig „Vorname X“/„Nachname X“).',
  'mitarbeiter.xlsx': 'wie mitarbeiter.csv (eine Person je Zeile).',
};
const lines = [];
const reasons = [];
for (const [file, formats] of FIXTURES) {
  for (const mode of ['person', 'name', 'reversible']) {
    const a = await oldOutputs(file, mode, formats);
    const b = await outputs(newHtml, file, mode, formats);
    for (const f of formats) {
      total++;
      const ok = a[f].sha === b[f].sha;
      // Version 2.11.1 (Vergleich mit 2.11.0): streng. Erlaubt sind nur byte-gleich, gleich bis auf die Kennung (Modus
      // rückbaufähig, Word/Excel) und – nur im Modus rückbaufähig – Unterschiede allein in den Nummern der Platzhalter
      // [ANGABE-n] (eigene Nummer je Zelle in heiklen Spalten). Die Gründe früherer Versionen gelten hier nicht.
      if (STRICT) {
        const label = `${file}, Modus ${({ person: '„Person A“', name: '„[NAME]“', reversible: '„rückbaufähig“' })[mode]}, Ausgabe .${f}`;
        const kOnly = !ok && mode === 'reversible' && sameParts(a[f].parts, b[f].parts);
        let ang = false;
        if (!ok && !kOnly && mode === 'reversible') {
          ang = b[f].text !== null && a[f].text !== null ? a[f].text.replace(ANG_RE, '[ANGABE-#]') === b[f].text.replace(ANG_RE, '[ANGABE-#]') : sameParts(a[f].partsAng, b[f].partsAng);
          ang = ang && a[f].angabeAll === b[f].angabeAll;
          // strenger (Entscheidung Easy): die nicht heiklen Angaben, nach erstem Vorkommen neu nummeriert, genau gleich wie
          // in 2.11.0; in heiklen Spalten jede Angabe nur einmal
          const canon = (list) => { const m = new Map(); return list.map((x) => { if (!m.has(x)) m.set(x, m.size); return m.get(x); }).join(','); };
          const otherSame = canon(a.angOther || []) === canon(b.angOther || []) && (a.angOther || []).length === (b.angOther || []).length;
          const heikelUnique = new Set(b.angHeikel || []).size === (b.angHeikel || []).length;
          const shifted = JSON.stringify(a.angOther || []) !== JSON.stringify(b.angOther || []);
          if (ang && !(otherSame && heikelUnique)) reasons.push(`- ${label}: NICHT ERLAUBT – nicht heikle Angaben anders als in 2.11.0 (auch nach Umnummern) oder Nummer in heikler Spalte doppelt`);
          if (ang && otherSame && heikelUnique && shifted) reasons.push(`- ${label}: Nummern nicht heikler Angaben verschoben (nach Umnummern gleich wie 2.11.0): vorher ${[...new Set(a.angOther)].slice(0, 6).join(', ')} … / nachher ${[...new Set(b.angOther)].slice(0, 6).join(', ')} …`);
          ang = ang && otherSame && heikelUnique;
        }
        if (ok) same++;
        if (kOnly) onlyKennung++;
        if (ang) v2111Changed++;
        lines.push(`- ${label}: ${ok ? 'identisch' : kOnly ? 'gleich bis auf die Kennung (Eigenschaft)' : ang ? 'geändert nur in den Nummern der Angaben (Grund unten)' : 'UNTERSCHIEDLICH'} (${a[f].sha.slice(0, 12)} / ${b[f].sha.slice(0, 12)})`);
        if (ang) reasons.push(`- ${label}: nur Nummern der Platzhalter [ANGABE-n] geändert (gleich viele Stellen: ${b[f].angabeAll}); verschiedene Platzhalter vorher ${a[f].angabe}, nachher ${b[f].angabe}. Grund (Version 2.11.1): in heiklen Spalten eigene Nummer je Zelle (${(b.angHeikel || []).length} Zellen, alle verschieden, zuletzt vergeben); nicht heikle Angaben nach Umnummern gleich wie 2.11.0.`);
        continue;
      }
      // Version 2.11.0: Tabellen – Spalten behandeln, Personen-Tabellen. Nachweis je Ausgabe: Mit jeder Spalte in der
      // Behandlung von main (2.10.0) und ohne „seltene Werte“ liefert die neue Version GENAU die Ausgabe von main (bis auf
      // die Kennung). Dann stammt jede Änderung allein von den neuen Vorschlägen je Spalte und den seltenen Werten.
      if (!ok && b.cols && b.cols.length) {
        if (!b.v210ref) b.v210ref = await outputs(newHtml, file, mode, formats, null, a.plan || {});
        const c = b.v210ref[f];
        let v210 = c.sha === a[f].sha || (mode === 'reversible' && sameParts(c.parts, a[f].parts));
        // Version 2.11.0 (Entscheidung Easy): Eine Zelle der Kopfzeile, die nur aus üblichen Spaltenkopf-Wörtern besteht
        // (isPureHeaderCell), wird nie ersetzt (main ersetzte z. B. die Überschrift „Name“). Erlaubt ist eine Abweichung
        // nur in genau solchen Zellen der ersten Zeile (jetzt wie im Original) und die dadurch verschobenen Buchstaben der
        // Platzhalter (nach erstem Auftreten neu gezählt). Nur für CSV-Ausgaben aus CSV-Dateien. Jede Zelle steht im Bericht.
        let headOnly = null;
        if (!v210 && f === 'csv' && file.endsWith('.csv') && c.text !== null && a[f].text !== null) {
          const canon = (t) => { const m = new Map(); return t.replace(/(Person|Einrichtung|Vorname|Nachname|Name|Initiale) ([A-Z]{1,3})(\d*)/g, (x, w, l, d) => { const k = (w.startsWith('Einr') ? 'E' : 'P') + l; if (!m.has(k)) m.set(k, m.size); return `${w} #${m.get(k)}${d}`; }); };
          const orig = fs.readFileSync(path.join(here, 'fixtures', file), 'utf8').replace(/^\uFEFF/, '').split(/\r?\n/);
          const nRaw = c.text.replace(/^\uFEFF/, '').split(/\r?\n/);
          const oRaw = a[f].text.replace(/^\uFEFF/, '').split(/\r?\n/);
          const sep = orig[0].includes(';') ? ';' : ',';
          const oc = orig[0].split(sep);
          const mc = oRaw[0].split(sep);
          const cells = oc.map((x, i) => (mc[i] !== x ? x : null)).filter((x) => x !== null);
          // erste Zeile jetzt wie im Original, main wich nur in reinen Kopf-Zellen ab; alle übrigen Zeilen gleich
          if (nRaw[0] === orig[0] && cells.length && oc.length === mc.length && cells.every((x) => isPureHeaderCell(x)) && nRaw.length === oRaw.length
            && canon(nRaw.slice(1).join('\n')) === canon(oRaw.slice(1).join('\n'))) { headOnly = cells; v210 = true; }
        }
        // nie schwächer (Guardian-Lauf 1, Fund 4): in der neuen Text-Ausgabe kein Wort, das main nicht auch stehen lässt
        // (außer Wörtern der Platzhalter und den Wörtern der Kopf-Zellen oben)
        let weaker = [];
        if (v210 && b[f].text !== null && a[f].text !== null) {
          const ws = (t) => new Set(t.split(/[^\p{L}\p{N}]+/u).filter(Boolean));
          const PH = /^(Person|Vorname|Nachname|Name|Initiale|Einrichtung|DATUM|ANGABE|ADRESSE|TELEFON|E|MAIL|IBAN|WEBADRESSE|KONTO|NAME|EINRICHTUNG|[A-Z]{1,3}\d*|\d+)$/;
          const old = ws(a[f].text);
          const headWs = ws((headOnly || []).join(' '));
          weaker = [...ws(b[f].text)].filter((w) => !old.has(w) && !PH.test(w) && !headWs.has(w));
          if (weaker.length) v210 = false;
        }
        if (headOnly) reasons.push(`- ${file}, Modus ${mode}, Ausgabe .${f}: Ausnahme Kopfzeile (Regel 1, nur übliche Spaltenkopf-Wörter), main ersetzte darin: ${headOnly.map((x) => `„${x}“`).join(', ')}`);
        if (weaker.length) reasons.push(`- ${file}, Modus ${mode}, Ausgabe .${f}: SCHWÄCHER als main, neu im Klartext: ${weaker.slice(0, 10).join(', ')}`);
        if (v210) {
          v210Changed++;
          const label = `${file}, Modus ${({ person: '„Person A“', name: '„[NAME]“', reversible: '„rückbaufähig“' })[mode]}, Ausgabe .${f}`;
          lines.push(`- ${label}: geändert durch die Spalten-Behandlung von Version 2.11.0 (Grund unten) (${a[f].sha.slice(0, 12)} / ${b[f].sha.slice(0, 12)})`);
          let detail = '';
          if (b[f].text !== null && a[f].text !== null) {
            const ol = a[f].text.split('\n');
            const nl = b[f].text.split('\n');
            const diff = nl.map((l, i) => (l !== ol[i] ? i : -1)).filter((i) => i >= 0);
            detail = ` ${diff.length} Zeile(n): ${diff.slice(0, 2).map((i) => `„${ol[i]}“ → „${nl[i]}“`).join('; ')}${diff.length > 2 ? '; …' : ''}.`;
          }
          reasons.push(`- ${label}:${detail} Grund (Version 2.11.0): Spalten jetzt ${b.cols.join(', ')}; mit den Spalten wie in main und ohne „seltene Werte“ ist die Ausgabe gleich der von main${headOnly ? ' bis auf die Kopf-Zellen ' + headOnly.map((x) => `„${x}“`).join(', ') + ' (seit 2.11.0 nie ersetzt) und die dadurch verschobenen Buchstaben' : ''}.`);
          continue;
        }
      }
      // Modus rückbaufähig: Word/Excel dürfen sich NUR durch die Kennung unterscheiden
      const kOnly = !ok && mode === 'reversible' && sameParts(a[f].parts, b[f].parts);
      // Version 2.2: Dokument mit Bildbeschreibungen darf sich NUR in diesen unterscheiden
      let alt = false;
      if (!ok && !kOnly && b.altTexts.length) {
        if (b[f].text !== null) alt = withoutAltLines(b[f].text) === a[f].text;
        else alt = sameParts(a[f].noDesc, b[f].noDesc);
      }
      // Version 2.3.1: Endungsprüfung – nur Zeilen mit den neu gefundenen gebeugten Formen dürfen sich ändern
      let ending = false;
      if (!ok && !kOnly && !alt && b[f].text !== null && a[f].text !== null) {
        const ol = a[f].text.split('\n');
        const nl = b[f].text.split('\n');
        const diff = nl.map((l, i) => (l !== ol[i] ? i : -1)).filter((i) => i >= 0);
        ending = ol.length === nl.length && diff.length > 0 && diff.every((i) => ENDING_FORMS.test(ol[i]) && !ENDING_FORMS.test(nl[i]));
        if (ending) reasons.push(`- ${file}, Modus ${mode}, Ausgabe .${f}: ${diff.length} Zeilen geändert, nur gebeugte Formen jetzt ersetzt (z. B. „${ol[diff[0]]}“ → „${nl[diff[0]]}“). Grund: Die Endungsprüfung probiert jetzt alle Zerlegungen.`);
      }
      // Version 2.3.2: nur Zeilen mit GROSS-Formen mit Endung dürfen sich ändern (vorher da, nachher ersetzt)
      let caps = false;
      if (!ok && !kOnly && !alt && !ending && b[f].text !== null && a[f].text !== null) {
        const ol = a[f].text.split('\n');
        const nl = b[f].text.split('\n');
        const diff = nl.map((l, i) => (l !== ol[i] ? i : -1)).filter((i) => i >= 0);
        caps = ol.length === nl.length && diff.length > 0 && diff.every((i) => CAPS_FORMS.test(ol[i]) && !CAPS_FORMS.test(nl[i]));
        if (caps) reasons.push(`- ${file}, Modus ${mode}, Ausgabe .${f}: ${diff.length} Zeilen geändert, nur GROSS-Formen mit Endung jetzt ersetzt (${diff.map((i) => `„${ol[i]}“ → „${nl[i]}“`).join('; ')}). Grund: Version 2.3.2 behandelt die große Endung nach einem GROSS geschriebenen Namen wie die kleine.`);
      }
      if (caps) capsChanged++;
      let lower = false;
      if (!ok && !kOnly && !alt && !ending && !caps && b[f].text !== null && a[f].text !== null) {
        const ol = a[f].text.split('\n');
        const nl = b[f].text.split('\n');
        const diff = nl.map((l, i) => (l !== ol[i] ? i : -1)).filter((i) => i >= 0);
        lower = ol.length === nl.length && diff.length > 0 && diff.every((i) => lowerSuffix(ol[i]) === nl[i]);
        if (lower) reasons.push(`- ${file}, Modus ${mode}, Ausgabe .${f}: ${diff.length} Zeilen geändert, nur große Endung hinter dem Platzhalter jetzt klein (${diff.slice(0, 2).map((i) => `„${ol[i]}“ → „${nl[i]}“`).join('; ')}${diff.length > 2 ? '; …' : ''}). Grund: Version 2.3.3, damit „Person AS“ nie wie eine andere Person aussieht.`);
      }
      if (lower) lowerChanged++;
      // Version 2.8.0: Einrichtungen selbst finden. Nachweis je Ausgabe: Die alte Version liefert GENAU dieselbe Ausgabe
      // (bis auf die Kennung), wenn man ihr die von 2.8.0 gefundenen Einrichtungen als von Hand markiert vorgibt. Dann
      // stammt jede Änderung allein von den gefundenen Einrichtungen.
      let v28 = false;
      if (!ok && !kOnly && b.orgAuto.length) {
        if (!b.v28ref) b.v28ref = await oldOutputs(file, mode, formats, b.orgGroups);
        const c = b.v28ref[f];
        v28 = c.sha === b[f].sha || (mode === 'reversible' && sameParts(c.parts, b[f].parts));
        if (v28) {
          v28Changed++;
          let detail = '';
          if (b[f].text !== null && a[f].text !== null) {
            const ol = a[f].text.split('\n');
            const nl = b[f].text.split('\n');
            const diff = nl.map((l, i) => (l !== ol[i] ? i : -1)).filter((i) => i >= 0);
            detail = ` ${diff.length} Zeile(n): ${diff.slice(0, 2).map((i) => `„${ol[i]}“ → „${nl[i]}“`).join('; ')}${diff.length > 2 ? '; …' : ''}.`;
          }
          reasons.push(`- ${file}, Modus ${mode}, Ausgabe .${f}:${detail} Grund (Version 2.8.0): selbst gefundene Einrichtung(en) ${[...new Set(b.orgAuto)].map((x) => '„' + x + '“').join(', ')}; Ausgabe gleich der von 2.7.0 mit diesen als von Hand markiert${b.orgGroups.some((g) => g.length > 1) ? ' (Schreibweisen derselben Einrichtung zusammengeführt, Regel c)' : ''}.`);
        }
      }
      // Version 2.6.0: Dokumente, die sich durch die neuen Regeln gewollt ändern (Grund je Dokument, Zeilen im Bericht)
      const v26 = !ok && !kOnly && !v28 && !alt && !ending && !caps && !lower && !!CHANGED_260[file];
      if (v26) {
        v26Changed++;
        let detail = '';
        if (b[f].text !== null && a[f].text !== null) {
          const ol = a[f].text.split('\n');
          const nl = b[f].text.split('\n');
          const diff = nl.map((l, i) => (l !== ol[i] ? i : -1)).filter((i) => i >= 0);
          detail = ` ${diff.length} Zeile(n): ${diff.slice(0, 3).map((i) => `„${ol[i]}“ → „${nl[i]}“`).join('; ')}${diff.length > 3 ? '; …' : ''}.`;
        }
        reasons.push(`- ${file}, Modus ${mode}, Ausgabe .${f}:${detail} Grund (Version 2.6.0): ${CHANGED_260[file]}`);
      }
      if (ok) same++;
      if (kOnly) onlyKennung++;
      if (alt) altChanged++;
      if (ending) endingChanged++;
      const label = `${file}, Modus ${({ person: '„Person A“', name: '„[NAME]“', reversible: '„rückbaufähig“' })[mode]}, Ausgabe .${f}`;
      lines.push(`- ${label}: ${ok ? 'identisch' : v28 ? 'geändert durch die Regeln von Version 2.8.0 (Grund unten)' : v26 ? 'geändert durch die Regeln von Version 2.6.0 (Grund unten)' : kOnly ? 'gleich bis auf die Kennung (Eigenschaft)' : alt ? 'geändert nur in Bildbeschreibungen (Grund unten)' : ending ? 'geändert nur durch die Endungsprüfung (Grund unten)' : caps ? 'geändert nur durch GROSS-Formen mit Endung (Grund unten)' : lower ? 'geändert nur durch kleine Endung hinter dem Platzhalter (Grund unten)' : 'UNTERSCHIEDLICH'} (${a[f].sha.slice(0, 12)} / ${b[f].sha.slice(0, 12)})`);
      if (alt) {
        if (b[f].text !== null) reasons.push(`- ${label}: neue Zeilen ${b[f].text.split('\n').filter((l) => /^\[Bildbeschreibung /.test(l)).map((l) => `„${l}“`).join(', ')} (Bildbeschreibungen sind jetzt eigene Textabschnitte); alle übrigen Zeilen gleich.`);
        else {
          const old = new Set(a[f].descs);
          const neu = new Set(b[f].descs);
          const gone = a[f].descs.filter((x) => !neu.has(x));
          const added = b[f].descs.filter((x) => !old.has(x));
          const nsOnly = Object.keys(b[f].nsOrder).filter((k) => a[f].nsOrder[k] !== undefined && a[f].nsOrder[k] !== b[f].nsOrder[k]);
          reasons.push(`- ${label}: nur Bildbeschreibungen geändert: ${gone.map((x) => `vorher ${x}`).join('; ')} → ${added.map((x) => `nachher ${x}`).join('; ')}. Grund: Die Beschreibung läuft jetzt durch die Erkennung wie Text.${nsOnly.length ? ` Neu geschrieben (nur Reihenfolge der Namensraum-Angaben anders, Inhalt gleich): ${nsOnly.join(', ')}.` : ''}`);
        }
      }
    }
  }
}
await browser.close();
const bad = total - same - onlyKennung - altChanged - endingChanged - capsChanged - lowerChanged - v26Changed - v28Changed - v210Changed - v2111Changed;
const out = [`Regression: ${same} von ${total} Ausgaben byte-identisch, ${onlyKennung} gleich bis auf die Kennung, ${altChanged} nur in Bildbeschreibungen geändert, ${endingChanged} nur durch die Endungsprüfung geändert, ${capsChanged} nur durch GROSS-Formen mit Endung geändert, ${lowerChanged} nur durch kleine Endung hinter dem Platzhalter geändert, ${v26Changed} durch die Regeln von Version 2.6.0 geändert, ${v28Changed} durch die Regeln von Version 2.8.0 geändert, ${v210Changed} durch die Spalten-Behandlung von Version 2.11.0 geändert, ${v2111Changed} nur durch eigene Nummern je Zelle in heiklen Spalten (2.11.1) geändert, ${bad} unterschiedlich (Referenz ${sha(fs.readFileSync(oldHtml)).slice(0, 16)}…, neu ${sha(fs.readFileSync(newHtml)).slice(0, 16)}…)`,
  ...lines, '', reasons.length ? '## Geänderte Ausgaben einzeln mit Grund' : '', ...reasons].join('\n');
flush();
console.log(out);
console.log(refNote());
process.exit(bad === 0 ? 0 : 1);
