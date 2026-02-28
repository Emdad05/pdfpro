'use client';
import { useState, useRef } from 'react';
import ToolLayout from '../../components/ToolLayout';
import FileUpload from '../../components/FileUpload';

async function runConversion(file, mode, onProgress, onStatus, abortSignal) {
  const pdfjsLib = await import('pdfjs-dist');
  const { setupPdfWorker } = await import('../../lib/pdfWorker');
  setupPdfWorker(pdfjsLib);

  const { extractPageText, renderPageToImage } = await import('../../lib/pdfExtract');
  const { createPresentation, addTextSlide, addImageSlide, savePresentation } =
    await import('../../lib/pptxBuilder');

  onStatus('Loading PDF…');
  const pdf      = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
  const numPages = pdf.numPages;

  const firstPage = await pdf.getPage(1);
  const firstVP   = firstPage.getViewport({ scale: 1 });
  const isLandscape = firstVP.width > firstVP.height;

  // Default: image mode always — no double-layer text
  // Text mode only when explicitly selected
  const useText = mode === 'text';

  const prs = await createPresentation(firstVP.width, firstVP.height);

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    if (abortSignal?.aborted) throw new Error('Cancelled');

    onProgress(Math.round((pageNum - 0.5) / numPages * 90));
    onStatus(`Page ${pageNum} of ${numPages}`);

    const page = await pdf.getPage(pageNum);
    const vp   = page.getViewport({ scale: 1 });

    if (useText) {
      // Text mode: extract text WITHOUT background image to avoid double layer
      // White background + positioned text boxes only
      onStatus(`Extracting text — page ${pageNum}`);
      const { lines } = await extractPageText(page, pdfjsLib);
      // Pass null for background — white slide with text only (no double layer)
      addTextSlide(prs, null, lines, vp.width, vp.height);
    } else {
      // Image mode (default): render page as crisp image — perfect fidelity
      onStatus(`Rendering page ${pageNum}`);
      const img = await renderPageToImage(page, 2.5, 0.95);
      addImageSlide(prs, img, vp.width, vp.height);
    }
  }

  onProgress(95);
  onStatus('Building PPTX…');
  await savePresentation(prs, file.name.replace(/\.pdf$/i, '.pptx'));
  onProgress(100);
  onStatus('Complete');
  return { numPages, isLandscape };
}

const MODES = [
  {
    id:    'image',
    title: 'Image',
    desc:  'Each page as a perfect image. Looks identical to PDF.',
    tag:   'Recommended',
  },
  {
    id:    'text',
    title: 'Editable Text',
    desc:  'Extract text with fonts. Best for landscape slide PDFs.',
    tag:   'Editable',
  },
];

