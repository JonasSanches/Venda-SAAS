"use client";

import { ChangeEvent, FormEvent, useMemo, useState } from "react";

type Side = "front" | "back";
type ArtworkLayer = { id: string; name: string; image: string; x: number; y: number; scale: number };
type SideDesign = { layers: ArtworkLayer[]; selectedId?: string };
type Template = "BOARD_SHORTS_SLIT" | "BOARD_SHORTS_STRAIGHT" | "TSHIRT_REGULAR" | "TANK_TOP";
type DesignData = { front: SideDesign; back: SideDesign };

const templates: Record<Template, { name: string; note: string }> = {
  BOARD_SHORTS_SLIT: { name: "Bermuda surf · cavada", note: "Tactel, lateral cavada com acabamento curvo, laço de duas alças e bolso traseiro direito." },
  BOARD_SHORTS_STRAIGHT: { name: "Bermuda surf · reta", note: "Tactel, barra reta, laço de duas alças e bolso traseiro direito." },
  TSHIRT_REGULAR: { name: "Camiseta regular", note: "Modelagem regular com mangas, visualização de frente e costas." },
  TANK_TOP: { name: "Camiseta regata", note: "Modelagem sem mangas, visualização de frente e costas." },
};

const initialSide = (): SideDesign => ({ layers: [] });

export function GarmentStudio({ onSave }: { onSave: (product: { sku: string; name: string; price: number; designTemplate: Template; designData: DesignData }) => Promise<void> }) {
  const [template, setTemplate] = useState<Template>("BOARD_SHORTS_SLIT");
  const [side, setSide] = useState<Side>("front");
  const [design, setDesign] = useState<DesignData>({ front: initialSide(), back: initialSide() });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const currentSide = design[side];
  const current = currentSide.layers.find((layer) => layer.id === currentSide.selectedId);
  const title = useMemo(() => templates[template], [template]);

  function update(values: Partial<Pick<ArtworkLayer, "x" | "y" | "scale">>) {
    if (!current) return;
    setDesign((old) => ({ ...old, [side]: { ...old[side], layers: old[side].layers.map((layer) => layer.id === current.id ? { ...layer, ...values } : layer) } }));
  }
  function selectLayer(id: string) {
    setDesign((old) => ({ ...old, [side]: { ...old[side], selectedId: id } }));
  }
  function removeLayer() {
    if (!current) return;
    setDesign((old) => {
      const layers = old[side].layers.filter((layer) => layer.id !== current.id);
      return { ...old, [side]: { layers, selectedId: layers.at(-1)?.id } };
    });
  }
  function moveLayer(direction: -1 | 1) {
    if (!current) return;
    setDesign((old) => {
      const layers = [...old[side].layers];
      const from = layers.findIndex((layer) => layer.id === current.id);
      const to = Math.max(0, Math.min(layers.length - 1, from + direction));
      if (from !== to) [layers[from], layers[to]] = [layers[to], layers[from]];
      return { ...old, [side]: { ...old[side], layers } };
    });
  }
  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!/^image\/(jpe?g|png)$/i.test(file.type)) return setError("Escolha uma imagem PNG, JPG ou JPEG.");
    if (file.size > 10 * 1024 * 1024) return setError("Cada arquivo deve ter no máximo 10 MB.");
    if (currentSide.layers.length >= 10) return setError("Use no máximo 10 camadas em cada lado da peça.");
    try {
      const image = await optimizeArtwork(file);
      const layer: ArtworkLayer = { id: crypto.randomUUID(), name: file.name, image, x: 50, y: 48, scale: 110 };
      setDesign((old) => ({ ...old, [side]: { layers: [...old[side].layers, layer], selectedId: layer.id } }));
      event.target.value = "";
      setError(""); setMessage(`${file.type === "image/png" ? "PNG transparente" : "Imagem"} adicionado como nova camada ${side === "front" ? "na frente" : "nas costas"}.`);
    } catch { setError("Não foi possível processar esta imagem."); }
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
        <label>Adicionar imagem ou estampa<input type="file" accept="image/png,image/jpeg,.png,.jpg,.jpeg" onChange={upload}/><small>Cada arquivo vira uma camada. PNG transparente pode ser colocado sobre outra imagem.</small></label>
        <div className="artwork-layers"><b>Camadas · de baixo para cima</b>{currentSide.layers.length === 0 && <small>Nenhuma camada adicionada.</small>}{currentSide.layers.map((layer, index) => <button type="button" key={layer.id} className={layer.id === current?.id ? "active" : ""} onClick={() => selectLayer(layer.id)}><span>{index + 1}</span><em>{layer.name}</em></button>)}</div>
        <label>Horizontal <input disabled={!current} type="range" min="0" max="100" value={current?.x ?? 50} onChange={(e) => update({ x: Number(e.target.value) })}/></label>
        <label>Vertical <input disabled={!current} type="range" min="0" max="100" value={current?.y ?? 48} onChange={(e) => update({ y: Number(e.target.value) })}/></label>
        <label>Tamanho <input disabled={!current} type="range" min="15" max="200" value={current?.scale ?? 110} onChange={(e) => update({ scale: Number(e.target.value) })}/></label>
        <button type="button" disabled={!current} onClick={() => update({ x: 50, y: 50, scale: 200 })}>Preencher toda a peça</button>
        <div className="layer-actions"><button type="button" className="secondary" disabled={!current} onClick={() => moveLayer(-1)}>Descer</button><button type="button" className="secondary" disabled={!current} onClick={() => moveLayer(1)}>Subir</button></div>
        <button type="button" className="secondary" disabled={!current} onClick={removeLayer}>Excluir camada selecionada</button>
      </aside>
      <div className="garment-views"><GarmentView id="garment-front" template={template} side="front" design={design.front}/><GarmentView id="garment-back" template={template} side="back" design={design.back}/></div>
    </div>
    <form className="studio-product" onSubmit={save}><label>SKU<input name="sku" required placeholder="Ex.: BERM-SURF-001"/></label><label>Nome do produto<input key={template} name="name" required minLength={2} defaultValue={title.name}/></label><label>Preço<input name="price" type="number" min="0" step="0.01" required/></label><button disabled={saving}>{saving ? "Salvando..." : "Salvar como produto"}</button><button type="button" className="secondary" onClick={exportPdf}>Exportar PDF</button></form>
  </div>;
}

