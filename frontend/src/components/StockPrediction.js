'use client';
import React, { useState, useEffect } from 'react';
import { fetchStockPrediction } from '@/lib/api';
import { Line } from 'react-chartjs-2';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const StockPrediction = ({ ticker }) => {
  const [predictionData, setPredictionData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [historicalPeriod, setHistoricalPeriod] = useState(6);

  useEffect(() => {
    const loadPrediction = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchStockPrediction(ticker);
        setPredictionData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (ticker) {
      loadPrediction();
    }
  }, [ticker]);

  const exportToExcel = () => {
    if (!predictionData) return;

    const workbook = XLSX.utils.book_new();
    
    // Przygotuj dane historyczne
    const historicalWorksheet = XLSX.utils.json_to_sheet(
      filteredHistoricalData.map(d => ({
        Data: d.date,
        'Cena historyczna': d.value
      }))
    );
    XLSX.utils.book_append_sheet(workbook, historicalWorksheet, "Dane historyczne");

    // Przygotuj dane predykcyjne
    const predictionWorksheet = XLSX.utils.json_to_sheet(
      predictionData.predictionData.map(d => ({
        Data: d.date,
        'Predykcja': d.value,
        'Górny przedział': d.upper_bound,
        'Dolny przedział': d.lower_bound
      }))
    );
    XLSX.utils.book_append_sheet(workbook, predictionWorksheet, "Predykcja");

    // Zapisz plik
    const fileName = `${ticker}_prediction_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const exportToPDF = () => {
    if (!predictionData) return;

    try {
      const pdf = new jsPDF();
      
      // Dodaj tytuł
      pdf.setFontSize(16);
      pdf.text(`Predykcja cen dla ${ticker}`, 20, 20);
      
      // Dodaj informacje o dacie generowania
      pdf.setFontSize(10);
      pdf.text(`Wygenerowano: ${new Date().toLocaleString()}`, 20, 30);
      
      // Użyj autoTable bezpośrednio
      pdf.autoTable({
        head: [['Data', 'Cena historyczna']],
        body: filteredHistoricalData.map(d => [
          d.date,
          d.value.toFixed(2)
        ]),
        startY: 40,
        headStyles: { fillColor: [66, 66, 66] },
        margin: { top: 40 },
      });
      
      // Dodaj dane predykcyjne na nowej stronie
      pdf.addPage();
      pdf.autoTable({
        head: [['Data', 'Predykcja', 'Górny przedział', 'Dolny przedział']],
        body: predictionData.predictionData.map(d => [
          d.date,
          d.value.toFixed(2),
          d.upper_bound.toFixed(2),
          d.lower_bound.toFixed(2)
        ]),
        headStyles: { fillColor: [66, 66, 66] },
      });

      // Zapisz wykres jako obrazek i dodaj go do PDF
      const chartCanvas = document.querySelector('canvas');
      if (chartCanvas) {
        const chartImage = chartCanvas.toDataURL('image/jpeg', 1.0);
        pdf.addPage();
        pdf.text('Wykres predykcji', 20, 20);
        pdf.addImage(chartImage, 'JPEG', 20, 30, 170, 100);
      }

      // Zapisz plik
      const fileName = `${ticker}_prediction_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Błąd podczas generowania PDF:', error);
    }
  };

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full text-red-500 p-4 text-center">
        {error}
      </div>
    );
  }

  if (!predictionData) return null;

  const cutoffDate = new Date();
  cutoffDate.setMonth(cutoffDate.getMonth() - historicalPeriod);

  const filteredHistoricalData = predictionData.historicalData.filter(d => {
    const date = new Date(d.date);
    return date >= cutoffDate;
  });

  const chartData = {
    labels: [
      ...filteredHistoricalData.map(d => d.date),
      ...predictionData.predictionData.map(d => d.date)
    ],
    datasets: [
      {
        label: 'Dane historyczne',
        data: filteredHistoricalData.map(d => d.value),
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
        pointRadius: 0,
      },
      {
        label: 'Predykcja',
        data: [
          ...Array(filteredHistoricalData.length).fill(null),
          ...predictionData.predictionData.map(d => d.value)
        ],
        borderColor: 'rgb(255, 99, 132)',
        borderDash: [5, 5],
        tension: 0.1,
        pointRadius: 0,
      },
      {
        label: 'Górny przedział ufności',
        data: [
          ...Array(filteredHistoricalData.length).fill(null),
          ...predictionData.predictionData.map(d => d.upper_bound)
        ],
        borderColor: 'rgba(255, 99, 132, 0.2)',
        backgroundColor: 'rgba(255, 99, 132, 0.1)',
        borderDash: [5, 5],
        tension: 0.1,
        pointRadius: 0,
        fill: 1
      },
      {
        label: 'Dolny przedział ufności',
        data: [
          ...Array(filteredHistoricalData.length).fill(null),
          ...predictionData.predictionData.map(d => d.lower_bound)
        ],
        borderColor: 'rgba(255, 99, 132, 0.2)',
        tension: 0.1,
        pointRadius: 0,
        fill: false
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: 'white',
          padding: 10,
          font: {
            size: 12
          }
        }
      },
      title: {
        display: true,
        text: `Predykcja dla ${ticker}`,
        color: 'white',
        font: {
          size: 16,
          weight: 'bold'
        },
        padding: {
          top: 10,
          bottom: 20
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.parsed.y.toFixed(2)} USD`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
          drawBorder: false,
        },
        ticks: {
          color: 'white',
          maxRotation: 45,
          minRotation: 45,
          font: {
            size: 11
          }
        }
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
          drawBorder: false,
        },
        ticks: {
          color: 'white',
          font: {
            size: 11
          },
          callback: function(value) {
            return value.toFixed(2) + ' USD';
          }
        }
      }
    }
  };

  return (
    <div className="w-full bg-gray-800 rounded-lg p-4 mt-5">
      <div className="w-full flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-white">Predykcja cen na następne 30 dni</h2>
        <div className="flex items-center space-x-4">
          <select
            value={historicalPeriod}
            onChange={(e) => setHistoricalPeriod(Number(e.target.value))}
            className="bg-gray-700 text-white rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value={1}>Ostatni miesiąc</option>
            <option value={3}>Ostatnie 3 miesiące</option>
            <option value={6}>Ostatnie 6 miesięcy</option>
            <option value={12}>Ostatni rok</option>
          </select>
          
          {/* Przyciski eksportu */}
          <div className="flex space-x-2">
            <button
              onClick={exportToExcel}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-1 rounded-md flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Excel</span>
            </button>
            <button
              onClick={exportToPDF}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-1 rounded-md flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>PDF</span>
            </button>
          </div>
        </div>
      </div>
      <div className="w-full h-[400px]">
        <Line data={chartData} options={chartOptions} />
      </div>
      <div className="w-full mt-4 text-sm text-gray-400">
        * Predykcja oparta na danych historycznych z ostatnich {historicalPeriod} {historicalPeriod === 1 ? 'miesiąca' : 'miesięcy'}
      </div>
    </div>
  );
};

export default StockPrediction;