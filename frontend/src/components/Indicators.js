'use client';
import React, { useEffect, useState } from 'react';
import { fetchFinancialIndicators } from '../lib/api';
import { motion } from 'framer-motion';
import { formatNumber } from '../utils/numberFormatter'; // Trzeba będzie stworzyć ten plik

const Indicators = ({ ticker }) => {
  const [indicatorsData, setIndicators] = useState([]);
  const [currency, setCurrency] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = {
    all: 'Wszystkie wskaźniki',
    valuation: 'Wycena',
    profitability: 'Rentowność',
    liquidity: 'Płynność'
  };

  const indicatorCategories = {
    marketCap: 'valuation',
    trailingPE: 'valuation',
    forwardPE: 'valuation',
    dividendYield: 'valuation',
    returnOnEquity: 'profitability',
    returnOnAssets: 'profitability',
    totalRevenue: 'profitability',
    grossMargins: 'profitability',
    freeCashflow: 'liquidity',
    totalDebt: 'liquidity',
    totalCash: 'liquidity'
  };

  const indicatorDescriptions = {
    marketCap: 'Kapitalizacja rynkowa - całkowita wartość rynkowa firmy',
    trailingPE: 'Wskaźnik C/Z (historyczny) - cena akcji/zysk na akcję',
    forwardPE: 'Wskaźnik C/Z (prognozowany) - cena/przewidywany zysk',
    dividendYield: 'Stopa dywidendy - dywidenda/cena akcji',
    returnOnEquity: 'Zwrot z kapitału własnego (ROE)',
    returnOnAssets: 'Zwrot z aktywów (ROA)',
    totalRevenue: 'Całkowite przychody firmy',
    grossMargins: 'Marża brutto - (przychód-koszty)/przychód',
    freeCashflow: 'Wolne przepływy pieniężne',
    totalDebt: 'Całkowite zadłużenie',
    totalCash: 'Gotówka i ekwiwalenty'
  };

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

  const filteredIndicatorsData = indicatorsData
    .filter(item => item.name !== "financialCurrency")
    .filter(item => selectedCategory === 'all' || indicatorCategories[item.name] === selectedCategory);

  return (
    <div className="bg-gray-800 rounded-lg p-6 mt-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-4">
          Wskaźniki finansowe dla {ticker}
        </h2>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {Object.entries(categories).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setSelectedCategory(key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap
                ${selectedCategory === key
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredIndicatorsData.map((indicator, index) => (
          <motion.div
            key={indicator.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <div className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <div className="text-gray-300 font-medium">
                    {indicator.name}
                  </div>
                  <div className="text-right">
                    <div className="text-white font-bold">
                      {formatNumber(indicator.value)}
                      {currency && [
                        'marketCap',
                        'totalRevenue',
                        'freeCashflow',
                        'totalDebt',
                        'totalCash'
                      ].includes(indicator.name) ? ` ${currency}` : ''}
                    </div>
                  </div>
                </div>
                <div className="text-sm text-gray-400">
                  {indicatorDescriptions[indicator.name]}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Indicators;