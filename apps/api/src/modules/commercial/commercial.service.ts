import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { withTenant } from "@varejo/database";
import { randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

@Injectable()
export class CommercialService {
  private readonly file=resolve(process.cwd(),"../../storage/commercial-data.json");
  private data:any=this.load();
  private get demo(){return process.env.DEMO_MODE!=="false"}
  private load(){try{return JSON.parse(readFileSync(this.file,"utf8"))}catch{return{parties:[],settings:[],documents:[]}}}
  private save(){mkdirSync(dirname(this.file),{recursive:true});writeFileSync(this.file,JSON.stringify(this.data,null,2))}

  async parties(tenantId:string,type?:string){if(this.demo)return this.data.parties.filter((p:any)=>p.tenantId===tenantId&&(!type||p.type===type));return withTenant(tenantId,tx=>tx.party.findMany({where:{tenantId,...(type?{type:type as "CUSTOMER"|"SUPPLIER"}:{})},orderBy:{createdAt:"desc"}}))}
  async addParty(tenantId:string,input:{type:"CUSTOMER"|"SUPPLIER";name:string;document:string;email?:string;phone?:string}){if(this.demo){if(this.data.parties.some((p:any)=>p.tenantId===tenantId&&p.document===input.document))throw new BadRequestException("Documento já cadastrado");const p={id:randomUUID(),tenantId,...input,createdAt:new Date().toISOString()};this.data.parties.push(p);this.save();return p}try{return await withTenant(tenantId,tx=>tx.party.create({data:{tenantId,...input,document:input.document.replace(/\D/g,"")}}))}catch(e:any){if(e?.code==="P2002")throw new BadRequestException("Documento já cadastrado");throw e}}
  async getSettings(tenantId:string){if(this.demo)return this.data.settings.find((s:any)=>s.tenantId===tenantId)??null;return withTenant(tenantId,tx=>tx.fiscalSettings.findUnique({where:{tenantId}}))}
  async setSettings(tenantId:string,input:{state:"SP"|"RJ";taxRegime:string;stateRegistration:string;cityCode:string;nfeSeries:number;nfceSeries:number}){if(!["SP","RJ"].includes(input.state))throw new BadRequestException("Apenas SP e RJ estão habilitados");if(this.demo){const value={tenantId,...input,environment:"HOMOLOGATION"};this.data.settings=this.data.settings.filter((s:any)=>s.tenantId!==tenantId);this.data.settings.push(value);this.save();return value}return withTenant(tenantId,tx=>tx.fiscalSettings.upsert({where:{tenantId},update:{...input,environment:"HOMOLOGATION"},create:{tenantId,...input,environment:"HOMOLOGATION"}}))}
  async documents(tenantId:string){if(this.demo)return this.data.documents.filter((d:any)=>d.tenantId===tenantId).slice().reverse();const rows=await withTenant(tenantId,tx=>tx.fiscalDocument.findMany({where:{tenantId},include:{order:{select:{number:true}}},orderBy:{createdAt:"desc"}}));return rows.map(d=>({...d,orderNumber:Number(d.order.number),model:d.type==="NFE"?"55":"65",number:Number(d.number),createdAt:d.createdAt.toISOString(),reason:d.rejectionReason}))}
  async issue(tenantId:string,orderId:string,model:"55"|"65"){
    if(this.demo)throw new BadRequestException("Emissão fiscal demonstrativa requer DEMO_MODE=false");
    return withTenant(tenantId,async tx=>{const settings=await tx.fiscalSettings.findUnique({where:{tenantId}});if(!settings)throw new BadRequestException("Configure os dados fiscais da filial");const order=await tx.order.findFirst({where:{id:orderId,tenantId},include:{items:{include:{product:true}}}});if(!order)throw new NotFoundException("Venda não encontrada");if(order.status!=="PAID")throw new BadRequestException("A venda não está válida para emissão");for(const item of order.items){const p=item.product;if(!p.ncm||!p.cfop||!p.csosn||!p.pisCst||!p.cofinsCst)throw new BadRequestException(`Complete o perfil fiscal de ${p.name}`)}if(await tx.fiscalDocument.findFirst({where:{tenantId,orderId,status:"AUTHORIZED"}}))throw new BadRequestException("Venda já possui documento autorizado");const type=model==="55"?"NFE":"NFCE",last=await tx.fiscalDocument.findFirst({where:{tenantId,branchId:order.branchId,type},orderBy:{number:"desc"}}),documentNumber=(last?.number??0n)+1n,series=model==="65"?settings.nfceSeries:settings.nfeSeries;return tx.fiscalDocument.create({data:{tenantId,branchId:order.branchId,orderId,type,status:"PENDING",series,number:documentNumber,idempotencyKey:`${orderId}:${model}`}})})
  }
}
