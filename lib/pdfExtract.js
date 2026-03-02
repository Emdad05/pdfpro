/**
 * pdfExtract.js
 *
 * Extracts word-level text from a PDF page using pdfjs-dist.
 * Groups words into lines by Y proximity, then returns positioned TextLine objects.
 *
 * TextLine {
 *   x    : number   // left edge, points from page left
 *   y    : number   // top edge, points from page top
 *   h    : number   // line height in points
 *   runs : TextRun[]
 * }
 *
 * TextRun {
 *   text     : string
 *   fontSize : number
 *   bold     : boolean
 *   italic   : boolean
 *   fontFace : string
 *   color    : string   // "RRGGBB"
 *   x        : number
 *   y        : number   // top edge (top-origin)
 *   w        : number
 * }
 */

// ── Helpers ────────────────────────────────────────────────────────────────

function byteHex(n) {
  return Math.max(0, Math.min(255, n)).toString(16).padStart(2, '0');
}

function rgbToHex(r, g, b) {
  return byteHex(Math.round(r * 255)) +
         byteHex(Math.round(g * 255)) +
         byteHex(Math.round(b * 255));
}

// OpenSymbol / Symbol private-use → real Unicode bullets
const SYMBOL_MAP = {
  '\uf0b7': '•', '\uf0a7': '▪', '\uf076': '✓', '\uf0fc': '✓',
  '\uf0d8': '➢', '\uf0e8': '➨', '\uf0f0': '→', '\uf020': ' ',
  '\uf02d': '–', '\uf02e': '.', '\uf0e0': '✉',
};

function fixSymbolText(text, fontName) {
  if (!fontName) return text;
  const fn = fontName.toLowerCase();
  if (fn.includes('opensymbol') || fn.includes('symbol') || fn.includes('wingdings')) {
    return [...text].map(ch => SYMBOL_MAP[ch] || (ch.charCodeAt(0) > 0xF000 ? '•' : ch)).join('');
  }
  return text;
}

function cleanFontName(raw) {
  if (!raw) return 'Calibri';
  // Strip PDF subset prefix: "BAAAAA+FontName" → "FontName"
  const name = raw.replace(/^[A-Z]{6}\+/, '');
  if (/carlito/i.test(name)) return 'Carlito';
  if (/timesnewroman|times new roman/i.test(name)) return 'Times New Roman';
  if (/arial/i.test(name)) return 'Arial';
  if (/helvetica/i.test(name)) return 'Arial';
  if (/calibri/i.test(name)) return 'Calibri';
  if (/opensymbol|symbol|wingdings/i.test(name)) return 'Arial';
  // Generic: strip weight/style suffixes and return base name
  return name.replace(/[-,](Bold|Italic|Regular|Medium|Light|Semibold).*/i, '').trim() || 'Calibri';
}

function isBold(raw) {
  return raw ? /bold/i.test(raw) : false;
}

function isItalic(raw) {
  return raw ? /italic|oblique/i.test(raw) : false;
}

// ── Color extraction from operator list ───────────────────────────────────

function buildColorMap(opList, OPS) {
  const map = [];
  let cur   = '000000';

  for (let i = 0; i < opList.fnArray.length; i++) {
    const fn   = opList.fnArray[i];
    const args = opList.argsArray[i] || [];

    if (fn === OPS.setFillRGBColor) {
      cur = rgbToHex(args[0], args[1], args[2]);
    } else if (fn === OPS.setFillGray) {
      const v = Math.round(args[0] * 255);
      cur = byteHex(v) + byteHex(v) + byteHex(v);
    } else if (fn === OPS.setFillColorN || fn === OPS.setFillColor) {
      if (args.length === 1) {
        const v = Math.round(args[0] * 255);
        cur = byteHex(v) + byteHex(v) + byteHex(v);
      } else if (args.length >= 3) {
        cur = rgbToHex(args[0], args[1], args[2]);
      }
    } else if (
      fn === OPS.showText ||
      fn === OPS.nextLineShowText ||
      fn === OPS.nextLineSetSpacingShowText
    ) {
      map.push(cur);
    } else if (fn === OPS.showSpacedText) {
      const segs = Array.isArray(args[0]) ? args[0] : [];
      const count = segs.filter(s => typeof s === 'string' && s.length > 0).length;
      for (let s = 0; s < Math.max(count, 1); s++) map.push(cur);
    }
  }
  return map;
}

