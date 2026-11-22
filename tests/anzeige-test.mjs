// Version 2.6.1: Anzeige beim Prüfen – drei Zustände im Text, Rollen zur aktuellen Stelle, Vorige/Nächste Frage,
// Antwort ändern = wie direkt geantwortet (auch Einstellungen und Listen), Rückbau nach geänderten Antworten.
// Testdokumente: tests/fixtures-spalten, tests/fixtures-bedienung, tests/fixtures-anzeige (make-anzeige.mjs), kurse.docx.
// Aufruf: node tests/anzeige-test.mjs [--firefox]   (Ergebnis: tests/ANZEIGE-REPORT.md)
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import JSZip from 'jszip';
import { makeAll as makeAnzeige, FXA } from './make-anzeige.mjs';
import { startAnon, loadIn, goTo, rbConfirm } from './ui-helpers.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
// ANZ_HTML/ANZ_ONLY nur für die Gegenprobe (z. B. Teil e gegen Version 2.6.0: die Fallen müssen dort scheitern)
const HTML = process.env.ANZ_HTML ? path.resolve(process.env.ANZ_HTML) : path.join(root, 'index.html');
const ONLY = process.env.ANZ_ONLY || '';
const part = (k) => !ONLY || ONLY.includes(k);
const outDir = path.join(here, 'out', 'anzeige'); // tests/out/ ist von git ausgenommen
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });
let pwMod;
try { pwMod = createRequire(import.meta.url)('playwright'); } catch { pwMod = createRequire('/opt/node22/lib/node_modules/')('playwright'); }
await makeAnzeige();
await (await import('./make-traeger.mjs')).makeAll();

const FS = path.join(here, 'fixtures-spalten');
const FB = path.join(here, 'fixtures-bedienung');
const FX = path.join(here, 'fixtures');
const FXT = path.join(here, 'fixtures-traeger'); // Version 2.8.0 (make-traeger.mjs)
const report = [];
const log = (s = '') => { report.push(s); console.log(s); };
const results = [];
const tally = {}; // Teil -> {ok, n}
function check(part, name, ok, detail = '') {
  results.push([part, name, ok]);
  tally[part] = tally[part] || { ok: 0, n: 0 };
  tally[part].n++;
  if (ok) tally[part].ok++;
  log(`- ${ok ? 'OK' : 'FEHLER'}: ${name}${detail ? ' – ' + detail : ''}`);
}
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
const requests = [];
const errors = [];
const browser = await pwMod.chromium.launch();
async function newPage({ reduce = true, width = 1280, height = 600 } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height }, reducedMotion: reduce ? 'reduce' : 'no-preference', acceptDownloads: true });
  const page = await ctx.newPage();
  page.on('request', (r) => { if (!/^(file|blob|data):/.test(r.url())) requests.push(r.url()); });
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('dialog', (d) => d.accept());
  await page.goto('file://' + HTML);
  return { page, ctx };
}
async function openUI(file, mode = 'person', opts) {
  const pg = await newPage(opts);
  await startAnon(pg.page, mode);
  await loadIn(pg.page, file);
  await goTo(pg.page, 'a2');
  await pg.page.waitForTimeout(80);
  return pg;
}
// Zustand der gezeigten Frage und ihrer Stellen im Text
const cardState = (page) => page.evaluate(() => {
  const A = window.__anon;
  const s = A.shownQuestion();
  const qs = A.questions();
  const q = s.idx >= 0 ? qs[s.idx] : null;
  // Version 2.9.0: Sammelfrage ohne Treffer (wie Dateiangaben); ihre Wörter werden erst nach einem Klick markiert
  const exp = !q || q.kind === 'meta' || q.kind === 'rest' ? [] : q.kind === 'place' ? [q.hit.id] : (q.hits.length ? q.hits : q.neinHits).map((x) => x.id);
  const first = !q || q.kind === 'meta' || q.kind === 'rest' ? null : q.kind === 'place' ? q.hit : q.first;
  const rendered = new Set([...document.querySelectorAll('#docview mark[data-h]')].map((m) => Number(m.dataset.h)));
  const cur = new Set([...document.querySelectorAll('#docview mark.cur')].map((m) => Number(m.dataset.h)));
  const expShown = exp.filter((id) => rendered.has(id));
  let vis = null;
  let tabOk = null;
  if (first) {
    const m = document.querySelector(`#docview mark[data-h="${first.id}"]`);
    if (m) {
      const r = m.getBoundingClientRect();
      const top = document.querySelector('.top').getBoundingClientRect().bottom;
      vis = r.top >= top - 0.5 && r.bottom <= innerHeight + 0.5 && r.left >= -0.5 && r.right <= document.documentElement.clientWidth + 0.5;
      const ts = m.closest('.tscroll');
      if (ts) { const b = ts.getBoundingClientRect(); vis = vis && r.left >= b.left - 0.5 && r.right <= b.right + 0.5; }
    } else vis = false;
    const view = A.app.doc.kind === 'xlsx' ? A.app.doc.raw.view : null;
    if (view) {
      const si = view.findIndex((sh) => sh.cells.some((c) => c.u === first.unit));
      tabOk = si < 0 ? true : A.app.sheetTab === si;
    }
  }
  return { id: q ? q.id : null, kind: q ? q.kind : null, count: document.querySelector('.qcount') ? document.querySelector('.qcount').textContent : '',
    exp: expShown.length, expAll: exp.length, cur: cur.size, curOk: expShown.every((id) => cur.has(id)) && [...cur].every((id) => exp.includes(id)), vis, tabOk,
    focus: document.activeElement ? document.activeElement.tagName + '#' + (document.activeElement.id || '') : '' };
});

log('# Anzeige beim Prüfen (Version 2.6.1)');
log('');
log(`Chromium headless gegen index.html (SHA-256 ${sha(fs.readFileSync(HTML)).slice(0, 16)}…). Alle Namen in den Testdateien sind erfunden.`);
log('');

