import { describe, it, expect } from 'vitest'
import {
  ALLOWED_PRESCRIPTION_TYPES,
  MAX_PRESCRIPTION_BYTES,
  PRESCRIPTION_STATUS_META,
  buildPrescriptionPath,
  isAllowedPrescriptionType,
  isWithinPrescriptionSizeLimit,
} from './prescriptions'

describe('isAllowedPrescriptionType', () => {
  it('accepts the supported image types', () => {
    for (const t of ALLOWED_PRESCRIPTION_TYPES) {
      expect(isAllowedPrescriptionType(t)).toBe(true)
    }
  })

  it('rejects other types', () => {
    expect(isAllowedPrescriptionType('application/pdf')).toBe(false)
    expect(isAllowedPrescriptionType('image/gif')).toBe(false)
    expect(isAllowedPrescriptionType('')).toBe(false)
  })
})

describe('isWithinPrescriptionSizeLimit', () => {
  it('accepts sizes up to the limit', () => {
    expect(isWithinPrescriptionSizeLimit(1)).toBe(true)
    expect(isWithinPrescriptionSizeLimit(MAX_PRESCRIPTION_BYTES)).toBe(true)
  })

  it('rejects zero, negative and oversized files', () => {
    expect(isWithinPrescriptionSizeLimit(0)).toBe(false)
    expect(isWithinPrescriptionSizeLimit(-5)).toBe(false)
    expect(isWithinPrescriptionSizeLimit(MAX_PRESCRIPTION_BYTES + 1)).toBe(false)
  })
})

describe('buildPrescriptionPath', () => {
  it('places the file inside the user folder with the right extension', () => {
    const at = new Date(1700000000000)
    expect(buildPrescriptionPath('user-1', 'image/png', at)).toBe('user-1/1700000000000.png')
    expect(buildPrescriptionPath('user-1', 'image/jpeg', at)).toBe('user-1/1700000000000.jpg')
  })

  it('falls back to jpg for unknown types', () => {
    const at = new Date(1700000000000)
    expect(buildPrescriptionPath('user-1', 'image/tiff', at)).toBe('user-1/1700000000000.jpg')
  })
})

describe('PRESCRIPTION_STATUS_META', () => {
  it('covers every status with a label and tone', () => {
    for (const status of ['pending', 'under_review', 'verified', 'rejected'] as const) {
      expect(PRESCRIPTION_STATUS_META[status].label).toBeTruthy()
      expect(PRESCRIPTION_STATUS_META[status].tone).toBeTruthy()
    }
  })
})
