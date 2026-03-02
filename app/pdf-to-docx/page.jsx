'use client';
import { useState, useRef } from 'react';
import ToolLayout from '../../components/ToolLayout';
import FileUpload from '../../components/FileUpload';

function safeFilename(name) {
  return name.replace(/\.pdf$/i, '').replace(/[^a-zA-Z0-9_\-. ]/g, '_') + '.docx';
}

async function renderPage(page, scale = 2.0) {
  const vp = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width  = vp.width;
  canvas.height = vp.height;
  await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;
  const base64 = canvas.toDataURL('image/png').split(',')[1];
  const vp1    = page.getViewport({ scale: 1 });
  return { base64, widthPt: vp1.width, heightPt: vp1.height };
}

async function extractText(page) {
  const content = await page.getTextContent();
  if (!content.items.length) return [];
  const vp    = page.getViewport({ scale: 1 });
  const pageH = vp.height;
  const lineMap = new Map();
  for (const item of content.items) {
    if (!item.str?.trim()) continue;
    const tx  = item.transform;
    const y   = pageH - tx[5];
    const fs  = Math.abs(tx[3]) || 12;
    const key = Math.round(y / (fs * 0.6)) * Math.round(fs * 0.6);
    if (!lineMap.has(key)) lineMap.set(key, []);
    lineMap.get(key).push({ text: item.str, x: tx[4], fs, fontName: item.fontName || '' });
  }
  return [...lineMap.entries()]
    .sort(([a], [b]) => a - b)
    .map(([, items]) => {
      items.sort((a, b) => a.x - b.x);
      return {
        text:     items.map(i => i.text).join(' ').trim(),
        fontSize: Math.max(Math.round(items[0].fs), 8),
        bold:     /bold/i.test(items[0].fontName),
      };
    })
    .filter(l => l.text);
}

// Convert PDF points to EMU (English Metric Units used by OOXML)
// 1 pt = 1/72 in, 1 in = 914400 EMU
const PT_TO_EMU    = 914400 / 72;
const PT_TO_TWIP   = 20;       // 1pt = 20 twips (for page size)
const MARGIN_PT    = 36;       // 0.5 inch margin
const MARGIN_TWIP  = MARGIN_PT * PT_TO_TWIP;

async function buildDocx(pages) {
  const { Document, Packer, Paragraph, TextRun, ImageRun, PageBreak, convertInchesToTwip } = await import('docx');

  const sections = pages.map((pg, idx) => {
    const { base64, widthPt, heightPt, lines } = pg;

    // Page size in twips
    const pageWTwip = Math.round(widthPt  * PT_TO_TWIP);
    const pageHTwip = Math.round(heightPt * PT_TO_TWIP);

    // Image size: fill the content area (page minus margins)
    const imgWPx = Math.round((widthPt  - MARGIN_PT * 2) * (96 / 72));
    const imgHPx = Math.round((heightPt - MARGIN_PT * 2) * (96 / 72));

    const imageBytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));

    const children = [
      // Full-page raster image of the PDF page
      new Paragraph({
        spacing: { before: 0, after: 0 },
        children: [
          new ImageRun({
            data: imageBytes,
            transformation: { width: Math.max(imgWPx, 1), height: Math.max(imgHPx, 1) },
          }),
        ],
      }),
      // Invisible white text for copy/search
      ...lines.map(line => new Paragraph({
        spacing: { before: 0, after: 0 },
        children: [new TextRun({ text: line.text, size: line.fontSize * 2, bold: line.bold, color: 'FFFFFF' })],
      })),
      // Page break (except last page)
      ...(idx < pages.length - 1 ? [new Paragraph({ children: [new PageBreak()] })] : []),
    ];

    return {
      properties: {
        page: {
          size:   { width: pageWTwip, height: pageHTwip },
          margin: { top: MARGIN_TWIP, bottom: MARGIN_TWIP, left: MARGIN_TWIP, right: MARGIN_TWIP },
        },
      },
      children,
    };
  });

  const doc  = new Document({ sections });
  return Packer.toBlob(doc);
}

async function runConvert(file, onStatus, onProgress) {
  onStatus('Loading PDF…'); onProgress(0);

  const pdfjsLib = await import('pdfjs-dist');
  const { setupPdfWorker } = await import('../../lib/pdfWorker');
  setupPdfWorker(pdfjsLib);

  const pdf   = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
  const total = pdf.numPages;
  const pages = [];

  for (let i = 1; i <= total; i++) {
    onStatus(`Rendering page ${i} of ${total}…`);
    onProgress(Math.round((i - 0.5) / total * 80));
    const page   = await pdf.getPage(i);
    const render = await renderPage(page, 2.0);
    const lines  = await extractText(page);
    pages.push({ ...render, lines });
    onProgress(Math.round(i / total * 80));
  }

  onStatus('Building DOCX…'); onProgress(85);
  const blob = await buildDocx(pages);
  onProgress(98);

  // Trigger download with clean filename (no double extension)
  const a   = document.createElement('a');
  a.href     = URL.createObjectURL(blob);
  a.download = safeFilename(file.name);
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(a.href), 3000);
  onProgress(100);
  return { pages: total };
}

// ── UI ───────────────────────────────────────────────────────────────────────

