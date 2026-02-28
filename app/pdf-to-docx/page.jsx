import ServerConvertPage from '../../components/ServerConvertPage';

export const metadata = { title: 'PDF to Word — PDFPro' };

export default function PDFtoWord() {
  return (
    <ServerConvertPage
      title="PDF to Word"
      icon="📃"
      description="Convert PDF files back to editable Word DOCX documents."
      accept={{ 'application/pdf': ['.pdf'] }}
      acceptLabel="PDF"
      convertType="pdf-to-docx"
      outputExt="docx"
      outputLabel="DOCX"
    />
  );
}
