import { BadRequestException, ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { createHmac, timingSafeEqual } from "node:crypto";
import { prisma, withTenant } from "@varejo/database";
import { DemoStore, hashPassword, passwordMatches } from "../demo/demo-store.service";
import { TrialService } from "../platform/trial.service";
import { currentTenantId, currentUserId, tenantContext } from "../../common/tenant-context";

type TokenPayload = { tenantId: string; userId: string; roles: string[]; exp: number };
const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString("base64url");

@Injectable()
export class AuthService {
  constructor(private readonly store: DemoStore,private readonly trials:TrialService) {}
  private secret() { return process.env.JWT_SECRET ?? "local-development-secret-change-before-production"; }
  async login(access: string, password: string) {
    const databaseUser=process.env.DEMO_MODE==="false"?await this.trials.findUser(access):null;
    const trial=process.env.DEMO_MODE==="false"?databaseUser:await this.trials.findUser(access);const user = process.env.DEMO_MODE==="false"?databaseUser?.user:(this.store.findUser(access)??trial?.user);
    if (!user || !passwordMatches(password, user.passwordHash)) throw new UnauthorizedException("E-mail ou senha inválidos");
    if(user.status==="BLOCKED")throw new ForbiddenException("Usuário bloqueado. Procure o administrador.");
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
  async assertActive(tenantId:string,userId:string){if(process.env.DEMO_MODE!=="false")return;const user=await prisma.user.findFirst({where:{id:userId,tenantId},select:{status:true}});if(!user||user.status==="BLOCKED")throw new UnauthorizedException("Usuário bloqueado ou removido")}
  async listUsers(){
    const tenantId=currentTenantId();
    if(process.env.DEMO_MODE!=="false")return this.store.users(tenantId);
    const users=await withTenant(tenantId,tx=>tx.user.findMany({
      where:{tenantId},
      select:{id:true,name:true,email:true,status:true,createdAt:true,roles:{select:{role:{select:{name:true}}}}},
      orderBy:{createdAt:"asc"}
    }));
    return users.map(user=>({...user,access:user.email.endsWith("@acesso.vendamais-app.com")?user.email.replace("@acesso.vendamais-app.com",""):user.email,roles:user.roles.map(item=>item.role.name)}));
  }
  async createUser(input:{name:string;username:string;password:string;role:"ADMIN"|"MANAGER"|"CASHIER"|"STOCK"}){
    const identity=tenantContext.getStore();if(!identity?.roles.some(role=>role==="ADMIN"||role==="MANAGER"))throw new ForbiddenException("Seu perfil não pode criar usuários");if(identity.roles.includes("MANAGER")&&!identity.roles.includes("ADMIN")&&!(["CASHIER","STOCK"] as string[]).includes(input.role))throw new ForbiddenException("Gerentes podem criar somente usuários de caixa ou estoque");const tenantId=currentTenantId(),username=input.username.trim().toLowerCase();if(!/^[a-z0-9._-]{3,30}$/.test(username))throw new BadRequestException("Nome de acesso deve ter de 3 a 30 caracteres: letras minúsculas, números, ponto, hífen ou sublinhado");const email=`${username}@acesso.vendamais-app.com`;
    if(process.env.DEMO_MODE!=="false")return this.store.addUser(tenantId,{...input,username});
    const tenant=await prisma.tenant.findUniqueOrThrow({where:{id:tenantId},select:{status:true}}),count=await prisma.user.count({where:{tenantId}}),limit=tenant.status==="TRIAL"?2:50;if(count>=limit)throw new BadRequestException(`Limite de ${limit} usuários atingido para este plano`);
    const permissions={ADMIN:["*"],MANAGER:["sales:*","products:*","inventory:*","cash:*"],CASHIER:["sales:create","sales:read","cash:read"],STOCK:["products:read","inventory:*"]}[input.role];
    try{return await withTenant(tenantId,async tx=>{const role=await tx.role.upsert({where:{tenantId_name:{tenantId,name:input.role}},update:{permissions},create:{tenantId,name:input.role,permissions}});const user=await tx.user.create({data:{tenantId,name:input.name.trim(),email,passwordHash:hashPassword(input.password),status:"ACTIVE",roles:{create:{roleId:role.id}}},select:{id:true,name:true,email:true,status:true,createdAt:true}});return{...user,access:username,roles:[input.role]}})}catch(error:any){if(error?.code==="P2002")throw new BadRequestException("Este nome de acesso já está em uso");throw error}
  }
  async changePassword(input:{currentPassword:string;newPassword:string}){
    const tenantId=currentTenantId(),userId=currentUserId();
    if(input.currentPassword===input.newPassword)throw new BadRequestException("A nova senha deve ser diferente da atual");
    if(process.env.DEMO_MODE!=="false")return this.store.changePassword(tenantId,userId,input.currentPassword,input.newPassword);
    const user=await prisma.user.findFirst({where:{id:userId,tenantId},select:{id:true,passwordHash:true}});
    if(!user||!passwordMatches(input.currentPassword,user.passwordHash))throw new BadRequestException("Senha atual incorreta");
    await prisma.user.update({where:{id:user.id},data:{passwordHash:hashPassword(input.newPassword)}});
    return{message:"Senha alterada com sucesso"};
  }
}
