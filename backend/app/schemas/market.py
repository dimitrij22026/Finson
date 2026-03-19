from pydantic import BaseModel, ConfigDict, Field


class MarketQuote(BaseModel):
    symbol: str = ""
    name: str = ""
    price: float | None = None
    change: float | None = None
    change_percent: float | None = None
    market_cap: float | None = None
    volume: float | None = None
    day_high: float | None = None
    day_low: float | None = None
    fifty_two_week_high: float | None = None
    fifty_two_week_low: float | None = None
    exchange: str = ""
    image: str = ""


class MarketListResponse(BaseModel):
    total: int = 0
    quotes: list[MarketQuote] = Field(default_factory=list)


class MarketChartPoint(BaseModel):
    t: int
    price: float


class MarketSearchItem(BaseModel):
    symbol: str = ""
    name: str = ""
    exchange: str = ""
    quote_type: str = Field(default="", alias="quoteType")

    model_config = ConfigDict(populate_by_name=True)
