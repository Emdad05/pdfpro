/**
 * inpaint.js
 *
 * Canvas-based background inpainting.
 * Erases text regions from an image and fills them seamlessly
 * using surrounding background pixel sampling (bilinear blend).
 *
 * Works entirely in the browser — no server, no ML model.
 */

/**
 * Inpaint an HTMLImageElement: erase text regions and fill with background.
 *
 * @param {HTMLImageElement} imgEl   - The loaded image
 * @param {Array} regions            - Array of {xPct, yPct, wPct, hPct}
 * @param {number} [threshold=195]   - Brightness threshold to detect background pixels
 * @param {number} [scanDist=100]    - Max scan distance in pixels
 * @returns {string}                 - PNG data URL of cleaned image
 */
export function inpaintImage(imgEl, regions, threshold = 195, scanDist = 100) {
  const W = imgEl.naturalWidth;
  const H = imgEl.naturalHeight;

  const canvas = document.createElement('canvas');
  canvas.width  = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(imgEl, 0, 0);

  const imageData = ctx.getImageData(0, 0, W, H);
  const px = imageData.data;  // RGBA flat array

  const pidx = (x, y) =>
    (Math.max(0, Math.min(H-1, y)) * W + Math.max(0, Math.min(W-1, x))) * 4;

  const bright = (x, y) => {
    const i = pidx(x, y);
    return (px[i] + px[i+1] + px[i+2]) / 3;
  };

  // Scan in direction (dx,0) or (0,dy) from (startX,y) until bright pixel found
  const scanH = (startX, y, dx) => {
    for (let d = 1; d <= scanDist; d++) {
      const x = startX + dx * d;
      if (x < 0 || x >= W) break;
      if (bright(x, y) > threshold) {
        const i = pidx(x, y);
        return [px[i], px[i+1], px[i+2]];
      }
    }
    const fx = Math.max(0, Math.min(W-1, startX + dx * scanDist));
    const i  = pidx(fx, y);
    return [px[i], px[i+1], px[i+2]];
  };

  const scanV = (x, startY, dy) => {
    for (let d = 1; d <= scanDist; d++) {
      const y = startY + dy * d;
      if (y < 0 || y >= H) break;
      if (bright(x, y) > threshold) {
        const i = pidx(x, y);
        return [px[i], px[i+1], px[i+2]];
      }
    }
    const fy = Math.max(0, Math.min(H-1, startY + dy * scanDist));
    const i  = pidx(x, fy);
    return [px[i], px[i+1], px[i+2]];
  };

  for (const region of regions) {
    const x0 = Math.max(0, Math.round(region.xPct * W));
    const y0 = Math.max(0, Math.round(region.yPct * H));
    const x1 = Math.min(W, Math.round((region.xPct + region.wPct) * W));
    const y1 = Math.min(H, Math.round((region.yPct + region.hPct) * H));

    const bW = x1 - x0;
    const bH = y1 - y0;
    if (bW <= 0 || bH <= 0) continue;

    // Pre-compute directional bg samples for every row and column
    const rowL = new Array(bH);
    const rowR = new Array(bH);
    for (let dy = 0; dy < bH; dy++) {
      rowL[dy] = scanH(x0,  y0 + dy, -1);
      rowR[dy] = scanH(x1 - 1, y0 + dy, +1);
    }

    const colT = new Array(bW);
    const colB = new Array(bW);
    for (let dx = 0; dx < bW; dx++) {
      colT[dx] = scanV(x0 + dx, y0,     -1);
      colB[dx] = scanV(x0 + dx, y1 - 1, +1);
    }

    // Fill each pixel with bilinear blend
    for (let dy = 0; dy < bH; dy++) {
      const ty = dy / Math.max(bH - 1, 1);
      for (let dx = 0; dx < bW; dx++) {
        const tx = dx / Math.max(bW - 1, 1);

        const L = rowL[dy], R = rowR[dy];
        const T = colT[dx], B = colB[dx];

        const rr = ((L[0]*(1-tx) + R[0]*tx) + (T[0]*(1-ty) + B[0]*ty)) / 2;
        const gg = ((L[1]*(1-tx) + R[1]*tx) + (T[1]*(1-ty) + B[1]*ty)) / 2;
        const bb = ((L[2]*(1-tx) + R[2]*tx) + (T[2]*(1-ty) + B[2]*ty)) / 2;

        const i = pidx(x0 + dx, y0 + dy);
        px[i]   = Math.round(rr);
        px[i+1] = Math.round(gg);
        px[i+2] = Math.round(bb);
        px[i+3] = 255;
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/png', 1.0);
}

/**
 * Inpaint a canvas data-url (e.g. from renderPageToImage).
 * Returns a new cleaned PNG data-url.
 *
 * @param {string}  dataUrl  - PNG/JPEG data URL of the page render
 * @param {Array}   lines    - TextLine objects from extractPageText
 * @param {number}  pageW    - Page width in points (for coordinate conversion)
 * @param {number}  pageH    - Page height in points
 * @returns {Promise<string>} - Cleaned PNG data URL
 */
export function inpaintPageRender(dataUrl, lines, pageW, pageH) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      // Convert text line positions (page-points, top-origin) to percentages
      const regions = (lines || [])
        .filter(line => line.runs?.length > 0)
        .map(line => {
          const rightEnd = Math.max(...line.runs.map(r => r.x + r.w));
          const pad = pageW * 0.01;  // 1% padding around each text line
          return {
            xPct: Math.max((line.x - pad) / pageW, 0),
            yPct: Math.max((line.y - pad) / pageH, 0),
            wPct: Math.min((rightEnd - line.x + pad * 2) / pageW, 1),
            hPct: Math.min((line.h + pad * 2) / pageH, 1),
          };
        })
        .filter(r => r.wPct > 0.01 && r.hPct > 0.005);

      if (regions.length === 0) {
        resolve(dataUrl);
        return;
      }

      try {
        const cleaned = inpaintImage(img, regions, 195, 120);
        resolve(cleaned);
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}
