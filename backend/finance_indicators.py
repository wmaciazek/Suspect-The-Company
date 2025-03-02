import yfinance as yf

def get_financial_indicators(ticker):
    try:
        stock = yf.Ticker(ticker)
        info = stock.info

        indicators = {
            "returnOnEquity": info.get("returnOnEquity"),
            "returnOnAssets": info.get("returnOnAssets"),
            "period": "annual" if info.get("annualReports") else "quarterly" 
        }
        return indicators
    except Exception as e:
        print(f"Błąd podczas pobierania danych dla {ticker}: {e}")
        return None
