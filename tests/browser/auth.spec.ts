import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("private login, invalid credentials, session, password visibility and logout", async ({
  page,
  context,
}) => {
  if (!process.env.TEST_ADMIN_PASSWORD)
    throw new Error("Set TEST_ADMIN_PASSWORD to run authentication tests.");
  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
  await expect(
    page.getByRole("heading", { name: "Seu espaço de investimentos." }),
  ).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page.locator("#login-error")).toHaveText("Informe seu usuário.");
  await expect(page.getByLabel("Usuário")).toBeFocused();
  await page.getByLabel("Usuário").fill("admin");
  await page.getByLabel("Senha", { exact: true }).fill("wrong-password");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page.locator("#login-error")).toContainText("incorretos");
  await expect(page).toHaveURL(/\/login$/);
  await page
    .getByLabel("Senha", { exact: true })
    .fill(process.env.TEST_ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Mostrar senha" }).click();
  await expect(page.getByLabel("Senha", { exact: true })).toHaveAttribute(
    "type",
    "text",
  );
  await page.getByRole("button", { name: "Ocultar senha" }).click();
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Quanto vale a ação?" }),
  ).toBeVisible();
  const cookie = (await context.cookies()).find(
    (cookie) => cookie.name === "__Host-invest-session",
  );
  expect(cookie?.httpOnly).toBe(true);
  expect(cookie?.secure).toBe(true);
  expect(cookie?.sameSite).toBe("Lax");
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Quanto vale a ação?" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Sair" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: ".impeccable/review/login-mobile.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});
