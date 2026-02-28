import Link from 'next/link';

const tools = [
  { label: 'Merge PDF',    href: '/merge' },
  { label: 'Split PDF',    href: '/split' },
  { label: 'Compress PDF', href: '/compress' },
  { label: 'Rotate PDF',   href: '/rotate' },
  { label: 'PDF to JPG',   href: '/pdf-to-jpg' },
  { label: 'JPG to PDF',   href: '/jpg-to-pdf' },
  { label: 'Word to PDF',  href: '/docx-to-pdf' },
  { label: 'PDF to Word',  href: '/pdf-to-docx' },
  { label: 'PPT to PDF',   href: '/pptx-to-pdf' },
  { label: 'Excel to PDF', href: '/xlsx-to-pdf' },
  { label: 'HTML to PDF',  href: '/html-to-pdf' },
  { label: 'PDF to PPT',   href: '/pdf-to-ppt' },
  { label: 'Watermark',    href: '/watermark' },
  { label: 'Page Numbers', href: '/page-numbers' },
  { label: 'Sign PDF',     href: '/sign' },
  { label: 'Protect PDF',  href: '/protect' },
  { label: 'Unlock PDF',   href: '/unlock' },
  { label: 'OCR PDF',      href: '/ocr' },
];

export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-white/5 mt-20">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">

          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-5 h-5 border border-gold-400/40 flex items-center justify-center">
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                  <path d="M2 2h5l3 3v5H2V2z" stroke="#C9A84C" strokeWidth="0.8"/>
                </svg>
              </div>
              <span className="font-display text-sm font-light tracking-widest text-white uppercase">
                PDF<span className="text-gold">Pro</span>
              </span>
            </div>
            <p className="font-mono text-xs text-white/30 leading-relaxed max-w-xs">
              Professional PDF tools that run in your browser. No accounts, no uploads, no data collected.
            </p>
            <div className="mt-6 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-gold-400/60" />
              <span className="font-mono text-xs text-gold-400/60">Zero files stored — ever</span>
            </div>
          </div>

          {/* Tools */}
          <div className="md:col-span-2">
            <p className="label-gold mb-4">All Tools</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1.5">
              {tools.map(t => (
                <Link key={t.href} href={t.href}
                  className="font-mono text-xs text-white/30 hover:text-white/70 transition-colors py-0.5">
                  {t.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom rule */}
        <div className="h-px mb-6" style={{background:'linear-gradient(90deg, rgba(201,168,76,0.2), transparent)'}} />

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <p className="font-mono text-xs text-white/20">© {new Date().getFullYear()} PDFPro. All rights reserved.</p>
          <p className="font-mono text-xs text-white/20">Built for privacy. Designed for professionals.</p>
        </div>
      </div>
    </footer>
  );
}
