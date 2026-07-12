import { formatPrice } from '@/lib/utils/pricing'
import type { RegionCode } from '@/lib/constants/regions'

export interface OrderConfirmationItem {
  name: string
  quantity: number
  unitPriceLocal: number
}

export interface OrderConfirmationAddress {
  line1: string
  line2: string | null
  city: string
  state: string | null
  zip: string | null
  countryCode: string
}

export interface OrderConfirmationInput {
  orderId: string
  items: OrderConfirmationItem[]
  address: OrderConfirmationAddress
  regionCode: RegionCode
  subtotal: number
  taxAmount: number
  total: number
}

/** Plain-HTML order confirmation email body. No templating library — MVP scope. */
export function buildOrderConfirmationHtml(input: OrderConfirmationInput): string {
  const { orderId, items, address, regionCode, subtotal, taxAmount, total } = input

  const rows = items
    .map(
      (item) => `
        <tr>
          <td style="padding:8px 0;">${item.name}</td>
          <td style="padding:8px 0; text-align:center;">${item.quantity}</td>
          <td style="padding:8px 0; text-align:right;">${formatPrice(item.unitPriceLocal, regionCode)}</td>
        </tr>`
    )
    .join('')

  const addressLines = [address.line1, address.line2, address.city, address.state, address.zip, address.countryCode]
    .filter(Boolean)
    .join(', ')

  return `
    <div style="font-family:sans-serif; max-width:480px; margin:0 auto;">
      <h2>Order confirmed</h2>
      <p>Your order <strong>#${orderId}</strong> has been placed and will be paid for by Cash on Delivery.</p>
      <table style="width:100%; border-collapse:collapse;">
        <thead>
          <tr>
            <th style="text-align:left; border-bottom:1px solid #e5e7eb; padding-bottom:8px;">Item</th>
            <th style="text-align:center; border-bottom:1px solid #e5e7eb; padding-bottom:8px;">Qty</th>
            <th style="text-align:right; border-bottom:1px solid #e5e7eb; padding-bottom:8px;">Price</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <table style="width:100%; margin-top:12px;">
        <tr><td>Subtotal</td><td style="text-align:right;">${formatPrice(subtotal, regionCode)}</td></tr>
        <tr><td>Tax</td><td style="text-align:right;">${formatPrice(taxAmount, regionCode)}</td></tr>
        <tr><td><strong>Total</strong></td><td style="text-align:right;"><strong>${formatPrice(total, regionCode)}</strong></td></tr>
      </table>
      <h3>Delivery address</h3>
      <p>${addressLines}</p>
    </div>
  `
}
