import type { Database } from '@/lib/types/database'

export type PrescriptionStatus =
  Database['public']['Tables']['prescriptions']['Row']['status']

export const MAX_PRESCRIPTION_BYTES = 10 * 1024 * 1024 // mirrors the bucket limit

const EXTENSION_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

export const ALLOWED_PRESCRIPTION_TYPES = Object.keys(EXTENSION_BY_MIME)

export function isAllowedPrescriptionType(mimeType: string): boolean {
  return mimeType in EXTENSION_BY_MIME
}

export function isWithinPrescriptionSizeLimit(bytes: number): boolean {
  return bytes > 0 && bytes <= MAX_PRESCRIPTION_BYTES
}

/** Storage object path: <user_id>/<timestamp>.<ext> — the folder is what RLS checks. */
export function buildPrescriptionPath(
  userId: string,
  mimeType: string,
  now: Date = new Date()
): string {
  const ext = EXTENSION_BY_MIME[mimeType] ?? 'jpg'
  return `${userId}/${now.getTime()}.${ext}`
}

export interface PrescriptionStatusMeta {
  label: string
  tone: 'amber' | 'blue' | 'green' | 'red'
}

export const PRESCRIPTION_STATUS_META: Record<PrescriptionStatus, PrescriptionStatusMeta> = {
  pending: { label: 'Pending review', tone: 'amber' },
  under_review: { label: 'Under review', tone: 'blue' },
  verified: { label: 'Verified', tone: 'green' },
  rejected: { label: 'Rejected', tone: 'red' },
}
