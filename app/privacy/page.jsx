import Background from '../../components/Background';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

export const metadata = { title: 'Privacy Policy — PDFPro' };

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen flex flex-col relative">
      <Background />
      <Navbar />
      <main className="relative z-10 flex-1 pt-24 max-w-3xl mx-auto px-6 lg:px-8 pb-24 w-full">
        <div className="mb-12">
          <p className="label-gold mb-4">Legal</p>
          <h1 className="font-display text-5xl font-light text-white tracking-tight mb-4">Privacy Policy</h1>
          <div className="h-px" style={{background:'linear-gradient(90deg, rgba(201,168,76,0.3), transparent)'}} />
          <p className="font-mono text-xs text-white/30 mt-3">Last updated: {new Date().toLocaleDateString('en-US', {year:'numeric',month:'long',day:'numeric'})}</p>
        </div>

        <div className="space-y-10 font-mono text-sm text-white/50 leading-relaxed">
          {[
            {
              title: '1. No Data Collection',
              body: 'PDFPro does not collect, store, or transmit your files. All local tools (Merge, Split, Compress, Rotate, PDF to JPG, JPG to PDF, Watermark, Page Numbers, Sign, Protect, Unlock, OCR, PDF to PPT) process files entirely within your browser using WebAssembly and JavaScript. Your files never leave your device for these operations.'
            },
            {
              title: '2. Server-Side Processing',
              body: 'For tools that require server-side conversion (Word to PDF, PDF to Word, PPT to PDF, Excel to PDF, HTML to PDF), your file is transmitted over an encrypted HTTPS connection to our conversion server, processed immediately, and the result is returned to you. Files are deleted from server memory immediately after conversion. We do not retain copies of any uploaded or converted files.'
            },
            {
              title: '3. No Cookies or Tracking',
              body: 'PDFPro does not use cookies, analytics trackers, advertising pixels, or any third-party tracking scripts. We do not track your usage, behavior, or session data. No account is required to use any tool.'
            },
            {
              title: '4. No Account Required',
              body: 'You do not need to create an account, provide an email address, or share any personal information to use PDFPro. All tools are accessible anonymously.'
            },
            {
              title: '5. Third-Party Services',
              body: 'PDFPro is hosted on Vercel. Server-side conversion is handled by a self-hosted Gotenberg instance (open source). Neither service retains your file data beyond the immediate processing window. Fonts are self-hosted at build time via Next.js — no Google Fonts requests are made at runtime.'
            },
            {
              title: '6. Children\'s Privacy',
              body: 'PDFPro does not knowingly collect any information from children under 13. The service is intended for general audiences. No personal data is collected from any user regardless of age.'
            },
            {
              title: '7. Changes to This Policy',
              body: 'We may update this policy from time to time. Continued use of PDFPro after changes constitutes acceptance of the updated policy. The date at the top of this page reflects the most recent update.'
            },
            {
              title: '8. Contact',
              body: 'Questions about this policy? Use the contact form at /contact.'
            },
          ].map(s => (
            <div key={s.title}>
              <h2 className="font-display text-xl font-light text-white mb-3">{s.title}</h2>
              <p>{s.body}</p>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
