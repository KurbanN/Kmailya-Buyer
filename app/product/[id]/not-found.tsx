import Link from "next/link"

export default function ProductNotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4">
      <p className="text-lg text-neutral-700">Товар не найден</p>
      <Link href="/" className="text-sm uppercase tracking-widest text-neutral-900 underline">
        На главную
      </Link>
    </div>
  )
}
