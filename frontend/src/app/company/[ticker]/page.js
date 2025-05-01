'use client'
import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { fetchStockData, fetchStockDataInComponent } from '@/lib/api';
import dynamic from 'next/dynamic';
import CompanyInfo from '@/components/CompanyInfo';
import Indicators from '@/components/Indicators';
import StockPrediction from '@/components/StockPrediction';
import CompanyVisuals from '@/components/CompanyVisuals';
import NewsWithSentiment from '@/components/NewsWithSentiment';
import PortfolioWidget from '@/components/PortfolioWidget';
import StockComments from '@/components/StockComments';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { AuthProvider } from '@/providers/AuthProvider';

const StockChart = dynamic(() => import('@/components/StockChart'), {
  ssr: false,
});

const WIDGET_NAMES = {
  'chart': 'Wykresy Akcji',
  'portfolio': 'Portfel',
  'prediction': 'Predykcja',
  'news': 'Wiadomości',
  'indicators': 'Wskaźniki',
  'comments': 'Komentarze' // Dodane
};


const highlightWidget = (widgetId) => {
  const element = document.getElementById(widgetId);
  if (element) {
    element.classList.add('highlight-widget');
    setTimeout(() => {
      element.classList.remove('highlight-widget');
    }, 1000);
  }
};

const SortableWidget = ({ id, children }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };


  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className="mb-4 bg-gray-800 rounded-lg p-4 relative group"
    >
      <div 
        {...attributes} 
        {...listeners}
        className="absolute top-2 right-2 text-gray-500 cursor-move opacity-0 group-hover:opacity-100 transition-opacity"
      >
        ⋮⋮
      </div>
      {children}
    </div>
  );
};

const DEFAULT_WIDGETS_ORDER = [
  'chart', 
  'portfolio', 
  'prediction', 
  'news', 
  'indicators',
  'comments' // Dodane
];

