import { Badge } from '@/components/ui/Badge'
import type { Database } from '@/lib/types/database'

export type OrderStatus = Database['public']['Tables']['orders']['Row']['status']

export const VARIANT_BY_STATUS: Record<OrderStatus, 'info' | 'rx' | 'otc' | 'danger'> = {
  placed: 'info',
  confirmed: 'info',
  dispensed: 'rx',
  shipped: 'rx',
  delivered: 'otc',
  cancelled: 'danger',
}

export const LABEL_BY_STATUS: Record<OrderStatus, string> = {
  placed: 'Placed',
  confirmed: 'Confirmed',
  dispensed: 'Dispensed',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

interface OrderStatusBadgeProps {
  status: OrderStatus
}

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  return <Badge variant={VARIANT_BY_STATUS[status]}>{LABEL_BY_STATUS[status]}</Badge>
}
