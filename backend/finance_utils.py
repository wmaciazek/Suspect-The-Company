import requests
from bs4 import BeautifulSoup
import yfinance as yf
import re
import pandas as pd

def is_valid_ticker(ticker):
    """Sprawdza, czy ticker wygląda poprawnie (i ma rozszerzenie)."""
    return bool(re.match(r'^[A-Z0-9\.\-]+(?:\.[A-Z]{2,})?$', ticker))

def get_ticker_from_yahoo(company_name):
    """Scrapuje stronę wyszukiwania Yahoo Finance."""
    url = f'https://finance.yahoo.com/lookup?s={company_name}'
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
        }
        response = requests.get(url, headers=headers)
        response.raise_for_status()  
        soup = BeautifulSoup(response.content, 'html.parser')

        results = soup.find_all('tr')
        if not results:
            return None

        for result in results:
            cells = result.find_all('td')
            if cells and len(cells) > 1:
                ticker_cell = cells[0]
                name_cell = cells[1]

                ticker = ticker_cell.text.strip()
                name = name_cell.text.strip()

                if '.' in ticker:  
                    if company_name.lower() in name.lower():
                        return ticker

        return None

    except requests.exceptions.RequestException as e:
        print(f"Błąd scrapowania Yahoo Finance: {e}")
        return None 
    except Exception as e:
        print(f"Inny błąd podczas scrapowania Yahoo Finance: {e}")
        return None  


def get_exchange_rate(base_currency, target_currency='USD'):
    """Pobiera kurs wymiany z API exchangerate-api.com."""
    if target_currency != 'USD':
        print('Darmowy plan obsługuje tylko zamianę na USD')
        return 1  
    try:
        # URL dla darmowego planu
        url = f'https://api.exchangerate-api.com/v4/latest/{base_currency}'
        response = requests.get(url)
        response.raise_for_status()  
        data = response.json()

        if 'rates' in data and target_currency in data['rates']:
            return data['rates'][target_currency]
        else:
            print(f"Brak kursu dla {base_currency} -> {target_currency} w odpowiedzi.")
            return None  

    except requests.exceptions.RequestException as e:
        print(f"Błąd żądania do API: {e}")
        return None  
    except (KeyError, ValueError) as e:
        print(f"Błąd przetwarzania odpowiedzi API: {e}")
        return None

def get_stock_data_from_yfinance(ticker, period='1mo', interval='1d', retry_ticker=None):
    """Pobiera dane z yfinance, przelicza na USD, z opcją ponownej próby."""
    try:
        print(f"Pobieram dane dla: {ticker}, period={period}, interval={interval}")
        data = yf.download(ticker, period=period, interval=interval)
        print(f"yf.download() returned: data.shape={data.shape}")
        print(f"yf.download() returned: data.index.min()={data.index.min() if not data.empty else 'EMPTY'}")
        print(f"yf.download() returned: data.index.max()={data.index.max() if not data.empty else 'EMPTY'}")
        print(f"yf.download() returned: data.head()=\n{data.head()}")

        if data.empty:
            raise ValueError(f"yfinance nie zwrócił danych dla tickera '{ticker}'.")

        data = data.reset_index()
        if isinstance(data.columns, pd.MultiIndex):
            data.columns = ['_'.join(col).strip() for col in data.columns.values]

        close_col = next((col for col in data.columns if 'close' in col.lower()), None)
        if not close_col:
            raise KeyError("Nie znaleziono kolumny 'Close' w danych.")

        ticker_info = yf.Ticker(ticker)
        try:
            currency = ticker_info.info['currency'] 
        except (KeyError, TypeError) as e: 
            print(f"Nie udało się pobrać waluty dla {ticker}, używam domyślnej (USD): {e}")
            currency = 'USD'  
        print(f"Waluta dla {ticker}: {currency}")

        # pobieranie kursu wymiany
        exchange_rate = get_exchange_rate(currency.upper(), 'USD')  
        print(f"Kurs wymiany: {exchange_rate}")

        if exchange_rate is not None:
            for col in data.columns:
                if 'open' in col.lower() or 'high' in col.lower() or 'low' in col.lower() or 'close' in col.lower():
                    data[col] = data[col] * exchange_rate
        else:
             raise ValueError(f"Nie udało się pobrać kursu wymiany dla {currency} -> USD")

        data_json = data.to_dict(orient='records')
        sma_json = data[close_col].rolling(window=50).mean().dropna().reset_index().to_dict(orient='records')

        return {'ticker': ticker, 'stockData': data_json, 'smaData': sma_json, 'currency': 'USD'} 

    except (ValueError, KeyError) as e:
        print(f"Błąd yfinance ({ticker}): {e}")
        if retry_ticker:
            print(f"Ponawiam próbę z tickerem: {retry_ticker}")
            try:
                return get_stock_data_from_yfinance(retry_ticker, period, interval)
            except Exception as inner_e:
                raise ValueError(f"Nie udało się pobrać danych ani dla {ticker}, ani dla {retry_ticker}. Błąd: {inner_e}") from inner_e
        raise
    except Exception as e:
        print(f"Nieoczekiwany błąd yfinance ({ticker}): {e}")
        raise

def get_stock_data(company_name, period='1mo', interval='1d'):
    ticker = None

    if is_valid_ticker(company_name):
        ticker = company_name
        print(f"Uznano '{company_name}' za ticker.")

    if not ticker:
        ticker = get_ticker_from_yahoo(company_name)
        print(f"Yahoo Finance: {ticker}")

    if not ticker:
        return None

    try:
        data =  get_stock_data_from_yfinance(ticker, period, interval)
        if data:
            data['companyName'] = company_name 
        return data
    except Exception as e:
        print(f"Błąd pobierania danych dla '{ticker}': {e}")
        return None