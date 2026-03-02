'use client';
import { useState, useRef } from 'react';
import ToolLayout from '../../components/ToolLayout';
import FileUpload from '../../components/FileUpload';

// Quality levels: different strategies per level
const LEVELS = [
  { id:'screen', label:'Screen',   desc:'Smallest — web/email',  imgScale:0.9, jpgQ:0.65 },
  { id:'ebook',  label:'Balanced', desc:'Good quality + smaller', imgScale:1.2, jpgQ:0.80 },
  { id:'print',  label:'Print',    desc:'Near-lossless quality',  imgScale:1.8, jpgQ:0.92 },
];

export default function CompressPDF() {
  const [file, setFile]           = useState(null);
  const [level, setLevel]         = useState('ebook');
  const [processing, setProc]     = useState(false);
  const [progress, setProgress]   = useState(0);
  const [result, setResult]       = useState(null);
  const [error, setError]         = useState('');
  const topRef = useRef(null);

  const handleFile = f => { setFile(f[0]); setResult(null); setError(''); };
  const reset = () => { setFile(null); setResult(null); setError(''); setProgress(0); };

  const compress = async () => {
    topRef.current?.scrollIntoView({ behavior:'smooth', block:'start' });
    setProc(true); setError(''); setResult(null); setProgress(5);
    try {
      const cfg = LEVELS.find(l => l.id === level);

      const pdfjsLib = await import('pdfjs-dist');
      const { setupPdfWorker } = await import('../../lib/pdfWorker');
      setupPdfWorker(pdfjsLib);
      const { PDFDocument } = await import('pdf-lib');

      const origBytes = await file.arrayBuffer();
      const pdf       = await pdfjsLib.getDocument({ data: origBytes.slice() }).promise;
      const total     = pdf.numPages;

      // Re-render each page as compressed JPEG and rebuild PDF
      const outDoc = await PDFDocument.create();
      for (let i = 1; i <= total; i++) {
        setProgress(Math.round(10 + (i / total) * 80));
        const page = await pdf.getPage(i);
        const vp   = page.getViewport({ scale: cfg.imgScale });
        const canvas = document.createElement('canvas');
        canvas.width = vp.width; canvas.height = vp.height;
        await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;
        const b64  = canvas.toDataURL('image/jpeg', cfg.jpgQ).split(',')[1];
        const jpg  = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
        const img  = await outDoc.embedJpg(jpg);
        const vp1  = page.getViewport({ scale: 1 });
        const pg   = outDoc.addPage([vp1.width, vp1.height]);
        pg.drawImage(img, { x:0, y:0, width:vp1.width, height:vp1.height });
      }

      setProgress(93);
      const out     = await outDoc.save({ useObjectStreams: true });
      const origKB  = file.size / 1024;
      const compKB  = out.byteLength / 1024;
      const savings = ((file.size - out.byteLength) / file.size * 100).toFixed(1);
      setResult({ out, origKB, compKB, savings, name: file.name });
      setProgress(100);
    } catch(e) { setError(e.message || 'Compression failed'); }
    setProc(false);
  };

  const download = () => {
    const url = URL.createObjectURL(new Blob([result.out], { type:'application/pdf' }));
    const a   = document.createElement('a');
    a.href = url; a.download = result.name.replace(/\.pdf$/i, '') + '_compressed.pdf';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <ToolLayout title="Compress PDF" description="Re-renders each page as an optimised JPEG image and rebuilds the PDF — real file size reduction.">
      <div ref={topRef}/>
      {!file ? (
        <FileUpload onFiles={handleFile} accept={{ 'application/pdf':['.pdf'] }} label="Drop your PDF here"/>
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

          {!processing && !result && (
            <div className="card p-4">
              <p className="label-gold mb-3">Compression level</p>
              <div className="grid grid-cols-3 gap-2">
                {LEVELS.map(l => (
                  <button key={l.id} onClick={() => setLevel(l.id)}
                    className={`option-btn text-left ${level===l.id?'active':''}`} style={{ padding:'0.65rem 0.6rem' }}>
                    <p className="font-mono text-xs font-medium mb-0.5"
                      style={{ color:level===l.id?'var(--gold)':'rgba(255,255,255,0.55)' }}>{l.label}</p>
                    <p className="font-mono leading-relaxed" style={{ fontSize:'9px', color:'rgba(255,255,255,0.28)' }}>{l.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {processing && (
            <div className="card p-5 anim-scale-in">
              <div className="flex items-center gap-3 mb-4">
                <svg className="w-4 h-4 animate-spin flex-shrink-0" style={{ color:'var(--gold)' }} fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-15" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                <p className="font-mono text-xs text-gold flex-1">Compressing…</p>
                <span className="font-display text-2xl font-light" style={{ color:'var(--gold)' }}>{progress}%</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width:`${Math.max(progress,2)}%`, transition:'width 0.3s ease' }}/>
              </div>
            </div>
          )}

          {error && (
            <div className="card p-4 flex gap-3" style={{ borderColor:'rgba(239,68,68,0.2)' }}>
              <div className="w-0.5 self-stretch" style={{ background:'rgba(239,68,68,0.5)' }}/>
              <div>
                <p className="font-mono text-xs text-red-400 mb-0.5">Compression failed</p>
                <p className="font-mono text-xs text-white/30">{error}</p>
              </div>
            </div>
          )}

          {result && (
            <div className="success-card anim-scale-in">
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[['Original', result.origKB.toFixed(1)+' KB'],
                  ['Saved', result.savings+'%'],
                  ['Compressed', result.compKB.toFixed(1)+' KB']].map(([l,v]) => (
                  <div key={l} className="text-center p-2"
                    style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)' }}>
                    <p className="font-display text-base font-light text-white">{v}</p>
                    <p className="font-mono text-white/25" style={{ fontSize:'9px' }}>{l}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={download} className="btn-primary flex-1 justify-center" style={{ padding:'0.65rem', fontSize:'11px' }}>
                  Download
                </button>
                <button onClick={reset} className="btn-ghost" style={{ padding:'0.65rem 1rem', fontSize:'11px' }}>New file</button>
              </div>
            </div>
          )}

          {!processing && !result && (
            <div className="flex gap-2 pt-1">
              <button onClick={compress} className="btn-primary flex-1 justify-center" style={{ padding:'0.7rem', fontSize:'12px' }}>
                Compress PDF
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
