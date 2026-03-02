'use client';
import { useState, useRef } from 'react';
import ToolLayout from '../../components/ToolLayout';
import FileUpload from '../../components/FileUpload';

export default function UnlockPDF() {
  const [file, setFile]       = useState(null);
  const [password, setPass]   = useState('');
  const [processing, setProc] = useState(false);
  const [done, setDone]       = useState(false);
  const [error, setError]     = useState('');
  const topRef = useRef(null);

  const reset = () => { setFile(null); setDone(false); setError(''); setPass(''); };

  const unlock = async () => {
    topRef.current?.scrollIntoView({ behavior:'smooth', block:'start' });
    setProc(true); setError('');
    try {
      const { PDFDocument } = await import('pdf-lib');
      let doc;
      try {
        doc = await PDFDocument.load(await file.arrayBuffer(), { password, ignoreEncryption:false });
      } catch(e) {
        if (e.message?.toLowerCase().includes('password') || e.message?.toLowerCase().includes('encrypt')) {
          setError('Incorrect password. Please try again.'); setProc(false); return;
        }
        // Try ignoring encryption (some PDFs have invalid encryption headers)
        doc = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption:true });
      }
      const out = await doc.save();
      const url = URL.createObjectURL(new Blob([out], { type:'application/pdf' }));
      const a   = document.createElement('a');
      a.href = url; a.download = file.name.replace(/\.pdf$/i,'') + '_unlocked.pdf';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setDone(true);
    } catch(e) { setError('Could not unlock: ' + (e.message||'Unknown error')); }
    setProc(false);
  };

  return (
    <ToolLayout title="Unlock PDF" description="Remove password protection from a PDF you own.">
      <div ref={topRef}/>
      {!file ? (
        <FileUpload onFiles={f => { setFile(f[0]); setDone(false); setError(''); }}
          accept={{ 'application/pdf':['.pdf'] }} label="Drop your PDF here"/>
      ) : (
        <div className="space-y-3">
          <div className="card p-3 flex items-center gap-3">
            <div className="w-8 h-8 border border-white/10 flex items-center justify-center flex-shrink-0"
              style={{ background:'rgba(201,168,76,0.05)' }}>
              <span className="font-mono text-xs text-gold">🔒</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-mono text-sm text-white truncate">{file.name}</p>
            </div>
            {!processing && !done && (
              <button onClick={reset} className="p-1 text-white/20 hover:text-white/60 transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            )}
          </div>

          {!processing && !done && (
            <div className="card p-4 space-y-3">
              <div>
                <label className="font-mono text-xs text-white/40 block mb-1">PDF Password</label>
                <input type="password" value={password}
                  onChange={e => { setPass(e.target.value); setError(''); }}
                  onKeyDown={e => e.key==='Enter' && unlock()}
                  className={`input ${error?'border-red-500/50':''}`}
                  placeholder="Enter the PDF password"/>
              </div>
              <div className="p-3" style={{ background:'rgba(59,130,246,0.04)', border:'1px solid rgba(59,130,246,0.15)' }}>
                <p className="font-mono leading-relaxed" style={{ fontSize:'10px', color:'rgba(147,197,253,0.7)' }}>
                  You can only unlock PDFs for which you have the correct password. This tool does not crack passwords.
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="card p-4 flex gap-3" style={{ borderColor:'rgba(239,68,68,0.2)' }}>
              <div className="w-0.5 self-stretch" style={{ background:'rgba(239,68,68,0.5)' }}/>
              <p className="font-mono text-xs text-red-400">{error}</p>
            </div>
          )}

          {done && (
            <div className="success-card anim-scale-in">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 border border-gold/30 flex items-center justify-center">
                  <svg className="w-4 h-4 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7"/>
                  </svg>
                </div>
                <div>
                  <p className="font-display text-lg font-light text-white">PDF unlocked</p>
                  <p className="font-mono text-xs text-white/30">Downloaded without password</p>
                </div>
              </div>
              <button onClick={reset} className="btn-ghost w-full justify-center" style={{ fontSize:'11px' }}>Unlock another</button>
            </div>
          )}

          {!processing && !done && (
            <div className="flex gap-2 pt-1">
              <button onClick={unlock} disabled={!password} className="btn-primary flex-1 justify-center" style={{ padding:'0.7rem', fontSize:'12px' }}>
                Unlock PDF
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                </svg>
              </button>
              <button onClick={reset} className="btn-ghost" style={{ padding:'0.7rem 1rem', fontSize:'12px' }}>Reset</button>
            </div>
          )}
          {processing && <p className="font-mono text-xs text-center text-white/30 py-2">Unlocking…</p>}
        </div>
      )}
    </ToolLayout>
  );
}
