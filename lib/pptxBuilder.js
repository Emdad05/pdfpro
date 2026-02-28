/**
 * pptxBuilder.js
 * ─────────────────────────────────────────────────────────────
 * Takes extracted TextLine data and builds a PPTX presentation
 * using pptxgenjs, with accurate text positioning, font sizes,
 * bold, italic, and color preserved.
 */

const POINTS_PER_INCH = 72;

function ptToIn(pt) {
  return pt / POINTS_PER_INCH;
}

/**
 * Determine if a color is "too light" against a white background.
 * Treats near-white as black for visibility.
 */
function ensureVisible(hexColor) {
  const r = parseInt(hexColor.slice(0, 2), 16);
  const g = parseInt(hexColor.slice(2, 4), 16);
  const b = parseInt(hexColor.slice(4, 6), 16);
  // Luminance check
  const lum = 0.299 * r + 0.587 * g + 0.114 * b;
  if (lum > 230) return '222222'; // near-white → dark grey
  return hexColor;
}

/**
 * Clean up a font face name for PPTX compatibility.
 * pptxgenjs will fall back to Arial if font isn't installed.
 */
function sanitizeFontFace(name) {
  if (!name || name.length < 2) return 'Arial';
  // FIX: Added `g` flag — old code only stripped the FIRST bad character.
  return name
    .replace(/(MT|PS|PC|Std|Pro|LT)$/, '')
    .replace(/[^a-zA-Z0-9\s\-]/g, '')
    .trim() || 'Arial';
}

/**
 * Add a page as pure image slide (fallback for portrait/complex PDFs).
 */
export function addImageSlide(prs, imgDataUrl, widthPt, heightPt) {
  const slide = prs.addSlide();
  slide.addImage({
    data: imgDataUrl,
    x: 0,
    y: 0,
    w: ptToIn(widthPt),
    h: ptToIn(heightPt),
  });
  return slide;
}

/**
 * Add a page as a text slide with fully styled, positioned text boxes.
 *
 * @param {PptxGenJs}   prs
 * @param {string|null} bgImageDataUrl  — optional background image (null = white bg)
 * @param {TextLine[]}  lines
 * @param {number}      pageWidthPt
 * @param {number}      pageHeightPt
 */
export function addTextSlide(prs, bgImageDataUrl, lines, pageWidthPt, pageHeightPt) {
  const slide  = prs.addSlide();
  const slideW = ptToIn(pageWidthPt);
  const slideH = ptToIn(pageHeightPt);

  // Add background
  if (bgImageDataUrl) {
    slide.addImage({ data: bgImageDataUrl, x: 0, y: 0, w: slideW, h: slideH });
  } else {
    // White background rectangle
    slide.addShape('rect', {
      x: 0, y: 0, w: slideW, h: slideH,
      fill: { color: 'FFFFFF' },
      line: { color: 'FFFFFF', width: 0 },
    });
  }

  // Add text boxes for each line
  for (const line of lines) {
    if (!line.runs || !line.runs.length) continue;

    // Skip lines outside the page (bad coordinates)
    if (line.y < -10 || line.y > pageHeightPt + 10) continue;

    // Build pptxgenjs text run array
    const textRuns = line.runs
      .filter(r => r.text.trim().length > 0)
      .map(run => ({
        text: run.text,
        options: {
          fontSize:  Math.max(Math.round(run.fontSize * 0.95), 6), // slight reduction for spacing
          bold:      run.bold,
          italic:    run.italic,
          fontFace:  sanitizeFontFace(run.fontFace),
          color:     ensureVisible(run.color || '000000'),
          breakLine: false,
        },
      }));

    if (!textRuns.length) continue;

    // Compute bounding box for this line in inches
    const x = Math.max(ptToIn(line.x) - 0.02, 0);
    const y = Math.max(ptToIn(line.y) - 0.02, 0);

    // Width: from leftmost x to rightmost x+w of all runs
    const rightmost = Math.max(...line.runs.map(r => r.x + r.w));
    const w = Math.min(ptToIn(rightmost - line.x) + 0.15, slideW - x);
    const h = Math.max(ptToIn(line.h) + 0.02, 0.1);

    // Clamp to slide bounds
    if (x >= slideW || y >= slideH) continue;

    slide.addText(textRuns, {
      x,
      y,
      w: Math.max(w, 0.1),
      h,
      margin: 0,
      valign: 'top',
      wrap:   true,
      shrinkText: false,
    });
  }

  return slide;
}

/**
 * Create and configure the pptxgenjs presentation with the correct slide size.
 */
export async function createPresentation(pageWidthPt, pageHeightPt) {
  const { default: PptxGenJS } = await import('pptxgenjs');
  const prs = new PptxGenJS();

  const w = ptToIn(pageWidthPt);
  const h = ptToIn(pageHeightPt);

  // defineLayout with custom dimensions matching the PDF
  prs.defineLayout({ name: 'PDF_SIZE', width: w, height: h });
  prs.layout = 'PDF_SIZE';

  return prs;
}

/**
 * Save the presentation as a Blob and trigger download.
 */
export async function savePresentation(prs, filename) {
  const data = await prs.write({ outputType: 'blob' });
  const url  = URL.createObjectURL(data);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
