import { useCallback, useEffect, useMemo, useState } from "react"

export type WatchlistAssetType = "stock" | "crypto"

export interface WatchlistDataSource {
  getFavorites: (assetType: WatchlistAssetType) => Promise<string[]> | string[]
  setFavorites: (assetType: WatchlistAssetType, symbols: string[]) => Promise<void> | void
}

const STORAGE_PREFIX = "market-watchlist-v1"

const normalizeSymbol = (symbol: string) => symbol.trim().toUpperCase()

const dedupeSymbols = (symbols: string[]) => {
  const unique = new Set<string>()
  for (const symbol of symbols) {
    const normalized = normalizeSymbol(symbol)
    if (normalized) unique.add(normalized)
  }
  return Array.from(unique)
}

const localStorageDataSource: WatchlistDataSource = {
  getFavorites(assetType) {
    if (typeof window === "undefined") return []

    const key = `${STORAGE_PREFIX}:${assetType}`
    const raw = window.localStorage.getItem(key)
    if (!raw) return []

    try {
      const parsed = JSON.parse(raw)
      if (!Array.isArray(parsed)) return []
      return dedupeSymbols(parsed)
    } catch {
      return []
    }
  },
  setFavorites(assetType, symbols) {
    if (typeof window === "undefined") return

    const key = `${STORAGE_PREFIX}:${assetType}`
    window.localStorage.setItem(key, JSON.stringify(dedupeSymbols(symbols)))
  },
}

export const useWatchlist = (
  assetType: WatchlistAssetType,
  dataSource: WatchlistDataSource = localStorageDataSource,
) => {
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    let active = true

    Promise.resolve(dataSource.getFavorites(assetType))
      .then((symbols) => {
        if (!active) return
        setFavorites(new Set(dedupeSymbols(symbols)))
      })
      .finally(() => {
        if (active) setIsReady(true)
      })

    return () => {
      active = false
    }
  }, [assetType, dataSource])

  const persistFavorites = useCallback(
    (next: Set<string>) => {
      const symbols = Array.from(next)
      void Promise.resolve(dataSource.setFavorites(assetType, symbols))
    },
    [assetType, dataSource],
  )

  const isFavorite = useCallback((symbol: string) => favorites.has(normalizeSymbol(symbol)), [favorites])

  const addFavorite = useCallback(
    (symbol: string) => {
      const normalized = normalizeSymbol(symbol)
      if (!normalized) return

      setFavorites((prev) => {
        if (prev.has(normalized)) return prev
        const next = new Set(prev)
        next.add(normalized)
        persistFavorites(next)
        return next
      })
    },
    [persistFavorites],
  )

  const removeFavorite = useCallback(
    (symbol: string) => {
      const normalized = normalizeSymbol(symbol)
      setFavorites((prev) => {
        if (!prev.has(normalized)) return prev
        const next = new Set(prev)
        next.delete(normalized)
        persistFavorites(next)
        return next
      })
    },
    [persistFavorites],
  )

  const toggleFavorite = useCallback(
    (symbol: string) => {
      const normalized = normalizeSymbol(symbol)
      if (!normalized) return

      setFavorites((prev) => {
        const next = new Set(prev)
        if (next.has(normalized)) next.delete(normalized)
        else next.add(normalized)
        persistFavorites(next)
        return next
      })
    },
    [persistFavorites],
  )

  const clearFavorites = useCallback(() => {
    const next = new Set<string>()
    setFavorites(next)
    persistFavorites(next)
  }, [persistFavorites])

  const favoriteSymbols = useMemo(() => Array.from(favorites), [favorites])

  return {
    favorites,
    favoriteSymbols,
    isFavorite,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    clearFavorites,
    isReady,
  }
}
