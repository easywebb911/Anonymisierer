// Erzeugt src/generated/names.js aus
//  (1) @faker-js/faker (MIT) – Namenslisten vieler Länder (nur Daten, kein Faker-Code im Tool)
//  (2) src/data/names-extra.txt (selbst erstellt)
//  (3) src/data/common-words.txt (selbst erstellt, mehrdeutige Wörter)
//  (4) src/data/stopwords.txt (selbst erstellt, nie Namen)
// Deterministisch: sortierte Ausgabe, keine Zeitstempel.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fold, umlautVariant } from '../src/core/fold.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fakerDir = path.join(root, 'node_modules/@faker-js/faker/dist/locale');

// Lateinische Schrift
const LATIN = ['af_ZA', 'az', 'cs_CZ', 'da', 'de', 'de_AT', 'de_CH', 'en', 'en_AU', 'en_GH', 'en_HK', 'en_IE', 'en_IN', 'en_NG',
  'en_NP', 'en_ZA', 'es', 'es_MX', 'fi', 'fr', 'fr_BE', 'fr_CH', 'fr_SN', 'hr', 'hu', 'id_ID', 'it', 'ku_kmr_latin', 'lv', 'nb_NO',
  'nl', 'nl_BE', 'pl', 'pt_BR', 'pt_PT', 'ro', 'ro_MD', 'sk', 'sl_SI', 'sr_RS_latin', 'sv', 'tr', 'uz_UZ_latin', 'vi', 'yo_NG', 'zu_ZA'];
// Kyrillisch: Original + Umschrift (deutsch und englisch)
const CYRILLIC = ['ru', 'uk', 'mk'];
// Andere Schriften mit Leerzeichen zwischen Wörtern (Originalschrift)
const OTHER_SCRIPT = ['ar', 'fa', 'ur', 'he', 'el', 'hy', 'ka_GE', 'ku_ckb'];

