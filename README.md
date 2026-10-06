# Invest Calculator

A small, independent investing workbench built with Next.js App Router, TypeScript and Tailwind CSS. Enter the public indicators you follow on Investidor10; no paid API or server-side database is required. A single administrator account protects access.

## Features

- Graham number, dividend-based Bazin ceiling, custom safety margin and entry-price scenarios.
- Local comparison shelf (up to 12 snapshots) and CSV export.
- Dividend income goals, required capital and current-holdings income.
- Compound growth, fixed monthly contributions, effective annual returns and inflation-adjusted results.
- Responsive interface, keyboard navigation, inline numeric validation and locally hosted fonts.

## Run

Requires Node.js 20.9 or newer.

```sh
npm ci
npm run dev
```

Before starting, copy `.env.example` to `.env.local` and set `ADMIN_PASSWORD_HASH` and `AUTH_SECRET`. Generate a scrypt hash with `hashPassword` in `src/lib/security.ts`; the session secret must contain at least 32 random characters. There is no hardcoded password fallback. The username is `admin`. Open http://localhost:3000. Production: `npm run build` then `npm start`.

## Verify

```sh
npm run lint
npm run typecheck
npm test
npm run format:check
npm run build
```

With the production server running, set `TEST_ADMIN_PASSWORD` in your shell and use `npm run test:browser` for the Playwright login, workspace and accessibility checks. Install its browser once with `npx playwright install chromium`. Do not commit test credentials.

## Deploy to Vercel

Import this repository, choose the Next.js preset and leave the root directory at the repository root. Configure encrypted server-only `ADMIN_PASSWORD_HASH` and `AUTH_SECRET` environment variables. The login remains unavailable until both are configured. No `NEXT_PUBLIC_` credential variables are used.

## Administrator access

Sessions are HS256-signed tokens checked by both the request proxy and the calculator's server page. Cookies are HttpOnly, Secure, SameSite=Lax and expire after eight hours. Next.js Server Actions enforce same-origin mutations. Signing out clears the browser cookie. Changing the password hash or session secret invalidates existing sessions. Vercel access protection can be replaced by this application login after deployment is verified.

## Input conventions and limitations

The interface and exported column labels use Brazilian Portuguese; currency, percentages, quantities and ratios use Brazilian formatting. Code identifiers and technical documentation remain English. Both comma and dot decimal separators are accepted; mixed separators must have valid three-digit grouping. A single separator is always treated as a decimal separator.

Use last-12-month earnings per share (LPA), latest book value per share (VPA), and annual dividends in reais per share, all on a consistent split-adjusted share basis. Inputs are manual; the application does not import or verify Investidor10 data. Example values are illustrative, not live quotes.

Graham requires positive earnings and book value. Bazin here is the dividend-yield price calculation, not the full investment selection method. Safety margin discounts a model price; upside compares that model price with the entered quote. No model guarantees intrinsic value or future return.

Dividend income is an annual estimate divided by 12, not a monthly payment schedule. Compound projections assume constant effective annual return and inflation, fixed nominal contributions at month end, and no taxes or fees. There are no investment recommendations or market feeds.

Saved scenarios stay in local browser storage and are not synchronized. Export a CSV before clearing browser data. Financial inputs stay on the device; sign-in credentials are sent to the server only for authentication.

References: [Graham](https://investidor10.com.br/conteudo/benjamin-graham/) and [Graham/Bazin](https://investidor10.com.br/conteudo/preco-justo-das-acoes-metodo-bazin/).
