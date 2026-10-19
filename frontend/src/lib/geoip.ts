export type GeoInfo = { cc: string; lat: number; lng: number; city?: string };

const KEY = "ghc-geo";
const TTL = 24 * 60 * 60 * 1000;

let inflight: Promise<GeoInfo | null> | null = null;

export async function getGeo(): Promise<GeoInfo | null> {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const d = JSON.parse(raw);
      if (d && d.t && Date.now() - d.t < TTL && d.cc) return d as GeoInfo;
    }
  } catch { /* ignore */ }
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const res = await fetch("https://ipwho.is/", { signal: AbortSignal.timeout(4500) });
      const j = await res.json();
      if (!j || j.success === false || !j.country_code) return null;
      const g: GeoInfo = {
        cc: String(j.country_code).toUpperCase(),
        lat: typeof j.latitude === "number" ? j.latitude : 0,
        lng: typeof j.longitude === "number" ? j.longitude : 0,
        city: j.city || undefined,
        t: Date.now(),
      } as GeoInfo;
      localStorage.setItem(KEY, JSON.stringify(g));
      return g;
    } catch {
      return null;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

const CC_CURRENCY: Record<string, string> = {
  IN: "INR", GB: "GBP", CA: "CAD", AU: "AUD", SG: "SGD", JP: "JPY",
  CN: "CNY", HK: "HKD", NZ: "NZD", CH: "CHF", SE: "SEK", NO: "NOK",
  DK: "DKK", PL: "PLN", AE: "AED", SA: "SAR", BR: "BRL", MX: "MXN",
  ZA: "ZAR", KR: "KRW", PH: "PHP", TH: "THB", MY: "MYR", ID: "IDR",
  VN: "VND", TR: "TRY", RU: "RUB", PK: "PKR",
  AT: "EUR", BE: "EUR", BG: "EUR", HR: "EUR", CY: "EUR", CZ: "EUR",
  EE: "EUR", FI: "EUR", FR: "EUR", DE: "EUR", GR: "EUR", HU: "EUR",
  IE: "EUR", IT: "EUR", LV: "EUR", LT: "EUR", LU: "EUR", MT: "EUR",
  NL: "EUR", PT: "EUR", RO: "EUR", SK: "EUR", SI: "EUR", ES: "EUR",
};

export function currencyForCountry(cc?: string) {
  return CC_CURRENCY[(cc || "").toUpperCase()] || "USD";
}
