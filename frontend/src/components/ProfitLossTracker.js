'use client'
import { useState, useEffect } from 'react';
import { FaArrowUp, FaArrowDown } from 'react-icons/fa';
import toast from 'react-hot-toast';

const ProfitLossTracker = ({ portfolioData }) => {
  const [profitLoss, setProfitLoss] = useState({
    total: 0,
    percentage: 0,
    isProfit: true
  });

  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchStockPrice = async (symbol) => {
    try {
      const response = await fetch(`/api/stock-price?symbol=${symbol}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.c) {
        return Number(data.c);
      } else if (data.error) {
        console.error(`API Error dla ${symbol}:`, data.error);
        return null;
      }
      
      return null;
    } catch (error) {
      console.error(`Błąd dla ${symbol}:`, error);
      return null;
    }
  };

  const fetchCurrentPrices = async () => {
    setLoading(true);
    const newPrices = {};
    let hasError = false;

    try {
      const pricePromises = portfolioData.map(async (position) => {
        const price = await fetchStockPrice(position.symbol);
        if (price !== null) {
          newPrices[position.symbol] = price;
        } else {
          hasError = true;
        }
      });

      await Promise.all(pricePromises);

      if (hasError) {
        toast.error('Nie udało się pobrać niektórych cen');
      }

      setPrices(newPrices);
      console.log('Zaktualizowane ceny:', newPrices);
    } catch (error) {
      console.error('Błąd podczas pobierania cen:', error);
      toast.error('Wystąpił błąd podczas aktualizacji cen');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (portfolioData && portfolioData.length > 0) {
      fetchCurrentPrices();
      const interval = setInterval(fetchCurrentPrices, 60000); // Odświeżaj co minutę
      return () => clearInterval(interval);
    }
  }, [portfolioData]);

  useEffect(() => {
    let totalProfitLoss = 0;
    let totalInvestment = 0;

    portfolioData.forEach(position => {
      const currentPrice = prices[position.symbol] || position.avgPrice;
      const profitLoss = (currentPrice - position.avgPrice) * position.shares;
      totalProfitLoss += profitLoss;
      totalInvestment += position.avgPrice * position.shares;
    });

    const percentage = totalInvestment > 0 ? (totalProfitLoss / totalInvestment) * 100 : 0;

    setProfitLoss({
      total: totalProfitLoss,
      percentage: percentage,
      isProfit: totalProfitLoss >= 0
    });
  }, [prices, portfolioData]);

  return (
    <div className="bg-gray-800 p-6 rounded-lg mb-6">
      <h3 className="text-lg font-semibold mb-4">
        Zysk/Strata w czasie rzeczywistym
        {loading && <span className="ml-2 text-sm text-gray-400">(aktualizowanie...)</span>}
      </h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-gray-400 text-sm">Całkowity zysk/strata</p>
          <p className={`text-2xl font-bold flex items-center gap-2 
            ${profitLoss.isProfit ? 'text-green-500' : 'text-red-500'}`}>
            {profitLoss.isProfit ? <FaArrowUp /> : <FaArrowDown />}
            ${Math.abs(profitLoss.total).toFixed(2)}
          </p>
        </div>
        <div>
          <p className="text-gray-400 text-sm">Zmiana procentowa</p>
          <p className={`text-2xl font-bold flex items-center gap-2
            ${profitLoss.isProfit ? 'text-green-500' : 'text-red-500'}`}>
            {profitLoss.isProfit ? <FaArrowUp /> : <FaArrowDown />}
            {Math.abs(profitLoss.percentage).toFixed(2)}%
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProfitLossTracker;