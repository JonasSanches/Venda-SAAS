ALTER TABLE "parties"
  ALTER COLUMN "document" DROP NOT NULL,
  ADD COLUMN "address" TEXT,
  ADD COLUMN "notes" TEXT,
  ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "pizza_orders" ADD COLUMN "customer_id" UUID;

CREATE INDEX "pizza_orders_tenant_id_customer_id_idx"
  ON "pizza_orders"("tenant_id", "customer_id");

ALTER TABLE "pizza_orders"
  ADD CONSTRAINT "pizza_orders_customer_id_fkey"
  FOREIGN KEY ("customer_id") REFERENCES "parties"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
