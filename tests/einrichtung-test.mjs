// Tests für Einrichtungen (Version 2.3) über die echte Oberfläche.
// Je Format (Word, Excel, TXT, CSV) und Fall einzeln: ersetzt ja/nein, Platzhalter, Rückbau exakt ja/nein; Ausgabe
// entpackt und alle Teile nach jedem Wortbestandteil der Testnamen durchsucht. Dazu: Vorrang, Art-Wechsel, Merkliste,
// Rückwärts-Prüfung (Version 2.2 mit Schlüssel aus 2.3), Firma aus den Dateiangaben (2.2 / 2.3), Doppellauf,
// Oberfläche (zwei Knöpfe, Gruppe „Einrichtungen“, Legende, Ampel, KI-Hinweis), Netzwerk.
// Ergebnis: tests/EINRICHTUNG-REPORT.md. Aufruf: node tests/einrichtung-test.mjs <index.html-der-Version-2.2>
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import JSZip from 'jszip';
import { startAnon, loadIn, goTo, ackAll, exportWithAck, saveKey, waitPreview } from './ui-helpers.mjs';
import { ORG, WORDS, LINES } from './make-einrichtung.mjs';

const { chromium } = createRequire('/opt/node22/lib/node_modules/')('playwright');
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const fx = path.join(here, 'fixtures');
const newHtml = path.join(root, 'index.html');
const oldHtml = process.argv[2] ? path.resolve(process.argv[2]) : null;
const outDir = path.join(here, 'out-einrichtung');
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
  const ctx = await browser.newContext({ acceptDownloads: true, viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  page.on('request', (r) => requests.push(r.url()));
  page.on('dialog', (d) => d.accept());
  await page.goto('file://' + html);
  return { page, ctx };
}
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');

// ---------- Bedienung wie ein Mensch ----------
// Text im Prüfen-Bildschirm auswählen (wie mit der Maus) und „Als Einrichtung markieren“ klicken
async function markOrg(page, text) {
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
      return true;
    }
    return false;
  }, text);
  if (!ok) throw new Error('Text nicht gefunden: ' + text);
  await page.waitForSelector('#markbar:not([hidden])');
  const both = await page.$$eval('#markbar button', (bs) => bs.map((b) => b.textContent));
  await page.click('#btn-mark-org');
  await page.waitForFunction(() => document.querySelector('#markbar').hidden);
  return both;
}
// Menü einer Zeile (Personen oder Einrichtungen) öffnen
async function openMenu(page, group, display) {
  const btn = await page.evaluateHandle(([g, d]) => [...document.querySelectorAll(g === 'org' ? '#orgs .entity' : '#entities > .entity')]
    .find((e) => e.querySelector('.ename strong').textContent === d).querySelector('.menubtn'), [group, display]);
  await btn.asElement().click();
}
async function answerAllYes(page) {
  const seen = [];
  for (let i = 0; i < 30; i++) {
    const q = await page.$('#q-yes');
    if (!q) break;
    seen.push(await page.$eval('#qcard .qask', (e) => e.textContent).catch(() => ''));
    await q.click();
  }
  return seen;
}
async function restoreUI(file, key, html = newHtml) {
  const { page, ctx } = await newPage(html);
  await page.click('#go-restore');
  await page.setInputFiles('#rb-file', file);
  await page.waitForFunction(() => document.querySelector('#rb-file-status').textContent);
  await page.setInputFiles('#rb-key', key);
  await page.waitForFunction(() => document.querySelector('#rb-key-status').textContent);
  const keyStatus = await page.textContent('#rb-key-status');
  await page.click('#rb-btn-check');
  const plan = await page.evaluate(() => { const p = window.__anon.rb.plan; return { verdict: p.verdict, rows: p.rows.map((r) => `${r.platzhalter}: ${r.gefunden}/${r.erwartet}`), issues: p.issues.length }; });
  if (await page.$('#rb-kennung-ack')) await page.check('#rb-kennung-ack');
  if (await page.$('#rb-confirm')) await page.check('#rb-confirm');
  let bytes = null;
  if (!(await page.$eval('#r2-next', (b) => b.disabled))) {
    await page.click('#r2-next');
    if (await page.$('#rb-left-ack')) await page.check('#rb-left-ack').catch(() => {});
    const dlP = page.waitForEvent('download', { timeout: 60000 }).catch(() => null);
    await page.click('#rb-btn-save');
    const dl = await dlP;
    if (dl) { const p = path.join(outDir, `w${++seq}-${dl.suggestedFilename()}`); await dl.saveAs(p); bytes = fs.readFileSync(p); }
  }
  await ctx.close();
  return { bytes, keyStatus, plan };
}

