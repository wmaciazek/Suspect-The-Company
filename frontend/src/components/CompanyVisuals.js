'use client';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { getCompanyDescription } from '@/lib/api';
import styles from './CompanyVisuals.module.css';

const CompanyVisuals = ({ ticker }) => {
  const [logoError, setLogoError] = useState(false);
  const [companyName, setCompanyName] = useState(ticker.toUpperCase());
  const [loading, setLoading] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    const fetchCompanyInfo = async () => {
      setLoading(true);
      setLogoError(false);
      setImageLoaded(false);
      
      try {
        const description = await getCompanyDescription(ticker);
        const nameMatch = description?.match(/\*\*(.*?)\*\*/);
        if (nameMatch?.[1]) {
          const name = nameMatch[1]
            .replace('Inc.', '')
            .replace('Pełna nazwa:', '')
            .trim();
          if (name) setCompanyName(name);
        }
      } catch (error) {
        console.error('Error fetching company info:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyInfo();
  }, [ticker]);

  const logoUrl = `https://icon.horse/icon/${companyName.toLowerCase()}.com`;

  return (
    <div className="w-full bg-gray-800 rounded-lg">
      <div className="p-4 flex items-center space-x-4">
        {/* Logo Container with Gradient */}
        <div className={styles.logoContainer}>
          {loading ? (
            <div className={styles.skeleton} />
          ) : !logoError ? (
            <Image
              src={logoUrl}
              alt={`${companyName} logo`}
              width={48}
              height={48}
              className={`${styles.logo} ${imageLoaded ? 'opacity-100' : 'opacity-0'} object-contain p-1`}
              onError={() => setLogoError(true)}
              onLoad={() => setImageLoaded(true)}
              priority
            />
          ) : (
            <span className={`${styles.fallbackLetter} text-2xl font-bold text-white flex items-center justify-center h-full`}>
              {companyName[0].toUpperCase()}
            </span>
          )}
        </div>

        {/* Nazwa firmy i ticker */}
        <div className="flex items-center space-x-2">
          <span className="text-xl text-white">
            {loading ? (
              <div className={`${styles.skeleton} h-6 w-24 rounded`} />
            ) : (
              companyName
            )}
          </span>
          <span className="text-gray-400">
            ({ticker.toUpperCase()})
          </span>
        </div>
      </div>
    </div>
  );
};

export default CompanyVisuals;