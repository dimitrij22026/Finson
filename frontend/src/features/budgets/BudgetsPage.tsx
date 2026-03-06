import { useState, useEffect } from "react"
import type { FormEvent } from "react"
import { Trash2, Pencil, X } from "lucide-react"
import { createPortal } from "react-dom"

import { useBudgets, useCreateBudget, useDeleteBudget, useUpdateBudget } from "./hooks"
import { useLanguage } from "../../i18n"
import { useAuth } from "../../hooks/useAuth"
import type { BudgetGoal } from "../../api/types"

export const BudgetsPage = () => {
  const { data, isLoading, isError } = useBudgets()
  const createBudget = useCreateBudget()
  const deleteBudget = useDeleteBudget()
  const updateBudget = useUpdateBudget()
  const { language, t } = useLanguage()
  const { user } = useAuth()
  const userCurrency = user?.currency || "EUR"

  // Edit modal state
  const [editingBudget, setEditingBudget] = useState<BudgetGoal | null>(null)
  const [editFormState, setEditFormState] = useState({
    category: "",
    limit_amount: "",
    period: "monthly" as "monthly" | "weekly" | "yearly",
    starts_on: "",
  })

  // Prevent body scrolling when modal is open
  useEffect(() => {
    if (editingBudget) {
      document.body.classList.add('modal-open')
    } else {
      document.body.classList.remove('modal-open')
    }

    return () => {
      document.body.classList.remove('modal-open')
    }
  }, [editingBudget])

  const openEditModal = (budget: BudgetGoal) => {
    setEditingBudget(budget)
    setEditFormState({
      category: budget.category,
      limit_amount: String(budget.limit_amount),
      period: budget.period,
      starts_on: budget.starts_on,
    })
  }

  const closeEditModal = () => {
    setEditingBudget(null)
  }

  const handleEditSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!editingBudget) return
    try {
      await updateBudget.mutateAsync({
        id: editingBudget.id,
        category: editFormState.category,
        limit_amount: editFormState.limit_amount,
        period: editFormState.period,
        starts_on: editFormState.starts_on,
      })
      closeEditModal()
    } catch (err) {
      console.error("Failed to update budget:", err)
    }
  }

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

        <select
          className="input"
          value={formState.period}
          onChange={(e) =>
            setFormState((prev) => ({
              ...prev,
              period: e.target.value as "monthly" | "weekly" | "yearly",
            }))
          }
        >
          <option value="monthly">{t("monthly")}</option>
          <option value="weekly">{t("weekly")}</option>
          <option value="yearly">{t("yearly")}</option>
        </select>

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
                      <div className="action-buttons">
                        <button
                          className="edit-button"
                          onClick={() => openEditModal(budget)}
                          title={t("edit")}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          className="delete-button"
                          onClick={() => handleDelete(budget.id)}
                          disabled={deleteBudget.isPending}
                          title={t("deleteBudget")}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
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

      {editingBudget &&
        createPortal(
          <div className="modal-overlay" onClick={closeEditModal}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal__header">
                <h3>{t("editBudget") || "Edit Budget"}</h3>
                <button className="modal__close" onClick={closeEditModal}>
                  <X size={20} />
                </button>
              </div>
              <form className="modal__form" onSubmit={handleEditSubmit}>
                <div className="input-group">
                  <label>{t("category")}</label>
                  <input
                    className="input"
                    value={editFormState.category}
                    onChange={(e) => setEditFormState((prev) => ({ ...prev, category: e.target.value }))}
                    required
                  />
                </div>
                <div className="input-group">
                  <label>{t("limit")}</label>
                  <input
                    className="input"
                    type="number"
                    step="0.01"
                    value={editFormState.limit_amount}
                    onChange={(e) => setEditFormState((prev) => ({ ...prev, limit_amount: e.target.value }))}
                    required
                  />
                </div>
                <div className="input-group">
                  <label>{t("period")}</label>
                  <select
                    className="input"
                    value={editFormState.period}
                    onChange={(e) =>
                      setEditFormState((prev) => ({
                        ...prev,
                        period: e.target.value as "monthly" | "weekly" | "yearly",
                      }))
                    }
                  >
                    <option value="monthly">{t("monthly")}</option>
                    <option value="weekly">{t("weekly")}</option>
                    <option value="yearly">{t("yearly")}</option>
                  </select>
                </div>
                <div className="input-group">
                  <label>{t("startDate") || "Start Date"}</label>
                  <input
                    className="input"
                    type="date"
                    value={editFormState.starts_on}
                    onChange={(e) => setEditFormState((prev) => ({ ...prev, starts_on: e.target.value }))}
                  />
                </div>
                <div className="modal__actions">
                  <button type="button" className="secondary-button" onClick={closeEditModal}>
                    {t("cancel")}
                  </button>
                  <button type="submit" className="primary-button" disabled={updateBudget.isPending}>
                    {updateBudget.isPending ? t("saving") : t("save")}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </section>
  )
}
