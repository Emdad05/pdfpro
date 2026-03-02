'use client';
import { useState, useRef } from 'react';
import ToolLayout from '../../components/ToolLayout';
import FileUpload from '../../components/FileUpload';

const LANGUAGES = [
  { code:'eng', label:'English' }, { code:'fra', label:'French' }, { code:'deu', label:'German' },
  { code:'spa', label:'Spanish' }, { code:'ita', label:'Italian' }, { code:'por', label:'Portuguese' },
  { code:'chi_sim', label:'Chinese (Simplified)' }, { code:'jpn', label:'Japanese' },
  { code:'kor', label:'Korean' }, { code:'ara', label:'Arabic' },
];

export default function OCRPage() {
  const [file, setFile]         = useState(null);
  const [processing, setProc]   = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatus] = useState('');
  const [result, setResult]     = useState('');
  const [lang, setLang]         = useState('eng');
  const [error, setError]       = useState('');
  const topRef = useRef(null);

  const reset = () => { setFile(null); setResult(''); setError(''); setProgress(0); };

  const runOCR = async () => {
    topRef.current?.scrollIntoView({ behavior:'smooth', block:'start' });
    setProc(true); setResult(''); setError(''); setProgress(0);
    try {
      const pdfjsLib = await import('pdfjs-dist');
      const { setupPdfWorker } = await import('../../lib/pdfWorker');
      setupPdfWorker(pdfjsLib);

      setStatus('Loading PDF…');
      const pdf   = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
      const total = pdf.numPages;

      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker(lang, 1, {
        logger: m => {
          if (m.status === 'recognizing text') setStatus(`OCR ${Math.round(m.progress*100)}%…`);
          else if (m.status !== 'initialized api') setStatus(m.status);
        },
      });

      let fullText = '';
      for (let i = 1; i <= total; i++) {
        setStatus(`Rendering page ${i} of ${total}…`);
        setProgress(Math.round((i-1)/total*90));
        const page   = await pdf.getPage(i);
        const vp     = page.getViewport({ scale:2 });
        const canvas = document.createElement('canvas');
        canvas.width  = vp.width; canvas.height = vp.height;
        await page.render({ canvasContext:canvas.getContext('2d'), viewport:vp }).promise;
        setStatus(`Recognising page ${i} of ${total}…`);
        const { data: { text } } = await worker.recognize(canvas);
        if (text.trim()) fullText += `\n── Page ${i} ──\n${text.trim()}\n`;
        setProgress(Math.round(i/total*90));
      }
      await worker.terminate();
      setResult(fullText.trim() || '(No text detected — try a different language or a clearer scan)');
      setProgress(100); setStatus('');
    } catch(e) { setError(e.message || 'OCR failed'); }
    setProc(false); setStatus('');
  };

  const download = () => {
    const url = URL.createObjectURL(new Blob([result], { type:'text/plain' }));
    const a   = document.createElement('a');
    a.href = url; a.download = file.name.replace(/\.pdf$/i,'') + '_ocr.txt';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <ToolLayout title="OCR PDF" description="Extract text from scanned or image-based PDFs. Runs locally in your browser via Tesseract.js.">
      <div ref={topRef}/>
      {!file ? (
        <FileUpload onFiles={f => setFile(f[0])} label="Upload a scanned PDF" sublabel="Best for image-based or scanned documents"/>
      ) : (
        <div className="space-y-3">
          <div className="card p-3 flex items-center gap-3">
            <div className="w-8 h-8 border border-white/10 flex items-center justify-center flex-shrink-0"
              style={{ background:'rgba(201,168,76,0.05)' }}>
              <span className="font-mono text-xs text-gold">PDF</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-mono text-sm text-white truncate">{file.name}</p>
              <p className="font-mono text-xs text-white/30">{(file.size/1024).toFixed(1)} KB</p>
            </div>
            {!processing && !result && (
              <button onClick={reset} className="p-1 text-white/20 hover:text-white/60 transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            )}
          </div>

          {!processing && !result && (
            <div className="card p-4">
              <p className="label-gold mb-2">Language</p>
              <select value={lang} onChange={e => setLang(e.target.value)} className="input font-mono text-xs">
                {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
              </select>
              <p className="font-mono mt-2" style={{ fontSize:'10px', color:'rgba(255,255,255,0.2)' }}>
                OCR runs locally — may take 1–3 min for multi-page PDFs. First run downloads the language model (~10 MB).
              </p>
            </div>
          )}

          {processing && (
            <div className="card p-5">
              <div className="flex items-center gap-3 mb-4">
                <svg className="w-4 h-4 animate-spin flex-shrink-0" style={{ color:'var(--gold)' }} fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-15" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-xs text-gold truncate">{statusText || 'Processing…'}</p>
                </div>
                <span className="font-display text-xl font-light" style={{ color:'var(--gold)' }}>{progress}%</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width:`${Math.max(progress,2)}%`, transition:'width 0.3s' }}/>
              </div>
            </div>
          )}

          {error && (
            <div className="card p-4 flex gap-3" style={{ borderColor:'rgba(239,68,68,0.2)' }}>
              <div className="w-0.5 self-stretch" style={{ background:'rgba(239,68,68,0.5)' }}/>
              <div>
                <p className="font-mono text-xs text-red-400 mb-0.5">OCR failed</p>
                <p className="font-mono text-xs text-white/30">{error}</p>
              </div>
            </div>
          )}

          {result && (
            <div className="card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="label-gold">Extracted text</p>
                <div className="flex gap-2">
                  <button onClick={() => navigator.clipboard.writeText(result)}
                    className="btn-ghost" style={{ padding:'0.3rem 0.7rem', fontSize:'10px' }}>Copy</button>
                  <button onClick={download}
                    className="btn-primary" style={{ padding:'0.3rem 0.7rem', fontSize:'10px' }}>Download .txt</button>
                </div>
              </div>
              <textarea value={result} readOnly className="input font-mono resize-y"
                style={{ minHeight:'180px', fontSize:'11px', lineHeight:'1.6' }}/>
              <p className="font-mono text-white/20" style={{ fontSize:'9px' }}>
                {result.split(/\s+/).filter(Boolean).length} words extracted
              </p>
            </div>
          )}

          {!processing && (
            <div className="flex gap-2 pt-1">
              {!result ? (
                <button onClick={runOCR} className="btn-primary flex-1 justify-center" style={{ padding:'0.7rem', fontSize:'12px' }}>
                  Run OCR
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                  </svg>
                </button>
              ) : (
                <button onClick={runOCR} className="btn-ghost flex-1 justify-center" style={{ padding:'0.7rem', fontSize:'12px' }}>Run again</button>
              )}
              <button onClick={reset} className="btn-ghost" style={{ padding:'0.7rem 1rem', fontSize:'12px' }}>Reset</button>
            </div>
          )}
        </div>
      )}
    </ToolLayout>
  );
}
