'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { sanitizeOtp, isOtpComplete } from '@/lib/utils/validation'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

function VerifyForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const email = searchParams.get('email') ?? ''

  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState('')
  const [resent, setResent] = useState(false)

  useEffect(() => {
    if (!email) router.replace('/login')
  }, [email, router])

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!isOtpComplete(token)) {
      setError('Enter the 6-digit code')
      return
    }

    setLoading(true)

    const supabase = createClient()
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // Check if profile is complete
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', data.user!.id)
      .single()

    if (!profile?.full_name) {
      router.push('/register')
    } else {
      router.push('/catalog')
    }
  }

  async function handleResend() {
    setResending(true)
    setResent(false)
    const supabase = createClient()
    await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } })
    setResending(false)
    setResent(true)
  }

  return (
    <>
      <h1 className="text-xl font-semibold text-gray-900 mb-1">Check your email</h1>
      <p className="text-sm text-gray-500 mb-6">
        We sent a 6-digit code to <span className="font-medium text-gray-900">{email}</span>
      </p>

      <form onSubmit={handleVerify} className="flex flex-col gap-4">
        <Input
          label="One-time code"
          type="text"
          inputMode="numeric"
          pattern="[0-9]{6}"
          maxLength={6}
          placeholder="000000"
          value={token}
          onChange={e => setToken(sanitizeOtp(e.target.value))}
          required
          autoFocus
          error={error}
          className="text-center text-2xl tracking-[0.5em] font-mono"
        />
        <Button type="submit" size="full" loading={loading}>
          Verify code
        </Button>
      </form>

      <div className="mt-4 text-center">
        <button
          type="button"
          onClick={handleResend}
          disabled={resending}
          className="text-sm text-blue-600 hover:underline disabled:opacity-50"
        >
          {resending ? 'Resending…' : resent ? '✓ Code resent' : "Didn't get a code? Resend"}
        </button>
      </div>

      <div className="mt-3 text-center">
        <a href="/login" className="text-sm text-gray-500 hover:text-gray-700">
          ← Use a different email
        </a>
      </div>
    </>
  )
}

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyForm />
    </Suspense>
  )
}
