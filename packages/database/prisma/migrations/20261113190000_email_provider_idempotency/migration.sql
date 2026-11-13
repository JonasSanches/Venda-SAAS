-- Existing deliveries retain their previous provider key for safe retries.
ALTER TABLE "email_campaign_recipients" ADD COLUMN "provider_idempotency_key" VARCHAR(100);
