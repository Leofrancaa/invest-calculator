import { test, expect } from "@playwright/test";

test("PWA manifest, icons and worker are public while calculator remains protected", async ({
  page,
  request,
}) => {
  const manifestResponse = await request.get("/manifest.webmanifest");
  expect(manifestResponse.status()).toBe(200);
  expect(manifestResponse.headers()["content-type"]).toContain("manifest");
  const manifest = await manifestResponse.json();
  expect(manifest.display).toBe("standalone");
  expect(manifest.start_url).toBe("/");
  expect(manifest.scope).toBe("/");
  expect(manifest.lang).toBe("pt-BR");
  for (const icon of manifest.icons) {
    const response = await request.get(icon.src);
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("image/png");
    const data = await response.body();
    const size = Number(icon.sizes.split("x")[0]);
    expect(data.readUInt32BE(16)).toBe(size);
    expect(data.readUInt32BE(20)).toBe(size);
  }
  const worker = await request.get("/sw.js");
  expect(worker.status()).toBe(200);
  expect(worker.headers()["cache-control"]).toContain("no-store");
  expect(worker.headers()["content-type"]).toContain("javascript");
  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute(
    "href",
    "/manifest.webmanifest",
  );
  await expect(
    page.locator('meta[name="apple-mobile-web-app-capable"]'),
  ).toHaveAttribute("content", "yes");
  await page.getByText("Instalar no celular", { exact: true }).click();
  await expect(
    page.getByText("Adicionar à Tela de Início", { exact: false }),
  ).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: ".impeccable/review/pwa-install-mobile.png",
    fullPage: true,
  });
  await page.evaluate(() => {
    const event = new Event("beforeinstallprompt");
    Object.defineProperties(event, {
      prompt: { value: async () => undefined },
      userChoice: { value: Promise.resolve({ outcome: "dismissed" }) },
    });
    window.dispatchEvent(event);
  });
  await page
    .getByRole("button", { name: "Instalar aplicativo", exact: true })
    .click();
  await expect(
    page.getByText("Você pode instalar depois pelo menu do navegador."),
  ).toBeVisible();
});

test("offline navigation shows only generic fallback and caches no authenticated content", async ({
  page,
  context,
}) => {
  await page.goto("/login");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  const cachedPaths = await page.evaluate(async () => {
    const keys = await caches.keys();
    const entries = await Promise.all(
      keys.map(async (key) =>
        (await (await caches.open(key)).keys()).map(
          (request) => new URL(request.url).pathname,
        ),
      ),
    );
    return entries.flat().sort();
  });
  expect(cachedPaths).toEqual(["/icons/icon-192.png", "/offline.html"]);
  await context.setOffline(true);
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Você está sem conexão." }),
  ).toBeVisible();
  expect(
    await page
      .locator("img")
      .evaluate(
        (image: HTMLImageElement) =>
          image.complete && image.naturalWidth === 192,
      ),
  ).toBe(true);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: ".impeccable/review/pwa-offline-mobile.png",
    fullPage: true,
  });
  await expect(
    page.getByRole("heading", { name: "Quanto vale a ação?" }),
  ).toHaveCount(0);
  await context.setOffline(false);
  await page.getByRole("link", { name: "Tentar novamente" }).click();
  await expect(page).toHaveURL(/\/login$/);
});
