/**
 * pptxBuilder.js
 */

const POINTS_PER_INCH = 72;
function ptToIn(pt) { return pt / POINTS_PER_INCH; }

function ensureVisible(hexColor) {
  const r = parseInt(hexColor.slice(0,2),16);
  const g = parseInt(hexColor.slice(2,4),16);
  const b = parseInt(hexColor.slice(4,6),16);
  const lum = 0.299*r + 0.587*g + 0.114*b;
  return lum > 230 ? '222222' : hexColor;
}

function sanitizeFontFace(name) {
  if (!name || name.length < 2) return 'Arial';
  return name
    .replace(/(MT|PS|PC|Std|Pro|LT)$/, '')
    .replace(/[^a-zA-Z0-9\s\-]/g, '')
    .trim() || 'Arial';
}

export function addImageSlide(prs, imgDataUrl, widthPt, heightPt) {
  const slide = prs.addSlide();
  slide.addImage({ data: imgDataUrl, x: 0, y: 0, w: ptToIn(widthPt), h: ptToIn(heightPt) });
  return slide;
}

export function addTextSlide(prs, bgImageDataUrl, lines, pageWidthPt, pageHeightPt) {
  const slide  = prs.addSlide();
  const slideW = ptToIn(pageWidthPt);
  const slideH = ptToIn(pageHeightPt);

  if (bgImageDataUrl) {
    slide.addImage({ data: bgImageDataUrl, x: 0, y: 0, w: slideW, h: slideH });
  } else {
    slide.addShape('rect', { x:0, y:0, w:slideW, h:slideH, fill:{color:'FFFFFF'}, line:{color:'FFFFFF',width:0} });
  }

  for (const line of lines) {
    if (!line.runs?.length) continue;
    if (line.y < -10 || line.y > pageHeightPt + 10) continue;

    const textRuns = line.runs
      .filter(r => r.text.trim().length > 0)
      .map(run => ({
        text: run.text,
        options: {
          fontSize:  Math.max(Math.round(run.fontSize * 0.95), 6),
          bold:      run.bold,
          italic:    run.italic,
          fontFace:  sanitizeFontFace(run.fontFace),
          color:     ensureVisible(run.color || '000000'),
          breakLine: false,
        },
      }));

    if (!textRuns.length) continue;

    const x = Math.max(ptToIn(line.x) - 0.02, 0);
    const y = Math.max(ptToIn(line.y) - 0.02, 0);
    const rightmost = Math.max(...line.runs.map(r => r.x + r.w));
    const w = Math.min(ptToIn(rightmost - line.x) + 0.15, slideW - x);
    const h = Math.max(ptToIn(line.h) + 0.02, 0.1);

    if (x >= slideW || y >= slideH) continue;

    slide.addText(textRuns, { x, y, w: Math.max(w,0.1), h, margin:0, valign:'top', wrap:true, shrinkText:false });
  }
  return slide;
}

export async function createPresentation(pageWidthPt, pageHeightPt) {
  const { default: PptxGenJS } = await import('pptxgenjs');
  const prs = new PptxGenJS();
  const w = ptToIn(pageWidthPt);
  const h = ptToIn(pageHeightPt);
  prs.defineLayout({ name: 'PDF_SIZE', width: w, height: h });
  prs.layout = 'PDF_SIZE';
  return prs;
}

export async function savePresentation(prs, filename) {
  // FIX: Use 'arraybuffer' output then create blob with explicit PPTX MIME type
  // This prevents the browser from saving as ZIP (which is technically correct
  // but confusing — PPTX is a ZIP but browsers should see the .pptx extension)
  const arrayBuffer = await prs.write({ outputType: 'arraybuffer' });
  const blob = new Blob([arrayBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  });
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href     = url;
  a.download = filename.endsWith('.pptx') ? filename : filename + '.pptx';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
