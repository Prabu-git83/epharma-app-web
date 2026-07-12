import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getProfileWithRegion, getOrderDetail } from '@/lib/supabase/queries'
import { NavHeader } from '@/components/NavHeader'
import { OrderStatusBadge } from '@/components/orders/OrderStatusBadge'
import { formatPrice } from '@/lib/utils/pricing'

interface OrderDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profileRegion = await getProfileWithRegion(supabase, user.id)
  if (!profileRegion?.fullName) redirect('/register')
  const { fullName, role } = profileRegion

  const detail = await getOrderDetail(supabase, id)
  if (!detail) notFound()
  const { order, regionCode, address, items } = detail

  return (
    <div className="min-h-screen bg-gray-50">
      <NavHeader user={{ email: user.email!, fullName, role }} />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <Link href="/orders" className="text-sm text-gray-500 hover:text-gray-800">
          ← Back to orders
        </Link>

        <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Order #{order.id.slice(0, 8)}</h1>
              <p className="text-xs text-gray-500">
                Placed {new Date(order.placed_at).toLocaleString()}
              </p>
            </div>
            <OrderStatusBadge status={order.status} />
          </div>

          <ul className="mt-6 flex flex-col gap-3">
            {items.map(item => (
              <li key={item.drugId} className="flex items-center justify-between rounded-lg border border-gray-100 p-3 text-sm">
                <div>
                  <p className="font-medium text-gray-900">{item.drugName}</p>
                  {item.brand && <p className="text-xs text-gray-500">by {item.brand}</p>}
                  <p className="text-xs text-gray-500">Qty {item.quantity}</p>
                </div>
                <p className="text-gray-900">
                  {formatPrice(item.unitPriceLocal * item.quantity, regionCode)}
                </p>
              </li>
            ))}
          </ul>

          <dl className="mt-6 flex flex-col gap-2 border-t border-gray-100 pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Subtotal</dt>
              <dd className="text-gray-900">{formatPrice(order.subtotal, regionCode)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Tax</dt>
              <dd className="text-gray-900">{formatPrice(order.tax_amount, regionCode)}</dd>
            </div>
            <div className="flex justify-between font-semibold text-gray-900">
              <dt>Total</dt>
              <dd>{formatPrice(order.total, regionCode)}</dd>
            </div>
          </dl>

          <div className="mt-6 border-t border-gray-100 pt-4">
            <h2 className="text-sm font-semibold text-gray-900">Delivery address</h2>
            {address ? (
              <p className="mt-1 text-sm text-gray-600">
                {[address.line1, address.line2, address.city, address.state, address.zip, address.country_code]
                  .filter(Boolean)
                  .join(', ')}
              </p>
            ) : (
              <p className="mt-1 text-sm text-gray-400">No address on file</p>
            )}
          </div>

          <div className="mt-6 border-t border-gray-100 pt-4">
            <h2 className="text-sm font-semibold text-gray-900">Payment</h2>
            <p className="mt-1 text-sm text-gray-600">Cash on Delivery</p>
          </div>

          {order.notes && (
            <div className="mt-6 border-t border-gray-100 pt-4">
              <h2 className="text-sm font-semibold text-gray-900">Notes</h2>
              <p className="mt-1 text-sm text-gray-600">{order.notes}</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
