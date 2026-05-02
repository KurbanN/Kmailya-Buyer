export function SectionPlaceholder({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <section className="border border-neutral-200 bg-white p-6">
      <h1 className="text-xl font-semibold uppercase tracking-[0.08em] text-neutral-950">
        {title}
      </h1>
      <p className="mt-3 max-w-2xl text-sm text-neutral-600">{description}</p>
    </section>
  )
}
