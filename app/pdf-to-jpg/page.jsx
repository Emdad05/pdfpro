'use client';
import { useState, useRef } from 'react';
import ToolLayout from '../../components/ToolLayout';
import FileUpload from '../../components/FileUpload';

export default function PDFtoJPG() {
  const [file, setFile]         = useState(null);
  const [processing, setProc]   = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus]     = useState('');
  const [done, setDone]         = useState(false);
  const [error, setError]       = useState('');
  const [quality, setQuality]   = useState(0.92);
  const [scale, setScale]       = useState(2);
  const [format, setFormat]     = useState('jpg');
  const topRef = useRef(null);

  const reset = () => { setFile(null); setDone(false); setError(''); setProgress(0); };

  const convert = async () => {
    topRef.current?.scrollIntoView({ behavior:'smooth', block:'start' });
    setProc(true); setProgress(0); setError('');
    try {
      const pdfjsLib = await import('pdfjs-dist');
      const { setupPdfWorker } = await import('../../lib/pdfWorker');
      setupPdfWorker(pdfjsLib);
      const pdf   = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
      const total = pdf.numPages;
      const { default: JSZip } = await import('jszip');
      const zip = new JSZip();
      const stem = file.name.replace(/\.pdf$/i,'');

      for (let i = 1; i <= total; i++) {
        setStatus(`Rendering page ${i} of ${total}…`);
        setProgress(Math.round((i-1)/total*90));
        const page   = await pdf.getPage(i);
        const vp     = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        canvas.width  = vp.width;
        canvas.height = vp.height;
        await page.render({ canvasContext:canvas.getContext('2d'), viewport:vp }).promise;
        const mime = format==='png' ? 'image/png' : 'image/jpeg';
        const ext  = format==='png' ? 'png' : 'jpg';
        const b64  = canvas.toDataURL(mime, quality).split(',')[1];
        zip.file(`${stem}_page${String(i).padStart(3,'0')}.${ext}`, b64, { base64:true });
      }

      setStatus('Zipping…'); setProgress(92);
      const blob = await zip.generateAsync({ type:'blob' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = `${stem}_pages.zip`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setDone(true); setProgress(100);
    } catch(e) { setError(e.message || 'Conversion failed'); }
    setProc(false); setStatus('');
  };

  return (
    <ToolLayout title="PDF to Image" description="Convert each PDF page to JPG or PNG. Downloads as a ZIP archive.">
      <div ref={topRef}/>
      {!file ? (
        <FileUpload onFiles={f => setFile(f[0])} accept={{ 'application/pdf':['.pdf'] }} label="Drop your PDF here"/>
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
            {!processing && !done && (
              <button onClick={reset} className="p-1 text-white/20 hover:text-white/60 transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            )}
          </div>

          {!processing && !done && (
            <div className="card p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="label-gold mb-2">Format</p>
                  <div className="flex gap-2">
                    {['jpg','png'].map(f => (
                      <button key={f} onClick={() => setFormat(f)}
                        className={`option-btn flex-1 ${format===f?'active':''}`} style={{ padding:'0.4rem' }}>
                        <span className="font-mono text-xs uppercase">{f}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="label-gold mb-2">Resolution</p>
                  <div className="flex gap-2">
                    {[{s:1,l:'1×'},{s:2,l:'2×'},{s:3,l:'3×'}].map(r => (
                      <button key={r.s} onClick={() => setScale(r.s)}
                        className={`option-btn flex-1 ${scale===r.s?'active':''}`} style={{ padding:'0.4rem' }}>
                        <span className="font-mono text-xs">{r.l}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              {format==='jpg' && (
                <div>
                  <label className="font-mono text-xs text-white/40 block mb-1">JPG quality: {Math.round(quality*100)}%</label>
                  <input type="range" min={0.5} max={1} step={0.05} value={quality}
                    onChange={e => setQuality(Number(e.target.value))} className="w-full"/>
                </div>
              )}
            </div>
          )}

          {processing && (
            <div className="card p-5">
              <div className="flex items-center gap-3 mb-4">
                <svg className="w-4 h-4 animate-spin flex-shrink-0" style={{ color:'var(--gold)' }} fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-15" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-xs text-gold truncate">{status}</p>
                </div>
                <span className="font-display text-xl font-light" style={{ color:'var(--gold)' }}>{progress}%</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width:`${Math.max(progress,2)}%`, transition:'width 0.3s' }}/>
              </div>
            </div>
          )}

          {error && (
            <div className="card p-4 flex gap-3" style={{ borderColor:'rgba(239,68,68,0.2)' }}>
              <div className="w-0.5 self-stretch" style={{ background:'rgba(239,68,68,0.5)' }}/>
              <div>
                <p className="font-mono text-xs text-red-400 mb-0.5">Failed</p>
                <p className="font-mono text-xs text-white/30">{error}</p>
              </div>
            </div>
          )}

          {done && (
            <div className="success-card anim-scale-in">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 border border-gold/30 flex items-center justify-center">
                  <svg className="w-4 h-4 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7"/>
                  </svg>
                </div>
                <div>
                  <p className="font-display text-lg font-light text-white">ZIP downloaded</p>
                  <p className="font-mono text-xs text-white/30">One {format.toUpperCase()} per page</p>
                </div>
              </div>
              <button onClick={reset} className="btn-ghost w-full justify-center" style={{ fontSize:'11px' }}>Convert another</button>
            </div>
          )}

          {!processing && !done && (
            <div className="flex gap-2 pt-1">
              <button onClick={convert} className="btn-primary flex-1 justify-center" style={{ padding:'0.7rem', fontSize:'12px' }}>
                Convert to {format.toUpperCase()}
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
