CREATE TABLE "visitor_exclusions" (
  "ip_address" VARCHAR(64) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "visitor_exclusions_pkey" PRIMARY KEY ("ip_address")
);