const TRANSLIT_DE = { а: 'a', б: 'b', в: 'w', г: 'g', д: 'd', е: 'e', ё: 'jo', ж: 'sch', з: 's', и: 'i', й: 'i', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'ch', ц: 'z', ч: 'tsch', ш: 'sch', щ: 'schtsch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'ju', я: 'ja', і: 'i', ї: 'ji', є: 'je', ґ: 'g', ј: 'j', љ: 'lj', њ: 'nj', ћ: 'c', ђ: 'dj', џ: 'dz', ѓ: 'gj', ќ: 'kj', ѕ: 'dz' };
const TRANSLIT_EN = { ...TRANSLIT_DE, в: 'v', ж: 'zh', з: 'z', й: 'y', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'shch', ю: 'yu', я: 'ya', ё: 'yo', ї: 'yi', є: 'ye' };
function translit(word, table) {
  let out = '';
  for (const ch of word) {
    const lower = ch.toLowerCase();
    const t = table[lower];
    if (t === undefined) out += ch; else out += (ch !== lower ? t.charAt(0).toUpperCase() + t.slice(1) : t);
  }
  return out;
}

function flat(x) {
  if (!x) return [];
  if (Array.isArray(x)) return x.flat(Infinity);
  return Object.values(x).flat(Infinity);
}
function readWords(file) {
  return fs.readFileSync(path.join(root, file), 'utf8').split('\n')
    .map((l) => l.replace(/#.*/, '')).join(' ').split(/\s+/).filter(Boolean);
}

const stop = new Set(readWords('src/data/stopwords.txt').map(fold));
const amb = new Set(readWords('src/data/common-words.txt').map(fold));

const first = new Map(); // key -> Quelle(n)
const last = new Map();
const curated = new Set(); // Einträge aus der selbst erstellten Liste (dürfen 2 Buchstaben haben)
const stats = {};

function add(map, raw, src, isCurated) {
  for (const part0 of String(raw).normalize('NFC').split(/\s+/)) {
    const part = part0.replace(/^[-'’]+|[-'’.,]+$/g, '');
    if (!part || /[\d.()/]/.test(part)) continue;
    if (!/^[\p{L}\p{M}][\p{L}\p{M}'’-]*$/u.test(part)) continue;
    const forms = [part];
    const uv = umlautVariant(part); if (uv) forms.push(uv);
    for (const f of forms) {
      const k = fold(f);
      if (stop.has(k)) continue;
      if ([...k].length < 2) continue;
      if ([...k].length === 2 && !isCurated) continue;
      if (isCurated) curated.add(k);
      if (!map.has(k)) map.set(k, new Set());
      map.get(k).add(src);
    }
  }
}

async function loadLocale(loc) {
  const m = await import(path.join(fakerDir, loc + '.js'));
  const p = m.faker.rawDefinitions.person || {};
  const get = (k) => { try { return flat(p[k]); } catch { return []; } };
  return { f: get('first_name'), l: get('last_name') };
}

for (const loc of LATIN) {
  const { f, l } = await loadLocale(loc);
  f.forEach((n) => add(first, n, 'faker:' + loc));
  l.forEach((n) => add(last, n, 'faker:' + loc));
  stats[loc] = [f.length, l.length];
}
for (const loc of CYRILLIC) {
  const { f, l } = await loadLocale(loc);
  for (const [arr, map] of [[f, first], [l, last]]) {
    for (const n of arr) {
      add(map, n, 'faker:' + loc);
      add(map, translit(n, TRANSLIT_DE), 'faker:' + loc + '+translit');
      add(map, translit(n, TRANSLIT_EN), 'faker:' + loc + '+translit');
    }
  }
  stats[loc] = [f.length, l.length];
}
for (const loc of OTHER_SCRIPT) {
  const { f, l } = await loadLocale(loc);
  f.forEach((n) => add(first, n, 'faker:' + loc));
  l.forEach((n) => add(last, n, 'faker:' + loc));
  stats[loc] = [f.length, l.length];
}

// Selbst erstellte Ergänzungen
let mode = null;
for (const line0 of fs.readFileSync(path.join(root, 'src/data/names-extra.txt'), 'utf8').split('\n')) {
  const line = line0.replace(/#.*/, '').trim();
  if (!line) continue;
  const m = line.match(/^\[(F|L|FL)\]\s*(.*)$/);
  let rest = line;
  if (m) { mode = m[1]; rest = m[2]; }
  for (const w of rest.split(/\s+/).filter(Boolean)) {
    if (mode.includes('F')) add(first, w, 'eigen', true);
    if (mode.includes('L')) add(last, w, 'eigen', true);
  }
}

const allKeys = [...new Set([...first.keys(), ...last.keys()])].sort();
const F = allKeys.filter((k) => first.has(k));
const L = allKeys.filter((k) => last.has(k));
const AMB = [...amb].filter((k) => first.has(k) || last.has(k)).sort();
const SHORT = allKeys.filter((k) => [...k].length <= 2).sort();

const out = `// AUTOMATISCH ERZEUGT von build/build-names.mjs – nicht von Hand ändern.
// Quellen: @faker-js/faker (MIT), src/data/*.txt (selbst erstellt).
export const FIRST = ${JSON.stringify(F.join('|'))};
export const LAST = ${JSON.stringify(L.join('|'))};
export const AMBIGUOUS = ${JSON.stringify([...amb].sort().join('|'))};
export const STOP = ${JSON.stringify([...stop].sort().join('|'))};
export const STOP_RAW = ${JSON.stringify([...new Set(readWords('src/data/stopwords.txt').map((w) => w.normalize('NFC').toLowerCase()))].sort().join('|'))};
`;
fs.mkdirSync(path.join(root, 'src/generated'), { recursive: true });
fs.writeFileSync(path.join(root, 'src/generated/names.js'), out);
const report = { vornamen: F.length, nachnamen: L.length, gesamtSchluessel: allKeys.length, mehrdeutigInListen: AMB.length, kurz: SHORT, locales: stats };
fs.writeFileSync(path.join(root, 'src/generated/names-report.json'), JSON.stringify(report, null, 1));
console.log(`Namen: ${F.length} Vornamen-Schlüssel, ${L.length} Nachnamen-Schlüssel, ${AMB.length} mehrdeutig, Datei ${(out.length / 1024).toFixed(0)} KB`);
