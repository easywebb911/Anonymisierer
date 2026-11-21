// Platzhalter-Kollisionen (Version 2.3.4): Platzhalter-Wörter im Original, Ziffern am Namen, Folgezeichen.
// Kreislauf über die echte Oberfläche, vorher (2.3.3) und nachher; systematischer Test am Kern; Sicherheitsnetz-
// Gegenprobe; Speichern-Hinweis; Rückwärts-Prüfung (Schlüssel 2.3.4 in Version 2.3.3); Doppellauf.
// Ergebnis: tests/KOLLISION-REPORT.md. Aufruf: node tests/kollision-test.mjs <index.html-der-Version-2.3.3>
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import JSZip from 'jszip';
import { startAnon, loadIn, ackAll, goTo, exportWithAck, saveKey, rbConfirm } from './ui-helpers.mjs';
import { ORG, KOLLISION, ORIG_WORDS, MANUAL_NAME, ZIFFERN } from './make-kollision.mjs';
import { analyze, defaultState, replacementsByUnit, applyReplacements } from '../src/core/detect.js';
import { buildRestoreKey } from '../src/core/reversible.js';
import { parseKeyFile, planRestore } from '../src/core/restore.js';

const { chromium } = createRequire('/opt/node22/lib/node_modules/')('playwright');
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const fx = path.join(here, 'fixtures');
const newHtml = path.join(root, 'index.html');
const oldHtml = process.argv[2] ? path.resolve(process.argv[2]) : null;
if (!oldHtml) { console.error('Bitte Pfad zur index.html der Version 2.3.3 angeben.'); process.exit(2); }
const outDir = path.join(here, 'out-kollision');
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
// sichtbare Texte (Word: Absätze, Excel: Zellen, sonst Zeilen)
async function lines(bytes, fmt) {
  if (fmt === 'docx') {
    const x = await (await JSZip.loadAsync(bytes)).file('word/document.xml').async('string');
    return [...x.matchAll(/<w:p[ >][\s\S]*?<\/w:p>/g)].map((p) => dec([...p[0].matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map((t) => t[1]).join('')));
  }
  if (fmt === 'xlsx') {
    const z = await JSZip.loadAsync(bytes);
    const sheet = await z.file('xl/worksheets/sheet1.xml').async('string');
    const ss = z.file('xl/sharedStrings.xml') ? [...(await z.file('xl/sharedStrings.xml').async('string')).matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) => dec([...m[1].matchAll(/<t[^>]*>([^<]*)<\/t>/g)].map((t) => t[1]).join(''))) : [];
    return [...sheet.matchAll(/<c [^>]*?(?:t="(\w+)")?[^>]*>([\s\S]*?)<\/c>/g)].map((m) => (m[1] === 's' ? ss[Number((m[2].match(/<v>(\d+)<\/v>/) || [])[1])] : dec([...m[2].matchAll(/<t[^>]*>([^<]*)<\/t>/g)].map((t) => t[1]).join(''))));
  }
  const t = bytes.toString('utf8').replace(/^﻿/, '').replace(/\r\n/g, '\n').trim().split('\n');
  return fmt === 'csv' ? t.slice(1).map((l) => l.replace(/^\d+;"?|"$/g, '').replace(/""/g, '"')) : t;
}
async function anonUI(html, file, fmt, mode, { orgTerms = [], manual = [] } = {}) {
  const { page, ctx } = await newPage(html);
  await startAnon(page, mode);
  await page.evaluate(([o, m]) => { window.__anon.app.state.orgTerms = o; window.__anon.app.state.manualTerms = m; }, [orgTerms, manual]);
  await loadIn(page, file);
  await ackAll(page);
  await goTo(page, 'a3');
  const ampel = await page.$$eval('#ampel > li', (l) => l.map((x) => ({ cls: x.className, text: x.textContent.replace(/\s+/g, ' ').trim(), box: !!x.querySelector('input[type=checkbox]') })));
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
  return { ap, kp, ampel };
}
async function restoreUI(html, file, key) {
  const { page, ctx } = await newPage(html);
  await page.click('#go-restore');
  await page.setInputFiles('#rb-file', file);
  await page.waitForFunction(() => document.querySelector('#rb-file-status').textContent);
  await page.setInputFiles('#rb-key', key);
  await page.waitForFunction(() => document.querySelector('#rb-key-status').textContent);
  const keyStatus = await page.textContent('#rb-key-status');
  await page.click('#rb-btn-check');
  const rbi = await rbConfirm(page, false);
  // Zeilen des Berichts: bis 2.4.1 Ampel-Zeilen; seit 2.5.0 offene Punkte plus „Details“ (neutral = info)
  const rows = await page.$$eval('#rb-report .ampel > li, #rb-report #rb-points > li, #rb-report #rb-details li', (l) => l.map((x) => ({ cls: x.className || (x.closest('#rb-points') ? 'warn' : ''), text: x.textContent.replace(/\s+/g, ' ').trim() })));
  const rests = rbi.rests;
  await rbConfirm(page, true);
  const plan = await page.evaluate(() => ({ verdict: window.__anon.rb.plan.verdict, issues: window.__anon.rb.plan.issues.map((x) => x.art + ' ' + x.text) }));
  await page.click('#r2-next');
  const dlP = page.waitForEvent('download', { timeout: 20000 }).catch(() => null);
  await page.click('#rb-btn-save');
  let dl = await Promise.race([dlP, page.waitForFunction(() => /blockiert/.test(document.querySelector('#rb-status').textContent), null, { timeout: 20000 }).then(() => null).catch(() => null)]);
  if (!dl && await page.$('#rb-left input[type=checkbox]')) { await page.check('#rb-left input[type=checkbox]'); const p2 = page.waitForEvent('download'); await page.click('#rb-btn-save'); dl = await p2; } // nur bis 2.4.1
  const p = path.join(outDir, `w${++seq}-${dl.suggestedFilename()}`);
  await dl.saveAs(p);
  await ctx.close();
  return { bytes: fs.readFileSync(p), rows, rests, keyStatus, ...plan };
}

