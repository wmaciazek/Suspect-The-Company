'use client';
import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { fetchStockData } from '@/lib/api';

const StockChart = dynamic(() => import('@/components/StockChart'), {
  ssr: false,
});

const HomePage = () => {
  const [companyName, setCompanyName] = useState('');
  const [stockData, setStockData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('1mo'); // Domyślny okres
  const [interval, setInterval] = useState('1d'); // Domyślny interwał

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setStockData(null);

    try {
      const data = await fetchStockData(companyName, period, interval);
      setStockData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // POPRAWIONA handlePeriodChange
 const handlePeriodChange = (e) => {
    const newPeriod = e.target.value;
    setPeriod(newPeriod); //Zawsze zmieniamy period

    // Jeśli okres jest *dłuższy* niż 5 dni, ustaw interwał na 1d
    if (!['1d', '5d'].includes(newPeriod)) {
      setInterval('1d');
    }
  };

  // POPRAWIONA handleIntervalChange
  const handleIntervalChange = (e) => {
    const newInterval = e.target.value;
    setInterval(newInterval); //Zawsze zmieniamy interval.

    // Automatycznie ustaw okres na '5d', *tylko* jeśli interwał jest < 1d
    if (['1m', '2m', '5m', '15m', '30m', '60m', '90m', '1h'].includes(newInterval)) {
      setPeriod('5d');
    }
  };


  return (
    <main className="p-4 bg-gray-900 text-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Analiza Akcji</h1>
      <form onSubmit={handleSubmit} className="mb-4">
        <input
          type="text"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="Wpisz nazwę firmy lub ticker"
          className="border p-2 rounded mr-2 bg-gray-700 text-white placeholder-gray-400"
        />
        <label htmlFor="period" className="block text-sm font-medium text-gray-300">
          Okres:
          <select
            id="period"
            value={period}
            onChange={handlePeriodChange}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-600 bg-gray-700 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option value="1d">1 dzień</option>
            <option value="5d">5 dni</option>
            <option value="1mo">1 miesiąc</option>
            <option value="3mo">3 miesiące</option>
            <option value="6mo">6 miesięcy</option>
            <option value="1y">1 rok</option>
            <option value="2y">2 lata</option>
            <option value="5y">5 lat</option>
            <option value="10y">10 lat</option>
            <option value="ytd">Od początku roku</option>
            <option value="max">Maksimum</option>
          </select>
        </label>
        <label htmlFor="interval" className="block text-sm font-medium text-gray-300">
          Interwał:
          <select
            id="interval"
            value={interval}
            onChange={handleIntervalChange}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-600 bg-gray-700 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option value="1m">1 minuta</option>
            <option value="2m">2 minuty</option>
            <option value="5m">5 minut</option>
            <option value="15m">15 minut</option>
            <option value="30m">30 minut</option>
            <option value="60m">60 minut</option>
            <option value="90m">90 minut</option>
            <option value="1h">1 godzina</option>
            <option value="1d">1 dzień</option>
            <option value="5d">5 dni</option>
            <option value="1wk">1 tydzień</option>
            <option value="1mo">1 miesiąc</option>
            <option value="3mo">3 miesiące</option>
          </select>
        </label>
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Szukaj
        </button>
      </form>

      {loading && <p className="text-gray-300">Ładowanie...</p>}
      {error && <p className="text-red-500">Błąd: {error}</p>}

      {stockData && stockData.stockData.length > 0 && (
        <StockChart stockData={stockData.stockData} smaData={stockData.smaData} />
      )}
    </main>
  );
};

export default HomePage;