import { GoogleGenerativeAI } from "@google/generative-ai";

const API_BASE_URL = 'http://127.0.0.1:5000/api'; 

export async function fetchStockData(companyName, type, period = '1mo', interval = '1d') {
    let url = `${API_BASE_URL}/stock_data_by_ticker?ticker=${encodeURIComponent(companyName)}&period=${encodeURIComponent(period)}&interval=${encodeURIComponent(interval)}`
    if(type=='name') {
        url = `${API_BASE_URL}/stock_data_by_company_name?name=${encodeURIComponent(companyName)}&period=${encodeURIComponent(period)}&interval=${encodeURIComponent(interval)}`;
    }

  const response = await fetch(url);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Nieznany błąd.'); 
  }
  return await response.json(); 
}

export async function fetchStockDataInComponent(companyName, period = '1mo', interval = '1d') {
    let url = `${API_BASE_URL}/stock_data_by_ticker?ticker=${encodeURIComponent(companyName)}&period=${encodeURIComponent(period)}&interval=${encodeURIComponent(interval)}`
    console.log('fetching in component')
  const response = await fetch(url);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Nieznany błąd.'); 
  }
  return await response.json(); 
}

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY;
const MODEL_NAME = "gemini-2.0-flash-exp"; 

const genAI = new GoogleGenerativeAI(API_KEY);

async function getCompanyDescription(ticker, companyName) {  
    if (!ticker) {
        return null; 
    }

    try {
        const model = genAI.getGenerativeModel({ model: MODEL_NAME });

        const prompt = `Podaj zwięzłe informacje o firmie o tickerze giełdowym ${ticker} i nazwie ${companyName}
            Wypisz:
            - Pełną nazwę firmy,
            - Rok założenia,
            - Siedzibę (miasto, kraj),
            - Czym się zajmuje (branża),
            - Giełdę, na której jest notowana
            Napisz to w maksymalnie 100 słowach. Upewnij się że napewno ticker odpowiada firmie (sprawdź yahoo finance), jeśli nie będziesz mógl znaleźć to itak szukaj informacji o tickerze
            na gieldzie w warszawie`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        console.log("Generated description:", text);
        return text;

    } catch (error) {
        console.error("Błąd generowania opisu firmy:", error);
        throw error; 
    }
}

export async function fetchFinancialIndicators(ticker) {
  const url = `${API_BASE_URL}/indicators?ticker=${ticker}`;
  const response = await fetch(url);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Nieznany błąd.');
  }
  return await response.json();
}

// Dodaj tę funkcję do istniejącego pliku api.js
// Dodaj tę funkcję do istniejącego pliku api.js
export async function fetchStockPrediction(ticker) {
  const url = `${API_BASE_URL}/predict_stock?ticker=${encodeURIComponent(ticker)}&periods=120`;
  const response = await fetch(url);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Nieznany błąd.');
  }
  return await response.json();
}

export { getCompanyDescription };

export async function fetchNewsWithSentiment(ticker) {
  const url = `${API_BASE_URL}/news?ticker=${encodeURIComponent(ticker)}`;
  const response = await fetch(url);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Nieznany błąd.');
  }
  return await response.json();
}