/*
 * Seeds a clearly identified, isolated Venda+ demonstration account.
 * It is intentionally idempotent: re-running replaces only the data owned by
 * this tenant, never data belonging to a customer.
 *
 * Usage (inside the API container):
 *   SHOWCASE_PASSWORD='a strong demo-only password' node apps/api/scripts/seed-showcase-demo.cjs
 */
const { randomUUID, scryptSync } = require("node:crypto");

function prismaClient() {
  const candidates = [
    "/app/apps/api/node_modules/@prisma/client",
    "/app/node_modules/@prisma/client",
    "@prisma/client",
  ];
  for (const candidate of candidates) {
    try { return require(candidate).PrismaClient; } catch (_) { /* try next */ }
  }
  throw new Error("Prisma Client was not found inside the API container.");
}

const PrismaClient = prismaClient();
const db = new PrismaClient();
const TENANT_DOCUMENT = "DEMO-VENDAMAIS-2026";
const ADMIN_EMAIL = "demonstracao@vendamais-app.com";
const DAY = 24 * 60 * 60 * 1000;
const money = value => Number(value.toFixed(2));
const passwordHash = (password, salt = randomUUID()) => `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
const at = (base, hour, minute = 0) => {
  const result = new Date(base);
  result.setHours(hour, minute, 0, 0);
  return result;
};
const dayAt = (daysAgo, hour, minute = 0) => at(new Date(Date.now() - daysAgo * DAY), hour, minute);

const products = [
  ["CAF-001", "Café espresso", 6.5, 1.1],
  ["CAF-002", "Cappuccino cremoso", 11.9, 3.2],
  ["PAD-001", "Croissant de manteiga", 12.5, 4.1],
  ["PAD-002", "Pão de queijo artesanal", 8.9, 2.8],
  ["SAN-001", "Sanduíche natural", 19.9, 7.4],
  ["DOC-001", "Brownie de chocolate", 10.9, 3.1],
  ["BEB-001", "Suco natural 300 ml", 9.5, 2.7],
  ["BEB-002", "Água mineral sem gás", 4.5, 1.0],
  ["BEB-003", "Refrigerante lata", 7.5, 2.6],
  ["MER-001", "Biscoito artesanal", 14.9, 5.0],
  ["COM-001", "Combo café + croissant", 17.9, 5.2],
  ["COM-002", "Combo almoço leve", 28.9, 10.7],
];

const customers = [
  "Ana Martins", "Bruno Oliveira", "Camila Rocha", "Diego Ferreira", "Elisa Nogueira", "Felipe Souza",
  "Gabriela Lima", "Henrique Costa", "Isabela Alves", "João Ribeiro", "Larissa Melo", "Marcos Santos",
];

async function clearTenant(tenantId) {
  const users = await db.user.findMany({ where: { tenantId }, select: { id: true } });
  const userIds = users.map(user => user.id);
  await db.$transaction([
    db.fiscalDocument.deleteMany({ where: { tenantId } }),
    db.payment.deleteMany({ where: { tenantId } }),
    db.orderItem.deleteMany({ where: { tenantId } }),
    db.order.deleteMany({ where: { tenantId } }),
    db.cashMovement.deleteMany({ where: { tenantId } }),
    db.cashSession.deleteMany({ where: { tenantId } }),
    db.stockMovement.deleteMany({ where: { tenantId } }),
    db.warehouse.deleteMany({ where: { tenantId } }),
    db.product.deleteMany({ where: { tenantId } }),
    db.party.deleteMany({ where: { tenantId } }),
    db.auditLog.deleteMany({ where: { tenantId } }),
    db.pushSubscription.deleteMany({ where: { userId: { in: userIds } } }),
    db.userRole.deleteMany({ where: { userId: { in: userIds } } }),
    db.user.deleteMany({ where: { tenantId } }),
    db.role.deleteMany({ where: { tenantId } }),
    db.branch.deleteMany({ where: { tenantId } }),
  ]);
}

async function main() {
  const password = process.env.SHOWCASE_PASSWORD;
  if (!password || password.length < 12) throw new Error("Define SHOWCASE_PASSWORD with at least 12 characters before running this script.");

  const duplicateEmail = await db.user.findUnique({ where: { email: ADMIN_EMAIL }, select: { tenantId: true } });
  let tenant = await db.tenant.findUnique({ where: { document: TENANT_DOCUMENT } });
  if (duplicateEmail && (!tenant || duplicateEmail.tenantId !== tenant.id)) {
    throw new Error(`The reserved demonstration e-mail ${ADMIN_EMAIL} belongs to another tenant. No data was changed.`);
  }

  if (!tenant) {
    tenant = await db.tenant.create({ data: {
      name: "Venda+ Demonstração", document: TENANT_DOCUMENT, status: "ACTIVE",
      state: "SP", city: "Jundiaí", segment: "RETAIL", phone: "11999990000", deliveryAlertMinutes: 45,
    }});
  } else {
    await clearTenant(tenant.id);
    tenant = await db.tenant.update({ where: { id: tenant.id }, data: {
      name: "Venda+ Demonstração", status: "ACTIVE", state: "SP", city: "Jundiaí", segment: "RETAIL", phone: "11999990000", deliveryAlertMinutes: 45,
    }});
  }

  const [centro, jardim] = await db.$transaction([
    db.branch.create({ data: { tenantId: tenant.id, name: "Unidade Centro", taxId: "DEMO-CENTRO", state: "SP", cityCode: "3525904", taxRegime: "SIMPLIFICADO", stateRegistration: "ISENTO" } }),
    db.branch.create({ data: { tenantId: tenant.id, name: "Unidade Jardim", taxId: "DEMO-JARDIM", state: "SP", cityCode: "3525904", taxRegime: "SIMPLIFICADO", stateRegistration: "ISENTO" } }),
  ]);
  const [warehouseCentro, warehouseJardim] = await db.$transaction([
    db.warehouse.create({ data: { tenantId: tenant.id, branchId: centro.id, name: "Estoque Centro" } }),
    db.warehouse.create({ data: { tenantId: tenant.id, branchId: jardim.id, name: "Estoque Jardim" } }),
  ]);

  const roleData = [
    ["ADMIN", ["*"]],
    ["MANAGER", ["sales:*", "products:*", "inventory:*", "cash:*", "customers:*"]],
    ["CASHIER", ["sales:create", "sales:read", "cash:read"]],
    ["STOCK", ["products:read", "inventory:*"]],
  ];
  const roles = await Promise.all(roleData.map(([name, permissions]) => db.role.create({ data: { tenantId: tenant.id, name, permissions } })));
  const roleByName = new Map(roles.map(role => [role.name, role]));
  const people = [
    ["Administrador Demonstração", ADMIN_EMAIL, "ADMIN"],
    ["Mariana Costa", "mariana.caixa@demonstracao.vendamais-app.com", "CASHIER"],
    ["Rafael Alves", "rafael.estoque@demonstracao.vendamais-app.com", "STOCK"],
    ["Paulo Mendes", "paulo.gerencia@demonstracao.vendamais-app.com", "MANAGER"],
  ];
  for (const [name, email, roleName] of people) {
    const role = roleByName.get(roleName);
    await db.user.create({ data: { tenantId: tenant.id, name, email, passwordHash: passwordHash(password), status: "ACTIVE", roles: { create: { roleId: role.id } } } });
  }
  await db.party.createMany({ data: customers.map((name, index) => ({
    tenantId: tenant.id, type: "CUSTOMER", name, email: `cliente${index + 1}@exemplo.invalid`, phone: `1198888${String(1000 + index).slice(-4)}`,
    address: `Rua Demonstração, ${100 + index} — Jundiaí/SP`, notes: "Contato fictício da conta de demonstração",
  })) });
  await db.product.createMany({ data: products.map(([sku, name, price, cost]) => ({ tenantId: tenant.id, sku, name, price, cost, active: true })) });
  const catalog = await db.product.findMany({ where: { tenantId: tenant.id }, orderBy: { sku: "asc" } });

  const now = new Date();
  const sessions = [];
  const orders = [];
  const orderItems = [];
  const payments = [];
  const cashMovements = [];
  const stockMovements = [];
  const soldByBranchProduct = new Map();
  let nextNumber = 1001n;
  const branches = [
    { branch: centro, warehouse: warehouseCentro, multiplier: 1 },
    { branch: jardim, warehouse: warehouseJardim, multiplier: 0.72 },
  ];

  for (const { branch, warehouse, multiplier } of branches) {
    for (const product of catalog) {
      stockMovements.push({ id: randomUUID(), tenantId: tenant.id, warehouseId: warehouse.id, productId: product.id, type: "PURCHASE", quantity: 2200, unitCost: product.cost, occurredAt: dayAt(366, 8) });
    }
    for (let day = 364; day >= 0; day--) {
      const isToday = day === 0;
      const weekday = dayAt(day, 12).getDay();
      const count = isToday ? (branch.id === centro.id ? 9 : 5) : Math.max(1, Math.round((weekday === 0 ? 5 : weekday === 6 ? 8 : 4 + (day % 4)) * multiplier));
      const sessionId = randomUUID();
      const openingDate = dayAt(day, 8);
      sessions.push({ id: sessionId, tenantId: tenant.id, branchId: branch.id, status: isToday ? "OPEN" : "CLOSED", openingAmount: 180, declaredAmount: isToday ? null : 180, difference: isToday ? null : 0, openedAt: openingDate, closedAt: isToday ? null : dayAt(day, 20) });
      cashMovements.push({ id: randomUUID(), tenantId: tenant.id, cashSessionId: sessionId, type: "OPENING", amount: 180, paymentMethod: "DINHEIRO", note: "Abertura do caixa", createdAt: openingDate });
      for (let index = 0; index < count; index++) {
        const orderId = randomUUID();
        const first = catalog[(day * 3 + index * 2 + (branch.id === centro.id ? 0 : 3)) % catalog.length];
        const second = catalog[(day + index * 5 + 4) % catalog.length];
        const quantity = index % 5 === 0 ? 2 : 1;
        const createdAt = dayAt(day, 9 + ((index * 2 + day) % 10), (index * 11 + day) % 55);
        const channel = index % 6 === 0 ? "DELIVERY" : "PDV";
        const discount = index % 9 === 0 ? 2 : 0;
        const subtotal = money(Number(first.price) * quantity + Number(second.price));
        const total = money(subtotal - discount);
        const method = index % 5 === 0 ? "DINHEIRO" : index % 3 === 0 ? "CARTAO_CREDITO" : "PIX";
        const deliveredAt = channel === "DELIVERY" ? new Date(createdAt.getTime() + (isToday && index === 0 ? 63 : 22 + (index % 4) * 5) * 60 * 1000) : null;
        orders.push({ id: orderId, tenantId: tenant.id, branchId: branch.id, cashSessionId: sessionId, number: nextNumber++, status: "PAID", channel, subtotal, discount, total, createdAt, deliveredAt });
        const orderLines = [[first, quantity], [second, 1]];
        for (const [product, lineQuantity] of orderLines) {
          const lineTotal = money(Number(product.price) * lineQuantity);
          orderItems.push({ id: randomUUID(), tenantId: tenant.id, orderId, productId: product.id, quantity: lineQuantity, unitPrice: product.price, unitCost: product.cost, total: lineTotal });
          stockMovements.push({ id: randomUUID(), tenantId: tenant.id, warehouseId: warehouse.id, productId: product.id, type: "SALE", quantity: -lineQuantity, unitCost: product.cost, referenceId: orderId, occurredAt: createdAt });
          const key = `${warehouse.id}:${product.id}`;
          soldByBranchProduct.set(key, (soldByBranchProduct.get(key) || 0) + lineQuantity);
        }
        payments.push({ id: randomUUID(), tenantId: tenant.id, orderId, method, amount: total, status: "PAID", externalId: `DEMO-${orderId.slice(0, 8)}` });
        cashMovements.push({ id: randomUUID(), tenantId: tenant.id, cashSessionId: sessionId, type: "SALE", amount: total, paymentMethod: method, note: `Venda #${nextNumber - 1n}`, orderId, createdAt });
      }
    }
  }

  // Two deliberate low-stock cases make the operational dashboard useful.
  for (const { warehouse } of branches) {
    for (const [product, target] of [[catalog[0], 4], [catalog[1], 3]]) {
      const key = `${warehouse.id}:${product.id}`;
      const balance = 2200 - (soldByBranchProduct.get(key) || 0);
      stockMovements.push({ id: randomUUID(), tenantId: tenant.id, warehouseId: warehouse.id, productId: product.id, type: "ADJUSTMENT", quantity: target - balance, unitCost: product.cost, occurredAt: now });
    }
  }

  await db.$transaction(async tx => {
    await tx.cashSession.createMany({ data: sessions });
    await tx.order.createMany({ data: orders });
    await tx.orderItem.createMany({ data: orderItems });
    await tx.payment.createMany({ data: payments });
    await tx.cashMovement.createMany({ data: cashMovements });
    await tx.stockMovement.createMany({ data: stockMovements });
  }, { timeout: 60000 });

  const revenue = orders.reduce((sum, order) => sum + Number(order.total), 0);
  console.log("Demonstration account ready.");
  console.table([{ tenant: tenant.name, tenantId: tenant.id, branches: 2, products: catalog.length, customers: customers.length, orders: orders.length, revenue: `R$ ${revenue.toFixed(2)}` }]);
  console.log(`Login: ${ADMIN_EMAIL}`);
  console.log("This account contains fictitious data only and can be safely regenerated by rerunning this script.");
}

main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => db.$disconnect());
