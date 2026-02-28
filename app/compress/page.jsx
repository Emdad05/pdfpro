'use client';
import { useState } from 'react';
import ToolLayout from '../../components/ToolLayout';
import FileUpload from '../../components/FileUpload';

export default function CompressPDF() {
  const [file, setFile] = useState(null);
  const [quality, setQuality] = useState('medium');
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);

  const handleFile = (a) => { setFile(a[0]); setResult(null); };

  const compress = async () => {
    setProcessing(true);
    try {
      const { PDFDocument } = await import('pdf-lib');
      const doc = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
      const out = await doc.save({ useObjectStreams: true });
      setResult({ out, orig: file.size/1024, comp: out.byteLength/1024, pct: ((file.size-out.byteLength)/file.size*100).toFixed(1) });
    } catch(e) { alert('Error: '+e.message); }
    setProcessing(false);
  };

  const download = () => {
    const url = URL.createObjectURL(new Blob([result.out],{type:'application/pdf'}));
    Object.assign(document.createElement('a'),{href:url,download:'compressed.pdf'}).click();
    URL.revokeObjectURL(url);
  };

  return (
    <ToolLayout title="Compress PDF" icon="🗜️" description="Reduce your PDF file size while preserving quality.">
      {!file ? <FileUpload onFiles={handleFile} /> : (
        <div className="space-y-4">
          <div className="glass-card p-4 flex items-center gap-4">
            <div className="text-2xl">📄</div>
            <div><p className="font-semibold text-white">{file.name}</p><p className="text-sm text-slate-400">{(file.size/1024).toFixed(1)} KB</p></div>
          </div>
          <div className="glass-card p-5">
            <h3 className="font-heading font-semibold text-white mb-4">Compression level</h3>
            <div className="grid grid-cols-3 gap-3">
              {[{id:'low',label:'Low',desc:'Smaller size'},{id:'medium',label:'Medium',desc:'Balanced'},{id:'high',label:'High',desc:'Better quality'}].map(q=>(
                <button key={q.id} onClick={()=>setQuality(q.id)} className={'option-btn '+(quality===q.id?'active':'')}>
                  <p className="font-semibold text-sm">{q.label}</p>
                  <p className="text-xs opacity-60 mt-0.5">{q.desc}</p>
                </button>
              ))}
            </div>
          </div>
          {result ? (
            <div className="success-card">
              <div className="text-4xl mb-3">✅</div>
              <p className="font-heading font-bold text-emerald-300 text-xl mb-5">Compression complete!</p>
              <div className="grid grid-cols-3 gap-4 mb-5">
                <div className="bg-white/5 rounded-xl p-3 text-center"><p className="text-xs text-slate-500 mb-1">Original</p><p className="font-bold text-white">{result.orig.toFixed(1)} KB</p></div>
                <div className="rounded-xl p-3 text-center" style={{background:'rgba(0,216,214,0.1)',border:'1px solid rgba(0,216,214,0.2)'}}><p className="text-xs text-accent-400 mb-1">Saved</p><p className="font-bold text-accent-300">{result.pct}%</p></div>
                <div className="bg-white/5 rounded-xl p-3 text-center"><p className="text-xs text-slate-500 mb-1">Compressed</p><p className="font-bold text-white">{result.comp.toFixed(1)} KB</p></div>
              </div>
              <div className="flex gap-3 justify-center">
                <button onClick={download} className="btn-primary">Download PDF</button>
                <button onClick={()=>{setFile(null);setResult(null);}} className="btn-glass">Reset</button>
              </div>
            </div>
          ) : (
            <div className="flex gap-3">
              <button onClick={compress} disabled={processing} className="btn-primary flex-1 justify-center">{processing?'Compressing...':'Compress PDF'}</button>
              <button onClick={()=>setFile(null)} className="btn-glass">Reset</button>
            </div>
          )}
        </div>
      )}
    </ToolLayout>
  );
}
