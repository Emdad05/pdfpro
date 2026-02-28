import Link from 'next/link';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Background from '../components/Background';

const tools = [
  // Organize
  { title:'Merge PDF',    desc:'Combine multiple PDFs into one.',           href:'/merge',        badge:'local',  cat:'Organize' },
  { title:'Split PDF',    desc:'Extract pages or split into parts.',        href:'/split',        badge:'local',  cat:'Organize' },
  { title:'Compress PDF', desc:'Reduce file size without quality loss.',    href:'/compress',     badge:'local',  cat:'Organize' },
  { title:'Rotate PDF',   desc:'Rotate pages to correct orientation.',      href:'/rotate',       badge:'local',  cat:'Organize' },
  // Convert
  { title:'PDF to JPG',   desc:'Convert each page to a high-res image.',   href:'/pdf-to-jpg',   badge:'local',  cat:'Convert' },
  { title:'JPG to PDF',   desc:'Bundle images into a single PDF.',         href:'/jpg-to-pdf',   badge:'local',  cat:'Convert' },
  { title:'Word to PDF',  desc:'Convert DOCX files to PDF format.',        href:'/docx-to-pdf',  badge:'server', cat:'Convert' },
  { title:'PDF to Word',  desc:'Extract editable DOCX from PDF.',          href:'/pdf-to-docx',  badge:'server', cat:'Convert' },
  { title:'PPT to PDF',   desc:'Convert presentations to PDF.',            href:'/pptx-to-pdf',  badge:'server', cat:'Convert' },
  { title:'Excel to PDF', desc:'Render spreadsheets as PDF.',              href:'/xlsx-to-pdf',  badge:'server', cat:'Convert' },
  { title:'HTML to PDF',  desc:'Convert web pages to PDF documents.',      href:'/html-to-pdf',  badge:'server', cat:'Convert' },
  { title:'PDF to PPT',   desc:'Convert slides back to PowerPoint.',       href:'/pdf-to-ppt',   badge:'local',  cat:'Convert' },
  // Edit & Secure
  { title:'Watermark',    desc:'Add text watermarks to your PDF.',         href:'/watermark',    badge:'local',  cat:'Edit & Secure' },
  { title:'Page Numbers', desc:'Insert page numbers anywhere.',            href:'/page-numbers', badge:'local',  cat:'Edit & Secure' },
  { title:'Sign PDF',     desc:'Draw and embed your signature.',           href:'/sign',         badge:'local',  cat:'Edit & Secure' },
  { title:'Protect PDF',  desc:'Add password protection to your PDF.',     href:'/protect',      badge:'local',  cat:'Edit & Secure' },
  { title:'Unlock PDF',   desc:'Remove password from a PDF you own.',      href:'/unlock',       badge:'local',  cat:'Edit & Secure' },
  { title:'OCR PDF',      desc:'Extract text from scanned documents.',     href:'/ocr',          badge:'local',  cat:'Edit & Secure' },
];

const categories = ['Organize', 'Convert', 'Edit & Secure'];

