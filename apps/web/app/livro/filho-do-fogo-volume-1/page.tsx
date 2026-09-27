import type { Metadata } from "next";

const checkoutUrl = "/biblioteca?livro=filho-do-fogo-daniel-mastral-volume-1&formato=PDF";
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
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "40px 20px",
        background: "#081321",
        color: "#f5f0e8",
      }}
    >
      <article
        style={{
          width: "min(100%, 960px)",
          overflow: "hidden",
          border: "1px solid #485875",
          borderRadius: 20,
          background: "#101d31",
          boxShadow: "0 28px 80px #0008",
        }}
      >
        <img
          src={shareImage}
          alt="Filho do Fogo — Volume I"
          style={{ display: "block", width: "100%", height: "auto" }}
        />
        <section style={{ padding: "28px clamp(22px, 5vw, 48px) 34px" }}>
          <small style={{ color: "#f9bf43", fontWeight: 800, letterSpacing: ".16em" }}>
            BIBLIOTECA DIGITAL
          </small>
          <h1 style={{ margin: "10px 0 12px", fontSize: "clamp(28px, 5vw, 48px)" }}>
            Filho do Fogo — Volume I
          </h1>
          <p style={{ maxWidth: 700, color: "#d6dfeb", fontSize: 18, lineHeight: 1.55 }}>
            O Descortinar da Alta Magia: uma leitura de mistério, escolhas e busca pela verdade.
          </p>
          <a
            href={checkoutUrl}
            style={{
              display: "inline-block",
              marginTop: 12,
              padding: "14px 20px",
              borderRadius: 9,
              background: "#f9bf43",
              color: "#10203a",
              fontWeight: 800,
              textDecoration: "none",
            }}
          >
            Ler e adquirir o PDF
          </a>
        </section>
      </article>
    </main>
  );
}
