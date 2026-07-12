import { NextResponse } from 'next/server'
import { Expo } from 'expo-server-sdk'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { LABEL_BY_STATUS, type OrderStatus } from '@/components/orders/OrderStatusBadge'
import { isValidOrderStatusTransition, ORDER_STATUS_SEQUENCE, TERMINAL_STATUSES } from '@/lib/utils/orders'
import type { Database } from '@/lib/types/database'

const VALID_STATUSES: OrderStatus[] = [...ORDER_STATUS_SEQUENCE, 'cancelled']

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(request: Request, { params }: RouteParams) {
  const { id: orderId } = await params

  let supabase = await createClient()

  let { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    const authHeader = request.headers.get('authorization') ?? ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length).trim() : ''
    if (token) {
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

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['pharmacist', 'admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const status: OrderStatus | undefined = body?.status
  const note: string | null = body?.note ?? null
  if (!status || !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const { data: order } = await supabase.from('orders').select('id, user_id, status').eq('id', orderId).single()
  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  if (!isValidOrderStatusTransition(order.status, status)) {
    const reason = TERMINAL_STATUSES.includes(order.status)
      ? 'Order is already in a terminal state'
      : 'Invalid status transition'
    return NextResponse.json({ error: reason }, { status: 400 })
  }

  const { error: updateError } = await supabase.from('orders').update({ status }).eq('id', orderId)
  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  const { error: eventError } = await supabase.from('order_events').insert({
    order_id: orderId,
    status,
    note,
    created_by: user.id,
  })
  if (eventError) {
    return NextResponse.json(
      { error: `Order status updated, but the event log entry failed: ${eventError.message}` },
      { status: 500 }
    )
  }

  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const serviceClient = createSupabaseClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      )

      await serviceClient.from('notifications').insert({
        user_id: order.user_id,
        title: 'Order update',
        body: `Your order is now ${LABEL_BY_STATUS[status]}.`,
        type: 'order_update',
        read: false,
        payload: { orderId, status },
      })

      const { data: customerProfile } = await serviceClient
        .from('profiles')
        .select('expo_push_token')
        .eq('id', order.user_id)
        .single()

      if (customerProfile?.expo_push_token) {
        const expo = new Expo()
        const tickets = await expo.sendPushNotificationsAsync([{
          to: customerProfile.expo_push_token,
          title: 'Order update',
          body: `Your order is now ${LABEL_BY_STATUS[status]}.`,
          data: { orderId, status },
        }])
        for (const ticket of tickets) {
          if (ticket.status === 'error') {
            console.error('Expo push ticket error:', ticket.message, ticket.details)
          }
        }
      } else {
        console.warn(`No expo_push_token for user ${order.user_id} — skipping push`)
      }
    } catch (err) {
      console.error('Notification/push send failed:', err)
    }
  } else {
    console.warn('SUPABASE_SERVICE_ROLE_KEY not set — skipping notification/push')
  }

  return NextResponse.json({ data: { status } }, { status: 200 })
}
