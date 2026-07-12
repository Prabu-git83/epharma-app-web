import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'
import type { RegionCode } from '@/lib/constants/regions'
import { isValidRegionCode } from '@/lib/utils/validation'
import type { PrescriptionStatus } from '@/lib/utils/prescriptions'

type Client = SupabaseClient<Database>
type RegionRow = Database['public']['Tables']['regions']['Row']
type AddressRow = Database['public']['Tables']['addresses']['Row']
type OrderRow = Database['public']['Tables']['orders']['Row']

export interface ProfileRegion {
  fullName: string | null
  role: 'customer' | 'pharmacist' | 'admin'
  region: RegionRow
  regionCode: RegionCode
}

/** Profile + resolved region for the signed-in user; falls back to US. */
export async function getProfileWithRegion(
  supabase: Client,
  userId: string
): Promise<ProfileRegion | null> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, region_id')
    .eq('id', userId)
    .single()

  if (!profile) return null

  let region: RegionRow | null = null
  if (profile.region_id) {
    const { data } = await supabase
      .from('regions')
      .select('*')
      .eq('id', profile.region_id)
      .single()
    region = data
  }
  if (!region) {
    const { data } = await supabase.from('regions').select('*').eq('code', 'US').single()
    region = data
  }
  if (!region) return null

  return {
    fullName: profile.full_name,
    role: profile.role,
    region,
    regionCode: isValidRegionCode(region.code) ? region.code : 'US',
  }
}

/** Gets-or-creates the user's single cart row. */
export async function getOrCreateCart(supabase: Client, userId: string): Promise<{ id: string }> {
  const { data: existing } = await supabase
    .from('carts')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle()
  if (existing) return existing

  const { data: created } = await supabase
    .from('carts')
    .insert({ user_id: userId })
    .select('id')
    .single()
  return created!
}

export interface CartLineRow {
  cartItemId: string
  drugId: string
  drugName: string
  brand: string | null
  quantity: number
  baseUsd: number
  priceLocal: number | null
  requiresPrescription: boolean
  isAvailable: boolean
  prescriptionId: string | null
  prescriptionStatus: PrescriptionStatus | null
}

/** Joined cart_items + drugs + drug_region_rules (for the given region) + prescriptions. */
export async function getCartLines(
  supabase: Client,
  cartId: string,
  regionId: string
): Promise<CartLineRow[]> {
  const { data: items } = await supabase
    .from('cart_items')
    .select('id, drug_id, quantity, prescription_id')
    .eq('cart_id', cartId)
  if (!items || items.length === 0) return []

  const drugIds = [...new Set(items.map(i => i.drug_id))]
  const prescriptionIds = [...new Set(items.map(i => i.prescription_id).filter((id): id is string => !!id))]

  const [{ data: drugs }, { data: rules }, { data: prescriptions }] = await Promise.all([
    supabase.from('drugs').select('id, name, brand, base_price_usd').in('id', drugIds),
    supabase
      .from('drug_region_rules')
      .select('drug_id, requires_prescription, is_available, price_local')
      .eq('region_id', regionId)
      .in('drug_id', drugIds),
    prescriptionIds.length
      ? supabase.from('prescriptions').select('id, status').in('id', prescriptionIds)
      : Promise.resolve({ data: [] as { id: string; status: PrescriptionStatus }[] }),
  ])

  const drugById = new Map((drugs ?? []).map(d => [d.id, d]))
  const ruleByDrugId = new Map((rules ?? []).map(r => [r.drug_id, r]))
  const prescriptionById = new Map((prescriptions ?? []).map(p => [p.id, p]))

  return items.flatMap((item): CartLineRow[] => {
    const drug = drugById.get(item.drug_id)
    if (!drug) return []
    const rule = ruleByDrugId.get(item.drug_id)
    const prescription = item.prescription_id ? prescriptionById.get(item.prescription_id) : null
    return [{
      cartItemId: item.id,
      drugId: drug.id,
      drugName: drug.name,
      brand: drug.brand,
      quantity: item.quantity,
      baseUsd: drug.base_price_usd,
      priceLocal: rule?.price_local ?? null,
      requiresPrescription: rule?.requires_prescription ?? false,
      isAvailable: rule?.is_available ?? false,
      prescriptionId: item.prescription_id,
      prescriptionStatus: prescription?.status ?? null,
    }]
  })
}

