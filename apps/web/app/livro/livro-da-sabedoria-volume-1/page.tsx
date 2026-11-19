import type { Metadata } from "next";
import { RedirectToLibrary } from "./redirect-to-library";

const description = "Uma leitura sobre conhecimento, bem e mal e os símbolos que atravessam essa dualidade. Conheça a prévia e escolha PDF ou Kindle · EPUB.";

export const metadata: Metadata = {
  title: "Livro da Sabedoria — Volume 1 | PDF e Kindle",
  description,
  alternates: { canonical: "/livro/livro-da-sabedoria-volume-1" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://www.vendamais-app.com/livro/livro-da-sabedoria-volume-1",
    siteName: "Venda+ Biblioteca Digital",
    title: "Livro da Sabedoria — Volume 1",
    description,
  },
  twitter: {
    card: "summary_large_image",
    title: "Livro da Sabedoria — Volume 1",
    description,
  },
};

export default function LivroDaSabedoriaVolumeOne() {
  return <RedirectToLibrary />;
}
