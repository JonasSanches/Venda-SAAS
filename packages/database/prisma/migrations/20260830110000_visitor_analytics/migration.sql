CREATE TABLE "visitor_events" (
  "id" BIGSERIAL NOT NULL,
  "visited_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ip_address" VARCHAR(64),
  "path" VARCHAR(300) NOT NULL,
  "referrer" VARCHAR(1000),
  "user_agent" VARCHAR(1000),
  "device" VARCHAR(30),
  "browser" VARCHAR(30),
  "operating_system" VARCHAR(30),
  "language" VARCHAR(120),
  "timezone" VARCHAR(120),
  "platform" VARCHAR(160),
  "screen_width" INTEGER,
  "screen_height" INTEGER,
  "viewport_width" INTEGER,
  "viewport_height" INTEGER,
  "country" VARCHAR(80),
  "region" VARCHAR(100),
  "city" VARCHAR(120),
  CONSTRAINT "visitor_events_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "visitor_events_visited_at_idx" ON "visitor_events" ("visited_at" DESC);
CREATE INDEX "visitor_events_ip_address_visited_at_idx" ON "visitor_events" ("ip_address", "visited_at");

CREATE TABLE "survey_responses" (
  "id" UUID NOT NULL,
  "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "name" VARCHAR(160) NOT NULL,
  "company" VARCHAR(200) NOT NULL,
  "contact" VARCHAR(200) NOT NULL,
  "language" VARCHAR(20),
  "ip_address" VARCHAR(64),
  "answers" JSONB NOT NULL,
  CONSTRAINT "survey_responses_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "survey_responses_submitted_at_idx" ON "survey_responses" ("submitted_at" DESC);
