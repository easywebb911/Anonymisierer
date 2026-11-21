// Nachschlagen in den eingebetteten Namenslisten.
import { FIRST, LAST, AMBIGUOUS, STOP, STOP_RAW } from '../generated/names.js';
import { fold } from './fold.js';

const F = new Set(FIRST.split('|'));
const L = new Set(LAST.split('|'));
const A = new Set(AMBIGUOUS.split('|'));
// Version 2.4.0 (Weg a″): Gewöhnliche Wörter, die zugleich in den Namenslisten stehen, zusätzlich als „mehrdeutig“.
// Von Hand geprüfte, feste Liste (Schlüssel wie fold(): klein, ohne Akzente). Entstehung siehe README; beim Messen
// genutzte fremde Wörterbuch- und Häufigkeitsdaten sind NICHT enthalten. Häufige echte Vor- und Nachnamen und
// Zweifelsfälle (auch in anderen Sprachen gebräuchliche Namen) stehen bewusst nicht hier.
export const EXTRA_AMBIGUOUS = ['amen', 'apollo', 'arena', 'atlas', 'aura', 'bares', 'bars', 'blick', 'buddha', 'campus', 'cola',
  'delta', 'dock', 'dolch', 'faktor', 'frauen', 'gala', 'harter', 'hort', 'inder', 'jazz', 'judin', 'kalender', 'kardinal', 'kita',
  'klemme', 'krabbe', 'lama', 'landen', 'lava', 'liga', 'los', 'machtig', 'mama', 'manns', 'monde', 'papa', 'patrone', 'perle',
  'pole', 'pop', 'raucher', 'reale', 'reine', 'schimmer', 'schlangen', 'skala', 'soda', 'spinner', 'tat', 'termine', 'tode',
  'treff', 'truben', 'volle', 'wale', 'yoga'];
for (const k of EXTRA_AMBIGUOUS) A.add(k);
const S = new Set(STOP.split('|'));
const SR = new Set(STOP_RAW.split('|'));
// Funktionswort in genau dieser Schreibweise ("Văn" ist nicht "van")
export function isStopWord(word) { return SR.has(word.normalize('NFC').toLowerCase()); }

export const PARTICLES = new Set(['von', 'van', 'de', 'der', 'den', 'del', 'della', 'delle', 'dei', 'di', 'da', 'dos', 'das', 'do',
  'du', 'le', 'la', 'al', 'el', 'bin', 'ibn', 'ben', 'bint', 'abu', 'ter', 'ten', 'zu', 'zur', 'vom', 'y', 'e', 'mac', 'ap']);
// Partikel, die einen Namen beginnen dürfen (ohne vorherigen Namensteil)
export const LEADING_PARTICLES = new Set(['von', 'van', 'de', 'del', 'della', 'di', 'da', 'dos', 'du', 'le', 'la', 'al', 'el', 'bin', 'ibn', 'ben', 'abu', 'ter', 'ten', 'zu', 'vom']);

// Anreden/Titel, die einen folgenden Namen stark anzeigen
export const STRONG_TITLES = new Set(['herr', 'herrn', 'frau', 'fraulein', 'frl', 'hr', 'fr', 'dr', 'prof', 'professor', 'professorin',
  'doktor', 'mr', 'mrs', 'ms', 'mx', 'miss', 'mister', 'sir', 'dame', 'madame', 'mme', 'mlle', 'monsieur', 'mademoiselle', 'senor',
  'senora', 'srta', 'signor', 'signora', 'sig', 'bay', 'bayan', 'sheikh', 'scheich', 'familie', 'fam', 'rev', 'mag', 'dipl', 'ing',
  'med', 'dent', 'vet', 'rer', 'nat', 'phil', 'jur', 'oec', 'pol', 'hc', 'msc', 'bsc', 'llm', 'mba', 'sr', 'sra', 'don', 'dona', 'lady', 'lord']);
