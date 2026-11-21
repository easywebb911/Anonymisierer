// Endungsprüfung (Version 2.3.1): gebeugte Formen bereits erkannter Namen, deren Ende wie eine Endung aussieht.
// Je Form ersetzt ja/nein vorher (2.3.0) und nachher, Word/TXT/CSV; Kopf-/Fußzeile, Fußnote, Bildbeschreibung;
// Gegenprobe mit gewöhnlichen Wörtern; Schlusscheck-Vergleich; Kreislauf (rückbaufähig) über die Oberfläche; Doppellauf.
// Ergebnis: tests/ENDUNGEN-REPORT.md. Aufruf: node tests/endungen-test.mjs <index.html-der-Version-2.3.0>
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import JSZip from 'jszip';
import { startAnon, loadIn, ackAll, exportWithAck, saveKey } from './ui-helpers.mjs';
import { PEOPLE, lines, COMMON, GEGEN_PERSONEN } from './make-endungen.mjs';

const { chromium } = createRequire('/opt/node22/lib/node_modules/')('playwright');
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const fx = path.join(here, 'fixtures');
const newHtml = path.join(root, 'index.html');
const oldHtml = process.argv[2] ? path.resolve(process.argv[2]) : null;
if (!oldHtml) { console.error('Bitte Pfad zur index.html der Version 2.3.0 angeben.'); process.exit(2); }
const outDir = path.join(here, 'out-endungen');
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });
const report = [];
const log = (s = '') => { report.push(s); console.log(s); };
const checks = [];
const check = (name, ok, detail = '') => { checks.push([name, ok]); log(`- ${ok ? 'OK' : 'FEHLER'}: ${name}${detail ? ' – ' + detail : ''}`); };
const browser = await chromium.launch();
const requests = [];
let seq = 0;
async function newPage(html = newHtml) {
  const ctx = await browser.newContext({ acceptDownloads: true });
  const page = await ctx.newPage();
  page.on('request', (r) => requests.push(r.url()));
  page.on('dialog', (d) => d.accept());
  await page.goto('file://' + html);
  return { page, ctx };
}
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
// Ausgabe (derselbe Weg wie beim Speichern) + Schlusscheck + Treffer-Infos
async function run(html, file, mode, fmt) {
  const { page, ctx } = await newPage(html);
  const bytes = [...fs.readFileSync(path.join(fx, file))];
  const r = await page.evaluate(async ([b, f, m, fm]) => {
    const A = window.__anon;
    A.app.state.settings.mode = m;
    await A.openBytes(new Uint8Array(b), f);
    const o = await A.buildOutput(fm);
    const leaks = await A.finalCheck(o);
    const res = A.app.result;
    const hits = res.hits.filter((h) => h.type === 'person').map((h) => ({ w: res.fullText.slice(h.s, h.e), cert: h.cert, on: h.on }));
    return { zip: o.zip ? Array.from(o.bytes) : null, text: o.text || null, leaks: leaks.map((l) => l.word), hits };
  }, [bytes, file, mode, fmt]);
  await ctx.close();
  return r;
}
async function segs(r, fmt) {
  if (fmt === 'docx') {
    const z = await JSZip.loadAsync(Buffer.from(r.zip));
    const parts = [];
    for (const n of ['word/document.xml', 'word/header1.xml', 'word/footer1.xml', 'word/footnotes.xml']) {
      if (!z.file(n)) continue;
      const x = await z.file(n).async('string');
      for (const m of x.matchAll(/<w:p[ >][\s\S]*?<\/w:p>/g)) parts.push([...m[0].matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map((t) => t[1]).join(''));
      for (const m of x.matchAll(/descr="([^"]*)"/g)) parts.push('ALT: ' + m[1]);
    }
    return parts;
  }
  if (fmt === 'csv') return r.text.replace(/^﻿/, '').split(/\r?\n/).slice(1).map((l) => l.replace(/^\d+;"?|"$/g, ''));
  return r.text.replace(/^﻿/, '').split(/\r?\n/);
}

log('# Endungsprüfung (Version 2.3.1): Tests');
log('');
log('Testdokumente: tests/make-endungen.mjs (alle Namen erfunden, keiner in den Namenslisten). Vorher = Version 2.3.0, nachher = diese Version.');
log('');

// ---------- je Form vorher / nachher ----------
log('## Je Form: ersetzt vorher (2.3.0) / nachher, Modus „Person A“');
const L = lines();
const summary = {};
for (const fmt of ['docx', 'txt', 'csv']) {
  const file = `endungen.${fmt}`;
  const a = await run(oldHtml, file, 'person', fmt);
  const b = await run(newHtml, file, 'person', fmt);
  const sa = await segs(a, fmt);
  const sb = await segs(b, fmt);
  log(`### ${file}`);
  log('');
  log('| Name (Ende) | Form | vorher | nachher |');
  log('|---|---|---|---|');
  let fixed = 0;
  let worse = 0;
  let stillOpen = 0;
  L.forEach((l, i) => {
    if (!l.form) return;
    const stem = new RegExp(l.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const before = !stem.test(sa[i] || '');
    const after = !stem.test(sb[i] || '');
    if (!before && after) fixed++;
    if (before && !after) worse++;
    if (!after) stillOpen++;
    const pe = PEOPLE.find((p) => p[2] === l.name)[3];
    log(`| ${l.name} (${pe}) | ${l.form} | ${before ? 'ja' : 'nein'} | ${after ? 'ja' : 'NEIN'}${!before && after ? ' (neu)' : ''} |`);
  });
  summary[fmt] = { fixed, worse, stillOpen };
  log('');
  log(`- ${fmt}: neu ersetzt ${fixed}, schlechter ${worse}, weiterhin nicht ersetzt ${stillOpen}`);
  check(`${fmt}: keine Form schlechter als vorher; die bisher nur gemeldeten Formen „Wittekindhorns“, „Quabbenjansens“, „Tönnieskampes“ sind jetzt ersetzt`, worse === 0 && fixed === 3, `${fixed} neu ersetzt`);
  // Schlusscheck vorher / nachher
  log(`- Schlusscheck-Meldungen: vorher ${a.leaks.length} (${[...new Set(a.leaks)].join(', ')}), nachher ${b.leaks.length} (${[...new Set(b.leaks)].join(', ')})`);
  // Unbemerkte Reste: Formen, die in der Ausgabe stehen bleiben und der Schlusscheck NICHT meldet
  const unnoticed = (sx, r) => L.filter((l, i) => l.form && new RegExp(l.name, 'i').test(sx[i] || '')).map((l) => l.form).filter((f) => !r.leaks.includes(f));
  const ua = unnoticed(sa, a);
  const ub = unnoticed(sb, b);
  log(`- Unbemerkte Reste (stehen geblieben, nicht gemeldet): vorher ${ua.length} (${ua.join(', ') || '–'}), nachher ${ub.length} (${ub.join(', ') || '–'})`);
  check(`${fmt}: nachher kein unbemerkter Rest mehr; jede verbliebene Form wird gemeldet`, ub.length === 0, `vorher ${ua.length} unbemerkt`);
  log('');
}

// ---------- Kopf-/Fußzeile, Fußnote, Bildbeschreibung ----------
log('## Kopfzeile, Fußzeile, Fußnote, Bildbeschreibung (Word)');
{
  const a = await run(oldHtml, 'endungen-teile.docx', 'person', 'docx');
  const b = await run(newHtml, 'endungen-teile.docx', 'person', 'docx');
  const sa = await segs(a, 'docx');
  const sb = await segs(b, 'docx');
  for (const [i, where] of [[2, 'Kopfzeile'], [3, 'Fußzeile'], [4, 'Fußnote'], [5, 'Bildbeschreibung']].map(([i, w]) => [i, w])) {
    void i;
    const idx = sb.findIndex((x) => (where === 'Kopfzeile' ? /^Akte:/ : where === 'Fußzeile' ? /^Notiz/ : where === 'Fußnote' ? /^Hinweis/ : /^ALT:/).test(x));
    log(`- ${where}: vorher „${sa[idx]}“ → nachher „${sb[idx]}“`);
    check(`${where}: gebeugte Form jetzt ersetzt`, !/Quabbenjansen|Wittekindhorn|Tönnieskampe/.test(sb[idx]) && /Quabbenjansen|Wittekindhorn|Tönnieskampe/.test(sa[idx]));
  }
}
log('');

// ---------- Gegenprobe ----------
log('## Gegenprobe: gewöhnliche Wörter, die wie Name + Endung aussehen');
for (const file of ['gegenprobe-endungen.txt', 'gegenprobe-endungen.docx', 'gegenprobe-endungen-personen.txt', 'gegenprobe-endungen-personen.docx']) {
  const fmt = file.endsWith('docx') ? 'docx' : 'txt';
  const a = await run(oldHtml, file, 'person', fmt);
  const b = await run(newHtml, file, 'person', fmt);
  const mark = (r, w) => { const h = r.hits.find((x) => x.w === w || x.w.endsWith(' ' + w)); return h ? `ersetzt? ${h.on ? 'ja' : 'nein'} (${h.cert})` : 'kein Treffer'; };
  const rows = COMMON.map((w) => `${w}: vorher ${mark(a, w)}, nachher ${mark(b, w)}`);
  log(`- ${file}${/personen/.test(file) ? ' (mit Personen „' + GEGEN_PERSONEN[0].replace(/ sind da\./, '') + '“)' : ''}: ${rows.join('; ')}`);
  const same = sha(a.zip ? Buffer.from(a.zip) : a.text) === sha(b.zip ? Buffer.from(b.zip) : b.text);
  check(`${file}: Ausgabe vorher und nachher byte-gleich (keine neuen Treffer)`, same);
}
log('');

// ---------- Kreislauf ----------
log('## Kreislauf (rückbaufähig) mit den gebeugten Formen, über die Oberfläche');
async function restoreUI(file, key) {
  const { page, ctx } = await newPage();
  await page.click('#go-restore');
  await page.setInputFiles('#rb-file', file);
  await page.waitForFunction(() => document.querySelector('#rb-file-status').textContent);
  await page.setInputFiles('#rb-key', key);
  await page.waitForFunction(() => document.querySelector('#rb-key-status').textContent);
  await page.click('#rb-btn-check');
  const verdict = await page.evaluate(() => window.__anon.rb.plan.verdict);
  if (await page.$('#rb-kennung-ack')) await page.check('#rb-kennung-ack');
  if (await page.$('#rb-confirm')) await page.check('#rb-confirm');
  await page.click('#r2-next');
  if (await page.$('#rb-left-ack')) await page.check('#rb-left-ack').catch(() => {});
  const dlP = page.waitForEvent('download');
  await page.click('#rb-btn-save');
  const dl = await dlP;
  const p = path.join(outDir, `w${++seq}-${dl.suggestedFilename()}`);
  await dl.saveAs(p);
  await ctx.close();
  return { bytes: fs.readFileSync(p), verdict };
}
const sig = async (bytes, fmt) => {
  if (fmt === 'docx') {
    const z = await JSZip.loadAsync(bytes);
    const out = [];
    for (const n of Object.keys(z.files).filter((x) => /^word\/.*\.xml$/.test(x)).sort()) { const x = await z.file(n).async('string'); out.push(n, ...[...x.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>|descr="([^"]*)"/g)].map((m) => m[1] ?? m[2])); }
    return out.join('|');
  }
  return bytes.toString('utf8').replace(/^﻿/, '');
};
for (const [file, fmt] of [['endungen.docx', 'docx'], ['endungen.txt', 'txt'], ['endungen.csv', 'csv'], ['endungen-teile.docx', 'docx']]) {
  const { page, ctx } = await newPage();
  await startAnon(page, 'reversible');
  await loadIn(page, path.join(fx, file));
  await ackAll(page);
  const kd = await saveKey(page);
  const kp = path.join(outDir, `${++seq}-${kd.suggestedFilename()}`);
  await kd.saveAs(kp);
  const r = await exportWithAck(page, fmt);
  const ap = path.join(outDir, `${++seq}-${r.dl.suggestedFilename()}`);
  await r.dl.saveAs(ap);
  await ctx.close();
  const anon = await sig(fs.readFileSync(ap), fmt);
  const key = JSON.parse(fs.readFileSync(kp, 'utf8').replace(/^﻿/, ''));
  const back = await restoreUI(ap, kp);
  const orig = await sig(fs.readFileSync(path.join(fx, file)), fmt);
  const got = await sig(back.bytes, fmt);
  const sample = (anon.match(/[^|\n]*Nachname [A-Z]+s[^|\n]*/) || [''])[0].slice(0, 80);
  check(`${file}: Kreislauf exakt (gebeugte Formen als „Nachname Xs“, Endung am Platzhalter)`, got === orig && back.verdict === 'passend' && !/Quabbenjansens|Wittekindhorns|Tönnieskampes/.test(anon), `Beispiel: „${sample}“; Urteil „${back.verdict}“; ${key.platzhalter.length} Platzhalter`);
}
log('');

// ---------- Doppellauf ----------
log('## Doppellauf');
for (const [file, fmt] of [['endungen.docx', 'docx'], ['endungen.txt', 'txt'], ['endungen.csv', 'csv']]) {
  const a = await run(newHtml, file, 'person', fmt);
  const b = await run(newHtml, file, 'person', fmt);
  check(`${file}: zwei Läufe byte-gleich`, sha(a.zip ? Buffer.from(a.zip) : a.text) === sha(b.zip ? Buffer.from(b.zip) : b.text));
}

// ---------- Großschreibung mit Endung (gemeldet, nicht gebaut) ----------
log('');
log('## Gemeldet, nicht gebaut: GROSSSCHREIBUNG mit Endung („QUABBENJANSENS“)');
{
  const b = await run(newHtml, 'endungen.txt', 'person', 'txt');
  const forms = L.filter((l) => l.ending === 'S').map((l) => l.form);
  const out = b.text;
  const open = forms.filter((f) => out.includes(f));
  const flagged = open.filter((f) => b.leaks.includes(f));
  log(`- ${forms.length} Formen in GROSSSCHREIBUNG mit Endung „S“: nicht ersetzt ${open.length} (${open.join(', ')}); davon vom Schlusscheck gemeldet: ${flagged.length}.`);
  log('- Grund: Die Endungsliste enthält nur kleine Endungen („s“), ein großes „S“ zählt nicht als Endung (wie in 2.3.0). Das zu ändern wäre eine Erweiterung der Regel (Entscheidung Easy).');
}
await browser.close();

const failed = checks.filter((c) => !c[1]);
log('');
log(`Prüfungen: ${checks.length - failed.length} von ${checks.length} bestanden${failed.length ? ' – FEHLER: ' + failed.map((c) => c[0]).join('; ') : ''}.`);
log(`Netzwerkanfragen außer lokalen Dateien: ${requests.filter((u) => !/^(file|blob|data):/.test(u)).length}.`);
fs.writeFileSync(path.join(here, 'ENDUNGEN-REPORT.md'), report.join('\n') + '\n');
process.exit(failed.length ? 1 : 0);
