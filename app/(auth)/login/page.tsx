'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { isValidEmail } from '@/lib/utils/validation'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!isValidEmail(email)) {
      setError('Please enter a valid email address')
      return
    }

    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    window.location.href = `/login/verify?email=${encodeURIComponent(email)}`
  }

  return (
    <>
      <h1 className="text-xl font-semibold text-gray-900 mb-1">Sign in</h1>
      <p className="text-sm text-gray-500 mb-6">
        Enter your email — we&apos;ll send you a one-time code.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Email address"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          autoFocus
          error={error}
        />
        <Button type="submit" size="full" loading={loading}>
          Send code
        </Button>
      </form>
    </>
  )
}
