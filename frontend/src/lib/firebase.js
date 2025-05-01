import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, collection, doc, setDoc, addDoc, getDocs, query, orderBy, serverTimestamp, where } from "firebase/firestore"; 

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

let app, auth, db; 

try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app); 
} catch (error) {
    console.error("Błąd inicjalizacji Firebase:", error);
    throw error;
}
async function addSearchToHistory(userId, ticker, companyName) {
  if (!db || !userId) { 
        console.error("Firestore lub userId nie są zdefiniowane.");
        return;
  }
  try {
    const userHistoryRef = collection(db, 'users', userId, 'searchHistory'); 
    await addDoc(userHistoryRef, { 
      ticker: ticker,
      companyName: companyName,
      timestamp: serverTimestamp(), 
    });
    console.log("Dodano do historii:", ticker);
  } catch (error) {
    console.error("Błąd dodawania do historii:", error);
    throw error; 
  }
}

async function getSearchHistory(userId) {
  if (!db || !userId) {
    return []; 
  }
  try {
    const userHistoryRef = collection(db, 'users', userId, 'searchHistory');
    const q = query(userHistoryRef, orderBy('timestamp', 'desc')); 
    const querySnapshot = await getDocs(q);
    const history = [];
    querySnapshot.forEach((doc) => {
      history.push({ id: doc.id, ...doc.data() });
    });
    console.log("Pobrano historię:", history);
    return history;
  } catch (error) {
    console.error("Błąd pobierania historii:", error);
    throw error;
  }
}

async function addToPortfolio(userId, stockData) {
  if (!db || !userId) {
    console.error("Firestore lub userId nie są zdefiniowane.");
    return;
  }
  try {
    const portfolioRef = collection(db, 'users', userId, 'portfolio');
    const q = query(portfolioRef, where('symbol', '==', stockData.symbol));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      // Aktualizuj istniejącą pozycję
      const docRef = doc(portfolioRef, querySnapshot.docs[0].id);
      await setDoc(docRef, {
        ...stockData,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    } else {
      // Dodaj nową pozycję
      await addDoc(portfolioRef, {
        ...stockData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    console.log("Zaktualizowano portfolio:", stockData.symbol);
  } catch (error) {
    console.error("Błąd aktualizacji portfolio:", error);
    throw error;
  }
}

async function getPortfolio(userId) {
  if (!db || !userId) {
    return [];
  }
  try {
    const portfolioRef = collection(db, 'users', userId, 'portfolio');
    const q = query(portfolioRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const portfolio = [];
    querySnapshot.forEach((doc) => {
      portfolio.push({ id: doc.id, ...doc.data() });
    });
    console.log("Pobrano portfolio:", portfolio);
    return portfolio;
  } catch (error) {
    console.error("Błąd pobierania portfolio:", error);
    throw error;
  }
}

async function removeFromPortfolio(userId, stockId) {
  if (!db || !userId) {
    console.error("Firestore lub userId nie są zdefiniowane.");
    return;
  }
  try {
    const docRef = doc(db, 'users', userId, 'portfolio', stockId);
    await deleteDoc(docRef);
    console.log("Usunięto z portfolio:", stockId);
  } catch (error) {
    console.error("Błąd usuwania z portfolio:", error);
    throw error;
  }
}


async function addStockComment(userId, ticker, commentData) {
  if (!db || !userId) {
    console.error("Firestore lub userId nie są zdefiniowane.");
    return;
  }
  try {
    const commentsRef = collection(db, 'stockComments');
    await addDoc(commentsRef, {
      ...commentData,
      userId,
      ticker,
      timestamp: serverTimestamp(),
      likes: []
    });
    console.log("Dodano komentarz do:", ticker);
  } catch (error) {
    console.error("Błąd dodawania komentarza:", error);
    throw error;
  }
}

async function getStockComments(ticker) {
  if (!db || !ticker) {
    return [];
  }
  try {
    const commentsRef = collection(db, 'stockComments');
    const q = query(
      commentsRef, 
      where('ticker', '==', ticker),
      orderBy('timestamp', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const comments = [];
    querySnapshot.forEach((doc) => {
      comments.push({ id: doc.id, ...doc.data() });
    });
    console.log("Pobrano komentarze dla:", ticker);
    return comments;
  } catch (error) {
    console.error("Błąd pobierania komentarzy:", error);
    throw error;
  }
}
export { 
  auth, 
  db, 
  addSearchToHistory, 
  getSearchHistory,
  addToPortfolio,
  getPortfolio,
  removeFromPortfolio,
  addStockComment,
  getStockComments,
};