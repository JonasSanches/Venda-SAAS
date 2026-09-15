CREATE TABLE "library_memberships" (
  "id" UUID NOT NULL,
  "email" TEXT NOT NULL,
  "password_hash" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "amount" DECIMAL(10,2) NOT NULL DEFAULT 59.90,
  "external_reference" TEXT NOT NULL,
  "checkout_token" TEXT NOT NULL,
  "provider_payment_id" TEXT,
  "preference_id" TEXT,
  "checkout_url" TEXT,
  "payment_method" TEXT,
  "paid_at" TIMESTAMP(3),
  "session_version" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "library_memberships_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "library_memberships_email_key" ON "library_memberships"("email");
CREATE UNIQUE INDEX "library_memberships_external_reference_key" ON "library_memberships"("external_reference");
CREATE UNIQUE INDEX "library_memberships_checkout_token_key" ON "library_memberships"("checkout_token");
CREATE INDEX "library_memberships_status_idx" ON "library_memberships"("status");
CREATE INDEX "library_memberships_email_created_at_idx" ON "library_memberships"("email", "created_at");
