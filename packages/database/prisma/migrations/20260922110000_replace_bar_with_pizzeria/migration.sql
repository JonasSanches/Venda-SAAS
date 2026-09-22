-- The previous generic "BAR" segment becomes the dedicated PIZZERIA segment.
-- Preserve tenant data while enabling the matching operational module.
UPDATE "tenants" SET "segment" = 'PIZZERIA' WHERE "segment" = 'BAR';

INSERT INTO "tenant_modules" ("id", "tenant_id", "module", "enabled", "created_at", "updated_at")
SELECT gen_random_uuid(), "id", 'PIZZERIA', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "tenants"
WHERE "segment" = 'PIZZERIA'
ON CONFLICT ("tenant_id", "module")
DO UPDATE SET "enabled" = true, "updated_at" = CURRENT_TIMESTAMP;

INSERT INTO "pizza_settings" ("tenant_id", "pricing_rule")
SELECT "id", 'HIGHEST_PRICE'::"PizzaPricingRule"
FROM "tenants"
WHERE "segment" = 'PIZZERIA'
ON CONFLICT ("tenant_id") DO NOTHING;
