'use client';
import CompanySearch from '@/components/CompanySearch';
import LoginForm from '@/components/LoginForm';
import RegisterForm from '@/components/RegisterForm';
import { useAuth } from '@/providers/AuthProvider';
import React, {useState} from "react";

const HomePage = () => {
    const [loading, setLoading] = useState(false);
    const [haveAccount, setHaveAccount] = useState(true);
    const { currentUser, signOut } = useAuth();
  return (
    <div className="bg-gray-900 text-white min-h-screen flex flex-col items-center justify-center">
      <div className="text-center mb-10">
        <div className="text-4xl sm:text-6xl font-bold tracking-wider flex">
         <h1> Suspect The Company </h1><h2 className='ml-3 text-lg sm:text-xl'>On The Market</h2>
        </div>
        <p className="text-lg sm:text-xl text-gray-400 mt-4">
          Analiza akcji i wykresy w jednym miejscu.
        </p>
      </div>
        <div className="max-w-md w-full">
          <CompanySearch setLoading={setLoading} loading={loading}  />  
          {loading && <p className="text-gray-300">Ładowanie...</p>}
        </div>
        {currentUser ? 'zalogowany':<div className="max-w-md w-full">
          {!haveAccount ? <RegisterForm/> : <LoginForm/>}
          {!haveAccount ? <button
          onClick={() => setHaveAccount(!haveAccount)}
          type="submit"
          className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500" /* Te same style */
        >
          Mam konto
        </button> : <button
          onClick={() => setHaveAccount(!haveAccount)}
          type="submit"
          className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500" /* Te same style */
        >
          Nie mam konta
        </button>}
        </div>}
    </div>
  );
};

export default HomePage;