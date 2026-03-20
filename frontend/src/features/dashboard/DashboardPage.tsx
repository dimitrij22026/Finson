import { useEffect, useState } from "react"
import { useMonthlyInsight } from "./hooks"
import { useLanguage } from "../../i18n"
import { useAuth } from "../../hooks/useAuth"
import { UserStatusBanner } from "../../components/auth/UserStatusBanner"
import { NewsCard } from "../../components/ui/NewsCard"
import { fetchFinancialNews, type NewsItem } from "../../services/newsService"

interface MonthlyData {
  balance: number | string
  total_income: number | string
  total_expense: number | string
  top_expense_categories: Array<{
    category: string
    amount: number | string
  }>
}

interface FinancialHealthResult {
  status: "excellent" | "good" | "fair" | "critical"
  color: "green" | "blue" | "orange" | "red"
}

const getFinancialHealth = (data: MonthlyData): FinancialHealthResult => {
  const balancePercentage = (Number(data.balance) / Number(data.total_income)) * 100
  const expenseRatio = (Number(data.total_expense) / Number(data.total_income)) * 100

  if (balancePercentage > 30 && expenseRatio < 70) {
    return { status: "excellent", color: "green" }
  } else if (balancePercentage > 15 && expenseRatio < 85) {
    return { status: "good", color: "blue" }
  } else if (balancePercentage > 0 && expenseRatio < 100) {
    return { status: "fair", color: "orange" }
  } else {
    return { status: "critical", color: "red" }
  }
}

