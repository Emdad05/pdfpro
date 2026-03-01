/**
 * pdfExtract.js
 * ─────────────────────────────────────────────────────────────
 * Extracts rich text data from a PDF page using pdfjs-dist.
 *
 * TextLine {
 *   y    : number   // top-edge in POINTS from page top
 *   x    : number   // left-edge in POINTS
 *   h    : number   // line height in POINTS
 *   runs : TextRun[]
 * }
 *
 * TextRun {
 *   text     : string
 *   fontSize : number   // points
 *   bold     : boolean
 *   italic   : boolean
 *   fontFace : string
 *   color    : string   // hex "RRGGBB"
 *   x        : number   // left-edge POINTS from page left
 *   y        : number   // BASELINE in POINTS from page bottom (PDF coords)
 *   w        : number   // width in POINTS
 * }
 */

// ─── Helpers ──────────────────────────────────────────────────────────────────

function rgbToHex(r, g, b) {
  return byteHex(Math.round(r * 255)) +
         byteHex(Math.round(g * 255)) +
         byteHex(Math.round(b * 255));
}

function byteHex(n) {
  return Math.max(0, Math.min(255, n)).toString(16).padStart(2, '0');
}

// ─── Color extraction ─────────────────────────────────────────────────────────

/**
 * Scan the operator list and return a flat array of hex color strings,
 * one entry per logical text-string shown on the page.
 *
 * FIX 1: getOperatorList() is now called ONCE in extractPageText and the
 *         result is passed in — not called again inside here.
 *
 * FIX 2: showSpacedText emits one operator but can produce MULTIPLE pdfjs
 *         textContent items (one per string segment in the kerned array).
 *         We push one color entry per string-segment so the index stays
 *         aligned with the textContent item stream.
 */
function buildColorMap(opList, OPS) {
  const colorMap = [];
  let curColor = '000000'; // default black

  for (let i = 0; i < opList.fnArray.length; i++) {
    const fn   = opList.fnArray[i];
    const args = opList.argsArray[i] || [];

    // Track the active fill color
    if (fn === OPS.setFillRGBColor) {
      curColor = rgbToHex(args[0], args[1], args[2]);

    } else if (fn === OPS.setFillGray) {
      const v  = Math.round(args[0] * 255);
      curColor = byteHex(v) + byteHex(v) + byteHex(v);

    } else if (fn === OPS.setFillColorN || fn === OPS.setFillColor) {
      if (args.length === 1) {
        // Grayscale
        const v = Math.round(args[0] * 255);
        curColor = byteHex(v) + byteHex(v) + byteHex(v);
      } else if (args.length >= 3 && args[0] <= 1 && args[1] <= 1 && args[2] <= 1) {
        // RGB
        curColor = rgbToHex(args[0], args[1], args[2]);
      }

    } else if (fn === OPS.showText || fn === OPS.nextLineShowText || fn === OPS.nextLineSetSpacingShowText) {
      // These produce exactly one text item
      colorMap.push(curColor);

    } else if (fn === OPS.showSpacedText) {
      // args[0] is an array of strings and kerning numbers.
      // pdfjs textContent emits one item per contiguous string run.
      const segments = Array.isArray(args[0]) ? args[0] : [];
      const strCount = segments.filter(s => typeof s === 'string' && s.length > 0).length;
      for (let s = 0; s < Math.max(strCount, 1); s++) {
        colorMap.push(curColor);
      }
    }
  }

  return colorMap;
}

// ─── Font resolution ──────────────────────────────────────────────────────────

/**
 * Resolve bold/italic/fontFace from the pdfjs font object stored in commonObjs.
 */
function resolveFontStyle(page, fontName) {
  let bold = false, italic = false, fontFace = 'Arial';

  try {
    const fontObj = page.commonObjs.get(fontName);
    if (fontObj) {
      const raw = (fontObj.name || fontObj.loadedName || fontName || '').toLowerCase();

      bold   = /bold|heavy|black|extrabold|semibold|demi/.test(raw);
      italic = /italic|oblique|slanted/.test(raw) || fontObj.italic === true;

      // PDF font names: "ABCDEF+Arial-BoldItalic" → extract "Arial"
      const clean = (fontObj.name || fontObj.loadedName || fontName)
        .replace(/^[A-Z]{6}\+/, '')        // strip 6-char subset prefix
        .split(/[-,_]/)[0]                  // take base family before first dash/comma
        .replace(/(MT|PS|PC|Std|Pro|LT)$/, '') // strip common suffixes
        .trim();

      if (clean && clean.length > 1) fontFace = clean;
    } else {
      // No font object yet — fall back to parsing the resource name string
      const raw = (fontName || '').toLowerCase();
      bold   = /bold|heavy|black/.test(raw);
      italic = /italic|oblique/.test(raw);
    }
  } catch (_) { /* font not loaded yet — use defaults */ }

  return { bold, italic, fontFace };
}

