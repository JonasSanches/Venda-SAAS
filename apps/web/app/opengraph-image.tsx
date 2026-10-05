import { ImageResponse } from "next/og";

export const alt = "Venda+ — soluções de gestão prontas para a operação da sua empresa";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  const pill = (label: string, left: number, top: number, accent = false) => (
    <div style={{ position: "absolute", left, top, display: "flex", alignItems: "center", padding: "11px 16px", borderRadius: 999, border: `1px solid ${accent ? "#f9bf43" : "#4c6685"}`, background: accent ? "#f9bf43" : "#152b48", color: accent ? "#101b31" : "#f7f9fc", fontSize: 18, fontWeight: 700, boxShadow: "0 9px 26px #00000028" }}>{label}</div>
  );
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden", display: "flex", color: "#f8fafc", background: "#0b1f3d", fontFamily: "Arial, sans-serif" }}>
      <div style={{ position: "absolute", width: 750, height: 750, right: -245, top: -325, borderRadius: 999, border: "2px solid #2b6da9", opacity: 0.75 }} />
      <div style={{ position: "absolute", width: 510, height: 510, right: -125, top: -205, borderRadius: 999, border: "2px solid #4e98dd", opacity: 0.6 }} />
      <div style={{ position: "absolute", width: 390, height: 390, right: -65, top: -145, borderRadius: 999, background: "#1670cc", opacity: 0.16 }} />
      <div style={{ position: "absolute", width: 620, height: 620, left: -380, bottom: -425, borderRadius: 999, background: "#69b7ff", opacity: 0.12 }} />
      <div style={{ width: 690, padding: "56px 0 50px 72px", display: "flex", flexDirection: "column", zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 25, fontWeight: 800 }}><span style={{ display: "flex", width: 45, height: 45, alignItems: "center", justifyContent: "center", borderRadius: 13, background: "#1670cc", color: "#fff" }}>V</span>Venda<span style={{ color: "#87c7ff" }}>+</span><span style={{ marginLeft: 5, fontSize: 15, fontWeight: 600, letterSpacing: 2, color: "#b8c6da" }}>GESTÃO QUE ACOMPANHA</span></div>
        <div style={{ display: "flex", marginTop: 66, color: "#87c7ff", fontWeight: 800, fontSize: 17, letterSpacing: 3 }}>SOLUÇÕES PRONTAS PARA A OPERAÇÃO REAL</div>
        <div style={{ display: "flex", flexDirection: "column", marginTop: 20, fontWeight: 800, fontSize: 58, lineHeight: 1.02, letterSpacing: -2.5 }}><div style={{ display: "flex" }}>Sua empresa opera.</div><div style={{ display: "flex" }}>O Venda+ organiza.</div></div>
        <div style={{ display: "flex", marginTop: 23, maxWidth: 590, color: "#c7d9ed", fontSize: 23, lineHeight: 1.35 }}>Vendas, serviços, estoque, caixa e fluxos modelados para a sua realidade.</div>
        <div style={{ display: "flex", marginTop: "auto", gap: 12 }}><div style={{ display: "flex", padding: "13px 20px", borderRadius: 10, background: "#87c7ff", color: "#0b1f3d", fontSize: 19, fontWeight: 800 }}>Cadastro gratuito</div><div style={{ display: "flex", padding: "13px 20px", borderRadius: 10, border: "1px solid #568cc2", color: "#e7f1fb", fontSize: 19, fontWeight: 700 }}>Varejo · Serviços · Logística</div></div>
      </div>
      <div style={{ position: "relative", display: "flex", flex: 1, zIndex: 1 }}>
        <div style={{ position: "absolute", width: 300, height: 300, top: 158, left: 84, borderRadius: 999, border: "2px solid #78bfff", background: "#12365f", boxShadow: "0 0 0 20px #1670cc25, 0 0 60px #1670cc55", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}><div style={{ display: "flex", fontSize: 37, fontWeight: 800 }}>Venda<span style={{ color: "#87c7ff" }}>+</span></div><div style={{ display: "flex", marginTop: 8, fontSize: 14, letterSpacing: 1.4, fontWeight: 700, color: "#d5dfeb" }}>TUDO CONECTADO</div></div>
        {pill("Restaurantes", 8, 143)}
        {pill("Personalizados", 276, 113)}
        {pill("Transportadoras", 290, 318, true)}
        {pill("Oficinas", 10, 402)}
        {pill("Varejo", 328, 452)}
      </div>
    </div>,
    size,
  );
}
