CREATE TABLE "digital_purchases" (
  "id" UUID NOT NULL,
  "external_reference" TEXT NOT NULL,
  "download_token" TEXT NOT NULL,
  "product_slug" TEXT NOT NULL,
  "format" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "amount" DECIMAL(10,2) NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "provider_payment_id" TEXT,
  "preference_id" TEXT,
  "checkout_url" TEXT,
  "paid_at" TIMESTAMP(3),
  "download_count" INTEGER NOT NULL DEFAULT 0,
  "last_downloaded_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "digital_purchases_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "digital_purchases_external_reference_key" ON "digital_purchases"("external_reference");
CREATE UNIQUE INDEX "digital_purchases_download_token_key" ON "digital_purchases"("download_token");
CREATE INDEX "digital_purchases_email_created_at_idx" ON "digital_purchases"("email", "created_at");
CREATE INDEX "digital_purchases_status_idx" ON "digital_purchases"("status");
