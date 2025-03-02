import yfinance as yf

def get_financial_indicators(ticker):
    try:
        stock = yf.Ticker(ticker)
        info = stock.info

        indicators = {
            "marketCap": info.get("marketCap"),
            "trailingPE": info.get("trailingPE"),
            "forwardPE": info.get("forwardPE"),
            "dividendYield": info.get("dividendYield"),
            "returnOnEquity": info.get("returnOnEquity"),
            "returnOnAssets": info.get("returnOnAssets"),
            "totalRevenue": info.get("totalRevenue"),
            "grossMargins": info.get("grossMargins"),
            "ebitdaMargins": info.get("ebitdaMargins"),
            "profitMargins": info.get("profitMargins"),
            "freeCashflow": info.get("freeCashflow"),
            "totalDebt": info.get("totalDebt"),
            "totalCash": info.get("totalCash"),
            "sector": info.get("sector"),
            "industry": info.get("industry"),
            "financialCurrency": info.get("financialCurrency"),
            "period": "quarterly",
            "currency" : info.get("currency")
        }

        indicators_list = []
        descriptions = {
            "marketCap": "Całkowita wartość rynkowa wszystkich wyemitowanych akcji spółki.",
            "trailingPE": "Stosunek bieżącej ceny akcji do zysku na akcję z ostatnich 12 miesięcy.",
            "forwardPE": "Stosunek bieżącej ceny akcji do prognozowanego zysku na akcję na przyszły rok.",
            "dividendYield": "Roczna dywidenda na akcję wyrażona jako procent bieżącej ceny akcji.",
            "returnOnEquity": "Mierzy rentowność kapitału własnego spółki.",
            "returnOnAssets": "Mierzy rentowność aktywów spółki.",
            "totalRevenue": "Suma wszystkich przychodów ze sprzedaży produktów lub usług spółki.",
            "grossMargins": "Różnica między przychodami a kosztami sprzedanych towarów, wyrażona jako procent przychodów.",
            "ebitdaMargins": "Zysk przed odsetkami, podatkami, amortyzacją i umorzeniem, wyrażony jako procent przychodów.",
            "profitMargins": "Zysk netto wyrażony jako procent przychodów.",
            "freeCashflow": "Przepływy pieniężne dostępne dla inwestorów po odjęciu wydatków kapitałowych.",
            "totalDebt": "Suma wszystkich zobowiązań dłużnych spółki.",
            "totalCash": "Suma wszystkich środków pieniężnych i ekwiwalentów gotówki posiadanych przez spółkę.",
            "sector": "Branża, w której działa spółka.",
            "industry": "Dokładniejsza kategoryzacja działalności spółki w ramach sektora.",
            "financialCurrency": "Waluta w której są podawane dane finansowe.",
            "period": "Okres, za jaki są podawane wskaźniki (roczny lub kwartalny).",
            "currency": "Waluta w której są podawane dane finansowe."
        }

        for key, value in indicators.items():
            indicators_list.append({
                "name": key,
                "description": descriptions.get(key, "Brak opisu"),
                "value": value
            })

        return indicators_list
    except Exception as e:
        print(f"Błąd podczas pobierania danych dla {ticker}: {e}")
        return None
