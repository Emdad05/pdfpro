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

  const reset = () => { setFile(null); setDone(false); setError(''); setStatus(''); };

  const convert = async () => {
    setProcessing(true); setError(''); setServerWarning(false);
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
        <FileUpload onFiles={handleFile} accept={accept}
          label={`Drop your ${acceptLabel} here`}
          sublabel={`Accepted: ${acceptLabel} — click to browse`} />
      ) : (
        <div className="space-y-3">

          {/* File info */}
          <div className="card p-4 flex items-center gap-4">
            <div className="w-10 h-10 border border-white/10 flex items-center justify-center flex-shrink-0 font-mono text-xs text-white/30 uppercase">
              {file.name.split('.').pop()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-mono text-sm text-white truncate">{file.name}</p>
              <p className="font-mono text-xs text-white/30 mt-0.5">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
            {!processing && !done && (
              <button onClick={reset} className="text-white/20 hover:text-white/60 transition-colors p-1" title="Remove file">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            )}
          </div>

          {/* Server wake-up warning */}
          {serverWarning && (
            <div className="card p-4" style={{borderColor:'rgba(201,168,76,0.2)', background:'rgba(201,168,76,0.03)'}}>
              <div className="flex items-start gap-3">
                <div className="w-1 h-full self-stretch bg-gold-400/40 flex-shrink-0 mt-1" style={{width:'2px', minHeight:'20px'}} />
                <div>
                  <p className="font-mono text-xs text-gold mb-1">Starting conversion server</p>
                  <p className="font-mono text-xs text-white/30">Server wakes from sleep in ~30 seconds. Please wait.</p>
                </div>
              </div>
            </div>
          )}

          {/* Progress */}
          {processing && (
            <div className="card p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-xs text-white/40">{status || 'Converting...'}</span>
                <div className="flex gap-1">
                  {[0,1,2].map(i => (
                    <div key={i} className="w-1 h-1 rounded-full bg-gold-400/60"
                      style={{animation:`pulse 1s ${i*0.2}s ease-in-out infinite`}} />
                  ))}
                </div>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{width:'100%'}} />
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="card p-4" style={{borderColor:'rgba(239,68,68,0.2)', background:'rgba(239,68,68,0.03)'}}>
              <div className="flex gap-3">
                <div style={{width:'2px', minHeight:'20px', background:'rgba(239,68,68,0.5)', flexShrink:0}} />
                <div>
                  <p className="font-mono text-xs text-red-400 mb-1">Conversion failed</p>
                  <p className="font-mono text-xs text-white/30">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Success */}
          {done ? (
            <div className="success-card">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 border border-gold-400/40 flex items-center justify-center">
                  <svg className="w-4 h-4 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7"/>
                  </svg>
                </div>
                <div>
                  <p className="font-display text-lg font-light text-white">Conversion complete</p>
                  <p className="font-mono text-xs text-white/30">Your {outputLabel} has been downloaded</p>
                </div>
              </div>
              <button onClick={reset} className="btn-ghost w-full justify-center">
                Convert another file
              </button>
            </div>
          ) : (
            /* Action buttons */
            <div className="flex gap-3 pt-1">
              <button
                onClick={convert}
                disabled={processing}
                className="btn-primary flex-1 justify-center"
              >
                {processing ? (
                  <>
                    <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Converting
                  </>
                ) : (
                  <>
                    Convert to {outputLabel}
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                    </svg>
                  </>
                )}
              </button>
              <button
                onClick={reset}
                disabled={processing}
                className="btn-ghost"
                title="Reset"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                </svg>
                Reset
              </button>
            </div>
          )}
        </div>
      )}
    </ToolLayout>
  );
}
