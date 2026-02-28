'use client';
import { useState } from 'react';
import ToolLayout from './ToolLayout';
import FileUpload from './FileUpload';
import { convertViaServer, downloadBlob } from '../lib/serverConvert';

export default function ServerConvertPage({ title, icon, description, accept, acceptLabel, convertType, outputExt, outputLabel }) {
  const [file, setFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [serverWarning, setServerWarning] = useState(false);

  const handleFile = (accepted) => { setFile(accepted[0]); setDone(false); setError(''); };

  const convert = async () => {
    setProcessing(true); setError(''); setServerWarning(false);

    // Show server wake-up warning after 5 seconds
    const warnTimer = setTimeout(() => setServerWarning(true), 5000);

    try {
      const blob = await convertViaServer(file, convertType, setStatus);
      clearTimeout(warnTimer);
      const name = file.name.replace(/\.[^.]+$/, '') + '.' + outputExt;
      downloadBlob(blob, name);
      setDone(true);
    } catch (e) {
      clearTimeout(warnTimer);
      setError(e.message || 'Conversion failed. Please try again.');
    }
    setServerWarning(false);
    setProcessing(false);
    setStatus('');
  };

  return (
    <ToolLayout title={title} icon={icon} description={description} isServer>
      {!file ? (
        <FileUpload onFiles={handleFile} accept={accept} label={`Drop your ${acceptLabel} file here`} sublabel={`Accepted: ${acceptLabel}`} />
      ) : (
        <div className="space-y-4">
          <div className="card p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
              style={{background:'rgba(251,146,60,0.1)', border:'1px solid rgba(251,146,60,0.2)'}}>
              {icon}
            </div>
            <div>
              <p className="font-semibold text-white">{file.name}</p>
              <p className="text-sm text-slate-400">{(file.size/1024).toFixed(1)} KB</p>
            </div>
          </div>

          {serverWarning && (
            <div className="card p-4 border-amber-500/20" style={{borderColor:'rgba(251,146,60,0.2)', background:'rgba(251,146,60,0.05)'}}>
              <div className="flex items-start gap-3">
                <span className="text-xl">⏳</span>
                <div>
                  <p className="font-semibold text-amber-300 text-sm">Starting conversion server...</p>
                  <p className="text-amber-400/70 text-xs mt-0.5">The server may have been sleeping. It will wake up in ~30 seconds. Please wait.</p>
                </div>
              </div>
            </div>
          )}

          {processing && (
            <div className="card p-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-300">{status || 'Converting...'}</span>
                <svg className="w-4 h-4 animate-spin text-gold" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{width:'100%'}}/>
              </div>
            </div>
          )}

          {error && (
            <div className="card p-4" style={{borderColor:'rgba(239,68,68,0.2)', background:'rgba(239,68,68,0.05)'}}>
              <p className="text-red-400 text-sm">❌ {error}</p>
            </div>
          )}

          {done ? (
            <div className="success-card">
              <div className="text-4xl mb-3">✅</div>
              <p className="font-display font-semibold text-emerald-300 text-lg mb-1">Converted successfully!</p>
              <p className="text-slate-400 text-sm mb-4">Your {outputLabel} has been downloaded.</p>
              <button onClick={() => { setFile(null); setDone(false); }} className="btn-ghost text-sm">Convert another file</button>
            </div>
          ) : (
            <div className="flex gap-3">
              <button onClick={convert} disabled={processing} className="btn-primary flex-1 justify-center">
                {processing ? 'Converting...' : `Convert to ${outputLabel}`}
              </button>
              <button onClick={() => setFile(null)} className="btn-ghost">Reset</button>
            </div>
          )}
        </div>
      )}
    </ToolLayout>
  );
}
