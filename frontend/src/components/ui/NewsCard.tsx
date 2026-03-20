import type { NewsItem } from "../../services/newsService"

interface NewsCardProps {
  item: NewsItem
}

const getTimeAgo = (publishedAt: string): string => {
  const publishedDate = new Date(publishedAt)
  if (Number.isNaN(publishedDate.getTime())) {
    return "Just now"
  }

  const diffInMs = Date.now() - publishedDate.getTime()
  if (diffInMs <= 0) {
    return "Just now"
  }

  const minutes = Math.floor(diffInMs / 60000)
  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? "" : "s"} ago`
  }

  const hours = Math.floor(minutes / 60)
  if (hours < 24) {
    return `${hours} hour${hours === 1 ? "" : "s"} ago`
  }

  const days = Math.floor(hours / 24)
  return `${days} day${days === 1 ? "" : "s"} ago`
}

export const NewsCard = ({ item }: NewsCardProps) => {
  return (
    <article className="news-card">
      <a
        className="news-card__headline"
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
      >
        {item.headline}
      </a>
      <div className="news-card__meta">
        <span>{item.source}</span>
        <span>{getTimeAgo(item.publishedAt)}</span>
      </div>
    </article>
  )
}
