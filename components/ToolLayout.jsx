import Navbar from './Navbar';
import Footer from './Footer';
import Background from './Background';
import Link from 'next/link';

export default function ToolLayout({ title, description, icon, isServer = false, children }) {
  return (
    <div className="min-h-screen flex flex-col relative">
      <Background />
      <Navbar />

      <main className="relative z-10 flex-1 pt-14">
        {/* Tool header */}
        <div className="border-b border-white/5" style={{background:'rgba(255,255,255,0.01)'}}>
          <div className="max-w-4xl mx-auto px-6 lg:px-8 py-10">
            <div className="flex items-start justify-between mb-1">
              <Link href="/" className="label hover:text-gold transition-colors flex items-center gap-2 mb-6">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
                </svg>
                All Tools
              </Link>
              <span className={isServer ? 'badge-server' : 'badge-local'}>
                {isServer ? 'server' : 'local'}
              </span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl font-light text-white mb-3 tracking-tight">
              {title}
            </h1>
            <p className="font-mono text-sm text-white/40 max-w-lg leading-relaxed">{description}</p>

            {/* Rule */}
            <div className="mt-8 h-px" style={{background:'linear-gradient(90deg, rgba(201,168,76,0.3), transparent)'}} />

            {/* Privacy note */}
            <p className="mt-3 font-mono text-xs" style={{color:'rgba(201,168,76,0.5)'}}>
              {isServer
                ? '— Processed on secure server. File deleted immediately after conversion.'
                : '— Processed locally in your browser. Files never leave your device.'}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-6 lg:px-8 py-10">
          {children}
        </div>
      </main>

      <Footer />
    </div>
  );
}
