// Regressionstest: Alle Modi ("Person A", "[NAME]", "rückbaufähig") müssen für alle Testdokumente byte-gleiche
// Ausgaben liefern wie eine Referenzversion der index.html (z. B. der Stand vor einer Änderung).
// Ausnahmen, die einzeln mit Grund ausgewiesen werden:
// - Kennung (seit 2.1, rückbaufähig): Eigenschaft, Dateiname.
// - Bildbeschreibungen (seit 2.2): Nur Dokumente MIT Alt-Text/Titel an Bildern oder Formen dürfen sich ändern, und nur
//   in diesen Beschreibungen (Word/Excel) bzw. durch die zusätzlichen Zeilen „[Bildbeschreibung …] …“ (Text-Ausgabe).
// Aufruf: node tests/regression.mjs <alte-index.html> [neue-index.html]
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import JSZip from 'jszip';

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
  ['bilder-word.docx', ['docx', 'txt']], ['bilder-excel.xlsx', ['xlsx', 'txt']]];
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');

const browser = await chromium.launch();
async function outputs(html, file, mode, formats) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto('file://' + html);
  await page.evaluate((m) => { const rb = document.querySelector(`input[name=mode][value="${m}"]`); rb.checked = true; rb.dispatchEvent(new Event('change')); }, mode);
  await page.setInputFiles('#file', path.join(here, 'fixtures', file));
  await page.waitForFunction(() => /Gelesen|nicht|Fehler/.test(document.querySelector('#load-status').textContent), null, { timeout: 120000 });
  const res = {};
  // Hat das Dokument Bildbeschreibungen? (nur die neue Version kennt die Abschnitte „Bildbeschreibung …“)
  res.altTexts = await page.evaluate(() => window.__anon.app.doc.units.filter((u) => /^Bildbeschreibung/.test(u.label)).map((u) => u.text));
  for (const f of formats) {
    res[f] = await page.evaluate(async (fmt) => {
      const o = await window.__anon.buildOutput(fmt);
      return o.zip ? Array.from(o.bytes) : o.text;
    }, f);
    const raw = res[f];
    res[f] = { sha: sha(typeof raw === 'string' ? raw : Buffer.from(raw)), parts: typeof raw === 'string' ? null : await normalizedParts(Buffer.from(raw)),
      noDesc: typeof raw === 'string' ? null : await normalizedParts(Buffer.from(raw), true), nsOrder: typeof raw === 'string' ? null : await nsOrder(Buffer.from(raw)), descs: typeof raw === 'string' ? null : await descValues(Buffer.from(raw)),
      text: typeof raw === 'string' ? raw : null };
  }
  await ctx.close();
  return res;
}
// Word/Excel-Teile ohne die Kennung (Version 2.1, Modus rückbaufähig): Eigenschaft „AnonymisiererKennung“
// entfernen; besteht der Teil danach nur noch aus der leeren Hülle, auch den Teil, seinen Verweis und Inhaltstyp.
// Nur für den Vergleich „gleich bis auf die Kennung“; byte-gleich wird weiterhin streng gezählt.
// noDesc: zusätzlich die Werte der Bildbeschreibungen (descr, title, VML alt/o:title) leeren
const DESC_ATTR = /\b(descr|title|alt|o:title)="[^"]*"/g;
async function normalizedParts(bytes, noDesc = false) {
  const z = await JSZip.loadAsync(bytes);
  const parts = {};
  // Ein für die Kennung neu geschriebener Teil verliert nur den Zeilenumbruch nach der XML-Kopfzeile: nicht als Unterschied zählen
  for (const n of Object.keys(z.files).filter((x) => !z.files[x].dir)) {
    parts[n] = /\.(xml|rels|vml)$/i.test(n) ? (await z.file(n).async('string')).replace(/^(<\?xml[^>]*\?>)\r?\n/, '$1') : sha(await z.file(n).async('nodebuffer'));
    // Ein Teil, dessen Bildbeschreibung sich ändert, wird neu geschrieben; dabei kann sich nur die Reihenfolge der
    // Namensraum-Angaben ändern (Inhalt gleich). Für diesen Vergleich werden sie entfernt.
    if (noDesc && /\.(xml|vml)$/i.test(n)) parts[n] = parts[n].replace(DESC_ATTR, '$1=""').replace(/\sxmlns(?::[\w.-]+)?="[^"]*"/g, '');
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
const withoutAltLines = (t) => t.split('\n').filter((l) => !/^\[Bildbeschreibung /.test(l)).join('\n');
const sameParts = (a, b) => !!a && !!b && JSON.stringify(Object.entries(a).sort()) === JSON.stringify(Object.entries(b).sort());
let total = 0;
let same = 0;
let onlyKennung = 0;
let altChanged = 0;
const lines = [];
const reasons = [];
for (const [file, formats] of FIXTURES) {
  for (const mode of ['person', 'name', 'reversible']) {
    const a = await outputs(oldHtml, file, mode, formats);
    const b = await outputs(newHtml, file, mode, formats);
    for (const f of formats) {
      total++;
      const ok = a[f].sha === b[f].sha;
      // Modus rückbaufähig: Word/Excel dürfen sich NUR durch die Kennung unterscheiden
      const kOnly = !ok && mode === 'reversible' && sameParts(a[f].parts, b[f].parts);
      // Version 2.2: Dokument mit Bildbeschreibungen darf sich NUR in diesen unterscheiden
      let alt = false;
      if (!ok && !kOnly && b.altTexts.length) {
        if (b[f].text !== null) alt = withoutAltLines(b[f].text) === a[f].text;
        else alt = sameParts(a[f].noDesc, b[f].noDesc);
      }
      if (ok) same++;
      if (kOnly) onlyKennung++;
      if (alt) altChanged++;
      const label = `${file}, Modus ${({ person: '„Person A“', name: '„[NAME]“', reversible: '„rückbaufähig“' })[mode]}, Ausgabe .${f}`;
      lines.push(`- ${label}: ${ok ? 'identisch' : kOnly ? 'gleich bis auf die Kennung (Eigenschaft)' : alt ? 'geändert nur in Bildbeschreibungen (Grund unten)' : 'UNTERSCHIEDLICH'} (${a[f].sha.slice(0, 12)} / ${b[f].sha.slice(0, 12)})`);
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
const bad = total - same - onlyKennung - altChanged;
const out = [`Regression: ${same} von ${total} Ausgaben byte-identisch, ${onlyKennung} gleich bis auf die Kennung, ${altChanged} nur in Bildbeschreibungen geändert, ${bad} unterschiedlich (Referenz ${sha(fs.readFileSync(oldHtml)).slice(0, 16)}…, neu ${sha(fs.readFileSync(newHtml)).slice(0, 16)}…)`,
  ...lines, '', reasons.length ? '## Geänderte Ausgaben einzeln mit Grund' : '', ...reasons].join('\n');
console.log(out);
process.exit(bad === 0 ? 0 : 1);
