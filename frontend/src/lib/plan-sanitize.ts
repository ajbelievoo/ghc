const PROVIDER_SUFFIX = atob("b3Zo");

function toPublicPlanCode(code: string): string {
  const suffix = "-" + PROVIDER_SUFFIX;
  let c = code || "";
  while (c.toLowerCase().endsWith(suffix.toLowerCase())) {
    c = c.slice(0, -suffix.length);
  }
  return c;
}

function cleanPublicText(text?: string): string {
  return (text || "")
    .replace(new RegExp("\\(" + PROVIDER_SUFFIX + "\\)", "gi"), "")
    .replace(/\s+/g, " ")
    .trim();
}

export function sanitizePlan(p: any): any {
  if (!p || !p.planCode) return p;
  return {
    ...p,
    planCode: toPublicPlanCode(p.planCode),
    invoiceName: cleanPublicText(p.invoiceName) || toPublicPlanCode(p.planCode),
    description: cleanPublicText(p.description),
  };
}

export function sanitizePlans(plans: any[]): any[] {
  const filtered = (plans || []).filter((p: any) => {
    if (!p || !p.planCode) return false;
    const code = String(p.planCode).toLowerCase();
    const name = String(p.invoiceName || "").toLowerCase();
    if (code.includes("2014") || name.includes("2014 offer")) return false;
    if (code.startsWith("sql_included")) return false;
    if (p.category === "DOMAINS" && (code === PROVIDER_SUFFIX || name.includes("." + PROVIDER_SUFFIX))) return false;
    return true;
  });

  const suffix = "-" + PROVIDER_SUFFIX;
  const map = new Map<string, any>();
  filtered.forEach((p: any) => {
    const publicCode = toPublicPlanCode(p.planCode);
    const isRegional = /-(mum|sgp|syd)$/i.test(p.planCode);
    const isProviderBranded = p.planCode.toLowerCase().endsWith(suffix.toLowerCase());
    const sanitized = { ...sanitizePlan(p), _regional: isRegional, _provider: isProviderBranded };
    const existing = map.get(publicCode);
    if (!existing) {
      map.set(publicCode, sanitized);
      return;
    }
    const keepNew =
      (isProviderBranded && !existing._provider) ||
      (!isRegional && existing._regional) ||
      (isProviderBranded && !isRegional && existing._regional);
    if (keepNew) {
      map.set(publicCode, sanitized);
    }
  });

  return Array.from(map.values()).map(({ _regional, _provider, ...plan }) => plan);
}
