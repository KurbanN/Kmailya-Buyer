/**
 * Абсолютные URL (http(s), data) не трогаем.
 * Относительные пути вида `/file` при деплое с basePath (GitHub Pages) получают префикс из `NEXT_PUBLIC_BASE_PATH`.
 */
export function publicAssetUrl(path: string | undefined | null): string {
  if (path == null || path === "") return "/logo.png"
  const p = path.trim()
  if (/^https?:\/\//i.test(p) || p.startsWith("data:")) return p
  const base =
    typeof process.env.NEXT_PUBLIC_BASE_PATH === "string"
      ? process.env.NEXT_PUBLIC_BASE_PATH.replace(/\/$/, "")
      : ""
  const normalized = p.startsWith("/") ? p : `/${p}`
  return base ? `${base}${normalized}` : normalized
}

/** Для ответа `/api/products` на клиенте — те же правила, что и при сборке из Firestore. */
export function withPublicAssetUrls<T extends { gallery: string[] }>(p: T): T {
  return { ...p, gallery: p.gallery.map(publicAssetUrl) }
}
