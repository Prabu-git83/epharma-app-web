import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import {
  getProfileWithRegion,
  getOrCreateCart,
  getCartLines,
} from '@/lib/supabase/queries'
import { computeCartTotals, lineNeedsPrescription } from '@/lib/utils/cart'
import { resolveLocalPrice } from '@/lib/utils/pricing'
import { buildOrderConfirmationHtml } from '@/lib/utils/email'
import type { Database } from '@/lib/types/database'

export async function POST(request: Request) {
  let supabase = await createClient()

  let { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    const authHeader = request.headers.get('authorization') ?? ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length).trim() : ''
    if (token) {
      // Cookie-less mobile caller — build a client that authenticates every
      // subsequent RLS-scoped query with this token, not just this getUser() check.
      supabase = createSupabaseClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { global: { headers: { Authorization: `Bearer ${token}` } } }
      )
      const { data } = await supabase.auth.getUser(token)
      user = data.user
    }
  }
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const addressId: string | undefined = body?.addressId
  const notes: string | null = body?.notes ?? null
  if (!addressId || typeof addressId !== 'string') {
    return NextResponse.json({ error: 'An address is required' }, { status: 400 })
  }

  const { data: address } = await supabase
    .from('addresses')
    .select('*')
    .eq('id', addressId)
    .eq('user_id', user.id)
    .single()
  if (!address) {
    return NextResponse.json({ error: 'Address not found' }, { status: 400 })
  }

  const profileRegion = await getProfileWithRegion(supabase, user.id)
  if (!profileRegion) {
    return NextResponse.json({ error: 'No region set for this account' }, { status: 400 })
  }
  const { region, regionCode } = profileRegion

  const cart = await getOrCreateCart(supabase, user.id)
  const lines = await getCartLines(supabase, cart.id, region.id)
  if (lines.length === 0) {
    return NextResponse.json({ error: 'Your cart is empty' }, { status: 400 })
  }

  const blocked = lines.filter(line =>
    lineNeedsPrescription({
      quantity: line.quantity,
      baseUsd: line.baseUsd,
      priceLocal: line.priceLocal,
      requiresPrescription: line.requiresPrescription,
      prescriptionStatus: line.prescriptionStatus,
    })
  )
  if (blocked.length > 0) {
    return NextResponse.json(
      { error: `A verified prescription is required for: ${blocked.map(l => l.drugName).join(', ')}` },
      { status: 400 }
    )
  }

  const unavailable = lines.filter(line => !line.isAvailable)
  if (unavailable.length > 0) {
    return NextResponse.json(
      { error: `No longer available in your region: ${unavailable.map(l => l.drugName).join(', ')}` },
      { status: 400 }
    )
  }

  const totals = computeCartTotals(lines, regionCode, region.tax_rate)

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id: user.id,
      status: 'placed',
      region_id: region.id,
      currency_code: region.currency_code,
      subtotal: totals.subtotal,
      tax_rate: region.tax_rate,
      tax_amount: totals.taxAmount,
      total: totals.total,
      address_id: addressId,
      payment_method: 'cod',
      payment_status: 'pending',
      stripe_payment_intent_id: null,
      notes,
    })
    .select('*')
    .single()

  if (orderError || !order) {
    return NextResponse.json({ error: orderError?.message ?? 'Could not create order' }, { status: 500 })
  }

  const { error: itemsError } = await supabase.from('order_items').insert(
    lines.map(line => ({
      order_id: order.id,
      drug_id: line.drugId,
      quantity: line.quantity,
      unit_price_local: resolveLocalPrice(line.baseUsd, regionCode, line.priceLocal),
      prescription_id: line.prescriptionId,
    }))
  )
  if (itemsError) {
    await supabase.from('orders').delete().eq('id', order.id)
    return NextResponse.json({ error: itemsError.message }, { status: 500 })
  }

  await supabase.from('cart_items').delete().eq('cart_id', cart.id)

  if (process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from: 'onboarding@resend.dev',
        to: user.email!,
        subject: `Order confirmed — ${region.currency_symbol}${totals.total.toFixed(2)}`,
        html: buildOrderConfirmationHtml({
          orderId: order.id,
          items: lines.map(line => ({
            name: line.drugName,
            quantity: line.quantity,
            unitPriceLocal: resolveLocalPrice(line.baseUsd, regionCode, line.priceLocal),
          })),
          address: {
            line1: address.line1,
            line2: address.line2,
            city: address.city,
            state: address.state,
            zip: address.zip,
            countryCode: address.country_code,
          },
          regionCode,
          subtotal: totals.subtotal,
          taxAmount: totals.taxAmount,
          total: totals.total,
        }),
      })
    } catch (err) {
      console.error('Order confirmation email failed to send:', err)
    }
  } else {
    console.warn('RESEND_API_KEY not set — skipping order confirmation email')
  }

  return NextResponse.json({ data: { orderId: order.id } }, { status: 201 })
}
