/**
 * PAGE: /[locale]/products/<slug> — PRODUCT DETAILS
 * ------------------------------------------------------------------
 * Opens when a customer clicks any product card. Everything comes from the dashboard:
 *   GET /storefront/products/<slug>   (mock: mock-data/products.json)
 *   GET /storefront/gold-prices       (today's rate, used for the price)
 *   GET /storefront/categories        (breadcrumb + specs)
 *   GET /storefront/products?categoryId=… (related products)
 * If the product doesn't exist or is unpublished, the API returns nothing -> 404 page.
 *
 * Layout:
 *   breadcrumb
 *   [ gallery ]  [ name, price, karat/weight/stock, size picker, qty, ADD TO CART, WhatsApp, price breakdown ]
 *   description + specifications
 *   "You may also like" (same category)
 *
 * Where to edit:
 *   - Product data               -> mock-data/products.json (later: the dashboard)
 *   - Gallery                    -> components/product/ProductGallery.tsx
 *   - Price / size / add to cart -> components/product/ProductPurchase.tsx
 *   - Specs table                -> components/product/ProductSpecs.tsx
 *   - Price formula              -> lib/pricing.ts
 *   - Number of related products -> RELATED_COUNT below
 */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Locale } from "@/types";
import { api } from "@/lib/api";
import { clientConfig } from "@/config/clients";
import { getSiteOptions, getStoreContact } from "@/lib/store-contact";
import { getDictionary } from "@/i18n/get-dictionary";
import { localePath } from "@/i18n/config";
import { calculatePrice } from "@/lib/pricing";
import { getActiveOffers, offerFor } from "@/lib/offers";
import { t } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductPurchase, type PurchaseVariant } from "@/components/product/ProductPurchase";
import { ProductSpecs } from "@/components/product/ProductSpecs";
import { ProductCard } from "@/components/product/ProductCard";
import { getSiteTheme } from "@/lib/site-theme";
import { cn } from "@/lib/utils";
import { SectionTitle } from "@/components/common/SectionTitle";


// Browser title, Google description and the image shown when the link is shared (WhatsApp, Facebook)
export async function generateMetadata({ params }: PageProps<"/[locale]/products/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  const product = await api.getProductBySlug(slug);
  if (!product) return {};
  const l = locale as Locale;
  return {
    title: t(product.name, l),
    description: t(product.description, l).slice(0, 160),
    openGraph: product.images[0] ? { images: [product.images[0].url] } : undefined,
  };
}

