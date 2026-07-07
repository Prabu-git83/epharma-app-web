import { describe, it, expect } from 'vitest'
import { APPROX_USD_RATES, resolveLocalPrice, formatPrice, displayPrice } from './pricing'
import { REGIONS, type RegionCode } from '@/lib/constants/regions'

describe('APPROX_USD_RATES', () => {
  it('covers every region', () => {
    expect(Object.keys(APPROX_USD_RATES).sort()).toEqual(Object.keys(REGIONS).sort())
  })

  it('has positive rates', () => {
    for (const rate of Object.values(APPROX_USD_RATES)) {
      expect(rate).toBeGreaterThan(0)
    }
  })
})

describe('resolveLocalPrice', () => {
  it('prefers the price_local override', () => {
    expect(resolveLocalPrice(3.49, 'IN', 35)).toBe(35)
  })

  it('converts base USD when no override exists', () => {
    expect(resolveLocalPrice(10, 'IN', null)).toBe(880)
    expect(resolveLocalPrice(10, 'US', null)).toBe(10)
  })

  it('ignores negative overrides', () => {
    expect(resolveLocalPrice(10, 'US', -1)).toBe(10)
  })
})

describe('formatPrice', () => {
  it('formats USD for the US region', () => {
    expect(formatPrice(3.49, 'US')).toBe('$3.49')
  })

  it('formats INR for India', () => {
    expect(formatPrice(35, 'IN')).toContain('35')
    expect(formatPrice(35, 'IN')).toContain('₹')
  })

  it('produces non-empty output for every region', () => {
    for (const code of Object.keys(REGIONS) as RegionCode[]) {
      expect(formatPrice(9.99, code).length).toBeGreaterThan(0)
    }
  })
})

describe('displayPrice', () => {
  it('resolves then formats', () => {
    expect(displayPrice(3.49, 'US', null)).toBe('$3.49')
    expect(displayPrice(3.49, 'IN', 35)).toContain('35')
  })
})
