'use client';
import { useState } from 'react';
import ToolLayout from '../../components/ToolLayout';
import FileUpload from '../../components/FileUpload';

export default function RotatePDF() {
  const [file, setFile] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [rotation, setRotation] = useState(90);
  const [pageMode, setPageMode] = useState('all');
  const [rangeInput, setRangeInput] = useState('');
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);

  const handleFile = async (a) => {
    const f = a[0]; setFile(f); setDone(false);
    const { PDFDocument } = await import('pdf-lib');
    const doc = await PDFDocument.load(await f.arrayBuffer(), { ignoreEncryption: true });
    const n = doc.getPageCount(); setPageCount(n); setRangeInput(`1-${n}`);
  };

  const parseRanges = (input, total) => {
    const pages = new Set();
    input.split(',').forEach(part => {
      part = part.trim();
      if (part.includes('-')) { const [a, b] = part.split('-').map(Number); for (let i = Math.max(1, a); i <= Math.min(total, b); i++) pages.add(i - 1); }
      else { const n = Number(part); if (n >= 1 && n <= total) pages.add(n - 1); }
    });
    return [...pages];
  };

  const rotate = async () => {
    setProcessing(true);
    try {
      const { PDFDocument } = await import('pdf-lib');
      const doc = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
      const indices = pageMode === 'all' ? Array.from({ length: pageCount }, (_, i) => i) : parseRanges(rangeInput, pageCount);
      indices.forEach(i => {
        const page = doc.getPage(i);
        page.setRotation({ type: 'degrees', angle: (page.getRotation().angle + rotation) % 360 });
      });
      const out = await doc.save();
      const url = URL.createObjectURL(new Blob([out], { type: 'application/pdf' }));
      Object.assign(document.createElement('a'), { href: url, download: 'rotated.pdf' }).click();
      URL.revokeObjectURL(url);
      setDone(true);
    } catch (e) { alert('Error: ' + e.message); }
    setProcessing(false);
  };

  return (
    <ToolLayout title="Rotate PDF" icon="🔄" description="Rotate all or specific pages in your PDF document.">
      {!file ? <FileUpload onFiles={handleFile} /> : (
        <div className="space-y-4">
          <div className="glass-card p-4 flex items-center gap-4">
            <div className="text-2xl">📄</div>
            <div><p className="font-semibold text-white">{file.name}</p><p className="text-sm text-slate-400">{pageCount} pages</p></div>
          </div>
          <div className="glass-card p-5 space-y-5">
            <div>
              <h3 className="font-heading font-semibold text-white mb-3">Rotation angle</h3>
              <div className="grid grid-cols-4 gap-3">
                {[{ deg: 90, label: '+90°', sub: 'Clockwise' }, { deg: 180, label: '180°', sub: 'Flip' }, { deg: 270, label: '270°', sub: '270° CW' }, { deg: -90, label: '-90°', sub: 'Counter-CW' }].map(r => (
                  <button key={r.deg} onClick={() => setRotation(r.deg)} className={`option-btn ${rotation === r.deg ? 'active' : ''}`}>
                    <p className="font-bold text-sm">{r.label}</p><p className="text-xs opacity-60">{r.sub}</p>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-heading font-semibold text-white mb-3">Which pages?</h3>
              <div className="flex gap-3 mb-3">
                {[{ id: 'all', label: 'All pages' }, { id: 'range', label: 'Custom range' }].map(m => (
                  <button key={m.id} onClick={() => setPageMode(m.id)} className={`option-btn flex-1 ${pageMode === m.id ? 'active' : ''}`}>{m.label}</button>
                ))}
              </div>
              {pageMode === 'range' && <input type="text" value={rangeInput} onChange={e => setRangeInput(e.target.value)} className="glass-input" placeholder="e.g. 1-3, 5, 7-10" />}
            </div>
          </div>
          {done ? (
            <div className="success-card"><div className="text-4xl mb-3">✅</div><p className="font-heading font-semibold text-emerald-300 text-lg mb-3">PDF rotated!</p><button onClick={() => { setFile(null); setDone(false); }} className="btn-glass text-sm">Rotate another</button></div>
          ) : (
            <div className="flex gap-3">
              <button onClick={rotate} disabled={processing} className="btn-primary flex-1 justify-center">{processing ? 'Rotating...' : 'Rotate PDF'}</button>
              <button onClick={() => setFile(null)} className="btn-glass">Reset</button>
            </div>
          )}
        </div>
      )}
    </ToolLayout>
  );
}
