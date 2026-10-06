import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.beforeEach(async ({ page }) => {
  if (!process.env.TEST_ADMIN_PASSWORD)
    throw new Error("Set TEST_ADMIN_PASSWORD to run browser tests.");
  await page.goto("/login");
  await page.getByLabel("Usuário").fill("admin");
  await page
    .getByLabel("Senha", { exact: true })
    .fill(process.env.TEST_ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Quanto vale a ação?" }),
  ).toBeVisible();
});

test("valuation, storage, CSV, invalid data and both secondary tools", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "pt-BR");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Quanto vale a ação?",
  );
  await expect(page.getByText("Seus indicadores, sua análise.")).toBeVisible();
  await page.getByRole("button", { name: "Carregar exemplo" }).click();
  await expect(
    page.getByText("R$ 36,74", { exact: true }).first(),
  ).toBeVisible();
  await expect(
    page.getByText("R$ 30,00", { exact: true }).first(),
  ).toBeVisible();
  await page.getByLabel("Margem de segurança", { exact: true }).fill("40");
  await expect(
    page.getByText("Preços de entrada com 40% de margem de segurança"),
  ).toBeVisible();
  await page.getByLabel("Ação ou cenário").fill("=formula-test");
  await page.getByRole("button", { name: "Salvar cenário" }).click();
  await expect(page.locator(".status-message")).toContainText("Cenário salvo");
  await page.reload();
  await expect(
    page.getByRole("rowheader", { name: "=formula-test" }),
  ).toBeVisible();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Exportar CSV" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("investment-scenarios.csv");
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk));
  expect(Buffer.concat(chunks).toString()).toContain("'=formula-test");
  await page.getByRole("button", { name: "Carregar exemplo" }).click();
  await page.getByLabel("Lucro por ação").fill("-3");
  await expect(page.getByText("Exige LPA e VPA positivos")).toBeVisible();
  await page.getByLabel("Preço atual da ação", { exact: true }).fill("1,2,3");
  await expect(
    page.getByLabel("Preço atual da ação", { exact: true }),
  ).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByText("Seus indicadores, sua análise.")).toBeVisible();
  await page.getByRole("button", { name: "Renda com dividendos" }).click();
  await page.getByRole("button", { name: "Carregar exemplo" }).click();
  await expect(page.getByText("6.667", { exact: true })).toBeVisible();
  await expect(page.getByText("R$ 166.675,00", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Juros compostos" }).click();
  await page.getByLabel("Rentabilidade anual", { exact: true }).fill("0");
  await expect(
    page.getByText("R$ 70.000,00", { exact: true }).first(),
  ).toBeVisible();
  await page.getByText("Ver a evolução ano a ano").click();
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
  await page.getByRole("button", { name: "Carregar exemplo" }).click();
  await page.screenshot({
    path: ".impeccable/review/desktop.png",
    fullPage: true,
  });
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByLabel("Preço atual da ação", { exact: true }).fill("invalid");
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByLabel("Preço atual da ação", { exact: true }).fill("25");
  await page.getByRole("button", { name: "Salvar cenário" }).click();
  for (const width of [320, 390, 430, 768]) {
    await page.setViewportSize({ width, height: 844 });
    const offsets = await page.locator(".field-pair").evaluateAll((pairs) =>
      pairs.map((pair) => {
        const inputs = pair.querySelectorAll("input");
        return Math.abs(
          inputs[0].getBoundingClientRect().top -
            inputs[1].getBoundingClientRect().top,
        );
      }),
    );
    for (const offset of offsets) expect(offset).toBeLessThan(1);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
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
  await page.getByRole("button", { name: "Renda com dividendos" }).click();
  await page.getByRole("button", { name: "Carregar exemplo" }).click();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByRole("button", { name: "Juros compostos" }).click();
  for (const width of [320, 390, 430, 768]) {
    await page.setViewportSize({ width, height: 844 });
    const offsets = await page.locator(".field-pair").evaluateAll((pairs) =>
      pairs.map((pair) => {
        const inputs = pair.querySelectorAll("input");
        return Math.abs(
          inputs[0].getBoundingClientRect().top -
            inputs[1].getBoundingClientRect().top,
        );
      }),
    );
    for (const offset of offsets) expect(offset).toBeLessThan(1);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByText("Ver a evolução ano a ano").click();
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
    page.getByRole("link", { name: "Ir para a calculadora" }),
  ).toBeFocused();
  await page.getByRole("button", { name: "Carregar exemplo" }).click();
  await page.getByLabel("Proventos anuais por ação").fill("1000000000");
  await page.getByLabel("Rentabilidade desejada").fill("0.01");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await expect(
    page.getByRole("region", { name: "Tabela de comparação das margens" }),
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
    "Não foi possível ler",
  );
  await page.getByRole("button", { name: "Carregar exemplo" }).click();
  await page.getByRole("button", { name: "Salvar cenário" }).click();
  await expect(page.locator(".status-message")).toContainText(
    "Atualizado nesta sessão",
  );
  await expect(page.getByRole("rowheader", { name: "EXEMPLO" })).toBeVisible();
});
