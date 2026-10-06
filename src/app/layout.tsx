import type { Metadata, Viewport } from "next";
import { PwaSupport } from "@/components/pwa-support";
import "@fontsource-variable/dm-sans";
import "@fontsource-variable/manrope";
import "./globals.css";

export const metadata: Metadata = {
  applicationName: "Invest Calculator",
  other: { "apple-mobile-web-app-capable": "yes" },
  appleWebApp: {
    capable: true,
    title: "Invest Calculator",
    statusBarStyle: "default",
  },
  icons: { apple: "/icons/apple-touch-icon.png" },
  title: "Invest Calculator — Calculadoras de investimentos",
  description:
    "Calcule o preço justo de Graham, o preço-teto de Bazin, a renda com dividendos e os juros compostos. Uma ferramenta gratuita para usar com o Investidor10.",
};

export const viewport: Viewport = {
  themeColor: "#51458c",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
        <PwaSupport />
      </body>
    </html>
  );
}
