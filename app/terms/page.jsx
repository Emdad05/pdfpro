import Background from '../../components/Background';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

export const metadata = { title: 'Terms of Service — PDFPro' };

export default function Terms() {
  return (
    <div className="min-h-screen flex flex-col relative">
      <Background />
      <Navbar />
      <main className="relative z-10 flex-1 pt-24 max-w-3xl mx-auto px-6 lg:px-8 pb-24 w-full">
        <div className="mb-12">
          <p className="label-gold mb-4">Legal</p>
          <h1 className="font-display text-5xl font-light text-white tracking-tight mb-4">Terms of Service</h1>
          <div className="h-px" style={{background:'linear-gradient(90deg, rgba(201,168,76,0.3), transparent)'}} />
          <p className="font-mono text-xs text-white/30 mt-3">Last updated: {new Date().toLocaleDateString('en-US', {year:'numeric',month:'long',day:'numeric'})}</p>
        </div>

        <div className="space-y-10 font-mono text-sm text-white/50 leading-relaxed">
          {[
            {
              title: '1. Acceptance of Terms',
              body: 'By accessing or using PDFPro, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use PDFPro. Your continued use of the service constitutes acceptance of these terms.'
            },
            {
              title: '2. Description of Service',
              body: 'PDFPro provides free, browser-based PDF processing tools including merging, splitting, compressing, converting, and editing PDF files. Some tools process files locally in your browser; others use a server-side conversion engine for format conversion tasks.'
            },
            {
              title: '3. Permitted Use',
              body: 'PDFPro is provided for lawful personal and professional use. You may use PDFPro to process files that you own or have the legal right to process. You may not use PDFPro to process files containing illegal content, to circumvent copyright protections, or for any unlawful purpose.'
            },
            {
              title: '4. Your Files and Content',
              body: 'You retain full ownership and responsibility for any files you process using PDFPro. By uploading a file to our server-side tools, you represent that you have the right to process that file. PDFPro does not claim any ownership over your files.'
            },
            {
              title: '5. No Warranty',
              body: 'PDFPro is provided "as is" without any warranties of any kind, express or implied. We do not guarantee that the service will be uninterrupted, error-free, or produce results suitable for any particular purpose. You use the service at your own risk.'
            },
            {
              title: '6. Limitation of Liability',
              body: 'To the maximum extent permitted by law, PDFPro and its operators shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the service, including but not limited to loss of data, files, or business.'
            },
            {
              title: '7. Service Availability',
              body: 'PDFPro is a free service provided on a best-effort basis. We reserve the right to modify, suspend, or discontinue any part of the service at any time without notice. We are not liable for any interruptions to the service.'
            },
            {
              title: '8. Modifications to Terms',
              body: 'We may update these terms at any time. Continued use of PDFPro after changes constitutes acceptance of the revised terms. The date at the top of this page reflects the most recent update.'
            },
            {
              title: '9. Governing Law',
              body: 'These terms shall be governed by and construed in accordance with applicable laws. Any disputes arising from use of PDFPro shall be resolved through good-faith negotiation.'
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
