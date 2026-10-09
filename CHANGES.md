# What changed and why

This file explains every change made to the original `e-commerce` project. It is grouped by the points from the review, plus the two new requirements: Arabic/English, and gold/jewelry only.

The new project is in `Frontend-Main/storefront`. Your original `e-commerce` folder was not touched, so you can compare the two side by side.

---

## 1. JavaScript → TypeScript

**Before:** every file was `.js` (`layout.js`, `page.js`, `Header.js` …) and there was a `jsconfig.json`.

**After:** every file is `.ts` / `.tsx`.

| File | What it does |
|---|---|
| `tsconfig.json` | Replaces `jsconfig.json`. Keeps the same `@/` import alias. `strict: true` means TypeScript reports mistakes such as a missing field or a wrong type while you write code, before the site runs. |
| `next.config.ts` | Replaces `next.config.mjs`. Keeps your `reactCompiler: true` setting and adds `images.remotePatterns`, which Next.js requires before it will show images from another domain (the dashboard/CDN). |
| `package.json` | Adds `typescript`, `@types/react`, `@types/react-dom` and `@types/node`. Adds a `typecheck` script: `npm run typecheck` checks the whole project for type errors. |

**Why:** the storefront will receive data from a dashboard API we don't control yet. With TypeScript, the shape of every piece of data (a product, an order, a homepage section) is written down once in `types/`. If the API later sends something different, TypeScript shows you every place that breaks.

---

## 2. Route names → lowercase, and every route under a language

**Before:** `/Products`, `/aboutUs`, `/contactUs`, `/PersonalAccount`, `/ProductDetails`, `/Cart`, `/TermsAndPolicies`.

**After:** every page lives under `app/[locale]/`, so each URL starts with the language:

| Old | New |
|---|---|
| `/` | `/ar` and `/en` |
| `/Products` | `/ar/products` |
| `/ProductDetails` | `/ar/products/[slug]`, e.g. `/ar/products/cuban-chain-necklace` |
| `/aboutUs` | `/ar/about` |
| `/contactUs` | `/ar/contact` |
| `/Cart` | `/ar/cart` |
| `/PersonalAccount` | `/ar/account` |
| `/TermsAndPolicies` | `/ar/terms` |

New pages were added so every page on the project list exists: `categories`, `categories/[slug]`, `search`, `faq`, `checkout`, `order-success`, `login`, `register`, `account/profile`, `account/addresses`, `account/orders` and `account/orders/[id]`.

**Why:**
- URLs are case-sensitive, so `/products` and `/Products` would be two different pages. Lowercase is the web standard and better for SEO.
- The product details page takes a `[slug]`, which is how a single page can show any product.
- Home and Products already show real mock data. The other pages show their translated title and a "coming soon" message. They'll be built one by one in the next phase.

---

## 3. Arabic + English (new requirement)

| File | What it does |
|---|---|
| `proxy.ts` | Runs before every request. (Next.js 16 renamed `middleware.ts` to `proxy.ts`.) If a URL has no language, for example `/products`, it redirects to `/ar/products` or `/en/products`. It picks the language in this order: the language the visitor chose before (saved in a cookie), then the browser language, then the client's default language. |
| `i18n/config.ts` | The list of languages, which ones are right-to-left, and `localePath()`. `localePath("ar", "/products")` returns `/ar/products`, so every link keeps the current language. |
| `i18n/dictionaries/ar.json` and `en.json` | All fixed interface text (menu, buttons, page titles, footer). Nothing is typed directly into components anymore. To change a word, edit the JSON. |
| `i18n/get-dictionary.ts` | Loads the right dictionary on the server, so no translation files are sent to the browser. |
| `components/layout/LanguageSwitcher.tsx` | The "English / العربية" link in the header. It stays on the same page and only swaps the language (`/ar/products` ↔ `/en/products`), and saves the choice in a cookie. |
| `app/[locale]/layout.tsx` | Sets `<html lang="ar" dir="rtl">` for Arabic and `lang="en" dir="ltr"` for English, so the whole layout mirrors automatically. |

**RTL detail:** the header and footer now use `start-8` / `end-8` instead of `left-8` / `right-8`. In English "start" means left, and in Arabic it means right, so one component works in both directions.

**Dashboard content:** product names, banner titles and so on come in both languages as `{ "ar": "...", "en": "..." }` (the `LocalizedText` type). The `t()` helper in `lib/format.ts` picks the right language.

**Numbers and prices:** `formatPrice()` and `formatWeight()` use the browser's built-in formatter, so Arabic pages show `٤٬٧٩٥ ج.م.‏` and English pages show `EGP 4,795`.

---

## 4. Branding moved into a client config (white-label)

**Before:** "My Store", `bg-black`, `info@mystore.com`, `+20 123456789` were written inside `Header.js` and `Footer.js`.

