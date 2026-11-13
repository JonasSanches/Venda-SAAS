import { test } from "node:test";
import assert from "node:assert/strict";
import { calculateProductUnits } from "./product-area-calculation.ts";

test("rounds up units after applying the loss margin", () => {
  assert.equal(calculateProductUnits(25, 5, 10), 6);
  assert.equal(calculateProductUnits(20, 5, 0), 4);
  assert.equal(calculateProductUnits(100, 10, 0), 10);
  assert.equal(calculateProductUnits(0.07, 0.01, 0), 7);
});
test("rejects invalid measurements and impossible quantities", () => {
  for (const values of [[0,5,10], [10,0,10], [10,5,-1], [10,5,101], [Infinity,5,10], [1e30,1,0]]) {
    assert.equal(calculateProductUnits(...values), null);
  }
});
