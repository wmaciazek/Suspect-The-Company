'use client';
import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { Tab } from '@headlessui/react';

function NewsWithSentiment({ ticker }) {
  const [newsData, setNewsData] = useState({
    categorized: {
      earnings: [],
      products: [],
      market: [],
      technology: [],
      other: []
    },
    all: [],
    stats: {
      total_news: 0,
      average_sentiment: 0,
      average_confidence: 0,
      category_counts: {}
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('7d');
  const [isAnalysisVisible, setIsAnalysisVisible] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState(null);

  const categoryLabels = {
    all: 'Wszystkie',
    earnings: 'Wyniki Finansowe',
    products: 'Produkty',
    market: 'Rynek',
    technology: 'Technologia',
    other: 'Inne'
  };

  const categoryIcons = {
    earnings: '💰',
    products: '📱',
    market: '📊',
    technology: '⚡',
    other: '📌',
    all: '📰'
  };

  const translateText = async (text) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000'}/api/translate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text })
      });

      if (!response.ok) {
        throw new Error('Błąd tłumaczenia');
      }

      const data = await response.json();
      if (data.status === 'success') {
        return data.translated_text;
      } else {
        throw new Error(data.error || 'Błąd tłumaczenia');
      }
    } catch (error) {
      console.error('Błąd tłumaczenia:', error);
      return text; 
    }
  };

  const getSentimentStyle = (score) => {
    if (score > 0.3) return {
      color: 'rgb(34 197 94)',
      borderColor: 'rgb(21 128 61)',
      backgroundColor: 'rgba(34, 197, 94, 0.1)',
      emoji: '📈',
      text: 'Pozytywny'
    };
    if (score < -0.3) return {
      color: 'rgb(239 68 68)',
      borderColor: 'rgb(185 28 28)',
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      emoji: '📉',
      text: 'Negatywny'
    };
    return {
      color: 'rgb(234 179 8)',
      borderColor: 'rgb(161 98 7)',
      backgroundColor: 'rgba(234, 179, 8, 0.1)',
      emoji: '➡️',
      text: 'Neutralny'
    };
  };

  const getConfidenceText = (confidence) => {
    if (confidence > 0.8) return 'Bardzo wysoka';
    if (confidence > 0.6) return 'Wysoka';
    if (confidence > 0.4) return 'Średnia';
    return 'Niska';
  };

  const fetchNews = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000'}/api/news?ticker=${encodeURIComponent(ticker)}`);
      
      if (!response.ok) {
        throw new Error(`Błąd serwera: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.status === "success" && data.data) {
        // Tłumaczenie newsów
        const translatedNews = await Promise.all(
          data.data.all.map(async (news) => ({
            ...news,
            title: await translateText(news.title),
            description: await translateText(news.description)
          }))
        );

        const translatedData = {
          ...data.data,
          all: translatedNews,
          categorized: {
            earnings: translatedNews.filter(news => news.category === 'earnings'),
            products: translatedNews.filter(news => news.category === 'products'),
            market: translatedNews.filter(news => news.category === 'market'),
            technology: translatedNews.filter(news => news.category === 'technology'),
            other: translatedNews.filter(news => news.category === 'other')
          }
        };

        setNewsData(translatedData);
        setLastUpdateTime(new Date().toISOString());
        setIsAnalysisVisible(true);
      } else if (data.error) {
        throw new Error(data.error);
      } else {
        throw new Error('Nieprawidłowa odpowiedź z serwera');
      }
    } catch (e) {
      console.error('Błąd pobierania danych:', e);
      setError(e.message);
      setNewsData({
        categorized: {
          earnings: [],
          products: [],
          market: [],
          technology: [],
          other: []
        },
        all: [],
        stats: {
          total_news: 0,
          average_sentiment: 0,
          average_confidence: 0,
          category_counts: {}
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const filterNewsByDate = (news) => {
    const days = parseInt(timeRange);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    return news.filter(item => new Date(item.publishedAt) >= cutoffDate);
  };

  const getSentimentTrendData = () => {
    const filteredNews = filterNewsByDate(newsData.all);
    return filteredNews
      .sort((a, b) => new Date(a.publishedAt) - new Date(b.publishedAt))
      .map(item => ({
        date: new Date(item.publishedAt).toLocaleDateString(),
        sentiment: Number(item.sentiment.score.toFixed(2)),
        confidence: Number(item.sentiment.confidence.toFixed(2))
      }));
  };

  if (loading) {
    return (
      <div className="w-full bg-gray-800 rounded-lg p-6">
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <span className="text-gray-400">
            Analizuję sentyment i tłumaczę newsy dla {ticker}...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full bg-gray-800 rounded-lg p-6">
        <div className="text-center">
          <div className="text-red-500 text-lg mb-4">
            {error}
          </div>
          <div className="text-gray-400 mb-4">
            Spróbuj ponownie później lub sprawdź połączenie z serwerem.
          </div>
          <button
            onClick={() => {
              setError(null);
              setIsAnalysisVisible(false);
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Spróbuj ponownie
          </button>
          <div className="mt-4 text-sm text-gray-500">
            Szczegóły techniczne:
            <br />
            Użytkownik: {window.swapperDEV || 'swapperDEV'}
            <br />
            Czas: 2025-04-22 20:13:50
            <br />
            Ticker: {ticker}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="bg-gray-800 rounded-lg p-6 mb-4">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">
              {ticker} - Newsy o tickerze oraz Analiza Sentymentu
            </h2>
            {lastUpdateTime && (
              <div className="mt-2 text-gray-400 text-sm">
                Ostatnia aktualizacja: {new Date(lastUpdateTime).toLocaleString()}
              </div>
            )}
          </div>
          <button
            onClick={fetchNews}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                Analizuję...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {isAnalysisVisible ? 'Odśwież analizę' : 'Rozpocznij analizę'}
              </>
            )}
          </button>
        </div>
      </div>

      {isAnalysisVisible && (
        <div className="flex flex-col gap-4">
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex justify-end gap-2">
              {['7d', '14d', '30d'].map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
                    ${timeRange === range
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                >
                  {range === '7d' ? '7 dni' : 
                   range === '14d' ? '14 dni' : '30 dni'}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-medium text-white mb-4">
              Trend Sentymentu
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={getSentimentTrendData()}>
                  <XAxis 
                    dataKey="date" 
                    stroke="#9ca3af"
                  />
                  <YAxis 
                    domain={[-1, 1]} 
                    stroke="#9ca3af"
                    ticks={[-1, -0.5, 0, 0.5, 1]}
                    tickFormatter={(value) => value.toFixed(1)}
                  />
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: '#1f2937', 
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px'
                    }}
                    labelStyle={{ color: '#9ca3af' }}
                    formatter={(value) => [
                      `${value.toFixed(2)}`,
                      'Sentyment'
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="sentiment"
                    stroke="#8884d8"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <Tab.Group>
            <Tab.List className="flex space-x-2 bg-gray-800 p-2 rounded-lg overflow-x-auto">
              {Object.entries(categoryLabels).map(([category, label]) => (
                <Tab
                  key={category}
                  className={({ selected }) =>
                    `px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap
                    ${selected
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`
                  }
                >
                  <span className="flex items-center gap-2">
                    {categoryIcons[category]} {label}
                    <span className="px-2 py-1 text-xs rounded-full bg-gray-900/50">
                      {category === 'all'
                        ? filterNewsByDate(newsData.all).length
                        : filterNewsByDate(newsData.categorized[category]).length}
                    </span>
                  </span>
                </Tab>
              ))}
            </Tab.List>

            <Tab.Panels className="mt-4">
              {Object.entries(categoryLabels).map(([category]) => (
                <Tab.Panel key={category} className="space-y-4">
                  <AnimatePresence mode="wait">
                    {filterNewsByDate(
                      category === 'all' ? newsData.all : newsData.categorized[category]
                    ).map((news, index) => (
                      <motion.div
                        key={`${news.title}-${index}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2 }}
                        className="group"
                      >
                        <a
                          href={news.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block"
                        >
                          <div
                            className="rounded-lg p-6 transition-all duration-200 hover:bg-gray-700"
                            style={{
                              backgroundColor: getSentimentStyle(news.sentiment.score).backgroundColor,
                              borderLeft: `4px solid ${getSentimentStyle(news.sentiment.score).borderColor}`
                            }}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="px-2 py-1 text-xs rounded-full bg-gray-700 text-gray-300">
                                    {categoryLabels[news.category]}
                                  </span>
                                  <span style={{ color: getSentimentStyle(news.sentiment.score).color }}>
                                    {getSentimentStyle(news.sentiment.score).emoji} 
                                    {getSentimentStyle(news.sentiment.score).text} 
                                    ({getConfidenceText(news.sentiment.confidence)} pewność)
                                  </span>
                                </div>
                                <h3 className="text-lg font-medium text-white group-hover:text-blue-400 transition-colors">
                                  {news.title}
                                </h3>
                                <p className="text-gray-400 mt-2 line-clamp-2">
                                  {news.description}
                                </p>
                                <div className="flex items-center mt-3 text-sm text-gray-500">
                                  <span>{news.source}</span>
                                  <span className="mx-2">•</span>
                                  <span>{new Date(news.publishedAt).toLocaleString()}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </a>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </Tab.Panel>
              ))}
            </Tab.Panels>
          </Tab.Group>
        </div>
      )}

      {isAnalysisVisible && (
        <div className="mt-4 bg-gray-800 rounded-lg">
          <div className="p-4">
            <div className="text-sm text-gray-500">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <span>Użytkownik: {window.swapperDEV || 'swapperDEV'}</span>
                  <span>Data analizy: 2025-04-22 20:13:50</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-gray-400">
                    Przeanalizowano: {newsData.all.length} newsów
                  </span>
                  <button
                    onClick={() => setIsAnalysisVisible(false)}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
                  >
                    <svg 
                      className="w-4 h-4" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M6 18L18 6M6 6l12 12" 
                      />
                    </svg>
                    Zamknij analizę
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default NewsWithSentiment;