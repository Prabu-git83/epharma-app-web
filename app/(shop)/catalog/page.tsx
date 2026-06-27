import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { NavHeader } from '@/components/NavHeader'

export default async function CatalogPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  if (!profile?.full_name) redirect('/register')

  return (
    <div className="min-h-screen bg-gray-50">
      <NavHeader user={{ email: user.email!, fullName: profile.full_name, role: profile.role }} />
      <main className="max-w-6xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">
          Welcome back, {profile.full_name.split(' ')[0]} 👋
        </h1>
        <p className="text-gray-500 mb-8">Browse our drug catalog below.</p>

        {/* Stage 2 will populate this */}
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-16 text-center">
          <p className="text-gray-400 text-sm">Drug catalog coming in Stage 2</p>
        </div>
      </main>
    </div>
  )
}
