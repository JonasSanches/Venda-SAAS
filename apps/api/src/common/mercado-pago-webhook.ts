import { Logger, UnauthorizedException } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'node:crypto';

const logger = new Logger('MercadoPagoWebhook');
let warned = false;
/** Verify Mercado Pago's signed notification when a signing secret is configured. */
export function verifyMercadoPagoWebhook(dataId: string | undefined, requestId: string | undefined, signature: string | undefined) {
  const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
  if (!secret) {
    if (!warned) { logger.warn('MERCADO_PAGO_WEBHOOK_SECRET não configurado: assinatura das notificações não está sendo verificada.'); warned = true; }
    return;
  }
  const parts = Object.fromEntries((signature ?? '').split(',').map(part => part.trim().split('=', 2)));
  const timestamp = parts.ts;
  const digest = parts.v1;
  if (!dataId || !requestId || !timestamp || !digest || !/^[a-fA-F0-9]{64}$/.test(digest)) throw new UnauthorizedException('Assinatura de notificação inválida.');
  const manifest = `${dataId ? `id:${dataId.toLowerCase()};` : ''}${requestId ? `request-id:${requestId};` : ''}ts:${timestamp};`;
  const expected = createHmac('sha256', secret).update(manifest).digest();
  if (!timingSafeEqual(expected, Buffer.from(digest, 'hex'))) throw new UnauthorizedException('Assinatura de notificação inválida.');
}
