'use client';
import { useState, useRef } from 'react';
import ToolLayout from '../../components/ToolLayout';
import FileUpload from '../../components/FileUpload';

// ─── Conversion engine ────────────────────────────────────────────────────────

async function runConversion(file, userMode, onProgress, onStatus, abortSignal) {
  // Dynamic imports — keeps bundle small
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

  const { extractPageText, renderPageToImage } = await import('../../lib/pdfExtract');
  const { createPresentation, addTextSlide, addImageSlide, savePresentation } =
    await import('../../lib/pptxBuilder');

  onStatus('Loading PDF…');
  const pdf       = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
  const numPages  = pdf.numPages;

  // Detect orientation from first page
  const firstPage    = await pdf.getPage(1);
  const firstVP      = firstPage.getViewport({ scale: 1 });
  const isLandscape  = firstVP.width > firstVP.height;
  const autoTextMode = isLandscape;

  const useText = userMode === 'auto'   ? autoTextMode
                : userMode === 'text'   ? true
                : false;  // 'image'

  // Initialize pptxgenjs with the page dimensions of page 1
  const prs = await createPresentation(firstVP.width, firstVP.height);

  const stats = {
    textSlides:  0,
    imageSlides: 0,
    totalRuns:   0,
    fontFaces:   new Set(),
  };

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    // Check for abort signal
    if (abortSignal.aborted) {
      throw new Error('Conversion cancelled by user.');
    }

    const pct = Math.round((pageNum - 0.5) / numPages * 90);
    onProgress(pct);
    onStatus(`Processing page ${pageNum} / ${numPages}…`);

    const page     = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1 });
    const pageW    = viewport.width;
    const pageH    = viewport.height;
    const pageLand = pageW > pageH;

    if (useText && pageLand) {
      // ── Text extraction mode ──────────────────────────────────────────────
      onStatus(`Extracting text from page ${pageNum}…`);
      const { lines } = await extractPageText(page, pdfjsLib);

      // For hybrid quality: render a clean background image (removes text layer),
      // then overlay editable text boxes — so images/shapes are preserved perfectly.
      onStatus(`Rendering background for page ${pageNum}…`);
      const bgImg = await renderPageToImage(page, 1.5, 0.85);

      addTextSlide(prs, bgImg, lines, pageW, pageH);

      stats.textSlides++;
      stats.totalRuns += lines.reduce((s, l) => s + l.runs.length, 0);
      for (const line of lines)
        for (const run of line.runs)
          stats.fontFaces.add(run.fontFace);

    } else {
      // ── Image slide fallback ──────────────────────────────────────────────
      onStatus(`Rendering page ${pageNum} as image…`);
      const img = await renderPageToImage(page, 2.0, 0.94);
      addImageSlide(prs, img, pageW, pageH);
      stats.imageSlides++;
    }
  }

  onProgress(95);
  onStatus('Building PPTX file…');
  const outName = file.name.replace(/\.pdf$/i, '.pptx');
  await savePresentation(prs, outName);

  onProgress(100);
  onStatus('Done!');
  return { ...stats, fontFaces: [...stats.fontFaces], numPages, isLandscape };
}

// ─── UI ───────────────────────────────────────────────────────────────────────

