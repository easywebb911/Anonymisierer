// Tempo (Teil 4): Ergebnisse alter index.html-Versionen einmal rechnen und im Repo speichern (tests/referenz/).
// Eine alte Version ändert sich nie; passen ihre Prüfsumme und die der Eingabedatei, wird die alte Seite nicht mehr
// gerechnet. Schlüssel: Art der Messung + sha256 der alten index.html (Dateiname) + Eingabe (Datei-Prüfsumme, Ablauf …).
// ANON_REF=frisch: nichts lesen, immer frisch rechnen (für den Beweis gespeichert = frisch).
// ANON_REF=schreiben: frisch rechnen und fehlende Einträge speichern (zum Anlegen neuer Referenzen).
// ANON_REF=pruefen: frisch rechnen UND mit dem gespeicherten Eintrag vergleichen (Beweis gespeichert = frisch).
// Sonst (Standard): gespeicherten Eintrag nehmen, fehlt er, frisch rechnen (ohne zu speichern).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
export const REF_DIR = path.join(here, 'referenz');
const shaCache = new Map();
export const shaOf = (buf) => crypto.createHash('sha256').update(buf).digest('hex');
export function fileSha(p) {
  const k = path.resolve(p);
  const st = fs.statSync(k);
  const c = shaCache.get(k);
  if (c && c.m === st.mtimeMs && c.s === st.size) return c.h;
  const h = shaOf(fs.readFileSync(k));
  shaCache.set(k, { m: st.mtimeMs, s: st.size, h });
  return h;
}
const stores = new Map();
function store(kind, htmlSha) {
  const f = path.join(REF_DIR, `${kind}-${htmlSha.slice(0, 16)}.json`);
  if (!stores.has(f)) {
    let data = {};
    try { data = JSON.parse(fs.readFileSync(f, 'utf8')); } catch { data = {}; }
    if (data.__html && data.__html !== htmlSha) data = {}; // anderer Inhalt unter gleichem Präfix: nicht verwenden
    stores.set(f, { f, data, dirty: false, htmlSha });
  }
  return stores.get(f);
}
export const stats = { hit: 0, miss: 0, gleich: 0, ungleich: 0, ohne: 0, abw: [] };
// kind: z. B. 'massstab'; html: Pfad der alten index.html; key: Zeichenkette (Eingabe-Prüfsumme, Ablauf, Modus …);
// norm: macht einen Wert vergleichbar (z. B. ohne zufällige Kennung), nur für ANON_REF=pruefen
export async function cached(kind, html, key, compute, norm = (x) => x) {
  const mode = process.env.ANON_REF || '';
  const st = store(kind, fileSha(html));
  if (mode === 'pruefen') {
    const v = await compute();
    if (!Object.prototype.hasOwnProperty.call(st.data, key)) { stats.ohne++; return v; }
    if (JSON.stringify(norm(JSON.parse(JSON.stringify(v)))) === JSON.stringify(norm(st.data[key]))) stats.gleich++;
    else { stats.ungleich++; stats.abw.push(`${kind}: ${key}`); }
    return v;
  }
  if (mode !== 'frisch' && Object.prototype.hasOwnProperty.call(st.data, key)) { stats.hit++; return st.data[key]; }
  stats.miss++;
  const v = await compute();
  if (mode === 'schreiben' && v && !v.err) { st.data[key] = v; st.data.__html = st.htmlSha; st.dirty = true; }
  return v;
}
// Am Ende eines Testlaufs: geänderte Referenzen schreiben (nur bei ANON_REF=schreiben)
export function flush() {
  for (const st of stores.values()) {
    if (!st.dirty) continue;
    fs.mkdirSync(REF_DIR, { recursive: true });
    const sorted = Object.fromEntries(Object.keys(st.data).sort().map((k) => [k, st.data[k]]));
    fs.writeFileSync(st.f, JSON.stringify(sorted) + '\n');
    st.dirty = false;
  }
}
export function refNote() {
  const m = process.env.ANON_REF || 'gespeichert';
  if (m === 'pruefen') return `Beweis gespeichert = frisch (tests/referenz/): ${stats.gleich} gleich, ${stats.ungleich} ungleich, ${stats.ohne} ohne gespeicherten Eintrag${stats.abw.length ? ' – ungleich: ' + stats.abw.slice(0, 5).join(' | ') : ''}.`;
  return `Referenzen alter Versionen (tests/referenz/): ${m === 'frisch' ? 'frisch gerechnet' : m === 'schreiben' ? 'frisch gerechnet und gespeichert' : 'gespeichert verwendet'} – ${stats.hit} aus der Datei, ${stats.miss} frisch gerechnet.`;
}
