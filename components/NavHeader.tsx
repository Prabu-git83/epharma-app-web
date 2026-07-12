'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface NavHeaderProps {
  user: { email: string; fullName: string; role: string }
}

export function NavHeader({ user }: NavHeaderProps) {
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)

  async function handleLogout() {
    setLoggingOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/catalog" className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-md bg-blue-600 flex items-center justify-center">
            <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
          <span className="font-semibold text-gray-900">ePharma</span>
        </Link>

        <nav className="flex items-center gap-6 text-sm">
          <Link href="/catalog"      className="text-gray-600 hover:text-gray-900">Catalog</Link>
          <Link href="/prescriptions" className="text-gray-600 hover:text-gray-900">Prescriptions</Link>
          <Link href="/cart"         className="text-gray-600 hover:text-gray-900">Cart</Link>
          <Link href="/orders"       className="text-gray-600 hover:text-gray-900">Orders</Link>
          {['pharmacist', 'admin'].includes(user.role) && (
            <>
              <Link href="/admin/prescriptions" className="text-blue-600 hover:text-blue-700 font-medium">Rx Queue</Link>
              <Link href="/admin/orders" className="text-blue-600 hover:text-blue-700 font-medium">Order Queue</Link>
            </>
          )}
        </nav>

        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600 hidden sm:block">{user.email}</span>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="text-sm text-gray-500 hover:text-gray-800 disabled:opacity-50"
          >
            {loggingOut ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      </div>
    </header>
  )
}
