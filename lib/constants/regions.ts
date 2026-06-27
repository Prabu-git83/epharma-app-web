export const REGIONS = {
  US: { code: 'US', name: 'United States', currency: 'USD', symbol: '$', locale: 'en-US', taxRate: 0, taxLabel: 'Sales Tax', rtl: false },
  IN: { code: 'IN', name: 'India', currency: 'INR', symbol: '₹', locale: 'en-IN', taxRate: 0.12, taxLabel: 'GST', rtl: false },
  GB: { code: 'GB', name: 'United Kingdom', currency: 'GBP', symbol: '£', locale: 'en-GB', taxRate: 0, taxLabel: 'VAT', rtl: false },
  AE: { code: 'AE', name: 'UAE (Dubai / Abu Dhabi)', currency: 'AED', symbol: 'د.إ', locale: 'ar-AE', taxRate: 0.05, taxLabel: 'VAT', rtl: true },
  BH: { code: 'BH', name: 'Bahrain', currency: 'BHD', symbol: '.د.ب', locale: 'ar-BH', taxRate: 0.05, taxLabel: 'VAT', rtl: true },
  SG: { code: 'SG', name: 'Singapore', currency: 'SGD', symbol: 'S$', locale: 'en-SG', taxRate: 0.09, taxLabel: 'GST', rtl: false },
  MY: { code: 'MY', name: 'Malaysia', currency: 'MYR', symbol: 'RM', locale: 'en-MY', taxRate: 0.06, taxLabel: 'SST', rtl: false },
} as const

export type RegionCode = keyof typeof REGIONS

export const REGION_OPTIONS = Object.values(REGIONS)
