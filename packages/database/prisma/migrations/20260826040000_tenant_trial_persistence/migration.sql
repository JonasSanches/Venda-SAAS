ALTER TYPE "TenantStatus" ADD VALUE IF NOT EXISTS 'EXPIRED';

ALTER TABLE "tenants"
  ADD COLUMN "state" CHAR(2),
  ADD COLUMN "city" TEXT,
  ADD COLUMN "segment" TEXT,
  ADD COLUMN "phone" TEXT,
  ADD COLUMN "logo_data_url" TEXT,
  ADD COLUMN "trial_starts_at" TIMESTAMP(3),
  ADD COLUMN "trial_expires_at" TIMESTAMP(3);

DROP INDEX IF EXISTS "users_tenant_id_email_key";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
