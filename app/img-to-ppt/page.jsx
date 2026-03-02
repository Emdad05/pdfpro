'use client';
import { useState, useRef } from 'react';
import ToolLayout from '../../components/ToolLayout';
import FileUpload from '../../components/FileUpload';

// ─────────────────────────────────────────────────────────────────────────────
// STEP 1 — Image loading helpers
// ─────────────────────────────────────────────────────────────────────────────

function fileToDataUrl(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload  = () => res(r.result);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

function loadImage(src) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload  = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 2 — Tesseract.js OCR  →  word-level bounding boxes
// ─────────────────────────────────────────────────────────────────────────────

async function runOCR(imgEl, onProgress) {
  // Lazy-load Tesseract only when needed
  const Tesseract = await import('tesseract.js');

  const worker = await Tesseract.createWorker('eng', 1, {
    logger: m => {
      if (m.status === 'recognizing text') {
        onProgress(Math.round(m.progress * 100));
      }
    },
  });

  // Use LSTM engine with page-seg-mode 1 (auto)
  await worker.setParameters({ tessedit_pageseg_mode: '1' });

  const { data } = await worker.recognize(imgEl);
  await worker.terminate();
  return data;
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 3 — Canvas pixel analysis helpers
// ─────────────────────────────────────────────────────────────────────────────

function getCanvasCtx(imgEl) {
  const c = document.createElement('canvas');
  c.width  = imgEl.naturalWidth;
  c.height = imgEl.naturalHeight;
  c.getContext('2d').drawImage(imgEl, 0, 0);
  return c.getContext('2d');
}

/** Sample the dominant colour of a small rectangle (mode of quantised pixels) */
function sampleColor(ctx, x, y, w, h) {
  x = Math.max(0, Math.round(x));
  y = Math.max(0, Math.round(y));
  w = Math.max(1, Math.round(w));
  h = Math.max(1, Math.round(h));
  try {
    const d = ctx.getImageData(x, y, w, h).data;
    let rSum = 0, gSum = 0, bSum = 0, n = 0;
    for (let i = 0; i < d.length; i += 4) {
      rSum += d[i]; gSum += d[i+1]; bSum += d[i+2]; n++;
    }
    if (!n) return '#000000';
    const r = Math.round(rSum/n), g = Math.round(gSum/n), b = Math.round(bSum/n);
    return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
  } catch { return '#000000'; }
}

/** Is the background complex (non-white)? Sample many spots. */
function detectComplexBackground(ctx, W, H) {
  let nonWhite = 0, total = 0;
  for (let xp = 0.05; xp < 1; xp += 0.1) {
    for (let yp = 0.05; yp < 1; yp += 0.1) {
      const col = sampleColor(ctx, xp*W, yp*H, 4, 4);
      const r = parseInt(col.slice(1,3),16);
      const g = parseInt(col.slice(3,5),16);
      const b = parseInt(col.slice(5,7),16);
      if (r < 230 || g < 230 || b < 230) nonWhite++;
      total++;
    }
  }
  return nonWhite / total > 0.15;  // >15% non-white → complex bg
}

/** Sample text colour: pick the darkest/most-contrasting pixel in a word bbox */
function sampleTextColor(ctx, bbox) {
  const { x0, y0, x1, y1 } = bbox;
  const w = Math.max(1, x1-x0), h = Math.max(1, y1-y0);
  let darkest = { brightness: 999, color: '#000000' };
  try {
    const d = ctx.getImageData(Math.max(0,x0), Math.max(0,y0), w, h).data;
    for (let i = 0; i < d.length; i += 4) {
      const br = (d[i] + d[i+1] + d[i+2]) / 3;
      if (br < darkest.brightness) {
        darkest.brightness = br;
        const r = d[i], g = d[i+1], b = d[i+2];
        darkest.color = `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
      }
    }
  } catch {}
  return darkest.color;
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 4 — Group Tesseract words into text blocks & compute layout
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns array of TextBlock:
 * { text, xPct, yPct, wPct, hPct, fontSize, bold, italic, align, color }
 */
function buildTextBlocks(ocrData, imgEl, ctx) {
  const W = imgEl.naturalWidth;
  const H = imgEl.naturalHeight;

  // Slide target: 10 × ? inches at 96 dpi equivalent
  // Convert pixel heights → approximate pt size
  // Rule of thumb: fontSize_pt ≈ bbox_height_px * (72 / DPI)
  // We don't know true DPI so we estimate from image size.
  // Assume the image represents a standard slide (10in wide) → pxPerInch = W/10
  // Then: pt = (height_px / pxPerInch) * 72
  const pxPerInch = W / 10;
  const pxToPt = (px) => Math.round((px / pxPerInch) * 72);

  const blocks = [];

  // Tesseract gives us paragraphs → lines → words with bboxes
  for (const block of (ocrData.blocks || [])) {
    for (const para of (block.paragraphs || [])) {
      for (const line of (para.lines || [])) {
        const words = (line.words || []).filter(w => w.text.trim() && w.confidence > 20);
        if (!words.length) continue;

        // Line bounding box
        const lx0 = Math.min(...words.map(w => w.bbox.x0));
        const ly0 = Math.min(...words.map(w => w.bbox.y0));
        const lx1 = Math.max(...words.map(w => w.bbox.x1));
        const ly1 = Math.max(...words.map(w => w.bbox.y1));
        const lineH = ly1 - ly0;

        if (lineH < 4) continue;  // skip noise

        // Full text of this line
        const text = words.map(w => w.text).join(' ');

        // Font size: observed height = cap-height ≈ 0.72 × em
        // So em = height / 0.72, then convert px→pt
        const fontSize = Math.max(Math.round(pxToPt(lineH) / 0.72), 8);

        // Bold / italic from Tesseract font info (first word's dominant font)
        const fontName = words[0]?.font_name || '';
        const bold   = /bold/i.test(fontName)   || words.some(w => w.is_bold);
        const italic = /italic/i.test(fontName) || words.some(w => w.is_italic);

        // Alignment: compare block center to slide center
        const lineCenterX = (lx0 + lx1) / 2;
        const slideCenterX = W / 2;
        const centerDelta = Math.abs(lineCenterX - slideCenterX);
        const align = centerDelta < W * 0.1 ? 'center'
                    : lx0 < W * 0.2          ? 'left'
                    : lx1 > W * 0.8          ? 'right'
                    : 'left';

        // Sample text color from the actual pixels
        const color = sampleTextColor(ctx, { x0: lx0, y0: ly0, x1: lx1, y1: ly1 });

        // Convert to percentages
        const PAD = lineH * 0.1;
        blocks.push({
          text,
          xPct:  Math.max((lx0 - PAD) / W, 0),
          yPct:  Math.max((ly0 - PAD) / H, 0),
          wPct:  Math.min((lx1 - lx0 + PAD*2) / W, 1),
          hPct:  Math.min((lineH + PAD*2) / H, 1),
          fontSize,
          bold,
          italic,
          align,
          color,
        });
      }
    }
  }

  return blocks;
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 5 — Canvas inpainting (same as before, no AI)
// ─────────────────────────────────────────────────────────────────────────────

function inpaintRegions(imgEl, regions) {
  const W = imgEl.naturalWidth;
  const H = imgEl.naturalHeight;

  const canvas = document.createElement('canvas');
  canvas.width  = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(imgEl, 0, 0);

  const imageData = ctx.getImageData(0, 0, W, H);
  const px = imageData.data;

  const pidx = (x, y) =>
    (Math.max(0,Math.min(H-1,y)) * W + Math.max(0,Math.min(W-1,x))) * 4;

  const bright = (x, y) => {
    const i = pidx(x, y);
    return (px[i] + px[i+1] + px[i+2]) / 3;
  };

  const scanH = (startX, y, dx, thresh = 200) => {
    for (let d = 1; d <= 120; d++) {
      const x = startX + dx * d;
      if (x < 0 || x >= W) break;
      if (bright(x, y) > thresh) { const i=pidx(x,y); return [px[i],px[i+1],px[i+2]]; }
    }
    const fx = Math.max(0,Math.min(W-1,startX+dx*120));
    const i=pidx(fx,y); return [px[i],px[i+1],px[i+2]];
  };

  const scanV = (x, startY, dy, thresh = 200) => {
    for (let d = 1; d <= 120; d++) {
      const y = startY + dy * d;
      if (y < 0 || y >= H) break;
      if (bright(x, y) > thresh) { const i=pidx(x,y); return [px[i],px[i+1],px[i+2]]; }
    }
    const fy = Math.max(0,Math.min(H-1,startY+dy*120));
    const i=pidx(x,fy); return [px[i],px[i+1],px[i+2]];
  };

  for (const r of regions) {
    const x0 = Math.max(0, Math.round(r.xPct * W));
    const y0 = Math.max(0, Math.round(r.yPct * H));
    const x1 = Math.min(W, Math.round((r.xPct + r.wPct) * W));
    const y1 = Math.min(H, Math.round((r.yPct + r.hPct) * H));
    const bW = x1-x0, bH = y1-y0;
    if (bW<=0||bH<=0) continue;

    // Adaptive threshold — if background is dark, invert threshold logic
    const bgSample = sampleColor(ctx, x0-10, y0, 8, bH);
    const bgBright = (parseInt(bgSample.slice(1,3),16)+parseInt(bgSample.slice(3,5),16)+parseInt(bgSample.slice(5,7),16))/3;
    const thresh = bgBright < 128 ? 50 : 200;  // dark bg → look for dark pixels

    const rowL = Array.from({length:bH}, (_,dy) => scanH(x0,   y0+dy, -1, thresh));
    const rowR = Array.from({length:bH}, (_,dy) => scanH(x1-1, y0+dy, +1, thresh));
    const colT = Array.from({length:bW}, (_,dx) => scanV(x0+dx, y0,   -1, thresh));
    const colB = Array.from({length:bW}, (_,dx) => scanV(x0+dx, y1-1, +1, thresh));

    for (let dy = 0; dy < bH; dy++) {
      const ty = dy / Math.max(bH-1,1);
      for (let dx = 0; dx < bW; dx++) {
        const tx = dx / Math.max(bW-1,1);
        const L=rowL[dy], R=rowR[dy], T=colT[dx], B=colB[dx];
        const i = pidx(x0+dx, y0+dy);
        px[i]   = Math.round(((L[0]*(1-tx)+R[0]*tx)+(T[0]*(1-ty)+B[0]*ty))/2);
        px[i+1] = Math.round(((L[1]*(1-tx)+R[1]*tx)+(T[1]*(1-ty)+B[1]*ty))/2);
        px[i+2] = Math.round(((L[2]*(1-tx)+R[2]*tx)+(T[2]*(1-ty)+B[2]*ty))/2);
        px[i+3] = 255;
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/png', 1.0);
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 6 — Build PPTX
// ─────────────────────────────────────────────────────────────────────────────

async function buildPptx(blocks, cleanedBgDataUrl, hasComplexBg, bgColor,
                          imgW, imgH, filename) {
  const { default: PptxGenJS } = await import('pptxgenjs');
  const prs = new PptxGenJS();

  const SW = 10.0;
  const SH = SW * (imgH / imgW);
  prs.defineLayout({ name: 'SLIDE', width: SW, height: SH });
  prs.layout = 'SLIDE';

  const slide = prs.addSlide();

  // Background
  if (hasComplexBg) {
    slide.addImage({ data: cleanedBgDataUrl, x:0, y:0, w:SW, h:SH });
  } else {
    const bg = (bgColor || '#ffffff').replace('#','');
    slide.addShape('rect', { x:0,y:0,w:SW,h:SH, fill:{color:bg}, line:{color:bg,width:0} });
  }

  // Text boxes
  const alignMap = { left:'left', center:'ctr', right:'right' };
  for (const el of blocks) {
    if (!el.text.trim()) continue;
    const color = (el.color || '#000000').replace('#','');
    slide.addText(el.text, {
      x:       Math.max(el.xPct * SW, 0),
      y:       Math.max(el.yPct * SH, 0),
      w:       Math.min(el.wPct * SW, SW),
      h:       Math.max(el.hPct * SH, 0.15),
      fontSize: Math.max(el.fontSize || 18, 6),
      bold:    el.bold   || false,
      italic:  el.italic || false,
      color,
      fontFace: 'Calibri',
      align:   alignMap[el.align] || 'left',
      valign:  'middle',
      margin:  0,
      wrap:    true,
      fill:    { color:'FFFFFF', transparency:100 },
      line:    { width:0 },
    });
  }

  const buf  = await prs.write({ outputType:'arraybuffer' });
  const blob = new Blob([buf],{
    type:'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  });
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href = url; a.download = filename.replace(/\.[^.]+$/,'')+'.pptx';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(()=>URL.revokeObjectURL(url),2000);
}

// ─────────────────────────────────────────────────────────────────────────────
// Main pipeline
// ─────────────────────────────────────────────────────────────────────────────

async function runPipeline(file, onStatus, onOcrProgress) {
  onStatus('load');
  const dataUrl = await fileToDataUrl(file);
  const imgEl   = await loadImage(dataUrl);
  const ctx     = getCanvasCtx(imgEl);
  const W = imgEl.naturalWidth, H = imgEl.naturalHeight;

  // Detect background
  onStatus('analyse');
  const hasComplexBg = detectComplexBackground(ctx, W, H);
  const bgColor      = hasComplexBg ? '#ffffff' : sampleColor(ctx, W*0.5, H*0.5, 10, 10);

  // OCR
  onStatus('ocr');
  const ocrData = await runOCR(imgEl, onOcrProgress);

  // Build text blocks from OCR output
  onStatus('layout');
  const blocks = buildTextBlocks(ocrData, imgEl, ctx);

  // Inpaint background (remove text pixels)
  let cleanedBg = dataUrl;
  if (hasComplexBg && blocks.length > 0) {
    onStatus('inpaint');
    cleanedBg = inpaintRegions(imgEl, blocks);
  }

  // Build PPTX
  onStatus('build');
  await buildPptx(blocks, cleanedBg, hasComplexBg, bgColor, W, H, file.name);

  return { blocks, hasComplexBg };
}

// ─────────────────────────────────────────────────────────────────────────────
// UI
// ─────────────────────────────────────────────────────────────────────────────

const STAGES = [
  { id:'ocr',     label:'OCR'        },
  { id:'layout',  label:'Layout'     },
  { id:'inpaint', label:'Inpaint'    },
  { id:'build',   label:'Build'      },
  { id:'done',    label:'Done'       },
];
const STAGE_IDX = Object.fromEntries(STAGES.map((s,i)=>[s.id,i]));

const STATUS_LABEL = {
  load:    'Loading image…',
  analyse: 'Analysing background…',
  ocr:     'Running OCR — reading text…',
  layout:  'Building layout from OCR data…',
  inpaint: 'Inpainting background…',
  build:   'Building PPTX file…',
};

export default function ImgToPPT() {
  const [file,       setFile]       = useState(null);
  const [preview,    setPreview]    = useState(null);
  const [phase,      setPhase]      = useState('');
  const [ocrPct,     setOcrPct]     = useState(0);
  const [result,     setResult]     = useState(null);
  const [error,      setError]      = useState('');
  const topRef = useRef(null);

  const handleFile = (files) => {
    const f = files[0];
    setFile(f); setPreview(URL.createObjectURL(f));
    setResult(null); setError(''); setPhase(''); setOcrPct(0);
  };

  const run = async () => {
    if (!file) return;
    topRef.current?.scrollIntoView({ behavior:'smooth', block:'start' });
    setError(''); setResult(null); setOcrPct(0);
    try {
      const res = await runPipeline(
        file,
        phase => setPhase(phase),
        pct   => setOcrPct(pct),
      );
      setResult(res);
      setPhase('done');
    } catch(e) {
      setPhase('error');
      setError(e.message || 'Conversion failed');
    }
  };

  const reset = () => {
    setFile(null); setPreview(null); setResult(null);
    setPhase(''); setOcrPct(0); setError('');
  };

  const isProcessing = ['load','analyse','ocr','layout','inpaint','build'].includes(phase);
  const curIdx = STAGE_IDX[phase] ?? -1;

  return (
    <ToolLayout
      title="Image to PPT"
      description="OCR reads every word with its position. Background is inpainted. Clean editable PPTX — no AI, no internet, runs entirely in your browser.">
      <div ref={topRef}/>

      {!file ? (
        <FileUpload
          onFiles={handleFile}
          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
          label="Drop your slide image here"
          sublabel="JPG · PNG · WebP — screenshot or photo">
          <div className="flex flex-wrap gap-1.5 mt-5 justify-center">
            {['100% offline','No AI needed','OCR text extraction','Background inpainting','Editable PPTX'].map(f=>(
              <span key={f} className="font-mono px-2.5 py-1"
                style={{fontSize:'9px',letterSpacing:'0.05em',
                  color:'rgba(201,168,76,0.6)',
                  border:'1px solid rgba(201,168,76,0.18)',
                  background:'rgba(201,168,76,0.04)'}}>
                {f}
              </span>
            ))}
          </div>
        </FileUpload>
      ) : (
        <div className="space-y-3">

          {/* Preview */}
          <div className="card overflow-hidden">
            <img src={preview} alt="Preview"
              className="w-full object-contain"
              style={{maxHeight:'200px',background:'#060606',
                borderBottom:'1px solid rgba(255,255,255,0.05)'}}/>
            <div className="p-3 flex items-center gap-3">
              <div className="w-8 h-8 border border-white/10 flex items-center justify-center flex-shrink-0"
                style={{background:'rgba(201,168,76,0.05)'}}>
                <svg className="w-3.5 h-3.5 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-mono text-sm text-white truncate">{file.name}</p>
                <p className="font-mono text-xs text-white/30">{(file.size/1024).toFixed(1)} KB</p>
              </div>
              {!isProcessing && phase !== 'done' && (
                <button onClick={reset} className="p-1 text-white/20 hover:text-white/60 transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* How it works — idle */}
          {phase === '' && (
            <div className="card p-4 anim-fade-down"
              style={{background:'rgba(201,168,76,0.03)',borderColor:'rgba(201,168,76,0.1)'}}>
              <p className="label-gold mb-3">How it works — zero AI</p>
              <div className="space-y-2">
                {[
                  ['OCR',       'Tesseract.js reads every word, its position and bounding box — runs 100% in your browser'],
                  ['Analysis',  'Canvas pixel sampling determines text colour, font size, alignment and background type'],
                  ['Inpainting','Text pixels erased from background using outward scanline fill — seamless reconstruction'],
                  ['PPTX',      'Cleaned background image + real editable text boxes placed at exact OCR positions'],
                ].map(([title,desc],i)=>(
                  <div key={i} className="flex gap-3 items-start">
                    <div className="w-5 h-5 border border-gold/20 flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{background:'rgba(201,168,76,0.06)'}}>
                      <span className="font-mono text-gold/60" style={{fontSize:'9px'}}>{i+1}</span>
                    </div>
                    <div>
                      <p className="font-mono text-xs text-white/60 mb-0.5">{title}</p>
                      <p className="font-mono text-white/28 leading-relaxed" style={{fontSize:'10px'}}>{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Processing */}
          {isProcessing && (
            <div className="card p-5 anim-scale-in">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 border border-gold-400/25 flex items-center justify-center flex-shrink-0"
                  style={{background:'rgba(201,168,76,0.04)'}}>
                  <svg className="w-4 h-4 animate-spin" style={{color:'var(--gold)'}}
                    fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-15" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                    <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-xs text-gold mb-0.5">
                    {phase === 'ocr' ? `OCR — ${ocrPct}%` : (STATUS_LABEL[phase]||phase)}
                  </p>
                  <p className="font-mono text-xs text-white/30">
                    {STATUS_LABEL[phase] || ''}
                  </p>
                </div>
              </div>

              {/* OCR progress bar */}
              {phase === 'ocr' && (
                <div className="progress-track mb-4">
                  <div className="progress-fill"
                    style={{width:`${Math.max(ocrPct,2)}%`,transition:'width 0.3s ease'}}/>
                </div>
              )}

              {/* Stage indicators */}
              <div className="flex gap-0.5">
                {STAGES.map((s,idx)=>{
                  const active  = idx <= curIdx;
                  const current = idx === curIdx;
                  return (
                    <div key={s.id} className="flex-1 text-center">
                      <div className="h-px mb-1.5" style={{
                        background:  active ? 'var(--gold)' : 'rgba(255,255,255,0.07)',
                        transition: 'background 0.4s',
                      }}/>
                      <p style={{
                        fontFamily:'var(--font-mono)',fontSize:'8px',
                        letterSpacing:'0.06em',textTransform:'uppercase',
                        color: current ? 'rgba(201,168,76,0.9)'
                             : active  ? 'rgba(201,168,76,0.4)'
                             :           'rgba(255,255,255,0.15)',
                        transition:'color 0.4s',
                      }}>{s.label}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Error */}
          {phase === 'error' && (
            <div className="card p-4 flex gap-3" style={{borderColor:'rgba(239,68,68,0.2)'}}>
              <div className="w-0.5 self-stretch flex-shrink-0" style={{background:'rgba(239,68,68,0.5)'}}/>
              <div className="min-w-0">
                <p className="font-mono text-xs text-red-400 mb-1">Conversion failed</p>
                <p className="font-mono text-xs text-white/30 break-words">{error}</p>
              </div>
            </div>
          )}

          {/* Success */}
          {phase === 'done' && result && (
            <div className="success-card anim-scale-in">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-9 h-9 border border-gold-400/40 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7"/>
                  </svg>
                </div>
                <div>
                  <p className="font-display text-xl font-light text-white">PPTX downloaded</p>
                  <p className="font-mono text-xs text-white/30 mt-0.5">
                    {result.blocks?.length || 0} text boxes ·{' '}
                    {result.hasComplexBg ? 'Background inpainted' : 'White slide'}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                  ['Text boxes', result.blocks?.length||0],
                  ['Background', result.hasComplexBg?'Preserved':'White'],
                  ['Engine',     'Tesseract'],
                ].map(([l,v])=>(
                  <div key={l} className="text-center p-2"
                    style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)'}}>
                    <p className="font-display text-base font-light text-white">{v}</p>
                    <p className="font-mono text-white/25" style={{fontSize:'9px'}}>{l}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={run} className="btn-primary flex-1 justify-center"
                  style={{padding:'0.65rem 1rem',fontSize:'11px'}}>
                  Convert again
                </button>
                <button onClick={reset} className="btn-ghost"
                  style={{padding:'0.65rem 1rem',fontSize:'11px'}}>
                  New image
                </button>
              </div>
            </div>
          )}

          {/* Actions */}
          {!isProcessing && phase !== 'done' && (
            <div className="flex gap-2 pt-1">
              <button onClick={run} className="btn-primary flex-1 justify-center"
                style={{padding:'0.7rem 1rem',fontSize:'12px'}}>
                Convert to PPTX
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                </svg>
              </button>
              <button onClick={reset} className="btn-ghost"
                style={{padding:'0.7rem 1rem',fontSize:'12px'}}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                </svg>
                Reset
              </button>
            </div>
          )}

        </div>
      )}
    </ToolLayout>
  );
}
