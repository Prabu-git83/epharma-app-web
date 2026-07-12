'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { getNextOrderStatus } from '@/lib/utils/orders'
import { LABEL_BY_STATUS, type OrderStatus } from '@/components/orders/OrderStatusBadge'

interface OrderStatusAdvanceProps {
  orderId: string
  currentStatus: OrderStatus
}

export function OrderStatusAdvance({ orderId, currentStatus }: OrderStatusAdvanceProps) {
  const router = useRouter()
  const [cancelling, setCancelling] = useState(false)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const nextStatus = getNextOrderStatus(currentStatus)

  async function advance(status: OrderStatus, noteValue: string | null) {
    setBusy(true)
    setError('')

    const res = await fetch(`/api/orders/${orderId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, note: noteValue }),
    })
    const body = await res.json().catch(() => ({}))

    setBusy(false)
    if (!res.ok) {
      setError(body.error ?? 'Could not update order')
      return
    }
    router.refresh()
  }

  if (!nextStatus) return null

  if (cancelling) {
    return (
      <div className="flex flex-col gap-2">
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Reason shown to the customer"
          rows={2}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none"
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
        <div className="flex gap-2">
          <Button
            variant="danger"
            size="sm"
            loading={busy}
            disabled={!note.trim()}
            onClick={() => advance('cancelled', note.trim())}
          >
            Confirm cancel
          </Button>
          <Button variant="ghost" size="sm" disabled={busy} onClick={() => setCancelling(false)}>
            Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <Button size="sm" loading={busy} onClick={() => advance(nextStatus, null)}>
          Mark as {LABEL_BY_STATUS[nextStatus]}
        </Button>
        <Button variant="outline" size="sm" disabled={busy} onClick={() => setCancelling(true)}>
          Cancel order…
        </Button>
      </div>
    </div>
  )
}
