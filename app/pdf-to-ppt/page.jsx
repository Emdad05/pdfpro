'use client';
import { useState, useRef } from 'react';
import ToolLayout from '../../components/ToolLayout';
import FileUpload from '../../components/FileUpload';

/**
 * runConversion — iLovePDF style
 *
 * "Editable" mode (default):
 *   - Full page rendered as background image (all graphics, colour, effects preserved)
 *   - Transparent text boxes placed on top at exact positions
 *   - Text colour matches PDF → visually seamless; boxes are fully editable in PPT
 *
 * "Image only" mode:
 *   - Each page is a single image, no text boxes — pixel-perfect but not editable
 */
async function runConversion(file, mode, onProgress, onStatus, abortSignal) {
  const pdfjsLib = await import('pdfjs-dist');
  const { setupPdfWorker } = await import('../../lib/pdfWorker');
  setupPdfWorker(pdfjsLib);

  const { extractPageText, renderPageToImage } = await import('../../lib/pdfExtract');
  const { createPresentation, addHybridSlide, addImageSlide, savePresentation } =
    await import('../../lib/pptxBuilder');

  onStatus('Loading PDF…');
  const pdf      = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
  const numPages = pdf.numPages;

  const firstPage = await pdf.getPage(1);
  const firstVP   = firstPage.getViewport({ scale: 1 });
  const prs       = await createPresentation(firstVP.width, firstVP.height);

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    if (abortSignal?.aborted) throw new Error('Cancelled');

    onProgress(Math.round((pageNum - 0.5) / numPages * 88));
    const page = await pdf.getPage(pageNum);
    const vp   = page.getViewport({ scale: 1 });

    if (mode === 'image') {
      // ── Pure image mode ───────────────────────────────────────────
      onStatus(`Rendering page ${pageNum} of ${numPages}…`);
      const img = await renderPageToImage(page, 2.5, 0.95);
      addImageSlide(prs, img, vp.width, vp.height);

    } else {
      // ── Hybrid / editable mode (iLovePDF style) ───────────────────
      // Step 1: render full page as background — captures ALL visual content
      onStatus(`Rendering background — page ${pageNum} of ${numPages}…`);
      const bgImg = await renderPageToImage(page, 2.0, 0.93);

      // Step 2: extract text with positions, fonts, colours
      onStatus(`Extracting text — page ${pageNum} of ${numPages}…`);
      const { lines } = await extractPageText(page, pdfjsLib);

      // Step 3: add slide with bg image + transparent text boxes on top
      addHybridSlide(prs, bgImg, lines, vp.width, vp.height);
    }
  }

  onProgress(95);
  onStatus('Building PPTX…');
  await savePresentation(prs, file.name.replace(/\.pdf$/i, '.pptx'));
  onProgress(100);
  onStatus('Complete');
  return { numPages };
}

const MODES = [
  {
    id:    'editable',
    title: 'Editable',
    tag:   'iLovePDF style',
    desc:  'Background image preserved. Transparent text boxes on top — click any text to edit in PowerPoint.',
  },
  {
    id:    'image',
    title: 'Image only',
    tag:   'Pixel perfect',
    desc:  'Each page as a single image. Visually identical to PDF. Text is not selectable.',
  },
];

