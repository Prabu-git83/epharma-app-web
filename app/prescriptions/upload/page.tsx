'use client'
import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import {
  buildPrescriptionPath,
  isAllowedPrescriptionType,
  isWithinPrescriptionSizeLimit,
} from '@/lib/utils/prescriptions'

export default function UploadPrescriptionPage() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  function handleFile(selected: File | undefined) {
    if (!selected) return
    if (!isAllowedPrescriptionType(selected.type)) {
      setError('Please choose a JPEG, PNG or WebP image.')
      return
    }
    if (!isWithinPrescriptionSizeLimit(selected.size)) {
      setError('Image is larger than 10 MB. Please choose a smaller one.')
      return
    }
    setError('')
    setFile(selected)
    setPreviewUrl(URL.createObjectURL(selected))
  }

  async function handleUpload() {
    if (!file) return
    setUploading(true)
    setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    const path = buildPrescriptionPath(user.id, file.type)
    const { error: storageError } = await supabase.storage
      .from('prescriptions')
      .upload(path, file, { contentType: file.type })

    if (storageError) {
      setError(storageError.message)
      setUploading(false)
      return
    }

    const { error: insertError } = await supabase.from('prescriptions').insert({
      user_id: user.id,
      image_url: path,
      status: 'pending',
      verified_by: null,
      notes: null,
      verified_at: null,
    })

    if (insertError) {
      setError(insertError.message)
      setUploading(false)
      return
    }

    router.push('/prescriptions')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="mx-auto max-w-xl px-4 py-10">
        <Link href="/prescriptions" className="text-sm text-gray-500 hover:text-gray-800">
          ← Back to prescriptions
        </Link>

        <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-6">
          <h1 className="text-xl font-semibold text-gray-900">Upload a prescription</h1>
          <p className="mt-1 text-sm text-gray-500">
            Take a clear photo of the full prescription, including the doctor&apos;s
            signature and date. JPEG, PNG or WebP, up to 10 MB.
          </p>

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="mt-4 flex h-72 w-full items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 hover:border-blue-400"
          >
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt="Preview" className="h-full w-full object-contain" />
            ) : (
              <span className="text-sm text-gray-400">Click to choose an image</span>
            )}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={e => handleFile(e.target.files?.[0])}
          />

          {error && <p className="mt-3 text-xs text-red-600">{error}</p>}

          <Button
            size="full"
            className="mt-4"
            disabled={!file}
            loading={uploading}
            onClick={handleUpload}
          >
            Upload prescription
          </Button>
        </div>
      </main>
    </div>
  )
}
