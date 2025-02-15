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


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null); 
    const trimmedCompanyName = companyName.trim(); 
    if (!trimmedCompanyName) {
      return;
    }

    setLoading(true); 

    try {
      const data = await fetchStockData(trimmedCompanyName); 
      if (data && data.ticker) { 
        if (currentUser) { 
            try {
                await addSearchToHistory(currentUser.uid, data.ticker, companyName);
            }
            catch (e){
                console.error("Błąd zapisu do historii:", e);
                setError("Błąd zapisu do historii")
            }
        }
        router.push(`/company/${encodeURIComponent(trimmedCompanyName)}?ticker=${data.ticker}`); 
      } else {
        setError('Nie znaleziono danych dla tej firmy.'); 
      }

    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false); 
    }
  };


  return (
    <form onSubmit={handleSubmit} className="mb-4">
      <input
        type="text"
        value={companyName}
        onChange={(e) => setCompanyName(e.target.value)}
        placeholder="Wpisz nazwę firmy lub ticker"
        className="border p-2 rounded mr-2 bg-gray-700 text-white placeholder-gray-400"
      />
      <button
        type="submit"
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        disabled={loading}
      >
        Szukaj
      </button>
      {error && <p className="text-red-500">{error}</p>} 
    </form>
  );
};

export default CompanySearch;
