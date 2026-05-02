import type { Metadata } from "next"

import { AdminShell } from "@/components/admin/admin-shell"

export const metadata: Metadata = {
  title: "Админка — Kamilya",
  description: "Панель управления магазином Kamilya",
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AdminShell>{children}</AdminShell>
}
