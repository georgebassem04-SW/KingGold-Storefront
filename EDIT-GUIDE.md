# Where to edit what

A quick map of what to open when you want to change something by hand. Every code file also starts with a comment explaining what it does and where to edit.

JSON files (dictionaries and mock data) can't contain comments, so they are explained here.

## Look and branding

| I want to change… | Open this file | What to change |
|---|---|---|
| Store name / tagline | `config/clients/demo.ts` | `name`, `tagline` |
| Logo | `public/clients/demo/` + `config/clients/demo.ts` | Put the image in the folder, then set `branding.logo` |
| Any colour (buttons, header, footer…) | `config/clients/demo.ts` | `theme.colors` (each line has a comment) |
| Fonts | `config/clients/demo.ts` | `theme.fonts` (options are listed in `lib/fonts.ts`) |
| Roundness of buttons/cards | `config/clients/demo.ts` | `theme.radius` |
| Products per row | `config/clients/demo.ts` | `layout.gridColumns` (3 or 4) |
| Show/hide weight (cards, product page, cart) | dashboard → Settings → Store details → Website options | (default: `features.showWeight`) |
| Show/hide gold prices block | dashboard → Settings → Store details → Website options | (default: `features.showGoldPrices`) |
| Order without an account on/off | dashboard → Settings → Store details → Website options | (default: `features.guestCheckout`) |
| Currency / VAT | `config/clients/demo.ts` | `currency`, `vatPercent` |
| Email, phone, address, social links | dashboard → Settings → Store details (default: `config/clients/demo.ts`) | `contact`, `social` |
| Default language | `config/clients/demo.ts` | `defaultLocale` |

## Text

| I want to change… | Open this file |
|---|---|
| Menu words, button labels, page titles, footer text | `i18n/dictionaries/ar.json` **and** `i18n/dictionaries/en.json` |

The dictionary files are grouped: `nav` (header menu), `footer`, `product` (card and product labels), `gold` (gold price strip), `pages` (page titles), `cart`, `common`. Always change the same key in both files. If a key is missing from one file, that language will break.

## Header and footer structure

| I want to… | Open this file |
|---|---|
| Add/remove a header menu link | `components/layout/Header.tsx` → the `links` list |
| Change header height | `components/layout/Header.tsx` → `h-20` |
| Add/remove footer links | `components/layout/Footer.tsx` → column 2 |

## Homepage

| I want to… | Open this file |
|---|---|
| Reorder, hide or edit homepage blocks | the dashboard → **Homepage** (with `DASHBOARD_URL` set); without the dashboard: `mock-data/home.json` |
| Slider speed, height, phone picture | `components/sections/HeroSlider.tsx` → `SLIDE_SECONDS` |
| Slider buttons ("Shop now" + a second one, e.g. "Design your piece" → /pages/customize) | dashboard → Homepage → Main slider → **Button** / **Second button**; look: `HeroSlider.tsx` |
| Change how a block looks | `components/sections/<Block>Section.tsx` |
| Add a new type of block | `types/cms.ts` → new component in `components/sections/` → register it in `SectionRenderer.tsx` |

**`mock-data/home.json`** is a list of blocks. Each block has:

- `type`: which block it is (`hero`, `gold_prices`, `categories`, `featured_products`, `promotion`, `brands`, `video`, `banner`)
- `isActive`: `true` shows the block, `false` hides it
- `sortOrder`: its position; 1 is at the top
- `data`: its content. Every text is written as `{ "ar": "...", "en": "..." }`

With `DASHBOARD_URL` set and the dashboard running, the homepage comes from the dashboard → Homepage, and its
**Preview** button opens `/ar?preview=…` here, showing the unpublished draft with a notice bar (only with a valid link).
An offer with an end date (`endsAt`) hides itself after that date. Buttons with a full address (`https://…`) open that address.

## About Us and other content pages

The content comes from the dashboard page editor. In mock mode it comes from `mock-data/pages/<slug>.json`.

