/**
 * REAL API — talks to the client's dashboard. Used when NEXT_PUBLIC_DATA_SOURCE=api.
 *
 * When we get the API documentation:
 *   - Set the base URL in .env.local -> NEXT_PUBLIC_API_BASE_URL
 *   - Replace the placeholder paths below ("/storefront/...") with the real endpoints
 *   - If the API's data looks different from our types, convert it here
 *
 * CACHING
 *   - `revalidate` = seconds a response is kept before asking the API again (safety net)
 *   - `tags`       = labels used for INSTANT updates: when the client saves something in the
 *                    dashboard, the dashboard calls POST /api/revalidate with the tag
 *                    (e.g. "page:about") and only that data is refreshed. See app/api/revalidate/route.ts
 */
import type { StorefrontApi } from "./types";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

interface GetOptions {
  revalidate?: number;
  tags?: string[];
  /** Return null instead of throwing when the API answers 404 */
  allow404?: boolean;
}

async function get<T>(path: string, { revalidate = 60, tags = [], allow404 = false }: GetOptions = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, { next: { revalidate, tags } });
  if (allow404 && res.status === 404) return null as T;
  if (!res.ok) throw new Error(`API ${res.status} on ${path}`);
  return res.json() as Promise<T>;
}

/** POST helper for sending data to the dashboard (never cached) */
async function post<T>(path: string, body: unknown, { acceptErrorBody = false } = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  // Some endpoints answer 409/422 with a useful JSON body (e.g. "price_changed" + new quote)
  if (acceptErrorBody && res.status >= 400 && res.status < 500) return res.json() as Promise<T>;
  if (!res.ok) throw new Error(`API ${res.status} on ${path}`);
  return res.json() as Promise<T>;
}