// ---------- Inhalte vergleichen ----------
const xmlText = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
// Abschnitte in fester Reihenfolge: Word = Absätze Haupttext, Kopfzeile, Alt-Texte; Excel = Blattname, Zellen, Alt-Texte
async function segments(bytes, fmt) {
  if (fmt === 'txt') return bytes.toString('utf8').replace(/^﻿/, '').split('\n');
  if (fmt === 'csv') return bytes.toString('utf8').replace(/^﻿/, '').split('\r\n');
  const z = await JSZip.loadAsync(bytes);
  const paras = (x) => [...x.matchAll(/<w:p[ >][\s\S]*?<\/w:p>/g)].map((m) => xmlText([...m[0].matchAll(/<w:t[^>]*>([^<]*)<\/w:t>|<w:br\/>/g)].map((t) => (t[0] === '<w:br/>' ? '\n' : t[1])).join('')));
  const descrs = (x) => [...x.matchAll(/<(?:wp:docPr|xdr:cNvPr)[^>]*descr="([^"]*)"/g)].map((m) => 'ALT: ' + xmlText(m[1]));
  if (fmt === 'docx') {
    const doc = await z.file('word/document.xml').async('string');
    const hdr = z.file('word/header1.xml') ? await z.file('word/header1.xml').async('string') : '';
    return [...paras(doc), ...paras(hdr).map((p) => 'KOPF: ' + p), ...descrs(doc)];
  }
  const wb = await z.file('xl/workbook.xml').async('string');
  const sh = await z.file('xl/worksheets/sheet1.xml').async('string');
  const dr = await z.file('xl/drawings/drawing1.xml').async('string');
  return [...[...wb.matchAll(/<sheet [^>]*name="([^"]*)"/g)].map((m) => 'BLATT: ' + xmlText(m[1])), ...[...sh.matchAll(/<t[^>]*>([^<]*)<\/t>/g)].map((m) => xmlText(m[1])), ...descrs(dr)];
}
async function wordHits(bytes, fmt) {
  const parts = [];
  if (fmt === 'txt' || fmt === 'csv') parts.push(['Text', bytes.toString('utf8')]);
  else {
    const z = await JSZip.loadAsync(bytes);
    for (const n of Object.keys(z.files).filter((x) => !z.files[x].dir).sort()) { const b = await z.file(n).async('nodebuffer'); parts.push([n, b.toString('utf8') + '\n' + b.toString('utf16le')]); }
  }
  const out = {};
  for (const w of WORDS) {
    let c = 0;
    const where = [];
    for (const [n, t] of parts) { const k = (t.match(new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')) || []).length; if (k) { c += k; where.push(n); } }
    out[w] = { c, where };
  }
  return out;
}

log('# Einrichtungen (Version 2.3): Tests');
log('');
log('Chromium headless, Start per file://, Bedienung über die echte Oberfläche. Testdokumente: tests/make-einrichtung.mjs (alle Namen erfunden).');
log(`Einrichtungen: „${ORG.haupt}“ (mit Abkürzung „${ORG.kurz}“), „${ORG.verein}“, „${ORG.schule}“. Personen: „Petra Hollmann“, „Astrid Lindgren“.`);
log('');

// ---------- Fälle je Format ----------
const CASES = [
  { id: 'Text, mehrteilig', seg: 'Bericht aus dem', surface: 'Familienzentrum Sonnenblume', want: /Bericht aus dem Einrichtung A(?![\w\d])/ },
  { id: 'Genitiv mit Endung im Inneren', seg: 'Die Leiterin des', surface: 'Familienzentrums Sonnenblume', want: /des Einrichtung A\d,/ },
  { id: 'Abkürzung (zusammengeführt)', seg: 'Das FZS', surface: 'FZS', want: /Das Einrichtung A\d plant/ },
  { id: 'zweite Einrichtung', seg: 'Fest', surface: 'Lindenauer Bürgerverein', want: /dem Einrichtung [B-D] ein Fest/ },
  { id: 'Genitiv mit Endung am Schluss', seg: 'Vorstand des', surface: 'Lindenauer Bürgerverein', want: /des Einrichtung [B-D]s stimmt/ },
  { id: 'GROSSSCHREIBUNG', seg: 'AUSHANG', surface: 'FAMILIENZENTRUM SONNENBLUME', want: /AUSHANG: Einrichtung A\d LÄDT/ },
  { id: 'Personenname in der Einrichtung (Vorrang)', seg: 'Astrid-Lindgren-Schule', surface: 'Astrid-Lindgren-Schule', want: /die Einrichtung [B-D] macht mit\. Frau Vorname [A-Z] Nachname [A-Z] liest/ },
  { id: 'Zeilenumbruch im Namen', seg: 'Treffpunkt', surface: 'Familienzentrum\nSonnenblume', want: /Treffpunkt im Einrichtung A\d?, Saal/ },
  { id: 'Kopfzeile', seg: 'KOPF:', surface: 'Familienzentrum Sonnenblume', want: /^KOPF: Einrichtung A · Jahresbericht$/, only: ['docx'] },
  { id: 'Bildbeschreibung', seg: 'ALT:', surface: 'Familienzentrums Sonnenblume', want: /^ALT: Logo des Einrichtung A\d$/, only: ['docx', 'xlsx'] },
  { id: 'Blattname', seg: 'BLATT:', surface: 'Familienzentrum Sonnenblume', want: /^BLATT: Einrichtung A$/, only: ['xlsx'] },
];
const FORMATS = [['einrichtung.docx', 'docx'], ['einrichtung.xlsx', 'xlsx'], ['einrichtung.txt', 'txt'], ['einrichtung.csv', 'csv']];
const keys = {};
const anonFiles = {};
log('## Ziel: als Einrichtung markiert → überall „Einrichtung X“, Rückbau exakt, nichts unbemerkt (rückbaufähig)');
for (const [file, fmt] of FORMATS) {
  log(`### ${file}`);
  const { page, ctx } = await newPage();
  await startAnon(page, 'reversible');
  await loadIn(page, path.join(fx, file));
  await goTo(page, 'a2');
  // Weg 1: aus den Dateiangaben (Word/Excel: Firma). Weg 2: von Hand markieren.
  const asked = await answerAllYes(page);
  const metaQ = asked.find((q) => /Dateiangaben/.test(q));
  if (fmt === 'docx' || fmt === 'xlsx') check('Frage zur Firma lautet „… Als Einrichtung übernehmen?“', !!metaQ && metaQ === `In den Dateiangaben steht „${ORG.haupt}“. Als Einrichtung übernehmen?`, metaQ);
  else await markOrg(page, ORG.haupt);
  const buttons = await markOrg(page, ORG.verein);
  if (fmt === 'docx') check('Beim Markieren erscheinen zwei Knöpfe: „Als Name markieren“ und „Als Einrichtung markieren“', buttons.includes('Als Name markieren') && buttons.includes('Als Einrichtung markieren'), buttons.join(' | '));
  await markOrg(page, ORG.schule);
  await markOrg(page, ORG.kurz);
  // Abkürzung mit der Haupt-Einrichtung zusammenführen (Menü hinter den drei Punkten)
  await openMenu(page, 'org', 'FZS');
  await page.selectOption('#orgs .emenu select', 'O|familienzentrum sonnenblume');
  await page.waitForFunction(() => document.querySelectorAll('#orgs .entity').length === 3);
  const groups = await page.evaluate(() => ({ orgsH: !!document.querySelector('#orgs-h'), orgs: [...document.querySelectorAll('#orgs .entity')].map((e) => e.querySelector('.ename').innerText.replace(/\s+/g, ' ') + ' ' + e.querySelector('.count').textContent),
    persons: [...document.querySelectorAll('#entities > .entity')].map((e) => e.querySelector('.ename strong').textContent) }));
  check('Gruppe „Einrichtungen“ mit eigenen Zeilen (Schalter, Name, Zahl, drei Punkte); Personen getrennt', groups.orgsH && groups.orgs.length === 3 && groups.persons.includes('Astrid Lindgren') && groups.persons.includes('Petra Hollmann') && !groups.persons.some((p) => /Schule|Sonnenblume|Bürgerverein/.test(p)),
    `Einrichtungen: ${groups.orgs.join(' | ')}; Personen: ${groups.persons.join(', ')}`);
  await goTo(page, 'a3');
  await ackAll(page);
  const ampel = await page.$eval('#ampel', (e) => e.innerText.replace(/\s+/g, ' '));
  check('Ampel: „2 Personen und 3 Einrichtungen ersetzt“', /2 Personen und 3 Einrichtungen ersetzt/.test(ampel));
  const kd = await saveKey(page);
  const keyPath = path.join(outDir, `${++seq}-${kd.suggestedFilename()}`);
  await kd.saveAs(keyPath);
  const r = await exportWithAck(page, fmt);
  const anon = path.join(outDir, `${++seq}-${r.dl.suggestedFilename()}`);
  await r.dl.saveAs(anon);
  await ctx.close();
  keys[fmt] = keyPath;
  anonFiles[fmt] = anon;
  const key = JSON.parse(fs.readFileSync(keyPath, 'utf8').replace(/^﻿/, ''));
  const orgEntries = key.platzhalter.filter((e) => e.kategorie === 'Einrichtung');
  check('Schlüsseldatei: Einrichtungen als eigene Art (kategorie „Einrichtung“, Liste „einrichtungen“)', orgEntries.length >= 4 && Array.isArray(key.einrichtungen) && key.einrichtungen.length === 3,
    orgEntries.map((e) => `${e.platzhalter} = „${e.wert.replace('\n', '⏎')}“ (${e.anzahl}×)`).join('; '));
  const blocked = r.blocked ? r.blocked.items.map((x) => x.replace(/\s+/g, ' ').slice(0, 90)) : [];
  // Fälle einzeln
  const back = await restoreUI(anon, keyPath);
  const so = await segments(fs.readFileSync(path.join(fx, file)), fmt);
  const sa = await segments(fs.readFileSync(anon), fmt);
  const sb = back.bytes ? await segments(back.bytes, fmt) : [];
  log('');
  log('| Fall | ersetzt | Platzhalter / Ausgabe | Rückbau exakt |');
  log('|---|---|---|---|');
  for (const c of CASES) {
    if (c.only && !c.only.includes(fmt)) continue;
    const i = so.findIndex((x) => x.includes(c.seg));
    if (i < 0) { log(`| ${c.id} | – (kommt in ${fmt} nicht vor) | | |`); continue; }
    const outSeg = sa[i] || '';
    const replaced = c.want.test(outSeg);
    const exact = sb[i] === so[i];
    const kept = !replaced && outSeg.includes(c.surface.split('\n')[0]);
    const note = !replaced && kept ? ` – NICHT ersetzt; Schlusscheck meldet: ${blocked.some((b) => /Familienzentrum/.test(b)) ? 'ja (Speichern gesperrt bis „bewusst stehen lassen“)' : 'NEIN'}` : '';
    log(`| ${c.id} | ${replaced ? 'ja' : 'nein'} | „${outSeg.replace(/\n/g, '⏎').slice(0, 90)}“${note} | ${exact ? 'ja' : 'NEIN'} |`);
    const expectNo = c.id === 'Zeilenumbruch im Namen' && (fmt === 'txt' || fmt === 'docx'); // Grenze, siehe Bericht
    if (expectNo) check(`${fmt}: ${c.id}: nicht ersetzt, aber der Schlusscheck meldet ihn (nie unbemerkt)`, !replaced && blocked.some((b) => /Familienzentrum/.test(b)) && exact, blocked[0]);
    else check(`${fmt}: ${c.id}: ersetzt und Rückbau exakt`, replaced && exact);
  }
  const all = sb.length === so.length && sb.every((x, k) => x === so[k]);
  check(`${fmt}: Rückbau insgesamt exakt (alle ${so.length} Abschnitte)`, all && back.plan.verdict === 'passend', `Bericht: ${back.plan.rows.filter((x) => /Einrichtung/.test(x)).join(', ')}`);
  const wh = await wordHits(fs.readFileSync(anon), fmt);
  const rest = Object.entries(wh).filter(([, v]) => v.c).map(([w, v]) => `${w} ${v.c}× (${v.where.join(', ')})`);
  log(`- Wortbestandteile in ALLEN Teilen der Ausgabe: ${WORDS.map((w) => `${w} ${wh[w].c}`).join(', ')}`);
  const okRest = rest.length === 0 || ((fmt === 'txt' || fmt === 'docx') && rest.every((x) => /^(Familienzentrum|Sonnenblume) 1×/.test(x)) && blocked.length);
  check(`${fmt}: keine Reste${rest.length ? ' außer dem gemeldeten Zeilenumbruch-Fall' : ''}`, okRest, rest.join('; '));
  log('');
}

// ---------- Vorrang ----------
log('## Vorrang: Einrichtung mit Personenname');
{
  const txt = fs.readFileSync(anonFiles.txt, 'utf8');
  const line = txt.split('\n').find((l) => /macht mit/.test(l));
  const key = JSON.parse(fs.readFileSync(keys.txt, 'utf8').replace(/^\uFEFF/, ''));
  const school = key.platzhalter.find((e) => e.wert === ORG.schule);
  const astrid = key.personen.find((p) => p.anzeige === 'Astrid Lindgren');
  check('„Astrid-Lindgren-Schule“ = ein Platzhalter; „Astrid Lindgren“ an anderer Stelle bleibt Person', !!school && !!astrid && line.includes(school.platzhalter + ' macht mit') && /Frau Vorname [A-Z] Nachname [A-Z] liest/.test(line), line);
}
log('');

// ---------- Art-Wechsel ----------
log('## Art-Wechsel: Einrichtung → Person → Einrichtung (rückbaufähig)');
{
  const { page, ctx } = await newPage();
  await startAnon(page, 'reversible');
  await loadIn(page, path.join(fx, 'einrichtung.txt'));
  await goTo(page, 'a2');
  await answerAllYes(page);
  await markOrg(page, ORG.verein);
  await goTo(page, 'a3');
  await ackAll(page);
  await saveKey(page);
  const st0 = await page.evaluate(() => ({ k: window.__anon.app.kennung, out: null }));
  const counts = async () => page.evaluate(async () => { const A = window.__anon; const o = await A.buildOutput('txt'); return { persons: A.app.result.entities.size, orgs: A.app.result.orgs.size, line: o.text.split('\n').find((l) => /ein Fest/.test(l)), kennung: A.app.kennung, saveDisabled: document.querySelector('#btn-save').disabled }; });
  const a = await counts();
  await goTo(page, 'a2');
  await openMenu(page, 'org', ORG.verein);
  await page.click('#orgs .emenu .kindbtn');
  await page.waitForFunction(() => window.__anon.app.result.orgs.size === 0);
  await goTo(page, 'a3');
  const b = await counts();
  const ampelB = await page.$eval('#ampel', (e) => e.innerText.replace(/\s+/g, ' '));
  check('„ist eine Person“: Platzhalter, Zählung und Kennung folgen; Schlüssel muss neu gespeichert werden', a.orgs === 1 && b.orgs === 0 && b.persons === a.persons + 1 && /Vorname [A-Z] Nachname [A-Z]|Name [A-Z]/.test(b.line) && b.kennung !== st0.k && b.saveDisabled && !/Einrichtung/.test(ampelB.split('Ersetzte Personen')[1].split('.')[0]),
    `vorher: ${a.persons} Personen/${a.orgs} Einrichtung, „${a.line}“; nachher: ${b.persons}/${b.orgs}, „${b.line}“, Kennung ${st0.k} → ${b.kennung}`);
  await ackAll(page);
  await saveKey(page);
  const k2 = await page.evaluate(() => window.__anon.app.kennung);
  await goTo(page, 'a2');
  await openMenu(page, 'person', ORG.verein);
  await page.click('#entities .emenu .kindbtn');
  await page.waitForFunction(() => window.__anon.app.result.orgs.size === 1);
  await goTo(page, 'a3');
  const c = await counts();
  const ampelC = await page.$eval('#ampel', (e) => e.innerText.replace(/\s+/g, ' '));
  check('„ist eine Einrichtung“ zurück: wieder „Einrichtung A“, Zählung und Kennung folgen', c.orgs === 1 && c.persons === a.persons && c.line === a.line && c.kennung !== k2 && c.saveDisabled && /und 1 Einrichtung ersetzt/.test(ampelC), `„${c.line}“, Kennung ${k2} → ${c.kennung}`);
  await ctx.close();
}
log('');

// ---------- Merkliste ----------
log('## Merkliste mit Art');
{
  const oldList = path.join(outDir, 'merkliste-alt.json');
  fs.writeFileSync(oldList, JSON.stringify({ hinweis: 'Enthält echte Namen', names: ['Sonnenblume'], exceptions: [] }));
  const run = async (html, list) => {
    const { page, ctx } = await newPage(html);
    await page.setInputFiles('#list-file', list);
    await page.waitForFunction(() => window.__anon.app.state.manualTerms.length + (window.__anon.app.state.orgTerms || []).length > 0);
    await startAnon(page, 'person');
    await loadIn(page, path.join(fx, 'einrichtung.txt'));
    const r = await page.evaluate(async () => ({ out: (await window.__anon.buildOutput('txt')).text, orgs: window.__anon.app.state.orgTerms || [], names: window.__anon.app.state.manualTerms,
      chips: [...document.querySelectorAll('#names-chips .chip')].map((c) => c.textContent.replace('×', '').trim()) }));
    await ctx.close();
    return r;
  };
  const n = await run(newHtml, oldList);
  if (oldHtml) {
    const o = await run(oldHtml, oldList);
    check('Alte Merkliste ohne Art lädt als Personen; Ausgabe byte-gleich wie in 2.2', n.orgs.length === 0 && n.names[0] === 'Sonnenblume' && sha(n.out) === sha(o.out), `Chips: ${n.chips.join(' | ')}; SHA ${sha(n.out).slice(0, 12)} / ${sha(o.out).slice(0, 12)}`);
  }
  const newList = path.join(outDir, 'merkliste-neu.json');
  fs.writeFileSync(newList, JSON.stringify({ hinweis: 'Enthält echte Namen', names: ['Hollmann'], einrichtungen: [ORG.haupt], exceptions: [] }));
  const m = await run(newHtml, newList);
  check('Neue Merkliste mit Art wird richtig gelesen (Person und Einrichtung, Art an jedem Eintrag sichtbar)', m.orgs[0] === ORG.haupt && m.names[0] === 'Hollmann' && /Bericht aus dem Einrichtung A$/m.test(m.out) && m.chips.some((c) => /Einrichtung$/.test(c)) && m.chips.some((c) => /Person$/.test(c)), m.chips.join(' | '));
  // Speichern als Datei und im Browser-Speicher: Art bleibt erhalten; Hinzufügen mit gewählter Art
  const { page, ctx } = await newPage();
  await page.click('#go-anon');
  if (await page.isHidden('#advanced')) await page.click('#tgl-adv');
  await page.fill('#name-input', ORG.verein);
  await page.selectOption('#name-kind', 'org');
  await page.click('#name-add button[type=submit]');
  await page.fill('#name-input', 'Hollmann');
  await page.selectOption('#name-kind', 'person');
  await page.click('#name-add button[type=submit]');
  const dlP = page.waitForEvent('download');
  await page.click('#btn-list-export');
  const dl = await dlP;
  const lp = path.join(outDir, 'merkliste-export.json');
  await dl.saveAs(lp);
  const saved = JSON.parse(fs.readFileSync(lp, 'utf8').replace(/^﻿/, ''));
  await page.check('#persist');
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('anonymisierer.merkliste.v1')));
  await page.reload();
  const reloaded = await page.evaluate(() => ({ orgs: window.__anon.app.state.orgTerms, names: window.__anon.app.state.manualTerms }));
  await page.evaluate(() => localStorage.clear());
  await ctx.close();
  check('Beim Hinzufügen Art wählbar; Datei und Browser-Speicher merken die Art', saved.einrichtungen[0] === ORG.verein && saved.names[0] === 'Hollmann' && stored.einrichtungen[0] === ORG.verein && reloaded.orgs[0] === ORG.verein && reloaded.names[0] === 'Hollmann',
    `Datei: ${JSON.stringify({ names: saved.names, einrichtungen: saved.einrichtungen })}`);
}
log('');

// ---------- Oberfläche ----------
log('## Oberfläche: Legende, KI-Hinweis, Modi');
{
  const { page, ctx } = await newPage();
  await startAnon(page, 'person');
  await loadIn(page, path.join(fx, 'einrichtung.txt'));
  await goTo(page, 'a2');
  const legend = await page.evaluate(() => [...document.querySelectorAll('.legend mark')].map((m) => { const cs = getComputedStyle(m); return { t: m.textContent, outline: cs.outlineStyle, bg: cs.backgroundColor, fg: cs.color, ol: cs.outlineColor, bs: cs.boxShadow }; }));
  const org = legend.find((x) => x.t === 'Einrichtung');
  const lum = (c) => { const [r, g, b] = c.match(/\d+/g).slice(0, 3).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
  check('Legende: eigene Markierung „Einrichtung“, auch ohne Farbe unterscheidbar (doppelter Rahmen, sonst keiner)', !!org && org.outline === 'double' && legend.filter((x) => x.outline === 'double').length === 1, legend.map((x) => `${x.t}: Rahmen ${x.outline}`).join(', '));
  check('Kontrast Schrift/Hintergrund mindestens 4,5:1, Rahmen mindestens 3:1', ratio(org.fg, org.bg) >= 4.5 && ratio(org.ol, org.bg) >= 3, `Schrift ${ratio(org.fg, org.bg).toFixed(1)}:1, Rahmen ${ratio(org.ol, org.bg).toFixed(1)}:1`);
  const hints = await page.evaluate(() => window.__anon.KI_HINT);
  check('„Hinweis für die KI“ nennt „Einrichtung A“ (bzw. „[EINRICHTUNG]“)', /„Einrichtung A“/.test(hints.reversible) && /„Einrichtung A“/.test(hints.person) && /„\[EINRICHTUNG\]“/.test(hints.name));
  await markOrg(page, ORG.haupt);
  const mark = await page.$eval('#docview mark.org', (m) => ({ l: m.dataset.l, t: m.title }));
  check('Treffer der Einrichtung in der Prüfansicht markiert (Kürzel, Titel)', mark.l === 'Einr. A' && /Einrichtung A/.test(mark.t), `${mark.l} · ${mark.t}`);
  for (const mode of ['name']) {
    const out = await page.evaluate(async (m) => { window.__anon.app.state.settings.mode = m; window.__anon.runAnalysis(); return (await window.__anon.buildOutput('txt')).text.split('\n')[0]; }, mode);
    check('Modus „[NAME]“: „[EINRICHTUNG]“', out === 'Bericht aus dem [EINRICHTUNG]', out);
  }
  await ctx.close();
}
log('');

// ---------- Rückwärts-Prüfung ----------
log('## Rückwärts-Prüfung für den Revert-Weg: Version 2.2 mit Schlüsseldatei aus 2.3');
if (oldHtml) {
  const r = await restoreUI(anonFiles.txt, keys.txt, oldHtml);
  const text = r.bytes ? r.bytes.toString('utf8') : '';
  const left = (text.match(/Einrichtung [A-Z]\d*/g) || []);
  log(`- Version 2.2 lädt die Schlüsseldatei: „${r.keyStatus}“`);
  log(`- Urteil der bisherigen Prüfung: „${r.plan.verdict}“, Zeilen: ${r.plan.rows.join(', ')}`);
  log(`- Ergebnis: Personen und Kontaktdaten zurück; Einrichtungs-Platzhalter bleiben stehen: ${left.length ? [...new Set(left)].join(', ') : 'keine'}`);
  check('2.2 lädt den Schlüssel, baut Personen zurück, Einrichtungen bleiben als Platzhalter (gemeldet als Anzahl-Abweichung)', /Schlüsseldatei geladen/.test(r.keyStatus) && left.length > 0 && /Petra Hollmann/.test(text) && r.plan.rows.some((x) => /^Einrichtung A: 0\//.test(x)));
} else log('- übersprungen (keine index.html der Version 2.2 angegeben)');
log('');

// ---------- Firma aus den Dateiangaben: 2.2 / 2.3 ----------
log('## Firma aus den Dateiangaben: Frage mit „Ja“ beantwortet, Version 2.2 gegen 2.3');
if (oldHtml) {
  for (const file of ['meta-word.docx', 'meta-tabelle.xlsx', 'einrichtung.docx']) {
    const run = async (html) => {
      const { page, ctx } = await newPage(html);
      await startAnon(page, 'person');
      await loadIn(page, path.join(fx, file));
      await goTo(page, 'a2');
      const asked = await answerAllYes(page);
      const out = await page.evaluate(async () => (await window.__anon.buildOutput('txt')).text);
      await ctx.close();
      return { out, asked: asked.filter((q) => /Dateiangaben/.test(q)) };
    };
    const o = await run(oldHtml);
    const n = await run(newHtml);
    const ol = o.out.split('\n');
    const nl = n.out.split('\n');
    const diff = nl.map((l, i) => (l !== ol[i] ? `„${ol[i]}“ → „${l}“` : null)).filter(Boolean);
    log(`- ${file}: Fragen 2.2: ${o.asked.join(' / ')}; 2.3: ${n.asked.join(' / ')}`);
    log(`  - ${diff.length} geänderte Zeile(n): ${diff.join('; ')}.`);
    log('  - Gründe: (a) Die Firma wird als ganze Wortfolge „Einrichtung A“ ersetzt statt Wort für Wort als Person. (b) Ein einzelnes Wort der Firma (z. B. das Allerweltswort „Beratung“) wird deshalb nicht mehr als Person ersetzt. (c) Die Buchstaben der Personen rücken nach, weil die Firma in 2.2 selbst „Person A“ war.');
    // Prüfung: Werden Platzhalter und Wörter der Firma gleichgesetzt, sind beide Fassungen gleich (sonst ändert sich nichts)
    const firm = /(?:Person|Einrichtung) [A-Z]+\d*s?|\b(?:Lindenhof|Beratung|GmbH|Familienzentrums?|Sonnenblume)\b/g;
    const norm = (l) => l.replace(firm, 'X').replace(/X(?:\s+X)+/g, 'X');
    if (nl.length !== ol.length) log('  - (d) Ein Zeilenumbruch innerhalb der Einrichtung gehört zur ersetzten Wortfolge (Textausgabe aus Word); dadurch eine Zeile weniger.');
    check(`${file}: Unterschiede nur durch die als Einrichtung übernommene Firma (Gründe a–d)`, norm(n.out.replace(/\s*\n\s*/g, ' ')) === norm(o.out.replace(/\s*\n\s*/g, ' ')));
  }
} else log('- übersprungen');
log('');

// ---------- Doppellauf ----------
log('## Doppellauf');
for (const [file, fmt] of FORMATS) {
  const once = async () => {
    const { page, ctx } = await newPage();
    const bytes = [...fs.readFileSync(path.join(fx, file))];
    const r = await page.evaluate(async ([b, f, fm]) => {
      const A = window.__anon;
      A.app.state.orgTerms = ['Familienzentrum Sonnenblume', 'Lindenauer Bürgerverein', 'Astrid-Lindgren-Schule'];
      A.app.state.settings.mode = 'person';
      await A.openBytes(new Uint8Array(b), f);
      const o = await A.buildOutput(fm);
      return o.zip ? Array.from(o.bytes) : o.text;
    }, [bytes, file, fmt]);
    await ctx.close();
    return sha(typeof r === 'string' ? r : Buffer.from(r));
  };
  const a = await once();
  const b = await once();
  check(`${file}: zwei Läufe byte-gleich`, a === b, a.slice(0, 16));
}
await browser.close();

const failed = checks.filter((c) => !c[1]);
log('');
log(`Prüfungen: ${checks.length - failed.length} von ${checks.length} bestanden${failed.length ? ' – FEHLER: ' + failed.map((c) => c[0]).join('; ') : ''}.`);
log(`Netzwerkanfragen außer lokalen Dateien: ${requests.filter((u) => !/^(file|blob|data):/.test(u)).length}.`);
fs.writeFileSync(path.join(here, 'EINRICHTUNG-REPORT.md'), report.join('\n') + '\n');
process.exit(failed.length ? 1 : 0);
