'use client'
import { useState } from 'react'
import { cn } from '@/lib/utils/cn'
import { AddressForm } from '@/components/cart/AddressForm'
import type { Database } from '@/lib/types/database'

type AddressRow = Database['public']['Tables']['addresses']['Row']

interface AddressPickerProps {
  addresses: AddressRow[]
  selectedId: string | null
  onSelect: (id: string) => void
  onAddressCreated: (address: AddressRow) => void
}

export function AddressPicker({ addresses, selectedId, onSelect, onAddressCreated }: AddressPickerProps) {
  const [adding, setAdding] = useState(addresses.length === 0)

  return (
    <div className="flex flex-col gap-3">
      {addresses.map(address => (
        <button
          key={address.id}
          type="button"
          onClick={() => onSelect(address.id)}
          className={cn(
            'rounded-xl border p-4 text-left text-sm',
            selectedId === address.id
              ? 'border-blue-500 ring-1 ring-blue-500'
              : 'border-gray-200 hover:border-gray-300'
          )}
        >
          <p className="font-medium text-gray-900">{address.label}</p>
          <p className="text-gray-600">
            {[address.line1, address.line2, address.city, address.state, address.zip, address.country_code]
              .filter(Boolean)
              .join(', ')}
          </p>
        </button>
      ))}

      {adding ? (
        <AddressForm
          onCreated={address => {
            onAddressCreated(address)
            setAdding(false)
          }}
          onCancel={() => setAdding(false)}
        />
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="rounded-xl border border-dashed border-gray-300 p-4 text-left text-sm text-gray-500 hover:border-gray-400 hover:text-gray-700"
        >
          + Add new address
        </button>
      )}
    </div>
  )
}
