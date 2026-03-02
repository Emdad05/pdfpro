'use client';
import { useState, useRef } from 'react';
import ToolLayout from '../../components/ToolLayout';
import FileUpload from '../../components/FileUpload';

function parseRanges(input, total) {
  const pages = new Set();
  input.split(',').forEach(part => {
    part = part.trim();
    if (part.includes('-')) { const [a,b]=part.split('-').map(Number); for(let i=Math.max(1,a);i<=Math.min(total,b);i++) pages.add(i); }
    else { const n=Number(part); if(n>=1&&n<=total) pages.add(n); }
  });
  return [...pages].sort((a,b)=>a-b);
}

function triggerDownload(blob, name) {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export default function SplitPDF() {
  const [file, setFile]             = useState(null);
  const [pageCount, setPageCount]   = useState(0);
  const [mode, setMode]             = useState('range');
  const [rangeInput, setRangeInput] = useState('');
  const [everyN, setEveryN]         = useState(1);
  const [processing, setProc]       = useState(false);
  const [done, setDone]             = useState(false);
  const [error, setError]           = useState('');
  const topRef = useRef(null);

  const handleFile = async f => {
    const file = f[0]; setFile(file); setDone(false); setError('');
    const { PDFDocument } = await import('pdf-lib');
    const doc = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption:true });
    const n   = doc.getPageCount(); setPageCount(n); setRangeInput(`1-${n}`);
  };

  const reset = () => { setFile(null); setDone(false); setError(''); };

  const split = async () => {
    topRef.current?.scrollIntoView({ behavior:'smooth', block:'start' });
    setProc(true); setError('');
    const stem = file.name.replace(/\.pdf$/i,'');
    try {
      const { PDFDocument } = await import('pdf-lib');
      const source = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption:true });

      if (mode === 'range') {
        const pages = parseRanges(rangeInput, pageCount);
        if (!pages.length) throw new Error('No valid pages in range');
        const out    = await PDFDocument.create();
        const copied = await out.copyPages(source, pages.map(p=>p-1));
        copied.forEach(p => out.addPage(p));
        triggerDownload(new Blob([await out.save()], { type:'application/pdf' }), `${stem}_pages.pdf`);

      } else if (mode === 'every') {
        const { default: JSZip } = await import('jszip');
        const zip = new JSZip(); const n = Math.max(1,parseInt(everyN)); let part = 1;
        for (let i = 0; i < pageCount; i += n) {
          const out    = await PDFDocument.create();
          const chunk  = Array.from({ length:Math.min(n, pageCount-i) }, (_,j) => i+j);
          const copied = await out.copyPages(source, chunk);
          copied.forEach(p => out.addPage(p));
          zip.file(`${stem}_part${part++}.pdf`, await out.save());
        }
        triggerDownload(await zip.generateAsync({ type:'blob' }), `${stem}_parts.zip`);

      } else { // every page
        const { default: JSZip } = await import('jszip');
        const zip = new JSZip();
        for (let i = 0; i < pageCount; i++) {
          const out    = await PDFDocument.create();
          const [p]    = await out.copyPages(source, [i]);
          out.addPage(p);
          zip.file(`${stem}_page${i+1}.pdf`, await out.save());
        }
        triggerDownload(await zip.generateAsync({ type:'blob' }), `${stem}_pages.zip`);
      }
      setDone(true);
    } catch(e) { setError(e.message || 'Split failed'); }
    setProc(false);
  };

  return (
    <ToolLayout title="Split PDF" description="Extract a page range, split into equal parts, or separate every page.">
      <div ref={topRef}/>
      {!file ? (
        <FileUpload onFiles={handleFile} accept={{ 'application/pdf':['.pdf'] }} label="Drop your PDF here"/>
      ) : (
        <div className="space-y-3">
          <div className="card p-3 flex items-center gap-3">
            <div className="w-8 h-8 border border-white/10 flex items-center justify-center flex-shrink-0"
              style={{ background:'rgba(201,168,76,0.05)' }}>
              <span className="font-mono text-xs text-gold">PDF</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-mono text-sm text-white truncate">{file.name}</p>
              <p className="font-mono text-xs text-white/30">{pageCount} pages</p>
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
            <div className="card p-4 space-y-4">
              <div>
                <p className="label-gold mb-3">Split mode</p>
                <div className="grid grid-cols-3 gap-2">
                  {[{id:'range',label:'Extract range',desc:'Pages → 1 PDF'},
                    {id:'every',label:'Every N pages',desc:'Equal chunks → ZIP'},
                    {id:'extract',label:'Every page',desc:'1 PDF per page'}].map(m => (
                    <button key={m.id} onClick={() => setMode(m.id)}
                      className={`option-btn text-left ${mode===m.id?'active':''}`} style={{ padding:'0.6rem' }}>
                      <p className="font-mono text-xs font-medium mb-0.5"
                        style={{ color:mode===m.id?'var(--gold)':'rgba(255,255,255,0.55)' }}>{m.label}</p>
                      <p className="font-mono" style={{ fontSize:'9px', color:'rgba(255,255,255,0.25)' }}>{m.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
              {mode==='range' && (
                <div>
                  <label className="font-mono text-xs text-white/40 block mb-1">Pages (e.g. 1-3, 5, 7-10)</label>
                  <input type="text" value={rangeInput} onChange={e => setRangeInput(e.target.value)}
                    className="input font-mono text-xs" placeholder={`1-${pageCount}`}/>
                  <p className="font-mono text-xs text-white/20 mt-1">Total: {pageCount} pages</p>
                </div>
              )}
              {mode==='every' && (
                <div>
                  <label className="font-mono text-xs text-white/40 block mb-1">Pages per part</label>
                  <input type="number" value={everyN} min={1} max={pageCount}
                    onChange={e => setEveryN(Math.max(1,parseInt(e.target.value)||1))}
                    className="input font-mono text-xs w-28"/>
                  <p className="font-mono text-xs text-white/20 mt-1">
                    ~{Math.ceil(pageCount/Math.max(1,everyN))} parts
                  </p>
                </div>
              )}
              {mode==='extract' && (
                <p className="font-mono text-xs text-white/30 p-3"
                  style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)' }}>
                  {pageCount} pages → {pageCount} individual PDFs bundled as a ZIP
                </p>
              )}
            </div>
          )}

          {error && (
            <div className="card p-4 flex gap-3" style={{ borderColor:'rgba(239,68,68,0.2)' }}>
              <div className="w-0.5 self-stretch" style={{ background:'rgba(239,68,68,0.5)' }}/>
              <div>
                <p className="font-mono text-xs text-red-400 mb-0.5">Split failed</p>
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
                  <p className="font-display text-lg font-light text-white">Split & downloaded</p>
                  <p className="font-mono text-xs text-white/30">Check your downloads folder</p>
                </div>
              </div>
              <button onClick={reset} className="btn-ghost w-full justify-center" style={{ fontSize:'11px' }}>Split another</button>
            </div>
          )}

          {!processing && !done && (
            <div className="flex gap-2 pt-1">
              <button onClick={split} className="btn-primary flex-1 justify-center" style={{ padding:'0.7rem', fontSize:'12px' }}>
                Split PDF
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                </svg>
              </button>
              <button onClick={reset} className="btn-ghost" style={{ padding:'0.7rem 1rem', fontSize:'12px' }}>Reset</button>
            </div>
          )}
          {processing && <p className="font-mono text-xs text-center text-white/30 py-2">Splitting…</p>}
        </div>
      )}
    </ToolLayout>
  );
}
