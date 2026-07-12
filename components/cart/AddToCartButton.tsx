'use client'
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'

interface AddToCartButtonProps {
  drugId: string
  available: boolean
}

export function AddToCartButton({ drugId, available }: AddToCartButtonProps) {
  const [busy, setBusy] = useState(false)
  const [added, setAdded] = useState(false)
  const [error, setError] = useState('')

  async function addToCart() {
    setBusy(true)
    setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setBusy(false)
      return
    }

    let cartId: string
    const { data: existingCart } = await supabase
      .from('carts')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (existingCart) {
      cartId = existingCart.id
    } else {
      const { data: createdCart, error: createError } = await supabase
        .from('carts')
        .insert({ user_id: user.id })
        .select('id')
        .single()
      if (createError || !createdCart) {
        setError(createError?.message ?? 'Could not create cart')
        setBusy(false)
        return
      }
      cartId = createdCart.id
    }

    const { data: existingItem } = await supabase
      .from('cart_items')
      .select('id, quantity')
      .eq('cart_id', cartId)
      .eq('drug_id', drugId)
      .maybeSingle()

    const { error: mutationError } = existingItem
      ? await supabase
          .from('cart_items')
          .update({ quantity: existingItem.quantity + 1 })
          .eq('id', existingItem.id)
      : await supabase
          .from('cart_items')
          .insert({ cart_id: cartId, drug_id: drugId, quantity: 1, prescription_id: null })

    setBusy(false)
    if (mutationError) {
      setError(mutationError.message)
      return
    }
    setAdded(true)
  }

  if (!available) {
    return (
      <Button disabled title="Not available in your region">
        Not available in your region
      </Button>
    )
  }

  if (added) {
    return (
      <div className="flex items-center gap-3">
        <Button variant="secondary" disabled>Added to cart</Button>
        <Link href="/cart" className="text-sm font-medium text-blue-600 hover:text-blue-700">
          View cart →
        </Link>
      </div>
    )
  }

  return (
    <div>
      <Button loading={busy} onClick={addToCart}>Add to cart</Button>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  )
}
