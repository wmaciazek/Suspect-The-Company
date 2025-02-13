1. backend created only for scientific purposes, may contain errors and provide false company data
2. I am not responsible for all mistakes, whatever is wrong is not mine - Wiktor

How its works?
Routes:
/api/stock_data/{company name or company ticker}
    - GET 
    checks whether a company with a given name/ticker exists on the stock exchange (yahoo finance)
    1. first, it checks whether a ticker is provided, if not, it searches for the ticker by the company name by scraping the yahoo finance website
    2. when we find a ticker, it sends the company data via yfinance lib. to the frontend