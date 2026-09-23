CREATE TYPE "PizzaProductionStatus" AS ENUM ('NEW', 'PREPARING', 'OVEN', 'READY', 'OUT_FOR_DELIVERY', 'COMPLETED', 'CANCELLED');

CREATE TABLE "pizza_orders" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "number" INTEGER NOT NULL,
  "status" "PizzaProductionStatus" NOT NULL DEFAULT 'NEW',
  "service_type" VARCHAR(30) NOT NULL DEFAULT 'COUNTER',
  "payment_state" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  "customer_name" VARCHAR(160),
  "customer_phone" VARCHAR(40),
  "address" TEXT,
  "notes" TEXT,
  "total" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "pizza_orders_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "pizza_orders_tenant_id_number_key" ON "pizza_orders"("tenant_id", "number");
CREATE INDEX "pizza_orders_tenant_id_status_created_at_idx" ON "pizza_orders"("tenant_id", "status", "created_at");
ALTER TABLE "pizza_orders" ADD CONSTRAINT "pizza_orders_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "pizza_order_items" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "pizza_order_id" UUID NOT NULL,
  "pizza_product_id" UUID NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "unit_price" DECIMAL(14,2) NOT NULL,
  "total" DECIMAL(14,2) NOT NULL,
  "selection" JSONB NOT NULL,
  CONSTRAINT "pizza_order_items_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "pizza_order_items_tenant_id_pizza_order_id_idx" ON "pizza_order_items"("tenant_id", "pizza_order_id");
ALTER TABLE "pizza_order_items" ADD CONSTRAINT "pizza_order_items_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pizza_order_items" ADD CONSTRAINT "pizza_order_items_pizza_order_id_fkey" FOREIGN KEY ("pizza_order_id") REFERENCES "pizza_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pizza_order_items" ADD CONSTRAINT "pizza_order_items_pizza_product_id_fkey" FOREIGN KEY ("pizza_product_id") REFERENCES "pizza_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "pizza_orders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "pizza_orders" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "pizza_orders"
  USING ("tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK ("tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid);

ALTER TABLE "pizza_order_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "pizza_order_items" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "pizza_order_items"
  USING ("tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK ("tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid);
