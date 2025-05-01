'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { FaTrash, FaPlus, FaMinus } from 'react-icons/fa';
import { deleteDoc, doc, collection, addDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import PropTypes from 'prop-types';
import Link from 'next/link';
import { BiFolder } from 'react-icons/bi';

const PortfolioWidget = ({ currentStock, currentPrice }) => {
  const { currentUser, loading } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    shares: '',
    price: currentPrice || '',
    type: 'buy',
  });

  const getTransactions = async (userId, symbol) => {
    if (!db || !userId || !symbol) return [];
    try {
      const transactionsRef = collection(db, 'users', userId, 'transactions');
      const q = query(transactionsRef, where('symbol', '==', symbol));
      const querySnapshot = await getDocs(q);
      const transactions = querySnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      }));
      return transactions.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error("Błąd pobierania transakcji:", error);
      return [];
    }
  };

  const calculatePosition = (transactions) => {
    return transactions.reduce((acc, trans) => {
      const amount = trans.shares * trans.price;
      if (trans.type === 'buy') {
        return {
          shares: acc.shares + Number(trans.shares),
          totalCost: acc.totalCost + amount
        };
      } else {
        return {
          shares: acc.shares - Number(trans.shares),
          totalCost: acc.totalCost - (acc.avgPrice * trans.shares)
        };
      }
    }, { shares: 0, totalCost: 0, avgPrice: 0 });
  };

  useEffect(() => {
    const loadTransactions = async () => {
      if (currentUser && currentStock?.symbol) {
        setIsLoading(true);
        const data = await getTransactions(currentUser.uid, currentStock.symbol);
        setTransactions(data);
        setIsLoading(false);
      }
    };

    if (!loading && currentUser) {
      loadTransactions();
    }
  }, [currentUser, currentStock, loading]);

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    if (!currentUser || !currentStock?.symbol) return;

    try {
      const timestamp = new Date();
      const transactionsRef = collection(db, 'users', currentUser.uid, 'transactions');
      await addDoc(transactionsRef, {
        ...newTransaction,
        symbol: currentStock.symbol,
        shares: Number(newTransaction.shares),
        price: Number(newTransaction.price),
        timestamp,
        value: Number(newTransaction.shares) * Number(newTransaction.price)
      });

      const updatedTransactions = await getTransactions(currentUser.uid, currentStock.symbol);
      setTransactions(updatedTransactions);
      setShowAddForm(false);
      setNewTransaction({
        shares: '',
        price: currentPrice || '',
        type: 'buy'
      });
    } catch (error) {
      console.error('Błąd dodawania transakcji:', error);
    }
  };

  const handleRemoveTransaction = async (transactionId) => {
    if (!currentUser || !currentStock?.symbol) return;
    if (window.confirm('Czy na pewno chcesz usunąć tę transakcję?')) {
      try {
        const docRef = doc(db, 'users', currentUser.uid, 'transactions', transactionId);
        await deleteDoc(docRef);
        const updatedTransactions = await getTransactions(currentUser.uid, currentStock.symbol);
        setTransactions(updatedTransactions);
      } catch (error) {
        console.error('Błąd usuwania transakcji:', error);
      }
    }
  };

  if (loading || !currentUser) {
    return (
      <div className="w-full bg-gray-800 rounded-lg p-4 mt-5">
        <h2 className="text-xl font-bold text-white mb-4">Moje transakcje</h2>
        <p className="text-gray-400">
          {loading ? "Ładowanie..." : "Zaloguj się, aby zarządzać transakcjami."}
        </p>
      </div>
    );
  }

  const position = calculatePosition(transactions);
  const currentValue = position.shares * (currentPrice || 0);
  const totalProfit = currentValue - position.totalCost;
  const profitPercentage = position.totalCost !== 0 ? (totalProfit / position.totalCost) * 100 : 0;

  return (
    <div className="w-full bg-gray-800 rounded-lg p-4 mt-5">
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-white">Moje transakcje: {currentStock?.symbol}</h2>
            <Link 
              href="/portfolio" 
              className="text-blue-400 hover:text-blue-300 flex items-center gap-2 text-sm"
              title="Przejdź do pełnego portfolio"
            >
              <BiFolder /> Zobacz całe portfolio
            </Link>
          </div>
          {position.shares > 0 && (
            <div className="text-sm mt-1">
              <p className="text-gray-400">
                Posiadasz {position.shares} akcji
                {currentPrice ? (
                  <span className="ml-1">
                    • Aktualna cena: <span className="text-white font-medium">${currentPrice.toFixed(2)} USD</span>
                  </span>
                ) : null}
              </p>
            </div>
          )}
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
        >
          {showAddForm ? <FaMinus/> :  <FaPlus /> }
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddTransaction} className="mb-6 bg-gray-700 p-4 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Operacja</label>
              <select
                value={newTransaction.type}
                onChange={(e) => setNewTransaction({...newTransaction, type: e.target.value})}
                className="w-full bg-gray-600 text-white rounded-md px-3 py-2 border border-gray-500"
              >
                <option value="buy">🟢 Kupno</option>
                <option value="sell">🔴 Sprzedaż</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Liczba akcji</label>
              <input
                type="number"
                min="1"
                value={newTransaction.shares}
                onChange={(e) => setNewTransaction({...newTransaction, shares: e.target.value})}
                className="w-full bg-gray-600 text-white rounded-md px-3 py-2 border border-gray-500"
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
                className="w-full bg-gray-600 text-white rounded-md px-3 py-2 border border-gray-500"
                placeholder="np. 150.50"
                required
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md"
            >
              Zapisz transakcję
            </button>
          </div>
        </form>
      )}

      {position.shares > 0 && currentPrice && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 bg-gray-700/50 p-4 rounded-lg">
          <div>
            <p className="text-sm text-gray-400">Wartość obecna</p>
            <p className="text-lg font-bold text-white">${currentValue.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Zainwestowano</p>
            <p className="text-lg font-bold text-white">${position.totalCost.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Zysk/Strata</p>
            <p className={`text-lg font-bold ${totalProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              ${totalProfit.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Zmiana</p>
            <p className={`text-lg font-bold ${profitPercentage >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {profitPercentage.toFixed(2)}%
            </p>
          </div>
        </div>
      )}

      {transactions.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Data</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Typ</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Ilość</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Cena</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Wartość</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Akcje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {transactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-700/30">
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {transaction.timestamp.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded text-sm ${
                      transaction.type === 'buy' 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {transaction.type === 'buy' ? '🟢 Kupno' : '🔴 Sprzedaż'}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">{transaction.shares}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">${transaction.price.toFixed(2)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">${(transaction.shares * transaction.price).toFixed(2)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    <button
                      onClick={() => handleRemoveTransaction(transaction.id)}
                      className="text-red-500 hover:text-red-400"
                      title="Usuń transakcję"
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-center text-gray-400 py-6">
          Nie masz jeszcze żadnych transakcji dla tej spółki.
          {showAddForm ? ' Wypełnij formularz powyżej aby dodać pierwszą.' : ''}
        </p>
      )}
    </div>
  );
};

PortfolioWidget.propTypes = {
  currentStock: PropTypes.shape({
    symbol: PropTypes.string.isRequired,
  }),
  currentPrice: PropTypes.number,
};

export default PortfolioWidget;