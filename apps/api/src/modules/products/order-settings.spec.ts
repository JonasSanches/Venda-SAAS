import "reflect-metadata";
import { describe, expect, it, vi } from "vitest";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { tenantContext } from "../../common/tenant-context";
import { OrderSettingsDto } from "./order-settings.dto";
import { OrderSettingsService } from "./order-settings.service";

const calls = vi.hoisted(() => ({ upsert: vi.fn(), findUnique: vi.fn() }));
vi.mock("@varejo/database", () => ({ withTenant: (tenantId: string, fn: Function) => fn({ tenantModule: { upsert: (args: unknown) => calls.upsert(tenantId,args), findUnique: (args: unknown) => calls.findUnique(tenantId,args) } }) }));

describe("order destination settings", () => {
  it("validates nested phone numbers and rejects incomplete contacts", async () => {
    const valid=plainToInstance(OrderSettingsDto,{units:[{name:"Ozanan",phone:"5511987654321"}],sellers:["Natiel"]});
    const invalid=plainToInstance(OrderSettingsDto,{units:[{name:"Ozanan",phone:"123"}],sellers:["Natiel"]});
    expect(await validate(valid)).toHaveLength(0);
    expect((await validate(invalid)).length).toBeGreaterThan(0);
  });
  it("allows only managers to save and scopes the record to their tenant", async () => {
    const old=process.env.DEMO_MODE;process.env.DEMO_MODE="false";
    try {
      calls.upsert.mockResolvedValue({});
      const service=new OrderSettingsService();
      const payload={units:[{name:"Ozanan",phone:"5511987654321"}],sellers:["Natiel"]};
      await expect(tenantContext.run({tenantId:"tenant-a",userId:"u",requestId:"test",roles:["SELLER"]},()=>service.update(payload))).rejects.toThrow();
      await tenantContext.run({tenantId:"tenant-a",userId:"u",requestId:"test",roles:["ADMIN"]},()=>service.update(payload));
      expect(calls.upsert).toHaveBeenCalledWith("tenant-a",expect.objectContaining({where:{tenantId_module:{tenantId:"tenant-a",module:"ORDER_ASSISTANT_SETTINGS"}}}));
    } finally {if(old===undefined)delete process.env.DEMO_MODE;else process.env.DEMO_MODE=old}
  });
});
