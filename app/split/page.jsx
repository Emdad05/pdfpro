'use client';
import { useState } from 'react';
import ToolLayout from '../../components/ToolLayout';
import FileUpload from '../../components/FileUpload';

export default function SplitPDF() {
  const [file, setFile] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [mode, setMode] = useState('range');
  const [rangeInput, setRangeInput] = useState('');
  const [everyN, setEveryN] = useState(1);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);

  const handleFile = async (accepted) => {
    const f = accepted[0]; setFile(f); setDone(false);
    const { PDFDocument } = await import('pdf-lib');
    const doc = await PDFDocument.load(await f.arrayBuffer(), { ignoreEncryption: true });
    const n = doc.getPageCount();
    setPageCount(n); setRangeInput(`1-${n}`);
  };

  const parseRanges = (input, total) => {
    const pages = new Set();
    input.split(',').forEach(part => {
      part = part.trim();
      if (part.includes('-')) { const [a,b]=part.split('-').map(Number); for(let i=Math.max(1,a);i<=Math.min(total,b);i++) pages.add(i); }
      else { const n=Number(part); if(n>=1&&n<=total) pages.add(n); }
    });
    return [...pages].sort((a,b)=>a-b);
  };

  const download = (bytes, name) => {
    const url = URL.createObjectURL(new Blob([bytes],{type:'application/pdf'}));
    Object.assign(document.createElement('a'),{href:url,download:name}).click();
    URL.revokeObjectURL(url);
  };

  const split = async () => {
    setProcessing(true);
    try {
      const { PDFDocument } = await import('pdf-lib');
      const source = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });

      if (mode === 'range') {
        const pages = parseRanges(rangeInput, pageCount);
        if (!pages.length) throw new Error('No valid pages');
        const out = await PDFDocument.create();
        const copied = await out.copyPages(source, pages.map(p=>p-1));
        copied.forEach(p => out.addPage(p));
        download(await out.save(), 'extracted-pages.pdf');
      } else if (mode === 'every') {
        const { default: JSZip } = await import('jszip');
        const zip = new JSZip(); const n = parseInt(everyN); let part = 1;
        for (let i=0;i<pageCount;i+=n) {
          const out = await PDFDocument.create();
          const chunk = Array.from({length:Math.min(n,pageCount-i)},(_,j)=>i+j);
          const copied = await out.copyPages(source, chunk);
          copied.forEach(p=>out.addPage(p));
          zip.file(`part-${part++}.pdf`, await out.save());
        }
        const blob = await zip.generateAsync({type:'blob'});
        Object.assign(document.createElement('a'),{href:URL.createObjectURL(blob),download:'split-parts.zip'}).click();
      } else {
        const { default: JSZip } = await import('jszip');
        const zip = new JSZip();
        for (let i=0;i<pageCount;i++) {
          const out = await PDFDocument.create();
          const [p] = await out.copyPages(source,[i]); out.addPage(p);
          zip.file(`page-${i+1}.pdf`, await out.save());
        }
        const blob = await zip.generateAsync({type:'blob'});
        Object.assign(document.createElement('a'),{href:URL.createObjectURL(blob),download:'split-pages.zip'}).click();
      }
      setDone(true);
    } catch(e) { alert('Error: '+e.message); }
    setProcessing(false);
  };

  return (
    <ToolLayout title="Split PDF" icon="✂️" description="Extract pages or split your PDF into multiple documents.">
      {!file ? <FileUpload onFiles={handleFile} /> : (
        <div className="space-y-4">
          <div className="card p-4 flex items-center gap-4">
            <div className="text-2xl">📄</div>
            <div><p className="font-semibold text-white">{file.name}</p><p className="text-sm text-slate-400">{pageCount} pages · {(file.size/1024).toFixed(1)} KB</p></div>
          </div>
          <div className="card p-5">
            <h3 className="font-display font-semibold text-white mb-4">Split mode</h3>
            <div className="grid grid-cols-3 gap-3 mb-5">
              {[{id:'range',label:'Extract Range',desc:'Specific pages → 1 PDF'},{id:'every',label:'Split Every N',desc:'Equal chunks → ZIP'},{id:'extract',label:'Every Page',desc:'One PDF per page'}].map(m=>(
                <button key={m.id} onClick={()=>setMode(m.id)} className={`option-btn text-left ${mode===m.id?'active':''}`}>
                  <p className="font-semibold text-sm">{m.label}</p>
                  <p className="text-xs opacity-60 mt-0.5">{m.desc}</p>
                </button>
              ))}
            </div>
            {mode==='range' && (
              <div>
                <label className="block text-sm text-slate-400 mb-1">Pages (e.g. 1-3, 5, 7-10)</label>
                <input type="text" value={rangeInput} onChange={e=>setRangeInput(e.target.value)} className="input" placeholder={`1-${pageCount}`} />
                <p className="text-xs text-slate-500 mt-1">Total: {pageCount} pages</p>
              </div>
            )}
            {mode==='every' && (
              <div>
                <label className="block text-sm text-slate-400 mb-1">Pages per part</label>
                <input type="number" value={everyN} min={1} max={pageCount} onChange={e=>setEveryN(e.target.value)} className="input w-32" />
                <p className="text-xs text-slate-500 mt-1">Creates ~{Math.ceil(pageCount/everyN)} parts</p>
              </div>
            )}
            {mode==='extract' && <p className="text-sm text-slate-400 bg-white/5 rounded-xl p-4">Each of the {pageCount} pages will be extracted into its own PDF and bundled as a ZIP.</p>}
          </div>
          {done ? (
            <div className="success-card"><div className="text-4xl mb-3">✅</div><p className="font-display font-semibold text-gold text-lg mb-3">Split successfully!</p><button onClick={()=>{setFile(null);setDone(false);}} className="btn-ghost text-sm">Split another</button></div>
          ) : (
            <div className="flex gap-3">
              <button onClick={split} disabled={processing} className="btn-primary flex-1 justify-center">{processing?'Processing...':'Split PDF'}</button>
              <button onClick={()=>setFile(null)} className="btn-ghost">Reset</button>
            </div>
          )}
        </div>
      )}
    </ToolLayout>
  );
}
