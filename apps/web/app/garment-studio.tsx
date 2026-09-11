"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";

type Side = "front" | "back";
type EditMode = "WHOLE" | "SECTIONS" | "COMBINED";
type PrintArea = "WHOLE" | "BODY" | "WAIST" | "SIDES" | "CORD" | "INTERIOR";
type ArtworkLayer = { id: string; name: string; image: string; x: number; y: number; scale: number; rotation?: number; printArea?: PrintArea };
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
const printAreaLabels: Record<PrintArea, string> = { WHOLE: "Estampa toda", BODY: "Corpo da peça", WAIST: "Cintura", SIDES: "Linhas laterais", CORD: "Cordão", INTERIOR: "Interior" };

export function GarmentStudio({ onSave }: { onSave: (product: { sku: string; name: string; price: number; designTemplate: Template; designData: DesignData }) => Promise<void> }) {
  const [template, setTemplate] = useState<Template>("BOARD_SHORTS_SLIT");
  const [side, setSide] = useState<Side>("front");
  const [editMode, setEditMode] = useState<EditMode>("WHOLE");
  const [printArea, setPrintArea] = useState<PrintArea>("BODY");
  const [design, setDesign] = useState<DesignData>({ front: initialSide(), back: initialSide() });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const currentSide = design[side];
  const current = currentSide.layers.find((layer) => layer.id === currentSide.selectedId);
  const title = useMemo(() => templates[template], [template]);

  function update(values: Partial<Pick<ArtworkLayer, "x" | "y" | "scale" | "rotation" | "printArea">>) {
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
      const selectedArea: PrintArea = template.startsWith("BOARD_SHORTS") && editMode !== "WHOLE"
        ? side === "back" && printArea === "CORD" ? "BODY" : printArea
        : "WHOLE";
      const layer: ArtworkLayer = { id: crypto.randomUUID(), name: file.name, image, x: 50, y: 48, scale: 110, rotation: 0, printArea: selectedArea };
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
        <div className="side-switch"><button type="button" className={side === "front" ? "active" : ""} onClick={() => setSide("front")}>Frente</button><button type="button" className={side === "back" ? "active" : ""} onClick={() => { setSide("back"); if (printArea === "CORD") setPrintArea("BODY"); }}>Costas</button></div>
        <div className="edit-mode-switch"><button type="button" className={editMode === "SECTIONS" ? "active" : ""} onClick={() => { setEditMode("SECTIONS"); if (printArea === "WHOLE") setPrintArea("BODY"); }}>Divisão dos pontos</button><button type="button" className={editMode === "WHOLE" ? "active" : ""} onClick={() => setEditMode("WHOLE")}>Estampa toda</button><button type="button" className={editMode === "COMBINED" ? "active" : ""} onClick={() => setEditMode("COMBINED")}>Usar os dois</button></div>
        {editMode !== "WHOLE" && template.startsWith("BOARD_SHORTS") && <label>{editMode === "COMBINED" ? "Modo da próxima camada" : "Parte a estampar"}<select value={printArea} onChange={(event) => setPrintArea(event.target.value as PrintArea)}>{editMode === "COMBINED" && <option value="WHOLE">Estampa toda</option>}<option value="BODY">Corpo da peça</option><option value="WAIST">Cintura</option><option value="SIDES">Linhas laterais</option><option value="CORD" disabled={side === "back"}>Cordão</option><option value="INTERIOR">Interior</option></select><small>{editMode === "COMBINED" ? "Escolha Estampa toda ou uma parte para cada nova camada." : "A próxima imagem ficará limitada somente a esta parte."}</small></label>}
        {editMode !== "WHOLE" && !template.startsWith("BOARD_SHORTS") && <small className="studio-mode-note">A divisão por partes está disponível nos moldes de bermuda. Para camisetas, use “Estampa toda”.</small>}
        <label>Adicionar imagem ou estampa<input type="file" accept="image/png,image/jpeg,.png,.jpg,.jpeg" onChange={upload}/><small>Cada arquivo vira uma camada. PNG transparente pode ser colocado sobre outra imagem.</small></label>
        <div className="artwork-layers"><b>Camadas · de baixo para cima</b>{currentSide.layers.length === 0 && <small>Nenhuma camada adicionada.</small>}{currentSide.layers.map((layer, index) => <button type="button" key={layer.id} className={layer.id === current?.id ? "active" : ""} onClick={() => selectLayer(layer.id)}><span>{index + 1}</span><em>{layer.name}<small>{printAreaLabels[layer.printArea ?? "WHOLE"]}</small></em></button>)}</div>
        {current && template.startsWith("BOARD_SHORTS") && <label>Área desta camada<select value={current.printArea ?? "WHOLE"} onChange={(event) => update({ printArea: event.target.value as PrintArea })}><option value="WHOLE">Estampa toda</option><option value="BODY">Corpo da peça</option><option value="WAIST">Cintura</option><option value="SIDES">Linhas laterais</option><option value="CORD" disabled={side === "back"}>Cordão</option><option value="INTERIOR">Interior</option></select></label>}
        <label>Horizontal <input disabled={!current} type="range" min="0" max="100" value={current?.x ?? 50} onChange={(e) => update({ x: Number(e.target.value) })}/></label>
        <label>Vertical <input disabled={!current} type="range" min="0" max="100" value={current?.y ?? 48} onChange={(e) => update({ y: Number(e.target.value) })}/></label>
        <label>Tamanho <input disabled={!current} type="range" min="15" max="200" value={current?.scale ?? 110} onChange={(e) => update({ scale: Number(e.target.value) })}/></label>
        <label>Rotação <input disabled={!current} type="range" min="0" max="360" step="1" value={current?.rotation ?? 0} onChange={(e) => update({ rotation: Number(e.target.value) })}/><small>{current ? `${current.rotation ?? 0}°` : "Selecione uma camada"}</small></label>
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

type GarmentMasks = { silhouette: string; body: string; waist: string; sides: string; cord: string; interior: string; whole: string };

function useGarmentMasks(source: string | undefined, side: Side, curved: boolean) {
  const [masks, setMasks] = useState<GarmentMasks>();
  useEffect(() => {
    if (!source) return setMasks(undefined);
    setMasks(undefined);
    let active = true;
    const image = new Image();
    image.onload = () => {
      const width = Math.min(800, image.naturalWidth);
      const height = Math.round(image.naturalHeight * width / image.naturalWidth);
      const canvas = document.createElement("canvas");
      canvas.width = width; canvas.height = height;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) return;
      context.drawImage(image, 0, 0, width, height);
      const pixels = context.getImageData(0, 0, width, height);
      const originalAlpha = new Uint8Array(width * height);
      const barrier = new Uint8Array(width * height);
      for (let index = 0; index < barrier.length; index++) {
        const offset = index * 4;
        const alpha = pixels.data[offset + 3];
        originalAlpha[index] = alpha;
        barrier[index] = alpha > 16 && pixels.data[offset] < 205 && pixels.data[offset + 1] < 205 && pixels.data[offset + 2] < 205 ? 1 : 0;
      }
      const sealed = barrier.slice();
      for (let y = 1; y < height - 1; y++) for (let x = 1; x < width - 1; x++) {
        const index = y * width + x;
        if (barrier[index]) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) sealed[index + dy * width + dx] = 1;
      }
      const flood = (seeds: Array<[number, number]>, borders = false) => {
        const filled = new Uint8Array(width * height), queue = new Int32Array(width * height);
        let head = 0, tail = 0;
        const add = (index: number) => { if (!sealed[index] && !filled[index]) { filled[index] = 1; queue[tail++] = index; } };
        const seed = (normalizedX: number, normalizedY: number) => {
        const centerX = Math.round(normalizedX * (width - 1)), centerY = Math.round(normalizedY * (height - 1));
        for (let radius = 0; radius < 18; radius++) for (let dy = -radius; dy <= radius; dy++) for (let dx = -radius; dx <= radius; dx++) {
          const x = centerX + dx, y = centerY + dy;
          if (x >= 0 && x < width && y >= 0 && y < height && !sealed[y * width + x]) { add(y * width + x); return; }
        }
        };
        if (borders) {
          for (let x = 0; x < width; x++) { add(x); add((height - 1) * width + x); }
          for (let y = 0; y < height; y++) { add(y * width); add(y * width + width - 1); }
        } else seeds.forEach(([x, y]) => seed(x, y));
        while (head < tail) {
          const index = queue[head++], x = index % width;
          if (x > 0) add(index - 1); if (x < width - 1) add(index + 1);
          if (index >= width) add(index - width); if (index < width * (height - 1)) add(index + width);
        }
        return filled;
      };
      const outside = flood([], true);
      const body = flood(side === "back" ? [[.3, .45], [.7, .45], [.71, .36]] : [[.3, .45], [.7, .45]]);
      const regionSeeds = side === "front"
        ? curved
          ? { waist: [[.22, .17], [.36, .18], [.64, .18], [.78, .17]], top: [[.25, .108], [.5, .115], [.75, .108]], sides: [[.055, .48], [.945, .48]], hems: [[.25, .79], [.75, .79]], cord: [[.405, .187], [.595, .187], [.445, .31], [.555, .31]] }
          : { waist: [[.22, .16], [.36, .165], [.64, .165], [.78, .16]], top: [[.25, .105], [.5, .11], [.75, .105]], sides: [[.055, .48], [.945, .48]], hems: [[.25, .862], [.75, .862]], cord: [[.415, .155], [.585, .155], [.445, .245], [.555, .245]] }
        : curved
          ? { waist: [[.22, .15], [.42, .16], [.62, .16], [.82, .15]], top: [[.25, .105], [.5, .112], [.75, .105]], sides: [[.06, .48], [.94, .48]], hems: [[.25, .84], [.75, .84]], cord: [] }
          : { waist: [[.22, .17], [.42, .18], [.62, .18], [.82, .17]], top: [[.25, .125], [.5, .132], [.75, .125]], sides: [[.055, .5], [.945, .5]], hems: [[.25, .84], [.75, .84]], cord: [] };
      const detectedWaist = flood(regionSeeds.waist as Array<[number, number]>);
      const topInterior = flood(regionSeeds.top as Array<[number, number]>);
      const seamAllowance = flood([...(regionSeeds.sides as Array<[number, number]>), ...(regionSeeds.hems as Array<[number, number]>)]);
      const cordRegion = flood(regionSeeds.cord as Array<[number, number]>);
      const cord = Uint8Array.from(cordRegion, (value, index) => {
        const x = index % width, y = Math.floor(index / width);
        return value && x / width > .32 && x / width < .68 && y / height > .1 && y / height < .46 ? 1 : 0;
      });
      const waistProfile = side === "front"
        ? curved ? { left: .12, right: .88, top: .098, topCurve: .022, bottom: .166, bottomCurve: .052 } : { left: .13, right: .87, top: .088, topCurve: .014, bottom: .145, bottomCurve: .036 }
        : curved ? { left: .15, right: .85, top: .087, topCurve: .018, bottom: .166, bottomCurve: .032 } : { left: .16, right: .84, top: .108, topCurve: .018, bottom: .182, bottomCurve: .032 };
      const waist = Uint8Array.from(detectedWaist, (value, index) => {
        const x = index % width / width, y = Math.floor(index / width) / height;
        const position = Math.max(0, Math.min(1, (x - waistProfile.left) / (waistProfile.right - waistProfile.left)));
        const curve = 4 * position * (1 - position);
        const inside = x >= waistProfile.left && x <= waistProfile.right && y >= waistProfile.top + waistProfile.topCurve * curve && y <= waistProfile.bottom + waistProfile.bottomCurve * curve;
        return (value || inside) && !cord[index] ? 1 : 0;
      });
      const sideEnd = curved ? .68 : .76;
      const sides = Uint8Array.from(seamAllowance, (value, index) => {
        const x = index % width, y = Math.floor(index / width);
        return value && y / height > .12 && y / height < sideEnd && (x / width < .16 || x / width > .84) ? 1 : 0;
      });
      const hems = Uint8Array.from(seamAllowance, (value, index) => value && Math.floor(index / width) / height > (curved ? .68 : .76) ? 1 : 0);
      const interior = Uint8Array.from(topInterior, (value, index) => value || hems[index] ? 1 : 0);
      const whole = Uint8Array.from(body, (value, index) => value || waist[index] || sides[index] ? 1 : 0);
      const toDataUrl = (alphaFor: (index: number) => number) => {
        const output = context.createImageData(width, height);
        for (let index = 0; index < width * height; index++) {
          const offset = index * 4;
          output.data[offset] = 255; output.data[offset + 1] = 255; output.data[offset + 2] = 255; output.data[offset + 3] = alphaFor(index);
        }
        context.putImageData(output, 0, 0);
        return canvas.toDataURL("image/png");
      };
      const silhouette = toDataUrl((index) => originalAlpha[index] > 16 && !outside[index] ? 255 : 0);
      const maskUrl = (mask: Uint8Array) => toDataUrl((index) => mask[index] ? 255 : 0);
      if (active) setMasks({ silhouette, body: maskUrl(body), waist: maskUrl(waist), sides: maskUrl(sides), cord: maskUrl(cord), interior: maskUrl(interior), whole: maskUrl(whole) });
    };
    image.src = source;
    return () => { active = false; };
  }, [source, side, curved]);
  return masks;
}

