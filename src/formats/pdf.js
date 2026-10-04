// PDF: nur die Textebene wird gelesen (keine Texterkennung/OCR). Läuft komplett im Browser,
// ohne Worker-Datei und ohne Nachladen (pdf.js im Haupt-Thread, CMaps eingebettet).
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import * as pdfWorker from 'pdfjs-dist/legacy/build/pdf.worker.mjs';
import { CMAPS } from '../generated/cmaps.js';

globalThis.pdfjsWorker = pdfWorker;

function b64ToBytes(b64) {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
class EmbeddedCMapReaderFactory {
  constructor() {}
  async fetch({ name }) {
    const b = CMAPS[name];
    if (!b) throw new Error('CMap nicht eingebettet: ' + name);
    return { cMapData: b64ToBytes(b), isCompressed: true };
  }
}

export async function readPdf(bytes) {
  let doc;
  try {
    doc = await pdfjs.getDocument({
      data: bytes.slice(), isEvalSupported: false, disableFontFace: true, useSystemFonts: false, disableAutoFetch: true,
      disableStream: true, disableRange: true, useWorkerFetch: false, CMapReaderFactory: EmbeddedCMapReaderFactory,
      cMapPacked: true, enableXfa: false, isOffscreenCanvasSupported: false, isImageDecoderSupported: false, verbosity: 0,
    }).promise;
  } catch (e) {
    if (e && e.name === 'PasswordException') throw new Error('Die PDF-Datei ist passwortgeschützt. Bitte zuerst ohne Passwort speichern.');
    throw new Error('Die PDF-Datei konnte nicht gelesen werden (' + (e && e.message ? e.message : 'unbekannter Fehler') + ').');
  }
  const units = [];
  const emptyPages = [];
  let suspicious = 0;
  let total = 0;
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const tc = await page.getTextContent({ includeMarkedContent: false, disableNormalization: false });
    let text = '';
    for (const it of tc.items) {
      if (typeof it.str !== 'string') continue;
      text += it.str;
      if (it.hasEOL) text += '\n';
    }
    text = text.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim().normalize('NFC');
    const visible = text.replace(/\s/g, '');
    total += visible.length;
    suspicious += (visible.match(/[�-]/g) || []).length;
    if (!visible.length) emptyPages.push(p);
    units.push({ text, label: 'Seite ' + p, page: p });
    page.cleanup();
  }
  await doc.destroy();
  if (!total) throw new Error('PDF enthält keinen Text, evtl. gescannt. Gescannte PDFs (Bilder) werden nicht unterstützt.');
  const warnings = [];
  if (emptyPages.length) warnings.push(`Seite(n) ${emptyPages.join(', ')} enthalten keinen Text (evtl. gescannt). Diese Seiten fehlen im Ergebnis.`);
  if (suspicious > total * 0.05) warnings.push('Ein Teil des PDF-Textes ist nicht lesbar kodiert (Sonderzeichen statt Buchstaben). Namen darin können nicht erkannt werden.');
  warnings.push('PDF-Eingabe: Das Ergebnis ist reiner Text (.txt oder .docx). Das Originallayout (Spalten, Tabellen, Bilder) bleibt NICHT erhalten.');
  return { kind: 'pdf', units, warnings, pages: doc.numPages };
}
