// app/api/stock-price/route.js
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  let symbol = searchParams.get('symbol');
  const apiKey = process.env.FINNHUB_API_KEY;

  if (!symbol) {
    return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
  }

  // Przekształć symbol na wielkie litery
  symbol = symbol.toUpperCase();

  try {
    console.log(`[API] Fetching price for ${symbol}`);
    console.log(`[API] Using API key: ${apiKey ? 'Present' : 'Missing'}`);

    // Dodaj token do URL zamiast w nagłówkach
    const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`;
    console.log(`[API] Calling URL: ${url}`);

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Finnhub API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`[API] Received data:`, data);

    // Sprawdź czy otrzymaliśmy prawidłowe dane
    if (data.c === 0 && data.o === 0 && data.h === 0 && data.l === 0) {
      console.error(`[API] Invalid data received for ${symbol}`);
      return NextResponse.json({ 
        error: 'Invalid data received from Finnhub' 
      }, { status: 400 });
    }

    // Dodaj więcej informacji do odpowiedzi
    const processedData = {
      c: Number(data.c),          // Aktualna cena
      o: Number(data.o),          // Cena otwarcia
      h: Number(data.h),          // Najwyższa cena
      l: Number(data.l),          // Najniższa cena
      pc: Number(data.pc),        // Poprzednia cena zamknięcia
      timestamp: Date.now(),      // Timestamp odpowiedzi
      symbol: symbol              // Symbol dla którego pobrano dane
    };

    console.log(`[API] Processed data:`, processedData);
    return NextResponse.json(processedData);
  } catch (error) {
    console.error('[API] Error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch stock price',
      details: error.message 
    }, { status: 500 });
  }
}