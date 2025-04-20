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

const StockChart = ({ stockData, period, interval }) => {
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
    console.log('Dostępne kolumny:', columns);

    // Szukamy kolumny z datą
    const dateCol = 'Date_';

    // Szukamy kolumny z ceną zamknięcia dla konkretnego tickera
    let closeCol;
    if (ticker) {
      closeCol = `Close_${ticker.toUpperCase()}`;
    } else {
      closeCol = columns.find(col => col.startsWith('Close_'));
    }

    console.log('Wybrane kolumny:', { dateCol, closeCol, ticker });
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

    console.log('Rozpoczęcie przetwarzania danych z kolumnami:', { dateCol, closeCol });

    const processedData = data
      .map((row, index) => {
        const rawValue = row[closeCol];
        const rawDate = row[dateCol];

        if (rawValue === undefined || rawValue === null || rawDate === undefined || rawDate === null) {
          console.error(`Brak wartości w wierszu ${index}:`, row);
          return null;
        }

        const value = typeof rawValue === 'string' 
          ? parseFloat(rawValue.replace(',', '.'))
          : parseFloat(rawValue);

        // Konwersja daty
        let date;
        try {
          date = new Date(rawDate).getTime();
          if (isNaN(date)) {
            throw new Error('Invalid date');
          }
        } catch (err) {
          console.error(`Błąd konwersji daty w wierszu ${index}:`, rawDate);
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

    console.log(`Przetworzono ${processedData.length} wierszy danych`);
    return processedData;
  };

  useEffect(() => {
    try {
      if (!stockData || stockData.length === 0) {
        console.log('Brak danych głównych');
        return;
      }

      console.log('Przykładowy wiersz danych:', stockData[0]);
      console.log('Rozpoczęcie przetwarzania danych...');
      
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

      // Synchronizacja zakresu dat
      let startDate = baseData[0].date;
      let endDate = baseData[baseData.length - 1].date;

      if (compareData && compareData.length > 0) {
        startDate = Math.max(startDate, compareData[0].date);
        endDate = Math.min(endDate, compareData[compareData.length - 1].date);
      }

      const filteredBaseData = baseData.filter(d => d.date >= startDate && d.date <= endDate);
      const filteredCompareData = compareData?.filter(d => d.date >= startDate && d.date <= endDate);

      const labels = filteredBaseData.map(row => 
        new Date(row.date).toLocaleDateString('pl-PL', { 
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        })
      );

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
      setError(err.message);
      setChartDataState(null);
    }
  }, [stockData, comparisonData, compareTickerInput]);

  const handleCompareStock = async () => {
    if (!compareTickerInput) return;

    try {
      setLoading(true);
      setError(null);
      console.log('Pobieranie danych porównawczych:', { ticker: compareTickerInput, period, interval });
      
      const response = await fetchStockDataInComponent(compareTickerInput, period, interval);
      console.log('Odpowiedź API dla porównania:', response);

      if (response && response.stockData && response.stockData.length > 0) {
        setComparisonData(response.stockData);
        console.log('Ustawiono dane porównawcze:', response.stockData);
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
    console.log('Usunięto dane porównawcze');
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
        },
        ticks: {
          color: 'white',
          maxRotation: 45,
          minRotation: 45
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
    return <div className="text-white">brak danych</div>;
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

      {/* Debug info */}
      <div className="mt-4 text-xs text-gray-400">
        {stockData && stockData.length > 0 && (
          <>
            <div>Kolumny: {Object.keys(stockData[0]).join(', ')}</div>
            <div>Przykładowe dane: {JSON.stringify(stockData[0])}</div>
          </>
        )}
      </div>
    </div>
  );
};

export default StockChart;