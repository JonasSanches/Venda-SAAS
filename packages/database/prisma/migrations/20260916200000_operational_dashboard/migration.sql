ALTER TABLE "tenants"
ADD COLUMN "delivery_alert_minutes" INTEGER NOT NULL DEFAULT 45;

ALTER TABLE "orders"
ADD COLUMN "delivered_at" TIMESTAMP(3);

ALTER TABLE "order_items"
ADD COLUMN "unit_cost" DECIMAL(14,4);

CREATE INDEX "orders_tenant_id_branch_id_channel_created_at_idx"
ON "orders"("tenant_id", "branch_id", "channel", "created_at");
