'use client'
import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { fetchStockData, fetchStockDataInComponent } from '@/lib/api';
import dynamic from 'next/dynamic';
import CompanyInfo from '@/components/CompanyInfo';

const StockChart = dynamic(() => import('@/components/StockChart'), {
  ssr: false,
});

const CompanyDetails = () => {
  const { ticker: companyName } = useParams(); 
  const searchParams = useSearchParams();
  const ticker = searchParams.get('ticker');
  const [stockData, setStockData] = useState(null);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('5d'); 
  const [interval, setInterval] = useState('1d'); 
  console.log(stockData, '!!!!!!!!!!!!!!!')
  const handlePeriodChange = (e) => {
    const newPeriod = e.target.value;
    if(newPeriod =='1d' && interval == '1d') {
        setPeriod('5d')
    } else {
        setPeriod(newPeriod);
        if (!['1d', '5d'].includes(newPeriod)) {
          setInterval('1d');
        }
    }
  };

  const handleIntervalChange = (e) => {
    const newInterval = e.target.value;
    if(newInterval == '1d' && period=='1d') {
        setInterval('1h')
    } else {
        setInterval(newInterval);

        if (['1m', '2m', '5m', '15m', '30m', '60m', '90m', '1h'].includes(newInterval)) {
        setPeriod('5d');
        }
    }
  };

  useEffect(() => {
    console.log(stockData, '!!!!!!!!!!!!!!!')
    const fetchData = async () => {
      setError(null);

      try {
        console.log('wyszukiwanie do budowania wykresu po', ticker)
        const data = await fetchStockDataInComponent(ticker, period, interval);
        console.log('COMPANY/PAGE/DATA', data)
        setStockData(data);
      } catch (err) {
        setError(err.message);
      }
    };

    if (ticker) {
      fetchData();
    }
  }, [ticker, period, interval]);


  if (error) { 
    return <p className="text-red-500">Błąd: {error}</p>;
  }
    if (!stockData) { 
        return <p className="text-gray-300">Ładowanie danych firmy...</p>;
    }


  return (
    <div className="p-4 bg-gray-900 text-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Szczegóły Firmy: {stockData?.companyName} Ticker: {stockData?.ticker}</h1>
        {companyName != 'undefined' &&  <CompanyInfo ticker={stockData?.ticker} companyName={companyName}/>      }
        <label htmlFor="period"  className="block text-sm font-medium text-gray-300">
            Okres:
            <select id='period' value={period} onChange={handlePeriodChange} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-600 bg-gray-700 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                <option value='1d'>1 dzień</option> 
                <option value='5d'>5 dni</option>
                <option value='1mo'>1 miesiąc</option>
                <option value='3mo'>3 miesiące</option>
                <option value='6mo'>6 miesięcy</option>
                <option value='1y'>1 rok</option>
                <option value='2y'>2 lata</option>
                <option value='5y'>5 lat</option>
                <option value='10y'>10 lat</option>
                <option value='ytd'>Od początku roku</option>
                <option value='max'>Cały dostępny okres</option>
            </select>
        </label>
        <label htmlFor='interval'  className="block text-sm font-medium text-gray-300">
          Interwał:
          <select id='interval' value={interval} onChange={handleIntervalChange} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-600 bg-gray-700 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
            <option value='1m'>1 minuta</option>
            <option value='2m'>2 minuty</option>
            <option value='5m'>5 minut</option>
            <option value='15m'>15 minut</option>
            <option value='30m'>30 minut</option>
            <option value='60m'>60 minut</option>
            <option value='90m'>90 minut</option>
            <option value='1h'>1 godzina</option>
            <option value='1d'>1 dzień</option>
            <option value='5d'>5 dni</option>
            <option value="1wk">1 tydzień</option>
            <option value='1mo'>1 miesiąc</option>
            <option value='3mo'>3 miesiące</option>
          </select>
        </label>
      {error && <p className="text-red-500">Błąd: {error}</p>}

        {stockData ? (
            stockData.stockData.length > 0 ? (
            <StockChart stockData={stockData.stockData} smaData={stockData.smaData} />
            ) : (
            <div>Brak danych dla podanego okresu/interwału</div>
            )
        ) : (
            <div>Ładowanie danych...</div>
        )}

      <p>Ticker: {stockData?.ticker}</p>  
    </div>
  );
};

export default CompanyDetails;