export default async function ProductDetailsPage({ params }: PageProps<"/[locale]/products/[slug]">) {
  const { locale: rawLocale, slug } = await params;
  const locale = rawLocale as Locale;

  const product = await api.getProductBySlug(slug);
  if (!product) notFound();

  // Load everything else in parallel
  // What shows on this page, photo side, main button: dashboard → Product page
  const { productPage: view } = await getSiteTheme();
  const show = view.show;
  const RELATED_COUNT = view.relatedCount;

  const [dict, goldPrices, categories, relatedPage, { contact }, site, offers] = await Promise.all([
    getDictionary(locale),
    api.getGoldPrices(),
    api.getCategories(),
    api.getProducts({ categoryId: product.categoryId, pageSize: RELATED_COUNT + 1 }),
    getStoreContact(), // WhatsApp number: dashboard → Settings → Store details
    getSiteOptions(), // show weight: dashboard → Settings → Store details → Website options
    getActiveOffers(), // special offers: dashboard → Gold prices & coupons
  ]);

  const category = categories.find((c) => c.id === product.categoryId);
  const related = relatedPage.items.filter((p) => p.id !== product.id).slice(0, RELATED_COUNT);
  const goldRate = goldPrices.find((g) => g.karat === product.karat)?.pricePerGram;
  const name = t(product.name, locale);
  const p = (path: string) => localePath(locale, path);

  // Price every size on the server, so the browser gets ready numbers
  const variants: PurchaseVariant[] = product.variants.map((v) => ({
    id: v.id,
    sku: v.sku,
    size: v.size,
    weightGrams: v.weightGrams,
    stockQty: v.stockQty,
    stockStatus: v.stockStatus,
    price: calculatePrice(product, v, goldPrices),
  })).map((v) => {
    // Special offer on this product → new price for each size
    const offer = offerFor(product.id, v.price, offers);
    return offer ? { ...v, offer: { discount: offer.discount, total: offer.total, percent: offer.percent, label: t(offer.label, locale) } } : v;
  });

  // Structured data so Google can show price and stock in search results
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    sku: product.sku,
    image: product.images.map((i) => i.url),
    description: t(product.description, locale),
    offers: variants.map((v) => ({
      "@type": "Offer",
      sku: v.sku,
      price: v.offer?.total ?? v.price.total,
      priceCurrency: clientConfig.currency,
      availability: v.stockQty > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    })),
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* ===== BREADCRUMB: Home / Products / Category / Product ===== */}
      <nav aria-label="breadcrumb" className="mb-6 flex flex-wrap gap-2 text-sm text-muted-foreground">
        <Link href={p("/")} className="hover:text-primary">{dict.nav.home}</Link>
        <span>/</span>
        <Link href={p("/products")} className="hover:text-primary">{dict.nav.products}</Link>
        {category && (
          <>
            <span>/</span>
            <Link href={p(`/categories/${category.slug}`)} className="hover:text-primary">{t(category.name, locale)}</Link>
          </>
        )}
        <span>/</span>
        <span className="text-foreground">{name}</span>
      </nav>

      {/* ===== TOP: gallery + purchase panel ===== */}
      <div className="grid gap-10 lg:grid-cols-2">
        <ProductGallery
          images={product.images}
          alt={name}
          badges={product.isNew && show.newBadge ? <Badge>{dict.product.new}</Badge> : undefined}
        />

        {/* "Details first" (dashboard → Product page) puts this column before the photos on computers only */}
        <div className={cn(view.imageSide === "end" && "lg:order-first", view.align === "center" && "text-center", view.align === "end" && "text-end")}>
          <h1 className="text-3xl font-bold md:text-4xl">{name}</h1>
          {show.sku && (
            <p className="mt-2 text-sm text-muted-foreground">
              {dict.product.sku}: <span dir="ltr">{product.sku}</span>
            </p>
          )}
          <div className="my-6 border-t" />
          <ProductPurchase
            locale={locale}
            labels={dict.product}
            product={{
              id: product.id,
              slug: product.slug,
              sku: product.sku,
              name: product.name,
              karat: product.karat,
              imageUrl: product.images[0]?.url,
              isFixedPrice: product.pricingMode === "fixed",
            }}
            variants={variants}
            currency={clientConfig.currency}
            showWeight={site.showWeight}
            goldRatePerGram={goldRate}
            whatsapp={show.whatsapp ? contact.whatsapp : undefined}
            show={{ priceNote: show.priceNote, stock: show.stock, quantity: show.quantity, buyNow: show.buyNow, priceBreakdown: show.priceBreakdown }}
            look={view}
            cartHref={p("/cart")}
            checkoutHref={p("/checkout")}
          />
        </div>
      </div>

      {/* ===== DESCRIPTION + SPECIFICATIONS ===== */}
      {(show.description || show.specifications) && (
        <div className={cn("mt-16 grid gap-10", show.description && show.specifications && "lg:grid-cols-2")}>
          {show.description && (
            <section>
              <h2 className="mb-4 text-xl font-bold">{dict.product.description}</h2>
              <p className="leading-relaxed text-muted-foreground">{t(product.description, locale)}</p>
            </section>
          )}
          {show.specifications && (
            <section>
              <h2 className="mb-4 text-xl font-bold">{dict.product.specifications}</h2>
              <ProductSpecs product={product} category={category} locale={locale} labels={dict.product} showWeight={site.showWeight} />
            </section>
          )}
        </div>
      )}

      {/* ===== RELATED PRODUCTS ===== */}
      {show.related && related.length > 0 && (
        <section className="mt-20">
          <SectionTitle title={dict.product.related} href={category ? p(`/categories/${category.slug}`) : p("/products")} linkLabel={dict.product.viewAll} />
          <div className="product-grid">
            {related.map((r) => (
              <ProductCard key={r.id} product={r} goldPrices={goldPrices} locale={locale} dict={dict} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
