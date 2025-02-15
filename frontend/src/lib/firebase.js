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


export { auth, db, addSearchToHistory, getSearchHistory }; 