/**
 * pptxBuilder.js
 *
 * iLovePDF-style conversion:
 *  - Full page render as background image (captures ALL graphics, colours, effects)
 *  - Transparent text boxes placed on top at exact positions
 *  - Text boxes have NO fill → background shows through
 *  - Text colour matches extraction → visually identical, but text is editable
 */

const PT_PER_INCH = 72;
const pt = (v) => v / PT_PER_INCH;

function sanitizeFont(name) {
  if (!name || name.length < 2) return 'Arial';
  return name.replace(/(MT|PS|PC|Std|Pro|LT|Bold|Italic)[-\s]?/g, '')
             .replace(/[^a-zA-Z0-9 \-]/g, '')
             .trim() || 'Arial';
}

// ── Slide builders ────────────────────────────────────────────────

/**
 * Pure image slide — each page becomes one image.
 * Used when user picks "Image" mode.
 */
export function addImageSlide(prs, imgDataUrl, widthPt, heightPt) {
  const slide = prs.addSlide();
  slide.addImage({ data: imgDataUrl, x: 0, y: 0, w: pt(widthPt), h: pt(heightPt) });
  return slide;
}

/**
 * iLovePDF-style slide:
 *   1. Full page render as locked background image (visual fidelity)
 *   2. Transparent text boxes on top (editable, selectable)
 *
 * Text boxes have fill: none so the background image is fully visible.
 * Text colour matches the PDF extraction → no visible doubling.
 */
export function addHybridSlide(prs, bgImageDataUrl, lines, pageWidthPt, pageHeightPt) {
  const slide  = prs.addSlide();
  const slideW = pt(pageWidthPt);
  const slideH = pt(pageHeightPt);

  // 1. Background image — fills the entire slide
  if (bgImageDataUrl) {
    slide.addImage({ data: bgImageDataUrl, x: 0, y: 0, w: slideW, h: slideH });
  }

  // 2. Transparent text boxes on top
  for (const line of lines) {
    if (!line.runs?.length) continue;
    if (line.y < -10 || line.y > pageHeightPt + 10) continue;

    const textRuns = line.runs
      .filter(r => r.text && r.text.length > 0)
      .map(run => ({
        text: run.text,
        options: {
          fontSize:  Math.max(Math.round(run.fontSize), 6),
          bold:      run.bold   || false,
          italic:    run.italic || false,
          fontFace:  sanitizeFont(run.fontFace),
          // Use extracted colour — this makes text invisible over matching bg
          // so you see the image text, but the text box IS selectable/editable
          color:     run.color || '000000',
          breakLine: false,
          charSpacing: 0,
        },
      }));

    if (!textRuns.length) continue;

    const x        = Math.max(pt(line.x) - 0.01, 0);
    const y        = Math.max(pt(line.y) - 0.01, 0);
    const rightEnd = Math.max(...line.runs.map(r => r.x + r.w));
    const w        = Math.min(pt(rightEnd - line.x) + 0.1, slideW - x);
    const h        = Math.max(pt(line.h) + 0.04, 0.08);

    if (x >= slideW || y >= slideH || w < 0.05) continue;

    slide.addText(textRuns, {
      x, y,
      w:         Math.max(w, 0.1),
      h,
      margin:    0,
      valign:    'top',
      wrap:      false,
      shrinkText: false,
      // KEY: transparent fill — background image shows through
      fill:      { type: 'none' },
      // No border/line on the text box
      line:      { color: 'FFFFFF', width: 0, dashType: 'solid', transparency: 100 },
    });
  }

  return slide;
}

// Keep old name as alias for backward compat
export function addTextSlide(prs, bgImageDataUrl, lines, pageWidthPt, pageHeightPt) {
  return addHybridSlide(prs, bgImageDataUrl, lines, pageWidthPt, pageHeightPt);
}

export function addImageBox(slide, imgDataUrl, xPt, yPt, wPt, hPt) {
  slide.addImage({
    data: imgDataUrl,
    x:    pt(xPt),
    y:    pt(yPt),
    w:    pt(wPt),
    h:    pt(hPt),
  });
}

// ── Presentation setup ────────────────────────────────────────────

export async function createPresentation(pageWidthPt, pageHeightPt) {
  const { default: PptxGenJS } = await import('pptxgenjs');
  const prs = new PptxGenJS();
  prs.defineLayout({ name: 'PDF_PAGE', width: pt(pageWidthPt), height: pt(pageHeightPt) });
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
