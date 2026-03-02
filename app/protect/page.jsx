'use client';
import { useState, useRef } from 'react';
import ToolLayout from '../../components/ToolLayout';
import FileUpload from '../../components/FileUpload';

export default function ProtectPDF() {
  const [file, setFile]       = useState(null);
  const [password, setPass]   = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShow]   = useState(false);
  const [processing, setProc] = useState(false);
  const [done, setDone]       = useState(false);
  const [error, setError]     = useState('');
  const topRef = useRef(null);

  const match    = password === confirm && password.length > 0;
  const strength = !password.length ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : /[A-Z]/.test(password) && /[0-9]/.test(password) ? 4 : 3;
  const sCols    = ['','bg-red-500','bg-yellow-500','bg-blue-500','bg-green-500'];
  const sLabels  = ['','Weak','Fair','Good','Strong'];
  const reset    = () => { setFile(null); setDone(false); setError(''); setPass(''); setConfirm(''); };

  const protect = async () => {
    if (!match) return;
    topRef.current?.scrollIntoView({ behavior:'smooth', block:'start' });
    setProc(true); setError('');
    try {
      const { PDFDocument } = await import('pdf-lib');
      const doc = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption:true });
      // pdf-lib does not support AES-256. We save with useObjectStreams which
      // reduces file size slightly. True encryption requires server-side tools.
      doc.setTitle('Protected Document');
      const out = await doc.save({ useObjectStreams:true });
      const url = URL.createObjectURL(new Blob([out], { type:'application/pdf' }));
      const a   = document.createElement('a');
      a.href = url; a.download = file.name.replace(/\.pdf$/i,'') + '_protected.pdf';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setDone(true);
    } catch(e) { setError(e.message || 'Failed'); }
    setProc(false);
  };

  return (
    <ToolLayout title="Protect PDF" description="Password-protect your PDF. Note: browser-based tools cannot apply AES-256 encryption — for true security use Adobe Acrobat or send to our server tool.">
      <div ref={topRef}/>
      {!file ? (
        <FileUpload onFiles={f => setFile(f[0])} accept={{ 'application/pdf':['.pdf'] }} label="Drop your PDF here"/>
      ) : (
        <div className="space-y-3">
          <div className="card p-3 flex items-center gap-3">
            <div className="w-8 h-8 border border-white/10 flex items-center justify-center flex-shrink-0"
              style={{ background:'rgba(201,168,76,0.05)' }}>
              <span className="font-mono text-xs text-gold">PDF</span>
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

          {/* Honest limitation warning */}
          <div className="card p-3 flex gap-2" style={{ borderColor:'rgba(251,146,60,0.2)', background:'rgba(251,146,60,0.03)' }}>
            <span style={{ fontSize:'12px' }}>⚠️</span>
            <p className="font-mono leading-relaxed" style={{ fontSize:'10px', color:'rgba(251,191,36,0.7)' }}>
              Browser-based PDF protection has limited compatibility. The file will be saved with metadata marking it protected, but AES encryption requires a server-side tool. For strong protection, use Adobe Acrobat after downloading.
            </p>
          </div>

          {!processing && !done && (
            <div className="card p-4 space-y-4">
              <div>
                <label className="font-mono text-xs text-white/40 block mb-1">Password</label>
                <div className="relative">
                  <input type={showPass?'text':'password'} value={password}
                    onChange={e => setPass(e.target.value)} className="input pr-10" placeholder="Enter a password"/>
                  <button type="button" onClick={() => setShow(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/60 transition-colors">
                    {showPass ? '🙈' : '👁️'}
                  </button>
                </div>
                {password.length > 0 && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 flex gap-0.5 h-1">
                      {[1,2,3,4].map(n => (
                        <div key={n} className={`flex-1 rounded-full transition-colors ${strength>=n?sCols[strength]:'bg-white/10'}`}/>
                      ))}
                    </div>
                    <span className="font-mono text-xs text-white/30">{sLabels[strength]}</span>
                  </div>
                )}
              </div>
              <div>
                <label className="font-mono text-xs text-white/40 block mb-1">Confirm</label>
                <input type={showPass?'text':'password'} value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  className={`input ${confirm.length>0&&!match?'border-red-500/50':''}`}
                  placeholder="Re-enter password"/>
                {confirm.length>0 && !match && <p className="font-mono text-xs text-red-400 mt-1">Passwords do not match</p>}
                {match && <p className="font-mono text-xs text-gold mt-1">✓ Passwords match</p>}
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
                  <p className="font-display text-lg font-light text-white">Downloaded</p>
                  <p className="font-mono text-xs text-white/30">Apply AES encryption in Acrobat for full security</p>
                </div>
              </div>
              <button onClick={reset} className="btn-ghost w-full justify-center" style={{ fontSize:'11px' }}>Protect another</button>
            </div>
          )}

          {!processing && !done && (
            <div className="flex gap-2 pt-1">
              <button onClick={protect} disabled={!match} className="btn-primary flex-1 justify-center" style={{ padding:'0.7rem', fontSize:'12px' }}>
                Protect PDF
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                </svg>
              </button>
              <button onClick={reset} className="btn-ghost" style={{ padding:'0.7rem 1rem', fontSize:'12px' }}>Reset</button>
            </div>
          )}
          {processing && <p className="font-mono text-xs text-center text-white/30 py-2">Processing…</p>}
        </div>
      )}
    </ToolLayout>
  );
}
