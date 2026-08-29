import type { Metadata, Viewport } from "next";
import "./styles.css";
import "./functional.css";
import { TenantBranding } from "./tenant-branding";
import { LanguageProvider } from "./language-provider";
import { ChatAssistant } from "./chat-assistant";
export const metadata: Metadata = {
  title: "Venda+",
  description: "Sistema de vendas e gestão de estoque",
  applicationName: "Venda+ by Omega",
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
  themeColor: "#38b487",
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
          <ChatAssistant />
        </LanguageProvider>
      </body>
    </html>
  );
}
