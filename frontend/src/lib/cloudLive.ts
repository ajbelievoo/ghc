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
      .then((d) => {
        const live = d.catalog as Record<string, CloudLeaf[]>;
        // Merge: live data wins; sections empty upstream fall back to the snapshot.
        const merged = { ...catalog as unknown as Record<string, CloudLeaf[]> };
        for (const [group, secs] of Object.entries(live)) {
          merged[group] = (secs as CloudLeaf[]).map((sec) => {
            const empty = !(sec.items?.length || sec.simpleRows?.length || (sec.families || []).some((f) => f.items?.length));
            const fb = (merged[group] || []).find((s) => s.id === sec.id);
            return empty && fb ? { ...sec, ...fb, desc: sec.desc || fb.desc } : sec;
          });
        }
        cached = merged;
        return merged;
      })
      .catch(() => (cached = catalog as unknown as Record<string, CloudLeaf[]>));
  }
  return inflight;
}

export const FALLBACK_CATALOG = catalog as unknown as Record<string, CloudLeaf[]>;

export interface HpcGroup { id: string; title: string; desc: string; items: any[] }

let hpcCached: HpcGroup[] | null = null;
let hpcInflight: Promise<HpcGroup[] | null> | null = null;

export async function getHpcCatalog(): Promise<HpcGroup[] | null> {
  if (hpcCached) return hpcCached;
  if (!hpcInflight) {
    hpcInflight = fetch("/api/catalog/private-cloud-live")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d) => (hpcCached = d.groups as HpcGroup[]))
      .catch(() => null);
  }
  return hpcInflight;
}
