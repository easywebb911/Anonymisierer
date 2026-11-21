// GROSSSCHREIBUNG mit Endung (Version 2.3.2): Je Form ersetzt / gemeldet / unbemerkt, vorher (2.3.1) und nachher;
// Word/TXT/CSV, Kopf-/Fußzeile, Fußnote, Bildbeschreibung; Schriftzeichen (auch mit türkischer Spracheinstellung);
// Gegenprobe; Einrichtungen (nur prüfen); Schlusscheck-Vergleich über alle Testdokumente; Kreislauf; Doppellauf.
// Ergebnis: tests/GROSS-REPORT.md. Aufruf: node tests/gross-test.mjs <index.html-der-Version-2.3.1>
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import JSZip from 'jszip';
import { startAnon, loadIn, ackAll, exportWithAck, saveKey } from './ui-helpers.mjs';
import { PEOPLE, lines, TEILE, SCHRIFT, schriftLines, GEGEN_WORDS, GEGEN_PERSONEN } from './make-gross.mjs';
import { fold } from '../src/core/fold.js';

const { chromium } = createRequire('/opt/node22/lib/node_modules/')('playwright');
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const fx = path.join(here, 'fixtures');
const newHtml = path.join(root, 'index.html');
const oldHtml = process.argv[2] ? path.resolve(process.argv[2]) : null;
if (!oldHtml) { console.error('Bitte Pfad zur index.html der Version 2.3.1 angeben.'); process.exit(2); }
const outDir = path.join(here, 'out-gross');
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });
const report = [];
const log = (s = '') => { report.push(s); console.log(s); };
const checks = [];
const check = (name, ok, detail = '') => { checks.push([name, ok]); log(`- ${ok ? 'OK' : 'FEHLER'}: ${name}${detail ? ' – ' + detail : ''}`); };
const browser = await chromium.launch();
const requests = [];
let seq = 0;
async function newPage(html = newHtml, locale = 'de-DE') {
  const ctx = await browser.newContext({ acceptDownloads: true, locale });
  const page = await ctx.newPage();
  page.on('request', (r) => requests.push(r.url()));
  page.on('dialog', (d) => d.accept());
  await page.goto('file://' + html);
  return { page, ctx };
}
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
const SURNAMES = PEOPLE.map((p) => p[2]);
// Ausgabe (derselbe Weg wie beim Speichern) + Schlusscheck + Treffer
async function run(html, file, { mode = 'person', fmt, manual = [], orgs = [], locale } = {}) {
  const { page, ctx } = await newPage(html, locale);
  const bytes = [...fs.readFileSync(path.isAbsolute(file) ? file : path.join(fx, file))];
  const r = await page.evaluate(async ([b, f, m, fm, man, og]) => {
    const A = window.__anon;
    A.app.state.settings.mode = m;
    A.app.state.manualTerms = man;
    A.app.state.orgTerms = og;
    await A.openBytes(new Uint8Array(b), f);
    const o = await A.buildOutput(fm);
    const leaks = await A.finalCheck(o);
    const res = A.app.result;
    const hits = res.hits.filter((h) => h.type === 'person').map((h) => ({ w: res.fullText.slice(h.s, h.e), cert: h.cert, on: h.on, keys: (h.comps || []).filter((c) => c.type === 'W').map((c) => c.key) }));
    return { zip: o.zip ? Array.from(o.bytes) : null, text: o.text || null, leaks: leaks.map((l) => ({ word: l.word, context: l.context || '', where: l.where })), hits };
  }, [bytes, path.basename(file), mode, fmt, manual, orgs]);
  await ctx.close();
  r.out = await plain(r, fmt);
  return r;
}
// Ausgabe als Text: Word je Absatz eine Zeile (Text, Kopf-/Fußzeile, Fußnote) und Bildbeschreibungen
async function plain(r, fmt) {
  if (!r.zip) return r.text.replace(/^﻿/, '');
  if (fmt === 'xlsx') { // nur für den Schlusscheck-Vergleich gebraucht: alle Texte der Teile
    const z = await JSZip.loadAsync(Buffer.from(r.zip));
    const out = [];
    for (const n of Object.keys(z.files).filter((x) => /\.xml$/.test(x)).sort()) out.push(...[...(await z.file(n).async('string')).matchAll(/>([^<]+)</g)].map((m) => m[1]));
    return out.join('\n');
  }
  const z = await JSZip.loadAsync(Buffer.from(r.zip));
  const parts = [];
  for (const n of ['word/document.xml', 'word/header1.xml', 'word/footer1.xml', 'word/footnotes.xml']) {
    if (!z.file(n)) continue;
    const x = await z.file(n).async('string');
    for (const m of x.matchAll(/<w:p[ >][\s\S]*?<\/w:p>/g)) parts.push([...m[0].matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map((t) => t[1]).join(''));
    for (const m of x.matchAll(/descr="([^"]*)"/g)) parts.push(m[1]);
  }
  return parts.join('\n').replace(/&apos;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&');
}
// Zustand einer Form an einer Stelle (needle = der ganze Abschnitt um die Form, z. B. „Form 7: MÜLLERS Unterlagen“)
function status(r, needle, form) {
  if (!r.out.includes(needle)) return 'ersetzt';
  // Schlusscheck: Fundwort ist die Form (oder ihr Wortteil vor dem Apostroph) und die Fundstelle ist dieser Abschnitt
  const hit = r.leaks.some((l) => form.startsWith(l.word) && (l.context.replace(/&apos;/g, "'").includes(needle) || l.context.replace(/&apos;/g, "'").includes(form)));
  return hit ? 'gemeldet' : 'UNBEMERKT';
}
const confirmed = (r, name) => r.hits.some((h) => h.on && h.keys.includes(fold(name)));

log('# GROSSSCHREIBUNG mit Endung (Version 2.3.2): Tests');
log('');
log('Testdokumente: tests/make-gross.mjs (alle Personen erfunden). Vorher = Version 2.3.1, nachher = diese Version. Modus „Person A“, sofern nicht anders angegeben.');
log('„ersetzt“ = steht nicht mehr in der Ausgabe; „gemeldet“ = steht noch da, der Schlusscheck meldet die Stelle (Export gesperrt bis zur Bestätigung); „UNBEMERKT“ = steht noch da und wird nicht gemeldet.');
log('Gezählt wird nur bei bestätigten Namen (mindestens ein eingeschalteter Treffer dieser Person). Ein Name, den das Tool gar nicht kennt, ist nicht bestätigt.');
log('');

// ---------- je Form vorher / nachher ----------
log('## Je Form: vorher (2.3.1) / nachher');
const tally = { vorher: { ersetzt: 0, gemeldet: 0, UNBEMERKT: 0 }, nachher: { ersetzt: 0, gemeldet: 0, UNBEMERKT: 0 } };
const SCEN = [['mit', [], 'normal geschriebener Name mit Anrede im Dokument, keine eigenen Namen'],
  ['einzig', [], 'nur GROSS-Formen mit Endung, keine eigenen Namen'],
  ['einzig', SURNAMES, 'nur GROSS-Formen mit Endung, Nachnamen von Hand markiert (eigene Namen)'],
  ['mit', SURNAMES, 'normal geschriebener Name mit Anrede, Nachnamen zusätzlich von Hand markiert']];
for (const [variant, manual, desc] of SCEN) {
  for (const fmt of ['docx', 'txt', 'csv']) {
    const file = `grossform-${variant}.${fmt}`;
    const a = await run(oldHtml, file, { fmt, manual });
    const b = await run(newHtml, file, { fmt, manual });
    log(`### ${file} – ${desc}`);
    log('');
    log('| Name | Form | Art | vorher | nachher |');
    log('|---|---|---|---|---|');
    const cnt = { vorher: { ersetzt: 0, gemeldet: 0, UNBEMERKT: 0 }, nachher: { ersetzt: 0, gemeldet: 0, UNBEMERKT: 0 } };
    let notConf = 0;
    let worse = 0;
    const rows = lines(variant).filter((l) => l.form).map((l) => ({ name: l.name, form: l.form, kind: l.kind, needle: l.text.replace(/ liegen vor\.$/, '') }));
    if (fmt === 'docx') for (const [k, t] of Object.entries(TEILE)) rows.push({ name: t.name, form: t.form, kind: { header: 'Kopfzeile', footer: 'Fußzeile', footnote: 'Fußnote', image: 'Bildbeschreibung' }[k], needle: t.text });
    for (const row of rows) {
      const ca = confirmed(a, row.name);
      const cb = confirmed(b, row.name);
      const sa = ca ? status(a, row.needle, row.form) : (a.out.includes(row.needle) ? 'nicht bestätigt' : 'ersetzt');
      const sb = cb ? status(b, row.needle, row.form) : (b.out.includes(row.needle) ? 'nicht bestätigt' : 'ersetzt');
      if (ca) cnt.vorher[sa]++;
      if (cb) cnt.nachher[sb]++;
      if (!cb) notConf++;
      const rank = { ersetzt: 2, gemeldet: 1, UNBEMERKT: 0, 'nicht bestätigt': -1 };
      if (ca && cb && rank[sb] < rank[sa]) worse++;
      log(`| ${row.name} | ${row.form} | ${row.kind} | ${sa} | ${sb}${sa !== sb ? ' (geändert)' : ''} |`);
    }
    for (const w of ['vorher', 'nachher']) for (const k of Object.keys(cnt[w])) tally[w][k] += cnt[w][k];
    log('');
    log(`- vorher: ersetzt ${cnt.vorher.ersetzt}, gemeldet ${cnt.vorher.gemeldet}, unbemerkt ${cnt.vorher.UNBEMERKT}; nachher: ersetzt ${cnt.nachher.ersetzt}, gemeldet ${cnt.nachher.gemeldet}, unbemerkt ${cnt.nachher.UNBEMERKT}; nicht bestätigt: ${notConf}`);
    check(`${file} (${desc}): nachher 0 unbemerkt, keine Form schlechter als vorher`, cnt.nachher.UNBEMERKT === 0 && worse === 0, `vorher ${cnt.vorher.UNBEMERKT} unbemerkt`);
    log('');
  }
}
log(`**Summe über alle Formen und Szenarien: vorher ersetzt ${tally.vorher.ersetzt} / gemeldet ${tally.vorher.gemeldet} / unbemerkt ${tally.vorher.UNBEMERKT}; nachher ersetzt ${tally.nachher.ersetzt} / gemeldet ${tally.nachher.gemeldet} / unbemerkt ${tally.nachher.UNBEMERKT}.**`);
check('Spalte „unbemerkt“ nachher insgesamt 0', tally.nachher.UNBEMERKT === 0);
log('');

// ---------- Schriftzeichen ----------
log('## Schriftzeichen (je Name einzeln; Vergleich unabhängig von der Spracheinstellung)');
for (const s of SCHRIFT) {
  const file = `${s[0]}.txt`;
  const a = await run(oldHtml, file, { fmt: 'txt' });
  const b = await run(newHtml, file, { fmt: 'txt' });
  const t = await run(newHtml, file, { fmt: 'txt', locale: 'tr-TR' });
  const L = schriftLines(s);
  const rows = s[3].map((g, i) => {
    const needle = L[i + 1].replace(/ liegen vor\.$/, '');
    return `${g}: vorher ${status(a, needle, g)}, nachher ${status(b, needle, g)}`;
  });
  log(`- ${s[2]} (${file}): ${rows.join('; ')}`);
  const allDone = s[3].every((g, i) => status(b, L[i + 1].replace(/ liegen vor\.$/, ''), g) !== 'UNBEMERKT');
  const allRep = s[3].every((g, i) => status(b, L[i + 1].replace(/ liegen vor\.$/, ''), g) === 'ersetzt');
  check(`${s[2]}: alle GROSS-Formen ersetzt; mit Spracheinstellung tr-TR dieselbe Ausgabe`, allDone && allRep && t.text === b.text, `tr-TR gleich: ${t.text === b.text}`);
}
log('');

// ---------- Gegenprobe ----------
log('## Gegenprobe: gewöhnliche Wörter in GROSSSCHREIBUNG als Überschriften');
for (const file of ['gegenprobe-gross.txt', 'gegenprobe-gross.docx', 'gegenprobe-gross-personen.txt', 'gegenprobe-gross-personen.docx']) {
  const fmt = file.endsWith('docx') ? 'docx' : 'txt';
  const a = await run(oldHtml, file, { fmt });
  const b = await run(newHtml, file, { fmt });
  const mark = (r, w) => { const h = r.hits.find((x) => x.w === w); return h ? `${h.on ? 'ersetzt' : 'nicht ersetzt (aus)'}, ${h.cert}` : 'kein Treffer'; };
  log(`- ${file}${/personen/.test(file) ? ' (mit „' + GEGEN_PERSONEN.replace(/ sind da\./, '') + '“)' : ''}:`);
  for (const w of GEGEN_WORDS) log(`  - ${w}: vorher ${mark(a, w)}; nachher ${mark(b, w)}`);
  const newSure = GEGEN_WORDS.filter((w) => { const h = b.hits.find((x) => x.w === w); const o = a.hits.find((x) => x.w === w); return h && h.cert === 'sicher' && !o; });
  check(`${file}: kein neuer Treffer mit Markierung „sicher“`, newSure.length === 0, newSure.join(', '));
  log(`  - Schlusscheck: vorher ${a.leaks.length} (${a.leaks.map((l) => l.word).join(', ') || '–'}), nachher ${b.leaks.length} (${b.leaks.map((l) => l.word).join(', ') || '–'})`);
}
log('');

// ---------- Einrichtungen (Punkt 5: nur prüfen) ----------
log('## Einrichtungen: GROSS-Form mit Endung (nur geprüft, nicht umgebaut)');
{
  const text = 'Der Lindenauer Bürgerverein tagt.\nDie Akte des LINDENAUER BÜRGERVEREINS liegt vor.\nDie Akte des LINDENAUER BÜRGERVEREINs liegt vor.\n';
  const f = path.join(outDir, 'einrichtung-gross.txt');
  fs.writeFileSync(f, text);
  const res = {};
  for (const [lbl, html] of [['vorher', oldHtml], ['nachher', newHtml]]) {
    for (const mode of ['person', 'reversible']) {
      const { page, ctx } = await newPage(html);
      res[lbl + mode] = await page.evaluate(async ([t, m]) => {
        const A = window.__anon;
        A.app.state.settings.mode = m;
        A.app.state.orgTerms = ['Lindenauer Bürgerverein'];
        await A.openBytes(new TextEncoder().encode(t), 'e.txt');
        const o = await A.buildOutput('txt');
        const leaks = await A.finalCheck(o);
        return { text: o.text, leaks: leaks.map((l) => l.word) };
      }, [text, mode]);
      await ctx.close();
    }
  }
  for (const k of Object.keys(res)) log(`- ${k.replace(/(person|reversible)$/, ' $1')}: „${res[k].text.trim().replace(/\n/g, ' ⏎ ')}“; Schlusscheck: ${res[k].leaks.join(', ') || 'keine Meldung'}`);
  const ok = !/LINDENAUER/.test(res.nachherperson.text);
  check('Einrichtung in GROSSSCHREIBUNG mit Endung („LINDENAUER BÜRGERVEREINS“, „…VEREINs“) wird ersetzt (Modus Person A)', ok);
  // Rückbau im Modus rückbaufähig (Kern, wie die Oberfläche)
  const { analyze, defaultState, replacementsByUnit, applyReplacements } = await import('../src/core/detect.js');
  const { buildRestoreKey } = await import('../src/core/reversible.js');
  const { parseKeyFile, planRestore } = await import('../src/core/restore.js');
  const units = text.replace(/\n$/, '').split('\n').map((t) => ({ text: t }));
  const st = defaultState();
  st.settings.mode = 'reversible';
  st.orgTerms = ['Lindenauer Bürgerverein'];
  const r = analyze(units, st);
  const reps = replacementsByUnit(r, units);
  const out = units.map((u, i) => applyReplacements(u.text, reps[i]));
  const key = parseKeyFile(JSON.stringify(buildRestoreKey(r, { version: 'x', kind: 'txt' }))).key;
  const plan = planRestore(out.map((t) => ({ text: t })), key);
  const back = out.map((t, i) => applyReplacements(t, plan.repsPerUnit[i]));
  const exact = back.every((t, i) => t === units[i].text);
  const bad = plan.rows.filter((x) => x.status !== 'ok').map((x) => `${x.platzhalter}: erwartet ${x.erwartet}, gefunden ${x.gefunden}`);
  log(`- rückbaufähig (Kern): Ausgabe „${out.join(' ⏎ ')}“ → Rückbau „${back.join(' ⏎ ')}“; exakt: ${exact ? 'ja' : 'NEIN'}; Auffälligkeiten: ${plan.issues.map((x) => `${x.art} „${x.text}“`).join(', ') || 'keine'}; Zählung abweichend: ${bad.join('; ') || 'keine'}; Urteil „${plan.verdict}“`);
  log(`- Befund Einrichtungen: ${exact ? 'GROSS mit Endung wird ersetzt und exakt zurückgebaut.' : 'GROSS mit großer Endung wird ersetzt und nicht gemeldet. Im Modus rückbaufähig steht die große Endung aber direkt am Platzhalter („Einrichtung A2S“). Der Rückbau erkennt das nicht als Platzhalter und lässt es stehen; angezeigt wird nur die abweichende Anzahl. Schon in 2.3.1 so. Nicht umgebaut (Punkt 5), Vorschlag im Bericht.'}`);
  // In 2.3.2 hier „nicht umgebaut“ geprüft; seit 2.3.3 (eigener Auftrag): kleine Endung im Modus Person A, Rückbau exakt
  check('Einrichtungen (seit 2.3.3): Modus „Person A“ mit kleiner Endung („Einrichtung As“), Rückbau exakt', /Einrichtung As /.test(res.nachherperson.text) && !/Einrichtung AS /.test(res.nachherperson.text) && exact);
}
log('');

// ---------- Dateiangaben (Titel) mit GROSS-Form mit Endung ----------
log('## Dateiangaben: Titel „Akte MÜLLERS“ (Texte außerhalb der Prüfansicht)');
{
  const zz = new JSZip();
  {
    const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
    zz.file('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>');
    zz.file('_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>');
    zz.file('docProps/core.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title>Akte MÜLLERS</dc:title><dc:subject>Akte Müllers</dc:subject></cp:coreProperties>');
    zz.file('word/document.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:document xmlns:w="${W}"><w:body><w:p><w:r><w:t>Frau Helga Müller kommt zur Sitzung.</w:t></w:r></w:p><w:sectPr/></w:body></w:document>`);
  }
  const f = path.join(outDir, 'meta-gross.docx');
  fs.writeFileSync(f, await zz.generateAsync({ type: 'nodebuffer' }));
  for (const [lbl, html] of [['vorher', oldHtml], ['nachher', newHtml]]) {
    const r = await run(html, f, { fmt: 'docx' });
    const zo = await JSZip.loadAsync(Buffer.from(r.zip));
    const core = zo.file('docProps/core.xml') ? await zo.file('docProps/core.xml').async('string') : '';
    const t = (core.match(/<dc:title>([^<]*)</) || [, '(leer/entfernt)'])[1];
    const su = (core.match(/<dc:subject>([^<]*)</) || [, '(leer/entfernt)'])[1];
    log(`- ${lbl}: Titel „${t}“, Betreff „${su}“; Schlusscheck: ${r.leaks.map((l) => `„${l.word}“ (${l.where})`).join(', ') || 'keine Meldung'}`);
    if (lbl === 'nachher') check('Titel „Akte MÜLLERS“: ersetzt oder vom Schlusscheck gemeldet', !/MÜLLERS/.test(t) || r.leaks.some((l) => l.word === 'MÜLLERS'));
  }
  // Ersetzer für Texte außerhalb der Prüfansicht (Feldfunktionen, Verweise, übrige Dateiangaben), am Kern
  const { analyze, defaultState, makeGenericReplacer, leakForms, findLeaks } = await import('../src/core/detect.js');
  for (const mode of ['person', 'reversible']) {
    const st = defaultState();
    st.settings.mode = mode;
    const r = analyze([{ text: 'Frau Helga Müller kommt zur Sitzung.' }], st);
    const g = makeGenericReplacer(r, st.settings);
    const samples = ['Akte Müllers', 'Akte MÜLLER', 'Akte MÜLLERs', 'Akte MÜLLERS'].map((x) => {
      const y = g(x);
      const leak = findLeaks(leakForms(r), [{ where: '', text: y }]).length > 0;
      return `„${x}“ → „${y}“${leak ? ' (Schlusscheck meldet)' : ''}`;
    });
    log(`- Ersetzer außerhalb der Prüfansicht (${mode}): ${samples.join('; ')}`);
    const big = g('Akte MÜLLERS');
    check(`Ersetzer außerhalb der Prüfansicht (${mode}): „MÜLLERS“ ersetzt oder gemeldet`, big !== 'Akte MÜLLERS' || findLeaks(leakForms(r), [{ where: '', text: big }]).length > 0);
  }
}
log('');

// ---------- Schlusscheck-Vergleich über alle Testdokumente ----------
log('## Schlusscheck-Vergleich über alle Testdokumente (Modus „Person A“ und „rückbaufähig“; Ausgabe im eigenen Format)');
{
  const files = fs.readdirSync(fx).filter((f) => /\.(docx|xlsx|txt|csv|pdf)$/.test(f) && !/^gross\.|^alt-format|gescannt/.test(f)).sort();
  let before = 0;
  let after = 0;
  const added = [];
  const removed = [];
  for (const file of files) {
    const ext = path.extname(file).slice(1);
    const fmt = ext === 'pdf' ? 'txt' : ext;
    for (const mode of ['person', 'reversible']) {
      let a;
      let b;
      try { a = await run(oldHtml, file, { fmt, mode }); b = await run(newHtml, file, { fmt, mode }); } catch (e) { log(`- ${file}: nicht lesbar (${e.message.split('\n')[0]})`); break; }
      before += a.leaks.length;
      after += b.leaks.length;
      const ka = a.leaks.map((l) => l.word + '|' + l.where);
      const kb = b.leaks.map((l) => l.word + '|' + l.where);
      const rest = [...ka];
      for (const k of kb) { const i = rest.indexOf(k); if (i >= 0) rest.splice(i, 1); else added.push(`${file} (${mode}): „${k.split('|')[0]}“ in ${k.split('|')[1]} – „${(b.leaks.find((l) => l.word + '|' + l.where === k).context || '').replace(/\s+/g, ' ').trim()}“`); }
      for (const k of rest) removed.push(`${file} (${mode}): „${k.split('|')[0]}“ in ${k.split('|')[1]}`);
    }
  }
  log(`- ${files.length} Dokumente, je zwei Modi: Meldungen vorher ${before}, nachher ${after}; neu ${added.length}, entfallen ${removed.length}`);
  for (const x of added) log(`  - neu: ${x}`);
  for (const x of removed) log(`  - entfallen: ${x}`);
  fs.writeFileSync(path.join(outDir, 'schlusscheck-neu.txt'), added.join('\n') + '\n');
}
log('');

// ---------- Kreislauf ----------
log('## Kreislauf (rückbaufähig) über die Oberfläche');
async function restoreUI(file, key) {
  const { page, ctx } = await newPage();
  await page.click('#go-restore');
  await page.setInputFiles('#rb-file', file);
  await page.waitForFunction(() => document.querySelector('#rb-file-status').textContent);
  await page.setInputFiles('#rb-key', key);
  await page.waitForFunction(() => document.querySelector('#rb-key-status').textContent);
  await page.click('#rb-btn-check');
  const plan = await page.evaluate(() => ({ verdict: window.__anon.rb.plan.verdict, issues: window.__anon.rb.plan.issues.length }));
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
  return { bytes: fs.readFileSync(p), ...plan };
}
const sig = async (bytes, fmt) => {
  if (fmt === 'docx') {
    const z = await JSZip.loadAsync(bytes);
    const out = [];
    for (const n of Object.keys(z.files).filter((x) => /^word\/.*\.xml$/.test(x)).sort()) { const x = await z.file(n).async('string'); out.push(n, ...[...x.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>|descr="([^"]*)"/g)].map((m) => m[1] ?? m[2])); }
    return out.join('|').replace(/&apos;/g, "'");
  }
  return bytes.toString('utf8').replace(/^﻿/, '');
};
const RT = [['grossform-mit.docx', 'docx'], ['grossform-mit.txt', 'txt'], ['grossform-mit.csv', 'csv'], ['grossform-einzig.docx', 'docx'], ['grossform-einzig.txt', 'txt'], ['grossform-einzig.csv', 'csv'],
  ...SCHRIFT.map((s) => [`${s[0]}.txt`, 'txt'])];
for (const [file, fmt] of RT) {
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
  const upper = key.platzhalter.filter((x) => /\p{Lu}{2,}(?:['’]?\p{Lu}+)$/u.test(x.wert) && /(?:S|ES|N|NS|'S|’S)$/.test(x.wert)).slice(0, 2).map((x) => `${x.platzhalter} = „${x.wert}“`);
  check(`${file}: Kreislauf exakt`, got === orig && back.verdict === 'passend' && back.issues === 0, `Urteil „${back.verdict}“, Auffälligkeiten ${back.issues}; ${key.platzhalter.length} Platzhalter${upper.length ? '; z. B. ' + upper.join(', ') : ''}; Ausgabe enthält „Nachname AS“-artige Reste: ${/(?:Vorname|Nachname|Name) [A-Z]+\d*(?:S|ES|N|NS)\b/.test(anon) ? 'JA' : 'nein'}`);
}
log('');

// ---------- Doppellauf ----------
log('## Doppellauf');
for (const [file, fmt] of [['grossform-mit.docx', 'docx'], ['grossform-mit.txt', 'txt'], ['grossform-einzig.csv', 'csv']]) {
  for (const mode of ['person', 'reversible']) {
    const a = await run(newHtml, file, { fmt, mode });
    const b = await run(newHtml, file, { fmt, mode });
    const same = mode === 'person' ? sha(a.zip ? Buffer.from(a.zip) : a.text) === sha(b.zip ? Buffer.from(b.zip) : b.text) : a.out === b.out;
    check(`${file} (${mode}): zwei Läufe ${mode === 'person' ? 'byte-gleich' : 'inhaltsgleich (Kennung zufällig)'}`, same);
  }
}
await browser.close();

const failed = checks.filter((c) => !c[1]);
log('');
log(`Prüfungen: ${checks.length - failed.length} von ${checks.length} bestanden${failed.length ? ' – FEHLER: ' + failed.map((c) => c[0]).join('; ') : ''}.`);
log(`Netzwerkanfragen außer lokalen Dateien: ${requests.filter((u) => !/^(file|blob|data):/.test(u)).length}.`);
fs.writeFileSync(path.join(here, 'GROSS-REPORT.md'), report.join('\n') + '\n');
process.exit(failed.length ? 1 : 0);
