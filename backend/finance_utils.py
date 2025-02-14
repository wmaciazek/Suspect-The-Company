import requests
from bs4 import BeautifulSoup
import yfinance as yf
import re
import pandas as pd

def is_valid_ticker(ticker):
    #walidacja tickera
    return bool(re.match(r'^[A-Z0-9\.\-]+(?:\.[A-Z]{2,})?$', ticker))

def get_ticker_from_yahoo(company_name):
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
        print(f"blad scrapowania: {e}")
        return None
    except Exception as e:
        print(f"blad scrapowania: {e}")
        return None

def get_stock_data_from_yfinance(ticker, period='1mo', interval='1d', retry_ticker=None):
    try:
        print(f"Pobieram dane dla: {ticker}, period: {period}, interval: {interval}")  
        data = yf.download(ticker, period=period, interval=interval)
        print(f"yf.download() returned: data.shape={data.shape}")  
        print(f"yf.download() returned: data.index.min()={data.index.min() if not data.empty else 'EMPTY'}")  
        print(f"yf.download() returned: data.index.max()={data.index.max() if not data.empty else 'EMPTY'}")  
        print(f"yf.download() returned: data.head()=\n{data.head()}")

        if data.empty:
            raise ValueError(f"dane puste dla tickera '{ticker}'.")

        data = data.reset_index()
        if isinstance(data.columns, pd.MultiIndex):
            data.columns = ['_'.join(col).strip() for col in data.columns.values]

        close_col = next((col for col in data.columns if 'close' in col.lower()), None)
        if not close_col:
            raise KeyError("blad kolumn")

        data_json = data.to_dict(orient='records')
        sma_json = data[close_col].rolling(window=50).mean().dropna().reset_index().to_dict(orient='records')

        return {'ticker': ticker, 'stockData': data_json, 'smaData': sma_json}

    except (ValueError, KeyError) as e:
        print(f"blad pobierania ({ticker}): {e}")
        if retry_ticker:
            print(f"ponowne pobieranie: {retry_ticker}")
            try:
                return get_stock_data_from_yfinance(retry_ticker, period, interval) 
            except Exception:
                raise ValueError(f"blad pobierania danych dla {ticker}")
        raise
    except Exception as e:
        print(f"blad pobierania ({ticker}): {e}")
        raise

def get_stock_data(company_name, period='1mo', interval='1d'):
    ticker = None

    # sprawdzanie czy ticker
    if is_valid_ticker(company_name):
        ticker = company_name
        print(f"'{company_name}' to ticker.")

    # scrapowanie
    if not ticker:
        ticker = get_ticker_from_yahoo(company_name)
        print(f"Yahoo Finance: {ticker}")

    if not ticker:
        return None  

    try:
        return get_stock_data_from_yfinance(ticker, period, interval)
    except Exception as e:
        print(f"blad pobierania '{ticker}': {e}")
        return None