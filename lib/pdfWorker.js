/**
 * pdfWorker.js
 * Sets up the PDF.js worker correctly for Next.js.
 *
 * Strategy: Use pdfjs-dist's own bundled worker via a data URL approach,
 * or fall back to the CDN matched to the exact installed version.
 * This avoids any file-copy/postinstall complexity.
 */
export async function setupPdfWorker(pdfjsLib) {
  // pdfjs v4+ ships a worker that can be imported directly.
  // We use a dynamic import of the worker as a blob URL so it
  // works without any CDN or file copy to /public.
  try {
    // This import is resolved by webpack at build time
    const workerUrl = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).href;
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
  } catch {
    // Fallback: CDN matched to the exact installed version
    const version = pdfjsLib.version;
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
  }
}
