'use client';
import { useState } from 'react';
import ToolLayout from '../../components/ToolLayout';
import FileUpload from '../../components/FileUpload';

export default function WatermarkPDF() {
  const [file, setFile] = useState(null);
  const [text, setText] = useState('CONFIDENTIAL');
  const [opacity, setOpacity] = useState(0.15);
  const [fontSize, setFontSize] = useState(48);
  const [color, setColor] = useState('#C9A84C');
  const [position, setPosition] = useState('diagonal');
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);

  const hexToRgb = (hex) => ({ r: parseInt(hex.slice(1, 3), 16) / 255, g: parseInt(hex.slice(3, 5), 16) / 255, b: parseInt(hex.slice(5, 7), 16) / 255 });

  const addWatermark = async () => {
    setProcessing(true);
    try {
      const { PDFDocument, rgb, StandardFonts, degrees } = await import('pdf-lib');
      const doc = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
      const font = await doc.embedFont(StandardFonts.HelveticaBold);
      const { r, g, b } = hexToRgb(color);
      for (const page of doc.getPages()) {
        const { width, height } = page.getSize();
        const tw = font.widthOfTextAtSize(text, fontSize);
        let x, y, angle = 0;
        if (position === 'diagonal') { x = (width - tw) / 2; y = (height - fontSize) / 2; angle = 45; }
        else if (position === 'center') { x = (width - tw) / 2; y = (height - fontSize) / 2; }
        else if (position === 'top') { x = (width - tw) / 2; y = height - fontSize - 30; }
        else { x = (width - tw) / 2; y = 30; }
        page.drawText(text, { x, y, size: fontSize, font, color: rgb(r, g, b), opacity, rotate: degrees(angle) });
      }
      const out = await doc.save();
      const url = URL.createObjectURL(new Blob([out], { type: 'application/pdf' }));
      Object.assign(document.createElement('a'), { href: url, download: 'watermarked.pdf' }).click();
      URL.revokeObjectURL(url);
      setDone(true);
    } catch (e) { alert('Error: ' + e.message); }
    setProcessing(false);
  };

  return (
    <ToolLayout title="Watermark PDF" icon="💧" description="Add a custom text watermark to every page of your PDF.">
      {!file ? <FileUpload onFiles={a => setFile(a[0])} /> : (
        <div className="space-y-4">
          <div className="card p-4 flex items-center gap-4"><div className="text-2xl">📄</div><div><p className="font-semibold text-white">{file.name}</p></div></div>
          <div className="card p-5 space-y-4">
            <div><label className="block text-sm text-slate-400 mb-1">Watermark text</label><input type="text" value={text} onChange={e => setText(e.target.value)} className="input" placeholder="e.g. CONFIDENTIAL" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm text-slate-400 mb-1">Font size</label><input type="number" value={fontSize} min={12} max={120} onChange={e => setFontSize(Number(e.target.value))} className="input" /></div>
              <div><label className="block text-sm text-slate-400 mb-1">Color</label><div className="flex items-center gap-3"><input type="color" value={color} onChange={e => setColor(e.target.value)} /><span className="text-sm text-slate-400 font-mono">{color}</span></div></div>
            </div>
            <div><label className="block text-sm text-slate-400 mb-1">Opacity: {Math.round(opacity * 100)}%</label><input type="range" min={0.05} max={0.8} step={0.05} value={opacity} onChange={e => setOpacity(Number(e.target.value))} /></div>
            <div><label className="block text-sm text-slate-400 mb-2">Position</label><div className="grid grid-cols-4 gap-2">{['diagonal', 'center', 'top', 'bottom'].map(p => <button key={p} onClick={() => setPosition(p)} className={`option-btn capitalize ${position === p ? 'active' : ''}`}>{p}</button>)}</div></div>
            <div className="rounded-xl p-6 flex items-center justify-center border border-white/5" style={{ background: 'rgba(255,255,255,0.02)', minHeight: '80px' }}>
              <span className="font-bold select-none" style={{ color, opacity, fontSize: `${Math.min(fontSize * 0.5, 28)}px`, transform: position === 'diagonal' ? 'rotate(-30deg)' : 'none' }}>{text || 'Preview'}</span>
            </div>
          </div>
          {done ? (
            <div className="success-card"><div className="text-4xl mb-3">✅</div><p className="font-display font-semibold text-gold text-lg mb-3">Watermark added!</p><button onClick={() => { setFile(null); setDone(false); }} className="btn-ghost text-sm">Watermark another</button></div>
          ) : (
            <div className="flex gap-3"><button onClick={addWatermark} disabled={processing || !text} className="btn-primary flex-1 justify-center">{processing ? 'Adding...' : 'Add Watermark'}</button><button onClick={() => setFile(null)} className="btn-ghost">Reset</button></div>
          )}
        </div>
      )}
    </ToolLayout>
  );
}
