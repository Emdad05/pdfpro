import ServerConvertPage from '../../components/ServerConvertPage';

export const metadata = { title: 'Word to PDF — PDFPro' };

export default function WordToPDF() {
  return (
    <ServerConvertPage
      title="Word to PDF"
      icon="📝"
      description="Convert Word DOCX files to PDF with perfect formatting preserved."
      accept={{ 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'], 'application/msword': ['.doc'] }}
      acceptLabel="DOCX / DOC"
      convertType="docx"
      outputExt="pdf"
      outputLabel="PDF"
    />
  );
}
