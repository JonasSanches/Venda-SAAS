ALTER TABLE "transportation_loads"
  ADD COLUMN "vehicle_capacity_tons" DECIMAL(12,3),
  ADD COLUMN "recovery_mode" VARCHAR(30) NOT NULL DEFAULT 'US_DETENTION';
