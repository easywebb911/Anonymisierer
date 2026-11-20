// Regressionstest: Alle Modi ("Person A", "[NAME]", "rückbaufähig") müssen für alle Testdokumente byte-gleiche
// Ausgaben liefern wie eine Referenzversion der index.html (z. B. der Stand vor einer Änderung).
// Aufruf: node tests/regression.mjs <alte-index.html> [neue-index.html]
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

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
  ['meta-word.docx', ['docx', 'txt']], ['meta-tabelle.xlsx', ['xlsx', 'txt']], ['meta-falle.docx', ['docx', 'txt']]];
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
  for (const f of formats) {
    res[f] = await page.evaluate(async (fmt) => {
      const o = await window.__anon.buildOutput(fmt);
      return o.zip ? Array.from(o.bytes) : o.text;
    }, f);
    res[f] = sha(typeof res[f] === 'string' ? res[f] : Buffer.from(res[f]));
  }
  await ctx.close();
  return res;
}
let total = 0;
let same = 0;
const lines = [];
for (const [file, formats] of FIXTURES) {
  for (const mode of ['person', 'name', 'reversible']) {
    const a = await outputs(oldHtml, file, mode, formats);
    const b = await outputs(newHtml, file, mode, formats);
    for (const f of formats) {
      total++;
      const ok = a[f] === b[f];
      if (ok) same++;
      lines.push(`- ${file}, Modus ${({ person: '„Person A“', name: '„[NAME]“', reversible: '„rückbaufähig“' })[mode]}, Ausgabe .${f}: ${ok ? 'identisch' : 'UNTERSCHIEDLICH'} (${a[f].slice(0, 12)} / ${b[f].slice(0, 12)})`);
    }
  }
}
await browser.close();
const out = [`Regression: ${same} von ${total} Ausgaben byte-identisch (Referenz ${sha(fs.readFileSync(oldHtml)).slice(0, 16)}…, neu ${sha(fs.readFileSync(newHtml)).slice(0, 16)}…)`, ...lines].join('\n');
console.log(out);
process.exit(same === total ? 0 : 1);
