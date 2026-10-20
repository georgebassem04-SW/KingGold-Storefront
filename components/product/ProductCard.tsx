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
 *   - Centred name/price, second picture on hover, "Sold out" shade, "From" before the price, frame, name size, "New" label
 *                                   -> dashboard → Theme & design → Layout → Product cards (defaults: lib/theme-chrome.ts → DEFAULT_PRODUCT_CARD)
 */
import Image from "next/image";
import Link from "next/link";
import type { GoldPrice, Locale, Product } from "@/types";
import type { Dictionary } from "@/i18n/get-dictionary";
import { Badge } from "@/components/ui/badge";
import { clientConfig } from "@/config/clients";
import { getSiteOptions } from "@/lib/store-contact";
import { localePath } from "@/i18n/config";
import { fill, formatCardPrice, formatWeight, t } from "@/lib/format";
import { calculatePrice } from "@/lib/pricing";
import { getActiveOffers, offerFor } from "@/lib/offers";
import { getSiteTheme } from "@/lib/site-theme";
import { cn } from "@/lib/utils";

interface Props {
  product: Product;
  goldPrices: GoldPrice[];
  locale: Locale;
  dict: Dictionary;
}

const NAME_SIZE = { sm: "text-sm", md: "text-base", lg: "text-lg md:text-xl" } as const;
const PRICE_SIZE = { sm: "text-sm", md: "text-base", lg: "text-lg" } as const;
/* "Sold out" label look (Product cards → Sold out look) */
const SOLD_SIZE = { sm: "px-3 py-1 text-xs", md: "px-4 py-2 text-sm", lg: "px-6 py-3 text-base" } as const;
const SOLD_SHAPE = { square: "rounded-none", rounded: "rounded-md", pill: "rounded-full" } as const;
const SOLD_POSITION = { center: "items-center", top: "items-start pt-4", bottom: "items-end pb-4" } as const;

export async function ProductCard({ product, goldPrices, locale, dict }: Props) {
  const [{ showWeight }, offers, theme] = await Promise.all([getSiteOptions(), getActiveOffers(), getSiteTheme()]);
  const card = theme.layout.card;
  // Every size's price — after a special offer when one applies (dashboard → Gold prices & coupons → Special offer)
  const prices = product.variants
    .map((v) => {
      const full = calculatePrice(product, v, goldPrices);
      const offer = offerFor(product.id, full, offers);
      return { price: offer ? offer.total : full.total, original: full.total, offer };
    })
    .sort((a, b) => a.price - b.price);
  const cheapest = prices[0];
  const price = cheapest?.price ?? 0;
  const offer = cheapest?.offer ?? null;
  // "From" only when the sizes really cost different amounts
  const from = card.fromPrice && prices.length > 1 && prices[prices.length - 1].price !== price;
  const minWeight = Math.min(...product.variants.map((v) => v.weightGrams));
  const inStock = product.variants.some((v) => v.stockQty > 0);
  const image = product.images[0];
  const second = card.hoverImage ? product.images[1] : undefined;
  const center = card.align === "center";
  const name = t(product.name, locale);
  // Price look (Product cards → Price): own sign ("LE") and piastres
  const money = (n: number) => formatCardPrice(n, clientConfig.currency, locale, t(card.priceSymbol, locale), card.priceDecimals);
  const hoverLabel = t(card.hoverButton.label, locale) || dict.product.chooseOption;
  const so = card.soldOutLook;
  const soldOverlay = !inStock && card.soldOut === "overlay";

  return (
    <Link href={localePath(locale, `/products/${product.slug}`)} className={cn("group block", center && "text-center")}>
      <div className={cn("product-image relative overflow-hidden rounded-lg bg-muted", card.frame && "border border-foreground/10")} style={card.imageBackground ? { background: card.imageBackground } : undefined}>
        {image && (
          <Image
            src={image.url}
            alt={name}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className={cn("object-cover transition-all duration-500", second ? "group-hover:opacity-0" : "group-hover:scale-105", soldOverlay && so.grayscale && "grayscale")}
          />
        )}
        {/* Second picture, shown while the mouse is over the card */}
        {second && <Image src={second.url} alt="" fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100" />}

        {/* Sold out as a shade over the picture with the words in the middle */}
        {soldOverlay && (
          <div
            className={cn("absolute inset-0 flex justify-center", SOLD_POSITION[so.position])}
            style={{ background: so.strength ? `color-mix(in srgb, ${so.shade || "var(--primary)"} ${so.strength}%, transparent)` : undefined }}
          >
            <span
              className={cn("font-medium", SOLD_SIZE[so.size], SOLD_SHAPE[so.shape], so.border && "border")}
              style={{ background: so.labelBackground || "#FFFFFF", color: so.labelText || "#000000", borderColor: "color-mix(in srgb, currentColor 30%, transparent)" }}
            >
              {t(so.label, locale) || dict.product.soldOut}
            </span>
          </div>
        )}

        {/* "Choose option" bar sliding up over the bottom of the picture on mouse-over (computers) */}
        {card.hoverButton.show && (
          <span className="absolute inset-x-0 bottom-0 hidden translate-y-full items-center justify-center bg-primary py-3 text-sm font-semibold text-primary-foreground transition-transform duration-300 group-hover:translate-y-0 group-focus-visible:translate-y-0 lg:flex">
            {hoverLabel}
          </span>
        )}

        <div className="absolute start-2 top-2 flex gap-1">
          {/* Special offer badge: "-10%" (or the words "Special offer" for very small discounts) */}
          {offer && <Badge className="bg-destructive text-white">{offer.percent >= 1 ? <span dir="ltr">-{offer.percent}%</span> : dict.product.offer}</Badge>}
          {card.newBadge && product.isNew && <Badge>{dict.product.new}</Badge>}
          {!inStock && card.soldOut === "badge" && <Badge variant="secondary">{dict.product.outOfStock}</Badge>}
        </div>
      </div>

      <div className="mt-3 space-y-1">
        <h3 className={cn("line-clamp-2", center ? "font-normal" : "line-clamp-1 font-medium", NAME_SIZE[card.nameSize])}>{name}</h3>
        {/* Hidden by CSS when the theme's product card is "minimal" */}
        <p className="product-card-details text-sm text-muted-foreground">
          {fill(dict.gold.karatLabel, { karat: product.karat })}
          {showWeight && (
            <> · {formatWeight(minWeight, locale)} {dict.product.grams}</>
          )}
        </p>
        <p className={cn("flex flex-wrap items-baseline gap-x-2 text-primary", center ? "justify-center" : "font-semibold", PRICE_SIZE[card.priceSize])}>
          {from && <span>{dict.product.from}</span>}
          <span dir="auto">{money(price)}</span>
          {/* Old price crossed out when the product is on a special offer */}
          {offer && <s className="text-sm font-normal text-muted-foreground">{money(cheapest.original)}</s>}
        </p>
      </div>
    </Link>
  );
}
