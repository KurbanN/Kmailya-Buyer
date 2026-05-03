"use client"

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import {
  getIdTokenResult,
  onAuthStateChanged,
  type User as FirebaseUser,
} from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"

import { getClientAuth, getClientDb } from "@/lib/firebase-client"
import type { UserRole } from "@/lib/types/domain"

type UserProfile = {
  role: UserRole
  name: string | null
}

type AuthContextValue = {
  user: FirebaseUser | null
  profile: UserProfile | null
  loading: boolean
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  loading: true,
})

function normalizeFirestoreRole(raw: unknown): UserRole | null {
  if (typeof raw !== "string") return null
  const r = raw.trim().toLowerCase()
  if (r === "admin") return "admin"
  if (r === "manager") return "manager"
  if (r === "customer") return "customer"
  if (r === "user") return "customer"
  return null
}

/** JWT claims + документ users — согласовано с lib/server/auth/roles.ts и policy. */
function resolveUserRole(
  claims: Record<string, unknown>,
  firestoreRole: unknown,
): UserRole {
  if (claims.role === "admin" || claims.admin === true) return "admin"
  if (claims.role === "manager" || claims.manager === true) return "manager"
  const dr = normalizeFirestoreRole(firestoreRole)
  if (dr === "admin" || dr === "manager") return dr
  return "customer"
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let stop: () => void = () => {}
    try {
      const auth = getClientAuth()
      const db = getClientDb()
      stop = onAuthStateChanged(auth, async (nextUser) => {
        setUser(nextUser)
        if (!nextUser) {
          setProfile(null)
          setLoading(false)
          return
        }
        try {
          const token = await getIdTokenResult(nextUser, true)
          const claims = token.claims as Record<string, unknown>
          const snap = await getDoc(doc(db, "users", nextUser.uid))
          const data = snap.data()
          const role = resolveUserRole(claims, data?.role)
          setProfile({
            role,
            name: typeof data?.name === "string" ? data.name : nextUser.displayName ?? null,
          })
        } catch {
          try {
            const token = await getIdTokenResult(nextUser, true)
            const claims = token.claims as Record<string, unknown>
            setProfile({
              role: resolveUserRole(claims, undefined),
              name: nextUser.displayName ?? null,
            })
          } catch {
            setProfile({
              role: "customer",
              name: nextUser.displayName ?? null,
            })
          }
        } finally {
          setLoading(false)
        }
      })
    } catch {
      setUser(null)
      setProfile(null)
      setLoading(false)
    }
    return () => stop()
  }, [])

  const value = useMemo(() => ({ user, profile, loading }), [user, profile, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
