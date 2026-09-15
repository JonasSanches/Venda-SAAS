import { BadGatewayException, BadRequestException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { prisma } from "@varejo/database";
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { hashPassword, passwordMatches } from "../demo/demo-store.service";
import { DigitalProductsService } from "../digital-products/digital-products.service";

const MEMBERSHIP_AMOUNT=59.90;
const SESSION_SECONDS=60*60*24*30;
type SessionPayload={membershipId:string;version:number;exp:number};

@Injectable()
export class LibraryMembershipsService{
  constructor(private readonly products:DigitalProductsService){}

  private paymentToken(){const value=process.env.MERCADO_PAGO_ACCESS_TOKEN;if(!value)throw new BadRequestException("Pagamento temporariamente indisponível");return value}
  private sessionSecret(){return process.env.LIBRARY_MEMBERSHIP_SESSION_SECRET??process.env.JWT_SECRET??"local-development-secret-change-before-production"}
  private signature(payload:string){return createHmac("sha256",this.sessionSecret()).update(payload).digest("base64url")}
  private session(membership:{id:string;sessionVersion:number}){const payload=Buffer.from(JSON.stringify({membershipId:membership.id,version:membership.sessionVersion,exp:Math.floor(Date.now()/1000)+SESSION_SECONDS} satisfies SessionPayload)).toString("base64url");return `${payload}.${this.signature(payload)}`}
  private parseSession(value?:string){
    if(!value||value.length>1200)throw new UnauthorizedException("Entre na área de membros para continuar");
    try{const[payload,signature]=value.split(".");if(!payload||!signature)throw new Error();const expected=Buffer.from(this.signature(payload),"base64url"),received=Buffer.from(signature,"base64url");if(expected.length!==received.length||!timingSafeEqual(expected,received))throw new Error();const parsed=JSON.parse(Buffer.from(payload,"base64url").toString()) as SessionPayload;if(!parsed.membershipId||!Number.isFinite(parsed.version)||!Number.isFinite(parsed.exp)||parsed.exp<Date.now()/1000)throw new Error();return parsed}catch{throw new UnauthorizedException("Sua sessão expirou. Entre novamente para continuar")}
  }
  private async authenticated(session?:string){const payload=this.parseSession(session),membership=await prisma.libraryMembership.findUnique({where:{id:payload.membershipId}});if(!membership||membership.status!=="APPROVED"||membership.sessionVersion!==payload.version)throw new UnauthorizedException("Seu acesso à biblioteca não está ativo");return membership}
  private async startPreference(membership:{id:string;email:string;externalReference:string;checkoutToken:string}){
    const base=(process.env.PUBLIC_APP_URL??"https://www.vendamais-app.com").replace(/\/$/,""),callback=`${base}/biblioteca/membros?compra=${membership.id}&token=${membership.checkoutToken}`;
    const response=await fetch("https://api.mercadopago.com/checkout/preferences",{method:"POST",headers:{Authorization:`Bearer ${this.paymentToken()}`,"Content-Type":"application/json","X-Idempotency-Key":membership.externalReference},body:JSON.stringify({items:[{id:"biblioteca-acesso-completo",title:"Venda+ Biblioteca — Acesso completo",description:"Área de membros e downloads dos livros digitais disponíveis",quantity:1,currency_id:"BRL",unit_price:MEMBERSHIP_AMOUNT}],payer:{email:membership.email},external_reference:membership.externalReference,notification_url:`${base}/api/library-memberships/webhook`,back_urls:{success:`${callback}&resultado=sucesso`,pending:`${callback}&resultado=pendente`,failure:`${callback}&resultado=falha`},auto_return:"approved",payment_methods:{installments:1},statement_descriptor:"OMEGA LIVROS"})});
    const data=await response.json().catch(()=>({}));if(!response.ok)throw new BadGatewayException(data?.message??"Mercado Pago não iniciou o pagamento");const checkoutUrl=process.env.MERCADO_PAGO_SANDBOX==="true"?data.sandbox_init_point:data.init_point;if(!checkoutUrl)throw new BadGatewayException("Mercado Pago não retornou o endereço de pagamento");await prisma.libraryMembership.update({where:{id:membership.id},data:{preferenceId:data.id,checkoutUrl}});return{checkoutUrl,purchaseId:membership.id,checkoutToken:membership.checkoutToken};
  }
  async checkout(email:string,password:string){
    this.paymentToken();const normalizedEmail=email.trim().toLowerCase(),existing=await prisma.libraryMembership.findUnique({where:{email:normalizedEmail}});
    if(existing?.status==="APPROVED")throw new BadRequestException("Este e-mail já tem acesso à biblioteca. Entre na área de membros.");
    if(existing?.status==="PENDING"&&existing.checkoutUrl){if(!passwordMatches(password,existing.passwordHash))throw new BadRequestException("Já existe um pagamento aguardando para este e-mail. Use a senha definida nessa tentativa.");return{checkoutUrl:existing.checkoutUrl,purchaseId:existing.id,checkoutToken:existing.checkoutToken};}
    const externalReference=`library-membership-${randomUUID()}`,checkoutToken=randomUUID(),data={passwordHash:hashPassword(password),status:"PENDING",amount:MEMBERSHIP_AMOUNT,externalReference,checkoutToken,providerPaymentId:null,preferenceId:null,checkoutUrl:null,paymentMethod:null,paidAt:null};
    const membership=existing?await prisma.libraryMembership.update({where:{id:existing.id},data}):await prisma.libraryMembership.create({data:{email:normalizedEmail,...data}});
    try{return await this.startPreference(membership)}catch(error){await prisma.libraryMembership.update({where:{id:membership.id},data:{status:"ERROR"}});throw error}
  }
  async webhook(paymentId:string){
    if(!paymentId)return{received:true};const response=await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`,{headers:{Authorization:`Bearer ${this.paymentToken()}`}});if(!response.ok)throw new BadGatewayException("Não foi possível validar o pagamento");const data=await response.json(),reference=String(data.external_reference??""),membership=await prisma.libraryMembership.findUnique({where:{externalReference:reference}});if(!membership)return{received:true};if(String(data.currency_id??"")!=="BRL"||Math.round(Number(data.transaction_amount)*100)!==Math.round(Number(membership.amount)*100))throw new BadRequestException("Valor do pagamento não confere");const approved=data.status==="approved";
    await prisma.libraryMembership.update({where:{id:membership.id},data:{providerPaymentId:String(data.id??""),status:String(data.status??"pending").toUpperCase(),paymentMethod:String(data.payment_type_id??data.payment_method_id??""),paidAt:approved?new Date(data.date_approved??Date.now()):membership.paidAt}});return{received:true};
  }
  async purchaseStatus(id:string,checkoutToken:string){const membership=await prisma.libraryMembership.findUnique({where:{id}});if(!membership||membership.checkoutToken!==checkoutToken)throw new NotFoundException("Compra não encontrada");return{id:membership.id,status:membership.status,amount:Number(membership.amount),sessionToken:membership.status==="APPROVED"?this.session(membership):undefined};}
  async login(email:string,password:string){const membership=await prisma.libraryMembership.findUnique({where:{email:email.trim().toLowerCase()}});if(!membership||membership.status!=="APPROVED"||!passwordMatches(password,membership.passwordHash))throw new UnauthorizedException("E-mail, senha ou acesso inválido");return{member:{email:membership.email},sessionToken:this.session(membership)};}
  async logout(session?:string){try{const membership=await this.authenticated(session);await prisma.libraryMembership.update({where:{id:membership.id},data:{sessionVersion:{increment:1}}})}catch{}return{ok:true}}
  async me(session?:string){const membership=await this.authenticated(session);return{email:membership.email};}
  async catalog(session?:string){await this.authenticated(session);return this.products.catalog()}
  async download(session:string|undefined,slug:string,format:string){await this.authenticated(session);return this.products.memberDownload(slug,format)}
}

export const libraryMembershipSessionSeconds=SESSION_SECONDS;
