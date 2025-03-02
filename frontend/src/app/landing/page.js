import React from 'react';
import styles from './landing.module.css';
import Link from 'next/link';

const LandingPage = () => {
  return (
    <div className={`bg-gray-900 text-gray-100 min-h-screen flex flex-col justify-center items-center ${styles.landingContainer}`}>
      <h1 className="text-4xl font-bold mb-4">Witaj w Suspect The Company</h1>
      <p className="text-lg mb-8">Analizuj dane giełdowe firm mając do nich szybki dostęp.</p>
      <p className="text-lg mb-8 bg-red-500">Projekt tylko i wyłącznie do celów naukowych w oparciu o biblioteke yfinance</p>
      <div className="flex space-x-4">
        <Link href="/" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Szukaj Firmy
        </Link>
        <Link href="/" className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
          Załóż konto
        </Link>
      </div>
    </div>
  );
};

export default LandingPage;
