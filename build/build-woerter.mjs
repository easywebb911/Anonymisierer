// Version 2.9.0: Wortliste „all-the-german-words“ 1.1.0 (MIT) als kompakte, exakte Nachschlage-Struktur für index.html.
// Gelesen wird NUR die Datei woerter.json (als Daten, kein Code aus dem Paket wird ausgeführt).
// Inhalt: jedes Wort aus nur Buchstaben mit mindestens 3 Zeichen, kleingeschrieben (Schreibweise der Liste) und zusätzlich
// in der Vergleichsform des Tools (fold: ohne Akzente, ß -> ss). Sortiert (JavaScript-Standardvergleich), vorne
// zusammengefasst (Zeichen 48+n = n gleiche Anfangszeichen wie das vorige Wort, dann der Rest; Zeilen mit \n), mit pako
// (feste Version aus package-lock.json) als deflate-raw gepackt, base64. Exakt: kein Wort wird fälschlich als bekannt gemeldet.
// Ausgabe: src/generated/woerter.b64 (nicht im Repo; wird bei jedem Build neu erzeugt, gleiches Ergebnis bei gleichen Paketen).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const req = createRequire(path.join(root, 'package.json'));
const pako = req('pako');
const { fold } = await import(path.join(root, 'src/core/fold.js'));

export const MAX_PREFIX = 70;
export function wordSet() {
  const src = path.join(root, 'node_modules/all-the-german-words/woerter.json');
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'node_modules/all-the-german-words/package.json'), 'utf8'));
  if (pkg.version !== '1.1.0' || pkg.license !== 'MIT') throw new Error('Wortliste: erwartet all-the-german-words 1.1.0 (MIT), gefunden ' + pkg.version + ' (' + pkg.license + ')');
  const words = JSON.parse(fs.readFileSync(src, 'utf8'));
  const set = new Set();
  for (const w of words) {
    const l = String(w).normalize('NFC').toLowerCase();
    if (!/^\p{L}{3,}$/u.test(l)) continue;
    set.add(l);
    const f = fold(l);
    if (/^\p{L}{3,}$/u.test(f)) set.add(f);
  }
  return { count: words.length, sorted: [...set].sort() };
}
export function encode(sorted) {
  let prev = '';
  const lines = [];
  for (const s of sorted) {
    let i = 0;
    while (i < prev.length && i < s.length && i < MAX_PREFIX && prev[i] === s[i]) i++;
    lines.push(String.fromCharCode(48 + i) + s.slice(i));
    prev = s;
  }
  const raw = Buffer.from(lines.join('\n'), 'utf8');
  const packed = Buffer.from(pako.deflateRaw(raw, { level: 9, memLevel: 9 }));
  return { raw, packed, b64: packed.toString('base64') };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { count, sorted } = wordSet();
  const { raw, packed, b64 } = encode(sorted);
  const gen = path.join(root, 'src/generated');
  fs.mkdirSync(gen, { recursive: true });
  fs.writeFileSync(path.join(gen, 'woerter.b64'), b64);
  console.log(`Wortliste: ${count} Einträge -> ${sorted.length} Suchwörter, ${(raw.length / 1048576).toFixed(2)} MB -> ${(packed.length / 1048576).toFixed(2)} MB gepackt, ${(b64.length / 1048576).toFixed(2)} MB base64`);
}
