// Nachbesserung 2.8.0 (Befund 1, Punkt 4/7): Maßstab über alle vorhandenen Testdateien und den Korpus.
// Jede Stelle (jedes Zeichen), die die Vorversion (2.7.0) ohne Antworten ersetzt, muss in 2.8.0 ebenfalls ersetzt sein:
//   a) ohne jede Antwort,
//   b) nach „Nein“ auf ALLE Einrichtungs-Fragen (gefundene Einrichtungen abgelehnt),
//   c) nach „Ja“ auf alle Einrichtungs-Fragen und danach „Nein“ (Weg über eine geänderte Antwort),
//   d) mit „Unsichere Treffer standardmäßig ersetzen“ aus (beide Versionen), ohne Antwort.
// Aufruf: node tests/massstab-test.mjs <index.html der Vorversion>   (Ergebnis: tests/MASSSTAB-REPORT.md)
// Gegenprobe: MASSSTAB_HTML=<index.html> prüft eine andere neue Version.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { makeAll } from './make-traeger.mjs';
import { SECTIONS } from './korpus/korpus-quelle.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const NEW = process.env.MASSSTAB_HTML ? path.resolve(process.env.MASSSTAB_HTML) : path.join(root, 'index.html');
const OLD = process.argv[2] ? path.resolve(process.argv[2]) : null;
if (!OLD) { console.error('Aufruf: node tests/massstab-test.mjs <index.html der Vorversion>'); process.exit(2); }
const outDir = path.join(here, 'out', 'massstab');
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });
let pwMod;
try { pwMod = createRequire(import.meta.url)('playwright'); } catch { pwMod = createRequire('/opt/node22/lib/node_modules/')('playwright'); }
await makeAll();

const report = [];
const log = (s = '') => { report.push(s); console.log(s); };
const files = [];
for (const d of fs.readdirSync(here).filter((x) => /^fixtures/.test(x) && !/alt/.test(x) && fs.statSync(path.join(here, x)).isDirectory()).sort()) {
  for (const f of fs.readdirSync(path.join(here, d)).sort()) if (/\.(txt|csv|docx|xlsx|pdf)$/i.test(f)) files.push(path.join(here, d, f));
}
for (const [name, t] of Object.entries(SECTIONS)) {
  const p = path.join(outDir, 'korpus-' + name + '.txt');
  fs.writeFileSync(p, t.replace(/[⟦⟧]/g, ''));
  files.push(p);
}
const browser = await pwMod.chromium.launch();
const requests = [];
const errors = [];
// Ersetzte Zeichen (Koordinaten im Gesamttext) nach einem Ablauf: 'keine' | 'nein' | 'janein'
async function covered(html, file, how) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  page.on('request', (r) => { if (!/^(file|blob|data):/.test(r.url())) requests.push(r.url()); });
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('dialog', (d) => d.accept());
  await page.goto('file://' + html);
  try {
    return await page.evaluate(async ([arr, nm, how]) => {
      const A = window.__anon;
      A.app.state.settings.mode = 'person';
      if (how === 'aus') A.app.state.settings.unsureOn = false;
      await A.openBytes(new Uint8Array(arr), nm);
      const orgQs = () => A.questions().filter((q) => q.kind === 'org');
      let nOrg = 0;
      if (how === 'janein') for (const id of orgQs().map((q) => q.id)) { const q = A.questions().find((x) => x.id === id); if (q) A.answer(q, true); }
      if (how === 'nein' || how === 'janein') {
        for (const id of orgQs().map((q) => q.id)) { const q = A.questions().find((x) => x.id === id); if (q) { A.answer(q, false); nOrg++; } }
      }
      const r = A.app.result;
      return { text: r.fullText, spans: r.hits.filter((h) => h.on).map((h) => [h.s, h.e, h.type]), nOrg };
    }, [[...fs.readFileSync(file)], path.basename(file), how]);
  } catch (e) { return { err: e.message.slice(0, 100) }; } finally { await ctx.close(); }
}
log('# Maßstab: Was 2.7.0 ersetzt, ersetzt auch 2.8.0 (ohne Antwort, nach „Nein“ auf alle Einrichtungs-Fragen, nach „Ja“ → „Nein“, mit „Unsichere“ aus)');
log('');
log(`Neue Version: ${path.basename(path.dirname(NEW))}/${path.basename(NEW)}; Vorversion: ${path.basename(OLD)}. Nur Chromium, Firefox prüft Easy.`);
log('');
log('| Datei | Stellen 2.7.0 | Einrichtungs-Fragen | ohne Antwort | nach „Nein“ | nach „Ja“ → „Nein“ | „Unsichere“ aus |');
log('|---|---|---|---|---|---|---|');
let nFiles = 0;
let nSpans = 0;
let bad = 0;
const fails = [];
for (const f of files) {
  const rel = path.relative(here, f);
  const o = await covered(OLD, f, 'keine');
  if (o.err) continue; // z. B. gescannte PDF ohne Text (in beiden Versionen gleich)
  const oAus = await covered(OLD, f, 'aus');
  const res = {};
  for (const how of ['keine', 'nein', 'janein', 'aus']) res[how] = await covered(NEW, f, how);
  if (Object.values(res).some((x) => x.err) || res.keine.text !== o.text) { fails.push(`${rel}: Text weicht ab oder Fehler`); bad++; continue; }
  nFiles++;
  const oldSpans = o.spans.filter((x) => o.text.slice(x[0], x[1]).trim());
  nSpans += oldSpans.length;
  const cell = (how) => {
    const cov = new Uint8Array(o.text.length + 1);
    for (const [s, e] of res[how].spans) for (let i = s; i < e; i++) cov[i] = 1;
    const miss = [];
    const ref = how === 'aus' ? oAus.spans.filter((x) => o.text.slice(x[0], x[1]).trim()) : oldSpans;
    for (const [s, e] of ref) {
      for (let i = s; i < e; i++) if (!cov[i] && /\S/.test(o.text[i])) { miss.push(o.text.slice(s, e)); break; }
    }
    if (miss.length) { bad++; fails.push(`${rel}, ${{ keine: 'ohne Antwort', nein: 'nach „Nein“', janein: 'nach „Ja“ → „Nein“', aus: '„Unsichere“ aus' }[how]}: ${[...new Set(miss)].join(', ')}`); }
    return miss.length ? `**FEHLT** ${[...new Set(miss)].slice(0, 3).join(', ')}` : 'alle';
  };
  log(`| ${rel} | ${oldSpans.length} | ${res.nein.nOrg} | ${cell('keine')} | ${cell('nein')} | ${cell('janein')} | ${cell('aus')} |`);
}
await browser.close();
log('');
log(`Geprüft: ${nFiles} Dateien (Testdateien und ${Object.keys(SECTIONS).length} Korpus-Abschnitte), ${nSpans} Stellen der Vorversion, je vier Abläufe.`);
if (fails.length) { log(''); log('Fehlende Stellen:'); for (const x of fails) log('- ' + x); }
log(`- ${requests.length ? 'FEHLER' : 'OK'}: 0 Anfragen ins Netz (${requests.length})`);
log(`- ${errors.length ? 'FEHLER' : 'OK'}: 0 Fehler in der Seite (${errors.length})`);
log('');
log(`**Ergebnis: ${bad || requests.length || errors.length ? 'NICHT bestanden' : 'bestanden'}** (${bad} Abweichung(en)).`);
if (!process.env.MASSSTAB_HTML) fs.writeFileSync(path.join(here, 'MASSSTAB-REPORT.md'), report.join('\n') + '\n');
process.exit(bad || requests.length || errors.length ? 1 : 0);
