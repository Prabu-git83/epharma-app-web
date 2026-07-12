import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  getProfileWithRegion,
  getOrCreateCart,
  getCartLines,
  getVerifiedPrescriptions,
} from '@/lib/supabase/queries'
import { NavHeader } from '@/components/NavHeader'
import { CartLineItem } from '@/components/cart/CartLineItem'
import { CartSummary } from '@/components/cart/CartSummary'

export default async function CartPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profileRegion = await getProfileWithRegion(supabase, user.id)
  if (!profileRegion?.fullName) redirect('/register')
  const { fullName, role, region, regionCode } = profileRegion

  const cart = await getOrCreateCart(supabase, user.id)
  const [lines, verifiedPrescriptions] = await Promise.all([
    getCartLines(supabase, cart.id, region.id),
    getVerifiedPrescriptions(supabase, user.id),
  ])

  return (
    <div className="min-h-screen bg-gray-50">
      <NavHeader user={{ email: user.email!, fullName, role }} />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-2xl font-semibold text-gray-900">Cart</h1>

        {lines.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-gray-300 bg-white p-16 text-center">
            <p className="text-sm text-gray-400">Your cart is empty.</p>
            <Link href="/catalog" className="mt-3 inline-block text-sm font-medium text-blue-600 hover:text-blue-700">
              Browse the catalog →
            </Link>
          </div>
        ) : (
          <div className="mt-6 flex flex-col gap-6">
            <ul className="flex flex-col gap-3">
              {lines.map(line => (
                <CartLineItem
                  key={line.cartItemId}
                  line={line}
                  regionCode={regionCode}
                  verifiedPrescriptions={verifiedPrescriptions}
                />
              ))}
            </ul>
            <CartSummary
              lines={lines}
              regionCode={regionCode}
              taxRate={region.tax_rate}
              taxLabel={region.tax_label}
            />
          </div>
        )}
      </main>
    </div>
  )
}
