export interface NewsItem {
  headline: string
  url: string
  source: string
  publishedAt: string
}

interface RssItem {
  title?: string
  link?: string
  pubDate?: string
  source?: string
}

interface Rss2JsonItem {
  title?: string
  link?: string
  pubDate?: string
  author?: string
}

interface Rss2JsonResponse {
  status?: string
  items?: Rss2JsonItem[]
}

const DEFAULT_SOURCE = "Financial News"
const RSS_FEED_URLS = [
  "https://finance.yahoo.com/rss/topstories",
  "https://feeds.reuters.com/reuters/businessNews",
  "https://www.cnbc.com/id/10001147/device/rss/rss.html",
]
const CORS_PROXY_URL = "https://api.allorigins.win/raw?url="
const JSON_FALLBACK_URL_BASE = "https://api.rss2json.com/v1/api.json?rss_url="
const REQUEST_TIMEOUT_MS = 7000
const RECENT_NEWS_WINDOW_MS = 1000 * 60 * 60 * 72
const STRONG_STOCK_KEYWORDS = [
  "stock",
  "stocks",
  "share",
  "shares",
  "equity",
  "equities",
  "index",
  "indices",
  "s&p",
  "nasdaq",
  "dow",
  "nyse",
  "etf",
  "earnings",
  "guidance",
  "analyst",
  "price target",
  "rally",
  "selloff",
  "market close",
]
const WEAK_STOCK_KEYWORDS = [
  "investor",
  "investors",
  "trading",
  "futures",
  "pre-market",
  "after-hours",
  "wall street",
  "treasury yields",
  "fed",
  "inflation",
  "rate cut",
]
const EXCLUDED_KEYWORDS = [
  "mlb",
  "nfl",
  "nba",
  "soccer",
  "prediction market",
  "weather",
  "celebrity",
]

const fetchWithTimeout = async (url: string): Promise<Response> => {
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    return await fetch(url, { signal: controller.signal })
  } finally {
    window.clearTimeout(timeoutId)
  }
}

const toNewsItem = (item: RssItem): NewsItem | null => {
  const headline = item.title?.trim()
  const url = item.link?.trim()

  if (!headline || !url) {
    return null
  }

  return {
    headline,
    url,
    source: item.source?.trim() || DEFAULT_SOURCE,
    publishedAt: item.pubDate || new Date().toISOString(),
  }
}

const extractSourceFromUrl = (url: string): string => {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "")
    const firstSegment = hostname.split(".")[0]

    if (!firstSegment) {
      return DEFAULT_SOURCE
    }

    return firstSegment.charAt(0).toUpperCase() + firstSegment.slice(1)
  } catch {
    return DEFAULT_SOURCE
  }
}

const isRecent = (publishedAt: string): boolean => {
  const timestamp = new Date(publishedAt).getTime()
  if (Number.isNaN(timestamp)) {
    return false
  }

  return Date.now() - timestamp <= RECENT_NEWS_WINDOW_MS
}

const normalizeAndSort = (items: NewsItem[], limit: number): NewsItem[] => {
  const uniqueByUrl = new Map<string, NewsItem>()

  items.forEach((item) => {
    if (!isRecent(item.publishedAt)) {
      return
    }

    const headline = item.headline.toLowerCase()
    const hasExcludedKeyword = EXCLUDED_KEYWORDS.some((keyword) => headline.includes(keyword))
    if (hasExcludedKeyword) {
      return
    }

    const strongHits = STRONG_STOCK_KEYWORDS.filter((keyword) => headline.includes(keyword)).length
    const weakHits = WEAK_STOCK_KEYWORDS.filter((keyword) => headline.includes(keyword)).length
    const tickerLike = /\b[A-Z]{2,5}\b/.test(item.headline)
    const relevanceScore = strongHits * 2 + weakHits + (tickerLike ? 1 : 0)

    if (relevanceScore < 2) {
      return
    }

    const normalizedItem: NewsItem = {
      ...item,
      source:
        item.source && item.source !== DEFAULT_SOURCE
          ? item.source
          : extractSourceFromUrl(item.url),
    }

    if (!uniqueByUrl.has(item.url)) {
      uniqueByUrl.set(item.url, normalizedItem)
    }
  })

  return Array.from(uniqueByUrl.values())
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, limit)
}

const fetchXmlFeed = async (feedUrl: string): Promise<NewsItem[]> => {
  const response = await fetchWithTimeout(`${CORS_PROXY_URL}${encodeURIComponent(feedUrl)}`)

  if (!response.ok) {
    throw new Error("Unable to fetch financial news")
  }

  const xmlText = await response.text()
  const parser = new DOMParser()
  const xml = parser.parseFromString(xmlText, "application/xml")

  const hasParserError = xml.getElementsByTagName("parsererror").length > 0
  if (hasParserError) {
    throw new Error("Invalid news feed response")
  }

  return Array.from(xml.querySelectorAll("item"))
    .map((node) => {
      const sourceNode = node.querySelector("source")
      const sourceText = sourceNode?.textContent?.trim() || sourceNode?.getAttribute("url") || ""

      return toNewsItem({
        title: node.querySelector("title")?.textContent || undefined,
        link: node.querySelector("link")?.textContent || undefined,
        pubDate: node.querySelector("pubDate")?.textContent || undefined,
        source: sourceText,
      })
    })
    .filter((entry): entry is NewsItem => entry !== null)
}

const fetchJsonFallback = async (): Promise<NewsItem[]> => {
  const requests = RSS_FEED_URLS.map(async (feedUrl) => {
    const fallbackUrl = `${JSON_FALLBACK_URL_BASE}${encodeURIComponent(feedUrl)}`
    const response = await fetchWithTimeout(fallbackUrl)

    if (!response.ok) {
      return []
    }

    const payload = (await response.json()) as Rss2JsonResponse
    if (payload.status !== "ok") {
      return []
    }

    return (payload.items ?? [])
      .map((item) =>
        toNewsItem({
          title: item.title,
          link: item.link,
          pubDate: item.pubDate,
          source: item.author || DEFAULT_SOURCE,
        })
      )
      .filter((entry): entry is NewsItem => entry !== null)
  })

  const settled = await Promise.all(requests)
  return settled.flat()
}

export const fetchFinancialNews = async (limit = 5): Promise<NewsItem[]> => {
  const safeLimit = Math.max(1, limit)

  try {
    const feedPromises = RSS_FEED_URLS.map((feedUrl) =>
      fetchXmlFeed(feedUrl).catch(() => [] as NewsItem[])
    )
    const feedResults = await Promise.all(feedPromises)
    const merged = normalizeAndSort(feedResults.flat(), safeLimit)

    if (merged.length > 0) {
      return merged
    }

    throw new Error("No recent XML feed items")
  } catch {
    const fallbackItems = await fetchJsonFallback()
    const recentFallback = normalizeAndSort(fallbackItems, safeLimit)

    if (recentFallback.length === 0) {
      throw new Error("Unable to fetch recent financial news")
    }

    return recentFallback
  }
}
