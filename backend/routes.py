from flask import Blueprint, request, jsonify
from finance_utils import get_stock_data 

routes = Blueprint('routes', __name__)

@routes.route('/api/stock_data', methods=['GET'])
def stock_data_endpoint():
    company_name = request.args.get('name')
    period = request.args.get('period', '1mo')
    interval = request.args.get('interval', '1d')

    if not company_name:
        return jsonify({'error': 'Musisz podać nazwę firmy lub ticker.'}), 400

    data = get_stock_data(company_name, period, interval)

    if data:  
        return jsonify(data)
    else:  
        return jsonify({'error': f'Błąd pobierania danych dla "{company_name}".'}), 500