-- Stage 5: order_events only allowed pharmacist/admin to insert (001 migration),
-- but POST /api/orders runs as the customer and needs to seed the initial
-- 'placed' event at order-creation time. Grant customers a narrow INSERT
-- right: only a 'placed' event, only for their own order — no other status
-- transition is customer-writable (those stay pharmacist/admin only via the
-- existing order_events_admin_insert policy).
-- Run in: Supabase Dashboard → SQL Editor. Idempotent — safe to re-run.

DROP POLICY IF EXISTS "order_events_own_placed_insert" ON order_events;
CREATE POLICY "order_events_own_placed_insert" ON order_events FOR INSERT
  WITH CHECK (
    status = 'placed'
    AND EXISTS (SELECT 1 FROM orders WHERE id = order_id AND user_id = auth.uid())
  );
