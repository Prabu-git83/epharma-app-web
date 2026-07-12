import { describe, it, expect } from 'vitest'
import { buildOrderConfirmationHtml, type OrderConfirmationInput } from './email'

function input(overrides: Partial<OrderConfirmationInput> = {}): OrderConfirmationInput {
  return {
    orderId: 'order-123',
    items: [{ name: 'Amoxicillin 500mg', quantity: 2, unitPriceLocal: 12.5 }],
    address: {
      line1: '221B Baker Street',
      line2: null,
      city: 'London',
      state: null,
      zip: 'NW1 6XE',
      countryCode: 'GB',
    },
    regionCode: 'GB',
    subtotal: 25,
    taxAmount: 0,
    total: 25,
    ...overrides,
  }
}

describe('buildOrderConfirmationHtml', () => {
  it('includes the order id', () => {
    expect(buildOrderConfirmationHtml(input())).toContain('order-123')
  })

  it('includes each item name and quantity', () => {
    const html = buildOrderConfirmationHtml(
      input({ items: [{ name: 'Paracetamol', quantity: 3, unitPriceLocal: 5 }] })
    )
    expect(html).toContain('Paracetamol')
    expect(html).toContain('3')
  })

  it('includes the formatted total', () => {
    const html = buildOrderConfirmationHtml(input({ total: 42, regionCode: 'US' }))
    expect(html).toContain('$42.00')
  })

  it('includes the address', () => {
    const html = buildOrderConfirmationHtml(input())
    expect(html).toContain('221B Baker Street')
    expect(html).toContain('London')
  })
})
