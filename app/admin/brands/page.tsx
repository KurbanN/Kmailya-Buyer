import { EntityCrudPage } from "@/components/admin/entity-crud-page"
import { PopularBrandsSeed } from "@/components/admin/popular-brands-seed"

export default function AdminBrandsPage() {
  return (
    <div className="space-y-6">
      <PopularBrandsSeed />
      <EntityCrudPage title="Бренды" endpoint="brands" />
    </div>
  )
}
