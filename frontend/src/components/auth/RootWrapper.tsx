import { useAuth } from "../../hooks/useAuth"
import { LandingPage } from "../landing/LandingPage"
import { AppLayout } from "../layout/AppLayout"

export const RootWrapper = () => {
  const { token, loading } = useAuth()

  if (loading) {
    return (
      <div className="page-centered flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 rounded-full border-4 border-[var(--accent-primary)] border-t-transparent animate-spin" />
      </div>
    )
  }

  // If user is authenticated, render the main app structure
  if (token) {
    return <AppLayout />
  }

  // Otherwise, render the unauthenticated landing page
  return <LandingPage />
}
