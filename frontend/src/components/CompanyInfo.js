'use client'
import React, { useState, useEffect } from 'react';
import { getCompanyDescription } from '@/lib/api';

const CompanyInfo = ({ ticker, companyName }) => {
  const [companyInfo, setCompanyInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCompanyInfo = async () => {
      if (!ticker) { 
        return;
      }

      setLoading(true);
      setError(null);
      setCompanyInfo(null); 

      try {
        console.log("TESTTTTTTTTTTTTTTT", ticker, companyName)
        const description = await getCompanyDescription(ticker, companyName);
        setCompanyInfo(description);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyInfo();
  }, [ticker]); 

  if (loading) {
    return <p className="text-gray-300">Ładowanie informacji o firmie...</p>;
  }

  if (error) {
    return <p className="text-red-500">Błąd: {error}</p>;
  }

  if (!companyInfo) {
    return <p className="text-gray-300">Wybierz firmę, aby zobaczyć informacje.</p>; 
  }

  return (
    <div className="bg-gray-800 p-4 rounded shadow text-gray-200">
      <h2 className="text-xl font-bold mb-2">Informacje o firmie</h2>
      <p>{companyInfo}</p>
    </div>
  );
};

export default CompanyInfo;