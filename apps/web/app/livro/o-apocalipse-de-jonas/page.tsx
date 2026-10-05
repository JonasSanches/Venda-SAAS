import type { Metadata } from "next";
import { RedirectToLibrary } from "./redirect-to-library";

const shareImage = "/social/o-apocalipse-de-jonas-facebook.png";

export const metadata: Metadata = {
  title: "O Apocalipse de Jonas | PDF e Kindle",
  description:
    "Uma leitura sobre símbolos, revelações e os mistérios que atravessam o tempo. Conheça O Apocalipse de Jonas em PDF ou Kindle.",
  alternates: { canonical: "/livro/o-apocalipse-de-jonas" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://www.vendamais-app.com/livro/o-apocalipse-de-jonas",
    siteName: "Venda+ Biblioteca Digital",
    title: "O Apocalipse de Jonas",
    description:
      "Uma leitura sobre símbolos, revelações e os mistérios que atravessam o tempo.",
    images: [
      {
        url: shareImage,
        width: 1200,
        height: 630,
        alt: "O Apocalipse de Jonas — disponível em PDF e Kindle",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "O Apocalipse de Jonas",
    description:
      "Uma leitura sobre símbolos, revelações e os mistérios que atravessam o tempo.",
    images: [shareImage],
  },
};

export default function OApocalipseDeJonas() {
  return <RedirectToLibrary />;
}
