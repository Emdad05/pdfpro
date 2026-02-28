'use client';
import { useState } from 'react';
import ToolLayout from '../../components/ToolLayout';
import FileUpload from '../../components/FileUpload';

export default function UnlockPDF() {
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState('');
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const unlock = async () => {
    setProcessing(true); setError('');
    try {
      const { PDFDocument } = await import('pdf-lib');
      let doc;
      try {
        doc = await PDFDocument.load(await file.arrayBuffer(), { password, ignoreEncryption: false });
      } catch (e) {
        if (e.message?.toLowerCase().includes('password') || e.message?.toLowerCase().includes('encrypt')) {
          setError('Incorrect password. Please try again.'); setProcessing(false); return;
        }
        doc = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
      }
      const out = await doc.save();
      Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([out], { type: 'application/pdf' })), download: 'unlocked.pdf' }).click();
      setDone(true);
    } catch (e) { setError('Could not unlock: ' + e.message); }
    setProcessing(false);
  };

  return (
    <ToolLayout title="Unlock PDF" icon="🔓" description="Remove password protection from a PDF file.">
      {!file ? <FileUpload onFiles={a => { setFile(a[0]); setDone(false); setError(''); }} /> : (
        <div className="space-y-4">
          <div className="card p-4 flex items-center gap-4"><div className="text-2xl">🔒</div><div><p className="font-semibold text-white">{file.name}</p></div></div>
          <div className="card p-5 space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">PDF Password</label>
              <input type="password" value={password} onChange={e => { setPassword(e.target.value); setError(''); }} className={`input ${error ? 'border-red-500/50' : ''}`} placeholder="Enter PDF password" onKeyDown={e => e.key === 'Enter' && unlock()} />
              {error && <p className="text-xs text-red-400 mt-1">❌ {error}</p>}
            </div>
            <div className="rounded-xl p-4 text-sm" style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.2)', color: 'rgba(147,197,253,0.8)' }}>ℹ️ You can only unlock PDFs for which you already have the correct password.</div>
          </div>
          {done ? (
            <div className="success-card"><div className="text-4xl mb-3">✅</div><p className="font-display font-semibold text-gold text-lg mb-3">PDF unlocked!</p><button onClick={() => { setFile(null); setDone(false); setPassword(''); }} className="btn-ghost text-sm">Unlock another</button></div>
          ) : (
            <div className="flex gap-3"><button onClick={unlock} disabled={processing || !password} className="btn-primary flex-1 justify-center">{processing ? 'Unlocking...' : 'Unlock PDF'}</button><button onClick={() => setFile(null)} className="btn-ghost">Reset</button></div>
          )}
        </div>
      )}
    </ToolLayout>
  );
}
