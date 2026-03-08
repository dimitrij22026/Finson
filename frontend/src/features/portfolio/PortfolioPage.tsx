import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts"
import {
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  Briefcase,
  PieChart as PieChartIcon,
  BarChart3,
  Wallet,
  Target,
  Edit2,
  Check,
  X,
  ChevronDown,
} from "lucide-react"

import { useLanguage } from "../../i18n"
import { useAuth } from "../../hooks/useAuth"

/* ── Types ─────────────────────────────────────────────── */

interface Holding {
  id: string
  symbol: string
  name: string
  type: "stock" | "etf" | "crypto" | "bond" | "cash"
  shares: number
  avgCost: number
  currentPrice: number
  change24h: number
}

interface PerformancePoint {
  date: string
  value: number
}

/* ── Constants ─────────────────────────────────────────── */

const STORAGE_PREFIX = "portfolio_holdings_"

const COLORS = [
  "#6366f1", "#22c55e", "#f59e0b", "#ef4444",
  "#8b5cf6", "#06b6d4", "#ec4899", "#84cc16",
  "#14b8a6", "#f97316", "#a855f7", "#0ea5e9",
]

const TYPE_COLORS: Record<string, string> = {
  stock: "#6366f1",
  etf: "#06b6d4",
  crypto: "#f59e0b",
  bond: "#22c55e",
  cash: "#94a3b8",
}

const DEFAULT_HOLDINGS: Holding[] = [
  { id: "1", symbol: "AAPL",  name: "Apple Inc.",           type: "stock",  shares: 15, avgCost: 142.50, currentPrice: 178.72, change24h: 1.23 },
  { id: "2", symbol: "MSFT",  name: "Microsoft Corp.",      type: "stock",  shares: 10, avgCost: 280.00, currentPrice: 378.91, change24h: -0.45 },
  { id: "3", symbol: "VOO",   name: "Vanguard S&P 500 ETF", type: "etf",   shares: 20, avgCost: 380.00, currentPrice: 452.30, change24h: 0.67 },
  { id: "4", symbol: "BTC",   name: "Bitcoin",              type: "crypto", shares: 0.5, avgCost: 28000, currentPrice: 67250, change24h: 2.15 },
  { id: "5", symbol: "GOOGL", name: "Alphabet Inc.",        type: "stock",  shares: 8,  avgCost: 105.00, currentPrice: 141.80, change24h: -0.32 },
  { id: "6", symbol: "BND",   name: "Vanguard Total Bond",  type: "bond",   shares: 30, avgCost: 74.50, currentPrice: 72.10, change24h: 0.05 },
  { id: "7", symbol: "ETH",   name: "Ethereum",             type: "crypto", shares: 3,  avgCost: 1800,  currentPrice: 3520,  change24h: -1.82 },
  { id: "8", symbol: "NVDA",  name: "NVIDIA Corp.",         type: "stock",  shares: 12, avgCost: 220.00, currentPrice: 495.22, change24h: 3.41 },
]

/* ── Helpers ─────────────────────────────────────────── */

function generatePerformance(holdings: Holding[]): PerformancePoint[] {
  const totalNow = holdings.reduce((s, h) => s + h.shares * h.currentPrice, 0)
  const totalCost = holdings.reduce((s, h) => s + h.shares * h.avgCost, 0)
  const points: PerformancePoint[] = []
  const months = 12
  for (let i = months; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const progress = (months - i) / months
    const noise = 1 + (Math.sin(i * 2.1) * 0.03) + (Math.cos(i * 1.3) * 0.02)
    const value = totalCost + (totalNow - totalCost) * progress * noise
    points.push({
      date: d.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
      value: Math.round(value * 100) / 100,
    })
  }
  return points
}

function loadHoldings(userId: number | undefined): Holding[] {
  if (!userId) return []
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + userId)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed
    }
  } catch { /* ignore */ }
  return []
}

function saveHoldings(userId: number | undefined, holdings: Holding[]) {
  if (!userId) return
  localStorage.setItem(STORAGE_PREFIX + userId, JSON.stringify(holdings))
}

/* ── Component ─────────────────────────────────────────── */

