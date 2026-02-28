import Link from 'next/link';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Background from '../components/Background';

const tools = [
  // Client-side tools
  { icon:'🔗', title:'Merge PDF',    desc:'Combine multiple PDFs into one.',            href:'/merge',        badge:'client', color:'from-cyan-500/20 to-cyan-500/5' },
  { icon:'✂️', title:'Split PDF',    desc:'Extract pages or split into parts.',         href:'/split',        badge:'client', color:'from-orange-500/20 to-orange-500/5' },
  { icon:'🗜️', title:'Compress PDF', desc:'Reduce file size, keep quality.',            href:'/compress',     badge:'client', color:'from-yellow-500/20 to-yellow-500/5' },
  { icon:'🔄', title:'Rotate PDF',   desc:'Rotate all or specific pages.',              href:'/rotate',       badge:'client', color:'from-green-500/20 to-green-500/5' },
  { icon:'🖼️', title:'PDF to JPG',   desc:'Convert each page to an image.',            href:'/pdf-to-jpg',   badge:'client', color:'from-pink-500/20 to-pink-500/5' },
  { icon:'📄', title:'JPG to PDF',   desc:'Convert images into a PDF file.',           href:'/jpg-to-pdf',   badge:'client', color:'from-sky-500/20 to-sky-500/5' },
  { icon:'💧', title:'Watermark',    desc:'Add text watermarks to your PDF.',          href:'/watermark',    badge:'client', color:'from-blue-500/20 to-blue-500/5' },
  { icon:'🔢', title:'Page Numbers', desc:'Add page numbers with custom position.',    href:'/page-numbers', badge:'client', color:'from-violet-500/20 to-violet-500/5' },
  { icon:'✍️', title:'Sign PDF',     desc:'Draw and embed your signature.',            href:'/sign',         badge:'client', color:'from-rose-500/20 to-rose-500/5' },
  { icon:'🔒', title:'Protect PDF',  desc:'Add a password to your PDF.',               href:'/protect',      badge:'client', color:'from-red-500/20 to-red-500/5' },
  { icon:'🔓', title:'Unlock PDF',   desc:'Remove PDF password protection.',           href:'/unlock',       badge:'client', color:'from-emerald-500/20 to-emerald-500/5' },
  { icon:'🔍', title:'OCR PDF',      desc:'Extract text from scanned PDFs.',           href:'/ocr',          badge:'client', color:'from-teal-500/20 to-teal-500/5' },
  // Server-side tools
  { icon:'📝', title:'Word to PDF',  desc:'Convert DOCX files to PDF perfectly.',      href:'/docx-to-pdf',  badge:'server', color:'from-cyan-500/20 to-cyan-500/5' },
  { icon:'📃', title:'PDF to Word',  desc:'Convert PDF back to editable DOCX.',       href:'/pdf-to-docx',  badge:'server', color:'from-indigo-500/20 to-indigo-500/5' },
  { icon:'📊', title:'PPT to PDF',   desc:'Convert PowerPoint slides to PDF.',         href:'/pptx-to-pdf',  badge:'server', color:'from-orange-500/20 to-orange-500/5' },
  { icon:'📈', title:'Excel to PDF', desc:'Convert spreadsheets to PDF.',              href:'/xlsx-to-pdf',  badge:'server', color:'from-green-500/20 to-green-500/5' },
  { icon:'🌐', title:'HTML to PDF',   desc:'Convert any HTML page to a PDF.',          href:'/html-to-pdf',  badge:'server', color:'from-purple-500/20 to-purple-500/5' },
  { icon:'📊', title:'PDF to PPT',    desc:'Convert PDF slides to editable PPTX.',     href:'/pdf-to-ppt',   badge:'client', color:'from-red-500/20 to-red-500/5' },
];

const features = [
  { icon:'🔐', title:'Privacy First',    desc:'Client-side tools process files in your browser. Files never leave your device.' },
  { icon:'⚡', title:'Lightning Fast',   desc:'No upload queues. Processing starts instantly for local tools.' },
  { icon:'🆓', title:'Always Free',      desc:'All tools are free. No subscriptions, no sign-ups, no hidden limits.' },
  { icon:'📱', title:'Works Everywhere', desc:'Optimized for desktop and mobile. Any modern browser supported.' },
  { icon:'🗑️', title:'Auto Delete',      desc:'Server-processed files are permanently deleted immediately after conversion.' },
  { icon:'🛡️', title:'Secure by Design', desc:'API keys and secrets are hidden server-side. Your data is never stored.' },
];