**After:** all of it lives in one file per client.

| File | What it does |
|---|---|
| `types/client.ts` | Defines what a client can customise: name, languages, default language, currency, VAT %, logo, colours, fonts, layout options, contact details, social links, and feature switches (show gold prices, show weight, store pickup, guest checkout). |
| `config/clients/demo.ts` | The demo client. It uses your original values: black header, dark footer, "My Store", your email and phone. |
| `config/clients/index.ts` | The list of clients. The active client is chosen by `NEXT_PUBLIC_CLIENT_ID` in `.env.local`. |
| `lib/theme.ts` | Turns the client's colours into CSS variables (`--primary`, `--header-bg` …). |
| `app/globals.css` | Connects those variables to Tailwind, so classes like `bg-primary`, `bg-header` and `text-muted-foreground` use the client's colours. It also holds default values in case a colour is missing. |
| `lib/fonts.ts` | Every font a client can pick: Arabic (Cairo, Tajawal, Almarai), Latin (Inter, Playfair Display). The client config picks by name. Arabic pages use the Arabic font; English headings use the heading font. |
| `components/layout/Header.tsx` / `Footer.tsx` | **Same design as yours** (logo on one side, links centred, icons on the other side; 3-column footer), but every text, colour and contact detail now comes from the config or the dictionaries. |

**To launch a new client:** copy `config/clients/demo.ts` to, for example, `config/clients/gemma.ts`, change the values, register it in `index.ts`, and set `NEXT_PUBLIC_CLIENT_ID=gemma`. No component changes are needed.

The Geist fonts, the "Create Next App" page title and the default SVGs in `public/` were removed. The page title and description now come from the client config. Your `favicon.ico` was kept.

---

## 5. Libraries installed

| Library | Where it's used now | Why |
|---|---|---|
| **Shadcn UI** | `components.json`, `components/ui/button.tsx`, `components/ui/badge.tsx`, `lib/utils.ts` (the `cn()` helper) | Ready-made components that follow the client's theme automatically. Add more with `npx shadcn@latest add dialog` (or any other component name). |
| **TanStack Query** | `components/providers.tsx` wraps the app | Fetching and caching data in the browser. It will be used for search, cart re-pricing and account pages. |
| **Zustand** | `stores/cart-store.ts` | The shopping cart. It is saved in the browser, so it survives a page refresh. The cart icon in the header already shows the item count. |
| **React Hook Form + Zod** | Installed, not used yet | For the login, register, address and checkout forms in the next phase. |
| `lucide-react`, `class-variance-authority`, `clsx`, `tailwind-merge`, `@radix-ui/react-slot`, `tw-animate-css` | Needed by Shadcn | |
| `server-only` | `i18n/get-dictionary.ts` | Makes the build fail if server-only code is accidentally sent to the browser. |

`react-icons` was kept because your header uses it.

---

## 6. Project structure

```
storefront/
├── app/
│   ├── [locale]/            ← every page, per language
│   │   ├── layout.tsx       ← html lang/dir, theme colours, fonts, header, footer
│   │   ├── page.tsx         ← home = CMS sections from the dashboard
│   │   ├── products/ …      ← all pages from the project list
│   │   └── not-found.tsx
│   ├── globals.css
│   └── favicon.ico
├── components/
│   ├── ui/                  ← Shadcn components
│   ├── layout/              ← Header, Footer, LanguageSwitcher, CartButton
│   ├── sections/            ← homepage CMS sections + SectionRenderer
│   ├── product/             ← ProductCard (later: gallery, variant picker …)
│   ├── common/              ← PageShell, SectionTitle
│   └── providers.tsx
├── config/clients/          ← one file per client
├── i18n/                    ← languages, dictionaries, proxy helpers
├── lib/
│   ├── api/                 ← data layer (mock now, real API later)
│   ├── pricing.ts           ← gold price calculation
│   ├── format.ts            ← t(), formatPrice(), formatWeight(), formatDate()
│   ├── theme.ts, fonts.ts, utils.ts
├── mock-data/               ← JSON that pretends to be the dashboard
├── stores/                  ← Zustand stores (cart)
├── types/                   ← TypeScript models
├── hooks/                   ← (empty, for custom hooks)
└── proxy.ts                 ← language redirect
```

### The data layer (`lib/api/`), the most important part for the future

- `types.ts` is the list of functions the storefront needs: `getHomePage`, `getProducts`, `getProductBySlug`, `getGoldPrices` …
- `mock.ts` implements them using the JSON in `mock-data/`. It already supports filters (category, karat, metal, weight, price, in-stock only), search, sorting and pagination.
- `http.ts` implements the same functions against the real dashboard API. The endpoint paths are placeholders until we get the API documentation.
- `index.ts` picks one of the two based on `NEXT_PUBLIC_DATA_SOURCE` (`mock` or `api`).

