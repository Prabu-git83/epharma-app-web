import { Badge } from '@/components/ui/Badge'
import { PRESCRIPTION_STATUS_META, type PrescriptionStatus } from '@/lib/utils/prescriptions'

const VARIANT_BY_TONE = {
  amber: 'rx',
  blue: 'info',
  green: 'otc',
  red: 'danger',
} as const

interface StatusBadgeProps {
  status: PrescriptionStatus
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const meta = PRESCRIPTION_STATUS_META[status]
  return <Badge variant={VARIANT_BY_TONE[meta.tone]}>{meta.label}</Badge>
}
