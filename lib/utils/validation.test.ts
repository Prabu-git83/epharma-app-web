import { describe, it, expect } from 'vitest'
import {
  isValidEmail,
  sanitizeOtp,
  isOtpComplete,
  isValidRegionCode,
  validateRegisterForm,
  hasErrors,
} from './validation'

describe('isValidEmail', () => {
  it('accepts well-formed addresses', () => {
    expect(isValidEmail('jane@example.com')).toBe(true)
    expect(isValidEmail('a.b+tag@sub.domain.co.uk')).toBe(true)
  })

  it('trims surrounding whitespace before validating', () => {
    expect(isValidEmail('  jane@example.com  ')).toBe(true)
  })

  it('rejects malformed addresses', () => {
    expect(isValidEmail('')).toBe(false)
    expect(isValidEmail('jane')).toBe(false)
    expect(isValidEmail('jane@')).toBe(false)
    expect(isValidEmail('jane@example')).toBe(false)
    expect(isValidEmail('@example.com')).toBe(false)
    expect(isValidEmail('jane @example.com')).toBe(false)
    expect(isValidEmail('jane@@example.com')).toBe(false)
  })
})

describe('sanitizeOtp', () => {
  it('strips non-digits', () => {
    expect(sanitizeOtp('12a34b56')).toBe('123456')
    expect(sanitizeOtp('  1 2 3  ')).toBe('123')
  })

  it('caps length at 6', () => {
    expect(sanitizeOtp('123456789')).toBe('123456')
  })

  it('returns empty string for non-numeric input', () => {
    expect(sanitizeOtp('abcdef')).toBe('')
  })
})

describe('isOtpComplete', () => {
  it('is true only for exactly 6 digits', () => {
    expect(isOtpComplete('123456')).toBe(true)
  })

  it('is false for wrong length or non-digits', () => {
    expect(isOtpComplete('12345')).toBe(false)
    expect(isOtpComplete('1234567')).toBe(false)
    expect(isOtpComplete('12345a')).toBe(false)
    expect(isOtpComplete('')).toBe(false)
  })
})

describe('isValidRegionCode', () => {
  it('accepts every supported region', () => {
    for (const code of ['US', 'IN', 'GB', 'AE', 'BH', 'SG', 'MY']) {
      expect(isValidRegionCode(code)).toBe(true)
    }
  })

  it('rejects unknown codes', () => {
    expect(isValidRegionCode('FR')).toBe(false)
    expect(isValidRegionCode('')).toBe(false)
    expect(isValidRegionCode('us')).toBe(false) // case-sensitive
  })
})

describe('validateRegisterForm', () => {
  const valid = { full_name: 'Jane Smith', phone: '', region_code: 'US' }

  it('passes a valid form with no phone', () => {
    expect(validateRegisterForm(valid)).toEqual({})
  })

  it('passes a valid form with a well-formed phone', () => {
    expect(validateRegisterForm({ ...valid, phone: '+1 555-123-4567' })).toEqual({})
  })

  it('requires a full name', () => {
    expect(validateRegisterForm({ ...valid, full_name: '' }).full_name).toBeDefined()
    expect(validateRegisterForm({ ...valid, full_name: '   ' }).full_name).toBeDefined()
  })

  it('rejects a single-character name', () => {
    expect(validateRegisterForm({ ...valid, full_name: 'J' }).full_name).toBeDefined()
  })

  it('requires a region', () => {
    expect(validateRegisterForm({ ...valid, region_code: '' }).region_code).toBeDefined()
  })

  it('rejects an unsupported region code', () => {
    expect(validateRegisterForm({ ...valid, region_code: 'FR' }).region_code).toBeDefined()
  })

  it('rejects a malformed phone but allows empty', () => {
    expect(validateRegisterForm({ ...valid, phone: '123' }).phone).toBeDefined()
    expect(validateRegisterForm({ ...valid, phone: 'abc' }).phone).toBeDefined()
    expect(validateRegisterForm({ ...valid, phone: '' }).phone).toBeUndefined()
  })

  it('reports multiple errors at once', () => {
    const errs = validateRegisterForm({ full_name: '', phone: 'x', region_code: '' })
    expect(Object.keys(errs).sort()).toEqual(['full_name', 'phone', 'region_code'])
  })
})

describe('hasErrors', () => {
  it('detects presence/absence of errors', () => {
    expect(hasErrors({})).toBe(false)
    expect(hasErrors({ full_name: 'x' })).toBe(true)
  })
})
