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
  { label: 'Watermark',    href: '/watermark' },
  { label: 'Page Numbers', href: '/page-numbers' },
  { label: 'Sign PDF',     href: '/sign' },
  { label: 'Protect PDF',  href: '/protect' },
  { label: 'Unlock PDF',   href: '/unlock' },
  { label: 'OCR PDF',      href: '/ocr' },
  { label: 'PDF to PPT',  href: '/pdf-to-ppt' },
];

export default function Footer() {
  return (
    <footer className="relative border-t border-white/5 mt-24">
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent-400 to-accent-700 flex items-center justify-center">
                <svg style={{width:'18px',height:'18px'}} className="text-slate-900" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"/>
                </svg>
              </div>
              <span className="font-heading font-bold text-lg text-white">PDF<span className="accent-text">Pro</span></span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed mb-5">
              Free, fast, and private PDF tools. Most tools process files directly in your browser — your data stays yours.
            </p>
            <div className="glass-card p-3 flex items-center gap-2.5 text-sm">
              <span className="text-emerald-400">🔐</span>
              <span className="text-slate-300">No accounts. No uploads. No tracking.</span>
            </div>
          </div>

          {/* All Tools */}
          <div className="md:col-span-2">
            <p className="section-label mb-4">All Tools</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2">
              {tools.map(t => (
                <Link key={t.href} href={t.href}
                  className="text-sm text-slate-400 hover:text-accent-400 transition-colors py-0.5">
                  {t.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-white/5 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-slate-500">
          <p>© {new Date().getFullYear()} PDFPro. All rights reserved.</p>
          <p>Built with care — privacy first, always.</p>
        </div>
      </div>
    </footer>
  );
}
