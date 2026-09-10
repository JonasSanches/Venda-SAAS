import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://www.vendamais-app.com";
  return [
    { url: base, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${base}/sistemas-jundiai`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/biblioteca`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/teste`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
  ];
}
