// Hilfsfunktionen für Office-XML (DOCX/XLSX): Parsen, Segmente, Ersetzungen verteilen.

export function parseXml(str, name) {
  const doc = new DOMParser().parseFromString(str, 'application/xml');
  if (doc.getElementsByTagName('parsererror').length) throw new Error('XML-Fehler in ' + name);
  return doc;
}

export function serializeXml(doc) {
  let s = new XMLSerializer().serializeToString(doc);
  if (!s.startsWith('<?xml')) s = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' + s;
  return s;
}

export const isEl = (n) => n && n.nodeType === 1;
export const nsHas = (el, part) => !!(el.namespaceURI && el.namespaceURI.includes(part));
export const isW = (el) => nsHas(el, 'wordprocessingml') && /main$/.test(el.namespaceURI);
export const isA = (el) => nsHas(el, 'drawingml') && /main$/.test(el.namespaceURI);
export const isS = (el) => nsHas(el, 'spreadsheetml') && /main$/.test(el.namespaceURI);

export function allElements(doc) {
  return Array.from(doc.getElementsByTagName('*'));
}

export function ancestor(el, pred, stop) {
  let p = el.parentNode;
  while (p && p.nodeType === 1) {
    if (stop && stop(p)) return null;
    if (pred(p)) return p;
    p = p.parentNode;
  }
  return null;
}

// Segment: {text, writable, set(newText)}; Einheit: {text, segments}
export function makeUnit(segments, label) {
  let pos = 0;
  for (const sg of segments) { sg.start = pos; pos += sg.text.length; sg.end = pos; }
  return { text: segments.map((s) => s.text).join(''), segments, label };
}

export function textSegment(el, fixSpace) {
  return {
    text: (el.textContent || '').normalize('NFC'),
    writable: true,
    set(t) {
      el.textContent = t;
      if (fixSpace && /^\s|\s$/.test(t)) el.setAttributeNS('http://www.w3.org/XML/1998/namespace', 'xml:space', 'preserve');
    },
  };
}
export function virtualSegment(text) {
  return { text, writable: false, set() {} };
}

// Ersetzungen [{s,e,text}] (Einheitskoordinaten) auf die Segmente verteilen.
// Der Ersatztext kommt in das erste beschreibbare Segment des Bereichs; der Rest des Bereichs wird gelöscht.
export function distribute(unit, reps) {
  if (!reps.length) return false;
  const sorted = [...reps].sort((a, b) => a.s - b.s);
  const newTexts = unit.segments.map((sg) => (sg.writable ? [] : null));
  const segs = unit.segments;
  // Für jedes Zeichen der Einheit entscheiden: behalten, löschen, oder (am Bereichsanfang) Ersatztext einfügen
  let ri = 0;
  for (let si = 0; si < segs.length; si++) {
    const sg = segs[si];
    if (!sg.writable) continue;
    const out = newTexts[si];
    for (let p = sg.start; p < sg.end; p++) {
      while (ri < sorted.length && sorted[ri].e <= p) ri++;
      const r = sorted[ri];
      if (r && p >= r.s && p < r.e) {
        if (!r.placed) { out.push(r.text); r.placed = true; }
      } else out.push(sg.text[p - sg.start]);
    }
  }
  for (const r of sorted) {
    if (!r.placed) {
      // Bereich lag nur in nicht beschreibbaren Segmenten: an nächstes beschreibbares Segment anhängen
      const si = segs.findIndex((sg) => sg.writable && sg.start >= r.s);
      if (si >= 0) newTexts[si].unshift(r.text);
    }
    delete r.placed;
  }
  let changed = false;
  segs.forEach((sg, si) => {
    if (!sg.writable) return;
    const t = newTexts[si].join('');
    if (t !== sg.text) { sg.set(t); changed = true; }
  });
  return changed;
}

// Pfade in externen Verweisen: Benutzernamen in lokalen Pfaden neutralisieren
export function neutralizePath(s) {
  return s.replace(/((?:Users|Benutzer|Dokumente und Einstellungen|Documents and Settings|home)[\\/]+)[^\\/]+/gi, '$1benutzer');
}

export async function readZipText(zip, name) {
  const f = zip.file(name);
  return f ? f.async('string') : null;
}

// Alle Texte eines (Ausgabe-)ZIPs für den Schlusscheck: Textknoten und Attributwerte aller XML-Teile,
// dazu UTF-8/UTF-16-Dekodierung kleiner Binärteile.
export async function collectZipTexts(zip) {
  const texts = [];
  const names = Object.keys(zip.files).filter((n) => !zip.files[n].dir).sort();
  for (const name of names) {
    if (/\.(xml|rels|vml)$/i.test(name)) {
      const str = await zip.file(name).async('string');
      let doc;
      try { doc = parseXml(str, name); } catch { texts.push({ where: name, text: str }); continue; }
      const parts = [];
      const walk = (n) => {
        for (const c of Array.from(n.childNodes)) {
          if (c.nodeType === 3 || c.nodeType === 4) parts.push(c.nodeValue);
          else if (c.nodeType === 1) {
            for (const a of Array.from(c.attributes)) if (!/^xmlns/.test(a.name)) parts.push(a.value);
            walk(c);
          }
        }
      };
      walk(doc);
      texts.push({ where: name, text: parts.join('\n') });
    } else {
      const bytes = await zip.file(name).async('uint8array');
      if (bytes.length > 8 * 1024 * 1024) { texts.push({ where: name, text: '', skipped: true }); continue; }
      texts.push({ where: name + ' (binär, UTF-8)', text: new TextDecoder('utf-8').decode(bytes) });
      texts.push({ where: name + ' (binär, UTF-16)', text: new TextDecoder('utf-16le').decode(bytes.length % 2 ? bytes.subarray(0, bytes.length - 1) : bytes) });
    }
  }
  return texts;
}

export const ZIP_OPTS = { type: 'uint8array', compression: 'DEFLATE', compressionOptions: { level: 6 } };
export const FIXED_DATE = new Date(Date.UTC(1980, 0, 1, 12, 0, 0));
