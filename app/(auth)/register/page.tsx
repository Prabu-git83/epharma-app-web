'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { REGION_OPTIONS } from '@/lib/constants/regions'
import { validateRegisterForm, hasErrors, type RegisterErrors } from '@/lib/utils/validation'

const regionOptions = REGION_OPTIONS.map(r => ({
  value: r.code,
  label: `${r.name} (${r.currency})`,
}))

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<RegisterErrors>({})
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    region_code: '',
  })

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
    setErrors(e => ({ ...e, [field]: '' }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validateRegisterForm(form)
    if (hasErrors(errs)) { setErrors(errs); return }

    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    // Get region id from code
    const { data: region } = await supabase
      .from('regions')
      .select('id, currency_code')
      .eq('code', form.region_code)
      .single()

    if (!region) {
      setErrors({ region_code: 'Could not resolve region. Please try again.' })
      setLoading(false)
      return
    }

    // upsert (not update) — the profile row is created by a DB trigger on signup,
    // but upsert guards against the trigger being slow/absent so we never silently
    // no-op and trap the user in a catalog↔register redirect loop.
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        full_name: form.full_name.trim(),
        phone: form.phone.trim() || null,
        region_id: region.id,
        preferred_currency: region.currency_code,
      })

    if (error) {
      setErrors({ full_name: error.message })
      setLoading(false)
      return
    }

    router.push('/catalog')
  }

  return (
    <>
      <h1 className="text-xl font-semibold text-gray-900 mb-1">Complete your profile</h1>
      <p className="text-sm text-gray-500 mb-6">
        Just a few details to get started.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Full name"
          type="text"
          placeholder="Jane Smith"
          value={form.full_name}
          onChange={e => set('full_name', e.target.value)}
          required
          autoFocus
          error={errors.full_name}
        />
        <Input
          label="Phone number (optional)"
          type="tel"
          placeholder="+1 555 000 0000"
          value={form.phone}
          onChange={e => set('phone', e.target.value)}
          hint="Used for order SMS updates"
          error={errors.phone}
        />
        <Select
          label="Your region"
          options={regionOptions}
          placeholder="Select your country / region"
          value={form.region_code}
          onChange={e => set('region_code', e.target.value)}
          error={errors.region_code}
        />
        <Button type="submit" size="full" loading={loading} className="mt-2">
          Get started
        </Button>
      </form>
    </>
  )
}