const CompanyDetails = () => {
  const { ticker: companyName } = useParams(); 
  const searchParams = useSearchParams();
  const ticker = searchParams.get('ticker');
  const [stockData, setStockData] = useState(null);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('1y'); 
  const [interval, setInterval] = useState('1d'); 
  const [showPrediction, setShowPrediction] = useState(false);
  const [isHideMode, setIsHideMode] = useState(false);
  const [realTimePrice, setRealTimePrice] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const [widgets, setWidgets] = useState({
    chart: true,
    portfolio: true,
    prediction: true,
    news: true,
    indicators: true,
    comments: true // Dodane
  });

  const [widgetsOrder, setWidgetsOrder] = useState(DEFAULT_WIDGETS_ORDER);
  const [activeWidget, setActiveWidget] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchRealTimePrice = async (symbol) => {
    if (!symbol) {
      console.log('[Finnhub] No symbol provided');
      return;
    }
    
    try {
      console.log(`[Finnhub] Fetching real-time price for ${symbol}`);
      const response = await fetch(`/api/stock-price?symbol=${symbol}`);
      
      if (!response.ok) {
        console.error(`[Finnhub] HTTP error! status: ${response.status}`);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`[Finnhub] Received data:`, data);
      
      if (data.error) {
        console.error(`[Finnhub] API Error:`, data.error);
        return;
      }
  
      if (data.c > 0) { // Sprawdź czy cena jest większa od 0
        const price = Number(data.c);
        console.log(`[Finnhub] Setting price to: $${price}`);
        setRealTimePrice(price);
        setLastUpdate(new Date());
        
        if (stockData?.stockData?.length > 0) {
          const updatedStockData = [...stockData.stockData];
          const lastIndex = updatedStockData.length - 1;
          
          if (updatedStockData[lastIndex].close !== price) {
            updatedStockData[lastIndex] = {
              ...updatedStockData[lastIndex],
              close: price
            };
            
            setStockData(prev => ({
              ...prev,
              stockData: updatedStockData
            }));
            
            console.log(`[Finnhub] Updated last price in chart data to: $${price}`);
          }
        }
      } else {
        console.warn(`[Finnhub] Invalid price received for ${symbol}: ${data.c}`);
      }
    } catch (error) {
      console.error('[Finnhub] Error fetching real-time price:', error);
    }
  };

  useEffect(() => {
    const savedWidgets = localStorage.getItem('stockWidgetsVisibility');
    const savedOrder = localStorage.getItem('stockWidgetsOrder');
    
    if (savedWidgets) {
      setWidgets(JSON.parse(savedWidgets));
    }
    if (savedOrder) {
      setWidgetsOrder(JSON.parse(savedOrder));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('stockWidgetsVisibility', JSON.stringify(widgets));
    localStorage.setItem('stockWidgetsOrder', JSON.stringify(widgetsOrder));
  }, [widgets, widgetsOrder]);

  // Effect dla aktualizacji ceny w czasie rzeczywistym
  useEffect(() => {
    if (ticker) {
      console.log(`[Finnhub] Setting up real-time updates for ${ticker}`);
      fetchRealTimePrice(ticker);
      
      const interval = setInterval(() => {
        fetchRealTimePrice(ticker);
      }, 30000); // Odświeżaj co 30 sekund
      
      return () => {
        console.log(`[Finnhub] Cleaning up real-time updates for ${ticker}`);
        clearInterval(interval);
      };
    }
  }, [ticker]);

  const handlePeriodChange = (e) => {
    const newPeriod = e.target.value;
    if(newPeriod =='1d' && interval == '1d') {
      setPeriod('5d')
    } else {
      setPeriod(newPeriod);
      if (!['1d', '5d'].includes(newPeriod)) {
        setInterval('1d');
      }
    }
  };

  const handleIntervalChange = (e) => {
    const newInterval = e.target.value;
    if(newInterval == '1d' && period=='1d') {
      setInterval('1h')
    } else {
      setInterval(newInterval);
      if (['1m', '2m', '5m', '15m', '30m', '60m', '90m', '1h'].includes(newInterval)) {
        setPeriod('5d');
      }
    }
  };

  const toggleWidget = (widgetName) => {
    setWidgets(prev => ({
      ...prev,
      [widgetName]: !prev[widgetName]
    }));
  };

  const scrollToWidget = (widgetId) => {
    const element = document.getElementById(widgetId);
    if (element) {
      const offset = 92;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });

      highlightWidget(widgetId);
      setActiveWidget(widgetId);
    }
  };

  const handleWidgetClick = (widgetName) => {
    if (isHideMode) {
      toggleWidget(widgetName);
    } else {
      scrollToWidget(`widget-${widgetName}`);
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    if (active.id !== over.id) {
      setWidgetsOrder((items) => {
        const oldIndex = items.indexOf(active.id);
        const newIndex = items.indexOf(over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setError(null);
      try {
        const data = await fetchStockDataInComponent(ticker, period, interval);
        setStockData(data);
      } catch (err) {
        setError(err.message);
      }
    };

    if (ticker) {
      fetchData();
    }
  }, [ticker, period, interval]);

  if (error) { 
    return <p className="text-red-500">Błąd: {error}</p>;
  }
  
  if (!stockData) { 
    return <p className="text-gray-300">Ładowanie danych firmy...</p>;
  }

  const renderWidget = (widgetName) => {
    if (!widgets[widgetName]) return null;

    const widgetContent = (
      <div id={`widget-${widgetName}`}>
        {widgetName === 'chart' && (
          <>
            {realTimePrice && (
              <div className="mb-4 mt-2 p-4 bg-gray-700 rounded-lg w-1/3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-300">Aktualna cena: (Finnhub)</span>
                  <span className="text-xl font-bold text-white">${realTimePrice.toFixed(2)}</span>
                </div>
                {lastUpdate && (
                  <div className="text-xs text-gray-400 mt-1">
                    Ostatnia aktualizacja: {lastUpdate.toLocaleTimeString()}
                  </div>
                )}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <label className="block">
                <span className="text-sm font-medium text-gray-300">Okres:</span>
                <select 
                  value={period} 
                  onChange={handlePeriodChange} 
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-600 bg-gray-700 text-white rounded-md"
                >
                  <option value='1d'>1 dzień</option>
                  <option value='5d'>5 dni</option>
                  <option value='1mo'>1 miesiąc</option>
                  <option value='3mo'>3 miesiące</option>
                  <option value='6mo'>6 miesięcy</option>
                  <option value='1y'>1 rok</option>
                  <option value='2y'>2 lata</option>
                  <option value='5y'>5 lat</option>
                  <option value='10y'>10 lat</option>
                  <option value='ytd'>Od początku roku</option>
                  <option value='max'>Cały dostępny okres</option>
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-medium text-gray-300">Interwał:</span>
                <select 
                  value={interval} 
                  onChange={handleIntervalChange} 
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-600 bg-gray-700 text-white rounded-md"
                >
                  <option value='1m'>1 minuta</option>
                  <option value='2m'>2 minuty</option>
                  <option value='5m'>5 minut</option>
                  <option value='15m'>15 minut</option>
                  <option value='30m'>30 minut</option>
                  <option value='60m'>60 minut</option>
                  <option value='90m'>90 minut</option>
                  <option value='1h'>1 godzina</option>
                  <option value='1d'>1 dzień</option>
                  <option value='5d'>5 dni</option>
                  <option value="1wk">1 tydzień</option>
                  <option value='1mo'>1 miesiąc</option>
                  <option value='3mo'>3 miesiące</option>
                </select>
              </label>
            </div>
            <StockChart 
              stockData={stockData.stockData} 
              period={period} 
              interval={interval}
            />
          </>
        )}
        {widgetName === 'portfolio' && (
          <PortfolioWidget 
            currentStock={{ symbol: ticker }} 
            currentPrice={realTimePrice || stockData?.stockData?.[stockData.stockData.length - 1]?.close}
          />
        )}
        {widgetName === 'comments' && <StockComments ticker={ticker} />} 
        {widgetName === 'prediction' && (
          <>
            <div className="flex justify-center mb-4">
              <button
                onClick={() => setShowPrediction(!showPrediction)}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-md text-white font-medium transition-colors"
              >
                {showPrediction ? 'Ukryj predykcję' : 'Pokaż predykcję cen na następne 30 dni'}
              </button>
            </div>
            {showPrediction && <StockPrediction ticker={stockData?.ticker} />}
          </>
        )}
        {widgetName === 'news' && <NewsWithSentiment ticker={ticker} />}
        {widgetName === 'indicators' && <Indicators ticker={stockData?.ticker} />}
      </div>
    );

    return (
      <SortableWidget key={widgetName} id={widgetName}>
        {widgetContent}
      </SortableWidget>
    );
  };

  return (
    <AuthProvider>
      <div className="p-4 bg-gray-900 text-gray-100 min-h-screen">
        <div className="pb-3 bg-gray-900 text-gray-100 w-1/3">
          {stockData && (
            <CompanyVisuals 
              ticker={stockData.ticker}
              companyName={companyName !== 'undefined' ? companyName : stockData.ticker}
            />
          )}
        </div>

        {companyName != 'undefined' && (
          <CompanyInfo 
            ticker={stockData?.ticker} 
            companyName={companyName}
          />
        )}

        <div className="relative">
          <div className="sticky top-0 z-50">
            <div className="bg-gray-800/95 backdrop-blur-sm p-4 rounded-lg shadow-lg border border-gray-700 mt-4">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                  <h3 className="text-sm font-medium text-gray-300 whitespace-nowrap">
                    {isHideMode ? 'Tryb ukrywania widżetów:' : 'Nawigacja po widżetach:'}
                  </h3>
                  <button
                    onClick={() => setIsHideMode(!isHideMode)}
                    className="p-2 rounded-md bg-gray-700/80 hover:bg-gray-600 transition-colors flex-shrink-0 border border-gray-600"
                    title={isHideMode ? "Przełącz na tryb nawigacji" : "Przełącz na tryb ukrywania"}
                  >
                    {isHideMode ? '🔍' : '👁️'}
                  </button>
                </div>
                <div className="h-6 w-px bg-gray-700"></div>
                <div className="flex flex-wrap gap-3 flex-grow">
                  {widgetsOrder.map((name) => (
                    <button
                      key={`widget-button-${name}`}
                      onClick={() => handleWidgetClick(name)}
                      className={`px-5 py-2 rounded-md transition-all flex items-center gap-2 border 
                        ${isHideMode 
                          ? widgets[name]
                            ? 'bg-indigo-600/90 hover:bg-indigo-700 border-indigo-500'
                            : 'bg-gray-700/80 hover:bg-gray-600 border-gray-600'
                          : widgets[name]
                            ? 'bg-gray-700/80 hover:bg-gray-600 border-gray-600'
                            : 'hidden'
                        }
                        ${!isHideMode && activeWidget === `widget-${name}` ? 'ring-2 ring-indigo-500 ring-offset-1 ring-offset-gray-800' : ''}`}
                    >
                      <span className="font-medium">{WIDGET_NAMES[name]}</span>
                      {isHideMode && (
                        <span className="opacity-90">{widgets[name] ? '👁️' : '👁️‍🗨️'}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="h-8 bg-gradient-to-b from-gray-900 to-transparent absolute -bottom-8 left-0 right-0 pointer-events-none"></div>
          </div>

          <div className="pt-8">
            <div className="relative space-y-6">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={widgetsOrder}
                  strategy={verticalListSortingStrategy}
                >
                  {widgetsOrder.map((widgetName) => renderWidget(widgetName))}
                </SortableContext>
              </DndContext>
            </div>
          </div>
        </div>
      </div>
    </AuthProvider>
  );
};

export default CompanyDetails;