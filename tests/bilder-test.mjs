// Tests für Bilder und Bildbeschreibungen (Version 2.2) über die echte Oberfläche:
// Liste „Bilder ansehen“ (Vorschau, Fundort, Typ, Beschreibung, Platzhalter-Kacheln, verknüpft, SVG nur als Bild),
// Sperre (erst ansehen, dann abhaken), übrige Sperren unverändert, Vorschauen nach „Nächstes Dokument“ verworfen,
// Bildbeschreibungen in der Prüfansicht (gekennzeichnet, markierbar), Beweis „Namen nur in Bildbeschreibungen werden
// ersetzt“ (Zahlen vorher 2.1 / nachher), Kreislauf exakt, Doppellauf, PDF unverändert, Breiten, CSP, Netzwerk.
// Ergebnis: tests/BILDER-REPORT.md. Aufruf: node tests/bilder-test.mjs [index.html-der-Version-2.1]
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import JSZip from 'jszip';
import { startAnon, loadIn, goTo, ackAll, ackImages, exportOnce, exportWithAck, saveKey } from './ui-helpers.mjs';
import { BILDER_PEOPLE } from './make-bilder.mjs';

const { chromium } = createRequire('/opt/node22/lib/node_modules/')('playwright');
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const fx = path.join(here, 'fixtures');
const newHtml = path.join(root, 'index.html');
const oldHtml = process.argv[2] ? path.resolve(process.argv[2]) : null;
const outDir = path.join(here, 'out-bilder');
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });
const report = [];
const log = (s = '') => { report.push(s); console.log(s); };
const checks = [];
const check = (name, ok, detail = '') => { checks.push([name, ok]); log(`- ${ok ? 'OK' : 'FEHLER'}: ${name}${detail ? ' – ' + detail : ''}`); };
const browser = await chromium.launch();
const requests = [];
let seq = 0;
async function newPage(html = newHtml, viewport) {
  const ctx = await browser.newContext({ acceptDownloads: true, viewport: viewport || { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  page.on('request', (r) => requests.push(r.url()));
  page.on('dialog', (d) => d.accept());
  await page.goto('file://' + html);
  return { page, ctx };
}
const WORDS = Object.values(BILDER_PEOPLE).flatMap((p) => p.words);
const FILES = [['bilder-word.docx', 'docx'], ['bilder-excel.xlsx', 'xlsx']];
// Alle Teile einer ZIP-Ausgabe als Text (XML/VML direkt, Binärteile als UTF-8 und UTF-16)
async function partTexts(bytes) {
  const z = await JSZip.loadAsync(bytes);
  const out = [];
  for (const n of Object.keys(z.files).filter((x) => !z.files[x].dir).sort()) {
    const b = await z.file(n).async('nodebuffer');
    out.push([n, b.toString('utf8') + '\n' + b.toString('utf16le')]);
  }
  return out;
}
async function nameHits(bytes) {
  const hits = [];
  for (const [n, t] of await partTexts(bytes)) for (const w of WORDS) { const c = t.split(w).length - 1; if (c) hits.push(`${w} in ${n} (${c}×)`); }
  return hits;
}
// Ausgabe über denselben Weg wie der Export (buildOutput), ohne Oberfläche – auch für die Version 2.1
async function direct(html, file, mode, fmt) {
  const { page, ctx } = await newPage(html);
  const bytes = [...fs.readFileSync(path.join(fx, file))];
  const r = await page.evaluate(async ([b, f, m, fm]) => {
    const A = window.__anon;
    A.app.state.settings.mode = m;
    await A.openBytes(new Uint8Array(b), f);
    const o = await A.buildOutput(fm);
    return o.zip ? Array.from(o.bytes) : o.text;
  }, [bytes, file, mode, fmt]);
  await ctx.close();
  return typeof r === 'string' ? r : Buffer.from(r);
}
// Inhalt eines Word/Excel-Pakets für den Kreislauf: Texte und Bildbeschreibungen je Teil
async function contentSig(bytes) {
  const z = await JSZip.loadAsync(bytes);
  const sig = {};
  for (const n of Object.keys(z.files).filter((x) => !z.files[x].dir && /\.(xml|vml)$/i.test(x) && !/^docProps\/custom/.test(x)).sort()) {
    const s = await z.file(n).async('string');
    const texts = [...s.matchAll(/<(?:w:t|t|a:t)(?:\s[^>]*)?>([^<]*)</g)].map((m) => m[1]);
    const descs = [...s.matchAll(/\b(descr|title|alt|o:title)="([^"]*)"/g)].map((m) => `${m[1]}=${m[2]}`);
    if (texts.length || descs.length) sig[n] = { texts, descs };
  }
  return sig;
}

log('# Bilder und Bildbeschreibungen (Version 2.2): Tests');
log('');
log('Chromium headless, Start per file://. Testdokumente: tests/make-bilder.mjs (alle Namen erfunden):');
log(`- „${BILDER_PEOPLE.nurAlt.full}“ steht NUR im Alt-Text eines Bildes, „${BILDER_PEOPLE.nurTitel.full}“ NUR im Titel eines Bildes (Word: in der Kopfzeile), „${BILDER_PEOPLE.imText.full}“ im Text.`);
log('- Bilder: PNG im Text, GIF in einer Tabelle (Excel: Bilder an Zellen), JPEG in der Kopfzeile (Excel: Bild an Zelle B4, GIF in der Kopf-/Fußzeile), EMF (nicht anzeigbar), verknüpftes Bild (Pfad außerhalb der Datei), SVG mit PNG-Ersatzbild.');
log('');

// ---------- CSP ----------
log('## Content-Security-Policy');
{
  const html = fs.readFileSync(newHtml, 'utf8');
  const csp = (html.match(/http-equiv="Content-Security-Policy" content="([^"]*)"/) || [])[1] || '';
  const img = (csp.match(/img-src [^;]*/) || [''])[0];
  check('img-src erlaubt nur blob: (lokale Vorschauen), sonst nichts', img === 'img-src blob:', img);
  check('Alle übrigen Regeln unverändert streng (default-src, connect-src, frame-src, object-src, worker-src: none)', ["default-src 'none'", "connect-src 'none'", "frame-src 'none'", "object-src 'none'", "worker-src 'none'", "media-src 'none'", "font-src 'none'"].every((x) => csp.includes(x)) && !/unsafe-|data:|https?:/.test(csp));
}
log('');

// ---------- Ziel (a): Namen nur in Bildbeschreibungen ----------
log('## Ziel (a): Namen, die nur in Bildbeschreibungen stehen, sind im Export ersetzt');
log('Ausgabedatei entpackt, ALLE Teile (XML, VML, Bilder, Verweise) nach den Testnamen durchsucht (Wortteile einzeln).');
log('');
log('| Datei | Modus | Version 2.1: Funde | Version 2.2: Funde |');
log('|---|---|---|---|');
const before = {};
for (const [file, fmt] of FILES) {
  for (const mode of ['person', 'reversible']) {
    const nNew = await nameHits(await direct(newHtml, file, mode, fmt));
    const nOld = oldHtml ? await nameHits(await direct(oldHtml, file, mode, fmt)) : null;
    before[file + mode] = nOld;
    log(`| ${file} | ${mode === 'person' ? '„Person A“' : 'rückbaufähig'} | ${nOld ? (nOld.length ? nOld.join('; ') : '0') : 'nicht geprüft'} | ${nNew.length ? nNew.join('; ') : '0'} |`);
    check(`${file}, ${mode}: keine Testnamen mehr in irgendeinem Teil der Ausgabe`, nNew.length === 0);
  }
}
log('');

// ---------- Liste, Kacheln, Sperre ----------
log('## Ziel (b): Jedes Bild vor dem Speichern sehen – Liste, Kacheln, Sperre');
for (const [file, fmt] of FILES) {
  const prog = fmt === 'xlsx' ? 'Excel' : 'Word';
  log(`### ${file}`);
  const { page, ctx } = await newPage();
  await startAnon(page, 'person');
  await loadIn(page, path.join(fx, file));
  await goTo(page, 'a3');
  const row = await page.$eval('#ampel li.images', (li) => ({ text: li.innerText.replace(/\s+/g, ' '), cls: li.className }));
  const n = await page.evaluate(() => window.__anon.app.doc.images.length);
  check('Ampel-Zeile „Bilder“ mit Anzahl und Knopf „Bilder ansehen“', new RegExp(`${n} Bilder im Dokument`).test(row.text) && /Bilder ansehen/.test(row.text) && /\bwarn\b/.test(row.cls), `„${n} Bilder im Dokument“`);
  check('Hinweis „Das Tool lässt Bilder unverändert …“ steht in der Zeile', row.text.includes('Das Tool lässt Bilder unverändert. Steht auf einem Bild ein Name oder ein Logo, entferne es vorher in Word bzw. Excel.'));
  check('Abhaken ist gesperrt, bevor die Liste geöffnet wurde', await page.isDisabled('#ack-images'));
  // Übrige Hinweise abhaken (Sperre wie bisher), Bilder bewusst noch nicht
  await ackAll(page, { images: false });
  let r = await exportOnce(page, fmt);
  check('Speichern blockiert, solange die Bilder nicht angesehen sind', !r.dl && /Bilder ansehen/.test(r.status), r.status);
  // Liste öffnen (auf derselben Seite)
  await page.click('#btn-images');
  await page.waitForSelector('#img-list');
  await page.waitForFunction(() => [...document.querySelectorAll('#img-list img.thumb')].length >= document.querySelectorAll('#img-list li').length - 3 && [...document.querySelectorAll('#img-list img.thumb')].every((i) => i.complete), null, { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(300);
  const tiles = await page.$$eval('#img-list li.imgtile', (els) => els.map((e) => {
    const img = e.querySelector('img');
    return { nr: e.dataset.nr, type: e.dataset.type, linked: e.dataset.linked === '1', text: e.innerText.replace(/\s+/g, ' '), img: img ? { src: img.getAttribute('src'), w: img.naturalWidth, ok: img.complete && img.naturalWidth > 0 } : null };
  }));
  check('Liste öffnet auf derselben Seite (kein neues Fenster), eine Kachel je Bild', ctx.pages().length === 1 && tiles.length === n, `${tiles.length} Kacheln`);
  for (const t of tiles) log(`  - Kachel ${t.nr}: ${t.text}${t.img ? ` [Vorschau ${t.img.ok ? 'angezeigt, ' + t.img.w + ' px breit' : 'NICHT angezeigt'}, Quelle ${t.img.src.slice(0, 5)}…]` : ' [Platzhalter]'}`);
  const shown = tiles.filter((t) => ['PNG', 'JPEG', 'GIF', 'SVG'].includes(t.type) && !t.linked);
  check('PNG, JPEG, GIF und SVG werden als kleine Vorschau gezeigt (nur blob:-Adressen)', shown.length >= 4 && shown.every((t) => t.img && t.img.ok && t.img.src.startsWith('blob:')), shown.map((t) => t.type).join(', '));
  const emf = tiles.find((t) => t.type === 'EMF');
  check('EMF: Platzhalter-Kachel mit Typ und „Kann hier nicht angezeigt werden.“', !!emf && !emf.img && emf.text.includes('EMF') && emf.text.includes(`Kann hier nicht angezeigt werden. Bitte in ${prog} ansehen.`), emf && emf.text.slice(0, 90));
  const lk = tiles.find((t) => t.linked);
  check('Verknüpftes Bild: eigene Kachel „verknüpft, nicht in der Datei“, Pfad wird nicht geladen', !!lk && !lk.img && lk.text.includes('verknüpft, nicht in der Datei') && !requests.some((u) => /Ablage|lageplan/i.test(u)), lk && lk.text.slice(0, 80));
  const svgInList = await page.$$eval('#img-list svg', (e) => e.length);
  const svgTile = tiles.find((t) => t.type === 'SVG');
  check('SVG nie als Markup eingebettet: kein <svg> in der Liste, SVG nur als <img>', svgInList === 0 && !!svgTile && !!svgTile.img);
  const altTile = tiles.find((t) => t.text.includes(BILDER_PEOPLE.nurAlt.full));
  const titleTile = tiles.find((t) => t.text.includes(BILDER_PEOPLE.nurTitel.full));
  check('Fundort in einfacher Sprache und Beschreibung (Alt-Text, Titel) je Bild', !!altTile && /Beschreibung \(Alt-Text\)/.test(altTile.text) && !!titleTile && /Titel:/.test(titleTile.text)
    && tiles.every((t) => /Fundort: \S/.test(t.text)), [altTile, titleTile].map((t) => t && (t.text.match(/Fundort: [^·]*?(?= Beschreibung| Titel| Keine| Die Beschreibung|$)/) || [''])[0]).join(' | '));
  if (fmt === 'docx') check('Word: Fundorte Text („im Text bei …“), Tabelle, Kopfzeile', ['im Text bei „', 'Tabelle bei „', 'Kopfzeile bei „'].every((x) => tiles.some((t) => t.text.includes(x))));
  else check('Excel: Fundorte Blattname mit Zelle und Kopf-/Fußzeile', ['Blatt „Teilnehmer“, Zelle A4', 'Kopf-/Fußzeile, Blatt „Teilnehmer“'].every((x) => tiles.some((t) => t.text.includes(x))));
  // Größer anzeigen (auf derselben Seite), z. B. um einen Namen auf einem Scan zu lesen
  const small = await page.$eval('#img-list li[data-nr="1"] img.thumb', (i) => i.getBoundingClientRect().width);
  await page.click('#img-list li[data-nr="1"] button.zoom');
  const large = await page.$eval('#img-list li[data-nr="1"] img.thumb', (i) => i.getBoundingClientRect().width);
  check('„Größer anzeigen“ vergrößert die Vorschau auf derselben Seite', large > small * 2 && ctx.pages().length === 1, `${Math.round(small)} → ${Math.round(large)} px`);
  await page.click('#img-list li[data-nr="1"] button.zoom');
  check('Nach dem Öffnen ist Abhaken möglich; Speichern bleibt bis zum Haken blockiert', !(await page.isDisabled('#ack-images')) && !(await exportOnce(page, fmt)).dl);
  // Übrige Sperren unverändert: Datei-Hinweis wieder abwählen
  await page.check('#ack-images');
  const warnBox = await page.$('#ampel .docwarn input[type=checkbox]:checked');
  if (warnBox) {
    await warnBox.click();
    r = await exportOnce(page, fmt);
    check('Übrige Sperren unverändert: ein nicht abgehakter Datei-Hinweis blockiert weiterhin', !r.dl && /alle Hinweise/.test(r.status), r.status);
    await ackAll(page);
  }
  // Vorschauen vor dem Verwerfen laden lassen (Kontrolle), dann speichern
  const urls = await page.evaluate(() => [...window.__anon.app.imageUrls.values()]);
  const probe = (u) => page.evaluate((x) => new Promise((res) => { const i = new Image(); i.onload = () => res('geladen'); i.onerror = () => res('weg'); i.src = x; }), u);
  const ctrl = await probe(urls[0]);
  r = await exportWithAck(page, fmt);
  check('Mit geöffneter Liste und Haken wird gespeichert', !!r.dl, r.status);
  if (r.dl) {
    const p = path.join(outDir, `${++seq}-${r.dl.suggestedFilename()}`);
    await r.dl.saveAs(p);
    const hits = await nameHits(fs.readFileSync(p));
    check('Gespeicherte Datei (über die Oberfläche): keine Testnamen in allen Teilen', hits.length === 0, hits.join('; '));
    const orig = await JSZip.loadAsync(fs.readFileSync(path.join(fx, file)));
    const out = await JSZip.loadAsync(fs.readFileSync(p));
    const media = Object.keys(orig.files).filter((x) => /\/media\//.test(x));
    let same = 0;
    for (const m of media) if (out.file(m) && Buffer.compare(await orig.file(m).async('nodebuffer'), await out.file(m).async('nodebuffer')) === 0) same++;
    check('Bildinhalte unverändert (Bilder ohne Bildangaben byte-gleich zum Original)', same === media.length, `${same} von ${media.length} Bilddateien byte-gleich`);
  }
  // „Nächstes Dokument“: Vorschauen verworfen
  await page.click('#btn-next-doc');
  const after = await page.evaluate(() => ({ urls: window.__anon.app.imageUrls.size, doc: window.__anon.app.doc, list: !!document.querySelector('#img-list'), imgs: document.querySelectorAll('img').length }));
  const gone = await Promise.all(urls.map(probe));
  check('Nach „Nächstes Dokument“: keine Vorschau mehr im Speicher (blob:-Adressen freigegeben, keine Bilder auf der Seite)', ctrl === 'geladen' && gone.every((g) => g === 'weg') && after.urls === 0 && after.doc === null && !after.list && after.imgs === 0,
    `vorher ladbar: ${ctrl}; nachher ${gone.filter((g) => g === 'weg').length} von ${urls.length} Adressen ungültig`);
  await ctx.close();
}
log('');

// ---------- Prüfansicht ----------
log('## Bildbeschreibungen in der Prüfansicht');
{
  const { page, ctx } = await newPage();
  await startAnon(page, 'person');
  await loadIn(page, path.join(fx, 'bilder-word.docx'));
  await goTo(page, 'a2');
  const boxes = await page.$$eval('#docview .unit', (els) => els.filter((e) => /Bildbeschreibung/.test(e.textContent)).map((e) => ({ note: e.querySelector('.cellref') && e.querySelector('.cellref').textContent, marks: [...e.querySelectorAll('mark.hit.on')].map((m) => m.textContent) })));
  const section = await page.$$eval('#docview h3.section-label', (els) => els.map((e) => e.textContent));
  check('Eigene Textabschnitte, gekennzeichnet als „Bildbeschreibung“', boxes.length === 4 && section.some((s) => /^Bildbeschreibungen/.test(s)), boxes.map((b) => b.note).join(' | '));
  check('Namen in Bildbeschreibungen werden erkannt und markiert', boxes.some((b) => b.marks.join(' ').includes('Sandmann')) && boxes.some((b) => b.marks.join(' ').includes('Kleinschmidt')), boxes.map((b) => b.marks.join('+')).filter(Boolean).join(' | '));
  // Markierbar: ein Wort einer Bildbeschreibung von Hand als Name markieren (wie ein Mensch: Klick ins Wort)
  const pos = await page.evaluate(() => {
    const unit = [...document.querySelectorAll('#docview .unit')].find((e) => /Abteilungszeichen/.test(e.textContent) && /Bildbeschreibung/.test(e.textContent));
    const walker = document.createTreeWalker(unit.querySelector('.utext'), NodeFilter.SHOW_TEXT);
    let t;
    while ((t = walker.nextNode())) {
      const i = t.nodeValue.indexOf('Abteilungszeichen');
      if (i >= 0) { t.parentElement.scrollIntoView({ block: 'center' }); const r = document.createRange(); r.setStart(t, i + 2); r.setEnd(t, i + 3); const b = r.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; }
    }
    return null;
  });
  await page.mouse.click(pos.x, pos.y);
  await page.waitForSelector('#markbar:not([hidden])');
  await page.click('#btn-mark');
  const out = await page.evaluate(async () => Array.from((await window.__anon.buildOutput('docx')).bytes));
  const doc = await (await JSZip.loadAsync(Buffer.from(out))).file('word/document.xml').async('string');
  check('Von Hand markiertes Wort in einer Bildbeschreibung wird im Export ersetzt (auch im Attribut descr)', !doc.includes('Abteilungszeichen') && /descr="Person [A-Z]"/.test(doc), (doc.match(/descr="[^"]*"/g) || []).filter((x, i, a) => a.indexOf(x) === i).join(', '));
  await ctx.close();
}
{
  // Name steht im Text UND im Alt-Text (kurse.docx: „Marta Kowalski“). Nur der Treffer im Alt-Text wird ausgeschaltet
  // (Klick auf die Markierung): Der Schlusscheck meldet ihn mit Fundstelle. (Wird der EINZIGE Treffer eines Namens
  // ausgeschaltet, gilt das wie im übrigen Text als bewusste Entscheidung.)
  const { page, ctx } = await newPage();
  await startAnon(page, 'person');
  await loadIn(page, path.join(fx, 'kurse.docx'));
  await goTo(page, 'a2');
  const markSel = await page.evaluateHandle(() => [...document.querySelectorAll('#docview .unit')].filter((e) => /Bildbeschreibung/.test(e.textContent))
    .flatMap((e) => [...e.querySelectorAll('mark.hit.on')]).find((m) => /Kowalski/.test(m.textContent)));
  await markSel.asElement().scrollIntoViewIfNeeded();
  await markSel.asElement().click();
  await goTo(page, 'a3');
  const leaks = await page.$$eval('#leaks li', (els) => els.map((e) => e.textContent.replace(/\s+/g, ' ')));
  check('Treffer nur in der Bildbeschreibung ausgeschaltet (Name sonst im Text ersetzt): Schlusscheck meldet ihn mit Fundstelle', leaks.some((l) => /Kowalski/.test(l)), leaks.slice(0, 2).join(' | '));
  await ctx.close();
}
log('');

// ---------- Kreislauf und Doppellauf ----------
log('## Kreislauf (rückbaufähig) mit Namen in Bildbeschreibungen');
async function anonymizeReversible(file, fmt) {
  const dir = path.join(outDir, `k${++seq}`);
  fs.mkdirSync(dir);
  const { page, ctx } = await newPage();
  await startAnon(page, 'reversible');
  await loadIn(page, path.join(fx, file));
  await ackAll(page);
  const kd = await saveKey(page);
  const key = path.join(dir, kd.suggestedFilename());
  await kd.saveAs(key);
  const r = await exportWithAck(page, fmt);
  const anon = path.join(dir, r.dl.suggestedFilename());
  await r.dl.saveAs(anon);
  await ctx.close();
  return { anon, key };
}
async function restore(file, key) {
  const { page, ctx } = await newPage();
  await page.click('#go-restore');
  await page.setInputFiles('#rb-file', file);
  await page.waitForFunction(() => document.querySelector('#rb-file-status').textContent);
  await page.setInputFiles('#rb-key', key);
  await page.waitForFunction(() => document.querySelector('#rb-key-status').textContent);
  await page.click('#rb-btn-check');
  if (await page.$('#rb-kennung-ack')) await page.check('#rb-kennung-ack');
  if (await page.$('#rb-confirm')) await page.check('#rb-confirm');
  await page.click('#r2-next');
  const dlP = page.waitForEvent('download');
  await page.click('#rb-btn-save');
  const dl = await dlP;
  const p = path.join(outDir, `w${++seq}-${dl.suggestedFilename()}`);
  await dl.saveAs(p);
  await ctx.close();
  return fs.readFileSync(p);
}
for (const [file, fmt] of [...FILES, ['bilder-word.docx', 'txt'], ['bilder-excel.xlsx', 'txt']]) {
  const a = await anonymizeReversible(file, fmt);
  const back = await restore(a.anon, a.key);
  if (fmt === 'txt') {
    const anonTxt = fs.readFileSync(a.anon, 'utf8');
    const backTxt = back.toString('utf8');
    const alts = backTxt.split('\n').filter((l) => /^\[Bildbeschreibung/.test(l));
    check(`${file} → .txt: Rückbau setzt die Namen in den Bildbeschreibungs-Zeilen exakt zurück`, WORDS.slice(0, 4).every((w) => backTxt.includes(w)) && !WORDS.slice(0, 4).some((w) => anonTxt.includes(w)) && alts.some((l) => l.includes(BILDER_PEOPLE.nurAlt.full)), alts.slice(0, 2).join(' | '));
  } else {
    const so = await contentSig(fs.readFileSync(path.join(fx, file)));
    const sb = await contentSig(back);
    const diff = Object.keys(so).filter((k) => JSON.stringify(so[k]) !== JSON.stringify(sb[k]));
    const anonHits = await nameHits(fs.readFileSync(a.anon));
    const nDesc = Object.values(so).reduce((s, v) => s + v.descs.length, 0);
    const nText = Object.values(so).reduce((s, v) => s + v.texts.length, 0);
    check(`${file}: Kreislauf exakt (alle Texte und alle Bildbeschreibungen wie im Original)`, diff.length === 0 && anonHits.length === 0, `${nText} Textstücke, ${nDesc} Beschreibungs-Attribute geprüft${diff.length ? '; abweichend: ' + diff.join(', ') : ''}`);
  }
}
log('');
log('## Doppellauf');
for (const [file, fmt] of FILES) {
  const x = await direct(newHtml, file, 'person', fmt);
  const y = await direct(newHtml, file, 'person', fmt);
  const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
  check(`${file}: zwei Läufe („Person A“) byte-gleich`, sha(x) === sha(y), sha(x).slice(0, 16));
  const p = await direct(newHtml, file, 'reversible', fmt);
  const q = await direct(newHtml, file, 'reversible', fmt);
  const strip = async (b) => JSON.stringify(await contentSig(b));
  check(`${file}: zwei Läufe (rückbaufähig) inhaltlich gleich (Kennung ausgenommen)`, (await strip(p)) === (await strip(q)));
}
log('');

// ---------- PDF unverändert ----------
log('## PDF-Eingabe unverändert');
{
  const { page, ctx } = await newPage();
  await startAnon(page, 'person');
  await loadIn(page, path.join(fx, 'protokoll.pdf'));
  await goTo(page, 'a3');
  const t = await page.$eval('#ampel', (e) => e.innerText);
  check('PDF: Hinweis „Bilder bleiben nicht erhalten“ wie bisher, keine Zeile „Bilder“', /Originallayout \(Spalten, Tabellen, Bilder\) bleibt NICHT erhalten/.test(t) && !(await page.$('#ampel li.images')));
  await ctx.close();
}
log('');

// ---------- Breiten ----------
log('## Breiten (Liste geöffnet)');
for (const w of [390, 1280, 1920]) {
  const { page, ctx } = await newPage(newHtml, { width: w, height: 900 });
  await startAnon(page, 'person');
  await loadIn(page, path.join(fx, 'bilder-word.docx'));
  await goTo(page, 'a3');
  await page.click('#btn-images');
  await page.waitForSelector('#img-list');
  await page.waitForTimeout(400);
  const m = await page.evaluate(() => {
    const tiles = [...document.querySelectorAll('#img-list li')].map((e) => e.getBoundingClientRect());
    return { scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth, right: Math.max(...tiles.map((r) => r.right)), left: Math.min(...tiles.map((r) => r.left)), n: tiles.length };
  });
  await page.$eval('#ampel li.images', (e) => e.scrollIntoView());
  await page.screenshot({ path: path.join(outDir, `bilder-${w}.png`), fullPage: false });
  check(`${w} px: kein waagrechtes Scrollen, alle Kacheln im Bild`, m.scroll <= m.client && m.right <= m.client && m.left >= 0, `Seite ${m.scroll}/${m.client} px, Kacheln ${Math.round(m.left)}–${Math.round(m.right)} px`);
  await ctx.close();
}
await browser.close();

const failed = checks.filter((c) => !c[1]);
log('');
log(`Prüfungen: ${checks.length - failed.length} von ${checks.length} bestanden${failed.length ? ' – FEHLER: ' + failed.map((c) => c[0]).join('; ') : ''}.`);
log(`Netzwerkanfragen außer lokalen Dateien: ${requests.filter((u) => !/^(file|blob|data):/.test(u)).length}.`);
fs.writeFileSync(path.join(here, 'BILDER-REPORT.md'), report.join('\n') + '\n');
process.exit(failed.length ? 1 : 0);
