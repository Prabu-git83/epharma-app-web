-- Stage 4: order_items had only a SELECT policy from 001_initial_schema.sql —
-- customers could never insert their own order's line items under RLS.
-- Run in: Supabase Dashboard → SQL Editor. Idempotent — safe to re-run.

DROP POLICY IF EXISTS "order_items_own_insert" ON order_items;
CREATE POLICY "order_items_own_insert" ON order_items FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM orders WHERE id = order_id AND user_id = auth.uid()));
