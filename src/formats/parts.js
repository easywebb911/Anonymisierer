// Version 2.4.1: Teile eines Office-Pakets (.docx/.xlsx) über ihre Beziehungen (_rels/*.rels) und Inhaltstypen
// ([Content_Types].xml) finden, nicht nur über feste Pfade. Ein Teil an ungewöhnlicher Stelle (z. B. ein Kommentar
// unter xl/comments/comment1.xml, wie ihn openpyxl schreibt) wird so genauso gelesen, ersetzt, bereinigt und
// zurückgebaut wie am üblichen Ort. Rein lokal.
import { parseXml, allElements } from './xmlutil.js';

export function resolveTarget(baseDir, target) {
  if (target.startsWith('/')) return target.slice(1);
  const out = [];
  for (const p of (baseDir + target).split('/')) { if (p === '..') out.pop(); else if (p && p !== '.') out.push(p); }
  return out.join('/');
}
const decode = (s) => { try { return decodeURIComponent(s); } catch { return s; } };

// Liefert { relTypes(part) -> [Beziehungstypen], ct(part) -> Inhaltstyp, is(part, relRe, ctRe), main }.
// Teilnamen werden auf die tatsächlichen Namen im ZIP abgebildet (Groß-/Kleinschreibung, %-Kodierung).
export async function partIndex(zip) {
  const names = Object.keys(zip.files).filter((n) => !zip.files[n].dir);
  const lower = new Map(names.map((n) => [n.toLowerCase(), n]));
  const real = (n) => lower.get(n.toLowerCase()) || lower.get(decode(n).toLowerCase()) || null;
  const rel = new Map();
  let main = null;
  for (const rn of names.filter((n) => /(^|\/)_rels\/[^/]*\.rels$/i.test(n))) {
    let doc;
    try { doc = parseXml(await zip.file(rn).async('string'), rn); } catch { continue; }
    const dir = rn.replace(/_rels\/[^/]*\.rels$/i, '');
    for (const r of allElements(doc).filter((e) => e.localName === 'Relationship')) {
      if (r.getAttribute('TargetMode') === 'External') continue;
      const t = real(resolveTarget(dir, r.getAttribute('Target') || ''));
      if (!t) continue;
      const type = r.getAttribute('Type') || '';
      if (!rel.has(t)) rel.set(t, []);
      rel.get(t).push(type);
      if (dir === '' && /\/officeDocument$/.test(type) && !main) main = t;
    }
  }
  const ctOver = new Map();
  const ctDef = new Map();
  const ctName = names.find((n) => n === '[Content_Types].xml');
  if (ctName) {
    try {
      const doc = parseXml(await zip.file(ctName).async('string'), ctName);
      for (const o of allElements(doc)) {
        if (o.localName === 'Override') { const t = real(resolveTarget('', o.getAttribute('PartName') || '')); if (t) ctOver.set(t, o.getAttribute('ContentType') || ''); }
        if (o.localName === 'Default') ctDef.set((o.getAttribute('Extension') || '').toLowerCase(), o.getAttribute('ContentType') || '');
      }
    } catch { /* ohne Inhaltstypen: nur Beziehungen */ }
  }
  const relTypes = (n) => rel.get(n) || [];
  const ct = (n) => ctOver.get(n) || ctDef.get((n.match(/\.([^./]+)$/) || [])[1]?.toLowerCase() || '') || '';
  const is = (n, relRe, ctRe) => (relRe && relTypes(n).some((t) => relRe.test(t))) || (ctRe && ctRe.test(ctOver.get(n) || ''));
  return { names, relTypes, ct, is, main };
}

// Eingebettete Objekte: fester Ordner (wie bisher) oder Beziehung oleObject/package
export const EMBED_REL = /\/(oleObject|package)$/;
