import "reflect-metadata";
import { describe, expect, it } from "vitest";
import { validate } from "class-validator";
import { ProductImageDto } from "./product.dto";
import { TenantLogoDto } from "../platform/trial.dto";
import { PlatformController } from "../platform/platform.controller";

const png = "data:image/png;base64,aGVsbG8=";
describe("image updates", () => {
  it.each([ProductImageDto, TenantLogoDto])("accepts supported images and removal, rejects missing or unsupported data", async (Dto) => {
    const field = Dto === ProductImageDto ? "imageDataUrl" : "logoDataUrl";
    const check = (value: unknown) => validate(Object.assign(new Dto(), value === undefined ? {} : { [field]: value }));
    expect(await check(png)).toHaveLength(0);
    expect(await check(null)).toHaveLength(0);
    expect((await check(undefined)).length).toBeGreaterThan(0);
    expect((await check("data:image/svg+xml;base64,PHN2Zz4=")).length).toBeGreaterThan(0);
    expect((await check(`data:image/png;base64,${"a".repeat(700001)}`)).length).toBeGreaterThan(0);
  });
  it("allows only the current tenant administrator to update a logo", async () => {
    const calls: unknown[] = [];
    const service = { updateLogo: (tenant: string, logo: string | null) => { calls.push([tenant, logo]); return Promise.resolve({}); } };
    const controller = new PlatformController(service as never, {} as never, {} as never);
    const request = (roles: string[]) => ({ identity: { tenantId: "tenant-a", roles } }) as never;
    expect(() => controller.logo(request(["MANAGER"]), { logoDataUrl: png })).toThrow();
    await controller.logo(request(["ADMIN"]), { logoDataUrl: png });
    expect(calls).toEqual([["tenant-a", png]]);
  });
});
