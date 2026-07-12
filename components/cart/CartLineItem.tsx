'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/Badge'
import { PrescriptionPicker } from '@/components/cart/PrescriptionPicker'
import { displayPrice } from '@/lib/utils/pricing'
import { lineNeedsPrescription } from '@/lib/utils/cart'
import type { CartLineRow } from '@/lib/supabase/queries'
import type { RegionCode } from '@/lib/constants/regions'

interface CartLineItemProps {
  line: CartLineRow
  regionCode: RegionCode
  verifiedPrescriptions: { id: string; uploaded_at: string }[]
}

export function CartLineItem({ line, regionCode, verifiedPrescriptions }: CartLineItemProps) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const needsPrescription = lineNeedsPrescription({
    quantity: line.quantity,
    baseUsd: line.baseUsd,
    priceLocal: line.priceLocal,
    requiresPrescription: line.requiresPrescription,
    prescriptionStatus: line.prescriptionStatus,
  })

  async function updateQuantity(next: number) {
    if (next < 1) return
    setBusy(true)
    const supabase = createClient()
    await supabase.from('cart_items').update({ quantity: next }).eq('id', line.cartItemId)
    router.refresh()
    setBusy(false)
  }

  async function remove() {
    setBusy(true)
    const supabase = createClient()
    await supabase.from('cart_items').delete().eq('id', line.cartItemId)
    router.refresh()
    setBusy(false)
  }

  return (
    <li className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-gray-900">{line.drugName}</p>
            {line.requiresPrescription && <Badge variant="rx">Rx</Badge>}
            {!line.isAvailable && <Badge variant="danger">Unavailable in your region</Badge>}
          </div>
          {line.brand && <p className="text-xs text-gray-500">by {line.brand}</p>}
          <p className="mt-1 text-sm text-gray-700">
            {displayPrice(line.baseUsd, regionCode, line.priceLocal)} each
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-lg border border-gray-300">
            <button
              type="button"
              disabled={busy || line.quantity <= 1}
              onClick={() => updateQuantity(line.quantity - 1)}
              className="h-8 w-8 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
            >
              −
            </button>
            <span className="w-8 text-center text-sm">{line.quantity}</span>
            <button
              type="button"
              disabled={busy}
              onClick={() => updateQuantity(line.quantity + 1)}
              className="h-8 w-8 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
            >
              +
            </button>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={remove}
            className="text-xs text-gray-400 hover:text-red-600"
          >
            Remove
          </button>
        </div>
      </div>

      {needsPrescription && (
        <PrescriptionPicker
          cartItemId={line.cartItemId}
          currentPrescriptionId={line.prescriptionId}
          verifiedPrescriptions={verifiedPrescriptions}
        />
      )}
    </li>
  )
}
