'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { addSearchToHistory } from '@/lib/firebase';
import { fetchStockData } from '@/lib/api';

const CompanySearch = ({ setLoading, loading }) => {
  const [companyName, setCompanyName] = useState('');
  const [error, setError] = useState(null);
  const router = useRouter();
  const { currentUser } = useAuth();

  const handleSearchByTicker = async (e) => {
    e.preventDefault();
    setError(null);
    const trimmedCompanyName = companyName.trim();
    if (!trimmedCompanyName) {
      return;
    }

    setLoading(true);

    try {
      console.log('searching by ticker')
      let type='ticker'
      const data = await fetchStockData(trimmedCompanyName, type);
      if (data && data.ticker) {
        if (currentUser) {
          try {
            await addSearchToHistory(currentUser.uid, data.ticker, companyName);
          } catch (e) {
            console.error('Błąd zapisu do historii:', e);
            setError('Błąd zapisu do historii');
          }
        }
        router.push(`/company/${encodeURIComponent(trimmedCompanyName)}?ticker=${data.ticker}`);
      } else {
        setError('Nie znaleziono danych dla tego tickera.');
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchByName = async (e) => {
    e.preventDefault();
    setError(null);
    const trimmedCompanyName = companyName.trim();
    if (!trimmedCompanyName) {
      return;
    }

    setLoading(true);

    try {
      console.log('searching by name')
      let type = 'name'
      const data = await fetchStockData(trimmedCompanyName, type); 
      console.log(data, 'COMPANYSEARCH.JS')
      if (data && data.ticker) {
        if (currentUser) {
          try {
            await addSearchToHistory(currentUser.uid, data.ticker, companyName);
          } catch (e) {
            console.error('Błąd zapisu do historii:', e);
            setError('Błąd zapisu do historii');
          }
        }
        router.push(`/company/${encodeURIComponent(trimmedCompanyName)}?ticker=${data.ticker}`);
      } else {
        setError('Nie znaleziono danych dla tej nazwy firmy.');
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="mb-4">
      <div className="flex justify-center flex-col">
        <div className="flex justify-center">
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Wpisz nazwę firmy lub ticker"
            className="border p-2 rounded mr-2 bg-gray-700 text-white placeholder-gray-400"
          />
        </div>
        <div className="flex justify-center mt-5">
          <button
            type="button" 
            onClick={handleSearchByTicker}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            disabled={loading}
          >
            Szukaj po Tickerze
          </button>
          <button
            type="button" 
            onClick={handleSearchByName}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold ml-2 py-2 px-4 rounded"
            disabled={loading}
          >
            Szukaj po Nazwie
          </button>
        </div>
        <div>
          {error && <p className="text-red-500">{error}</p>}
        </div>
      </div>
    </form>
  );
};

export default CompanySearch;