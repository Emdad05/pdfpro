'use client';
import { useState, useRef } from 'react';
import ToolLayout from '../../components/ToolLayout';
import FileUpload from '../../components/FileUpload';

// Detect if page has non-white graphic content
async function pageHasGraphics(page, pdfjsLib) {
  const OPS    = pdfjsLib.OPS ?? pdfjsLib.default?.OPS ?? {};
  const opList = await page.getOperatorList();
  const IMG_OPS = new Set([
    OPS.paintImageXObject, OPS.paintInlineImageXObject, OPS.paintImageMaskXObject,
    85, 84, 83,
  ]);
  for (let i = 0; i < opList.fnArray.length; i++) {
    if (IMG_OPS.has(opList.fnArray[i])) return true;
    if (opList.fnArray[i] === OPS.setFillRGBColor) {
      const [r,g,b] = opList.argsArray[i];
      if (!(r > 0.95 && g > 0.95 && b > 0.95)) {
        for (let j = i+1; j < Math.min(i+8, opList.fnArray.length); j++) {
          const fn = opList.fnArray[j];
          if (fn === OPS.fill || fn === OPS.eoFill || fn === OPS.fillStroke) return true;
        }
      }
    }
  }
  return false;
}

async function runConversion(file, mode, onProgress, onStatus, abortSignal) {
  const pdfjsLib = await import('pdfjs-dist');
  const { setupPdfWorker } = await import('../../lib/pdfWorker');
  setupPdfWorker(pdfjsLib);

  const { extractPageText, renderPageToImage } = await import('../../lib/pdfExtract');
  const { inpaintPageRender }                  = await import('../../lib/inpaint');
  const {
    createPresentation, addCleanSlide, addHybridSlide, addImageSlide, savePresentation,
  } = await import('../../lib/pptxBuilder');

  onStatus('Loading PDF…');
  const pdf      = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
  const numPages = pdf.numPages;

  const firstPage = await pdf.getPage(1);
  const firstVP   = firstPage.getViewport({ scale: 1 });
  const prs       = await createPresentation(firstVP.width, firstVP.height);

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    if (abortSignal?.aborted) throw new Error('Cancelled');

    onProgress(Math.round((pageNum - 1) / numPages * 90));
    const page = await pdf.getPage(pageNum);
    const vp   = page.getViewport({ scale: 1 });

    if (mode === 'image') {
      onStatus(`Rendering page ${pageNum} of ${numPages}…`);
      const img = await renderPageToImage(page, 3.0, 0.97);
      addImageSlide(prs, img, vp.width, vp.height);

    } else if (mode === 'auto') {
      onStatus(`Analysing page ${pageNum}…`);
      const hasGraphics = await pageHasGraphics(page, pdfjsLib);

      onStatus(`Extracting text — page ${pageNum} of ${numPages}…`);
      const { lines } = await extractPageText(page, pdfjsLib);

      if (hasGraphics) {
        // Render full background, inpaint text regions, then add text boxes
        onStatus(`Rendering background — page ${pageNum}…`);
        const rawBg = await renderPageToImage(page, 2.5, 0.95);

        onStatus(`Inpainting text regions — page ${pageNum}…`);
        const cleanBg = await inpaintPageRender(rawBg, lines, vp.width, vp.height);

        addHybridSlide(prs, cleanBg, lines, vp.width, vp.height);
      } else {
        // Plain page — white slide + text boxes
        addCleanSlide(prs, lines, [], vp.width, vp.height);
      }

    } else {
      // Editable mode — always inpaint
      onStatus(`Rendering background — page ${pageNum}…`);
      const rawBg = await renderPageToImage(page, 2.5, 0.95);

      onStatus(`Extracting text — page ${pageNum}…`);
      const { lines } = await extractPageText(page, pdfjsLib);

      onStatus(`Inpainting text regions — page ${pageNum}…`);
      const cleanBg = await inpaintPageRender(rawBg, lines, vp.width, vp.height);

      addHybridSlide(prs, cleanBg, lines, vp.width, vp.height);
    }
  }

  onProgress(95);
  onStatus('Building PPTX…');
  await savePresentation(prs, file.name.replace(/\.pdf$/i, '.pptx'));
  onProgress(100);
  onStatus('Done');
  return { numPages };
}

const MODES = [
  {
    id:    'auto',
    title: 'Smart',
    tag:   'Recommended',
    desc:  'Auto-detects each page. Plain text → white slide. Pages with graphics → background preserved + text inpainted.',
  },
  {
    id:    'editable',
    title: 'Background + Text',
    tag:   'Always hybrid',
    desc:  'Every page: background render with text erased + clean editable text boxes placed on top.',
  },
  {
    id:    'image',
    title: 'Image only',
    tag:   'Pixel perfect',
    desc:  'Each page as one image. Perfect fidelity, nothing editable.',
  },
];

