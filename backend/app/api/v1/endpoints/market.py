from fastapi import APIRouter, HTTPException, Query, Path
import httpx

router = APIRouter(prefix="/market")

USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.0.0 Safari/537.36"


@router.get("/crypto/list")
async def get_crypto_list(count: int = 50, start: int = 0):
    url = "https://query1.finance.yahoo.com/v1/finance/screener/predefined/saved"
    params = {
        "formatted": "true",
        "lang": "en-US",
        "region": "US",
        "scrIds": "all_cryptocurrencies_us",
        "start": start,
        "count": count
    }
    async with httpx.AsyncClient() as client:
        resp = await client.get(url, params=params, headers={"User-Agent": USER_AGENT})
        if resp.status_code != 200:
            raise HTTPException(status_code=resp.status_code, detail=resp.text)

        data = resp.json()
        try:
            result = data["finance"]["result"][0]
            total = result.get("total", 0)
            quotes = result.get("quotes", [])

            parsed_quotes = []
            for q in quotes:
                parsed_quotes.append({
                    "symbol": q.get("symbol"),
                    "name": q.get("shortName", q.get("longName", "")),
                    "price": q.get("regularMarketPrice", {}).get("raw") if isinstance(q.get("regularMarketPrice"), dict) else q.get("regularMarketPrice"),
                    "change": q.get("regularMarketChange", {}).get("raw") if isinstance(q.get("regularMarketChange"), dict) else q.get("regularMarketChange"),
                    "change_percent": q.get("regularMarketChangePercent", {}).get("raw") if isinstance(q.get("regularMarketChangePercent"), dict) else q.get("regularMarketChangePercent"),
                    "market_cap": q.get("marketCap", {}).get("raw") if isinstance(q.get("marketCap"), dict) else q.get("marketCap"),
                    "volume": q.get("regularMarketVolume", {}).get("raw") if isinstance(q.get("regularMarketVolume"), dict) else q.get("regularMarketVolume"),
                    "exchange": q.get("exchange", ""),
                    "image": q.get("coinImageUrl", "")
                })

            return {
                "total": total,
                "quotes": parsed_quotes
            }
        except Exception as e:
            return {"total": 0, "quotes": []}


@router.get("/crypto/chart/{symbol}")
async def get_crypto_chart_yahoo(
    symbol: str = Path(...),
    range: str = "1mo"
):
    url = f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}"
    valid_ranges = {"1d": "5m", "5d": "15m", "1mo": "1d",
                    "3mo": "1d", "6mo": "1d", "1y": "1d", "5y": "1wk"}
    interval = valid_ranges.get(range, "1d")

    params = {"range": range, "interval": interval}
    async with httpx.AsyncClient() as client:
        resp = await client.get(url, params=params, headers={"User-Agent": USER_AGENT})
        if resp.status_code != 200:
            raise HTTPException(status_code=resp.status_code, detail=resp.text)

        data = resp.json()
        try:
            result = data["chart"]["result"][0]
            timestamps = result.get("timestamp", [])
            quotes = result["indicators"]["quote"][0]
            closes = quotes.get("close", [])

            points = []
            for t, c in zip(timestamps, closes):
                if c is not None:
                    points.append({"t": t * 1000, "price": c})
            return points
        except Exception as e:
            print("ERROR IN CHART:", e)
            import traceback
            traceback.print_exc()
            return []


