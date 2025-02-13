import React from 'react';
import Plot from 'react-plotly.js';

const StockChart = ({ stockData, smaData }) => {
  console.log("StockChart: stockData:", stockData);
  console.log("StockChart: smaData:", smaData);

  if (!stockData || stockData.length === 0) {
    console.log("StockChart: Brak danych (stockData)");
    return <div>Brak danych do wyświetlenia.</div>;
  }

  // 'close'
  const closeCol = Object.keys(stockData[0]).find(key => key.toLowerCase().includes('close'));
  if (!closeCol) {
    console.log("StockChart: Nie znaleziono kolumny Close");
    return <div>Błąd: Nie znaleziono kolumny z ceną zamknięcia.</div>;
  }

  // 'date_'
  const dateCol = Object.keys(stockData[0]).find(key => key.toLowerCase().includes('date'));
  console.log("StockChart: dateCol:", dateCol); // DEBUG

  if (!dateCol) {
    console.log("StockChart: Nie znaleziono kolumny z datą");
    return <div>Błąd: Nie znaleziono kolumny z datą.</div>;
  }

  // formatowanie daty
    const formattedStockData = stockData.map(row => ({
        ...row,
        Date: new Date(row[dateCol]) 
    }));

    const formattedSmaData = smaData.map(row => ({
        ...row,
        Date: new Date(row.Date_)
    }));
    console.log("StockChart: formattedSmaData:", formattedSmaData)

  console.log("StockChart: formattedStockData:", formattedStockData);

  // tworzenie wykresu
  const trace1 = {
    type: 'scatter',
    mode: 'lines',
    name: 'Cena akcji',
    x: formattedStockData.map(row => row.Date), 
    y: formattedStockData.map(row => row[closeCol]),
    line: { color: '#17BECF' }
  };
  const trace2 = {
    type: 'scatter',
    mode: 'lines',
    name: 'SMA_50',
    x: formattedSmaData.map(row => row.Date),
    y: formattedSmaData.map(row => row.SMA_50),
    line: {color: '#ff7f0e'}
  }

  const layout = {
    title: 'Wykres cen akcji',
    xaxis: {
        title: 'Data',
        type: 'date',
        tickformat: '%Y-%m-%d %H:%M', // format dla interwałów
    },
    yaxis: { title: 'Cena', fixedrange: false },
    dragmode: 'zoom',
    hovermode: 'closest'
  };

  console.log("StockChart: layout:", layout)
  return (
    <Plot
      data={[trace1, trace2]}
      layout={layout}
      style={{ width: '100%', height: '400px' }}
      config={{ responsive: true }}
    />
  );
};

export default StockChart;