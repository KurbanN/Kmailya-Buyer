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

type AppRole = "USER" | "ADMIN"

type UserProfile = {
  role: AppRole
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
        let claimRole: AppRole = "USER"
        try {
          const token = await getIdTokenResult(nextUser, true)
          claimRole = token.claims.role === "ADMIN" || token.claims.admin ? "ADMIN" : "USER"
        } catch {}
        try {
          const snap = await getDoc(doc(db, "users", nextUser.uid))
          const data = snap.data()
          setProfile({
            role: data?.role === "ADMIN" || claimRole === "ADMIN" ? "ADMIN" : "USER",
            name: typeof data?.name === "string" ? data.name : nextUser.displayName ?? null,
          })
        } catch {
          setProfile({
            role: claimRole,
            name: nextUser.displayName ?? null,
          })
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
