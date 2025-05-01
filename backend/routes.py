from flask import Blueprint, request, jsonify
from finance_charts_utils import get_stock_data_by_ticker, get_stock_data_by_company_name
from finance_indicators import get_financial_indicators
from finance_predictions import predict_stock_prices
from finance_news import get_news_with_sentiment
from finance_investbot import get_investment_advice
from deep_translator import GoogleTranslator

routes = Blueprint('routes', __name__)

@routes.route('/api/stock_data_by_ticker', methods=['GET'])
def stock_data_by_ticker_endpoint():
    """
    Endpoint do pobierania danych po tickerze
    """
    ticker = request.args.get('ticker')
    period = request.args.get('period', '1mo')
    interval = request.args.get('interval', '1d')

    if not ticker:
        return jsonify({'error': 'Musisz podać ticker.'}), 400

    try:
        data = get_stock_data_by_ticker(ticker, period, interval)
        if data:
            return jsonify(data)
        return jsonify({'error': f'Brak danych dla tickera "{ticker}".'}), 404
    except Exception as e:
        print(f"Błąd podczas pobierania danych dla {ticker}: {e}")
        return jsonify({'error': str(e)}), 500

@routes.route('/api/stock_data_by_company_name', methods=['GET'])
def stock_data_by_company_name_endpoint():
    """
    Endpoint do pobierania danych po nazwie firmy
    """
    company_name = request.args.get('name')
    period = request.args.get('period', '1mo')
    interval = request.args.get('interval', '1d')

    if not company_name:
        return jsonify({'error': 'Musisz podać nazwę firmy.'}), 400

    try:
        data = get_stock_data_by_company_name(company_name, period, interval)
        if data:
            return jsonify(data)
        return jsonify({'error': f'Nie znaleziono danych dla firmy "{company_name}".'}), 404
    except Exception as e:
        print(f"Błąd podczas pobierania danych dla {company_name}: {e}")
        return jsonify({'error': str(e)}), 500

@routes.route('/api/indicators', methods=['GET'])
def fetch_indicators_endpoint():
    ticker = request.args.get('ticker')
    if not ticker:
        return jsonify({'error': 'Musisz podać ticker.'}), 400

    try:
        indicators = get_financial_indicators(ticker)
        if hasattr(indicators, "empty"):
            if not indicators.empty:
                return jsonify(indicators)
        elif isinstance(indicators, (list, dict)):
            if indicators:
                return jsonify(indicators)
        return jsonify({'error': f'Błąd pobierania wskaźników dla tickera "{ticker}".'}), 500
    except Exception as e:
        return jsonify({'error': f'Wyjątek: {str(e)}'}), 500

@routes.route('/api/predict_stock', methods=['GET'])
def predict_stock():
    ticker = request.args.get('ticker')
    periods = int(request.args.get('periods', 30))
    start_date = request.args.get('start_date', "2000-01-01")

    if not ticker:
        return jsonify({'error': 'Musisz podać ticker.'}), 400

    try:
        result = predict_stock_prices(ticker=ticker, periods=periods, start_date=start_date)
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': f'Wyjątek: {str(e)}'}), 500
    
@routes.route('/api/news', methods=['GET'])
def fetch_news_endpoint():
    ticker = request.args.get('ticker')
    
    if not ticker:
        return jsonify({'error': 'Musisz podać ticker.'}), 400

    try:
        news_data = get_news_with_sentiment(ticker)
        return jsonify(news_data)
    except Exception as e:
        return jsonify({'error': f'Wyjątek: {str(e)}'}), 500
    
@routes.route('/api/translate', methods=['POST'])
def translate_text():
    try:
        data = request.json
        text = data.get('text', '')
        
        if not text:
            return jsonify({'error': 'Brak tekstu do tłumaczenia'}), 400

        translator = GoogleTranslator(source='auto', target='pl')
        translated = translator.translate(text)

        return jsonify({
            'status': 'success',
            'translated_text': translated
        })
    except Exception as e:
        print(f"Błąd tłumaczenia: {str(e)}")
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500

# Dodaj tę nową trasę do routes.py
@routes.route('/api/investbot', methods=['GET'])
def investbot_endpoint():
    ticker = request.args.get('ticker')
    if not ticker:
        return jsonify({'error': 'Musisz podać ticker.'}), 400

    try:
        advice = get_investment_advice(ticker)
        if isinstance(advice, dict) and 'error' in advice:
            return jsonify({'error': advice['error']}), 500
        return jsonify(advice)
    except Exception as e:
        return jsonify({'error': f'Wyjątek: {str(e)}'}), 500