/** User's verified prescriptions, newest first — for the cart's attach-picker. */
export async function getVerifiedPrescriptions(
  supabase: Client,
  userId: string
): Promise<{ id: string; uploaded_at: string }[]> {
  const { data } = await supabase
    .from('prescriptions')
    .select('id, uploaded_at')
    .eq('user_id', userId)
    .eq('status', 'verified')
    .order('uploaded_at', { ascending: false })
  return data ?? []
}

/** User's addresses, default first. */
export async function getAddresses(supabase: Client, userId: string): Promise<AddressRow[]> {
  const { data } = await supabase
    .from('addresses')
    .select('*')
    .eq('user_id', userId)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false })
  return data ?? []
}

export interface OrderSummaryRow {
  id: string
  status: OrderRow['status']
  total: number
  regionCode: RegionCode
  placedAt: string
  itemCount: number
}

/** User's orders, newest first, with item count. */
export async function getOrders(supabase: Client, userId: string): Promise<OrderSummaryRow[]> {
  const { data: orders } = await supabase
    .from('orders')
    .select('id, status, total, region_id, placed_at')
    .eq('user_id', userId)
    .order('placed_at', { ascending: false })
  if (!orders || orders.length === 0) return []

  const regionIds = [...new Set(orders.map(o => o.region_id).filter((id): id is string => !!id))]
  const orderIds = orders.map(o => o.id)

  const [{ data: regions }, { data: items }] = await Promise.all([
    regionIds.length
      ? supabase.from('regions').select('id, code').in('id', regionIds)
      : Promise.resolve({ data: [] as { id: string; code: string }[] }),
    supabase.from('order_items').select('order_id').in('order_id', orderIds),
  ])

  const codeByRegionId = new Map((regions ?? []).map(r => [r.id, r.code]))
  const countByOrderId = new Map<string, number>()
  for (const item of items ?? []) {
    countByOrderId.set(item.order_id, (countByOrderId.get(item.order_id) ?? 0) + 1)
  }

  return orders.map(order => {
    const code = order.region_id ? codeByRegionId.get(order.region_id) : null
    return {
      id: order.id,
      status: order.status,
      total: order.total,
      regionCode: code && isValidRegionCode(code) ? code : 'US',
      placedAt: order.placed_at,
      itemCount: countByOrderId.get(order.id) ?? 0,
    }
  })
}

export interface OrderDetailItem {
  drugId: string
  drugName: string
  brand: string | null
  quantity: number
  unitPriceLocal: number
}

export interface OrderEventRow {
  id: string
  status: OrderRow['status']
  note: string | null
  createdAt: string
}

export interface OrderDetailRow {
  order: OrderRow
  regionCode: RegionCode
  address: AddressRow | null
  items: OrderDetailItem[]
  events: OrderEventRow[]
}

/** Single order + its items (joined to drugs for names) + address. Caller must 404 if null. */
export async function getOrderDetail(supabase: Client, orderId: string): Promise<OrderDetailRow | null> {
  const { data: order } = await supabase.from('orders').select('*').eq('id', orderId).single()
  if (!order) return null

  const [{ data: items }, { data: address }, { data: region }, { data: events }] = await Promise.all([
    supabase.from('order_items').select('drug_id, quantity, unit_price_local').eq('order_id', orderId),
    order.address_id
      ? supabase.from('addresses').select('*').eq('id', order.address_id).single()
      : Promise.resolve({ data: null as AddressRow | null }),
    order.region_id
      ? supabase.from('regions').select('code').eq('id', order.region_id).single()
      : Promise.resolve({ data: null as { code: string } | null }),
    supabase
      .from('order_events')
      .select('id, status, note, created_at')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true }),
  ])

  const drugIds = [...new Set((items ?? []).map(i => i.drug_id))]
  const { data: drugs } = drugIds.length
    ? await supabase.from('drugs').select('id, name, brand').in('id', drugIds)
    : { data: [] as { id: string; name: string; brand: string | null }[] }
  const drugById = new Map((drugs ?? []).map(d => [d.id, d]))

  const detailItems: OrderDetailItem[] = (items ?? []).flatMap((item): OrderDetailItem[] => {
    const drug = drugById.get(item.drug_id)
    if (!drug) return []
    return [{
      drugId: item.drug_id,
      drugName: drug.name,
      brand: drug.brand,
      quantity: item.quantity,
      unitPriceLocal: item.unit_price_local,
    }]
  })

  return {
    order,
    regionCode: region?.code && isValidRegionCode(region.code) ? region.code : 'US',
    address: address ?? null,
    items: detailItems,
    events: (events ?? []).map(e => ({
      id: e.id,
      status: e.status as OrderRow['status'],
      note: e.note,
      createdAt: e.created_at,
    })),
  }
}
