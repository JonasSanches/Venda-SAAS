"use client";

import { ChangeEvent, FormEvent, useMemo, useState } from "react";

type Side = "front" | "back";
type Placement = { image?: string; x: number; y: number; scale: number };
type Template = "BOARD_SHORTS_SLIT" | "BOARD_SHORTS_STRAIGHT" | "TSHIRT_REGULAR" | "TANK_TOP";
type DesignData = { front: Placement; back: Placement };

const templates: Record<Template, { name: string; note: string }> = {
  BOARD_SHORTS_SLIT: { name: "Bermuda surf · cavada", note: "Tactel, lateral cavada com acabamento curvo, laço de duas alças e bolso traseiro direito." },
  BOARD_SHORTS_STRAIGHT: { name: "Bermuda surf · reta", note: "Tactel, barra reta, laço de duas alças e bolso traseiro direito." },
  TSHIRT_REGULAR: { name: "Camiseta regular", note: "Modelagem regular com mangas, visualização de frente e costas." },
  TANK_TOP: { name: "Camiseta regata", note: "Modelagem sem mangas, visualização de frente e costas." },
};

const initialPlacement = (): Placement => ({ x: 50, y: 45, scale: 48 });

export function GarmentStudio({ onSave }: { onSave: (product: { sku: string; name: string; price: number; designTemplate: Template; designData: DesignData }) => Promise<void> }) {
  const [template, setTemplate] = useState<Template>("BOARD_SHORTS_SLIT");
  const [side, setSide] = useState<Side>("front");
  const [design, setDesign] = useState<DesignData>({ front: initialPlacement(), back: initialPlacement() });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const current = design[side];
  const title = useMemo(() => templates[template], [template]);

  function update(values: Partial<Placement>) {
    setDesign((old) => ({ ...old, [side]: { ...old[side], ...values } }));
  }
  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!/^image\/jpe?g$/i.test(file.type)) return setError("Por enquanto, escolha uma imagem JPG ou JPEG.");
    if (file.size > 10 * 1024 * 1024) return setError("A arte deve ter no máximo 10 MB por lado.");
    try {
      const image = await optimizeJpeg(file);
      update({ image }); setError(""); setMessage(`Arte JPG aplicada e otimizada no lado ${side === "front" ? "da frente" : "das costas"}.`);
    } catch { setError("Não foi possível processar esta imagem JPG."); }
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setSaving(true); setError("");
    try {
      await onSave({ sku: String(data.get("sku")), name: String(data.get("name")), price: Number(data.get("price")), designTemplate: template, designData: design });
      setMessage("Modelo salvo no cadastro de produtos.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível salvar o produto."); }
    finally { setSaving(false); }
  }
  function exportPdf() {
    const popup = window.open("", "_blank");
    if (!popup) return setError("Permita pop-ups para exportar o PDF.");
    popup.opener = null;
    const front = document.getElementById("garment-front")?.outerHTML ?? "";
    const back = document.getElementById("garment-back")?.outerHTML ?? "";
    popup.document.write(`<!doctype html><html><head><title>${title.name}</title><style>@page{size:A4 landscape;margin:12mm}body{font-family:Arial;color:#172033}h1{font-size:22px;margin:0 0 5px}p{font-size:11px;color:#596579;margin:0 0 14px}.views{display:grid;grid-template-columns:1fr 1fr;gap:20px}.view{border:1px solid #ccd4df;border-radius:12px;padding:12px;text-align:center}.view h2{font-size:14px}.view svg{width:100%;height:160mm}footer{font-size:9px;color:#667085;margin-top:10px}</style></head><body><h1>${title.name}</h1><p>${title.note}</p><div class="views"><div class="view"><h2>Frente</h2>${front}</div><div class="view"><h2>Costas</h2>${back}</div></div><footer>Venda+ · ficha visual de personalização. Confirme medidas, cores, sangria e acabamento com a produção antes da fabricação.</footer><script>setTimeout(()=>window.print(),300)</script></body></html>`);
    popup.document.close();
  }
  return <div className="garment-studio">
    <section className="studio-intro"><div><small>CRIAÇÃO E PERSONALIZAÇÃO</small><h2>Monte a peça antes de produzir</h2><p>Escolha o molde, envie sua arte e ajuste frente e costas. O resultado pode virar um produto do catálogo ou uma ficha em PDF para aprovação.</p></div><div className="studio-warning"><b>Molde visual</b><span>Use para criação e aprovação. Medidas de corte, costura, sangria e gradação devem ser confirmadas com a produção.</span></div></section>
    {error && <div className="error">{error}</div>}{message && <div className="success">{message}</div>}
    <div className="template-picker">{(Object.keys(templates) as Template[]).map((key) => <button type="button" key={key} className={template === key ? "active" : ""} onClick={() => setTemplate(key)}><b>{templates[key].name}</b><span>{templates[key].note}</span></button>)}</div>
    <div className="studio-workspace">
      <aside className="studio-controls">
        <div className="side-switch"><button type="button" className={side === "front" ? "active" : ""} onClick={() => setSide("front")}>Frente</button><button type="button" className={side === "back" ? "active" : ""} onClick={() => setSide("back")}>Costas</button></div>
        <label>Arte do lado selecionado<input type="file" accept="image/jpeg,.jpg,.jpeg" onChange={upload}/><small>JPG ou JPEG de até 10 MB. A imagem é otimizada automaticamente.</small></label>
        <label>Horizontal <input type="range" min="20" max="80" value={current.x} onChange={(e) => update({ x: Number(e.target.value) })}/></label>
        <label>Vertical <input type="range" min="20" max="78" value={current.y} onChange={(e) => update({ y: Number(e.target.value) })}/></label>
        <label>Tamanho <input type="range" min="15" max="90" value={current.scale} onChange={(e) => update({ scale: Number(e.target.value) })}/></label>
        <button type="button" className="secondary" onClick={() => update({ image: undefined, x: 50, y: 45, scale: 48 })}>Limpar este lado</button>
      </aside>
      <div className="garment-views"><GarmentView id="garment-front" template={template} side="front" placement={design.front}/><GarmentView id="garment-back" template={template} side="back" placement={design.back}/></div>
    </div>
    <form className="studio-product" onSubmit={save}><label>SKU<input name="sku" required placeholder="Ex.: BERM-SURF-001"/></label><label>Nome do produto<input key={template} name="name" required minLength={2} defaultValue={title.name}/></label><label>Preço<input name="price" type="number" min="0" step="0.01" required/></label><button disabled={saving}>{saving ? "Salvando..." : "Salvar como produto"}</button><button type="button" className="secondary" onClick={exportPdf}>Exportar PDF</button></form>
  </div>;
}