// ── Main extraction ────────────────────────────────────────────────────────

/**
 * Extract text from a PDF page as positioned TextLines.
 */
export async function extractPageText(page, pdfjsLib) {
  const viewport   = page.getViewport({ scale: 1 });
  const pageWidth  = viewport.width;
  const pageHeight = viewport.height;

  const OPS     = pdfjsLib.OPS ?? pdfjsLib.default?.OPS ?? {};
  const opList  = await page.getOperatorList();
  const colorMap = buildColorMap(opList, OPS);

  const textContent = await page.getTextContent({ includeMarkedContent: false });

  // ── Build flat list of positioned items ──────────────────────────────────
  let colorIdx = 0;
  const items  = [];

  for (const item of textContent.items) {
    if (!('str' in item)) continue;  // skip markers

    const str   = item.str || '';
    const color = colorMap[colorIdx] ?? '000000';
    if (str.trim().length > 0) colorIdx++;

    const transform = item.transform;
    // transform = [scaleX, skewX, skewY, scaleY, tx, ty]
    // fontSize ≈ scaleY (absolute value)
    const fontSize = Math.abs(transform[3]) || Math.abs(transform[0]) || 12;

    // PDF coordinates: (tx, ty) is baseline, y measured from BOTTOM of page
    const tx = transform[4];
    const ty = transform[5];  // baseline, bottom-origin

    // Convert to top-origin
    const yTop = pageHeight - ty - fontSize * 0.2;  // small descender offset
    const xLeft = tx;
    const itemW = item.width || fontSize * str.length * 0.5;

    // Resolve font info
    const fontObj  = page.commonObjs.has(item.fontName)
      ? page.commonObjs.get(item.fontName)
      : null;
    const rawFont  = fontObj?.name || item.fontName || '';

    const text = fixSymbolText(str, rawFont);
    if (!text) continue;

    items.push({
      text,
      fontSize,
      bold:     isBold(rawFont),
      italic:   isItalic(rawFont),
      fontFace: cleanFontName(rawFont),
      color,
      x:   xLeft,
      y:   yTop,
      w:   itemW,
    });
  }

  // ── Group items into lines by Y proximity ────────────────────────────────
  // Snap y to a grid (half the median font size) to cluster same-line items
  const sizes     = items.map(it => it.fontSize);
  const medSize   = sizes.length ? sizes.sort((a,b)=>a-b)[Math.floor(sizes.length/2)] : 12;
  const snapGrid  = Math.max(medSize * 0.55, 4);

  const lineMap   = new Map();  // snapped-y → items[]

  for (const it of items) {
    const key = Math.round(it.y / snapGrid) * snapGrid;
    if (!lineMap.has(key)) lineMap.set(key, []);
    lineMap.get(key).push(it);
  }

  // ── Convert map to sorted TextLine array ─────────────────────────────────
  const lines = [];

  for (const [, lineItems] of [...lineMap.entries()].sort((a,b) => a[0]-b[0])) {
    // Sort left-to-right
    lineItems.sort((a, b) => a.x - b.x);

    // Skip pure artifact dots (placeholder chars in some PDFs)
    const full = lineItems.map(it => it.text.trim()).join('').trim();
    if (!full || (full === '.' && lineItems.length === 1 && lineItems[0].fontSize < 20)) continue;

    const minX = Math.min(...lineItems.map(it => it.x));
    const minY = Math.min(...lineItems.map(it => it.y));
    const maxY = Math.max(...lineItems.map(it => it.y + it.fontSize * 1.2));

    lines.push({
      x:    minX,
      y:    minY,
      h:    maxY - minY,
      runs: lineItems.map(it => ({ ...it })),
    });
  }

  return { lines, pageWidth, pageHeight };
}

/**
 * Render a page to a JPEG/PNG data-URL.
 * Used for background in hybrid mode, or image-only mode.
 */
export async function renderPageToImage(page, scale = 2.5, quality = 0.95) {
  const viewport = page.getViewport({ scale });
  const canvas   = document.createElement('canvas');
  canvas.width   = viewport.width;
  canvas.height  = viewport.height;
  await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
  // Use PNG for lossless quality at high scale
  return canvas.toDataURL('image/png');
}
