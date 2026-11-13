import { createHmac } from 'node:crypto';
import { afterEach, describe, expect, it } from 'vitest';
import { verifyMercadoPagoWebhook } from './mercado-pago-webhook';
const original = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
afterEach(() => { if (original === undefined) delete process.env.MERCADO_PAGO_WEBHOOK_SECRET; else process.env.MERCADO_PAGO_WEBHOOK_SECRET = original; });
describe('Mercado Pago webhook signatures', () => {
  it('accepts an authentic signed notification and rejects a modified ID', () => {
    process.env.MERCADO_PAGO_WEBHOOK_SECRET = 'test-secret';
    const digest = createHmac('sha256', 'test-secret').update('id:123;request-id:req;ts:123456;').digest('hex');
    const signature = `ts=123456,v1=${digest}`;
    expect(() => verifyMercadoPagoWebhook('123', 'req', signature)).not.toThrow();
    expect(() => verifyMercadoPagoWebhook('124', 'req', signature)).toThrow();
    expect(() => verifyMercadoPagoWebhook('123', 'req', undefined)).toThrow();
    expect(() => verifyMercadoPagoWebhook(undefined, 'req', signature)).toThrow();
  });
  it('keeps legacy notifications working until the secret is configured', () => {
    delete process.env.MERCADO_PAGO_WEBHOOK_SECRET;
    expect(() => verifyMercadoPagoWebhook('123', 'req', undefined)).not.toThrow();
  });
});