export default function PDFtoPPT() {
  const [file,       setFile]       = useState(null);
  const [mode,       setMode]       = useState('image');
  const [processing, setProcessing] = useState(false);
  const [progress,   setProgress]   = useState(0);
  const [status,     setStatus]     = useState('');
  const [result,     setResult]     = useState(null);
  const [error,      setError]      = useState('');
  const abortRef  = useRef(null);
  const topRef    = useRef(null);

  const handleFile = (accepted) => {
    setFile(accepted[0]); setResult(null); setError(''); setProgress(0);
  };

  const convert = async () => {
    if (!file) return;
    // Scroll to top so user sees progress — FIX for scroll jump issue
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

  const cancel = () => abortRef.current?.abort();
  const reset  = () => { setFile(null); setResult(null); setError(''); setProgress(0); };

  return (
    <ToolLayout title="PDF to PPT" description="Convert PDF slides to PowerPoint. Image mode gives perfect fidelity; text mode extracts editable content.">
      <div ref={topRef} />
      {!file ? (
        <FileUpload onFiles={handleFile} label="Drop your PDF here" sublabel="Click to browse" />
      ) : (
        <div className="space-y-3">

          {/* File row */}
          <div className="card p-3 flex items-center gap-3">
            <div className="w-8 h-8 border border-white/10 flex items-center justify-center flex-shrink-0"
              style={{background:'rgba(201,168,76,0.05)'}}>
              <span className="font-mono text-xs text-gold uppercase">PDF</span>
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

          {/* Mode selector — only show when not processing */}
          {!processing && !result && (
            <div className="card p-4">
              <p className="label-gold mb-3">Conversion Mode</p>
              <div className="grid grid-cols-2 gap-2">
                {MODES.map(m => (
                  <button key={m.id} onClick={() => setMode(m.id)}
                    className={`option-btn text-left relative ${mode === m.id ? 'active' : ''}`}
                    style={{padding:'0.75rem'}}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-xs font-medium"
                        style={{color: mode===m.id ? 'var(--gold)' : 'rgba(255,255,255,0.6)'}}>
                        {m.title}
                      </span>
                      <span className="font-mono text-xs px-1.5 py-0.5"
                        style={{
                          background:'rgba(201,168,76,0.1)',
                          color:'rgba(201,168,76,0.7)',
                          border:'1px solid rgba(201,168,76,0.2)',
                          fontSize:'9px',
                          letterSpacing:'0.05em',
                        }}>
                        {m.tag}
                      </span>
                    </div>
                    <p className="font-mono text-xs text-white/30 leading-relaxed">{m.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Processing panel */}
          {processing && (
            <div className="card p-5 anim-scale-in">
              <div className="flex items-center gap-3 mb-4">
                {/* Animated icon */}
                <div className="w-10 h-10 border border-gold-400/30 flex items-center justify-center flex-shrink-0"
                  style={{background:'rgba(201,168,76,0.05)'}}>
                  <svg className="w-4 h-4 text-gold animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                    <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-mono text-xs text-gold mb-0.5">Converting</p>
                  <p className="font-mono text-xs text-white/40">{status}</p>
                </div>
                <span className="font-display text-2xl font-light text-white">{progress}%</span>
              </div>

              {/* Progress bar */}
              <div className="progress-track mb-4">
                <div className="progress-fill" style={{width:`${Math.max(progress,2)}%`, transition:'width 0.4s ease'}} />
              </div>

              {/* Stage indicators */}
              <div className="flex gap-0 text-xs">
                {['Loading','Rendering','Building','Done'].map((stage, i) => {
                  const stageProgress = [0, 10, 90, 100];
                  const active = progress >= stageProgress[i];
                  return (
                    <div key={stage} className="flex-1 text-center">
                      <div className="h-0.5 mb-1.5" style={{
                        background: active ? 'var(--gold)' : 'rgba(255,255,255,0.08)',
                        transition: 'background 0.3s'
                      }}/>
                      <span className="font-mono" style={{
                        fontSize:'9px',
                        letterSpacing:'0.08em',
                        color: active ? 'rgba(201,168,76,0.8)' : 'rgba(255,255,255,0.2)',
                        transition: 'color 0.3s'
                      }}>
                        {stage.toUpperCase()}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Cancel */}
              <div className="mt-4 flex justify-center">
                <button onClick={cancel}
                  className="font-mono text-xs text-white/20 hover:text-white/50 transition-colors">
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
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 border border-gold-400/40 flex items-center justify-center">
                  <svg className="w-4 h-4 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7"/>
                  </svg>
                </div>
                <div>
                  <p className="font-display text-xl font-light text-white">PPTX downloaded</p>
                  <p className="font-mono text-xs text-white/30 mt-0.5">
                    {result.numPages} slide{result.numPages !== 1 ? 's' : ''} · {mode === 'image' ? 'Image mode' : 'Text mode'}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={convert} className="btn-primary flex-1 justify-center" style={{fontSize:'11px',padding:'0.6rem 1rem'}}>
                  Convert again
                </button>
                <button onClick={reset} className="btn-ghost" style={{fontSize:'11px',padding:'0.6rem 1rem'}}>
                  New file
                </button>
              </div>
            </div>
          )}

          {/* Action buttons */}
          {!processing && !result && (
            <div className="flex gap-2 pt-1">
              <button onClick={convert} className="btn-primary flex-1 justify-center" style={{padding:'0.7rem 1rem', fontSize:'12px'}}>
                Convert to PPTX
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                </svg>
              </button>
              <button onClick={reset} className="btn-ghost" style={{padding:'0.7rem 1rem', fontSize:'12px'}}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
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
