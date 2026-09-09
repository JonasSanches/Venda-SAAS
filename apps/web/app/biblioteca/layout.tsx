import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Biblioteca digital | Venda+",
  description: "Livros digitais em PDF e para Kindle. Leia páginas selecionadas e escolha sua edição.",
  openGraph: {
    title: "Livros que despertam novas perguntas.",
    description: "Folheie páginas selecionadas e escolha PDF ou Kindle.",
    url: "https://www.vendamais-app.com/biblioteca",
    siteName: "Venda+ Biblioteca digital",
    locale: "pt_BR",
    type: "website",
  },
  twitter: { card: "summary_large_image", title: "Livros que despertam novas perguntas.", description: "PDF e Kindle · páginas selecionadas para conhecer antes de comprar." },
};

export default function BibliotecaLayout({ children }: Readonly<{ children: React.ReactNode }>) { return children; }
