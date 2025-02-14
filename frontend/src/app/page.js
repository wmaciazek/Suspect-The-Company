'use client';
import CompanySearch from '@/components/CompanySearch';

const HomePage = () => {
  return (
    <main className="p-4 bg-gray-900 text-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Wyszukaj Firmę</h1>
      <CompanySearch /> 
    </main>
  );
};

export default HomePage;