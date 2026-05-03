/**
 * Абсолютные URL (http(s), data) не трогаем.
 * Пути вида `/file` при деплое с basePath (GitHub Pages: `/repo/...`) получают префикс из
 * `NEXT_PUBLIC_BASE_PATH` или эвристики по `pathname` в браузере, если при сборке переменная не попала в билд.
 */
function normalizeLeadingSlash(path: string): string {
  return path.startsWith("/") ? path : `/${path}`
}

/** Первый сегмент пути — известные маршруты приложения без префикса репозитория (деплой с корня домена). */
const ROUTE_FIRST_SEGMENT = new Set([
  "products",
  "product",
  "login",
  "register",
  "checkout",
  "account",
  "terms",
  "privacy",
  "returns",
  "size-guide",
  "admin",
  "cart",
])

function inferBaseFromPathname(pathname: string): string {
  const trimmed = pathname.replace(/\/$/, "") || "/"
  const segments = trimmed.split("/").filter(Boolean)
  if (segments.length === 0) return ""

  if (ROUTE_FIRST_SEGMENT.has(segments[0])) return ""

  if (segments.length >= 2 && ROUTE_FIRST_SEGMENT.has(segments[1])) {
    return `/${segments[0]}`
  }

  if (segments.length === 1) return `/${segments[0]}`

  return ""
}

export function resolveSiteBasePath(): string {
  const fromEnv =
    typeof process.env.NEXT_PUBLIC_BASE_PATH === "string"
      ? process.env.NEXT_PUBLIC_BASE_PATH.replace(/\/$/, "").trim()
      : ""
  if (fromEnv) return fromEnv

  if (typeof document !== "undefined") {
    const attr = document.documentElement.getAttribute("data-base-path")?.trim()
    if (attr) return attr.replace(/\/$/, "")
    const inferred = inferBaseFromPathname(window.location.pathname)
    if (inferred) return inferred
  }

  return ""
}

export function publicAssetUrl(path: string | undefined | null): string {
  const base = resolveSiteBasePath()
  const prefix = (normalized: string) => (base ? `${base}${normalized}` : normalized)

  if (path == null || path === "") return prefix("/logo.png")
  const p = path.trim()
  if (/^https?:\/\//i.test(p) || p.startsWith("data:")) return p

  const normalized = normalizeLeadingSlash(p)
  return prefix(normalized)
}

/** Тот же префикс, что и для картинок: для `fetch('/api/...')` на GitHub Pages. */
export function siteFetchUrl(path: string): string {
  return publicAssetUrl(path)
}

/**
 * Нормализует путь к ассету: idempotent, если путь уже с префиксом `basePath`.
 */
export function ensurePublicAssetUrl(path: string | undefined | null): string {
  if (path == null || path === "") return publicAssetUrl("/logo.png")
  const p = path.trim()
  if (/^https?:\/\//i.test(p) || p.startsWith("data:")) return p
  const base = resolveSiteBasePath()
  const normalized = normalizeLeadingSlash(p)
  if (base && (normalized === base || normalized.startsWith(`${base}/`))) {
    return normalized
  }
  return publicAssetUrl(p)
}

/** Для ответа `/api/products` на клиенте — те же правила, что и при сборке из Firestore. */
export function withPublicAssetUrls<T extends { gallery: string[] }>(p: T): T {
  return { ...p, gallery: p.gallery.map(ensurePublicAssetUrl) }
}
