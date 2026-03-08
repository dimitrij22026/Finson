import { useState, useEffect } from "react"
import { Outlet, useLocation } from "react-router-dom"

import { SearchProvider } from "../../context/SearchContext"
import { CurrencyWelcomeModal } from "../ui/CurrencyWelcomeModal"
import { Sidebar } from "./Sidebar"
import { TopBar } from "./TopBar"

const CURRENCY_SETUP_KEY = "finance-app.needs-currency-setup"

export const AppLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [showCurrencyModal, setShowCurrencyModal] = useState(() => {
    return localStorage.getItem(CURRENCY_SETUP_KEY) === "1"
  })
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return window.innerWidth > 1100 && window.innerWidth < 1400; // Auto-collapse on medium screens
  })
  const location = useLocation()

  // Close sidebar on route change on mobile
  useEffect(() => {
    setIsSidebarOpen(false)
  }, [location])

  // Handle auto-collapse responsiveness on window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 1100) {
        setIsSidebarCollapsed(false); // Mobile handles its own off-canvas drawer
      } else if (window.innerWidth < 1400) {
        setIsSidebarCollapsed(true);
      } else {
        setIsSidebarCollapsed(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <SearchProvider>
      {showCurrencyModal && (
        <CurrencyWelcomeModal
          onComplete={() => {
            localStorage.removeItem(CURRENCY_SETUP_KEY)
            setShowCurrencyModal(false)
          }}
        />
      )}
      <div className={`app-shell ${isSidebarCollapsed ? 'app-shell--collapsed' : ''}`}>
        <Sidebar 
          isOpen={isSidebarOpen}
          isCollapsed={isSidebarCollapsed}
          onClose={() => setIsSidebarOpen(false)} 
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
        {isSidebarOpen && <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />}
        <div className="app-main">
          <TopBar onMenuClick={() => setIsSidebarOpen(true)} />
          <main className="app-content">
            <Outlet />
          </main>
        </div>
      </div>
    </SearchProvider>
  )
}
