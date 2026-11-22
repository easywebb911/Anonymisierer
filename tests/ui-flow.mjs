// Tests der geführten Bedienung (Version 2) über die echte Oberfläche in Chromium (file://).
// Durchläufe, ein Bildschirm / ein Hauptknopf je Schritt, Sperren, Fragekarte, Tasten J/N, Zurück/Weiter,
// „Nächstes Dokument“, Breiten 390/1280/1920, zwei Downloads aus einem Klick. Ergebnis: tests/UI-REPORT.md
// Aufruf: node tests/ui-flow.mjs
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { startAnon, loadIn, goTo, ackAll, ackImages, exportOnce, exportWithAck, saveKey, screenOf, visiblePrimaries, visibleScreens } from './ui-helpers.mjs';
import { waitCheck, savePoints, rbConfirm } from './ui-helpers.mjs';

const { chromium } = createRequire('/opt/node22/lib/node_modules/')('playwright');
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const fx = path.join(here, 'fixtures');
const outDir = path.join(here, 'out-ui');
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });
const report = [];
const log = (s = '') => { report.push(s); console.log(s); };
const checks = [];
const check = (name, ok, detail = '') => { checks.push([name, ok]); log(`- ${ok ? 'OK' : 'FEHLER'}: ${name}${detail ? ' – ' + detail : ''}`); };
const browser = await chromium.launch();
const requests = [];
async function newPage(viewport = { width: 1280, height: 900 }) {
  const ctx = await browser.newContext({ acceptDownloads: true, viewport });
  const page = await ctx.newPage();
  page.on('request', (r) => requests.push(r.url()));
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('dialog', (d) => d.accept());
  await page.goto('file://' + path.join(root, 'index.html'));
  return { page, ctx, errors };
}
// Je Schritt: genau ein Bildschirm sichtbar, genau ein Hauptknopf
async function stepCheck(page, label, steps) {
  const scr = await visibleScreens(page);
  const prim = await visiblePrimaries(page);
  steps.push(`${label}: Bildschirm ${scr.join('+')}, Hauptknopf ${prim.length === 1 ? '„' + prim[0] + '“' : prim.length + ' (' + prim.join(' | ') + ')'}`);
  return scr.length === 1 && prim.length === 1;
}
const saveDl = async (dl, name) => { const p = path.join(outDir, name || dl.suggestedFilename()); await dl.saveAs(p); return p; };

log('# Geführte Bedienung (Version 2): Oberflächen-Tests');
log('');
log('Chromium headless, Start per file://. Alle Namen in den Testdateien sind erfunden.');
log('');

