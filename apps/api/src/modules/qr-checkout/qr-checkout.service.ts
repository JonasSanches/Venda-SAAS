import { BadGatewayException, BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { prisma, withTenant } from "@varejo/database";
import { randomBytes, randomUUID } from "node:crypto";

const PLATFORM_COMMISSION_RATE = 0.12;
const money = (value: number) => Number(value.toFixed(2));

@Injectable()
export class QrCheckoutService {
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

  async dashboard(tenantId: string) {
    const [approved, pending, recent] = await withTenant(tenantId, async (tx) => Promise.all([
      tx.qrCheckoutOrder.aggregate({
        where: { tenantId, status: "APPROVED" },
        _count: { _all: true }, _sum: { total: true, platformCommissionAmount: true, merchantAmount: true },
      }),
      tx.qrCheckoutOrder.count({ where: { tenantId, status: "PENDING" } }),
      tx.qrCheckoutOrder.findMany({
        where: { tenantId }, orderBy: { createdAt: "desc" }, take: 8,
        select: { id: true, buyerName: true, total: true, platformCommissionAmount: true, merchantAmount: true, status: true, createdAt: true, paidAt: true },
      }),
    ]));
    const number = (value: unknown) => Number(value ?? 0);
    return {
      commissionRate: PLATFORM_COMMISSION_RATE,
      approvedOrders: approved._count._all,
      pendingOrders: pending,
      grossSales: number(approved._sum.total),
      platformCommission: number(approved._sum.platformCommissionAmount),
      merchantBalance: number(approved._sum.merchantAmount),
      recent: recent.map((order) => ({ ...order, total: number(order.total), platformCommissionAmount: number(order.platformCommissionAmount), merchantAmount: number(order.merchantAmount) })),
    };
  }

  async create(tenantId: string, input: any) {
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
    await withTenant(tenantId, (tx) => tx.qrCheckoutLink.update({ where: { id }, data: { active: false } }));
    return { ok: true };
  }

  async publicLink(token: string) {
    const item = await prisma.qrCheckoutLink.findFirst({
      where: { token, active: true },
      include: { tenant: { select: { name: true, logoDataUrl: true, phone: true } }, offers: { where: { active: true }, orderBy: { createdAt: "asc" }, include: { product: { select: { imageDataUrl: true } } } } },
    });
    if (!item) throw new NotFoundException("Este QR Code não está disponível.");
    return { id: item.id, name: item.name, deliveryEnabled: item.deliveryEnabled, addressRequired: item.addressRequired, company: item.tenant, offers: item.offers.map((offer) => ({ id: offer.id, title: offer.title, description: offer.description, price: Number(offer.price), imageDataUrl: offer.product?.imageDataUrl ?? null })) };
  }

  async checkout(token: string, input: any) {
    const link = await prisma.qrCheckoutLink.findFirst({ where: { token, active: true }, include: { offers: { where: { active: true } } } });
    if (!link) throw new NotFoundException("QR Code não encontrado.");
    if (link.addressRequired && !input.deliveryAddress?.trim()) throw new BadRequestException("Informe o endereço para entrega.");
    const selected = new Map(input.items.map((item: any) => [item.offerId, item.quantity]));
    const items = link.offers.filter((offer) => selected.has(offer.id)).map((offer) => ({ offer, quantity: Number(selected.get(offer.id)) }));
    if (!items.length || items.some((item) => !Number.isInteger(item.quantity) || item.quantity < 1)) throw new BadRequestException("Selecione itens válidos.");
    const total = money(items.reduce((sum, item) => sum + Number(item.offer.price) * item.quantity, 0));
    const externalReference = randomUUID();
    const order = await prisma.qrCheckoutOrder.create({ data: {
      tenantId: link.tenantId, linkId: link.id, externalReference, buyerName: input.buyerName.trim(), buyerEmail: input.buyerEmail?.trim() || null,
      buyerPhone: input.buyerPhone?.trim() || null, deliveryAddress: link.deliveryEnabled ? input.deliveryAddress?.trim() || null : null, total, ...this.amounts(total),
      items: { create: items.map((item) => ({ offerId: item.offer.id, productId: item.offer.productId, title: item.offer.title, quantity: item.quantity, unitPrice: item.offer.price, total: Number(item.offer.price) * item.quantity })) },
    } });
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
    return { checkoutUrl: process.env.MERCADO_PAGO_SANDBOX === "true" ? data.sandbox_init_point : data.init_point };
  }

  async webhook(paymentId: string) {
    if (!paymentId) return { received: true };
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`, { headers: { Authorization: `Bearer ${this.token()}` } });
    if (!response.ok) throw new BadGatewayException("Não foi possível validar o pagamento.");
    const data: any = await response.json();
    const order = await prisma.qrCheckoutOrder.findUnique({ where: { externalReference: String(data.external_reference ?? "") } });
    if (!order) return { received: true };
    if (Number(data.transaction_amount) !== Number(order.total)) throw new BadRequestException("Valor não confere.");
    const approved = data.status === "approved";
    await prisma.qrCheckoutOrder.update({ where: { id: order.id }, data: { providerPaymentId: String(data.id), status: approved ? "APPROVED" : data.status === "rejected" ? "REJECTED" : "PENDING", paidAt: approved ? new Date(data.date_approved ?? Date.now()) : null } });
    return { received: true };
  }
}
