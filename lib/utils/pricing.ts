import { REGIONS, type RegionCode } from '@/lib/constants/regions'

/**
 * Approximate USD conversion rates for display when a drug has no
 * `price_local` override in `drug_region_rules`. Replaced by a live
 * rate service in a later stage.
 */
export const APPROX_USD_RATES: Record<RegionCode, number> = {
  US: 1,
  IN: 88,
  GB: 0.76,
  AE: 3.67,
  BH: 0.376,
  SG: 1.28,
  MY: 4.2,
}

/** Local display amount: `price_local` override wins, else approximate conversion. */
export function resolveLocalPrice(
  baseUsd: number,
  regionCode: RegionCode,
  priceLocal: number | null
): number {
  if (priceLocal !== null && priceLocal >= 0) return priceLocal
  return baseUsd * APPROX_USD_RATES[regionCode]
}

export function formatPrice(amount: number, regionCode: RegionCode): string {
  const region = REGIONS[regionCode]
  try {
    return new Intl.NumberFormat(region.locale, {
      style: 'currency',
      currency: region.currency,
    }).format(amount)
  } catch {
    return `${region.symbol}${amount.toFixed(2)}`
  }
}

/** Convenience: resolve then format in one step. */
export function displayPrice(
  baseUsd: number,
  regionCode: RegionCode,
  priceLocal: number | null
): string {
  return formatPrice(resolveLocalPrice(baseUsd, regionCode, priceLocal), regionCode)
}
