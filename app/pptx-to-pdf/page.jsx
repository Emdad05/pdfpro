import ServerConvertPage from '../../components/ServerConvertPage';

export const metadata = { title: 'PPT to PDF — PDFPro' };

export default function PptToPDF() {
  return (
    <ServerConvertPage
      title="PPT to PDF"
      icon="📊"
      description="Convert PowerPoint presentations to PDF with slides intact."
      accept={{ 'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'], 'application/vnd.ms-powerpoint': ['.ppt'] }}
      acceptLabel="PPTX / PPT"
      convertType="pptx"
      outputExt="pdf"
      outputLabel="PDF"
    />
  );
}
