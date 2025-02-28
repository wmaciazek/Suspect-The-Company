import { GoogleGenerativeAI } from "@google/generative-ai";

const API_BASE_URL = 'http://127.0.0.1:5000/api'; 

export async function fetchStockData(companyName, type, period = '1mo', interval = '1d') {
    console.log('API call', type)
    if(type=='ticker') {
        console.log('searching by ticker | api')
        const url = `${API_BASE_URL}/stock_data_by_ticker?name=${encodeURIComponent(companyName)}&period=${encodeURIComponent(period)}&interval=${encodeURIComponent(interval)}`;

        const response = await fetch(url);
        console.log(response)
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Nieznany błąd.'); 
        }
      
        return await response.json(); 
    } else if(type=='name') {
        console.log('searching by name | api')
        const url = `${API_BASE_URL}/stock_data_by_company_name?name=${encodeURIComponent(companyName)}&period=${encodeURIComponent(period)}&interval=${encodeURIComponent(interval)}`;

        const response = await fetch(url);
        console.log(response)
        if (!response.ok) {
            console.log('blad odpowiedzi')
          const errorData = await response.json();
          throw new Error(errorData.error || 'Nieznany błąd.'); 
        }
      
        return await response.json(); 
    }
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
            Napisz to w maksymalnie 100 słowach. Upewnij się że napewno ticker odpowiada firmie (sprawdź yahoo finance)
            `;

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

export { getCompanyDescription }; 