CREATE TYPE "TransportationLoadStatus" AS ENUM ('DRAFT', 'ARRIVED', 'DEPARTED', 'CLOSED');
CREATE TYPE "TransportationRecoveryType" AS ENUM ('DETENTION', 'LAYOVER', 'TONU', 'LUMPER');
CREATE TYPE "TransportationClaimStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'PAID', 'DENIED');

CREATE TABLE "transportation_loads" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "load_number" TEXT NOT NULL,
  "broker_name" TEXT NOT NULL,
  "broker_email" TEXT,
  "broker_phone" TEXT,
  "origin" TEXT,
  "destination" TEXT,
  "rate_confirmation_number" TEXT,
  "rate_confirmation_terms" TEXT,
  "rate_amount" DECIMAL(14,2),
  "detention_free_minutes" INTEGER NOT NULL DEFAULT 120,
  "detention_rate_per_hour" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "detention_minimum_minutes" INTEGER NOT NULL DEFAULT 0,
  "arrival_at" TIMESTAMP(3),
  "departure_at" TIMESTAMP(3),
  "status" "TransportationLoadStatus" NOT NULL DEFAULT 'DRAFT',
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "transportation_loads_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "transportation_loads_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "transportation_recovery_claims" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "load_id" UUID NOT NULL,
  "claim_number" TEXT NOT NULL,
  "type" "TransportationRecoveryType" NOT NULL DEFAULT 'DETENTION',
  "status" "TransportationClaimStatus" NOT NULL DEFAULT 'DRAFT',
  "elapsed_minutes" INTEGER NOT NULL DEFAULT 0,
  "billable_minutes" INTEGER NOT NULL DEFAULT 0,
  "rate_per_hour" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "calculated_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "requested_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
  "terms_snapshot" JSONB,
  "denial_reason" TEXT,
  "payment_reference" TEXT,
  "submitted_at" TIMESTAMP(3),
  "paid_at" TIMESTAMP(3),
  "denied_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "transportation_recovery_claims_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "transportation_recovery_claims_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "transportation_recovery_claims_load_id_fkey" FOREIGN KEY ("load_id") REFERENCES "transportation_loads"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "transportation_loads_tenant_id_load_number_key" ON "transportation_loads"("tenant_id", "load_number");
CREATE INDEX "transportation_loads_tenant_id_status_created_at_idx" ON "transportation_loads"("tenant_id", "status", "created_at");
CREATE UNIQUE INDEX "transportation_recovery_claims_load_id_type_key" ON "transportation_recovery_claims"("load_id", "type");
CREATE UNIQUE INDEX "transportation_recovery_claims_tenant_id_claim_number_key" ON "transportation_recovery_claims"("tenant_id", "claim_number");
CREATE INDEX "transportation_recovery_claims_tenant_id_status_created_at_idx" ON "transportation_recovery_claims"("tenant_id", "status", "created_at");

ALTER TABLE "transportation_loads" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "transportation_loads" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "transportation_loads"
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

ALTER TABLE "transportation_recovery_claims" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "transportation_recovery_claims" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "transportation_recovery_claims"
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
