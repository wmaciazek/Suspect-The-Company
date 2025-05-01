'use client';
import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { fetchStockDataInComponent } from '@/lib/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const StockChart = ({ stockData, period, interval, realTimePrice }) => {
  const [compareTickerInput, setCompareTickerInput] = useState('');
  const [comparisonData, setComparisonData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [chartDataState, setChartDataState] = useState(null);

  const getColumnNames = (data, ticker = '') => {
    if (!data || !data[0]) {
      console.error('Brak danych do analizy kolumn');
      return { dateCol: null, closeCol: null };
    }

    const columns = Object.keys(data[0]);
    const dateCol = columns.find(col => 
      col === 'Date_' || 
      col === 'Datetime_' || 
      col.toLowerCase().includes('date') || 
      col.toLowerCase().includes('time')
    );

    let closeCol;
    if (ticker) {
      closeCol = `Close_${ticker.toUpperCase()}`;
    } else {
      closeCol = columns.find(col => col.startsWith('Close_')) || 'Close';
    }

    return { dateCol, closeCol };
  };

  const processData = (data, ticker = '') => {
    if (!data || data.length === 0) {
      console.error('Brak danych do przetworzenia');
      return [];
    }

    const { dateCol, closeCol } = getColumnNames(data, ticker);
    
    if (!dateCol || !closeCol) {
      console.error('Nie znaleziono wymaganych kolumn:', { dateCol, closeCol });
      return [];
    }

    const processedData = data
      .map((row, index) => {
        if (!row || Object.keys(row).length === 0) {
          console.error(`Pusty wiersz na indeksie ${index}`);
          return null;
        }

        const rawValue = row[closeCol];
        const rawDate = row[dateCol];

        if (!rawValue || !rawDate) {
          console.error(`Brak wymaganych wartości w wierszu ${index}:`, row);
          return null;
        }

        const value = typeof rawValue === 'string' 
          ? parseFloat(rawValue.replace(',', '.'))
          : parseFloat(rawValue);

        let date;
        try {
          if (typeof rawDate === 'string') {
            date = new Date(rawDate).getTime();
          } else if (typeof rawDate === 'number') {
            date = rawDate;
          } else {
            throw new Error('Nieobsługiwany format daty');
          }

          if (isNaN(date)) {
            throw new Error('Nieprawidłowa data');
          }
        } catch (err) {
          console.error(`Błąd konwersji daty w wierszu ${index}:`, { rawDate, error: err.message });
          return null;
        }

        if (isNaN(value)) {
          console.error(`Błąd konwersji wartości w wierszu ${index}:`, rawValue);
          return null;
        }

        return { date, value };
      })
      .filter(item => item !== null)
      .sort((a, b) => a.date - b.date);

    return processedData;
  };

  useEffect(() => {
    try {
      if (!stockData || stockData.length === 0) {
        return;
      }
      
      const baseData = processData(stockData);
      if (baseData.length === 0) {
        throw new Error('Nie udało się przetworzyć danych głównych');
      }

      let compareData = null;
      if (comparisonData && comparisonData.length > 0) {
        compareData = processData(comparisonData, compareTickerInput);
        if (compareData.length === 0) {
          throw new Error('Nie udało się przetworzyć danych porównawczych');
        }
      }

      let startDate = baseData[0].date;
      let endDate = baseData[baseData.length - 1].date;

      if (compareData && compareData.length > 0) {
        startDate = Math.max(startDate, compareData[0].date);
        endDate = Math.min(endDate, compareData[compareData.length - 1].date);
      }

      const filteredBaseData = baseData.filter(d => d.date >= startDate && d.date <= endDate);
      const filteredCompareData = compareData?.filter(d => d.date >= startDate && d.date <= endDate);

      const formatDate = (date) => {
        const dateObj = new Date(date);
        const isMinuteInterval = interval && interval.includes('min');
        
        if (isMinuteInterval) {
          const hours = dateObj.getHours().toString().padStart(2, '0');
          const minutes = dateObj.getMinutes().toString().padStart(2, '0');
          const day = dateObj.getDate().toString().padStart(2, '0');
          const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
          return `${day}.${month} ${hours}:${minutes}`;
        }
        
        return dateObj.toLocaleDateString('pl-PL', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
      };

      const labels = filteredBaseData.map(row => formatDate(row.date));

      const datasets = [
        {
          label: 'Cena akcji',
          data: filteredBaseData.map(row => row.value),
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
          tension: 0.1,
          pointRadius: 0,
        }
      ];

      if (filteredCompareData && filteredCompareData.length > 0) {
        datasets.push({
          label: `${compareTickerInput.toUpperCase()} - Cena akcji`,
          data: filteredCompareData.map(row => row.value),
          borderColor: 'rgb(255, 159, 64)',
          backgroundColor: 'rgba(255, 159, 64, 0.5)',
          tension: 0.1,
          pointRadius: 0,
        });
      }

      setChartDataState({ labels, datasets });
      setError(null);
    } catch (err) {
      console.error('Błąd podczas przetwarzania danych:', err);
      setError(`Błąd przetwarzania danych: ${err.message}`);
      setChartDataState(null);
    }
  }, [stockData, comparisonData, compareTickerInput, period, interval]);

  const handleCompareStock = async () => {
    if (!compareTickerInput) return;

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetchStockDataInComponent(compareTickerInput, period, interval);

      if (response && response.stockData && response.stockData.length > 0) {
        setComparisonData(response.stockData);
      } else {
        throw new Error('Otrzymano nieprawidłowe dane z API');
      }
    } catch (err) {
      console.error('Błąd podczas pobierania danych porównawczych:', err);
      setError('Nie udało się pobrać danych dla porównywanego tickera');
      setComparisonData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveComparison = () => {
    setComparisonData(null);
    setCompareTickerInput('');
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
          color: 'white'
        }
      },
      title: {
        display: true,
        text: 'Wykres ceny akcji',
        color: 'white'
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.parsed.y?.toFixed(2) || 'N/A'} USD`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
          drawOnChartArea: true,
        },
        ticks: {
          color: 'white',
          maxRotation: 45,
          minRotation: 45,
          autoSkip: true,
          maxTicksLimit: 12,
          callback: function(val, index) {
            const label = this.getLabelForValue(val);
            const totalPoints = this.chart.data.labels.length;
            
            // Zawsze pokaż pierwszą i ostatnią etykietę
            if (index === 0 || index === totalPoints - 1) return label;
            
            // Dla interwałów minutowych
            if (interval && interval.includes('min')) {
              const skipFactor = Math.ceil(totalPoints / 10);
              return index % skipFactor === 0 ? label : '';
            }
            
            // Dla innych interwałów
            return index % 2 === 0 ? label : '';
          },
          font: {
            size: 9,
            weight: 'bold'
          },
          padding: 8
        }
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: 'white',
          callback: function(value) {
            return value.toFixed(2) + ' USD';
          }
        }
      }
    }
  };

  if (!stockData || stockData.length === 0) {
    return <div className="text-white">Brak danych do wyświetlenia</div>;
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex items-center gap-4 mb-4">
        <div className="flex-grow">
          <input
            type="text"
            value={compareTickerInput}
            onChange={(e) => setCompareTickerInput(e.target.value.toUpperCase())}
            placeholder="Wprowadź ticker do porównania..."
            className="w-full px-4 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <button
          onClick={handleCompareStock}
          disabled={loading || !compareTickerInput}
          className={`px-4 py-2 rounded-md ${
            loading || !compareTickerInput
              ? 'bg-gray-600 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700'
          } text-white transition-colors`}
        >
          {loading ? 'Ładowanie...' : 'Porównaj'}
        </button>
        {comparisonData && (
          <button
            onClick={handleRemoveComparison}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
          >
            Usuń porównanie
          </button>
        )}
      </div>
      
      {error && (
        <div className="text-red-500 mb-4">
          {error}
        </div>
      )}

      <div className="h-[400px]">
        {chartDataState && <Line data={chartDataState} options={chartOptions} />}
      </div>

      <div className="mt-4 text-xs text-gray-400">
        {stockData && stockData.length > 0 && (
          <>
            <div>Kolumny: {Object.keys(stockData[0]).join(', ')}</div>
            <div>Interwał: {interval}</div>
            <div>Okres: {period}</div>
            <div>Liczba punktów danych: {stockData.length}</div>
          </>
        )}
      </div>
    </div>
  );
};

export default StockChart;