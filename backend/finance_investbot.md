# InvestBot - AI Doradca Inwestycyjny

## Spis treści
1. [Opis ogólny](#opis-ogólny)
2. [Funkcjonalności](#funkcjonalności)
3. [Jak to działa](#jak-to-działa)
4. [Szczegółowy opis funkcji](#szczegółowy-opis-funkcji)
5. [Wymagania](#wymagania)
6. [Instalacja](#instalacja)
7. [Zastrzeżenia](#zastrzeżenia)

## Opis ogólny

InvestBot to system sztucznej inteligencji zaprojektowany do analizy danych giełdowych i generowania porad inwestycyjnych. Wykorzystuje uczenie maszynowe, analizę techniczną i AI do przewidywania potencjalnych ruchów cen akcji i dostarczania spersonalizowanych rekomendacji inwestycyjnych.

Głównym plikiem implementującym funkcjonalność jest `finance_investbot.py`, który zawiera logikę przetwarzania danych, trenowania modeli i generowania porad inwestycyjnych.

## Funkcjonalności

InvestBot oferuje następujące funkcjonalności:

1. **Prognozowanie kierunku ruchu ceny** - przewiduje czy cena akcji wzrośnie czy spadnie w ciągu najbliższych 5 dni handlowych
2. **Prognoza oczekiwanej stopy zwrotu** - szacuje procentową zmianę ceny w nadchodzącym okresie
3. **Analiza ryzyka** - oblicza wskaźniki ryzyka, takie jak współczynnik Sharpe'a, maksymalny drawdown i win rate
4. **Backtesting** - symuluje wyniki strategii inwestycyjnej opartej na sygnałach modelu i porównuje z pasywną strategią "kup i trzymaj"
5. **Porady AI** - generuje tekstowe rekomendacje i analizy wykorzystując model Gemini

## Jak to działa

### Krok 1: Pobieranie danych
System pobiera historyczne dane giełdowe dla określonego tickera (symbolu spółki) używając biblioteki yfinance. Dane zawierają ceny otwarcia, zamknięcia, najwyższe, najniższe oraz wolumen handlu.

### Krok 2: Obliczanie wskaźników technicznych
Na podstawie danych historycznych obliczane są różne wskaźniki techniczne, takie jak:
- Średnie kroczące (SMA20, SMA50, SMA200)
- RSI (Relative Strength Index)
- MACD (Moving Average Convergence Divergence)
- Wstęgi Bollingera

### Krok 3: Trenowanie modeli ML
System trenuje dwa rodzaje modeli uczenia maszynowego:
- **Model klasyfikacyjny** (RandomForestClassifier) do przewidywania kierunku ruchu ceny (wzrost/spadek)
- **Model regresyjny** (GradientBoostingRegressor) do przewidywania oczekiwanej stopy zwrotu

### Krok 4: Backtesting strategii
System wykonuje symulację historyczną (backtest) strategii inwestycyjnej opartej na sygnałach modelu:
1. Inwestuj tylko wtedy, gdy model przewiduje wzrost ceny
2. W przeciwnym wypadku pozostań poza rynkiem
3. Porównaj wyniki ze strategią "kup i trzymaj"

### Krok 5: Obliczanie metryk ryzyka
Na podstawie backtestów obliczane są różne metryki ryzyka:
- Współczynnik Sharpe'a (stosunek zysku do ryzyka)
- Maksymalny drawdown (największy spadek od szczytu do dołka)
- Win rate (procent zyskownych transakcji)
- Średni zwrot na transakcję

### Krok 6: Generowanie porad AI
System wykorzystuje Google Gemini API do generowania porad inwestycyjnych w języku naturalnym na podstawie:
- Danych o spółce
- Aktualnych wskaźników technicznych
- Wyników modelu i metryk ryzyka

### Krok 7: Przygotowanie odpowiedzi
Wszystkie powyższe elementy są łączone w kompleksową analizę inwestycyjną i zwracane jako odpowiedź API.

## Szczegółowy opis funkcji

### `get_stock_data(ticker, period="1y")`
Pobiera historyczne dane giełdowe dla danego tickera.
- **Argumenty**: ticker (symbol spółki), period (okres danych)
- **Zwraca**: DataFrame z danymi giełdowymi

### `prepare_features(df)`
Przygotowuje cechy dla modeli ML na podstawie surowych danych giełdowych.
- **Argumenty**: DataFrame z danymi giełdowymi
- **Zwraca**: DataFrame z obliczonymi wskaźnikami technicznymi i celami dla modeli

### `train_classification_model(data)`
Trenuje model klasyfikacyjny do przewidywania kierunku ruchu ceny.
- **Argumenty**: DataFrame z przygotowanymi cechami
- **Zwraca**: wytrenowany model, scaler, dokładność modelu, lista użytych cech

### `train_regression_model(data)`
Trenuje model regresyjny do przewidywania oczekiwanej stopy zwrotu.
- **Argumenty**: DataFrame z przygotowanymi cechami
- **Zwraca**: wytrenowany model, scaler, błąd średniokwadratowy, błąd bezwzględny, lista użytych cech

### `prepare_backtest_data(data, predictions, returns)`
Przygotowuje dane do wykresu backtestowego dla frontendu.
- **Argumenty**: dane historyczne, prognozy modelu, faktyczne zwroty
- **Zwraca**: słownik z danymi do wykresu (daty, wyniki strategii AI, wyniki strategii "kup i trzymaj")

### `calculate_risk_metrics(data, predictions, returns)`
Oblicza metryki ryzyka dla strategii inwestycyjnej.
- **Argumenty**: dane historyczne, prognozy modelu, faktyczne zwroty
- **Zwraca**: słownik z metrykami ryzyka

### `generate_ai_insights(ticker, data, prediction_accuracy, risk_metrics)`
Generuje tekstowe porady inwestycyjne przy użyciu Google Gemini.
- **Argumenty**: ticker, dane historyczne, dokładność predykcji, metryki ryzyka
- **Zwraca**: tekst z analizą inwestycyjną

### `get_investment_advice(ticker)`
Główna funkcja, która wykonuje całą analizę inwestycyjną dla danego tickera.
- **Argumenty**: ticker (symbol spółki)
- **Zwraca**: słownik z kompleksową analizą inwestycyjną

## Wymagania

Plik `finance_investbot.py` wymaga następujących bibliotek:
- numpy
- pandas
- yfinance
- scikit-learn
- datetime
- python-dotenv
- google-generativeai

## Instalacja

1. Upewnij się, że masz zainstalowany Python 3.6 lub nowszy.
2. Zainstaluj wymagane pakiety:

```bash
pip install numpy pandas yfinance scikit-learn python-dotenv google-generativeai