function GarmentView({ id, template, side, design }: { id: string; template: Template; side: Side; design: SideDesign }) {
  const shorts = template.startsWith("BOARD_SHORTS");
  const curved = template === "BOARD_SHORTS_SLIT";
  const tank = template === "TANK_TOP";
  const clipId = `${id}-clip`;
  const silhouetteMaskId = `${id}-silhouette-mask`;
  const bodyMaskId = `${id}-body-mask`;
  const wholeMaskId = `${id}-whole-mask`;
  const waistMaskId = `${id}-waist-mask`;
  const sidesMaskId = `${id}-sides-mask`;
  const cordMaskId = `${id}-cord-mask`;
  const interiorMaskId = `${id}-interior-mask`;
  const moldImage = shorts
    ? !curved && side === "front"
      ? "/molde-bermuda-reta-frente-transparente.png"
      : `/molde-bermuda-${curved ? "cavada" : "reta"}-${side === "front" ? "frente" : "costas"}.png`
    : undefined;
  const garmentMasks = useGarmentMasks(moldImage, side, curved);
  const moldBox = side === "front" ? { x: 61, y: 55, width: 378, height: 472 } : { x: 30, y: 80, width: 440, height: 440 };
  const shape = shorts
    ? side === "front"
      ? curved
        ? "M108 120 Q250 144 392 120 C402 220 418 330 422 400 Q420 424 382 438 Q324 452 275 445 L250 425 L225 445 Q176 452 118 438 Q80 424 78 400 C82 330 98 220 108 120 Z"
        : "M108 120 Q250 144 392 120 L422 420 Q342 448 275 445 L250 425 L225 445 Q158 448 78 420 Z"
      : curved
        ? "M92 118 Q250 142 408 118 C420 224 434 340 438 410 Q436 438 394 452 Q328 468 276 455 L250 435 L224 455 Q172 468 106 452 Q64 438 62 410 C66 340 80 224 92 118 Z"
        : "M92 118 Q250 142 408 118 L438 434 Q346 464 276 455 L250 435 L224 455 Q154 464 62 434 Z"
    : tank
      ? side === "front"
        ? "M150 92 L188 106 C204 116 214 133 225 147 C240 167 260 167 275 147 C286 133 296 116 312 106 L350 92 C353 120 365 153 372 176 C365 202 353 222 334 240 L352 520 Q250 536 148 520 L166 240 C147 222 135 202 128 176 C135 153 147 120 150 92 Z"
        : "M150 92 L188 106 C204 115 215 126 226 137 C241 153 259 153 274 137 C285 126 296 115 312 106 L350 92 C353 120 365 153 372 176 C365 202 353 222 334 240 L352 520 Q250 536 148 520 L166 240 C147 222 135 202 128 176 C135 153 147 120 150 92 Z"
      : "M155 105 Q205 140 220 105 Q250 88 280 105 Q295 140 345 105 L440 190 L390 275 L345 235 L330 520 L170 520 L155 235 L110 275 L60 190 Z";
  return <article className="garment-view"><h3>{side === "front" ? "Frente" : "Costas"}</h3><svg id={id} viewBox="0 0 500 600" overflow="hidden" role="img" aria-label={`${templates[template].name}, ${side === "front" ? "frente" : "costas"}`}>
    <defs>
      <clipPath id={clipId}><path d={shape} fill="#fff" stroke="none" strokeWidth="0"/></clipPath>
      {shorts && garmentMasks && <>
        <mask id={silhouetteMaskId} maskUnits="userSpaceOnUse" x="0" y="0" width="500" height="600"><image href={garmentMasks.silhouette} {...moldBox} preserveAspectRatio="xMidYMid meet"/></mask>
        <mask id={bodyMaskId} maskUnits="userSpaceOnUse" x="0" y="0" width="500" height="600"><image href={garmentMasks.body} {...moldBox} preserveAspectRatio="xMidYMid meet"/></mask>
        <mask id={wholeMaskId} maskUnits="userSpaceOnUse" x="0" y="0" width="500" height="600"><image href={garmentMasks.whole} {...moldBox} preserveAspectRatio="xMidYMid meet"/></mask>
        <mask id={waistMaskId} maskUnits="userSpaceOnUse" x="0" y="0" width="500" height="600"><image href={garmentMasks.waist} {...moldBox} preserveAspectRatio="xMidYMid meet"/></mask>
        <mask id={sidesMaskId} maskUnits="userSpaceOnUse" x="0" y="0" width="500" height="600"><image href={garmentMasks.sides} {...moldBox} preserveAspectRatio="xMidYMid meet"/></mask>
        <mask id={cordMaskId} maskUnits="userSpaceOnUse" x="0" y="0" width="500" height="600"><image href={garmentMasks.cord} {...moldBox} preserveAspectRatio="xMidYMid meet"/></mask>
        <mask id={interiorMaskId} maskUnits="userSpaceOnUse" x="0" y="0" width="500" height="600"><image href={garmentMasks.interior} {...moldBox} preserveAspectRatio="xMidYMid meet"/></mask>
      </>}
    </defs>
    {!shorts && <path d={shape} fill="#f8fafc" stroke="#172033" strokeWidth="4"/>}
    {(!shorts || garmentMasks) && design.layers.map((layer) => {
      const imageSize = layer.scale * 3;
      const area = layer.printArea ?? "WHOLE";
      const areaMaskId = area === "BODY" ? bodyMaskId : area === "WAIST" ? waistMaskId : area === "SIDES" ? sidesMaskId : area === "CORD" ? cordMaskId : area === "INTERIOR" ? interiorMaskId : wholeMaskId;
      const artwork = <image
          href={layer.image}
          x={layer.x * 5 - imageSize / 2}
          y={layer.y * 6 - imageSize / 2}
          width={imageSize}
          height={imageSize}
          preserveAspectRatio="xMidYMid slice"
          transform={`rotate(${layer.rotation ?? 0} ${layer.x * 5} ${layer.y * 6})`}
        />;
      return shorts ? <g key={layer.id} mask={`url(#${silhouetteMaskId})`}><g mask={`url(#${areaMaskId})`}>{artwork}</g></g> : <g key={layer.id} clipPath={`url(#${clipId})`}>{artwork}</g>;
    })}
    {shorts && moldImage && <image
      href={moldImage}
      {...moldBox}
      preserveAspectRatio="xMidYMid meet"
      style={{ mixBlendMode: "multiply" }}
    />}
    {!shorts && !tank && <><path d="M220 105 Q250 145 280 105" fill="none" stroke="#6b7280" strokeWidth="3"/>{side === "back" && <path d="M205 120 Q250 150 295 120" fill="none" stroke="#9ca3af" strokeWidth="2"/>}</>}
    {tank && <>
      <path d={shape} fill="none" stroke="#172033" strokeWidth="4"/>
      {side === "front" ? <><path d="M153 100 L191 114 C207 124 217 141 229 153 C242 169 258 169 271 153 C283 141 293 124 309 114 L347 100" fill="none" stroke="#172033" strokeWidth="2" strokeDasharray="5 4"/><path d="M132 177 C139 203 151 222 169 239 M368 177 C361 203 349 222 331 239" fill="none" stroke="#172033" strokeWidth="2" strokeDasharray="5 4"/></> : <><path d="M153 100 L191 114 C207 123 218 134 230 143 C243 155 257 155 270 143 C282 134 293 123 309 114 L347 100" fill="none" stroke="#172033" strokeWidth="2" strokeDasharray="5 4"/><path d="M132 177 C139 203 151 222 169 239 M368 177 C361 203 349 222 331 239" fill="none" stroke="#172033" strokeWidth="2" strokeDasharray="5 4"/></>}
      <path d="M152 510 Q250 525 348 510" fill="none" stroke="#172033" strokeWidth="2" strokeDasharray="5 4"/>
    </>}
    <rect x="150" y="180" width="200" height="230" rx="8" fill="none" stroke="#c4932b" strokeWidth="2" strokeDasharray="8 7" opacity=".75"/>
    <text x="250" y="565" textAnchor="middle" fontSize="14" fill="#667085">{side === "front" ? "FRENTE" : "COSTAS"} · área visual tracejada</text>
  </svg></article>;
}
