import ServerConvertPage from '../../components/ServerConvertPage';

export const metadata = { title: 'Excel to PDF — PDFPro' };

export default function ExcelToPDF() {
  return (
    <ServerConvertPage
      title="Excel to PDF"
      icon="📈"
      description="Convert Excel spreadsheets to PDF format."
      accept={{ 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'], 'application/vnd.ms-excel': ['.xls'] }}
      acceptLabel="XLSX / XLS"
      convertType="xlsx"
      outputExt="pdf"
      outputLabel="PDF"
    />
  );
}
