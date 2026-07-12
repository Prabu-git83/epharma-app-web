'use client'
import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AddressPicker } from '@/components/cart/AddressPicker'
import { CartSummary } from '@/components/cart/CartSummary'
import { Button } from '@/components/ui/Button'
import { cartHasUnresolvedRx } from '@/lib/utils/cart'
import type { CartLineRow } from '@/lib/supabase/queries'
import type { RegionCode } from '@/lib/constants/regions'
import type { Database } from '@/lib/types/database'

type AddressRow = Database['public']['Tables']['addresses']['Row']

interface CheckoutFormProps {
  lines: CartLineRow[]
  regionCode: RegionCode
  taxRate: number
  taxLabel: string
  initialAddresses: AddressRow[]
}

export function CheckoutForm({ lines, regionCode, taxRate, taxLabel, initialAddresses }: CheckoutFormProps) {
  const router = useRouter()
  const [addresses, setAddresses] = useState(initialAddresses)
  const [selectedId, setSelectedId] = useState<string | null>(initialAddresses[0]?.id ?? null)
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const submittingRef = useRef(false)

  const blocked = cartHasUnresolvedRx(lines)

  function handleAddressCreated(address: AddressRow) {
    setAddresses(prev => [address, ...prev])
    setSelectedId(address.id)
  }

  async function placeOrder() {
    if (blocked || !selectedId || submittingRef.current) return
    submittingRef.current = true
    setBusy(true)
    setError('')

    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ addressId: selectedId, notes: notes.trim() || null }),
    })
    const body = await res.json().catch(() => ({}))

    if (!res.ok) {
      setError(body.error ?? 'Could not place order')
      setBusy(false)
      submittingRef.current = false
      return
    }

    router.push(`/orders/${body.data.orderId}`)
  }

  return (
    <div className="flex flex-col gap-6">
      {blocked && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Attach a verified prescription to every Rx item in your cart before checking out.
        </p>
      )}

      <div>
        <h2 className="mb-3 text-sm font-semibold text-gray-900">Delivery address</h2>
        <AddressPicker
          addresses={addresses}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onAddressCreated={handleAddressCreated}
        />
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-gray-900">Order notes (optional)</h2>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={2}
          placeholder="Delivery instructions, allergies, etc."
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none"
        />
      </div>

      <CartSummary lines={lines} regionCode={regionCode} taxRate={taxRate} taxLabel={taxLabel} hideCheckoutLink />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button
        size="lg"
        loading={busy}
        disabled={blocked || !selectedId}
        onClick={placeOrder}
      >
        Place order (Cash on Delivery)
      </Button>
    </div>
  )
}
