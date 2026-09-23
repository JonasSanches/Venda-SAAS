import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { randomBytes, randomUUID } from "node:crypto";

type Pairing={id:string;token:string;tenantId:string;userId:string;expiresAt:number;events:{id:string;code:string}[]};
@Injectable()
export class ScannerService{
  private readonly pairings=new Map<string,Pairing>();
  private clear(){const now=Date.now();for(const[item,value]of this.pairings)if(value.expiresAt<=now)this.pairings.delete(item)}
  create(tenantId:string,userId:string){this.clear();const id=randomUUID(),token=randomBytes(24).toString("base64url"),expiresAt=Date.now()+10*60_000;this.pairings.set(token,{id,token,tenantId,userId,expiresAt,events:[]});return{id,token,expiresAt:new Date(expiresAt).toISOString()}}
  events(tenantId:string,userId:string,id:string,cursor?:string){this.clear();const pairing=[...this.pairings.values()].find(item=>item.id===id&&item.tenantId===tenantId&&item.userId===userId);if(!pairing)throw new NotFoundException("Sessão de leitura não encontrada ou expirada.");const at=Math.max(0,Number(cursor??0)||0);return{events:pairing.events.slice(at),cursor:pairing.events.length,expiresAt:new Date(pairing.expiresAt).toISOString()}}
  info(token:string){this.clear();const pairing=this.pairings.get(token);if(!pairing)throw new NotFoundException("Este QR Code expirou. Gere um novo no computador.");return{valid:true,expiresAt:new Date(pairing.expiresAt).toISOString()}}
  submit(token:string,code:string){this.clear();const pairing=this.pairings.get(token);if(!pairing)throw new NotFoundException("Este QR Code expirou. Gere um novo no computador.");const normalized=code.trim();if(normalized.length<2||normalized.length>100)throw new BadRequestException("Código de barras inválido.");pairing.events.push({id:randomUUID(),code:normalized});if(pairing.events.length>100)pairing.events=pairing.events.slice(-100);return{accepted:true}}
}
