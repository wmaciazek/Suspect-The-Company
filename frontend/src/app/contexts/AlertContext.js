'use client'
import { createContext, useContext, useState, useEffect } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import toast from 'react-hot-toast';
import { onAuthStateChanged } from 'firebase/auth';

const AlertContext = createContext();

export function AlertProvider({ children }) {
  const [alerts, setAlerts] = useState([]);
  const [checking, setChecking] = useState(false);
  const [userId, setUserId] = useState(null);

  const formatDate = (date) => {
    return date.toISOString().slice(0, 19).replace('T', ' ');
  };

  const checkStockPrice = async (symbol) => {
    try {
      console.log(`[PRICE CHECK] Rozpoczynam sprawdzanie ceny dla ${symbol}`);
      
      const response = await fetch(`/api/stock-price?symbol=${symbol}`);
      console.log(`[PRICE CHECK] Response status:`, response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`[PRICE CHECK] Otrzymane dane:`, data);
      
      if (data.c) {
        const price = Number(data.c);
        console.log(`[PRICE CHECK] Znaleziono cenę dla ${symbol}: ${price}`);
        return price;
      } else if (data.error) {
        console.error(`[PRICE CHECK] API Error dla ${symbol}:`, data.error);
        toast.error(`Błąd API dla ${symbol}: ${data.error}`);
        return null;
      }
      
      return null;
    } catch (error) {
      console.error(`[PRICE CHECK] Błąd dla ${symbol}:`, error);
      toast.error(`Błąd podczas pobierania ceny dla ${symbol}`);
      return null;
    }
  };

  const fetchAlerts = async () => {
    if (!userId) {
      console.log('No userId available for fetching alerts');
      return;
    }

    try {
      console.log('Fetching alerts for user:', userId);
      const alertsRef = collection(db, 'users', userId, 'price_alerts');
      const snapshot = await getDocs(alertsRef);
      const alertsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log('Fetched alerts:', alertsData);
      setAlerts(alertsData);
    
    } catch (error) {
      console.error('Błąd podczas pobierania alertów:', error);
      toast.error('Błąd podczas pobierania alertów');
    }
  };

  const checkAlerts = async () => {
    if (checking || !userId || alerts.length === 0) {
      console.log('Skipping check:', { checking, userId, alertsCount: alerts.length });
      return;
    }
    
    setChecking(true);
    console.log('Checking alerts for user:', userId);
    console.log('Current alerts:', alerts);

    try {
      for (const alert of alerts) {
        console.log(`Checking alert for ${alert.symbol}:`, alert);
        const currentPrice = await checkStockPrice(alert.symbol);
        
        if (currentPrice !== null) {
          console.log(`Received price for ${alert.symbol}:`, currentPrice);
          console.log(`Alert details:`, {
            symbol: alert.symbol,
            currentPrice: currentPrice,
            alertPrice: alert.price,
            condition: alert.condition
          });
          
          const triggerCondition = alert.condition === 'above' 
            ? currentPrice >= Number(alert.price)
            : currentPrice <= Number(alert.price);

          console.log(`Trigger condition met?`, triggerCondition);

          if (triggerCondition) {
            console.log(`Triggering alert notification for ${alert.symbol}`);
            toast(
              <div className="font-sans">
                <div className="font-bold mb-1">{alert.symbol} - Alert cenowy!</div>
                <div>Aktualna cena: ${currentPrice.toFixed(2)}</div>
                <div className="text-sm text-gray-300">
                  {alert.condition === 'above' 
                    ? `Przekroczono próg ${alert.price}$ (w górę)`
                    : `Spadek poniżej ${alert.price}$`}
                </div>
              </div>,
              {
                duration: 10000,
                icon: '🔔',
                style: {
                  background: '#2a2a2a',
                  color: '#fff',
                  borderRadius: '8px',
                  padding: '12px'
                }
              }
            );
          }
        }
      }
    } catch (error) {
      console.error('[ALERTS] Błąd podczas sprawdzania alertów:', error);
      toast.error('Wystąpił błąd podczas sprawdzania alertów');
    }

    setChecking(false);
  };

  const addAlert = async (newAlert) => {
    if (!userId) {
      toast.error('Musisz być zalogowany aby dodać alert');
      return false;
    }

    try {
      console.log('Adding new alert:', newAlert);
      const alertsRef = collection(db, 'users', userId, 'price_alerts');
      await addDoc(alertsRef, {
        ...newAlert,
        price: Number(newAlert.price),
        createdAt: new Date()
      });

      await fetchAlerts();
      toast.success('Alert cenowy został dodany');
      return true;
    } catch (error) {
      console.error('Błąd podczas dodawania alertu:', error);
      toast.error('Błąd podczas dodawania alertu');
      return false;
    }
  };

  const deleteAlert = async (alertId) => {
    if (!userId) {
      toast.error('Musisz być zalogowany aby usunąć alert');
      return;
    }

    try {
      console.log('Deleting alert:', alertId);
      const alertRef = doc(db, 'users', userId, 'price_alerts', alertId);
      await deleteDoc(alertRef);
      toast.success('Alert został usunięty');
      await fetchAlerts();
    } catch (error) {
      console.error('Błąd podczas usuwania alertu:', error);
      toast.error('Błąd podczas usuwania alertu');
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
        console.log('User authenticated:', user.uid);
      } else {
        setUserId(null);
        console.log('No user authenticated');
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchAlerts();
    }
  }, [userId]);

  useEffect(() => {
    if (userId && alerts.length > 0) {
      console.log('Setting up alerts checking. Current alerts:', alerts);
      
      checkAlerts();
      
      const interval = setInterval(() => {
        checkAlerts();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [userId, alerts]);

  return (
    <AlertContext.Provider value={{ 
      alerts, 
      checking, 
      checkAlerts, 
      addAlert, 
      deleteAlert,
      userId 
    }}>
      {children}
    </AlertContext.Provider>
  );
}

export const useAlerts = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlerts must be used within an AlertProvider');
  }
  return context;
};