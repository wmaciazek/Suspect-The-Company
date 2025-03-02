import React, { useEffect, useState } from 'react';
import { fetchFinancialIndicators } from '../lib/api';
import Indicator from './Indicator';

const Indicators = ({ ticker }) => {
  const [indicatorsData, setIndicators] = useState([]);
  const [currency, setCurrency] = useState(null); 

  useEffect(() => {
    const fetchIndicators = async () => {
      try {
        const data = await fetchFinancialIndicators(ticker);
        setIndicators(data);

        const currencyData = data.find(item => item.name === "financialCurrency")?.value;
        setCurrency(currencyData || null); 
      } catch (error) {
        console.error('Error fetching indicators:', error);
      }
    };

    fetchIndicators();
  }, [ticker]);

  const filteredIndicatorsData = indicatorsData.filter(item => item.name !== "financialCurrency");

  return (
    <div className="ml-5 p-4 shadow-md rounded-md">
      <h2 className="text-xl font-bold mb-4">Wskazniki dla: {ticker}</h2>
      <div className="p-4 space-y-4">
        {filteredIndicatorsData.map((indicator, index) => (
          <Indicator
            key={index}
            name={indicator.name}
            description={indicator.description}
            value={indicator.value}
            currency={currency}
          />
        ))}
      </div>
    </div>
  );
};

export default Indicators;