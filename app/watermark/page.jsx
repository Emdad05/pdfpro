'use client';
import { useState, useRef } from 'react';
import ToolLayout from '../../components/ToolLayout';
import FileUpload from '../../components/FileUpload';

export default function WatermarkPDF() {
  const [file, setFile]         = useState(null);
  const [text, setText]         = useState('CONFIDENTIAL');
  const [opacity, setOpacity]   = useState(0.15);
  const [fontSize, setFontSize] = useState(48);
  const [color, setColor]       = useState('#C9A84C');
  const [position, setPos]      = useState('diagonal');
  const [processing, setProc]   = useState(false);
  const [done, setDone]         = useState(false);
  const [error, setError]       = useState('');
  const topRef = useRef(null);

  const hexToRgb = hex => ({ r:parseInt(hex.slice(1,3),16)/255, g:parseInt(hex.slice(3,5),16)/255, b:parseInt(hex.slice(5,7),16)/255 });
  const reset = () => { setFile(null); setDone(false); setError(''); };

  const addWatermark = async () => {
    topRef.current?.scrollIntoView({ behavior:'smooth', block:'start' });
    setProc(true); setError('');
    try {
      const { PDFDocument, rgb, StandardFonts, degrees } = await import('pdf-lib');
      const doc  = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption:true });
      const font = await doc.embedFont(StandardFonts.HelveticaBold);
      const { r, g, b } = hexToRgb(color);
      for (const page of doc.getPages()) {
        const { width, height } = page.getSize();
        const tw = font.widthOfTextAtSize(text, fontSize);
        let x, y, angle = 0;
        if (position==='diagonal') { x=(width-tw)/2; y=(height-fontSize)/2; angle=45; }
        else if (position==='center') { x=(width-tw)/2; y=(height-fontSize)/2; }
        else if (position==='top') { x=(width-tw)/2; y=height-fontSize-30; }
        else { x=(width-tw)/2; y=30; }
        page.drawText(text, { x, y, size:fontSize, font, color:rgb(r,g,b), opacity, rotate:degrees(angle) });
      }
      const out = await doc.save();
      const url = URL.createObjectURL(new Blob([out], { type:'application/pdf' }));
      const a   = document.createElement('a');
      a.href = url; a.download = file.name.replace(/\.pdf$/i,'') + '_watermarked.pdf';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setDone(true);
    } catch(e) { setError(e.message || 'Failed to add watermark'); }
    setProc(false);
  };

  return (
    <ToolLayout title="Watermark PDF" description="Add a custom text watermark to every page of your PDF.">
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
                <label className="font-mono text-xs text-white/40 block mb-1">Watermark text</label>
                <input type="text" value={text} onChange={e => setText(e.target.value)}
                  className="input font-mono text-sm" placeholder="CONFIDENTIAL"/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-mono text-xs text-white/40 block mb-1">Font size: {fontSize}pt</label>
                  <input type="range" min={12} max={120} value={fontSize}
                    onChange={e => setFontSize(Number(e.target.value))} className="w-full"/>
                </div>
                <div>
                  <label className="font-mono text-xs text-white/40 block mb-1">Opacity: {Math.round(opacity*100)}%</label>
                  <input type="range" min={0.05} max={0.8} step={0.05} value={opacity}
                    onChange={e => setOpacity(Number(e.target.value))} className="w-full"/>
                </div>
              </div>
              <div>
                <label className="font-mono text-xs text-white/40 block mb-1">Color</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={color} onChange={e => setColor(e.target.value)}
                    className="w-9 h-9 cursor-pointer rounded border-0"/>
                  <span className="font-mono text-xs text-white/40">{color}</span>
                </div>
              </div>
              <div>
                <label className="font-mono text-xs text-white/40 block mb-2">Position</label>
                <div className="grid grid-cols-4 gap-2">
                  {['diagonal','center','top','bottom'].map(p => (
                    <button key={p} onClick={() => setPos(p)}
                      className={`option-btn capitalize ${position===p?'active':''}`} style={{ padding:'0.4rem' }}>
                      <span className="font-mono text-xs">{p}</span>
                    </button>
                  ))}
                </div>
              </div>
              {/* Live preview */}
              <div className="flex items-center justify-center border border-white/5 rounded"
                style={{ background:'rgba(255,255,255,0.02)', minHeight:'64px' }}>
                <span className="font-bold select-none"
                  style={{ color, opacity, fontSize:`${Math.min(fontSize*0.45,24)}px`,
                    transform:position==='diagonal'?'rotate(-30deg)':'none' }}>
                  {text||'Preview'}
                </span>
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
                  <p className="font-display text-lg font-light text-white">Watermark added</p>
                  <p className="font-mono text-xs text-white/30">Downloaded successfully</p>
                </div>
              </div>
              <button onClick={reset} className="btn-ghost w-full justify-center" style={{ fontSize:'11px' }}>Watermark another</button>
            </div>
          )}

          {!processing && !done && (
            <div className="flex gap-2 pt-1">
              <button onClick={addWatermark} disabled={!text} className="btn-primary flex-1 justify-center" style={{ padding:'0.7rem', fontSize:'12px' }}>
                Add Watermark
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                </svg>
              </button>
              <button onClick={reset} className="btn-ghost" style={{ padding:'0.7rem 1rem', fontSize:'12px' }}>Reset</button>
            </div>
          )}
          {processing && <p className="font-mono text-xs text-center text-white/30 py-2">Adding watermark…</p>}
        </div>
      )}
    </ToolLayout>
  );
}