Pages only ever call `api.getProducts()` and so on. When the real API arrives, only `http.ts` changes. If the API's data looks different from our types, we convert it inside `http.ts`, and nothing else in the app changes.

### The CMS section renderer (`components/sections/`)

The dashboard sends the homepage as an ordered list of sections, each with a `type`, `isActive`, `sortOrder` and `data`. `SectionRenderer.tsx` sorts the list, skips inactive sections, and draws each one with its matching component. There are 8 types: `hero`, `banner`, `featured_products`, `categories`, `brands`, `video`, `promotion` and `gold_prices`.

To test it, open `mock-data/home.json` and change the `sortOrder` values or set `isActive` to `false`. The homepage changes with no code edits, which is exactly how the dashboard will control it. If the dashboard ever sends a section type the storefront doesn't know, that section is skipped instead of breaking the page.

---

## 7. Gold / jewelry model (new requirement)

| File | What it defines |
|---|---|
| `types/product.ts` | `Product` with `metal` (yellow/white/rose gold, platinum, silver), `karat` (24/22/21/18/14), `pricingMode`, `makingCharge` (per gram / fixed / percent), `stones` (type, count, carat, colour, clarity, price) and `certificate`. `ProductVariant` covers size/length, **weight in grams**, stock quantity and stock status. Each variant is one ERP item, because two rings of the same design can weigh differently. `GoldPrice` is the price per gram for each karat. `ProductFilters` adds filters by karat, metal and weight. |
| `lib/pricing.ts` | Price calculation. **Weight-based:** weight × gold price per gram for that karat + making charge + stones. **Fixed:** the price the ERP sends (for diamond pieces, for example). The calculation is for display only. The API must confirm the final price at checkout, because the gold rate can change while the customer is shopping. |
| `types/order.ts` | Cart item, order and order line. Each order line records the weight, gold rate, making charge and stones price at the moment of the order. It also covers delivery or store pickup, payment methods and the order status history. |
| `types/cms.ts` | Includes a `gold_prices` section: the "Today's gold prices" strip on the homepage. |
| `mock-data/` | 6 categories (rings, necklaces, bracelets, earrings, sets, coins & bars), 4 collections, 9 sample products, gold prices for 24K/21K/18K in EGP, and the homepage sections. |
| `ProductCard.tsx` | Shows the karat, weight and a price calculated from today's gold price. |

---

## How to run it

```bash
cd storefront
npm install
npm run dev
```

Open http://localhost:3000. It redirects to `/ar` (or `/en` if your browser is set to English).

**Note:** fonts are downloaded from Google Fonts during `npm run dev` / `npm run build`, so the machine needs internet access the first time.

## Next phase

Build the real pages on the mock data: product listing with filters and sorting, product details (gallery, variant/size picker, price breakdown, add to cart), cart, checkout (React Hook Form + Zod), login/register, account pages, search, and a mobile menu for the header.

---

## Fix: Arabic search

**Problem:** Arabic search only found exact spelling in the product name. "اسوره" did not find "إسورة", "خواتم" found nothing, and "سبيكة 10" did not find "سبيكة ١٠".

**Fix:** new file `lib/catalog/search.ts`, used by `lib/api/mock.ts`.
- Arabic spelling is normalized before comparing (أ/إ/آ → ا, ة → ه, ى/ئ → ي, ؤ → و, diacritics removed, ١٢٣ → 123).
- It searches the name, description, SKU, category, collection, karat ("عيار 21") and metal ("ذهب ابيض").
- Several words must all match ("خاتم زمرد"). "ال" at the start is optional.
- English matches from the start of a word, so "ring" no longer shows earrings.
- When the real API is connected, the dashboard should apply the same rules on its side.

---

## New: the website look is controlled from the dashboard

**What:** the dashboard's new **Theme & design** section (for the new "Website designer" role) now controls the
storefront: store name, logo, icons, 16 colours, fonts for Arabic and English, text size, heading weight,
line spacing, page width, corner roundness, sticky header, product card style, image shape, products per row,
and every fixed text on the site.

**How:**
- `lib/site-theme.ts` reads the published theme (`api.getTheme()`), checks every value and fills gaps from `config/clients/demo.ts`.
- `lib/theme.ts` turns it into CSS variables; `app/globals.css` uses them.
- `lib/fonts.ts` now declares 7 Arabic and 6 English fonts (only the chosen ones load, `preload: false`).
- Header and footer take the name/logo from the theme; `i18n/get-dictionary.ts` applies text changes.
- Product grids use the `product-grid` class and product images the `product-image` class (products per row and image shape come from the theme).
- In sample-data mode, set `DASHBOARD_URL` to read the theme from the dashboard on your computer.
- With the real API, the theme comes from `/storefront/theme` and refreshes instantly with the tag `theme`.
