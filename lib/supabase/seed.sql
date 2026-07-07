-- Stage 2 catalog seed: categories, drugs, per-region rules.
-- Idempotent — safe to run more than once. Run in the Supabase SQL editor.

-- ── Categories ────────────────────────────────────────────────────────────
insert into public.categories (name, slug)
select v.name, v.slug
from (values
  ('Pain Relief',            'pain-relief'),
  ('Antibiotics',            'antibiotics'),
  ('Allergy',                'allergy'),
  ('Digestive Health',       'digestive-health'),
  ('Chronic Care',           'chronic-care'),
  ('Vitamins & Supplements', 'vitamins-supplements'),
  ('Respiratory',            'respiratory'),
  ('First Aid',              'first-aid')
) as v(name, slug)
where not exists (select 1 from public.categories c where c.slug = v.slug);

-- ── Drugs ────────────────────────────────────────────────────────────────
insert into public.drugs (name, brand, category_id, description, base_price_usd, is_active)
select v.name, v.brand,
       (select id from public.categories c where c.slug = v.cat),
       v.description, v.price, true
from (values
  ('Paracetamol 500mg',            'Panadol',   'pain-relief',          'Analgesic and antipyretic for mild to moderate pain and fever. Pack of 20 tablets.',                          3.49),
  ('Ibuprofen 400mg',              'Brufen',    'pain-relief',          'Non-steroidal anti-inflammatory (NSAID) for pain, inflammation and fever. Pack of 20 tablets.',              4.99),
  ('Aspirin 75mg Low-Dose',        'Disprin',   'pain-relief',          'Low-dose aspirin for cardiovascular protection as directed by a physician. Pack of 28 tablets.',             2.99),
  ('Amoxicillin 500mg',            'Amoxil',    'antibiotics',          'Broad-spectrum penicillin antibiotic. Complete the full prescribed course. Pack of 21 capsules.',            12.99),
  ('Azithromycin 500mg',           'Zithromax', 'antibiotics',          'Macrolide antibiotic for bacterial infections. Pack of 3 tablets.',                                          18.50),
  ('Cetirizine 10mg',              'Zyrtec',    'allergy',              'Second-generation antihistamine for allergic rhinitis and urticaria. Pack of 10 tablets.',                   6.49),
  ('Loratadine 10mg',              'Claritin',  'allergy',              'Non-drowsy antihistamine for seasonal allergies. Pack of 10 tablets.',                                       7.25),
  ('Omeprazole 20mg',              'Prilosec',  'digestive-health',     'Proton-pump inhibitor for acid reflux and heartburn. Pack of 14 capsules.',                                  9.99),
  ('ORS Rehydration Salts',        'Electral',  'digestive-health',     'Oral rehydration salts for fluid and electrolyte replacement. Box of 10 sachets.',                           1.99),
  ('Metformin 500mg',              'Glucophage','chronic-care',         'First-line oral medication for type 2 diabetes. Pack of 60 tablets.',                                        8.75),
  ('Atorvastatin 20mg',            'Lipitor',   'chronic-care',         'Statin for lowering cholesterol and cardiovascular risk. Pack of 30 tablets.',                               14.25),
  ('Insulin Glargine 100IU/ml',    'Lantus',    'chronic-care',         'Long-acting basal insulin, 10ml vial. Requires refrigeration (2-8°C).',                                      89.00),
  ('Salbutamol Inhaler 100mcg',    'Ventolin',  'respiratory',          'Short-acting bronchodilator for asthma relief. 200 metered doses.',                                          24.99),
  ('Vitamin D3 1000IU',            null,        'vitamins-supplements', 'Daily vitamin D supplement for bone and immune health. Pack of 60 softgels.',                                11.49),
  ('Multivitamin Daily',           'Centrum',   'vitamins-supplements', 'Complete daily multivitamin and mineral supplement. Pack of 60 tablets.',                                    13.99),
  ('Antiseptic Liquid 100ml',      'Dettol',    'first-aid',            'Antiseptic disinfectant liquid for first aid, cuts and grazes.',                                             4.49)
) as v(name, brand, cat, description, price)
where not exists (select 1 from public.drugs d where d.name = v.name);

-- ── Region rules: one row per drug × region ─────────────────────────────
-- Prescription-only drugs (uniform across regions for Stage 2).
with rx_drugs as (
  select id from public.drugs
  where name in (
    'Amoxicillin 500mg',
    'Azithromycin 500mg',
    'Metformin 500mg',
    'Atorvastatin 20mg',
    'Insulin Glargine 100IU/ml',
    'Salbutamol Inhaler 100mcg'
  )
)
insert into public.drug_region_rules
  (drug_id, region_id, requires_prescription, schedule_class, regulatory_label, is_available, price_local)
select
  d.id,
  r.id,
  (d.id in (select id from rx_drugs)),
  case
    when d.id not in (select id from rx_drugs) then null
    when r.code = 'US' then 'Rx-only'
    when r.code = 'GB' then 'POM'
    when r.code = 'IN' then 'Schedule H'
    when r.code in ('AE','BH') then 'Prescription'
    when r.code = 'SG' then 'POM'
    when r.code = 'MY' then 'Group B'
    else 'Rx'
  end,
  case
    when d.id not in (select id from rx_drugs) then null
    when r.code = 'IN' then 'Schedule H — to be sold by retail on the prescription of a Registered Medical Practitioner only.'
    else 'Prescription required — upload a valid prescription at checkout.'
  end,
  true,
  null
from public.drugs d
cross join public.regions r
where not exists (
  select 1 from public.drug_region_rules x
  where x.drug_id = d.id and x.region_id = r.id
);

-- ── Regional exceptions ──────────────────────────────────────────────────
-- India: local generic pricing (INR).
update public.drug_region_rules x
set price_local = v.inr
from (values
  ('Paracetamol 500mg',    35.00),
  ('Ibuprofen 400mg',      52.00),
  ('Amoxicillin 500mg',   110.00),
  ('Cetirizine 10mg',      40.00),
  ('Metformin 500mg',      45.00),
  ('Atorvastatin 20mg',   120.00)
) as v(drug_name, inr),
public.drugs d, public.regions r
where d.name = v.drug_name
  and r.code = 'IN'
  and x.drug_id = d.id
  and x.region_id = r.id;

-- Bahrain: insulin temporarily unavailable (stock example).
update public.drug_region_rules x
set is_available = false
from public.drugs d, public.regions r
where d.name = 'Insulin Glargine 100IU/ml'
  and r.code = 'BH'
  and x.drug_id = d.id
  and x.region_id = r.id;
