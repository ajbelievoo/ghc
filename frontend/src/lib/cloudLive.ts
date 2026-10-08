import catalog from "@/data/cloudCatalog.json";

export interface CloudLeaf {
  id: string;
  title: string;
  desc: string;
  families?: any[];
  items?: any[];
  simpleRows?: { name: string; price: string; note?: string }[];
}

let cached: Record<string, CloudLeaf[]> | null = null;
let inflight: Promise<Record<string, CloudLeaf[]>> | null = null;

/** Returns the live cloud catalog (30-min backend cache, upstream-real-time),
 * falling back to the bundled snapshot when the API is unreachable. */
export async function getCloudCatalog(): Promise<Record<string, CloudLeaf[]>> {
  if (cached) return cached;
  if (!inflight) {
    inflight = fetch("/api/catalog/cloud-live")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d) => (cached = d.catalog as Record<string, CloudLeaf[]>))
      .catch(() => (cached = catalog as unknown as Record<string, CloudLeaf[]>));
  }
  return inflight;
}

export const FALLBACK_CATALOG = catalog as unknown as Record<string, CloudLeaf[]>;
