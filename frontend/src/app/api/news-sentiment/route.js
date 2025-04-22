import { NextResponse } from 'next/server';
import Sentiment from 'sentiment';

async function analyzeNewsWithSentiment(ticker) {
  // Funkcja pomocnicza do formatowania daty
  const formatDate = (date) => {
    return date.toISOString().replace('T', ' ').slice(0, 19);
  };

  // Obecny czas
  const currentDate = formatDate(new Date());
  const yesterdayDate = formatDate(new Date(Date.now() - 24 * 60 * 60 * 1000));
  const twoDaysAgoDate = formatDate(new Date(Date.now() - 48 * 60 * 60 * 1000));

  try {
    // Przykładowe dane
    const mockNews = [
      {
        title: `Pozytywne wyniki kwartalne spółki ${ticker}`,
        description: 'Spółka przekroczyła oczekiwania analityków i pokazała świetne wyniki finansowe w pierwszym kwartale 2025 roku.',
        url: 'https://example.com/1',
        publishedAt: currentDate,
        source: 'Financial News',
      },
      {
        title: `${ticker} ogłasza nową strategię rozwoju`,
        description: 'Firma przedstawiła ambitne plany ekspansji na nowe rynki i rozwoju technologicznego na najbliższe 5 lat.',
        url: 'https://example.com/2',
        publishedAt: yesterdayDate,
        source: 'Market Watch',
      },
      {
        title: `Wyzwania rynkowe dla ${ticker}`,
        description: 'Analitycy wskazują na potencjalne ryzyka związane z obecną sytuacją gospodarczą i konkurencją w sektorze.',
        url: 'https://example.com/3',
        publishedAt: twoDaysAgoDate,
        source: 'Stock Analysis',
      }
    ];

    const sentiment = new Sentiment();

    const newsWithSentiment = mockNews.map(item => {
      try {
        const analysis = sentiment.analyze(item.title + ' ' + item.description);
        const normalizedScore = analysis.score / Math.max(5, Math.abs(analysis.score));

        return {
          ...item,
          sentiment: {
            score: Number(Math.max(-1, Math.min(1, normalizedScore)).toFixed(2)),
            label: normalizedScore > 0.3 ? 'positive' : 
                   normalizedScore < -0.3 ? 'negative' : 
                   'neutral',
            confidence: Number(Math.abs(normalizedScore).toFixed(2))
          }
        };
      } catch (err) {
        console.error(`Error analyzing news item: ${err.message}`);
        return {
          ...item,
          sentiment: {
            score: 0,
            label: 'neutral',
            confidence: 0
          }
        };
      }
    });

    // Upewnij się, że zwracamy tablicę
    if (!Array.isArray(newsWithSentiment)) {
      throw new Error('News data is not in expected format');
    }

    return newsWithSentiment;
  } catch (error) {
    console.error('Error analyzing news sentiment:', error);
    throw new Error('Failed to analyze news sentiment');
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const ticker = searchParams.get('ticker');

  if (!ticker) {
    return new NextResponse(
      JSON.stringify({ error: 'Ticker parameter is required' }), 
      { 
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }

  try {
    const newsWithSentiment = await analyzeNewsWithSentiment(ticker);
    return new NextResponse(
      JSON.stringify({ data: newsWithSentiment }), // Opakowujemy dane w obiekt
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        }
      }
    );
  } catch (error) {
    console.error('API Error:', error);
    return new NextResponse(
      JSON.stringify({
        error: 'Internal Server Error',
        message: error.message
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}