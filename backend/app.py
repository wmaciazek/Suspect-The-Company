from flask import Flask
from flask_cors import CORS
from routes import routes
import os
from dotenv import load_dotenv

# Ustaw ścieżkę do pliku .env.local
current_dir = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(current_dir, '.env.local')

# Załaduj zmienne środowiskowe z .env.local
load_dotenv(env_path)

# Pobierz klucz API z .env.local
api_key = os.getenv('GOOGLE_API_KEY')
if not api_key:
    print("UWAGA: Brak GOOGLE_API_KEY w pliku .env.local")
else:
    print("Znaleziono GOOGLE_API_KEY w pliku .env.local")
    os.environ['GOOGLE_API_KEY'] = api_key

app = Flask(__name__)
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:3000", "http://127.0.0.1:3000"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})

app.register_blueprint(routes)

if __name__ == '__main__':
    app.run(debug=True)