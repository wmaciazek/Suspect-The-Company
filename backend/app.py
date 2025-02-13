from flask import Flask, request, jsonify
from flask_cors import CORS
from utils import (
    is_valid_ticker,
    get_ticker_from_yahoo,
    get_stock_data_from_yfinance,
)

app = Flask(__name__)
CORS(app)

@app.route('/api/stock_data', methods=['GET'])
def get_stock_data():
    company_name = request.args.get('name')
    period = request.args.get('period', '1d')
    interval = request.args.get('interval', '1h')

    if not company_name:
        return jsonify({'error': 'Musisz podać nazwę firmy lub ticker.'}), 400

    ticker = None

    # SPRAWDZANIE CZY PODANO TICKER CZY COŚ INNEGO!
    if is_valid_ticker(company_name):
        ticker = company_name
        print(f"Uznano '{company_name}' za ticker.")
        # Od razu spróbuj pobrać dane
        try:
            stock_data = get_stock_data_from_yfinance(ticker, period, interval)
            return jsonify(stock_data)
        except Exception as e:
            print(f"Próba pobrania danych dla '{ticker}' nie powiodła się. Kontynuuję wyszukiwanie.")
            ticker = None

    # SCRAPOWANIE PO YAHOO FINANCE GDY PODANO NAZWE FIRMY A NIE TICKER
    if not ticker:
        ticker = get_ticker_from_yahoo(company_name)
        print(f"Yahoo Finance: {ticker}")

    # NIEZNALEZIONY TICKER
    if not ticker:
        return jsonify({'error': f'Nie znaleziono tickera dla "{company_name}".'}), 404

    # POBIERANIE DANYCH Z YFINANCE JESLI JEST TICKER
    try:
        stock_data = get_stock_data_from_yfinance(ticker, period, interval)
        return jsonify(stock_data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500  


if __name__ == '__main__':
    app.run(debug=True)