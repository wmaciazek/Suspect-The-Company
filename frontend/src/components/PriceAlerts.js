'use client'
import { useState } from 'react';
import { FaBell, FaPlus, FaTrash, FaCheck, FaSpinner } from 'react-icons/fa';
import { useAlerts } from '@/app/contexts/AlertContext'; // Poprawiona ścieżka

const PriceAlerts = ({ portfolioData }) => {
  const { alerts, checking, checkAlerts, addAlert, deleteAlert } = useAlerts();
  const [showAddAlert, setShowAddAlert] = useState(false);
  const [newAlert, setNewAlert] = useState({
    symbol: '',
    price: '',
    condition: 'above',
  });

  const handleAddAlert = async (e) => {
    e.preventDefault();
    const success = await addAlert(newAlert);
    if (success) {
      setNewAlert({
        symbol: '',
        price: '',
        condition: 'above'
      });
      setShowAddAlert(false);
    }
  };

  return (
    <div className="bg-gray-900 p-6 rounded-lg mb-6 border border-gray-800 shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <FaBell className="text-blue-400" />
            <span className="text-gray-100">Alerty cenowe</span>
          </h3>
          {checking && (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <FaSpinner className="animate-spin text-blue-400" />
              Sprawdzanie...
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddAlert(!showAddAlert)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors flex items-center gap-2"
          >
            <FaPlus />
            Nowy alert
          </button>
        </div>
      </div>

      {showAddAlert && (
        <form onSubmit={handleAddAlert} className="mb-6 bg-gray-800 p-6 rounded-lg border border-gray-700 shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Symbol
              </label>
              <select
                value={newAlert.symbol}
                onChange={(e) => setNewAlert({...newAlert, symbol: e.target.value})}
                className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Wybierz symbol</option>
                {portfolioData.map(position => (
                  <option key={position.symbol} value={position.symbol}>
                    {position.symbol}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Warunek
              </label>
              <select
                value={newAlert.condition}
                onChange={(e) => setNewAlert({...newAlert, condition: e.target.value})}
                className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="above">Powyżej</option>
                <option value="below">Poniżej</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Cena ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={newAlert.price}
                onChange={(e) => setNewAlert({...newAlert, price: e.target.value})}
                className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md transition-colors font-medium"
            >
              Dodaj alert
            </button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {alerts.length > 0 ? (
          alerts.map(alert => (
            <div
              key={alert.id}
              className="flex justify-between items-center bg-gray-800 p-4 rounded-lg border border-gray-700 shadow transition-all hover:border-gray-600"
            >
              <div>
                <span className="font-medium text-lg text-gray-200">{alert.symbol}</span>
                <span className="text-gray-400 mx-2">
                  {alert.condition === 'above' ? 'powyżej' : 'poniżej'}
                </span>
                <span className="text-blue-400 font-medium">${alert.price}</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => deleteAlert(alert.id)}
                  className="text-gray-400 hover:text-red-400 transition-colors p-2"
                  title="Usuń alert"
                >
                  <FaTrash />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-400 mb-4">Brak ustawionych alertów</p>
            <button
              onClick={() => setShowAddAlert(true)}
              className="text-blue-400 hover:text-blue-300 transition-colors text-sm"
            >
              Dodaj pierwszy alert
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PriceAlerts;