import { ImageResponse } from "next/og";

export const alt = "Venda+ — vendas, estoque, pedidos e pós-venda em uma única operação";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  const pill = (label: string, left: number, top: number, accent = false) => (
    <div style={{ position: "absolute", left, top, display: "flex", alignItems: "center", padding: "11px 16px", borderRadius: 999, border: `1px solid ${accent ? "#f9bf43" : "#4c6685"}`, background: accent ? "#f9bf43" : "#152b48", color: accent ? "#101b31" : "#f7f9fc", fontSize: 18, fontWeight: 700, boxShadow: "0 9px 26px #00000028" }}>{label}</div>
  );
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden", display: "flex", color: "#f8fafc", background: "#0e1b31", fontFamily: "Arial, sans-serif" }}>
      <div style={{ position: "absolute", width: 750, height: 750, right: -245, top: -325, borderRadius: 999, border: "2px solid #315d69", opacity: 0.75 }} />
      <div style={{ position: "absolute", width: 510, height: 510, right: -125, top: -205, borderRadius: 999, border: "2px solid #3c7473", opacity: 0.6 }} />
      <div style={{ position: "absolute", width: 390, height: 390, right: -65, top: -145, borderRadius: 999, background: "#20b989", opacity: 0.08 }} />
      <div style={{ position: "absolute", width: 620, height: 620, left: -380, bottom: -425, borderRadius: 999, background: "#f6b936", opacity: 0.1 }} />
      <div style={{ width: 690, padding: "56px 0 50px 72px", display: "flex", flexDirection: "column", zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 25, fontWeight: 800 }}><span style={{ display: "flex", width: 45, height: 45, alignItems: "center", justifyContent: "center", borderRadius: 13, background: "#29b681", color: "#fff" }}>V</span>Venda<span style={{ color: "#f9bf43" }}>+</span><span style={{ marginLeft: 5, fontSize: 15, fontWeight: 600, letterSpacing: 2, color: "#b8c6da" }}>GESTÃO QUE ACOMPANHA</span></div>
        <div style={{ display: "flex", marginTop: 66, color: "#f9bf43", fontWeight: 800, fontSize: 17, letterSpacing: 3 }}>SISTEMA FEITO PARA A OPERAÇÃO REAL</div>
        <div style={{ display: "flex", flexDirection: "column", marginTop: 20, fontWeight: 800, fontSize: 58, lineHeight: 1.02, letterSpacing: -2.5 }}><div style={{ display: "flex" }}>Sua empresa vende.</div><div style={{ display: "flex" }}>O Venda+ organiza.</div></div>
        <div style={{ display: "flex", marginTop: 23, maxWidth: 590, color: "#c7d4e4", fontSize: 23, lineHeight: 1.35 }}>Pedidos, estoque, caixa, nota fiscal e pós-venda em uma operação conectada.</div>
        <div style={{ display: "flex", marginTop: "auto", gap: 12 }}><div style={{ display: "flex", padding: "13px 20px", borderRadius: 10, background: "#f9bf43", color: "#10203a", fontSize: 19, fontWeight: 800 }}>Teste grátis por 7 dias</div><div style={{ display: "flex", padding: "13px 20px", borderRadius: 10, border: "1px solid #536985", color: "#e7edf5", fontSize: 19, fontWeight: 700 }}>Restaurantes · Moda · Varejo</div></div>
      </div>
      <div style={{ position: "relative", display: "flex", flex: 1, zIndex: 1 }}>
        <div style={{ position: "absolute", width: 300, height: 300, top: 158, left: 84, borderRadius: 999, border: "2px solid #65d4bd", background: "#17334d", boxShadow: "0 0 0 20px #29b68119, 0 0 60px #28d3ac44", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}><div style={{ display: "flex", fontSize: 37, fontWeight: 800 }}>Venda<span style={{ color: "#f9bf43" }}>+</span></div><div style={{ display: "flex", marginTop: 8, fontSize: 14, letterSpacing: 1.4, fontWeight: 700, color: "#d5dfeb" }}>TUDO CONECTADO</div></div>
        {pill("Pedidos", 8, 143)}
        {pill("Estoque", 316, 113)}
        {pill("Caixa", 342, 318, true)}
        {pill("Pós-venda", 10, 402)}
        {pill("Nota fiscal", 286, 452)}
      </div>
    </div>,
    size,
  );
}
