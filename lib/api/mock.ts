/**
 * MOCK API — pretends to be the dashboard, using the JSON files in mock-data/.
 * Supports filters, search, sorting and pages, so pages work exactly as they will with the real API.
 * To change the data, edit the JSON files in mock-data/ (not this file).
 */
import { connection } from "next/server";
import type {
  Branch,
  StoreSettings,
  Brand,
  Category,
  CheckoutOptions,
  ContentPage,
  GoldPrice,
  HomePage,
  MenuPage,
  Order,
  PlacedOrder,
  Product,
  ProductFilters,
} from "@/types";
import type { StorefrontApi } from "./types";
import { startingPrice } from "@/lib/pricing";
import { matchesSearch } from "@/lib/catalog/search";
import { activeOffers, buildQuote, type Coupon } from "@/lib/checkout/quote";
import { targetsProduct } from "@/lib/checkout/offer-math";
import type { Offer } from "@/types";
import { clientConfig } from "@/config/clients";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { CUSTOM_PHOTOS_DIR, mutate, read } from "./mock-db";
import { mockCustomerApi } from "./mock-customers";

import productsJson from "@/mock-data/products.json";
import categoriesJson from "@/mock-data/categories.json";
import brandsJson from "@/mock-data/brands.json";
import goldJson from "@/mock-data/gold-prices.json";
import homeJson from "@/mock-data/home.json";
import branchesJson from "@/mock-data/branches.json";
import checkoutOptionsJson from "@/mock-data/checkout-options.json";
import couponsJson from "@/mock-data/coupons.json";

// Content pages: one JSON file per page in mock-data/pages/. Register new pages here.
import aboutPage from "@/mock-data/pages/about.json";
import contactPage from "@/mock-data/pages/contact.json";
import faqPage from "@/mock-data/pages/faq.json";
import termsPage from "@/mock-data/pages/terms.json";
import returnsPage from "@/mock-data/pages/returns.json";
import privacyPage from "@/mock-data/pages/privacy.json";
import customizePage from "@/mock-data/pages/customize.json";
import b2bPage from "@/mock-data/pages/b2b.json"; // King Gold: wholesale page

const localProducts = productsJson as unknown as Product[];
const localCategories = categoriesJson as Category[];
const brands = brandsJson as Brand[];
const localGoldPrices = goldJson as GoldPrice[];
const home = homeJson as unknown as HomePage;
const branches = branchesJson as unknown as Branch[];
const checkoutOptions = checkoutOptionsJson as unknown as CheckoutOptions;
const localCoupons = couponsJson as unknown as Coupon[];

// Orders and customers are saved in .mock-db/db.json (see lib/api/mock-db.ts)
const pages: Record<string, ContentPage> = {
  about: aboutPage as unknown as ContentPage,
  contact: contactPage as unknown as ContentPage,
  faq: faqPage as unknown as ContentPage,
  terms: termsPage as unknown as ContentPage,
  returns: returnsPage as unknown as ContentPage,
  privacy: privacyPage as unknown as ContentPage,
  // "Design your piece" (custom orders) — /pages/customize
  customize: customizePage as unknown as ContentPage,
  // King Gold wholesale (B2B) page — /pages/b2b
  b2b: b2bPage as unknown as ContentPage,
};

/**
 * Pages in sample-data mode: from the dashboard running on your computer (DASHBOARD_URL, Site pages section)
 * or, when it's off, mock-data/pages/<slug>.json. Returns undefined when the dashboard isn't reachable.
 */
async function fromDashboard<T>(path: string): Promise<T | null | undefined> {
  const dashboard = process.env.DASHBOARD_URL?.replace(/\/$/, "");
  if (!dashboard) return undefined;
  await connection();
  try {
    const res = await fetch(`${dashboard}${path}`, { cache: "no-store", signal: AbortSignal.timeout(2000) });
    if (res.status === 404) return null;
    return res.ok ? ((await res.json()) as T) : undefined;
  } catch {
    return undefined; // dashboard not running
  }
}

