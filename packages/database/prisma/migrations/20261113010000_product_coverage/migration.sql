ALTER TABLE "products" ADD COLUMN "coverage_m2" DECIMAL(12, 3);
ALTER TABLE "products" ADD CONSTRAINT "products_coverage_m2_positive" CHECK ("coverage_m2" IS NULL OR "coverage_m2" > 0);