// ---------- 1. Durchlauf: anonymisieren, rückbaufähig (Word) ----------
log('## Durchlauf 1: anonymisieren, rückbaufähig (kurse.docx)');
let keyPath1;
let anonPath1;
{
  const { page, ctx, errors } = await newPage();
  const steps = [];
  let ok = await stepCheck(page, 'Start', steps);
  await page.click('#go-anon');
  ok = (await stepCheck(page, 'Datei (leer)', steps)) && ok;
  check('„Weiter zum Prüfen“ ist ohne Antwort und Datei gesperrt', await page.$eval('#a1-next', (b) => b.disabled));
  await page.check('input[name=mode][value="reversible"]');
  check('… und mit Antwort, aber ohne Datei weiter gesperrt', await page.$eval('#a1-next', (b) => b.disabled));
  await loadIn(page, path.join(fx, 'kurse.docx'));
  check('… mit Antwort und Datei aktiv', !(await page.$eval('#a1-next', (b) => b.disabled)));
  ok = (await stepCheck(page, 'Datei (geladen)', steps)) && ok;
  await page.click('#a1-next');
  ok = (await stepCheck(page, 'Prüfen', steps)) && ok;
  // Fragen beantworten: alle per Taste J (Ja)
  // Version 2.5.0: nach „Ja“ zu einem Wort können Fragen je Stelle dazukommen; deshalb bis keine Frage mehr offen ist
  for (let i = 0; i < 80 && await page.evaluate(() => window.__anon.questions().some((q) => !window.__anon.answerOf(q))); i++) await page.keyboard.press('j');
  const nQ = await page.evaluate(() => window.__anon.questions().length);
  const info = await page.textContent('#a2-info');
  check(`Alle ${nQ} Fragen mit Taste J beantwortet`, /Keine Frage offen/.test(info), info);
  await page.click('#a2-next');
  await page.waitForFunction(() => { const p = window.__anon.app.preview; return p && !p.busy; });
  ok = (await stepCheck(page, 'Speichern (vor dem Schlüssel)', steps)) && ok;
  await ackAll(page);
  // Firmenname im Schlusscheck: als Einrichtung übernehmen (Knopf in der Zeile des offenen Punkts)
  if (await page.$('#points li.bad button')) await page.click('#points li.bad button');
  await page.waitForFunction(() => { const p = window.__anon.app.preview; return p && !p.busy; });
  check('„2 Datei speichern“ ist vor dem Schlüssel gesperrt', await page.$eval('#btn-save', (b) => b.disabled));
  const kd = await saveKey(page);
  keyPath1 = await saveDl(kd, 'kurse-schluessel.json');
  ok = (await stepCheck(page, 'Speichern (nach dem Schlüssel)', steps)) && ok;
  const r = await exportOnce(page, 'docx');
  check('Datei gespeichert', !!r.dl, r.status);
  anonPath1 = r.dl ? await saveDl(r.dl, 'kurse-anonym.docx') : null;
  ok = (await stepCheck(page, 'Gespeichert', steps)) && ok;
  const amp = await page.$$eval('#ampel > li', (els) => els.map((e) => e.innerText.replace(/\s+/g, ' ').split(' – ')[0]));
  log(`- Details nach dem Speichern: ${amp.join(' · ')}; offene Punkte: ${(await savePoints(page)).length}`);
  check('In jedem Schritt genau ein Bildschirm und genau ein Hauptknopf', ok, steps.join(' → '));
  check('Keine JavaScript-Fehler', !errors.length, errors.join(' | '));
  await ctx.close();
}
log('');

// ---------- 2. Durchlauf: anonymisieren, einfach (Text) ----------
log('## Durchlauf 2: anonymisieren, einfach (protokoll.txt)');
{
  const { page, ctx, errors } = await newPage();
  const steps = [];
  let ok = await stepCheck(page, 'Start', steps);
  await startAnon(page, 'person');
  await loadIn(page, path.join(fx, 'protokoll.txt'));
  ok = (await stepCheck(page, 'Datei', steps)) && ok;
  await page.click('#a1-next');
  ok = (await stepCheck(page, 'Prüfen', steps)) && ok;
  await page.click('#a2-next');
  await page.waitForFunction(() => { const p = window.__anon.app.preview; return p && !p.busy; });
  ok = (await stepCheck(page, 'Speichern', steps)) && ok;
  check('Kein Schlüssel-Knopf im Modus „Person A“', await page.isHidden('#btn-key'));
  await ackAll(page);
  const r = await exportWithAck(page, 'txt');
  check('Datei gespeichert (nach „bewusst stehen lassen“ der bekannten Restfunde)', !!r.dl, r.status);
  ok = (await stepCheck(page, 'Gespeichert', steps)) && ok;
  // Hinweis für die KI
  await ctx.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.click('#btn-kihint');
  const clip = await page.evaluate(() => navigator.clipboard.readText().catch(() => ''));
  check('„Hinweis für die KI kopieren“ kopiert den Satz passend zum Modus', /Person A/.test(clip) && /nur die Fehler/.test(clip), clip);
  check('In jedem Schritt genau ein Bildschirm und genau ein Hauptknopf', ok, steps.join(' → '));
  // Nächstes Dokument
  await page.click('#btn-next-doc');
  const rest = await page.evaluate(() => ({ screen: window.__anon.app.screen, doc: !!window.__anon.app.doc, result: !!window.__anon.app.result,
    mode: [...document.querySelectorAll('input[name=mode]')].some((x) => x.checked), text: document.body.innerText, paste: document.querySelector('#paste').value,
    status: document.querySelector('#load-status').textContent, overrides: Object.keys(window.__anon.app.state.overrides).length, answers: window.__anon.app.answers.size }));
  const leftover = ['Müller', 'Yılmaz', 'Kowalczyk', 'protokoll.txt'].filter((w) => rest.text.includes(w));
  check('„Nächstes Dokument“ führt zum Start und hinterlässt keinen Rest', rest.screen === 'start' && !rest.doc && !rest.result && !rest.mode && !rest.paste && !rest.status && !rest.overrides && !rest.answers && !leftover.length,
    `Bildschirm ${rest.screen}; Dokument ${rest.doc}; Antwort gewählt ${rest.mode}; Reste im Seitentext: ${leftover.join(', ') || 'keine'}`);
  check('Keine JavaScript-Fehler', !errors.length, errors.join(' | '));
  await ctx.close();
}
log('');

