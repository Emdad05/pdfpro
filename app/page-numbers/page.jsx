'use client';
import { useState, useRef } from 'react';
import ToolLayout from '../../components/ToolLayout';
import FileUpload from '../../components/FileUpload';

export default function PageNumbers() {
  const [file, setFile]           = useState(null);
  const [position, setPos]        = useState('bottom-center');
  const [startNum, setStart]      = useState(1);
  const [fontSize, setFontSize]   = useState(12);
  const [prefix, setPrefix]       = useState('');
  const [processing, setProc]     = useState(false);
  const [done, setDone]           = useState(false);
  const [error, setError]         = useState('');
  const topRef = useRef(null);

  const POS = {
    'bottom-center': (w,h,tw) => ({ x:(w-tw)/2, y:22 }),
    'bottom-right':  (w,h,tw) => ({ x:w-tw-30,  y:22 }),
    'bottom-left':   (w,h,tw) => ({ x:30,        y:22 }),
    'top-center':    (w,h,tw) => ({ x:(w-tw)/2,  y:h-30 }),
    'top-right':     (w,h,tw) => ({ x:w-tw-30,   y:h-30 }),
    'top-left':      (w,h,tw) => ({ x:30,         y:h-30 }),
  };

  const reset = () => { setFile(null); setDone(false); setError(''); };

  const addNumbers = async () => {
    topRef.current?.scrollIntoView({ behavior:'smooth', block:'start' });
    setProc(true); setError('');
    try {
      const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
      const doc  = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption:true });
      const font = await doc.embedFont(StandardFonts.Helvetica);
      doc.getPages().forEach((page, i) => {
        const { width, height } = page.getSize();
        const label = `${prefix}${startNum + i}`;
        const tw    = font.widthOfTextAtSize(label, fontSize);
        const { x, y } = POS[position](width, height, tw);
        page.drawText(label, { x, y, size:fontSize, font, color:rgb(0.5,0.5,0.5) });
      });
      const out = await doc.save();
      const url = URL.createObjectURL(new Blob([out], { type:'application/pdf' }));
      const a   = document.createElement('a');
      a.href = url; a.download = file.name.replace(/\.pdf$/i,'') + '_numbered.pdf';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setDone(true);
    } catch(e) { setError(e.message || 'Failed to add page numbers'); }
    setProc(false);
  };

  return (
    <ToolLayout title="Page Numbers" description="Add page numbers to every page of your PDF.">
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
                <p className="label-gold mb-2">Position</p>
                <div className="grid grid-cols-3 gap-1">
                  {[{id:'top-left',l:'↖ Top L'},{id:'top-center',l:'↑ Top C'},{id:'top-right',l:'↗ Top R'},
                    {id:'bottom-left',l:'↙ Bot L'},{id:'bottom-center',l:'↓ Bot C'},{id:'bottom-right',l:'↘ Bot R'}].map(p => (
                    <button key={p.id} onClick={() => setPos(p.id)}
                      className={`option-btn ${position===p.id?'active':''}`} style={{ padding:'0.4rem 0.2rem' }}>
                      <span className="font-mono" style={{ fontSize:'10px' }}>{p.l}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-mono text-xs text-white/40 block mb-1">Start #</label>
                  <input type="number" value={startNum} min={0}
                    onChange={e => setStart(Number(e.target.value))} className="input font-mono text-xs"/>
                </div>
                <div>
                  <label className="font-mono text-xs text-white/40 block mb-1">Font size</label>
                  <input type="number" value={fontSize} min={8} max={36}
                    onChange={e => setFontSize(Number(e.target.value))} className="input font-mono text-xs"/>
                </div>
                <div>
                  <label className="font-mono text-xs text-white/40 block mb-1">Prefix</label>
                  <input type="text" value={prefix} onChange={e => setPrefix(e.target.value)}
                    placeholder="Page " className="input font-mono text-xs"/>
                </div>
              </div>
              <div className="p-2 text-center" style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)' }}>
                <span className="font-mono text-xs text-white/30">Preview: </span>
                <span className="font-mono text-xs text-gold">{prefix}{startNum}</span>
                <span className="font-mono text-xs text-white/20">, </span>
                <span className="font-mono text-xs text-gold">{prefix}{startNum+1}</span>
                <span className="font-mono text-xs text-white/20">, </span>
                <span className="font-mono text-xs text-gold">{prefix}{startNum+2}</span>
                <span className="font-mono text-xs text-white/20">…</span>
              </div>
            </div>
          )}

          {error && (
            <div className="card p-4 flex gap-3" style={{ borderColor:'rgba(239,68,68,0.2)' }}>
              <div className="w-0.5 self-stretch" style={{ background:'rgba(239,68,68,0.5)' }}/>
              <p className="font-mono text-xs text-red-400">{error}</p>
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
                <p className="font-display text-lg font-light text-white">Page numbers added</p>
              </div>
              <button onClick={reset} className="btn-ghost w-full justify-center" style={{ fontSize:'11px' }}>Number another</button>
            </div>
          )}

          {!processing && !done && (
            <div className="flex gap-2 pt-1">
              <button onClick={addNumbers} className="btn-primary flex-1 justify-center" style={{ padding:'0.7rem', fontSize:'12px' }}>
                Add Page Numbers
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                </svg>
              </button>
              <button onClick={reset} className="btn-ghost" style={{ padding:'0.7rem 1rem', fontSize:'12px' }}>Reset</button>
            </div>
          )}
          {processing && <p className="font-mono text-xs text-center text-white/30 py-2">Adding numbers…</p>}
        </div>
      )}
    </ToolLayout>
  );
}