export const PortfolioPage = () => {
  const { t, language } = useLanguage()
  const { user } = useAuth()
  const userCurrency = user?.currency || "USD"

  const [holdings, setHoldings] = useState<Holding[]>(() => loadHoldings(user?.id))
  const [showAddForm, setShowAddForm] = useState(false)
  const [showTypeDropdown, setShowTypeDropdown] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValues, setEditValues] = useState({ shares: "", avgCost: "", currentPrice: "" })
  const typeDropdownRef = useRef<HTMLDivElement>(null)

  // Close type dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(e.target as Node)) {
        setShowTypeDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  // Form state for adding
  const [form, setForm] = useState({
    symbol: "", name: "", type: "stock" as Holding["type"],
    shares: "", avgCost: "", currentPrice: "", change24h: "0",
  })

  const formatter = useMemo(
    () => new Intl.NumberFormat(language === "mk" ? "mk-MK" : "en-US", { style: "currency", currency: userCurrency }),
    [language, userCurrency],
  )

  const fmtCompact = useCallback(
    (v: number) => {
      if (v >= 1e6) return formatter.format(v / 1e6).replace(/[\d.,]+/, (m) => m) + ""
      return formatter.format(v)
    },
    [formatter],
  )

  // Persist to localStorage
  useEffect(() => { saveHoldings(user?.id, holdings) }, [holdings, user?.id])

  /* ── Computed values ────────────────────────────────── */

  const totalValue = useMemo(
    () => holdings.reduce((s, h) => s + h.shares * h.currentPrice, 0), [holdings],
  )

  const totalCost = useMemo(
    () => holdings.reduce((s, h) => s + h.shares * h.avgCost, 0), [holdings],
  )

  const totalGain = totalValue - totalCost
  const totalGainPct = totalCost > 0 ? (totalGain / totalCost) * 100 : 0

  const dayChange = useMemo(
    () => holdings.reduce((s, h) => {
      const prevPrice = h.currentPrice / (1 + h.change24h / 100)
      return s + (h.currentPrice - prevPrice) * h.shares
    }, 0),
    [holdings],
  )

  const dayChangePct = totalValue > 0 ? (dayChange / (totalValue - dayChange)) * 100 : 0

  const allocationData = useMemo(
    () => holdings.map((h) => ({
      name: h.symbol,
      value: Math.round(h.shares * h.currentPrice * 100) / 100,
    })).sort((a, b) => b.value - a.value),
    [holdings],
  )

  const typeAllocation = useMemo(() => {
    const map = new Map<string, number>()
    holdings.forEach((h) => {
      map.set(h.type, (map.get(h.type) || 0) + h.shares * h.currentPrice)
    })
    return Array.from(map.entries())
      .map(([type, value]) => ({ type, value, pct: totalValue > 0 ? (value / totalValue) * 100 : 0 }))
      .sort((a, b) => b.value - a.value)
  }, [holdings, totalValue])

  const performanceData = useMemo(() => generatePerformance(holdings), [holdings])

  /* ── Handlers ───────────────────────────────────────── */

  const addHolding = () => {
    const shares = parseFloat(form.shares)
    const avgCost = parseFloat(form.avgCost)
    const currentPrice = parseFloat(form.currentPrice)
    const change24h = parseFloat(form.change24h)
    if (!form.symbol || isNaN(shares) || isNaN(avgCost) || isNaN(currentPrice)) return

    const sanitizedSymbol = form.symbol.replace(/[^a-zA-Z0-9.-]/g, "").toUpperCase().slice(0, 10)
    const sanitizedName = form.name.slice(0, 60)

    setHoldings((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        symbol: sanitizedSymbol,
        name: sanitizedName || sanitizedSymbol,
        type: form.type,
        shares: Math.max(0, shares),
        avgCost: Math.max(0, avgCost),
        currentPrice: Math.max(0, currentPrice),
        change24h: isNaN(change24h) ? 0 : change24h,
      },
    ])
    setForm({ symbol: "", name: "", type: "stock", shares: "", avgCost: "", currentPrice: "", change24h: "0" })
    setShowAddForm(false)
  }

  const removeHolding = (id: string) => {
    setHoldings((prev) => prev.filter((h) => h.id !== id))
  }

  const startEdit = (h: Holding) => {
    setEditingId(h.id)
    setEditValues({
      shares: String(h.shares),
      avgCost: String(h.avgCost),
      currentPrice: String(h.currentPrice),
    })
  }

  const saveEdit = (id: string) => {
    const shares = parseFloat(editValues.shares)
    const avgCost = parseFloat(editValues.avgCost)
    const currentPrice = parseFloat(editValues.currentPrice)
    if (isNaN(shares) || isNaN(avgCost) || isNaN(currentPrice)) return
    setHoldings((prev) =>
      prev.map((h) =>
        h.id === id ? { ...h, shares: Math.max(0, shares), avgCost: Math.max(0, avgCost), currentPrice: Math.max(0, currentPrice) } : h
      ),
    )
    setEditingId(null)
  }

  const cancelEdit = () => setEditingId(null)

  const typeLabel = (type: string) => {
    const labels: Record<string, { en: string; mk: string }> = {
      stock:  { en: "Stocks",  mk: "Акции" },
      etf:    { en: "ETFs",    mk: "ETF" },
      crypto: { en: "Crypto",  mk: "Крипто" },
      bond:   { en: "Bonds",   mk: "Обврзници" },
      cash:   { en: "Cash",    mk: "Готовина" },
    }
    return labels[type]?.[language === "mk" ? "mk" : "en"] ?? type
  }

  /* ── Render ─────────────────────────────────────────── */

  return (
    <section className="portfolio-page">
      {/* Header */}
      <div className="dashboard__header">
        <div>
          <p className="eyebrow">{t("investments")}</p>
          <h1 className="hero-title">{t("portfolio")}</h1>
        </div>
        <div className="dashboard__badge">
          <span>{t("totalAllocation")}</span>
          <strong>{formatter.format(totalValue)}</strong>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="pf-summary-grid">
        <article className="stat-card">
          <div className="pf-card-icon" style={{ background: "rgba(99,102,241,0.15)", color: "#6366f1" }}>
            <Wallet size={20} />
          </div>
          <p className="stat-card__label">{language === "mk" ? "Вкупна вредност" : "Total Value"}</p>
          <p className="stat-card__value">{formatter.format(totalValue)}</p>
          <p className={`stat-card__trend ${dayChange >= 0 ? "trend--positive" : "trend--negative"}`}>
            {dayChange >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {" "}{dayChange >= 0 ? "+" : ""}{formatter.format(dayChange)} ({dayChangePct >= 0 ? "+" : ""}{dayChangePct.toFixed(2)}%) {language === "mk" ? "денес" : "today"}
          </p>
        </article>

        <article className="stat-card">
          <div className="pf-card-icon" style={{ background: "rgba(34,197,94,0.15)", color: "#22c55e" }}>
            <TrendingUp size={20} />
          </div>
          <p className="stat-card__label">{language === "mk" ? "Вкупна добивка/загуба" : "Total Gain/Loss"}</p>
          <p className="stat-card__value" style={{ color: totalGain >= 0 ? "var(--positive)" : "var(--negative)" }}>
            {totalGain >= 0 ? "+" : ""}{formatter.format(totalGain)}
          </p>
          <p className={`stat-card__trend ${totalGain >= 0 ? "trend--positive" : "trend--negative"}`}>
            {totalGainPct >= 0 ? "+" : ""}{totalGainPct.toFixed(2)}% {language === "mk" ? "од инвестирано" : "all-time"}
          </p>
        </article>

        <article className="stat-card">
          <div className="pf-card-icon" style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b" }}>
            <Target size={20} />
          </div>
          <p className="stat-card__label">{language === "mk" ? "Инвестирано" : "Total Invested"}</p>
          <p className="stat-card__value">{formatter.format(totalCost)}</p>
          <p className="stat-card__trend" style={{ color: "var(--muted)" }}>
            {holdings.length} {language === "mk" ? "позиции" : "holdings"}
          </p>
        </article>

        <article className="stat-card">
          <div className="pf-card-icon" style={{ background: "rgba(6,182,212,0.15)", color: "#06b6d4" }}>
            <Briefcase size={20} />
          </div>
          <p className="stat-card__label">{language === "mk" ? "Најдобра позиција" : "Best Performer"}</p>
          <p className="stat-card__value" style={{ fontSize: "1.4rem" }}>
            {holdings.length > 0
              ? holdings.reduce((best, h) => {
                  const hGain = ((h.currentPrice - h.avgCost) / h.avgCost) * 100
                  const bestGain = ((best.currentPrice - best.avgCost) / best.avgCost) * 100
                  return hGain > bestGain ? h : best
                }).symbol
              : "—"}
          </p>
          {holdings.length > 0 && (() => {
            const best = holdings.reduce((b, h) => {
              const hG = ((h.currentPrice - h.avgCost) / h.avgCost) * 100
              const bG = ((b.currentPrice - b.avgCost) / b.avgCost) * 100
              return hG > bG ? h : b
            })
            const gain = ((best.currentPrice - best.avgCost) / best.avgCost) * 100
            return (
              <p className="stat-card__trend trend--positive">
                +{gain.toFixed(1)}% {language === "mk" ? "раст" : "return"}
              </p>
            )
          })()}
        </article>
      </div>

      {/* Charts Row */}
      <div className="pf-charts-row">
        {/* Performance Chart */}
        <div className="panel pf-chart-panel">
          <div className="panel__header">
            <div>
              <h3 className="panel__title">
                <BarChart3 size={18} style={{ verticalAlign: "middle", marginRight: 8 }} />
                {language === "mk" ? "Перформанси на портфолио" : "Portfolio Performance"}
              </h3>
              <p className="panel__subtitle">{language === "mk" ? "Вредност во последните 12 месеци" : "Value over the last 12 months"}</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={performanceData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="pfGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false}
                tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)} width={55} />
              <Tooltip
                formatter={(v: number) => [formatter.format(v), language === "mk" ? "Вредност" : "Value"]}
                contentStyle={{ background: "var(--card-strong)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }}
              />
              <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2.5} fill="url(#pfGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Allocation Pie */}
        <div className="panel pf-alloc-panel">
          <div className="panel__header">
            <div>
              <h3 className="panel__title">
                <PieChartIcon size={18} style={{ verticalAlign: "middle", marginRight: 8 }} />
                {t("portfolioAllocation")}
              </h3>
              <p className="panel__subtitle">{language === "mk" ? "По инструмент" : "By holding"}</p>
            </div>
          </div>
          <div className="pf-pie-wrap">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={allocationData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {allocationData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: number) => formatter.format(v)}
                  contentStyle={{ background: "var(--card-strong)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pf-pie-legend">
              {allocationData.slice(0, 6).map((item, i) => (
                <div key={item.name} className="pf-pie-legend-item">
                  <span className="pf-pie-dot" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="pf-pie-label">{item.name}</span>
                  <span className="pf-pie-pct">
                    {totalValue > 0 ? ((item.value / totalValue) * 100).toFixed(1) : 0}%
                  </span>
                </div>
              ))}
              {allocationData.length > 6 && (
                <div className="pf-pie-legend-item">
                  <span className="pf-pie-dot" style={{ background: "var(--muted)" }} />
                  <span className="pf-pie-label">{language === "mk" ? "Останато" : "Other"}</span>
                  <span className="pf-pie-pct">
                    {totalValue > 0
                      ? (allocationData.slice(6).reduce((s, i) => s + i.value, 0) / totalValue * 100).toFixed(1)
                      : 0}%
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Asset Class Breakdown */}
      <div className="panel pf-type-panel">
        <h3 className="panel__title">{language === "mk" ? "Распределба по тип" : "Asset Class Breakdown"}</h3>
        <p className="panel__subtitle">{language === "mk" ? "Диверзификација на портфолиото" : "Portfolio diversification"}</p>
        <div className="pf-type-bars">
          {typeAllocation.map(({ type, value, pct }) => (
            <div key={type} className="pf-type-row">
              <div className="pf-type-label">
                <span className="pf-type-dot" style={{ background: TYPE_COLORS[type] || "var(--muted)" }} />
                <span>{typeLabel(type)}</span>
              </div>
              <div className="pf-type-bar-wrap">
                <div className="pf-type-bar" style={{ width: `${Math.min(pct, 100)}%`, background: TYPE_COLORS[type] || "var(--muted)" }} />
              </div>
              <div className="pf-type-meta">
                <strong>{pct.toFixed(1)}%</strong>
                <span>{formatter.format(value)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Holdings Table */}
      <div className="panel pf-holdings-panel">
        <div className="panel__header">
          <div>
            <h3 className="panel__title">{language === "mk" ? "Позиции" : "Holdings"}</h3>
            <p className="panel__subtitle">{language === "mk" ? "Вашите инвестициски позиции" : "Your investment positions"}</p>
          </div>
          <button className="primary-button pf-add-btn" onClick={() => setShowAddForm((v) => !v)}>
            <Plus size={16} />
            {language === "mk" ? "Додади" : "Add"}
          </button>
        </div>

        {/* Add Form */}
        {showAddForm && (
          <div className="pf-add-form">
            <div className="pf-add-form-grid">
              <div className="pf-form-group">
                <label>{t("symbol")}</label>
                <input
                  className="input"
                  placeholder="AAPL"
                  maxLength={10}
                  value={form.symbol}
                  onChange={(e) => setForm((f) => ({ ...f, symbol: e.target.value }))}
                />
              </div>
              <div className="pf-form-group">
                <label>{language === "mk" ? "Име" : "Name"}</label>
                <input
                  className="input"
                  placeholder="Apple Inc."
                  maxLength={60}
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="pf-form-group">
                <label>{t("type")}</label>
                <div className="pf-type-dropdown" ref={typeDropdownRef}>
                  <button
                    type="button"
                    className="pf-type-dropdown__trigger"
                    onClick={() => setShowTypeDropdown((v) => !v)}
                  >
                    <span className="pf-type-dropdown__dot" style={{ background: TYPE_COLORS[form.type] }} />
                    <span className="pf-type-dropdown__text">{typeLabel(form.type)}</span>
                    <ChevronDown size={14} className={`pf-type-dropdown__chevron${showTypeDropdown ? " pf-type-dropdown__chevron--open" : ""}`} />
                  </button>
                  {showTypeDropdown && (
                    <div className="pf-type-dropdown__menu">
                      {(["stock", "etf", "crypto", "bond", "cash"] as Holding["type"][]).map((tp) => (
                        <button
                          key={tp}
                          type="button"
                          className={`pf-type-dropdown__item${form.type === tp ? " pf-type-dropdown__item--active" : ""}`}
                          onClick={() => { setForm((f) => ({ ...f, type: tp })); setShowTypeDropdown(false) }}
                        >
                          <span className="pf-type-dropdown__dot" style={{ background: TYPE_COLORS[tp] }} />
                          <span>{typeLabel(tp)}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="pf-form-group">
                <label>{language === "mk" ? "Количина" : "Shares"}</label>
                <input
                  className="input" type="number" min="0" step="any"
                  value={form.shares}
                  onChange={(e) => setForm((f) => ({ ...f, shares: e.target.value }))}
                />
              </div>
              <div className="pf-form-group">
                <label>{language === "mk" ? "Просечна цена" : "Avg Cost"}</label>
                <input
                  className="input" type="number" min="0" step="any"
                  value={form.avgCost}
                  onChange={(e) => setForm((f) => ({ ...f, avgCost: e.target.value }))}
                />
              </div>
              <div className="pf-form-group">
                <label>{language === "mk" ? "Тековна цена" : "Current Price"}</label>
                <input
                  className="input" type="number" min="0" step="any"
                  value={form.currentPrice}
                  onChange={(e) => setForm((f) => ({ ...f, currentPrice: e.target.value }))}
                />
              </div>
            </div>
            <div className="pf-add-form-actions">
              <button className="primary-button" onClick={addHolding}>
                <Plus size={14} /> {t("save")}
              </button>
              <button className="secondary-button" onClick={() => setShowAddForm(false)}>
                {t("cancel")}
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="market-table-wrap">
          <table className="market-table pf-table">
            <thead>
              <tr>
                <th>{t("symbol")}</th>
                <th>{language === "mk" ? "Тип" : "Type"}</th>
                <th style={{ textAlign: "right" }}>{language === "mk" ? "Количина" : "Shares"}</th>
                <th style={{ textAlign: "right" }}>{language === "mk" ? "Просечна цена" : "Avg Cost"}</th>
                <th style={{ textAlign: "right" }}>{language === "mk" ? "Цена" : "Price"}</th>
                <th style={{ textAlign: "right" }}>{language === "mk" ? "Вредност" : "Value"}</th>
                <th style={{ textAlign: "right" }}>{language === "mk" ? "Добивка/Загуба" : "Gain/Loss"}</th>
                <th style={{ textAlign: "right" }}>{t("allocationPercent")}</th>
                <th style={{ textAlign: "right" }}>{language === "mk" ? "24ч" : "24h"}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {holdings.map((h) => {
                const mktValue = h.shares * h.currentPrice
                const costBasis = h.shares * h.avgCost
                const gain = mktValue - costBasis
                const gainPct = costBasis > 0 ? (gain / costBasis) * 100 : 0
                const allocPct = totalValue > 0 ? (mktValue / totalValue) * 100 : 0
                const isEditing = editingId === h.id

                return (
                  <tr key={h.id}>
                    <td>
                      <div className="pf-symbol-cell">
                        <strong>{h.symbol}</strong>
                        <span className="pf-name-sub">{h.name}</span>
                      </div>
                    </td>
                    <td>
                      <span className="pf-type-chip" style={{ borderColor: TYPE_COLORS[h.type] || "var(--border)", color: TYPE_COLORS[h.type] || "var(--muted)" }}>
                        {typeLabel(h.type)}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {isEditing ? (
                        <input className="input pf-inline-input" type="number" min="0" step="any"
                          value={editValues.shares}
                          onChange={(e) => setEditValues((v) => ({ ...v, shares: e.target.value }))} />
                      ) : (
                        h.shares.toLocaleString(language === "mk" ? "mk-MK" : "en-US", { maximumFractionDigits: 4 })
                      )}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {isEditing ? (
                        <input className="input pf-inline-input" type="number" min="0" step="any"
                          value={editValues.avgCost}
                          onChange={(e) => setEditValues((v) => ({ ...v, avgCost: e.target.value }))} />
                      ) : (
                        formatter.format(h.avgCost)
                      )}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {isEditing ? (
                        <input className="input pf-inline-input" type="number" min="0" step="any"
                          value={editValues.currentPrice}
                          onChange={(e) => setEditValues((v) => ({ ...v, currentPrice: e.target.value }))} />
                      ) : (
                        formatter.format(h.currentPrice)
                      )}
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 600 }}>
                      {formatter.format(mktValue)}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <span style={{ color: gain >= 0 ? "var(--positive)" : "var(--negative)", fontWeight: 500 }}>
                        {gain >= 0 ? "+" : ""}{formatter.format(gain)}
                        <br />
                        <small style={{ opacity: 0.8 }}>{gainPct >= 0 ? "+" : ""}{gainPct.toFixed(2)}%</small>
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div className="pf-alloc-cell">
                        <span>{allocPct.toFixed(1)}%</span>
                        <div className="pf-alloc-micro">
                          <div className="pf-alloc-micro-fill" style={{ width: `${Math.min(allocPct, 100)}%` }} />
                        </div>
                      </div>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <span className={`market-badge ${h.change24h >= 0 ? "market-badge--up" : "market-badge--down"}`}>
                        {h.change24h >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {" "}{Math.abs(h.change24h).toFixed(2)}%
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div className="action-buttons">
                        {isEditing ? (
                          <>
                            <button className="edit-button" onClick={() => saveEdit(h.id)} title={t("save")}>
                              <Check size={15} />
                            </button>
                            <button className="delete-button" onClick={cancelEdit} title={t("cancel")}>
                              <X size={15} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button className="edit-button" onClick={() => startEdit(h)} title={t("edit")}>
                              <Edit2 size={15} />
                            </button>
                            <button className="delete-button" onClick={() => removeHolding(h.id)} title={t("delete")}>
                              <Trash2 size={15} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}

              {holdings.length === 0 && (
                <tr>
                  <td colSpan={10} style={{ textAlign: "center", padding: "3rem", color: "var(--muted)" }}>
                    {language === "mk" ? "Нема позиции. Додадете ја вашата прва инвестиција." : "No holdings yet. Add your first investment."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Stats */}
      <div className="pf-footer-row">
        <div className="panel pf-footer-stat">
          <span className="pf-footer-label">{language === "mk" ? "Портфолио статус" : "Portfolio Status"}</span>
          <span className={`pf-footer-badge ${totalGain >= 0 ? "pf-footer-badge--positive" : "pf-footer-badge--negative"}`}>
            {totalGain >= 0
              ? (language === "mk" ? "Профитабилно" : "Profitable")
              : (language === "mk" ? "Во загуба" : "In Loss")}
          </span>
        </div>
        <div className="panel pf-footer-stat">
          <span className="pf-footer-label">{language === "mk" ? "Број на типови" : "Asset Types"}</span>
          <strong>{typeAllocation.length}</strong>
        </div>
        <div className="panel pf-footer-stat">
          <span className="pf-footer-label">{language === "mk" ? "Вкупни позиции" : "Total Positions"}</span>
          <strong>{holdings.length}</strong>
        </div>
        <div className="panel pf-footer-stat">
          <span className="pf-footer-label">{language === "mk" ? "Просечна добивка" : "Avg Return"}</span>
          <strong style={{ color: totalGainPct >= 0 ? "var(--positive)" : "var(--negative)" }}>
            {totalGainPct >= 0 ? "+" : ""}{totalGainPct.toFixed(2)}%
          </strong>
        </div>
      </div>
    </section>
  )
}