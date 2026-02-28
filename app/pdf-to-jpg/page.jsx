'use client';
import { useState } from 'react';
import ToolLayout from '../../components/ToolLayout';
import FileUpload from '../../components/FileUpload';

export default function PDFtoJPG() {
  const [file, setFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [quality, setQuality] = useState(0.92);
  const [scale, setScale] = useState(2);

  const convert = async () => {
    setProcessing(true); setProgress(0);
    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
      const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
      const total = pdf.numPages;
      const { default: JSZip } = await import('jszip');
      const zip = new JSZip();
      for (let i = 1; i <= total; i++) {
        setProgress(Math.round(i / total * 100));
        const page = await pdf.getPage(i);
        const vp = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        canvas.width = vp.width; canvas.height = vp.height;
        await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;
        zip.file(`page-${i}.jpg`, canvas.toDataURL('image/jpeg', quality).split(',')[1], { base64: true });
      }
      const blob = await zip.generateAsync({ type: 'blob' });
      Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'pdf-pages.zip' }).click();
      setDone(true);
    } catch (e) { alert('Error: ' + e.message); }
    setProcessing(false);
  };

  return (
    <ToolLayout title="PDF to JPG" icon="🖼️" description="Convert each page of your PDF into high-quality JPG images.">
      {!file ? <FileUpload onFiles={a => setFile(a[0])} /> : (
        <div className="space-y-4">
          <div className="card p-4 flex items-center gap-4">
            <div className="text-2xl">📄</div>
            <div><p className="font-semibold text-white">{file.name}</p><p className="text-sm text-slate-400">{(file.size / 1024).toFixed(1)} KB</p></div>
          </div>
          <div className="card p-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div><label className="block text-sm text-slate-400 mb-2">Quality: {Math.round(quality * 100)}%</label><input type="range" min={0.5} max={1} step={0.05} value={quality} onChange={e => setQuality(Number(e.target.value))} /></div>
            <div><label className="block text-sm text-slate-400 mb-2">Resolution scale</label><div className="flex gap-2">{[1, 2, 3].map(s => <button key={s} onClick={() => setScale(s)} className={`option-btn flex-1 ${scale === s ? 'active' : ''}`}>{s}x {s === 1 ? '(SD)' : s === 2 ? '(HD)' : '(4K)'}</button>)}</div></div>
          </div>
          {processing && (
            <div className="card p-4">
              <div className="flex justify-between text-sm mb-2"><span className="text-slate-300">Converting pages...</span><span className="text-gold">{progress}%</span></div>
              <div className="progress-track"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
            </div>
          )}
          {done ? (
            <div className="success-card"><div className="text-4xl mb-3">✅</div><p className="font-display font-semibold text-gold text-lg mb-3">Images downloaded as ZIP!</p><button onClick={() => { setFile(null); setDone(false); }} className="btn-ghost text-sm">Convert another</button></div>
          ) : (
            <div className="flex gap-3"><button onClick={convert} disabled={processing} className="btn-primary flex-1 justify-center">{processing ? 'Converting...' : 'Convert to JPG'}</button><button onClick={() => setFile(null)} className="btn-ghost">Reset</button></div>
          )}
        </div>
      )}
    </ToolLayout>
  );
}
