'use client';
import { useState } from 'react';
import ToolLayout from '../../components/ToolLayout';
import FileUpload from '../../components/FileUpload';

export default function PageNumbers() {
  const [file, setFile] = useState(null);
  const [position, setPosition] = useState('bottom-center');
  const [startNum, setStartNum] = useState(1);
  const [fontSize, setFontSize] = useState(12);
  const [prefix, setPrefix] = useState('');
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);

  const posMap = {
    'bottom-center': (w, h, tw) => ({ x: (w - tw) / 2, y: 20 }),
    'bottom-right': (w, h, tw) => ({ x: w - tw - 30, y: 20 }),
    'bottom-left': (w, h, tw) => ({ x: 30, y: 20 }),
    'top-center': (w, h, tw) => ({ x: (w - tw) / 2, y: h - 30 }),
    'top-right': (w, h, tw) => ({ x: w - tw - 30, y: h - 30 }),
    'top-left': (w, h, tw) => ({ x: 30, y: h - 30 }),
  };

  const addNumbers = async () => {
    setProcessing(true);
    try {
      const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
      const doc = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
      const font = await doc.embedFont(StandardFonts.Helvetica);
      doc.getPages().forEach((page, i) => {
        const { width, height } = page.getSize();
        const label = `${prefix}${startNum + i}`;
        const tw = font.widthOfTextAtSize(label, fontSize);
        const { x, y } = posMap[position](width, height, tw);
        page.drawText(label, { x, y, size: fontSize, font, color: rgb(0.7, 0.7, 0.7) });
      });
      const out = await doc.save();
      const url = URL.createObjectURL(new Blob([out], { type: 'application/pdf' }));
      Object.assign(document.createElement('a'), { href: url, download: 'numbered.pdf' }).click();
      URL.revokeObjectURL(url);
      setDone(true);
    } catch (e) { alert('Error: ' + e.message); }
    setProcessing(false);
  };

  return (
    <ToolLayout title="Page Numbers" icon="🔢" description="Add page numbers to every page of your PDF.">
      {!file ? <FileUpload onFiles={a => setFile(a[0])} /> : (
        <div className="space-y-4">
          <div className="glass-card p-4 flex items-center gap-4"><div className="text-2xl">📄</div><div><p className="font-semibold text-white">{file.name}</p></div></div>
          <div className="glass-card p-5 space-y-4">
            <div><label className="block text-sm text-slate-400 mb-2">Position</label><div className="grid grid-cols-3 gap-2">{[{ id: 'bottom-left', l: '↙ BL' }, { id: 'bottom-center', l: '↓ BC' }, { id: 'bottom-right', l: '↘ BR' }, { id: 'top-left', l: '↖ TL' }, { id: 'top-center', l: '↑ TC' }, { id: 'top-right', l: '↗ TR' }].map(p => <button key={p.id} onClick={() => setPosition(p.id)} className={`option-btn text-xs ${position === p.id ? 'active' : ''}`}>{p.l}</button>)}</div></div>
            <div className="grid grid-cols-3 gap-4">
              <div><label className="block text-sm text-slate-400 mb-1">Start #</label><input type="number" value={startNum} min={0} onChange={e => setStartNum(Number(e.target.value))} className="glass-input" /></div>
              <div><label className="block text-sm text-slate-400 mb-1">Font size</label><input type="number" value={fontSize} min={8} max={36} onChange={e => setFontSize(Number(e.target.value))} className="glass-input" /></div>
              <div><label className="block text-sm text-slate-400 mb-1">Prefix</label><input type="text" value={prefix} onChange={e => setPrefix(e.target.value)} placeholder="Page " className="glass-input" /></div>
            </div>
            <div className="rounded-xl p-3 text-sm text-slate-400" style={{ background: 'rgba(255,255,255,0.03)' }}>Preview: <span className="font-mono text-accent-400">{prefix}{startNum}</span>, <span className="font-mono text-accent-400">{prefix}{startNum + 1}</span>, <span className="font-mono text-accent-400">{prefix}{startNum + 2}</span>...</div>
          </div>
          {done ? (
            <div className="success-card"><div className="text-4xl mb-3">✅</div><p className="font-heading font-semibold text-emerald-300 text-lg mb-3">Page numbers added!</p><button onClick={() => { setFile(null); setDone(false); }} className="btn-glass text-sm">Number another</button></div>
          ) : (
            <div className="flex gap-3"><button onClick={addNumbers} disabled={processing} className="btn-primary flex-1 justify-center">{processing ? 'Adding...' : 'Add Page Numbers'}</button><button onClick={() => setFile(null)} className="btn-glass">Reset</button></div>
          )}
        </div>
      )}
    </ToolLayout>
  );
}
