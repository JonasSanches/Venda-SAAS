import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { prisma } from "@varejo/database";

type ArchiveSearch = { response?: { docs?: Array<{ identifier?: string; title?: string; creator?: string | string[]; year?: string | number; downloads?: number; licenseurl?: string }> } };
type ArchiveMetadata = { metadata?: { identifier?: string; title?: string; creator?: string | string[]; year?: string | number; licenseurl?: string }; files?: Array<{ name?: string; format?: string }> };

const LICENSED = /(publicdomain|public-domain|creativecommons|creativecommons|cc0)/i;

@Injectable()
export class LibraryCurationService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(LibraryCurationService.name);
  private timer?: ReturnType<typeof setInterval>;

  onModuleInit() {
    void this.refresh().catch((error) => this.logger.warn(`Curadoria inicial indisponível: ${error instanceof Error ? error.message : "erro desconhecido"}`));
    this.timer = setInterval(() => void this.refresh().catch((error) => this.logger.warn(`Curadoria indisponível: ${error instanceof Error ? error.message : "erro desconhecido"}`)), 5 * 60 * 60 * 1000);
    this.timer.unref();
  }

  onModuleDestroy() { if (this.timer) clearInterval(this.timer); }

  async list() { return prisma.curatedBook.findMany({ orderBy: [{ score: "desc" }, { discoveredAt: "desc" }], take: 24 }); }

  async refresh() {
    const url = new URL("https://archive.org/advancedsearch.php");
    // Coleção histórica, PDF e licença declarada: evita resultados de uploads
    // recentes e obras comerciais que apenas aparecem em buscas genéricas.
    url.searchParams.set("q", "collection:americana AND mediatype:texts AND format:PDF AND licenseurl:* AND year:[* TO 1929]");
    url.searchParams.set("fl[]", "identifier,title,creator,year,downloads,licenseurl");
    url.searchParams.set("rows", "60");
    url.searchParams.set("sort[]", "downloads desc");
    url.searchParams.set("output", "json");
    const response = await fetch(url, { headers: { "User-Agent": "VendaMais-Curadoria/1.0 (legal-public-domain-catalog)" } });
    if (!response.ok) throw new Error(`Catálogo remoto respondeu ${response.status}`);
    const search = await response.json() as ArchiveSearch;
    let saved = 0;
    for (const candidate of search.response?.docs ?? []) {
      if (!candidate.identifier || !candidate.title || !LICENSED.test(candidate.licenseurl ?? "")) continue;
      const details = await fetch(`https://archive.org/metadata/${encodeURIComponent(candidate.identifier)}`, { headers: { "User-Agent": "VendaMais-Curadoria/1.0" } });
      if (!details.ok) continue;
      const metadata = await details.json() as ArchiveMetadata;
      const license = String(metadata.metadata?.licenseurl ?? candidate.licenseurl ?? "");
      const pdf = metadata.files?.find((file) => file.name && file.format?.toLowerCase().includes("pdf"));
      if (!pdf?.name || !LICENSED.test(license)) continue;
      const author = metadata.metadata?.creator ?? candidate.creator;
      await prisma.curatedBook.upsert({
        where: { externalId: `archive:${candidate.identifier}` },
        create: {
          source: "Internet Archive · licença aberta",
          externalId: `archive:${candidate.identifier}`,
          title: metadata.metadata?.title ?? candidate.title,
          author: Array.isArray(author) ? author.join(", ") : author,
          year: String(metadata.metadata?.year ?? candidate.year ?? "") || null,
          license,
          sourceUrl: `https://archive.org/details/${encodeURIComponent(candidate.identifier)}`,
          coverUrl: `https://archive.org/services/img/${encodeURIComponent(candidate.identifier)}`,
          pdfUrl: `https://archive.org/download/${encodeURIComponent(candidate.identifier)}/${encodeURIComponent(pdf.name)}`,
          score: Math.max(0, Math.round(candidate.downloads ?? 0)),
        },
        update: { title: metadata.metadata?.title ?? candidate.title, author: Array.isArray(author) ? author.join(", ") : author, year: String(metadata.metadata?.year ?? candidate.year ?? "") || null, license, sourceUrl: `https://archive.org/details/${encodeURIComponent(candidate.identifier)}`, coverUrl: `https://archive.org/services/img/${encodeURIComponent(candidate.identifier)}`, pdfUrl: `https://archive.org/download/${encodeURIComponent(candidate.identifier)}/${encodeURIComponent(pdf.name)}`, score: Math.max(0, Math.round(candidate.downloads ?? 0)) },
      });
      saved++;
      if (saved >= 24) break;
    }
    return { saved, refreshedAt: new Date().toISOString() };
  }
}
