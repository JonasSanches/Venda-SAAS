import type { Metadata, Viewport } from "next";
import "./styles.css";
import "./functional.css";
import "./preview-fixes.css";
import "./dashboard.css";
import { TenantBranding } from "./tenant-branding";
import { LanguageProvider } from "./language-provider";
import { ChatAssistant } from "./chat-assistant";
import { VisitorTracker } from "./visitor-tracker";
export const metadata: Metadata = {
  metadataBase: new URL("https://www.vendamais-app.com"),
  title: "Venda+ | Sistemas prontos para a sua operação",
  description: "Vendas, serviços, estoque, caixa e fluxos modelados para restaurantes, varejo, personalizados, transportadoras, oficinas e mais.",
  applicationName: "Venda+ by Omega",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://www.vendamais-app.com",
    siteName: "Venda+",
    title: "Venda+ | Soluções prontas para a sua operação",
    description: "Vendas, serviços, estoque, caixa e fluxos modelados para a realidade da sua empresa.",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Venda+ — soluções de gestão para empresas" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Venda+ | Soluções prontas para a sua operação",
    description: "Vendas, serviços, estoque, caixa e fluxos modelados para a realidade da sua empresa.",
    images: ["/opengraph-image"],
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: "/icon.svg",
  },
  manifest: "/manifest.webmanifest",
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#111b31",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        <LanguageProvider>
          <TenantBranding />
          {children}
          <VisitorTracker />
          <ChatAssistant />
        </LanguageProvider>
      </body>
    </html>
  );
}
