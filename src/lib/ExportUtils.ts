import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Export data to Excel (.xlsx)
 * @param data Array of objects to export
 * @param fileName Desired file name (without extension)
 * @param sheetName Name of the sheet
 */
/**
 * Export data to Excel (.xlsx)
 */
export const exportToExcel = (data: any[], fileName: string, sheetName: string = 'Sheet1', metadata?: string) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  
  if (metadata) {
    XLSX.utils.sheet_add_aoa(worksheet, [[`Laporan: ${metadata}`]], { origin: 'A1' });
    // Shift data down if metadata is added
    const dataWS = XLSX.utils.json_to_sheet(data, { origin: 'A2' });
    XLSX.utils.book_append_sheet(workbook, dataWS, sheetName);
  } else {
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  }
  
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
};

/**
 * Export data to PDF (.pdf)
 */
export const exportToPDF = (
  title: string,
  columns: string[],
  rows: any[][],
  fileName: string,
  metadata?: string
) => {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(18);
  doc.text(title, 14, 22);
  
  // Add metadata/filters
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);
  if (metadata) {
    doc.text(`Filter: ${metadata}`, 14, 34);
  }
  
  // Add table
  autoTable(doc, {
    head: [columns],
    body: rows,
    startY: metadata ? 40 : 35,
    theme: 'striped',
    headStyles: { fillColor: [79, 70, 229] }, // Indigo 600
    styles: { fontSize: 8 },
  });
  
  doc.save(`${fileName}.pdf`);
};
