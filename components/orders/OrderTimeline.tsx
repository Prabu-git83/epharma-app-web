import { VARIANT_BY_STATUS, LABEL_BY_STATUS } from '@/components/orders/OrderStatusBadge'
import { Badge } from '@/components/ui/Badge'
import type { OrderEventRow } from '@/lib/supabase/queries'

interface OrderTimelineProps {
  events: OrderEventRow[]
  placedAt: string
}

export function OrderTimeline({ events, placedAt }: OrderTimelineProps) {
  const rows: { key: string; status: OrderEventRow['status']; note: string | null; createdAt: string }[] =
    events.length > 0
      ? events.map(e => ({ key: e.id, status: e.status, note: e.note, createdAt: e.createdAt }))
      : [{ key: 'placed-fallback', status: 'placed', note: null, createdAt: placedAt }]

  return (
    <ul className="flex flex-col gap-3">
      {rows.map(row => (
        <li key={row.key} className="flex items-start justify-between gap-3 text-sm">
          <div>
            <Badge variant={VARIANT_BY_STATUS[row.status]}>{LABEL_BY_STATUS[row.status]}</Badge>
            {row.note && <p className="mt-1 text-xs text-gray-600">{row.note}</p>}
          </div>
          <p className="whitespace-nowrap text-xs text-gray-500">
            {new Date(row.createdAt).toLocaleString()}
          </p>
        </li>
      ))}
    </ul>
  )
}