log('# Platzhalter-Kollisionen (Version 2.3.4): Tests');
log('');
log('Testdokumente: tests/make-kollision.mjs (alles erfunden). Vorher = Version 2.3.3, nachher = diese Version. Anonymisieren und Rückbau über die Oberfläche.');
log('');

// ---------- 1. Kollision: Platzhalter-Wörter im Original ----------
log('## 1. Platzhalter-Wörter im Original (Phase-0-Dokument), Modus rückbaufähig, Kreislauf');
for (const [file, fmt, opt] of [['kollision.txt', 'txt', { orgTerms: [ORG] }], ['kollision.docx', 'docx', { orgTerms: [ORG] }], ['kollision.csv', 'csv', { orgTerms: [ORG] }], ['kollision-name.txt', 'txt', { manual: [MANUAL_NAME] }]]) {
  const src = path.join(fx, file);
  const orig = await lines(fs.readFileSync(src), fmt);
  const res = {};
  for (const [lbl, html] of [['vorher', oldHtml], ['nachher', newHtml]]) {
    const a = await anonUI(html, src, fmt, 'reversible', opt);
    const back = await restoreUI(html, a.ap, a.kp);
    const got = await lines(back.bytes, fmt);
    const wrong = orig.map((l, i) => (l !== got[i] ? `„${l}“ → „${got[i]}“` : null)).filter(Boolean);
    res[lbl] = { anon: await lines(fs.readFileSync(a.ap), fmt), back, wrong };
    log(`- ${file}, ${lbl}: falsch zurückgebaute Stellen ${wrong.length}${wrong.length ? ': ' + wrong.join('; ') : ''}`);
  }
  const n = res.nachher;
  const origRows = n.back.rows.filter((r) => /stand schon im Original/.test(r.text));
  log(`  - nachher Ausgabe: ${n.anon.filter((l) => /Formular|Einrichtung A |Vorlage|angerufen/.test(l)).map((l) => `„${l}“`).join(' | ')}`);
  log(`  - nachher Bericht: ${origRows.map((r) => r.text.replace(/ Bleibt unverändert.*/, '') + ` [${r.cls}]`).join('; ')}; rote Reste: ${n.back.rests.length}`);
  check(`${file}: Rückbau nachher exakt, keine Originalstelle überschrieben, Zeilen „stand schon im Original“ neutral, keine roten Reste`, n.wrong.length === 0 && origRows.length > 0 && origRows.every((r) => r.cls === 'info') && n.back.rests.length === 0 && n.back.verdict === 'passend');
}
log('');

