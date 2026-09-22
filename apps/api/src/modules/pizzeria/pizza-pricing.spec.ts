import { describe, expect, it } from "vitest";
import { calculateFlavorPrice } from "./pizza-pricing";

describe("pizza multi flavor pricing", () => {
  const flavors=[{price:0,fraction:.5},{price:8,fraction:.5}];
  it("charges the highest flavor when configured",()=>expect(calculateFlavorPrice("HIGHEST_PRICE",40,flavors)).toBe(48));
  it("uses the arithmetic average when configured",()=>expect(calculateFlavorPrice("AVERAGE",40,flavors)).toBe(44));
  it("uses each declared fraction for proportional pricing",()=>expect(calculateFlavorPrice("PROPORTIONAL",40,[{price:0,fraction:.25},{price:8,fraction:.75}])).toBe(46));
});
