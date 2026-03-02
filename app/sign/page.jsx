'use client';
import { useState, useRef, useEffect } from 'react';
import ToolLayout from '../../components/ToolLayout';
import FileUpload from '../../components/FileUpload';

export default function SignPDF() {
  const [file, setFile]       = useState(null);
  const [step, setStep]       = useState(1);
  const [sigData, setSigData] = useState(null);
  const [position, setPos]    = useState('bottom-right');
  const [sigPage, setSigPage] = useState('last');
  const [sigSize, setSigSize] = useState('medium');
  const [processing, setProc] = useState(false);
  const [done, setDone]       = useState(false);
  const [error, setError]     = useState('');
  const canvasRef = useRef(null);
  const padRef    = useRef(null);
  const topRef    = useRef(null);

  const handleFile = f => { setFile(f[0]); setStep(2); setDone(false); setError(''); };

  useEffect(() => {
    if (step !== 2 || !canvasRef.current) return;
    import('signature_pad').then(({ default: SignaturePad }) => {
      const canvas = canvasRef.current;
      const ratio  = Math.max(window.devicePixelRatio || 1, 1);
      canvas.width  = canvas.offsetWidth  * ratio;
      canvas.height = canvas.offsetHeight * ratio;
      canvas.getContext('2d').scale(ratio, ratio);
      padRef.current = new SignaturePad(canvas, {
        backgroundColor:'rgba(255,255,255,0)', penColor:'#C9A84C', minWidth:1.5, maxWidth:4,
      });
    });
  }, [step]);

  const clearSig = () => padRef.current?.clear();

  const saveSig = () => {
    if (!padRef.current || padRef.current.isEmpty()) {
      setError('Please draw your signature first.'); return;
    }
    setSigData(padRef.current.toDataURL('image/png'));
    setError(''); setStep(3);
  };

  const POS_MAP = {
    'bottom-right':  (w,h,sw,sh) => ({ x:w-sw-40, y:40 }),
    'bottom-left':   (w,h,sw,sh) => ({ x:40,       y:40 }),
    'bottom-center': (w,h,sw,sh) => ({ x:(w-sw)/2, y:40 }),
    'top-right':     (w,h,sw,sh) => ({ x:w-sw-40,  y:h-sh-40 }),
    'top-left':      (w,h,sw,sh) => ({ x:40,        y:h-sh-40 }),
  };
  const SIG_SIZES = { small:[120,45], medium:[180,65], large:[260,95] };

  const embed = async () => {
    topRef.current?.scrollIntoView({ behavior:'smooth', block:'start' });
    setProc(true); setError('');
    try {
      const { PDFDocument } = await import('pdf-lib');
      const doc    = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption:true });
      const pages  = doc.getPages();
      const pngImg = await doc.embedPng(await (await fetch(sigData)).arrayBuffer());
      const [sigW, sigH] = SIG_SIZES[sigSize];
      const targets = sigPage==='all' ? pages : sigPage==='first' ? [pages[0]] : [pages[pages.length-1]];
      for (const page of targets) {
        const { width, height } = page.getSize();
        const { x, y } = POS_MAP[position](width, height, sigW, sigH);
        page.drawImage(pngImg, { x, y, width:sigW, height:sigH });
      }
      const out = await doc.save();
      const url = URL.createObjectURL(new Blob([out], { type:'application/pdf' }));
      const a   = document.createElement('a');
      a.href = url; a.download = file.name.replace(/\.pdf$/i,'') + '_signed.pdf';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setDone(true);
    } catch(e) { setError(e.message || 'Failed to embed signature'); }
    setProc(false);
  };

  const reset = () => { setFile(null); setStep(1); setSigData(null); setDone(false); setError(''); };

  return (
    <ToolLayout title="Sign PDF" description="Draw your signature and embed it into any PDF.">
      <div ref={topRef}/>

      {step===1 && <FileUpload onFiles={handleFile} label="Upload PDF to sign" sublabel="Click to browse"/>}

      {step===2 && (
        <div className="space-y-3">
          <div className="card p-3 flex items-center gap-3">
            <span className="font-mono text-xs text-gold/60 w-8 text-center border border-gold/20 py-1" style={{ background:'rgba(201,168,76,0.04)' }}>PDF</span>
            <p className="font-mono text-sm text-white flex-1 truncate">{file?.name}</p>
          </div>
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="label-gold">Draw your signature</p>
              <button onClick={clearSig} className="font-mono text-xs text-white/30 hover:text-white/60 transition-colors">Clear</button>
            </div>
            <div className="sig-canvas-wrapper">
              <canvas ref={canvasRef} className="w-full h-full" style={{ touchAction:'none', cursor:'crosshair' }}/>
            </div>
            <p className="font-mono text-center mt-2" style={{ fontSize:'10px', color:'rgba(255,255,255,0.2)' }}>
              Draw with mouse or finger
            </p>
          </div>
          {error && <p className="font-mono text-xs text-red-400 text-center">{error}</p>}
          <div className="flex gap-2">
            <button onClick={saveSig} className="btn-primary flex-1 justify-center" style={{ padding:'0.7rem', fontSize:'12px' }}>
              Continue →
            </button>
            <button onClick={reset} className="btn-ghost" style={{ padding:'0.7rem 1rem', fontSize:'12px' }}>Cancel</button>
          </div>
        </div>
      )}

      {step===3 && !done && (
        <div className="space-y-3">
          <div className="card p-4">
            <p className="label-gold mb-2">Your signature</p>
            <div className="inline-block p-3 border border-white/10" style={{ background:'rgba(255,255,255,0.02)' }}>
              <img src={sigData} alt="Signature" className="max-h-14 max-w-xs"/>
            </div>
            <button onClick={() => setStep(2)} className="font-mono text-xs text-gold/60 hover:text-gold ml-3 transition-colors">Redraw</button>
          </div>
          <div className="card p-4 space-y-4">
            <div>
              <p className="label-gold mb-2">Position</p>
              <div className="grid grid-cols-3 gap-1">
                {[{id:'bottom-left',l:'↙ BL'},{id:'bottom-center',l:'↓ BC'},{id:'bottom-right',l:'↘ BR'},
                  {id:'top-left',   l:'↖ TL'},{id:'top-right',    l:'↗ TR'}].map(p => (
                  <button key={p.id} onClick={() => setPos(p.id)}
                    className={`option-btn ${position===p.id?'active':''}`} style={{ padding:'0.4rem' }}>
                    <span className="font-mono text-xs">{p.l}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="label-gold mb-2">Size</p>
              <div className="flex gap-2">
                {['small','medium','large'].map(s => (
                  <button key={s} onClick={() => setSigSize(s)}
                    className={`option-btn flex-1 capitalize ${sigSize===s?'active':''}`} style={{ padding:'0.4rem' }}>
                    <span className="font-mono text-xs capitalize">{s}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="label-gold mb-2">Apply to</p>
              <div className="flex gap-2">
                {[{id:'last',l:'Last page'},{id:'first',l:'First page'},{id:'all',l:'All pages'}].map(p => (
                  <button key={p.id} onClick={() => setSigPage(p.id)}
                    className={`option-btn flex-1 ${sigPage===p.id?'active':''}`} style={{ padding:'0.4rem' }}>
                    <span className="font-mono text-xs">{p.l}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <div className="card p-3 flex gap-2" style={{ borderColor:'rgba(239,68,68,0.2)' }}>
              <div className="w-0.5 self-stretch" style={{ background:'rgba(239,68,68,0.5)' }}/>
              <p className="font-mono text-xs text-red-400">{error}</p>
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={embed} disabled={processing} className="btn-primary flex-1 justify-center" style={{ padding:'0.7rem', fontSize:'12px' }}>
              {processing ? 'Signing…' : 'Sign & Download PDF'}
              {!processing && <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3"/>
              </svg>}
            </button>
            <button onClick={reset} className="btn-ghost" style={{ padding:'0.7rem 1rem', fontSize:'12px' }}>Reset</button>
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
              <p className="font-display text-lg font-light text-white">PDF signed</p>
              <p className="font-mono text-xs text-white/30">Downloaded successfully</p>
            </div>
          </div>
          <button onClick={reset} className="btn-ghost w-full justify-center" style={{ fontSize:'11px' }}>Sign another</button>
        </div>
      )}
    </ToolLayout>
  );
}
