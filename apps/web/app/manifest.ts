import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Venda Mais by Omega",
    short_name: "Venda Mais",
    description: "Sistema de vendas e gestão de estoque.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f8f6",
    theme_color: "#38b487",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
