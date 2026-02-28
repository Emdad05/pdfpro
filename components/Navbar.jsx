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

const infoLinks = [
  { label: 'Features',         href: '/#features' },
  { label: 'Tools',            href: '/#tools' },
  { label: 'How to use',       href: '/#how' },
  { label: 'Contact us',       href: 'mailto:emdadhussain840@gmail.com', external: true },
  { label: 'Privacy Policy',   href: '/privacy' },
  { label: 'Terms of Service', href: '/terms' },
];

export default function Navbar() {
  const [menuOpen,       setMenuOpen]       = useState(false);
  const [toolsOpen,      setToolsOpen]      = useState(false);
  const [scrolled,       setScrolled]       = useState(false);
  const [termsAccepted,  setTermsAccepted]  = useState(true);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    try { setTermsAccepted(!!localStorage.getItem('pdfpro_terms')); } catch {}
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const acceptTerms = () => {
    try { localStorage.setItem('pdfpro_terms', '1'); } catch {}
    setTermsAccepted(true);
  };

  const close = () => setMenuOpen(false);

  return (
    <>
      {/* ── Terms banner ─────────────────────────────── */}
      {!termsAccepted && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/8 anim-slide-up"
          style={{background:'rgba(8,8,8,0.97)', backdropFilter:'blur(16px)'}}>
          <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
            <p className="font-mono text-xs text-white/40 leading-relaxed">
              By using PDFPro you accept our{' '}
              <Link href="/terms" className="text-gold underline underline-offset-2">Terms of Service</Link>
              {' '}and{' '}
              <Link href="/privacy" className="text-gold underline underline-offset-2">Privacy Policy</Link>.
              {' '}Local tools never upload your files.
            </p>
            <button onClick={acceptTerms} className="btn-primary flex-shrink-0"
              style={{padding:'0.5rem 1.25rem', fontSize:'11px'}}>
              Accept &amp; Continue
            </button>
          </div>
        </div>
      )}

      {/* ── Navbar ───────────────────────────────────── */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'navbar' : 'bg-transparent border-b border-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-6 h-6 border border-gold-400/50 flex items-center justify-center transition-colors duration-200 group-hover:border-gold-400"
                style={{transition:'border-color 0.2s'}}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 2h5l3 3v5H2V2z" stroke="#C9A84C" strokeWidth="0.8"/>
                  <path d="M7 2v3h3" stroke="#C9A84C" strokeWidth="0.8"/>
                </svg>
              </div>
              <span className="font-display text-base font-light tracking-widest text-white uppercase">
                PDF<span className="text-gold">Pro</span>
              </span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-7">
              {/* Tools dropdown */}
              <div className="relative"
                onMouseEnter={() => setToolsOpen(true)}
                onMouseLeave={() => setToolsOpen(false)}>
                <button className="label flex items-center gap-1.5 hover:text-gold transition-colors duration-150 py-2">
                  Tools
                  <svg className="w-3 h-3 transition-transform duration-200"
                    style={{transform: toolsOpen ? 'rotate(180deg)' : 'rotate(0deg)'}}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7"/>
                  </svg>
                </button>

                {toolsOpen && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-0 w-[520px] card anim-fade-down"
                    style={{background:'rgba(8,8,8,0.99)', borderColor:'rgba(255,255,255,0.08)', padding:'1.25rem'}}>
                    <div className="absolute top-0 left-8 right-8 h-px"
                      style={{background:'linear-gradient(90deg,transparent,rgba(201,168,76,0.5),transparent)'}} />
                    <div className="grid grid-cols-3 gap-5 stagger">
                      {toolGroups.map(g => (
                        <div key={g.label}>
                          <p className="label-gold mb-2.5">{g.label}</p>
                          {g.tools.map(t => (
                            <Link key={t.href} href={t.href}
                              className="block py-1 px-2 font-mono text-xs text-white/35 hover:text-white/80 transition-colors duration-150 rounded-sm hover:bg-white/3">
                              {t.label}
                            </Link>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Link href="/#features" className="label hover:text-gold transition-colors duration-150">Features</Link>
              <Link href="/#how"      className="label hover:text-gold transition-colors duration-150">How to use</Link>
              <a href="mailto:emdadhussain840@gmail.com" className="label hover:text-gold transition-colors duration-150">Contact</a>
            </nav>

            {/* Right */}
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-gold-400"
                  style={{boxShadow:'0 0 5px rgba(201,168,76,0.9)'}} />
                <span className="label" style={{color:'rgba(201,168,76,0.7)'}}>Private</span>
              </div>

              {/* Hamburger */}
              <button onClick={() => setMenuOpen(o => !o)}
                className="w-8 h-8 flex items-center justify-center text-white/40 hover:text-white transition-colors duration-150 border border-transparent hover:border-white/10"
                aria-label="Menu">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  style={{transition:'all 0.2s'}}>
                  {menuOpen
                    ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M6 18L18 6M6 6l12 12"/>
                    : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 6h16M4 12h16M4 18h16"/>
                  }
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* ── Full menu panel ──────────────────────────── */}
        {menuOpen && (
          <div className="border-t border-white/5 anim-slide-down"
            style={{background:'rgba(8,8,8,0.99)', backdropFilter:'blur(20px)'}}>
            <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-10 stagger">

                {toolGroups.map(g => (
                  <div key={g.label}>
                    <p className="label-gold mb-4">{g.label}</p>
                    <div className="space-y-0.5">
                      {g.tools.map(t => (
                        <Link key={t.href} href={t.href} onClick={close}
                          className="block py-1.5 font-mono text-xs text-white/35 hover:text-white/80 transition-colors duration-150">
                          {t.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Info & Legal */}
                <div>
                  <p className="label-gold mb-4">Menu</p>
                  <div className="space-y-0.5">
                    {infoLinks.map(l => (
                      l.external ? (
                        <a key={l.label} href={l.href}
                          className="block py-1.5 font-mono text-xs text-white/35 hover:text-white/80 transition-colors duration-150">
                          {l.label}
                        </a>
                      ) : (
                        <Link key={l.label} href={l.href} onClick={close}
                          className="block py-1.5 font-mono text-xs text-white/35 hover:text-white/80 transition-colors duration-150">
                          {l.label}
                        </Link>
                      )
                    ))}
                  </div>

                  <div className="mt-8 pt-5 border-t border-white/5">
                    <p className="font-mono text-xs text-white/20 leading-relaxed">
                      By using PDFPro you agree to our{' '}
                      <Link href="/terms" onClick={close} className="text-gold/50 hover:text-gold transition-colors">Terms of Service</Link>
                      {' '}and{' '}
                      <Link href="/privacy" onClick={close} className="text-gold/50 hover:text-gold transition-colors">Privacy Policy</Link>.
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
