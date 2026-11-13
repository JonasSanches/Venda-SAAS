import "reflect-metadata";
import { describe, expect, it } from "vitest";
import { validate } from "class-validator";
import { UpdateOrderProductDto } from "./product.dto";
import { DemoStore } from "../demo/demo-store.service";

describe("product coverage", () => {
  it("accepts a positive yield or an explicit removal and rejects invalid values", async () => {
    const errors = (coverageM2: unknown) => validate(Object.assign(new UpdateOrderProductDto(), { name: "Pedrafix", price: 90, coverageM2 }));
    expect(await errors(10)).toHaveLength(0);
    expect(await errors(null)).toHaveLength(0);
    for (const value of [undefined, 0, -1, 0.0001, 1000000000]) expect((await errors(value)).length).toBeGreaterThan(0);
  });
  it("updates only products belonging to the current company", () => {
    const store = Object.create(DemoStore.prototype) as DemoStore;
    Object.assign(store, { data: { products: [{ id: "p1", tenantId: "a", name: "Pedrafix", price: 90 }] }, save: () => {} });
    expect(() => store.updateOrderProduct("b", "p1", { name: "Outro", price: 20, coverageM2: 10 })).toThrow();
    expect(store.updateOrderProduct("a", "p1", { name: "Pedrafix", price: 90, coverageM2: 10 }).coverageM2).toBe(10);
    expect(store.updateOrderProduct("a", "p1", { name: "Pedrafix", price: 90, coverageM2: null }).coverageM2).toBeNull();
  });
});
