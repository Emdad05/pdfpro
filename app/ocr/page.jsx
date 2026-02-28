'use client';
import { useState } from 'react';
import ToolLayout from '../../components/ToolLayout';
import FileUpload from '../../components/FileUpload';

const languages = [
  { code: 'eng', label: 'English' }, { code: 'fra', label: 'French' }, { code: 'deu', label: 'German' },
  { code: 'spa', label: 'Spanish' }, { code: 'ita', label: 'Italian' }, { code: 'por', label: 'Portuguese' },
  { code: 'chi_sim', label: 'Chinese (Simplified)' }, { code: 'jpn', label: 'Japanese' },
  { code: 'kor', label: 'Korean' }, { code: 'ara', label: 'Arabic' },
];

export default function OCRPage() {
  const [file, setFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [result, setResult] = useState('');
  const [lang, setLang] = useState('eng');

  const runOCR = async () => {
    setProcessing(true); setResult(''); setProgress(0);
    try {
      const pdfjsLib = await import('pdfjs-dist');
      const { setupPdfWorker } = await import('../../lib/pdfWorker');
      await setupPdfWorker(pdfjsLib);
      const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
      const total = pdf.numPages;
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker(lang, 1, { logger: m => { if (m.status === 'recognizing text') setStatusText(`Recognizing...`); else setStatusText(m.status); } });
      let fullText = '';
      for (let i = 1; i <= total; i++) {
        setStatusText(`Rendering page ${i} of ${total}...`);
        const page = await pdf.getPage(i);
        const vp = page.getViewport({ scale: 2 });
        const canvas = document.createElement('canvas');
        canvas.width = vp.width; canvas.height = vp.height;
        await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;
        setStatusText(`OCR on page ${i}/${total}...`);
        const { data: { text } } = await worker.recognize(canvas);
        fullText += `\n--- Page ${i} ---\n${text}\n`;
        setProgress(Math.round(i / total * 100));
      }
      await worker.terminate();
      setResult(fullText.trim());
      setStatusText('');
    } catch (e) { alert('Error: ' + e.message); }
    setProcessing(false);
  };

  const downloadTxt = () => {
    const url = URL.createObjectURL(new Blob([result], { type: 'text/plain' }));
    Object.assign(document.createElement('a'), { href: url, download: 'ocr-result.txt' }).click();
    URL.revokeObjectURL(url);
  };

  return (
    <ToolLayout title="OCR PDF" icon="🔍" description="Extract text from scanned or image-based PDF files using OCR.">
      {!file ? <FileUpload onFiles={a => setFile(a[0])} label="Upload a scanned PDF" sublabel="Best for image-based or scanned PDFs" /> : (
        <div className="space-y-4">
          <div className="card p-4 flex items-center gap-4"><div className="text-2xl">📄</div><div><p className="font-semibold text-white">{file.name}</p><p className="text-sm text-slate-400">{(file.size / 1024).toFixed(1)} KB</p></div></div>
          <div className="card p-5">
            <label className="block text-sm text-slate-400 mb-2">Language</label>
            <select value={lang} onChange={e => setLang(e.target.value)} className="input">
              {languages.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
            </select>
            <p className="text-xs text-slate-500 mt-2">⚠️ OCR runs locally in your browser — may take 1–2 minutes for multi-page PDFs.</p>
          </div>
          {processing && (
            <div className="card p-4">
              <div className="flex justify-between text-sm mb-2"><span className="text-slate-300">{statusText || 'Processing...'}</span><span className="text-gold">{progress}%</span></div>
              <div className="progress-track"><div className="progress-fill" style={{ width: `${Math.max(progress, 5)}%` }} /></div>
            </div>
          )}
          {result && (
            <div className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display font-semibold text-white">Extracted Text</h3>
                <div className="flex gap-2">
                  <button onClick={() => navigator.clipboard.writeText(result)} className="btn-ghost text-xs py-1.5 px-3">Copy</button>
                  <button onClick={downloadTxt} className="btn-primary text-xs py-1.5 px-3">Download .txt</button>
                </div>
              </div>
              <textarea value={result} readOnly className="input font-mono text-xs resize-y" style={{ minHeight: '200px' }} />
              <p className="text-xs text-slate-500 mt-2">{result.split(/\s+/).length} words extracted</p>
            </div>
          )}
          {!processing && (
            <div className="flex gap-3">
              <button onClick={runOCR} disabled={processing} className="btn-primary flex-1 justify-center">Run OCR</button>
              <button onClick={() => { setFile(null); setResult(''); }} className="btn-ghost">Reset</button>
            </div>
          )}
        </div>
      )}
    </ToolLayout>
  );
}
