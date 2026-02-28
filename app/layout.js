import { Cormorant_Garamond, DM_Mono } from 'next/font/google';
import './globals.css';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
});

const dmMono = DM_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
  weight: ['300', '400', '500'],
});

export const metadata = {
  title: 'PDFPro — Professional PDF Tools',
  description: 'Merge, split, compress, convert, and edit PDFs. Works in your browser. Files never leave your device.',
  keywords: 'PDF tools, merge PDF, split PDF, compress PDF, convert PDF, PDF to Word, Word to PDF',
  openGraph: {
    title: 'PDFPro — Professional PDF Tools',
    description: 'Every PDF tool you need. Private, fast, and free.',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${cormorant.variable} ${dmMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
