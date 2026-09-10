import type { Metadata, Viewport } from "next";
import "./styles.css";
import "./functional.css";
import { TenantBranding } from "./tenant-branding";
import { LanguageProvider } from "./language-provider";
import { ChatAssistant } from "./chat-assistant";
import { VisitorTracker } from "./visitor-tracker";
export const metadata: Metadata = {
  metadataBase: new URL("https://www.vendamais-app.com"),
  title: "Venda+ | Vendas, estoque e gestão para empresas",
  description: "Venda, estoque, pedidos, caixa e relacionamento em uma operação conectada para restaurantes, pizzarias, adegas, moda e empresas.",
  applicationName: "Venda+ by Omega",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://www.vendamais-app.com",
    siteName: "Venda+",
    title: "Venda+ | Sua operação não pode parar.",
    description: "Vendas, pedidos, estoque, caixa e pós-venda conectados para sua empresa crescer com controle.",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Venda+ — vendas, estoque, pedidos e pós-venda" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Venda+ | Sua operação não pode parar.",
    description: "Vendas, pedidos, estoque, caixa e pós-venda conectados para sua empresa crescer com controle.",
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
