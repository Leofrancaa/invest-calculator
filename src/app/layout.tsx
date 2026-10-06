import type { Metadata } from "next";
import "@fontsource-variable/dm-sans";
import "@fontsource-variable/manrope";
import "./globals.css";

export const metadata: Metadata = {
  title: "Invest Calculator — Calculadoras de investimentos",
  description:
    "Calcule o preço justo de Graham, o preço-teto de Bazin, a renda com dividendos e os juros compostos. Uma ferramenta gratuita para usar com o Investidor10.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
