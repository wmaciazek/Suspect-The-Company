const API_BASE_URL = 'http://127.0.0.1:5000/api'; 

export async function fetchStockData(companyName, period = '1mo', interval = '1d') {
  const url = `${API_BASE_URL}/stock_data?name=${encodeURIComponent(companyName)}&period=${encodeURIComponent(period)}&interval=${encodeURIComponent(interval)}`;

  const response = await fetch(url);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Nieznany błąd.'); 
  }

  return await response.json(); 
}