export default function PDFtoPPT() {
  const [file,       setFile]       = useState(null);
  const [mode,       setMode]       = useState('editable');
  const [processing, setProcessing] = useState(false);
  const [progress,   setProgress]   = useState(0);
  const [status,     setStatus]     = useState('');
  const [result,     setResult]     = useState(null);
  const [error,      setError]      = useState('');
  const abortRef = useRef(null);
  const topRef   = useRef(null);

  const handleFile = (f) => { setFile(f[0]); setResult(null); setError(''); setProgress(0); };

  const convert = async () => {
    if (!file) return;
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const controller = new AbortController();
    abortRef.current = controller;
    setProcessing(true); setError(''); setResult(null); setProgress(0);
    try {
      const stats = await runConversion(file, mode,
        pct => setProgress(pct),
        msg => setStatus(msg),
        controller.signal,
      );
      setResult(stats);
    } catch (e) {
      if (e.message !== 'Cancelled') setError(e.message || 'Conversion failed.');
    }
    setProcessing(false); setStatus('');
  };

  const cancel = () => { abortRef.current?.abort(); setProcessing(false); setStatus(''); };
  const reset  = () => { setFile(null); setResult(null); setError(''); setProgress(0); };

  const stages = ['Loading', 'Rendering', 'Text', 'Building'];
  const stageAt = [0, 10, 50, 90];

  return (
    <ToolLayout
      title="PDF to PPT"
      description="Converts like iLovePDF — full background preserved, editable text boxes on top.">
      <div ref={topRef} />

      {!file ? (
        <FileUpload onFiles={handleFile} label="Drop your PDF here" sublabel="Click to browse" />
      ) : (
        <div className="space-y-3">

          {/* File row */}
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
              <div className="grid grid-cols-2 gap-2">
                {MODES.map(m => (
                  <button key={m.id} onClick={() => setMode(m.id)}
                    className={`option-btn text-left ${mode === m.id ? 'active' : ''}`}
                    style={{padding:'0.75rem'}}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono text-xs font-medium"
                        style={{color: mode===m.id ? 'var(--gold)':'rgba(255,255,255,0.55)'}}>
                        {m.title}
                      </span>
                      <span style={{
                        fontFamily:'var(--font-mono)', fontSize:'9px', letterSpacing:'0.05em',
                        padding:'2px 6px', background:'rgba(201,168,76,0.08)',
                        color:'rgba(201,168,76,0.65)', border:'1px solid rgba(201,168,76,0.18)',
                      }}>
                        {m.tag}
                      </span>
                    </div>
                    <p className="font-mono leading-relaxed" style={{fontSize:'10px', color:'rgba(255,255,255,0.3)'}}>
                      {m.desc}
                    </p>
                  </button>
                ))}
              </div>

              {/* Explanation box */}
              {mode === 'editable' && (
                <div className="mt-3 p-3 anim-fade-down"
                  style={{background:'rgba(201,168,76,0.04)', border:'1px solid rgba(201,168,76,0.1)'}}>
                  <p className="label-gold mb-2">How it works</p>
                  <div className="space-y-1">
                    {[
                      'Full page rendered as background — all images, colours, effects preserved',
                      'Transparent text boxes placed at exact PDF positions on top',
                      'Open in PowerPoint → click any text → edit it',
                    ].map((t, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span style={{color:'var(--gold)', fontSize:'10px', marginTop:'1px', flexShrink:0}}>0{i+1}</span>
                        <p className="font-mono" style={{fontSize:'10px', color:'rgba(255,255,255,0.35)', lineHeight:'1.5'}}>
                          {t}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Processing panel */}
          {processing && (
            <div className="card p-5 anim-scale-in">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 border border-gold-400/25 flex items-center justify-center flex-shrink-0"
                  style={{background:'rgba(201,168,76,0.04)'}}>
                  <svg className="w-4 h-4 animate-spin" style={{color:'var(--gold)'}} fill="none" viewBox="0 0 24 24">
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

              {/* Progress bar */}
              <div className="progress-track mb-4">
                <div className="progress-fill"
                  style={{width:`${Math.max(progress,2)}%`, transition:'width 0.5s ease'}}/>
              </div>

              {/* Stage indicators */}
              <div className="flex gap-1">
                {stages.map((stage, i) => {
                  const active  = progress >= stageAt[i];
                  const current = active && (i === stages.length-1 || progress < stageAt[i+1]);
                  return (
                    <div key={stage} className="flex-1 text-center">
                      <div className="h-px mb-1.5" style={{
                        background: active ? 'var(--gold)' : 'rgba(255,255,255,0.07)',
                        transition: 'background 0.4s',
                      }}/>
                      <p style={{
                        fontFamily:'var(--font-mono)',
                        fontSize:'9px',
                        letterSpacing:'0.08em',
                        textTransform:'uppercase',
                        color: current
                          ? 'rgba(201,168,76,0.9)'
                          : active
                            ? 'rgba(201,168,76,0.4)'
                            : 'rgba(255,255,255,0.15)',
                        transition:'color 0.4s',
                      }}>
                        {stage}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-center mt-5">
                <button onClick={cancel}
                  className="font-mono text-xs text-white/20 hover:text-white/50 transition-colors px-4 py-1.5 border border-white/5 hover:border-white/15">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="card p-4 flex gap-3 anim-slide-down" style={{borderColor:'rgba(239,68,68,0.2)'}}>
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
              <div className="flex items-center gap-4 mb-5">
                <div className="w-9 h-9 border border-gold-400/40 flex items-center justify-center">
                  <svg className="w-4 h-4 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7"/>
                  </svg>
                </div>
                <div>
                  <p className="font-display text-xl font-light text-white">PPTX downloaded</p>
                  <p className="font-mono text-xs text-white/30 mt-0.5">
                    {result.numPages} slide{result.numPages !== 1 ? 's' : ''} ·{' '}
                    {mode === 'editable' ? 'Background + editable text' : 'Image only'}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={convert} className="btn-primary flex-1 justify-center"
                  style={{padding:'0.65rem 1rem', fontSize:'11px'}}>
                  Convert again
                </button>
                <button onClick={reset} className="btn-ghost"
                  style={{padding:'0.65rem 1rem', fontSize:'11px'}}>
                  New file
                </button>
              </div>
            </div>
          )}

          {/* Action row */}
          {!processing && !result && (
            <div className="flex gap-2 pt-1">
              <button onClick={convert} className="btn-primary flex-1 justify-center"
                style={{padding:'0.7rem 1rem', fontSize:'12px'}}>
                Convert to PPTX
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                </svg>
              </button>
              <button onClick={reset} className="btn-ghost"
                style={{padding:'0.7rem 1rem', fontSize:'12px'}}>
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
