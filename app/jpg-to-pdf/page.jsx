'use client';
import { useState } from 'react';
import ToolLayout from '../../components/ToolLayout';
import FileUpload from '../../components/FileUpload';

export default function JPGtoPDF() {
  const [files, setFiles] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [pageSize, setPageSize] = useState('A4');
  const [fit, setFit] = useState('contain');
  const sizes = { A4: [595.28, 841.89], Letter: [612, 792], A3: [841.89, 1190.55] };

  const handleFiles = (a) => setFiles(p => [...p, ...a.map(f => ({ file: f, id: Math.random(), preview: URL.createObjectURL(f) }))]);
  const remove = (id) => setFiles(p => p.filter(f => f.id !== id));
  const moveUp = (i) => { if (!i) return; const a = [...files]; [a[i - 1], a[i]] = [a[i], a[i - 1]]; setFiles(a); };
  const moveDown = (i) => { if (i === files.length - 1) return; const a = [...files]; [a[i], a[i + 1]] = [a[i + 1], a[i]]; setFiles(a); };

  const convert = async () => {
    setProcessing(true);
    try {
      const { PDFDocument } = await import('pdf-lib');
      const doc = await PDFDocument.create();
      const [pw, ph] = sizes[pageSize];
      for (const { file } of files) {
        const bytes = await file.arrayBuffer();
        const img = file.type.includes('png') ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);
        const page = doc.addPage([pw, ph]);
        const { width, height } = img;
        let dw = pw, dh = ph, x = 0, y = 0;
        if (fit === 'contain') { const r = Math.min(pw / width, ph / height); dw = width * r; dh = height * r; x = (pw - dw) / 2; y = (ph - dh) / 2; }
        page.drawImage(img, { x, y, width: dw, height: dh });
      }
      const out = await doc.save();
      const url = URL.createObjectURL(new Blob([out], { type: 'application/pdf' }));
      Object.assign(document.createElement('a'), { href: url, download: 'images.pdf' }).click();
      URL.revokeObjectURL(url);
      setDone(true);
    } catch (e) { alert('Error: ' + e.message); }
    setProcessing(false);
  };

  return (
    <ToolLayout title="JPG to PDF" icon="📄" description="Convert one or multiple images into a single PDF file.">
      <div className="space-y-4">
        <FileUpload onFiles={handleFiles} accept={{ 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'], 'image/webp': ['.webp'] }} multiple label="Drop images here" sublabel="JPG, PNG, WebP supported" />
        {files.length > 0 && (
          <>
            <div className="card p-5">
              <h3 className="font-display font-semibold text-white mb-3">Images ({files.length})</h3>
              <div className="space-y-2">
                {files.map(({ file, id, preview }, i) => (
                  <div key={id} className="file-item justify-between">
                    <div className="flex items-center gap-3">
                      <img src={preview} alt="" className="w-10 h-10 rounded-lg object-cover border border-white/10" />
                      <div><p className="text-sm font-medium text-slate-200 truncate max-w-[160px]">{file.name}</p><p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p></div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => moveUp(i)} className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg></button>
                      <button onClick={() => moveDown(i)} className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg></button>
                      <button onClick={() => remove(id)} className="p-1.5 hover:bg-red-500/20 rounded-lg text-slate-500 hover:text-red-400"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="card p-5 grid grid-cols-2 gap-5">
              <div><label className="block text-sm text-slate-400 mb-2">Page size</label><div className="flex gap-2">{['A4', 'Letter', 'A3'].map(s => <button key={s} onClick={() => setPageSize(s)} className={`option-btn flex-1 ${pageSize === s ? 'active' : ''}`}>{s}</button>)}</div></div>
              <div><label className="block text-sm text-slate-400 mb-2">Image fit</label><div className="flex gap-2">{[{ id: 'contain', label: 'Contain' }, { id: 'fill', label: 'Fill' }].map(f => <button key={f.id} onClick={() => setFit(f.id)} className={`option-btn flex-1 ${fit === f.id ? 'active' : ''}`}>{f.label}</button>)}</div></div>
            </div>
            {done ? (
              <div className="success-card"><div className="text-4xl mb-3">✅</div><p className="font-display font-semibold text-gold text-lg mb-3">PDF created!</p><button onClick={() => { setFiles([]); setDone(false); }} className="btn-ghost text-sm">Convert more</button></div>
            ) : (
              <div className="flex gap-3"><button onClick={convert} disabled={processing} className="btn-primary flex-1 justify-center">{processing ? 'Creating PDF...' : 'Convert to PDF'}</button><button onClick={() => setFiles([])} className="btn-ghost">Reset</button></div>
            )}
          </>
        )}
      </div>
    </ToolLayout>
  );
}
