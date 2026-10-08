import { sanitizePlans } from "./plan-sanitize";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

function selectedCurrency(): string {
  if (typeof window === "undefined") return "USD";
  const c = localStorage.getItem("ghc-currency");
  return c && /^[A-Z]{3}$/i.test(c) ? c.toUpperCase() : "USD";
}

async function request(path: string, options: RequestInit & { formData?: boolean } = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const isForm = options.formData || options.body instanceof FormData;
  const headers: any = { ...(token && { Authorization: `Bearer ${token}` }), ...options.headers };
  if (!isForm) headers["Content-Type"] = "application/json";
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const detail = err.detail ?? err.error;
    throw new Error(typeof detail === "string" ? detail : `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  auth: {
    getConfig: () => request("/auth/config"),
    me: () => request("/auth/me"),
    login: (body: { email: string; password: string }) =>
      request("/auth/login", { method: "POST", body: JSON.stringify(body) }),
    login2FA: (body: { tempToken: string; code: string }) =>
      request("/auth/login/2fa", { method: "POST", body: JSON.stringify(body) }),
    register: (body: { name: string; email: string; password: string }) =>
      request("/auth/register", { method: "POST", body: JSON.stringify(body) }),
    verifyEmail: (body: { token: string }) =>
      request("/auth/verify-email", { method: "POST", body: JSON.stringify(body) }),
    resendVerification: (body: { email: string }) =>
      request("/auth/resend-verification", { method: "POST", body: JSON.stringify(body) }),
    google: (body: { credential: string }) =>
      request("/auth/google", { method: "POST", body: JSON.stringify(body) }),
    setup2FA: () => request("/auth/2fa/setup", { method: "POST" }),
    confirm2FA: (body: { code: string }) =>
      request("/auth/2fa/confirm", { method: "POST", body: JSON.stringify(body) }),
    disable2FA: (body: { code: string }) =>
      request("/auth/2fa/disable", { method: "POST", body: JSON.stringify(body) }),
    changePassword: (body: { currentPassword: string; newPassword: string }) =>
      request("/auth/change-password", { method: "POST", body: JSON.stringify(body) }),
    updateMe: (body: { name?: string; phone?: string }) =>
      request("/auth/me", { method: "PUT", body: JSON.stringify(body) }),
    activity: () => request("/user/activity"),
    referral: () => request("/user/referral"),
    notifications: () => request("/user/notifications"),
    updateNotifications: (body: object) => request("/user/notifications", { method: "PUT", body: JSON.stringify(body) }),
    notificationsList: () => request("/user/notifications-list"),
    markNotificationRead: (id: string) => request(`/user/notifications/${id}/read`, { method: "POST" }),
    forgotPassword: (body: { email: string }) =>
      request("/auth/forgot-password", { method: "POST", body: JSON.stringify(body) }),
    resetPassword: (body: { token: string; newPassword: string }) =>
      request("/auth/reset-password", { method: "POST", body: JSON.stringify(body) }),
  },
  admin: {
    stats: () => request("/admin/stats"),
    settings: () => request("/admin/settings"),
    updateSetting: (body: { key: string; value: string }) =>
      request("/admin/settings", { method: "POST", body: JSON.stringify(body) }),
    updateGateway: (body: { name: string; isActive: boolean; config?: object }) =>
      request("/admin/gateways", { method: "POST", body: JSON.stringify(body) }),
    logs: (params?: { type?: string; limit?: number }) =>
      request(`/admin/logs?${new URLSearchParams(params as any).toString()}`),
    overrideServer: (serverId: string, action: string) =>
      request(`/admin/servers/${serverId}/override`, { method: "POST", body: JSON.stringify({ action }) }),
    // Users
    getUsers: (params?: { search?: string; role?: string; page?: number; limit?: number }) =>
      request(`/admin/users?${new URLSearchParams(params as any).toString()}`),
    updateUser: (userId: string, body: { role?: string; isSuspended?: boolean; name?: string; phone?: string }) =>
      request(`/admin/users/${userId}`, { method: "POST", body: JSON.stringify(body) }),
    // Credentials
    getCredentials: () => request("/admin/credentials"),
    testProvider: () => request("/admin/cloud/balance"),
    updateCredentials: (body: object) =>
      request("/admin/credentials", { method: "POST", body: JSON.stringify(body) }),
    // Brand
    getBrand: () => request("/admin/brand"),
    updateBrand: (body: object) =>
      request("/admin/brand", { method: "POST", body: JSON.stringify(body) }),
    // Provider catalog sync
    syncProviderPlans: () => request("/admin/sync-provider-plans", { method: "POST" }),
    // Coupons
    getCoupons: () => request("/admin/coupons"),
    upsertCoupon: (body: object) => request("/admin/coupons", { method: "POST", body: JSON.stringify(body) }),
    deleteCoupon: (id: string) => request(`/admin/coupons/${id}`, { method: "DELETE" }),
    // Margins
    getMargins: () => request("/admin/margins"),
    updateMargin: (body: { category: string; percent: number }) =>
      request("/admin/margins", { method: "POST", body: JSON.stringify(body) }),
    // Catalog
    getCatalog: (params?: { category?: string; search?: string }) =>
      request(`/admin/plans?${new URLSearchParams(params as any).toString()}`),
    updatePlanOverride: (planCode: string, body: { overridePrice?: number | null; overrideMargin?: number | null }) =>
      request(`/admin/plans/${planCode}/override`, { method: "POST", body: JSON.stringify(body) }),
    // Subscriptions
    getSubscriptions: (params?: { status?: string; category?: string; userId?: string }) =>
      request(`/admin/subscriptions?${new URLSearchParams(params as any).toString()}`),
    subscriptionLifecycle: (id: string, action: string) =>
      request(`/admin/subscriptions/${id}/lifecycle`, { method: "POST", body: JSON.stringify({ action }) }),
    getSubscriptionDetails: (id: string) => request(`/admin/subscriptions/${id}`),
    subscriptionPower: (id: string, action: string) =>
      request(`/admin/subscriptions/${id}/power`, { method: "POST", body: JSON.stringify({ action }) }),
    subscriptionRescue: (id: string, body: { enabled?: boolean; reboot?: boolean }) =>
      request(`/admin/subscriptions/${id}/rescue`, { method: "POST", body: JSON.stringify(body) }),
    subscriptionConsole: (id: string, clientIp?: string) =>
      request(`/admin/subscriptions/${id}/console`, { method: "POST", body: JSON.stringify({ clientIp: clientIp || "0.0.0.0" }) }),
    updateSubscriptionReverseDns: (id: string, body: { ip: string; reverse?: string; delete?: boolean }) =>
      request(`/admin/subscriptions/${id}/reverse-dns`, { method: "POST", body: JSON.stringify(body) }),
    // Admin domains & DNS
    getAdminDomains: () => request("/admin/domains"),
    getAdminDomainRecords: (domain: string) => request(`/admin/domains/records?domain=${encodeURIComponent(domain)}`),
    createAdminDomainRecord: (body: object) => request("/admin/domains/records", { method: "POST", body: JSON.stringify(body) }),
    updateAdminDomainRecord: (recordId: number, body: object) => request(`/admin/domains/records/${recordId}`, { method: "PUT", body: JSON.stringify(body) }),
    deleteAdminDomainRecord: (recordId: number, domain: string) => request(`/admin/domains/records/${recordId}?domain=${encodeURIComponent(domain)}`, { method: "DELETE" }),
    // Admin invoice email
    sendInvoiceEmail: (invoiceId: string) => request(`/admin/invoices/${invoiceId}/send`, { method: "POST" }),
    // Domain TLDs
    getDomainTlds: () => request("/admin/domain-tlds"),
    updateDomainTld: (body: { tld: string; baseCost?: number; marginPercent?: number; isActive?: boolean }) =>
      request("/admin/domain-tlds", { method: "POST", body: JSON.stringify(body) }),
    // Orders
    getOrders: (params?: { status?: string; page?: number; limit?: number }) =>
      request(`/admin/orders?${new URLSearchParams(params as any).toString()}`),
    retryProvision: (orderId: string) =>
      request(`/admin/orders/${orderId}/retry-provision`, { method: "POST" }),
    // Invoices
    getInvoices: (params?: { status?: string; userId?: string }) =>
      request(`/admin/invoices?${new URLSearchParams(params as any).toString()}`),
    updateInvoiceStatus: (invoiceId: string, body: { status: string }) =>
      request(`/admin/invoices/${invoiceId}/status`, { method: "POST", body: JSON.stringify(body) }),
    downloadInvoicePdf: (invoiceId: string) =>
      `/admin/invoices/${invoiceId}/pdf`,
  },
  server: {
    status: () => request("/public/status"),
    list: () => request("/server"),
    plans: (category?: string, family?: string) => {
      const params = new URLSearchParams();
      if (category) params.append("category", category);
      if (family) params.append("family", family);
      params.append("currency", selectedCurrency());
      const qs = params.toString();
      return request(`/server/plans?${qs}`).then(sanitizePlans);
    },
    planConfiguration: (body: { planCode: string; category?: string; durationLabel?: string }) =>
      request(`/server/plans/configuration?planCode=${encodeURIComponent(body.planCode)}${body.category ? `&category=${encodeURIComponent(body.category)}` : ""}${body.durationLabel ? `&durationLabel=${encodeURIComponent(body.durationLabel)}` : ""}`),
    gateways: () => request("/server/gateways"),
    margins: () => request("/server/margins"),
    domains: () => request(`/server/domains?currency=${selectedCurrency()}`),
    myDomains: () => request(`/server/my-domains?currency=${selectedCurrency()}`),
    checkDomain: (domain: string) => request(`/server/domains/check?domain=${encodeURIComponent(domain)}&currency=${selectedCurrency()}`),
    suggestDomains: (keyword: string) => request(`/server/domains/suggest?keyword=${encodeURIComponent(keyword)}&currency=${selectedCurrency()}`),
    registerDomain: (body: { domainName: string; tld: string; years: number; priceAmount?: number; currency?: string }) =>
      request("/server/domains", { method: "POST", body: JSON.stringify({ ...body, currency: body.currency || selectedCurrency() }) }),
    toggleDomainAutoRenew: (domainId: string) =>
      request(`/server/domains/${domainId}/auto-renew`, { method: "POST" }),
    domainRecords: (domain: string) => request(`/server/domains/records?domain=${encodeURIComponent(domain)}`),
    createDomainRecord: (body: { domain: string; recordType: string; subDomain: string; target: string; ttl?: number }) =>
      request("/server/domains/records", { method: "POST", body: JSON.stringify(body) }),
    updateDomainRecord: (recordId: number, body: { domain: string; subDomain?: string; target?: string; ttl?: number }) =>
      request(`/server/domains/records/${recordId}`, { method: "PUT", body: JSON.stringify(body) }),
    deleteDomainRecord: (recordId: number, domain: string) =>
      request(`/server/domains/records/${recordId}?domain=${encodeURIComponent(domain)}`, { method: "DELETE" }),
    domainNameservers: (domain: string) => request(`/server/domains/${encodeURIComponent(domain)}/nameservers`),
    setDomainNameservers: (domain: string, nameServers: string[]) =>
      request(`/server/domains/${encodeURIComponent(domain)}/nameservers`, { method: "PUT", body: JSON.stringify({ nameServers }) }),
    domainDnssec: (domain: string) => request(`/server/domains/${encodeURIComponent(domain)}/dnssec`),
    setDomainDnssec: (domain: string, dsData: object) =>
      request(`/server/domains/${encodeURIComponent(domain)}/dnssec`, { method: "POST", body: JSON.stringify({ dsData }) }),
    details: (id: string) => request(`/server/${id}`),
    power: (id: string, action: string) =>
      request(`/server/${id}/power`, { method: "POST", body: JSON.stringify({ action }) }),
    reinstall: (id: string, osTemplate: string) =>
      request(`/server/${id}/reinstall`, { method: "POST", body: JSON.stringify({ osTemplate }) }),
    metrics: (id: string) => request(`/server/${id}/metrics`),
    metricsHistory: (id: string) => request(`/server/${id}/metrics/history`),
    bandwidth: (id: string) => request(`/server/${id}/bandwidth`),
    console: (id: string) => request(`/server/${id}/console`),
    carbon: (id: string) => request(`/server/${id}/carbon`),
    ping: (id: string) => request(`/server/${id}/ping`),
    pingHistory: (id: string) => request(`/server/${id}/ping/history`),
    rescue: (id: string, body: { enabled?: boolean; reboot?: boolean }) =>
      request(`/server/${id}/rescue`, { method: "POST", body: JSON.stringify(body) }),
    reverseDns: (id: string, body: { ip: string; reverse?: string; delete?: boolean }) =>
      request(`/server/${id}/reverse-dns`, { method: "POST", body: JSON.stringify(body) }),
    additionalIps: (id: string) => request(`/server/${id}/additional-ips`),
    additionalIpPrice: (id: string) => request(`/server/${id}/additional-ips/price?currency=${selectedCurrency()}`),
    purchaseAdditionalIp: (id: string, body: { gateway?: string; currency?: string }) =>
      request(`/server/${id}/additional-ips`, { method: "POST", body: JSON.stringify({ ...body, currency: body.currency || selectedCurrency() }) }),
    vpsOverview: (id: string) => request(`/server/${id}/vps/overview`),
    vpsDisks: (id: string) => request(`/server/${id}/vps/disks`),
    vpsBackups: (id: string) => request(`/server/${id}/vps/backups`),
    vpsSnapshot: (id: string, body: { action: "create" | "delete"; description?: string }) =>
      request(`/server/${id}/vps/snapshot`, { method: "POST", body: JSON.stringify(body) }),
    vpsBackupRestore: (id: string, restorePointId: string) =>
      request(`/server/${id}/vps/backup/restore`, { method: "POST", body: JSON.stringify({ restorePointId }) }),
    vpsSecondaryDns: (id: string) => request(`/server/${id}/vps/secondary-dns`),
    vpsSecondaryDnsAction: (id: string, body: { action: "add" | "delete"; domain: string }) =>
      request(`/server/${id}/vps/secondary-dns`, { method: "POST", body: JSON.stringify(body) }),
    vpsImages: (id: string) => request(`/server/${id}/vps/images`),
    vpsTasks: (id: string) => request(`/server/${id}/vps/tasks`),
    vpsUpdate: (id: string, body: { displayName?: string; netbootMode?: "local" | "rescue" }) =>
      request(`/server/${id}/vps`, { method: "PUT", body: JSON.stringify(body) }),
    vpsPasswordReset: (id: string) => request(`/server/${id}/vps/password`, { method: "POST" }),
    vpsOptions: (id: string) => request(`/server/${id}/vps/options?currency=${selectedCurrency()}`),
    vpsOrderOption: (id: string, body: { kind: "upgrade" | "additional_disk" | "automated_backup"; planCode?: string; size?: number; duration?: string; currency?: string }) =>
      request(`/server/${id}/vps/options/order`, { method: "POST", body: JSON.stringify({ ...body, currency: body.currency || selectedCurrency() }) }),
    vpsIpCountries: (id: string) => request(`/server/${id}/vps/ip-countries`),
    vpsSetIpGeolocation: (id: string, body: { ipAddress: string; country: string }) =>
      request(`/server/${id}/vps/ip-geolocation`, { method: "POST", body: JSON.stringify(body) }),
    setAutoRenew: (id: string, enabled: boolean) =>
      request(`/server/${id}/auto-renew`, { method: "POST", body: JSON.stringify({ enabled }) }),
    cancelService: (id: string) =>
      request(`/server/${id}/cancel`, { method: "POST", body: JSON.stringify({ confirm: true }) }),
  },
  billing: {
    createOrder: (body: { planCode: string; durationLabel: string; gateway: string; category: string; currency?: string }) =>
      request("/billing/order", { method: "POST", body: JSON.stringify({ ...body, currency: body.currency || selectedCurrency() }) }),
    invoices: () => request("/billing/invoices"),
    downloadInvoice: async (id: string) => {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const res = await fetch(`${API_BASE}/billing/invoices/${id}/pdf`, {
        headers: { ...(token && { Authorization: `Bearer ${token}` }) },
      });
      if (!res.ok) throw new Error("Failed to download invoice");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${id.slice(0, 8).toUpperCase()}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    },
    wallet: () => request("/billing/wallet"),
    walletTransactions: () => request("/wallet/transactions"),
    payInvoice: (id: string, gateway: string) => request(`/billing/invoices/${id}/pay`, { method: "POST", body: JSON.stringify({ gateway }) }),
    payWithWallet: (body: { planCode: string; durationLabel: string; category: string; configuration?: object; currency?: string; couponCode?: string }) =>
      request("/billing/wallet/pay", { method: "POST", body: JSON.stringify({ ...body, currency: body.currency || selectedCurrency() }) }),
  },
  public: {
    announcements: () => request("/public/announcements"),
    status: () => request("/public/status"),
  },
  coupons: {
    validate: (body: { code: string; planCode?: string; durationLabel?: string; currency?: string }) =>
      request("/coupons/validate", { method: "POST", body: JSON.stringify(body) }),
  },
  ai: {
    ask: (message: string) => request("/ai/assistant", { method: "POST", body: JSON.stringify({ message }) }),
  },
  cloud: {
    project: () => request("/cloud/project"),
    activateProject: () => request("/cloud/project/activate", { method: "POST" }),
    instances: () => request("/cloud/instances"),
    createInstance: (body: object) => request("/cloud/instances", { method: "POST", body: JSON.stringify(body) }),
    instanceAction: (id: string, action: string, image?: string) =>
      request(`/cloud/instances/${id}/action`, { method: "POST", body: JSON.stringify({ action, image }) }),
    sshKeys: () => request("/cloud/ssh-keys"),
    createSshKey: (body: { name: string; public_key: string; region?: string }) =>
      request("/cloud/ssh-keys", { method: "POST", body: JSON.stringify(body) }),
    deleteSshKey: (id: string) => request(`/cloud/ssh-keys/${id}`, { method: "DELETE" }),
    volumes: () => request("/cloud/volumes"),
    createVolume: (body: object) => request("/cloud/volumes", { method: "POST", body: JSON.stringify(body) }),
    volumeAction: (id: string, body: object) => request(`/cloud/volumes/${id}/action`, { method: "POST", body: JSON.stringify(body) }),
    deleteVolume: (id: string) => request(`/cloud/volumes/${id}`, { method: "DELETE" }),
    floatingIps: () => request("/cloud/floating-ips"),
    createFloatingIp: (body: object) => request("/cloud/floating-ips", { method: "POST", body: JSON.stringify(body) }),
    deleteFloatingIp: (id: string) => request(`/cloud/floating-ips/${id}`, { method: "DELETE" }),
    networks: () => request("/cloud/networks"),
    createNetwork: (body: object) => request("/cloud/networks", { method: "POST", body: JSON.stringify(body) }),
    containers: () => request("/cloud/containers"),
    createContainer: (body: object) => request("/cloud/containers", { method: "POST", body: JSON.stringify(body) }),
    deleteContainer: (id: string) => request(`/cloud/containers/${id}`, { method: "DELETE" }),
    quota: () => request("/cloud/quota"),
    usage: () => request("/cloud/usage"),
    services: () => request("/cloud/services"),
    kubes: () => request("/cloud/kubes"),
    createKube: (body: object) => request("/cloud/kubes", { method: "POST", body: JSON.stringify(body) }),
    kubeconfig: (id: string) => request(`/cloud/kubes/${id}/kubeconfig`),
    deleteKube: (id: string) => request(`/cloud/kubes/${id}`, { method: "DELETE" }),
    registries: () => request("/cloud/registries"),
    createRegistry: (body: object) => request("/cloud/registries", { method: "POST", body: JSON.stringify(body) }),
    deleteRegistry: (id: string) => request(`/cloud/registries/${id}`, { method: "DELETE" }),
  },
  orders: {
    list: () => request("/orders/"),
    get: (id: string) => request(`/orders/${id}`),
    payWallet: (id: string) => request(`/orders/${id}/pay-wallet`, { method: "POST" }),
    provision: (id: string) => request(`/orders/${id}/provision`, { method: "POST" }),
  },
  payments: {
    createCheckoutSession: (body: { type: string; amount?: number; gateway: string; orderId?: string; planCode?: string; durationLabel?: string; category?: string; configuration?: object; domainName?: string; tld?: string; years?: number; subscriptionId?: string; price?: number; domainId?: string; ipId?: string; currency?: string; couponCode?: string }) =>
      request("/payments/checkout", { method: "POST", body: JSON.stringify({ ...body, currency: body.currency || selectedCurrency() }) }),
    getSession: (sessionId: string) => request(`/payments/session/${sessionId}`),
    fulfillSession: (sessionId: string) => request(`/payments/session/${sessionId}/fulfill`, { method: "POST" }),
    verifyRazorpay: (body: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) =>
      request("/payments/razorpay/verify", { method: "POST", body: JSON.stringify(body) }),
  },
  team: {
    getMyTeam: () => request("/team"),
    inviteMember: (body: { inviteeEmail: string; permissions: string[] }) =>
      request("/team/invite", { method: "POST", body: JSON.stringify(body) }),
    acceptInvitation: (body: { token: string }) =>
      request("/team/accept", { method: "POST", body: JSON.stringify(body) }),
    rejectInvitation: (body: { token: string }) =>
      request("/team/reject", { method: "POST", body: JSON.stringify(body) }),
    revokeAccess: (body: { memberId: string }) =>
      request("/team/revoke", { method: "POST", body: JSON.stringify(body) }),
    updatePermissions: (body: { memberId: string; permissions: string[] }) =>
      request("/team/permissions", { method: "POST", body: JSON.stringify(body) }),
  },
  support: {
    createTicket: (body: FormData) =>
      request("/support/ticket", { method: "POST", body, formData: true }),
    getTickets: (params?: { status?: string; page?: number; limit?: number }) =>
      request(`/support/tickets?${new URLSearchParams(params as any).toString()}`),
    getTicket: (id: string) => request(`/support/tickets/${id}`),
    updateStatus: (id: string, body: FormData) =>
      request(`/support/tickets/${id}/status`, { method: "POST", body, formData: true }),
    addReply: (id: string, body: FormData) =>
      request(`/support/tickets/${id}/reply`, { method: "POST", body, formData: true }),
  },
};
