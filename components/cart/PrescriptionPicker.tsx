'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Select } from '@/components/ui/Select'

interface PrescriptionPickerProps {
  cartItemId: string
  currentPrescriptionId: string | null
  verifiedPrescriptions: { id: string; uploaded_at: string }[]
}

export function PrescriptionPicker({
  cartItemId,
  currentPrescriptionId,
  verifiedPrescriptions,
}: PrescriptionPickerProps) {
  const router = useRouter()

  if (verifiedPrescriptions.length === 0) {
    return (
      <p className="mt-2 text-xs text-amber-800">
        No verified prescriptions yet —{' '}
        <Link href="/prescriptions/upload" className="font-medium underline">
          upload one first
        </Link>
        .
      </p>
    )
  }

  async function handleChange(prescriptionId: string) {
    const supabase = createClient()
    await supabase
      .from('cart_items')
      .update({ prescription_id: prescriptionId || null })
      .eq('id', cartItemId)
    router.refresh()
  }

  return (
    <div className="mt-2 max-w-xs">
      <Select
        aria-label="Attach a verified prescription"
        value={currentPrescriptionId ?? ''}
        onChange={e => handleChange(e.target.value)}
        placeholder="Attach a verified prescription…"
        options={verifiedPrescriptions.map(p => ({
          value: p.id,
          label: `Uploaded ${new Date(p.uploaded_at).toLocaleDateString()}`,
        }))}
      />
    </div>
  )
}