const MODE_OPTIONS = [
  {
    id:   'auto',
    icon: '🤖',
    title: 'Auto',
    desc: 'Text mode for landscape, image for portrait',
    badge: 'Recommended',
  },
  {
    id:   'text',
    icon: '✏️',
    title: 'Text Mode',
    desc: 'Extract editable text with font styles',
    badge: 'Best for slides',
  },
  {
    id:   'image',
    icon: '🖼️',
    title: 'Image Mode',
    desc: 'Each page becomes a slide image',
    badge: 'Always perfect look',
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
  const abortRef = useRef(false);

  const handleFile = (accepted) => {
    setFile(accepted[0]);
    setResult(null);
    setError('');
    setProgress(0);
  };

  const convert = async () => {
    if (!file) return;
    const controller = new AbortController();
    abortRef.current = controller;
    setProcessing(true);
    setError('');
    setResult(null);
    setProgress(0);

    try {
      const stats = await runConversion(
        file,
        mode,
        (pct) => setProgress(pct),
        (msg) => setStatus(msg),
        controller.signal,
      );
      setResult(stats);
    } catch (e) {
      console.error(e);
      setError(e.message || 'Conversion failed. Please try again.');
    }

    setProcessing(false);
    setStatus('');
  };

  const reset = () => {
    setFile(null);
    setResult(null);
    setError('');
    setProgress(0);
    setStatus('');
  };

  return (
    <ToolLayout
      title="PDF to PPT"
      icon="📊"
      description="Convert PDF to editable PowerPoint. Preserves font size, bold, italic, and text positions."
    >
      {!file ? (
        <FileUpload
          onFiles={handleFile}
          label="Drop your PDF here"
          sublabel="Landscape PDFs (from PowerPoint) give best results"
        />
      ) : (
        <div className="space-y-4">

          {/* File card */}
          <div className="glass-card p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
              style={{ background: 'rgba(251,146,60,0.1)', border: '1px solid rgba(251,146,60,0.2)' }}>
              📄
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-white truncate">{file.name}</p>
              <p className="text-sm text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
            {!processing && (
              <button onClick={reset} className="text-slate-500 hover:text-red-400 transition-colors flex-shrink-0 p-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Mode selector */}
          {!processing && !result && (
            <div className="glass-card p-5">
              <h3 className="font-heading font-semibold text-white mb-4">Conversion Mode</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {MODE_OPTIONS.map(m => (
                  <button
                    key={m.id}
                    onClick={() => setMode(m.id)}
                    className={`option-btn text-left relative ${mode === m.id ? 'active' : ''}`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xl">{m.icon}</span>
                      <span className="font-semibold text-sm">{m.title}</span>
                    </div>
                    <p className="text-xs opacity-60 leading-relaxed">{m.desc}</p>
                    {m.badge && (
                      <span className="absolute top-2 right-2 text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                        style={{ background: 'rgba(0,216,214,0.15)', color: '#00d8d6', border: '1px solid rgba(0,216,214,0.25)' }}>
                        {m.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Mode explanation */}
              <div className="mt-4 rounded-xl p-4 text-sm leading-relaxed"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                {mode === 'auto' && (
                  <p className="text-slate-400">
                    <span className="text-accent-400 font-semibold">Auto mode:</span> Landscape pages (typical
                    PowerPoint exports) use <strong className="text-white">text extraction</strong> — fonts,
                    bold, italic, and positions are preserved and editable in PowerPoint.
                    Portrait pages fall back to image slides automatically.
                  </p>
                )}
                {mode === 'text' && (
                  <p className="text-slate-400">
                    <span className="text-white font-semibold">Text mode:</span> Extracts every text run with
                    its <strong className="text-white">exact font size, bold/italic style, color, and
                    position</strong>. Best for PDFs originally made in PowerPoint, Keynote, or Canva.
                    Complex portrait PDFs (articles, reports) may have layout quirks.
                  </p>
                )}
                {mode === 'image' && (
                  <p className="text-slate-400">
                    <span className="text-white font-semibold">Image mode:</span> Each page is rendered as a
                    high-resolution image and placed on a slide.
                    Looks <strong className="text-white">100% identical</strong> to the PDF but text
                    is not editable. Great for sharing or archiving.
                  </p>
                )}
              </div>

              {/* Font info panel */}
              <div className="mt-3 rounded-xl p-4"
                style={{ background: 'rgba(0,216,214,0.04)', border: '1px solid rgba(0,216,214,0.1)' }}>
                <p className="text-xs text-accent-400 font-semibold uppercase tracking-wider mb-2">
                  What gets preserved in Text Mode
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { icon: '📐', label: 'Font size' },
                    { icon: '𝐁',  label: 'Bold' },
                    { icon: '𝑰',  label: 'Italic' },
                    { icon: '🎨', label: 'Color' },
                    { icon: '📍', label: 'Position' },
                    { icon: '🔤', label: 'Font face' },
                    { icon: '📏', label: 'Slide size' },
                    { icon: '🖼️', label: 'Background' },
                  ].map(f => (
                    <div key={f.label} className="flex items-center gap-1.5 text-xs text-slate-300">
                      <span>{f.icon}</span>
                      <span>{f.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Progress */}
          {processing && (
            <div className="glass-card p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-slate-300 font-medium">{status}</span>
                <span className="text-accent-400 font-bold font-heading">{progress}%</span>
              </div>
              <div className="progress-track mb-3">
                <div className="progress-fill transition-all duration-500" style={{ width: `${Math.max(progress, 3)}%` }} />
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                {[
                  { icon: '📄', label: 'Parsing PDF' },
                  { icon: '✂️', label: 'Extracting text' },
                  { icon: '📊', label: 'Building PPTX' },
                ].map((step, i) => {
                  const active = i === 0 ? progress < 33 : i === 1 ? progress < 85 : progress >= 85;
                  return (
                    <div key={step.label} className={`rounded-xl p-3 transition-all ${active ? 'bg-accent-500/10 border border-accent-500/20' : 'bg-white/3 border border-white/5'}`}>
                      <p className="text-lg mb-0.5">{step.icon}</p>
                      <p className={`text-xs ${active ? 'text-accent-400' : 'text-slate-500'}`}>{step.label}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Error */}
          {error && !processing && (
            <div className="glass-card p-4" style={{ borderColor: 'rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.05)' }}>
              <p className="text-red-400 text-sm">❌ {error}</p>
            </div>
          )}

          {/* Result */}
          {result && !processing && (
            <div className="space-y-4">
              <div className="success-card text-left">
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-4xl">✅</div>
                  <div>
                    <p className="font-heading font-bold text-emerald-300 text-xl">Conversion complete!</p>
                    <p className="text-slate-400 text-sm">Your PPTX has been downloaded.</p>
                  </div>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  {[
                    { label: 'Total pages',   value: result.numPages,                  icon: '📄' },
                    { label: 'Text slides',   value: result.textSlides,                icon: '✏️' },
                    { label: 'Image slides',  value: result.imageSlides,               icon: '🖼️' },
                    { label: 'Text runs',     value: result.totalRuns.toLocaleString(), icon: '🔤' },
                  ].map(s => (
                    <div key={s.label} className="rounded-xl p-3 text-center"
                      style={{ background: 'rgba(0,216,214,0.07)', border: '1px solid rgba(0,216,214,0.15)' }}>
                      <p className="text-lg mb-0.5">{s.icon}</p>
                      <p className="font-heading font-bold text-accent-300 text-xl">{s.value}</p>
                      <p className="text-xs text-slate-500">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Fonts detected */}
                {result.fontFaces?.length > 0 && (
                  <div className="rounded-xl p-3 mb-4" style={{ background: 'rgba(255,255,255,0.04)' }}>
                    <p className="text-xs text-slate-500 mb-2">Fonts detected in document</p>
                    <div className="flex flex-wrap gap-1.5">
                      {result.fontFaces.filter(Boolean).slice(0, 12).map(f => (
                        <span key={f} className="text-xs px-2 py-0.5 rounded-md font-mono"
                          style={{ background: 'rgba(255,255,255,0.06)', color: '#94a3b8' }}>
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tips */}
                <div className="rounded-xl p-4" style={{ background: 'rgba(251,146,60,0.06)', border: '1px solid rgba(251,146,60,0.15)' }}>
                  <p className="text-xs text-amber-400 font-semibold uppercase tracking-wider mb-2">💡 Tips for best results</p>
                  <ul className="text-xs text-amber-300/70 space-y-1">
                    <li>• If font faces aren't installed on your system, PowerPoint substitutes similar ones</li>
                    <li>• Text layer is overlaid on the background image — layouts stay accurate</li>
                    <li>• Portrait slides automatically used Image mode for perfect appearance</li>
                  </ul>
                </div>

                <div className="flex gap-3 mt-4">
                  <button onClick={reset} className="btn-glass flex-1 justify-center">
                    Convert another PDF
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Cancel button shown while processing */}
          {processing && (
            <div className="flex justify-center mt-2">
              <button
                onClick={() => abortRef.current?.abort?.()}
                className="btn-glass text-sm px-6"
              >
                ✕ Cancel
              </button>
            </div>
          )}

          {/* Convert button */}
          {!processing && !result && (
            <div className="flex gap-3">
              <button
                onClick={convert}
                disabled={processing}
                className="btn-primary flex-1 justify-center py-4 text-base"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Convert to PowerPoint
              </button>
              <button onClick={reset} className="btn-glass">Reset</button>
            </div>
          )}

          {/* Quality note */}
          {!processing && !result && (
            <div className="flex items-start gap-3 text-xs text-slate-500 px-1">
              <span className="text-base flex-shrink-0">ℹ️</span>
              <p>
                <strong className="text-slate-400">Best results:</strong> Landscape PDFs originally
                exported from PowerPoint. The converter detects font styles by reading internal PDF
                font descriptors — bold, italic, font name, size, color, and exact position are all
                extracted and mapped to editable PowerPoint text boxes.
              </p>
            </div>
          )}
        </div>
      )}
    </ToolLayout>
  );
}
