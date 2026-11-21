// Platzhalter mit Endung und Rückbau-Sicherheitsnetz (Version 2.3.3), über die echte Oberfläche.
// Einrichtungen in GROSS mit Endung (Word, TXT, CSV, Excel; Text, Kopfzeile, Bildbeschreibung): Rückbau vorher/nachher;
// Verwechslungs-Test (50 Personen/Einrichtungen); Sicherheitsnetz mit beschädigten Platzhaltern; Gegenprobe;
// Reste in den bisherigen Testdokumenten (Kreislauf am Kern); weitere Verwechslungen; Doppellauf.
// Ergebnis: tests/PLATZHALTER-REPORT.md. Aufruf: node tests/platzhalter-test.mjs <index.html-der-Version-2.3.2>
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import JSZip from 'jszip';
import { startAnon, loadIn, ackAll, exportWithAck, saveKey } from './ui-helpers.mjs';
import { ORG, orgLines, ORG_HEADER, ORG_DESCR, orgs, GEGEN_PLATZHALTER } from './make-platzhalter.mjs';
import { analyze, defaultState, replacementsByUnit, applyReplacements } from '../src/core/detect.js';
import { buildRestoreKey } from '../src/core/reversible.js';
import { parseKeyFile, planRestore } from '../src/core/restore.js';

