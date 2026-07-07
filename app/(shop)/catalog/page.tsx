import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getProfileWithRegion } from '@/lib/supabase/queries'
import { NavHeader } from '@/components/NavHeader'
import { DrugCard, type CatalogDrug } from '@/components/catalog/DrugCard'
import { CatalogFilters } from '@/components/catalog/CatalogFilters'

interface CatalogPageProps {
  searchParams: Promise<{ q?: string; category?: string }>
}

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const { q = '', category = '' } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profileRegion = await getProfileWithRegion(supabase, user.id)
  if (!profileRegion?.fullName) redirect('/register')
  const { fullName, role, region, regionCode } = profileRegion

  const [{ data: categories }, { data: rules }, { data: drugs }] = await Promise.all([
    supabase.from('categories').select('id, name, slug').order('name'),
    supabase
      .from('drug_region_rules')
      .select('drug_id, requires_prescription, price_local')
      .eq('region_id', region.id)
      .eq('is_available', true),
    supabase
      .from('drugs')
      .select('id, name, brand, description, base_price_usd, category_id')
      .eq('is_active', true)
      .order('name'),
  ])

  const activeCategory = (categories ?? []).find(c => c.slug === category)
  const ruleByDrug = new Map((rules ?? []).map(r => [r.drug_id, r]))
  const search = q.trim().toLowerCase()

  const catalog: CatalogDrug[] = (drugs ?? [])
    .filter(d => ruleByDrug.has(d.id))
    .filter(d => !activeCategory || d.category_id === activeCategory.id)
    .filter(d =>
      !search ||
      d.name.toLowerCase().includes(search) ||
      (d.brand ?? '').toLowerCase().includes(search)
    )
    .map(d => {
      const rule = ruleByDrug.get(d.id)!
      return {
        id: d.id,
        name: d.name,
        brand: d.brand,
        description: d.description,
        base_price_usd: d.base_price_usd,
        requires_prescription: rule.requires_prescription,
        price_local: rule.price_local,
      }
    })

  return (
    <div className="min-h-screen bg-gray-50">
      <NavHeader user={{ email: user.email!, fullName, role }} />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Catalog</h1>
            <p className="text-sm text-gray-500">
              Prices shown in {region.currency_code} for {region.name}.
            </p>
          </div>
        </div>

        <CatalogFilters categories={categories ?? []} />

        {catalog.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-16 text-center">
            <p className="text-sm text-gray-400">
              {search || category
                ? 'No medicines match your search.'
                : 'No medicines available in your region yet.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {catalog.map(drug => (
              <DrugCard key={drug.id} drug={drug} regionCode={regionCode} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