function optimizeArtwork(file: File): Promise<string> {
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
        if (file.type !== "image/png") {
          context.fillStyle = "#ffffff";
          context.fillRect(0, 0, canvas.width, canvas.height);
        }
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        if (file.type === "image/png") {
          const webp = canvas.toDataURL("image/webp", 0.92);
          resolve(webp.startsWith("data:image/webp") ? webp : canvas.toDataURL("image/png"));
        } else resolve(canvas.toDataURL("image/jpeg", 0.9));
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

function GarmentView({ id, template, side, design }: { id: string; template: Template; side: Side; design: SideDesign }) {
  const shorts = template.startsWith("BOARD_SHORTS");
  const curved = template === "BOARD_SHORTS_SLIT";
  const tank = template === "TANK_TOP";
  const clipId = `${id}-clip`;
  const moldImage = shorts
    ? `/molde-bermuda-${curved ? "cavada" : "reta"}-${side === "front" ? "frente" : "costas"}.png`
    : undefined;
  const shape = shorts
    ? side === "front"
      ? curved
        ? "M108 120 Q250 144 392 120 C402 220 418 330 422 400 Q420 424 382 438 Q324 452 275 445 L250 425 L225 445 Q176 452 118 438 Q80 424 78 400 C82 330 98 220 108 120 Z"
        : "M108 120 Q250 144 392 120 L422 420 Q342 448 275 445 L250 425 L225 445 Q158 448 78 420 Z"
      : curved
        ? "M92 118 Q250 142 408 118 C420 224 434 340 438 410 Q436 438 394 452 Q328 468 276 455 L250 435 L224 455 Q172 468 106 452 Q64 438 62 410 C66 340 80 224 92 118 Z"
        : "M92 118 Q250 142 408 118 L438 434 Q346 464 276 455 L250 435 L224 455 Q154 464 62 434 Z"
    : tank
      ? "M165 100 Q195 140 220 105 Q250 85 280 105 Q305 140 335 100 L400 175 L350 235 L332 520 L168 520 L150 235 L100 175 Z"
      : "M155 105 Q205 140 220 105 Q250 88 280 105 Q295 140 345 105 L440 190 L390 275 L345 235 L330 520 L170 520 L155 235 L110 275 L60 190 Z";
  return <article className="garment-view"><h3>{side === "front" ? "Frente" : "Costas"}</h3><svg id={id} viewBox="0 0 500 600" overflow="hidden" role="img" aria-label={`${templates[template].name}, ${side === "front" ? "frente" : "costas"}`}>
    <defs><clipPath id={clipId}><path d={shape} fill="#fff" stroke="none" strokeWidth="0"/></clipPath></defs>
    {!shorts && <path d={shape} fill="#f8fafc" stroke="#172033" strokeWidth="4"/>}
    {design.layers.map((layer) => {
      const imageSize = layer.scale * 3;
      return <image
        key={layer.id}
        href={layer.image}
        x={layer.x * 5 - imageSize / 2}
        y={layer.y * 6 - imageSize / 2}
        width={imageSize}
        height={imageSize}
        preserveAspectRatio="xMidYMid slice"
        clipPath={`url(#${clipId})`}
      />;
    })}
    {shorts && moldImage && <image
      href={moldImage}
      x={side === "front" ? 61 : 30}
      y={side === "front" ? 55 : 80}
      width={side === "front" ? 378 : 440}
      height={side === "front" ? 472 : 440}
      preserveAspectRatio="xMidYMid meet"
      style={{ mixBlendMode: "multiply" }}
    />}
    {!shorts && <><path d="M220 105 Q250 145 280 105" fill="none" stroke="#6b7280" strokeWidth="3"/>{side === "back" && <path d="M205 120 Q250 150 295 120" fill="none" stroke="#9ca3af" strokeWidth="2"/>}</>}
    <rect x="150" y="180" width="200" height="230" rx="8" fill="none" stroke="#c4932b" strokeWidth="2" strokeDasharray="8 7" opacity=".75"/>
    <text x="250" y="565" textAnchor="middle" fontSize="14" fill="#667085">{side === "front" ? "FRENTE" : "COSTAS"} · área visual tracejada</text>
  </svg></article>;
}
