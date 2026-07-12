import type { OrderStatus } from '@/components/orders/OrderStatusBadge'

/** Forward lifecycle order — cancellation is a separate side path, not part of this sequence. */
export const ORDER_STATUS_SEQUENCE: OrderStatus[] = ['placed', 'confirmed', 'dispensed', 'shipped', 'delivered']

export const TERMINAL_STATUSES: OrderStatus[] = ['delivered', 'cancelled']

/** The single valid next forward status, or null if there isn't one (terminal or unknown). */
export function getNextOrderStatus(current: OrderStatus): OrderStatus | null {
  const index = ORDER_STATUS_SEQUENCE.indexOf(current)
  if (index === -1 || index === ORDER_STATUS_SEQUENCE.length - 1) return null
  return ORDER_STATUS_SEQUENCE[index + 1]
}

/**
 * True if `next` is a legal transition from `current`: exactly the next forward
 * status, or 'cancelled' from any non-terminal state. No forward-skipping, no
 * transitions once terminal.
 */
export function isValidOrderStatusTransition(current: OrderStatus, next: OrderStatus): boolean {
  if (TERMINAL_STATUSES.includes(current)) return false
  if (next === current) return false
  if (next === 'cancelled') return true
  return next === getNextOrderStatus(current)
}
