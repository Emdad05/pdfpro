/**
 * pptxBuilder.js
 *
 * Clean white-slide approach:
 *   1. White background
 *   2. Extracted image boxes at exact PDF positions
 *   3. Extracted text boxes at exact PDF positions
 *
 * Everything is a real object — fully editable in PowerPoint.
 * No page-render layer. No double text. No photos of text.
 */

const PT  = 72;                     // PDF points per inch
const i   = (pt) => pt / PT;       // points → inches

// ── Font sanitiser ─────────────────────────────────────────────────────────

function cleanFont(name) {
  if (!name || name.length < 2) return 'Arial';
  return name
    .replace(/,\s*(Bold|Italic|BoldItalic|Regular).*/i, '')  // strip style suffixes
    .replace(/(MT|PS|PC|Std|Pro|LT|Regular)$/i, '')
    .replace(/[^a-zA-Z0-9 \-]/g, '')
    .trim() || 'Arial';
}

// ── Slide builders ─────────────────────────────────────────────────────────

/**
 * Pure image slide — used when user picks "Image only" mode.
 */
export function addImageSlide(prs, imgDataUrl, widthPt, heightPt) {
  const slide = prs.addSlide();
  slide.addImage({ data: imgDataUrl, x: 0, y: 0, w: i(widthPt), h: i(heightPt) });
  return slide;
}

/**
 * Clean white slide with positioned text boxes + image boxes.
 * No background render — everything is a real editable object.
 *
 * @param {object}   prs          - pptxgenjs instance
 * @param {Array}    lines        - text lines from extractPageText
 * @param {Array}    images       - image objects from extractPageImages [{x,y,w,h,dataUrl}]
 * @param {number}   pageWidthPt  - page width in points
 * @param {number}   pageHeightPt - page height in points
 */
export function addCleanSlide(prs, lines, images, pageWidthPt, pageHeightPt) {
  const slide  = prs.addSlide();
  const slideW = i(pageWidthPt);
  const slideH = i(pageHeightPt);

  // ── 1. White background ──────────────────────────────────────────────────
  slide.addShape('rect', {
    x: 0, y: 0, w: slideW, h: slideH,
    fill: { color: 'FFFFFF' },
    line: { color: 'FFFFFF', width: 0 },
  });

  // ── 2. Image boxes — placed first so text renders on top ─────────────────
  for (const img of images) {
    const x = Math.max(i(img.x), 0);
    const y = Math.max(i(img.y), 0);
    const w = Math.min(i(img.w), slideW - x);
    const h = Math.min(i(img.h), slideH - y);
    if (w < 0.05 || h < 0.05) continue;

    slide.addImage({ data: img.dataUrl, x, y, w, h });
  }

  // ── 3. Text boxes ────────────────────────────────────────────────────────
  for (const line of lines) {
    if (!line.runs?.length) continue;

    // Clamp y to page
    if (line.y < -5 || line.y > pageHeightPt + 5) continue;

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
    const x = Math.max(i(line.x), 0);
    const y = Math.max(i(line.y), 0);
    const w = Math.min(i(rightEnd - line.x) + 0.08, slideW - x);
    const h = Math.max(i(line.h) + 0.04, 0.08);

    if (x >= slideW || y >= slideH || w < 0.05) continue;

    slide.addText(textRuns, {
      x, y,
      w: Math.max(w, 0.1),
      h,
      margin:     0,
      valign:     'top',
      wrap:       false,
      shrinkText: false,
      // Transparent fill — text box has no background
      fill: { type: 'none' },
      line: { width: 0 },
    });
  }

  return slide;
}

// Aliases for backward compat
export { addCleanSlide as addHybridSlide, addCleanSlide as addTextSlide };

// ── Presentation ────────────────────────────────────────────────────────────

export async function createPresentation(pageWidthPt, pageHeightPt) {
  const { default: PptxGenJS } = await import('pptxgenjs');
  const prs = new PptxGenJS();
  prs.defineLayout({ name: 'PDF_PAGE', width: i(pageWidthPt), height: i(pageHeightPt) });
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
