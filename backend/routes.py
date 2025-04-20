from flask import Blueprint, request, jsonify
from finance_charts_utils import get_stock_data_by_ticker, get_stock_data_by_company_name
from finance_indicators import get_financial_indicators
from finance_predictions import predict_stock_prices

routes = Blueprint('routes', __name__)

@routes.route('/api/stock_data_by_ticker', methods=['GET'])
def stock_data_by_ticker_endpoint():
    ticker = request.args.get('ticker')
    period = request.args.get('period', '1mo')
    interval = request.args.get('interval', '1d')

    if not ticker:
        return jsonify({'error': 'Musisz podać ticker.'}), 400

    try:
        data = get_stock_data_by_ticker(ticker, period, interval)
        if hasattr(data, "empty"):
            if not data.empty:
                return jsonify(data)
        elif isinstance(data, (list, dict)):
            if data:
                return jsonify(data)
        return jsonify({'error': f'Błąd pobierania danych dla tickera "{ticker}".'}), 500
    except Exception as e:
        return jsonify({'error': f'Wyjątek: {str(e)}'}), 500

@routes.route('/api/stock_data_by_company_name', methods=['GET'])
def stock_data_by_company_name_endpoint():
    company_name = request.args.get('name')
    period = request.args.get('period', '1mo')
    interval = request.args.get('interval', '1d')

    if not company_name:
        return jsonify({'error': 'Musisz podać nazwę firmy.'}), 400

    try:
        data = get_stock_data_by_company_name(company_name, period, interval)
        if hasattr(data, "empty"):
            if not data.empty:
                return jsonify(data)
        elif isinstance(data, (list, dict)):
            if data:
                return jsonify(data)
        return jsonify({'error': f'Błąd pobierania danych dla firmy "{company_name}".'}), 500
    except Exception as e:
        return jsonify({'error': f'Wyjątek: {str(e)}'}), 500

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