// ---------- 3. Durchlauf: zurückbauen ----------
log('## Durchlauf 3: zurückbauen (Datei und Schlüssel aus Durchlauf 1)');
{
  const { page, ctx, errors } = await newPage();
  const steps = [];
  let ok = await stepCheck(page, 'Start', steps);
  await page.click('#go-restore');
  ok = (await stepCheck(page, 'Dateien (leer)', steps)) && ok;
  check('„Weiter zum Prüfen“ ohne beide Dateien gesperrt', await page.$eval('#rb-btn-check', (b) => b.disabled));
  await page.setInputFiles('#rb-file', anonPath1);
  await page.waitForFunction(() => document.querySelector('#rb-file-status').textContent);
  check('… mit nur einer Datei weiter gesperrt', await page.$eval('#rb-btn-check', (b) => b.disabled));
  await page.setInputFiles('#rb-key', keyPath1);
  await page.waitForFunction(() => document.querySelector('#rb-key-status').textContent);
  ok = (await stepCheck(page, 'Dateien (geladen)', steps)) && ok;
  await page.click('#rb-btn-check');
  ok = (await stepCheck(page, 'Prüfen', steps)) && ok;
  await page.click('#r2-next');
  ok = (await stepCheck(page, 'Speichern', steps)) && ok;
  const dlP = page.waitForEvent('download');
  await page.click('#rb-btn-save');
  const dl = await dlP;
  const p = await saveDl(dl, 'kurse-zurueck.docx');
  ok = (await stepCheck(page, 'Gespeichert', steps)) && ok;
  const r3 = await page.textContent('#rb-ampel');
  check('Hinweis „Autor und Kommentar-Autoren kommen nicht zurück“ auf dem Speichern-Bildschirm', /Kommentar-Autoren/.test(r3));
  const JSZip = (await import('jszip')).default;
  const doc = await (await JSZip.loadAsync(fs.readFileSync(p))).file('word/document.xml').async('string');
  check('Echte Namen sind zurück', doc.includes('Kirchbichler') && doc.includes('Sonnleitner'));
  check('In jedem Schritt genau ein Bildschirm und genau ein Hauptknopf', ok, steps.join(' → '));
  await page.click('#rb-next-doc');
  check('„Nächstes Dokument“ führt zum Start', (await screenOf(page)) === 'start' && !(await page.evaluate(() => window.__anon.rb.file)));
  check('Keine JavaScript-Fehler', !errors.length, errors.join(' | '));
  await ctx.close();
}
log('');

