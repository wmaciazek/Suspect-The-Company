import yfinance as yf
import pandas as pd
from statsmodels.tsa.statespace.sarimax import SARIMAX
import logging
from datetime import timedelta
import numpy as np

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def fetch_historical_data(ticker, start_date="2000-01-01"):
    try:
        stock_data = yf.download(ticker, start=start_date)
        if stock_data.empty:
            raise ValueError(f"Brak danych dla tickera {ticker}.")
        stock_data = stock_data[["Close"]].copy()
        stock_data = stock_data.reset_index()
        return stock_data
    except Exception as e:
        logger.error(f"Błąd podczas pobierania danych dla tickera {ticker}: {e}")
        raise ValueError(f"Błąd podczas pobierania danych dla tickera {ticker}: {e}")

def predict_stock_prices(ticker, periods=30, start_date="2000-01-01"):
    try:
        df = fetch_historical_data(ticker, start_date=start_date)

        if isinstance(df.columns, pd.MultiIndex):
            if 'Close' in df.columns.get_level_values(0):
                close_col = [col for col in df.columns if col[0] == 'Close'][0]
                y = df[close_col]
            else:
                raise ValueError("Brak kolumny 'Close' w danych.")
        else:
            y = df['Close']

        if 'Date' not in df.columns:
            raise ValueError("Brak kolumny 'Date' w danych historycznych!")
        df['date'] = pd.to_datetime(df['Date'])
        df = df.sort_values('date')

        if y.isnull().any():
            raise ValueError(f"Brakujące wartości w danych giełdowych dla {ticker}.")
        if y.empty or len(y) < 10:
            raise ValueError(f"Za mało danych historycznych do prognozy dla {ticker} (min. 10 punktów).")

        # parametry
        model = SARIMAX(y,
                       order=(3, 1, 2),
                       seasonal_order=(1, 1, 1, 12),
                       enforce_stationarity=False,
                       enforce_invertibility=False
                      )
        model_fit = model.fit(disp=False)
        
        forecast_result = model_fit.get_forecast(steps=periods)
        forecast = forecast_result.predicted_mean
        conf_int = forecast_result.conf_int(alpha=0.05)  # 100-0,5 = przedzial ufnosci

        last_date = df['date'].iloc[-1]
        future_dates = [last_date + timedelta(days=i) for i in range(1, periods + 1)]

        prediction_data = []
        for i in range(periods):
            prediction_data.append({
                'date': future_dates[i].date().isoformat(),
                'value': float(forecast.iloc[i]),
                'lower_bound': float(conf_int.iloc[i][0]), 
                'upper_bound': float(conf_int.iloc[i][1])   
            })

        historical_data = []
        for idx, row in df.iterrows():
            close_val = row['Close']
            if isinstance(close_val, pd.Series):
                close_val = close_val.iloc[0]
            date_val = row['date']
            if isinstance(date_val, pd.Series):
                date_val = date_val.iloc[0]
            if hasattr(date_val, "date"):
                date_str = date_val.date().isoformat()
            else:
                date_str = str(date_val)
            historical_data.append({
                'date': date_str,
                'value': float(close_val)
            })

        return {
            'predictionData': prediction_data,
            'historicalData': historical_data
        }

    except Exception as e:
        logger.error(f"Błąd podczas przewidywania cen akcji dla tickera {ticker}: {e}")
        raise ValueError(f"Błąd podczas przewidywania cen akcji dla tickera {ticker}: {str(e)}")