function optimizeJpeg(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const image = new Image();
      image.onerror = reject;
      image.onload = () => {
        const maximum = 1800;
        const ratio = Math.min(1, maximum / Math.max(image.naturalWidth, image.naturalHeight));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.naturalWidth * ratio));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * ratio));
        const context = canvas.getContext("2d");
        if (!context) return reject(new Error("Canvas indisponível"));
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.9));
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

function GarmentView({ id, template, side, placement }: { id: string; template: Template; side: Side; placement: Placement }) {
  const shorts = template.startsWith("BOARD_SHORTS");
  const curved = template === "BOARD_SHORTS_SLIT";
  const tank = template === "TANK_TOP";
  const clipId = `${id}-clip`;
  const shape = shorts
    ? curved
      ? "M125 105 Q250 88 375 105 L400 462 Q394 494 348 502 Q310 509 270 493 L250 335 L230 493 Q190 509 152 502 Q106 494 100 462 Z"
      : "M125 105 Q250 88 375 105 L405 500 Q335 512 272 500 L250 335 L228 500 Q165 512 95 500 Z"
    : tank
      ? "M165 100 Q195 140 220 105 Q250 85 280 105 Q305 140 335 100 L400 175 L350 235 L332 520 L168 520 L150 235 L100 175 Z"
      : "M155 105 Q205 140 220 105 Q250 88 280 105 Q295 140 345 105 L440 190 L390 275 L345 235 L330 520 L170 520 L155 235 L110 275 L60 190 Z";
  const imageSize = placement.scale * 3;
  return <article className="garment-view"><h3>{side === "front" ? "Frente" : "Costas"}</h3><svg id={id} viewBox="0 0 500 600" role="img" aria-label={`${templates[template].name}, ${side === "front" ? "frente" : "costas"}`}>
    <defs><clipPath id={clipId}><path d={shape}/></clipPath></defs>
    <path d={shape} fill="#f8fafc" stroke="#172033" strokeWidth="4"/>
    <g clipPath={`url(#${clipId})`}>{placement.image && <image href={placement.image} x={placement.x * 5 - imageSize / 2} y={placement.y * 6 - imageSize / 2} width={imageSize} height={imageSize} preserveAspectRatio="xMidYMid meet"/>}</g>
    {shorts && <>
      <path d="M125 105 Q250 88 375 105 L379 164 Q250 181 121 164 Z" fill="#202938" stroke="#172033" strokeWidth="3"/>
      <path d="M121 164 Q250 181 379 164" fill="none" stroke="#6b7280" strokeWidth="2"/>
      <path d={side === "front" ? "M250 170 L250 335" : "M250 171 Q242 245 250 335"} fill="none" stroke="#596273" strokeWidth="3"/>
      {side === "front" ? <g className="shorts-bow" fill="none" stroke="#f8fafc" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="250" cy="145" r="7" fill="#f8fafc" stroke="#172033" strokeWidth="2"/>
        <path d="M247 145 C232 124 204 127 210 145 C215 162 235 158 248 147"/>
        <path d="M253 145 C268 124 296 127 290 145 C285 162 265 158 252 147"/>
        <path d="M245 151 C232 171 220 192 215 220 M255 151 C268 171 280 192 285 220"/>
      </g> : curved
        ? <g fill="none" stroke="#596273" strokeWidth="3"><path d="M286 217 L354 217 L362 235 L345 252 L294 252 L278 235 Z"/><path d="M290 222 L350 222"/></g>
        : <g fill="none" stroke="#596273" strokeWidth="4" strokeLinecap="round"><path d="M282 220 L354 220"/><path d="M292 228 L344 228" strokeWidth="2"/></g>}
      {curved && <><path d="M102 435 L100 462 Q106 494 152 502 Q190 509 230 493" fill="none" stroke="#c4932b" strokeWidth="7"/><path d="M398 435 L400 462 Q394 494 348 502 Q310 509 270 493" fill="none" stroke="#c4932b" strokeWidth="7"/><path d="M103 180 Q110 320 102 435 M397 180 Q390 320 398 435" fill="none" stroke="#c4932b" strokeWidth="5"/></>}
      {!curved && <path d="M98 486 Q165 500 228 488 M272 488 Q335 500 402 486" fill="none" stroke="#596273" strokeWidth="2"/>}
    </>}
    {!shorts && <><path d="M220 105 Q250 145 280 105" fill="none" stroke="#6b7280" strokeWidth="3"/>{side === "back" && <path d="M205 120 Q250 150 295 120" fill="none" stroke="#9ca3af" strokeWidth="2"/>}</>}
    <rect x="150" y="180" width="200" height="230" rx="8" fill="none" stroke="#c4932b" strokeWidth="2" strokeDasharray="8 7" opacity=".75"/>
    <text x="250" y="565" textAnchor="middle" fontSize="14" fill="#667085">{side === "front" ? "FRENTE" : "COSTAS"} · área visual tracejada</text>
  </svg></article>;
}
