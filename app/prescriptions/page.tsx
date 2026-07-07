import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getProfileWithRegion } from '@/lib/supabase/queries'
import { NavHeader } from '@/components/NavHeader'
import { StatusBadge } from '@/components/prescriptions/StatusBadge'

export default async function PrescriptionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profileRegion = await getProfileWithRegion(supabase, user.id)
  if (!profileRegion?.fullName) redirect('/register')

  const { data: rows } = await supabase
    .from('prescriptions')
    .select('id, status, notes, uploaded_at, image_url')
    .eq('user_id', user.id)
    .order('uploaded_at', { ascending: false })

  const paths = (rows ?? []).map(r => r.image_url)
  const { data: signed } = paths.length
    ? await supabase.storage.from('prescriptions').createSignedUrls(paths, 3600)
    : { data: [] }
  const urlByPath = new Map<string, string>(
    (signed ?? []).flatMap(s => (s.path && s.signedUrl ? [[s.path, s.signedUrl] as const] : []))
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <NavHeader
        user={{ email: user.email!, fullName: profileRegion.fullName, role: profileRegion.role }}
      />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Prescriptions</h1>
            <p className="text-sm text-gray-500">
              Verified prescriptions unlock Rx medicines at checkout.
            </p>
          </div>
          <Link
            href="/prescriptions/upload"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Upload
          </Link>
        </div>

        {(rows ?? []).length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-16 text-center">
            <p className="text-sm text-gray-400">
              No prescriptions yet. Upload one to order Rx medicines.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {(rows ?? []).map(rx => (
              <li
                key={rx.id}
                className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4"
              >
                {urlByPath.get(rx.image_url) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={urlByPath.get(rx.image_url)}
                    alt="Prescription"
                    className="h-16 w-16 rounded-lg bg-gray-100 object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-gray-100 text-2xl">
                    📋
                  </div>
                )}
                <div className="flex-1">
                  <StatusBadge status={rx.status} />
                  <p className="mt-1 text-xs text-gray-500">
                    Uploaded {new Date(rx.uploaded_at).toLocaleDateString()}
                  </p>
                  {rx.notes && <p className="mt-1 text-xs text-gray-600">{rx.notes}</p>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}
