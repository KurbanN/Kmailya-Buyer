"use client"

import { useEffect } from "react"

const STORAGE_KEY = "__kamilya_chunk_reload"

function looksLikeChunkFailure(message: string): boolean {
  return (
    message.includes("Loading chunk") ||
    message.includes("ChunkLoadError") ||
    message.includes("Failed to fetch dynamically imported module")
  )
}

/**
 * После деплоя или при сбое HMR браузер может держать старые URL чанков — один мягкий reload обычно лечит.
 * В dev при таймауте layout.js тоже помогает не ловить «зависший» таб.
 */
export function ChunkLoadRecovery() {
  useEffect(() => {
    const tryReload = () => {
      if (typeof window === "undefined") return
      if (sessionStorage.getItem(STORAGE_KEY)) return
      sessionStorage.setItem(STORAGE_KEY, "1")
      window.location.reload()
    }

    const onError = (event: ErrorEvent) => {
      const msg = event.message || ""
      if (looksLikeChunkFailure(msg)) tryReload()
    }

    const onRejection = (event: PromiseRejectionEvent) => {
      const r = event.reason
      const msg =
        r instanceof Error ? r.message : typeof r === "string" ? r : String(r ?? "")
      if (looksLikeChunkFailure(msg)) tryReload()
    }

    window.addEventListener("error", onError)
    window.addEventListener("unhandledrejection", onRejection)
    return () => {
      window.removeEventListener("error", onError)
      window.removeEventListener("unhandledrejection", onRejection)
    }
  }, [])

  return null
}
