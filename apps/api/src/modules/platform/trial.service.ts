import { BadRequestException, HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { prisma } from "@varejo/database";
import { randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { hashPassword } from "../demo/demo-store.service";
import { tenantContext } from "../../common/tenant-context";

type TrialInput = { companyName:string; document:string; state:"SP"|"RJ"; city:string; segment:string; phone:string; logoDataUrl?:string; name:string; email:string; password:string };
type DemoTrial = { tenantId:string; name:string; document:string; state:"SP"|"RJ"; city:string; segment:string; phone:string; logoDataUrl?:string; branch:{name:string;state:string}; status:"PENDING"|"TRIAL"|"ACTIVE"|"EXPIRED"|"SUSPENDED"; startsAt?:string; expiresAt?:string; limits:{users:number;branches:number;sales:number}; user:{id:string;tenantId:string;name:string;email:string;passwordHash:string;roles:string[];status?:"ACTIVE"|"BLOCKED"} };
const tenantInclude = { branches:{orderBy:{createdAt:"asc" as const}}, users:{take:1,orderBy:{createdAt:"asc" as const},include:{roles:{include:{role:true}}}} };
const tenantDetailInclude = { branches:{orderBy:{createdAt:"asc" as const}}, users:{orderBy:{createdAt:"asc" as const},include:{roles:{include:{role:true}}}} };

@Injectable()
export class TrialService {
  private readonly file=resolve(process.cwd(),"../../storage/trials.json");
  private trials:DemoTrial[]=this.load();
  private get demoMode(){return process.env.DEMO_MODE!=="false"}
  private load(){try{return JSON.parse(readFileSync(this.file,"utf8")) as DemoTrial[]}catch{return[]}}
  private save(){mkdirSync(dirname(this.file),{recursive:true});writeFileSync(this.file,JSON.stringify(this.trials,null,2))}

  async create(input:TrialInput){
    if(input.logoDataUrl&&input.logoDataUrl.length>700_000)throw new BadRequestException("Logo deve ter no máximo 500 KB");
    if(this.demoMode)return this.createDemo(input);
    const document=input.document.replace(/\D/g,""),email=input.email.trim().toLowerCase();
    const duplicate=await prisma.$transaction(async tx=>({tenant:await tx.tenant.findUnique({where:{document},select:{id:true}}),user:await tx.user.findUnique({where:{email},select:{id:true}})}));
    if(duplicate.tenant||duplicate.user)throw new BadRequestException("CNPJ ou e-mail já possui uma conta");
    try{
      const tenant=await prisma.$transaction(async tx=>{
        const created=await tx.tenant.create({data:{name:input.companyName.trim(),document,status:"PENDING",state:input.state,city:input.city.trim(),segment:input.segment,phone:input.phone.replace(/\D/g,""),logoDataUrl:input.logoDataUrl}});
        await tx.$executeRaw`SELECT set_config('app.tenant_id', ${created.id}, true)`;
        const branch=await tx.branch.create({data:{tenantId:created.id,name:"Matriz",taxId:document,state:input.state,cityCode:"",taxRegime:"",stateRegistration:""}});
        await tx.warehouse.create({data:{tenantId:created.id,branchId:branch.id,name:"Estoque principal"}});
        const role=await tx.role.create({data:{tenantId:created.id,name:"ADMIN",permissions:["*"]}});
        await tx.user.create({data:{tenantId:created.id,name:input.name.trim(),email,passwordHash:hashPassword(input.password),status:"ACTIVE",roles:{create:{roleId:role.id}}}});
        return tx.tenant.findUniqueOrThrow({where:{id:created.id},include:tenantInclude});
      });
      return this.publicTenant(tenant);
    }catch(error:unknown){if(typeof error==="object"&&error&&"code" in error&&error.code==="P2002")throw new BadRequestException("CNPJ ou e-mail já possui uma conta");throw error}
  }

  async findUser(access:string){
    const value=access.trim().toLowerCase(),email=value.includes("@")?value:`${value}@acesso.vendamais-app.com`;
    if(this.demoMode){const trial=this.trials.find(t=>t.user.email.toLowerCase()===email);return trial?{user:trial.user,tenant:trial}:null}
    const user=await prisma.user.findUnique({where:{email},include:{tenant:true,roles:{include:{role:true}}}});
    return user?{user:{...user,roles:user.roles.map(item=>item.role.name)},tenant:user.tenant}:null;
  }

  async get(id:string){
    if(this.demoMode){const trial=this.trials.find(item=>item.tenantId===id);if(trial)this.refreshDemo(trial);return trial?this.publicDemo(trial):null}
    const tenant=await this.refreshDatabase(id);if(!tenant)return null;
    const full=await prisma.tenant.findUnique({where:{id},include:tenantInclude});return full?this.publicTenant(full):null;
  }

  async list(){
    if(this.demoMode){this.trials.forEach(item=>this.refreshDemo(item));return this.trials.map(item=>this.publicDemo(item))}
    await prisma.tenant.updateMany({where:{status:"TRIAL",trialExpiresAt:{lte:new Date()}},data:{status:"EXPIRED"}});
    const tenants=await prisma.tenant.findMany({where:{document:{not:"00000000000000"}},include:tenantInclude,orderBy:{createdAt:"desc"}});return tenants.map(item=>this.publicTenant(item));
  }

  async getDetail(id:string){
    if(this.demoMode){const t=this.requireDemo(id);this.refreshDemo(t);return{...this.publicDemo(t),users:[this.publicDemo(t).user],branches:[t.branch]}}
    const tenant=await prisma.tenant.findUnique({where:{id},include:tenantDetailInclude});if(!tenant)throw new BadRequestException("Conta não encontrada");
    return{...this.publicTenant(tenant),users:tenant.users.map(user=>({id:user.id,name:user.name,email:user.email,access:user.email.endsWith("@acesso.vendamais-app.com")?user.email.replace("@acesso.vendamais-app.com",""):user.email,status:user.status,createdAt:user.createdAt,roles:user.roles.map(item=>item.role.name)})),branches:tenant.branches.map(branch=>({id:branch.id,name:branch.name,taxId:branch.taxId,state:branch.state,cityCode:branch.cityCode,stateRegistration:branch.stateRegistration,taxRegime:branch.taxRegime,createdAt:branch.createdAt}))};
  }

  async resetTenantUserPassword(id:string,userId:string,newPassword:string){
    if(this.demoMode){const t=this.requireDemo(id);if(t.user.id!==userId)throw new BadRequestException("Usuário não encontrado");t.user.passwordHash=hashPassword(newPassword);this.save();return{message:"Senha redefinida com sucesso"}}
    const user=await prisma.user.findFirst({where:{id:userId,tenantId:id},select:{id:true}});if(!user)throw new BadRequestException("Usuário não encontrado nesta empresa");
    await prisma.user.update({where:{id:user.id},data:{passwordHash:hashPassword(newPassword)}});await this.audit(id,"PASSWORD_RESET","User",userId,null,{reset:true});return{message:"Senha redefinida com sucesso"};
  }

  async updateTenant(id:string,input:{name:string;phone:string;city:string;state:"SP"|"RJ";segment:string}){if(this.demoMode){const t=this.requireDemo(id),before={name:t.name,phone:t.phone,city:t.city,state:t.state,segment:t.segment};Object.assign(t,input);this.save();return{...this.publicDemo(t),before}}const before=await prisma.tenant.findUnique({where:{id},select:{name:true,phone:true,city:true,state:true,segment:true}});if(!before)throw new BadRequestException("Conta não encontrada");await prisma.tenant.update({where:{id},data:{name:input.name.trim(),phone:input.phone.replace(/\D/g,""),city:input.city.trim(),state:input.state,segment:input.segment}});await this.audit(id,"TENANT_UPDATED","Tenant",id,before,input);return this.getDetail(id)}
  async setTenantStatus(id:string,status:"TRIAL"|"ACTIVE"|"SUSPENDED"){if(this.demoMode){const t=this.requireDemo(id),before=t.status;t.status=status;this.save();return this.publicDemo(t)}const tenant=await prisma.tenant.findUnique({where:{id},select:{status:true}});if(!tenant)throw new BadRequestException("Conta não encontrada");await prisma.tenant.update({where:{id},data:{status}});await this.audit(id,"TENANT_STATUS_CHANGED","Tenant",id,{status:tenant.status},{status});return this.getDetail(id)}
  async setTenantUserStatus(id:string,userId:string,status:"ACTIVE"|"BLOCKED"){if(this.demoMode){const t=this.requireDemo(id);if(t.user.id!==userId)throw new BadRequestException("Usuário não encontrado");return{message:`Usuário ${status==="ACTIVE"?"ativado":"bloqueado"}`}}const user=await prisma.user.findFirst({where:{id:userId,tenantId:id},select:{id:true,status:true,roles:{select:{role:{select:{name:true}}}}}});if(!user)throw new BadRequestException("Usuário não encontrado nesta empresa");if(status==="BLOCKED"&&user.roles.some(item=>item.role.name==="ADMIN")){const admins=await prisma.user.count({where:{tenantId:id,status:"ACTIVE",roles:{some:{role:{name:"ADMIN"}}}}});if(admins<=1)throw new BadRequestException("Não é possível bloquear o último administrador ativo da empresa")}await prisma.user.update({where:{id:userId},data:{status}});await this.audit(id,"USER_STATUS_CHANGED","User",userId,{status:user.status},{status});return{message:`Usuário ${status==="ACTIVE"?"ativado":"bloqueado"}`}}
  async setTenantUserRole(id:string,userId:string,roleName:"ADMIN"|"MANAGER"|"CASHIER"|"STOCK"){const user=await prisma.user.findFirst({where:{id:userId,tenantId:id},include:{roles:{include:{role:true}}}});if(!user)throw new BadRequestException("Usuário não encontrado nesta empresa");const before=user.roles.map(item=>item.role.name);if(before.includes("ADMIN")&&roleName!=="ADMIN"){const admins=await prisma.user.count({where:{tenantId:id,status:"ACTIVE",roles:{some:{role:{name:"ADMIN"}}}}});if(admins<=1)throw new BadRequestException("Não é possível alterar o perfil do último administrador ativo")};const permissions={ADMIN:["*"],MANAGER:["sales:*","products:*","inventory:*","cash:*"],CASHIER:["sales:create","sales:read","cash:read"],STOCK:["products:read","inventory:*"]}[roleName];await prisma.$transaction(async tx=>{await tx.$executeRaw`SELECT set_config('app.tenant_id', ${id}, true)`;const role=await tx.role.upsert({where:{tenantId_name:{tenantId:id,name:roleName}},update:{permissions},create:{tenantId:id,name:roleName,permissions}});await tx.userRole.deleteMany({where:{userId}});await tx.userRole.create({data:{userId,roleId:role.id}})});await this.audit(id,"USER_ROLE_CHANGED","User",userId,{roles:before},{roles:[roleName]});return{message:"Perfil alterado com sucesso"}}
  async auditLogs(id:string){if(this.demoMode)return[];return prisma.auditLog.findMany({where:{tenantId:id},orderBy:{createdAt:"desc"},take:100})}

  async listPlatformUsers(){
    return prisma.user.findMany({where:{tenantId:"10000000-0000-4000-8000-000000000001"},select:{id:true,name:true,email:true,status:true,createdAt:true},orderBy:{createdAt:"asc"}});
  }

  async createPlatformUser(input:{name:string;email:string;password:string}){
    const tenantId="10000000-0000-4000-8000-000000000001",email=input.email.trim().toLowerCase();
    if(await prisma.user.findUnique({where:{email}}))throw new BadRequestException("Este e-mail já está cadastrado");
    return prisma.$transaction(async tx=>{
      await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;
      const role=await tx.role.findUniqueOrThrow({where:{tenantId_name:{tenantId,name:"PLATFORM_ADMIN"}}});
      return tx.user.create({data:{tenantId,name:input.name.trim(),email,passwordHash:hashPassword(input.password),status:"ACTIVE",roles:{create:{roleId:role.id}}},select:{id:true,name:true,email:true,status:true,createdAt:true}});
    });
  }

  async activate(id:string){if(this.demoMode){const t=this.requireDemo(id);t.status="ACTIVE";this.save();return this.publicDemo(t)}const before=await prisma.tenant.findUnique({where:{id},select:{status:true}});if(!before)throw new BadRequestException("Conta não encontrada");await prisma.tenant.update({where:{id},data:{status:"ACTIVE"}});await this.audit(id,"TENANT_STATUS_CHANGED","Tenant",id,before,{status:"ACTIVE"});return this.get(id)}
  async extend(id:string,days:number){
    if(!Number.isInteger(days)||days===0||days < -365||days>365)throw new BadRequestException("Informe de -365 a 365 dias, exceto zero");
    if(this.demoMode){const t=this.requireDemo(id),current=t.expiresAt?new Date(t.expiresAt).getTime():Date.now(),base=days>0?Math.max(Date.now(),current):current,next=new Date(base+days*86_400_000);t.expiresAt=next.toISOString();t.status=next.getTime()<=Date.now()?"EXPIRED":t.status==="EXPIRED"?"TRIAL":t.status;this.save();return this.publicDemo(t)}
    const tenant=await prisma.tenant.findUnique({where:{id}});if(!tenant)throw new BadRequestException("Conta não encontrada");
    const current=tenant.trialExpiresAt?.getTime()??Date.now(),base=days>0?Math.max(Date.now(),current):current,trialExpiresAt=new Date(base+days*86_400_000),status=trialExpiresAt.getTime()<=Date.now()?"EXPIRED":tenant.status==="EXPIRED"?"TRIAL":tenant.status;await prisma.tenant.update({where:{id},data:{trialExpiresAt,status}});await this.audit(id,"TRIAL_DAYS_ADJUSTED","Tenant",id,{trialExpiresAt:tenant.trialExpiresAt,status:tenant.status},{trialExpiresAt,status,days});return this.get(id);
  }
  async approveTrial(id:string){const startsAt=new Date(),expiresAt=new Date(startsAt.getTime()+7*86_400_000);if(this.demoMode){const t=this.requireDemo(id);t.status="TRIAL";t.startsAt=startsAt.toISOString();t.expiresAt=expiresAt.toISOString();this.save();return this.publicDemo(t)}const tenant=await prisma.tenant.findUnique({where:{id},select:{status:true}});if(!tenant)throw new BadRequestException("Conta não encontrada");if(tenant.status!=="PENDING")throw new BadRequestException("Este cadastro não está aguardando aprovação");await prisma.tenant.update({where:{id},data:{status:"TRIAL",trialStartsAt:startsAt,trialExpiresAt:expiresAt}});await this.audit(id,"TRIAL_APPROVED","Tenant",id,{status:tenant.status},{status:"TRIAL",startsAt,expiresAt});return this.get(id)}
  async assertLogin(id:string){if(this.demoMode){const t=this.trials.find(item=>item.tenantId===id);if(!t)return;this.refreshDemo(t);return this.assertStatus(t.status)}const tenant=await this.refreshDatabase(id);if(tenant)this.assertStatus(tenant.status)}
  async assertWritable(id:string){return this.assertLogin(id)}

  private async refreshDatabase(id:string){const tenant=await prisma.tenant.findUnique({where:{id}});if(tenant?.status==="TRIAL"&&tenant.trialExpiresAt&&tenant.trialExpiresAt<=new Date())return prisma.tenant.update({where:{id},data:{status:"EXPIRED"}});if(tenant?.status==="ACTIVE"&&tenant.subscriptionExpiresAt&&tenant.subscriptionExpiresAt<=new Date())return prisma.tenant.update({where:{id},data:{status:"EXPIRED"}});return tenant}
  private assertStatus(status:string){if(status==="PENDING")throw new HttpException("Seu cadastro foi recebido e aguarda liberação. Você será avisado assim que os 7 dias grátis forem ativados.",HttpStatus.FORBIDDEN);if(status==="EXPIRED")throw new HttpException("Seu período de teste terminou. Atualize seu plano para continuar.",HttpStatus.PAYMENT_REQUIRED);if(status==="SUSPENDED"||status==="CANCELLED")throw new HttpException("Conta suspensa. Entre em contato com o suporte.",HttpStatus.FORBIDDEN)}
  private async audit(tenantId:string,action:string,resource:string,resourceId:string|null,before:unknown,after:unknown){const context=tenantContext.getStore();await prisma.auditLog.create({data:{tenantId,actorId:context?.userId,action,resource,resourceId,requestId:context?.requestId??randomUUID(),before:before as any,after:after as any}})}
  private createDemo(input:TrialInput){if(this.trials.some(t=>t.document===input.document||t.user.email.toLowerCase()===input.email.toLowerCase()))throw new BadRequestException("CNPJ ou e-mail já possui uma conta");const tenantId=randomUUID();const t:DemoTrial={tenantId,name:input.companyName,document:input.document,state:input.state,city:input.city,segment:input.segment,phone:input.phone,logoDataUrl:input.logoDataUrl,branch:{name:"Matriz",state:input.state},status:"PENDING",limits:{users:2,branches:1,sales:200},user:{id:randomUUID(),tenantId,name:input.name,email:input.email.toLowerCase(),passwordHash:hashPassword(input.password),roles:["ADMIN"]}};this.trials.push(t);this.save();return this.publicDemo(t)}
  private refreshDemo(t:DemoTrial){if(t.status==="TRIAL"&&t.expiresAt&&new Date(t.expiresAt)<=new Date()){t.status="EXPIRED";this.save()}}
  private requireDemo(id:string){const t=this.trials.find(item=>item.tenantId===id);if(!t)throw new BadRequestException("Conta não encontrada");return t}
  private publicDemo(t:DemoTrial){const{passwordHash:_,...user}=t.user;return{...t,user}}
  private publicTenant(t:any){const user=t.users?.[0],branches=(t.branches??[]).map((branch:any)=>({id:branch.id,name:branch.name,state:branch.state})),branch=branches[0]??null;return{tenantId:t.id,name:t.name,document:t.document,state:t.state,city:t.city,segment:t.segment,phone:t.phone,logoDataUrl:t.logoDataUrl,branch,branches,status:t.status,startsAt:t.trialStartsAt?.toISOString(),expiresAt:t.trialExpiresAt?.toISOString(),subscriptionPlan:t.subscriptionPlan,subscriptionExpiresAt:t.subscriptionExpiresAt?.toISOString(),limits:{users:2,branches:1,sales:200},user:user?{id:user.id,tenantId:user.tenantId,name:user.name,email:user.email,roles:user.roles.map((item:any)=>item.role.name)}:null}}
}
