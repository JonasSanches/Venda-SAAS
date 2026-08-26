import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
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
    tenantContext.enterWith({ ...identity, requestId: String(request.id) });
    if(request.method!=="GET")await this.trials.assertWritable(identity.tenantId);
    return true;
  }
}