/** Small delay so loading states can be seen during development */
const delay = <T>(value: T, ms = 150) => new Promise<T>((r) => setTimeout(() => r(value), ms));

/**
 * PRODUCTS AND CATEGORIES in sample-data mode:
 *   - DASHBOARD_URL set (.env.local) and the dashboard running -> what you edit in the dashboard
 *     (Products / Categories), only the visible ones — changes show on the next page load
 *   - otherwise -> mock-data/products.json and mock-data/categories.json
 */
async function catalog(): Promise<{ products: Product[]; categories: Category[]; brands: Brand[] }> {
  const dashboard = process.env.DASHBOARD_URL?.replace(/\/$/, "");
  if (dashboard) {
    // Render on each visit (not once at build) so a change saved in the dashboard shows right away
    await connection();
    try {
      const res = await fetch(`${dashboard}/api/public/catalog`, { cache: "no-store", signal: AbortSignal.timeout(2000) });
      // `brands` = the collections from the dashboard → Collections (an older dashboard doesn't send them)
      if (res.ok) return { brands, ...((await res.json()) as { products: Product[]; categories: Category[]; brands?: Brand[] }) };
    } catch {
      // dashboard not running -> local files
    }
  }
  return { products: localProducts, categories: localCategories, brands };
}

/**
 * GOLD PRICES, COUPONS, PRICE LOCK AND CHECKOUT OPTIONS (delivery areas, payment methods, VAT) in sample-data mode:
 *   - DASHBOARD_URL set and the dashboard running -> the dashboard (Gold prices & coupons, Shipping & payment)
 *   - otherwise -> mock-data/gold-prices.json, mock-data/coupons.json, mock-data/checkout-options.json
 */
async function pricing(): Promise<{ goldPrices: GoldPrice[]; coupons: Coupon[]; options: CheckoutOptions }> {
  const dashboard = process.env.DASHBOARD_URL?.replace(/\/$/, "");
  if (dashboard) {
    await connection();
    try {
      const res = await fetch(`${dashboard}/api/public/pricing`, { cache: "no-store", signal: AbortSignal.timeout(2000) });
      if (res.ok) {
        const p = (await res.json()) as { goldPrices: GoldPrice[]; coupons: Coupon[]; priceLockMinutes: number; priceChangeTolerancePct: number; checkout?: CheckoutOptions };
        // `checkout` = delivery areas, payment methods, VAT and store pickup from the dashboard → Shipping & payment
        const base = p.checkout ?? checkoutOptions;
        return { goldPrices: p.goldPrices, coupons: p.coupons, options: { ...base, priceLockMinutes: p.priceLockMinutes, priceChangeTolerancePct: p.priceChangeTolerancePct } };
      }
    } catch {
      // dashboard not running -> local files
    }
  }
  return { goldPrices: localGoldPrices, coupons: localCoupons, options: checkoutOptions };
}

