import 'reflect-metadata';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({
  billingPayment:{findUnique:vi.fn(),findUniqueOrThrow:vi.fn(),update:vi.fn()},
  tenant:{findUniqueOrThrow:vi.fn(),update:vi.fn()},
  $executeRaw:vi.fn(), $transaction:vi.fn(),
}));
vi.mock('@varejo/database', () => ({prisma:state}));
import { BillingService } from './billing.service';
let original: string|undefined;
beforeEach(() => {
  vi.resetAllMocks(); original=process.env.MERCADO_PAGO_ACCESS_TOKEN;process.env.MERCADO_PAGO_ACCESS_TOKEN='test';
  state.billingPayment.findUnique.mockResolvedValue({id:'payment',tenantId:'company-a',amount:129,plan:'ESSENTIAL:MONTHLY'});
  state.billingPayment.findUniqueOrThrow.mockResolvedValueOnce({status:'PENDING',paidAt:null}).mockResolvedValue({status:'APPROVED',providerPaymentId:'123',paidAt:new Date()});
  state.tenant.findUniqueOrThrow.mockResolvedValue({subscriptionExpiresAt:null});state.$transaction.mockImplementation(async (work) => work(state));
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>({id:'123',external_reference:'ref',currency_id:'BRL',transaction_amount:129,status:'approved'})}));
});
afterEach(()=>{vi.unstubAllGlobals();if(original===undefined)delete process.env.MERCADO_PAGO_ACCESS_TOKEN;else process.env.MERCADO_PAGO_ACCESS_TOKEN=original});
describe('billing notifications',()=>{
  it('extends the correct company only once on repeated approval',async()=>{
    const service=new BillingService();await service.webhook('123');await service.webhook('123');
    expect(state.$executeRaw).toHaveBeenCalledTimes(2);
    expect(state.tenant.update).toHaveBeenCalledTimes(1);
    expect(state.tenant.update.mock.calls[0][0].where).toEqual({id:'company-a'});
  });
  it('rejects a provider response for a different payment',async()=>{
    await expect(new BillingService().webhook('456')).rejects.toThrow('não conferem');
    expect(state.$transaction).not.toHaveBeenCalled();
  });
});
