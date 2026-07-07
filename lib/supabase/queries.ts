import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'
import type { RegionCode } from '@/lib/constants/regions'
import { isValidRegionCode } from '@/lib/utils/validation'

type Client = SupabaseClient<Database>
type RegionRow = Database['public']['Tables']['regions']['Row']

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
