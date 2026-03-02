/**
 * pptxBuilder.js
 *
 * Two modes:
 *
 * 1. CLEAN (default) — white slide + positioned text boxes + image boxes
 *    - No background image render
 *    - Every element is independently editable
 *    - Best for text-based PDFs (presentations, reports, academic papers)
 *
 * 2. HYBRID — full page render as background + transparent text boxes
 *    - For PDFs with complex backgrounds, photos, graphics
 *    - Background is locked image, text is editable on top
 *
 * 3. IMAGE — pure image per slide, nothing editable
 */

const PT  = 72;
const inch = (pt) => pt / PT;

function cleanFont(name) {
  if (!name || name.length < 2) return 'Calibri';
  return name
    .replace(/^[A-Z]{6}\+/, '')
    .replace(/,?\s*(Bold|Italic|BoldItalic|Regular|Medium|Light|Semibold).*/i, '')
    .replace(/(MT|PS|PC|Std|Pro|LT|Regular|Medium)$/i, '')
    .replace(/[^a-zA-Z0-9 \-]/g, '')
    .trim() || 'Calibri';
}

// ── Image-only slide ───────────────────────────────────────────────────────

export function addImageSlide(prs, imgDataUrl, widthPt, heightPt) {
  const slide = prs.addSlide();
  slide.addImage({ data: imgDataUrl, x: 0, y: 0, w: inch(widthPt), h: inch(heightPt) });
  return slide;
}

// ── Clean white slide with text + image boxes ──────────────────────────────

export function addCleanSlide(prs, lines, images, pageWidthPt, pageHeightPt) {
  const slide  = prs.addSlide();
  const slideW = inch(pageWidthPt);
  const slideH = inch(pageHeightPt);

  // White background
  slide.addShape('rect', {
    x: 0, y: 0, w: slideW, h: slideH,
    fill: { color: 'FFFFFF' },
    line: { color: 'FFFFFF', width: 0 },
  });

  // Image boxes first (text renders on top)
  for (const img of (images || [])) {
    const x = Math.max(inch(img.x), 0);
    const y = Math.max(inch(img.y), 0);
    const w = Math.min(inch(img.w), slideW - x);
    const h = Math.min(inch(img.h), slideH - y);
    if (w > 0.05 && h > 0.05) {
      slide.addImage({ data: img.dataUrl, x, y, w, h });
    }
  }

  // Text boxes
  for (const line of (lines || [])) {
    if (!line.runs?.length) continue;
    if (line.y < -8 || line.y > pageHeightPt + 8) continue;

    const textRuns = line.runs
      .filter(r => r.text && r.text.length > 0)
      .map(run => ({
        text: run.text,
        options: {
          fontSize:    Math.max(Math.round(run.fontSize), 6),
          bold:        run.bold   || false,
          italic:      run.italic || false,
          fontFace:    cleanFont(run.fontFace),
          color:       run.color  || '000000',
          breakLine:   false,
          charSpacing: 0,
        },
      }));

    if (!textRuns.length) continue;

    const rightEnd = Math.max(...line.runs.map(r => r.x + r.w));
    const x = Math.max(inch(line.x) - 0.01, 0);
    const y = Math.max(inch(line.y) - 0.01, 0);
    const w = Math.min(inch(rightEnd - line.x) + 0.12, slideW - x);
    const h = Math.max(inch(line.h) + 0.05, 0.1);

    if (x >= slideW || y >= slideH || w < 0.05) continue;

    slide.addText(textRuns, {
      x, y,
      w:          Math.max(w, 0.1),
      h,
      margin:     0,
      valign:     'top',
      wrap:       false,
      shrinkText: false,
      fill:       { type: 'none' },
      line:       { width: 0 },
    });
  }

  return slide;
}

// ── Hybrid slide: background image + transparent text boxes ───────────────
// Use this for PDFs with complex graphics, coloured backgrounds, photos.

export function addHybridSlide(prs, bgDataUrl, lines, pageWidthPt, pageHeightPt) {
  const slide  = prs.addSlide();
  const slideW = inch(pageWidthPt);
  const slideH = inch(pageHeightPt);

  // Full page render as background — captures everything visual
  slide.addImage({ data: bgDataUrl, x: 0, y: 0, w: slideW, h: slideH });

  // Transparent text boxes — invisible visually, editable in PowerPoint
  for (const line of (lines || [])) {
    if (!line.runs?.length) continue;
    if (line.y < -8 || line.y > pageHeightPt + 8) continue;

    const textRuns = line.runs
      .filter(r => r.text && r.text.length > 0)
      .map(run => ({
        text: run.text,
        options: {
          fontSize:    Math.max(Math.round(run.fontSize), 6),
          bold:        run.bold   || false,
          italic:      run.italic || false,
          fontFace:    cleanFont(run.fontFace),
          color:       run.color  || '000000',
          breakLine:   false,
          charSpacing: 0,
        },
      }));

    if (!textRuns.length) continue;

    const rightEnd = Math.max(...line.runs.map(r => r.x + r.w));
    const x = Math.max(inch(line.x) - 0.01, 0);
    const y = Math.max(inch(line.y) - 0.01, 0);
    const w = Math.min(inch(rightEnd - line.x) + 0.12, slideW - x);
    const h = Math.max(inch(line.h) + 0.05, 0.1);

    if (x >= slideW || y >= slideH || w < 0.05) continue;

    slide.addText(textRuns, {
      x, y,
      w:          Math.max(w, 0.1),
      h,
      margin:     0,
      valign:     'top',
      wrap:       false,
      shrinkText: false,
      // Fully transparent — background image shows through
      fill:       { color: 'FFFFFF', transparency: 100 },
      line:       { color: 'FFFFFF', width: 0, transparency: 100 },
    });
  }

  return slide;
}

// Aliases
export { addCleanSlide as addTextSlide };

// ── Presentation ────────────────────────────────────────────────────────────

export async function createPresentation(pageWidthPt, pageHeightPt) {
  const { default: PptxGenJS } = await import('pptxgenjs');
  const prs = new PptxGenJS();
  prs.defineLayout({ name: 'PDF_PAGE', width: inch(pageWidthPt), height: inch(pageHeightPt) });
  prs.layout = 'PDF_PAGE';
  return prs;
}

export async function savePresentation(prs, filename) {
  const buf  = await prs.write({ outputType: 'arraybuffer' });
  const blob = new Blob([buf], {
    type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  });
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href     = url;
  a.download = filename.endsWith('.pptx') ? filename : filename + '.pptx';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
