'use client';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { getCompanyDescription } from '@/lib/api';

const CompanyVisuals = ({ ticker }) => {
  const [logoError, setLogoError] = useState(false);
  const [companyName, setCompanyName] = useState(ticker.toUpperCase());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompanyInfo = async () => {
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

  // Użyjmy API favicon.io, które zwróci prawdziwe logo firmy
  const logoUrl = `https://icon.horse/icon/${companyName.toLowerCase()}.com`;

  return (
    <div className="w-full bg-gray-800 rounded-lg">
      <div className="p-4 flex items-center space-x-4">
        {/* Logo */}
        <div className="w-12 h-12 rounded-full overflow-hidden bg-blue-900 flex items-center justify-center">
          {!logoError ? (
            <Image
              src={logoUrl}
              alt={`${companyName} logo`}
              width={48}
              height={48}
              className="object-contain p-1"
              onError={() => setLogoError(true)}
              priority
            />
          ) : (
            <span className="text-2xl font-bold text-white">
              {companyName[0].toUpperCase()}
            </span>
          )}
        </div>

        {/* Nazwa firmy i ticker */}
        <div className="flex items-center space-x-2">
          <span className="text-xl text-white">
            {companyName}
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