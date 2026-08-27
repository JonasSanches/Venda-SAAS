import { Injectable, NestMiddleware, UnauthorizedException } from "@nestjs/common";
import type { FastifyReply, FastifyRequest } from "fastify";
import { randomUUID } from "node:crypto";
import { tenantContext } from "./tenant-context";

// Development parser only. Replace with the AuthGuard that verifies signed JWTs before production.
@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  use(request: FastifyRequest, _reply: FastifyReply, next: () => void) {
    const tenantId = request.headers["x-tenant-id"];
    const userId = request.headers["x-user-id"];
    if (typeof tenantId !== "string" || typeof userId !== "string") {
      throw new UnauthorizedException("Authenticated tenant and user are required");
    }
    tenantContext.run({ tenantId, userId, roles: [], requestId: String(request.id ?? randomUUID()) }, next);
  }
}
