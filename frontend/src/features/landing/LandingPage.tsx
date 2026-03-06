import { useNavigate } from "react-router-dom"
import { useLanguage } from "../../i18n/useLanguage"
import "./LandingPage.css"

export function LandingPage() {
  const navigate = useNavigate()
  const { t } = useLanguage()

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="landing-nav-logo">
          <div className="nav-logo-icon">F</div>
          <span>Finson</span>
        </div>
        <div className="landing-nav-links">
          <button onClick={() => scrollToSection("features")}>Features</button>
          <button onClick={() => scrollToSection("how-it-works")}>How it Works</button>
          <button onClick={() => scrollToSection("insights")}>Insights</button>
        </div>
        <div className="landing-nav-actions">
          <button
            onClick={() => navigate("/auth/login")}
            className="btn-nav-login"
          >
            Log in
          </button>
          <button
            onClick={() => navigate("/auth/login?mode=register")}
            className="btn-nav-register"
          >
            Get Started
          </button>
        </div>
      </nav>

      <main className="landing-main">
        {/* Hero Section */}
        <section className="landing-section hero-section">
          <h1 className="hero-title">
            Master Your Finances,<br />
            <span className="hero-title-highlight">Empower Your Future</span>
          </h1>
          <p className="hero-subtitle">
            A comprehensive, intelligent platform designed to track your expenses, optimize your budgets, and provide AI-driven insights for financial growth.
          </p>
          <div className="hero-actions">
            <button
              onClick={() => navigate("/auth/login?mode=register")}
              className="btn-hero-primary"
            >
              Start for Free
            </button>
            <button
              onClick={() => navigate("/auth/login")}
              className="btn-hero-secondary"
            >
              Sign In
            </button>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="landing-section alt-bg">
          <div className="section-inner">
            <div className="section-header">
              <h2 className="section-title">Everything You Need</h2>
              <p className="section-subtitle">
                Powerful tools and intelligent analytics packed into one intuitive dashboard.
              </p>
            </div>
            <div className="features-grid">
              {[
                { title: "Smart Tracking", desc: "Automatically categorize and monitor all your income and expenses in real-time.", icon: "📊" },
                { title: "AI Assistant", desc: "Get personalized financial advice based on your spending habits and goals.", icon: "🤖" },
                { title: "Budget Control", desc: "Set limits on different categories and receive alerts before you overspend.", icon: "💰" }
              ].map((feature, i) => (
                <div key={i} className="feature-card">
                  <div className="feature-icon">{feature.icon}</div>
                  <h3 className="feature-title">{feature.title}</h3>
                  <p className="feature-desc">
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="landing-section">
          <div className="section-inner">
            <div className="section-header">
              <h2 className="section-title">How It Works</h2>
              <p className="section-subtitle">Start managing your money in 3 simple steps.</p>
            </div>
            <div className="steps-grid">
              {[
                { step: "1", title: "Create an Account", desc: "Sign up securely in seconds." },
                { step: "2", title: "Add Transactions", desc: "Log your income and expenses easily." },
                { step: "3", title: "Gain Insights", desc: "Watch your net worth grow over time." }
              ].map((item, i) => (
                <div key={i} className="step-item">
                  <div className="step-number">
                    {item.step}
                  </div>
                  <h3 className="step-title">{item.title}</h3>
                  <p className="step-desc">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Insights Section */}
        <section id="insights" className="landing-section alt-bg">
          <div className="section-inner insights-row">
            <div className="insights-content">
              <h2 className="insights-title">Deep Financial Analytics</h2>
              <p className="insights-desc">
                Visualize your spending patterns across multiple timeframes. Understand exactly where your money goes with beautiful charts, heatmaps, and category breakdowns. Let our AI highlight potential savings.
              </p>
              <ul className="insights-list">
                {["Monthly trends & forecasting", "Category spending breakdowns", "Net worth tracking", "Customizable reports"].map((item, i) => (
                  <li key={i}>
                    <span>✓</span> {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="insights-visual">
              {/* Mock Chart Visualization */}
              <div className="mock-chart">
                {[40, 70, 45, 90, 65, 110, 85].map((h, i) => (
                  <div key={i} className="mock-bar" style={{ height: `${h}%` }}></div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="landing-section">
          <div className="section-inner">
            <div className="section-header">
              <h2 className="section-title">Why Choose Us?</h2>
            </div>
            <div className="benefits-grid">
              {[
                { label: "100%", sub: "Secure" },
                { label: "AI", sub: "Powered" },
                { label: "24/7", sub: "Sync" },
                { label: "0", sub: "Hidden Fees" }
              ].map((stat, i) => (
                <div key={i} className="benefit-item">
                  <div className="benefit-value">{stat.label}</div>
                  <div className="benefit-label">{stat.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-inner">
          <div className="landing-nav-logo">
            <div className="nav-logo-icon" style={{ width: '24px', height: '24px', fontSize: '0.8rem' }}>F</div>
            <span style={{ fontSize: '1.2rem', color: 'var(--muted)' }}>Finson</span>
          </div>
          <div className="footer-links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Contact Support</a>
          </div>
          <p className="footer-copy">
            © {new Date().getFullYear()} Finson. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
