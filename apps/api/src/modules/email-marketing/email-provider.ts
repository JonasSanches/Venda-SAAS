import { createHmac } from "node:crypto";

export type EmailSendRequest={to:string;from:string;replyTo?:string;subject:string;html:string;text:string;idempotencyKey:string};
export type EmailSendResult={id:string};

/**
 * Campaigns and workers only speak this interface. Providers own their own
 * authorization, payload shape and retryable error semantics.
 */
export interface EmailProvider {
  readonly name:string;
  readonly configured:boolean;
  sendEmail(input:EmailSendRequest):Promise<EmailSendResult>;
  verifyConfiguration():Promise<{ok:boolean;status:"CONFIGURED"|"NOT_CONFIGURED";message?:string}>;
  processWebhook?(payload:unknown,signature?:string):Promise<unknown>;
}

export class ResendEmailProvider implements EmailProvider {
  readonly name="resend";
  private readonly key=process.env.EMAIL_API_KEY??"";
  readonly configured=!!this.key;
  async sendEmail(input:EmailSendRequest){
    if(!this.configured)throw new Error("Provedor de e-mail não configurado.");
    const response=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:`Bearer ${this.key}`,"Content-Type":"application/json","Idempotency-Key":input.idempotencyKey},body:JSON.stringify({from:input.from,to:[input.to],reply_to:input.replyTo,subject:input.subject,html:input.html,text:input.text})});
    const data:any=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(data.message??"Falha no provedor de e-mail.");
    return{id:String(data.id??"")};
  }
  async verifyConfiguration(){return this.configured?{ok:true,status:"CONFIGURED" as const}:{ok:false,status:"NOT_CONFIGURED" as const,message:"Configure EMAIL_PROVIDER=resend e EMAIL_API_KEY no servidor."};}
}

export class UnconfiguredEmailProvider implements EmailProvider {
  readonly name="not_configured"; readonly configured=false;
  async sendEmail(_input:EmailSendRequest):Promise<EmailSendResult>{throw new Error("Provedor de e-mail não configurado.");}
  async verifyConfiguration(){return{ok:false,status:"NOT_CONFIGURED" as const,message:"Configure um provedor de e-mail no servidor."};}
}

export function emailProvider():EmailProvider{
  return String(process.env.EMAIL_PROVIDER??"").toLowerCase()==="resend"?new ResendEmailProvider():new UnconfiguredEmailProvider();
}
export function emailIdempotencyKey(input:Pick<EmailSendRequest,"to"|"subject"|"html">){return createHmac("sha256",process.env.EMAIL_WEBHOOK_SECRET??"email").update(`${input.to}:${input.subject}:${input.html}`).digest("hex");}
