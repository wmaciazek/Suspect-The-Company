import React from 'react';
import Plot from 'react-plotly.js';

const StockChart = ({ stockData, smaData }) => {
  if (!stockData || stockData.length === 0) {
    return <div>Brak danych do wyświetlenia.</div>;
  }

  const closeCol = Object.keys(stockData[0]).find(key => key.toLowerCase().includes('close'));

  if (!closeCol) {
    return <div>Błąd: Nie znaleziono kolumny z ceną zamknięcia.</div>;
  }

    // *** FORMATOWANIE DAT ABY STWORZYC WYKRES ***
    const formattedStockData = stockData.map(row => ({
      ...row,
      Date: new Date(row.Date_) // zamiana kolumny na obiekt
    }));

    const formattedSmaData = smaData.map(row => ({
      ...row,
      Date: new Date(row.Date_)
    }));

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
    xaxis: { title: 'Data', type: 'date' }, 
    yaxis: { title: 'Cena', fixedrange: false },
    dragmode: 'zoom',
    hovermode: 'closest'
  };

  return (
    <Plot
      data={[trace1,trace2]}
      layout={layout}
      style={{ width: '100%', height: '400px' }}
      config={{ responsive: true }}
    />
  );
};

export default StockChart;