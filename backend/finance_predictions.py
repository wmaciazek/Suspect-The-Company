import yfinance as yf
import pandas as pd
from statsmodels.tsa.arima.model import ARIMA
import logging

# Konfiguracja loggera
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def fetch_historical_data(ticker, start_date="2000-01-01"):
    """
    Pobiera dane historyczne dla podanego tickera za pomocą yfinance.

    Args:
        ticker (str): Symbol giełdowy (np. "AAPL").
        start_date (str): Data początkowa w formacie YYYY-MM-DD.

    Returns:
        pd.DataFrame: Dane historyczne w formacie DataFrame.
    """
    try:
        stock_data = yf.download(ticker, start=start_date)
        if stock_data.empty:
            raise ValueError(f"Brak danych dla tickera {ticker}.")
        return stock_data[["Close"]].reset_index()
    except Exception as e:
        logger.error(f"Błąd podczas pobierania danych dla tickera {ticker}: {e}")
        raise

def predict_stock_prices(ticker, periods=30, start_date="2000-01-01"):
    """
    Przewiduje ceny akcji na podstawie danych historycznych dla danego tickera.

    Args:
        ticker (str): Symbol giełdowy (np. "AAPL").
        periods (int): Liczba dni do przodu, na którą chcemy przewidzieć ceny.
        start_date (str): Data początkowa do pobierania danych historycznych.

    Returns:
        list of dict: Przewidywane daty ('date') i ceny ('prediction').
    """
    try:
        # Pobranie danych historycznych
        df = fetch_historical_data(ticker, start_date=start_date)

        # Przygotowanie danych dla modelu ARIMA
        df['date'] = pd.to_datetime(df['Date'])
        df = df.sort_values('date')
        y = df['Close']

        # Dopasowanie modelu ARIMA
        model = ARIMA(y, order=(5, 1, 0))  # (p, d, q) można dostosować
        model_fit = model.fit()

        # Prognozowanie
        forecast = model_fit.forecast(steps=periods)

        # Generowanie przyszłych dat
        last_date = df['date'].iloc[-1]
        future_dates = [last_date + pd.Timedelta(days=i) for i in range(1, periods + 1)]

        # Zwracanie wyników jako lista słowników
        return [{'date': future_dates[i], 'prediction': forecast[i]} for i in range(periods)]

    except Exception as e:
        logger.error(f"Błąd podczas przewidywania cen akcji dla tickera {ticker}: {e}")
        raise