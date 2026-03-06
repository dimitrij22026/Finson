import { createBrowserRouter } from "react-router-dom"

import { RequireAuth } from "./components/auth/RequireAuth"
import { AppLayout } from "./components/layout/AppLayout"
import { AdvicePage } from "./features/advice/AdvicePage"
import { AnalyticsPage } from "./features/analytics/AnalyticsPage"
import { BudgetsPage } from "./features/budgets/BudgetsPage"
import { DashboardPage } from "./features/dashboard/DashboardPage"
import { LoginPage } from "./features/auth/LoginPage"
import { VerifyEmailPage } from "./features/auth/VerifyEmailPage"
import { PortfolioPage } from "./features/portfolio/PortfolioPage"
import { ProfilePage } from "./features/profile/ProfilePage"
import { CryptoPage } from "./features/crypto/CryptoPage"
import { StocksPage } from "./features/stocks/StocksPage"
import { TransactionsPage } from "./features/transactions/TransactionsPage"
import { AboutPage } from "./features/about/AboutPage"
import { LandingPage } from "./features/landing/LandingPage"

export const router = createBrowserRouter([
  {
    path: "/welcome",
    element: <LandingPage />,
  },
  {
    path: "/auth/login",
    element: <LoginPage />,
  },
  {
    path: "/auth/verify",
    element: <VerifyEmailPage />,
  },
  {
    path: "/",
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "transactions", element: <TransactionsPage /> },
      { path: "budgets", element: <BudgetsPage /> },
      { path: "analytics", element: <AnalyticsPage /> },
      { path: "portfolio", element: <PortfolioPage /> },
      { path: "crypto", element: <CryptoPage /> },
      { path: "stocks", element: <StocksPage /> },
      { path: "assistant", element: <AdvicePage /> },
      { path: "profile", element: <ProfilePage /> },
      { path: "about", element: <AboutPage /> },
    ],
  },
])
