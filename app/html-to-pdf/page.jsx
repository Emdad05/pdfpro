'use client';
import { useState } from 'react';
import ToolLayout from '../../components/ToolLayout';
import { downloadBlob } from '../../lib/serverConvert';

export default function HTMLtoPDF() {
  const [mode, setMode] = useState('file'); // file | paste
  const [file, setFile] = useState(null);
  const [htmlContent, setHtmlContent] = useState('');
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [serverWarning, setServerWarning] = useState(false);

  const convert = async () => {
    setProcessing(true); setError(''); setDone(false); setServerWarning(false);
    const warnTimer = setTimeout(() => setServerWarning(true), 5000);

    try {
      let uploadFile;
      if (mode === 'file') {
        uploadFile = file;
      } else {
        const blob = new Blob([htmlContent], { type: 'text/html' });
        uploadFile = new File([blob], 'document.html', { type: 'text/html' });
      }

      setStatus('Uploading...');
      const form = new FormData();
      form.append('file', uploadFile);

      const response = await fetch('/api/convert?type=html', {
        method: 'POST',
        body: form,
        signal: AbortSignal.timeout(60000),
      });

      clearTimeout(warnTimer);

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(err.error || 'Conversion failed');
      }

      const blob = await response.blob();
      downloadBlob(blob, 'converted.pdf');
      setDone(true);
    } catch (e) {
      clearTimeout(warnTimer);
      setError(e.message);
    }

    setServerWarning(false);
    setProcessing(false);
    setStatus('');
  };

  const canConvert = mode === 'file' ? !!file : htmlContent.trim().length > 10;

  return (
    <ToolLayout title="HTML to PDF" icon="🌐" description="Convert HTML files or paste HTML code to get a perfectly rendered PDF." isServer>
      <div className="space-y-5">
        {/* Mode switcher */}
        <div className="glass-card p-5">
          <h3 className="font-heading font-semibold text-white mb-3">Input method</h3>
          <div className="flex gap-3">
            {[{id:'file',label:'Upload HTML file'},{id:'paste',label:'Paste HTML code'}].map(m => (
              <button key={m.id} onClick={() => setMode(m.id)} className={`option-btn flex-1 ${mode === m.id ? 'active' : ''}`}>
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Upload or Paste */}
        {mode === 'file' ? (
          !file ? (
            <div className="drop-zone" onClick={() => document.getElementById('html-file').click()}>
              <input id="html-file" type="file" accept=".html,.htm" className="hidden" onChange={e => setFile(e.target.files[0])} />
              <div className="text-4xl mb-3">🌐</div>
              <p className="text-white font-semibold font-heading">Click to upload HTML file</p>
              <p className="text-slate-500 text-sm mt-1">Accepts .html, .htm</p>
            </div>
          ) : (
            <div className="glass-card p-4 flex items-center gap-4">
              <div className="text-2xl">🌐</div>
              <div><p className="font-semibold text-white">{file.name}</p><p className="text-sm text-slate-400">{(file.size/1024).toFixed(1)} KB</p></div>
              <button onClick={() => setFile(null)} className="ml-auto text-slate-500 hover:text-red-400 transition-colors">✕</button>
            </div>
          )
        ) : (
          <div className="glass-card p-5">
            <label className="block text-sm font-medium text-slate-300 mb-2">Paste your HTML code</label>
            <textarea
              value={htmlContent}
              onChange={e => setHtmlContent(e.target.value)}
              className="glass-input font-mono text-xs"
              style={{minHeight:'200px'}}
              placeholder="<!DOCTYPE html><html><body><h1>Hello World</h1></body></html>"
            />
          </div>
        )}

        {serverWarning && (
          <div className="glass-card p-4" style={{borderColor:'rgba(251,146,60,0.2)', background:'rgba(251,146,60,0.05)'}}>
            <p className="text-amber-300 text-sm">⏳ Starting conversion server... (~30 seconds on first use)</p>
          </div>
        )}
        {error && <div className="glass-card p-4" style={{borderColor:'rgba(239,68,68,0.2)'}}><p className="text-red-400 text-sm">❌ {error}</p></div>}

        {done ? (
          <div className="success-card">
            <div className="text-4xl mb-3">✅</div>
            <p className="font-heading font-semibold text-emerald-300 text-lg mb-3">PDF downloaded!</p>
            <button onClick={() => { setFile(null); setHtmlContent(''); setDone(false); }} className="btn-glass text-sm">Convert another</button>
          </div>
        ) : (
          <button onClick={convert} disabled={processing || !canConvert} className="btn-primary w-full justify-center">
            {processing ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>{status || 'Converting...'}</> : 'Convert to PDF'}
          </button>
        )}
      </div>
    </ToolLayout>
  );
}
