import { ProductsTable } from "@/components/admin/products-table"

export default function AdminProductsPage() {
  return (
    <section className="border border-neutral-200 bg-white p-6">
      <h1 className="text-xl font-semibold uppercase tracking-[0.08em]">Товары</h1>
      <p className="mt-2 text-sm text-neutral-600">
        Каталог, базовая и акционная цена, аудитория и статус публикации.
      </p>
      <div className="mt-5">
        <ProductsTable />
      </div>
    </section>
  )
}
