const API_BASE_URL = 'http://127.0.0.1:5000/api';

export async function fetchStockData(companyName, period = '1mo', interval = '1d') {
  const url = `<span class="math-inline">\{API\_BASE\_URL\}/stock\_data?name\=</span>{encodeURIComponent(companyName)}&period=<span class="math-inline">\{encodeURIComponent\(period\)\}&interval\=</span>{encodeURIComponent(interval)}`;

  const response = await fetch(url);

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Nieznany błąd.');
  }

  return await response.json();
}