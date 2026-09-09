import { BadGatewayException, BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@varejo/database";
import { createReadStream, existsSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import { DIGITAL_PRODUCTS, DigitalFormat, digitalPrice } from "./digital-catalog";

@Injectable()
export class DigitalProductsService{
  private token(){const value=process.env.MERCADO_PAGO_ACCESS_TOKEN;if(!value)throw new BadRequestException("Pagamento temporariamente indisponível");return value}
  private directory(){return process.env.DIGITAL_PRODUCTS_DIR??"/app/storage/digital-products"}
  private file(product:{pdfFile:string;kindleFile:string},format:DigitalFormat){return resolve(this.directory(),format==="PDF"?"pdf":"kindle",format==="PDF"?product.pdfFile:product.kindleFile)}
  catalog(){return DIGITAL_PRODUCTS.map(({pdfFile,kindleFile,...product})=>({...product,cover:`/pdf-covers/${product.slug}.png`,preview:`/pdf-previews/${product.slug}.jpg`,prices:{PDF:11.99,KINDLE:39.99},available:{PDF:existsSync(this.file({pdfFile,kindleFile},"PDF")),KINDLE:existsSync(this.file({pdfFile,kindleFile},"KINDLE"))}}))}
  private product(slug:string){const product=DIGITAL_PRODUCTS.find(item=>item.slug===slug);if(!product)throw new NotFoundException("Livro não encontrado");return product}
  async checkout(slug:string,format:DigitalFormat,email:string){
    const product=this.product(slug);if(!existsSync(this.file(product,format)))throw new BadRequestException("Esta edição ainda está sendo preparada para venda");
    const amount=digitalPrice(format),externalReference=`digital-${randomUUID()}`,downloadToken=randomUUID(),base=(process.env.PUBLIC_APP_URL??"https://www.vendamais-app.com").replace(/\/$/,"");
    const purchase=await prisma.digitalPurchase.create({data:{externalReference,downloadToken,productSlug:slug,format,email:email.toLowerCase(),amount}});
    const callback=`${base}/biblioteca?compra=${purchase.id}&token=${downloadToken}`;
    const response=await fetch("https://api.mercadopago.com/checkout/preferences",{method:"POST",headers:{Authorization:`Bearer ${this.token()}`,"Content-Type":"application/json","X-Idempotency-Key":externalReference},body:JSON.stringify({items:[{id:`livro-${slug}-${format.toLowerCase()}`,title:`${product.title} — ${format==="PDF"?"PDF":"Kindle (EPUB)"}`,description:"Livro digital com liberação após a confirmação do pagamento",quantity:1,currency_id:"BRL",unit_price:amount}],payer:{email},external_reference:externalReference,notification_url:`${base}/api/digital-products/webhook`,back_urls:{success:`${callback}&resultado=sucesso`,pending:`${callback}&resultado=pendente`,failure:`${callback}&resultado=falha`},auto_return:"approved",payment_methods:{installments:1},statement_descriptor:"OMEGA LIVROS"})});
    const data=await response.json().catch(()=>({}));
    if(!response.ok){await prisma.digitalPurchase.update({where:{id:purchase.id},data:{status:"ERROR"}});throw new BadGatewayException(data?.message??"Mercado Pago não iniciou o pagamento")}
    const checkoutUrl=process.env.MERCADO_PAGO_SANDBOX==="true"?data.sandbox_init_point:data.init_point;if(!checkoutUrl)throw new BadGatewayException("Mercado Pago não retornou o endereço de pagamento");
    await prisma.digitalPurchase.update({where:{id:purchase.id},data:{preferenceId:data.id,checkoutUrl}});return{checkoutUrl,purchaseId:purchase.id,downloadToken};
  }
  async webhook(paymentId:string){
    if(!paymentId)return{received:true};
    const response=await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`,{headers:{Authorization:`Bearer ${this.token()}`}});if(!response.ok)throw new BadGatewayException("Não foi possível validar o pagamento");
    const data=await response.json(),externalReference=String(data.external_reference??"");
    const purchase=await prisma.digitalPurchase.findUnique({where:{externalReference}});if(!purchase)return{received:true};
    if(Number(data.transaction_amount)!==Number(purchase.amount))throw new BadRequestException("Valor do pagamento não confere");
    const approved=data.status==="approved";
    await prisma.digitalPurchase.update({where:{id:purchase.id},data:{providerPaymentId:String(data.id??""),status:String(data.status??"pending").toUpperCase(),paidAt:approved?new Date(data.date_approved??Date.now()):purchase.paidAt}});
    return{received:true};
  }
  async status(id:string,token:string){const purchase=await prisma.digitalPurchase.findUnique({where:{id}});if(!purchase||purchase.downloadToken!==token)throw new NotFoundException("Compra não encontrada");const product=this.product(purchase.productSlug);return{id:purchase.id,status:purchase.status,title:product.title,format:purchase.format,downloadUrl:purchase.status==="APPROVED"?`/api/digital-products/purchases/${purchase.id}/download?token=${encodeURIComponent(token)}`:undefined}}
  async download(id:string,token:string){
    const purchase=await prisma.digitalPurchase.findUnique({where:{id}});if(!purchase||purchase.downloadToken!==token)throw new NotFoundException("Download não encontrado");if(purchase.status!=="APPROVED")throw new ForbiddenException("Pagamento ainda não aprovado");
    const product=this.product(purchase.productSlug),file=this.file(product,purchase.format as DigitalFormat);if(!existsSync(file))throw new NotFoundException("Arquivo temporariamente indisponível");
    await prisma.digitalPurchase.update({where:{id},data:{downloadCount:{increment:1},lastDownloadedAt:new Date()}});return{stream:createReadStream(file),name:purchase.format==="PDF"?product.pdfFile:product.kindleFile,type:purchase.format==="PDF"?"application/pdf":"application/epub+zip"};
  }
}
