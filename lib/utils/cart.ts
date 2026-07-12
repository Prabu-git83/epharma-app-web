import { resolveLocalPrice } from '@/lib/utils/pricing'
import type { RegionCode } from '@/lib/constants/regions'

export type PrescriptionStatus = 'pending' | 'under_review' | 'verified' | 'rejected'

export interface CartLineInput {
  quantity: number
  baseUsd: number
  priceLocal: number | null
  requiresPrescription: boolean
  prescriptionStatus: PrescriptionStatus | null
}

export interface CartTotals {
  subtotal: number
  taxAmount: number
  total: number
}

/** subtotal = sum(resolveLocalPrice(...) * qty); tax = subtotal * taxRate; total = subtotal + tax. */
export function computeCartTotals(
  lines: CartLineInput[],
  regionCode: RegionCode,
  taxRate: number
): CartTotals {
  const subtotal = lines.reduce(
    (sum, line) => sum + resolveLocalPrice(line.baseUsd, regionCode, line.priceLocal) * line.quantity,
    0
  )
  const taxAmount = subtotal * taxRate
  return { subtotal, taxAmount, total: subtotal + taxAmount }
}

/** True if this line requires Rx and has no verified prescription attached. */
export function lineNeedsPrescription(line: CartLineInput): boolean {
  return line.requiresPrescription && line.prescriptionStatus !== 'verified'
}

/** True if any line in the cart is Rx-blocked. Used to gate "Place order". */
export function cartHasUnresolvedRx(lines: CartLineInput[]): boolean {
  return lines.some(lineNeedsPrescription)
}