// ---------- 2. Platzhalter-Wörter: Modus „Person A“ und „[NAME]“, Speichern-Hinweis ----------
log('## 2. Modus „Person A“ und „[NAME]“: Ausweichen und Hinweis im Speichern-Schritt');
for (const mode of ['person', 'name', 'reversible']) {
  for (const [lbl, html] of [['vorher', oldHtml], ['nachher', newHtml]]) {
    const a = await anonUI(html, path.join(fx, 'kollision.txt'), 'txt', mode, { orgTerms: [ORG] });
    const out = await lines(fs.readFileSync(a.ap), 'txt');
    const hint = a.ampel.find((r) => /wie Platzhalter|wie ein Platzhalter/.test(r.text));
    log(`- ${mode}, ${lbl}: Zeile 1 „${out[0]}“, Zeile 2 „${out[1]}“; Hinweis: ${hint ? `[${hint.cls}${hint.box ? ', mit Abhaken' : ', ohne Abhaken'}] ${hint.text.slice(0, 220)}` : 'keiner'}`);
    if (lbl === 'nachher') {
      const ok = hint && /info/.test(hint.cls) && !hint.box /* seit 2.5.0: Information (I) unter „Details“ */ && /Das Tool verwendet diese Platzhalter nicht/.test(hint.text) && (mode !== 'name' || /nicht unterscheiden/.test(hint.text));
      const avoid = mode === 'person' ? /Person B/.test(out[0]) && /Einrichtung B/.test(out[1]) : true;
      check(`${mode}: Hinweis als Information unter „Details“ (seit 2.5.0, vorher bernstein), ohne Sperre${mode === 'name' ? ' mit Zusatz zur KI' : ''}${mode === 'person' ? '; „Person A“ und „Einrichtung A“ werden nicht vergeben (Personen ab B, Einrichtung B)' : ''}`, !!ok && avoid);
    }
  }
}
log('');

// ---------- 3. Ziffern am Namen ----------
log('## 3. Ziffern am Namen („Müller2“, „Yılmaz12“), dazu „Mueller“, GROSS-Form und Endung; Kreislauf rückbaufähig');
for (const fmt of ['docx', 'txt', 'csv', 'xlsx']) {
  const src = path.join(fx, `ziffern.${fmt}`);
  const orig = await lines(fs.readFileSync(src), fmt);
  const per = {};
  for (const [lbl, html] of [['vorher', oldHtml], ['nachher', newHtml]]) {
    const a = await anonUI(html, src, fmt, 'reversible');
    const back = await restoreUI(html, a.ap, a.kp);
    const got = await lines(back.bytes, fmt);
    per[lbl] = { anon: await lines(fs.readFileSync(a.ap), fmt), got, back, key: JSON.parse(fs.readFileSync(a.kp, 'utf8').replace(/^\uFEFF/, '')) };
  }
  // je Form: kommt die Zeile exakt zurück?
  const forms = ['Müller2', 'Yılmaz12', 'MÜLLER3', 'Mueller', 'MÜLLER', 'MÜLLERS', 'Müllers', 'Müller22', 'Yılmaz1'];
  const rowOf = (f) => ZIFFERN.findIndex((l) => new RegExp(`(^|[^\\p{L}\\p{N}])${f}(?![\\p{L}\\p{N}])`, 'u').test(l));
  const tab = forms.map((f) => { const i = rowOf(f); return `${f}: vorher ${per.vorher.got[i] === orig[i] ? 'exakt' : 'FALSCH'}, nachher ${per.nachher.got[i] === orig[i] ? 'exakt' : 'FALSCH'}`; });
  log(`- ziffern.${fmt}: ${tab.join('; ')}`);
  const wrongBefore = orig.map((l, i) => (l !== per.vorher.got[i] ? `„${l}“ → „${per.vorher.got[i]}“` : null)).filter(Boolean);
  if (wrongBefore.length) log(`  - vorher falsch: ${wrongBefore.join('; ')}`);
  log(`  - nachher Ausgabe Zeile 2: „${per.nachher.anon[1]}“; Schlüssel: ${per.nachher.key.platzhalter.filter((x) => /\d$/.test(x.wert)).map((x) => `${x.platzhalter} = „${x.wert}“`).join(', ')}`);
  check(`ziffern.${fmt}: Kreislauf nachher exakt (alle Zeilen), keine Reste, Urteil „passend“`, orig.every((l, i) => l === per.nachher.got[i]) && per.nachher.back.rests.length === 0 && per.nachher.back.verdict === 'passend');
}
{
  // Modus „Person A“ / „[NAME]“: Verwechslung möglich? Platzhalter dort haben nur Buchstaben.
  for (const mode of ['person', 'name']) {
    const st = defaultState();
    st.settings.mode = mode;
    const units = ZIFFERN.map((text) => ({ text }));
    const r = analyze(units, st);
    const out = units.map((u, i) => applyReplacements(u.text, replacementsByUnit(r, units)[i]));
    log(`- Modus ${mode}: „${out[1]}“ – ${mode === 'person' ? 'Platzhalter „Person X“ tragen nur Buchstaben; „Person A2“ ist kein anderer gültiger Platzhalter' : '„[NAME]2“ ist kein anderer Platzhalter'} (nicht geändert)`);
  }
}
log('');

