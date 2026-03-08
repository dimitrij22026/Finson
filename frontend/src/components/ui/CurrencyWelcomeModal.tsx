import { useState, useRef, useEffect } from "react"
import { Search, ChevronDown, Sparkles } from "lucide-react"

import { useAuth } from "../../hooks/useAuth"
import { apiClient } from "../../api/client"
import { useLanguage } from "../../i18n"

const SUPPORTED_CURRENCIES = [
  "EUR", "USD", "MKD", "GBP", "CHF", "JPY", "CAD", "AUD", "CNY",
  "SEK", "NOK", "DKK", "PLN", "CZK", "HUF", "RON", "BGN", "HRK",
  "TRY", "RUB", "BRL", "MXN", "ARS", "ZAR", "INR",
]

const POPULAR_CURRENCIES = ["EUR", "USD", "MKD"]

const CURRENCY_META: Record<string, { name: string; flag: string }> = {
  EUR: { name: "Euro", flag: "🇪🇺" },
  USD: { name: "US Dollar", flag: "🇺🇸" },
  MKD: { name: "Macedonian Denar", flag: "🇲🇰" },
  GBP: { name: "British Pound", flag: "🇬🇧" },
  CHF: { name: "Swiss Franc", flag: "🇨🇭" },
  JPY: { name: "Japanese Yen", flag: "🇯🇵" },
  CAD: { name: "Canadian Dollar", flag: "🇨🇦" },
  AUD: { name: "Australian Dollar", flag: "🇦🇺" },
  CNY: { name: "Chinese Yuan", flag: "🇨🇳" },
  SEK: { name: "Swedish Krona", flag: "🇸🇪" },
  NOK: { name: "Norwegian Krone", flag: "🇳🇴" },
  DKK: { name: "Danish Krone", flag: "🇩🇰" },
  PLN: { name: "Polish Złoty", flag: "🇵🇱" },
  CZK: { name: "Czech Koruna", flag: "🇨🇿" },
  HUF: { name: "Hungarian Forint", flag: "🇭🇺" },
  RON: { name: "Romanian Leu", flag: "🇷🇴" },
  BGN: { name: "Bulgarian Lev", flag: "🇧🇬" },
  HRK: { name: "Croatian Kuna", flag: "🇭🇷" },
  TRY: { name: "Turkish Lira", flag: "🇹🇷" },
  RUB: { name: "Russian Ruble", flag: "🇷🇺" },
  BRL: { name: "Brazilian Real", flag: "🇧🇷" },
  MXN: { name: "Mexican Peso", flag: "🇲🇽" },
  ARS: { name: "Argentine Peso", flag: "🇦🇷" },
  ZAR: { name: "South African Rand", flag: "🇿🇦" },
  INR: { name: "Indian Rupee", flag: "🇮🇳" },
}

export const CurrencyWelcomeModal = ({ onComplete }: { onComplete: () => void }) => {
  const { token, refreshUser } = useAuth()
  const { t } = useLanguage()
  const [selected, setSelected] = useState("EUR")
  const [search, setSearch] = useState("")
  const [showAll, setShowAll] = useState(false)
  const [saving, setSaving] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    document.body.classList.add("modal-open")
    return () => document.body.classList.remove("modal-open")
  }, [])

  const otherCurrencies = SUPPORTED_CURRENCIES.filter(
    (c) => !POPULAR_CURRENCIES.includes(c),
  )

  const filtered = search
    ? otherCurrencies.filter(
        (c) =>
          c.toLowerCase().includes(search.toLowerCase()) ||
          CURRENCY_META[c]?.name.toLowerCase().includes(search.toLowerCase()),
      )
    : otherCurrencies

  const handleConfirm = async () => {
    if (!token) return
    setSaving(true)
    try {
      await apiClient.post("/users/me/change-currency", {
        new_currency: selected,
        convert_values: false,
      }, { token })
      await refreshUser()
      onComplete()
    } catch {
      // If it fails, still allow them through — they can change later
      onComplete()
    }
  }

  const renderCurrencyOption = (code: string) => {
    const meta = CURRENCY_META[code]
    const isSelected = selected === code
    return (
      <button
        key={code}
        type="button"
        className={`cwm-currency-option ${isSelected ? "cwm-currency-option--selected" : ""}`}
        onClick={() => setSelected(code)}
      >
        <span className="cwm-currency-flag">{meta?.flag}</span>
        <span className="cwm-currency-code">{code}</span>
        <span className="cwm-currency-name">{meta?.name}</span>
        {isSelected && <span className="cwm-currency-check">✓</span>}
      </button>
    )
  }

  return (
    <div className="cwm-overlay">
      <div className="cwm-modal">
        <div className="cwm-header">
          <div className="cwm-icon-wrapper">
            <Sparkles size={28} />
          </div>
          <h2 className="cwm-title">{t("welcomeCurrencyTitle")}</h2>
          <p className="cwm-subtitle">{t("welcomeCurrencySubtitle")}</p>
        </div>

        <div className="cwm-body">
          <div className="cwm-section">
            <span className="cwm-section-label">{t("welcomeCurrencyPopular")}</span>
            <div className="cwm-popular-grid">
              {POPULAR_CURRENCIES.map(renderCurrencyOption)}
            </div>
          </div>

          <div className="cwm-divider" />

          <div className="cwm-section">
            <button
              type="button"
              className="cwm-expand-btn"
              onClick={() => {
                setShowAll(!showAll)
                if (!showAll) setTimeout(() => searchRef.current?.focus(), 100)
              }}
            >
              <span>{t("welcomeCurrencyAll")}</span>
              <ChevronDown size={16} className={showAll ? "cwm-chevron--open" : ""} />
            </button>

            {showAll && (
              <>
                <div className="cwm-search-wrapper">
                  <Search size={14} className="cwm-search-icon" />
                  <input
                    ref={searchRef}
                    className="cwm-search-input"
                    placeholder={t("welcomeCurrencySearch")}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <div className="cwm-all-list">
                  {filtered.map(renderCurrencyOption)}
                  {filtered.length === 0 && (
                    <p className="cwm-no-results">No results</p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="cwm-footer">
          <button
            className="primary-button cwm-confirm-btn"
            disabled={saving}
            onClick={handleConfirm}
          >
            {saving ? t("loading") : t("welcomeCurrencyConfirm")}
          </button>
        </div>
      </div>
    </div>
  )
}
