import type { Metadata } from "next";
import { RedirectToLibrary } from "./redirect-to-library";

const shareImage = "/social/filho-do-fogo-volume-1-facebook.png";

export const metadata: Metadata = {
  title: "Filho do Fogo — Volume I | PDF",
  description:
    "Uma leitura de mistério, escolhas e busca pela verdade. Conheça Filho do Fogo — Volume I em PDF.",
  alternates: { canonical: "/livro/filho-do-fogo-volume-1" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://www.vendamais-app.com/livro/filho-do-fogo-volume-1",
    siteName: "Venda+ Biblioteca Digital",
    title: "Filho do Fogo — Volume I",
    description:
      "O Descortinar da Alta Magia. Uma leitura de mistério, escolhas e busca pela verdade.",
    images: [
      {
        url: shareImage,
        width: 1200,
        height: 630,
        alt: "Filho do Fogo — Volume I",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Filho do Fogo — Volume I",
    description:
      "O Descortinar da Alta Magia. Uma leitura de mistério, escolhas e busca pela verdade.",
    images: [shareImage],
  },
};

export default function FilhoDoFogoVolumeOne() {
  return <RedirectToLibrary />;
}
