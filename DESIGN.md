---
version: alpha
name: Invest Calculator
description: A quiet financial workbench with violet assumptions and clearly labeled numeric outputs.
colors:
  primary: "#51458c"
  primary-hover: "#413670"
  background: "#f7f8fa"
  surface: "#ffffff"
  ink: "#252737"
  muted: "#666a7e"
  line: "#e6e8ef"
  tint: "#eeebf6"
  success: "#26705b"
  success-tint: "#eaf4ef"
  danger: "#a33648"
  scroll-thumb: "#b9b8c9"
  scroll-hover: "#8d8aa6"
  scroll-active: "#51458c"
typography:
  sans:
    fontFamily: "DM Sans Variable, sans-serif"
  display:
    fontFamily: "Manrope Variable, sans-serif"
rounded:
  panel: "16px"
  control: "8px"
spacing:
  panel-gap: "24px"
  page-padding: "46px"
components:
  button:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
  input:
    backgroundColor: "{colors.background}"
    textColor: "{colors.ink}"
---

# Invest Calculator Design System

## Overview

Reference: the working surface of a personal financial planning notebook, organized like a modern calculation instrument. This is product UI for manual analysis alongside a data website. Signature: the violet entry-price band makes the investor's chosen discount visibly distinct from raw model prices.

Runtime token ownership is `src/app/globals.css`: CSS custom properties are canonical and mirrored here. Tailwind v4 aliases reference those variables. Components consume semantic variables and shared field/metric recipes. Brazilian Portuguese UI and number formatting, BRL output, no Japan-market scope.

## Colors

White panels against cool gray establish task boundaries. Violet identifies chosen assumptions and primary actions. Green and red annotate signed comparisons and never imply a recommendation. Every signed output includes a numerical percentage and description. The system has one light theme; forced-colors remains operable.

## Typography

Locally hosted Manrope headings and DM Sans body avoid external font requests. Display tracking stays at -0.04em. Numeric outputs use tabular figures. Keep monetary output large enough to scan without giving it advertising-scale prominence.

## Layout

A 233px desktop rail, two-column input/result workspace, inline method disclosures and a comparison shelf. At 950px the rail becomes horizontal navigation; at 680px panels stack. Tables scroll in their own bounded region. No page-level horizontal overflow.

## Elevation & Depth

Borders and tonal surfaces own depth. No drop shadows, gradients, decorative blur or glass. Results remain on a white surface; entry prices receive a flat violet tint.

## Shapes

16px panel radius and 8px control radius. Small badges are softly squared. Lucide outline icons use one stroke family. No decorative illustrations or emoji icons.

## Components

The shared Field owns labels, parsing feedback, focus and error description. Native range controls are canonical for safety margin; no select/listbox is required. Plain buttons switch tools, with `aria-current` on the active calculator.

DividendEstimator owns the inline disclosure for deriving annual dividends from the entered quote and trailing-12-month DY. Valuation and income reuse this component. Applying the estimate is explicit; changing the quote or DY never silently replaces the dividend field. The estimate displays up to six decimal places.

Paired fields share label, input and hint grid tracks through CSS subgrid, so a wrapped label never pushes one input below its neighbor. Older browsers reserve a common label height as a fallback. Labels wrap without truncation.

Empty results explain required inputs. Missing model outputs use an em dash with a textual reason. Storage notifications use one stable live region. Disabled saving/export remain visibly disabled. Inline disclosures use native details/summary keyboard behavior. No modal workflow is needed.

Sign-in uses a centered 430px column, the same panel and field tokens, a masked password with an accessible visibility toggle, inline errors, and a fixed-height pending button. The authenticated header identifies the admin and provides Sign out. Errors preserve the username and focus the missing field or password.

Global scrollbars inherit tokenized thumb/track colors with hover and active variants. Focus uses a visible violet outline. Selection and input caret use the same palette. Reduced-motion disables transitions and smooth scrolling.

## Do's and Don'ts

- Keep data-entry hints tied to Investidor10's public LPA/VPA terminology.
- Identify example numbers as illustrative, never live data.
- Keep scenario percentages and output units explicit.
- Do not use marketing cards, hero statistics or decorative charts. The growth chart is backed by a numeric year table.
- Do not replace missing financial evidence with recommendations.
