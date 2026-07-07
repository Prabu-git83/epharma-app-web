'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'

interface PrescriptionReviewActionsProps {
  prescriptionId: string
}

export function PrescriptionReviewActions({ prescriptionId }: PrescriptionReviewActionsProps) {
  const router = useRouter()
  const [rejecting, setRejecting] = useState(false)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function decide(status: 'verified' | 'rejected', notes: string | null) {
    setBusy(true)
    setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error: updateError } = await supabase
      .from('prescriptions')
      .update({
        status,
        notes,
        verified_by: user.id,
        verified_at: new Date().toISOString(),
      })
      .eq('id', prescriptionId)

    if (updateError) {
      setError(updateError.message)
      setBusy(false)
      return
    }

    router.refresh()
  }

  if (rejecting) {
    return (
      <div className="flex flex-col gap-2">
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Reason shown to the customer (e.g. image unreadable, signature missing)"
          rows={2}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none"
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
        <div className="flex gap-2">
          <Button
            variant="danger"
            size="sm"
            loading={busy}
            disabled={!note.trim()}
            onClick={() => decide('rejected', note.trim())}
          >
            Confirm reject
          </Button>
          <Button variant="ghost" size="sm" disabled={busy} onClick={() => setRejecting(false)}>
            Cancel
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <Button size="sm" loading={busy} onClick={() => decide('verified', null)}>
          Verify
        </Button>
        <Button variant="outline" size="sm" disabled={busy} onClick={() => setRejecting(true)}>
          Reject…
        </Button>
      </div>
    </div>
  )
}