// Rollen und Beziehungswörter: schwacher Namenskontext
export const WEAK_TITLES = new Set([
  'prasident', 'prasidentin', 'minister', 'ministerin', 'kollege', 'kollegin', 'vorsitzende', 'vorsitzender', 'burgermeister',
  'burgermeisterin', 'oberburgermeister', 'oberburgermeisterin', 'pfarrer', 'pfarrerin', 'pastor', 'pastorin', 'pater', 'richter',
  'richterin', 'abgeordnete', 'abgeordneter', 'direktor', 'direktorin', 'rektor', 'rektorin', 'dekan', 'dekanin', 'kommissar',
  'kommissarin', 'hauptkommissar', 'hauptkommissarin', 'staatsanwalt', 'staatsanwaltin', 'rechtsanwalt', 'rechtsanwaltin', 'anwalt',
  'anwaltin', 'ra', 'rain', 'notar', 'notarin', 'kanzler', 'kanzlerin', 'botschafter', 'botschafterin', 'landrat', 'landratin',
  'geschaftsfuhrer', 'geschaftsfuhrerin', 'chefarzt', 'chefarztin', 'oberarzt', 'oberarztin', 'arzt', 'arztin', 'lehrer', 'lehrerin',
  'sohn', 'tochter', 'ehefrau', 'ehemann', 'gattin', 'gatte', 'mutter', 'vater', 'bruder', 'schwester', 'onkel', 'tante', 'oma',
  'opa', 'enkel', 'enkelin', 'neffe', 'nichte', 'cousine', 'freund', 'freundin', 'partnerin', 'lebensgefahrte', 'lebensgefahrtin',
  'nachbar', 'nachbarin', 'mitarbeiter', 'mitarbeiterin', 'kunde', 'kundin', 'patient', 'patientin', 'mandant', 'mandantin', 'klient',
  'klientin', 'schuler', 'schulerin', 'student', 'studentin', 'azubi', 'zeuge', 'zeugin', 'klager', 'klagerin', 'beklagte', 'beklagter',
  'angeklagte', 'angeklagter', 'betreuer', 'betreuerin', 'gutachter', 'gutachterin', 'sachverstandige', 'sachverstandiger',
  'son', 'daughter', 'wife', 'husband', 'mother', 'father', 'brother', 'sister', 'uncle', 'aunt', 'colleague', 'neighbor', 'neighbour',
  'client', 'captain', 'kapitan', 'hauptmann', 'leutnant', 'oberst', 'officer', 'detective', 'inspector', 'inspektor', 'inspektorin',
  'hallo', 'hi', 'hey', 'liebe', 'lieber', 'liebes', 'dear', 'geehrte', 'geehrter', 'moin', 'servus']);
// Nachgestellte Anreden (türkisch u. a.): "Ahmet Bey", "Ayşe Hanım"
export const POST_TITLES = new Set(['bey', 'hanim', 'efendi', 'hoca', 'san', 'sama', 'kun', 'chan']);
// Wörter, nach denen ein Substantiv folgt (dann ist ein mehrdeutiges Wort eher kein Name)
export const DETERMINERS = new Set(['der', 'die', 'das', 'den', 'dem', 'des', 'ein', 'eine', 'einer', 'eines', 'einem', 'einen', 'im',
  'am', 'zum', 'zur', 'vom', 'beim', 'ins', 'ans', 'aufs', 'kein', 'keine', 'keinen', 'keinem', 'keiner', 'mein', 'meine', 'meinen',
  'meinem', 'meiner', 'dein', 'deine', 'sein', 'seine', 'seinen', 'seinem', 'seiner', 'ihr', 'ihre', 'ihren', 'ihrem', 'ihrer',
  'unser', 'unsere', 'euer', 'eure', 'jeder', 'jede', 'jedes', 'jeden', 'jedem', 'dieser', 'diese', 'dieses', 'diesen', 'diesem',
  'jener', 'jene', 'welche', 'welcher', 'alle', 'viele', 'the', 'a', 'an', 'this', 'that', 'these', 'those', 'my', 'your', 'his',
  'her', 'its', 'our', 'their', 'no', 'every', 'each', 'some', 'any']);
export const PREPOSITIONS = new Set(['ab', 'an', 'auf', 'aus', 'bei', 'bis', 'durch', 'fur', 'gegen', 'hinter', 'in', 'mit', 'nach',
  'neben', 'ohne', 'seit', 'uber', 'um', 'unter', 'von', 'vor', 'wahrend', 'wegen', 'zu', 'zwischen', 'trotz', 'statt', 'gegenuber',
  'innerhalb', 'ausserhalb', 'in', 'into', 'from', 'to', 'at', 'on', 'of', 'for', 'with', 'by', 'about', 'during', 'since', 'until']);
export const CLOSINGS = /(?:grüßen|grüße|gruß|grussen|gruss|regards|sincerely|cheers|best|mfg|lg|vg|i\. ?a\.|i\. ?v\.|gez\.)[\s,.!]*$/i;

// Typische Namensendungen (für Namen, die in keiner Liste stehen)
const SHAPE = /(?:ović|ovic|ević|evic|vić|vic|ić|ski|ska|cki|cka|dzki|dzka|wicz|czyk|czak|oğlu|oglu|zade|zadeh|ov|ova|ev|eva|enko|ienko|uk|chuk|escu|eanu|poulos|opoulos|akis|idis|iadis|yan|yants|shvili|dze|sson|stad|pour|ullah|uddin)$/;

