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
// Alle Datei-Hinweise abhaken und (falls vorhanden) offene Fragen ausdrücklich bestätigen
export async function ackAll(page, { questions = true, images = true } = {}) {
  await goTo(page, 'a3');
  // je Hinweis einzeln abhaken (die Liste wird nach jedem Haken neu gezeichnet)
  for (let i = 0; i < 50; i++) {
    const box = await page.$('#ampel .docwarn input[type=checkbox]:not(:checked)');
    if (!box) break;
    await box.click(); // Klick genügt; die Zeile wird danach neu gezeichnet
  }
  if (questions && await page.$('#ack-questions')) { if (!(await page.isChecked('#ack-questions'))) await page.check('#ack-questions'); }
  // Bilder (seit Version 2.2): erst die Liste öffnen, dann abhaken
  if (images) await ackImages(page);
}
// Bilderliste öffnen (wie ein Mensch), dann „Ich habe die Bilder angesehen …“ abhaken
export async function ackImages(page) {
  if (!(await page.$('#ack-images'))) return false;
  if (await page.isDisabled('#ack-images')) {
    await page.click('#btn-images');
    await page.waitForSelector('#img-list');
  }
  if (!(await page.isChecked('#ack-images'))) await page.check('#ack-images');
  return true;
}
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
// Speichern; blockiert der Schlusscheck, Fundstellen festhalten, „bewusst stehen lassen“ abhaken, erneut speichern
export async function exportWithAck(page, fmt) {
  let { dl, status } = await exportOnce(page, fmt);
  let blocked = null;
  if (!dl && /Schlusscheck/.test(status) && /blockiert/.test(status)) {
    blocked = { status, items: await page.$$eval('#leaks li', (els) => els.map((e) => e.textContent)) };
    await page.check('#leak-ack');
    ({ dl, status } = await exportOnce(page, fmt));
  }
  return { dl, status, blocked };
}
// Sichtbare Hauptknöpfe (für den Beleg „genau ein Hauptknopf“)
export const visiblePrimaries = (page) => page.$$eval('button.primary, .bigcard.primary', (els) => els.filter((e) => e.offsetParent !== null && !e.closest('[hidden]')).map((e) => e.textContent.trim()));
export const visibleScreens = (page) => page.$$eval('.screen', (els) => els.filter((e) => !e.hidden).map((e) => e.dataset.screen));
