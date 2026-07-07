import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { displayPrice } from '@/lib/utils/pricing'
import type { RegionCode } from '@/lib/constants/regions'

export interface CatalogDrug {
  id: string
  name: string
  brand: string | null
  description: string | null
  base_price_usd: number
  requires_prescription: boolean
  price_local: number | null
}

interface DrugCardProps {
  drug: CatalogDrug
  regionCode: RegionCode
}

export function DrugCard({ drug, regionCode }: DrugCardProps) {
  return (
    <Link
      href={`/drug/${drug.id}`}
      className="group rounded-xl border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md"
    >
      <div className="mb-3 flex h-24 items-center justify-center rounded-lg bg-blue-50 text-3xl">
        💊
      </div>
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 group-hover:text-blue-700">
            {drug.name}
          </h3>
          {drug.brand && <p className="text-xs text-gray-500">{drug.brand}</p>}
        </div>
        {drug.requires_prescription
          ? <Badge variant="rx">Rx</Badge>
          : <Badge variant="otc">OTC</Badge>}
      </div>
      <p className="mt-2 text-base font-semibold text-gray-900">
        {displayPrice(drug.base_price_usd, regionCode, drug.price_local)}
      </p>
    </Link>
  )
}