// ---------- Sperren ----------
log('## Sperren halten das Speichern weiter auf');
{
  // a) offener Datei-Hinweis, b) offene Fragen, c) Schlusscheck-Fund (kurse.docx: Bilder-Hinweis, Fragen, Firmenname)
  const { page, ctx } = await newPage();
  await startAnon(page, 'person');
  await loadIn(page, path.join(fx, 'kurse.docx'));
  await goTo(page, 'a3');
  // Version 2.5.0: alle offenen Punkte (Bilder, Fragen, Schlusscheck-Funde) mit EINEM Häkchen; das Häkchen ist erst
  // wählbar, wenn die Bilderliste geöffnet wurde, und fällt bei jeder Änderung zurück
  await waitCheck(page);
  const pts = await savePoints(page);
  log(`- Offene Punkte: ${pts.join(' | ')}`);
  let r = await exportOnce(page, 'docx');
  check('Offene Punkte ohne Häkchen: Speichern blockiert', !r.dl && /blockiert/.test(r.status), r.status);
  check('Häkchen ist gesperrt, solange die Bilderliste nicht geöffnet wurde', await page.$eval('#ack-all', (b) => b.disabled));
  await ackImages(page);
  check('Nach dem Öffnen der Bilderliste ist das Häkchen wählbar', !(await page.$eval('#ack-all', (b) => b.disabled)));
  r = await exportOnce(page, 'docx');
  // Version 2.8.0 (angepasst, begründet): „Familienzentrum Sonnenblume“ (Firma aus den Dateiangaben) wird jetzt selbst als
  // Einrichtung gefunden und ersetzt; ein Schlusscheck-Fund entsteht deshalb nicht mehr. Es sperren die offenen Fragen.
  check('Offene Fragen blockieren weiter ohne Häkchen (Firmenname seit 2.8.0 ersetzt, kein Schlusscheck-Fund mehr)', !r.dl && /blockiert/.test(r.status) && pts.some((x) => /Fragen sind noch offen/.test(x)) && !pts.some((x) => /steht noch in/.test(x)), r.status);
  // Auch die anderen Wege sind gesperrt
  r = await exportOnce(page, 'txt');
  check('Offene Punkte blockieren auch „Als .txt speichern“', !r.dl && /blockiert/.test(r.status), r.status);
  await page.check('#ack-all');
  // Änderung der Treffer: das Häkchen fällt zurück
  await goTo(page, 'a2');
  await page.locator('#docview mark.hit.on').first().click();
  await goTo(page, 'a3');
  await waitCheck(page);
  check('Nach einer Änderung der Treffer fällt das Häkchen zurück', !(await page.isChecked('#ack-all')));
  r = await exportOnce(page, 'docx');
  check('… und Speichern ist wieder blockiert', !r.dl && /blockiert/.test(r.status), r.status);
  await page.check('#ack-all');
  r = await exportOnce(page, 'docx');
  check('Mit Häkchen wird gespeichert', !!r.dl, r.status);
  await ctx.close();
}
{
  // d) Schlüsseldatei nicht gesichert (auch nach einer Änderung der Treffer wieder gesperrt)
  const { page, ctx } = await newPage();
  await startAnon(page, 'reversible');
  await loadIn(page, path.join(fx, 'protokoll.txt'));
  await ackAll(page);
  let r = await exportOnce(page, 'docx');
  check('Fehlende Schlüsseldatei blockiert auch „Als .docx speichern“', !r.dl && /Schlüssel/.test(r.status), r.status);
  check('„2 Datei speichern“ gesperrt, solange der Schlüssel fehlt', await page.$eval('#btn-save', (b) => b.disabled));
  await saveKey(page);
  check('Nach dem Schlüssel ist „2 Datei speichern“ frei', !(await page.$eval('#btn-save', (b) => b.disabled)));
  await goTo(page, 'a2');
  await page.locator('#docview mark.hit.on').first().click(); // eine Änderung der Treffer
  await goTo(page, 'a3');
  check('Nach einer Änderung der Treffer ist der Schlüssel veraltet: „2 Datei speichern“ wieder gesperrt', await page.$eval('#btn-save', (b) => b.disabled));
  await ctx.close();
}
{
  // e) Rückbau-Auffälligkeiten: veränderter Platzhalter -> Bestätigung nötig; falsche Schlüsseldatei -> kein Weiter
  const { page, ctx } = await newPage();
  await startAnon(page, 'reversible');
  await loadIn(page, path.join(fx, 'protokoll.txt'));
  await ackAll(page);
  const kd = await saveKey(page);
  const kp = await saveDl(kd, 'prot-schluessel.json');
  const r = await exportWithAck(page, 'txt');
  const ap = await saveDl(r.dl, 'prot-anonym.txt');
  await ctx.close();
  const changed = fs.readFileSync(ap, 'utf8').replace(/Nachname ([A-Z])\b/, 'nachname $1'); // veränderter Platzhalter
  const cp = path.join(outDir, 'prot-veraendert.txt');
  fs.writeFileSync(cp, changed);
  const p2 = await newPage();
  await p2.page.click('#go-restore');
  await p2.page.setInputFiles('#rb-file', cp);
  await p2.page.waitForFunction(() => document.querySelector('#rb-file-status').textContent);
  await p2.page.setInputFiles('#rb-key', kp);
  await p2.page.waitForFunction(() => document.querySelector('#rb-key-status').textContent);
  await p2.page.click('#rb-btn-check');
  await rbConfirm(p2.page, false);
  const needs = await p2.page.evaluate(() => window.__anon.rb.plan.needsConfirm);
  check('Rückbau-Auffälligkeit verlangt Bestätigung: „Weiter“ gesperrt', needs && await p2.page.$eval('#r2-next', (b) => b.disabled));
  await p2.page.check('#rb-ack'); // EIN Häkchen (Version 2.5.0)
  check('Nach der Bestätigung ist „Weiter“ frei', !(await p2.page.$eval('#r2-next', (b) => b.disabled)));
  await p2.ctx.close();
  // falsche Schlüsseldatei: Text ohne einen einzigen passenden Platzhalter
  const wp = path.join(outDir, 'ohne-platzhalter.txt');
  fs.writeFileSync(wp, 'Ein Text ganz ohne Platzhalter.\n');
  const p3 = await newPage();
  await p3.page.click('#go-restore');
  await p3.page.setInputFiles('#rb-file', wp);
  await p3.page.waitForFunction(() => document.querySelector('#rb-file-status').textContent);
  await p3.page.setInputFiles('#rb-key', kp);
  await p3.page.waitForFunction(() => document.querySelector('#rb-key-status').textContent);
  await p3.page.click('#rb-btn-check');
  check('Schlüsseldatei passt nicht: „Weiter zum Speichern“ gesperrt, nichts wird erzeugt', await p3.page.$eval('#r2-next', (b) => b.disabled) && /passt nicht/.test(await p3.page.textContent('#rb-report')));
  await p3.ctx.close();
}
log('');