| I want to… | Open this file |
|---|---|
| Change About Us text, images, numbers, history, branches shown | `mock-data/pages/about.json` |
| Hide or reorder a block on the page | same file: `isActive`, `sortOrder` |
| Edit branch address / hours / phone / map | dashboard → Settings → Branches (without the dashboard: `mock-data/branches.json`) |
| Change how a block looks | `components/sections/<Name>Section.tsx` |
| Add a new custom page (e.g. bridal consultations) | add `mock-data/pages/<slug>.json`, register it in `lib/api/mock.ts`; it appears at `/ar/pages/<slug>` |
| Branch button labels | `i18n/dictionaries/*.json` → `branches` |

The blocks available for pages are `page_hero`, `image_text`, `stats`, `features`, `timeline`, `rich_text`, `branches`, `cta`, `contact`, `faq` and `custom_order` (the "Design your piece" form). All the homepage blocks work on pages too.

Texts marked HTML (`body`) come from the dashboard's text editor. They are cleaned before display, so scripts and embeds are removed.

To hide a page, set `"status": "draft"` in its JSON. Visitors will then get a 404.

## Contact Us page

| I want to… | Open this file |
|---|---|
| Change the page title, subtitle, form title, subject list, success message | `mock-data/pages/contact.json` |
| Show/hide the contact card or the branch dropdown | same file: `showContactInfo`, `showBranchSelect` |
| Phone, WhatsApp, email, address, customer-service hours, social links | dashboard → Settings → Store details (default: `config/clients/demo.ts` → `contact`, `social`; merged in `lib/store-contact.ts`) |
| Form labels and error messages (AR/EN) | `i18n/dictionaries/*.json` → `contact` |
| Form rules (required fields, lengths, phone format) | `lib/validation/contact.ts` |
| Add a field to the form | `lib/validation/contact.ts` first, then `components/sections/ContactForm.tsx` |
| Where messages are sent | `app/api/contact/route.ts` → `lib/api/http.ts` (`sendContactMessage`) |

In mock mode, sent messages show up in the terminal where `npm run dev` is running.

## Product details page and cart

| I want to… | Open this file |
|---|---|
| Change the page layout (order of gallery, info, specs, related) | `app/[locale]/products/[slug]/page.tsx` |
| Change the photo gallery | `components/product/ProductGallery.tsx` |
| Dark mode: on / off, first view, dark colours | dashboard → Theme & design → Dark mode (saved in `theme.darkMode`) · the button: `components/layout/ModeToggle.tsx` (+ `lib/site-mode.ts`) · the colours as CSS: `lib/theme.ts` |
| Show / hide parts of the product page, photo side, main button | dashboard → Product page (saved in `theme.productPage`, defaults: `lib/theme-chrome.ts`) |
| Change price, size buttons, quantity, Add to cart, Buy now, WhatsApp button, price breakdown | `components/product/ProductPurchase.tsx` |
| Change the specifications table | `components/product/ProductSpecs.tsx` |
| Number of "You may also like" products | `RELATED_COUNT` in the product page |
| Product page texts (AR/EN), metal and stone names | `i18n/dictionaries/*.json` → `product` |
| Cart page layout | `components/cart/CartView.tsx` |
| Cart texts | `i18n/dictionaries/*.json` → `cart` |
| How the cart stores items (limits, totals) | `stores/cart-store.ts` |

Each size of a product is a separate line in the cart, because each size is a different ERP item with its own weight and price. Customers can't add more pieces than are in stock (`stockQty`), unless the size is `made_to_order`.

## Checkout and order success

