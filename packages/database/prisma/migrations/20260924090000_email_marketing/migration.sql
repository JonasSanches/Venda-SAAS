-- E-mail marketing is tenant-scoped. The migration only creates new tables and
-- enums; rollback is safe by dropping these tables in reverse dependency order.
CREATE TYPE "EmailContactStatus" AS ENUM ('ACTIVE','UNSUBSCRIBED','BOUNCED','BLOCKED');
CREATE TYPE "EmailCampaignStatus" AS ENUM ('DRAFT','SCHEDULED','PROCESSING','PAUSED','SENT','CANCELED','FAILED');
CREATE TYPE "EmailRecipientStatus" AS ENUM ('QUEUED','SENDING','SENT','DELIVERED','OPENED','CLICKED','BOUNCED','FAILED','UNSUBSCRIBED');

CREATE TABLE "email_contacts" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "tenant_id" UUID NOT NULL,
  "first_name" VARCHAR(120), "last_name" VARCHAR(120), "email" VARCHAR(320) NOT NULL,
  "phone" VARCHAR(40), "company" VARCHAR(160), "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "source" VARCHAR(120), "notes" TEXT, "status" "EmailContactStatus" NOT NULL DEFAULT 'ACTIVE',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "email_contacts_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "email_contacts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "email_contacts_tenant_id_email_key" ON "email_contacts"("tenant_id","email");
CREATE INDEX "email_contacts_tenant_id_status_created_at_idx" ON "email_contacts"("tenant_id","status","created_at");
CREATE INDEX "email_contacts_tenant_id_company_idx" ON "email_contacts"("tenant_id","company");

CREATE TABLE "email_lists" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "tenant_id" UUID NOT NULL, "name" VARCHAR(160) NOT NULL,
  "description" TEXT, "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "email_lists_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "email_lists_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "email_lists_tenant_id_name_key" ON "email_lists"("tenant_id","name");
CREATE INDEX "email_lists_tenant_id_created_at_idx" ON "email_lists"("tenant_id","created_at");

CREATE TABLE "email_list_members" (
  "email_list_id" UUID NOT NULL, "email_contact_id" UUID NOT NULL, "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "email_list_members_pkey" PRIMARY KEY ("email_list_id","email_contact_id"),
  CONSTRAINT "email_list_members_email_list_id_fkey" FOREIGN KEY ("email_list_id") REFERENCES "email_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "email_list_members_email_contact_id_fkey" FOREIGN KEY ("email_contact_id") REFERENCES "email_contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "email_list_members_email_contact_id_idx" ON "email_list_members"("email_contact_id");

CREATE TABLE "email_templates" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "tenant_id" UUID NOT NULL, "name" VARCHAR(160) NOT NULL,
  "subject" VARCHAR(250), "html" TEXT NOT NULL, "text" TEXT, "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "email_templates_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "email_templates_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "email_templates_tenant_id_name_key" ON "email_templates"("tenant_id","name");
CREATE INDEX "email_templates_tenant_id_updated_at_idx" ON "email_templates"("tenant_id","updated_at");

CREATE TABLE "email_campaigns" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "tenant_id" UUID NOT NULL, "list_id" UUID,
  "name" VARCHAR(180) NOT NULL, "subject" VARCHAR(250) NOT NULL, "from_name" VARCHAR(160) NOT NULL, "from_email" VARCHAR(320) NOT NULL,
  "reply_to" VARCHAR(320), "html" TEXT NOT NULL, "text" TEXT, "segment" JSONB, "scheduled_at" TIMESTAMP(3),
  "status" "EmailCampaignStatus" NOT NULL DEFAULT 'DRAFT', "started_at" TIMESTAMP(3), "completed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "email_campaigns_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "email_campaigns_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "email_campaigns_list_id_fkey" FOREIGN KEY ("list_id") REFERENCES "email_lists"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "email_campaigns_tenant_id_status_scheduled_at_idx" ON "email_campaigns"("tenant_id","status","scheduled_at");

CREATE TABLE "email_campaign_recipients" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "tenant_id" UUID NOT NULL, "campaign_id" UUID NOT NULL, "contact_id" UUID NOT NULL,
  "email" VARCHAR(320) NOT NULL, "provider_message_id" VARCHAR(250), "status" "EmailRecipientStatus" NOT NULL DEFAULT 'QUEUED',
  "attempts" INTEGER NOT NULL DEFAULT 0, "available_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "sent_at" TIMESTAMP(3), "delivered_at" TIMESTAMP(3), "opened_at" TIMESTAMP(3), "clicked_at" TIMESTAMP(3), "bounced_at" TIMESTAMP(3), "failed_at" TIMESTAMP(3), "unsubscribed_at" TIMESTAMP(3), "error_message" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "email_campaign_recipients_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "email_campaign_recipients_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "email_campaign_recipients_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "email_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "email_campaign_recipients_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "email_contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "email_campaign_recipients_campaign_id_contact_id_key" ON "email_campaign_recipients"("campaign_id","contact_id");
CREATE INDEX "email_campaign_recipients_tenant_id_status_available_at_idx" ON "email_campaign_recipients"("tenant_id","status","available_at");
CREATE INDEX "email_campaign_recipients_provider_message_id_idx" ON "email_campaign_recipients"("provider_message_id");

CREATE TABLE "email_provider_events" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "tenant_id" UUID NOT NULL, "recipient_id" UUID,
  "provider_event_id" VARCHAR(250), "provider_message_id" VARCHAR(250), "event_type" VARCHAR(80) NOT NULL, "payload" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "email_provider_events_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "email_provider_events_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "email_provider_events_tenant_id_provider_event_id_key" ON "email_provider_events"("tenant_id","provider_event_id");
CREATE INDEX "email_provider_events_tenant_id_created_at_idx" ON "email_provider_events"("tenant_id","created_at");

CREATE TABLE "email_marketing_settings" (
  "tenant_id" UUID NOT NULL, "from_name" VARCHAR(160), "from_email" VARCHAR(320), "reply_to" VARCHAR(320),
  "rate_per_minute" INTEGER NOT NULL DEFAULT 60, "timezone" VARCHAR(80) NOT NULL DEFAULT 'America/Sao_Paulo', "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "email_marketing_settings_pkey" PRIMARY KEY ("tenant_id"),
  CONSTRAINT "email_marketing_settings_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Rollback (execute manually only if the module has not been used):
-- DROP TABLE "email_marketing_settings","email_provider_events","email_campaign_recipients","email_campaigns","email_templates","email_list_members","email_lists","email_contacts";
-- DROP TYPE "EmailRecipientStatus","EmailCampaignStatus","EmailContactStatus";
