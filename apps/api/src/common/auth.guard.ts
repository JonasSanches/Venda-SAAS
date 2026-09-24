import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { FastifyRequest } from "fastify";
import { IS_PUBLIC_KEY } from "./public.decorator";
import { tenantContext } from "./tenant-context";
import { AuthService } from "../modules/auth/auth.service";
import { TrialService } from "../modules/platform/trial.service";
import { prisma } from "@varejo/database";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, private readonly auth: AuthService,private readonly trials:TrialService) {}
  async canActivate(context: ExecutionContext) {
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()])) return true;
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const authorization = request.headers.authorization;
    if (!authorization?.startsWith("Bearer ")) throw new UnauthorizedException("Sessão necessária");
    const identity = this.auth.verifyToken(authorization.slice(7));
    (request as FastifyRequest & {identity?:typeof identity}).identity=identity;
    const branchHeader=request.headers["x-branch-id"];
    tenantContext.enterWith({ ...identity, branchId:typeof branchHeader==="string"?branchHeader:undefined, requestId: String(request.id) });
    await this.auth.assertActive(identity.tenantId,identity.userId);
    const tenant = await prisma.tenant.findUnique({ where: { id: identity.tenantId }, select: { segment: true } });
    if (tenant?.segment === "QR_SALES") this.assertQrSalesAccess(request.method, request.url);
    this.assertRoleAccess(identity.roles,request.method,request.url);
    if(request.method!=="GET"&&identity.roles.includes("SUPPORT_READONLY"))throw new ForbiddenException("A visualização administrativa é somente leitura");
    if(request.method!=="GET")await this.trials.assertWritable(identity.tenantId);
    return true;
  }

  private assertRoleAccess(roles:string[],method:string,url:string){
    const path=url.split("?")[0],read=method==="GET";
    if((path.startsWith("/api/platform/trials")||path.startsWith("/api/platform/users"))&&!roles.includes("PLATFORM_ADMIN"))throw new ForbiddenException("Acesso exclusivo da plataforma");
    if(roles.includes("PLATFORM_ADMIN")||roles.includes("ADMIN")||roles.includes("MANAGER"))return;
    if(path==="/api/auth/me"||path==="/api/platform/trial"||path==="/api/sales/summary")return;
    if(roles.includes("CASHIER")&&((read&&(path.startsWith("/api/products")||path.startsWith("/api/inventory")))||path.startsWith("/api/sales")||path.startsWith("/api/cash")))return;
    if(roles.includes("STOCK")&&(path.startsWith("/api/products")||path.startsWith("/api/inventory")))return;
    if(roles.includes("SELLER")&&((read&&path.startsWith("/api/products"))||path.startsWith("/api/sales")||path.startsWith("/api/commercial/parties")||path.startsWith("/api/pizzeria")||path.startsWith("/api/qr-checkout")))return;
    throw new ForbiddenException("Seu perfil não possui acesso a esta operação");
  }

  private assertQrSalesAccess(_method: string, url: string) {
    const path = url.split("?")[0];
    const allowed =
      path.startsWith("/api/qr-checkout") ||
      path.startsWith("/api/products") ||
      path.startsWith("/api/commercial/parties") ||
      path.startsWith("/api/auth/") ||
      path === "/api/platform/trial";
    if (!allowed) {
      throw new ForbiddenException("Este tipo de empresa possui acesso somente às funções de venda por QR Code.");
    }
  }
}