@router.get("/stocks/list")
async def get_stocks_list(
    screener: str = "day_gainers",
    count: int = 30,
    start: int = 0
):
    screener_map = {
        "all": "most_actives",
        "day_gainers": "day_gainers",
        "day_losers": "day_losers",
        "most_actives": "most_actives",
        "growth_technology_stocks": "growth_technology_stocks"
    }
    actual_screener = screener_map.get(screener, "most_actives")
    url = "https://query1.finance.yahoo.com/v1/finance/screener/predefined/saved"
    params = {
        "formatted": "true",
        "lang": "en-US",
        "region": "US",
        "scrIds": actual_screener,
        "start": start,
        "count": count
    }
    async with httpx.AsyncClient() as client:
        resp = await client.get(url, params=params, headers={"User-Agent": USER_AGENT})
        if resp.status_code != 200:
            raise HTTPException(status_code=resp.status_code, detail=resp.text)

        data = resp.json()
        try:
            result = data["finance"]["result"][0]
            total = result.get("total", 0)
            quotes = result.get("quotes", [])

            parsed_quotes = []
            for q in quotes:
                parsed_quotes.append({
                    "symbol": q.get("symbol"),
                    "name": q.get("shortName", q.get("longName", "")),
                    "price": q.get("regularMarketPrice", {}).get("raw") if isinstance(q.get("regularMarketPrice"), dict) else q.get("regularMarketPrice"),
                    "change": q.get("regularMarketChange", {}).get("raw") if isinstance(q.get("regularMarketChange"), dict) else q.get("regularMarketChange"),
                    "change_percent": q.get("regularMarketChangePercent", {}).get("raw") if isinstance(q.get("regularMarketChangePercent"), dict) else q.get("regularMarketChangePercent"),
                    "market_cap": q.get("marketCap", {}).get("raw") if isinstance(q.get("marketCap"), dict) else q.get("marketCap"),
                    "volume": q.get("regularMarketVolume", {}).get("raw") if isinstance(q.get("regularMarketVolume"), dict) else q.get("regularMarketVolume"),
                    "day_high": q.get("regularMarketDayHigh", {}).get("raw") if isinstance(q.get("regularMarketDayHigh"), dict) else q.get("regularMarketDayHigh"),
                    "day_low": q.get("regularMarketDayLow", {}).get("raw") if isinstance(q.get("regularMarketDayLow"), dict) else q.get("regularMarketDayLow"),
                    "fifty_two_week_high": q.get("fiftyTwoWeekHigh", {}).get("raw") if isinstance(q.get("fiftyTwoWeekHigh"), dict) else q.get("fiftyTwoWeekHigh"),
                    "fifty_two_week_low": q.get("fiftyTwoWeekLow", {}).get("raw") if isinstance(q.get("fiftyTwoWeekLow"), dict) else q.get("fiftyTwoWeekLow"),
                    "exchange": q.get("exchange", "")
                })

            return {
                "total": total,
                "quotes": parsed_quotes
            }
        except Exception as e:
            return {"total": 0, "quotes": []}


@router.get("/crypto/search")
async def get_crypto_search(q: str):
    url = f"https://query2.finance.yahoo.com/v1/finance/search"
    params = {"q": q, "quotesCount": 10, "newsCount": 0}
    async with httpx.AsyncClient() as client:
        resp = await client.get(url, params=params, headers={"User-Agent": USER_AGENT})
        if resp.status_code != 200:
            raise HTTPException(status_code=resp.status_code, detail=resp.text)

        data = resp.json()
        quotes = data.get("quotes", [])
        return [
            {
                "symbol": q.get("symbol"),
                "name": q.get("shortname", q.get("longname", "")),
                "exchange": q.get("exchDisp", q.get("exchange", "")),
                "quoteType": q.get("quoteType", "")
            }
            for q in quotes if q.get("quoteType") in ["CRYPTOCURRENCY"]
        ]


@router.get("/stocks/search")
async def get_stocks_search(q: str):
    url = f"https://query2.finance.yahoo.com/v1/finance/search"
    params = {"q": q, "quotesCount": 10, "newsCount": 0}
    async with httpx.AsyncClient() as client:
        resp = await client.get(url, params=params, headers={"User-Agent": USER_AGENT})
        if resp.status_code != 200:
            raise HTTPException(status_code=resp.status_code, detail=resp.text)

        data = resp.json()
        quotes = data.get("quotes", [])
        return [
            {
                "symbol": q.get("symbol"),
                "name": q.get("shortname", q.get("longname", "")),
                "exchange": q.get("exchDisp", q.get("exchange", "")),
                "quoteType": q.get("quoteType", "")
            }
            for q in quotes if q.get("quoteType") in ["EQUITY", "ETF"]
        ]


