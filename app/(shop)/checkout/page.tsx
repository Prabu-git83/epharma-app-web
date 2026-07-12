import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  getProfileWithRegion,
  getOrCreateCart,
  getCartLines,
  getAddresses,
} from '@/lib/supabase/queries'
import { NavHeader } from '@/components/NavHeader'
import { CheckoutForm } from '@/components/cart/CheckoutForm'

export default async function CheckoutPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profileRegion = await getProfileWithRegion(supabase, user.id)
  if (!profileRegion?.fullName) redirect('/register')
  const { fullName, role, region, regionCode } = profileRegion

  const cart = await getOrCreateCart(supabase, user.id)
  const [lines, addresses] = await Promise.all([
    getCartLines(supabase, cart.id, region.id),
    getAddresses(supabase, user.id),
  ])

  if (lines.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavHeader user={{ email: user.email!, fullName, role }} />
        <main className="mx-auto max-w-3xl px-4 py-8">
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-16 text-center">
            <p className="text-sm text-gray-400">Your cart is empty — nothing to check out.</p>
            <Link href="/catalog" className="mt-3 inline-block text-sm font-medium text-blue-600 hover:text-blue-700">
              Browse the catalog →
            </Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavHeader user={{ email: user.email!, fullName, role }} />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-semibold text-gray-900">Checkout</h1>
        <CheckoutForm
          lines={lines}
          regionCode={regionCode}
          taxRate={region.tax_rate}
          taxLabel={region.tax_label}
          initialAddresses={addresses}
        />
      </main>
    </div>
  )
}