// ---------- 4. Systematisch: jede Platzhalter-Art + Folgezeichen ----------
log('## 4. Systematisch (Kern): jede Platzhalter-Art, direkt gefolgt von Großbuchstabe, Kleinbuchstabe, Ziffer, Satzzeichen, Bindestrich, Apostroph');
{
  const FOLLOW = { Großbuchstabe: 'X', Kleinbuchstabe: 'x', Ziffer: '7', Satzzeichen: '.', Bindestrich: '-', Apostroph: "'" };
  // Platzhalter-Art: Text, in dem der Name / Wert genau vor {F} steht
  const KINDS = {
    'Vorname/Nachname': ['Frau Helga Müller kommt.', 'Akte Müller{F}9 liegt vor.'],
    Name: ['Quabbe hat angerufen.', 'Akte Quabbe{F}9 liegt vor.'],
    Initiale: ['Frau Helga Müller kommt.', 'Gez. H. Müller{F}9 liegt vor.'],
    Einrichtung: ['Der Lindenauer Bürgerverein tagt.', 'Akte Bürgerverein Lindenauer Bürgerverein{F}9 liegt vor.'],
    'E-Mail': ['Kontakt helga@example.org bitte.', 'Akte helga@example.org{F}9 liegt vor.'],
    Telefon: ['Telefon 030 1234567 bitte.', 'Akte 030 1234567{F}9 liegt vor.'],
  };
  const rows = [];
  let all = 0;
  let ok = 0;
  for (const [kind, [a, b]] of Object.entries(KINDS)) {
    const cells = [];
    for (const [fname, F] of Object.entries(FOLLOW)) {
      const units = [{ text: a }, { text: b.replace('{F}', F) }];
      const st = defaultState();
      st.settings.mode = 'reversible';
      st.orgTerms = [ORG];
      st.manualTerms = kind === 'Name' ? ['Quabbe'] : [];
      const r = analyze(units, st);
      const reps = replacementsByUnit(r, units);
      const out = units.map((u, i) => applyReplacements(u.text, reps[i]));
      const key = parseKeyFile(JSON.stringify(buildRestoreKey(r, { version: 'x', kind: 'txt' }))).key;
      const plan = planRestore(out.map((t) => ({ text: t })), key);
      const back = out.map((t, i) => applyReplacements(t, plan.repsPerUnit[i]));
      const exact = back.every((t, i) => t === units[i].text) && plan.rests.length === 0;
      all++;
      if (exact) ok++;
      cells.push(`${fname} ${exact ? 'ja' : `NEIN („${out[1]}“ → „${back[1]}“)`}`);
    }
    rows.push(`- ${kind}: ${cells.join(', ')}`);
  }
  for (const r of rows) log(r);
  check(`Alle ${all} Kombinationen: Rückbau exakt, keine Reste`, ok === all, `${ok} von ${all}`);
}
log('');

