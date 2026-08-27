import { BadRequestException, HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { prisma } from "@varejo/database";
import { randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { hashPassword } from "../demo/demo-store.service";

type TrialInput = { companyName:string; document:string; state:"SP"|"RJ"; city:string; segment:string; phone:string; logoDataUrl?:string; name:string; email:string; password:string };
type DemoTrial = { tenantId:string; name:string; document:string; state:"SP"|"RJ"; city:string; segment:string; phone:string; logoDataUrl?:string; branch:{name:string;state:string}; status:"TRIAL"|"ACTIVE"|"EXPIRED"|"SUSPENDED"; startsAt:string; expiresAt:string; limits:{users:number;branches:number;sales:number}; user:{id:string;tenantId:string;name:string;email:string;passwordHash:string;roles:string[]} };
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
    const startsAt=new Date(),expiresAt=new Date(startsAt.getTime()+7*86_400_000);
    try{
      const tenant=await prisma.$transaction(async tx=>{
        const created=await tx.tenant.create({data:{name:input.companyName.trim(),document,status:"TRIAL",state:input.state,city:input.city.trim(),segment:input.segment,phone:input.phone.replace(/\D/g,""),logoDataUrl:input.logoDataUrl,trialStartsAt:startsAt,trialExpiresAt:expiresAt}});
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

  async findUser(email:string){
    if(this.demoMode){const trial=this.trials.find(t=>t.user.email.toLowerCase()===email.toLowerCase());return trial?{user:trial.user,tenant:trial}:null}
    const user=await prisma.user.findUnique({where:{email:email.trim().toLowerCase()},include:{tenant:true,roles:{include:{role:true}}}});
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
    return{...this.publicTenant(tenant),users:tenant.users.map(user=>({id:user.id,name:user.name,email:user.email,status:user.status,createdAt:user.createdAt,roles:user.roles.map(item=>item.role.name)})),branches:tenant.branches.map(branch=>({id:branch.id,name:branch.name,taxId:branch.taxId,state:branch.state,cityCode:branch.cityCode,stateRegistration:branch.stateRegistration,taxRegime:branch.taxRegime,createdAt:branch.createdAt}))};
  }

  async resetTenantUserPassword(id:string,userId:string,newPassword:string){
    if(this.demoMode){const t=this.requireDemo(id);if(t.user.id!==userId)throw new BadRequestException("Usuário não encontrado");t.user.passwordHash=hashPassword(newPassword);this.save();return{message:"Senha redefinida com sucesso"}}
    const user=await prisma.user.findFirst({where:{id:userId,tenantId:id},select:{id:true}});if(!user)throw new BadRequestException("Usuário não encontrado nesta empresa");
    await prisma.user.update({where:{id:user.id},data:{passwordHash:hashPassword(newPassword)}});return{message:"Senha redefinida com sucesso"};
  }

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

  async activate(id:string){if(this.demoMode){const t=this.requireDemo(id);t.status="ACTIVE";this.save();return this.publicDemo(t)}await prisma.tenant.update({where:{id},data:{status:"ACTIVE"}});return this.get(id)}
  async extend(id:string,days:number){
    if(!Number.isInteger(days)||days<1||days>365)throw new BadRequestException("Informe entre 1 e 365 dias");
    if(this.demoMode){const t=this.requireDemo(id);t.expiresAt=new Date(Math.max(Date.now(),new Date(t.expiresAt).getTime())+days*86_400_000).toISOString();if(t.status==="EXPIRED")t.status="TRIAL";this.save();return this.publicDemo(t)}
    const tenant=await prisma.tenant.findUnique({where:{id}});if(!tenant)throw new BadRequestException("Conta não encontrada");
    const base=Math.max(Date.now(),tenant.trialExpiresAt?.getTime()??Date.now());await prisma.tenant.update({where:{id},data:{trialExpiresAt:new Date(base+days*86_400_000),status:tenant.status==="EXPIRED"?"TRIAL":tenant.status}});return this.get(id);
  }
  async assertLogin(id:string){if(this.demoMode){const t=this.trials.find(item=>item.tenantId===id);if(!t)return;this.refreshDemo(t);return this.assertStatus(t.status)}const tenant=await this.refreshDatabase(id);if(tenant)this.assertStatus(tenant.status)}
  async assertWritable(id:string){return this.assertLogin(id)}

  private async refreshDatabase(id:string){const tenant=await prisma.tenant.findUnique({where:{id}});if(tenant?.status==="TRIAL"&&tenant.trialExpiresAt&&tenant.trialExpiresAt<=new Date())return prisma.tenant.update({where:{id},data:{status:"EXPIRED"}});return tenant}
  private assertStatus(status:string){if(status==="EXPIRED")throw new HttpException("Seu período de teste terminou. Atualize seu plano para continuar.",HttpStatus.PAYMENT_REQUIRED);if(status==="SUSPENDED"||status==="CANCELLED")throw new HttpException("Conta suspensa. Entre em contato com o suporte.",HttpStatus.FORBIDDEN)}
  private createDemo(input:TrialInput){if(this.trials.some(t=>t.document===input.document||t.user.email.toLowerCase()===input.email.toLowerCase()))throw new BadRequestException("CNPJ ou e-mail já possui uma conta");const startsAt=new Date(),tenantId=randomUUID();const t:DemoTrial={tenantId,name:input.companyName,document:input.document,state:input.state,city:input.city,segment:input.segment,phone:input.phone,logoDataUrl:input.logoDataUrl,branch:{name:"Matriz",state:input.state},status:"TRIAL",startsAt:startsAt.toISOString(),expiresAt:new Date(startsAt.getTime()+7*86_400_000).toISOString(),limits:{users:2,branches:1,sales:200},user:{id:randomUUID(),tenantId,name:input.name,email:input.email.toLowerCase(),passwordHash:hashPassword(input.password),roles:["ADMIN"]}};this.trials.push(t);this.save();return this.publicDemo(t)}
  private refreshDemo(t:DemoTrial){if(t.status==="TRIAL"&&new Date(t.expiresAt)<=new Date()){t.status="EXPIRED";this.save()}}
  private requireDemo(id:string){const t=this.trials.find(item=>item.tenantId===id);if(!t)throw new BadRequestException("Conta não encontrada");return t}
  private publicDemo(t:DemoTrial){const{passwordHash:_,...user}=t.user;return{...t,user}}
  private publicTenant(t:any){const user=t.users?.[0],branches=(t.branches??[]).map((branch:any)=>({id:branch.id,name:branch.name,state:branch.state})),branch=branches[0]??null;return{tenantId:t.id,name:t.name,document:t.document,state:t.state,city:t.city,segment:t.segment,phone:t.phone,logoDataUrl:t.logoDataUrl,branch,branches,status:t.status,startsAt:t.trialStartsAt?.toISOString(),expiresAt:t.trialExpiresAt?.toISOString(),limits:{users:2,branches:1,sales:200},user:user?{id:user.id,tenantId:user.tenantId,name:user.name,email:user.email,roles:user.roles.map((item:any)=>item.role.name)}:null}}
}