/** Account requests: send the customer's token, never cache */
async function authed<T>(auth: { token?: string }, method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...(auth.token ? { Authorization: `Bearer ${auth.token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });
  if (res.status === 404) return null as T;
  // 4xx answers carry { ok:false, error } for login / register / profile
  if (res.status >= 400 && res.status < 500) return res.json() as Promise<T>;
  if (!res.ok) throw new Error(`API ${res.status} on ${path}`);
  return res.json() as Promise<T>;
}

const qs = (params: Record<string, unknown>) =>
  new URLSearchParams(
    Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== "")
      .map(([k, v]) => [k, Array.isArray(v) ? v.join(",") : String(v)]),
  ).toString();

// Content that changes only when someone edits it is kept for 1 hour; the tag makes updates instant anyway.
const CONTENT = 3600;

export const httpApi: StorefrontApi = {
  getCategories: () => get("/storefront/categories", { revalidate: CONTENT, tags: ["categories"] }),
  getCategoryBySlug: (slug) =>
    get(`/storefront/categories/${slug}`, { revalidate: CONTENT, tags: ["categories"], allow404: true }),
  getBrands: () => get("/storefront/brands", { revalidate: CONTENT, tags: ["brands"] }),
  getGoldPrices: () => get("/storefront/gold-prices", { revalidate: 60, tags: ["gold-prices"] }),
  // Special offers running now (automatic discounts on chosen products). Refreshed with tag "offers" when one is saved
  getOffers: () => get("/storefront/offers", { revalidate: 60, tags: ["offers"] }),
  getProducts: (filters = {}) => get(`/storefront/products?${qs({ ...filters })}`, { tags: ["products"] }),
  getProductBySlug: (slug) =>
    get(`/storefront/products/${slug}`, { tags: ["products", `product:${slug}`], allow404: true }),
  getProductsByIds: (ids) => get(`/storefront/products?${qs({ ids })}`, { tags: ["products"] }),
  getHomePage: async (options) => {
    if (options?.preview) {
      // Draft preview: never cached. If the token is refused, the live homepage is shown
      const res = await fetch(`${BASE_URL}/storefront/home?preview=${encodeURIComponent(options.preview)}`, { cache: "no-store" });
      if (res.ok) return res.json();
    }
    return get("/storefront/home", { revalidate: CONTENT, tags: ["home"] });
  },
  getPage: async (slug, options) => {
    if (options?.preview) {
      // Draft preview: never cached, the token proves a staff member asked for it
      const res = await fetch(`${BASE_URL}/storefront/pages/${encodeURIComponent(slug)}?preview=${encodeURIComponent(options.preview)}`, { cache: "no-store" });
      return res.ok ? res.json() : null;
    }
    return get(`/storefront/pages/${encodeURIComponent(slug)}`, { revalidate: CONTENT, tags: ["pages", `page:${slug}`], allow404: true });
  },
  getMenuPages: () => get("/storefront/pages?menu=1", { revalidate: CONTENT, tags: ["pages"] }),
  getBranches: () => get("/storefront/branches", { revalidate: CONTENT, tags: ["branches"] }),
  // Contact details + social links. The dashboard refreshes them instantly with tag "settings"
  getStoreSettings: () => get("/storefront/settings", { revalidate: CONTENT, tags: ["settings"], allow404: true }),
  // Website look (colours, fonts, logo, texts). The dashboard refreshes it instantly with tag "theme" on Publish.
  getTheme: () => get("/storefront/theme", { revalidate: CONTENT, tags: ["theme"], allow404: true }),
  sendContactMessage: (message) => post("/storefront/contact-messages", message),
  // Custom order: sent as a form with the photos attached (fields "data" = JSON, "photos" = files)
  sendCustomRequest: async (request, photos) => {
    const form = new FormData();
    form.append("data", JSON.stringify(request));
    for (const p of photos) form.append("photos", new Blob([new Uint8Array(p.data)], { type: p.type }), p.name);
    const res = await fetch(`${BASE_URL}/storefront/custom-requests`, { method: "POST", body: form, cache: "no-store" });
    if (!res.ok) throw new Error(`API ${res.status} on /storefront/custom-requests`);
    return res.json();
  },

  // Checkout: options change rarely (tag "checkout-options"); quotes and orders are never cached
  getCheckoutOptions: () => get("/storefront/checkout-options", { revalidate: CONTENT, tags: ["checkout-options"] }),
  quoteOrder: (request) => post("/storefront/checkout/quote", request),
  placeOrder: (request) => post("/storefront/orders", request, { acceptErrorBody: true }),
  getOrder: async (number) => {
    const res = await fetch(`${BASE_URL}/storefront/orders/${encodeURIComponent(number)}`, { cache: "no-store" });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`API ${res.status} on /storefront/orders/${number}`);
    return res.json();
  },

  // Customer accounts. The dashboard answers login/register with { ok, customer, token }.
  registerCustomer: (input) => post("/storefront/customers/register", input, { acceptErrorBody: true }),
  loginCustomer: (input) => post("/storefront/customers/login", input, { acceptErrorBody: true }),
  loginWithGoogle: (input) => post("/storefront/customers/google", input, { acceptErrorBody: true }),
  getCustomer: (auth) => authed(auth, "GET", "/storefront/customers/me"),
  updateCustomer: (auth, input) => authed(auth, "PATCH", "/storefront/customers/me", input),
  changePassword: (auth, input) => authed(auth, "POST", "/storefront/customers/me/password", input),
  addAddress: (auth, input) => authed(auth, "POST", "/storefront/customers/me/addresses", input),
  updateAddress: (auth, id, input) => authed(auth, "PUT", `/storefront/customers/me/addresses/${id}`, input),
  deleteAddress: (auth, id) => authed(auth, "DELETE", `/storefront/customers/me/addresses/${id}`),
  getCustomerOrders: (auth) => authed(auth, "GET", "/storefront/customers/me/orders"),
  getCustomerOrder: (auth, number) => authed(auth, "GET", `/storefront/customers/me/orders/${encodeURIComponent(number)}`),
};
