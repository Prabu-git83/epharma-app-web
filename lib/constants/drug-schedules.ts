// Regulatory drug schedule labels per region
export const DRUG_SCHEDULE_LABELS: Record<string, Record<string, string>> = {
  US: {
    'II': 'Schedule II (DEA)',
    'III': 'Schedule III (DEA)',
    'IV': 'Schedule IV (DEA)',
    'V': 'Schedule V (DEA)',
    'OTC': 'Over the Counter',
  },
  IN: {
    'H': 'Schedule H — Prescription Required',
    'H1': 'Schedule H1 — Controlled',
    'X': 'Schedule X — Narcotic',
    'OTC': 'Over the Counter',
  },
  GB: {
    'POM': 'Prescription Only Medicine',
    'P': 'Pharmacy Medicine',
    'GSL': 'General Sales List',
  },
  AE: { 'POM': 'Prescription Required (MOHAP)', 'OTC': 'Over the Counter' },
  BH: { 'POM': 'Prescription Required (MOH)', 'OTC': 'Over the Counter' },
  SG: { 'POM': 'Prescription Only (HSA)', 'P': 'Pharmacy Only', 'OTC': 'Over the Counter' },
  MY: {
    'B': 'Group B Poison — Prescription Required',
    'C': 'Group C Poison — Pharmacist Only',
    'OTC': 'Over the Counter',
  },
}
