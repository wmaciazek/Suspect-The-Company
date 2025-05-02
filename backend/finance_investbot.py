import numpy as np
import pandas as pd
import yfinance as yf
from sklearn.ensemble import RandomForestClassifier, GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, mean_squared_error, mean_absolute_error
import datetime
import os
from dotenv import load_dotenv
import google.generativeai as genai
import warnings

warnings.filterwarnings("ignore", category=FutureWarning)
warnings.filterwarnings("ignore", category=UserWarning)

load_dotenv()

genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

def get_stock_data(ticker, period="1y"):
    """Pobierz historyczne dane giełdowe"""
    try:
        stock = yf.Ticker(ticker)
        df = stock.history(period=period)
        if df.empty:
            raise ValueError(f"Nie znaleziono danych dla tickera {ticker}")
        return df
    except Exception as e:
        raise Exception(f"Błąd podczas pobierania danych dla {ticker}: {str(e)}")

def prepare_features(df):
    """Przygotuj cechy dla modeli ML"""
    data = df.copy()
    
    #wskaźniki techniczne
    data['SMA20'] = data['Close'].rolling(window=20).mean()  # średnia krocząca z 20 dni
    data['SMA50'] = data['Close'].rolling(window=50).mean()  # średnia krocząca z 50 dni
    data['SMA200'] = data['Close'].rolling(window=200).mean()  # średnia krocząca z 200 dni
    
    # RSI
    delta = data['Close'].diff()
    gain = delta.where(delta > 0, 0)
    loss = -delta.where(delta < 0, 0)
    avg_gain = gain.rolling(window=14).mean()
    avg_loss = loss.rolling(window=14).mean()
    rs = avg_gain / avg_loss
    data['RSI'] = 100 - (100 / (1 + rs))
    
    # MACD 
    data['EMA12'] = data['Close'].ewm(span=12, adjust=False).mean()
    data['EMA26'] = data['Close'].ewm(span=26, adjust=False).mean()
    data['MACD'] = data['EMA12'] - data['EMA26']
    data['Signal'] = data['MACD'].ewm(span=9, adjust=False).mean()
    data['MACD_Hist'] = data['MACD'] - data['Signal']
    
    # Wstęgi Bollingera
    data['BB_Middle'] = data['Close'].rolling(window=20).mean()
    data['BB_Std'] = data['Close'].rolling(window=20).std()
    data['BB_Upper'] = data['BB_Middle'] + (data['BB_Std'] * 2)
    data['BB_Lower'] = data['BB_Middle'] - (data['BB_Std'] * 2)
    data['BB_Width'] = (data['BB_Upper'] - data['BB_Lower']) / data['BB_Middle']
    
    data['Target_5day'] = (data['Close'].shift(-5) > data['Close']).astype(int)
    data['Return_5day'] = data['Close'].pct_change(periods=5).shift(-5)
    data.dropna(inplace=True)
    
    if len(data) < 30:
        raise ValueError("Za mało danych do analizy. Potrzeba co najmniej 30 dni notowań.")
    
    return data

def train_classification_model(data):
    """Trenuj model klasyfikacyjny do przewidywania kierunku ruchu ceny"""
    features = ['SMA20', 'SMA50', 'SMA200', 'RSI', 'MACD', 'Signal', 'MACD_Hist', 'BB_Width']
    X = data[features].values
    y = data['Target_5day'].values
    
    if not np.isfinite(X).all():
        X = np.nan_to_num(X, nan=0.0, posinf=0.0, neginf=0.0)
    
    split_idx = int(len(X) * 0.8)
    X_train, X_test = X[:split_idx], X[split_idx:]
    y_train, y_test = y[:split_idx], y[split_idx:]
    
    scaler = StandardScaler()
    X_train = scaler.fit_transform(X_train)
    X_test = scaler.transform(X_test)
    
    model = RandomForestClassifier(
        n_estimators=100, 
        random_state=42,
        n_jobs=-1,
        max_samples=None 
    )
    model.fit(X_train, y_train)
    
    try:
        y_pred = model.predict(X_test)
        accuracy = accuracy_score(y_test, y_pred)
    except Exception as e:
        accuracy = 0.5  # dokladnosc
    
    return model, scaler, accuracy, features

def train_regression_model(data):
    features = ['SMA20', 'SMA50', 'SMA200', 'RSI', 'MACD', 'Signal', 'MACD_Hist', 'BB_Width']
    X = data[features].values
    y = data['Return_5day'].values
    
    if not np.isfinite(X).all():
        X = np.nan_to_num(X, nan=0.0, posinf=0.0, neginf=0.0)
    
    if not np.isfinite(y).all():
        valid_y = y[np.isfinite(y)]
        if len(valid_y) > 0:
            mean_y = np.mean(valid_y)
        else:
            mean_y = 0
        y = np.nan_to_num(y, nan=mean_y, posinf=mean_y, neginf=mean_y)
    
    split_idx = int(len(X) * 0.8)
    X_train, X_test = X[:split_idx], X[split_idx:]
    y_train, y_test = y[:split_idx], y[split_idx:]
    
    scaler = StandardScaler()
    X_train = scaler.fit_transform(X_train)
    X_test = scaler.transform(X_test)
    
    model = GradientBoostingRegressor(
        n_estimators=100,
        random_state=42,
        learning_rate=0.1,
        max_depth=3 #glebokosc drzewa
    )
    
    try:
        model.fit(X_train, y_train)
        
        # Ewaluacja
        y_pred = model.predict(X_test)
        mse = mean_squared_error(y_test, y_pred)
        mae = mean_absolute_error(y_test, y_pred)
    except Exception as e:
        print(f"Błąd regresji: {e}")
        model = None
        mse = 0
        mae = 0
        
    return model, scaler, mse, mae, features

