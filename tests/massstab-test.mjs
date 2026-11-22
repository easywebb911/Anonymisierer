// Nachbesserung 2.8.0 (Befund 1, Punkt 4/7): Maßstab über alle vorhandenen Testdateien und den Korpus.
// Jede Stelle (jedes Zeichen), die die Vorversion (2.7.0) ohne Antworten ersetzt, muss in 2.8.0 ebenfalls ersetzt sein:
//   a) ohne jede Antwort,
//   b) nach „Nein“ auf ALLE Einrichtungs-Fragen (gefundene Einrichtungen abgelehnt),
//   c) nach „Ja“ auf alle Einrichtungs-Fragen und danach „Nein“ (Weg über eine geänderte Antwort),
//   d) mit „Unsichere Treffer standardmäßig ersetzen“ aus (beide Versionen), ohne Antwort,
//   e) Version 2.8.1: „Unsichere“ aus, dann „Nein“ auf alle Einrichtungs-Fragen (Vorversion: „Unsichere“ aus),
//   f) Version 2.8.1: jede gefundene Einrichtung in der Liste ausgeschaltet, danach von Hand als Einrichtung markiert.
// Version 2.8.1: zweiter Maßstab gegen die Version davor (2.8.0, dritter Aufruf-Wert): Jede Stelle, die 2.8.0 ohne
// Antwort ersetzt, ist auch hier ersetzt. Keine Ausnahmen (Guardian-Lauf 5, Fund 3).
// Warum fand dieser Test Fund 1 (PR #19) nicht? Ablauf d verglich richtig, aber keine Testdatei enthielt einen Namen,
// der „unsicher, an“ ist (Regel a2) oder per Schalter eingeschaltet wurde, IN einer gefundenen Einrichtung; den Weg über
// den Schalter gab es als Ablauf nicht. Dafür jetzt tests/fixtures-traeger/nachbarn.* und die Abläufe e und f.
// Aufruf: node tests/massstab-test.mjs <index.html der Vorversion> [<index.html 2.8.0>]   (Ergebnis: tests/MASSSTAB-REPORT.md)
// Gegenprobe: MASSSTAB_HTML=<index.html> prüft eine andere neue Version.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { makeAll } from './make-traeger.mjs';
import { SECTIONS } from './korpus/korpus-quelle.mjs';
import { cached, fileSha, flush, refNote } from './referenz.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const NEW = process.env.MASSSTAB_HTML ? path.resolve(process.env.MASSSTAB_HTML) : path.join(root, 'index.html');
const OLD = process.argv[2] ? path.resolve(process.argv[2]) : null;
const PREV = process.argv[3] ? path.resolve(process.argv[3]) : null; // 2.8.0 (zweiter Maßstab)
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
      if (how === 'aus' || how === 'ausnein') A.app.state.settings.unsureOn = false;
      await A.openBytes(new Uint8Array(arr), nm);
      const orgQs = () => A.questions().filter((q) => q.kind === 'org');
      let nOrg = 0;
      if (how === 'janein') for (const id of orgQs().map((q) => q.id)) { const q = A.questions().find((x) => x.id === id); if (q) A.answer(q, true); }
      if (how === 'nein' || how === 'janein' || how === 'ausnein') {
        for (const id of orgQs().map((q) => q.id)) { const q = A.questions().find((x) => x.id === id); if (q) { A.answer(q, false); nOrg++; } }
      }
      // f) Liste: jede gefundene Einrichtung ausschalten (Schalter wie ein Mensch), dann von Hand als Einrichtung markieren
      let marked = 0;
      if (how === 'listemark') {
        const orgs = () => [...A.app.result.orgs.values()].filter((o) => o.hits.some((x) => x.auto));
        const names = orgs().map((o) => o.display);
        // Wie ein Mensch: Schalter aus; steht er danach noch auf an, nochmals (bekannt seit 2.8.0: schaltet man eine längere
        // Schreibweise aus, passt danach eine kürzere derselben Einrichtung darin und ist an, z. B. kurse.docx)
        let clicked = 0;
        for (let round = 0; round < 3; round++) {
          for (const d of names) {
            const i = [...document.querySelectorAll('input[aria-label]')].find((x) => x.getAttribute('aria-label') === d + ' an/aus');
            if (i && i.checked) { i.click(); clicked++; }
          }
        }
        // Beleg, dass der Ablauf wirkt: jede gefundene Einrichtung ist danach aus
        const stillOn = orgs().filter((o) => o.hits.some((x) => x.auto && x.on)).length;
        if (names.length && (clicked < names.length || stillOn)) throw new Error(`Liste: ${clicked}/${names.length} ausgeschaltet, noch an: ${stillOn}`);
        for (const d of names) { A.addOrg(d); marked++; }
        nOrg = marked;
      }
      const r = A.app.result;
      return { text: r.fullText, spans: r.hits.filter((h) => h.on).map((h) => [h.s, h.e, h.type]), nOrg };
    }, [[...fs.readFileSync(file)], path.basename(file), how]);
  } catch (e) { return { err: e.message.slice(0, 100) }; } finally { await ctx.close(); }
}
// Tempo (Teil 4): Ergebnis einer alten Version für eine Datei und einen Ablauf aus tests/referenz/ (ändert sich nie)
const oldCovered = (html, f, how) => cached('massstab', html, `${path.basename(f)}|${fileSha(f)}|${how}`, () => covered(html, f, how));
log('# Maßstab: Was 2.7.0 ersetzt, ersetzt auch diese Version (2.8.1) (ohne Antwort, nach „Nein“ auf alle Einrichtungs-Fragen, nach „Ja“ → „Nein“, mit „Unsichere“ aus)');
log('');
log(`Neue Version: ${path.basename(path.dirname(NEW))}/${path.basename(NEW)}; Vorversion: ${path.basename(OLD)}. Nur Chromium, Firefox prüft Easy.`);
log('');
log('| Datei | Stellen 2.7.0 | Einrichtungs-Fragen | ohne Antwort | nach „Nein“ | nach „Ja“ → „Nein“ | „Unsichere“ aus | „Unsichere“ aus, dann „Nein“ | Liste aus, dann markiert |' + (PREV ? ' gegen 2.8.0 (Stellen) |' : ''));
log('|---|---|---|---|---|---|---|---|---|' + (PREV ? '---|' : ''));
let nFiles = 0;
let nSpans = 0;
let bad = 0;
const fails = [];
const ausnahmen = [];
let nPrev = 0;
const HOW = { keine: 'ohne Antwort', nein: 'nach „Nein“', janein: 'nach „Ja“ → „Nein“', aus: '„Unsichere“ aus', ausnein: '„Unsichere“ aus, dann „Nein“', listemark: 'Liste aus, dann markiert' };
// Guardian-Lauf 5, Fund 3 (Entscheidung Easy): keine Ausnahme mehr; wie vor 2.8.1 zählt jedes nicht ersetzte Zeichen,
// das kein Leerraum ist (auch Satzzeichen)
function openToks(text, s, e, cov) {
  const out = [];
  for (let i = s; i < e; i++) if (!cov[i] && /\S/.test(text[i])) { out.push({ s: i, t: text.slice(s, e) }); break; }
  return out;
}
for (const f of files) {
  const rel = path.relative(here, f);
  const o = await oldCovered(OLD, f, 'keine');
  if (o.err) continue; // z. B. gescannte PDF ohne Text (in beiden Versionen gleich)
  const oAus = await oldCovered(OLD, f, 'aus');
  const res = {};
  for (const how of ['keine', 'nein', 'janein', 'aus', 'ausnein', 'listemark']) res[how] = await covered(NEW, f, how);
  if (Object.values(res).some((x) => x.err) || res.keine.text !== o.text) { fails.push(`${rel}: Text weicht ab oder Fehler`); bad++; continue; }
  nFiles++;
  const oldSpans = o.spans.filter((x) => o.text.slice(x[0], x[1]).trim());
  nSpans += oldSpans.length;
  const cell = (how) => {
    const cov = new Uint8Array(o.text.length + 1);
    for (const [s, e] of res[how].spans) for (let i = s; i < e; i++) cov[i] = 1;
    const miss = [];
    const ref = how === 'aus' || how === 'ausnein' ? oAus.spans.filter((x) => o.text.slice(x[0], x[1]).trim()) : oldSpans;
    for (const [s, e] of ref) {
      const open = openToks(o.text, s, e, cov);
      if (!open.length) continue;
      // Version 2.8.1, Teil 4: nur Zusatz + Kopfwort offen (2.7.0 hatte es als Teil eines Namens ersetzt) -> Ausnahme
      miss.push(o.text.slice(s, e));
    }
    if (miss.length) { bad++; fails.push(`${rel}, ${HOW[how]}: ${[...new Set(miss)].join(', ')}`); }
    return miss.length ? `**FEHLT** ${[...new Set(miss)].slice(0, 3).join(', ')}` : 'alle';
  };
  // Zweiter Maßstab (2.8.1): jede Stelle, die 2.8.0 ohne Antwort ersetzt, ist auch hier ersetzt
  let pcell = '';
  if (PREV) {
    const pv = await oldCovered(PREV, f, 'keine');
    if (pv.err || pv.text !== o.text) { fails.push(`${rel}: 2.8.0 Text weicht ab oder Fehler`); bad++; pcell = ' Fehler |'; } else {
      const cov = new Uint8Array(o.text.length + 1);
      for (const [s, e] of res.keine.spans) for (let i = s; i < e; i++) cov[i] = 1;
      const pm = [];
      const ps = pv.spans.filter((x) => o.text.slice(x[0], x[1]).trim());
      nPrev += ps.length;
      for (const [s, e] of ps) {
        const open = openToks(o.text, s, e, cov);
        if (!open.length) continue;
        pm.push(o.text.slice(s, e));
      }
      if (pm.length) { bad++; fails.push(`${rel}, gegen 2.8.0: ${[...new Set(pm)].join(', ')}`); }
      pcell = ` ${ps.length}: ${pm.length ? '**FEHLT** ' + [...new Set(pm)].slice(0, 3).join(', ') : 'alle'} |`;
    }
  }
  log(`| ${rel} | ${oldSpans.length} | ${res.nein.nOrg} | ${cell('keine')} | ${cell('nein')} | ${cell('janein')} | ${cell('aus')} | ${cell('ausnein')} | ${cell('listemark')} |${pcell}`);
}
await browser.close();
log('');
flush();
log(refNote());
log(`Geprüft: ${nFiles} Dateien (Testdateien und ${Object.keys(SECTIONS).length} Korpus-Abschnitte), ${nSpans} Stellen der Vorversion, je sechs Abläufe${PREV ? `; zweiter Maßstab: ${nPrev} Stellen von 2.8.0 (ohne Antwort)` : ''}.`);
if (fails.length) { log(''); log('Fehlende Stellen:'); for (const x of fails) log('- ' + x); }
log('');
log(`Ausnahmen: ${ausnahmen.length} (seit Guardian-Lauf 5 keine Ausnahme mehr erlaubt)`);
for (const x of ausnahmen) log('- ' + x);
log(`- ${requests.length ? 'FEHLER' : 'OK'}: 0 Anfragen ins Netz (${requests.length})`);
log(`- ${errors.length ? 'FEHLER' : 'OK'}: 0 Fehler in der Seite (${errors.length})`);
log('');
log(`**Ergebnis: ${bad || requests.length || errors.length ? 'NICHT bestanden' : 'bestanden'}** (${bad} Abweichung(en)).`);
if (!process.env.MASSSTAB_HTML) fs.writeFileSync(path.join(here, 'MASSSTAB-REPORT.md'), report.join('\n') + '\n');
process.exit(bad || requests.length || errors.length ? 1 : 0);
