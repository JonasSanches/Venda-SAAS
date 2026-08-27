import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { FastifyRequest } from "fastify";
import { IS_PUBLIC_KEY } from "./public.decorator";
import { tenantContext } from "./tenant-context";
import { AuthService } from "../modules/auth/auth.service";
import { TrialService } from "../modules/platform/trial.service";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, private readonly auth: AuthService,private readonly trials:TrialService) {}
  async canActivate(context: ExecutionContext) {
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()])) return true;
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const authorization = request.headers.authorization;
    if (!authorization?.startsWith("Bearer ")) throw new UnauthorizedException("Sessão necessária");
    const identity = this.auth.verifyToken(authorization.slice(7));
    this.assertRoleAccess(identity.roles,request.method,request.url);
    tenantContext.enterWith({ ...identity, requestId: String(request.id) });
    if(request.method!=="GET")await this.trials.assertWritable(identity.tenantId);
    return true;
  }

  private assertRoleAccess(roles:string[],method:string,url:string){
    if(roles.includes("PLATFORM_ADMIN")||roles.includes("ADMIN")||roles.includes("MANAGER"))return;
    const path=url.split("?")[0],read=method==="GET";
    if(path==="/api/auth/me"||path==="/api/platform/trial"||path==="/api/sales/summary")return;
    if(roles.includes("CASHIER")&&((read&&(path.startsWith("/api/products")||path.startsWith("/api/inventory")))||path.startsWith("/api/sales")||path.startsWith("/api/cash")))return;
    if(roles.includes("STOCK")&&(path.startsWith("/api/products")||path.startsWith("/api/inventory")))return;
    throw new ForbiddenException("Seu perfil não possui acesso a esta operação");
  }
}
