import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.beforeEach(async ({ page }) => {
  if (!process.env.TEST_ADMIN_PASSWORD)
    throw new Error("Set TEST_ADMIN_PASSWORD to run browser tests.");
  await page.goto("/login");
  await page.getByLabel("Username").fill("admin");
  await page
    .getByLabel("Password", { exact: true })
    .fill(process.env.TEST_ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "A clearer view of value." }),
  ).toBeVisible();
});

test("valuation, storage, CSV, invalid data and both secondary tools", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "A clearer view of value.",
  );
  await expect(page.getByText("Your numbers, your perspective.")).toBeVisible();
  await page.getByRole("button", { name: "Load example" }).click();
  await expect(
    page.getByText("R$ 36,74", { exact: true }).first(),
  ).toBeVisible();
  await expect(
    page.getByText("R$ 30,00", { exact: true }).first(),
  ).toBeVisible();
  await page.getByLabel("Safety margin", { exact: true }).fill("40");
  await expect(
    page.getByText("Entry prices with 40% safety margin"),
  ).toBeVisible();
  await page.getByLabel("Asset or scenario").fill("=formula-test");
  await page.getByRole("button", { name: "Save to comparison shelf" }).click();
  await expect(page.locator(".status-message")).toContainText("Scenario saved");
  await page.reload();
  await expect(
    page.getByRole("rowheader", { name: "=formula-test" }),
  ).toBeVisible();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export CSV" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("investment-scenarios.csv");
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk));
  expect(Buffer.concat(chunks).toString()).toContain("'=formula-test");
  await page.getByRole("button", { name: "Load example" }).click();
  await page.getByLabel("Earnings per share").fill("-3");
  await expect(page.getByText("Requires positive LPA and VPA")).toBeVisible();
  await page.getByLabel("Current share price", { exact: true }).fill("1,2,3");
  await expect(
    page.getByLabel("Current share price", { exact: true }),
  ).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByText("Your numbers, your perspective.")).toBeVisible();
  await page.getByRole("button", { name: "Dividend income" }).click();
  await page.getByRole("button", { name: "Load example" }).click();
  await expect(page.getByText("6,667", { exact: true })).toBeVisible();
  await expect(page.getByText("R$ 166.675,00", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Compound growth" }).click();
  await page.getByLabel("Annual return", { exact: true }).fill("0");
  await expect(
    page.getByText("R$ 70.000,00", { exact: true }).first(),
  ).toBeVisible();
  await page.getByText("View the year-by-year breakdown").click();
  await expect(
    page.getByRole("rowheader", { name: "10", exact: true }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("desktop and mobile layout, keyboard focus and accessible states", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await page.getByRole("button", { name: "Load example" }).click();
  await page.screenshot({
    path: ".impeccable/review/desktop.png",
    fullPage: true,
  });
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByLabel("Current share price", { exact: true }).fill("invalid");
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByLabel("Current share price", { exact: true }).fill("25");
  await page.getByRole("button", { name: "Save to comparison shelf" }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: ".impeccable/review/mobile.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByRole("button", { name: "Dividend income" }).click();
  await page.getByRole("button", { name: "Load example" }).click();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByRole("button", { name: "Compound growth" }).click();
  await page.getByText("View the year-by-year breakdown").click();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(
    await page.evaluate(
      () => getComputedStyle(document.documentElement).scrollBehavior,
    ),
  ).toBe("auto");
  await page.reload();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Skip to calculator" }),
  ).toBeFocused();
  await page.getByRole("button", { name: "Load example" }).click();
  await page.getByLabel("Annual dividends / share").fill("1000000000");
  await page.getByLabel("Target dividend yield").fill("0.01");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await expect(
    page.getByRole("region", { name: "Safety margin comparison table" }),
  ).toHaveAttribute("tabindex", "0");
});

test("blocked browser storage retains the calculator and reports the failure", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new Error("Storage unavailable");
      },
    });
  });
  await page.goto("/");
  await expect(page.locator(".status-message")).toContainText(
    "could not be read",
  );
  await page.getByRole("button", { name: "Load example" }).click();
  await page.getByRole("button", { name: "Save to comparison shelf" }).click();
  await expect(page.locator(".status-message")).toContainText(
    "Updated for this session",
  );
  await expect(page.getByRole("rowheader", { name: "EXAMPLE" })).toBeVisible();
});