const stats = [
  { value:'18+', label:'PDF Tools' },
  { value:'0',   label:'Files stored on server' },
  { value:'100%', label:'Free to use' },
  { value:'<1s', label:'Average load time' },
];

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col relative">
      <Background />
      <Navbar />

      <main className="relative z-10 flex-1">

        {/* ── Hero ── */}
        <section className="pt-36 pb-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto text-center">

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-8"
              style={{background:'rgba(0,216,214,0.1)', border:'1px solid rgba(0,216,214,0.2)', color:'#00d8d6'}}>
              <span className="w-2 h-2 bg-accent-400 rounded-full animate-pulse"></span>
              Free · Private · No Sign-up Required
            </div>

            <h1 className="font-heading text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6">
              Every PDF tool<br/>
              <span className="gradient-text">you'll ever need</span>
            </h1>

            <p className="text-slate-400 text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
              Merge, split, compress, convert, and edit PDFs.
              Most tools run entirely in your browser — your files stay private.
            </p>

            <div className="flex flex-wrap gap-4 justify-center">
              <a href="#tools" className="btn-primary text-base px-8 py-4">
                Explore All Tools
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                </svg>
              </a>
              <a href="#how" className="btn-glass text-base px-8 py-4">
                How it works
              </a>
            </div>

            {/* Floating cards preview */}
            <div className="mt-20 relative flex justify-center gap-4 flex-wrap">
              {[
                { emoji:'📄', label:'PDF', color:'from-slate-600' },
                { emoji:'📝', label:'DOCX', color:'from-blue-600' },
                { emoji:'📊', label:'PPTX', color:'from-orange-600' },
                { emoji:'🖼️', label:'JPG', color:'from-pink-600' },
                { emoji:'📈', label:'XLSX', color:'from-green-600' },
              ].map((f, i) => (
                <div key={f.label} className="glass-card px-5 py-3 flex items-center gap-2"
                  style={{animationDelay:`${i*0.1}s`, animation:'fadeUp 0.6s ease forwards', opacity:0}}>
                  <span className="text-xl">{f.emoji}</span>
                  <span className="text-sm font-semibold font-heading text-slate-300">{f.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Stats ── */}
        <section className="py-12 border-y border-white/5" style={{background:'rgba(255,255,255,0.02)'}}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map(s => (
                <div key={s.label} className="text-center">
                  <p className="font-heading text-4xl font-bold accent-text mb-1">{s.value}</p>
                  <p className="text-sm text-slate-500">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Tools Grid ── */}
        <section id="tools" className="py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-14">
              <p className="section-label">Tools</p>
              <h2 className="font-heading text-4xl font-bold text-white mb-3">All PDF Tools</h2>
              <p className="text-slate-400 text-lg">Pick a tool and get started in seconds</p>

              <div className="flex items-center justify-center gap-4 mt-5 flex-wrap">
                <span className="flex items-center gap-1.5 text-sm text-slate-400">
                  <span className="client-badge">Local</span> Processed in your browser
                </span>
                <span className="flex items-center gap-1.5 text-sm text-slate-400">
                  <span className="server-badge">Server</span> Processed on secure server
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {tools.map((tool, i) => (
                <Link key={tool.href} href={tool.href}
                  className="tool-card group"
                  style={{animationDelay:`${i*0.04}s`}}>
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${tool.color} flex items-center justify-center text-2xl mb-4 transition-transform group-hover:scale-110 duration-300`}>
                    {tool.icon}
                  </div>
                  <div className="flex items-start justify-between mb-1 gap-2">
                    <h3 className="font-heading font-semibold text-white text-lg leading-tight group-hover:text-accent-300 transition-colors">
                      {tool.title}
                    </h3>
                    <span className={`flex-shrink-0 ${tool.badge === 'server' ? 'server-badge' : 'client-badge'}`}>
                      {tool.badge === 'server' ? 'Server' : 'Local'}
                    </span>
                  </div>
                  <p className="text-slate-500 text-sm leading-relaxed">{tool.desc}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── Features ── */}
        <section className="py-24 px-4 sm:px-6 lg:px-8 border-y border-white/5" style={{background:'rgba(255,255,255,0.015)'}}>
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-14">
              <p className="section-label">Why PDFPro</p>
              <h2 className="font-heading text-4xl font-bold text-white mb-3">Built different</h2>
              <p className="text-slate-400 text-lg">Not just another PDF tool site</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {features.map((f, i) => (
                <div key={f.title} className="glass-card p-6" style={{animationDelay:`${i*0.1}s`}}>
                  <div className="text-3xl mb-4">{f.icon}</div>
                  <h3 className="font-heading font-semibold text-white text-lg mb-2">{f.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── How it works ── */}
        <section id="how" className="py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <p className="section-label">Process</p>
              <h2 className="font-heading text-4xl font-bold text-white mb-3">How it works</h2>
              <p className="text-slate-400 text-lg">Simple as 1, 2, 3</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              {/* Connector line */}
              <div className="hidden md:block absolute top-8 left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] h-px"
                style={{background:'linear-gradient(90deg, transparent, rgba(0,216,214,0.4), transparent)'}} />

              {[
                { step:'01', icon:'📂', title:'Select your file',  desc:'Choose your PDF or image from your device by clicking or drag & drop.' },
                { step:'02', icon:'⚙️', title:'Configure options', desc:'Set your preferences — page range, quality, format, rotation, and more.' },
                { step:'03', icon:'⬇️', title:'Download result',   desc:'Your file is ready. Download it instantly — no email, no wait.' },
              ].map((s, i) => (
                <div key={s.step} className="text-center relative">
                  <div className="font-heading text-8xl font-bold text-white/5 select-none leading-none mb-2">{s.step}</div>
                  <div className="w-16 h-16 glass-card rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 -mt-6"
                    style={{border:'1px solid rgba(0,216,214,0.2)'}}>
                    {s.icon}
                  </div>
                  <h3 className="font-heading font-semibold text-white text-lg mb-2">{s.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <div className="glass-card p-12 relative overflow-hidden"
              style={{border:'1px solid rgba(0,216,214,0.2)', boxShadow:'0 0 80px rgba(0,216,214,0.08)'}}>
              <div className="orb w-64 h-64 -top-20 -left-20 bg-accent-500/20" />
              <div className="orb w-48 h-48 -bottom-10 -right-10 bg-blue-500/15" />
              <div className="relative z-10">
                <p className="section-label mb-4">Get Started</p>
                <h2 className="font-heading text-4xl font-bold text-white mb-4">Ready to use?</h2>
                <p className="text-slate-400 mb-8">No sign-up. No download. Just open a tool and go.</p>
                <a href="#tools" className="btn-primary text-base px-10 py-4">
                  Start for free
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
