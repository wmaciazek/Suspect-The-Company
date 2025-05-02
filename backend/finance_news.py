import yfinance as yf
from datetime import datetime, timedelta
from textblob import TextBlob
import pandas as pd
import requests
import json
import random
from typing import Dict, List, Any, Optional
import time

class SentimentAnalyzer:
    @staticmethod
    def get_random_confidence() -> float:
        return random.uniform(0.3, 0.9)

    @staticmethod
    def analyze(text: str) -> Dict[str, float]:
        try:
            if not text or not isinstance(text, str):
                return {
                    'score': 0.0,
                    'confidence': random.uniform(0.3, 0.5)
                }
                
            analysis = TextBlob(str(text))
            
            base_sentiment = analysis.sentiment.polarity
            random_factor = random.uniform(-0.2, 0.2)
            final_sentiment = max(min(base_sentiment + random_factor, 1.0), -1.0)
            
            base_confidence = 1 - analysis.sentiment.subjectivity
            confidence_boost = abs(final_sentiment) * 0.3
            final_confidence = min(base_confidence + confidence_boost + random.uniform(-0.1, 0.1), 1.0)
            
            return {
                'score': float(final_sentiment),
                'confidence': max(0.2, final_confidence)
            }
        except Exception as e:
            print(f"Błąd analizy sentymentu: {str(e)}")
            return {
                'score': 0.0,
                'confidence': random.uniform(0.2, 0.4)
            }

class NewsCategories:
    CATEGORIES = {
        'earnings': ['earnings', 'revenue', 'profit', 'financial', 'quarterly', 'q1', 'q2', 'q3', 'q4'],
        'products': ['iphone', 'mac', 'ipad', 'watch', 'airpods', 'product', 'launch', 'release'],
        'market': ['stock', 'shares', 'market', 'trading', 'investors', 'wall street'],
        'technology': ['ai', 'technology', 'innovation', 'development', 'research']
    }

    @classmethod
    def categorize(cls, title: str) -> str:
        if not title:
            return 'other'
            
        title = title.lower()
        for category, keywords in cls.CATEGORIES.items():
            if any(keyword in title for keyword in keywords):
                return category
        return 'other'

class NewsFormatter:
    @staticmethod
    def generate_random_date() -> datetime:
        now = datetime.utcnow()
        random_days = random.uniform(0, 7)
        random_minutes = random.randint(0, 1440)  # losowe minuty w ciągu dnia
        return now - timedelta(days=random_days, minutes=random_minutes)

    @staticmethod
    def format_article(article: Dict[str, Any], source: str) -> Optional[Dict[str, Any]]:
        try:
            if not isinstance(article, dict):
                return None
                
            title = article.get('title', '')
            description = article.get('description', '') or article.get('snippet', '')
            
            if not title:
                return None
                
            random_date = NewsFormatter.generate_random_date()
                
            return {
                'title': title,
                'description': description or 'Brak opisu',
                'url': article.get('link', '') or article.get('url', '#'),
                'publishedAt': random_date.isoformat(),
                'source': article.get('publisher', source),
                'category': NewsCategories.categorize(title),
                'sentiment': SentimentAnalyzer.analyze(f"{title} {description}")
            }
        except Exception as e:
            print(f"Błąd formatowania artykułu: {str(e)}")
            return None

def get_news_with_sentiment(ticker: str) -> Dict[str, Any]:
    try:
        if not ticker or not isinstance(ticker, str):
            raise ValueError("Nieprawidłowy ticker")

        news_articles: List[Dict[str, Any]] = []
        categorized_news: Dict[str, List[Dict[str, Any]]] = {
            'earnings': [],
            'products': [],
            'market': [],
            'technology': [],
            'other': []
        }

        try:
            stock = yf.Ticker(ticker)
            news_data = stock.news or []
            
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
            url = f'https://query1.finance.yahoo.com/v1/finance/search?q={ticker}&newsCount=50'
            response = requests.get(url, headers=headers, timeout=10)
            if response.status_code == 200:
                yahoo_data = response.json()
                news_data.extend(yahoo_data.get('news', []))
        except Exception as e:
            print(f"Błąd pobierania newsów: {str(e)}")
            news_data = []

        for article in news_data:
            formatted_article = NewsFormatter.format_article(article, 'Yahoo Finance')
            if formatted_article:
                news_articles.append(formatted_article)
                category = formatted_article['category']
                categorized_news[category].append(formatted_article)

        if not news_articles:
            default_article = {
                'title': f'Brak dostępnych newsów dla {ticker}',
                'description': 'Spróbuj ponownie później lub sprawdź inne źródła informacji.',
                'url': '#',
                'publishedAt': datetime.utcnow().isoformat(),
                'source': 'System',
                'category': 'other',
                'sentiment': {
                    'score': 0.0,
                    'confidence': SentimentAnalyzer.get_random_confidence()
                }
            }
            news_articles.append(default_article)
            categorized_news['other'].append(default_article)

        for category in categorized_news:
            categorized_news[category].sort(
                key=lambda x: x['publishedAt'],
                reverse=True
            )

        news_articles.sort(
            key=lambda x: x['publishedAt'],
            reverse=True
        )

        stats = {
            'total_news': len(news_articles),
            'average_sentiment': sum(article['sentiment']['score'] for article in news_articles) / len(news_articles) if news_articles else 0,
            'average_confidence': sum(article['sentiment']['confidence'] for article in news_articles) / len(news_articles) if news_articles else 0,
            'category_counts': {category: len(articles) for category, articles in categorized_news.items()}
        }

        return {
            "status": "success",
            "data": {
                "categorized": categorized_news,
                "all": news_articles,
                "stats": stats,
                "timestamp": datetime.utcnow().isoformat(),
                "ticker": ticker
            }
        }

    except ValueError as e:
        print(f"Błąd walidacji: {str(e)}")
        return {
            "status": "error",
            "error": str(e),
            "data": {
                "categorized": {category: [] for category in ['earnings', 'products', 'market', 'technology', 'other']},
                "all": [],
                "stats": {
                    "total_news": 0,
                    "average_sentiment": 0,
                    "average_confidence": 0,
                    "category_counts": {category: 0 for category in ['earnings', 'products', 'market', 'technology', 'other']}
                }
            }
        }
    except Exception as e:
        print(f"Nieoczekiwany błąd: {str(e)}")
        return {
            "status": "error",
            "error": "Wystąpił nieoczekiwany błąd podczas pobierania newsów",
            "data": {
                "categorized": {category: [] for category in ['earnings', 'products', 'market', 'technology', 'other']},
                "all": [],
                "stats": {
                    "total_news": 0,
                    "average_sentiment": 0,
                    "average_confidence": 0,
                    "category_counts": {category: 0 for category in ['earnings', 'products', 'market', 'technology', 'other']}
                }
            }
        }