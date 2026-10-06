import { test } from "node:test";
import assert from "node:assert/strict";
import {
  calculateValuation,
  calculateIncome,
  calculateCompound,
  parseAmount,
} from "../src/lib/calculations";

test("decimal parsing supports Brazilian and English values without silently accepting malformed inputs", () => {
  for (const input of ["1234.56", "1234,56", "1.234,56", "1,234.56"])
    assert.equal(parseAmount(input), 1234.56);
  for (const input of [
    "",
    "NaN",
    "Infinity",
    "1e3",
    "1,2,3",
    "1.2.3",
    "1.23,45",
    "abc",
  ])
    assert.equal(parseAmount(input), null);
  assert.equal(parseAmount("-3,5"), -3.5);
  assert.equal(parseAmount("0"), 0);
});
test("Graham and Bazin independently calculate model prices, upside and safety discounts", () => {
  const result = calculateValuation({
    price: 25,
    eps: 3,
    bvps: 20,
    dividend: 1.8,
    targetYield: 6,
    margin: 25,
  });
  assert.equal(result.graham, Math.sqrt(1350));
  assert.ok(Math.abs(result.bazin! - 30) < 1e-10);
  assert.equal(result.grahamEntry, Math.sqrt(1350) * 0.75);
  assert.ok(Math.abs(result.bazinEntry! - 22.5) < 1e-10);
  assert.ok(Math.abs(result.bazinUpside! - 20) < 1e-10);
  assert.equal(result.pb, 1.25);
});
test("negative earnings, missing data and zero dividends do not produce misleading model values", () => {
  const result = calculateValuation({
    price: 25,
    eps: -3,
    bvps: -20,
    dividend: 0,
    targetYield: 6,
    margin: 25,
  });
  assert.equal(result.graham, null);
  assert.equal(result.pe, null);
  assert.equal(result.pb, null);
  assert.equal(result.bazin, 0);
  assert.equal(result.bazinUpside, -100);
  const missing = calculateValuation({
    price: 25,
    eps: null,
    bvps: 20,
    dividend: null,
    targetYield: 6,
    margin: 25,
  });
  assert.equal(missing.graham, null);
  assert.equal(missing.bazin, null);
});
test("income targets round shares upward and account for current holdings", () => {
  const result = calculateIncome(25, 1.8, 1000, 100)!;
  assert.equal(result.requiredShares, 6667);
  assert.equal(result.additionalShares, 6567);
  assert.equal(result.requiredCapital, 166675);
  assert.equal(result.monthlyAverage, 15);
  assert.equal(calculateIncome(25, 0, 1000, 0), null);
  assert.equal(calculateIncome(25, 2, 1000, 0.5), null);
  assert.equal(calculateIncome(25, 2, 0, 100)!.additionalShares, 0);
});
test("compound growth uses effective annual rates, end-of-month contributions and inflation", () => {
  const result = calculateCompound(1000, 0, 10, 2, 5)!;
  assert.ok(Math.abs(result.total - 1210) < 1e-8);
  assert.ok(Math.abs(result.real - 1210 / 1.05 ** 2) < 1e-8);
  const zero = calculateCompound(1000, 100, 0, 1, 0)!;
  assert.equal(zero.total, 2200);
  assert.equal(zero.earnings, 0);
  const contributions = calculateCompound(
    0,
    100,
    (1.01 ** 12 - 1) * 100,
    1,
    0,
  )!;
  assert.ok(
    Math.abs(contributions.total - 100 * ((1.01 ** 12 - 1) / 0.01)) < 1e-8,
  );
  assert.ok(calculateCompound(1000, 0, -10, 1, 0)!.total < 1000);
  assert.equal(calculateCompound(0, 100, 8, 1.5, 0), null);
});