export function inLists(key) { return F.has(key) || L.has(key); }
export function isFirst(key) { return F.has(key); }
export function isLast(key) { return L.has(key); }
export function isAmbiguous(key) { return A.has(key); }
export function isStop(key) { return S.has(key); }
export function isShaped(key) { return key.length >= 5 && SHAPE.test(key); }
export function isStrongTitle(key) { return STRONG_TITLES.has(key); }
export function isWeakTitle(key) { return WEAK_TITLES.has(key); }
export function isTitle(key) { return STRONG_TITLES.has(key) || WEAK_TITLES.has(key); }

// GROSSSCHREIBUNG mit großer Endung (Version 2.3.2): „MÜLLERS“ = „MÜLLER“ + „S“. Nur wenn der Wortstamm selbst ganz
// groß geschrieben ist (keine Kleinbuchstaben), nie bei „MüllerS“. Liefert [Wort, Stamm, Endung] oder null.
function capsSplit(word, ends) {
  for (const end of ends) {
    if (word.length <= end.length || word.slice(-end.length) !== end) continue;
    const stem = word.slice(0, -end.length);
    if (stem === stem.toUpperCase() && stem !== stem.toLowerCase()) return [word, stem, end];
  }
  return null;
}
const CAPS_LIST_ENDINGS = ["'S", '’S', 'S'];

// Grundform mit Endung: "Müllers" -> {key:"muller", suffix:"s"}, "John's" -> {key:"john", suffix:"'s"}
// Version 2.3.2: auch GROSS mit großer Endung ("MÜLLERS" -> {key:"muller", suffix:"S"}); gleiche Endungen wie bisher
export function lookupWord(word) {
  const key = fold(word);
  const res = { key, stemLen: word.length, suffix: '' };
  if (inLists(key) || isStop(key)) return res;
  const m = word.match(/^(.+?)(['’]s|s)$/u) || capsSplit(word, CAPS_LIST_ENDINGS);
  if (m) {
    const k2 = fold(m[1]);
    if (k2.length >= 3 && inLists(k2)) return { key: k2, stemLen: m[1].length, suffix: m[2] };
  }
  return res;
}

// Endungen für bekannte Namen (unverändert seit Version 1): 's, ’s, ', ’, s, es, n, ns
const STEM_ENDINGS = ["'s", '’s', "'", '’', 's', 'es', 'n', 'ns'];
// Für beliebige (auch manuell markierte) Wörter: Grundform ohne Endung, falls die Grundform bekannt ist.
// Version 2.3.1: Zuerst wie bisher die kürzeste Zerlegung (so bleiben alle bisherigen Ergebnisse gleich). Passt sie
// nicht, werden die übrigen Zerlegungen mit denselben Endungen probiert, z. B. „Quabbenjansens“ = „Quabbenjansen“ + „s“
// (bisher nur „Quabbenjanse“ + „ns“ versucht). Keine neuen Endungen; Groß-/Kleinschreibung der Endung wie bisher.
// Version 2.3.2: caps = true probiert danach zusätzlich die Endungen in Großbuchstaben ('S, ’S, S, ES, N, NS), nur nach
// einem ganz groß geschriebenen Wortstamm („QUABBENJANSENS“). Ohne caps bleibt alles wie bisher.
export function stemFor(word, knownKeys, caps = false) {
  const key = fold(word);
  if (knownKeys.has(key)) return { key, stemLen: word.length, suffix: '' };
  const m = word.match(/^(.+?)(['’]s|['’]|s|es|n|ns)$/u);
  if (m) {
    const k2 = fold(m[1]);
    if (knownKeys.has(k2)) return { key: k2, stemLen: m[1].length, suffix: m[2] };
  }
  for (const end of STEM_ENDINGS) {
    if (word.length <= end.length || word.slice(-end.length) !== end) continue;
    const stem = word.slice(0, -end.length);
    const k3 = fold(stem);
    if (knownKeys.has(k3)) return { key: k3, stemLen: stem.length, suffix: end };
  }
  if (caps) {
    for (const end of STEM_ENDINGS) {
      const E = end.toUpperCase();
      if (E === end) continue; // ' und ’ haben keine Großform (oben schon geprüft)
      const c = capsSplit(word, [E]);
      if (c && knownKeys.has(fold(c[1]))) return { key: fold(c[1]), stemLen: c[1].length, suffix: c[2] };
    }
  }
  return null;
}
