'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

const toolGroups = [
  {
    label: 'Organize',
    tools: [
      { label: 'Merge PDF',    href: '/merge' },
      { label: 'Split PDF',    href: '/split' },
      { label: 'Rotate PDF',   href: '/rotate' },
      { label: 'Compress PDF', href: '/compress' },
    ],
  },
  {
    label: 'Convert',
    tools: [
      { label: 'PDF to JPG',   href: '/pdf-to-jpg' },
      { label: 'JPG to PDF',   href: '/jpg-to-pdf' },
      { label: 'Word to PDF',  href: '/docx-to-pdf' },
      { label: 'PDF to Word',  href: '/pdf-to-docx' },
      { label: 'PPT to PDF',   href: '/pptx-to-pdf' },
      { label: 'Excel to PDF', href: '/xlsx-to-pdf' },
      { label: 'HTML to PDF',  href: '/html-to-pdf' },
      { label: 'PDF to PPT',   href: '/pdf-to-ppt' },
    ],
  },
  {
    label: 'Edit & Secure',
    tools: [
      { label: 'Watermark',    href: '/watermark' },
      { label: 'Page Numbers', href: '/page-numbers' },
      { label: 'Sign PDF',     href: '/sign' },
      { label: 'Protect PDF',  href: '/protect' },
      { label: 'Unlock PDF',   href: '/unlock' },
      { label: 'OCR PDF',      href: '/ocr' },
    ],
  },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen]         = useState(false);
  const [toolsOpen, setToolsOpen]       = useState(false);
  const [scrolled, setScrolled]         = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(true); // optimistic — check in effect

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', fn);
    // Check if user has already accepted terms
    try { setTermsAccepted(!!localStorage.getItem('pdfpro_terms')); } catch {}
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const acceptTerms = () => {
    try { localStorage.setItem('pdfpro_terms', '1'); } catch {}
    setTermsAccepted(true);
  };

  return (
    <>
      {/* ── Terms acceptance banner ─────────────────── */}
      {!termsAccepted && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10"
          style={{background:'rgba(10,10,10,0.97)', backdropFilter:'blur(12px)'}}>
          <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <p className="font-mono text-xs text-white/40 leading-relaxed">
              By using PDFPro, you agree to our{' '}
              <Link href="/terms" className="text-gold hover:underline">Terms of Service</Link>
              {' '}and{' '}
              <Link href="/privacy" className="text-gold hover:underline">Privacy Policy</Link>.
              {' '}Files are processed locally in your browser — we never store your documents.
            </p>
            <button onClick={acceptTerms} className="btn-primary whitespace-nowrap" style={{padding:'0.5rem 1.25rem', fontSize:'11px'}}>
              Accept & Continue
            </button>
          </div>
        </div>
      )}

      {/* ── Main navbar ─────────────────────────────── */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'navbar' : 'bg-transparent border-b border-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-6 h-6 border border-gold-400/50 flex items-center justify-center group-hover:border-gold-400 transition-colors">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 2h5l3 3v5H2V2z" stroke="#C9A84C" strokeWidth="0.8"/>
                  <path d="M7 2v3h3" stroke="#C9A84C" strokeWidth="0.8"/>
                </svg>
              </div>
              <span className="font-display text-base font-light tracking-widest text-white uppercase">
                PDF<span className="text-gold">Pro</span>
              </span>
            </Link>

            {/* Desktop links */}
            <nav className="hidden md:flex items-center gap-8">

              {/* Tools dropdown */}
              <div className="relative"
                onMouseEnter={() => setToolsOpen(true)}
                onMouseLeave={() => setToolsOpen(false)}>
                <button className="label flex items-center gap-2 hover:text-gold transition-colors py-2">
                  Tools
                  <svg className={`w-3 h-3 transition-transform ${toolsOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7"/>
                  </svg>
                </button>

                {toolsOpen && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-0 w-[540px] card p-6 shadow-2xl shadow-black/80"
                    style={{background:'rgba(10,10,10,0.98)', borderColor:'rgba(255,255,255,0.1)'}}>
                    <div className="absolute top-0 left-8 right-8 h-px"
                      style={{background:'linear-gradient(90deg, transparent, rgba(201,168,76,0.4), transparent)'}} />
                    <div className="grid grid-cols-3 gap-6">
                      {toolGroups.map(g => (
                        <div key={g.label}>
                          <p className="label-gold mb-3">{g.label}</p>
                          <div className="space-y-0.5">
                            {g.tools.map(t => (
                              <Link key={t.href} href={t.href}
                                className="block px-2 py-1.5 font-mono text-xs text-white/40 hover:text-white/80 hover:bg-white/3 transition-all">
                                {t.label}
                              </Link>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Link href="/#features" className="label hover:text-gold transition-colors">Features</Link>
              <Link href="/#how" className="label hover:text-gold transition-colors">How it works</Link>
              <Link href="/contact" className="label hover:text-gold transition-colors">Contact</Link>
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-gold-400"
                  style={{boxShadow:'0 0 6px rgba(201,168,76,0.8)'}} />
                <span className="label text-gold-400/80">Private</span>
              </div>

              {/* Hamburger */}
              <button
                className="p-1.5 text-white/40 hover:text-white transition-colors"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="Menu">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                    d={menuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* ── Full-screen menu overlay ───────────────── */}
        {menuOpen && (
          <div className="border-t border-white/5" style={{background:'rgba(8,8,8,0.99)', backdropFilter:'blur(20px)'}}>
            <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-10">

                {/* Tools sections */}
                {toolGroups.map(g => (
                  <div key={g.label}>
                    <p className="label-gold mb-4">{g.label}</p>
                    <div className="space-y-1">
                      {g.tools.map(t => (
                        <Link key={t.href} href={t.href} onClick={() => setMenuOpen(false)}
                          className="block font-mono text-xs text-white/40 hover:text-white/80 py-1 transition-colors">
                          {t.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Info links */}
                <div>
                  <p className="label-gold mb-4">Information</p>
                  <div className="space-y-1">
                    {[
                      { label: 'Features', href: '/#features' },
                      { label: 'How it works', href: '/#how' },
                      { label: 'Contact us', href: '/contact' },
                      { label: 'Privacy Policy', href: '/privacy' },
                      { label: 'Terms of Service', href: '/terms' },
                    ].map(l => (
                      <Link key={l.href} href={l.href} onClick={() => setMenuOpen(false)}
                        className="block font-mono text-xs text-white/40 hover:text-white/80 py-1 transition-colors">
                        {l.label}
                      </Link>
                    ))}
                  </div>

                  <div className="mt-8 pt-6 border-t border-white/5">
                    <p className="font-mono text-xs text-white/20 leading-relaxed">
                      By using PDFPro you accept our{' '}
                      <Link href="/terms" className="text-gold/60 hover:text-gold" onClick={() => setMenuOpen(false)}>
                        Terms of Service
                      </Link>.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
