from enum import StrEnum


class TransactionType(StrEnum):
    INCOME = "income"
    EXPENSE = "expense"
    TRANSFER = "transfer"


class AccountType(StrEnum):
    FIAT = "fiat"
    CRYPTO = "crypto"
    BROKERAGE = "brokerage"


class AssetType(StrEnum):
    STOCK = "stock"
    CRYPTO = "crypto"
    ETF = "etf"


class AssetTransactionType(StrEnum):
    BUY = "buy"
    SELL = "sell"
    DIVIDEND = "dividend"


class BudgetPeriod(StrEnum):
    MONTHLY = "monthly"
    WEEKLY = "weekly"
    YEARLY = "yearly"
