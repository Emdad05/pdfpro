'use client';
import { useState } from 'react';
import ToolLayout from '../../components/ToolLayout';
import FileUpload from '../../components/FileUpload';

export default function MergePDF() {
  const [files, setFiles] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);

  const handleFiles = (accepted) => {
    setFiles(prev => [...prev, ...accepted.map(f => ({ file: f, id: Math.random() }))]);
    setDone(false);
  };
  const remove  = (id) => setFiles(p => p.filter(f => f.id !== id));
  const moveUp  = (i) => { if (!i) return; const a=[...files]; [a[i-1],a[i]]=[a[i],a[i-1]]; setFiles(a); };
  const moveDown= (i) => { if (i===files.length-1) return; const a=[...files]; [a[i],a[i+1]]=[a[i+1],a[i]]; setFiles(a); };

  const merge = async () => {
    setProcessing(true);
    try {
      const { PDFDocument } = await import('pdf-lib');
      const merged = await PDFDocument.create();
      for (const { file } of files) {
        const doc = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
        const pages = await merged.copyPages(doc, doc.getPageIndices());
        pages.forEach(p => merged.addPage(p));
      }
      const out = await merged.save();
      const url = URL.createObjectURL(new Blob([out], { type: 'application/pdf' }));
      Object.assign(document.createElement('a'), { href: url, download: 'merged.pdf' }).click();
      URL.revokeObjectURL(url);
      setDone(true);
    } catch(e) { alert('Error: ' + e.message); }
    setProcessing(false);
  };

  return (
    <ToolLayout title="Merge PDF" icon="🔗" description="Combine multiple PDF files into one document. Reorder before merging.">
      {files.length === 0 ? (
        <FileUpload onFiles={handleFiles} multiple label="Drop your PDF files here" sublabel="Add 2 or more PDFs to merge" />
      ) : (
        <div className="space-y-4">
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-semibold text-white">Files ({files.length})</h3>
              <label className="text-sm text-accent-400 hover:text-accent-300 cursor-pointer transition-colors font-medium flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
                Add more
                <input type="file" accept=".pdf" multiple className="hidden" onChange={e => handleFiles([...e.target.files])} />
              </label>
            </div>
            <div className="space-y-2">
              {files.map(({ file, id }, i) => (
                <div key={id} className="file-item justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 font-heading"
                      style={{background:'rgba(0,216,214,0.15)', color:'#00d8d6'}}>{i+1}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-200 truncate">{file.name}</p>
                      <p className="text-xs text-slate-500">{(file.size/1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => moveUp(i)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7"/></svg>
                    </button>
                    <button onClick={() => moveDown(i)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
                    </button>
                    <button onClick={() => remove(id)} className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors text-slate-500 hover:text-red-400">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {done ? (
            <div className="success-card">
              <div className="text-4xl mb-3">✅</div>
              <p className="font-heading font-semibold text-emerald-300 text-lg mb-3">Merged successfully!</p>
              <button onClick={() => { setFiles([]); setDone(false); }} className="btn-glass text-sm">Merge more files</button>
            </div>
          ) : (
            <div className="flex gap-3">
              <button onClick={merge} disabled={processing || files.length < 2} className="btn-primary flex-1 justify-center">
                {processing ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Merging...</> : `Merge ${files.length} PDFs`}
              </button>
              <button onClick={() => setFiles([])} className="btn-glass">Reset</button>
            </div>
          )}
          {files.length < 2 && <p className="text-center text-sm text-amber-400/80">Add at least 2 files to merge</p>}
        </div>
      )}
    </ToolLayout>
  );
}
