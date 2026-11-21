// Version 2.7.0: Texte von Verweisen in Word/Excel, die keiner Einheit der Prüfansicht gehören: Link-Ziele (externe
// Beziehungen), Link-Hinweise (tooltip), Feldfunktionen (HYPERLINK in instr/instrText). Die Analyse vergibt für
// Webadressen und Konten darin im Modus „rückbaufähig“ eigene Nummern, damit der Rückbau sie exakt herstellt.
import { parseXml, allElements } from './xmlutil.js';

export async function collectLinkTexts(zip, docs) {
  const out = [];
  if (!zip) return out;
  for (const n of Object.keys(zip.files).filter((x) => !zip.files[x].dir && /\.rels$/i.test(x)).sort()) {
    let doc;
    try { doc = parseXml(await zip.file(n).async('string'), n); } catch { continue; }
    for (const r of allElements(doc)) {
      if (r.localName === 'Relationship' && r.getAttribute('TargetMode') === 'External') out.push(r.getAttribute('Target') || '');
    }
  }
  for (const [n, doc] of docs || []) {
    if (/\.rels$/i.test(n)) continue;
    for (const el of allElements(doc)) {
      for (const a of Array.from(el.attributes)) if (a.localName === 'tooltip' || a.localName === 'instr' || a.localName === 'display') out.push(a.value);
      if (el.localName === 'instrText' || (el.localName === 'f' && /HYPERLINK/i.test(el.textContent))) out.push(el.textContent);
    }
  }
  return out.filter((t) => t && /[./:@]/.test(t));
}