export default function PDFtoWord() {
  const [file, setFile]           = useState(null);
  const [processing, setProc]     = useState(false);
  const [status, setStatus]       = useState('');
  const [progress, setProgress]   = useState(0);
  const [result, setResult]       = useState(null);
  const [error, setError]         = useState('');
  const topRef = useRef(null);

  const handleFile = f => { setFile(f[0]); setResult(null); setError(''); };
  const reset = () => { setFile(null); setResult(null); setError(''); setProgress(0); };

  const run = async () => {
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setProc(true); setError(''); setResult(null); setProgress(0);
    try {
      const res = await runConvert(file, setStatus, setProgress);
      setResult(res);
    } catch (e) { setError(e.message || 'Conversion failed'); }
    setProc(false); setStatus('');
  };

  return (
    <ToolLayout title="PDF to Word"
      description="Each page rendered as a crisp image frame inside an editable DOCX. Text layer included for search and copy-paste. Runs entirely in your browser.">
      <div ref={topRef} />
      {!file ? (
        <FileUpload onFiles={handleFile} accept={{ 'application/pdf': ['.pdf'] }}
          label="Drop your PDF here" sublabel="Any PDF — scanned or text-based">
          <div className="flex flex-wrap gap-1.5 mt-5 justify-center">
            {['100% offline', 'No server', 'Image frames', 'Searchable text', 'Correct filename'].map(t => (
              <span key={t} className="font-mono px-2.5 py-1"
                style={{ fontSize:'9px', letterSpacing:'0.05em', color:'rgba(201,168,76,0.6)',
                  border:'1px solid rgba(201,168,76,0.18)', background:'rgba(201,168,76,0.04)' }}>{t}</span>
            ))}
          </div>
        </FileUpload>
      ) : (
        <div className="space-y-3">
          <div className="card p-3 flex items-center gap-3">
            <div className="w-8 h-8 border border-white/10 flex items-center justify-center flex-shrink-0"
              style={{ background:'rgba(201,168,76,0.05)' }}>
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

          {!processing && !result && !error && (
            <div className="card p-4" style={{ background:'rgba(201,168,76,0.03)', borderColor:'rgba(201,168,76,0.1)' }}>
              <p className="label-gold mb-3">Pipeline</p>
              {[['Render','Each page rendered at 2× DPI as a lossless PNG'],
                ['Extract','Text lines extracted with position, font size, bold flag'],
                ['Build','Pages become image frames in DOCX; text embedded invisibly for search']
              ].map(([t,d],i) => (
                <div key={i} className="flex gap-3 items-start mb-2">
                  <div className="w-5 h-5 border border-gold/20 flex items-center justify-center flex-shrink-0"
                    style={{ background:'rgba(201,168,76,0.06)' }}>
                    <span className="font-mono text-gold/60" style={{ fontSize:'9px' }}>{i+1}</span>
                  </div>
                  <div>
                    <p className="font-mono text-xs text-white/60 mb-0.5">{t}</p>
                    <p className="font-mono text-white/30 leading-relaxed" style={{ fontSize:'10px' }}>{d}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {processing && (
            <div className="card p-5 anim-scale-in">
              <div className="flex items-center gap-3 mb-4">
                <svg className="w-4 h-4 animate-spin flex-shrink-0" style={{ color:'var(--gold)' }} fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-15" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-xs text-gold mb-0.5">Converting</p>
                  <p className="font-mono text-xs text-white/35 truncate">{status}</p>
                </div>
                <span className="font-display text-2xl font-light" style={{ color:'var(--gold)' }}>{progress}%</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width:`${Math.max(progress,2)}%`, transition:'width 0.4s ease' }}/>
              </div>
            </div>
          )}

          {error && (
            <div className="card p-4 flex gap-3" style={{ borderColor:'rgba(239,68,68,0.2)' }}>
              <div className="w-0.5 self-stretch" style={{ background:'rgba(239,68,68,0.5)' }}/>
              <div>
                <p className="font-mono text-xs text-red-400 mb-0.5">Conversion failed</p>
                <p className="font-mono text-xs text-white/30">{error}</p>
              </div>
            </div>
          )}

          {result && (
            <div className="success-card anim-scale-in">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-9 h-9 border border-gold-400/40 flex items-center justify-center">
                  <svg className="w-4 h-4 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7"/>
                  </svg>
                </div>
                <div>
                  <p className="font-display text-xl font-light text-white">DOCX downloaded</p>
                  <p className="font-mono text-xs text-white/30 mt-0.5">
                    {result.pages} page{result.pages!==1?'s':''} · image frames + searchable text
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={run} className="btn-primary flex-1 justify-center" style={{ padding:'0.65rem 1rem', fontSize:'11px' }}>Convert again</button>
                <button onClick={reset} className="btn-ghost" style={{ padding:'0.65rem 1rem', fontSize:'11px' }}>New file</button>
              </div>
            </div>
          )}

          {!processing && !result && (
            <div className="flex gap-2 pt-1">
              <button onClick={run} className="btn-primary flex-1 justify-center" style={{ padding:'0.7rem 1rem', fontSize:'12px' }}>
                Convert to DOCX
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                </svg>
              </button>
              <button onClick={reset} className="btn-ghost" style={{ padding:'0.7rem 1rem', fontSize:'12px' }}>Reset</button>
            </div>
          )}
        </div>
      )}
    </ToolLayout>
  );
}
