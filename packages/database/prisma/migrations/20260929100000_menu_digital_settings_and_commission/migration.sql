ALTER TABLE "tenants"
  ADD COLUMN "qr_storefront_font" TEXT NOT NULL DEFAULT 'ARIAL',
  ADD COLUMN "qr_storefront_font_size" INTEGER NOT NULL DEFAULT 16,
  ADD COLUMN "qr_storefront_font_color" TEXT NOT NULL DEFAULT '#172033';

ALTER TABLE "qr_checkout_orders"
  ALTER COLUMN "platform_commission_rate" SET DEFAULT 0.07;