@router.get("/crypto/quote")
async def get_crypto_quote(symbols: str):
    url = "https://query1.finance.yahoo.com/v7/finance/quote"
    params = {"symbols": symbols}
    async with httpx.AsyncClient() as client:
        resp = await client.get(url, params=params, headers={"User-Agent": USER_AGENT})
        if resp.status_code != 200:
            raise HTTPException(status_code=resp.status_code, detail=resp.text)

        data = resp.json()
        quotes = data.get("quoteResponse", {}).get("result", [])

        parsed_quotes = []
        for q in quotes:
            parsed_quotes.append({
                "symbol": q.get("symbol"),
                "name": q.get("shortName", q.get("longName", "")),
                "price": q.get("regularMarketPrice"),
                "change": q.get("regularMarketChange"),
                "change_percent": q.get("regularMarketChangePercent"),
                "market_cap": q.get("marketCap"),
                "volume": q.get("regularMarketVolume"),
                "day_high": q.get("regularMarketDayHigh"),
                "day_low": q.get("regularMarketDayLow"),
                "fifty_two_week_high": q.get("fiftyTwoWeekHigh"),
                "fifty_two_week_low": q.get("fiftyTwoWeekLow"),
                "exchange": q.get("exchange", ""),
                "image": q.get("coinImageUrl", "")
            })
        return parsed_quotes


@router.get("/stocks/quote")
async def get_stocks_quote(symbols: str):
    url = "https://query1.finance.yahoo.com/v7/finance/quote"
    params = {"symbols": symbols}
    async with httpx.AsyncClient() as client:
        resp = await client.get(url, params=params, headers={"User-Agent": USER_AGENT})
        if resp.status_code != 200:
            raise HTTPException(status_code=resp.status_code, detail=resp.text)

        data = resp.json()
        quotes = data.get("quoteResponse", {}).get("result", [])

        parsed_quotes = []
        for q in quotes:
            parsed_quotes.append({
                "symbol": q.get("symbol"),
                "name": q.get("shortName", q.get("longName", "")),
                "price": q.get("regularMarketPrice"),
                "change": q.get("regularMarketChange"),
                "change_percent": q.get("regularMarketChangePercent"),
                "market_cap": q.get("marketCap"),
                "volume": q.get("regularMarketVolume"),
                "day_high": q.get("regularMarketDayHigh"),
                "day_low": q.get("regularMarketDayLow"),
                "fifty_two_week_high": q.get("fiftyTwoWeekHigh"),
                "fifty_two_week_low": q.get("fiftyTwoWeekLow"),
                "exchange": q.get("exchange", "")
            })
        return parsed_quotes


@router.get("/stocks/chart/{symbol}")
async def get_stocks_chart(
    symbol: str = Path(...),
    range: str = "1mo"
):
    # Maps user ranges to yahoo intervals
    range_intervals = {
        "1d": "5m",
        "5d": "15m",
        "1mo": "1d",
        "3mo": "1d",
        "6mo": "1d",
        "1y": "1wk",
        "5y": "1mo"
    }
    interval = range_intervals.get(range, "1d")

    url = f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}"
    params = {"interval": interval, "range": range}

    async with httpx.AsyncClient() as client:
        resp = await client.get(url, params=params, headers={"User-Agent": USER_AGENT})
        if resp.status_code != 200:
            raise HTTPException(status_code=resp.status_code, detail=resp.text)

        data = resp.json()
        try:
            result = data["chart"]["result"][0]
            timestamps = result.get("timestamp", [])
            close_prices = result.get("indicators", {}).get(
                "quote", [{}])[0].get("close", [])

            chart_data = []
            for t, p in zip(timestamps, close_prices):
                if p is not None:
                    chart_data.append({
                        "t": t * 1000,  # JS timestamp
                        "price": p
                    })
            return chart_data
        except Exception:
            return []
