import React from 'react';
import Plot from 'react-plotly.js';

const StockChart = ({ stockData, smaData }) => {
  if (!stockData || stockData.length === 0) {
    return <div>brak danych</div>;
  }

  const closeCol = Object.keys(stockData[0]).find(key => key.toLowerCase().includes('close'));
  const dateCol = Object.keys(stockData[0]).find(key => key.toLowerCase().includes('date'));

  if (!closeCol || !dateCol) {
    return <div>brak kolumn -- blad</div>;
  }

  const formattedStockData = stockData.map(row => ({
    ...row,
    Date: new Date(row[dateCol])
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
    line: { color: 'lightblue', width: 1 }, 
    hovertemplate: `<b>Cena: %{y:.2f} USD</b><br>%{x}<extra></extra>`,
  };
  const trace2 = {
    type: 'scatter',
    mode: 'lines', 
    name: 'SMA 50',
    x: formattedSmaData.map(row => row.Date),
    y: formattedSmaData.map(row => row.SMA_50),
    line: { color: 'orange', width: 2 } 
  };

  const layout = {
    title: `Wykres`,  
    xaxis: {
        title: 'Data',
        type: 'date',
        tickformat: '%Y-%m-%d %H:%M',
        autorange: true, 
        showgrid: true,
        gridcolor: '#444',
        zeroline: false,
    },
    yaxis: {
      title: 'Cena (USD)',
      autorange: true,
      fixedrange: false,
      showgrid: true,
      gridcolor: '#444',
      zeroline: false,
    },
    showlegend: true, 
    plot_bgcolor: '#222',  
    paper_bgcolor: '#222', 
    font: { color: '#eee' }
  };

  return (
    <Plot
      data={[trace1, trace2]}
      layout={layout}
      style={{ width: '100%', height: '400px' }}
      config={{ responsive: true, displayModeBar: false }}
    />
  );
};

export default StockChart;