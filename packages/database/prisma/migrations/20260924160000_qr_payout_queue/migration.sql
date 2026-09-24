ALTER TABLE "tenants" ADD COLUMN "pix_key" TEXT, ADD COLUMN "pix_key_type" TEXT;
CREATE TYPE "QrCheckoutPayoutStatus" AS ENUM ('PENDING','PAID');
ALTER TABLE "qr_checkout_orders" ADD COLUMN "payout_status" "QrCheckoutPayoutStatus" NOT NULL DEFAULT 'PENDING', ADD COLUMN "paid_out_at" TIMESTAMP(3), ADD COLUMN "payout_reference" TEXT;
CREATE INDEX "qr_checkout_orders_payout_status_idx" ON "qr_checkout_orders"("payout_status","status","created_at");