const tableB = [];
if (part('a')) {
// ---------- a) Drei Zustände ----------
log('## a) Drei Zustände im Text und im Satz-Ausschnitt');
{
  const { page, ctx } = await openUI(path.join(FS, 'brief.docx'));
  const st = await page.evaluate(() => {
    const css = (m) => { if (!m) return null; const c = getComputedStyle(m); return { bg: c.backgroundColor, ow: c.outlineWidth, os: c.outlineStyle, oc: c.outlineColor, fw: c.fontWeight }; };
    const q = (sel) => document.querySelector(sel);
    return { on: css(q('#docview mark.hit.on:not(.ask):not(.cur)')), askOn: css(q('#docview mark.hit.on.ask:not(.cur)')), askOff: css(q('#docview mark.hit.off.ask:not(.cur)')),
      cur: css(q('#docview mark.hit.cur')), ctx: css(q('#qcard .qctx mark')) };
  });
  const isOn = (x) => x && x.bg === 'rgb(255, 243, 196)' && (x.os === 'none' || x.ow === '0px') && Number(x.fw) < 600;
  const isAsk = (x, bg) => x && x.bg === bg && x.ow === '1px' && x.os === 'dashed' && x.oc === 'rgb(138, 75, 0)' && Number(x.fw) < 600;
  const isCur = (x) => x && x.bg === 'rgb(255, 209, 92)' && x.ow === '3px' && x.os === 'solid' && x.oc === 'rgb(180, 83, 10)' && Number(x.fw) >= 700;
  const f = (x) => (x ? `${x.bg}, Rahmen ${x.ow} ${x.os} ${x.oc}, Stärke ${x.fw}` : 'nicht gefunden');
  check('a', 'wird ersetzt: Fläche #FFF3C4, kein Rahmen', isOn(st.on), f(st.on));
  check('a', 'Frage offen, wird ersetzt: Fläche blass, 1px gestrichelt #8A4B00', isAsk(st.askOn, 'rgb(255, 243, 196)'), f(st.askOn));
  check('a', 'Frage offen, bleibt stehen: keine Fläche, 1px gestrichelt #8A4B00', isAsk(st.askOff, 'rgba(0, 0, 0, 0)'), f(st.askOff));
  check('a', 'aktuelle Frage: Fläche #FFD15C, 3px durchgezogen #B4530A, fett', isCur(st.cur), f(st.cur));
  check('a', 'Satz-Ausschnitt der Karte wie „aktuelle Frage“', isCur(st.ctx), f(st.ctx));
  const title = await page.$eval('#docview mark.cur', (m) => m.title);
  check('a', 'Hinweis beim Überfahren nennt „aktuelle Frage“', /aktuelle Frage/.test(title), title);
  const klassen = await page.$eval('#docview mark.cur', (m) => m.className);
  check('a', 'vorhandene Klassen bleiben (hit, on/off, ask) + neue Klasse cur', /\bhit\b/.test(klassen) && /\b(on|off)\b/.test(klassen) && /\bcur\b/.test(klassen), klassen);
  await ctx.close();
}

}
if (part('b')) {
// ---------- b) und c) Kräftig markierte Stellen je Frage, Rollen ----------
log('');
log('## b) Kräftig markierte Stellen = Stellen der gezeigten Frage; c) Rollen zur ersten Stelle');
const FILES_B = [[FS, 'brief.docx'], [FS, 'liste.xlsx'], [FS, 'protokoll.txt'], [FB, 'bedienung.docx'], [FB, 'bedienung.txt'], [FB, 'bedienung.xlsx'], [FXA, 'mehrblatt.xlsx'], [FXA, 'lang.txt'],
  // Version 2.8.0: Einrichtungs-Fragen (kräftig markiert = alle Stellen und Schreibweisen der Einrichtung)
  [FXT, 'anmeldung.txt'], [FXT, 'einrichtungen-auto.docx'], [FXT, 'einrichtungen-auto.xlsx']];
for (const [dir, f] of FILES_B) {
  const { page, ctx } = await openUI(path.join(dir, f));
  let nQ = 0; let bOk = 0; let cOk = 0; let cN = 0; let focusOk = 0;
  const bad = [];
  const ids = await page.evaluate(() => window.__anon.questions().map((q) => q.id));
  // b) jede Frage einmal zeigen
  for (const id of ids) {
    await page.evaluate((x) => window.__anon.showQ(x), id);
    await page.waitForTimeout(30);
    const s = await cardState(page);
    nQ++;
    const good = s.cur === s.exp && s.curOk && (s.kind !== 'meta' || s.cur === 0);
    if (good) bOk++; else bad.push(`${id}: ${s.cur} kräftig statt ${s.exp}`);
  }
  // c) Fragenwechsel wie ein Nutzer: von vorn, mit J/N durch alle Fragen; danach mit → noch einmal
  await page.evaluate(() => { window.__anon.app.qShown = null; window.__anon.showQ(null); });
  await page.waitForTimeout(100);
  await page.evaluate(() => { const h1 = document.querySelector('#scr-a2 h1'); h1.focus(); });
  const steps = [];
  for (let i = 0; i < 60; i++) {
    const s = await cardState(page);
    if (!s.id) break;
    // Version 2.9.0: die Sammelfrage rollt erst beim Klick auf ein Wort (geprüft im Testlauf restwoerter), wie Dateiangaben ohne Stelle
    if (s.kind !== 'meta' && s.kind !== 'rest') { cN++; if (s.vis && s.tabOk !== false) cOk++; else bad.push(`${s.count}: Stelle nicht sichtbar (Reiter ${s.tabOk})`); }
    if (s.focus === 'H1#') focusOk++;
    steps.push(s.count);
    await page.keyboard.press(i % 2 ? 'n' : 'j');
    await page.waitForTimeout(60);
  }
  // ohne gezeigte Frage („Alle Fragen beantwortet“): nichts kräftig
  const none = await cardState(page);
  const noneOk = none.id === null && none.cur === 0 && !!(await page.$('#q-again'));
  // Klick auf eine Markierung: kein Rollen
  const pos = () => page.evaluate(() => [Math.round(scrollY), ...[...document.querySelectorAll('.tscroll')].map((t) => t.scrollLeft)].join(','));
  if (await page.$('#q-again')) await page.click('#q-again');
  await page.waitForTimeout(60);
  const p0 = await pos();
  const mk = await page.$('#docview mark.cur') || await page.$('#docview mark.hit');
  let clickOk = true;
  if (mk) {
    const txt = await mk.textContent();
    await mk.click(); await page.waitForTimeout(80); clickOk = (await pos()) === p0;
    // Version 2.8.0 (Nachbesserung): ein Klick auf eine gefundene Einrichtung rechnet neu und zeichnet die Ansicht neu ->
    // Markierung für den zweiten Klick neu suchen (gleicher Text)
    const mk2 = await page.evaluateHandle((t) => [...document.querySelectorAll('#docview mark')].find((m) => m.textContent === t) || null, txt);
    if (mk2.asElement()) { await mk2.asElement().click(); await page.waitForTimeout(40); }
  }
  tableB.push([f, nQ, bOk, noneOk, cN, cOk, clickOk, focusOk, steps.length]);
  check('b', `${f}: ${nQ} Fragen, kräftig markiert = Stellen der Frage`, bOk === nQ && noneOk, bad.filter((x) => /kräftig/.test(x)).join('; '));
  check('c', `${f}: nach jedem Fragenwechsel erste Stelle sichtbar (${cOk}/${cN})${dir === FXA && f.endsWith('xlsx') ? ', Reiter = Blatt der Stelle' : ''}`, cOk === cN, bad.filter((x) => /sichtbar/.test(x)).join('; '));
  check('c', `${f}: Klick auf eine Markierung rollt nicht`, clickOk);
  check('c', `${f}: Fokus bleibt (Tasten J/N), ${focusOk}/${steps.length}`, focusOk === steps.length);
  await ctx.close();
}
log('');
log('| Datei | Fragen | kräftig = Stellen | ohne Frage nichts kräftig | Fragenwechsel | Stelle sichtbar | Klick rollt nicht | Fokus unverändert |');
log('|---|---|---|---|---|---|---|---|');
for (const r of tableB) log(`| ${r[0]} | ${r[1]} | ${r[2]}/${r[1]} | ${r[3] ? 'ja' : 'NEIN'} | ${r[4]} | ${r[5]}/${r[4]} | ${r[6] ? 'ja' : 'NEIN'} | ${r[7]}/${r[8]} |`);
// Gleit-Bewegung (ohne „weniger Bewegung“): Stelle nach dem Rollen sichtbar
{
  const { page, ctx } = await openUI(path.join(FXA, 'lang.txt'), 'person', { reduce: false });
  await page.keyboard.press('j');
  await page.waitForTimeout(1500);
  const s = await cardState(page);
  check('c', 'mit Gleit-Bewegung: Stelle nach dem Rollen sichtbar (lang.txt)', s.vis === true, s.count);
  await ctx.close();
}
// Excel: Nutzer wechselt den Reiter selbst -> bleibt bis zur nächsten Frage
{
  const { page, ctx } = await openUI(path.join(FXA, 'mehrblatt.xlsx'));
  const tab0 = await page.evaluate(() => window.__anon.app.sheetTab);
  await page.click('[role=tab][data-tab="1"]');
  await page.click('#docview', { position: { x: 5, y: 5 } }).catch(() => {});
  await page.evaluate(() => window.__anon.goQuestion(0));
  const tab1 = await page.evaluate(() => window.__anon.app.sheetTab);
  await page.keyboard.press('j');
  await page.waitForTimeout(60);
  const s = await cardState(page);
  check('c', `Excel: eigener Reiterwechsel bleibt (Blatt ${tab0} → ${tab1}); nächste Frage wechselt zum Blatt ihrer Stelle`, tab1 === 1 && s.tabOk === true);
  await ctx.close();
}

}
if (part('d')) {
// ---------- d) Zähler und Knöpfe ----------
log('');
log('## d) Zähler, Vorige/Nächste Frage, Pfeiltasten');
{
  const { page, ctx } = await openUI(path.join(FB, 'bedienung.docx'));
  const count = () => page.$eval('.qcount', (e) => e.textContent);
  check('d', 'Frage 1: „Vorige Frage“ sichtbar und ausgegraut, mit aria-label und title', await page.$eval('#q-prev', (b) => b.disabled && b.getAttribute('aria-label') === 'Vorige Frage' && b.title === 'Vorige Frage'));
  check('d', 'Frage 1 ohne Antwort: „Nächste Frage“ ausgegraut', await page.$eval('#q-next', (b) => b.disabled && b.getAttribute('aria-label') === 'Nächste Frage'));
  const forward = [];
  // Version 2.9.0: die Sammelfrage (letzte Frage) hat nur „Kein Name dabei“ (Taste N)
  for (let i = 0; i < 30 && !(await page.$('#q-again')); i++) { forward.push(await count()); await page.keyboard.press((await page.$('#rest-list')) ? 'n' : 'j'); await page.waitForTimeout(40); }
  log(`  - Beim Beantworten gezeigt: ${forward.join(' → ')}`);
  check('d', '„Alle Fragen beantwortet“ hat „Vorige Frage“ (aktiv)', await page.$eval('#q-prev', (b) => !b.disabled));
  await page.keyboard.press('ArrowLeft');
  const last = await count();
  const n = Number(last.match(/von (\d+)/)[1]);
  check('d', `„Vorige Frage“ auf „Alle Fragen beantwortet“ führt zur letzten Frage (${last})`, last === `Frage ${n} von ${n}`);
  await page.keyboard.press('ArrowRight'); // zurück zu „Alle Fragen beantwortet“
  await page.click('#q-again'); // „Fragen noch einmal zeigen“
  const seq = [await count()];
  for (let i = 1; i < n; i++) { await page.keyboard.press('ArrowRight'); seq.push(await count()); }
  const want = Array.from({ length: n }, (_, i) => `Frage ${i + 1} von ${n}`);
  check('d', `vorwärts mit → lückenlos 1 … ${n}`, JSON.stringify(seq) === JSON.stringify(want), seq.join(', '));
  let backOk = true;
  for (let k = n; k > 1; k--) { await page.keyboard.press('ArrowLeft'); if ((await count()) !== `Frage ${k - 1} von ${n}`) backOk = false; }
  check('d', 'rückwärts mit ← jeweils k → k−1', backOk);
  check('d', 'bei Frage 1 ist „Vorige Frage“ ausgegraut', await page.$eval('#q-prev', (b) => b.disabled));
  await page.keyboard.press('ArrowRight');
  const c2 = await count();
  await page.click('#q-prev');
  const c1 = await count();
  await page.click('#q-next');
  check('d', 'Knöpfe ← und → wie die Tasten', c2 === `Frage 2 von ${n}` && c1 === `Frage 1 von ${n}` && (await count()) === c2);
  check('d', 'beantwortete Frage zeigt „Bisherige Antwort“', /Bisherige Antwort: (Ja|Nein)/.test(await page.$eval('#qcard', (e) => e.textContent)));
  await ctx.close();
  // Eingabefeld: Pfeiltasten und J/N ohne Wirkung (Spalten-Schalter in der Prüfansicht ist ein Eingabefeld)
  const t = await openUI(path.join(FS, 'brief.docx'));
  const before = await t.page.$eval('.qcount', (e) => e.textContent);
  await t.page.focus('input[data-col]');
  await t.page.keyboard.press('ArrowRight');
  await t.page.keyboard.press('j');
  const after = await t.page.$eval('.qcount', (e) => e.textContent);
  const ans = await t.page.evaluate(() => window.__anon.app.answers.size);
  check('d', 'im Eingabefeld: ← → J N ohne Wirkung', before === after && ans === 0);
  await t.ctx.close();
}

}
// ---------- e) Weg-Gleichheit ----------
log('');
log('## e) Antwort ändern = wie direkt richtig geantwortet (Ausgaben in drei Modi und Schlüsseldatei)');
const FORMATS = { txt: ['txt', 'docx'], csv: ['csv', 'txt', 'docx'], docx: ['docx', 'txt'], xlsx: ['xlsx', 'txt'], pdf: ['txt', 'docx'] };
// Ein Lauf: Datei laden, Schritte ausführen, Zustand und Ausgaben sammeln
async function run(file, mode, steps, { preset = null, settings = null } = {}) {
  const { page, ctx } = await newPage();
  await page.evaluate(([m, pre, set]) => {
    const A = window.__anon;
    A.app.state.settings.mode = m;
    if (pre) A.app.state.manualTerms.push(...pre);
    if (set) Object.assign(A.app.state.settings, set);
  }, [mode, preset, settings]);
  await page.evaluate(async ([arr, nm]) => { await window.__anon.openBytes(new Uint8Array(arr), nm); window.__anon.show('a2'); }, [[...fs.readFileSync(file)], path.basename(file)]);
  for (const st of steps) {
    if (st.a === 'ans') {
      await page.evaluate(([kind, w, yes]) => {
        const A = window.__anon;
        const ft = A.app.result.fullText;
        const q = A.questions().find((x) => x.kind === kind && (x.word === w || x.name === w || (x.hit && ft.slice(x.hit.s, x.hit.e) === w)));
        if (!q) throw new Error('Frage nicht gefunden: ' + kind + ' ' + w);
        A.answer(q, yes);
      }, [st.kind, st.w, st.yes]);
    } else if (st.a === 'toggle') {
      await page.evaluate((w) => { const A = window.__anon; const x = A.app.result.hits.find((y) => A.app.result.fullText.slice(y.s, y.e) === w); document.querySelector(`#docview mark[data-h="${x.id}"]`).click(); }, st.w);
    } else if (st.a === 'setting') {
      await page.evaluate(([id, v]) => { const cb = document.querySelector('#opt-' + id); cb.checked = v; cb.dispatchEvent(new Event('change')); }, [st.id, st.v]);
    } else if (st.a === 'remove') {
      await page.evaluate((t) => { const b = [...document.querySelectorAll('#names-chips button.x')].find((x) => x.getAttribute('aria-label') === t + ' entfernen'); b.click(); }, st.t);
    } else if (st.a === 'add') {
      await page.evaluate((t) => { document.querySelector('#name-input').value = t; document.querySelector('#name-add').requestSubmit(); }, st.t);
    }
  }
  const res = await page.evaluate(async (F) => {
    const A = window.__anon;
    const R = A.app.result;
    A.app.kennung = 'TST1';
    const o = {};
    for (const f of F[A.app.doc.kind]) { const x = await A.buildOutput(f); o[f] = x.zip ? Array.from(x.bytes) : x.text; }
    const qs = A.questions();
    return { o, on: R.hits.map((h) => h.key + (h.on ? '+' : '-')).join(' '), lists: JSON.stringify([A.app.state.manualTerms, A.app.state.orgTerms, A.app.state.exceptions]),
      open: qs.filter((q) => !A.answerOf(q)).map((q) => q.id).join(' '), answers: qs.map((q) => q.id + '=' + (A.answerOf(q) || '-')).join(' '),
      note: !!document.querySelector('#q-note') };
  }, FORMATS);
  let key = null;
  if (mode === 'reversible') {
    await page.evaluate(() => window.__anon.show('a3'));
    const dlP = page.waitForEvent('download', { timeout: 30000 });
    await page.click('#btn-key');
    const dl = await dlP;
    const p = path.join(outDir, `k-${Date.now()}-${Math.random().toString(36).slice(2)}.json`);
    await dl.saveAs(p);
    const k = JSON.parse(fs.readFileSync(p, 'utf8').replace(/^﻿/, ''));
    delete k.toolVersion; delete k.erstellt; delete k.version; delete k.kennung;
    key = JSON.stringify(k);
  }
  await ctx.close();
  return { ...res, key, outSha: Object.fromEntries(Object.entries(res.o).map(([f, v]) => [f, sha(typeof v === 'string' ? Buffer.from(v) : Buffer.from(v))])) };
}
function same(a, b) {
  const diff = [];
  for (const f of Object.keys(a.outSha)) if (a.outSha[f] !== b.outSha[f]) diff.push('Ausgabe .' + f);
  if (a.key !== b.key) diff.push('Schlüsseldatei');
  for (const k of ['on', 'lists', 'open', 'answers']) if (a[k] !== b[k]) diff.push({ on: 'ersetzte Stellen', lists: 'Listen', open: 'offene Fragen', answers: 'Antworten' }[k]);
  return diff;
}
const MODES = ['person', 'name', 'reversible'];
const tableE = [];
async function pathCase(part, label, file, pathSteps, directSteps, opts = {}) {
  const diffs = [];
  for (const mode of MODES) {
    const a = await run(file, mode, pathSteps, opts);
    const b = await run(file, mode, directSteps, opts.direct || opts);
    const d = same(a, b);
    if (d.length) diffs.push(`${mode}: ${d.join(', ')}`);
  }
  tableE.push([label, path.basename(file), diffs.length ? 'NEIN' : 'ja']);
  check(part, `${label} (${path.basename(file)}, drei Modi${'' })`, !diffs.length, diffs.join('; '));
}
const A = (kind, w, yes) => ({ a: 'ans', kind, w, yes });
const BED_TXT = path.join(FB, 'bedienung.txt');
const BED_DOCX = path.join(FB, 'bedienung.docx');
const KURSE = path.join(FX, 'kurse.docx');
const BRIEF = path.join(FS, 'brief.docx');
if (part('e')) {
await pathCase('e', 'Wort-Frage Ja → Nein', BRIEF, [A('word', 'Lieder', true), A('word', 'Lieder', false)], [A('word', 'Lieder', false)]);
await pathCase('e', 'Wort-Frage Nein → Ja', BRIEF, [A('word', 'Lieder', false), A('word', 'Lieder', true)], [A('word', 'Lieder', true)]);
await pathCase('e', 'Stellen-Frage Ja → Nein', BED_TXT, [A('place', 'Winter', true), A('place', 'Winter', false)], [A('place', 'Winter', false)]);
await pathCase('e', 'Stellen-Frage Nein → Ja', BED_TXT, [A('place', 'Winter', false), A('place', 'Winter', true)], [A('place', 'Winter', true)]);
await pathCase('e', 'Dateiangabe Person Ja → Nein', BED_DOCX, [A('meta', 'Edda Wittekindhorn', true), A('meta', 'Edda Wittekindhorn', false)], [A('meta', 'Edda Wittekindhorn', false)]);
await pathCase('e', 'Dateiangabe Person Nein → Ja', BED_DOCX, [A('meta', 'Edda Wittekindhorn', false), A('meta', 'Edda Wittekindhorn', true)], [A('meta', 'Edda Wittekindhorn', true)]);
await pathCase('e', 'Dateiangabe Einrichtung Ja → Nein', KURSE, [A('meta', 'Familienzentrum Sonnenblume', true), A('meta', 'Familienzentrum Sonnenblume', false)], [A('meta', 'Familienzentrum Sonnenblume', false)]);
await pathCase('e', 'Dateiangabe Einrichtung Nein → Ja', KURSE, [A('meta', 'Familienzentrum Sonnenblume', false), A('meta', 'Familienzentrum Sonnenblume', true)], [A('meta', 'Familienzentrum Sonnenblume', true)]);
log('');
log('Fallen:');
const FALLE = path.join(FXA, 'falle.txt');
await pathCase('e', 'Falle 1: Wort-Frage Nein → Ja schaltet die mit „Nein“ ausgeschaltete Stelle im Sachkontext („Rosen“) zurück', FALLE, [A('word', 'Rose', false), A('word', 'Rose', true)], [A('word', 'Rose', true)]);
await pathCase('e', 'Falle 1 (zweite Datei): dasselbe mit „Felder“', BED_TXT, [A('word', 'Felder', false), A('word', 'Felder', true)], [A('word', 'Felder', true)]);
await pathCase('e', 'Falle 2 („Rose“): Ja, Stellen-Frage „Rosen“ Nein, dann Nein → wie direkt Nein', FALLE, [A('word', 'Rose', true), A('place', 'Rosen', false), A('word', 'Rose', false)], [A('word', 'Rose', false)]);
await pathCase('e', 'Falle 2 („Rose“) … und wieder Ja → wie direkt Ja (Stellen-Frage offen)', FALLE, [A('word', 'Rose', true), A('place', 'Rosen', false), A('word', 'Rose', false), A('word', 'Rose', true)], [A('word', 'Rose', true)]);
await pathCase('e', 'Falle 2: Wort-Frage Ja, Stellen-Frage beantwortet, dann Nein: Stellen-Antwort verworfen', BED_TXT,
  [A('word', 'Felder', true), A('place', 'Felder', true), A('word', 'Felder', false)], [A('word', 'Felder', false)]);
await pathCase('e', 'Falle 2b: … und wieder Ja: Stellen-Frage ist offen (wie direkt Ja)', BED_TXT,
  [A('word', 'Felder', true), A('place', 'Felder', true), A('word', 'Felder', false), A('word', 'Felder', true)], [A('word', 'Felder', true)]);
await pathCase('e', 'Falle 3: Dateiangabe Ja → Nein nimmt den übernommenen Namen wieder aus der Liste (samt Folge-Frage zur GROSS-Form)', BED_DOCX,
  [A('meta', 'Edda Wittekindhorn', true), A('place', 'WITTEKINDHORNS', true), A('meta', 'Edda Wittekindhorn', false)], [A('meta', 'Edda Wittekindhorn', false)]);
await pathCase('e', 'Falle 3b: Name stand schon vorher in der Liste: Ja → Nein lässt ihn drin', BED_DOCX,
  [A('meta', 'Edda Wittekindhorn', true), A('meta', 'Edda Wittekindhorn', false)], [A('meta', 'Edda Wittekindhorn', false)], { preset: ['Edda Wittekindhorn'] });
await pathCase('e', 'Falle 4: von Hand umgeschaltete Stelle einer anderen Frage bleibt', BED_TXT,
  [A('word', 'Felder', true), { a: 'toggle', w: 'Paul Winter' }, A('word', 'Felder', false)], [A('word', 'Felder', false), { a: 'toggle', w: 'Paul Winter' }]);
await pathCase('e', 'Dieselbe Antwort noch einmal ändert nichts', BED_TXT, [A('word', 'Felder', true), A('word', 'Felder', true)], [A('word', 'Felder', true)]);
// Version 2.8.0: Einrichtungs-Fragen (selbst gefundene Einrichtungen)
const ANM = path.join(FXT, 'anmeldung.txt');
const EAUTO = path.join(FXT, 'einrichtungen-auto.docx');
await pathCase('e', 'Einrichtungs-Frage Ja → Nein', ANM, [A('org', 'Gymnasium Tannhofen', true), A('org', 'Gymnasium Tannhofen', false)], [A('org', 'Gymnasium Tannhofen', false)]);
await pathCase('e', 'Einrichtungs-Frage Nein → Ja', ANM, [A('org', 'Gymnasium Tannhofen', false), A('org', 'Gymnasium Tannhofen', true)], [A('org', 'Gymnasium Tannhofen', true)]);
await pathCase('e', 'Einrichtungs-Frage (vier Schreibweisen) Ja → Nein', EAUTO, [A('org', 'Gymnasium Wendorf', true), A('org', 'Gymnasium Wendorf', false)], [A('org', 'Gymnasium Wendorf', false)]);
await pathCase('e', 'Einrichtungs-Frage (vier Schreibweisen) Nein → Ja', EAUTO, [A('org', 'Gymnasium Wendorf', false), A('org', 'Gymnasium Wendorf', true)], [A('org', 'Gymnasium Wendorf', true)]);
await pathCase('e', 'Einrichtungs-Frage: Ja, Einstellung geändert, Nein → wie Einstellung + direkt Nein', ANM,
  [A('org', 'Brandner lern und spiel', true), { a: 'setting', id: 'unsureOn', v: false }, A('org', 'Brandner lern und spiel', false)], [{ a: 'setting', id: 'unsureOn', v: false }, A('org', 'Brandner lern und spiel', false)]);
await pathCase('e', 'Einrichtungs-Frage: Nein, Liste geändert (Name hinzu), Ja → wie Liste + direkt Ja', ANM,
  [A('org', 'Brandner lern und spiel', false), { a: 'add', t: 'Quarstedt' }, A('org', 'Brandner lern und spiel', true)], [{ a: 'add', t: 'Quarstedt' }, A('org', 'Brandner lern und spiel', true)]);
// Nachbesserung 2.8.0: „Nein“ gibt die Wörter frei, die Personen-Erkennung gilt dort wieder (mit eigenen Fragen)
const EPERS = path.join(FXT, 'einrichtung-person.txt');
await pathCase('e', 'Einrichtung mit Personen-Frage darin: Ja → Nein → Ja = direkt Ja („Kita Sonnenblume“, nach Nein wieder Frage „Kita“)', EAUTO, [A('org', 'Kita Sonnenblume', true), A('org', 'Kita Sonnenblume', false), A('org', 'Kita Sonnenblume', true)], [A('org', 'Kita Sonnenblume', true)]);
await pathCase('e', 'Einrichtung mit Personen-Frage darin: Ja → Nein = direkt Nein („Kita Sonnenblume“)', EAUTO, [A('org', 'Kita Sonnenblume', true), A('org', 'Kita Sonnenblume', false)], [A('org', 'Kita Sonnenblume', false)]);
await pathCase('e', 'Bindestrich-Form: Nein → Ja = direkt Ja („Erika-Brandner-Schule“)', EPERS, [A('org', 'Erika-Brandner-Schule', false), A('org', 'Erika-Brandner-Schule', true)], [A('org', 'Erika-Brandner-Schule', true)]);
await pathCase('e', 'Bindestrich-Form: Ja → Nein = direkt Nein („Erika-Brandner-Schule“)', EPERS, [A('org', 'Erika-Brandner-Schule', true), A('org', 'Erika-Brandner-Schule', false)], [A('org', 'Erika-Brandner-Schule', false)]);
await pathCase('e', 'Mehrfach geändert (Ja → Nein → Ja → Nein)', BRIEF, [A('word', 'Lieder', true), A('word', 'Lieder', false), A('word', 'Lieder', true), A('word', 'Lieder', false)], [A('word', 'Lieder', false)]);

if (part('s')) {
}
// ---------- Einstellungen und Listen (Entscheidung Easy) ----------
log('');
log('## Einstellungen und Listen nach Antworten (Entscheidung Easy)');
{
  const answersAll = [A('word', 'Felder', true), A('place', 'Winter', false), A('place', 'Rosen', true)];
  for (const [id, v] of [['unsureOn', false], ['email', false]]) {
    const diffs = [];
    let openOk = true;
    let noteOk = true;
    for (const mode of MODES) {
      const a = await run(BED_TXT, mode, [...answersAll, { a: 'setting', id, v }]);
      const b = await run(BED_TXT, mode, [], { settings: { [id]: v } });
      const d = same(a, b);
      if (d.length) diffs.push(`${mode}: ${d.join(', ')}`);
      if (a.answers !== b.answers || a.open !== b.open) openOk = false;
      if (!a.note || b.note) noteOk = false;
    }
    check('s', `Einstellung „${id}“ → ${v} nach Antworten: wie frisch berechnet (drei Modi, Schlüsseldatei)`, !diffs.length, diffs.join('; '));
    check('s', `… alle Fragen offen`, openOk);
    check('s', `… Hinweis „Du hast eine Einstellung geändert …“ sichtbar (frischer Lauf ohne Hinweis)`, noteOk);
  }
  // Rückrichtung: „Unsichere Treffer ersetzen“ aus und wieder an
  const diffs = [];
  for (const mode of MODES) {
    const a = await run(BED_TXT, mode, [...answersAll, { a: 'setting', id: 'unsureOn', v: false }, { a: 'setting', id: 'unsureOn', v: true }]);
    const b = await run(BED_TXT, mode, []);
    const d = same(a, b);
    if (d.length) diffs.push(`${mode}: ${d.join(', ')}`);
  }
  check('s', 'Einstellung „unsureOn“ aus und wieder an nach Antworten: wie frisch (drei Modi)', !diffs.length, diffs.join('; '));
  // Easys nachgestellter Fall
  const l = await run(BRIEF, 'person', [A('word', 'Lieder', false), { a: 'setting', id: 'unsureOn', v: false }, { a: 'setting', id: 'unsureOn', v: true }]);
  const liederOpen = /p:[^ ]*lieder[^ ]*=-/i.test(l.answers) && /lieder/i.test(l.open);
  check('s', '„Lieder“: Nein, Einstellung aus und wieder ein → Frage wieder offen, nicht still beantwortet', liederOpen && l.note);
  // Keine Antworten: kein Hinweis
  const k = await run(BED_TXT, 'person', [{ a: 'setting', id: 'unsureOn', v: false }]);
  check('s', 'Einstellung ohne vorherige Antworten: kein Hinweis', !k.note);
  // Liste: übernommener Name entfernt -> Antwort „Nein“, Ausgabe wie direktes Nein
  const ld = [];
  let neinOk = true;
  for (const mode of MODES) {
    const a = await run(BED_DOCX, mode, [A('meta', 'Edda Wittekindhorn', true), A('place', 'WITTEKINDHORNS', true), { a: 'remove', t: 'Edda Wittekindhorn' }]);
    const b = await run(BED_DOCX, mode, [A('meta', 'Edda Wittekindhorn', false)]);
    const d = same(a, b);
    if (d.length) ld.push(`${mode}: ${d.join(', ')}`);
    if (!/m:edda wittekindhorn=nein/.test(a.answers)) neinOk = false;
  }
  check('l', 'Liste: über Dateiangaben-„Ja“ übernommener Name entfernt → Antwort „Nein“', neinOk);
  check('l', '… Ausgaben (drei Modi, Schlüsseldatei) wie bei direktem „Nein“', !ld.length, ld.join('; '));
  // Liste: Name hinzugefügt nach Antworten -> Antworten und Wirkung unverändert
  const a = await run(BED_TXT, 'reversible', [...answersAll, { a: 'add', t: 'Quirina Zabelsteg' }]);
  const b = await run(BED_TXT, 'reversible', answersAll);
  check('l', 'Liste: Name hinzugefügt nach Antworten → Antworten und ihre Wirkung unverändert', a.answers === b.answers && a.on === b.on && a.key === b.key && a.lists !== b.lists);
}

}
// ---------- f) Rückbau nach geänderten Antworten ----------
log('');
log('## f) Rückbau nach einer Sitzung mit geänderten Antworten (Modus rückbaufähig)');
const dec = (x) => x.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
async function textOf(bytes, kind) {
  if (kind === 'txt') { let t = Buffer.from(bytes).toString('utf8'); if (t.charCodeAt(0) === 0xfeff) t = t.slice(1); return t.split(/\r?\n/); }
  const z = await JSZip.loadAsync(bytes);
  const out = [];
  if (kind === 'docx') {
    for (const n of Object.keys(z.files).filter((x) => /^word\/(document|header\d*|footer\d*|footnotes|endnotes|comments)\.xml$/.test(x)).sort()) {
      const xml = await z.file(n).async('string');
      xml.split(/<w:p[ >]/).slice(1).forEach((p, i) => out.push(`${n}#${i}: ${dec([...p.matchAll(/<w:(?:t|delText)(?: [^>]*)?>([^<]*)<\/w:(?:t|delText)>/g)].map((m) => m[1]).join(''))}`));
    }
  } else {
    const ss = z.file('xl/sharedStrings.xml') ? [...(await z.file('xl/sharedStrings.xml').async('string')).matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) => dec([...m[1].matchAll(/<t(?: [^>]*)?>([^<]*)<\/t>/g)].map((x) => x[1]).join(''))) : [];
    for (const n of Object.keys(z.files).filter((x) => /^xl\/worksheets\/sheet\d+\.xml$/.test(x)).sort()) {
      const xml = await z.file(n).async('string');
      for (const c of xml.matchAll(/<c r="([A-Z]+\d+)"([^>]*)>([\s\S]*?)<\/c>/g)) {
        const v = (c[3].match(/<v>([^<]*)<\/v>/) || [])[1];
        out.push(`${n}!${c[1]}: ${/t="s"/.test(c[2]) ? ss[Number(v)] : /inlineStr/.test(c[2]) ? dec([...c[3].matchAll(/<t(?: [^>]*)?>([^<]*)<\/t>/g)].map((x) => x[1]).join('')) : dec(v || '')}`);
      }
    }
  }
  return out;
}
const RB = [
  [path.join(FS, 'brief.docx'), 'docx', [A('word', 'Lieder', true), A('meta', 'Ingeborg Feldkämper', false), A('word', 'Lieder', false), A('meta', 'Ingeborg Feldkämper', true), A('place', 'Winter', true), A('place', 'Winter', false)]],
  [path.join(FS, 'liste.xlsx'), 'xlsx', [A('word', 'Yoga', true), A('word', 'Yoga', false), A('place', 'Winter', true), A('place', 'Winter', false), A('word', 'Yoga', true)]],
  [path.join(FB, 'bedienung.txt'), 'txt', [A('word', 'Felder', false), A('word', 'Felder', true), A('place', 'Felder', true), A('place', 'Rosen', false), A('place', 'Rosen', true)]],
];
const tableF = [];
if (part('f')) {
for (const [file, kind, steps] of RB) {
  // anonymisieren mit geänderten Antworten, Schlüssel und Datei speichern
  const { page, ctx } = await newPage();
  await page.evaluate(async ([arr, nm]) => { const X = window.__anon; X.app.state.settings.mode = 'reversible'; await X.openBytes(new Uint8Array(arr), nm); X.show('a2'); }, [[...fs.readFileSync(file)], path.basename(file)]);
  for (const st of steps) {
    await page.evaluate(([k, w, yes]) => { const X = window.__anon; const ft = X.app.result.fullText; const q = X.questions().find((x) => x.kind === k && (x.word === w || x.name === w || (x.hit && ft.slice(x.hit.s, x.hit.e) === w))); if (!q) throw new Error('Frage fehlt ' + w); X.answer(q, yes); }, [st.kind, st.w, st.yes]);
  }
  await page.evaluate(() => window.__anon.show('a3'));
  const dlP = page.waitForEvent('download', { timeout: 30000 });
  await page.click('#btn-key');
  const keyPath = path.join(outDir, `rb-key-${kind}.json`);
  await (await dlP).saveAs(keyPath);
  const anonBytes = await page.evaluate(async (k) => { const x = await window.__anon.buildOutput(k); return x.zip ? Array.from(x.bytes) : Array.from(new TextEncoder().encode(x.text)); }, kind);
  await ctx.close();
  const anonPath = path.join(outDir, `anonym.${kind}`);
  fs.writeFileSync(anonPath, Buffer.from(anonBytes));
  // zurückbauen
  const r = await newPage();
  await r.page.click('#go-restore');
  await r.page.setInputFiles('#rb-file', anonPath);
  await r.page.waitForFunction(() => document.querySelector('#rb-file-status').textContent, null, { timeout: 60000 });
  await r.page.setInputFiles('#rb-key', keyPath);
  await r.page.waitForFunction(() => document.querySelector('#rb-key-status').textContent);
  await r.page.click('#rb-btn-check', { timeout: 3000 }).catch(() => {});
  const plan = await r.page.evaluate(() => { const p = window.__anon.rb.plan; return p ? { total: p.totalFound, verdict: p.verdict } : null; });
  await rbConfirm(r.page, true);
  await r.page.click('#r2-next', { timeout: 5000 }).catch(() => {});
  const dl2 = r.page.waitForEvent('download', { timeout: 60000 });
  await r.page.click('#rb-btn-save');
  const outPath = path.join(outDir, `zurueck.${kind}`);
  await (await dl2).saveAs(outPath);
  await r.ctx.close();
  const got = await textOf(fs.readFileSync(outPath), kind);
  const want = await textOf(fs.readFileSync(file), kind);
  const dev = Math.max(got.length, want.length) - got.filter((l, i) => l === want[i]).length;
  const anonText = (await textOf(Buffer.from(anonBytes), kind)).join('\n');
  tableF.push([path.basename(file), steps.length, plan ? plan.total : 0, dev]);
  check('f', `${path.basename(file)}: ${steps.length} Antwort-Schritte (mit Änderungen), ${plan ? plan.total : 0} Platzhalter zurück, Abweichungen ${dev}`, plan && dev === 0 && anonText !== want.join('\n'));
}

}
if (part('z')) {
// ---------- z) Kein „null“/„undefined“ in der Oberfläche (Nachbesserung 2.7.0) ----------
log('');
log('## z) Kein Text „null“ oder „undefined“ (Fragekarte in jedem Zustand, Bildschirme Datei/Prüfen/Speichern je Format)');
const BAD = /\b(null|undefined)\b/;
const cardText = (page) => page.$eval('#qcard', (e) => e.innerText.replace(/\s+/g, ' ').trim());
const screenText = (page, id) => page.$eval('#scr-' + id, (e) => e.innerText.replace(/\s+/g, ' ').trim());
const bad = (t) => { const m = t.match(BAD); return m ? `„…${t.slice(Math.max(0, m.index - 40), m.index + 20)}…“` : ''; };
{
  // Befund Easy: protokoll.txt, Modus „Person A“, Prüfen, Frage 1
  const { page, ctx } = await openUI(path.join(FS, 'protokoll.txt'), 'person');
  const states = [];
  states.push(['Frage offen (Frage 1)', await cardText(page)]);
  await page.click('#q-yes');
  await page.keyboard.press('ArrowLeft');
  states.push(['Frage beantwortet (zurück zur Frage 1)', await cardText(page)]);
  for (let i = 0; i < 60 && await page.$('#q-no'); i++) await page.click('#q-no');
  states.push(['Alle Fragen beantwortet', await cardText(page)]);
  // Einstellung ändern -> Hinweis „Du hast eine Einstellung geändert …“
  await page.click('#scr-a2 [data-back]');
  if (await page.isHidden('#opt-unsureOn')) await page.click('#tgl-adv');
  await page.click('#opt-unsureOn');
  await goTo(page, 'a2');
  const withNote = await cardText(page);
  states.push(['mit Einstellungs-Hinweis (Frage offen)', withNote]);
  for (let i = 0; i < 60 && await page.$('#q-no'); i++) await page.click('#q-no');
  states.push(['mit Einstellungs-Hinweis (alle beantwortet)', await cardText(page)]);
  await ctx.close();
  const pg2 = await openUI(path.join(here, 'fixtures-traeger', 'nurweb.txt'), 'person');
  states.push(['Keine Fragen', await cardText(pg2.page)]);
  await pg2.ctx.close();
  for (const [name, t] of states) check('z', `#qcard „${name}“: kein „null“/„undefined“`, !BAD.test(t), bad(t) || t.slice(0, 70));
  check('z', 'Einstellungs-Hinweis wurde tatsächlich gezeigt', /Du hast eine Einstellung geändert/.test(withNote));
}
for (const f of [path.join(FS, 'protokoll.txt'), path.join(FS, 'tabellen-stark.csv'), path.join(FX, 'kurse.docx'), path.join(FXA, 'mehrblatt.xlsx'), path.join(FX, 'protokoll.pdf')]) {
  const pg = await newPage();
  await startAnon(pg.page, 'person');
  await loadIn(pg.page, f);
  const t1 = await screenText(pg.page, 'a1');
  await goTo(pg.page, 'a2');
  const t2 = await screenText(pg.page, 'a2');
  await goTo(pg.page, 'a3');
  const t3 = await screenText(pg.page, 'a3');
  await pg.ctx.close();
  const b = [['Datei', t1], ['Prüfen', t2], ['Speichern', t3]].map(([n, t]) => (BAD.test(t) ? `${n}: ${bad(t)}` : '')).filter(Boolean);
  check('z', `${path.basename(f)}: Datei, Prüfen, Speichern ohne „null“/„undefined“`, !b.length, b.join(' | '));
}
}
// ---------- Zusammenfassung ----------
log('');
check('n', 'Netzwerkanfragen nach außen: 0', requests.length === 0, requests.join(', '));
check('n', 'Keine JS-Fehler', errors.length === 0, [...new Set(errors)].join(' | '));
log('');
log('## Soll / gemessen');
log('| Teil | Soll | gemessen |');
log('|---|---|---|');
const SOLL = { a: 'Farben, Rahmen, Schriftstärke je Zustand und im Satz-Ausschnitt', b: 'kräftig markiert = Stellen der gezeigten Frage, für jede Frage jeder Datei; 0 bei Dateiangaben und ohne Frage',
  c: 'erste Stelle nach jedem Fragenwechsel sichtbar, Excel-Reiter, kein Rollen bei Klick, Fokus bleibt', d: 'Zähler lückenlos, ← k−1, Knöpfe, Pfeiltasten, keine Wirkung in Eingabefeldern',
  e: 'Weg-Gleichheit je Fragen-Art und Richtung + Fallen, drei Modi und Schlüsseldatei', s: 'Einstellung nach Antworten: wie frisch, Fragen offen, Hinweis', l: 'Liste: entfernt → Nein, hinzugefügt → unverändert',
  f: 'Rückbau nach geänderten Antworten exakt (docx, xlsx, txt)', z: 'kein „null“/„undefined“ in Fragekarte und Bildschirmen', n: '0 Anfragen nach außen, keine JS-Fehler' };
for (const [k, v] of Object.entries(SOLL)) if (tally[k]) log(`| ${k}) ${v} | alle | ${tally[k].ok} von ${tally[k].n} bestanden |`);
const nQ = tableB.reduce((s, r) => s + r[1], 0);
log('');
log(`Geprüfte Fragen (b): ${nQ} in ${tableB.length} Dateien. Weg-Gleichheit (e): ${tableE.length} Fälle × 3 Modi. Rückbau (f): ${tableF.length} Dateien.`);
const failed = results.filter((r) => !r[2]);
log('');
log(`**Ergebnis: ${results.length - failed.length} von ${results.length} Prüfungen bestanden.** Nur Chromium; Firefox prüft Easy.`);
fs.writeFileSync(path.join(here, 'ANZEIGE-REPORT.md'), report.join('\n') + '\n');
await browser.close();
process.exit(failed.length ? 1 : 0);
