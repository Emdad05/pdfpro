/**
 * pdfWorker.js
 * Sets up the PDF.js worker using unpkg CDN matched to the exact
 * installed version. This is the most reliable cross-environment approach —
 * no file copy, no webpack asset rules, no build-time complexity.
 */
export function setupPdfWorker(pdfjsLib) {
  const version = pdfjsLib.version;
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
}
