import { useState, useRef, useEffect } from "react"
import type { FormEvent } from "react"
import { Trash2, ChevronDown } from "lucide-react"

import { useBudgets, useCreateBudget, useDeleteBudget } from "./hooks"
import { useLanguage } from "../../i18n"
import { useAuth } from "../../hooks/useAuth"

export const BudgetsPage = () => {
  const { data, isLoading, isError } = useBudgets()
  const createBudget = useCreateBudget()
  const deleteBudget = useDeleteBudget()
  const { language, t } = useLanguage()
  const { user } = useAuth()
  const userCurrency = user?.currency || "EUR"
  
  const handleDelete = (id: number) => {
    if (window.confirm(t("confirmDelete"))) {
      deleteBudget.mutate(id)
    }
  }
  
  type BudgetFormState = {
    category: string
    limit_amount: string
    period: "monthly" | "weekly" | "yearly"
    starts_on: string
  }

  const [formState, setFormState] = useState<BudgetFormState>({
    category: "",
    limit_amount: "",
    period: "monthly",
    starts_on: new Date().toISOString().slice(0, 10),
  })

  const [error, setError] = useState<string | null>(null)

  // Custom dropdown state
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false)
  const periodDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (periodDropdownRef.current && !periodDropdownRef.current.contains(e.target as Node)) {
        setShowPeriodDropdown(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const PERIOD_COLORS: Record<string, string> = {
    monthly: "#6366f1",
    weekly: "#06b6d4",
    yearly: "#f59e0b",
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    try {
      await createBudget.mutateAsync({
        ...formState,
        limit_amount: formState.limit_amount,
      })
      setFormState((prev) => ({ ...prev, category: "", limit_amount: "" }))
    } catch (err) {
      setError(err instanceof Error ? err.message : t("createFailed"))
    }
  }

  return (
    <section>
      <h2 className="section-title">{t("newBudget")}</h2>

      <form className="panel form-grid" onSubmit={handleSubmit}>
        <input
          className="input"
          placeholder={t("category")}
          value={formState.category}
          onChange={(e) => setFormState((prev) => ({ ...prev, category: e.target.value }))}
          required
        />

        <input
          className="input"
          type="number"
          step="0.01"
          placeholder={t("limit")}
          value={formState.limit_amount}
          onChange={(e) => setFormState((prev) => ({ ...prev, limit_amount: e.target.value }))}
          required
        />

        <div className="custom-dropdown" ref={periodDropdownRef}>
          <button
            type="button"
            className="custom-dropdown__trigger"
            onClick={() => setShowPeriodDropdown((v) => !v)}
          >
            <span className="custom-dropdown__dot" style={{ background: PERIOD_COLORS[formState.period] }} />
            <span className="custom-dropdown__text">{t(formState.period)}</span>
            <ChevronDown size={14} className={`custom-dropdown__chevron${showPeriodDropdown ? " custom-dropdown__chevron--open" : ""}`} />
          </button>
          {showPeriodDropdown && (
            <div className="custom-dropdown__menu">
              {(["monthly", "weekly", "yearly"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`custom-dropdown__item${formState.period === p ? " custom-dropdown__item--active" : ""}`}
                  onClick={() => { setFormState((prev) => ({ ...prev, period: p })); setShowPeriodDropdown(false) }}
                >
                  <span className="custom-dropdown__dot" style={{ background: PERIOD_COLORS[p] }} />
                  <span>{t(p)}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <input
          className="input"
          type="date"
          value={formState.starts_on}
          onChange={(e) => setFormState((prev) => ({ ...prev, starts_on: e.target.value }))}
        />

        {error && <p className="auth-error">{error}</p>}

        <button className="primary-button" disabled={createBudget.isPending}>
          {createBudget.isPending ? t("saving") : t("saveBudget")}
        </button>
      </form>

      <div className="dashboard__split">
        <div className="panel">
          <h3 className="panel__title">{t("activeBudgets")}</h3>

          {isLoading ? (
            <div className="page-centered">
              <div className="loader" />
            </div>
          ) : isError ? (
            <p>{language === "mk" ? "Не можеме да ги прикажеме буџетите." : "Cannot display budgets."}</p>
          ) : (
            <div className="table-responsive"><table className="table">
              <thead>
                <tr>
                  <th>{t("category")}</th>
                  <th>{t("limit")}</th>
                  <th>{t("period")}</th>
                  <th>{t("startDate")}</th>
                  <th>{t("actions")}</th>
                </tr>
              </thead>
              <tbody>
                {data?.map((budget) => (
                  <tr key={budget.id}>
                    <td>{budget.category}</td>
                    <td>
                      {new Intl.NumberFormat(language === "mk" ? "mk-MK" : "en-US", { style: "currency", currency: userCurrency }).format(Number(budget.limit_amount))}
                    </td>
                    <td>
                      {budget.period === "monthly"
                        ? t("monthly")
                        : budget.period === "weekly"
                        ? t("weekly")
                        : t("yearly")}
                    </td>
                    <td>{budget.starts_on}</td>
                    <td>
                      <button
                        className="delete-button"
                        onClick={() => handleDelete(budget.id)}
                        disabled={deleteBudget.isPending}
                        title={t("deleteBudget")}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          )}
        </div>

        {/* <div className="panel">
          <h3 className="panel__title">
            {language === "mk" ? "Предлог акции" : "Suggested Actions"}
          </h3>

          <ul>
            <li>
              → {language === "mk"
                ? "Преуреди лимит за „Забава“ (30% над просек)."
                : 'Adjust "Entertainment" limit (30% above average).'}
            </li>

            <li>
              → {language === "mk"
                ? "Активирај автоматско известување при 80% искористеност."
                : "Enable automatic notification at 80% usage."}
            </li>

            <li>
              → {language === "mk"
                ? "Додади буџет за „Патувања“ за март."
                : 'Add a "Travel" budget for March.'}
            </li>
          </ul>
        </div> */}
      </div>
    </section>
  )
}
