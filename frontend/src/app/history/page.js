// src/app/history/page.js
'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { getSearchHistory } from '@/lib/firebase';
import { formatDistanceToNow } from 'date-fns';
import { pl } from 'date-fns/locale';
import { fetchStockData } from '@/lib/api';
import { useRouter } from 'next/navigation';


const HistoryPage = () => {
    const router = useRouter();
  const { currentUser, loading: authLoading } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleSubmit = async (item) => {
    setError(null); 
    setSearchLoading(true)
    console.log('przekazano', item)

    const trimmedCompanyName = item.companyName.trim();
    if (!trimmedCompanyName) {
      return; 
    }

    try {
      const data = await fetchStockData(trimmedCompanyName); 


      if (data && data.ticker) { 
        router.push(`/company/${encodeURIComponent(trimmedCompanyName)}?ticker=${data.ticker}`);; 
      } else {
        setError('Nie znaleziono danych dla tej firmy.');
      }

    } catch (error) {
      setError(error.message);
    } finally {
    }
  };

  useEffect(() => {
    const fetchHistory = async () => {
      if (currentUser) {
        try {
          const userHistory = await getSearchHistory(currentUser.uid);
          setHistory(userHistory);
        } catch (error) {
          setError(error.message);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false); 
      }
    };

    fetchHistory();
  }, [currentUser]);

  if (authLoading) {
    return <p className="text-gray-300">Ładowanie stanu uwierzytelnienia...</p>;
  }

  if (!currentUser) {
    return <p className="text-gray-300">Musisz być zalogowany, aby zobaczyć historię.</p>;
  }

  if (loading) {
    return <p className="text-gray-300">Ładowanie historii...</p>;
  }

  if (error) {
    return <p className="text-red-500">Błąd: {error}</p>;
  }

  if (history.length === 0) {
    return <p className="text-gray-300">Brak historii wyszukiwania.</p>;
  }

  return (
    <div className="p-4 bg-gray-900 text-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">{searchLoading ? "Historia Wyszukiwań" : "Ładowanie.."}</h1>
      <ul>
        {history.map((item) => (
          <li onClick={() => handleSubmit(item)} key={item.id} className="cursor-pointer bg-gray-800 p-4 rounded shadow mb-2">
            <p className="font-bold">Firma: {item.companyName}</p>
            <p className="font-bold">Ticker: {item.ticker}</p>
            <p className="text-sm text-gray-400">
              Wyszukano: {formatDistanceToNow(item.timestamp.toDate(), { addSuffix: true, locale: pl })} 
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default HistoryPage;