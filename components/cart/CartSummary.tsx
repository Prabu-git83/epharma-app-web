import Link from 'next/link'
import { computeCartTotals, cartHasUnresolvedRx, type CartLineInput } from '@/lib/utils/cart'
import { formatPrice } from '@/lib/utils/pricing'
import type { RegionCode } from '@/lib/constants/regions'

interface CartSummaryProps {
  lines: CartLineInput[]
  regionCode: RegionCode
  taxRate: number
  taxLabel: string
  /** Hide the "Proceed to checkout" CTA — used on the checkout page itself, which has its own action. */
  hideCheckoutLink?: boolean
}

export function CartSummary({ lines, regionCode, taxRate, taxLabel, hideCheckoutLink }: CartSummaryProps) {
  const totals = computeCartTotals(lines, regionCode, taxRate)
  const blocked = cartHasUnresolvedRx(lines)

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <dl className="flex flex-col gap-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-gray-500">Subtotal</dt>
          <dd className="text-gray-900">{formatPrice(totals.subtotal, regionCode)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-gray-500">{taxLabel}</dt>
          <dd className="text-gray-900">{formatPrice(totals.taxAmount, regionCode)}</dd>
        </div>
        <div className="flex justify-between border-t border-gray-100 pt-2 font-semibold text-gray-900">
          <dt>Total</dt>
          <dd>{formatPrice(totals.total, regionCode)}</dd>
        </div>
      </dl>

      {!hideCheckoutLink && (
        blocked ? (
          <div className="mt-4">
            <span className="inline-flex h-11 w-full cursor-not-allowed items-center justify-center rounded-lg bg-gray-200 px-4 text-sm font-medium text-gray-500">
              Proceed to checkout
            </span>
            <p className="mt-2 text-xs text-amber-800">
              Attach a verified prescription to every Rx item before checking out.
            </p>
          </div>
        ) : (
          <Link
            href="/checkout"
            className="mt-4 flex h-11 w-full items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700"
          >
            Proceed to checkout
          </Link>
        )
      )}
    </div>
  )
}
