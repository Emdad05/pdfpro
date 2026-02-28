'use client';
import { useState } from 'react';
import Background from '../../components/Background';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

export default function Contact() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = (e) => {
    e.preventDefault();
    // Since we have no backend for contact, open mailto
    const body = encodeURIComponent(`Name: ${form.name}\nEmail: ${form.email}\n\n${form.message}`);
    const subject = encodeURIComponent(form.subject || 'PDFPro Enquiry');
    window.location.href = `mailto:support@pdfpro.app?subject=${subject}&body=${body}`;
    setSent(true);
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      <Background />
      <Navbar />
      <main className="relative z-10 flex-1 pt-24 max-w-2xl mx-auto px-6 lg:px-8 pb-24 w-full">
        <div className="mb-12">
          <p className="label-gold mb-4">Support</p>
          <h1 className="font-display text-5xl font-light text-white tracking-tight mb-4">Contact Us</h1>
          <div className="h-px" style={{background:'linear-gradient(90deg, rgba(201,168,76,0.3), transparent)'}} />
          <p className="font-mono text-xs text-white/30 mt-3">We typically respond within 24 hours.</p>
        </div>

        {sent ? (
          <div className="success-card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 border border-gold-400/40 flex items-center justify-center">
                <svg className="w-4 h-4 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7"/>
                </svg>
              </div>
              <div>
                <p className="font-display text-lg font-light text-white">Message prepared</p>
                <p className="font-mono text-xs text-white/30">Your email client has opened with the message</p>
              </div>
            </div>
            <button onClick={() => setSent(false)} className="btn-ghost w-full justify-center">Send another</button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="label mb-2">Name</p>
                <input className="input" placeholder="Your name" value={form.name} onChange={e => update('name', e.target.value)} required />
              </div>
              <div>
                <p className="label mb-2">Email</p>
                <input className="input" type="email" placeholder="you@example.com" value={form.email} onChange={e => update('email', e.target.value)} required />
              </div>
            </div>
            <div>
              <p className="label mb-2">Subject</p>
              <input className="input" placeholder="Bug report, feature request, general enquiry…" value={form.subject} onChange={e => update('subject', e.target.value)} />
            </div>
            <div>
              <p className="label mb-2">Message</p>
              <textarea className="input" rows={6} placeholder="Describe your issue or question in detail…" value={form.message} onChange={e => update('message', e.target.value)} required style={{resize:'vertical'}} />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" className="btn-primary flex-1 justify-center">
                Send Message
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                </svg>
              </button>
            </div>
          </form>
        )}
      </main>
      <Footer />
    </div>
  );
}
