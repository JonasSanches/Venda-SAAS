CREATE TYPE "CashSessionStatus" AS ENUM ('OPEN', 'CLOSED');
CREATE TYPE "CashMovementType" AS ENUM ('OPENING', 'SALE', 'SUPPLY', 'WITHDRAWAL', 'REVERSAL');
CREATE TYPE "PartyType" AS ENUM ('CUSTOMER', 'SUPPLIER');

ALTER TABLE "products"
  ADD COLUMN "cfop" TEXT,
  ADD COLUMN "csosn" TEXT,
  ADD COLUMN "pis_cst" TEXT,
  ADD COLUMN "cofins_cst" TEXT;

ALTER TABLE "orders"
  ADD COLUMN "cash_session_id" UUID,
  ADD COLUMN "cancelled_at" TIMESTAMP(3),
  ADD COLUMN "cancel_reason" TEXT;

CREATE TABLE "cash_sessions" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "branch_id" UUID NOT NULL,
  "status" "CashSessionStatus" NOT NULL DEFAULT 'OPEN',
  "opening_amount" DECIMAL(14,2) NOT NULL,
  "declared_amount" DECIMAL(14,2),
  "difference" DECIMAL(14,2),
  "opened_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "closed_at" TIMESTAMP(3),
  CONSTRAINT "cash_sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "cash_movements" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "cash_session_id" UUID NOT NULL,
  "type" "CashMovementType" NOT NULL,
  "amount" DECIMAL(14,2) NOT NULL,
  "payment_method" TEXT NOT NULL,
  "note" TEXT NOT NULL,
  "order_id" UUID,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "cash_movements_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "parties" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "type" "PartyType" NOT NULL,
  "name" TEXT NOT NULL,
  "document" TEXT NOT NULL,
  "email" TEXT,
  "phone" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "parties_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "fiscal_settings" (
  "tenant_id" UUID NOT NULL,
  "state" CHAR(2) NOT NULL,
  "tax_regime" TEXT NOT NULL,
  "state_registration" TEXT NOT NULL,
  "city_code" TEXT NOT NULL,
  "nfe_series" INTEGER NOT NULL,
  "nfce_series" INTEGER NOT NULL,
  "environment" TEXT NOT NULL DEFAULT 'HOMOLOGATION',
  CONSTRAINT "fiscal_settings_pkey" PRIMARY KEY ("tenant_id")
);

CREATE INDEX "cash_sessions_tenant_id_status_idx" ON "cash_sessions"("tenant_id", "status");
CREATE INDEX "cash_movements_tenant_id_cash_session_id_created_at_idx" ON "cash_movements"("tenant_id", "cash_session_id", "created_at");
CREATE UNIQUE INDEX "parties_tenant_id_document_key" ON "parties"("tenant_id", "document");
CREATE INDEX "parties_tenant_id_type_idx" ON "parties"("tenant_id", "type");

ALTER TABLE "orders" ADD CONSTRAINT "orders_cash_session_id_fkey" FOREIGN KEY ("cash_session_id") REFERENCES "cash_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "cash_sessions" ADD CONSTRAINT "cash_sessions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "cash_sessions" ADD CONSTRAINT "cash_sessions_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "cash_movements" ADD CONSTRAINT "cash_movements_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "cash_movements" ADD CONSTRAINT "cash_movements_cash_session_id_fkey" FOREIGN KEY ("cash_session_id") REFERENCES "cash_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "parties" ADD CONSTRAINT "parties_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "fiscal_settings" ADD CONSTRAINT "fiscal_settings_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

DO $$ DECLARE table_name text; BEGIN
  FOREACH table_name IN ARRAY ARRAY['cash_sessions','cash_movements','parties','fiscal_settings'] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', table_name);
    EXECUTE format('CREATE POLICY tenant_isolation ON %I USING (tenant_id = nullif(current_setting(''app.tenant_id'', true), '''')::uuid) WITH CHECK (tenant_id = nullif(current_setting(''app.tenant_id'', true), '''')::uuid)', table_name);
  END LOOP;
END $$;
