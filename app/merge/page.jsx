'use client';
import { useState, useRef } from 'react';
import ToolLayout from '../../components/ToolLayout';
import FileUpload from '../../components/FileUpload';

export default function MergePDF() {
  const [files, setFiles]       = useState([]);
  const [processing, setProc]   = useState(false);
  const [done, setDone]         = useState(false);
  const [error, setError]       = useState('');
  const topRef = useRef(null);

  const handleFiles = f => { setFiles(p => [...p, ...f.map(file => ({ file, id:Math.random() }))]); setDone(false); };
  const remove   = id => setFiles(p => p.filter(f => f.id !== id));
  const moveUp   = i  => { if (!i) return; const a=[...files]; [a[i-1],a[i]]=[a[i],a[i-1]]; setFiles(a); };
  const moveDown = i  => { if (i===files.length-1) return; const a=[...files]; [a[i],a[i+1]]=[a[i+1],a[i]]; setFiles(a); };
  const reset    = () => { setFiles([]); setDone(false); setError(''); };

  const merge = async () => {
    topRef.current?.scrollIntoView({ behavior:'smooth', block:'start' });
    setProc(true); setError('');
    try {
      const { PDFDocument } = await import('pdf-lib');
      const merged = await PDFDocument.create();
      for (const { file } of files) {
        const doc   = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption:true });
        const pages = await merged.copyPages(doc, doc.getPageIndices());
        pages.forEach(p => merged.addPage(p));
      }
      const out = await merged.save();
      const url = URL.createObjectURL(new Blob([out], { type:'application/pdf' }));
      const a   = document.createElement('a');
      a.href = url; a.download = 'merged.pdf';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setDone(true);
    } catch(e) { setError(e.message || 'Merge failed — check that all files are valid PDFs'); }
    setProc(false);
  };

  return (
    <ToolLayout title="Merge PDF" description="Combine multiple PDF files into one document. Drag to reorder.">
      <div ref={topRef}/>
      {files.length === 0 ? (
        <FileUpload onFiles={handleFiles} accept={{ 'application/pdf':['.pdf'] }}
          multiple label="Drop PDF files here" sublabel="Add 2 or more PDFs"/>
      ) : (
        <div className="space-y-3">
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="label-gold">Files ({files.length})</p>
              <label className="font-mono text-xs text-gold/60 hover:text-gold cursor-pointer transition-colors flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
                </svg>
                Add more
                <input type="file" accept=".pdf" multiple className="hidden"
                  onChange={e => handleFiles([...e.target.files])}/>
              </label>
            </div>
            <div className="space-y-1.5">
              {files.map(({ file, id }, i) => (
                <div key={id} className="flex items-center gap-2 p-2"
                  style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)' }}>
                  <span className="w-5 h-5 flex items-center justify-center flex-shrink-0 font-mono"
                    style={{ fontSize:'9px', color:'rgba(201,168,76,0.7)', border:'1px solid rgba(201,168,76,0.2)' }}>
                    {i+1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-xs text-white truncate">{file.name}</p>
                    <p className="font-mono text-white/25" style={{ fontSize:'9px' }}>{(file.size/1024).toFixed(1)} KB</p>
                  </div>
                  <div className="flex gap-0.5">
                    <button onClick={() => moveUp(i)} className="p-1 text-white/20 hover:text-white/60 transition-colors">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7"/>
                      </svg>
                    </button>
                    <button onClick={() => moveDown(i)} className="p-1 text-white/20 hover:text-white/60 transition-colors">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                      </svg>
                    </button>
                    <button onClick={() => remove(id)} className="p-1 text-white/20 hover:text-red-400 transition-colors">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {files.length < 2 && (
              <p className="font-mono text-xs text-white/25 mt-2 text-center">Add at least 2 PDFs to merge</p>
            )}
          </div>

          {error && (
            <div className="card p-4 flex gap-3" style={{ borderColor:'rgba(239,68,68,0.2)' }}>
              <div className="w-0.5 self-stretch" style={{ background:'rgba(239,68,68,0.5)' }}/>
              <div>
                <p className="font-mono text-xs text-red-400 mb-0.5">Merge failed</p>
                <p className="font-mono text-xs text-white/30">{error}</p>
              </div>
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
                  <p className="font-display text-lg font-light text-white">Merged & downloaded</p>
                  <p className="font-mono text-xs text-white/30">{files.length} files combined</p>
                </div>
              </div>
              <button onClick={reset} className="btn-ghost w-full justify-center" style={{ fontSize:'11px' }}>Merge more</button>
            </div>
          )}

          {!done && (
            <div className="flex gap-2 pt-1">
              <button onClick={merge} disabled={processing || files.length < 2}
                className="btn-primary flex-1 justify-center" style={{ padding:'0.7rem', fontSize:'12px' }}>
                {processing ? (
                  <><svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>Merging…</>
                ) : <>Merge {files.length} PDFs <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                  </svg></>}
              </button>
              <button onClick={reset} className="btn-ghost" style={{ padding:'0.7rem 1rem', fontSize:'12px' }}>Reset</button>
            </div>
          )}
        </div>
      )}
    </ToolLayout>
  );
}
