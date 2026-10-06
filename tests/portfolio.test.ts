import { test } from "node:test";
import assert from "node:assert/strict";
import {
  emptyPortfolio,
  summarizePortfolio,
  restorePortfolio,
} from "../src/lib/portfolio";

test("portfolio totals and allocations use current amounts and empty categories count as zero", () => {
  assert.equal(summarizePortfolio(emptyPortfolio())!.total, 0);
  const values = {
    ...emptyPortfolio(),
    fixedIncome: "10.000,00",
    realEstateFunds: "5000",
    stocks: "5000",
  };
  const summary = summarizePortfolio(values)!;
  assert.equal(summary.total, 20000);
  assert.equal(summary.activeCategories, 3);
  assert.equal(
    summary.allocation.find((category) => category.id === "fixedIncome")!
      .percentage,
    50,
  );
  assert.equal(
    summary.allocation.find((category) => category.id === "stocks")!.percentage,
    25,
  );
  assert.equal(
    summary.allocation.reduce((sum, category) => sum + category.percentage, 0),
    100,
  );
  assert.deepEqual(
    restorePortfolio(JSON.stringify({ version: 1, values })),
    values,
  );
});

test("invalid amounts and malformed saved data never produce misleading totals", () => {
  for (const amount of ["-1", "wrong", "1,2,3", "1000000000001"]) {
    const values = { ...emptyPortfolio(), stocks: amount };
    assert.equal(summarizePortfolio(values), null);
    assert.throws(() =>
      restorePortfolio(JSON.stringify({ version: 1, values })),
    );
  }
  for (const raw of [
    "invalid",
    "null",
    "{}",
    '{"version":2,"values":{}}',
    '{"version":1,"values":{}}',
  ])
    assert.throws(() => restorePortfolio(raw));
});
