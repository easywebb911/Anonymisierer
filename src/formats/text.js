// Text (.txt) und CSV: Lesen mit Zeichensatz-Erkennung, Schreiben mit erhaltener Struktur.

export function decodeText(bytes) {
  let b = bytes;
  let bom = '';
  if (b[0] === 0xef && b[1] === 0xbb && b[2] === 0xbf) { b = b.subarray(3); bom = 'utf8'; }
  else if (b[0] === 0xff && b[1] === 0xfe) return { text: new TextDecoder('utf-16le').decode(b.subarray(2)).normalize('NFC'), encoding: 'UTF-16', bom: 'utf16le' };
  else if (b[0] === 0xfe && b[1] === 0xff) return { text: new TextDecoder('utf-16be').decode(b.subarray(2)).normalize('NFC'), encoding: 'UTF-16', bom: 'utf16be' };
  try {
    return { text: new TextDecoder('utf-8', { fatal: true }).decode(b).normalize('NFC'), encoding: 'UTF-8', bom };
  } catch {
    return { text: new TextDecoder('windows-1252').decode(b).normalize('NFC'), encoding: 'Windows-1252', bom: '' };
  }
}

// Ausgabe immer als UTF-8 (mit BOM, damit Excel/Windows Umlaute korrekt anzeigen)
export function encodeText(text) {
  const body = new TextEncoder().encode(text);
  const out = new Uint8Array(body.length + 3);
  out.set([0xef, 0xbb, 0xbf]);
  out.set(body, 3);
  return out;
}

// TXT: eine Einheit pro Zeile
export function readTxt(bytes) {
  const { text, encoding } = decodeText(bytes);
  if (text.includes('\u0000')) throw new Error('Die Datei scheint keine Textdatei zu sein.');
  const parts = text.split(/(\r\n|\n|\r)/);
  const lines = [];
  const eols = [];
  for (let i = 0; i < parts.length; i += 2) { lines.push(parts[i]); eols.push(parts[i + 1] || ''); }
  return { kind: 'txt', units: lines.map((t) => ({ text: t, label: '' })), eols, encoding, warnings: [] };
}
export function writeTxt(doc, newTexts) {
  return newTexts.map((t, i) => t + doc.eols[i]).join('');
}

// CSV: Trennzeichen erkennen, RFC-4180-Anführungszeichen beachten, eine Einheit pro Zelle
function detectDelimiter(text) {
  const cands = [';', ',', '\t', '|'];
  const sample = text.slice(0, 20000);
  let best = ',';
  let bestScore = -1;
  for (const d of cands) {
    const rows = parseCsv(sample, d).rows.slice(0, 20).filter((r) => r.cells.length > 1);
    if (!rows.length) continue;
    const counts = rows.map((r) => r.cells.length);
    const same = counts.filter((c) => c === counts[0]).length;
    const score = same * 100 + counts[0];
    if (score > bestScore) { bestScore = score; best = d; }
  }
  return best;
}

function parseCsv(text, delim) {
  const rows = [];
  let cells = [];
  let i = 0;
  let cell = '';
  let quoted = false;
  let wasQuoted = false;
  const pushCell = () => { cells.push({ value: cell, quoted: wasQuoted }); cell = ''; wasQuoted = false; };
  while (i < text.length) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') { cell += '"'; i += 2; continue; }
        quoted = false; i++; continue;
      }
      cell += ch; i++; continue;
    }
    if (ch === '"' && cell === '') { quoted = true; wasQuoted = true; i++; continue; }
    if (ch === delim) { pushCell(); i++; continue; }
    if (ch === '\r' || ch === '\n') {
      const eol = ch === '\r' && text[i + 1] === '\n' ? '\r\n' : ch;
      pushCell();
      rows.push({ cells, eol });
      cells = [];
      i += eol.length;
      continue;
    }
    cell += ch; i++;
  }
  if (cell !== '' || cells.length || wasQuoted) { pushCell(); rows.push({ cells, eol: '' }); }
  return { rows, unbalanced: quoted };
}

export function readCsv(bytes) {
  const { text, encoding } = decodeText(bytes);
  const delim = detectDelimiter(text);
  const { rows, unbalanced } = parseCsv(text, delim);
  const units = [];
  const map = [];
  rows.forEach((r, ri) => r.cells.forEach((c, ci) => {
    if (c.value.trim()) { units.push({ text: c.value, label: `Zeile ${ri + 1}, Spalte ${ci + 1}` }); map.push([ri, ci]); }
  }));
  const warnings = [];
  if (unbalanced) warnings.push('Die CSV-Datei enthält ein nicht geschlossenes Anführungszeichen. Bitte das Ergebnis besonders sorgfältig prüfen.');
  const names = { ';': 'Semikolon', ',': 'Komma', '\t': 'Tabulator', '|': 'senkrechter Strich' };
  return { kind: 'csv', units, rows, map, delim, encoding, warnings, info: `Trennzeichen: ${names[delim]}` };
}

export function writeCsv(doc, newTexts) {
  const rows = doc.rows.map((r) => ({ eol: r.eol, cells: r.cells.map((c) => ({ ...c })) }));
  doc.map.forEach(([ri, ci], ui) => { rows[ri].cells[ci].value = newTexts[ui]; });
  const q = (c) => {
    const need = c.quoted || c.value.includes(doc.delim) || /["\r\n]/.test(c.value);
    return need ? '"' + c.value.replace(/"/g, '""') + '"' : c.value;
  };
  return rows.map((r) => r.cells.map(q).join(doc.delim) + r.eol).join('');
}
