import { BadGatewayException, BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@varejo/database";
import { randomUUID } from "node:crypto";

const PLANS = {
  ESSENTIAL:{code:"ESSENTIAL",name:"Essencial",amount:129,features:["Vendas, caixa e estoque","1 filial e até 3 usuários","Suporte 24 horas"]},
  PERFORMANCE:{code:"PERFORMANCE",name:"Performance",amount:249,features:["Tudo do Essencial","Até 3 filiais e 10 usuários","Painéis gerenciais e suporte prioritário"]},
  SCALE:{code:"SCALE",name:"Escala",amount:499,features:["Tudo do Performance","Até 10 filiais e 50 usuários","Acompanhamento dedicado"]}
} as const;
type PlanCode=keyof typeof PLANS;

@Injectable()
export class BillingService{
  private token(){const value=process.env.MERCADO_PAGO_ACCESS_TOKEN;if(!value)throw new BadRequestException("Pagamento temporariamente indisponível: Mercado Pago não configurado");return value}
  async publicInfo(tenantId:string){const tenant=await prisma.tenant.findUnique({where:{id:tenantId},select:{id:true,name:true,status:true,subscriptionPlan:true,subscriptionExpiresAt:true}});if(!tenant)throw new NotFoundException("Empresa não encontrada");return{...tenant,plans:Object.values(PLANS),methods:["Pix","Cartão de crédito","Cartão de débito","Boleto"]}}
  async checkout(tenantId:string,planCode:PlanCode,email?:string){
    const plan=PLANS[planCode];if(!plan)throw new BadRequestException("Plano inválido");
    const tenant=await prisma.tenant.findUnique({where:{id:tenantId},select:{id:true,name:true}});if(!tenant)throw new NotFoundException("Empresa não encontrada");
    const externalReference=randomUUID(),base=(process.env.PUBLIC_APP_URL??"https://www.vendamais-app.com").replace(/\/$/,"");
    const payment=await prisma.billingPayment.create({data:{tenantId,externalReference,amount:plan.amount,plan:plan.code}}),callback=`${base}/pagamento?cliente=${tenantId}&plano=${plan.code}`;
    const response=await fetch("https://api.mercadopago.com/checkout/preferences",{method:"POST",headers:{Authorization:`Bearer ${this.token()}`,"Content-Type":"application/json","X-Idempotency-Key":externalReference},body:JSON.stringify({items:[{id:`vendamais-${plan.code.toLowerCase()}`,title:`Venda+ - Plano ${plan.name}`,description:`30 dias de acesso para ${tenant.name}`,quantity:1,currency_id:"BRL",unit_price:plan.amount}],payer:email?{email}:undefined,external_reference:externalReference,notification_url:`${base}/api/billing/webhook`,back_urls:{success:`${callback}&resultado=sucesso`,pending:`${callback}&resultado=pendente`,failure:`${callback}&resultado=falha`},auto_return:"approved",statement_descriptor:"VENDAMAIS"})});
    const data=await response.json().catch(()=>({}));if(!response.ok){await prisma.billingPayment.update({where:{id:payment.id},data:{status:"ERROR"}});throw new BadGatewayException(data?.message??"Mercado Pago não iniciou o pagamento")}
    const checkoutUrl=process.env.MERCADO_PAGO_SANDBOX==="true"?data.sandbox_init_point:data.init_point;if(!checkoutUrl)throw new BadGatewayException("Mercado Pago não retornou o endereço de pagamento");
    await prisma.billingPayment.update({where:{id:payment.id},data:{preferenceId:data.id,checkoutUrl}});return{checkoutUrl,externalReference};
  }
  async webhook(paymentId:string){
    if(!paymentId)return{received:true};
    const response=await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`,{headers:{Authorization:`Bearer ${this.token()}`}});if(!response.ok)throw new BadGatewayException("Não foi possível validar o pagamento");
    const data=await response.json(),reference=String(data.external_reference??""),providerId=String(data.id??"");
    const payment=await prisma.billingPayment.findUnique({where:{externalReference:reference}});if(!payment)return{received:true};
    if(Number(data.transaction_amount)!==Number(payment.amount))throw new BadRequestException("Valor do pagamento não confere");
    await prisma.$transaction(async tx=>{
      const current=await tx.billingPayment.findUniqueOrThrow({where:{id:payment.id}}),approved=data.status==="approved",firstApproval=approved&&current.status!=="APPROVED";
      await tx.billingPayment.update({where:{id:payment.id},data:{providerPaymentId:providerId,status:String(data.status).toUpperCase(),paymentMethod:String(data.payment_type_id??data.payment_method_id??""),paidAt:approved?new Date(data.date_approved??Date.now()):current.paidAt}});
      if(firstApproval){const tenant=await tx.tenant.findUniqueOrThrow({where:{id:payment.tenantId},select:{subscriptionExpiresAt:true}}),now=new Date(),base=tenant.subscriptionExpiresAt&&tenant.subscriptionExpiresAt>now?tenant.subscriptionExpiresAt:now,expiresAt=new Date(base.getTime()+30*86_400_000);await tx.tenant.update({where:{id:payment.tenantId},data:{status:"ACTIVE",subscriptionPlan:payment.plan,subscriptionExpiresAt:expiresAt}})}
    });
    return{received:true};
  }
}
