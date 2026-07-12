import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getProfileWithRegion } from '@/lib/supabase/queries'
import { NavHeader } from '@/components/NavHeader'
import { Badge } from '@/components/ui/Badge'
import { AddToCartButton } from '@/components/cart/AddToCartButton'
import { displayPrice } from '@/lib/utils/pricing'

interface DrugPageProps {
  params: Promise<{ id: string }>
}

export default async function DrugPage({ params }: DrugPageProps) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profileRegion = await getProfileWithRegion(supabase, user.id)
  if (!profileRegion?.fullName) redirect('/register')
  const { fullName, role, region, regionCode } = profileRegion

  const { data: drug } = await supabase
    .from('drugs')
    .select('*')
    .eq('id', id)
    .eq('is_active', true)
    .single()
  if (!drug) notFound()

  const [{ data: rule }, { data: drugCategory }] = await Promise.all([
    supabase
      .from('drug_region_rules')
      .select('*')
      .eq('drug_id', drug.id)
      .eq('region_id', region.id)
      .single(),
    drug.category_id
      ? supabase.from('categories').select('name, slug').eq('id', drug.category_id).single()
      : Promise.resolve({ data: null }),
  ])

  const available = !!rule?.is_available

  return (
    <div className="min-h-screen bg-gray-50">
      <NavHeader user={{ email: user.email!, fullName, role }} />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <Link href="/catalog" className="text-sm text-gray-500 hover:text-gray-800">
          ← Back to catalog
        </Link>

        <div className="mt-4 grid gap-8 rounded-2xl border border-gray-200 bg-white p-6 sm:grid-cols-[240px_1fr] sm:p-8">
          <div className="flex h-48 items-center justify-center rounded-xl bg-blue-50 text-6xl sm:h-full">
            💊
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              {rule?.requires_prescription
                ? <Badge variant="rx">Prescription required</Badge>
                : <Badge variant="otc">Over the counter</Badge>}
              {drugCategory && <Badge>{drugCategory.name}</Badge>}
              {!available && <Badge variant="danger">Unavailable in {region.name}</Badge>}
            </div>

            <h1 className="mt-3 text-2xl font-semibold text-gray-900">{drug.name}</h1>
            {drug.brand && <p className="text-sm text-gray-500">by {drug.brand}</p>}

            <p className="mt-4 text-3xl font-semibold text-gray-900">
              {displayPrice(drug.base_price_usd, regionCode, rule?.price_local ?? null)}
              <span className="ml-2 align-middle text-xs font-normal text-gray-400">
                {region.tax_label} calculated at checkout
              </span>
            </p>

            {drug.description && (
              <p className="mt-4 text-sm leading-6 text-gray-600">{drug.description}</p>
            )}

            {rule?.regulatory_label && (
              <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                {rule.regulatory_label}
              </p>
            )}

            <div className="mt-6">
              <AddToCartButton drugId={drug.id} available={available} />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
