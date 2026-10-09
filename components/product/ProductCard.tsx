/**
 * PRODUCT CARD — one product in a grid (image, name, karat, weight, price).
 * Used on the homepage product rows and the products page.
 *
 * Where to edit:
 *   - Show/hide karat + weight line -> dashboard → Theme & design → Layout (CSS class "product-card-details")
 *   - Show/hide weight only         -> dashboard → Settings → Store details → Website options (default: config/clients/demo.ts → features)
 *   - "New" / "Out of stock" labels -> i18n/dictionaries/*.json -> "product"
 *   - Price calculation             -> lib/pricing.ts
 *   - Special offer price + badge   -> lib/offers.ts (offers are created in the dashboard → Gold prices & coupons)
 *   - Image shape (square/portrait) -> dashboard → Theme & design → Layout (CSS class "product-image")
 *   - Zoom on hover                 -> "group-hover:scale-105" below (remove to disable)
 */
import Image from "next/image";
import Link from "next/link";
import type { GoldPrice, Locale, Product } from "@/types";
import type { Dictionary } from "@/i18n/get-dictionary";
import { Badge } from "@/components/ui/badge";
import { clientConfig } from "@/config/clients";
import { getSiteOptions } from "@/lib/store-contact";
import { localePath } from "@/i18n/config";
import { fill, formatPrice, formatWeight, t } from "@/lib/format";
import { calculatePrice } from "@/lib/pricing";
import { getActiveOffers, offerFor } from "@/lib/offers";

interface Props {
  product: Product;
  goldPrices: GoldPrice[];
  locale: Locale;
  dict: Dictionary;
}

export async function ProductCard({ product, goldPrices, locale, dict }: Props) {
  const [{ showWeight }, offers] = await Promise.all([getSiteOptions(), getActiveOffers()]);
  // Lowest price among the sizes — after a special offer when one applies (dashboard → Gold prices & coupons → Special offer)
  const cheapest = product.variants
    .map((v) => {
      const full = calculatePrice(product, v, goldPrices);
      const offer = offerFor(product.id, full, offers);
      return { price: offer ? offer.total : full.total, original: full.total, offer };
    })
    .sort((a, b) => a.price - b.price)[0];
  const price = cheapest?.price ?? 0;
  const offer = cheapest?.offer ?? null;
  const minWeight = Math.min(...product.variants.map((v) => v.weightGrams));
  const inStock = product.variants.some((v) => v.stockQty > 0);
  const image = product.images[0];

  return (
    <Link href={localePath(locale, `/products/${product.slug}`)} className="group block">
      <div className="product-image relative overflow-hidden rounded-lg bg-muted">
        {image && (
          <Image
            src={image.url}
            alt={t(product.name, locale)}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        )}
        <div className="absolute start-2 top-2 flex gap-1">
          {/* Special offer badge: "-10%" (or the words "Special offer" for very small discounts) */}
          {offer && <Badge className="bg-destructive text-white">{offer.percent >= 1 ? <span dir="ltr">-{offer.percent}%</span> : dict.product.offer}</Badge>}
          {product.isNew && <Badge>{dict.product.new}</Badge>}
          {!inStock && <Badge variant="secondary">{dict.product.outOfStock}</Badge>}
        </div>
      </div>

      <div className="mt-3 space-y-1">
        <h3 className="line-clamp-1 font-medium">{t(product.name, locale)}</h3>
        {/* Hidden by CSS when the theme's product card is "minimal" */}
        <p className="product-card-details text-sm text-muted-foreground">
          {fill(dict.gold.karatLabel, { karat: product.karat })}
          {showWeight && (
            <> · {formatWeight(minWeight, locale)} {dict.product.grams}</>
          )}
        </p>
        <p className="flex flex-wrap items-baseline gap-x-2 font-semibold text-primary">
          {formatPrice(price, clientConfig.currency, locale)}
          {/* Old price crossed out when the product is on a special offer */}
          {offer && <s className="text-sm font-normal text-muted-foreground">{formatPrice(cheapest.original, clientConfig.currency, locale)}</s>}
        </p>
      </div>
    </Link>
  );
}
