import Navbar from './Navbar';
import Footer from './Footer';
import Background from './Background';
import Link from 'next/link';

export default function ToolLayout({ title, description, icon, isServer = false, children }) {
  return (
    <div className="min-h-screen flex flex-col relative">
      <Background />
      <Navbar />

      <main className="relative z-10 flex-1 pt-24 page-enter">
        {/* Hero header */}
        <div className="border-b border-white/5" style={{background:'rgba(255,255,255,0.02)'}}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-center">
            <div className="w-16 h-16 rounded-2xl glass-card flex items-center justify-center text-3xl mx-auto mb-4"
              style={{border:'1px solid rgba(0,216,214,0.2)', boxShadow:'0 0 30px rgba(0,216,214,0.1)'}}>
              {icon}
            </div>
            <div className="flex items-center justify-center gap-2 mb-2">
              <h1 className="font-heading text-3xl sm:text-4xl font-bold text-white">{title}</h1>
              <span className={isServer ? 'server-badge' : 'client-badge'}>
                {isServer ? 'Server' : 'Local'}
              </span>
            </div>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">{description}</p>

            <div className="mt-4 inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full"
              style={{background: isServer ? 'rgba(251,146,60,0.1)' : 'rgba(0,216,214,0.08)', border: isServer ? '1px solid rgba(251,146,60,0.2)' : '1px solid rgba(0,216,214,0.15)', color: isServer ? '#fb923c' : '#00d8d6'}}>
              {isServer
                ? '⚡ Processed on secure server — deleted immediately after conversion'
                : '🔒 Files processed locally — never uploaded to any server'}
            </div>
          </div>
        </div>

        {/* Tool content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {children}
        </div>

        {/* Back link */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-accent-400 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
            </svg>
            All tools
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
