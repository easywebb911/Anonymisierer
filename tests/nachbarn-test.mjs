// Version 2.8.1 („Einrichtungen: Leck und Lücken schließen“): Ziel-Test „nachbarn“ (txt, csv, xlsx; alle Namen erfunden).
// Soll in allen drei Modi:
//   a) ohne Antwort ist jede Person und jede Einrichtung ersetzt,
//   b) nach „Nein“ auf alle Einrichtungs-Fragen ist jede Person ersetzt,
//   c) mit „Unsichere Treffer standardmäßig ersetzen“ aus ist alles ersetzt, was 2.7.0 mit „Unsichere“ aus ersetzt
//      (Ausnahme, einzeln gelistet: ein Kopfwort, das 2.7.0 als Teil eines Personennamens ersetzt hat – Teil 4).
// Dazu die Bedienwege über die Oberfläche (Teil 1: Einstellung und Schalter, Teil 2: Liste aus und von Hand markiert,
// auch „Als Name markieren“), echte Namen mit Zusatz, Rückbau exakt (auch mit Schlüsseldatei aus 2.8.0), 0 Anfragen.
// Aufruf: node tests/nachbarn-test.mjs <index.html 2.7.0> [<index.html 2.8.0>]   (Ergebnis: tests/NACHBARN-REPORT.md)
// Gegenprobe: NACHBARN_HTML=<index.html> prüft eine andere Version (2.8.0 muss scheitern).
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import JSZip from 'jszip';
import { makeAll, FXT, NACHBARN_PERSONS, NACHBARN_ORGS } from './make-traeger.mjs';
import { startAnon, loadIn, goTo, exportWithAck, saveKey, rbConfirm, ackPoints } from './ui-helpers.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const HTML = process.env.NACHBARN_HTML ? path.resolve(process.env.NACHBARN_HTML) : path.join(root, 'index.html');
const OLD = process.argv[2] ? path.resolve(process.argv[2]) : null; // 2.7.0
const PREV = process.argv[3] ? path.resolve(process.argv[3]) : null; // 2.8.0 (Vergleichszahlen, Schlüsseldatei)
if (!OLD) { console.error('Aufruf: node tests/nachbarn-test.mjs <index.html 2.7.0> [<index.html 2.8.0>]'); process.exit(2); }
const outDir = path.join(here, 'out', 'nachbarn');
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });
let pwMod;
try { pwMod = createRequire(import.meta.url)('playwright'); } catch { pwMod = createRequire('/opt/node22/lib/node_modules/')('playwright'); }
await makeAll();

const report = [];
const log = (s = '') => { report.push(s); console.log(s); };
const results = [];
function check(name, ok, detail = '') { results.push([name, ok]); log(`- ${ok ? 'OK' : 'FEHLER'}: ${name}${detail ? ' – ' + detail : ''}`); }
const requests = [];
const errors = [];
const browser = await pwMod.chromium.launch();
let seq = 0;
async function newPage(html = HTML) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true });
  const page = await ctx.newPage();
  page.on('request', (r) => { if (!/^(file|blob|data):/.test(r.url())) requests.push(r.url()); });
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('dialog', (d) => d.accept());
  await page.goto('file://' + html);
  return { page, ctx };
}
const FORMATS = ['txt', 'csv', 'xlsx'];
const MODES = ['person', 'name', 'reversible'];
const fx = (ext) => path.join(FXT, 'nachbarn.' + ext);
// Kopfwörter der Einrichtungs-Suche (für die Ausnahme in c); wie orgauto.js
const HEAD_RE = /^(?:Gymnasium|Schule|\p{Lu}\p{Ll}+schule|Universität|Kita|Kindergarten|Krippe|Hort|Kinderhaus|Familienzentrum|Jugendzentrum|Verein|Stiftung|Praxis|Klinik|Krankenhaus|Kanzlei|Firma|Institut|Akademie)$/u; // Version 2.8.1 (Entscheidung Easy C): Kopfwort nur in der Grundform, ganzes Wort (wie detect.js, Teil 4)

