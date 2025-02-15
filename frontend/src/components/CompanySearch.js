'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

const CompanySearch = ({ setLoading, loading }) => { 
  const [companyName, setCompanyName] = useState('');
  const router = useRouter(); 

  const handleSubmit = (e) => {
    e.preventDefault();
    if (companyName.trim()) {
      setLoading(true); 
      router.push(`/company/${encodeURIComponent(companyName)}`); 
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
    </form>
  );
};

export default CompanySearch;