export const DashboardPage = () => {
  const { data, isLoading, isError } = useMonthlyInsight()
  const { language, t } = useLanguage()
  const { user } = useAuth()
  const [news, setNews] = useState<NewsItem[]>([])
  const [isNewsLoading, setIsNewsLoading] = useState(true)
  const [isNewsError, setIsNewsError] = useState(false)

  const userCurrency = user?.currency || "EUR"

  const formatter = new Intl.NumberFormat(
    language === "mk" ? "mk-MK" : "en-US",
    { style: "currency", currency: userCurrency }
  )

  useEffect(() => {
    let isMounted = true

    const loadNews = async () => {
      setIsNewsLoading(true)
      setIsNewsError(false)

      try {
        const latestNews = await fetchFinancialNews(5)
        if (isMounted) {
          setNews(latestNews)
        }
      } catch {
        if (isMounted) {
          setIsNewsError(true)
          setNews([])
        }
      } finally {
        if (isMounted) {
          setIsNewsLoading(false)
        }
      }
    }

    void loadNews()

    return () => {
      isMounted = false
    }
  }, [])

  if (isLoading) {
    return (
      <div className="page-centered">
        <div className="loader" />
        <p>{t("loading")}</p>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="page-centered">
        <p>{t("cantShowTransactions")}</p>
      </div>
    )
  }

  const { status, color } = getFinancialHealth(data as MonthlyData)
  const topCategory = data.top_expense_categories[0]?.category ?? t("spending")

  const totalIncome = Number(data.total_income)
  const totalExpense = Number(data.total_expense)
  const totalBalance = Number(data.balance)
  const hasActivity =
    data.top_expense_categories.length > 0 || totalIncome > 0 || totalExpense > 0 || totalBalance !== 0

  const prevIncome = data.prev_total_income ?? "0"
  const prevExpense = data.prev_total_expense ?? "0"
  const carryover = data.carryover ?? "0"

  const calcPercentChange = (
    current: string | number,
    previous: string | number
  ): { text: string; isPositive: boolean } => {
    const curr = Number(current)
    const prev = Number(previous)

    if (isNaN(curr) || isNaN(prev)) return { text: "—", isPositive: true }
    if (prev === 0) return { text: curr === 0 ? "0%" : "—", isPositive: true }

    const change = ((curr - prev) / Math.abs(prev)) * 100
    const sign = change > 0 ? "+" : ""

    return {
      text: `${sign}${change.toFixed(1)}%`,
      isPositive: change >= 0,
    }
  }

  const incomeChange = calcPercentChange(data.total_income, prevIncome)
  const expenseChange = calcPercentChange(data.total_expense, prevExpense)
  const balanceChange = calcPercentChange(data.balance, carryover)

  const displayMessage = hasActivity
    ? t(`financialStatus_${status}`, { category: topCategory })
    : t("financialStatus_newUser")

  const heroColorClass = hasActivity ? `health-${color}` : "health-blue"

  return (
    <section className="dashboard-page">
      <UserStatusBanner isEmailVerified={Boolean(user?.is_email_verified)} profilePath="/profile" />

      <div className="dashboard__header">
        <div>
          <p className="eyebrow">{t("financialImpact")}</p>
          <h1 className={`hero-title ${heroColorClass}`}>{displayMessage}</h1>
        </div>

        <div className="dashboard__badge">
          {t("budgetStatus")}
          <strong>{formatter.format(Number(data.balance))}</strong>
        </div>
      </div>

      <div className="card-grid">
        <article className="stat-card">
          <p className="stat-card__label">{t("incomes")}</p>
          <p className="stat-card__value">{formatter.format(Number(data.total_income))}</p>
          <p className={`stat-card__trend ${incomeChange.isPositive ? "trend--positive" : "trend--negative"}`}>
            {incomeChange.text} {t("vsLastMonth")}
          </p>
        </article>

        <article className="stat-card stat-card--expense">
          <p className="stat-card__label">{t("expenses")}</p>
          <p className="stat-card__value">{formatter.format(Number(data.total_expense))}</p>
          <p className={`stat-card__trend ${expenseChange.isPositive ? "trend--negative" : "trend--positive"}`}>
            {expenseChange.text} {t("vsLastMonth")}
          </p>
        </article>

        <article className="stat-card">
          <p className="stat-card__label">{t("balance")}</p>
          <p className="stat-card__value">{formatter.format(Number(data.balance))}</p>
          <p className={`stat-card__trend ${balanceChange.isPositive ? "trend--positive" : "trend--negative"}`}>
            {balanceChange.text} {t("vsLastMonth")}
          </p>
        </article>

        {Number(carryover) !== 0 && (
          <article className="stat-card stat-card--carryover">
            <p className="stat-card__label">{t("carryover")}</p>
            <p className="stat-card__value">{formatter.format(Number(carryover))}</p>
            <p className="stat-card__trend">{t("fromLastMonth")}</p>
          </article>
        )}
      </div>

      <div className="dashboard__split">
        <div className="panel">
          <p className="panel__title">{t("topExpenseCategories")}</p>
          <p className="panel__subtitle">{t("trackCriticalAreas")}</p>

          {data.top_expense_categories.length === 0 ? (
            <p>{t("noTransactions")}</p>
          ) : (
            <ul className="insight-list">
              {data.top_expense_categories.map((item) => (
                <li key={item.category} className="insight-list__item">
                  <span>{item.category}</span>

                  <div className="progress">
                    <div
                      className="progress__bar"
                      style={{ width: `${Math.min(100, Number(item.amount))}%` }}
                    />
                  </div>

                  <strong>{formatter.format(Number(item.amount))}</strong>
                </li>
              ))}
            </ul>
          )}
        </div>

        <aside className="panel news-panel">
          <p className="panel__title">Latest Market Updates</p>
          <p className="panel__subtitle">Top headlines from the financial market</p>

          <div className="news-list" aria-live="polite">
            {isNewsLoading && <p className="news-list__state">Loading updates...</p>}

            {!isNewsLoading && isNewsError && (
              <p className="news-list__state">Unable to load market updates right now.</p>
            )}

            {!isNewsLoading && !isNewsError && news.length === 0 && (
              <p className="news-list__state">No updates available.</p>
            )}

            {!isNewsLoading && !isNewsError && news.map((item) => <NewsCard key={item.url} item={item} />)}
          </div>
        </aside>
      </div>
    </section>
  )
}