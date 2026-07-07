import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getProfileWithRegion } from '@/lib/supabase/queries'
import { NavHeader } from '@/components/NavHeader'
import { StatusBadge } from '@/components/prescriptions/StatusBadge'
import { PrescriptionReviewActions } from '@/components/admin/PrescriptionReviewActions'

export default async function AdminPrescriptionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profileRegion = await getProfileWithRegion(supabase, user.id)
  if (!profileRegion?.fullName) redirect('/register')

  const { data: rows } = await supabase
    .from('prescriptions')
    .select('id, user_id, status, notes, uploaded_at, image_url')
    .in('status', ['pending', 'under_review'])
    .order('uploaded_at', { ascending: true })

  const userIds = [...new Set((rows ?? []).map(r => r.user_id))]
  const { data: uploaders } = userIds.length
    ? await supabase.from('profiles').select('id, full_name').in('id', userIds)
    : { data: [] }
  const nameById = new Map((uploaders ?? []).map(p => [p.id, p.full_name]))

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
      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-2xl font-semibold text-gray-900">Prescription review queue</h1>
        <p className="mb-6 text-sm text-gray-500">
          Oldest uploads first. Verify only complete, legible prescriptions.
        </p>

        {(rows ?? []).length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-16 text-center">
            <p className="text-sm text-gray-400">The queue is empty. 🎉</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-4">
            {(rows ?? []).map(rx => (
              <li
                key={rx.id}
                className="grid gap-4 rounded-xl border border-gray-200 bg-white p-4 sm:grid-cols-[180px_1fr_auto]"
              >
                {urlByPath.get(rx.image_url) ? (
                  <a
                    href={urlByPath.get(rx.image_url)}
                    target="_blank"
                    rel="noreferrer"
                    title="Open full size"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={urlByPath.get(rx.image_url)}
                      alt="Prescription"
                      className="h-40 w-full rounded-lg bg-gray-100 object-cover"
                    />
                  </a>
                ) : (
                  <div className="flex h-40 items-center justify-center rounded-lg bg-gray-100 text-3xl">
                    📋
                  </div>
                )}

                <div>
                  <StatusBadge status={rx.status} />
                  <p className="mt-2 text-sm font-medium text-gray-900">
                    {nameById.get(rx.user_id) ?? 'Customer'}
                  </p>
                  <p className="text-xs text-gray-500">
                    Uploaded {new Date(rx.uploaded_at).toLocaleString()}
                  </p>
                </div>

                <PrescriptionReviewActions prescriptionId={rx.id} />
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}
