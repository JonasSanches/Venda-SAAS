import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export type TenantTransaction = Parameters<
  Parameters<PrismaClient["$transaction"]>[0]
>[0];

export async function withTenant<T>(tenantId: string, work: (tx: TenantTransaction) => Promise<T>) {
  if (!tenantId) throw new Error("tenantId is required");

  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;
    return work(tx);
  });
}
