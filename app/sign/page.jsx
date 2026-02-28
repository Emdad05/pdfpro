'use client';
import { useState, useRef, useEffect } from 'react';
import ToolLayout from '../../components/ToolLayout';
import FileUpload from '../../components/FileUpload';

export default function SignPDF() {
  const [file, setFile] = useState(null);
  const [step, setStep] = useState(1);
  const [sigData, setSigData] = useState(null);
  const [position, setPosition] = useState('bottom-right');
  const [sigPage, setSigPage] = useState('last');
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const canvasRef = useRef(null);
  const padRef = useRef(null);

  const handleFile = (a) => { setFile(a[0]); setStep(2); setDone(false); };

  useEffect(() => {
    if (step === 2 && canvasRef.current) {
      import('signature_pad').then(({ default: SignaturePad }) => {
        const canvas = canvasRef.current;
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        canvas.width = canvas.offsetWidth * ratio;
        canvas.height = canvas.offsetHeight * ratio;
        canvas.getContext('2d').scale(ratio, ratio);
        const pad = new SignaturePad(canvas, { backgroundColor: 'rgba(255,255,255,0)', penColor: '#C9A84C', minWidth: 1.5, maxWidth: 4 });
        padRef.current = pad;
      });
    }
  }, [step]);

  const clearSig = () => padRef.current?.clear();

  const saveSig = () => {
    if (!padRef.current || padRef.current.isEmpty()) { alert('Please draw your signature first.'); return; }
    setSigData(padRef.current.toDataURL('image/png'));
    setStep(3);
  };

  const posMap = {
    'bottom-right': (w, h, sw, sh) => ({ x: w - sw - 40, y: 40 }),
    'bottom-left': (w, h, sw, sh) => ({ x: 40, y: 40 }),
    'bottom-center': (w, h, sw, sh) => ({ x: (w - sw) / 2, y: 40 }),
    'top-right': (w, h, sw, sh) => ({ x: w - sw - 40, y: h - sh - 40 }),
    'top-left': (w, h, sw, sh) => ({ x: 40, y: h - sh - 40 }),
  };

  const embed = async () => {
    setProcessing(true);
    try {
      const { PDFDocument } = await import('pdf-lib');
      const doc = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
      const pages = doc.getPages();
      const res = await fetch(sigData);
      const pngImg = await doc.embedPng(await res.arrayBuffer());
      const sigW = 160, sigH = 60;
      const targets = sigPage === 'all' ? pages : sigPage === 'first' ? [pages[0]] : [pages[pages.length - 1]];
      for (const page of targets) {
        const { width, height } = page.getSize();
        const { x, y } = posMap[position](width, height, sigW, sigH);
        page.drawImage(pngImg, { x, y, width: sigW, height: sigH });
      }
      const out = await doc.save();
      Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([out], { type: 'application/pdf' })), download: 'signed.pdf' }).click();
      setDone(true);
    } catch (e) { alert('Error: ' + e.message); }
    setProcessing(false);
  };

  const reset = () => { setFile(null); setStep(1); setSigData(null); setDone(false); };

  return (
    <ToolLayout title="Sign PDF" icon="✍️" description="Draw your signature and embed it into any PDF document.">
      {step === 1 && <FileUpload onFiles={handleFile} label="Upload PDF to sign" />}

      {step === 2 && (
        <div className="space-y-4">
          <div className="card p-4 flex items-center gap-4"><div className="text-2xl">📄</div><div><p className="font-semibold text-white">{file.name}</p></div></div>
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-semibold text-white">Draw your signature</h3>
              <button onClick={clearSig} className="text-sm text-slate-400 hover:text-gold transition-colors">Clear</button>
            </div>
            <div className="sig-canvas-wrapper"><canvas ref={canvasRef} className="w-full h-full" style={{ touchAction: 'none', cursor: 'crosshair' }} /></div>
            <p className="text-xs text-slate-500 mt-2 text-center">Draw with mouse or finger</p>
          </div>
          <div className="flex gap-3">
            <button onClick={saveSig} className="btn-primary flex-1 justify-center">Continue →</button>
            <button onClick={reset} className="btn-ghost">Cancel</button>
          </div>
        </div>
      )}

      {step === 3 && !done && (
        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="font-display font-semibold text-white mb-3">Your signature</h3>
            <div className="rounded-xl p-4 inline-block border border-white/5" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <img src={sigData} alt="Signature" className="max-h-16 max-w-xs" />
            </div>
            <button onClick={() => setStep(2)} className="text-sm text-gold hover:text-gold ml-4 transition-colors">Redraw</button>
          </div>
          <div className="card p-5 space-y-4">
            <div><label className="block text-sm text-slate-400 mb-2">Signature position</label><div className="grid grid-cols-3 sm:grid-cols-5 gap-2">{[{ id: 'bottom-left', l: '↙ BL' }, { id: 'bottom-center', l: '↓ BC' }, { id: 'bottom-right', l: '↘ BR' }, { id: 'top-left', l: '↖ TL' }, { id: 'top-right', l: '↗ TR' }].map(p => <button key={p.id} onClick={() => setPosition(p.id)} className={`option-btn text-xs ${position === p.id ? 'active' : ''}`}>{p.l}</button>)}</div></div>
            <div><label className="block text-sm text-slate-400 mb-2">Apply to</label><div className="flex gap-2">{[{ id: 'last', l: 'Last page' }, { id: 'first', l: 'First page' }, { id: 'all', l: 'All pages' }].map(p => <button key={p.id} onClick={() => setSigPage(p.id)} className={`option-btn flex-1 ${sigPage === p.id ? 'active' : ''}`}>{p.l}</button>)}</div></div>
          </div>
          <div className="flex gap-3">
            <button onClick={embed} disabled={processing} className="btn-primary flex-1 justify-center">{processing ? 'Signing...' : 'Sign & Download PDF'}</button>
            <button onClick={reset} className="btn-ghost">Reset</button>
          </div>
        </div>
      )}

      {done && <div className="success-card"><div className="text-4xl mb-3">✅</div><p className="font-display font-semibold text-gold text-lg mb-3">PDF signed!</p><button onClick={reset} className="btn-ghost text-sm">Sign another</button></div>}
    </ToolLayout>
  );
}
