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

/**
 * extractPageImages — proper graphics-state-aware image extraction
 *
 * Walks the full operator list, maintaining a proper CTM stack (q/Q push/pop,
 * cm multiplies). When a paint-image op is found, the current CTM tells us
 * exactly where the unit-square image lands in PDF user space (bottom-origin).
 * We then render the page, crop that region, and return it as a positioned box.
 *
 * @returns {Promise<Array<{x,y,w,h,dataUrl}>>}  top-origin page points
 */
export async function extractPageImages(page, pdfjsLib, scale = 2.5) {
  const viewport   = page.getViewport({ scale });
  const pageWidth  = viewport.width  / scale;   // points, unscaled
  const pageHeight = viewport.height / scale;

  // ── Get operator list ─────────────────────────────────────────────────────
  const opList = await page.getOperatorList();
  const OPS    = pdfjsLib.OPS ?? pdfjsLib.default?.OPS ?? {};

  // Resolve numeric op codes for the ops we care about
  // (pdfjs uses numeric codes; OPS maps name→number)
  const OP_q    = OPS.save              ?? 14;
  const OP_Q    = OPS.restore           ?? 15;
  const OP_cm   = OPS.transform         ?? 32;
  const OP_imgX = OPS.paintImageXObject ?? 85;
  const OP_imgI = OPS.paintInlineImageXObject ?? 84;
  const OP_imgM = OPS.paintImageMaskXObject   ?? 83;

  // ── Matrix helpers ────────────────────────────────────────────────────────
  // Matrix format: [a, b, c, d, e, f]  (column-major 3×3 affine)
  const identity = () => [1, 0, 0, 1, 0, 0];

  function multiply(m1, m2) {
    const [a1,b1,c1,d1,e1,f1] = m1;
    const [a2,b2,c2,d2,e2,f2] = m2;
    return [
      a1*a2 + b1*c2,
      a1*b2 + b1*d2,
      c1*a2 + d1*c2,
      c1*b2 + d1*d2,
      e1*a2 + f1*c2 + e2,
      e1*b2 + f1*d2 + f2,
    ];
  }

  function transformPoint(m, px, py) {
    return [m[0]*px + m[2]*py + m[4], m[1]*px + m[3]*py + m[5]];
  }

  // ── Walk operator list, track CTM stack ──────────────────────────────────
  let ctm   = identity();
  const stack = [];   // graphics-state stack
  const found = [];   // raw image bounds in PDF user space (bottom-origin)

  for (let i = 0; i < opList.fnArray.length; i++) {
    const fn   = opList.fnArray[i];
    const args = opList.argsArray[i] || [];

    if (fn === OP_q) {
      stack.push([...ctm]);
    } else if (fn === OP_Q) {
      if (stack.length) ctm = stack.pop();
    } else if (fn === OP_cm) {
      // args = [a,b,c,d,e,f] — multiply into current CTM
      ctm = multiply(ctm, args);
    } else if (fn === OP_imgX || fn === OP_imgI || fn === OP_imgM) {
      // An image is painted as a unit square [0,1]×[0,1]
      // Transform all four corners through the current CTM
      const corners = [
        transformPoint(ctm, 0, 0),
        transformPoint(ctm, 1, 0),
        transformPoint(ctm, 0, 1),
        transformPoint(ctm, 1, 1),
      ];
      const xs = corners.map(c => c[0]);
      const ys = corners.map(c => c[1]);
      const x0 = Math.min(...xs), x1 = Math.max(...xs);
      const y0 = Math.min(...ys), y1 = Math.max(...ys);
      const w  = x1 - x0;
      const h  = y1 - y0;

      // Skip tiny images (icons, decorations, separator lines, etc.)
      if (w < 20 || h < 20) continue;

      // PDF coords are bottom-origin; y0 is bottom of image in PDF space
      // Convert to top-origin: yTop = pageHeight - y_bottom - imgHeight
      const xTop = x0;
      const yTop = pageHeight - y1;   // y1 is the top in PDF (largest y value)

      found.push({ xPdf: x0, yPdfBottom: y0, xTop, yTop, w, h });
    }
  }

  if (!found.length) return [];

  // ── Render the full page once, then crop each image region ───────────────
  const canvas   = document.createElement('canvas');
  canvas.width   = viewport.width;
  canvas.height  = viewport.height;
  await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;

  const results = [];
  const seen    = new Set(); // deduplicate near-identical bounds

  for (const img of found) {
    // Round to avoid float jitter
    const cx = Math.round(img.xTop  * scale);
    const cy = Math.round(img.yTop  * scale);
    const cw = Math.round(img.w     * scale);
    const ch = Math.round(img.h     * scale);

    // Clamp to canvas
    const sx = Math.max(cx, 0);
    const sy = Math.max(cy, 0);
    const sw = Math.min(cw, canvas.width  - sx);
    const sh = Math.min(ch, canvas.height - sy);
    if (sw < 8 || sh < 8) continue;

    // Deduplicate — same position within 2px
    const key = `${Math.round(cx/4)}_${Math.round(cy/4)}_${Math.round(cw/4)}_${Math.round(ch/4)}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const crop = document.createElement('canvas');
    crop.width  = sw;
    crop.height = sh;
    crop.getContext('2d').drawImage(canvas, sx, sy, sw, sh, 0, 0, sw, sh);
    const dataUrl = crop.toDataURL('image/png');  // PNG preserves quality

    results.push({
      x: img.xTop,
      y: img.yTop,
      w: img.w,
      h: img.h,
      dataUrl,
    });
  }

  return results;
}
