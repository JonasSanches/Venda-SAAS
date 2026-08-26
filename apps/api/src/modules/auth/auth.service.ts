import { Injectable, UnauthorizedException } from "@nestjs/common";
import { createHmac, timingSafeEqual } from "node:crypto";
import { DemoStore, passwordMatches } from "../demo/demo-store.service";
import { TrialService } from "../platform/trial.service";

type TokenPayload = { tenantId: string; userId: string; roles: string[]; exp: number };
const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString("base64url");

@Injectable()
export class AuthService {
  constructor(private readonly store: DemoStore,private readonly trials:TrialService) {}
  private secret() { return process.env.JWT_SECRET ?? "local-development-secret-change-before-production"; }
  async login(email: string, password: string) {
    const databaseUser=process.env.DEMO_MODE==="false"?await this.trials.findUser(email):null;
    const trial=process.env.DEMO_MODE==="false"?databaseUser:await this.trials.findUser(email);const user = process.env.DEMO_MODE==="false"?databaseUser?.user:(this.store.findUser(email)??trial?.user);
    if (!user || !passwordMatches(password, user.passwordHash)) throw new UnauthorizedException("E-mail ou senha inválidos");
    if(trial)await this.trials.assertLogin(user.tenantId);
    const payload: TokenPayload = { tenantId: user.tenantId, userId: user.id, roles: user.roles, exp: Math.floor(Date.now() / 1000) + 8 * 60 * 60 };
    const body = `${encode({ alg: "HS256", typ: "JWT" })}.${encode(payload)}`;
    const signature = createHmac("sha256", this.secret()).update(body).digest("base64url");
    const tenant=trial?await this.trials.get(user.tenantId):this.store.tenant();return { accessToken: `${body}.${signature}`, user: { id: user.id, name: user.name, email: user.email, roles: user.roles }, tenant };
  }
  verifyToken(token: string): TokenPayload {
    try {
      const [header, payload, signature] = token.split(".");
      const expected = createHmac("sha256", this.secret()).update(`${header}.${payload}`).digest();
      if (!timingSafeEqual(expected, Buffer.from(signature, "base64url"))) throw new Error();
      const parsed = JSON.parse(Buffer.from(payload, "base64url").toString()) as TokenPayload;
      if (parsed.exp < Date.now() / 1000) throw new Error();
      return parsed;
    } catch { throw new UnauthorizedException("Sessão inválida ou expirada"); }
  }
}