// ---------- Fragekarte, Tasten, Markieren ----------
log('## Fragekarte, Tasten J/N, Markieren');
{
  const { page, ctx } = await newPage();
  await startAnon(page, 'person');
  await loadIn(page, path.join(fx, 'kurse.docx'));
  // J/N wirken nicht außerhalb des Prüfen-Bildschirms
  const a0 = await page.evaluate(() => window.__anon.app.answers.size);
  await page.keyboard.press('j');
  check('Taste J wirkt nicht auf dem Bildschirm „Datei“', (await page.evaluate(() => window.__anon.app.answers.size)) === a0);
  await goTo(page, 'a2');
  // Version 2.5.0 (D.4): keine Frage mehr zu Wochentagen/Monaten (Regel b2); „Montag“ bleibt stehen und ist unmarkiert
  const qsAll = await page.evaluate(() => window.__anon.questions().map((q) => q.word || q.name || ''));
  const mon = await page.evaluate(() => { const r = window.__anon.app.result; return r.hits.filter((h) => r.fullText.slice(h.s, h.e) === 'Montag').map((h) => h.on); });
  check('Keine Frage zu „Montag“ (Regel b2), alle Vorkommen bleiben stehen', !qsAll.includes('Montag') && mon.length === 3 && mon.every((x) => !x), `Fragen zu: ${qsAll.join(', ')}`);
  // „Ja“ bei der ersten Frage zum Wort schaltet alle ihre Stellen an, „Nein“ (Taste N) wieder aus
  const q0 = await page.evaluate(() => { const q = window.__anon.questions().find((x) => x.kind === 'word'); return q ? q.id : null; });
  const st = (v) => page.evaluate((id) => { const q = window.__anon.questions().find((x) => x.id === id); return q.hits.map((h) => h.on); }, v);
  for (let i = 0; i < 30; i++) { const cur = await page.evaluate(() => { const qs = window.__anon.questions(); const i2 = qs.findIndex((q) => !window.__anon.app.answers.has(q.id)); return i2 >= 0 ? qs[i2].id : null; }); if (cur === q0) break; await page.click('#q-yes'); }
  await page.keyboard.press('j');
  const afterJ = await st(q0);
  check('Taste J (Ja) schaltet alle Stellen der Frage an', afterJ.every((x) => x), afterJ.join(','));
  for (let i = 0; i < 40 && !(await page.$('#q-again')); i++) await page.click('#q-yes'); // restliche Fragen beantworten
  await page.click('#q-again'); // „Fragen noch einmal zeigen“
  await page.keyboard.press('n');
  const afterN = await st(q0);
  check('Taste N schaltet die Stellen wieder aus', afterN.every((x) => !x), afterN.join(','));
  if (await page.isHidden('#entities')) await page.click('#tgl-entities');
  // J/N wirken nicht, wenn ein Eingabefeld den Fokus hat
  await page.click('.entity .menubtn');
  await page.focus('.emenu select');
  const ans1 = JSON.stringify([...await page.evaluate(() => [...window.__anon.app.answers])]);
  await page.keyboard.press('j');
  const ans2 = JSON.stringify([...await page.evaluate(() => [...window.__anon.app.answers])]);
  check('Taste J wirkt nicht, wenn ein Eingabefeld (Auswahlliste) den Fokus hat', ans1 === ans2);
  await ctx.close();
}
{
  // Von Hand markierter Name wird überall ersetzt (Antippen -> Knopf direkt daneben)
  const { page, ctx } = await newPage();
  await startAnon(page, 'person');
  // eingefügter Text (über „Stattdessen Text einfügen“) mit einem unbekannten Namen in drei Schreibweisen
  const PASTE = 'Protokoll der Sitzung.\nUchendu berichtet vom Projekt.\nDie Mail von Uchendu kam spät, Uchendus Vorschlag gilt.\nUCHENDU unterschreibt.';
  await page.click('#tgl-paste');
  await page.fill('#paste', PASTE);
  await page.click('#btn-text');
  await page.waitForFunction(() => /Gelesen/.test(document.querySelector('#load-status').textContent));
  await goTo(page, 'a2');
  const pos = await page.evaluate(() => {
    const walker = document.createTreeWalker(document.querySelector('#docview'), NodeFilter.SHOW_TEXT);
    let t;
    while ((t = walker.nextNode())) {
      const i = t.nodeValue.indexOf('Uchendu');
      if (i >= 0 && !t.parentElement.closest('mark')) {
        t.parentElement.scrollIntoView({ block: 'center' });
        const r = document.createRange(); r.setStart(t, i + 1); r.setEnd(t, i + 2);
        const b = r.getBoundingClientRect();
        return { x: b.left + b.width / 2, y: b.top + b.height / 2 };
      }
    }
    return null;
  });
  await page.mouse.click(pos.x, pos.y);
  await page.waitForSelector('#markbar:not([hidden])');
  const bar = await page.$eval('#markbar', (e) => { const r = e.getBoundingClientRect(); return { x: r.left, y: r.top }; });
  check('Knopf „Als Name markieren“ erscheint direkt neben der Stelle', Math.abs(bar.y - pos.y) < 80, `Abstand ${Math.round(bar.y - pos.y)} px`);
  await page.click('#btn-mark');
  const out = await page.evaluate(async () => (await window.__anon.buildOutput('txt')).text);
  const total = (PASTE.match(/uchendu/gi) || []).length;
  check('Von Hand markierter Name wird überall ersetzt (auch „Uchendus“, „UCHENDU“)', !/uchendu/i.test(out) && total === 4, `${total} Vorkommen im Original, ${(out.match(/uchendu/gi) || []).length} im Ergebnis`);
  await ctx.close();
}
log('');

