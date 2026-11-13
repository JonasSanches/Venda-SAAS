import "reflect-metadata";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";

const db=vi.hoisted(()=>({product:{findMany:vi.fn()},qrCheckoutLink:{findFirst:vi.fn(),findMany:vi.fn(),create:vi.fn()},qrCheckoutOrder:{findUnique:vi.fn(),updateMany:vi.fn(),create:vi.fn()},user:{findMany:vi.fn()}}));
vi.mock("@varejo/database",()=>({prisma:db,withTenant:(_tenantId:string,work:(tx:typeof db)=>unknown)=>work(db)}));
import { QrCheckoutService } from "./qr-checkout.service";
import { PublicCheckoutDto, LinkDto } from "./qr-checkout.dto";

const offerId="9d62577c-914e-4a89-a7c5-fdf3c922841b";
const otherOffer="75c53d95-2271-4c9f-bef0-3a22d845f371";
const productId="e10bac24-0278-4d7a-acdb-fdab44d08b2a";
const tenantId="tenant-a";
const input={buyerName:"Cliente",items:[{offerId,quantity:1}]};
let previousToken:string|undefined;
beforeEach(()=>{vi.resetAllMocks();previousToken=process.env.MERCADO_PAGO_ACCESS_TOKEN;process.env.MERCADO_PAGO_ACCESS_TOKEN="test-token"});
afterEach(()=>{vi.unstubAllGlobals();if(previousToken===undefined)delete process.env.MERCADO_PAGO_ACCESS_TOKEN;else process.env.MERCADO_PAGO_ACCESS_TOKEN=previousToken});
function service(){return new QrCheckoutService({sendToUsers:vi.fn().mockResolvedValue(undefined)} as never)}

describe("QR checkout isolation and payments",()=>{
 it("does not link a product belonging to another company",async()=>{
  db.product.findMany.mockResolvedValue([]);
  await expect(service().create(tenantId,{name:"Menu",forceNew:true,deliveryEnabled:false,addressRequired:false,offers:[{productId,title:"Item",price:10}]})).rejects.toThrow("Produto não encontrado nesta empresa");
  expect(db.product.findMany).toHaveBeenCalledWith({where:{tenantId,id:{in:[productId]}},select:{id:true}});
  expect(db.qrCheckoutLink.create).not.toHaveBeenCalled();
 });
 it("does not publish an image from another company on an old inconsistent link",async()=>{
  db.qrCheckoutLink.findFirst.mockResolvedValue({id:"link",tenantId,name:"Menu",deliveryEnabled:false,addressRequired:false,tenant:{name:"Empresa"},offers:[{id:offerId,title:"Item",price:10,product:{tenantId:"tenant-b",imageDataUrl:"private-image"}}]});
  const value=await service().publicLink("secret-token");
  expect(value.offers[0].imageDataUrl).toBeNull();
 });
 it("rejects foreign or repeated offers instead of silently changing a customer's cart",async()=>{
  db.qrCheckoutLink.findFirst.mockResolvedValue({id:"link",tenantId,active:true,addressRequired:false,offers:[{id:offerId,price:10,productId:null}]});
  await expect(service().checkout("token",{...input,items:[...input.items,{offerId:otherOffer,quantity:1}]})).rejects.toThrow("itens válidos");
  await expect(service().checkout("token",{...input,items:[...input.items,...input.items]})).rejects.toThrow("sem repetições");
  expect(db.qrCheckoutOrder.create).not.toHaveBeenCalled();
 });
 it("rejects a checkout with a legacy product linked to another company",async()=>{
  db.qrCheckoutLink.findFirst.mockResolvedValue({id:"link",tenantId,active:true,addressRequired:false,offers:[{id:offerId,price:10,productId}]});db.product.findMany.mockResolvedValue([]);
  await expect(service().checkout("token",input)).rejects.toThrow("produto indisponível");
  expect(db.qrCheckoutOrder.create).not.toHaveBeenCalled();
 });
 it("does not accept invalid quantities or prices",async()=>{
  const invalid=plainToInstance(PublicCheckoutDto,{...input,items:[{offerId,quantity:100001}]});
  const price=plainToInstance(LinkDto,{name:"Menu",deliveryEnabled:false,addressRequired:false,offers:[{title:"Item",price:1.234}]});
  expect((await validate(invalid)).length).toBeGreaterThan(0);expect((await validate(price)).length).toBeGreaterThan(0);
 });
 it("marks approval only once even when the same notification is delivered repeatedly",async()=>{
  db.qrCheckoutOrder.findUnique.mockResolvedValue({id:"order",tenantId,total:10,status:"PENDING",buyerName:"Pessoa"});db.qrCheckoutOrder.updateMany.mockResolvedValueOnce({count:1}).mockResolvedValueOnce({count:0});db.user.findMany.mockResolvedValue([]);
  vi.stubGlobal("fetch",vi.fn().mockResolvedValue({ok:true,json:async()=>({id:"123",external_reference:"ref",transaction_amount:10,currency_id:"BRL",status:"approved"})}));
  const push={sendToUsers:vi.fn().mockResolvedValue(undefined)};const instance=new QrCheckoutService(push as never);
  await instance.webhook("123");await instance.webhook("123");
  expect(push.sendToUsers).toHaveBeenCalledTimes(2);
  expect(db.qrCheckoutOrder.updateMany).toHaveBeenCalledTimes(2);
 });
 it("rejects payments with a different currency or amount",async()=>{
  db.qrCheckoutOrder.findUnique.mockResolvedValue({id:"order",tenantId,total:10,status:"PENDING"});
  vi.stubGlobal("fetch",vi.fn().mockResolvedValue({ok:true,json:async()=>({id:"123",external_reference:"ref",transaction_amount:10,currency_id:"USD",status:"approved"})}));
  await expect(service().webhook("123")).rejects.toThrow("não conferem");expect(db.qrCheckoutOrder.updateMany).not.toHaveBeenCalled();
 });
});
