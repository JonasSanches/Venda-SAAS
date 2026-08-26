import type { Metadata, Viewport } from "next";
import "./styles.css";
import "./functional.css";
import { TenantBranding } from "./tenant-branding";
export const metadata: Metadata = { title: "VarejoOS", description: "Gestão de vendas, estoque e fiscal" };
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body><TenantBranding/>{children}</body></html>;
}
