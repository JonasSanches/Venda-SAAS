-- Execute after the first Prisma migration: psql "$DATABASE_URL" -f prisma/rls.sql
DO $$
DECLARE table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'branches','users','roles','products','warehouses','stock_movements',
    'orders','order_items','payments','fiscal_documents','audit_logs','outbox_events',
    'cash_sessions','cash_movements','parties','fiscal_settings'
  ] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', table_name);
    EXECUTE format(
      'DROP POLICY IF EXISTS tenant_isolation ON %I',
      table_name
    );
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON %I USING (tenant_id = nullif(current_setting(''app.tenant_id'', true), '''')::uuid) WITH CHECK (tenant_id = nullif(current_setting(''app.tenant_id'', true), '''')::uuid)',
      table_name
    );
  END LOOP;
END $$;
