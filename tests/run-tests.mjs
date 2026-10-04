// End-to-End-Tests in Chromium (Playwright) gegen die gebaute index.html.
// Prüft je Format: Erkennung (X von Y), nicht erkannte Namen, Fehltreffer, manuelles Markieren,
// Schlusscheck, Metadaten, Determinismus (Doppellauf), Netzwerkzugriffe, Ablehnung nicht unterstützter Dateien.
// Aufruf: node tests/run-tests.mjs   (Ergebnis: tests/REPORT.md und tests/out/)
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import JSZip from 'jszip';
import { PERSONS } from './fixtures-src.mjs';
import { fold } from '../src/core/fold.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const fx = path.join(here, 'fixtures');
const outDir = path.join(here, 'out');
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

let chromium;
try { ({ chromium } = createRequire(import.meta.url)('playwright')); } catch {
  ({ chromium } = createRequire('/opt/node22/lib/node_modules/')('playwright'));
}

const PARTICLES = new Set(['von', 'van', 'der', 'de', 'al', 'el', 'bin']);
const personTokens = Object.fromEntries(Object.entries(PERSONS).map(([id, p]) => [id, [...new Set(p.name.split(/\s+/).flatMap((t) => [t, ...t.split('-')]).filter((t) => t.length > 1 && !PARTICLES.has(t.toLowerCase())))]]));
const TRAP_RES = [/\b(?:eine|Die) Rose\b/g, /\bim Winter\b/g, /\bnach Paris\b/g, /\balte Mark\b/g, /engl\. Bill\b/g, /\bDer Richter\b/g,
  /\bDer Bauer\b/g, /\bim Sommer\b/g, /\bUnser Koch\b/g, /\bkleinen Engel\b/g, /\bein Fuchs\b/g, /\bvoller Kraft\b/g, /\bab Mai\b/g];
const trapSpans = (text) => TRAP_RES.flatMap((re) => [...text.matchAll(re)].map((m) => { const w = m[0].split(' ').pop(); const s = m.index + m[0].lastIndexOf(w); return [s, s + w.length, w]; }));

