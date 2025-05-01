'use client'
import { FaFileDownload, FaFilePdf, FaFileExcel } from 'react-icons/fa';
import { useState } from 'react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const PortfolioExport = ({ portfolioData, summaryData }) => {
  const [downloading, setDownloading] = useState(false);

  const exportToCSV = () => {
    setDownloading(true);
    try {
      const ws = XLSX.utils.json_to_sheet(portfolioData.map(item => ({
        Symbol: item.symbol,
        'Liczba akcji': item.shares,
        'Średnia cena': item.avgPrice.toFixed(2),
        'Wartość całkowita': item.totalValue.toFixed(2),
        'Data pierwszej transakcji': item.firstPurchaseDate.toLocaleDateString(),
        'Data ostatniej transakcji': item.lastTransactionDate.toLocaleDateString()
      })));
      
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Portfolio");
      XLSX.writeFile(wb, "portfolio_export.xlsx");
    } catch (error) {
      console.error('Błąd podczas eksportu do CSV:', error);
    }
    setDownloading(false);
  };

  const exportToPDF = () => {
    setDownloading(true);
    try {
      const doc = new jsPDF();
      
      // Dodaj tytuł
      doc.setFontSize(18);
      doc.text("Raport Portfolio", 14, 20);
      
      // Dodaj podsumowanie
      doc.setFontSize(12);
      doc.text(`Wartość całkowita: $${summaryData.totalValue.toFixed(2)}`, 14, 30);
      doc.text(`Liczba pozycji: ${portfolioData.length}`, 14, 37);
      
      // Przygotuj dane do tabeli
      const tableData = portfolioData.map(item => [
        item.symbol,
        item.shares.toString(),
        `$${item.avgPrice.toFixed(2)}`,
        `$${item.totalValue.toFixed(2)}`,
        item.firstPurchaseDate.toLocaleDateString()
      ]);
      
      // Dodaj tabelę
      doc.autoTable({
        head: [['Symbol', 'Liczba akcji', 'Średnia cena', 'Wartość', 'Data zakupu']],
        body: tableData,
        startY: 45,
        theme: 'grid'
      });
      
      doc.save("portfolio_report.pdf");
    } catch (error) {
      console.error('Błąd podczas eksportu do PDF:', error);
    }
    setDownloading(false);
  };

  return (
    <div className="flex gap-3 mb-6">
      <button
        onClick={exportToCSV}
        disabled={downloading}
        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white transition-colors"
      >
        <FaFileExcel />
        Eksportuj do Excel
      </button>
      <button
        onClick={exportToPDF}
        disabled={downloading}
        className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white transition-colors"
      >
        <FaFilePdf />
        Eksportuj do PDF
      </button>
    </div>
  );
};

export default PortfolioExport;