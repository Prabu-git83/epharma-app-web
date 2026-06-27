import { describe, it, expect } from 'vitest'
import { REGIONS, REGION_OPTIONS } from './regions'

const EXPECTED_CODES = ['US', 'IN', 'GB', 'AE', 'BH', 'SG', 'MY']

describe('REGIONS', () => {
  it('defines all seven target markets', () => {
    expect(Object.keys(REGIONS).sort()).toEqual([...EXPECTED_CODES].sort())
  })

  it('keeps each region key in sync with its code field', () => {
    for (const [key, region] of Object.entries(REGIONS)) {
      expect(region.code).toBe(key)
    }
  })

  it('has a non-empty currency and symbol for every region', () => {
    for (const region of Object.values(REGIONS)) {
      expect(region.currency).toBeTruthy()
      expect(region.symbol).toBeTruthy()
    }
  })

  it('uses tax rates within a sane 0–1 fraction', () => {
    for (const region of Object.values(REGIONS)) {
      expect(region.taxRate).toBeGreaterThanOrEqual(0)
      expect(region.taxRate).toBeLessThan(1)
    }
  })

  it('flags only Gulf regions as RTL', () => {
    const rtl = Object.values(REGIONS).filter(r => r.rtl).map(r => r.code).sort()
    expect(rtl).toEqual(['AE', 'BH'])
  })

  it('matches known tax labels per market', () => {
    expect(REGIONS.IN.taxLabel).toBe('GST')
    expect(REGIONS.GB.taxLabel).toBe('VAT')
    expect(REGIONS.MY.taxLabel).toBe('SST')
    expect(REGIONS.US.taxLabel).toBe('Sales Tax')
  })
})

describe('REGION_OPTIONS', () => {
  it('mirrors the REGIONS map', () => {
    expect(REGION_OPTIONS).toHaveLength(EXPECTED_CODES.length)
  })

  it('exposes code + currency for dropdown rendering', () => {
    for (const opt of REGION_OPTIONS) {
      expect(opt.code).toBeTruthy()
      expect(opt.currency).toBeTruthy()
      expect(opt.name).toBeTruthy()
    }
  })
})
