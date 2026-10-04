// Baut die eigenständige index.html (alles eingebettet, keine externen Quellen).
// Aufruf: npm run build
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const gen = path.join(root, 'src/generated');
fs.mkdirSync(gen, { recursive: true });

// 1) Namenslisten
execFileSync(process.execPath, [path.join(root, 'build/build-names.mjs')], { stdio: 'inherit' });

// 2) CMaps von pdf.js (für PDFs mit asiatischen Schriften), base64-eingebettet
const cmapDir = path.join(root, 'node_modules/pdfjs-dist/cmaps');
const cmaps = {};
for (const f of fs.readdirSync(cmapDir).filter((x) => x.endsWith('.bcmap')).sort()) {
  cmaps[f.replace(/\.bcmap$/, '')] = fs.readFileSync(path.join(cmapDir, f)).toString('base64');
}
fs.writeFileSync(path.join(gen, 'cmaps.js'), '// AUTOMATISCH ERZEUGT aus pdfjs-dist/cmaps (Lizenz: siehe README)\nexport const CMAPS = ' + JSON.stringify(cmaps) + ';\n');

// 3) Bündeln
const res = await esbuild.build({
  entryPoints: [path.join(root, 'src/ui/app.js')],
  bundle: true,
  format: 'iife',
  platform: 'browser',
  target: ['es2020', 'safari15', 'chrome100', 'firefox100'],
  minify: true,
  legalComments: 'eof',
  charset: 'utf8',
  write: false,
  logLevel: 'warning',
  define: { 'process.env.NODE_ENV': '"production"' },
});
let js = res.outputFiles[0].text;
// "</script" darf im Skript nicht vorkommen (würde das HTML-Element beenden)
js = js.replace(/<\/(script)/gi, '<\\/$1');
if (/<!--/.test(js) && /<script/i.test(js)) js = js.replace(/<script/gi, '\\x3Cscript');
const css = fs.readFileSync(path.join(root, 'src/ui/styles.css'), 'utf8');

const sha = (s) => "'sha256-" + crypto.createHash('sha256').update(s, 'utf8').digest('base64') + "'";
const csp = [
  "default-src 'none'",
  `script-src ${sha(js)}`,
  `style-src ${sha(css)}`,
  "img-src 'none'", "font-src 'none'", "connect-src 'none'", "media-src 'none'", "object-src 'none'",
  "frame-src 'none'", "worker-src 'none'", "manifest-src 'none'", "form-action 'none'", "base-uri 'none'",
].join('; ');

const tpl = fs.readFileSync(path.join(root, 'src/ui/template.html'), 'utf8');
const html = tpl.replace('__CSP__', csp).replace('__STYLE__', () => css).replace('__SCRIPT__', () => js);
fs.writeFileSync(path.join(root, 'index.html'), html);
const hash = crypto.createHash('sha256').update(html).digest('hex');
console.log(`index.html: ${(html.length / 1024 / 1024).toFixed(2)} MB, SHA-256 ${hash}`);