// ─── Font size ────────────────────────────────────────────────────────────────

/**
 * FIX 3: Old code used Math.abs(d) which returns ~0 for 90°-rotated text
 * (where the transform has c != 0 but d == 0). The correct formula is:
 *   fontSize = sqrt(c² + d²)
 * This is the magnitude of the y-axis vector of the CTM, which equals
 * the rendered point size for ALL text orientations.
 */
function parseFontSize(transform) {
  const c = transform[2];
  const d = transform[3];
  const size = Math.sqrt(c * c + d * d);
  return Math.max(size, 1);
}

// ─── Line clustering ──────────────────────────────────────────────────────────

/**
 * FIX 4: Old code used `item.fontSize * 0.45` as the per-item tolerance,
 * but compared against curLine.baselineY which was set by the FIRST (possibly
 * large-font) item in the line. A small subscript or icon would have a tiny
 * tolerance and get split into a new line even though it sits on the same baseline.
 *
 * Fix: track the running max fontSize in the current line and use THAT
 * for the tolerance, so all same-baseline items cluster correctly.
 */
function clusterIntoLines(items) {
  if (!items.length) return [];

  // Sort: top of page first (descending PDF y), then left to right
  items.sort((a, b) => b.y - a.y || a.x - b.x);

  const lines = [];
  let curLine = null;
  let lineMaxFontSize = 0;

  for (const item of items) {
    const tol = Math.max(lineMaxFontSize, item.fontSize) * 0.55;

    if (!curLine || Math.abs(item.y - curLine.baselineY) > tol) {
      curLine = { baselineY: item.y, runs: [] };
      lineMaxFontSize = item.fontSize;
      lines.push(curLine);
    } else {
      lineMaxFontSize = Math.max(lineMaxFontSize, item.fontSize);
    }
    curLine.runs.push(item);
  }

  // Sort runs left-to-right within each line
  for (const line of lines) {
    line.runs.sort((a, b) => a.x - b.x);
  }

  return lines;
}

// ─── Run merging ──────────────────────────────────────────────────────────────

/**
 * Merge adjacent runs in a line that share the same visual style.
 */
