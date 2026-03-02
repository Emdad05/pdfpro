'use client';
import { useState, useRef } from 'react';
import ToolLayout from '../../components/ToolLayout';
import FileUpload from '../../components/FileUpload';

// Convert any image file to PNG bytes via canvas (handles WebP, AVIF, HEIC fallback, etc.)
async function imageFileToJpegBytes(file, quality = 0.92) {
  const url = URL.createObjectURL(file);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width  = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext('2d').drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      canvas.toBlob(blob => {
        if (!blob) return reject(new Error(`Failed to encode ${file.name}`));
        blob.arrayBuffer().then(resolve).catch(reject);
      }, 'image/jpeg', quality);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error(`Could not load ${file.name}`)); };
    img.src = url;
  });
}

const SIZES = { A4:[595.28,841.89], Letter:[612,792], A3:[841.89,1190.55], Image:null };

export default function JPGtoPDF() {
  const [files, setFiles]         = useState([]);
  const [processing, setProc]     = useState(false);
  const [progress, setProgress]   = useState(0);
  const [done, setDone]           = useState(false);
  const [error, setError]         = useState('');
  const [pageSize, setPageSize]   = useState('A4');
  const [fit, setFit]             = useState('contain');
  const topRef = useRef(null);

  const handleFiles = f => setFiles(p => [...p, ...f.map(file => ({ file, id:Math.random(), preview:URL.createObjectURL(file) }))]);
  const remove  = id => setFiles(p => p.filter(f => f.id !== id));
  const moveUp  = i  => { if (!i) return; const a=[...files]; [a[i-1],a[i]]=[a[i],a[i-1]]; setFiles(a); };
  const moveDown= i  => { if (i===files.length-1) return; const a=[...files]; [a[i],a[i+1]]=[a[i+1],a[i]]; setFiles(a); };
  const reset   = () => { setFiles([]); setDone(false); setError(''); setProgress(0); };

  const convert = async () => {
    topRef.current?.scrollIntoView({ behavior:'smooth', block:'start' });
    setProc(true); setError(''); setDone(false); setProgress(0);
    try {
      const { PDFDocument } = await import('pdf-lib');
      const doc = await PDFDocument.create();

      for (let idx = 0; idx < files.length; idx++) {
        setProgress(Math.round((idx / files.length) * 90));
        const { file } = files[idx];

        // Always go through canvas — handles JPG, PNG, WebP, GIF, AVIF
        const jpgBytes = await imageFileToJpegBytes(file, 0.92);
        const img      = await doc.embedJpg(jpgBytes);
        const { width, height } = img;

        let pw, ph;
        if (pageSize === 'Image') { pw = width; ph = height; }
        else { [pw, ph] = SIZES[pageSize]; }

        // Portrait vs landscape: match orientation
        const landscape = width > height;
        if (pageSize !== 'Image' && landscape) { [pw, ph] = [ph, pw]; }

        const page = doc.addPage([pw, ph]);
        let dw = pw, dh = ph, x = 0, y = 0;
        if (fit === 'contain') {
          const r = Math.min(pw / width, ph / height);
          dw = width * r; dh = height * r;
          x = (pw - dw) / 2; y = (ph - dh) / 2;
        } else { // fill — crop to fit
          const r = Math.max(pw / width, ph / height);
          dw = width * r; dh = height * r;
          x = (pw - dw) / 2; y = (ph - dh) / 2;
        }
        page.drawImage(img, { x, y, width: dw, height: dh });
      }

      setProgress(95);
      const out  = await doc.save();
      const url  = URL.createObjectURL(new Blob([out], { type:'application/pdf' }));
      const a    = document.createElement('a');
      a.href = url; a.download = 'images.pdf';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setDone(true); setProgress(100);
    } catch(e) { setError(e.message || 'Conversion failed'); }
    setProc(false);
  };

  return (
    <ToolLayout title="Image to PDF" description="Convert JPG, PNG, WebP or any image format into a PDF. All formats normalised via canvas.">
      <div ref={topRef}/>
      <div className="space-y-3">
        <FileUpload onFiles={handleFiles}
          accept={{ 'image/jpeg':['.jpg','.jpeg'], 'image/png':['.png'], 'image/webp':['.webp'], 'image/gif':['.gif'], 'image/avif':['.avif'] }}
          multiple label="Drop images here" sublabel="JPG · PNG · WebP · GIF · AVIF"/>

        {files.length > 0 && (
          <>
            <div className="card p-4">
              <p className="label-gold mb-3">Images ({files.length})</p>
              <div className="space-y-1.5">
                {files.map(({ file, id, preview }, i) => (
                  <div key={id} className="flex items-center gap-2 p-2"
                    style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)' }}>
                    <img src={preview} alt="" className="w-9 h-9 object-cover flex-shrink-0"
                      style={{ border:'1px solid rgba(255,255,255,0.08)' }}/>
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
            </div>

            {!processing && !done && (
              <div className="card p-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="label-gold mb-2">Page size</p>
                  <div className="grid grid-cols-2 gap-1">
                    {['A4','Letter','A3','Image'].map(s => (
                      <button key={s} onClick={() => setPageSize(s)}
                        className={`option-btn ${pageSize===s?'active':''}`} style={{ padding:'0.4rem' }}>
                        <span className="font-mono text-xs">{s}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="label-gold mb-2">Image fit</p>
                  <div className="space-y-1">
                    {[{id:'contain',label:'Contain',desc:'Letterbox'},
                      {id:'fill',   label:'Fill',   desc:'Crop to fill'}].map(f => (
                      <button key={f.id} onClick={() => setFit(f.id)}
                        className={`option-btn w-full text-left ${fit===f.id?'active':''}`} style={{ padding:'0.4rem 0.6rem' }}>
                        <span className="font-mono text-xs">{f.label}</span>
                        <span className="font-mono text-white/25 ml-1" style={{ fontSize:'9px' }}>{f.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {processing && (
              <div className="card p-4">
                <div className="flex justify-between mb-2">
                  <p className="font-mono text-xs text-gold">Converting images…</p>
                  <span className="font-mono text-xs text-white/40">{progress}%</span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width:`${Math.max(progress,2)}%`, transition:'width 0.3s' }}/>
                </div>
              </div>
            )}

            {error && (
              <div className="card p-4 flex gap-3" style={{ borderColor:'rgba(239,68,68,0.2)' }}>
                <div className="w-0.5 self-stretch" style={{ background:'rgba(239,68,68,0.5)' }}/>
                <div>
                  <p className="font-mono text-xs text-red-400 mb-0.5">Failed</p>
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
                    <p className="font-display text-lg font-light text-white">PDF created</p>
                    <p className="font-mono text-xs text-white/30">{files.length} image{files.length!==1?'s':''} combined</p>
                  </div>
                </div>
                <button onClick={reset} className="btn-ghost w-full justify-center" style={{ fontSize:'11px' }}>Convert more</button>
              </div>
            )}

            {!processing && !done && (
              <div className="flex gap-2">
                <button onClick={convert} className="btn-primary flex-1 justify-center" style={{ padding:'0.7rem', fontSize:'12px' }}>
                  Create PDF
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                  </svg>
                </button>
                <button onClick={reset} className="btn-ghost" style={{ padding:'0.7rem 1rem', fontSize:'12px' }}>Reset</button>
              </div>
            )}
          </>
        )}
      </div>
    </ToolLayout>
  );
}
