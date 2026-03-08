import { useState } from "react"
import type { FormEvent } from "react"
import { useLocation, useNavigate } from "react-router-dom"

import { useAuth } from "../../hooks/useAuth"
import { useLanguage } from "../../i18n"

export const LoginPage = () => {
  const { login, register } = useAuth()
  const { language, t } = useLanguage()
  const location = useLocation()
  const queryParams = new URLSearchParams(location.search)
  const initialMode = queryParams.get("mode") === "register" ? "register" : "login"
  const [mode, setMode] = useState<"login" | "register">(initialMode)
  type AuthFormState = {
    full_name: string
    email: string
    password: string
    confirmPassword: string
  }
  const [formState, setFormState] = useState<AuthFormState>({
    full_name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const from = (location.state as { from?: { pathname?: string } } | undefined)?.from?.pathname ?? "/"

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setLoading(true)
    try {
      if (mode === "login") {
        await login({ email: formState.email, password: formState.password })
      } else {
        if (formState.password !== formState.confirmPassword) {
          setError(t("passwordsDontMatch"))
          setLoading(false)
          return
        }
        await register({
          email: formState.email,
          password: formState.password,
          full_name: formState.full_name,
        })
      }
      navigate(from, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : t("saveFailed"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>{mode === "login" ? t("login") : t("register")}</h1>
        <p className="auth-subtitle">{t("loginSubtitle")}</p>
        {mode === "register" && (
          <input
            className="input"
            placeholder={t("fullName")}
            value={formState.full_name}
            onChange={(e) => setFormState((prev) => ({ ...prev, full_name: e.target.value }))}
          />
        )}
        <input
          className="input"
          type="email"
          placeholder={t("email")}
          value={formState.email}
          onChange={(e) => setFormState((prev) => ({ ...prev, email: e.target.value }))}
          required
        />
        <input
          className="input"
          type="password"
          placeholder={t("password")}
          value={formState.password}
          onChange={(e) => setFormState((prev) => ({ ...prev, password: e.target.value }))}
          required
        />
        {mode === "register" && (
          <input
            className="input"
            type="password"
            placeholder={t("confirmPassword")}
            value={formState.confirmPassword}
            onChange={(e) => setFormState((prev) => ({ ...prev, confirmPassword: e.target.value }))}
            required
          />
        )}
        {error && <p className="auth-error">{error}</p>}
        <button className="primary-button" disabled={loading}>
          {loading ? t("loading") : mode === "login" ? t("login") : t("createAccount")}
        </button>
        <p className="auth-toggle">
          {mode === "login" ? t("noAccount") : t("haveAccount")}
          <button type="button" onClick={() => setMode((prev) => (prev === "login" ? "register" : "login"))}>
            {mode === "login" ? t("register") : t("login")}
          </button>
        </p>
      </form>
    </div>
  )
}
