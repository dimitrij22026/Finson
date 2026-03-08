import { useCallback, useMemo, useState } from "react"
import type { PropsWithChildren } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"

import { apiClient } from "../api/client"
import type {
  LoginCredentials,
  RegistrationPayload,
  TokenResponse,
  UserProfile,
} from "../api/types"
import { AuthContext } from "./auth-context"
const STORAGE_KEY = "finance-app.access-token"

const storeToken = (token: string | null) => {
  if (token) {
    localStorage.setItem(STORAGE_KEY, token)
  } else {
    localStorage.removeItem(STORAGE_KEY)
  }
}

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(STORAGE_KEY))
  const queryClient = useQueryClient()

  const clearAuthState = useCallback(() => {
    setToken(null)
    storeToken(null)
    queryClient.removeQueries({ queryKey: ["auth-profile"] })
  }, [queryClient])

  const profileQuery = useQuery<UserProfile, Error>({
    queryKey: ["auth-profile", token],
    queryFn: async () => {
      if (!token) {
        throw new Error("Missing token")
      }
      try {
        return await apiClient.get<UserProfile>("/users/me", { token })
      } catch (error) {
        clearAuthState()
        throw error
      }
    },
    enabled: Boolean(token),
    staleTime: 0,
    gcTime: 0,
    retry: false,
  })

  const { data, isFetching } = profileQuery
  const user = data ?? null
  const loading = Boolean(token) && isFetching

  const refreshUser = useCallback(async () => {
    if (!token) return
    await queryClient.invalidateQueries({ queryKey: ["auth-profile"] })
  }, [queryClient, token])

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      const { access_token } = await apiClient.post<TokenResponse>("/auth/login", credentials)
      queryClient.removeQueries({ queryKey: ["auth-profile"] })
      storeToken(access_token)
      setToken(access_token)
    },
    [queryClient],
  )

  const register = useCallback(
    async (payload: RegistrationPayload) => {
      await apiClient.post<UserProfile>("/auth/register", payload)
      localStorage.setItem("finance-app.needs-currency-setup", "1")
      await login({ email: payload.email, password: payload.password })
    },
    [login],
  )

  const logout = useCallback(() => {
    clearAuthState()
  }, [clearAuthState])

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      login,
      register,
      logout,
      refreshUser,
    }),
    [user, token, loading, login, register, logout, refreshUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
