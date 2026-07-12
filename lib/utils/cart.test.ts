import { describe, it, expect } from 'vitest'
import { computeCartTotals, lineNeedsPrescription, cartHasUnresolvedRx, type CartLineInput } from './cart'

function line(overrides: Partial<CartLineInput> = {}): CartLineInput {
  return {
    quantity: 1,
    baseUsd: 10,
    priceLocal: null,
    requiresPrescription: false,
    prescriptionStatus: null,
    ...overrides,
  }
}

describe('computeCartTotals', () => {
  it('sums multi-item subtotal and applies tax', () => {
    const lines = [
      line({ baseUsd: 10, quantity: 2 }), // US: 10*2 = 20
      line({ baseUsd: 5, quantity: 1 }),  // US: 5*1 = 5
    ]
    const totals = computeCartTotals(lines, 'US', 0.1)
    expect(totals.subtotal).toBe(25)
    expect(totals.taxAmount).toBeCloseTo(2.5)
    expect(totals.total).toBeCloseTo(27.5)
  })

  it('uses price_local override when present', () => {
    const lines = [line({ baseUsd: 10, priceLocal: 500, quantity: 1 })]
    const totals = computeCartTotals(lines, 'IN', 0)
    expect(totals.subtotal).toBe(500)
  })

  it('returns zero totals for an empty cart', () => {
    const totals = computeCartTotals([], 'US', 0.1)
    expect(totals).toEqual({ subtotal: 0, taxAmount: 0, total: 0 })
  })
})

describe('lineNeedsPrescription', () => {
  it('is false for OTC items regardless of prescription status', () => {
    expect(lineNeedsPrescription(line({ requiresPrescription: false, prescriptionStatus: null }))).toBe(false)
    expect(lineNeedsPrescription(line({ requiresPrescription: false, prescriptionStatus: 'rejected' }))).toBe(false)
  })

  it('is true for Rx-required items with no prescription attached', () => {
    expect(lineNeedsPrescription(line({ requiresPrescription: true, prescriptionStatus: null }))).toBe(true)
  })

  it('is true for Rx-required items with a pending or rejected prescription', () => {
    expect(lineNeedsPrescription(line({ requiresPrescription: true, prescriptionStatus: 'pending' }))).toBe(true)
    expect(lineNeedsPrescription(line({ requiresPrescription: true, prescriptionStatus: 'under_review' }))).toBe(true)
    expect(lineNeedsPrescription(line({ requiresPrescription: true, prescriptionStatus: 'rejected' }))).toBe(true)
  })

  it('is false for Rx-required items with a verified prescription', () => {
    expect(lineNeedsPrescription(line({ requiresPrescription: true, prescriptionStatus: 'verified' }))).toBe(false)
  })
})

describe('cartHasUnresolvedRx', () => {
  it('is false when the cart is empty', () => {
    expect(cartHasUnresolvedRx([])).toBe(false)
  })

  it('is false when all lines are resolved', () => {
    const lines = [
      line({ requiresPrescription: false }),
      line({ requiresPrescription: true, prescriptionStatus: 'verified' }),
    ]
    expect(cartHasUnresolvedRx(lines)).toBe(false)
  })

  it('is true when any line is unresolved', () => {
    const lines = [
      line({ requiresPrescription: true, prescriptionStatus: 'verified' }),
      line({ requiresPrescription: true, prescriptionStatus: null }),
    ]
    expect(cartHasUnresolvedRx(lines)).toBe(true)
  })
})
