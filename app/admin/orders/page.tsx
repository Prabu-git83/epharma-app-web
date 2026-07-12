import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getProfileWithRegion } from '@/lib/supabase/queries'
import { NavHeader } from '@/components/NavHeader'
import { OrderStatusBadge } from '@/components/orders/OrderStatusBadge'
import { OrderStatusAdvance } from '@/components/admin/OrderStatusAdvance'
import { formatPrice } from '@/lib/utils/pricing'
import { isValidRegionCode } from '@/lib/utils/validation'

export default async function AdminOrdersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profileRegion = await getProfileWithRegion(supabase, user.id)
  if (!profileRegion?.fullName) redirect('/register')

  const { data: rows } = await supabase
    .from('orders')
    .select('id, user_id, status, total, region_id, placed_at')
    .not('status', 'in', '(delivered,cancelled)')
    .order('placed_at', { ascending: true })

  const userIds = [...new Set((rows ?? []).map(r => r.user_id))]
  const regionIds = [...new Set((rows ?? []).map(r => r.region_id).filter((id): id is string => !!id))]

  const [{ data: customers }, { data: regions }] = await Promise.all([
    userIds.length
      ? supabase.from('profiles').select('id, full_name').in('id', userIds)
      : Promise.resolve({ data: [] as { id: string; full_name: string | null }[] }),
    regionIds.length
      ? supabase.from('regions').select('id, code').in('id', regionIds)
      : Promise.resolve({ data: [] as { id: string; code: string }[] }),
  ])
  const nameById = new Map((customers ?? []).map(c => [c.id, c.full_name]))
  const codeByRegionId = new Map((regions ?? []).map(r => [r.id, r.code]))

  return (
    <div className="min-h-screen bg-gray-50">
      <NavHeader
        user={{ email: user.email!, fullName: profileRegion.fullName, role: profileRegion.role }}
      />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-2xl font-semibold text-gray-900">Order queue</h1>
        <p className="mb-6 text-sm text-gray-500">
          Oldest orders first. Advance status as each order moves through fulfillment.
        </p>

        {(rows ?? []).length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-16 text-center">
            <p className="text-sm text-gray-400">No orders in progress. 🎉</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-4">
            {(rows ?? []).map(order => {
              const code = order.region_id ? codeByRegionId.get(order.region_id) : null
              const regionCode = code && isValidRegionCode(code) ? code : 'US'
              return (
                <li
                  key={order.id}
                  className="grid gap-4 rounded-xl border border-gray-200 bg-white p-4 sm:grid-cols-[1fr_auto]"
                >
                  <div>
                    <OrderStatusBadge status={order.status} />
                    <p className="mt-2 text-sm font-medium text-gray-900">
                      {nameById.get(order.user_id) ?? 'Customer'}
                    </p>
                    <p className="text-xs text-gray-500">
                      Order #{order.id.slice(0, 8)} · Placed {new Date(order.placed_at).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">{formatPrice(order.total, regionCode)}</p>
                  </div>

                  <OrderStatusAdvance orderId={order.id} currentStatus={order.status} />
                </li>
              )
            })}
          </ul>
        )}
      </main>
    </div>
  )
}
