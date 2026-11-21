// Gemeinsame Hilfen: führen die Tests über die echte Oberfläche (Version 2: ein Bildschirm pro Schritt).
// Jede Hilfe klickt die sichtbaren Knöpfe wie ein Mensch; nur Zustände werden über window.__anon gelesen.

export const screenOf = (page) => page.evaluate(() => window.__anon.app.screen);

// Start -> „Dokument anonymisieren“ -> Antwort wählen (Modus)
export async function startAnon(page, mode = 'person') {
  if ((await screenOf(page)) === 'start') await page.click('#go-anon');
  if (mode === 'name') {
    if (await page.isHidden('#advanced')) await page.click('#tgl-adv');
  }
  await page.check(`input[name=mode][value="${mode}"]`);
}
// Datei im Bildschirm „Datei“ laden; liefert die Statuszeile
export async function loadIn(page, file, timeout = 120000) {
  await page.evaluate(() => { document.querySelector('#load-status').textContent = ''; });
  await page.setInputFiles('#file', file);
  await page.waitForFunction(() => /Gelesen|zu groß|nicht|kein|Fehler|PDF enthält/.test(document.querySelector('#load-status').textContent), null, { timeout });
  return page.textContent('#load-status');
}
// Zu einem Bildschirm des Anonymisier-Wegs gehen (nur über Weiter/Zurück)
export async function goTo(page, target) {
  const order = ['a1', 'a2', 'a3'];
  for (let i = 0; i < 6; i++) {
    const cur = await screenOf(page);
    if (cur === target) break;
    const a = order.indexOf(cur);
    const b = order.indexOf(target);
    if (a < 0 || b < 0) throw new Error(`goTo: ${cur} -> ${target} nicht möglich`);
    if (b > a) await page.click(`#${cur}-next`); else await page.click(`#scr-${cur} [data-back]`);
  }
  if (target === 'a3') await waitPreview(page);
}
export async function waitPreview(page) {
  await page.waitForFunction(() => { const p = window.__anon.app.preview; return p && !p.busy; }, null, { timeout: 600000 });
}
// Version 2.5.0: offene Punkte auf dem Speichern-Bildschirm mit EINEM Häkchen bestätigen. Gibt es Bilder, wird vorher
// die Bilderliste geöffnet (sonst ist das Häkchen nicht wählbar). questions = false: nichts bestätigen (Sperre prüfen).
export async function ackAll(page, { questions = true, images = true } = {}) {
  await goTo(page, 'a3');
  if (!(await page.$('#ack-all'))) return ackAllOld(page, { questions, images });
  if (images) await ackImages(page);
  if (questions) await ackPoints(page);
}
// Ältere Versionen (bis 2.4.1, für Vergleiche vorher/nachher): je Hinweis, Fragen und Bilder einzeln abhaken
async function ackAllOld(page, { questions, images }) {
  for (let i = 0; i < 50; i++) {
    const box = await page.$('#ampel .docwarn input[type=checkbox]:not(:checked)');
    if (!box) break;
    await box.click();
  }
  if (questions && await page.$('#ack-questions')) { if (!(await page.isChecked('#ack-questions'))) await page.check('#ack-questions'); }
  if (images && await page.$('#ack-images')) {
    if (await page.isDisabled('#ack-images')) { await page.click('#btn-images'); await page.waitForSelector('#img-list'); }
    if (!(await page.isChecked('#ack-images'))) await page.check('#ack-images');
  }
}
// Schlusscheck abwarten, dann das eine Häkchen setzen (falls offene Punkte da sind)
export async function ackPoints(page) {
  await waitCheck(page);
  if (await page.isVisible('#ack-all-row') && !(await page.isDisabled('#ack-all')) && !(await page.isChecked('#ack-all'))) await page.check('#ack-all');
}
export async function waitCheck(page) {
  await page.waitForFunction(() => { const p = window.__anon.app.preview; return p && !p.busy; }, null, { timeout: 600000 });
}
// Bilderliste öffnen (wie ein Mensch); danach ist das Häkchen wählbar
export async function ackImages(page) {
  if (!(await page.$('#ack-all'))) { await ackAllOld(page, { questions: false, images: true }); return !!(await page.$('#ack-images')); }
  if (!(await page.$('#btn-images'))) return false;
  if (!(await page.$('#img-list'))) {
    await page.click('#btn-images');
    await page.waitForSelector('#img-list');
  }
  return true;
}
// Offene Punkte auf dem Speichern-Bildschirm (Text je Zeile)
export const savePoints = (page) => page.$$eval('#points > li', (l) => l.map((x) => x.innerText.replace(/\s+/g, ' ').trim()));
// Knopf für ein Format auf dem Speichern-Bildschirm: Hauptknopf, wenn es das Hauptformat ist, sonst „Andere Wege“
export async function formatButton(page, fmt) {
  const main = await page.$eval('#btn-save', (b) => b.dataset.format);
  if (fmt === main) return '#btn-save';
  if (!(await page.$eval('details.otherways', (d) => d.open))) await page.click('details.otherways > summary');
  return fmt === 'copy' ? '#btn-copy' : `#btn-${fmt}`;
}
// Rückbaufähig: zuerst „1 Schlüssel speichern“
export async function saveKey(page) {
  const dlP = page.waitForEvent('download', { timeout: 60000 });
  await page.click('#btn-key');
  return dlP;
}
// Einmal speichern; Status und Download zurückgeben
export async function exportOnce(page, fmt) {
  await goTo(page, 'a3');
  const btn = await formatButton(page, fmt);
  await page.evaluate(() => { document.querySelector('#export-status').textContent = ''; });
  const dlP = page.waitForEvent('download', { timeout: 600000 }).catch(() => null);
  await page.click(btn);
  await page.waitForFunction(() => { const t = document.querySelector('#export-status').textContent; return t && !/^Erzeuge/.test(t); }, null, { timeout: 600000 });
  const status = await page.textContent('#export-status');
  const dl = /Gespeichert/.test(status) ? await dlP : null;
  return { dl, status };
}
// Speichern; blockiert der Schlusscheck (oder ein offener Punkt), Fundstellen festhalten, das eine Häkchen setzen,
// erneut speichern
export async function exportWithAck(page, fmt) {
  // Version 2.5.0: Schlusscheck-Funde stehen als rote offene Punkte da; sie gelten als „gemeldet“, auch wenn das eine
  // Häkchen schon gesetzt war (dann wird ohne erneute Sperre gespeichert)
  let shown = [];
  if (await page.$('#ack-all')) { await goTo(page, 'a3'); await waitCheck(page); shown = await page.$$eval('#points > li.bad', (els) => els.map((e) => e.innerText.replace(/\s+/g, ' ').trim())); }
  let { dl, status } = await exportOnce(page, fmt);
  let blocked = null;
  if (!dl && /blockiert|abhaken/.test(status)) {
    const neu = !!(await page.$('#ack-all'));
    blocked = { status, items: await page.$$eval(neu ? '#points > li.bad' : '#leaks li', (els) => els.map((e) => e.innerText.replace(/\s+/g, ' ').trim())) };
    await page.check(neu ? '#ack-all' : '#leak-ack');
    ({ dl, status } = await exportOnce(page, fmt));
  } else if (shown.length) blocked = { status: 'Schlusscheck-Funde mit dem Häkchen bestätigt', items: shown };
  return { dl, status, blocked };
}
// Sichtbare Hauptknöpfe (für den Beleg „genau ein Hauptknopf“)
export const visiblePrimaries = (page) => page.$$eval('button.primary, .bigcard.primary', (els) => els.filter((e) => e.offsetParent !== null && !e.closest('[hidden]')).map((e) => e.textContent.trim()));
export const visibleScreens = (page) => page.$$eval('.screen', (els) => els.filter((e) => !e.hidden).map((e) => e.dataset.screen));
// Rückbau (Version 2.5.0): Schritt „Prüfen“ abwarten (Schlusscheck nach dem Rückbau läuft dort), Reste und
// Fundstellen festhalten, dann das EINE Häkchen setzen (confirm = false: nicht bestätigen)
export async function rbConfirm(page, confirm = true) {
  if (!(await page.$('#scr-r2 #rb-report'))) return {};
  if (await page.evaluate(() => !('left' in window.__anon.rb))) { // ältere Versionen: Einzel-Häkchen
    const rests = await page.$$eval('#rb-rests li strong', (l) => l.map((x) => x.textContent));
    if (confirm) for (const id of ['#rb-kennung-ack', '#rb-confirm', '#rb-rest-ack']) if (await page.$(id)) await page.check(id);
    return { rests, left: [], old: true };
  }
  await page.waitForFunction(() => { const r = window.__anon.rb; return !r.plan || r.plan.verdict === 'falsch' || r.left !== null; }, null, { timeout: 120000 });
  const info = await page.evaluate(() => {
    const r = window.__anon.rb;
    return { rests: r.plan ? r.plan.rests.map((x) => x.text) : [], left: (r.left || []).map((x) => `${x.text} – ${x.where}: „…${x.kontext}…“`) };
  });
  if (confirm && await page.$('#rb-ack')) await page.check('#rb-ack');
  return info;
}
