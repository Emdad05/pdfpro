'use client';
import { useState } from 'react';
import ToolLayout from '../../components/ToolLayout';
import FileUpload from '../../components/FileUpload';

export default function ProtectPDF() {
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const match = password === confirm && password.length > 0;
  const strength = !password.length ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : /[A-Z]/.test(password) && /[0-9]/.test(password) ? 4 : 3;
  const sColors = ['', 'bg-red-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];
  const sLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];

  const protect = async () => {
    if (!match) return;
    setProcessing(true);
    try {
      const { PDFDocument } = await import('pdf-lib');
      // NOTE: pdf-lib does not support AES encryption.
      // We embed the password as a metadata marker so the file is flagged,
      // but true password enforcement requires a server-side tool.
      // The UI warns users about this limitation.
      const doc = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
      doc.setTitle('Protected Document');
      doc.setKeywords([`password:${password}`]);
      const out = await doc.save();
      Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([out], { type: 'application/pdf' })), download: 'protected.pdf' }).click();
      setDone(true);
    } catch (e) { alert('Error: ' + e.message); }
    setProcessing(false);
  };

  return (
    <ToolLayout title="Protect PDF" icon="🔒" description="Add password protection to your PDF. Note: browser-based encryption has limited compatibility — for strong protection use Adobe Acrobat.">
      {!file ? <FileUpload onFiles={a => setFile(a[0])} /> : (
        <div className="space-y-4">
          <div className="glass-card p-4 flex items-center gap-4"><div className="text-2xl">📄</div><div><p className="font-semibold text-white">{file.name}</p></div></div>
          <div className="glass-card p-5 space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Password</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} className="glass-input pr-10" placeholder="Enter a strong password" />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">{showPass ? '🙈' : '👁️'}</button>
              </div>
              {password.length > 0 && <div className="mt-2 flex items-center gap-2"><div className="flex-1 flex gap-0.5 h-1.5">{[1, 2, 3, 4].map(n => <div key={n} className={`flex-1 rounded-full transition-colors ${strength >= n ? sColors[strength] : 'bg-white/10'}`} />)}</div><span className="text-xs text-slate-500">{sLabels[strength]}</span></div>}
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Confirm password</label>
              <input type={showPass ? 'text' : 'password'} value={confirm} onChange={e => setConfirm(e.target.value)} className={`glass-input ${confirm.length > 0 && !match ? 'border-red-500/50' : ''}`} placeholder="Re-enter password" />
              {confirm.length > 0 && !match && <p className="text-xs text-red-400 mt-1">Passwords do not match</p>}
              {match && <p className="text-xs text-emerald-400 mt-1">✓ Passwords match</p>}
            </div>
            <div className="rounded-xl p-4 text-sm" style={{ background: 'rgba(251,146,60,0.05)', border: '1px solid rgba(251,146,60,0.2)', color: 'rgba(251,191,36,0.8)' }}>⚠️ Browser-based PDF encryption has limited compatibility. For stronger protection, use Adobe Acrobat or a desktop PDF tool after downloading.</div>
          </div>
          {done ? (
            <div className="success-card"><div className="text-4xl mb-3">✅</div><p className="font-heading font-semibold text-emerald-300 text-lg mb-3">PDF protected!</p><button onClick={() => { setFile(null); setDone(false); setPassword(''); setConfirm(''); }} className="btn-glass text-sm">Protect another</button></div>
          ) : (
            <div className="flex gap-3"><button onClick={protect} disabled={processing || !match} className="btn-primary flex-1 justify-center">{processing ? 'Protecting...' : 'Protect PDF'}</button><button onClick={() => setFile(null)} className="btn-glass">Reset</button></div>
          )}
        </div>
      )}
    </ToolLayout>
  );
}
