import { randomUUID, scryptSync } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

let localEnv = "";
try { localEnv = readFileSync(resolve(process.cwd(), "../../.env"), "utf8"); } catch {}
for (const line of localEnv.split(/\r?\n/)) {
  const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (!match || process.env[match[1]]) continue;
  process.env[match[1]] = match[2].trim().replace(/^(["'])|(["'])$/g, "");
}

const email = process.env.PLATFORM_ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.PLATFORM_ADMIN_PASSWORD;
const name = process.env.PLATFORM_ADMIN_NAME?.trim() || "Administrador da Plataforma";
if (
  !email ||
  email === "admin@example.com" ||
  !password ||
  password.length < 12 ||
  password.startsWith("change-me") ||
  password === "replace-with-a-strong-password"
) {
  throw new Error("Defina PLATFORM_ADMIN_EMAIL e uma PLATFORM_ADMIN_PASSWORD segura com no mínimo 12 caracteres no .env");
}

const { PrismaClient } = await import("@prisma/client");
const prisma = new PrismaClient();
const tenantId = "10000000-0000-4000-8000-000000000001";
const hashPassword = value => { const salt=randomUUID(); return `${salt}:${scryptSync(value,salt,64).toString("hex")}` };

try {
  await prisma.$transaction(async tx => {
    const existing = await tx.user.findUnique({ where: { email } });
    if (existing && existing.tenantId !== tenantId) throw new Error("O e-mail do administrador já pertence a outro cliente");
    await tx.tenant.upsert({
      where: { id: tenantId },
      update: { name: "VarejoOS Plataforma", status: "ACTIVE" },
      create: { id: tenantId, name: "VarejoOS Plataforma", document: "00000000000000", status: "ACTIVE" }
    });
    await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;
    const role = await tx.role.upsert({
      where: { tenantId_name: { tenantId, name: "PLATFORM_ADMIN" } },
      update: { permissions: ["platform:*"] },
      create: { tenantId, name: "PLATFORM_ADMIN", permissions: ["platform:*"] }
    });
    const user = existing
      ? await tx.user.update({ where: { id: existing.id }, data: { name, passwordHash: hashPassword(password), status: "ACTIVE" } })
      : await tx.user.create({ data: { tenantId, name, email, passwordHash: hashPassword(password), status: "ACTIVE" } });
    await tx.userRole.upsert({ where: { userId_roleId: { userId: user.id, roleId: role.id } }, update: {}, create: { userId: user.id, roleId: role.id } });
    await tx.user.deleteMany({
      where: { tenantId, email: "admin@example.com", id: { not: user.id } }
    });
  });
  console.log(`Administrador da plataforma configurado: ${email}`);
} finally {
  await prisma.$disconnect();
}
