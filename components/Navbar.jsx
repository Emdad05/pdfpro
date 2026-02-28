'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

const toolGroups = [
  {
    label: 'Organize',
    tools: [
      { label: 'Merge PDF',    href: '/merge',    icon: '🔗', badge: 'client' },
      { label: 'Split PDF',    href: '/split',    icon: '✂️', badge: 'client' },
      { label: 'Rotate PDF',   href: '/rotate',   icon: '🔄', badge: 'client' },
      { label: 'Compress PDF', href: '/compress', icon: '🗜️', badge: 'client' },
    ],
  },
  {
    label: 'Convert',
    tools: [
      { label: 'PDF to JPG',   href: '/pdf-to-jpg',   icon: '🖼️', badge: 'client' },
      { label: 'JPG to PDF',   href: '/jpg-to-pdf',   icon: '📄', badge: 'client' },
      { label: 'Word to PDF',  href: '/docx-to-pdf',  icon: '📝', badge: 'server' },
      { label: 'PDF to Word',  href: '/pdf-to-docx',  icon: '📃', badge: 'server' },
      { label: 'PPT to PDF',   href: '/pptx-to-pdf',  icon: '📊', badge: 'server' },
      { label: 'Excel to PDF', href: '/xlsx-to-pdf',  icon: '📈', badge: 'server' },
      { label: 'HTML to PDF',  href: '/html-to-pdf',  icon: '🌐', badge: 'server' },
      { label: 'PDF to PPT',   href: '/pdf-to-ppt',   icon: '📊', badge: 'client' },
    ],
  },
  {
    label: 'Edit & Secure',
    tools: [
      { label: 'Watermark',    href: '/watermark',    icon: '💧', badge: 'client' },
      { label: 'Page Numbers', href: '/page-numbers', icon: '🔢', badge: 'client' },
      { label: 'Sign PDF',     href: '/sign',         icon: '✍️', badge: 'client' },
      { label: 'Protect PDF',  href: '/protect',      icon: '🔒', badge: 'client' },
      { label: 'Unlock PDF',   href: '/unlock',       icon: '🔓', badge: 'client' },
      { label: 'OCR PDF',      href: '/ocr',          icon: '🔍', badge: 'client' },
    ],
  },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'navbar-glass shadow-lg shadow-black/20' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent-400 to-accent-700 flex items-center justify-center shadow-lg shadow-accent-500/30 group-hover:shadow-accent-500/50 transition-all">
              <svg className="w-4.5 h-4.5 text-slate-900" fill="currentColor" viewBox="0 0 20 20" style={{width:'18px',height:'18px'}}>
                <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"/>
              </svg>
            </div>
            <span className="font-heading font-bold text-lg text-white">
              PDF<span className="accent-text">Pro</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            <div className="relative"
              onMouseEnter={() => setDropdownOpen(true)}
              onMouseLeave={() => setDropdownOpen(false)}>
              <button className="flex items-center gap-1.5 text-sm font-medium text-slate-300 hover:text-white transition-colors py-2">
                All Tools
                <svg className={`w-4 h-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                </svg>
              </button>

              {/* Mega dropdown */}
              {dropdownOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[640px] glass-card p-5 shadow-2xl shadow-black/50"
                  style={{background:'rgba(10,17,40,0.95)'}}>
                  <div className="grid grid-cols-3 gap-6">
                    {toolGroups.map(g => (
                      <div key={g.label}>
                        <p className="section-label mb-3">{g.label}</p>
                        <div className="space-y-0.5">
                          {g.tools.map(t => (
                            <Link key={t.href} href={t.href}
                              className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/5 transition-colors group">
                              <span className="text-base">{t.icon}</span>
                              <span className="text-sm text-slate-300 group-hover:text-white transition-colors flex-1">{t.label}</span>
                              <span className={t.badge === 'server' ? 'server-badge' : 'client-badge'}>
                                {t.badge === 'server' ? 'Server' : 'Local'}
                              </span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1.5"><span className="client-badge">Local</span> = Processed in your browser (private)</span>
                    <span className="flex items-center gap-1.5"><span className="server-badge">Server</span> = Processed on server, deleted immediately</span>
                  </div>
                </div>
              )}
            </div>

            <Link href="/#how" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">How it works</Link>
          </nav>

          {/* Privacy badge + mobile menu */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
              100% Private
            </div>
            <button className="md:hidden p-2 rounded-xl glass-card text-slate-300 hover:text-white transition-colors"
              onClick={() => setMenuOpen(!menuOpen)}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d={menuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-white/5 px-4 py-5 space-y-6" style={{background:'rgba(6,11,24,0.98)'}}>
          {toolGroups.map(g => (
            <div key={g.label}>
              <p className="section-label mb-2">{g.label}</p>
              <div className="grid grid-cols-2 gap-1">
                {g.tools.map(t => (
                  <Link key={t.href} href={t.href} onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors text-sm text-slate-300 hover:text-white">
                    <span>{t.icon}</span>
                    <span>{t.label}</span>
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
