'use client'
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { collection, query, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import { FaChartLine, FaSpinner, FaPlus, FaTimes, FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import PortfolioCharts from '@/components/PortfolioCharts';
import PortfolioExport from '@/components/PortfolioExport';
import ProfitLossTracker from '@/components/ProfitLossTracker';
import PriceAlerts from '@/components/PriceAlerts';

const PortfolioPage = () => {
  const { currentUser, loading: authLoading } = useAuth();
  const [portfolioData, setPortfolioData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'totalValue', direction: 'desc' });
  const [portfolioSummary, setPortfolioSummary] = useState({
    totalValue: 0,
    totalCost: 0,
    totalShares: 0,
    uniqueStocks: 0
  });

  const [newTransaction, setNewTransaction] = useState({
    symbol: '',
    shares: '',
    price: '',
    type: 'buy'
  });

  const sortOptions = [
    { key: 'symbol', label: 'Symbol' },
    { key: 'shares', label: 'Liczba akcji' },
    { key: 'avgPrice', label: 'Średnia cena' },
    { key: 'totalValue', label: 'Wartość całkowita' }
  ];

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      const transactionsRef = collection(db, 'users', currentUser.uid, 'transactions');
      await addDoc(transactionsRef, {
        ...newTransaction,
        shares: Number(newTransaction.shares),
        price: Number(newTransaction.price),
        timestamp: serverTimestamp(),
        value: Number(newTransaction.shares) * Number(newTransaction.price)
      });

      setShowAddForm(false);
      setNewTransaction({
        symbol: '',
        shares: '',
        price: '',
        type: 'buy'
      });
      
      fetchPortfolioData();
    } catch (error) {
      setError('Wystąpił błąd podczas dodawania transakcji');
      console.error('Błąd dodawania transakcji:', error);
    }
  };
  const fetchPortfolioData = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      const transactionsRef = collection(db, 'users', currentUser.uid, 'transactions');
      const querySnapshot = await getDocs(transactionsRef);
      
      const portfolioMap = new Map();
      let totalPortfolioValue = 0;
      let totalPortfolioCost = 0;
      let totalShares = 0;
      
      querySnapshot.docs.forEach(doc => {
        const transaction = { id: doc.id, ...doc.data() };
        const symbol = transaction.symbol.toUpperCase();
        
        if (!portfolioMap.has(symbol)) {
          portfolioMap.set(symbol, {
            symbol,
            shares: 0,
            totalCost: 0,
            transactions: [],
            firstPurchaseDate: new Date(),
            lastTransactionDate: new Date(0)
          });
        }
        
        const position = portfolioMap.get(symbol);
        const transactionDate = transaction.timestamp?.toDate() || new Date();
        
        if (transaction.type === 'buy') {
          position.shares += Number(transaction.shares);
          position.totalCost += Number(transaction.shares) * Number(transaction.price);
          position.firstPurchaseDate = transactionDate < position.firstPurchaseDate ? 
            transactionDate : position.firstPurchaseDate;
        } else {
          position.shares -= Number(transaction.shares);
          position.totalCost -= Number(transaction.shares) * Number(transaction.price);
        }
        
        position.lastTransactionDate = transactionDate > position.lastTransactionDate ?
          transactionDate : position.lastTransactionDate;
        position.transactions.push(transaction);
      });
      
      const portfolioArray = Array.from(portfolioMap.values())
        .filter(position => position.shares > 0)
        .map(position => ({
          ...position,
          avgPrice: position.totalCost / position.shares,
          totalValue: position.totalCost // Docelowo powinno być obliczane na podstawie aktualnych cen
        }));

      // Aktualizacja podsumowania portfolio
      totalPortfolioValue = portfolioArray.reduce((sum, pos) => sum + pos.totalValue, 0);
      totalPortfolioCost = portfolioArray.reduce((sum, pos) => sum + pos.totalCost, 0);
      totalShares = portfolioArray.reduce((sum, pos) => sum + pos.shares, 0);

      setPortfolioSummary({
        totalValue: totalPortfolioValue,
        totalCost: totalPortfolioCost,
        totalShares: totalShares,
        uniqueStocks: portfolioArray.length
      });

      // Sortowanie danych
      const sortedData = [...portfolioArray].sort((a, b) => {
        const multiplier = sortConfig.direction === 'asc' ? 1 : -1;
        if (typeof a[sortConfig.key] === 'string') {
          return multiplier * a[sortConfig.key].localeCompare(b[sortConfig.key]);
        }
        return multiplier * (a[sortConfig.key] - b[sortConfig.key]);
      });

      setPortfolioData(sortedData);
      setLoading(false);
    } catch (err) {
      console.error('Błąd podczas pobierania danych portfolio:', err);
      setError('Wystąpił błąd podczas ładowania portfolio');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchPortfolioData();
    }
  }, [currentUser, sortConfig]);
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="flex items-center justify-center">
          <FaSpinner className="animate-spin text-4xl text-blue-500" />
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-4">Portfolio</h1>
          <p className="text-gray-400">Zaloguj się, aby zobaczyć swoje portfolio.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold">Moje Portfolio</h1>
            <p className="text-gray-400 mt-2">
              Zalogowany jako: {currentUser.email}
            </p>
          </div>
        </div>

        {/* Podsumowanie portfolio */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-gray-400 text-sm">Wartość całkowita</h3>
            <p className="text-2xl font-bold">${portfolioSummary.totalValue.toFixed(2)}</p>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-gray-400 text-sm">Zainwestowano</h3>
            <p className="text-2xl font-bold">${portfolioSummary.totalCost.toFixed(2)}</p>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-gray-400 text-sm">Liczba akcji</h3>
            <p className="text-2xl font-bold">{portfolioSummary.totalShares}</p>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-gray-400 text-sm">Liczba spółek</h3>
            <p className="text-2xl font-bold">{portfolioSummary.uniqueStocks}</p>
          </div>
        </div>

        {/* Tracker zysku/straty */}
        <ProfitLossTracker portfolioData={portfolioData} />

        {/* Wykresy portfolio */}
        {portfolioData.length > 0 && (
          <PortfolioCharts portfolioData={portfolioData} />
        )}

        {/* Eksport danych */}
        {portfolioData.length > 0 && (
          <PortfolioExport 
            portfolioData={portfolioData} 
            summaryData={portfolioSummary} 
          />
        )}

        {/* Alerty cenowe */}
        {currentUser && (
          <PriceAlerts 
            userId={currentUser.uid} 
            portfolioData={portfolioData} 
          />
        )}
        <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white mb-4 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            {showAddForm ? <FaTimes /> : <FaPlus />}
            {showAddForm ? 'Anuluj' : 'Dodaj nową pozycję'}
        </button>
                {/* Formularz dodawania nowej pozycji */}
                {showAddForm && (
          <div className="bg-gray-800 p-6 rounded-lg mb-8">
            <h2 className="text-xl font-bold mb-4">Dodaj nową pozycję</h2>
            <form onSubmit={handleAddTransaction} className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Symbol</label>
                <input
                  type="text"
                  value={newTransaction.symbol}
                  onChange={(e) => setNewTransaction({...newTransaction, symbol: e.target.value.toUpperCase()})}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
                  placeholder="np. AAPL"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Operacja</label>
                <select
                  value={newTransaction.type}
                  onChange={(e) => setNewTransaction({...newTransaction, type: e.target.value})}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
                >
                  <option value="buy">Kupno</option>
                  <option value="sell">Sprzedaż</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Liczba akcji</label>
                <input
                  type="number"
                  min="1"
                  value={newTransaction.shares}
                  onChange={(e) => setNewTransaction({...newTransaction, shares: e.target.value})}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
                  placeholder="np. 100"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Cena za akcję ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={newTransaction.price}
                  onChange={(e) => setNewTransaction({...newTransaction, price: e.target.value})}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
                  placeholder="np. 150.50"
                  required
                />
              </div>
              <div className="md:col-span-4 flex justify-end">
                <button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md transition-colors"
                >
                  Dodaj transakcję
                </button>
              </div>
            </form>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Lista pozycji portfolio */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <FaSpinner className="animate-spin text-4xl text-blue-500" />
          </div>
        ) : portfolioData.length > 0 ? (
          <div className="grid gap-6">
            {portfolioData.map((position) => (
              <div
                key={position.symbol}
                className="bg-gray-800 rounded-lg p-6 hover:bg-gray-750 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <div>
                        <Link
                          href={`/company/${position.symbol}?ticker=${position.symbol}`}
                          className="text-2xl font-bold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-2"
                        >
                          {position.symbol}
                          <FaChartLine className="text-lg" />
                        </Link>
                        <Link
                          href={`/company/${position.symbol}?ticker=${position.symbol}`}
                          className="text-sm text-gray-400 hover:text-gray-300 transition-colors flex items-center gap-1 mt-1"
                        >
                          Zarządzaj transakcjami
                        </Link>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div>
                        <p className="text-gray-400 text-sm">Liczba akcji</p>
                        <p className="text-lg font-semibold">{position.shares}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Średnia cena</p>
                        <p className="text-lg font-semibold">${position.avgPrice.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Wartość całkowita</p>
                        <p className="text-lg font-semibold">${position.totalValue.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Pierwsza transakcja</p>
                        <p className="text-lg font-semibold">
                          {position.firstPurchaseDate.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 text-sm text-gray-400">
                  Ostatnia transakcja: {position.lastTransactionDate.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <p className="text-gray-400 mb-4">Nie masz jeszcze żadnych akcji w portfolio.</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              <FaPlus />
              Dodaj pierwszą pozycję
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PortfolioPage;