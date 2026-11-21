// Tests der Kennung (Version 2.1, Modus rückbaufähig) über die echte Oberfläche:
// Vertausch (alle vier Formate), Umbenennen, Widerspruch Eigenschaft/Dateiname, Alt-Schlüssel (Version 2.0),
// veralteter Schlüssel, Bearbeitung in LibreOffice, Doppellauf, neue Kennung je Laden, Zufall (1000 Kennungen).
// Ergebnis: tests/KENNUNG-REPORT.md. Aufruf: node tests/kennung-test.mjs <index.html-der-Version-2.0>
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import JSZip from 'jszip';
import { startAnon, loadIn, goTo, ackAll, exportWithAck, saveKey } from './ui-helpers.mjs';

const { chromium } = createRequire('/opt/node22/lib/node_modules/')('playwright');
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const fx = path.join(here, 'fixtures');
const oldHtml = process.argv[2] ? path.resolve(process.argv[2]) : null;
const outDir = path.join(here, 'out-kennung');
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });
const report = [];
const log = (s = '') => { report.push(s); console.log(s); };
const checks = [];
const check = (name, ok, detail = '') => { checks.push([name, ok]); log(`- ${ok ? 'OK' : 'FEHLER'}: ${name}${detail ? ' – ' + detail : ''}`); };
const browser = await chromium.launch();
const requests = [];
let seq = 0;
async function newPage(html = path.join(root, 'index.html')) {
  const ctx = await browser.newContext({ acceptDownloads: true });
  const page = await ctx.newPage();
  page.on('request', (r) => requests.push(r.url()));
  page.on('dialog', (d) => d.accept());
  await page.goto('file://' + html);
  return { page, ctx };
}
// Anonymisieren (rückbaufähig) über die Oberfläche; Dateien unter dem vorgeschlagenen Namen in einem eigenen Ordner
async function anonymize(file, fmt, { html, toggle = false } = {}) {
  const dir = path.join(outDir, String(++seq));
  fs.mkdirSync(dir);
  const { page, ctx } = await newPage(html);
  await startAnon(page, 'reversible');
  await loadIn(page, path.join(fx, file));
  await ackAll(page);
  const kd1 = await saveKey(page);
  const key1 = path.join(dir, kd1.suggestedFilename());
  await kd1.saveAs(key1);
  let staleKey = null;
  let cards = null;
  if (toggle) {
    // Veraltet-Fall: nach dem Schlüssel einen Treffer ändern -> neue Kennung, alter Schlüssel ist veraltet
    const before = await page.textContent('#fname-out');
    await goTo(page, 'a2');
    await page.locator('#docview mark.hit.on').first().click();
    await goTo(page, 'a3');
    await ackAll(page);
    cards = { before, after: await page.textContent('#fname-out'), key: await page.textContent('#fname-key'), saveDisabled: await page.$eval('#btn-save', (b) => b.disabled) };
    staleKey = key1;
    const kd2 = await saveKey(page);
    const key2 = path.join(dir, 'neu-' + kd2.suggestedFilename());
    await kd2.saveAs(key2);
    var keyPath = key2; // eslint-disable-line no-var
  }
  const r = await exportWithAck(page, fmt);
  const anon = path.join(dir, r.dl.suggestedFilename());
  await r.dl.saveAs(anon);
  await ctx.close();
  const kp = toggle ? keyPath : key1;
  const kennung = JSON.parse(fs.readFileSync(kp, 'utf8').replace(/^﻿/, '')).kennung;
  return { anon, key: kp, staleKey, kennung, anonName: path.basename(anon), keyName: path.basename(kp), cards };
}
// Rückbau bis zum Prüfen-Bildschirm; Zeile „Kennung“ auslesen; optional bestätigen und speichern
async function restore(file, key, { ack = false, save = false, name } = {}) {
  let f = file;
  if (name) { f = path.join(outDir, `r${++seq}`, name); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.copyFileSync(file, f); }
  const { page, ctx } = await newPage();
  await page.click('#go-restore');
  await page.setInputFiles('#rb-file', f);
  await page.waitForFunction(() => document.querySelector('#rb-file-status').textContent);
  await page.setInputFiles('#rb-key', key);
  await page.waitForFunction(() => document.querySelector('#rb-key-status').textContent);
  await page.click('#rb-btn-check');
  // Version 2.5.0: Kennung als offener Punkt (rot = anderes Dokument, bernstein = keine Kennung / Schlüssel ohne Kennung)
  // oder unter „Details“ (passt, grün); alle Punkte mit EINEM Häkchen
  await page.waitForFunction(() => { const r = window.__anon.rb; return !r.plan || r.plan.verdict === 'falsch' || r.left !== null; }, null, { timeout: 120000 });
  const row = await page.evaluate(() => {
    const li = document.querySelector('#rb-points li[data-id="kennung"]');
    if (li) return { cls: li.classList.contains('bad') ? 'bad' : 'warn', text: li.innerText.replace(/\s+/g, ' ').trim(), hasAck: !!document.querySelector('#rb-ack') };
    const ok = document.querySelector('#rb-kennung-ok');
    return { cls: 'ok', text: ok ? ok.textContent.replace(/\s+/g, ' ').trim() : '', hasAck: false };
  });
  const verdict = await page.evaluate(() => window.__anon.rb.plan.verdict);
  const blocked = await page.$eval('#r2-next', (b) => b.disabled);
  let afterAck = null;
  let bytes = null;
  const otherConfirm = await page.evaluate(() => [...document.querySelectorAll('#rb-points li')].some((li) => li.dataset.id !== 'kennung'));
  if (ack && row.hasAck) {
    await page.check('#rb-ack');
    afterAck = !(await page.$eval('#r2-next', (b) => b.disabled));
  }
  if (save && (await page.$eval('#r2-next', (b) => b.disabled)) && await page.$('#rb-ack')) await page.check('#rb-ack');
  if (save && !(await page.$eval('#r2-next', (b) => b.disabled))) {
    await page.click('#r2-next');
    const dlP = page.waitForEvent('download');
    await page.click('#rb-btn-save');
    const dl = await dlP;
    const p = path.join(outDir, `w${++seq}-${dl.suggestedFilename()}`);
    await dl.saveAs(p);
    bytes = fs.readFileSync(p);
  }
  await ctx.close();
  return { row, verdict, blocked, afterAck, otherConfirm, bytes };
}
const state = (row) => (/\bbad\b/.test(row.cls) ? 'rot' : /\bwarn\b/.test(row.cls) ? 'bernstein' : 'grün');
const textOf = async (bytes, fmt) => {
  if (fmt === 'docx') { const x = await (await JSZip.loadAsync(bytes)).file('word/document.xml').async('string'); return [...x.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map((m) => m[1]).join('|'); }
  if (fmt === 'xlsx') { const x = await (await JSZip.loadAsync(bytes)).file('xl/worksheets/sheet1.xml').async('string'); return [...x.matchAll(/<t[^>]*>([^<]*)<\/t>/g)].map((m) => m[1]).join('|'); }
  return bytes.toString('utf8').replace(/^﻿/, '');
};
const propOf = async (file) => { const z = await JSZip.loadAsync(fs.readFileSync(file)); for (const n of Object.keys(z.files).filter((x) => /custom[^/]*\.xml$/.test(x))) { const m = (await z.file(n).async('string')).match(/name="AnonymisiererKennung"[^>]*>\s*<vt:lpwstr>([^<]*)</); if (m) return m[1]; } return null; };

log('# Kennung (Version 2.1): Tests');
log('');
log('Chromium headless, Start per file://, alle Schritte über die echte Oberfläche. Alle Namen erfunden (tests/make-kennung.mjs).');
log('');

// ---------- Vertausch ----------
log('## Vertausch: zwei Dokumente nach gleicher Vorlage, Schlüssel über Kreuz');
const A = {};
for (const fmt of ['docx', 'xlsx', 'txt', 'csv']) {
  const d1 = await anonymize(`vertausch-1.${fmt}`, fmt);
  const d2 = await anonymize(`vertausch-2.${fmt}`, fmt);
  A[fmt] = { d1, d2 };
  log(`### ${fmt.toUpperCase()}: ${d1.anonName} + ${d1.keyName} / ${d2.anonName} + ${d2.keyName}`);
  const same = (await textOf(fs.readFileSync(d1.anon), fmt)) === (await textOf(fs.readFileSync(d2.anon), fmt));
  log(`- Anonymisierter Text beider Dokumente gleich: ${same ? 'ja (ohne Kennung wäre der Vertausch nicht zu erkennen)' : 'nein'}`);
  check(`${fmt}: Dateinamen tragen die Kennung`, d1.anonName === `anonymisiert_${d1.kennung}.${fmt}` && d1.keyName === `schluessel_${d1.kennung}.json`, `${d1.anonName}, ${d1.keyName}`);
  const x = await restore(d1.anon, d2.key, { ack: true });
  check(`${fmt}: Datei 1 + Schlüssel 2 (Originalname) → rot und blockiert`, state(x.row) === 'rot' && x.blocked && /anderen Dokument/.test(x.row.text) && x.afterAck === true,
    `„${x.row.text.slice(0, 120)}…“; bisherige Prüfung allein: Urteil „${x.verdict}“; nach ausdrücklicher Bestätigung${x.otherConfirm ? ' (Kennung UND bisherige Prüfung)' : ''} frei: ${x.afterAck}`);
  if (fmt === 'txt' || fmt === 'csv') {
    const y = await restore(d1.anon, d2.key, { ack: true, name: `notiz.${fmt}` });
    check(`${fmt}: umbenannt (notiz.${fmt}) + Schlüssel 2 → bernstein mit Abhaken`, state(y.row) === 'bernstein' && y.blocked && y.row.hasAck && y.afterAck === true && /keine Kennung/.test(y.row.text), `„${y.row.text.slice(0, 110)}…“; bisherige Prüfung: „${y.verdict}“${y.otherConfirm ? ', eigene Bestätigung nötig' : ''}`);
  } else {
    const y = await restore(d1.anon, d1.key, { name: `bericht.${fmt}` });
    check(`${fmt}: umbenannt (bericht.${fmt}) + eigener Schlüssel → grün (Kennung aus der Eigenschaft)`, state(y.row) === 'grün' && !y.blocked, y.row.text);
    const y2 = await restore(d1.anon, d2.key, { name: `bericht.${fmt}` });
    check(`${fmt}: umbenannt + fremder Schlüssel → rot und blockiert`, state(y2.row) === 'rot' && y2.blocked, y2.row.text.slice(0, 100));
  }
  const ok = await restore(d1.anon, d1.key, { save: true });
  const orig = await textOf(fs.readFileSync(path.join(fx, `vertausch-1.${fmt}`)), fmt);
  const back = ok.bytes ? await textOf(ok.bytes, fmt) : '';
  check(`${fmt}: richtiges Paar → grün, Rückbau exakt`, state(ok.row) === 'grün' && /passt/.test(ok.row.text) && back === orig, ok.row.text);
}
log('');

// ---------- Widerspruch Eigenschaft / Dateiname ----------
log('## Widerspruch zwischen Eigenschaft und Dateiname');
{
  const { d1, d2 } = A.docx;
  const wrongName = `anonymisiert_${d2.kennung}.docx`;
  const x = await restore(d1.anon, d1.key, { name: wrongName });
  check('Datei mit Eigenschaft K1, aber Namen K2 + Schlüssel K1 → Eigenschaft gilt (grün), Widerspruch wird gezeigt', state(x.row) === 'grün' && /widersprechen/.test(x.row.text), x.row.text);
  const y = await restore(d1.anon, d2.key, { name: wrongName });
  check('dieselbe Datei + Schlüssel K2 → rot (Eigenschaft K1 gilt), Widerspruch wird gezeigt', state(y.row) === 'rot' && /widersprechen/.test(y.row.text), y.row.text.slice(0, 160));
}
log('');

// ---------- Alt-Schlüssel ----------
log('## Schlüsseldatei aus Version 2.0 (ohne Kennung)');
if (oldHtml) {
  for (const fmt of ['txt', 'docx']) {
    const d = await anonymize(`vertausch-1.${fmt}`, fmt, { html: oldHtml });
    const hasK = 'kennung' in JSON.parse(fs.readFileSync(d.key, 'utf8').replace(/^﻿/, ''));
    const x = await restore(d.anon, d.key, { save: true });
    const back = x.bytes ? await textOf(x.bytes, fmt) : '';
    const orig = await textOf(fs.readFileSync(path.join(fx, `vertausch-1.${fmt}`)), fmt);
    check(`${fmt}: Schlüssel aus 2.0 (${d.keyName}, Feld „kennung“: ${hasK ? 'ja' : 'nein'}) → bernstein „Schlüssel ohne Kennung“, seit 2.5.0 offener Punkt mit dem einen Häkchen, Rückbau exakt`, !hasK && state(x.row) === 'bernstein' && /ohne Kennung/.test(x.row.text) && x.blocked && back === orig, x.row.text.slice(0, 120));
  }
} else log('- übersprungen (keine index.html der Version 2.0 angegeben)');
log('');

// ---------- Veraltet ----------
log('## Veralteter Schlüssel (nach dem Schlüssel noch einen Treffer geändert)');
{
  const d = await anonymize('vertausch-1.docx', 'docx', { toggle: true });
  check('Nach der Änderung: neue Kennung sofort in den Dateikarten, „2 Datei speichern“ gesperrt', d.cards.before !== d.cards.after && d.cards.saveDisabled && d.cards.key.includes(d.cards.after.slice(13, 17)), `${d.cards.before} → ${d.cards.after}`);
  const oldK = JSON.parse(fs.readFileSync(d.staleKey, 'utf8').replace(/^﻿/, '')).kennung;
  check('Alter und neuer Schlüssel haben verschiedene Kennungen', oldK !== d.kennung, `${oldK} / ${d.kennung}`);
  const x = await restore(d.anon, d.staleKey);
  check('ALTER Schlüssel + neue Datei → rot und blockiert', state(x.row) === 'rot' && x.blocked, x.row.text.slice(0, 120));
  const y = await restore(d.anon, d.key);
  check('neuer Schlüssel + neue Datei → grün', state(y.row) === 'grün' && !y.blocked, y.row.text);
}
log('');

// ---------- Bearbeitung in LibreOffice ----------
log('## Bearbeitung in LibreOffice (Inhalt geändert, dann in LibreOffice gespeichert)');
for (const fmt of ['docx', 'xlsx']) {
  const { d1 } = A[fmt];
  const z = await JSZip.loadAsync(fs.readFileSync(d1.anon));
  if (fmt === 'docx') z.file('word/document.xml', (await z.file('word/document.xml').async('string')).replace('</w:body>', '<w:p><w:r><w:t>Ergänzt nach der Prüfung.</w:t></w:r></w:p></w:body>'));
  else z.file('xl/worksheets/sheet1.xml', (await z.file('xl/worksheets/sheet1.xml').async('string')).replace('</sheetData>', '<row r="9"><c r="A9" t="inlineStr"><is><t>Ergänzt nach der Prüfung.</t></is></c></row></sheetData>'));
  const t = fs.mkdtempSync(path.join(os.tmpdir(), 'lo-'));
  const edited = path.join(t, `bearbeitet.${fmt}`);
  fs.writeFileSync(edited, await z.generateAsync({ type: 'nodebuffer' }));
  const outD = path.join(t, 'out');
  fs.mkdirSync(outD);
  execFileSync('soffice', ['--headless', `-env:UserInstallation=file://${t}/p`, '--convert-to', fmt === 'docx' ? 'docx:MS Word 2007 XML' : 'xlsx:Calc MS Excel 2007 XML', '--outdir', outD, edited], { stdio: 'pipe', timeout: 120000 });
  const loFile = path.join(outD, `bearbeitet.${fmt}`);
  const k = await propOf(loFile);
  // LibreOffice legt Zelltexte in xl/sharedStrings.xml ab: alle Teile durchsuchen
  const lz = await JSZip.loadAsync(fs.readFileSync(loFile));
  let txt = '';
  for (const n of Object.keys(lz.files).filter((x) => /\.xml$/.test(x))) txt += await lz.file(n).async('string');
  check(`${fmt}: nach Änderung und Speichern in LibreOffice ist die Kennung noch da`, k === d1.kennung && /Ergänzt nach der Prüfung/.test(txt), `Eigenschaft ${k}, erwartet ${d1.kennung}`);
  const x = await restore(loFile, d1.key);
  check(`${fmt}: LibreOffice-Datei (umbenannt) + Schlüssel → grün`, state(x.row) === 'grün', x.row.text);
  fs.rmSync(t, { recursive: true, force: true });
}
log('- Microsoft Word und Excel selbst: **durch Code ungeprüft**.');
log('');

// ---------- Doppellauf und neue Kennung je Laden ----------
log('## Doppellauf: Inhalt gleich, Kennung verschieden');
for (const fmt of ['docx', 'txt']) {
  const a = await anonymize(`vertausch-1.${fmt}`, fmt);
  const b = await anonymize(`vertausch-1.${fmt}`, fmt);
  const strip = async (file) => {
    if (fmt !== 'docx') return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
    const z = await JSZip.loadAsync(fs.readFileSync(file));
    const parts = [];
    for (const n of Object.keys(z.files).filter((x) => !z.files[x].dir).sort()) parts.push(n + ':' + (await z.file(n).async('string')).replace(/<vt:lpwstr>[A-Z0-9]{4}<\/vt:lpwstr>/, '<vt:lpwstr>KENN</vt:lpwstr>'));
    return crypto.createHash('sha256').update(parts.join('\n')).digest('hex');
  };
  const keyNoK = (f) => { const k = JSON.parse(fs.readFileSync(f, 'utf8').replace(/^﻿/, '')); delete k.kennung; return JSON.stringify(k); };
  check(`${fmt}: Inhalt beider Läufe gleich (Kennung ausgenommen), Schlüssel gleich (Kennung ausgenommen)`, (await strip(a.anon)) === (await strip(b.anon)) && keyNoK(a.key) === keyNoK(b.key));
  check(`${fmt}: Kennungen beider Läufe verschieden, Dateinamen unterscheiden sich nur in der Kennung`, a.kennung !== b.kennung && a.anonName.replace(a.kennung, 'X') === b.anonName.replace(b.kennung, 'X'), `${a.anonName} / ${b.anonName}`);
}
{
  const { page, ctx } = await newPage();
  await startAnon(page, 'reversible');
  await loadIn(page, path.join(fx, 'vertausch-1.txt'));
  const k1 = await page.evaluate(() => window.__anon.app.kennung);
  await loadIn(page, path.join(fx, 'vertausch-1.txt'));
  const k2 = await page.evaluate(() => window.__anon.app.kennung);
  await ackAll(page);
  await saveKey(page);
  await exportWithAck(page, 'txt');
  await page.click('#btn-next-doc');
  await startAnon(page, 'reversible');
  await loadIn(page, path.join(fx, 'vertausch-1.txt'));
  const k3 = await page.evaluate(() => window.__anon.app.kennung);
  check('Erneutes Laden derselben Datei und „Nächstes Dokument“ ergeben jeweils eine neue Kennung', new Set([k1, k2, k3]).size === 3, `${k1}, ${k2}, ${k3}`);
  await ctx.close();
}
log('');

// ---------- Zufall ----------
log('## Zufalls-Beweis');
{
  const src = fs.readFileSync(path.join(root, 'src/ui/kennung.js'), 'utf8');
  const calls = fs.readFileSync(path.join(root, 'src/ui/app.js'), 'utf8').match(/newKennung\([^)]*\)/g) || [];
  check('Kennung entsteht nur in src/ui/kennung.js (newKennung) aus crypto.getRandomValues; alle Aufrufe ohne Dokumentdaten', /crypto\.getRandomValues/.test(src) && calls.every((c) => c === 'newKennung()'), `Aufrufe in app.js: ${calls.join(', ')}`);
  const { page, ctx } = await newPage();
  // Mit festem Ersatz-Zufall ist die Kennung vor und nach dem Laden eines Dokuments gleich: Es geht nichts aus dem Dokument ein
  const fixed = () => page.evaluate(() => window.__anon.newKennung((a) => { for (let i = 0; i < a.length; i++) a[i] = i % 2 ? 24 + i : i; return a; }));
  const f1 = await fixed();
  await startAnon(page, 'reversible');
  await loadIn(page, path.join(fx, 'vertausch-2.docx'));
  const f2 = await fixed();
  check('Mit festem Ersatz-Zufall gleiche Kennung vor und nach dem Laden eines Dokuments (kein Dokumentinhalt geht ein)', f1 === f2, `${f1} / ${f2}`);
  const ks = await page.evaluate(() => Array.from({ length: 1000 }, () => window.__anon.newKennung()));
  await ctx.close();
  const allowed = ks.every((k) => /^[A-HJ-NP-Z2-9]{4}$/.test(k) && !/[A-Z]{2}/.test(k));
  const dup = ks.length - new Set(ks).size;
  const freq = {};
  for (const k of ks) for (const c of k) freq[c] = (freq[c] || 0) + 1;
  const letters = Object.entries(freq).filter(([c]) => /[A-Z]/.test(c)).map(([, n]) => n);
  const digits = Object.entries(freq).filter(([c]) => /\d/.test(c)).map(([, n]) => n);
  check('1000 Kennungen: nur erlaubte Zeichen, nie zwei Buchstaben nebeneinander', allowed);
  log(`- Zeichen genutzt: ${Object.keys(freq).length} von 32. Je Buchstabe ${Math.min(...letters)}–${Math.max(...letters)}-mal, je Ziffer ${Math.min(...digits)}–${Math.max(...digits)}-mal (Ziffern häufiger, weil nie zwei Buchstaben nebeneinander stehen; innerhalb der Gruppe gleichmäßig).`);
  log(`- Mögliche Kennungen: 163 840. Doppelte unter 1000: ${dup} (erwartet rund 3).`);
  check('Grobe Gleichverteilung innerhalb der Buchstaben und der Ziffern', Math.max(...letters) / Math.min(...letters) < 2.2 && Math.max(...digits) / Math.min(...digits) < 1.6 && Object.keys(freq).length === 32, `Buchstaben ${Math.min(...letters)}–${Math.max(...letters)}, Ziffern ${Math.min(...digits)}–${Math.max(...digits)}`);
}
await browser.close();

const failed = checks.filter((c) => !c[1]);
log('');
log(`Prüfungen: ${checks.length - failed.length} von ${checks.length} bestanden${failed.length ? ' – FEHLER: ' + failed.map((c) => c[0]).join('; ') : ''}.`);
log(`Netzwerkanfragen außer lokalen Dateien: ${requests.filter((u) => !/^(file|blob|data):/.test(u)).length}.`);
fs.writeFileSync(path.join(here, 'KENNUNG-REPORT.md'), report.join('\n') + '\n');
process.exit(failed.length ? 1 : 0);
