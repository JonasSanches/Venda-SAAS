import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "Livro da Sabedoria — Volume 1, disponível em PDF e Kindle · EPUB";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const cover = await readFile(join(process.cwd(), "public", "pdf-covers", "livro-da-sabedoria-volume-1.png"));
  const src = `data:image/png;base64,${cover.toString("base64")}`;
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", background: "#101b31", color: "white", fontFamily: "Arial, sans-serif", padding: "65px 90px", gap: 80 }}>
      <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
        <div style={{ color: "#edbd49", fontSize: 24, fontWeight: 700 }}>VENDA+ · BIBLIOTECA DIGITAL</div>
        <div style={{ display: "flex", flexDirection: "column", marginTop: 45, fontSize: 60, fontWeight: 800, lineHeight: 1.1 }}>
          <span>Livro da</span><span>Sabedoria</span><span style={{ color: "#edbd49" }}>Volume 1</span>
        </div>
        <div style={{ marginTop: 44, fontSize: 26 }}>Conheça a prévia · PDF e Kindle</div>
      </div>
      <img src={src} alt="Capa do Livro da Sabedoria — Volume 1" style={{ height: 470, width: 315, objectFit: "contain" }} />
    </div>,
    size,
  );
}
