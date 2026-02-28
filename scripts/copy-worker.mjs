/**
 * copy-worker.mjs
 * Copies the pdfjs-dist worker file into /public so it can be served
 * as a static asset without relying on any CDN.
 * Runs automatically via postinstall and before every build.
 */
import { copyFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const publicDir = resolve(root, 'public');

// Ensure public/ exists
if (!existsSync(publicDir)) mkdirSync(publicDir, { recursive: true });

// Find the worker file in pdfjs-dist/build/
const pdfjsBuildDir = resolve(root, 'node_modules', 'pdfjs-dist', 'build');

if (!existsSync(pdfjsBuildDir)) {
  console.warn('[copy-worker] pdfjs-dist not found in node_modules, skipping.');
  process.exit(0);
}

const files = readdirSync(pdfjsBuildDir);
// Could be pdf.worker.min.mjs or pdf.worker.min.js depending on version
const workerFile = files.find(f => f.startsWith('pdf.worker') && (f.endsWith('.mjs') || f.endsWith('.js')));

if (!workerFile) {
  console.warn('[copy-worker] Could not find pdf.worker file in pdfjs-dist/build/. Files:', files);
  process.exit(0);
}

const src  = resolve(pdfjsBuildDir, workerFile);
const dest = resolve(publicDir, 'pdf.worker.min.js');

copyFileSync(src, dest);
console.log(`[copy-worker] Copied ${workerFile} → public/pdf.worker.min.js`);
