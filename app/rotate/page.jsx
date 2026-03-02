'use client';
import { useState, useRef } from 'react';
import ToolLayout from '../../components/ToolLayout';
import FileUpload from '../../components/FileUpload';

function parseRanges(input, total) {
  const pages = new Set();
  input.split(',').forEach(part => {
    part = part.trim();
    if (part.includes('-')) {
      const [a,b] = part.split('-').map(Number);
      for (let i = Math.max(1,a); i <= Math.min(total,b); i++) pages.add(i-1);
    } else {
      const n = Number(part);
      if (n >= 1 && n <= total) pages.add(n-1);
    }
  });
  return [...pages];
}

export default function RotatePDF() {
  const [file, setFile]           = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [rotation, setRotation]   = useState(90);
  const [pageMode, setPageMode]   = useState('all');
  const [rangeInput, setRangeInput] = useState('');
  const [processing, setProc]     = useState(false);
  const [done, setDone]           = useState(false);
  const [error, setError]         = useState('');
  const topRef = useRef(null);

  const handleFile = async f => {
    const file = f[0]; setFile(file); setDone(false); setError('');
    const { PDFDocument } = await import('pdf-lib');
    const doc = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption:true });
    const n   = doc.getPageCount(); setPageCount(n); setRangeInput(`1-${n}`);
  };

  const reset = () => { setFile(null); setDone(false); setError(''); };

  const rotate = async () => {
    topRef.current?.scrollIntoView({ behavior:'smooth', block:'start' });
    setProc(true); setError('');
    try {
      const { PDFDocument, degrees } = await import('pdf-lib');
      const doc     = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption:true });
      const indices = pageMode === 'all'
        ? Array.from({ length: pageCount }, (_, i) => i)
        : parseRanges(rangeInput, pageCount);

      for (const i of indices) {
        const page    = doc.getPage(i);
        // Normalise existing rotation to 0–359 range first
        const current = ((page.getRotation().angle % 360) + 360) % 360;
        const next    = ((current + rotation) % 360 + 360) % 360;
        page.setRotation(degrees(next));
      }

      const out = await doc.save();
      const url = URL.createObjectURL(new Blob([out], { type:'application/pdf' }));
      const a   = document.createElement('a');
      a.href = url; a.download = file.name.replace(/\.pdf$/i,'') + '_rotated.pdf';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setDone(true);
    } catch(e) { setError(e.message || 'Rotation failed'); }
    setProc(false);
  };

  const ROTATIONS = [
    { deg:90,  label:'+90°', sub:'Clockwise' },
    { deg:180, label:'180°', sub:'Flip' },
    { deg:270, label:'+270°', sub:'Counter-CW' },
    { deg:-90, label:'−90°', sub:'Counter-CW' },
  ];

  return (
    <ToolLayout title="Rotate PDF" description="Rotate all or specific pages in your PDF document.">
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
              <p className="font-mono text-xs text-white/30">{pageCount} pages</p>
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
              <div>
                <p className="label-gold mb-3">Rotation</p>
                <div className="grid grid-cols-4 gap-2">
                  {ROTATIONS.map(r => (
                    <button key={r.deg} onClick={() => setRotation(r.deg)}
                      className={`option-btn text-center ${rotation===r.deg?'active':''}`} style={{ padding:'0.5rem 0.3rem' }}>
                      <p className="font-mono text-xs font-medium"
                        style={{ color:rotation===r.deg?'var(--gold)':'rgba(255,255,255,0.55)' }}>{r.label}</p>
                      <p className="font-mono" style={{ fontSize:'9px', color:'rgba(255,255,255,0.25)' }}>{r.sub}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="label-gold mb-2">Pages</p>
                <div className="flex gap-2 mb-2">
                  {[{id:'all',label:'All pages'},{id:'range',label:'Custom range'}].map(m => (
                    <button key={m.id} onClick={() => setPageMode(m.id)}
                      className={`option-btn flex-1 ${pageMode===m.id?'active':''}`} style={{ padding:'0.5rem' }}>
                      <span className="font-mono text-xs">{m.label}</span>
                    </button>
                  ))}
                </div>
                {pageMode==='range' && (
                  <input type="text" value={rangeInput} onChange={e => setRangeInput(e.target.value)}
                    className="input font-mono text-xs" placeholder="e.g. 1-3, 5, 7-10"/>
                )}
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
                  <p className="font-display text-lg font-light text-white">PDF rotated</p>
                  <p className="font-mono text-xs text-white/30">Downloaded successfully</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={rotate} className="btn-primary flex-1 justify-center" style={{ padding:'0.65rem', fontSize:'11px' }}>Rotate again</button>
                <button onClick={reset} className="btn-ghost" style={{ padding:'0.65rem 1rem', fontSize:'11px' }}>New file</button>
              </div>
            </div>
          )}

          {!processing && !done && (
            <div className="flex gap-2 pt-1">
              <button onClick={rotate} className="btn-primary flex-1 justify-center" style={{ padding:'0.7rem', fontSize:'12px' }}>
                Rotate PDF
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                </svg>
              </button>
              <button onClick={reset} className="btn-ghost" style={{ padding:'0.7rem 1rem', fontSize:'12px' }}>Reset</button>
            </div>
          )}
          {processing && <p className="font-mono text-xs text-center text-white/30 py-2">Rotating…</p>}
        </div>
      )}
    </ToolLayout>
  );
}
