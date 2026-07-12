import Link from 'next/link'
import { OrderStatusBadge } from '@/components/orders/OrderStatusBadge'
import { formatPrice } from '@/lib/utils/pricing'
import type { OrderSummaryRow } from '@/lib/supabase/queries'

interface OrderListItemProps {
  order: OrderSummaryRow
}

export function OrderListItem({ order }: OrderListItemProps) {
  return (
    <li>
      <Link
        href={`/orders/${order.id}`}
        className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white p-4 hover:border-gray-300"
      >
        <div>
          <OrderStatusBadge status={order.status} />
          <p className="mt-1 text-xs text-gray-500">
            {order.itemCount} item{order.itemCount === 1 ? '' : 's'} · {new Date(order.placedAt).toLocaleDateString()}
          </p>
        </div>
        <p className="font-semibold text-gray-900">{formatPrice(order.total, order.regionCode)}</p>
      </Link>
    </li>
  )
}
