CREATE TABLE "billing_payments" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "external_reference" TEXT NOT NULL,
  "provider_payment_id" TEXT,
  "preference_id" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "payment_method" TEXT,
  "amount" DECIMAL(14,2) NOT NULL,
  "checkout_url" TEXT,
  "paid_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "billing_payments_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "billing_payments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "billing_payments_external_reference_key" ON "billing_payments"("external_reference");
CREATE INDEX "billing_payments_tenant_id_created_at_idx" ON "billing_payments"("tenant_id", "created_at");
CREATE INDEX "billing_payments_status_idx" ON "billing_payments"("status");