def prepare_backtest_data(data, predictions, returns):
    dates = data.index.strftime('%Y-%m-%d').tolist()
    
    initial_value = 1000
    current_value = initial_value
    portfolio_values = [initial_value]
    
    for i in range(1, len(predictions)):
        if i < len(returns):  
            if predictions[i-1] == 1:
                if np.isfinite(returns[i]):
                    current_value *= (1 + returns[i])
            portfolio_values.append(current_value)
    
    buy_hold_values = [initial_value]
    current_buy_hold = initial_value
    
    for i in range(1, len(data)):
        if i < len(data):
            daily_return = data['Close'].pct_change().iloc[i]
            if np.isfinite(daily_return):
                current_buy_hold *= (1 + daily_return)
            buy_hold_values.append(current_buy_hold)
    
    min_length = min(len(portfolio_values), len(buy_hold_values), len(dates))
    portfolio_values = portfolio_values[:min_length]
    buy_hold_values = buy_hold_values[:min_length]
    dates = dates[:min_length]
    
    return {
        'dates': dates,
        'ai_strategy': portfolio_values,
        'buy_hold': buy_hold_values
    }

def calculate_risk_metrics(data, predictions, returns):
    #ryzyko!
    strategy_returns = []
    
    for i in range(1, min(len(predictions), len(returns))):
        if predictions[i-1] == 1 and np.isfinite(returns[i]):
            strategy_returns.append(returns[i])
        else:
            strategy_returns.append(0)
    
    #wskaźniki
    if len(strategy_returns) > 0 and np.std(strategy_returns) != 0:
        sharpe_ratio = np.mean(strategy_returns) / np.std(strategy_returns)
    else:
        sharpe_ratio = 0
    
    max_drawdown = 0
    peak = 1000
    trough = 1000
    portfolio = 1000
    
    for ret in strategy_returns:
        portfolio *= (1 + ret)
        
        if portfolio > peak:
            peak = portfolio
            trough = portfolio
        elif portfolio < trough:
            trough = portfolio
            current_drawdown = (peak - trough) / peak
            if current_drawdown > max_drawdown:
                max_drawdown = current_drawdown
    
    # winrate
    win_count = sum(1 for ret in strategy_returns if ret > 0)
    total_trades = sum(1 for ret in strategy_returns if ret != 0)
    win_rate = win_count / total_trades if total_trades > 0 else 0
    
    # zwrot
    non_zero_returns = [r for r in strategy_returns if r != 0]
    avg_return = np.mean(non_zero_returns) * 100 if non_zero_returns else 0
    
    return {
        'sharpe_ratio': round(sharpe_ratio, 2),
        'max_drawdown': round(max_drawdown * 100, 2),
        'win_rate': round(win_rate * 100, 2),
        'total_trades': total_trades,
        'average_return_per_trade': round(avg_return, 2)
    }

