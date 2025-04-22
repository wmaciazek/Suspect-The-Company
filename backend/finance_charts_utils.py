from typing import Optional, Dict, Any
import yfinance as yf
import google.generativeai as genai
import os
import requests
import pandas as pd
import json
import re
from datetime import datetime, timedelta

class StockDataFetcher:
    def __init__(self):
        self.cache = {}
        # Ustawienia API
        api_key = os.getenv('GOOGLE_API_KEY')
        if api_key:
            try:
                genai.configure(api_key=api_key)
                self.model = genai.GenerativeModel('gemini-2.0-flash-exp')
                print("Model AI skonfigurowany pomyślnie")
            except Exception as e:
                print(f"Błąd konfiguracji modelu AI: {e}")
                self.model = None
        else:
            print("Ostrzeżenie: Brak GOOGLE_API_KEY")
            self.model = None

        # Mapowanie znanych firm do tickerów
        self.company_tickers = {
            'apple': 'AAPL',
            'microsoft': 'MSFT',
            'amazon': 'AMZN',
            'google': 'GOOGL',
            'alphabet': 'GOOGL',
            'meta': 'META',
            'facebook': 'META',
            'tesla': 'TSLA',
            'nvidia': 'NVDA',
            'netflix': 'NFLX',
            'adobe': 'ADBE',
            'intel': 'INTC',
            'amd': 'AMD',
            'coca cola': 'KO',
            'coca-cola': 'KO',
            'pepsi': 'PEP',
            'pepsico': 'PEP',
            'disney': 'DIS',
            'walmart': 'WMT',
            'nike': 'NKE',
            'mcdonalds': 'MCD',
            "mcdonald's": 'MCD',
            'boeing': 'BA',
            'visa': 'V',
            'mastercard': 'MA',
            'paypal': 'PYPL',
            'ibm': 'IBM',
            'oracle': 'ORCL',
            'cisco': 'CSCO',
            'salesforce': 'CRM',
            'twitter': 'X',
            'x': 'X',
            'spotify': 'SPOT',
            'uber': 'UBER',
            'lyft': 'LYFT',
            'airbnb': 'ABNB',
            'zoom': 'ZM',
            'robinhood': 'HOOD',
            'coinbase': 'COIN',
            # Polskie spółki
            'cd projekt': 'CDR.WA',
            'cdprojekt': 'CDR.WA',
            'pkn orlen': 'PKN.WA',
            'orlen': 'PKN.WA',
            'pko bp': 'PKO.WA',
            'pekao': 'PEO.WA',
            'kghm': 'KGH.WA',
            'pzu': 'PZU.WA',
            'allegro': 'ALE.WA',
        }

    def get_ticker_from_ai(self, company_name: str) -> Optional[str]:
        """
        Używa Google Gemini do znalezienia tickera na podstawie nazwy firmy
        """
        if not self.model:
            print("Błąd: Brak skonfigurowanego modelu AI")
            return None

        if company_name in self.cache:
            return self.cache[company_name]

        try:
            prompt = f"""
            Znajdź ticker giełdowy dla firmy "{company_name}".
            Odpowiedz dokładnie w tym formacie JSON bez żadnych dodatkowych znaków:
            {{"ticker": "SYMBOL", "exchange": "GIEŁDA", "confidence": 0-100}}
            """

            response = self.model.generate_content(prompt)
            result = response.text.strip()
            
            # Usuń backticki i "json" jeśli występują
            result = result.replace('```json', '').replace('```', '').strip()
            
            try:
                data = json.loads(result)
                
                if data['confidence'] >= 50:
                    if self.verify_ticker(data['ticker'], company_name):
                        self.cache[company_name] = data['ticker']
                        return data['ticker']
                        
            except json.JSONDecodeError as e:
                print(f"Błąd parsowania JSON dla odpowiedzi AI: {result}")
                print(f"Szczegóły błędu: {e}")
            
            return None

        except Exception as e:
            print(f"Błąd AI podczas szukania tickera: {e}")
            return None

    def verify_ticker(self, ticker: str, company_name: str) -> bool:
        """
        Weryfikuje czy ticker odpowiada nazwie firmy
        """
        try:
            ticker_info = yf.Ticker(ticker)
            company_info = ticker_info.info
            
            fields_to_check = [
                'shortName',
                'longName',
                'description',
                'sector',
                'industry'
            ]

            company_name_lower = company_name.lower()
            for field in fields_to_check:
                if field in company_info:
                    field_value = str(company_info[field]).lower()
                    if company_name_lower in field_value:
                        return True

            return False

        except Exception as e:
            print(f"Błąd weryfikacji tickera {ticker}: {e}")
            return False

    def get_stock_data(self, query: str, period: str = '1mo', interval: str = '1d') -> Optional[Dict[str, Any]]:
        """
        Pobiera dane giełdowe na podstawie tickera lub nazwy firmy
        """
        try:
            # Jeśli query wygląda jak ticker, użyj go bezpośrednio bez AI
            if re.match(r'^[A-Z0-9\.]{1,5}$', query):
                ticker = query
                return self.fetch_stock_data(ticker, period, interval, query)
                
            # Jeśli to nie ticker, spróbuj znaleźć w lokalnym mapowaniu
            ticker = self.company_tickers.get(query.lower())
            
            # Jeśli nie znaleziono w mapowaniu, dopiero wtedy użyj AI
            if not ticker:
                ticker = self.get_ticker_from_ai(query)

            if not ticker:
                print(f"Nie znaleziono tickera dla: {query}")
                return None

            print(f"Pobieranie danych dla tickera: {ticker}")
            return self.fetch_stock_data(ticker, period, interval, query)

        except Exception as e:
            print(f"Błąd pobierania danych: {e}")
            return None

    def fetch_stock_data(self, ticker: str, period: str, interval: str, original_query: str) -> Optional[Dict[str, Any]]:
        """
        Pobiera dane giełdowe z yfinance
        """
        try:
            # Pobieranie danych
            data = yf.download(ticker, period=period, interval=interval)
            
            if data.empty:
                print(f"Brak danych dla tickera: {ticker}")
                return None

            # Przygotowanie danych
            data = data.reset_index()
            if isinstance(data.columns, pd.MultiIndex):
                data.columns = ['_'.join(col).strip() for col in data.columns.values]
            else:
                data.columns = [col.lower() for col in data.columns]

            # Pobieranie informacji o walucie
            ticker_info = yf.Ticker(ticker)
            currency = ticker_info.info.get('currency', 'USD')
            
            # Konwersja do USD jeśli potrzebne
            if currency != 'USD':
                exchange_rate = self.get_exchange_rate(currency)
                if exchange_rate:
                    price_columns = ['open', 'high', 'low', 'close', 'adj close']
                    for col in price_columns:
                        if col in data.columns:
                            data[col] *= exchange_rate

            # Znajdź kolumnę z ceną zamknięcia
            close_col = next((col for col in data.columns if 'close' in col.lower()), None)
            if not close_col:
                print(f"Nie znaleziono kolumny 'close' dla {ticker}")
                return None

            # Obliczanie SMA
            sma_50 = data[close_col].rolling(window=50).mean()
            
            # Pobierz więcej informacji o firmie
            info = ticker_info.info
            company_info = {
                'name': info.get('longName', original_query),
                'sector': info.get('sector', 'Brak danych'),
                'industry': info.get('industry', 'Brak danych'),
                'website': info.get('website', 'Brak danych'),
                'description': info.get('longBusinessSummary', 'Brak opisu'),
                'market_cap': info.get('marketCap', 0),
                'employees': info.get('fullTimeEmployees', 0),
            }
            
            return {
                'ticker': ticker,
                'companyName': original_query,
                'companyInfo': company_info,
                'stockData': data.to_dict(orient='records'),
                'smaData': sma_50.dropna().reset_index().to_dict(orient='records'),
                'currency': 'USD'
            }

        except Exception as e:
            print(f"Błąd pobierania danych z yfinance dla {ticker}: {e}")
            return None

    def get_exchange_rate(self, from_currency: str, to_currency: str = 'USD') -> Optional[float]:
        """
        Pobiera kurs wymiany walut
        """
        try:
            url = f'https://api.exchangerate-api.com/v4/latest/{from_currency}'
            response = requests.get(url)
            data = response.json()
            return data['rates'].get(to_currency)
        except Exception as e:
            print(f"Błąd pobierania kursu wymiany {from_currency} -> {to_currency}: {e}")
            return None

def get_stock_data_by_ticker(ticker: str, period: str = '1mo', interval: str = '1d') -> Optional[Dict[str, Any]]:
    """
    Pobiera dane giełdowe bezpośrednio po tickerze (bez użycia AI)
    """
    fetcher = StockDataFetcher()
    # Bezpośrednie użycie fetch_stock_data z pominięciem szukania tickera
    return fetcher.fetch_stock_data(ticker, period, interval, ticker)

def get_stock_data_by_company_name(company_name: str, period: str = '1mo', interval: str = '1d') -> Optional[Dict[str, Any]]:
    """
    Pobiera dane giełdowe po nazwie firmy (z użyciem AI jeśli potrzebne)
    """
    fetcher = StockDataFetcher()
    return fetcher.get_stock_data(company_name, period, interval)