import "reflect-metadata";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { CheckoutDto } from "../sales/sales.dto";
const state=vi.hoisted(()=>({events:[] as string[],tx:{branch:{findFirst:vi.fn()},product:{findFirst:vi.fn()},stockMovement:{aggregate:vi.fn(),create:vi.fn()},warehouse:{findFirst:vi.fn()},$executeRaw:vi.fn()}}));
vi.mock("@varejo/database",()=>({withTenant:(_tenantId:string,work:(tx:typeof state.tx)=>unknown)=>work(state.tx)}));
import { OperationalStore } from "./operational-store.service";
let original:string|undefined;
beforeEach(()=>{original=process.env.DEMO_MODE;process.env.DEMO_MODE="false";vi.resetAllMocks();state.events.length=0});
afterEach(()=>{if(original===undefined)delete process.env.DEMO_MODE;else process.env.DEMO_MODE=original});
describe("stock transactions",()=>{
 it("locks the validated company branch before reading or changing its stock",async()=>{
  state.tx.branch.findFirst.mockImplementation(async()=>({id:"branch-a"}));
  state.tx.$executeRaw.mockImplementation(async()=>{state.events.push("lock");return 1});
  state.tx.product.findFirst.mockImplementation(async()=>{state.events.push("product");return{id:"product-a",cost:1}});
  state.tx.stockMovement.aggregate.mockImplementation(async()=>{state.events.push("balance");return{_sum:{quantity:2}}});
  state.tx.warehouse.findFirst.mockResolvedValue({id:"warehouse-a"});
  state.tx.stockMovement.create.mockImplementation(async()=>{state.events.push("write");return{quantity:1,occurredAt:new Date()}});
  await new OperationalStore({} as never).adjustStock("company-a","product-a",1,"teste","branch-a");
  expect(state.tx.branch.findFirst).toHaveBeenCalledWith({where:{id:"branch-a",tenantId:"company-a"}});
  expect(state.events).toEqual(["lock","product","balance","write"]);
 });
 it("rejects a branch from another company before touching stock",async()=>{
  state.tx.branch.findFirst.mockResolvedValue(null);
  await expect(new OperationalStore({} as never).adjustStock("company-a","product-b",1,"teste","branch-b")).rejects.toThrow("Filial inválida");
  expect(state.tx.$executeRaw).not.toHaveBeenCalled();expect(state.tx.stockMovement.create).not.toHaveBeenCalled();
 });
 it("rejects malformed product and quantity data at checkout",async()=>{
  const invalid=plainToInstance(CheckoutDto,{items:[{productId:"not-a-uuid",quantity:-1}],paymentMethod:"PIX"});
  expect((await validate(invalid)).length).toBeGreaterThan(0);
 });
});
