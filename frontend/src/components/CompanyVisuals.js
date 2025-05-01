'use client';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { getCompanyDescription } from '@/lib/api';

const CompanyVisuals = ({ ticker, companyName: initialCompanyName }) => {
  const [logoError, setLogoError] = useState(false);
  const [companyData, setCompanyData] = useState({
    name: initialCompanyName || ticker?.toUpperCase(),
    description: '',
    domain: ''
  });
  const [loading, setLoading] = useState(true);

  // Lista domen dla popularnych firm
  const KNOWN_DOMAINS = {
    'AAPL': 'apple.com',
    'MSFT': 'microsoft.com',
    'GOOGL': 'google.com',
    'GOOG': 'google.com',
    'AMZN': 'amazon.com',
    'META': 'meta.com',
    'TSLA': 'tesla.com',
    'NVDA': 'nvidia.com',
    // dodaj więcej znanych domen
  };

  useEffect(() => {
    const fetchCompanyInfo = async () => {
      if (!ticker) return;

      try {
        setLoading(true);
        const description = await getCompanyDescription(ticker);
        
        // Próbuj znaleźć nazwę firmy w opisie
        const nameMatch = description?.match(/\*\*(.*?)\*\*/);
        let name = nameMatch?.[1]
          ?.replace(/Inc\.|Corporation|Corp\.|Limited|Ltd\.|Pełna nazwa:|,/gi, '')
          ?.trim();

        // Jeśli nie znaleziono nazwy w opisie, użyj domyślnej
        if (!name || name.length < 2) {
          name = initialCompanyName || ticker.toUpperCase();
        }

        setCompanyData(prev => ({
          ...prev,
          name,
          description: description || '',
          domain: KNOWN_DOMAINS[ticker.toUpperCase()] || `${name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`
        }));

      } catch (error) {
        console.error('Error fetching company info:', error);
        setCompanyData(prev => ({
          ...prev,
          name: initialCompanyName || ticker.toUpperCase(),
          domain: KNOWN_DOMAINS[ticker.toUpperCase()] || `${ticker.toLowerCase()}.com`
        }));
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyInfo();
  }, [ticker, initialCompanyName]);

  const getFallbackLogo = () => {
    const symbol = companyData.name[0]?.toUpperCase() || ticker[0]?.toUpperCase() || 'A';
    return (
      <div className="w-12 h-12 rounded-full bg-blue-900 flex items-center justify-center">
        <span className="text-2xl font-bold text-white">{symbol}</span>
      </div>
    );
  };

  const renderLogo = () => {
    if (logoError) return getFallbackLogo();

    return (
      <div className="w-12 h-12 rounded-full overflow-hidden bg-blue-900 flex items-center justify-center">
        <Image
          src={`https://icon.horse/icon/${companyData.domain}`}
          alt={`${companyData.name} logo`}
          width={48}
          height={48}
          className="object-contain p-1"
          onError={() => setLogoError(true)}
          priority
        />
      </div>
    );
  };

  if (loading) {
    return (
      <div className="w-full bg-gray-800 rounded-lg p-4 animate-pulse">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-full bg-gray-700" />
          <div className="flex-1">
            <div className="h-4 w-24 bg-gray-700 rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-gray-800 rounded-lg">
      <div className="p-4 flex items-center space-x-4">
        {renderLogo()}
        <div className="flex items-center space-x-2">
          <span className="text-xl text-white font-medium">
            {companyData.name}
          </span>
          <span className="text-gray-400">
            ({ticker?.toUpperCase()})
          </span>
        </div>
      </div>
    </div>
  );
};

export default CompanyVisuals;