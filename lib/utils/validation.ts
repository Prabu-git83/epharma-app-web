import { REGIONS, type RegionCode } from '@/lib/constants/regions'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim())
}

/** Strip everything except digits and cap at 6 chars — for OTP inputs. */
export function sanitizeOtp(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, 6)
}

export function isOtpComplete(token: string): boolean {
  return /^\d{6}$/.test(token)
}

export function isValidRegionCode(code: string): code is RegionCode {
  return code in REGIONS
}

export interface RegisterInput {
  full_name: string
  phone: string
  region_code: string
}

export type RegisterErrors = Partial<Record<keyof RegisterInput, string>>

/** Pure, synchronous validation for the profile-completion form. */
export function validateRegisterForm(input: RegisterInput): RegisterErrors {
  const errors: RegisterErrors = {}

  if (!input.full_name.trim()) {
    errors.full_name = 'Full name is required'
  } else if (input.full_name.trim().length < 2) {
    errors.full_name = 'Please enter your full name'
  }

  if (!input.region_code) {
    errors.region_code = 'Please select your region'
  } else if (!isValidRegionCode(input.region_code)) {
    errors.region_code = 'Invalid region selected'
  }

  if (input.phone.trim() && !/^[+\d][\d\s-]{6,}$/.test(input.phone.trim())) {
    errors.phone = 'Enter a valid phone number'
  }

  return errors
}

export function hasErrors(errors: RegisterErrors): boolean {
  return Object.keys(errors).length > 0
}