// ---------- Messung über die Erkennung (Ablauf wie ein Mensch, Stand über window.__anon gelesen) ----------
// how: 'keine' | 'nein' (alle Einrichtungs-Fragen „Nein“) | 'aus' („Unsichere“ aus) | 'ausnein' (aus, dann alle „Nein“)
async function covered(html, file, how, mode) {
  const { page, ctx } = await newPage(html);
  try {
    return await page.evaluate(async ([arr, nm, how, mode]) => {
      const A = window.__anon;
      A.app.state.settings.mode = mode;
      if (how.startsWith('aus')) A.app.state.settings.unsureOn = false;
      await A.openBytes(new Uint8Array(arr), nm);
      // Antwortfolgen auf alle Einrichtungs-Fragen (Weg-Gleichheit): 'nein', 'ja', 'janein', 'neinjanein', 'janeinja'
      const seqs = { nein: [false], ausnein: [false], ja: [true], janein: [true, false], neinjanein: [false, true, false], janeinja: [true, false, true] };
      const ids = A.questions().filter((q) => q.kind === 'org').map((q) => q.id);
      for (const v of seqs[how] || []) for (const id of ids) { const q = A.questions().find((x) => x.id === id); if (q) A.answer(q, v); }
      // Version 2.8.1 (Entscheidung D): jede gefundene Einrichtung in der Liste ausschalten (wie ein Mensch, ggf. nochmals)
      if (how === 'liste') {
        for (let round = 0; round < 3; round++) for (const o of [...A.app.result.orgs.values()].filter((x) => x.hits.some((h) => h.auto && h.on))) {
          const i = [...document.querySelectorAll('input[aria-label]')].find((x) => x.getAttribute('aria-label') === o.display + ' an/aus');
          if (i && i.checked) i.click();
        }
      }
      const r = A.app.result;
      return { text: r.fullText, spans: r.hits.filter((h) => h.on).map((h) => [h.s, h.e]) };
    }, [[...fs.readFileSync(file)], path.basename(file), how, mode]);
  } finally { await ctx.close(); }
}
function coverArr(res) {
  const cov = new Uint8Array(res.text.length + 1);
  for (const [s, e] of res.spans) for (let i = s; i < e; i++) cov[i] = 1;
  return cov;
}
// Vorkommen (ganze Wörter), die nicht vollständig ersetzt sind
function openWords(res, words) {
  const cov = coverArr(res);
  const miss = [];
  for (const w of words) {
    const re = new RegExp('(?<![\\p{L}\\p{N}])' + w + '(?![\\p{L}\\p{N}])', 'gu');
    for (const m of res.text.matchAll(re)) {
      for (let i = m.index; i < m.index + w.length; i++) if (!cov[i]) { miss.push(w); break; }
    }
  }
  return miss;
}
// Stellen der Vorversion, die hier nicht ersetzt sind; getrennt: Ausnahme „nur Kopfwort (Teil 4)“
function missingVs(ref, res) {
  const cov = coverArr(res);
  const miss = [];
  const ausnahmen = [];
  for (const [s, e] of ref.spans) {
    const toks = [...ref.text.slice(s, e).matchAll(/[\p{L}\p{N}][\p{L}\p{N}'’.-]*/gu)].map((m) => ({ s: s + m.index, t: m[0] }));
    const open = toks.filter((t) => [...t.t].some((_, i) => !cov[t.s + i]));
    if (!open.length) continue;
    // Version 2.8.1 (Entscheidung Easy nach Lauf 3): Ausnahme nur, wenn jedes Zeichen eines Namens ersetzt ist – offen
    // darf nur der Zusatz („vom“, „von der“) sein, kein Namens-Wort und kein Kopfwort
    if (open.every((t) => /^(von|vom|der|dem|den)$/i.test(t.t))) ausnahmen.push(ref.text.slice(s, e) + ' → offen: ' + open.map((t) => t.t).join(' '));
    else miss.push(ref.text.slice(s, e));
  }
  return { miss, ausnahmen };
}

log('# Ziel-Test „nachbarn“ (Version 2.8.1): Person neben Einrichtung');
log('');
log(`Geprüft: ${path.basename(path.dirname(HTML))}/${path.basename(HTML)}; Vorversion 2.7.0: ${path.basename(OLD)}${PREV ? '; Vergleich 2.8.0: ' + path.basename(PREV) : ''}. Nur Chromium, Firefox prüft Easy.`);
log('');
log('Soll-Wörter (müssen ersetzt sein): Personen ' + NACHBARN_PERSONS.join(', ') + '; Einrichtungen ' + NACHBARN_ORGS.join(', ') + '.');
log('Nicht im Soll: „Koch“ in „Bitte wenden Sie sich an Koch.“ – mehrdeutiges Wort nach Präposition, in 2.7.0, 2.8.0 und 2.8.1 gleich „unsicher, aus“ und gefragt (Wortliste „mehrdeutig“, nicht Teil dieses Auftrags).');
log('');
log('## 1. Soll / gemessen (offene Stellen; Soll = 0)');
log('');
log('| Format | Modus | a) ohne Antwort | b) nach „Nein“ | c) „Unsichere“ aus | c2) „Unsichere“ aus, dann „Nein“ |' + (PREV ? ' 2.8.0: a / b / c |' : ''));
log('|---|---|---|---|---|---|' + (PREV ? '---|' : ''));
const AUSNAHMEN = new Set();
for (const ext of FORMATS) {
  for (const mode of MODES) {
    const f = fx(ext);
    const a = await covered(HTML, f, 'keine', mode);
    const b = await covered(HTML, f, 'nein', mode);
    const c = await covered(HTML, f, 'aus', mode);
    const c2 = await covered(HTML, f, 'ausnein', mode);
    const o = await covered(OLD, f, 'aus', mode);
    const ma = openWords(a, [...NACHBARN_PERSONS, ...NACHBARN_ORGS]);
    const mb = openWords(b, NACHBARN_PERSONS);
    const mc = missingVs(o, c);
    const mc2 = missingVs(o, c2);
    for (const x of [...mc.ausnahmen, ...mc2.ausnahmen]) AUSNAHMEN.add(`${ext}: ${x}`);
    // Version 2.8.1 (Entscheidung D): weitere Abläufe; Soll: kein Name im Klartext, den 2.7.0 oder 2.8.0 ersetzt
    // Vergleich je Ablauf mit demselben Ablauf in 2.7.0 (dort gibt es keine Einrichtungs-Fragen: wie ohne Antwort) und 2.8.0
    const o0 = await covered(OLD, f, 'keine', mode);
    for (const [how, oref] of [['nein', o0], ['janein', o0], ['neinjanein', o0], ['liste', o0], ['aus', o], ['ausnein', o]]) {
      const refs = [oref, PREV ? await covered(PREV, f, how, mode) : null];
      const res = await covered(HTML, f, how, mode);
      const m = [];
      for (const r of refs.filter(Boolean)) { const x = missingVs(r, res); m.push(...x.miss); for (const y of x.ausnahmen) AUSNAHMEN.add(`${ext}, ${how}: ${y}`); }
      check(`${ext}, ${mode}, ${how}: kein Name im Klartext, den 2.7.0 oder 2.8.0 ersetzt`, m.length === 0, [...new Set(m)].join(', '));
    }
    // Weg-Gleichheit: „Ja“ → „Nein“ = direkt „Nein“; „Nein“ → „Ja“ → „Nein“ = direkt „Nein“; „Ja“ → „Nein“ → „Ja“ = direkt „Ja“
    const sig = (r) => JSON.stringify(r.spans.map((x) => x.join(':')).sort());
    const dJa = await covered(HTML, f, 'ja', mode);
    check(`${ext}, ${mode}: Weg-Gleichheit „Ja“ → „Nein“ = „Nein“`, sig(await covered(HTML, f, 'janein', mode)) === sig(b));
    check(`${ext}, ${mode}: Weg-Gleichheit „Nein“ → „Ja“ → „Nein“ = „Nein“`, sig(await covered(HTML, f, 'neinjanein', mode)) === sig(b));
    check(`${ext}, ${mode}: Weg-Gleichheit „Ja“ → „Nein“ → „Ja“ = „Ja“`, sig(await covered(HTML, f, 'janeinja', mode)) === sig(dJa));
    let prev = '';
    if (PREV) {
      const pa = openWords(await covered(PREV, f, 'keine', mode), [...NACHBARN_PERSONS, ...NACHBARN_ORGS]);
      const pb = openWords(await covered(PREV, f, 'nein', mode), NACHBARN_PERSONS);
      const pc = missingVs(o, await covered(PREV, f, 'aus', mode));
      prev = ` ${pa.length} / ${pb.length} / ${pc.miss.length} |`;
    }
    const cell = (m) => (m.length ? `**${m.length}** (${[...new Set(m)].slice(0, 4).join(', ')})` : '0');
    log(`| ${ext} | ${mode} | ${cell(ma)} | ${cell(mb)} | ${cell(mc.miss)} | ${cell(mc2.miss)} |${prev}`);
    check(`${ext}, ${mode}: a) ohne Antwort jede Person und Einrichtung ersetzt`, ma.length === 0, ma.join(', '));
    check(`${ext}, ${mode}: b) nach „Nein“ auf alle Einrichtungs-Fragen jede Person ersetzt`, mb.length === 0, mb.join(', '));
    check(`${ext}, ${mode}: c) „Unsichere“ aus: alles ersetzt, was 2.7.0 so ersetzt`, mc.miss.length === 0, mc.miss.join(', '));
    check(`${ext}, ${mode}: c2) „Unsichere“ aus, dann alle „Nein“: alles ersetzt, was 2.7.0 so ersetzt`, mc2.miss.length === 0, mc2.miss.join(', '));
  }
}
log('');
log('Ausnahmen (einzeln; erlaubt nur, wenn offen allein der Zusatz „vom / von der“ ist – jedes Namens-Zeichen ist ersetzt):');
if (!AUSNAHMEN.size) log('- keine');
for (const x of AUSNAHMEN) log('- ' + x);
log('');

// ---------- 2. Bedienwege über die Oberfläche ----------
log('## 2. Bedienwege über die Oberfläche (TXT, Modus „Person A“)');
async function openUI(file, { unsureOff = false } = {}) {
  const { page, ctx } = await newPage();
  await startAnon(page, 'person');
  if (unsureOff) {
    if (await page.isHidden('#opt-unsureOn')) { if (await page.$('#tgl-adv')) await page.click('#tgl-adv'); }
    if (await page.isVisible('#opt-unsureOn')) await page.uncheck('#opt-unsureOn');
    else await page.evaluate(() => { const c = document.querySelector('#opt-unsureOn'); c.checked = false; c.dispatchEvent(new Event('change')); });
  }
  await loadIn(page, file);
  await goTo(page, 'a2');
  return { page, ctx };
}
const outText = (page) => page.evaluate(async () => (await window.__anon.buildOutput('txt')).text);
async function listSwitch(page, display, on) {
  if (await page.isHidden('#entities')) await page.click('#tgl-entities');
  const box = await page.evaluateHandle((d) => [...document.querySelectorAll('input[aria-label]')].find((i) => i.getAttribute('aria-label') === d + ' an/aus') || null, display);
  const el = box.asElement();
  if (!el) return false;
  if ((await el.isChecked()) !== on) await el.click();
  return true;
}
async function selectAndMark(page, text, btn) {
  const ok = await page.evaluate((t) => {
    for (const tx of document.querySelectorAll('#docview .utext')) {
      const i = tx.textContent.indexOf(t);
      if (i < 0) continue;
      let n = 0; let sN; let sO; let eN; let eO;
      const w = document.createTreeWalker(tx, NodeFilter.SHOW_TEXT);
      let node;
      while ((node = w.nextNode())) {
        const L = node.nodeValue.length;
        if (sN === undefined && i < n + L) { sN = node; sO = i - n; }
        if (i + t.length <= n + L) { eN = node; eO = i + t.length - n; break; }
        n += L;
      }
      tx.scrollIntoView({ block: 'center' });
      const r = document.createRange();
      r.setStart(sN, sO); r.setEnd(eN, eO);
      const sel = window.getSelection();
      sel.removeAllRanges(); sel.addRange(r);
      tx.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
      return true;
    }
    return false;
  }, text);
  if (!ok) throw new Error('Text nicht gefunden: ' + text);
  await page.waitForSelector('#markbar:not([hidden])');
  await page.click(btn);
  await page.waitForFunction(() => document.querySelector('#markbar').hidden);
}
const wordIn = (t, w) => new RegExp('(?<![\\p{L}\\p{N}])' + w + '(?![\\p{L}\\p{N}])', 'u').test(t);
{
  // Teil 1, Weg „Einstellung“: Unsichere aus, ohne Antwort
  const { page, ctx } = await openUI(fx('txt'), { unsureOff: true });
  const t = await outText(page);
  const left = ['Quarbeck', 'Broszat', 'Tewesmeier'].filter((w) => wordIn(t, w));
  check('Teil 1: „Unsichere“ aus – „Der Verein Quarbeck“, „Die Kanzlei Broszat“, „Das Institut Tewesmeier“: Name ersetzt', left.length === 0, left.join(', ') || t.split('\n').filter((l) => /Verein|Kanzlei|Institut/.test(l)).join(' | '));
  // Teil 1, Weg „Schalter“: Koch in der Liste einschalten
  const sw = await listSwitch(page, 'Koch', true);
  const t2 = await outText(page);
  check('Teil 1: „Unsichere“ aus, Schalter „Koch“ an – „Die Praxis Koch“: Name ersetzt', sw && !wordIn(t2, 'Koch'), t2.split('\n').filter((l) => /Koch|Praxis/.test(l)).join(' | '));
  await ctx.close();
}
{
  // Teil 2: gefundene Einrichtung in der Liste aus, dann im Text von Hand als Einrichtung markiert
  for (const [disp, word] of [['Kita Sonnenblume', 'Sonnenblume'], ['Familienzentrum Wiesenkamp', 'Wiesenkamp'], ['Musikschule Lindgrün', 'Lindgrün']]) {
    const { page, ctx } = await openUI(fx('txt'));
    const sw = await listSwitch(page, disp, false);
    const tOff = await outText(page);
    await selectAndMark(page, disp, '#btn-mark-org');
    const t = await outText(page);
    const st = await page.evaluate((d) => { const hs = window.__anon.app.result.hits.filter((h) => h.type === 'org' && window.__anon.app.result.fullText.slice(h.s, h.e) === d); return { n: hs.length, on: hs.every((h) => h.on), cert: [...new Set(hs.map((h) => h.cert))].join('/') }; }, disp);
    check(`Teil 2: „${disp}“ in der Liste aus, dann von Hand markiert – ersetzt und sicher`, sw && wordIn(tOff, word) && !wordIn(t, word) && st.n > 0 && st.on && st.cert === 'sicher', `aus: ${wordIn(tOff, word) ? 'Klartext' : 'ersetzt'}; danach ${st.n} Stellen, an: ${st.on}, ${st.cert}`);
    await ctx.close();
  }
  // Teil 2 mit „Als Name markieren“: Person in der Liste aus, dann von Hand als Name markiert
  const { page, ctx } = await openUI(fx('txt'));
  const sw = await listSwitch(page, 'Jana Wolters', false);
  const tOff = await outText(page);
  await selectAndMark(page, 'Jana Wolters', '#btn-mark');
  const t = await outText(page);
  check('Teil 2: „Jana Wolters“ in der Liste aus, dann „Als Name markieren“ – ersetzt', sw && wordIn(tOff, 'Wolters') && !wordIn(t, 'Wolters'), `aus: ${wordIn(tOff, 'Wolters') ? 'Klartext' : 'ersetzt'}; danach ${wordIn(t, 'Wolters') ? 'Klartext' : 'ersetzt'}`);
  // Echte Namen mit Zusatz bleiben ganze Namen
  const spans = await page.evaluate(() => { const r = window.__anon.app.result; return r.hits.filter((h) => h.type === 'person').map((h) => r.fullText.slice(h.s, h.e)); });
  check('Teil 4: echte Namen mit Zusatz bleiben ganz („von Brandner“, „van der Lindenau“, „von Horten“, „Anja von Horten“, „von Schulenburg“)', ['von Brandner', 'van der Lindenau', 'von Horten', 'Anja von Horten', 'von Schulenburg'].every((x) => spans.includes(x)), spans.filter((x) => /Brandner|Lindenau|Horten|Schulenburg/.test(x)).join(', '));
  check('Teil 4: Person endet vor „vom / von der“ + Kopfwort', ['Okonkwo', 'Lehmann', 'Schuster', 'Demir', 'Kowalski', 'Albers', 'Brennecke', 'Ida', 'Paul Lenz'].every((n) => spans.includes(n))
    // „Gymnasium Becker“ / „Kanzlei Wagner“: „Becker“/„Wagner“ sind allein schon sichere Personen -> keine Einrichtung
    // (Person geht vor, Teil 3); dann bleibt es wie 2.7.0 ein Name „Jonas vom Gymnasium Becker“ (ganz ersetzt)
    && !spans.some((x) => /\bvo[nm]\b/.test(x) && !/Brandner|Horten|Schulenburg|Becker|Wagner/.test(x)), spans.filter((x) => /Okonkwo|Schuster|Demir|Kowalski|Albers|Lehmann/.test(x)).join(', '));
  // Oberfläche: kein „null“/„undefined“
  await goTo(page, 'a3');
  await ackPoints(page);
  const body = await page.evaluate(() => document.body.innerText);
  check('Oberfläche: kein Text „null“ oder „undefined“', !/\bnull\b|\bundefined\b/.test(body));
  await ctx.close();
}
{
  // Guardian-Fund 2: selbst erkannte Person in der Liste aus, dann „Als Name markieren“ – ersetzt (auch mit „Unsichere“ aus)
  for (const unsureOff of [false, true]) {
    const { page, ctx } = await openUI(fx('txt'), { unsureOff });
    const sw = await listSwitch(page, 'Melanie Grawert', false);
    const tOff = await outText(page);
    await selectAndMark(page, 'Melanie Grawert', '#btn-mark');
    const t = await outText(page);
    check(`Fund 2: „Melanie Grawert“ (selbst erkannt) in der Liste aus, dann „Als Name markieren“ – ersetzt${unsureOff ? ' („Unsichere“ aus)' : ''}`, sw && wordIn(tOff, 'Grawert') && !wordIn(t, 'Grawert'), `aus: ${wordIn(tOff, 'Grawert') ? 'Klartext' : 'ersetzt'}; danach ${wordIn(t, 'Grawert') ? 'Klartext' : 'ersetzt'}`);
    await ctx.close();
  }
  // Guardian-Lauf 2, Fund 3: nur einen Teil des ausgeschalteten Namens markieren („Grawert“) – ersetzt
  for (const unsureOff of [false, true]) {
    const { page, ctx } = await openUI(fx('txt'), { unsureOff });
    await listSwitch(page, 'Melanie Grawert', false);
    await selectAndMark(page, 'Grawert', '#btn-mark');
    const t = await outText(page);
    check(`Lauf 2, Fund 3: „Melanie Grawert“ aus, dann nur „Grawert“ als Name markiert – „Grawert“ ersetzt${unsureOff ? ' („Unsichere“ aus)' : ''}`, !wordIn(t, 'Grawert'), t.split('\n').find((l) => /kommt morgen\.$/.test(l) && !/Horten/.test(l)) || '');
    await ctx.close();
  }
  // Guardian-Lauf 2, Fund 1 und 2: „Nein“ (bzw. Liste aus) bei „Praxis Lindqvist“ – die Person an derselben Stelle ist
  // nicht aus; mit „Unsichere“ aus und danach „Lindqvist“ als Name markiert: ersetzt
  for (const how of ['nein', 'liste']) {
    for (const unsureOff of [false, true]) {
      const { page, ctx } = await openUI(fx('txt'), { unsureOff });
      if (how === 'nein') await page.evaluate(() => { const A = window.__anon; const q = A.questions().find((x) => x.kind === 'org' && x.word === 'Praxis Lindqvist'); if (q) A.answer(q, false); });
      else await listSwitch(page, 'Praxis Lindqvist', false);
      const t1 = await outText(page);
      if (unsureOff) await selectAndMark(page, 'Lindqvist', '#btn-mark');
      const t = await outText(page);
      const line = t.split('\n').find((l) => /ist am Montag zu/.test(l)) || '';
      const ok = unsureOff ? !wordIn(t, 'Lindqvist') : !wordIn(t1, 'Lindqvist');
      check(`Lauf 2, Fund ${unsureOff ? 2 : 1}: „Praxis Lindqvist“ ${how === 'nein' ? '„Nein“' : 'in der Liste aus'}${unsureOff ? ', „Unsichere“ aus, dann „Lindqvist“ als Name markiert' : ''} – Name ersetzt`, ok, line);
      await ctx.close();
    }
  }
  // Guardian-Lauf 3, Fund 2 (Weg-Gleichheit bei Fragen zu den Dateiangaben): Autor „Marta Kowalski“ (kurse.docx, Name
  // steht auch im Text). Person in der Liste aus, dann die Dateiangaben-Frage „Ja“ → „Nein“ = direkt „Nein“;
  // „Ja“ → „Nein“ → „Ja“ = direkt „Ja“
  {
    const z = await JSZip.loadAsync(fs.readFileSync(path.join(here, 'fixtures', 'kurse.docx')));
    z.file('docProps/core.xml', (await z.file('docProps/core.xml').async('string')).replace('<dc:creator>Gisela Musterfrau</dc:creator>', '<dc:creator>Marta Kowalski</dc:creator>'));
    const mf = path.join(outDir, 'kurse-autor.docx');
    fs.writeFileSync(mf, await z.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }));
    const state = async (seq) => {
      const { page, ctx } = await newPage();
      await startAnon(page, 'person');
      await loadIn(page, mf);
      await goTo(page, 'a2');
      await listSwitch(page, 'Marta Kowalski', false);
      const r = await page.evaluate((seq) => {
        const A = window.__anon;
        const mq = () => A.questions().find((q) => q.kind === 'meta' && /Marta Kowalski/.test(q.name || ''));
        if (!mq()) return null;
        for (const v of seq) A.answer(mq(), v);
        const res = A.app.result;
        return JSON.stringify(res.hits.filter((h) => h.on).map((h) => h.s + ':' + h.e).sort());
      }, seq);
      await ctx.close();
      return r;
    };
    const nein = await state([false]);
    const ja = await state([true]);
    check('Lauf 3, Fund 2: Dateiangaben-Frage „Ja“ → „Nein“ = direkt „Nein“ (Person vorher in der Liste aus)', !!nein && (await state([true, false])) === nein);
    check('Lauf 3, Fund 2: Dateiangaben-Frage „Nein“ → „Ja“ → „Nein“ = direkt „Nein“', !!nein && (await state([false, true, false])) === nein);
    check('Lauf 3, Fund 2: Dateiangaben-Frage „Ja“ → „Nein“ → „Ja“ = direkt „Ja“', !!ja && (await state([true, false, true])) === ja);
  }
  // Guardian-Fund 4: Wo eine Einrichtung endet, richtet sich nur nach der Erkennung: Person aus -> Einrichtung bleibt
  // „Kita Sonnenblume“ (wird nicht länger); danach „Als Name markieren“ ersetzt die Person als Person
  for (const unsureOff of [false, true]) {
    const { page, ctx } = await openUI(fx('txt'), { unsureOff });
    const spanOf = () => page.evaluate(() => { const r = window.__anon.app.result; return r.hits.filter((h) => h.type === 'org' && r.fullText.slice(h.s).startsWith('Kita Sonnenblume Jana')).map((h) => r.fullText.slice(h.s, h.e)); });
    const before = await spanOf();
    await listSwitch(page, 'Jana Wolters', false);
    const after = await spanOf();
    await selectAndMark(page, 'Jana Wolters', '#btn-mark');
    const line = (await outText(page)).split('\n').find((l) => /^Einrichtung \S+ /.test(l) || /Wolters/.test(l)) || '';
    const pers = await page.evaluate(() => { const r = window.__anon.app.result; return r.hits.filter((h) => h.type === 'person' && h.on && r.fullText.slice(h.s, h.e) === 'Jana Wolters').length; });
    check(`Fund 4: Person „Jana Wolters“ aus – Einrichtung bleibt „Kita Sonnenblume“; danach als Name markiert: Person ersetzt${unsureOff ? ' („Unsichere“ aus)' : ''}`, JSON.stringify(before) === JSON.stringify(after) && after.every((x) => x === 'Kita Sonnenblume') && pers > 0, `vorher ${before.join(', ')}; nach Ausschalten ${after.join(', ')}; Person an: ${pers}; ${line}`);
    await ctx.close();
  }
}
log('');

// ---------- 3. Rückbau exakt (Modus rückbaufähig) ----------
log('## 3. Rückbau exakt (Modus rückbaufähig)');
const unxml = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
async function content(bytes, kind) {
  if (kind === 'txt' || kind === 'csv') return bytes.toString('utf8').replace(/^﻿/, '');
  const z = await JSZip.loadAsync(bytes);
  const out = [];
  for (const n of Object.keys(z.files).sort()) {
    if (!/\.xml$/.test(n) || /^docProps\//.test(n)) continue;
    const x = await z.file(n).async('string');
    const parts = [...x.matchAll(/<(?:w:t|t)(?:\s[^>]*)?>([^<]*)<\//g)].map((m) => unxml(m[1]));
    if (parts.length) out.push(n + ': ' + parts.join(' ¦ '));
  }
  return out.join('\n');
}
async function anonymize(ext, html = HTML) {
  const { page, ctx } = await newPage(html);
  await startAnon(page, 'reversible');
  await loadIn(page, fx(ext));
  await goTo(page, 'a3');
  await ackPoints(page);
  const kd = await saveKey(page);
  const keyPath = path.join(outDir, `a${++seq}-${kd.suggestedFilename()}`);
  await kd.saveAs(keyPath);
  const r = await exportWithAck(page, ext);
  const outPath = path.join(outDir, `a${seq}-${r.dl.suggestedFilename()}`);
  await r.dl.saveAs(outPath);
  await ctx.close();
  return { outPath, keyPath };
}
async function restore(file, key) {
  const { page, ctx } = await newPage();
  await page.click('#go-restore');
  await page.setInputFiles('#rb-file', file);
  await page.waitForFunction(() => document.querySelector('#rb-file-status').textContent);
  await page.setInputFiles('#rb-key', key);
  await page.waitForFunction(() => document.querySelector('#rb-key-status').textContent);
  await page.click('#rb-btn-check');
  const verdict = await page.evaluate(() => window.__anon.rb.plan.verdict);
  await rbConfirm(page, true);
  let bytes = null;
  if (!(await page.$eval('#r2-next', (b) => b.disabled))) {
    await page.click('#r2-next');
    if (await page.$('#rb-left-ack')) await page.check('#rb-left-ack').catch(() => {});
    const dlP = page.waitForEvent('download', { timeout: 60000 }).catch(() => null);
    await page.click('#rb-btn-save');
    const dl = await dlP;
    if (dl) { const p = path.join(outDir, `r${++seq}-${dl.suggestedFilename()}`); await dl.saveAs(p); bytes = fs.readFileSync(p); }
  }
  await ctx.close();
  return { bytes, verdict };
}
for (const ext of FORMATS) {
  const orig = await content(fs.readFileSync(fx(ext)), ext);
  const a = await anonymize(ext);
  const anon = await content(fs.readFileSync(a.outPath), ext);
  const left = [...NACHBARN_PERSONS, ...NACHBARN_ORGS].filter((w) => wordIn(anon, w));
  check(`${ext}: Ausgabe ohne Soll-Wörter`, left.length === 0, left.join(', '));
  const r = await restore(a.outPath, a.keyPath);
  check(`${ext}: Rückbau exakt`, !!r.bytes && (await content(r.bytes, ext)) === orig, r.verdict);
  if (PREV) {
    const p = await anonymize(ext, PREV);
    const r2 = await restore(p.outPath, p.keyPath);
    check(`${ext}: Schlüsseldatei und Ausgabe aus 2.8.0, Rückbau mit dieser Version exakt`, !!r2.bytes && (await content(r2.bytes, ext)) === orig, r2.verdict);
  }
}
await browser.close();
log('');
check('0 Anfragen ins Netz', requests.length === 0, String(requests.length));
check('0 Fehler in der Seite', errors.length === 0, errors.slice(0, 3).join(' | '));
const bad = results.filter((r) => !r[1]).length;
log('');
log(`**Ergebnis: ${bad ? 'NICHT bestanden' : 'bestanden'}** (${results.length - bad}/${results.length}).`);
if (!process.env.NACHBARN_HTML) fs.writeFileSync(path.join(here, 'NACHBARN-REPORT.md'), report.join('\n') + '\n');
process.exit(bad ? 1 : 0);