function applyFilters(list: Product[], f: ProductFilters, categories: Category[], goldPrices: GoldPrice[], offers: Offer[] = []): Product[] {
  let out = list.filter((p) => {
    // "Special offers" filter: a running offer is for all products or names this one
    if (f.onOffer && !offers.some((o) => targetsProduct(o, p.id))) return false;
    if (f.categoryId && p.categoryId !== f.categoryId) return false;
    if (f.brandId && p.brandId !== f.brandId) return false;
    if (f.metal?.length && !f.metal.includes(p.metal)) return false;
    if (f.karat?.length && !f.karat.includes(p.karat)) return false;
    if (f.inStockOnly && !p.variants.some((v) => v.stockQty > 0)) return false;
    // Arabic-aware search (hamza/taa marbuta/diacritics/Arabic digits) — rules in lib/catalog/search.ts
    if (f.search && !matchesSearch(p, f.search, categories, brands)) return false;
    const price = startingPrice(p, goldPrices);
    if (f.minPrice != null && price < f.minPrice) return false;
    if (f.maxPrice != null && price > f.maxPrice) return false;
    const w = Math.min(...p.variants.map((v) => v.weightGrams));
    if (f.minWeight != null && w < f.minWeight) return false;
    if (f.maxWeight != null && w > f.maxWeight) return false;
    return true;
  });

  const weight = (p: Product) => Math.min(...p.variants.map((v) => v.weightGrams));
  switch (f.sort) {
    case "price_asc":
      out = out.sort((a, b) => startingPrice(a, goldPrices) - startingPrice(b, goldPrices));
      break;
    case "price_desc":
      out = out.sort((a, b) => startingPrice(b, goldPrices) - startingPrice(a, goldPrices));
      break;
    case "weight_asc":
      out = out.sort((a, b) => weight(a) - weight(b));
      break;
    case "weight_desc":
      out = out.sort((a, b) => weight(b) - weight(a));
      break;
    default:
      out = out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  return out;
}

export const mockApi: StorefrontApi = {
  /**
   * Homepage in sample-data mode: from the dashboard running on your computer (DASHBOARD_URL, Homepage section)
   * or, when it's off, mock-data/home.json
   */
  getHomePage: async (options) => {
    const q = options?.preview ? `?preview=${encodeURIComponent(options.preview)}` : "";
    const remote = await fromDashboard<HomePage>(`/api/public/home${q}`);
    return remote ?? delay(home);
  },
  getCategories: async () => {
    const { categories } = await catalog();
    return delay([...categories].sort((a, b) => a.sortOrder - b.sortOrder));
  },
  getCategoryBySlug: async (slug) => delay((await catalog()).categories.find((c) => c.slug === slug) ?? null),
  // Collections: dashboard → Collections (only the visible ones, in their order), or mock-data/brands.json
  getBrands: async () => delay([...(await catalog()).brands].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))),
  getGoldPrices: async () => delay((await pricing()).goldPrices),
  // Special offers = the coupons marked "automatic" in the dashboard (Gold prices & coupons), without their codes
  getOffers: async () => activeOffers((await pricing()).coupons),
  getProducts: async (filters = {}) => {
    const [{ products, categories }, { goldPrices, coupons }] = await Promise.all([catalog(), pricing()]);
    const all = applyFilters(products, filters, categories, goldPrices, filters.onOffer ? activeOffers(coupons) : []);
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 12;
    const items = all.slice((page - 1) * pageSize, page * pageSize);
    return delay({ items, page, pageSize, total: all.length });
  },
  getProductBySlug: async (slug) => delay((await catalog()).products.find((p) => p.slug === slug) ?? null),
  // Kept in the order of `ids` (the order chosen in the dashboard's product row); hidden / unknown ids are skipped
  getProductsByIds: async (ids) => {
    const byId = new Map((await catalog()).products.map((p) => [p.id, p]));
    return delay(ids.map((id) => byId.get(id)).filter((p): p is Product => !!p));
  },
  getPage: async (slug, options) => {
    const q = options?.preview ? `?preview=${encodeURIComponent(options.preview)}` : "";
    const remote = await fromDashboard<ContentPage>(`/api/public/pages/${encodeURIComponent(slug)}${q}`);
    if (remote !== undefined) return remote;
    const page = pages[slug];
    // Drafts are hidden from visitors, like the real dashboard will do
    return delay(page && page.status === "published" ? page : null);
  },
  getMenuPages: async () => {
    const remote = await fromDashboard<MenuPage[]>("/api/public/pages");
    if (remote) return remote;
    return Object.values(pages)
      .filter((p) => p.status === "published")
      .map((p, i) => ({ slug: p.slug, title: p.title, menu: p.menu ?? "none", sortOrder: i }));
  },
  // Branches and store details: from the dashboard on your computer (Settings) when DASHBOARD_URL is set, else the samples
  getBranches: async () => (await fromDashboard<Branch[]>("/api/public/branches")) ?? delay([...branches].sort((a, b) => a.sortOrder - b.sortOrder)),
  getStoreSettings: async () => (await fromDashboard<StoreSettings>("/api/public/store")) ?? null,

  /**
   * Theme in sample-data mode: if DASHBOARD_URL is set (.env.local), read the theme the designer
   * published in the dashboard running on your computer — so changes show here right away.
   * Otherwise (or if the dashboard is off) use the client defaults.
   */
  getTheme: async () => {
    const dashboard = process.env.DASHBOARD_URL?.replace(/\/$/, "");
    if (!dashboard) return null;
    // Render pages on each visit (not once at build) so a "Publish" in the dashboard shows immediately
    await connection();
    try {
      const res = await fetch(`${dashboard}/api/public/theme`, { cache: "no-store", signal: AbortSignal.timeout(1500) });
      return res.ok ? await res.json() : null;
    } catch {
      return null; // dashboard not running
    }
  },
  sendContactMessage: (message) => {
    // Mock mode: saved in .mock-db/db.json. The dashboard shows it in "رسائل التواصل"
    // when its .env.local has STOREFRONT_MOCK_DB=../storefront/.mock-db/db.json
    const reference = `MSG-${Date.now().toString().slice(-6)}`;
    mutate((db) => {
      db.contactMessages.push({ ...message, id: `msg_${crypto.randomUUID().slice(0, 8)}`, reference, createdAt: new Date().toISOString() });
    });
    return delay({ ok: true, reference }, 400);
  },
  sendCustomRequest: (request, photos) => {
    // Mock mode: details in .mock-db/db.json, photos in .mock-db/custom-photos/.
    // The dashboard shows them in "طلبات التخصيص" when its .env.local has STOREFRONT_MOCK_DB=../storefront/.mock-db/db.json
    const id = `cus_${crypto.randomUUID().slice(0, 8)}`;
    const reference = `CUS-${Date.now().toString().slice(-6)}`;
    const ext = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" } as const;
    mkdirSync(CUSTOM_PHOTOS_DIR, { recursive: true });
    const saved = photos.map((p, i) => {
      const file = `${id}-${i + 1}.${ext[p.type]}`;
      writeFileSync(path.join(CUSTOM_PHOTOS_DIR, file), p.data);
      return { file, type: p.type, size: p.data.length };
    });
    mutate((db) => {
      db.customRequests.push({ ...request, id, reference, createdAt: new Date().toISOString(), photos: saved });
    });
    return delay({ ok: true, reference }, 400);
  },

  // ===== CHECKOUT =====
  getCheckoutOptions: async () => delay((await pricing()).options),

  quoteOrder: async (request) => {
    const [{ products }, { goldPrices, coupons, options }] = await Promise.all([catalog(), pricing()]);
    return delay(buildQuote({ request, products, goldPrices, options, coupons, currency: clientConfig.currency }));
  },

  placeOrder: async (req): Promise<PlacedOrder> => {
    // Same checkout attempt sent twice (double click / refresh) -> return the first order
    const previous = read((db) => {
      const n = db.orderKeys[req.idempotencyKey];
      return n ? db.orders.find((o) => o.number === n) : undefined;
    });
    if (previous) return { ok: true, orderNumber: previous.number, total: previous.total };

    const [{ products }, { goldPrices, coupons, options }] = await Promise.all([catalog(), pricing()]);
    const quote = buildQuote({ request: req, products, goldPrices, options, coupons, currency: clientConfig.currency });
    if (quote.unavailable.length) return { ok: false, error: "unavailable", quote };
    if (quote.blockers.length) return { ok: false, error: "blocked", quote };
    // Gold rate moved since the customer saw the total:
    //   - price went DOWN -> the order goes through at the new, lower total
    //   - went UP within the tolerance -> the order goes through at the total they saw (the store absorbs it)
    //   - went UP more -> ask the customer to confirm the new total
    let priceProtection = 0;
    if (quote.total > req.expectedTotal) {
      const risePct = req.expectedTotal > 0 ? ((quote.total - req.expectedTotal) / req.expectedTotal) * 100 : 100;
      if (risePct > (options.priceChangeTolerancePct ?? 0)) return { ok: false, error: "price_changed", quote };
      priceProtection = quote.total - req.expectedTotal;
    }

    const payment = options.paymentMethods.find((m) => m.id === req.paymentMethodId && m.isActive);
    if (
      !payment ||
      !payment.availableFor.includes(req.deliveryMethod) ||
      (payment.maxOrderTotal !== undefined && quote.total > payment.maxOrderTotal)
    ) {
      return { ok: false, error: "invalid_payment", quote };
    }

    const number = `ORD-${String(Date.now()).slice(-6)}`;
    const now = new Date().toISOString();
    const order: Order = {
      id: crypto.randomUUID(),
      number,
      status: "pending",
      createdAt: now,
      customer: req.customer,
      customerId: req.customerAuth?.customerId,
      lines: quote.lines.map((l) => ({
        productId: l.productId,
        variantId: l.variantId,
        sku: l.sku,
        name: l.name,
        karat: l.karat,
        weightGrams: l.weightGrams,
        quantity: l.quantity,
        goldPricePerGram: l.goldPricePerGram,
        makingCharge: l.makingCharge,
        stonesPrice: l.stonesPrice,
        unitPrice: l.unitPrice,
        lineTotal: l.lineTotal,
        size: l.size,
        imageUrl: l.imageUrl,
      })),
      subtotal: quote.subtotal,
      // A small gold-price rise the store absorbed is recorded as part of the discount
      discount: quote.discount + priceProtection,
      couponCode: quote.coupon?.valid ? quote.coupon.code : undefined,
      vat: quote.vat,
      shipping: quote.shipping,
      total: quote.total - priceProtection,
      currency: quote.currency,
      deliveryMethod: req.deliveryMethod,
      paymentMethodId: payment.id,
      paymentMethod: payment.type,
      paymentStatus: payment.type === "bank_transfer" ? "awaiting_transfer" : "pending",
      shippingAddress:
        req.deliveryMethod === "delivery" && req.address
          ? {
              fullName: req.customer.name,
              phone: req.customer.phone,
              country: "EG",
              city: `${req.address.city}${req.locale === "ar" ? "، " : ", "}${req.address.governorate}`,
              area: req.address.area,
              street: req.address.street,
              building: req.address.building,
              notes: req.address.notes,
            }
          : undefined,
      pickupBranchId: req.deliveryMethod === "store_pickup" ? req.pickupBranchId : undefined,
      notes: req.notes,
      locale: req.locale,
      statusHistory: [{ status: "pending", at: now }],
    };

    // Reserve the pieces (in memory only — the real API / ERP keeps the stock)
    for (const line of quote.lines) {
      const variant = products.flatMap((p) => p.variants).find((v) => v.id === line.variantId);
      if (variant && variant.stockStatus !== "made_to_order") {
        variant.stockQty = Math.max(0, variant.stockQty - line.quantity);
        variant.stockStatus = variant.stockQty === 0 ? "out_of_stock" : variant.stockQty <= 2 ? "low_stock" : "in_stock";
      }
    }

    mutate((db) => {
      db.orders.push(order);
      db.orderKeys[req.idempotencyKey] = number;
    });
    console.log(`[mock] order ${number} placed — total ${order.total} ${order.currency}`);
    // A real card payment would return the payment gateway page here (paymentRedirectUrl)
    return delay({ ok: true, orderNumber: number, total: order.total }, 500);
  },

  getOrder: (number) => delay(read((db) => db.orders.find((o) => o.number === number) ?? null)),

  // ===== CUSTOMER ACCOUNTS ===== (lib/api/mock-customers.ts)
  ...mockCustomerApi,
};