const stats = [
  { value: '18',    label: 'Tools' },
  { value: '0',     label: 'Files stored' },
  { value: '100%',  label: 'Private' },
  { value: 'Free',  label: 'Forever' },
];

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col relative">
      <Background />
      <Navbar />

      <main className="relative z-10 flex-1">

        {/* ── Hero ───────────────────────────────────── */}
        <section className="max-w-7xl mx-auto px-6 lg:px-8 pt-32 pb-20">
          <div className="max-w-3xl">
            {/* Eyebrow */}
            <div className="flex items-center gap-3 mb-8 animate-fade-up">
              <div className="h-px w-8 bg-gold-400/60" />
              <span className="label-gold">Professional PDF Suite</span>
            </div>

            {/* Headline */}
            <h1 className="font-display text-6xl sm:text-7xl lg:text-8xl font-light text-white leading-none tracking-tight mb-8 animate-fade-up-2">
              Every PDF tool<br />
              <span className="italic" style={{color:'var(--gold)'}}>you will ever</span><br />
              need.
            </h1>

            <p className="font-mono text-sm text-white/40 max-w-md leading-relaxed mb-10 animate-fade-up-3">
              18 professional tools. Zero uploads for local processing. Files processed in your browser — they never touch our servers.
            </p>

            <div className="flex flex-wrap gap-4 animate-fade-up-3">
              <Link href="#tools" className="btn-primary">
                Browse Tools
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                </svg>
              </Link>
              <Link href="/merge" className="btn-ghost">Start with Merge PDF</Link>
            </div>
          </div>

          {/* Stats row */}
          <div className="mt-20 pt-8 border-t border-white/5 grid grid-cols-2 sm:grid-cols-4 gap-8">
            {stats.map((s, i) => (
              <div key={s.label} style={{animationDelay:`${i*0.08}s`}} className="animate-fade-up">
                <p className="font-display text-4xl font-light text-white mb-1">{s.value}</p>
                <p className="label text-white/30">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Tools grid ─────────────────────────────── */}
        <section id="tools" className="max-w-7xl mx-auto px-6 lg:px-8 pb-24">
          {categories.map(cat => (
            <div key={cat} className="mb-16">
              {/* Category header */}
              <div className="flex items-center gap-4 mb-6">
                <p className="label-gold">{cat}</p>
                <div className="flex-1 h-px" style={{background:'linear-gradient(90deg, rgba(201,168,76,0.2), transparent)'}} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-white/5">
                {tools.filter(t => t.cat === cat).map(tool => (
                  <Link key={tool.href} href={tool.href}>
                    <div className="tool-card h-full group">
                      {/* Top line */}
                      <div className="flex items-start justify-between mb-4">
                        <span className={tool.badge === 'server' ? 'badge-server' : 'badge-local'}>
                          {tool.badge}
                        </span>
                        <svg className="w-3 h-3 text-white/10 group-hover:text-gold transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 17L17 7M7 7h10v10"/>
                        </svg>
                      </div>

                      <h3 className="font-display text-xl font-light text-white mb-2 group-hover:text-gold transition-colors">
                        {tool.title}
                      </h3>
                      <p className="font-mono text-xs text-white/30 leading-relaxed">{tool.desc}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </section>


        {/* ── Features ───────────────────────────────── */}
        <section id="features" className="border-t border-white/5 py-24" style={{background:'rgba(255,255,255,0.01)'}}>
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="flex items-center gap-4 mb-16">
              <div className="h-px w-8 bg-gold-400/60" />
              <p className="label-gold">Features</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-white/5">
              {[
                {
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                    </svg>
                  ),
                  title: '100% Private',
                  desc: '12 of 18 tools run entirely in your browser. Your files never leave your device for local processing.',
                },
                {
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 10V3L4 14h7v7l9-11h-7z"/>
                    </svg>
                  ),
                  title: 'No Installation',
                  desc: 'Works in any modern browser. No plugins, no extensions, no downloads required.',
                },
                {
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"/>
                    </svg>
                  ),
                  title: 'WebAssembly Powered',
                  desc: 'Local tools use LibreOffice compiled to WebAssembly for professional-grade output quality.',
                },
                {
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                  ),
                  title: '18 Professional Tools',
                  desc: 'From merge and compress to OCR and PDF-to-PPT — everything you need in one place.',
                },
                {
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M0 0h24v24H0z" stroke="none"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  ),
                  title: 'Completely Free',
                  desc: 'No subscription, no premium tier, no usage limits. Every tool is free, forever.',
                },
                {
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                    </svg>
                  ),
                  title: 'No Account Required',
                  desc: 'Open any tool and start immediately. No sign-up, no email, no tracking — ever.',
                },
              ].map(f => (
                <div key={f.title} className="p-8" style={{background:'var(--bg-raised)'}}>
                  <div className="w-8 h-8 border border-white/10 flex items-center justify-center mb-5 text-gold-400/60">
                    {f.icon}
                  </div>
                  <h3 className="font-display text-lg font-light text-white mb-2">{f.title}</h3>
                  <p className="font-mono text-xs text-white/30 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── How it works ───────────────────────────── */}
        <section id="how" className="border-t border-white/5 py-24" style={{background:'rgba(255,255,255,0.01)'}}>
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="flex items-center gap-4 mb-16">
              <div className="h-px w-8 bg-gold-400/60" />
              <p className="label-gold">How it works</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/5">
              {[
                { n:'01', title:'Select your file', desc:'Drop or browse for your PDF. No account needed. No size limits for local tools.' },
                { n:'02', title:'Configure & convert', desc:'Choose your options. Local tools run instantly in your browser using WebAssembly.' },
                { n:'03', title:'Download instantly', desc:'Your file downloads directly. Nothing is stored, logged, or retained anywhere.' },
              ].map(step => (
                <div key={step.n} className="p-8" style={{background:'var(--bg-raised)'}}>
                  <p className="font-display text-5xl font-light mb-6" style={{color:'rgba(201,168,76,0.2)'}}>{step.n}</p>
                  <h3 className="font-display text-xl font-light text-white mb-3">{step.title}</h3>
                  <p className="font-mono text-xs text-white/30 leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ────────────────────────────────────── */}
        <section className="max-w-7xl mx-auto px-6 lg:px-8 py-24">
          <div className="border border-gold-400/20 p-12 relative overflow-hidden"
            style={{background:'rgba(201,168,76,0.03)'}}>
            {/* Corner marks */}
            <div className="absolute top-3 left-3 w-4 h-4 border-t border-l border-gold-400/40" />
            <div className="absolute top-3 right-3 w-4 h-4 border-t border-r border-gold-400/40" />
            <div className="absolute bottom-3 left-3 w-4 h-4 border-b border-l border-gold-400/40" />
            <div className="absolute bottom-3 right-3 w-4 h-4 border-b border-r border-gold-400/40" />

            <div className="text-center max-w-xl mx-auto">
              <p className="label-gold mb-4">Start now</p>
              <h2 className="font-display text-4xl sm:text-5xl font-light text-white mb-4 tracking-tight">
                No sign-up.<br />No subscription.
              </h2>
              <p className="font-mono text-xs text-white/30 mb-8 leading-relaxed">
                Every tool is free. Your files are your own. Always.
              </p>
              <Link href="/merge" className="btn-primary">
                Open PDF Tools
              </Link>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
