"use client";

import { ChangeEvent, FormEvent, PointerEvent as ReactPointerEvent, useEffect, useMemo, useRef, useState } from "react";

type Side = "front" | "back";
type EditMode = "WHOLE" | "SECTIONS" | "COMBINED";
type PrintArea = "WHOLE" | "BODY" | "WAIST" | "SIDES" | "CORD" | "INTERIOR";
type ArtworkLayer = { id: string; name: string; image: string; x: number; y: number; scale: number; rotation?: number; printArea?: PrintArea };
type SideDesign = { layers: ArtworkLayer[]; selectedId?: string };
type Template = "BOARD_SHORTS_SLIT" | "BOARD_SHORTS_SLIT_2" | "BOARD_SHORTS_STRAIGHT" | "TSHIRT_REGULAR" | "TANK_TOP";
type DesignData = { front: SideDesign; back: SideDesign };

const templates: Record<Template, { name: string; note: string }> = {
  BOARD_SHORTS_SLIT: { name: "Bermuda surf · cavada", note: "Tactel, lateral cavada com acabamento curvo, laço de duas alças e bolso traseiro direito." },
  BOARD_SHORTS_SLIT_2: { name: "Bermuda surf · cavada 2", note: "Modelagem alongada, barra curva e cavada, quatro ilhós, cordão frontal amarrado e bolso traseiro direito." },
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
  function updateLayer(targetSide: Side, id: string, values: Partial<Pick<ArtworkLayer, "x" | "y" | "scale" | "rotation">>) {
    setDesign((old) => ({ ...old, [targetSide]: { ...old[targetSide], layers: old[targetSide].layers.map((layer) => layer.id === id ? { ...layer, ...values } : layer) } }));
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
    const cleanSvg = (id: string) => { const copy = document.getElementById(id)?.cloneNode(true) as Element | undefined; copy?.querySelectorAll("[data-editor-controls]").forEach((node) => node.remove()); return copy?.outerHTML ?? ""; };
    const front = cleanSvg("garment-front");
    const back = cleanSvg("garment-back");
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
        {editMode !== "WHOLE" && template.startsWith("BOARD_SHORTS") && <label>{editMode === "COMBINED" ? "Modo da próxima camada" : "Parte a estampar"}<select value={printArea} onChange={(event) => setPrintArea(event.target.value as PrintArea)}>{editMode === "COMBINED" && <option value="WHOLE">Estampa toda</option>}<option value="BODY">Corpo da peça</option><option value="WAIST">Cintura</option><option value="SIDES">Linhas laterais</option><option value="CORD" disabled={side === "back"}>Cordão</option><option value="INTERIOR">Interior</option></select><small>{editMode === "COMBINED" ? "Escolha Estampa toda ou uma parte para cada nova camada. As áreas seguem os traços do molde." : "A próxima imagem ficará limitada à área delimitada pelos traços do molde."}</small></label>}
        {editMode !== "WHOLE" && !template.startsWith("BOARD_SHORTS") && <small className="studio-mode-note">A divisão por partes está disponível nos moldes de bermuda. Para camisetas, use “Estampa toda”.</small>}
        <label>Adicionar imagem ou estampa<input type="file" accept="image/png,image/jpeg,.png,.jpg,.jpeg" onChange={upload}/><small>Cada arquivo vira uma camada. PNG transparente pode ser colocado sobre outra imagem.</small></label>
        <div className="artwork-layers"><b>Camadas · de baixo para cima</b>{currentSide.layers.length === 0 && <small>Nenhuma camada adicionada.</small>}{currentSide.layers.map((layer, index) => <button type="button" key={layer.id} className={layer.id === current?.id ? "active" : ""} onClick={() => selectLayer(layer.id)}><span>{index + 1}</span><em>{layer.name}<small>{printAreaLabels[layer.printArea ?? "WHOLE"]}</small></em></button>)}</div>
        {current && template.startsWith("BOARD_SHORTS") && <label>Área desta camada<select value={current.printArea ?? "WHOLE"} onChange={(event) => update({ printArea: event.target.value as PrintArea })}><option value="WHOLE">Estampa toda</option><option value="BODY">Corpo da peça</option><option value="WAIST">Cintura</option><option value="SIDES">Linhas laterais</option><option value="CORD" disabled={side === "back"}>Cordão</option><option value="INTERIOR">Interior</option></select></label>}
        <small className="studio-mode-note">Selecione uma camada e edite diretamente sobre o molde: arraste para posicionar, use o canto azul para dimensionar e o controle superior para rotacionar.</small>
        <button type="button" disabled={!current} onClick={() => update({ x: 50, y: 50, scale: 200 })}>Preencher toda a peça</button>
        <div className="layer-actions"><button type="button" className="secondary" disabled={!current} onClick={() => moveLayer(-1)}>Descer</button><button type="button" className="secondary" disabled={!current} onClick={() => moveLayer(1)}>Subir</button></div>
        <button type="button" className="secondary" disabled={!current} onClick={removeLayer}>Excluir camada selecionada</button>
      </aside>
      <div className="garment-views"><GarmentView id="garment-front" template={template} side="front" design={design.front} editable={side === "front"} onUpdate={updateLayer}/><GarmentView id="garment-back" template={template} side="back" design={design.back} editable={side === "back"} onUpdate={updateLayer}/></div>
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

function useGarmentMasks(source: string | undefined) {
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
      const barrier = new Uint8Array(width * height);
      for (let index = 0; index < barrier.length; index++) {
        const offset = index * 4;
        const alpha = pixels.data[offset + 3];
        barrier[index] = alpha > 16 && pixels.data[offset] < 205 && pixels.data[offset + 1] < 205 && pixels.data[offset + 2] < 205 ? 1 : 0;
      }
      // Fecha os pequenos espaços dos pespontos tracejados. A barreira é
      // extraída do próprio desenho, portanto acompanha qualquer curva ou
      // recorte do molde — não uma coordenada pré-definida da bermuda.
      const lineGap = Math.max(3, Math.round(Math.min(width, height) / 260));
      const lineDistance = new Uint16Array(width * height); lineDistance.fill(65535);
      const lineQueue = new Int32Array(width * height); let lineHead = 0, lineTail = 0;
      for (let index = 0; index < barrier.length; index++) if (barrier[index]) { lineDistance[index] = 0; lineQueue[lineTail++] = index; }
      const growLine = (from: number, next: number) => {
        if (lineDistance[from] < lineGap && lineDistance[next] > lineDistance[from] + 1) {
          lineDistance[next] = lineDistance[from] + 1;
          lineQueue[lineTail++] = next;
        }
      };
      while (lineHead < lineTail) {
        const index = lineQueue[lineHead++], x = index % width;
        if (x > 0) growLine(index, index - 1); if (x < width - 1) growLine(index, index + 1);
        if (index >= width) growLine(index, index - width); if (index < width * (height - 1)) growLine(index, index + width);
      }
      const sealed = Uint8Array.from(lineDistance, (distance) => distance <= lineGap ? 1 : 0);
      const floodOutside = () => {
        const filled = new Uint8Array(width * height), queue = new Int32Array(width * height);
        let head = 0, tail = 0;
        const add = (index: number) => { if (!sealed[index] && !filled[index]) { filled[index] = 1; queue[tail++] = index; } };
        for (let x = 0; x < width; x++) { add(x); add((height - 1) * width + x); }
        for (let y = 0; y < height; y++) { add(y * width); add(y * width + width - 1); }
        while (head < tail) {
          const index = queue[head++], x = index % width;
          if (x > 0) add(index - 1); if (x < width - 1) add(index + 1);
          if (index >= width) add(index - width); if (index < width * (height - 1)) add(index + width);
        }
        return filled;
      };
      const outside = floodOutside();
      // A região fechada pelos próprios traços define a silhueta. Isso também
      // permite moldes com fundo transparente, mantendo a máscara fiel à linha.
      const silhouettePixels = Uint8Array.from(outside, (value) => !value ? 1 : 0);
      // Mede a distância real da silhueta até o fundo. Ela serve apenas para
      // reconhecer faixas rasas de acabamento; a linha que encerra cada faixa
      // vem da imagem do molde e não de um valor fixo de altura/largura.
      const edgeDistance = new Uint16Array(width * height); edgeDistance.fill(65535);
      const edgeQueue = new Int32Array(width * height); let edgeHead = 0, edgeTail = 0;
      for (let index = 0; index < silhouettePixels.length; index++) if (!silhouettePixels[index]) { edgeDistance[index] = 0; edgeQueue[edgeTail++] = index; }
      const visitEdge = (from: number, next: number) => { if (edgeDistance[next] > edgeDistance[from] + 1) { edgeDistance[next] = edgeDistance[from] + 1; edgeQueue[edgeTail++] = next; } };
      while (edgeHead < edgeTail) {
        const index = edgeQueue[edgeHead++], x = index % width;
        if (x > 0) visitEdge(index, index - 1); if (x < width - 1) visitEdge(index, index + 1);
        if (index >= width) visitEdge(index, index - width); if (index < width * (height - 1)) visitEdge(index, index + width);
      }
      type MoldRegion = {
        pixels: number[]; area: number; minEdgeDistance: number; maxEdgeDistance: number;
        minX: number; maxX: number; minY: number; maxY: number;
      };
      const labels = new Int32Array(width * height); labels.fill(-1);
      const regions: MoldRegion[] = [];
      const regionQueue = new Int32Array(width * height);
      for (let start = 0; start < silhouettePixels.length; start++) {
        if (!silhouettePixels[start] || sealed[start] || labels[start] !== -1) continue;
        const regionId = regions.length;
        let regionHead = 0, regionTail = 0;
        let minEdgeDistance = 65535, maxEdgeDistance = 0;
        let minX = width, maxX = 0, minY = height, maxY = 0;
        const regionPixels: number[] = [];
        const addRegionPixel = (index: number) => {
          if (!silhouettePixels[index] || sealed[index] || labels[index] !== -1) return;
          labels[index] = regionId;
          regionQueue[regionTail++] = index;
        };
        addRegionPixel(start);
        while (regionHead < regionTail) {
          const index = regionQueue[regionHead++], x = index % width, y = Math.floor(index / width);
          regionPixels.push(index);
          minEdgeDistance = Math.min(minEdgeDistance, edgeDistance[index]);
          maxEdgeDistance = Math.max(maxEdgeDistance, edgeDistance[index]);
          minX = Math.min(minX, x); maxX = Math.max(maxX, x);
          minY = Math.min(minY, y); maxY = Math.max(maxY, y);
          if (x > 0) addRegionPixel(index - 1); if (x < width - 1) addRegionPixel(index + 1);
          if (index >= width) addRegionPixel(index - width); if (index < width * (height - 1)) addRegionPixel(index + width);
        }
        regions.push({ pixels: regionPixels, area: regionPixels.length, minEdgeDistance, maxEdgeDistance, minX, maxX, minY, maxY });
      }
      const largestRegion = regions.reduce<MoldRegion | undefined>((largest, region) => !largest || region.area > largest.area ? region : largest, undefined);
      const minimumRegion = Math.max(8, Math.round(width * height * .00002));
      const significantRegions = regions.filter((region) => region.area >= minimumRegion);
      const measure = (region: MoldRegion) => {
        const regionWidth = region.maxX - region.minX + 1;
        const regionHeight = region.maxY - region.minY + 1;
        return { width: regionWidth, height: regionHeight, centerX: region.minX + regionWidth / 2, centerY: region.minY + regionHeight / 2 };
      };
      const mainSeedArea = Math.max(0, ...significantRegions.map((region) => region.area));
      // Os maiores espaços fechados pelas costuras formam os painéis principais
      // da peça. Eles fornecem o eixo e a referência das demais regiões, sem
      // depender de coordenadas específicas deste molde.
      const mainSeedPanels = significantRegions.filter((region) => region.area >= mainSeedArea * .12);
      const panelReference = mainSeedPanels.length ? mainSeedPanels : significantRegions;
      const panelMinX = Math.min(width, ...panelReference.map((region) => region.minX));
      const panelMaxX = Math.max(0, ...panelReference.map((region) => region.maxX));
      const panelWidth = Math.max(1, panelMaxX - panelMinX + 1);
      const panelCenterX = panelMinX + panelWidth / 2;
      const panelCenterY = panelReference.length ? panelReference.reduce((sum, region) => sum + measure(region).centerY, 0) / panelReference.length : 0;
      const shallowDepth = largestRegion ? Math.max(lineGap * 4, Math.round(largestRegion.maxEdgeDistance * .25)) : 0;
      const closeEnough = (first: MoldRegion, second: MoldRegion) => {
        const gapX = Math.max(0, Math.max(first.minX, second.minX) - Math.min(first.maxX, second.maxX) - 1);
        const gapY = Math.max(0, Math.max(first.minY, second.minY) - Math.min(first.maxY, second.maxY) - 1);
        return gapX <= lineGap * 3 && gapY <= lineGap * 3;
      };
      const darkPanels = new Set<MoldRegion>();
      if (largestRegion) {
        // Os acabamentos sem estampa são faixas rasas que encostam no contorno
        // externo e são fechadas pelo próprio traço. A expansão ocorre somente
        // nas barras inferiores conectadas, nunca no cós ou no corpo central.
        for (const region of significantRegions) {
          const { width: regionWidth, height: regionHeight } = measure(region);
          if (region.minEdgeDistance <= lineGap * 3 && region.maxEdgeDistance <= shallowDepth && regionWidth >= regionHeight * 1.5) darkPanels.add(region);
        }
        let changed = true;
        while (changed) {
          changed = false;
          for (const region of significantRegions) {
            if (darkPanels.has(region) || region.maxEdgeDistance > shallowDepth || measure(region).centerY <= panelCenterY) continue;
            const isConnectedToLowerFinish = [...darkPanels].some((finish) => {
              const sameSide = (measure(region).centerX - panelCenterX) * (measure(finish).centerX - panelCenterX) > 0;
              return measure(finish).centerY > panelCenterY && sameSide && closeEnough(region, finish);
            });
            if (isConnectedToLowerFinish) { darkPanels.add(region); changed = true; }
          }
        }
      }
      const interior = new Uint8Array(width * height);
      for (const region of darkPanels) for (const index of region.pixels) interior[index] = 1;
      // A dilatação só descobre as regiões. A arte volta até o traço original;
      // assim não surgem faixas brancas artificiais entre costuras.
      const whole = Uint8Array.from(silhouettePixels, (value, index) => value && !interior[index] ? 1 : 0);
      const printableRegions = significantRegions.filter((region) => !darkPanels.has(region));
      const largestPrintableArea = Math.max(0, ...printableRegions.map((region) => region.area));
      const mainPanels = printableRegions.filter((region) => region.area >= largestPrintableArea * .12);
      const printablePanelReference = mainPanels.length ? mainPanels : printableRegions;
      const bodyMinX = Math.min(width, ...printablePanelReference.map((region) => region.minX));
      const bodyMaxX = Math.max(0, ...printablePanelReference.map((region) => region.maxX));
      const bodyMinY = Math.min(height, ...printablePanelReference.map((region) => region.minY));
      const bodyWidth = Math.max(1, bodyMaxX - bodyMinX + 1);
      const bodyCenterX = bodyMinX + bodyWidth / 2;
      const verticalOverlap = (first: MoldRegion, second: MoldRegion) => Math.max(0, Math.min(first.maxY, second.maxY) - Math.max(first.minY, second.minY) + 1);
      const hasMirror = (region: MoldRegion, candidates: MoldRegion[]) => {
        const current = measure(region);
        return candidates.some((other) => {
          if (other === region) return false;
          const mirrored = measure(other);
          const oppositeSides = (current.centerX - bodyCenterX) * (mirrored.centerX - bodyCenterX) < 0;
          const alignment = Math.abs((current.centerX - bodyCenterX) + (mirrored.centerX - bodyCenterX));
          return oppositeSides && alignment <= Math.max(current.width, mirrored.width) * 1.5 + lineGap * 4 && verticalOverlap(region, other) >= Math.min(current.height, mirrored.height) * .3;
        });
      };
      // Cada parte é descoberta pelos espaços que as costuras realmente fecham.
      // Não há sementes por porcentagem, curvas ou limites próprios de um tipo
      // de bermuda; se o desenho não fechar uma área, ela permanece no corpo.
      const waistRegions = printableRegions.filter((region) => {
        const current = measure(region);
        return region.area >= Math.max(minimumRegion * 10, largestPrintableArea * .015)
          && current.centerY < bodyMinY
          && current.width >= current.height * 1.25;
      });
      const sideCandidates = printableRegions.filter((region) => {
        const current = measure(region);
        return !waistRegions.includes(region)
          && region.minEdgeDistance <= lineGap * 3
          && region.maxEdgeDistance <= shallowDepth
          && current.height >= current.width * 1.5;
      });
      const sideRegions = sideCandidates.filter((region) => hasMirror(region, sideCandidates));
      const leftWaist = waistRegions.filter((region) => measure(region).centerX < bodyCenterX).sort((first, second) => second.maxX - first.maxX)[0];
      const rightWaist = waistRegions.filter((region) => measure(region).centerX > bodyCenterX).sort((first, second) => first.minX - second.minX)[0];
      const waistHeight = Math.max(0, ...waistRegions.map((region) => measure(region).height));
      const cordCandidates = leftWaist && rightWaist ? printableRegions.filter((region) => {
        const current = measure(region);
        const withinWaistOpening = current.centerX >= leftWaist.maxX - waistHeight && current.centerX <= rightWaist.minX + waistHeight;
        const nearWaist = region.minY <= Math.max(leftWaist.maxY, rightWaist.maxY) + waistHeight * 1.5;
        const compact = region.area <= Math.max(minimumRegion * 10, largestPrintableArea * .02) && current.height <= current.width * 6;
        return !waistRegions.includes(region) && !sideRegions.includes(region) && withinWaistOpening && nearWaist && compact;
      }) : [];
      const cordRegions = cordCandidates.filter((region) => hasMirror(region, cordCandidates));
      // As máscaras específicas não se sobrepõem. Tudo que restar da área
      // imprimível pertence ao corpo, inclusive os pixels das linhas que serão
      // cobertas pelo desenho do molde no topo.
      const claimed = new Uint8Array(width * height);
      const takeRegions = (selectedRegions: MoldRegion[]) => {
        const mask = new Uint8Array(width * height);
        for (const region of selectedRegions) for (const index of region.pixels) {
          if (!claimed[index]) { mask[index] = 1; claimed[index] = 1; }
        }
        return mask;
      };
      const waist = takeRegions(waistRegions);
      const sides = takeRegions(sideRegions);
      const cord = takeRegions(cordRegions);
      const body = Uint8Array.from(whole, (value, index) => value && !claimed[index] ? 1 : 0);
      const toDataUrl = (alphaFor: (index: number) => number) => {
        const output = context.createImageData(width, height);
        for (let index = 0; index < width * height; index++) {
          const offset = index * 4;
          output.data[offset] = 255; output.data[offset + 1] = 255; output.data[offset + 2] = 255; output.data[offset + 3] = alphaFor(index);
        }
        context.putImageData(output, 0, 0);
        return canvas.toDataURL("image/png");
      };
      const silhouette = toDataUrl((index) => silhouettePixels[index] ? 255 : 0);
      const maskUrl = (mask: Uint8Array) => toDataUrl((index) => mask[index] ? 255 : 0);
      if (active) setMasks({ silhouette, body: maskUrl(body), waist: maskUrl(waist), sides: maskUrl(sides), cord: maskUrl(cord), interior: maskUrl(interior), whole: maskUrl(whole) });
    };
    image.src = source;
    return () => { active = false; };
  }, [source]);
  return masks;
}

