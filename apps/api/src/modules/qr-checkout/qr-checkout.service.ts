import { BadGatewayException, BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { prisma, withTenant } from "@varejo/database";
import { randomBytes, randomUUID } from "node:crypto";
import { PushNotificationsService } from "../push-notifications/push-notifications.service";

const PLATFORM_COMMISSION_RATE = 0.07;
const money = (value: number) => Number(value.toFixed(2));

@Injectable()
export class QrCheckoutService {
  constructor(private readonly push: PushNotificationsService) {}
  private token() {
    const value = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    if (!value) throw new BadRequestException("Mercado Pago não configurado.");
    return value;
  }

  private base() {
    return (process.env.PUBLIC_APP_URL ?? "https://vendamais-app.com").replace(/\/$/, "");
  }

  private amounts(total: number) {
    const platformCommissionAmount = money(total * PLATFORM_COMMISSION_RATE);
    return { platformCommissionRate: PLATFORM_COMMISSION_RATE, platformCommissionAmount, merchantAmount: money(total - platformCommissionAmount) };
  }

  async links(tenantId: string) {
    return withTenant(tenantId, (tx) => tx.qrCheckoutLink.findMany({
      where: { tenantId }, include: { offers: true, _count: { select: { orders: true } } }, orderBy: { createdAt: "desc" },
    }));
  }
  async storefrontSettings(tenantId:string){const tenant=await prisma.tenant.findUniqueOrThrow({where:{id:tenantId},select:{qrStorefrontTemplate:true,qrStorefrontFont:true,qrStorefrontFontSize:true,qrStorefrontFontColor:true}});return{template:tenant.qrStorefrontTemplate,font:tenant.qrStorefrontFont,fontSize:tenant.qrStorefrontFontSize,fontColor:tenant.qrStorefrontFontColor}}
  async saveStorefrontSettings(tenantId:string,input:{template:"ACAI"|"SNACKS"|"SKATE"|"FRUITS";font:string;fontSize:number;fontColor:string}){return prisma.tenant.update({where:{id:tenantId},data:{qrStorefrontTemplate:input.template,qrStorefrontFont:input.font,qrStorefrontFontSize:input.fontSize,qrStorefrontFontColor:input.fontColor},select:{qrStorefrontTemplate:true,qrStorefrontFont:true,qrStorefrontFontSize:true,qrStorefrontFontColor:true}}).then(value=>({template:value.qrStorefrontTemplate,font:value.qrStorefrontFont,fontSize:value.qrStorefrontFontSize,fontColor:value.qrStorefrontFontColor}))}

  async dashboard(tenantId: string) {
    const [approved, pending, recent, payable] = await withTenant(tenantId, async (tx) => Promise.all([
      tx.qrCheckoutOrder.aggregate({
        where: { tenantId, status: "APPROVED" },
        _count: { _all: true }, _sum: { total: true, platformCommissionAmount: true, merchantAmount: true },
      }),
      tx.qrCheckoutOrder.count({ where: { tenantId, status: "PENDING" } }),
      tx.qrCheckoutOrder.findMany({
        where: { tenantId }, orderBy: { createdAt: "desc" }, take: 8,
        select: { id: true, buyerName: true, total: true, platformCommissionAmount: true, merchantAmount: true, status: true, createdAt: true, paidAt: true },
      }),
      tx.qrCheckoutOrder.aggregate({ where: { tenantId, status: "APPROVED", payoutStatus: "PENDING" }, _sum: { merchantAmount: true } }),
    ]));
    const number = (value: unknown) => Number(value ?? 0);
    return {
      commissionRate: PLATFORM_COMMISSION_RATE,
      approvedOrders: approved._count._all,
      pendingOrders: pending,
      grossSales: number(approved._sum.total),
      platformCommission: number(approved._sum.platformCommissionAmount),
      merchantBalance: number(payable._sum.merchantAmount),
      recent: recent.map((order) => ({ ...order, total: number(order.total), platformCommissionAmount: number(order.platformCommissionAmount), merchantAmount: number(order.merchantAmount) })),
    };
  }

  async create(tenantId: string, input: any) {
    const productIds = [...new Set<string>(input.offers.map((offer: any) => offer.productId).filter(Boolean))];
    if (productIds.length) {
      const products = await withTenant(tenantId, tx => tx.product.findMany({where:{tenantId,id:{in:productIds}},select:{id:true}}));
      if (products.length !== productIds.length) throw new NotFoundException("Produto não encontrado nesta empresa.");
    }
    if (!input.forceNew) {
      const existing = await withTenant(tenantId, (tx) => tx.qrCheckoutLink.findMany({ where: { tenantId, active: true }, include: { offers: { orderBy: { createdAt: "asc" } } } }));
      const same = existing.find((link) => link.name === input.name.trim() && link.deliveryEnabled === input.deliveryEnabled && link.addressRequired === (input.deliveryEnabled && input.addressRequired) && link.offers.length === input.offers.length && link.offers.every((offer, index) => {
        const next = input.offers[index];
        return offer.productId === (next.productId ?? null) && offer.title === next.title.trim() && (offer.description ?? null) === (next.description?.trim() || null) && Number(offer.price) === Number(next.price);
      }));
      if (same) return { ...same, reused: true, url: `${this.base()}/comprar/${same.token}` };
    }
    const value = await withTenant(tenantId, (tx) => tx.qrCheckoutLink.create({
      data: {
        tenantId, name: input.name.trim(), token: randomBytes(24).toString("base64url"),
        deliveryEnabled: input.deliveryEnabled, addressRequired: input.deliveryEnabled && input.addressRequired,
        offers: { create: input.offers.map((offer: any) => ({ productId: offer.productId ?? null, title: offer.title.trim(), description: offer.description?.trim() || null, price: offer.price })) },
      }, include: { offers: true },
    }));
    return { ...value, url: `${this.base()}/comprar/${value.token}` };
  }

  async remove(tenantId: string, id: string) {
    const item = await withTenant(tenantId, (tx) => tx.qrCheckoutLink.findFirst({ where: { id, tenantId } }));
    if (!item) throw new NotFoundException("QR de venda não encontrado.");
    await withTenant(tenantId, (tx) => tx.qrCheckoutLink.update({ where: { id, tenantId }, data: { active: false } }));
    return { ok: true };
  }

  async publicLink(token: string) {
    const item = await prisma.qrCheckoutLink.findFirst({
      where: { token, active: true, tenant: { status: { notIn: ["SUSPENDED", "CANCELLED"] } } },
      include: { tenant: { select: { name: true, logoDataUrl: true, phone: true, qrStorefrontTemplate: true, qrStorefrontFont:true, qrStorefrontFontSize:true, qrStorefrontFontColor:true } }, offers: { where: { active: true }, orderBy: { createdAt: "asc" }, include: { product: { select: { imageDataUrl: true, tenantId: true } } } } },
    });
    if (!item) throw new NotFoundException("Este QR Code não está disponível.");
    return { id: item.id, name: item.name, template:item.tenant.qrStorefrontTemplate, font:item.tenant.qrStorefrontFont,fontSize:item.tenant.qrStorefrontFontSize,fontColor:item.tenant.qrStorefrontFontColor, deliveryEnabled: item.deliveryEnabled, addressRequired: item.addressRequired, company: item.tenant, offers: item.offers.map((offer) => ({ id: offer.id, title: offer.title, description: offer.description, price: Number(offer.price), imageDataUrl: offer.product?.tenantId === item.tenantId ? offer.product.imageDataUrl : null })) };
  }

  async checkout(token: string, input: any) {
    const link = await prisma.qrCheckoutLink.findFirst({ where: { token, active: true, tenant: { status: { notIn: ["SUSPENDED", "CANCELLED"] } } }, include: { offers: { where: { active: true } } } });
    if (!link) throw new NotFoundException("QR Code não encontrado.");
    if (link.addressRequired && !input.deliveryAddress?.trim()) throw new BadRequestException("Informe o endereço para entrega.");
    const selected = new Map(input.items.map((item: any) => [item.offerId, item.quantity]));
    const items = link.offers.filter((offer) => selected.has(offer.id)).map((offer) => ({ offer, quantity: Number(selected.get(offer.id)) }));
    if (selected.size !== input.items.length || items.length !== selected.size || !items.length || items.some(item => !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 100000)) throw new BadRequestException("Selecione apenas itens válidos deste menu, sem repetições.");
    const productIds = [...new Set(items.map(item => item.offer.productId).filter((id):id is string => Boolean(id)))];
    if (productIds.length) {
      const products = await withTenant(link.tenantId, tx => tx.product.findMany({where:{tenantId:link.tenantId,id:{in:productIds}},select:{id:true}}));
      if (products.length !== productIds.length) throw new BadRequestException("Este menu contém um produto indisponível; entre em contato com a loja.");
    }
    const totalCents = items.reduce((sum, item) => sum + Math.round(Number(item.offer.price) * 100) * item.quantity, 0);
    if (!Number.isSafeInteger(totalCents) || totalCents <= 0 || totalCents > 99999999999999) throw new BadRequestException("Valor do pedido inválido.");
    const total = totalCents / 100;
    const externalReference = randomUUID();
    const order = await withTenant(link.tenantId, tx => tx.qrCheckoutOrder.create({ data: {
      tenantId: link.tenantId, linkId: link.id, externalReference, buyerName: input.buyerName.trim(), buyerEmail: input.buyerEmail?.trim() || null,
      buyerPhone: input.buyerPhone?.trim() || null, deliveryAddress: link.deliveryEnabled ? input.deliveryAddress?.trim() || null : null, total, ...this.amounts(total),
      items: { create: items.map((item) => ({ offerId: item.offer.id, productId: item.offer.productId, title: item.offer.title, quantity: item.quantity, unitPrice: item.offer.price, total: Number(item.offer.price) * item.quantity })) },
    } }));
    const callback = `${this.base()}/comprar/${token}?pedido=${order.id}`;
    const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST", headers: { Authorization: `Bearer ${this.token()}`, "Content-Type": "application/json", "X-Idempotency-Key": externalReference },
      body: JSON.stringify({
        items: items.map((item) => ({ id: item.offer.id, title: item.offer.title, description: item.offer.description ?? undefined, quantity: item.quantity, currency_id: "BRL", unit_price: Number(item.offer.price) })),
        payer: input.buyerEmail ? { email: input.buyerEmail } : undefined, external_reference: externalReference, notification_url: `${this.base()}/api/qr-checkout/webhook`,
        back_urls: { success: `${callback}&resultado=sucesso`, pending: `${callback}&resultado=pendente`, failure: `${callback}&resultado=falha` }, auto_return: "approved", statement_descriptor: "VENDAMAIS",
      }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new BadGatewayException(data.message ?? "Não foi possível iniciar o pagamento.");
    const checkoutUrl = process.env.MERCADO_PAGO_SANDBOX === "true" ? data.sandbox_init_point : data.init_point;
    if (!checkoutUrl) throw new BadGatewayException("Mercado Pago não retornou o endereço de pagamento.");
    return { checkoutUrl };
  }

  async webhook(paymentId: string) {
    if (!paymentId) return { received: true };
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`, { headers: { Authorization: `Bearer ${this.token()}` } });
    if (!response.ok) throw new BadGatewayException("Não foi possível validar o pagamento.");
    const data: any = await response.json();
    const order = await prisma.qrCheckoutOrder.findUnique({ where: { externalReference: String(data.external_reference ?? "") } });
    if (!order) return { received: true };
    if (String(data.id ?? "") !== paymentId || data.currency_id !== "BRL" || !Number.isFinite(Number(data.transaction_amount)) || Math.round(Number(data.transaction_amount) * 100) !== Math.round(Number(order.total) * 100)) throw new BadRequestException("Dados do pagamento não conferem.");
    const approved = data.status === "approved";
    const reversed = ["refunded", "charged_back", "cancelled"].includes(data.status);
    let newlyApproved = false;
    if (approved) {
      const result = await prisma.qrCheckoutOrder.updateMany({ where: { id: order.id, status: { in: ["PENDING", "REJECTED"] }, payoutStatus: "PENDING" }, data: { providerPaymentId: paymentId, status: "APPROVED", paidAt: new Date(data.date_approved ?? Date.now()) } });
      newlyApproved = result.count === 1;
    } else if (reversed) {
      await prisma.qrCheckoutOrder.updateMany({ where: { id: order.id, providerPaymentId: paymentId, status: "APPROVED" }, data: { status: "CANCELLED" } });
    } else {
      await prisma.qrCheckoutOrder.updateMany({ where: { id: order.id, status: { notIn: ["APPROVED", "CANCELLED"] }, payoutStatus: "PENDING" }, data: { providerPaymentId: paymentId, status: data.status === "rejected" ? "REJECTED" : "PENDING" } });
    }
    if (newlyApproved) {
      const [managerUsers, platformUsers] = await Promise.all([
        prisma.user.findMany({ where: { tenantId: order.tenantId, status: "ACTIVE", roles: { some: { role: { name: { in: ["ADMIN", "MANAGER"] } } } } }, select: { id: true } }),
        prisma.user.findMany({ where: { tenantId: "10000000-0000-4000-8000-000000000001", status: "ACTIVE", roles: { some: { role: { name: "PLATFORM_ADMIN" } } } }, select: { id: true } }),
      ]);
      const total = Number(order.total).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
      await Promise.all([
        this.push.sendToUsers(managerUsers.map((user) => user.id), { title: "Nova venda confirmada", body: `${order.buyerName} · ${total}`, url: "/#entrar", tag: `qr-sale-${order.id}` }),
        this.push.sendToUsers(platformUsers.map((user) => user.id), { title: "Nova venda no Menu Digital", body: `${total} · aguardando repasse`, url: "/admin", tag: `qr-payout-${order.id}` }),
      ]);
    }
    return { received: true };
  }
}