export default function PDFtoPPT() {
  const [file,       setFile]       = useState(null);
  const [mode,       setMode]       = useState('auto');
  const [processing, setProcessing] = useState(false);
  const [progress,   setProgress]   = useState(0);
  const [status,     setStatus]     = useState('');
  const [result,     setResult]     = useState(null);
  const [error,      setError]      = useState('');
  const abortRef = useRef(null);
  const topRef   = useRef(null);

  const handleFile = (f) => {
    setFile(f[0]); setResult(null); setError(''); setProgress(0);
  };

  const convert = async () => {
    if (!file) return;
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setProcessing(true); setError(''); setResult(null); setProgress(0);
    try {
      const stats = await runConversion(file, mode,
        p => setProgress(p),
        s => setStatus(s),
        ctrl.signal,
      );
      setResult(stats);
    } catch (e) {
      if (e.message !== 'Cancelled') setError(e.message || 'Conversion failed.');
    }
    setProcessing(false); setStatus('');
  };

  const cancel = () => { abortRef.current?.abort(); setProcessing(false); setStatus(''); };
  const reset  = () => { setFile(null); setResult(null); setError(''); setProgress(0); };

  const stages  = ['Loading','Processing','Inpainting','Building'];
  const stageAt = [0, 10, 60, 90];

  return (
    <ToolLayout
      title="PDF to PPT"
      description="Smart mode: plain text pages → clean white slides. Graphic pages → background inpainted, clean editable text on top.">
      <div ref={topRef}/>

      {!file ? (
        <FileUpload onFiles={handleFile} label="Drop your PDF here" sublabel="Click to browse"/>
      ) : (
        <div className="space-y-3">

          {/* File */}
          <div className="card p-3 flex items-center gap-3">
            <div className="w-8 h-8 border border-white/10 flex items-center justify-center flex-shrink-0"
              style={{background:'rgba(201,168,76,0.05)'}}>
              <span className="font-mono text-xs text-gold">PDF</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-mono text-sm text-white truncate">{file.name}</p>
              <p className="font-mono text-xs text-white/30">{(file.size/1024).toFixed(1)} KB</p>
            </div>
            {!processing && !result && (
              <button onClick={reset} className="p-1 text-white/20 hover:text-white/60 transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            )}
          </div>

          {/* Mode selector */}
          {!processing && !result && (
            <div className="card p-4">
              <p className="label-gold mb-3">Conversion Mode</p>
              <div className="grid grid-cols-3 gap-2">
                {MODES.map(m => (
                  <button key={m.id} onClick={() => setMode(m.id)}
                    className={`option-btn text-left ${mode === m.id ? 'active' : ''}`}
                    style={{padding:'0.65rem 0.6rem'}}>
                    <div className="mb-1.5">
                      <span className="font-mono text-xs font-medium block mb-0.5"
                        style={{color:mode===m.id?'var(--gold)':'rgba(255,255,255,0.55)'}}>
                        {m.title}
                      </span>
                      <span style={{
                        fontFamily:'var(--font-mono)',fontSize:'8px',letterSpacing:'0.05em',
                        padding:'1px 5px',background:'rgba(201,168,76,0.08)',
                        color:'rgba(201,168,76,0.65)',border:'1px solid rgba(201,168,76,0.18)',
                      }}>{m.tag}</span>
                    </div>
                    <p className="font-mono leading-relaxed"
                      style={{fontSize:'9px',color:'rgba(255,255,255,0.28)'}}>
                      {m.desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Processing */}
          {processing && (
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
                  <p className="font-mono text-xs text-gold mb-0.5">Converting</p>
                  <p className="font-mono text-xs text-white/35 truncate">{status}</p>
                </div>
                <span className="font-display text-3xl font-light" style={{color:'var(--gold)'}}>
                  {progress}%
                </span>
              </div>

              <div className="progress-track mb-4">
                <div className="progress-fill"
                  style={{width:`${Math.max(progress,2)}%`,transition:'width 0.5s ease'}}/>
              </div>

              <div className="flex">
                {stages.map((stage,idx) => {
                  const active  = progress >= stageAt[idx];
                  const current = active && (idx===stages.length-1 || progress < stageAt[idx+1]);
                  return (
                    <div key={stage} className="flex-1 text-center">
                      <div className="h-px mb-1.5" style={{
                        background:active?'var(--gold)':'rgba(255,255,255,0.07)',
                        transition:'background 0.4s',
                      }}/>
                      <p style={{
                        fontFamily:'var(--font-mono)',fontSize:'8px',
                        letterSpacing:'0.08em',textTransform:'uppercase',
                        color:current?'rgba(201,168,76,0.9)':active?'rgba(201,168,76,0.4)':'rgba(255,255,255,0.15)',
                        transition:'color 0.4s',
                      }}>{stage}</p>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-center mt-4">
                <button onClick={cancel}
                  className="font-mono text-xs text-white/20 hover:text-white/50 transition-colors px-4 py-1.5 border border-white/5 hover:border-white/15">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="card p-4 flex gap-3" style={{borderColor:'rgba(239,68,68,0.2)'}}>
              <div className="w-0.5 self-stretch flex-shrink-0" style={{background:'rgba(239,68,68,0.5)'}}/>
              <div>
                <p className="font-mono text-xs text-red-400 mb-0.5">Conversion failed</p>
                <p className="font-mono text-xs text-white/30">{error}</p>
              </div>
            </div>
          )}

          {/* Success */}
          {result && (
            <div className="success-card anim-scale-in">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-9 h-9 border border-gold-400/40 flex items-center justify-center">
                  <svg className="w-4 h-4 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7"/>
                  </svg>
                </div>
                <div>
                  <p className="font-display text-xl font-light text-white">PPTX downloaded</p>
                  <p className="font-mono text-xs text-white/30 mt-0.5">
                    {result.numPages} slide{result.numPages!==1?'s':''} · {
                      mode==='auto'?'Smart mode':mode==='editable'?'Background inpainted':'Image only'
                    }
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={convert} className="btn-primary flex-1 justify-center"
                  style={{padding:'0.65rem 1rem',fontSize:'11px'}}>
                  Convert again
                </button>
                <button onClick={reset} className="btn-ghost"
                  style={{padding:'0.65rem 1rem',fontSize:'11px'}}>
                  New file
                </button>
              </div>
            </div>
          )}

          {/* Actions */}
          {!processing && !result && (
            <div className="flex gap-2 pt-1">
              <button onClick={convert} className="btn-primary flex-1 justify-center"
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
