ALTER TABLE "tenants" ADD COLUMN "subscription_plan" TEXT;
ALTER TABLE "tenants" ADD COLUMN "subscription_expires_at" TIMESTAMP(3);
ALTER TABLE "billing_payments" ADD COLUMN "plan" TEXT;
