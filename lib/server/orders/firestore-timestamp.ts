/** Firestore Timestamp | serialized string → ISO string */
export function toIsoString(ts: unknown): string | null {
  if (ts == null) return null
  if (typeof ts === "string") return ts
  if (typeof ts === "object" && ts !== null && "toDate" in ts) {
    const fn = (ts as { toDate?: () => Date }).toDate
    if (typeof fn === "function") {
      const d = fn.call(ts)
      return d instanceof Date && !Number.isNaN(d.getTime()) ? d.toISOString() : null
    }
  }
  return null
}