// Vorkommen der Personen-Tokens in einem Text (ohne Fallen-Kontexte)
function findPersonTokens(text) {
  const traps = trapSpans(text);
  const found = [];
  for (const m of text.matchAll(/[\p{L}\p{M}]+(?:['’][\p{L}\p{M}]+)*(?:-[\p{L}\p{M}]+)*/gu)) {
    const w = m[0];
    const s = m.index;
    if (traps.some(([a, b]) => s >= a && s < b)) continue;
    const cands = [w, ...w.split('-')];
    for (const [id, toks] of Object.entries(personTokens)) {
      const hit = toks.find((t) => cands.some((c) => fold(c) === fold(t) || fold(c) === fold(t) + 's'));
      if (hit) { found.push({ id: Number(id), word: w, at: s }); break; }
    }
  }
  return found;
}

// Unabhängige Textgewinnung aus OOXML (ohne Browser-Code): rohe XML-Teile, Entities dekodiert
async function rawZipText(bytes) {
  const z = await JSZip.loadAsync(bytes);
  const dec = (x) => x.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
  let out = '';
  for (const n of Object.keys(z.files).sort()) {
    if (z.files[n].dir || !/\.(xml|rels|vml)$/.test(n)) continue;
    const xml = await z.file(n).async('string');
    // Textinhalt: Absatz-/Zellgrenzen als Zeilenumbruch, Tags entfernen
    const text = xml.replace(/<\/(?:w:p|a:p|si|c|is|row|comment|author|definedName|oddHeader|oddFooter|f|v|dc:\w+|cp:\w+|Company|Manager|vt:\w+)>/g, '\n')
      .replace(/<w:(?:tab|br)\/>/g, ' ').replace(/<[^>]+>/g, '');
    // Attributwerte (Autor, Ziele von Verweisen, Blattnamen …)
    const attrs = [...xml.matchAll(/\s[\w:]+="([^"]*)"/g)].map((m) => m[1]).join('\n');
    out += `\n### ${n}\n` + dec(text) + '\n' + dec(attrs);
  }
  return out;
}

const loT = fs.mkdtempSync(path.join(outDir, '.lo-'));
function libreOfficeText(file, kind) {
  // Gegenprobe mit LibreOffice: Datei muss sich öffnen lassen; liefert Text
  const target = kind === 'xlsx' ? 'csv:Text - txt - csv (StarCalc):59,34,76,1,,0,false,true,false,false,false,-1' : 'txt:Text (encoded):UTF8';
  try {
    execFileSync('soffice', ['--headless', '-env:UserInstallation=file://' + loT + '/p', '--convert-to', target, '--outdir', loT, file], { stdio: 'pipe', timeout: 120000 });
  } catch (e) { return { ok: false, text: '', err: String(e.message).slice(0, 200) }; }
  const base = path.basename(file).replace(/\.[^.]+$/, '');
  const files = fs.readdirSync(loT).filter((f) => f.startsWith(base) && /\.(txt|csv)$/.test(f));
  const text = files.map((f) => fs.readFileSync(path.join(loT, f), 'utf8')).join('\n');
  files.forEach((f) => fs.rmSync(path.join(loT, f)));
  return { ok: files.length > 0, text };
}

const sha = (b) => crypto.createHash('sha256').update(b).digest('hex').slice(0, 16);
const report = [];
const log = (s = '') => { report.push(s); console.log(s); };

const browser = await chromium.launch();
const requests = [];
async function newPage() {
  const ctx = await browser.newContext({ acceptDownloads: true });
  const page = await ctx.newPage();
  page.on('request', (r) => requests.push(r.url()));
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('file://' + path.join(root, 'index.html'));
  return { page, ctx, errors };
}
async function loadFixture(page, file) {
  await page.setInputFiles('#file', path.join(fx, file));
  await page.waitForFunction(() => /Gelesen|zu groß|nicht|kein|Fehler|PDF enthält/.test(document.querySelector('#load-status').textContent), null, { timeout: 60000 });
  return page.textContent('#load-status');
}
async function loadFixtureAbs(page, file) {
  await page.setInputFiles('#file', file);
  await page.waitForFunction(() => /Gelesen|zu groß|nicht|kein|Fehler|PDF enthält/.test(document.querySelector('#load-status').textContent), null, { timeout: 600000 });
  return page.textContent('#load-status');
}
async function snapshot(page) {
  return page.evaluate(() => {
    const r = window.__anon.app.result;
    return { fullText: r.fullText, hits: r.hits.map((x) => ({ s: x.s, e: x.e, on: x.on, type: x.type, cert: x.cert, label: x.label, origin: x.origin })),
      entities: [...r.entities.values()].map((e) => ({ label: e.label, display: e.display, count: e.count })) };
  });
}
async function exportOnce(page, btn) {
  await page.evaluate(() => { document.querySelector('#export-status').textContent = ''; });
  const dlP = page.waitForEvent('download', { timeout: 600000 }).catch(() => null);
  await page.click(btn);
  await page.waitForFunction(() => { const t = document.querySelector('#export-status').textContent; return t && !/^Erzeuge/.test(t); }, null, { timeout: 600000 });
  const status = await page.textContent('#export-status');
  const dl = /Gespeichert/.test(status) ? await dlP : null;
  return [dl, status];
}
async function clickExport(page, btn) {
  let [dl, status] = await exportOnce(page, btn);
  let blocked = null;
  if (!dl && /blockiert/.test(status)) {
    // Schlusscheck hat blockiert: Fundstellen festhalten, Bestätigung anhaken, erneut exportieren
    blocked = { status, items: await page.$$eval('#leaks li', (els) => els.map((e) => e.textContent)) };
    await page.check('#leaks input[type=checkbox]');
    [dl, status] = await exportOnce(page, btn);
  }
  if (!dl) return { status, bytes: null, blocked };
  const p = path.join(outDir, `${Date.now()}-${dl.suggestedFilename()}`);
  await dl.saveAs(p);
  return { status, bytes: fs.readFileSync(p), file: p, name: dl.suggestedFilename(), blocked };
}
async function ackWarnings(page) {
  await page.$$eval('#doc-warnings input[type=checkbox]', (els) => els.forEach((e) => { if (!e.checked) e.click(); }));
}

function evaluateDetection(snap) {
  const occ = findPersonTokens(snap.fullText);
  const covered = (o) => snap.hits.some((h) => h.on && h.s <= o.at && h.e >= o.at + o.word.length);
  const missed = occ.filter((o) => !covered(o));
  const traps = trapSpans(snap.fullText);
  const personHitsOn = snap.hits.filter((h) => h.on && h.type === 'person');
  const fps = [];
  for (const h of personHitsOn) {
    const t = snap.fullText.slice(h.s, h.e);
    const inTrap = traps.some(([a, b]) => h.s < b && h.e > a);
    const isGold = findPersonTokens(t).length > 0;
    if (inTrap || !isGold) fps.push(t + (inTrap ? ' (Falle)' : ''));
  }
  const trapHitsOff = snap.hits.filter((h) => h.type === 'person' && !h.on && traps.some(([a, b]) => h.s < b && h.e > a)).length;
  const ids = [...new Set(occ.map((o) => o.id))];
  const missedIds = [...new Set(missed.map((o) => o.id))];
  return { occ, missed, fps, ids, missedIds, trapsTotal: traps.length, trapHitsOff };
}

const results = [];
const FORMATS = [
  { file: 'protokoll.txt', kind: 'txt', native: '#btn-txt' },
  { file: 'mitarbeiter.csv', kind: 'csv', native: '#btn-csv' },
  { file: 'protokoll.docx', kind: 'docx', native: '#btn-docx' },
  { file: 'mitarbeiter.xlsx', kind: 'xlsx', native: '#btn-xlsx' },
  { file: 'protokoll.pdf', kind: 'pdf', native: '#btn-docx' },
];

log('# Testbericht Anonymisierer');
log('');
log(`Erzeugt mit tests/run-tests.mjs in Chromium (Playwright, headless) gegen index.html (SHA-256 ${sha(fs.readFileSync(path.join(root, 'index.html')))}…). Alle Testpersonen sind erfunden.`);
log('');

for (const f of FORMATS) {
  log(`## ${f.file}`);
  const { page, ctx, errors } = await newPage();
  const st = await loadFixture(page, f.file);
  log(`- Laden: ${st.trim()}`);
  const snap = await snapshot(page);
  const ev = evaluateDetection(snap);
  const personsInDoc = ev.ids.length;
  log(`- **Erkannt (automatisch): ${personsInDoc - ev.missedIds.length} von ${personsInDoc} Personen vollständig**; Namens-Vorkommen: ${ev.occ.length - ev.missed.length} von ${ev.occ.length}`);
  log(`- Nicht (vollständig) erkannt: ${ev.missedIds.length ? ev.missedIds.map((id) => `${PERSONS[id].name} [${PERSONS[id].origin}] – übrig: ${[...new Set(ev.missed.filter((o) => o.id === id).map((o) => o.word))].join(', ')}`).join('; ') : 'keine'}`);
  log(`- Fehltreffer (aktiv, kein Name bzw. Falle): ${ev.fps.length}${ev.fps.length ? ' – ' + ev.fps.join(', ') : ''}`);
  log(`- Fallen im Text: ${ev.trapsTotal}, davon als unsicher markiert aber AUS (richtig stehen gelassen): ${ev.trapHitsOff}`);
  log(`- Personen in der Prüfansicht: ${snap.entities.length}; Treffer gesamt: ${snap.hits.length} (sicher ${snap.hits.filter((h) => h.cert === 'sicher').length}, unsicher ${snap.hits.filter((h) => h.cert === 'unsicher').length})`);
  await ackWarnings(page);

  // Export vor manueller Nacharbeit
  const exp1 = await clickExport(page, f.native);
  if (exp1.blocked) log(`- Schlusscheck vor Nacharbeit hat den Export BLOCKIERT („${exp1.blocked.status.trim()}“). Fundstellen: ${exp1.blocked.items.map((t) => t.replace(/\s+/g, ' ')).join(' | ')}. Nach Bestätigung exportiert.`);
  log(`- Export (${f.native.replace('#btn-', '.')}) vor Nacharbeit: Status „${exp1.status.trim()}“`);
  let outText = exp1.bytes ? (/\.(docx|xlsx)$/.test(exp1.name) ? await rawZipText(exp1.bytes) : exp1.bytes.toString('utf8')) : '';
  let leaks = findPersonTokens(outText);
  log(`  - Unabhängige Nachprüfung der Ausgabedatei: ${leaks.length} Klarnamen-Vorkommen übrig${leaks.length ? ' (' + [...new Set(leaks.map((l) => l.word))].join(', ') + ')' : ''}`);

  // Manuelles Markieren der nicht erkannten Namen: das erste Wort über die echte Oberfläche (antippen), den Rest über dieselbe Funktion
  const toMark = [...new Set(ev.missed.map((o) => o.word.replace(/s$/, (m) => (personTokens[o.id].includes(o.word) ? m : ''))))];
  if (toMark.length) {
    const first = toMark[0];
    const tapped = await page.evaluate((word) => {
      const view = document.querySelector('#docview');
      const walker = document.createTreeWalker(view, NodeFilter.SHOW_TEXT);
      let t;
      while ((t = walker.nextNode())) {
        const i = t.nodeValue.indexOf(word);
        if (i >= 0 && !t.parentElement.closest('mark')) {
          const r = document.createRange();
          r.setStart(t, i + 1); r.setEnd(t, i + 1);
          const rect = r.getBoundingClientRect();
          t.parentElement.scrollIntoView({ block: 'center' });
          return { ok: rect.height >= 0, i };
        }
      }
      return null;
    }, first);
    if (tapped) {
      await page.waitForTimeout(1500); // Scrollen abwarten
      const pos = await page.evaluate(({ word }) => {
        const view = document.querySelector('#docview');
        const walker = document.createTreeWalker(view, NodeFilter.SHOW_TEXT);
        let t;
        while ((t = walker.nextNode())) {
          const i = t.nodeValue.indexOf(word);
          if (i >= 0 && !t.parentElement.closest('mark')) {
            const r = document.createRange();
            r.setStart(t, i + 1); r.setEnd(t, i + 2);
            const b = r.getBoundingClientRect();
            return { x: b.left + b.width / 2, y: b.top + b.height / 2 };
          }
        }
        return null;
      }, { word: first });
      await page.mouse.click(pos.x, pos.y);
      await page.waitForSelector('#markbar:not([hidden])', { timeout: 5000 });
      const term = await page.textContent('#markterm');
      await page.click('#btn-mark');
      log(`  - Manuell per Antippen markiert: „${term}“ (über die Oberfläche)`);
    }
    for (const w of toMark.slice(1)) await page.evaluate((x) => window.__anon.addManual(x), w);
    if (toMark.length > 1) log(`  - Weitere manuell markiert: ${toMark.slice(1).join(', ')}`);
    const snap2 = await snapshot(page);
    const ev2 = evaluateDetection(snap2);
    log(`  - Nach manuellem Markieren: ${ev2.occ.length - ev2.missed.length} von ${ev2.occ.length} Vorkommen abgedeckt`);
    await ackWarnings(page);
    const exp2 = await clickExport(page, f.native);
    outText = exp2.bytes ? (/\.(docx|xlsx)$/.test(exp2.name) ? await rawZipText(exp2.bytes) : exp2.bytes.toString('utf8')) : '';
    leaks = findPersonTokens(outText);
    if (exp2.blocked) log(`  - Schlusscheck nach Nacharbeit blockierte zunächst; Fundstellen: ${exp2.blocked.items.map((t) => t.replace(/\s+/g, ' ')).join(' | ')}`);
    log(`  - Export nach Nacharbeit: Status „${exp2.status.trim()}“; unabhängige Nachprüfung: ${leaks.length} Klarnamen-Vorkommen übrig${leaks.length ? ' (' + [...new Set(leaks.map((l) => l.word))].join(', ') + ')' : ''}`);
    exp1.final = exp2;
  }
  const finalExp = exp1.final || exp1;
  // Gegenprobe mit LibreOffice (Datei gültig? Text frei von Namen?)
  if (finalExp.file && /\.(docx|xlsx)$/.test(finalExp.name)) {
    const lo = libreOfficeText(finalExp.file, finalExp.name.endsWith('.xlsx') ? 'xlsx' : 'docx');
    const loLeaks = lo.ok ? findPersonTokens(lo.text) : [];
    log(`  - LibreOffice öffnet die Ausgabe: ${lo.ok ? 'ja' : 'NEIN ' + (lo.err || '')}; Klarnamen im LibreOffice-Text: ${loLeaks.length}`);
    fs.writeFileSync(path.join(outDir, f.file + '.libreoffice.txt'), lo.text);
  }
  if (finalExp.bytes) fs.writeFileSync(path.join(outDir, 'final-' + f.file + '-' + finalExp.name), finalExp.bytes);
  // Text kopieren / .txt zusätzlich
  if (f.kind !== 'txt') {
    const t = await clickExport(page, '#btn-txt');
    const tl = t.bytes ? findPersonTokens(t.bytes.toString('utf8')).length : -1;
    log(`  - Zusätzlich .txt-Export: Klarnamen übrig: ${tl}`);
  }
  log(`- JavaScript-Fehler auf der Seite: ${errors.length ? errors.join(' | ') : 'keine'}`);
  results.push({ file: f.file, ev, leaks: leaks.length, out: finalExp });
  await ctx.close();
  log('');
}

// ---------- Metadaten-Nachweis ----------
log('## Metadaten-Nachweis (DOCX und XLSX)');
for (const r of results.filter((x) => /\.(docx|xlsx)$/.test(x.file))) {
  const before = await JSZip.loadAsync(fs.readFileSync(path.join(fx, r.file)));
  const after = await JSZip.loadAsync(r.out.bytes);
  const pick = async (z, n, re) => { const f = z.file(n); if (!f) return '(Teil nicht vorhanden)'; const s = await f.async('string'); return [...s.matchAll(re)].map((m) => m[0]).join(' ') || '(leer)'; };
  const checks = r.file.endsWith('.docx') ? [
    ['docProps/core.xml', /<dc:creator>[^<]*<\/dc:creator>|<cp:lastModifiedBy>[^<]*<\/cp:lastModifiedBy>|<dc:title>[^<]*<\/dc:title>|<cp:keywords>[^<]*<\/cp:keywords>/g],
    ['docProps/app.xml', /<Company>[^<]*<\/Company>|<Manager>[^<]*<\/Manager>/g],
    ['docProps/custom.xml', /<vt:lpwstr>[^<]*<\/vt:lpwstr>/g],
    ['word/comments.xml', /w:author="[^"]*"|w:initials="[^"]*"|<w:t[^>]*>[^<]*<\/w:t>/g],
    ['word/document.xml', /w:author="[^"]*"/g],
    ['word/people.xml', /w15:author="[^"]*"|w15:userId="[^"]*"/g],
    ['word/header1.xml', /<w:t[^>]*>[^<]*<\/w:t>/g],
    ['word/footer1.xml', /<w:t[^>]*>[^<]*<\/w:t>/g],
    ['word/footnotes.xml', /<w:t[^>]*>[^<]*<\/w:t>/g],
    ['word/_rels/settings.xml.rels', /Target="[^"]*"/g],
    ['word/_rels/document.xml.rels', /Target="mailto:[^"]*"/g],
  ] : [
    ['docProps/core.xml', /<dc:creator>[^<]*<\/dc:creator>|<cp:lastModifiedBy>[^<]*<\/cp:lastModifiedBy>/g],
    ['docProps/app.xml', /<Company>[^<]*<\/Company>|<vt:lpstr>[^<]*<\/vt:lpstr>/g],
    ['xl/comments1.xml', /<author>[^<]*<\/author>|<t[^>]*>[^<]*<\/t>/g],
    ['xl/workbook.xml', /<sheet [^>]*name="[^"]*"|<definedName[^>]*>[^<]*<\/definedName>/g],
    ['xl/worksheets/sheet1.xml', /<oddHeader>[^<]*<\/oddHeader>|<oddFooter>[^<]*<\/oddFooter>|<f>[^<]*<\/f>/g],
  ];
  log(`### ${r.file}`);
  log('| Teil | vorher | nachher |');
  log('|---|---|---|');
  for (const [n, re] of checks) {
    const b = (await pick(before, n, re)).replace(/\|/g, '\\|');
    const a = (await pick(after, n, re)).replace(/\|/g, '\\|');
    log(`| ${n} | ${b} | ${a} |`);
  }
  log(`- Vorschaubild/Thumbnail vorhanden nachher: ${after.file(/thumbnail/).length ? 'ja' : 'nein'}`);
  log('');
}

// ---------- Determinismus ----------
log('## Determinismus (Doppellauf)');
for (const f of FORMATS) {
  const hashes = [];
  for (let run = 0; run < 2; run++) {
    const { page, ctx } = await newPage();
    await loadFixture(page, f.file);
    await ackWarnings(page);
    const e = await clickExport(page, f.native);
    const snap = await snapshot(page);
    hashes.push({ out: e.bytes ? sha(e.bytes) : 'kein Export', map: sha(JSON.stringify(snap.entities)) });
    await ctx.close();
  }
  const same = hashes[0].out === hashes[1].out && hashes[0].map === hashes[1].map;
  log(`- ${f.file}: Lauf 1 ${hashes[0].out} / Lauf 2 ${hashes[1].out}; Pseudonym-Zuordnung ${hashes[0].map} / ${hashes[1].map} → ${same ? 'identisch' : 'UNTERSCHIEDLICH'}`);
}
log('');

// ---------- Nicht unterstützte Dateien ----------
log('## Nicht unterstützte Dateien (müssen klar abgelehnt werden)');
for (const file of ['gescannt.pdf', 'alt-format.doc', 'alt-format.xls']) {
  const { page, ctx } = await newPage();
  const st = await loadFixture(page, file);
  const reviewHidden = await page.$eval('#review', (e) => e.hidden);
  log(`- ${file}: „${st.trim()}“ – Prüfansicht ${reviewHidden ? 'nicht angezeigt (kein Teilergebnis)' : 'ANGEZEIGT'}`);
  await ctx.close();
}
log('');

// ---------- Netzwerksperre zur Laufzeit ----------
{
  // Eigener Kontext, damit die absichtlichen Testversuche nicht in der allgemeinen Zählung landen
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const probeReqs = [];
  page.on('request', (r) => probeReqs.push(r.url()));
  page.on('requestfailed', (r) => { const x = probeReqs.indexOf(r.url()); if (x >= 0) probeReqs[x] += ' → abgebrochen: ' + (r.failure() ? r.failure().errorText : '?'); });
  page.on('response', (r) => { const x = probeReqs.indexOf(r.url()); if (x >= 0 && !r.url().startsWith('file:')) probeReqs[x] += ' → ANTWORT ERHALTEN'; });
  await page.goto('file://' + path.join(root, 'index.html'));
  const probe = await page.evaluate(async () => {
    const out = {};
    const tryIt = async (name, fn) => { try { await fn(); out[name] = 'NICHT gesperrt'; } catch (e) { out[name] = 'gesperrt (' + String(e.message || e).slice(0, 60) + ')'; } };
    await tryIt('fetch', () => fetch('https://example.com/'));
    await tryIt('XMLHttpRequest', () => { const x = new XMLHttpRequest(); x.open('GET', 'https://example.com/'); x.send(); });
    await tryIt('WebSocket', () => new WebSocket('wss://example.com/'));
    await tryIt('navigator.sendBeacon', () => { if (!navigator.sendBeacon('https://example.com/', 'x')) throw new Error('false'); });
    await tryIt('Bild laden (img)', () => new Promise((res, rej) => { const i = new Image(); i.onload = res; i.onerror = () => rej(new Error('blockiert')); i.src = 'https://example.com/x.png'; }));
    return out;
  });
  log('## Netzwerksperre zur Laufzeit (Versuche aus der Seite heraus)');
  for (const [k, v] of Object.entries(probe)) log(`- ${k}: ${v}`);
  log(`- Vom Browser registrierte Anfragen dieses Versuchs: ${probeReqs.filter((u) => !u.startsWith('file:')).join('; ') || 'keine'}`);
  log('');
  await ctx.close();
}

// ---------- Browser-Speicher: ohne Schalter nichts gespeichert ----------
{
  const { page, ctx } = await newPage();
  await loadFixture(page, 'protokoll.txt');
  await page.evaluate(() => window.__anon.addManual('Uchendu'));
  const before = await page.evaluate(() => ({ ls: localStorage.length, ss: sessionStorage.length, cookies: document.cookie.length }));
  page.once('dialog', (d) => d.accept());
  await page.check('#persist');
  const after = await page.evaluate(() => ({ ls: localStorage.length, keys: Object.keys(localStorage) }));
  page.once('dialog', (d) => d.accept());
  await page.click('#btn-clear');
  const cleared = await page.evaluate(() => localStorage.length);
  log('## Browser-Speicher');
  log(`- Nach Laden und manuellem Markieren, Schalter AUS: localStorage ${before.ls} Einträge, sessionStorage ${before.ss}, Cookies ${before.cookies} Zeichen`);
  log(`- Nach Einschalten des Schalters (mit Warnhinweis bestätigt): localStorage ${after.ls} Eintrag (${after.keys.join(', ')})`);
  log(`- Nach „Merkliste löschen“: localStorage ${cleared} Einträge`);
  log('');
  await ctx.close();
}

// ---------- Größe und Geschwindigkeit ----------
{
  log('## Größe/Geschwindigkeit (Desktop-Chromium, headless)');
  const big = path.join(outDir, 'gross.txt');
  const para = fs.readFileSync(path.join(fx, 'protokoll.txt'), 'utf8');
  for (const mb of [1, 5, 10]) {
    let t = '';
    while (t.length < mb * 1024 * 1024) t += para + '\n';
    fs.writeFileSync(big, t);
    const { page, ctx } = await newPage();
    const t0 = Date.now();
    const st = await loadFixtureAbs(page, big);
    const t1 = Date.now();
    await ackWarnings(page);
    const e = await clickExport(page, '#btn-txt');
    const t2 = Date.now();
    const mem = await page.evaluate(() => (performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : -1));
    log(`- TXT ${mb} MB: Laden+Analyse ${((t1 - t0) / 1000).toFixed(1)} s, Export+Schlusscheck ${((t2 - t1) / 1000).toFixed(1)} s, JS-Speicher ca. ${mem} MB – ${st.trim().slice(0, 60)}${e.bytes ? '' : ' (kein Export!)'}`);
    await ctx.close();
  }
  fs.rmSync(big);
  // Große Excel-Datei: 20 000 Zeilen
  const z = await JSZip.loadAsync(fs.readFileSync(path.join(fx, 'mitarbeiter.xlsx')));
  const ss = await z.file('xl/sharedStrings.xml').async('string');
  let rows = '';
  const names = ['Anna', 'Müller', 'Mehmet', 'Yılmaz', 'Krzysztof', 'Kowalczyk', 'Ngozi', 'Eze'];
  for (let r = 1; r <= 20000; r++) rows += `<row r="${r}"><c r="A${r}" t="inlineStr"><is><t>${names[r % 8]}</t></is></c><c r="B${r}" t="inlineStr"><is><t>${names[(r + 1) % 8]}</t></is></c><c r="C${r}" t="inlineStr"><is><t>Bemerkung ${r} für Frau ${names[(r + 3) % 8]}</t></is></c><c r="D${r}"><v>${r}</v></c></row>`;
  const sh = (await z.file('xl/worksheets/sheet3.xml').async('string')).replace(/<sheetData>.*<\/sheetData>/s, `<sheetData>${rows}</sheetData>`);
  z.file('xl/worksheets/sheet3.xml', sh);
  z.file('xl/sharedStrings.xml', ss);
  const bigX = path.join(outDir, 'gross.xlsx');
  fs.writeFileSync(bigX, await z.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }));
  const { page, ctx } = await newPage();
  const t0 = Date.now();
  const st = await loadFixtureAbs(page, bigX);
  const t1 = Date.now();
  await ackWarnings(page);
  const e = await clickExport(page, '#btn-xlsx');
  const t2 = Date.now();
  const mem = await page.evaluate(() => (performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : -1));
  log(`- XLSX mit 20 000 Zeilen × 4 Spalten (${(fs.statSync(bigX).size / 1048576).toFixed(1)} MB gepackt): Laden+Analyse ${((t1 - t0) / 1000).toFixed(1)} s, Export+Schlusscheck ${((t2 - t1) / 1000).toFixed(1)} s, JS-Speicher ca. ${mem} MB${e.bytes ? '' : ' (kein Export!)'} – ${st.trim().slice(0, 60)}`);
  await ctx.close();
  fs.rmSync(bigX);
  log('');
}

// ---------- Netzwerk ----------
const external = requests.filter((u) => !u.startsWith('file://') && !u.startsWith('blob:') && !u.startsWith('data:'));
log('## Netzwerkzugriffe während aller Tests');
log(`- Anfragen gesamt: ${requests.length}; davon nicht lokal (http/https/ws …): ${external.length}${external.length ? ' – ' + external.join(', ') : ''}`);
log(`- Lokale Anfragen: ${[...new Set(requests.map((u) => u.replace(/^(file:\/\/).*\/(.*)$/, '$1…/$2').replace(/^blob:.*/, 'blob:… (Download)')))].join(', ')}`);
await browser.close();
fs.rmSync(loT, { recursive: true, force: true });
fs.writeFileSync(path.join(here, 'REPORT.md'), report.join('\n') + '\n');
console.log('\nBericht: tests/REPORT.md');