| I want to… | Open this file |
|---|---|
| Delivery areas, fees, free-delivery limits, delivery times | `mock-data/checkout-options.json` → `shippingZones` |
| Payment methods (on/off, text, max order for cash, delivery vs pickup) | same file → `paymentMethods` |
| Bank transfer details shown after the order | same file → `paymentMethods` → `bank` → `instructions` |
| VAT (percent, and whether it's on the whole order or only the making charge) | same file → `vatPercent`, `vatBase` |
| Minimum order, price-lock minutes | same file → `minOrderTotal`, `priceLockMinutes` |
| Discount codes (mock) | `mock-data/coupons.json` |
| Allow store pickup / ordering without an account | `config/clients/demo.ts` → `features` |
| Checkout form fields and layout | `components/checkout/CheckoutForm.tsx` |
| Order summary column (totals, coupon, button) | `components/checkout/OrderSummary.tsx` |
| Required fields and rules | `lib/validation/checkout.ts` |
| Checkout texts / error messages | `i18n/dictionaries/*.json` → `checkout` |
| Order success page | `app/[locale]/order-success/page.tsx`, texts in `orderSuccess` |
| How the mock calculates totals | `lib/checkout/quote.ts` (the real dashboard does this itself) |

The total is always calculated on the server with today's gold rate, never in the browser. If the rate changes while the customer is checking out, the order is stopped and the new total is shown so they can confirm it.

When the website reads the dashboard (`DASHBOARD_URL`), each order lowers the stock in the dashboard and the website shows the new stock at once; cancelling or returning the order in the dashboard puts the pieces back. Without the dashboard (mock only), orders lower the stock in memory until `npm run dev` stops.

## Order confirmation email

After a successful checkout, the customer gets a confirmation email in the language they ordered in, if they entered an email address. The store team can get a short copy too.

| I want to… | Open this file |
|---|---|
| Choose how emails are sent (preview files / SMTP / Resend) | `.env.local` → `EMAIL_PROVIDER` (see `.env.example`) |
| Sender name and address | `.env.local` → `EMAIL_FROM` |
| Send a copy of every order to the store team | dashboard → Settings → Store details → "Email for new-order alerts" (fallback: `.env.local` → `ORDERS_NOTIFY_EMAIL`) |
| Turn off emails (if the dashboard sends them instead) | `.env.local` → `SEND_ORDER_EMAILS=false` |
| Email texts (AR/EN) | `i18n/dictionaries/*.json` → `emails.orderConfirmation` |
| Email design | `lib/email/templates/order-confirmation.ts` |
| Who receives what | `lib/email/order-emails.ts` |
| Resend a confirmation from the dashboard | `POST /api/email/order-confirmation` (`app/api/email/order-confirmation/route.ts`) |

In development (`EMAIL_PROVIDER=console`), nothing is sent. Each email is saved as an HTML file in the `.email-previews` folder so you can open it in a browser.

## Customer accounts (sign up, log in, Google, profile, addresses, orders)

| I want to… | Open this file |
|---|---|
| Log in / sign up pages | `app/[locale]/login/page.tsx`, `app/[locale]/register/page.tsx` (forms in `components/auth/`) |
| Account menu (Overview, My orders, Addresses, Account details, Log out) | `components/account/AccountNav.tsx` |
| Account overview page | `app/[locale]/account/page.tsx` |
| Edit profile / change password | `components/account/ProfileForm.tsx`, `PasswordForm.tsx` |
| Saved addresses | `components/account/AddressBook.tsx` |
| Order history and one order | `app/[locale]/account/orders/page.tsx`, `orders/[id]/page.tsx` |
| Order status names and colours | `i18n/dictionaries/*.json` → `orderStatus`, `components/account/OrderStatusBadge.tsx` |
| Account and login texts (AR/EN) | `i18n/dictionaries/*.json` → `auth`, `account` |
| Password and field rules | `lib/validation/account.ts` |
| How long a login lasts (30 days) | `lib/auth/session.ts` → `SESSION_DAYS` |
| Google sign-in setup | `lib/auth/google.ts` (instructions at the top) + `.env.local` |

Settings in `.env.local`:

- **`AUTH_SECRET`** — required on the live site. It's a long random text that protects the login cookie. Generate one with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
- **`GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`** — from Google Cloud Console → Credentials → OAuth client ID (Web). Add `<site>/api/auth/google/callback` as an Authorized redirect URI.

When a customer is logged in, checkout fills in their name, mobile, email and default address. Their orders appear under "My orders", and a new address can be saved to their account while ordering.

In mock mode, accounts, addresses and orders are saved in `.mock-db/db.json`, so they survive restarts. Delete that folder to start fresh.

## Categories, filters, sorting, search

| I want to… | Open this file |
|---|---|
| Categories page (all categories) | `app/[locale]/categories/page.tsx` |
| One category's shop page (banner + its products) | `app/[locale]/categories/[slug]/page.tsx` |
| Category name, image, banner, description, order | `mock-data/categories.json` (later: the dashboard) |
| The shop view (sidebar, results, chips, grid, pages) | `components/catalog/ProductListing.tsx` |
| Filter controls (category, price, karat, metal, weight, collection, in stock) | `components/catalog/FilterPanel.tsx` |
| Sort options | `components/catalog/SortSelect.tsx` + `SORTS` in `lib/catalog/filters.ts` |
| Products per page | `PAGE_SIZE` in `lib/catalog/filters.ts` |
| Karats / metals offered as filters | `KARATS` / `METALS` in `lib/catalog/filters.ts` |
| Filter texts (AR/EN) | `i18n/dictionaries/*.json` → `catalog` |
| How search matches (Arabic spelling, fields searched, extra words) | `lib/catalog/search.ts` (`SYNONYMS` for words like "خواتم" → "خاتم") |

Filters are kept in the page address (for example `/ar/products?category=rings&karat=21&max=30000&sort=price_asc`), so a filtered list can be shared or bookmarked, and the Back button works. Search goes to `/products?q=…`.

## Mobile (phones and tablets)

| I want to… | Open this file |
|---|---|
| The ☰ mobile menu (links, categories, account, language, phone/WhatsApp) | `components/layout/MobileMenu.tsx` |
| Header layout on phones vs desktop | `components/layout/Header.tsx` |
| Search bar under the header | `components/layout/HeaderSearch.tsx` |
| Filters panel on phones ("Filters" button) | `components/catalog/MobileFilters.tsx` |
| The slide-in panel itself | `components/ui/sheet.tsx` |

Tailwind size prefixes decide what shows at each screen size: no prefix = phones and up, `sm:` 640px+, `md:` 768px+, `lg:` 1024px+ (desktop header), `xl:` 1280px+.

## Products and prices (mock data)

| File | What's inside |
|---|---|
| `mock-data/products.json` | Products: name, description, karat, metal, making charge, stones, images, variants (size, weight, stock), `isFeatured`, `isNew` |
| `mock-data/categories.json` | Categories: name, image, order |
| `mock-data/brands.json` | Collections (only without the dashboard — with it: dashboard → Collections) |
| `mock-data/gold-prices.json` | Price per gram for each karat |

Price formula (`lib/pricing.ts`): **weight × gold price for the karat + making charge + stones**.

Product fields worth knowing:

- `pricingMode`: `"weight_based"` (calculated as above) or `"fixed"` (uses `fixedPrice` in each variant)
- `makingCharge.type`: `"per_gram"`, `"percent"` or `"fixed"`
- `variants[].stockQty`: 0 shows "Out of stock"
- `slug`: the product's URL, for example `/ar/products/classic-solitaire-ring`

## Pages

Every page is in `app/[locale]/<page-name>/page.tsx`. For example, the About page is `app/[locale]/about/page.tsx`. Placeholder pages say "STATUS: placeholder" at the top.

## Settings files

| File | Purpose |
|---|---|
| `.env.local` | Which client (`NEXT_PUBLIC_CLIENT_ID`), mock or real API (`NEXT_PUBLIC_DATA_SOURCE`), API URL, `REVALIDATE_SECRET` for instant updates. Copy it from `.env.example`. |
| `app/api/revalidate/route.ts` | The address the dashboard calls after Save so changes show instantly |
| `next.config.ts` | Allowed image domains (add the client's CDN here) |
| `config/clients/index.ts` | List of clients |

## Files you normally don't need to touch

`app/[locale]/layout.tsx`, `lib/theme.ts`, `lib/utils.ts`, `lib/api/mock.ts`, `i18n/get-dictionary.ts`, `proxy.ts`, `components/providers.tsx`, `components/ui/*`, `types/*` (only when adding new fields).

After any edit, the page reloads by itself while `npm run dev` is running. If you edit `.env.local`, stop and restart `npm run dev`.

## Theme from the dashboard (colours, fonts, logo, texts)

The look of the site is now set in the dashboard → **Theme & design**. `config/clients/demo.ts` is only the default
used before anything is published.

| I want to… | Open this file |
|---|---|
| See how the dashboard theme is read and checked | `lib/site-theme.ts` |
| Theme values → CSS variables | `lib/theme.ts` |
| Rules that use them (text size, headings, products per row, card style, sticky header) | `app/globals.css` → "3) PAGE-WIDE RULES" and "4) THEME SWITCHES" |
| Fonts the designer can pick | `lib/fonts.ts` |
| Text changes from the dashboard | applied in `i18n/get-dictionary.ts` |
| Logo size in the top bar / footer (square or wide frame, chosen when cropping in the dashboard) | `components/layout/Header.tsx`, `Footer.tsx` (`brand.logoShape`) |
| Header and footer options from the dashboard (pages "Header" / "Footer") | read + checked in `lib/theme-chrome.ts`, used in `components/layout/Header.tsx` / `Footer.tsx` |
| Icons the client can pick for the header / footer | `lib/icon-library.ts` (same file in the dashboard) |
| See-through header over the first picture | CSS in `app/globals.css` → "5) HEADER RULES"; blocks marked `data-overlay-hero` (`HeroSlider.tsx`, `PageHeroSection.tsx`); scroll state `components/layout/HeaderScroll.tsx` |
| What "small / medium / large", "compact / tall" mean in pixels | the maps at the top of `Header.tsx` / `Footer.tsx` |
| Link to the dashboard while developing | `.env.local` → `DASHBOARD_URL=http://localhost:3002` |

## Products and categories from the dashboard (development)

With `DASHBOARD_URL` set and the dashboard running, the products and categories come from the dashboard
(Products / Categories sections) instead of `mock-data/products.json` and `mock-data/categories.json`.
Hidden products and hidden categories (with their products) disappear from the site. Where it happens:
`lib/api/mock.ts` → `catalog()`. With the real API nothing changes here — the API sends the catalog.

## "Design your piece" page (custom orders)

`/ar/pages/customize` · `/en/pages/customize` — a normal site page built in the dashboard (**Site pages → صمّم قطعتك**), so everything
on it is edited there: title banner, the **"Design your piece" form** block (title, subtitle, "how it works" steps, success message,
show karat / budget), "Why us" features and the questions. The old address `/custom-order` sends visitors here.
Requests arrive in the dashboard → **Customization requests**. Linked from the homepage slider's second button and the footer (page menu = footer).

| I want to… | Open this file |
|---|---|
| Page content (texts, blocks, order) | dashboard → Site pages → the page (without the dashboard: `mock-data/pages/customize.json`) |
| How the form block looks | `components/sections/CustomOrderSection.tsx` |
| Field labels / errors (AR/EN) | `i18n/dictionaries/*.json` → `customOrder` |
| Piece types, karats, number / size of photos | `lib/validation/custom-request.ts` |
| The form (photos, fields) / photo shrinking | `components/custom/CustomOrderForm.tsx` → `PHOTO_MAX_SIDE`, `PHOTO_QUALITY` |
| Server checks + sending | `app/api/custom-requests/route.ts` → `lib/api` (`sendCustomRequest`) |

- The form block can be added to ANY page (Site pages → + Add section → "Design your piece" form).
- Photos are checked twice: in the browser and on the server (real JPG / PNG / WebP read from the file itself, max 5 MB each).
- Logged-in customers get their name, phone and email filled in, and the request is linked to their account.
- Test mode: saved in `.mock-db/db.json` + photos in `.mock-db/custom-photos/` (private — the dashboard shows them to staff only).
- Real backend: `POST /storefront/custom-requests` as a form: `data` (JSON) + `photos` (files).

## Site pages from the dashboard (About, Contact, FAQ, Terms, any new page)

| I want to… | Where |
|---|---|
| Change a page's content | Dashboard → Site pages (sample mode without the dashboard: `mock-data/pages/<slug>.json`) |
| Put a page in the top menu or footer | Dashboard → Site pages → the page → Page settings → "Show in" |
| Fixed menu links (Home, Products, Categories) | `components/layout/Header.tsx` → `links`, `components/layout/Footer.tsx` → column 2 |
| Pages with their own address (/about, /contact, /faq, /terms) | `lib/site-pages.ts` → `OWN_ROUTE_PAGES` (others open at `/pages/<slug>`) |
| Questions & answers block look | `components/sections/FaqSection.tsx` |
| "Draft preview" strip | `components/common/ContentPageView.tsx` (text: dictionaries → `pages.previewNotice`) |

## Gold prices, coupons and price lock from the dashboard (development)

With `DASHBOARD_URL` set and the dashboard running, gold prices, discount codes and the checkout price-lock rules
come from the dashboard → Gold prices & coupons, and delivery areas, payment methods, VAT, minimum order and
branch pickup come from the dashboard → Shipping & payment (otherwise `mock-data/gold-prices.json`, `coupons.json`, `checkout-options.json`).

| I want to… | Where |
|---|---|
| Coupon checks (dates, uses, minimum, free delivery, max discount) | `lib/checkout/quote.ts` → `couponProblem` + "3a) Coupon" |
| Messages when a code doesn't work | dictionaries → `checkout.couponReasons` |
| Special offers (dashboard → Gold prices & coupons → "Special offer"): how the offer price is worked out | `lib/checkout/offer-math.ts` → `offerFor` (used by cards, product page and checkout, so they always agree) |
| Offer price, crossed-out old price and "-10%" badge on a card / product page | `components/product/ProductCard.tsx`, `components/product/ProductPurchase.tsx` (texts: `product.offer`, `product.offerDiscount`) |
| Code limited to chosen products, no stacking on offer items | `lib/checkout/quote.ts` → "3a) Coupon" |
| Where the offers come from | `lib/offers.ts` → `api.getOffers()` (real API: `GET /storefront/offers`, tag `offers`) |
| Which filter sections / categories show on product pages | dashboard → Product filter (saved in `theme.filters`; defaults in `lib/theme-chrome.ts` → `DEFAULT_FILTERS`) |
| How one filter section looks | `components/catalog/FilterPanel.tsx` → `blocks` |
| Shape of the homepage slider (phones 3:4, computers 16:7) | `components/sections/HeroSlider.tsx` — keep the same as the dashboard's `config/image-frames.ts` (`heroSlide`, `heroSlideMobile`) |
| How the open page's link looks in the top menu (colour / line / bold / filled shape) | chosen in the dashboard → Header → Menu style; drawn in `app/globals.css` → "ACTIVE LINK" |
| Which link counts as "open" | `components/layout/NavLink.tsx` → `active` |
| Hero words / buttons positions and colours | chosen in the dashboard (slide or page title → "Layout & colours"); classes in `components/sections/hero-layout.ts`, drawn by `HeroSlider.tsx` and `PageHeroSection.tsx` |
| Title sizes of heroes | `components/sections/hero-layout.ts` → `TITLE_SIZE` |
| Heights of the page title banner | `components/sections/PageHeroSection.tsx` → `HEIGHT` |
| Blocks at the top of All products / Categories | `components/common/ShopPageTop.tsx` (pages `shop-products`, `shop-categories`: `lib/site-pages.ts` → `SHOP_PAGES`) |
| "Special offers" filter (`?offer=1`) | `lib/catalog/filters.ts` (`offer`), `lib/api/mock.ts` → `applyFilters` (`onOffer`), texts `catalog.offers` / `catalog.offersOnly` |
| Order to a switched-off area / pickup turned off | `lib/checkout/quote.ts` → blockers `zone_unavailable`, `pickup_unavailable` (texts: `checkout.zoneUnavailable`, `checkout.pickupUnavailable`) |
| What happens when the gold price moves during checkout | `lib/api/mock.ts` → `placeOrder` (tolerance from `priceChangeTolerancePct`) |

