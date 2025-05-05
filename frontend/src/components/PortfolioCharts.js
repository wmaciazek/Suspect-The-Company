'use client'
import { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import { FaChartPie, FaChartBar } from 'react-icons/fa';

const PortfolioCharts = ({ portfolioData }) => {
  const pieChartRef = useRef(null);
  const barChartRef = useRef(null);
  const pieChart = useRef(null);
  const barChart = useRef(null);

  useEffect(() => {
    if (portfolioData.length === 0) return;

    if (pieChart.current) {
      pieChart.current.destroy();
    }
    if (barChart.current) {
      barChart.current.destroy();
    }

    const labels = portfolioData.map(item => item.symbol);
    const values = portfolioData.map(item => item.totalValue);
    const colors = generateColors(portfolioData.length);

    pieChart.current = new Chart(pieChartRef.current, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: values,
          backgroundColor: colors,
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              color: 'rgb(156, 163, 175)'
            }
          },
          title: {
            display: true,
            text: 'Podział portfela',
            color: 'rgb(156, 163, 175)',
            font: {
              size: 16
            }
          }
        }
      }
    });

    barChart.current = new Chart(barChartRef.current, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Wartość pozycji ($)',
          data: values,
          backgroundColor: colors,
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(156, 163, 175, 0.1)'
            },
            ticks: {
              color: 'rgb(156, 163, 175)'
            }
          },
          x: {
            grid: {
              display: false
            },
            ticks: {
              color: 'rgb(156, 163, 175)'
            }
          }
        },
        plugins: {
          legend: {
            display: false
          },
          title: {
            display: true,
            text: 'Wartość pozycji w portfelu',
            color: 'rgb(156, 163, 175)',
            font: {
              size: 16
            }
          }
        }
      }
    });
  }, [portfolioData]);

  const generateColors = (count) => {
    const colors = [];
    for (let i = 0; i < count; i++) {
      colors.push(`hsl(${(i * 360) / count}, 70%, 50%)`);
    }
    return colors;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <div className="bg-gray-800 p-6 rounded-lg">
        <div className="flex items-center gap-2 mb-4">
          <FaChartPie className="text-blue-500" />
          <h3 className="text-lg font-semibold">Struktura portfela</h3>
        </div>
        <canvas ref={pieChartRef} />
      </div>
      <div className="bg-gray-800 p-6 rounded-lg">
        <div className="flex items-center gap-2 mb-4">
          <FaChartBar className="text-blue-500" />
          <h3 className="text-lg font-semibold">Porównanie wartości</h3>
        </div>
        <canvas ref={barChartRef} />
      </div>
    </div>
  );
};

export default PortfolioCharts;