// ---------- Zurück/Weiter ohne Verlust ----------
log('## Zurück und Weiter ohne Verlust');
{
  const { page, ctx } = await newPage();
  await startAnon(page, 'reversible');
  await loadIn(page, path.join(fx, 'protokoll.txt'));
  await goTo(page, 'a2');
  await page.evaluate(() => window.__anon.addManual('Uchendu'));
  await page.click('#q-no');
  const snap = () => page.evaluate(() => ({ mode: document.querySelector('input[name=mode]:checked') && document.querySelector('input[name=mode]:checked').value, doc: window.__anon.app.doc && window.__anon.app.doc.name,
    terms: window.__anon.app.state.manualTerms.join(','), answers: JSON.stringify([...window.__anon.app.answers]), overrides: JSON.stringify(window.__anon.app.state.overrides) }));
  const s1 = await snap();
  await goTo(page, 'a3');
  await goTo(page, 'a1');
  await page.click('#scr-a1 [data-back]');
  await page.click('#go-anon');
  await goTo(page, 'a3');
  const s2 = await snap();
  check('Antwort, Datei, Markierungen und Antworten bleiben über Zurück/Weiter erhalten', JSON.stringify(s1) === JSON.stringify(s2), `${s1.mode}, ${s1.doc}, markiert: ${s1.terms}, ${JSON.parse(s1.answers).length} Antwort(en)`);
  await ctx.close();
}
log('');

