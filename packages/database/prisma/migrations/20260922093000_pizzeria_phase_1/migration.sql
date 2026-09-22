-- Pizzeria Phase 1 is additive. Existing products and sales stay untouched until
-- a tenant explicitly enables the PIZZERIA module.
CREATE TYPE "ProductKind" AS ENUM ('STANDARD', 'PIZZA');
CREATE TYPE "PizzaPricingRule" AS ENUM ('HIGHEST_PRICE', 'AVERAGE', 'PROPORTIONAL');
CREATE TYPE "PizzaModifierKind" AS ENUM ('ADDITION', 'REMOVAL');

ALTER TABLE "products" ADD COLUMN "kind" "ProductKind" NOT NULL DEFAULT 'STANDARD';

CREATE TABLE "tenant_modules" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "module" VARCHAR(80) NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT false,
  "settings" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "tenant_modules_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "tenant_modules_tenant_id_module_key" ON "tenant_modules"("tenant_id", "module");
CREATE INDEX "tenant_modules_tenant_id_enabled_idx" ON "tenant_modules"("tenant_id", "enabled");
ALTER TABLE "tenant_modules" ADD CONSTRAINT "tenant_modules_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "pizza_settings" (
  "tenant_id" UUID NOT NULL,
  "pricing_rule" "PizzaPricingRule" NOT NULL DEFAULT 'HIGHEST_PRICE',
  CONSTRAINT "pizza_settings_pkey" PRIMARY KEY ("tenant_id")
);
ALTER TABLE "pizza_settings" ADD CONSTRAINT "pizza_settings_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "pizza_sizes" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "name" VARCHAR(80) NOT NULL,
  "max_flavors" INTEGER NOT NULL DEFAULT 1,
  "serves" INTEGER,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "pizza_sizes_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "pizza_sizes_tenant_id_name_key" ON "pizza_sizes"("tenant_id", "name");
CREATE INDEX "pizza_sizes_tenant_id_active_idx" ON "pizza_sizes"("tenant_id", "active");
ALTER TABLE "pizza_sizes" ADD CONSTRAINT "pizza_sizes_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "pizza_flavors" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "tenant_id" UUID NOT NULL, "name" VARCHAR(120) NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true, "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL, CONSTRAINT "pizza_flavors_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "pizza_flavors_tenant_id_name_key" ON "pizza_flavors"("tenant_id", "name");
CREATE INDEX "pizza_flavors_tenant_id_active_idx" ON "pizza_flavors"("tenant_id", "active");
ALTER TABLE "pizza_flavors" ADD CONSTRAINT "pizza_flavors_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "pizza_doughs" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "tenant_id" UUID NOT NULL, "name" VARCHAR(80) NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true, "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL, CONSTRAINT "pizza_doughs_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "pizza_doughs_tenant_id_name_key" ON "pizza_doughs"("tenant_id", "name");
ALTER TABLE "pizza_doughs" ADD CONSTRAINT "pizza_doughs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "pizza_crusts" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "tenant_id" UUID NOT NULL, "name" VARCHAR(80) NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true, "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL, CONSTRAINT "pizza_crusts_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "pizza_crusts_tenant_id_name_key" ON "pizza_crusts"("tenant_id", "name");
ALTER TABLE "pizza_crusts" ADD CONSTRAINT "pizza_crusts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "pizza_modifiers" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "tenant_id" UUID NOT NULL, "name" VARCHAR(120) NOT NULL,
  "kind" "PizzaModifierKind" NOT NULL, "price" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "active" BOOLEAN NOT NULL DEFAULT true, "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL, CONSTRAINT "pizza_modifiers_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "pizza_modifiers_tenant_id_name_kind_key" ON "pizza_modifiers"("tenant_id", "name", "kind");
CREATE INDEX "pizza_modifiers_tenant_id_kind_active_idx" ON "pizza_modifiers"("tenant_id", "kind", "active");
ALTER TABLE "pizza_modifiers" ADD CONSTRAINT "pizza_modifiers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "pizza_products" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "tenant_id" UUID NOT NULL, "product_id" UUID NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true, "available_from" VARCHAR(5), "available_to" VARCHAR(5),
  CONSTRAINT "pizza_products_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "pizza_products_product_id_key" ON "pizza_products"("product_id");
