'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

const toolGroups = [
  {
    label: 'Organize',
    tools: [
      { label: 'Merge PDF',    href: '/merge',        badge: 'local' },
      { label: 'Split PDF',    href: '/split',        badge: 'local' },
      { label: 'Rotate PDF',   href: '/rotate',       badge: 'local' },
      { label: 'Compress PDF', href: '/compress',     badge: 'local' },
    ],
  },
  {
    label: 'Convert',
    tools: [
      { label: 'PDF to JPG',   href: '/pdf-to-jpg',   badge: 'local' },
      { label: 'JPG to PDF',   href: '/jpg-to-pdf',   badge: 'local' },
      { label: 'Word to PDF',  href: '/docx-to-pdf',  badge: 'server' },
      { label: 'PDF to Word',  href: '/pdf-to-docx',  badge: 'server' },
      { label: 'PPT to PDF',   href: '/pptx-to-pdf',  badge: 'server' },
      { label: 'Excel to PDF', href: '/xlsx-to-pdf',  badge: 'server' },
      { label: 'HTML to PDF',  href: '/html-to-pdf',  badge: 'server' },
      { label: 'PDF to PPT',   href: '/pdf-to-ppt',   badge: 'local' },
    ],
  },
  {
    label: 'Edit & Secure',
    tools: [
      { label: 'Watermark',    href: '/watermark',    badge: 'local' },
      { label: 'Page Numbers', href: '/page-numbers', badge: 'local' },
      { label: 'Sign PDF',     href: '/sign',         badge: 'local' },
      { label: 'Protect PDF',  href: '/protect',      badge: 'local' },
      { label: 'Unlock PDF',   href: '/unlock',       badge: 'local' },
      { label: 'OCR PDF',      href: '/ocr',          badge: 'local' },
    ],
  },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen]       = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [scrolled, setScrolled]       = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'navbar' : 'bg-transparent border-b border-transparent'}`}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-6 h-6 border border-gold-400/60 flex items-center justify-center group-hover:border-gold-400 transition-colors">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 2h5l3 3v5H2V2z" stroke="#C9A84C" strokeWidth="0.8"/>
                <path d="M7 2v3h3" stroke="#C9A84C" strokeWidth="0.8"/>
              </svg>
            </div>
            <span className="font-display text-base font-light tracking-widest text-white uppercase">
              PDF<span className="text-gold">Pro</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            <div className="relative"
              onMouseEnter={() => setDropdownOpen(true)}
              onMouseLeave={() => setDropdownOpen(false)}>
              <button className="label flex items-center gap-2 hover:text-gold transition-colors py-2">
                All Tools
                <svg className={`w-3 h-3 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7"/>
                </svg>
              </button>

              {dropdownOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-0 w-[560px] card p-6 shadow-2xl shadow-black/80"
                  style={{background:'rgba(10,10,10,0.98)', borderColor:'rgba(255,255,255,0.1)'}}>
                  {/* Top rule */}
                  <div className="absolute top-0 left-6 right-6 h-px" style={{background:'linear-gradient(90deg, transparent, rgba(201,168,76,0.4), transparent)'}} />

                  <div className="grid grid-cols-3 gap-6">
                    {toolGroups.map(g => (
                      <div key={g.label}>
                        <p className="label-gold mb-3">{g.label}</p>
                        <div className="space-y-0.5">
                          {g.tools.map(t => (
                            <Link key={t.href} href={t.href}
                              className="flex items-center justify-between px-2 py-1.5 hover:bg-white/3 transition-colors group">
                              <span className="text-xs text-white/50 group-hover:text-white/80 transition-colors font-mono">{t.label}</span>
                              <span className={t.badge === 'server' ? 'badge-server' : 'badge-local'}>{t.badge}</span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <Link href="/#how" className="label hover:text-gold transition-colors">Process</Link>
          </nav>

          {/* Right */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-gold-400" style={{boxShadow:'0 0 6px rgba(201,168,76,0.8)'}} />
              <span className="label text-gold-400">Private</span>
            </div>
            <button className="md:hidden p-1.5 text-white/50 hover:text-white transition-colors"
              onClick={() => setMenuOpen(!menuOpen)}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                  d={menuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-white/5 px-6 py-6 space-y-6"
          style={{background:'rgba(8,8,8,0.98)'}}>
          {toolGroups.map(g => (
            <div key={g.label}>
              <p className="label-gold mb-3">{g.label}</p>
              <div className="grid grid-cols-2 gap-0.5">
                {g.tools.map(t => (
                  <Link key={t.href} href={t.href} onClick={() => setMenuOpen(false)}
                    className="px-3 py-2 text-xs font-mono text-white/50 hover:text-white/80 hover:bg-white/3 transition-all">
                    {t.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </header>
  );
}
