import React from 'react';
import styles from './landing.module.css';
import Link from 'next/link';
import Image from 'next/image';

const LandingPage = () => {
  return (
    <div className={`bg-gray-900 text-gray-100 min-h-screen flex flex-col justify-center items-center ${styles.landingContainer}`}>
      <div className="text-4xl font-bold mb-4 flex"><h1>Witaj w Suspect The Company</h1><p className='ml-3'>On The Market</p></div>
      <p className="text-lg mb-2 text-gray-400">Analizuj dane giełdowe firm mając do nich szybki dostęp.</p>
      <div className="flex justify-center">
        <Image src="/Money.svg" alt="Money" width={450} height={450} className="" />
      </div>
      <p className="text-lg mb-8 bg-green-600 px-4 py-2 rounded"><Link target='_blank' href='https://github.com/swapperDEV/Suspect-The-Company'>Projekt tylko i wyłącznie do celów naukowych w oparciu o biblioteke yfinance i api finnhub</Link></p>
      <div className="flex space-x-4">
        <Link href="/" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Szukaj Firmy
        </Link>
        <Link href="/" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Załóż konto
        </Link>
      </div>
    </div>
  );
};

export default LandingPage;
