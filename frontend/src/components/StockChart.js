'use client';
import React from 'react';
import { Line } from 'react-chartjs-2';
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

const StockChart = ({ stockData }) => {
  if (!stockData || stockData.length === 0) {
    return <div className="text-white">brak danych</div>;
  }

  const closeCol = Object.keys(stockData[0]).find(key => key.toLowerCase().includes('close'));
  const dateCol = Object.keys(stockData[0]).find(key => key.toLowerCase().includes('date'));

  if (!closeCol || !dateCol) {
    return <div className="text-white">brak kolumn -- blad</div>;
  }

  const formattedStockData = stockData.map(row => ({
    ...row,
    Date: new Date(row[dateCol])
  }));

  const chartData = {
    labels: formattedStockData.map(row => {
      const date = new Date(row.Date);
      return date.toLocaleDateString('pl-PL', { 
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    }),
    datasets: [
      {
        label: 'Cena akcji',
        data: formattedStockData.map(row => row[closeCol]),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        tension: 0.1,
        pointRadius: 0,
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
            return `${context.dataset.label}: ${context.parsed.y.toFixed(2)} USD`;
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

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="h-[400px]">
        <Line data={chartData} options={chartOptions} />
      </div>
    </div>
  );
};

export default StockChart;