// ---------- 5. Sicherheitsnetz-Gegenprobe aus PR #11 ----------
log('## 5. Sicherheitsnetz-Gegenprobe aus Version 2.3.3 (gegenprobe-platzhalter.txt)');
{
  const src = path.join(fx, 'gegenprobe-platzhalter.txt');
  for (const [lbl, html] of [['vorher', oldHtml], ['nachher', newHtml]]) {
    const a = await anonUI(html, src, 'txt', 'reversible');
    const back = await restoreUI(html, a.ap, a.kp);
    const exact = back.bytes.toString('utf8').replace(/^﻿/, '') === fs.readFileSync(src, 'utf8');
    const orig = back.rows.filter((r) => /stand schon im Original/.test(r.text)).map((r) => r.text.replace(/ Bleibt.*/, ''));
    log(`- ${lbl}: rote Reste ${back.rests.length}${back.rests.length ? ' (' + back.rests.join(', ') + ')' : ''}; „stand schon im Original“: ${orig.join('; ') || '–'}; Rückbau exakt ${exact ? 'ja' : 'NEIN'}`);
    if (lbl === 'nachher') check('Die 8 falschen roten Meldungen sind weg, Kreislauf exakt', back.rests.length === 0 && orig.length >= 8 && exact, `${orig.length} Zeilen „stand schon im Original“`);
  }
  log('- Die 4 absichtlich beschädigten Platzhalter: siehe tests/platzhalter-test.mjs (läuft unverändert mit, weiter rot und gesperrt).');
}
log('');

// ---------- 6. Rückwärts-Prüfung: Schlüssel 2.3.4 in Version 2.3.3 ----------
log('## 6. Rückwärts (REVERT-WEG): Datei und Schlüssel aus 2.3.4 mit Zusatzfeld in Version 2.3.3 zurückbauen');
{
  const src = path.join(fx, 'kollision.txt');
  const a = await anonUI(newHtml, src, 'txt', 'reversible', { orgTerms: [ORG] });
  const k = JSON.parse(fs.readFileSync(a.kp, 'utf8').replace(/^\uFEFF/, ''));
  log(`- Schlüssel 2.3.4: formatVersion ${k.formatVersion}, Zusatzfeld imOriginal: ${(k.imOriginal || []).map((x) => `„${x.text}“ ${x.anzahl}×`).join(', ')}`);
  const back = await restoreUI(oldHtml, a.ap, a.kp);
  const got = back.bytes.toString('utf8').replace(/^﻿/, '');
  const orig = fs.readFileSync(src, 'utf8');
  const wrong = orig.split('\n').map((l, i) => (l !== got.split('\n')[i] ? `„${l}“ → „${got.split('\n')[i]}“` : null)).filter(Boolean);
  log(`- Version 2.3.3 beim Laden: „${back.keyStatus}“`);
  log(`- Bericht 2.3.3: ${back.rows.map((r) => `[${r.cls}] ${r.text.slice(0, 120)}`).join(' | ')}`);
  log(`- Ergebnis 2.3.3: Rückbau exakt ${wrong.length ? 'NEIN: ' + wrong.join('; ') : 'ja'}; rote Reste ${back.rests.length} (${back.rests.join(', ')}); Auffälligkeiten: ${back.issues.join(', ') || 'keine'}`);
  check('Version 2.3.3 liest den Schlüssel (Zusatzfeld wird übergangen), Rückbau exakt; Original-Wörter dort als rote Reste gemeldet', /Schlüsseldatei geladen/.test(back.keyStatus) && wrong.length === 0);
}
log('');

// ---------- 7. Doppellauf ----------
log('## 7. Doppellauf');
for (const [file, fmt] of [['kollision.docx', 'docx'], ['ziffern.xlsx', 'xlsx'], ['ziffern.txt', 'txt']]) {
  const run = async () => {
    const { page, ctx } = await newPage();
    const out = await page.evaluate(async ([b, f, fm, o]) => {
      const A = window.__anon;
      A.app.state.settings.mode = 'person';
      A.app.state.orgTerms = o;
      await A.openBytes(new Uint8Array(b), f);
      const x = await A.buildOutput(fm);
      return x.zip ? Array.from(x.bytes) : x.text;
    }, [[...fs.readFileSync(path.join(fx, file))], file, fmt, [ORG]]);
    await ctx.close();
    return typeof out === 'string' ? out : Buffer.from(out);
  };
  check(`${file}: zwei Läufe byte-gleich`, sha(await run()) === sha(await run()));
}
await browser.close();

const failed = checks.filter((c) => !c[1]);
log('');
log(`Prüfungen: ${checks.length - failed.length} von ${checks.length} bestanden${failed.length ? ' – FEHLER: ' + failed.map((c) => c[0]).join('; ') : ''}.`);
log(`Netzwerkanfragen außer lokalen Dateien: ${requests.filter((u) => !/^(file|blob|data):/.test(u)).length}.`);
void ORIG_WORDS;
void KOLLISION;
fs.writeFileSync(path.join(here, 'KOLLISION-REPORT.md'), report.join('\n') + '\n');
process.exit(failed.length ? 1 : 0);
