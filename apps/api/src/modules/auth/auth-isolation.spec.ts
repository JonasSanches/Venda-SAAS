import "reflect-metadata";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const db=vi.hoisted(()=>({user:{findFirst:vi.fn()},tenant:{findUnique:vi.fn()}}));
vi.mock("@varejo/database",()=>({prisma:db,withTenant:vi.fn()}));
import { AuthService } from "./auth.service";
import { AuthGuard } from "../../common/auth.guard";
import { tenantContext } from "../../common/tenant-context";
let oldDemo:string|undefined;
beforeEach(()=>{vi.resetAllMocks();oldDemo=process.env.DEMO_MODE;process.env.DEMO_MODE="false"});
afterEach(()=>{if(oldDemo===undefined)delete process.env.DEMO_MODE;else process.env.DEMO_MODE=oldDemo});
describe("current user permissions",()=>{
 it("uses current roles from the user's own company rather than stale token roles",async()=>{
  db.user.findFirst.mockResolvedValue({status:"ACTIVE",roles:[{role:{name:"SELLER",tenantId:"a"}},{role:{name:"ADMIN",tenantId:"b"}}]});
  const service=new AuthService({} as never,{} as never);
  await expect(service.assertActive("a","user",["ADMIN"])).resolves.toEqual(["SELLER"]);
  expect(db.user.findFirst).toHaveBeenCalledWith(expect.objectContaining({where:{id:"user",tenantId:"a"}}));
 });
 it("rejects blocked or removed users",async()=>{
  const service=new AuthService({} as never,{} as never);
  db.user.findFirst.mockResolvedValue({status:"BLOCKED",roles:[]});await expect(service.assertActive("a","user",["ADMIN"])).rejects.toThrow();
  db.user.findFirst.mockResolvedValue(null);await expect(service.assertActive("a","user",["ADMIN"])).rejects.toThrow();
 });
 it("keeps support previews read-only",async()=>{
  db.user.findFirst.mockResolvedValue({status:"ACTIVE",roles:[{role:{name:"ADMIN",tenantId:"a"}}]});
  const service=new AuthService({} as never,{} as never);
  await expect(service.assertActive("a","user",["ADMIN","SUPPORT_READONLY"])).resolves.toEqual(["ADMIN","SUPPORT_READONLY"]);
 });
 it("updates both guard and tenant context before authorizing the request",async()=>{
  const auth={verifyToken:()=>({tenantId:"a",userId:"u",roles:["ADMIN"],exp:9999999999}),assertActive:vi.fn().mockResolvedValue(["SELLER"])};
  const reflector={getAllAndOverride:()=>false},trials={assertWritable:vi.fn()};db.tenant.findUnique.mockResolvedValue({segment:"RETAIL"});
  const guard=new AuthGuard(reflector as never,auth as never,trials as never),request={headers:{authorization:"Bearer token"},method:"GET",url:"/api/products",id:"r"};
  const context={getHandler:()=>null,getClass:()=>null,switchToHttp:()=>({getRequest:()=>request})};
  await tenantContext.run({tenantId:"outer",userId:"outer",roles:[],requestId:"outer"},async()=>{expect(await guard.canActivate(context as never)).toBe(true);expect(request).toMatchObject({identity:{tenantId:"a",roles:["SELLER"]}})});
 });
});