function GarmentView({ id, template, side, design, editable, onUpdate }: { id: string; template: Template; side: Side; design: SideDesign; editable: boolean; onUpdate: (side: Side, id: string, values: Partial<Pick<ArtworkLayer, "x" | "y" | "scale" | "rotation">>) => void }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const shorts = template.startsWith("BOARD_SHORTS");
  const curved = template === "BOARD_SHORTS_SLIT" || template === "BOARD_SHORTS_SLIT_2";
  const secondSlit = template === "BOARD_SHORTS_SLIT_2";
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
    ? secondSlit
      ? `/molde-bermuda-cavada-2-${side === "front" ? "frente" : "costas"}.svg`
      : !curved && side === "front"
        ? "/molde-bermuda-reta-frente-transparente.png"
        : `/molde-bermuda-${curved ? "cavada" : "reta"}-${side === "front" ? "frente" : "costas"}.png`
    : undefined;
  const garmentMasks = useGarmentMasks(moldImage);
  const moldBox = secondSlit
    ? { x: 30, y: 80, width: 440, height: 440 }
    : side === "front" ? { x: 61, y: 55, width: 378, height: 472 } : { x: 30, y: 80, width: 440, height: 440 };
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
  const selected = editable ? design.layers.find((layer) => layer.id === design.selectedId) : undefined;
  function startTransform(action: "move" | "scale" | "rotate", event: ReactPointerEvent<SVGElement>) {
    if (!selected || !svgRef.current) return;
    event.preventDefault(); event.stopPropagation();
    const bounds = svgRef.current.getBoundingClientRect();
    const point = (clientX: number, clientY: number) => ({ x: (clientX - bounds.left) * 500 / bounds.width, y: (clientY - bounds.top) * 600 / bounds.height });
    const origin = point(event.clientX, event.clientY), center = { x: selected.x * 5, y: selected.y * 6 };
    const initialDistance = Math.max(1, Math.hypot(origin.x - center.x, origin.y - center.y));
    const initialAngle = Math.atan2(origin.y - center.y, origin.x - center.x) * 180 / Math.PI;
    const move = (pointer: PointerEvent) => {
      const next = point(pointer.clientX, pointer.clientY);
      if (action === "move") onUpdate(side, selected.id, { x: Math.max(0, Math.min(100, (center.x + next.x - origin.x) / 5)), y: Math.max(0, Math.min(100, (center.y + next.y - origin.y) / 6)) });
      if (action === "scale") onUpdate(side, selected.id, { scale: Math.max(15, Math.min(200, selected.scale * Math.hypot(next.x - center.x, next.y - center.y) / initialDistance)) });
      if (action === "rotate") onUpdate(side, selected.id, { rotation: ((selected.rotation ?? 0) + Math.atan2(next.y - center.y, next.x - center.x) * 180 / Math.PI - initialAngle + 360) % 360 });
    };
    const end = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", end); window.removeEventListener("pointercancel", end); };
    window.addEventListener("pointermove", move, { passive: false }); window.addEventListener("pointerup", end); window.addEventListener("pointercancel", end);
  }
  return <article className="garment-view"><h3>{side === "front" ? "Frente" : "Costas"}</h3><svg ref={svgRef} id={id} viewBox="0 0 500 600" overflow="hidden" role="img" aria-label={`${templates[template].name}, ${side === "front" ? "frente" : "costas"}`}>
    <defs>
      <clipPath id={clipId}><path d={shape} fill="#fff" stroke="none" strokeWidth="0"/></clipPath>
      {shorts && garmentMasks && <>
        <mask id={silhouetteMaskId} maskUnits="userSpaceOnUse" x="0" y="0" width="500" height="600"><image href={garmentMasks.silhouette} {...moldBox} preserveAspectRatio="xMidYMid meet"/></mask>
        <mask id={bodyMaskId} maskUnits="userSpaceOnUse" x="0" y="0" width="500" height="600"><image href={garmentMasks.body} {...moldBox} preserveAspectRatio="xMidYMid meet"/></mask>
        {/* Estas duas máscaras vêm do mesmo mapa de pixels do molde. Elas são
            complementares e, por isso, nunca divergem nas curvas do cós,
            laterais, barras ou gancho. */}
        <mask id={wholeMaskId} maskUnits="userSpaceOnUse" x="0" y="0" width="500" height="600"><image href={garmentMasks.whole} {...moldBox} preserveAspectRatio="xMidYMid meet"/></mask>
        <mask id={waistMaskId} maskUnits="userSpaceOnUse" x="0" y="0" width="500" height="600"><image href={garmentMasks.waist} {...moldBox} preserveAspectRatio="xMidYMid meet"/></mask>
        <mask id={sidesMaskId} maskUnits="userSpaceOnUse" x="0" y="0" width="500" height="600"><image href={garmentMasks.sides} {...moldBox} preserveAspectRatio="xMidYMid meet"/></mask>
        <mask id={cordMaskId} maskUnits="userSpaceOnUse" x="0" y="0" width="500" height="600"><image href={garmentMasks.cord} {...moldBox} preserveAspectRatio="xMidYMid meet"/></mask>
        <mask id={interiorMaskId} maskUnits="userSpaceOnUse" x="0" y="0" width="500" height="600"><image href={garmentMasks.interior} {...moldBox} preserveAspectRatio="xMidYMid meet"/></mask>
      </>}
    </defs>
    {!shorts && <path d={shape} fill="#f8fafc" stroke="#172033" strokeWidth="4"/>}
    {/* Cós, barras e debruns que não recebem a arte ficam escuros, em vez de
        transparentes. A máscara vem das regiões entre as linhas do desenho. */}
    {shorts && garmentMasks && <rect width="500" height="600" fill="#101318" mask={`url(#${interiorMaskId})`}/>}
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
    {secondSlit && side === "back" && <image
      href="/molde-bermuda-cavada-2-etiqueta.svg"
      {...moldBox}
      preserveAspectRatio="xMidYMid meet"
    />}
    {!shorts && !tank && <><path d="M220 105 Q250 145 280 105" fill="none" stroke="#6b7280" strokeWidth="3"/>{side === "back" && <path d="M205 120 Q250 150 295 120" fill="none" stroke="#9ca3af" strokeWidth="2"/>}</>}
    {tank && <>
      <path d={shape} fill="none" stroke="#172033" strokeWidth="4"/>
      {side === "front" ? <><path d="M153 100 L191 114 C207 124 217 141 229 153 C242 169 258 169 271 153 C283 141 293 124 309 114 L347 100" fill="none" stroke="#172033" strokeWidth="2" strokeDasharray="5 4"/><path d="M132 177 C139 203 151 222 169 239 M368 177 C361 203 349 222 331 239" fill="none" stroke="#172033" strokeWidth="2" strokeDasharray="5 4"/></> : <><path d="M153 100 L191 114 C207 123 218 134 230 143 C243 155 257 155 270 143 C282 134 293 123 309 114 L347 100" fill="none" stroke="#172033" strokeWidth="2" strokeDasharray="5 4"/><path d="M132 177 C139 203 151 222 169 239 M368 177 C361 203 349 222 331 239" fill="none" stroke="#172033" strokeWidth="2" strokeDasharray="5 4"/></>}
      <path d="M152 510 Q250 525 348 510" fill="none" stroke="#172033" strokeWidth="2" strokeDasharray="5 4"/>
    </>}
    {selected && (() => {
      const centerX = selected.x * 5, centerY = selected.y * 6, size = selected.scale * 3;
      return <g data-editor-controls="true" className="canvas-transform" transform={`rotate(${selected.rotation ?? 0} ${centerX} ${centerY})`}>
        <rect className="canvas-transform-hit" x={centerX - size / 2} y={centerY - size / 2} width={size} height={size} onPointerDown={(event) => startTransform("move", event)}/>
        <rect className="canvas-transform-box" x={centerX - size / 2} y={centerY - size / 2} width={size} height={size}/>
        <line className="canvas-transform-line" x1={centerX} y1={centerY - size / 2} x2={centerX} y2={centerY - size / 2 - 28}/>
        <circle className="canvas-transform-rotate" cx={centerX} cy={centerY - size / 2 - 31} r="11" onPointerDown={(event) => startTransform("rotate", event)}/>
        <path className="canvas-transform-icon" d={`M${centerX - 4} ${centerY - size / 2 - 34} A6 6 0 1 1 ${centerX + 4} ${centerY - size / 2 - 27}`} />
        <circle className="canvas-transform-scale" cx={centerX + size / 2} cy={centerY + size / 2} r="11" onPointerDown={(event) => startTransform("scale", event)}/>
        <path className="canvas-transform-icon" d={`M${centerX + size / 2 - 4} ${centerY + size / 2 - 4} L${centerX + size / 2 + 4} ${centerY + size / 2 + 4} M${centerX + size / 2} ${centerY + size / 2 + 4} L${centerX + size / 2 + 4} ${centerY + size / 2 + 4} L${centerX + size / 2 + 4} ${centerY + size / 2}`} />
      </g>;
    })()}
    <rect x="150" y="180" width="200" height="230" rx="8" fill="none" stroke="#c4932b" strokeWidth="2" strokeDasharray="8 7" opacity=".75"/>
    <text x="250" y="565" textAnchor="middle" fontSize="14" fill="#667085">{side === "front" ? "FRENTE" : "COSTAS"} · área visual tracejada</text>
  </svg></article>;
}
