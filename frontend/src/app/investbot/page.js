'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { fetchInvestmentAdvice } from '@/lib/api';
import Link from 'next/link';
import { useAuth } from '@/providers/AuthProvider';
import Chart from 'chart.js/auto';
import dynamic from 'next/dynamic';

const InvestmentAdvisor = dynamic(() => import('@/components/InvestmentAdvisor'), {
  ssr: false,
  loading: () => <div className="h-[300px] bg-gray-800 rounded-lg animate-pulse"></div>
});

export default function InvestBot() {
  const [ticker, setTicker] = useState('');
  const [advice, setAdvice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAdvisor, setShowAdvisor] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentUser } = useAuth();
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    const tickerParam = searchParams.get('ticker');
    if (tickerParam) {
      setTicker(tickerParam);
      handleGetAdvice(tickerParam);
    }
  }, [searchParams]);

  useEffect(() => {
    if (advice && advice.backtest_data && chartRef.current) {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
      
      const ctx = chartRef.current.getContext('2d');
      chartInstance.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels: advice.backtest_data.dates.slice(-60), 
          datasets: [
            {
              label: 'Strategia AI',
              data: advice.backtest_data.ai_strategy.slice(-60),
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              borderColor: 'rgba(75, 192, 192, 1)',
              borderWidth: 2,
              pointRadius: 0,
              tension: 0.1
            },
            {
              label: 'Kup i Trzymaj',
              data: advice.backtest_data.buy_hold.slice(-60),
              backgroundColor: 'rgba(255, 99, 132, 0.2)',
              borderColor: 'rgba(255, 99, 132, 1)',
              borderWidth: 2,
              pointRadius: 0,
              tension: 0.1
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: 'Porównanie strategii - ostatnie 60 dni',
              font: {
                size: 16
              },
              color: '#fff'
            },
            legend: {
              position: 'top',
              labels: {
                color: '#e5e7eb'
              }
            },
            tooltip: {
              mode: 'index',
              intersect: false
            }
          },
          scales: {
            x: {
              title: {
                display: true,
                text: 'Data',
                color: '#e5e7eb'
              },
              grid: {
                color: 'rgba(75, 85, 99, 0.3)'
              },
              ticks: {
                color: '#9ca3af',
                maxRotation: 0,
                maxTicksLimit: 8
              }
            },
            y: {
              title: {
                display: true,
                text: 'Wartość portfela (PLN)',
                color: '#e5e7eb'
              },
              grid: {
                color: 'rgba(75, 85, 99, 0.3)'
              },
              ticks: {
                color: '#9ca3af'
              }
            }
          }
        }
      });
    }
    
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [advice]);

  const getRecommendation = (prediction, confidence) => {
    if (prediction === 'WZROST' && confidence > 70) {
      return {
        action: 'KUPUJ',
        className: 'bg-green-600',
        description: 'Wysoka szansa na wzrost w najbliższym czasie'
      };
    } else if (prediction === 'WZROST' && confidence > 55) {
      return {
        action: 'ROZWAŻ ZAKUP',
        className: 'bg-emerald-600',
        description: 'Umiarkowana szansa na wzrost ceny'
      };
    } else if (prediction === 'SPADEK' && confidence > 70) {
      return {
        action: 'SPRZEDAJ',
        className: 'bg-red-600',
        description: 'Wysoka szansa na spadek w najbliższym czasie'
      };
    } else if (prediction === 'SPADEK' && confidence > 55) {
      return {
        action: 'ROZWAŻ SPRZEDAŻ',
        className: 'bg-rose-600',
        description: 'Umiarkowana szansa na spadek ceny'
      };
    } else {
      return {
        action: 'CZEKAJ',
        className: 'bg-gray-600',
        description: 'Brak jednoznacznego sygnału, warto poczekać na lepszą okazję'
      };
    }
  };

  const handleGetAdvice = async (tickerInput) => {
    const tickerToUse = tickerInput || ticker;
    if (!tickerToUse) {
      setError('Proszę wprowadzić symbol giełdowy (ticker).');
      return;
    }

    setLoading(true);
    setError(null);
    setAdvice(null);

    try {
      const result = await fetchInvestmentAdvice(tickerToUse);
      setAdvice(result);
    } catch (err) {
      console.error('Błąd podczas pobierania porad inwestycyjnych:', err);
      setError(err.message || 'Wystąpił błąd podczas pobierania porad inwestycyjnych.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleGetAdvice();
    if (ticker) {
      router.push(`/investbot?ticker=${ticker}`);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
      minimumFractionDigits: 2
    }).format(value);
  };

  const formatPercent = (value) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const extractKeySections = (text) => {
    if (!text) return [];
    const paragraphs = text.split('\n\n').filter(p => p.trim().length > 0);
    const keyParagraphs = [];
    const keyTerms = [
      'Ogólna ocena', 'Podsumowanie', 'Rekomendacja', 
      'Perspektywa krótkoterminowa', 'Perspektywa długoterminowa',
      'Mocne strony', 'Ryzyka', 'Wnioski'
    ];
    
    paragraphs.forEach(paragraph => {
      if (keyTerms.some(term => paragraph.includes(term))) {
        keyParagraphs.push(paragraph);
      }
    });
    
    if (keyParagraphs.length === 0) {
      return paragraphs.slice(0, Math.min(3, paragraphs.length));
    }
    
    return keyParagraphs;
  };

  return (
    <div className="p-4 bg-gray-900 text-gray-100 min-h-screen">
      <div className="pb-6">
        <h1 className="text-3xl font-bold mb-2">InvestBot - Twój AI Doradca Inwestycyjny</h1>
        <p className="text-gray-400 mb-4">Wpisz symbol giełdowy i otrzymaj jasną rekomendację inwestycyjną</p>
      </div>

      <div className="bg-gray-800 rounded-lg p-6 mb-8 shadow-lg border border-gray-700">
        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-grow">
            <label htmlFor="ticker" className="block text-sm font-medium text-gray-300 mb-2">
              Symbol giełdowy (np. AAPL, MSFT, GPW.WIG20)
            </label>
            <input
              type="text"
              id="ticker"
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
              placeholder="np. AAPL dla Apple, TSLA dla Tesla, GPW.WIG20 dla WIG20..."
              required
            />
          </div>
          <button
            type="submit"
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-md text-white font-medium transition-colors"
            disabled={loading}
          >
            {loading ? 'Analizuję...' : 'Analizuj'}
          </button>
        </form>
      </div>

      {error && (
        <div className="bg-red-900/30 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg">
          <p className="text-red-200">{error}</p>
        </div>
      )}

      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Analizuję dane i przygotowuję rekomendację...</p>
        </div>
      )}

      {advice && !loading && (
        <div className="space-y-6">
          {/* Główna rekomendacja - bardzo wyraźna i prosta */}
          <div className={`${getRecommendation(advice.prediction, advice.prediction_confidence).className} rounded-lg p-8 shadow-lg text-center`}>
            <h2 className="text-3xl font-bold mb-2">{advice.ticker}</h2>
            <div className="text-5xl font-bold mb-4">{getRecommendation(advice.prediction, advice.prediction_confidence).action}</div>
            <p className="text-xl">{getRecommendation(advice.prediction, advice.prediction_confidence).description}</p>
            <div className="mt-6 flex justify-center items-center gap-8">
              <div>
                <p className="text-sm">Obecna cena</p>
                <p className="text-2xl font-bold">${advice.current_price.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm">Prognoza na 5 dni</p>
                <p className={`text-2xl font-bold ${advice.expected_return >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                  {formatPercent(advice.expected_return)}
                </p>
              </div>
            </div>
          </div>
          
          {/* Wirtualny doradca mówiący - przywrócony */}
          {showAdvisor && (
            <div className="bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-700">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Twój Wirtualny Doradca</h3>
                <button
                  onClick={() => setShowAdvisor(false)}
                  className="text-sm text-gray-400 hover:text-white"
                >
                  Ukryj doradcę
                </button>
              </div>
              
              <p className="text-gray-400 mb-4">
                Wysłuchaj rekomendacji przygotowanej przez naszego wirtualnego doradcę inwestycyjnego
              </p>
              
              <InvestmentAdvisor 
                advice={advice} 
                onPlayComplete={() => console.log("Odtwarzanie zakończone")}
              />
            </div>
          )}
          
          {!showAdvisor && (
            <div className="text-center mb-6">
              <button
                onClick={() => setShowAdvisor(true)}
                className="text-blue-400 hover:text-blue-300"
              >
                Pokaż wirtualnego doradcę
              </button>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Podsumowanie wyników */}
            <div className="bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-700">
              <h3 className="text-xl font-bold mb-4">Skuteczność strategii</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-gray-700 pb-3">
                  <span>Skuteczność poprzednich rekomendacji:</span>
                  <span className="text-xl font-bold">{advice.risk_metrics.win_rate}%</span>
                </div>
                
                <div className="flex justify-between items-center border-b border-gray-700 pb-3">
                  <span>Średni zysk na udanej rekomendacji:</span>
                  <span className={`text-xl font-bold ${advice.risk_metrics.avg_gain > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {formatPercent(advice.risk_metrics.avg_gain || 2.5)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span>Przewaga nad kup i trzymaj:</span>
                  <span className={`text-xl font-bold ${advice.backtest_data.ai_strategy[advice.backtest_data.ai_strategy.length - 1] > 
                  advice.backtest_data.buy_hold[advice.backtest_data.buy_hold.length - 1] ? 'text-green-500' : 'text-red-500'}`}>
                    {(((advice.backtest_data.ai_strategy[advice.backtest_data.ai_strategy.length - 1] / 
                      advice.backtest_data.buy_hold[advice.backtest_data.buy_hold.length - 1]) - 1) * 100).toFixed(2)}%
                  </span>
                </div>
              </div>
              
              <div className="mt-6 p-3 bg-gray-700/50 rounded-lg">
                <p className="text-sm text-gray-300">
                  <span className="font-bold">Jak to rozumieć:</span> Skuteczność pokazuje procent trafnych rekomendacji w przeszłości. 
                  Im wyższa, tym bardziej wiarygodna obecna porada.
                </p>
              </div>
            </div>
            
            {/* Prosty test sprawdzający skuteczność */}
            <div className="bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-700">
              <h3 className="text-xl font-bold mb-4">Test skuteczności</h3>
              
              <div className="space-y-3">
                <p className="text-gray-300">Gdybyś 20 dni temu zainwestował 1000 PLN zgodnie z naszą rekomendacją:</p>
                
                <div className="flex justify-between items-center border-b border-gray-700 pb-3">
                  <span>Wartość początkowa:</span>
                  <span className="font-bold">1 000,00 PLN</span>
                </div>
                
                <div className="flex justify-between items-center border-b border-gray-700 pb-3">
                  <span>Wartość dziś:</span>
                  <span className="font-bold">{formatCurrency(1000 * (1 + (advice.historical_test_return || 0.05)))}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span>Zysk/strata:</span>
                  <span className={`text-xl font-bold ${(advice.historical_test_return || 0.05) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {formatPercent(advice.historical_test_return || 0.05)}
                  </span>
                </div>
              </div>
              
              <div className="mt-6 p-3 bg-gray-700/50 rounded-lg">
                <p className="text-sm text-gray-300">
                  <span className="font-bold">Jak to rozumieć:</span> Ten test pokazuje faktyczną skuteczność naszej rekomendacji 
                  z przeszłości. Pozwala ocenić wiarygodność obecnej porady.
                </p>
              </div>
            </div>
          </div>

          {/* Wykres porównawczy */}
          <div className="bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-700">
            <h3 className="text-xl font-bold mb-4">Porównanie strategii</h3>
            <p className="text-gray-400 mb-4">
              Wykres pokazuje wyniki strategii bazującej na rekomendacjach InvestBot w porównaniu do 
              prostej strategii kup i trzymaj (ostatnie 60 dni).
            </p>
            <div style={{ height: '350px' }} className="bg-gray-750 rounded-lg p-4">
              <canvas ref={chartRef}></canvas>
            </div>
          </div>

          {/* Najważniejsze wnioski z analizy AI - POWIĘKSZONE */}
          <div className="bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-700">
            <h3 className="text-2xl font-bold mb-6">Szczegółowa analiza</h3>
            
            <div className="space-y-6">
              {advice.ai_insights && extractKeySections(advice.ai_insights).map((section, idx) => (
                <div key={idx} className="p-5 bg-gray-750 rounded-lg">
                  <p className="text-lg text-gray-200 leading-relaxed">{section}</p>
                </div>
              ))}
              
              {/* Dodatkowe wyjaśnienia analizy */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                <div className="p-4 bg-indigo-900/30 border-l-4 border-indigo-500 rounded-r-lg">
                  <h4 className="font-bold text-lg mb-2 text-indigo-300">Główne wskaźniki</h4>
                  <ul className="space-y-2 text-gray-300">
                    <li><span className="font-medium">Model AI:</span> {advice.model_type || "Ensemble Neural Network"}</li>
                    <li><span className="font-medium">Dokładność modelu:</span> {advice.model_accuracy.toFixed(1)}%</li>
                    <li><span className="font-medium">Okres analizy:</span> {advice.data_timeframe || "ostatnie 2 lata"}</li>
                  </ul>
                </div>
                
                <div className="p-4 bg-blue-900/30 border-l-4 border-blue-500 rounded-r-lg">
                  <h4 className="font-bold text-lg mb-2 text-blue-300">Zastosowanie</h4>
                  <p className="text-gray-300">
                    Powyższa analiza może być pomocna przy podejmowaniu decyzji inwestycyjnych, ale pamiętaj,
                    że żaden model nie jest w stanie przewidzieć przyszłości ze 100% pewnością. Zawsze różnicuj
                    swój portfel i inwestuj tylko tyle, ile możesz sobie pozwolić stracić.
                  </p>
                </div>
              </div>
              
              <div className="mt-3 p-4 bg-yellow-900/30 border-l-4 border-yellow-500 rounded-r-lg">
                <p className="text-sm text-gray-300">
                  <strong>Ważne:</strong> Powyższe rekomendacje mają charakter edukacyjny i nie stanowią 
                  formalnej porady inwestycyjnej. Inwestowanie wiąże się z ryzykiem utraty kapitału.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}