import React, { useEffect, useState } from 'react';
import { fetchFinancialIndicators } from '../lib/api';

const Indicators = ({ ticker }) => {
  const [indicators, setIndicators] = useState({});

  useEffect(() => {
    const fetchIndicators = async () => {
      try {
        const data = await fetchFinancialIndicators(ticker);
        setIndicators(data);
      } catch (error) {
        console.error('Error fetching indicators:', error);
      }
    };

    fetchIndicators();
  }, [ticker]);

  return (
    <div className="ml-5 p-4 shadow-md rounded-md">
      <h2 className="text-xl font-bold mb-4">Wskazniki dla: {ticker}</h2>
      <div className="space-y-2">
        <p><strong>ROA:</strong> {indicators.returnOnAssets}</p>
        <p><strong>ROE:</strong> {indicators.returnOnEquity}</p>
        <p>Okres liczenia - <strong>{indicators.period}</strong></p>
      </div>
    </div>
  );
};

export default Indicators;