function mergeRuns(runs) {
  if (!runs.length) return [];
  const merged = [{ ...runs[0] }];

  for (let i = 1; i < runs.length; i++) {
    const prev = merged[merged.length - 1];
    const cur  = runs[i];

    const sameStyle =
      prev.bold     === cur.bold     &&
      prev.italic   === cur.italic   &&
      prev.fontFace === cur.fontFace &&
      prev.color    === cur.color    &&
      Math.abs(prev.fontSize - cur.fontSize) < 0.5;

    const gap = cur.x - (prev.x + prev.w);

    if (sameStyle && gap < prev.fontSize * 0.8) {
      // Insert a space when there is a visible gap between runs
      prev.text += (gap > prev.fontSize * 0.2 ? ' ' : '') + cur.text;
      prev.w     = (cur.x + cur.w) - prev.x;
    } else {
      merged.push({ ...cur });
    }
  }

  return merged;
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Extract all styled text runs from a single PDF page.
 */
export async function extractPageText(page, pdfjsLib) {
  const viewport    = page.getViewport({ scale: 1 });
  const pageWidth   = viewport.width;
  const pageHeight  = viewport.height;
  const isLandscape = pageWidth > pageHeight;

  // FIX 1: Fetch operator list ONCE here; pass it to buildColorMap
  // so it is not fetched again (pdfjs does cache it, but the double
  // call was wasteful and the original buildColorMap had its own await).
  const opList = await page.getOperatorList();

  // Handle both pdfjs module shapes: pdfjsLib.OPS or pdfjsLib.default.OPS
  const OPS = pdfjsLib.OPS ?? pdfjsLib.default?.OPS ?? {};

  const colorMap   = buildColorMap(opList, OPS);
  const textContent = await page.getTextContent({ includeMarkedContent: false });

  // FIX 2: Track op color index separately from the textContent item index.
  // We only advance opColorIdx for non-empty strings, matching buildColorMap's
  // logic of pushing one entry per rendered string segment.
  let opColorIdx = 0;
  const items    = [];

  for (const item of textContent.items) {
    // Skip items with no text (pdfjs emits these for some marked-content tags)
    if (!item.str) continue;

    const transform = item.transform;
    const fontSize  = parseFontSize(transform);
    const x         = transform[4];
    const y         = transform[5]; // baseline from page BOTTOM (PDF coords)

    const color = colorMap[opColorIdx] ?? '000000';

    // Only advance the color index for actual visible text (not whitespace-only)
    if (item.str.trim().length > 0) opColorIdx++;

    const { bold, italic, fontFace } = resolveFontStyle(page, item.fontName);

    items.push({
      text:     item.str,
      fontSize,
      bold,
      italic,
      fontFace,
      color,
      x,
      y,
      // item.width is in user-space coords at scale=1 (same as page points)
      w: Math.max(item.width || fontSize * item.str.length * 0.55, 1),
    });
  }

  const rawLines = clusterIntoLines(items);

  const lines = rawLines.map(line => {
    const runs    = mergeRuns(line.runs);
    const maxSize = Math.max(...runs.map(r => r.fontSize));
    const minX    = Math.min(...runs.map(r => r.x));

    // Convert y from PDF bottom-origin to top-origin (page coordinate flip)
    const yTopOrigin = pageHeight - line.baselineY - maxSize * 0.2;

    return {
      y:    yTopOrigin,
      x:    minX,
      h:    maxSize * 1.35,
      runs,
    };
  });

  return { lines, pageWidth, pageHeight, isLandscape };
}

/**
 * Render a PDF page to a JPEG data-URL at the given scale.
 */
export async function renderPageToImage(page, scale = 2, quality = 0.92) {
  const viewport = page.getViewport({ scale });
  const canvas   = document.createElement('canvas');
  canvas.width   = viewport.width;
  canvas.height  = viewport.height;
  await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
  return canvas.toDataURL('image/jpeg', quality);
}

/**
 * Extract images from a PDF page as positioned data-URLs.
 * Returns array of { x, y, w, h, dataUrl } in page-point coordinates (top-origin).
 *
 * Strategy: render the full page, then crop out each rectangle where an image
 * operator was found. Uses the page's CTM to locate image bounds.
 */
export async function extractPageImages(page, scale = 2) {
  const viewport   = page.getViewport({ scale });
  const pageWidth  = viewport.width / scale;   // points
  const pageHeight = viewport.height / scale;

  // Render the full page at scale
  const fullCanvas = document.createElement('canvas');
  fullCanvas.width  = viewport.width;
  fullCanvas.height = viewport.height;
  const ctx = fullCanvas.getContext('2d');
  await page.render({ canvasContext: ctx, viewport }).promise;

  // Get operator list to find image paint operators
  const opList = await page.getOperatorList();
  const OPS = opList.fnArray; // function codes

  const images = [];

  // Walk through operators looking for image paint commands
  // pdfjs OPS values: paintImageXObject=85, paintInlineImageXObject=84
  // We detect them by checking the transform matrix at that point
  for (let i = 0; i < opList.fnArray.length; i++) {
    const fn = opList.fnArray[i];
    // 85 = paintImageXObject, 84 = paintInlineImageXObject
    if (fn !== 85 && fn !== 84) continue;

    // Look backwards for the current transform matrix (cm operator = 32)
    // The cm operator sets args: [a,b,c,d,e,f]
    let cm = null;
    for (let j = i - 1; j >= Math.max(0, i - 20); j--) {
      if (opList.fnArray[j] === 32) { // cm
        cm = opList.argsArray[j];
        break;
      }
    }
    if (!cm) continue;

    // cm args: [a, b, c, d, e, f] — image drawn from (e,f) with size (a x d) in user space
    const [a, b, c, d, e, f] = cm;
    const imgW = Math.abs(a);
    const imgH = Math.abs(d);

    // Skip tiny images (icons, bullets etc)
    if (imgW < 20 || imgH < 20) continue;

    // PDF y is bottom-origin; convert to top-origin
    const xPt = e;
    const yPt = pageHeight - f; // top of image in top-origin coords

    // Skip if out of page bounds
    if (xPt < 0 || yPt < 0 || xPt + imgW > pageWidth + 5 || yPt + imgH > pageHeight + 5) continue;

    // Crop from the full render
    const cx = Math.round(xPt * scale);
    const cy = Math.round((pageHeight - f - imgH) * scale);
    const cw = Math.round(imgW * scale);
    const ch = Math.round(imgH * scale);

    if (cw < 10 || ch < 10) continue;

    const crop = document.createElement('canvas');
    crop.width  = cw;
    crop.height = ch;
    crop.getContext('2d').drawImage(fullCanvas, cx, cy, cw, ch, 0, 0, cw, ch);
    const dataUrl = crop.toDataURL('image/jpeg', 0.92);

    images.push({ x: xPt, y: yPt, w: imgW, h: imgH, dataUrl });
  }

  return images;
}
