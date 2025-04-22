from flask import Flask
from flask_cors import CORS
from routes import routes
import os

# Bezpośrednie ustawienie zmiennej środowiskowej
os.environ['GOOGLE_API_KEY'] = 'AIzaSyBTt1ysxApudMMucPBn3BMGAg08LUnpQmk'

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