CREATE UNIQUE INDEX "pizza_products_tenant_id_product_id_key" ON "pizza_products"("tenant_id", "product_id");
CREATE INDEX "pizza_products_tenant_id_active_idx" ON "pizza_products"("tenant_id", "active");
ALTER TABLE "pizza_products" ADD CONSTRAINT "pizza_products_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pizza_products" ADD CONSTRAINT "pizza_products_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "pizza_product_sizes" ("tenant_id" UUID NOT NULL, "pizza_product_id" UUID NOT NULL, "size_id" UUID NOT NULL, "price" DECIMAL(14,2) NOT NULL, CONSTRAINT "pizza_product_sizes_pkey" PRIMARY KEY ("pizza_product_id", "size_id"));
CREATE INDEX "pizza_product_sizes_tenant_id_idx" ON "pizza_product_sizes"("tenant_id");
ALTER TABLE "pizza_product_sizes" ADD CONSTRAINT "pizza_product_sizes_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pizza_product_sizes" ADD CONSTRAINT "pizza_product_sizes_pizza_product_id_fkey" FOREIGN KEY ("pizza_product_id") REFERENCES "pizza_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pizza_product_sizes" ADD CONSTRAINT "pizza_product_sizes_size_id_fkey" FOREIGN KEY ("size_id") REFERENCES "pizza_sizes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "pizza_product_flavors" ("tenant_id" UUID NOT NULL, "pizza_product_id" UUID NOT NULL, "flavor_id" UUID NOT NULL, "price" DECIMAL(14,2) NOT NULL, CONSTRAINT "pizza_product_flavors_pkey" PRIMARY KEY ("pizza_product_id", "flavor_id"));
CREATE INDEX "pizza_product_flavors_tenant_id_idx" ON "pizza_product_flavors"("tenant_id");
ALTER TABLE "pizza_product_flavors" ADD CONSTRAINT "pizza_product_flavors_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pizza_product_flavors" ADD CONSTRAINT "pizza_product_flavors_pizza_product_id_fkey" FOREIGN KEY ("pizza_product_id") REFERENCES "pizza_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pizza_product_flavors" ADD CONSTRAINT "pizza_product_flavors_flavor_id_fkey" FOREIGN KEY ("flavor_id") REFERENCES "pizza_flavors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "pizza_dough_sizes" ("tenant_id" UUID NOT NULL, "dough_id" UUID NOT NULL, "size_id" UUID NOT NULL, "price" DECIMAL(14,2) NOT NULL DEFAULT 0, CONSTRAINT "pizza_dough_sizes_pkey" PRIMARY KEY ("dough_id", "size_id"));
CREATE INDEX "pizza_dough_sizes_tenant_id_idx" ON "pizza_dough_sizes"("tenant_id");
ALTER TABLE "pizza_dough_sizes" ADD CONSTRAINT "pizza_dough_sizes_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pizza_dough_sizes" ADD CONSTRAINT "pizza_dough_sizes_dough_id_fkey" FOREIGN KEY ("dough_id") REFERENCES "pizza_doughs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pizza_dough_sizes" ADD CONSTRAINT "pizza_dough_sizes_size_id_fkey" FOREIGN KEY ("size_id") REFERENCES "pizza_sizes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "pizza_crust_sizes" ("tenant_id" UUID NOT NULL, "crust_id" UUID NOT NULL, "size_id" UUID NOT NULL, "price" DECIMAL(14,2) NOT NULL DEFAULT 0, CONSTRAINT "pizza_crust_sizes_pkey" PRIMARY KEY ("crust_id", "size_id"));
CREATE INDEX "pizza_crust_sizes_tenant_id_idx" ON "pizza_crust_sizes"("tenant_id");
ALTER TABLE "pizza_crust_sizes" ADD CONSTRAINT "pizza_crust_sizes_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pizza_crust_sizes" ADD CONSTRAINT "pizza_crust_sizes_crust_id_fkey" FOREIGN KEY ("crust_id") REFERENCES "pizza_crusts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pizza_crust_sizes" ADD CONSTRAINT "pizza_crust_sizes_size_id_fkey" FOREIGN KEY ("size_id") REFERENCES "pizza_sizes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "pizza_product_modifiers" ("tenant_id" UUID NOT NULL, "pizza_product_id" UUID NOT NULL, "modifier_id" UUID NOT NULL, CONSTRAINT "pizza_product_modifiers_pkey" PRIMARY KEY ("pizza_product_id", "modifier_id"));
CREATE INDEX "pizza_product_modifiers_tenant_id_idx" ON "pizza_product_modifiers"("tenant_id");
ALTER TABLE "pizza_product_modifiers" ADD CONSTRAINT "pizza_product_modifiers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pizza_product_modifiers" ADD CONSTRAINT "pizza_product_modifiers_pizza_product_id_fkey" FOREIGN KEY ("pizza_product_id") REFERENCES "pizza_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pizza_product_modifiers" ADD CONSTRAINT "pizza_product_modifiers_modifier_id_fkey" FOREIGN KEY ("modifier_id") REFERENCES "pizza_modifiers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
