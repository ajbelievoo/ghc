import { sanitizePlans } from "./plan-sanitize";

const API_BASE = process.env.GHC_BUILD_API_URL || "http://127.0.0.1:8000/api";

export async function fetchPlans(category: string): Promise<any[]> {
  try {
    const res = await fetch(`${API_BASE}/server/plans?category=${encodeURIComponent(category)}`);
    if (!res.ok) return [];
    const data = await res.json();
    return sanitizePlans(Array.isArray(data) ? data : []);
  } catch (e: any) {
    console.warn(`[fetchPlans] ${category} failed:`, e?.message || e);
    return [];
  }
}
