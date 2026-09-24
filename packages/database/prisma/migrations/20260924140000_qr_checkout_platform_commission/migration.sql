-- Venda por QR Code: comissão fixa da plataforma, calculada sobre o valor bruto
-- de cada pedido. O repasse automático requer que cada estabelecimento conecte
-- sua própria conta do Mercado Pago (Marketplace/OAuth); estes campos mantêm a
-- apuração financeira auditável desde já.
ALTER TABLE "qr_checkout_orders"
  ADD COLUMN "platform_commission_rate" DECIMAL(5,4) NOT NULL DEFAULT 0.12,
  ADD COLUMN "platform_commission_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN "merchant_amount" DECIMAL(14,2) NOT NULL DEFAULT 0;

UPDATE "qr_checkout_orders"
SET
  "platform_commission_amount" = ROUND("total" * 0.12, 2),
  "merchant_amount" = "total" - ROUND("total" * 0.12, 2)
WHERE "platform_commission_amount" = 0 AND "merchant_amount" = 0;
