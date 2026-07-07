'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils/cn'

export interface CategoryOption {
  id: string
  name: string
  slug: string
}

interface CatalogFiltersProps {
  categories: CategoryOption[]
}

export function CatalogFilters({ categories }: CatalogFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeCategory = searchParams.get('category') ?? ''
  const q = searchParams.get('q') ?? ''

  function navigate(next: { q?: string; category?: string }) {
    const params = new URLSearchParams()
    const nextQ = next.q ?? q
    const nextCategory = next.category ?? activeCategory
    if (nextQ) params.set('q', nextQ)
    if (nextCategory) params.set('category', nextCategory)
    const qs = params.toString()
    router.push(qs ? `/catalog?${qs}` : '/catalog')
  }

  return (
    <div className="mb-6 flex flex-col gap-4">
      <form
        onSubmit={e => {
          e.preventDefault()
          const value = new FormData(e.currentTarget).get('q')
          navigate({ q: typeof value === 'string' ? value.trim() : '' })
        }}
      >
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search medicines or brands…"
          className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
      </form>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => navigate({ category: '' })}
          className={cn(
            'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
            activeCategory === ''
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
          )}
        >
          All
        </button>
        {categories.map(c => (
          <button
            key={c.id}
            onClick={() => navigate({ category: c.slug })}
            className={cn(
              'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
              activeCategory === c.slug
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
            )}
          >
            {c.name}
          </button>
        ))}
      </div>
    </div>
  )
}