const { chromium } = createRequire('/opt/node22/lib/node_modules/')('playwright');
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const fx = path.join(here, 'fixtures');
const newHtml = path.join(root, 'index.html');
const oldHtml = process.argv[2] ? path.resolve(process.argv[2]) : null;
if (!oldHtml) { console.error('Bitte Pfad zur index.html der Version 2.3.2 angeben.'); process.exit(2); }
const outDir = path.join(here, 'out-platzhalter');
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
const dec = (s) => s.replace(/&apos;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
// Alle sichtbaren Texte einer Datei (Word: w:t, Excel: Zellen/Kopfzeile, beide: Bildbeschreibungen), in Reihenfolge
async function texts(bytes, fmt) {
  if (fmt !== 'docx' && fmt !== 'xlsx') return bytes.toString('utf8').replace(/^﻿/, '');
  const z = await JSZip.loadAsync(bytes);
  const out = [];
  for (const n of Object.keys(z.files).filter((x) => /^(word|xl)\/.*\.xml$/.test(x)).sort()) {
    const x = await z.file(n).async('string');
    for (const m of x.matchAll(/<(?:w:t|t|oddHeader)(?: [^>]*)?>([^<]*)<\/(?:w:t|t|oddHeader)>|descr="([^"]*)"/g)) out.push(dec(m[1] ?? m[2]));
  }
  return out.join('\n');
}
// Anonymisieren über die Oberfläche (Modus, eigene Einrichtungen), Schlüssel und Datei speichern
async function anonUI(html, file, fmt, mode, orgTerms = []) {
  const { page, ctx } = await newPage(html);
  await startAnon(page, mode);
  await page.evaluate((o) => { window.__anon.app.state.orgTerms = o; }, orgTerms);
  await loadIn(page, file);
  await ackAll(page);
  let kp = null;
  if (mode === 'reversible') {
    const kd = await saveKey(page);
    kp = path.join(outDir, `${++seq}-${kd.suggestedFilename()}`);
    await kd.saveAs(kp);
  }
  const r = await exportWithAck(page, fmt);
  const ap = path.join(outDir, `${++seq}-${r.dl.suggestedFilename()}`);
  await r.dl.saveAs(ap);
  await ctx.close();
  return { ap, kp };
}
// Rückbau über die Oberfläche; liefert Bericht (Reste, Sperre) und die gespeicherte Datei
async function restoreUI(html, file, key, { ackRests = true } = {}) {
  const { page, ctx } = await newPage(html);
  await page.click('#go-restore');
  await page.setInputFiles('#rb-file', file);
  await page.waitForFunction(() => document.querySelector('#rb-file-status').textContent);
  await page.setInputFiles('#rb-key', key);
  await page.waitForFunction(() => document.querySelector('#rb-key-status').textContent);
  await page.click('#rb-btn-check');
  if (await page.$('#rb-kennung-ack')) await page.check('#rb-kennung-ack');
  if (await page.$('#rb-confirm')) await page.check('#rb-confirm');
  const rests = await page.$$eval('#rb-rests li', (l) => l.map((x) => ({ text: x.querySelector('strong').textContent, line: x.textContent, red: x.className === 'bad' })));
  const restRowBad = await page.evaluate(() => [...document.querySelectorAll('#rb-report .ampel > li')].some((li) => /Platzhalter-Reste/.test(li.textContent) && li.classList.contains('bad')));
  const blockedBefore = await page.isDisabled('#r2-next');
  if (ackRests && await page.$('#rb-rest-ack')) await page.check('#rb-rest-ack');
  const blockedAfter = await page.isDisabled('#r2-next');
  const plan = await page.evaluate(() => ({ verdict: window.__anon.rb.plan.verdict, issues: window.__anon.rb.plan.issues.length }));
  let bytes = null;
  let left = [];
  if (!blockedAfter) {
    await page.click('#r2-next');
    const dlP = page.waitForEvent('download', { timeout: 20000 }).catch(() => null);
    await page.click('#rb-btn-save');
    let dl = await Promise.race([dlP, page.waitForFunction(() => /blockiert/.test(document.querySelector('#rb-status').textContent), null, { timeout: 20000 }).then(() => null).catch(() => null)]);
    if (!dl) {
      left = await page.$$eval('#rb-left li', (l) => l.map((x) => x.textContent));
      if (await page.$('#rb-left input[type=checkbox]')) {
        await page.check('#rb-left input[type=checkbox]');
        const dlP2 = page.waitForEvent('download', { timeout: 20000 });
        await page.click('#rb-btn-save');
        dl = await dlP2;
      }
    }
    if (dl) { const p = path.join(outDir, `w${++seq}-${dl.suggestedFilename()}`); await dl.saveAs(p); bytes = fs.readFileSync(p); }
  }
  await ctx.close();
  return { rests, restRowBad, blockedBefore, blockedAfter, left, bytes, ...plan };
}

log('# Platzhalter mit Endung und Rückbau-Sicherheitsnetz (Version 2.3.3): Tests');
log('');
log('Testdokumente: tests/make-platzhalter.mjs (alles erfunden). Vorher = Version 2.3.2, nachher = diese Version.');
log('');

// ---------- 1. Einrichtungen in GROSS mit Endung ----------
log('## 1. Einrichtung „Lindenauer Bürgerverein“ in GROSS mit Endung, Modus rückbaufähig, Kreislauf über die Oberfläche');
const OL = orgLines();
const forms = [...OL.map((l) => ({ kind: l.kind, needle: l.text })), { kind: 'Kopfzeile', needle: ORG_HEADER }, { kind: 'Bildbeschreibung', needle: ORG_DESCR }];
for (const fmt of ['docx', 'txt', 'csv', 'xlsx']) {
  const file = path.join(fx, `einrichtung-gross.${fmt}`);
  const orig = await texts(fs.readFileSync(file), fmt);
  const res = {};
  for (const [lbl, html] of [['vorher', oldHtml], ['nachher', newHtml]]) {
    const { ap, kp } = await anonUI(html, file, fmt, 'reversible', [ORG]);
    const anon = await texts(fs.readFileSync(ap), fmt);
    const back = await restoreUI(html, ap, kp);
    const got = back.bytes ? await texts(back.bytes, fmt) : '';
    const rel = forms.filter((f) => fmt === 'docx' || fmt === 'xlsx' || (f.kind !== 'Kopfzeile' && f.kind !== 'Bildbeschreibung'));
    const ok = rel.filter((f) => got.includes(f.needle));
    res[lbl] = { anon, got, ok: ok.length, all: rel.length, missing: rel.filter((f) => !got.includes(f.needle)).map((f) => f.kind), exact: got === orig, back };
  }
  const sample = (res.nachher.anon.match(/Form 5: [^\n]*/) || [''])[0];
  log(`- ${path.basename(file)}: vorher ${res.vorher.ok}/${res.vorher.all} Formen exakt zurück${res.vorher.missing.length ? ' (nicht exakt: ' + res.vorher.missing.join(', ') + ')' : ''}; nachher ${res.nachher.ok}/${res.nachher.all}. Beispiel nachher: „${sample}“`);
  check(`${path.basename(file)}: Kreislauf nachher exakt (alle Formen, ganze Datei), keine Reste, Urteil „passend“`, res.nachher.exact && res.nachher.ok === res.nachher.all && res.nachher.back.rests.length === 0 && res.nachher.back.verdict === 'passend', `Reste ${res.nachher.back.rests.length}, Auffälligkeiten ${res.nachher.back.issues}`);
  if (!res.vorher.exact) log(`  - vorher blieb im Ergebnis stehen: ${[...new Set((res.vorher.got.match(/Einrichtung [A-Z]+\d*[A-Z’']+\w*/g) || []))].join(', ') || '–'}`);
}
log('');

// ---------- 2. Modus „Person A“ / „[NAME]“: große Endung klein ----------
log('## 2. Verwechslung: 50 Personen und 50 Einrichtungen („Person AS“ ist eine eigene Person); „MÜLLERS“ gehört zu Person A');
async function runOut(html, file, mode, fmt, orgTerms) {
  const { page, ctx } = await newPage(html);
  const bytes = [...fs.readFileSync(path.join(fx, file))];
  const r = await page.evaluate(async ([b, f, m, fm, o]) => {
    const A = window.__anon;
    A.app.state.settings.mode = m;
    A.app.state.orgTerms = o;
    await A.openBytes(new Uint8Array(b), f);
    const out = await A.buildOutput(fm);
    return { text: out.text || null, zip: out.zip ? Array.from(out.bytes) : null };
  }, [bytes, file, mode, fmt, orgTerms]);
  await ctx.close();
  return { ...r, plain: r.zip ? await texts(Buffer.from(r.zip), fmt) : r.text };
}
for (const fmt of ['txt', 'docx']) {
  for (const mode of ['person', 'name']) {
    const a = await runOut(oldHtml, `verwechslung.${fmt}`, mode, fmt, orgs());
    const b = await runOut(newHtml, `verwechslung.${fmt}`, mode, fmt, orgs());
    const lastA = a.plain.trim().split('\n').pop();
    const lastB = b.plain.trim().split('\n').pop();
    const p45 = (b.plain.split('\n').find((l) => /^45\./.test(l)) || '');
    log(`- verwechslung.${fmt}, Modus ${mode}: Zeile 45 „${p45}“; letzte Zeile vorher „${lastA}“ → nachher „${lastB}“`);
    if (mode === 'person') check(`verwechslung.${fmt}: „MÜLLERS“ → „Person As“, „LINDENAUER BÜRGERVEREINS“ → „Einrichtung As“, unterscheidbar von „Person AS“ und „Einrichtung AS“`, /Person As /.test(lastB) && /Einrichtung As /.test(lastB) && /Person AS /.test(p45) && /Einrichtung AS\./.test(p45) && /Person AS /.test(lastA));
    else check(`verwechslung.${fmt}: „[NAME]s“ und „[EINRICHTUNG]s“ statt „[NAME]S“/„[EINRICHTUNG]S“`, /\[NAME\]s /.test(lastB) && /\[EINRICHTUNG\]s /.test(lastB));
    // Nur die letzte Zeile (die einzige mit großer Endung) darf sich ändern
    const la = a.plain.split('\n');
    const lb = b.plain.split('\n');
    const diff = lb.map((l, i) => (l !== la[i] ? i : -1)).filter((i) => i >= 0);
    check(`verwechslung.${fmt} (${mode}): nur Stellen mit großer Endung geändert`, la.length === lb.length && diff.every((i) => /MÜLLERS|BÜRGERVEREINS/.test(fs.readFileSync(path.join(fx, 'verwechslung.txt'), 'utf8').split('\n').find((x) => x.startsWith('Die Akte')) || '') && lb[i].startsWith('Die Akte')), `${diff.length} Zeile(n)`);
  }
}
{
  const { ap, kp } = await anonUI(newHtml, path.join(fx, 'verwechslung.txt'), 'txt', 'reversible', orgs());
  const back = await restoreUI(newHtml, ap, kp);
  check('verwechslung.txt: Kreislauf rückbaufähig exakt (50 Personen, 50 Einrichtungen)', back.bytes && back.bytes.toString('utf8').replace(/^﻿/, '') === fs.readFileSync(path.join(fx, 'verwechslung.txt'), 'utf8') && back.rests.length === 0, `Reste ${back.rests.length}`);
}
log('');

// ---------- 3. Sicherheitsnetz ----------
log('## 3. Sicherheitsnetz: absichtlich beschädigte Platzhalter im anonymisierten Text');
const DAMAGE = ['Einrichtung A2S', 'Nachname AS', 'Vorname B9', '[E-MAIL-99]'];
for (const fmt of ['txt', 'docx']) {
  // Quelle mit wenigen Personen (A bis E), damit „Nachname AS“ sicher KEIN echter Platzhalter ist
  const src = path.join(fx, `grossform-mit.${fmt}`);
  const { ap, kp } = await anonUI(newHtml, src, fmt, 'reversible');
  // unbeschädigt
  const clean = await restoreUI(newHtml, ap, kp);
  check(`${fmt}, unbeschädigt: keine Meldung, nicht gesperrt`, clean.rests.length === 0 && !clean.restRowBad && !clean.blockedBefore && clean.left.length === 0 && !!clean.bytes);
  // beschädigt: vier Reste in den Text, einer in die Dateiangaben (nur Word: Titel)
  const dp = path.join(outDir, `beschaedigt.${fmt}`);
  if (fmt === 'txt') {
    const t = fs.readFileSync(ap, 'utf8').split('\n');
    t.splice(2, 0, `Notiz: ${DAMAGE[0]} und ${DAMAGE[1]}.`);
    t.splice(5, 0, `Kontakt ${DAMAGE[2]} unter ${DAMAGE[3]}.`);
    fs.writeFileSync(dp, t.join('\n'));
  } else {
    const z = await JSZip.loadAsync(fs.readFileSync(ap));
    let x = await z.file('word/document.xml').async('string');
    x = x.replace('<w:body>', `<w:body><w:p><w:r><w:t xml:space="preserve">Notiz: ${DAMAGE[0]} und ${DAMAGE[1]}.</w:t></w:r></w:p><w:p><w:r><w:t xml:space="preserve">Kontakt ${DAMAGE[2]} unter ${DAMAGE[3]}.</w:t></w:r></w:p>`);
    z.file('word/document.xml', x);
    // Titel in den Dateiangaben (Teil außerhalb der Abschnitte); Teil anlegen, falls er fehlt
    const core = z.file('docProps/core.xml') ? await z.file('docProps/core.xml').async('string') : null;
    if (core) z.file('docProps/core.xml', core.replace(/<dc:title>[^<]*<\/dc:title>|<dc:title\/>/, '').replace('</cp:coreProperties>', '<dc:title>Nachname ZZ9</dc:title></cp:coreProperties>'));
    else {
      z.file('docProps/core.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title>Nachname ZZ9</dc:title></cp:coreProperties>');
      const ct = await z.file('[Content_Types].xml').async('string');
      z.file('[Content_Types].xml', ct.replace('</Types>', '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>'));
      const rl = await z.file('_rels/.rels').async('string');
      z.file('_rels/.rels', rl.replace('</Relationships>', '<Relationship Id="rIdCore" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>'));
    }
    fs.writeFileSync(dp, await z.generateAsync({ type: 'nodebuffer' }));
  }
  const bad = await restoreUI(newHtml, dp, kp);
  const found = DAMAGE.filter((d) => bad.rests.some((r) => r.text === d));
  log(`- ${fmt}, beschädigt: rote Zeilen ${bad.rests.length} (${bad.rests.map((r) => r.line.replace(/\s+/g, ' ').slice(0, 90)).join(' | ')})`);
  if (bad.left.length) log(`  - zusätzlich beim Speichern (ganze Datei): ${bad.left.map((l) => l.replace(/\s+/g, ' ').slice(0, 90)).join(' | ')}`);
  check(`${fmt}, beschädigt: jeder der 4 Reste als rote Zeile mit Fundstelle; „Weiter“ gesperrt bis zur Bestätigung, danach frei`, found.length === 4 && bad.rests.every((r) => r.red && /Zeile|Text|Abschnitt/.test(r.line)) && bad.restRowBad && bad.blockedBefore && !bad.blockedAfter, `gefunden: ${found.join(', ')}`);
  if (fmt === 'docx') check('docx: Rest außerhalb der Abschnitte (Titel „Nachname ZZ9“) wird beim Speichern gemeldet und sperrt bis zur Bestätigung', bad.left.some((l) => /Nachname ZZ9/.test(l)) && !!bad.bytes);
  // Ohne Bestätigung kein Weiter
  const nb = await restoreUI(newHtml, dp, kp, { ackRests: false });
  check(`${fmt}, beschädigt, ohne Bestätigung: Speichern nicht erreichbar`, nb.blockedAfter && !nb.bytes);
}
log('');

// ---------- 4. Gegenprobe ----------
log('## 4. Gegenprobe: Originaltext mit Wörtern wie „Person A“ oder „Einrichtung B“ (rückbaufähig, Kreislauf)');
{
  const src = path.join(fx, 'gegenprobe-platzhalter.txt');
  for (const [lbl, html] of [['vorher', oldHtml], ['nachher', newHtml]]) {
    const { ap, kp } = await anonUI(html, src, 'txt', 'reversible');
    const back = await restoreUI(html, ap, kp);
    const exact = back.bytes && back.bytes.toString('utf8').replace(/^﻿/, '') === fs.readFileSync(src, 'utf8');
    log(`- ${lbl}: Rückbau exakt ${exact ? 'ja' : 'NEIN'}; gemeldete Reste ${back.rests.length}${back.rests.length ? ': ' + back.rests.map((r) => r.text).join(', ') : ''}; beim Speichern zusätzlich ${back.left.length}`);
    if (lbl === 'nachher') {
      log('  - Alle gemeldeten Stellen stehen so im Original (kein Name, kein beschädigter Platzhalter): Fehlalarme, nicht abgeschwächt (MINI-STOPP).');
      check('Gegenprobe: Kreislauf trotzdem exakt (nach Bestätigung)', !!exact);
    }
  }
}
log('');

// ---------- 5. Reste in den bisherigen Testdokumenten (Kreislauf am Kern) ----------
log('## 5. Bisherige Testdokumente: Reste nach dem Rückbau (Modus rückbaufähig, Kreislauf am Kern mit den echten Abschnitten)');
{
  const files = fs.readdirSync(fx).filter((f) => /\.(docx|xlsx|txt|csv|pdf)$/.test(f) && !/^gross\.|^alt-format|gescannt|^einrichtung-gross|^verwechslung|^gegenprobe-platzhalter/.test(f)).sort();
  const { page, ctx } = await newPage();
  let total = 0;
  let withRests = 0;
  const examples = [];
  for (const f of files) {
    const units = await page.evaluate(async ([b, n]) => {
      const A = window.__anon;
      A.app.state.settings.mode = 'reversible';
      A.app.state.orgTerms = [];
      A.app.state.manualTerms = [];
      try { await A.openBytes(new Uint8Array(b), n); } catch { return null; }
      return A.app.doc.units.map((u) => ({ text: u.text, label: u.label || '' }));
    }, [[...fs.readFileSync(path.join(fx, f))], f]);
    if (!units) continue;
    const st = defaultState();
    st.settings.mode = 'reversible';
    const r = analyze(units, st);
    const reps = replacementsByUnit(r, units);
    const out = units.map((u, i) => ({ text: applyReplacements(u.text, reps[i]), label: u.label }));
    const key = parseKeyFile(JSON.stringify(buildRestoreKey(r, { version: 'x', kind: 'txt' }))).key;
    total++;
    if (!key) continue;
    const plan = planRestore(out, key);
    if (plan.rests.length) { withRests++; examples.push(`${f}: ${plan.rests.length} (${[...new Set(plan.rests.map((x) => x.text))].slice(0, 4).join(', ')})`); }
  }
  await ctx.close();
  log(`- ${total} Dokumente, davon mit gemeldeten Resten: ${withRests}`);
  for (const e of examples) log(`  - ${e}`);
}
log('');

// ---------- 6. Weitere Verwechslungen (Prüfung, nicht gebaut) ----------
log('## 6. Prüfung: Weitere Formen, bei denen Platzhalter + Folgezeichen wie ein anderer Platzhalter aussieht');
{
  const ends = ["'s", '’s', "'", '’', 's', 'es', 'n', 'ns'];
  const bad = [];
  const re = () => /(^|[^\p{L}\p{N}])((?:Vorname|Nachname|Initiale|Name|Einrichtung) [A-Z]{1,3}\d*)(?=(?:'s|’s|'|’|s|es|ns|n)?(?![\p{L}\p{N}]))/gu;
  for (const ph of ['Nachname A', 'Nachname A2', 'Nachname AA', 'Nachname AB12', 'Vorname Z', 'Name A', 'Initiale A', 'Einrichtung A', 'Einrichtung A2']) {
    for (const e of ends) { const m = [...`x ${ph}${e} y`.matchAll(re())].map((x) => x[2]); if (m.join() !== ph) bad.push(`${ph}${e} → ${m.join()}`); }
  }
  log(`- rückbaufähig, alle kleinen Endungen hinter allen Platzhalterformen (auch nummeriert): falsch gelesen ${bad.length}${bad.length ? ': ' + bad.join(', ') : ''}`);
  log('- „Person A“/„Einrichtung A“ + kleine Endung: Platzhalter haben nur Großbuchstaben, eine kleine Endung kann keinen anderen Platzhalter bilden.');
  // Ziffer direkt hinter dem Namen im Original („Müller2“)
  const text = 'Frau Helga Müller kommt. Müller2 ist ihr Kürzel.';
  for (const mode of ['person', 'reversible']) {
    const st = defaultState();
    st.settings.mode = mode;
    const r = analyze([{ text }], st);
    const out = applyReplacements(text, replacementsByUnit(r, [{ text }])[0]);
    let extra = '';
    if (mode === 'reversible') {
      const key = parseKeyFile(JSON.stringify(buildRestoreKey(r, { version: 'x', kind: 'txt' }))).key;
      const plan = planRestore([{ text: out }], key);
      const back = applyReplacements(out, plan.repsPerUnit[0]);
      extra = `; Rückbau „${back}“ (exakt: ${back === text ? 'ja' : 'NEIN'}); Sicherheitsnetz meldet: ${plan.rests.map((x) => x.text).join(', ') || 'nichts'}`;
    }
    log(`- GEFUNDEN (nicht gebaut): Ziffer direkt hinter dem Namen, „${text}“, Modus ${mode}: „${out}“${extra}`);
  }
}
log('');

// ---------- 7. Doppellauf ----------
log('## 7. Doppellauf');
for (const [file, fmt] of [['einrichtung-gross.docx', 'docx'], ['einrichtung-gross.xlsx', 'xlsx'], ['verwechslung.txt', 'txt']]) {
  const a = await runOut(newHtml, file, 'person', fmt, [ORG]);
  const b = await runOut(newHtml, file, 'person', fmt, [ORG]);
  check(`${file}: zwei Läufe byte-gleich`, sha(a.zip ? Buffer.from(a.zip) : a.text) === sha(b.zip ? Buffer.from(b.zip) : b.text));
}
await browser.close();

const failed = checks.filter((c) => !c[1]);
log('');
log(`Prüfungen: ${checks.length - failed.length} von ${checks.length} bestanden${failed.length ? ' – FEHLER: ' + failed.map((c) => c[0]).join('; ') : ''}.`);
log(`Netzwerkanfragen außer lokalen Dateien: ${requests.filter((u) => !/^(file|blob|data):/.test(u)).length}.`);
fs.writeFileSync(path.join(here, 'PLATZHALTER-REPORT.md'), report.join('\n') + '\n');
process.exit(failed.length ? 1 : 0);