// ---------- Breiten ----------
log('## Breiten 390, 1280, 1366, 1920 px');
for (const w of [390, 1280, 1366, 1920]) {
  const { page, ctx } = await newPage({ width: w, height: 900 });
  const res = [];
  const shot = async (name) => {
    const sw = await page.evaluate(() => document.documentElement.scrollWidth);
    res.push(`${name} ${sw <= w ? 'ok' : 'WAAGRECHT ' + sw}`);
    await page.screenshot({ path: path.join(outDir, `${w}-${name}.png`), fullPage: true });
    return sw <= w;
  };
  let ok = await shot('start');
  await startAnon(page, 'reversible');
  await loadIn(page, path.join(fx, 'kurse.docx'));
  ok = (await shot('datei')) && ok;
  await goTo(page, 'a2');
  ok = (await shot('pruefen')) && ok;
  await goTo(page, 'a3');
  ok = (await shot('speichern')) && ok;
  await page.click('#scr-a3 [data-back]'); await page.click('#scr-a2 [data-back]'); await page.click('#scr-a1 [data-back]');
  await page.click('#go-restore');
  ok = (await shot('rueckbau')) && ok;
  const small = w === 390 ? await page.evaluate(() => [...document.querySelectorAll('button')].filter((b) => b.offsetParent && b.getBoundingClientRect().height < 36).map((b) => b.textContent.trim())) : [];
  check(`${w} px: kein waagrechtes Scrollen`, ok, res.join(', '));
  if (w === 390) check('390 px: alle sichtbaren Knöpfe mindestens 36 px hoch (Version 2.5.0: 36 px statt 44 px erlaubt)', !small.length, small.join(', '));
  if (w === 1280) {
    await page.click('#scr-r1 [data-back]'); await page.click('#go-anon'); await goTo(page, 'a2');
    const side = await page.evaluate(() => { window.scrollTo(0, 300); const r = document.querySelector('.side').getBoundingClientRect(); return { top: Math.round(r.top) }; });
    check('1280 px: rechte Spalte bleibt beim Scrollen stehen', side.top >= 0 && side.top < 200, `oben bei ${side.top} px nach 300 px Scrollen`);
    const scroll = await page.evaluate(() => { const v = document.querySelector('#docview'); return getComputedStyle(v).overflowY; });
    check('Dokumenttext ohne eigenen Scrollkasten', scroll === 'visible', `overflow-y: ${scroll}`);
    const tab = await page.evaluate(() => /(^|\n)Tabelle\n/.test(document.querySelector('#docview').innerText));
    check('Kein Wort „Tabelle“ vor den Absätzen; Word-Tabellen als Tabelle', !tab && await page.$$eval('#docview table.wtable tr', (r) => r.length) > 5);
  }
  await ctx.close();
}
log('');

// ---------- Zwei Downloads aus einem Klick ----------
log('## Zwei Downloads aus einem Klick (Messung)');
{
  const { page, ctx } = await newPage();
  const got = [];
  page.on('download', (d) => got.push(d.suggestedFilename()));
  await page.evaluate(() => {
    const b = document.createElement('button');
    b.id = 'two'; b.textContent = 'zwei';
    b.addEventListener('click', () => {
      for (const n of ['eins.txt', 'zwei.txt']) {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob(['x'])); a.download = n; document.body.append(a); a.click(); a.remove();
      }
    });
    document.body.append(b);
  });
  await page.click('#two');
  await page.waitForTimeout(3000);
  log(`- Headless-Chromium unter file:// lieferte ${got.length} von 2 Downloads (${got.join(', ')}).`);
  log('- Gewählt: zwei nummerierte Knöpfe („1 Schlüssel speichern“, „2 Datei speichern“, der zweite erst nach dem ersten aktiv). Grund: Edge/Chrome fragen bei mehreren Downloads aus einem Klick je nach Einstellung „Mehrere Dateien herunterladen?“ oder blockieren still; das zeigt der Headless-Test nicht und ist unter file:// am Firmen-PC nicht verlässlich vorhersagbar.');
  await ctx.close();
}
await browser.close();

const failed = checks.filter((c) => !c[1]);
log('');
log(`Prüfungen: ${checks.length - failed.length} von ${checks.length} bestanden${failed.length ? ' – FEHLER: ' + failed.map((c) => c[0]).join('; ') : ''}.`);
const external = requests.filter((u) => !/^(file|blob|data):/.test(u));
log(`Netzwerkanfragen außer lokalen Dateien: ${external.length}.`);
fs.writeFileSync(path.join(here, 'UI-REPORT.md'), report.join('\n') + '\n');
process.exit(failed.length ? 1 : 0);