def generate_ai_insights(ticker, data, prediction_accuracy, risk_metrics):
    try:
        company = yf.Ticker(ticker)
        info = company.info
        company_name = info.get('longName', ticker)
        sector = info.get('sector', 'Nieznany')
        industry = info.get('industry', 'Nieznana')
        
        current_price = data['Close'].iloc[-1] if 'Close' in data and len(data) > 0 else 0
        sma50 = data['SMA50'].iloc[-1] if 'SMA50' in data and len(data) > 0 else 0
        sma200 = data['SMA200'].iloc[-1] if 'SMA200' in data and len(data) > 0 else 0
        rsi = data['RSI'].iloc[-1] if 'RSI' in data and len(data) > 0 else 0
        
        prompt = f"""
        Jako doradca inwestycyjny AI, przeanalizuj te dane dla {company_name} ({ticker}):
        
        Szczegóły spółki:
        - Nazwa: {company_name}
        - Ticker: {ticker}
        - Sektor: {sector}
        - Branża: {industry}
        
        Analiza techniczna:
        - Obecna cena: ${current_price:.2f}
        - 50-dniowa średnia krocząca: ${sma50:.2f}
        - 200-dniowa średnia krocząca: ${sma200:.2f}
        - RSI (14): {rsi:.2f}
        
        Wyniki modelu:
        - Dokładność prognoz: {prediction_accuracy*100:.2f}%
        - Wskaźnik Sharpe'a: {risk_metrics['sharpe_ratio']}
        - Maksymalny spadek: {risk_metrics['max_drawdown']}%
        - Win rate: {risk_metrics['win_rate']}%
        
        Na podstawie tych danych, dostarcz krótką poradę inwestycyjną dla {company_name} zawierającą:
        1. Ogólną ocenę (bycza, niedźwiedzia lub neutralna)
        2. Kluczowe mocne strony i obawy
        3. Ocenę ryzyka (niskie, średnie, wysokie)
        4. Perspektywę krótko- i długoterminową
        5. Podsumowanie rekomendacji w jednym zdaniu
        
        Udziel odpowiedzi po polsku, krótko i treściwie, koncentrując się na praktycznych poradach.
        Nie przekraczaj 300 słów.
        """
        
        try:
            model = genai.GenerativeModel('gemini-1.5-flash')
            response = model.generate_content(prompt)
            return response.text
        except Exception as ai_error:
            print(f"Błąd AI: {ai_error}")
            if current_price > sma50 and sma50 > sma200 and rsi < 70:
                return "Analiza techniczna wskazuje na trend wzrostowy. Cena powyżej średnich kroczących 50 i 200 dni, co jest pozytywnym sygnałem. RSI nie wskazuje na wykupienie rynku."
            elif current_price < sma50 and sma50 < sma200 and rsi > 30:
                return "Analiza techniczna wskazuje na trend spadkowy. Cena poniżej średnich kroczących 50 i 200 dni, co jest negatywnym sygnałem. RSI nie wskazuje na wyprzedanie rynku."
            else:
                return "Analiza techniczna wskazuje na mieszane sygnały. Zalecana ostrożność i dalsza obserwacja przed podjęciem decyzji inwestycyjnej."
            
    except Exception as e:
        return f"Nie udało się wygenerować porad AI: {str(e)}"

def get_investment_advice(ticker):
    #porady inwestycyjne
    try:
        stock_data = get_stock_data(ticker)
        prepared_data = prepare_features(stock_data)
        
        classification_model, class_scaler, accuracy, class_features = train_classification_model(prepared_data)
        regression_model, reg_scaler, mse, mae, reg_features = train_regression_model(prepared_data)
        
        X_backtest = prepared_data[class_features].values
        X_backtest_scaled = class_scaler.transform(X_backtest)
        
        if not np.isfinite(X_backtest_scaled).all():
            X_backtest_scaled = np.nan_to_num(X_backtest_scaled)
            
        predictions = classification_model.predict(X_backtest_scaled)
        backtest_data = prepare_backtest_data(prepared_data, predictions, prepared_data['Return_5day'].values)
        risk_metrics = calculate_risk_metrics(prepared_data, predictions, prepared_data['Return_5day'].values)
        
        # porady AI
        insights = generate_ai_insights(ticker, prepared_data, accuracy, risk_metrics)
        
        try:
            current_features = prepared_data[class_features].iloc[-1:].values
            current_features_scaled = class_scaler.transform(current_features)
            
            if not np.isfinite(current_features_scaled).all():
                current_features_scaled = np.nan_to_num(current_features_scaled)
                
            current_prediction = classification_model.predict(current_features_scaled)[0]
            current_pred_proba = classification_model.predict_proba(current_features_scaled)[0]
            max_confidence = float(max(current_pred_proba) * 100)
            
            if regression_model:
                current_return_pred = regression_model.predict(current_features_scaled)[0]
            else:
                current_return_pred = 0
        except Exception as predict_error:
            print(f"Błąd podczas generowania prognozy: {predict_error}")
            current_prediction = 1 if np.random.random() > 0.5 else 0
            max_confidence = 50.0
            current_return_pred = 0
        
        try:
            technical_data = {
                'close': float(prepared_data['Close'].iloc[-1]),
                'sma20': float(prepared_data['SMA20'].iloc[-1]),
                'sma50': float(prepared_data['SMA50'].iloc[-1]),
                'sma200': float(prepared_data['SMA200'].iloc[-1]),
                'rsi': float(prepared_data['RSI'].iloc[-1]),
                'macd': float(prepared_data['MACD'].iloc[-1]),
                'signal': float(prepared_data['Signal'].iloc[-1]),
                'bb_upper': float(prepared_data['BB_Upper'].iloc[-1]),
                'bb_lower': float(prepared_data['BB_Lower'].iloc[-1])
            }
        except Exception as tech_error:
            technical_data = {
                'close': 0.0,
                'sma20': 0.0,
                'sma50': 0.0,
                'sma200': 0.0,
                'rsi': 0.0,
                'macd': 0.0,
                'signal': 0.0,
                'bb_upper': 0.0,
                'bb_lower': 0.0
            }
        
        response = {
            'ticker': ticker,
            'current_price': float(prepared_data['Close'].iloc[-1]),
            'prediction': 'WZROST' if current_prediction == 1 else 'SPADEK',
            'prediction_confidence': float(max_confidence),
            'expected_return': float(current_return_pred * 100),
            'backtest_data': backtest_data,
            'technical_data': technical_data,
            'model_accuracy': float(accuracy * 100),
            'risk_metrics': risk_metrics,
            'ai_insights': insights,
            'last_updated': datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
        
        return response
    
    except Exception as e:
        print(f"błąd: {e}")
        return {'error': str(e)}