import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getProfileWithRegion, getOrders } from '@/lib/supabase/queries'
import { NavHeader } from '@/components/NavHeader'
import { OrderListItem } from '@/components/orders/OrderListItem'

export default async function OrdersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profileRegion = await getProfileWithRegion(supabase, user.id)
  if (!profileRegion?.fullName) redirect('/register')
  const { fullName, role } = profileRegion

  const orders = await getOrders(supabase, user.id)

  return (
    <div className="min-h-screen bg-gray-50">
      <NavHeader user={{ email: user.email!, fullName, role }} />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-semibold text-gray-900">Orders</h1>

        {orders.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-16 text-center">
            <p className="text-sm text-gray-400">No orders yet.</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {orders.map(order => (
              <OrderListItem key={order.id} order={order} />
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}
