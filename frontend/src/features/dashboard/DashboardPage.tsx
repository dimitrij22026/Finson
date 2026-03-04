import { useMonthlyInsight } from "./hooks"
import { useLanguage } from "../../i18n"
import { useAuth } from "../../hooks/useAuth"

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

// Helper to determine financial health status
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

  const userCurrency = user?.currency || "EUR"
  const formatter = new Intl.NumberFormat(language === "mk" ? "mk-MK" : "en-US", { style: "currency", currency: userCurrency })

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
  const topCategory = data.top_expense_categories[0]?.category ?? "Spending"

  // Provide defaults for new fields if API doesn't return them
  const prevIncome = data.prev_total_income ?? "0"
  const prevExpense = data.prev_total_expense ?? "0"
  const carryover = data.carryover ?? "0"

  // Calculate percentage changes vs last month
  const calcPercentChange = (current: string | number, previous: string | number): { text: string; isPositive: boolean } => {
    const curr = Number(current)
    const prev = Number(previous)
    if (isNaN(curr) || isNaN(prev)) return { text: "—", isPositive: true }
    if (prev === 0) return { text: curr === 0 ? "0%" : "—", isPositive: true }
    const change = ((curr - prev) / Math.abs(prev)) * 100
    const sign = change > 0 ? "+" : ""
    return { text: `${sign}${change.toFixed(1)}%`, isPositive: change >= 0 }
  }

  const incomeChange = calcPercentChange(data.total_income, prevIncome)
  const expenseChange = calcPercentChange(data.total_expense, prevExpense)
  const balanceChange = calcPercentChange(data.balance, carryover)
  
  // Dynamic status messages
  const statusMessages: Record<"excellent" | "good" | "fair" | "critical", Record<"mk" | "en", string>> = {
    excellent: {
      mk: `Одличен финансиски месец - Трошок на месецот ${topCategory}`,
      en: `Excellent financial month - Expense of the month ${topCategory}`
    },
    good: {
      mk: `Добар финансиски месец, ${topCategory}`,
      en: `Good financial month, ${topCategory}`
    },
    fair: {
      mk: `Просечен финансиски месец, ${topCategory}`,
      en: `Fair financial month, ${topCategory}`
    },
    critical: {
      mk: `Предупредување: Внимание на трошок - ${topCategory}`,
      en: `Warning: Attention needed on expense - ${topCategory}`
    }
  }

  const displayMessage = statusMessages[status][language === "mk" ? "mk" : "en"]

  return (
    <section className="dashboard-page">
      <div className="dashboard__header">
        <div>
          <p className="eyebrow">{t("financialImpact")}</p>
          <h1 className={`hero-title health-${color}`}>{displayMessage}</h1>
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
          <p className={`stat-card__trend ${incomeChange.isPositive ? 'trend--positive' : 'trend--negative'}`}>
            {incomeChange.text} {t("vsLastMonth")}
          </p>
        </article>
        <article className="stat-card stat-card--expense">
          <p className="stat-card__label">{t("expenses")}</p>
          <p className="stat-card__value">{formatter.format(Number(data.total_expense))}</p>
          <p className={`stat-card__trend ${expenseChange.isPositive ? 'trend--negative' : 'trend--positive'}`}>
            {expenseChange.text} {t("vsLastMonth")}
          </p>
        </article>
        <article className="stat-card">
          <p className="stat-card__label">{t("balance")}</p>
          <p className="stat-card__value">{formatter.format(Number(data.balance))}</p>
          <p className={`stat-card__trend ${balanceChange.isPositive ? 'trend--positive' : 'trend--negative'}`}>
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
        {/* <div className="panel">
          <p className="panel__title">{t("financialChecklist")}</p>
          <p className="panel__subtitle">{t("focusSmartActions")}</p>
          <ul>
            <li>→ {t("checkAutoTransfer")}</li>
            <li>→ {t("syncTravelExpenses")}</li>
            <li>→ {t("confirmCreditCardPayment")}</li>
          </ul>
        </div> */}
      </div>
    </section>
  )
}