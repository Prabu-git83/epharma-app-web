'use client'
import { useState, type FormEvent } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { REGION_OPTIONS } from '@/lib/constants/regions'
import type { Database } from '@/lib/types/database'

type AddressRow = Database['public']['Tables']['addresses']['Row']

interface AddressFormProps {
  onCreated: (address: AddressRow) => void
  onCancel: () => void
}

export function AddressForm({ onCreated, onCancel }: AddressFormProps) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    label: 'Home',
    line1: '',
    line2: '',
    city: '',
    state: '',
    zip: '',
    country_code: '',
    is_default: false,
  })

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form.line1.trim() || !form.city.trim() || !form.country_code) {
      setError('Address line, city, and country are required')
      return
    }
    setBusy(true)
    setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error: insertError } = await supabase
      .from('addresses')
      .insert({
        user_id: user.id,
        label: form.label.trim() || 'Home',
        line1: form.line1.trim(),
        line2: form.line2.trim() || null,
        city: form.city.trim(),
        state: form.state.trim() || null,
        zip: form.zip.trim() || null,
        country_code: form.country_code,
        is_default: form.is_default,
      })
      .select('*')
      .single()

    setBusy(false)
    if (insertError || !data) {
      setError(insertError?.message ?? 'Could not save address')
      return
    }
    onCreated(data)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4">
      <Input label="Label" value={form.label} onChange={e => set('label', e.target.value)} placeholder="Home" />
      <Input label="Address line 1" value={form.line1} onChange={e => set('line1', e.target.value)} required />
      <Input label="Address line 2 (optional)" value={form.line2} onChange={e => set('line2', e.target.value)} />
      <div className="grid grid-cols-2 gap-3">
        <Input label="City" value={form.city} onChange={e => set('city', e.target.value)} required />
        <Input label="State / province" value={form.state} onChange={e => set('state', e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="ZIP / postal code" value={form.zip} onChange={e => set('zip', e.target.value)} />
        <Select
          label="Country"
          value={form.country_code}
          onChange={e => set('country_code', e.target.value)}
          placeholder="Select country"
          options={REGION_OPTIONS.map(r => ({ value: r.code, label: r.name }))}
        />
      </div>
      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={form.is_default}
          onChange={e => set('is_default', e.target.checked)}
        />
        Set as default address
      </label>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" size="sm" loading={busy}>Save address</Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={busy}>Cancel</Button>
      </div>
    </form>
  )
}
