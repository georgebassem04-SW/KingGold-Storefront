/**
 * PRODUCT PURCHASE PANEL (runs in the browser)
 * ------------------------------------------------------------------
 * Size picker -> price + weight + stock for that size -> quantity -> "Add to cart".
 * Prices are calculated on the server (lib/pricing.ts) and passed in for every size,
 * so switching size updates the price instantly.
 *
 * Add to cart: saves the chosen size in the cart store (stores/cart-store.ts).
 * The header cart count updates immediately, and a confirmation with "View cart" appears.
 * Buy now: puts the chosen size and quantity in the cart, then opens the checkout page straight away
 * (anything already in the cart is paid for in the same order).
 *
 * Where to edit:
 *   - Texts (AR/EN)              -> i18n/dictionaries/*.json -> "product"
 *   - Show / hide parts               -> dashboard → Product page (prop `show`)
 *   - Buttons: order, colours, filled / outline, icon, size, corners, side by side, text position
 *                                     -> dashboard → Product page (prop `look`; colours: lib/theme-chrome.ts → productButtonCss)
 *   - Remove "Buy now" for good           -> delete the block marked BUY NOW below
 *   - Price size, "LE 96,065.00" look, choices as boxes, weight box, quantity line, icon after text
 *                                     -> dashboard → Product page → "Name, price & choices"
 *   - Hide weight                -> config/clients/demo.ts -> features.showWeight
 *   - WhatsApp number            -> config/clients/demo.ts -> contact.whatsapp
 */
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { CheckCircle2, Minus, Plus, ShoppingBag, Zap } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa6";
import type { Locale, LocalizedText, ProductButton, StockStatus, ThemeProductPage } from "@/types";
import { DEFAULT_PRODUCT_PAGE, productButtonCss } from "@/lib/theme-chrome";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { PriceBreakdown } from "@/lib/pricing";
import { useCartStore } from "@/stores/cart-store";
import { fill, formatCardPrice, formatPrice, formatWeight } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface PurchaseVariant {
  id: string;
  sku: string;
  size?: string;
  weightGrams: number;
  stockQty: number;
  stockStatus: StockStatus;
  price: PriceBreakdown;
  /** Special offer on this size (dashboard → Gold prices & coupons): what it takes off, the new price, its text */
  offer?: { discount: number; total: number; label: string; percent: number };
}

interface Props {
  locale: Locale;
  labels: Dictionary["product"];
  product: { id: string; slug: string; sku: string; name: LocalizedText; karat: number; imageUrl?: string; isFixedPrice: boolean };
  variants: PurchaseVariant[];
  currency: string;
  showWeight: boolean;
  goldRatePerGram?: number;
  whatsapp?: string;
  cartHref: string;
  /** Where "Buy now" goes (the checkout page) */
  checkoutHref: string;
  /** Parts that can be switched off in the dashboard → Product page (nothing passed = everything shown) */
  show?: { priceNote: boolean; stock: boolean; quantity: boolean; buyNow: boolean; priceBreakdown: boolean };
  /** Look and order of the buttons + text position (dashboard → Product page). Nothing passed = the original design */
  look?: Pick<
    ThemeProductPage,
    "buttons" | "buttonOrder" | "buttonsLayout" | "buttonSize" | "buttonShape" | "align" | "priceSize" | "optionsStyle" | "factsBox" | "quantityOwnRow" | "divider" | "iconEnd"
  >;
  /** Price look shared with the product cards ("LE" + piastres). Nothing passed = normal currency format */
  priceFormat?: { symbol: string; decimals: boolean };
}

/** Button height and text size (dashboard → Product page → Size) */
const SIZE = { sm: "h-10 px-4 text-sm", md: "h-11 px-5 text-sm", lg: "h-14 px-6 text-base" } as const;
/** Button corners (theme = the website's normal corners) */
const SHAPE = { theme: "rounded-md", square: "rounded-none", pill: "rounded-full" } as const;
/** Position of the rows (stock line, sizes): start = right in Arabic / left in English */
const JUSTIFY = { start: "justify-start", center: "justify-center", end: "justify-end" } as const;
const TEXT = { start: "text-start", center: "text-center", end: "text-end" } as const;

/** Price size (dashboard → Product page → Price size) */
const PRICE_SIZE = { md: "text-3xl font-bold", lg: "text-3xl font-semibold md:text-4xl", xl: "text-4xl font-semibold md:text-5xl" } as const;

const SHOW_ALL = { priceNote: true, stock: true, quantity: true, buyNow: true, priceBreakdown: true };

// A size can be bought when it has stock or is made to order
const canBuy = (v: PurchaseVariant) => v.stockQty > 0 || v.stockStatus === "made_to_order";

export function ProductPurchase({ locale, labels, product, variants, currency, showWeight, goldRatePerGram, whatsapp, cartHref, checkoutHref, show = SHOW_ALL, look = DEFAULT_PRODUCT_PAGE, priceFormat }: Props) {
  const router = useRouter();
  // Start on the first size that can be bought
  const [variantId, setVariantId] = useState(() => (variants.find(canBuy) ?? variants[0])?.id);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState<"added" | "max" | null>(null);

  const addToCart = useCartStore((s) => s.add);
  const inCart = useCartStore((s) => s.items.find((i) => i.variantId === variantId)?.quantity ?? 0);

  const variant = useMemo(() => variants.find((v) => v.id === variantId) ?? variants[0], [variants, variantId]);
  const price = (n: number) => formatPrice(n, currency, locale);
  // The big price: card look ("LE 96,065.00") when switched on in the dashboard
  const bigPrice = (n: number) => (priceFormat ? formatCardPrice(n, currency, locale, priceFormat.symbol, priceFormat.decimals) : price(n));
  const boxes = look.optionsStyle === "boxes";

  // Most pieces are limited by stock; made-to-order has no limit
  const maxQty = variant.stockStatus === "made_to_order" ? undefined : variant.stockQty;
  const remaining = maxQty === undefined ? Infinity : Math.max(0, maxQty - inCart);
  const showSizes = variants.length > 1 || (variants[0]?.size && variants[0].size !== "one");

  const stockLabel: Record<StockStatus, string> = {
    in_stock: labels.inStock,
    low_stock: labels.lowStock,
    out_of_stock: labels.outOfStock,
    made_to_order: labels.madeToOrder,
  };

  function selectVariant(id: string) {
    setVariantId(id);
    setQty(1);
    setAdded(null);
  }

  /** Puts the chosen size in the cart. false = nothing more of it can be added */
  function putInCart() {
    if (remaining <= 0) return false;
    addToCart({
      productId: product.id,
      variantId: variant.id,
      slug: product.slug,
      name: product.name,
      imageUrl: product.imageUrl,
      karat: product.karat,
      weightGrams: variant.weightGrams,
      size: variant.size && variant.size !== "one" ? variant.size : undefined,
      quantity: Math.min(qty, remaining),
      unitPrice: variant.offer?.total ?? variant.price.total,
      currency,
      maxQty,
    });
    return true;
  }

  function handleAdd() {
    if (!canBuy(variant)) return;
    if (!putInCart()) {
      setAdded("max");
      return;
    }
    setAdded("added");
    setQty(1);
  }

  /** BUY NOW: add it (when it is already in the cart at its limit, keep what is there) and go to checkout */
  function handleBuyNow() {
    if (!canBuy(variant)) return;
    putInCart();
    router.push(checkoutHref);
  }

  const waText = fill(labels.whatsappMessage, { name: product.name[locale], sku: variant.sku });

  /* ---------- buttons ---------- */
  const stacked = look.buttonsLayout === "stack";
  // The ones that show right now, in the dashboard's order
  const buttons = look.buttonOrder.filter((k) => (k === "cart" ? true : k === "buy" ? show.buyNow && canBuy(variant) : !!whatsapp));
  const base = cn("inline-flex items-center justify-center gap-2 border font-semibold transition-opacity hover:opacity-85 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0", SIZE[look.buttonSize], SHAPE[look.buttonShape], look.iconEnd && "flex-row-reverse");

  function renderButton(k: ProductButton, width: string) {
    const b = look.buttons[k];
    const style = productButtonCss(k, b);
    if (k === "whatsapp")
      return (
        <a key={k} className={cn(base, width)} style={style} href={`https://wa.me/${(whatsapp ?? "").replace(/\D/g, "")}?text=${encodeURIComponent(waText)}`} target="_blank" rel="noopener noreferrer">
          {/* Green logo on the plain (automatic outline) button; otherwise it takes the text colour */}
          {b.icon && <FaWhatsapp className={b.style === "outline" && !b.color && !b.textColor ? "text-emerald-600" : undefined} />}
          {labels.askWhatsapp}
        </a>
      );
    if (k === "buy")
      return (
        <button key={k} type="button" className={cn(base, width)} style={style} onClick={handleBuyNow}>
          {b.icon && <Zap />}
          {labels.buyNow}
        </button>
      );
    return (
      <button key={k} type="button" className={cn(base, width)} style={style} onClick={handleAdd} disabled={!canBuy(variant)}>
        {b.icon && <ShoppingBag />}
        {canBuy(variant) ? labels.addToCart : labels.outOfStock}
      </button>
    );
  }

  const quantity = (
    <div className={cn("flex shrink-0 items-center border", SHAPE[look.buttonShape])} aria-label={labels.quantity}>
      <button
        type="button"
        className="flex size-11 items-center justify-center disabled:opacity-40"
        onClick={() => setQty((q) => Math.max(1, q - 1))}
        disabled={qty <= 1}
        aria-label="-"
      >
        <Minus className="size-4" />
      </button>
      <span className="w-10 text-center font-medium" aria-live="polite">
        {qty}
      </span>
      <button
        type="button"
        className="flex size-11 items-center justify-center disabled:opacity-40"
        onClick={() => setQty((q) => q + 1)}
        disabled={qty >= remaining}
        aria-label="+"
      >
        <Plus className="size-4" />
      </button>
    </div>
  );

  return (
    <div className={cn("space-y-6", TEXT[look.align])}>
      {/* ===== PRICE ===== */}
      <div>
        {variant.offer ? (
          <>
            {/* On a special offer: new price, old price crossed out, and the offer's text */}
            <p className={cn("flex flex-wrap items-baseline gap-x-3 gap-y-1", JUSTIFY[look.align])}>
              <span className={cn(PRICE_SIZE[look.priceSize], "text-primary")}>{bigPrice(variant.offer.total)}</span>
              <s className="text-lg text-muted-foreground">{bigPrice(variant.price.total)}</s>
              {variant.offer.percent >= 1 && (
                <span dir="ltr" className="rounded-full bg-destructive px-2 py-0.5 text-sm font-semibold text-white">
                  -{variant.offer.percent}%
                </span>
              )}
            </p>
            <p className="mt-1 text-sm font-medium text-destructive">{variant.offer.label}</p>
          </>
        ) : (
          <p className={cn(PRICE_SIZE[look.priceSize], "text-primary")}>{bigPrice(variant.price.total)}</p>
        )}
        {!product.isFixedPrice && show.priceNote && <p className="mt-1 text-sm text-muted-foreground">{labels.priceNote}</p>}
        {/* Line under the price (dashboard → Product page → Line under the price) */}
        {look.divider && <div className="mt-6 border-t" />}
      </div>

      {/* ===== WEIGHT BOX ("Weight: 16.50g" in a frame) — dashboard → Product page → Weight in a box ===== */}
      {look.factsBox && showWeight && (
        <div className={cn("flex", JUSTIFY[look.align])}>
          <p className="rounded-md border px-4 py-2 text-sm">
            {labels.weight}: {formatWeight(variant.weightGrams, locale)}
            {labels.grams}
          </p>
        </div>
      )}

      {/* ===== KEY FACTS: karat · weight · stock ===== (with "boxes" these move into the choice groups below) */}
      {!boxes && <div className={cn("flex flex-wrap items-center gap-x-6 gap-y-2 text-sm", JUSTIFY[look.align])}>
        <span>
          <span className="text-muted-foreground">{labels.karat}: </span>
          <strong>{product.karat}K</strong>
        </span>
        {showWeight && (
          <span>
            <span className="text-muted-foreground">{labels.weight}: </span>
            <strong>
              {formatWeight(variant.weightGrams, locale)} {labels.grams}
            </strong>
          </span>
        )}
        {/* "Out of stock" always shows, even with the stock label switched off */}
        {(show.stock || variant.stockStatus === "out_of_stock") && <span
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium",
            variant.stockStatus === "out_of_stock" && "bg-destructive/10 text-destructive",
            variant.stockStatus === "low_stock" && "bg-amber-100 text-amber-800",
            (variant.stockStatus === "in_stock" || variant.stockStatus === "made_to_order") && "bg-emerald-50 text-emerald-700",
          )}
        >
          {stockLabel[variant.stockStatus]}
        </span>}
      </div>}

      {/* ===== CHOICES AS BOXES: "Karat: 18K" · "Size: 14" · "Weight: 16.50" with outlined square boxes ===== */}
      {boxes && (
        <div className="space-y-4">
          <OptionGroup label={labels.karat} value={`${product.karat}K`} align={look.align}>
            <OptionBox active>{product.karat}K</OptionBox>
          </OptionGroup>
          {showSizes && (
            <OptionGroup label={labels.size} value={variant.size ?? ""} align={look.align}>
              {variants.map((v) => (
                <OptionBox key={v.id} active={v.id === variant.id} disabled={!canBuy(v)} onClick={() => selectVariant(v.id)}>
                  {v.size}
                </OptionBox>
              ))}
            </OptionGroup>
          )}
          {showWeight && (
            <OptionGroup label={labels.weight} value={`${formatWeight(variant.weightGrams, locale)}${labels.grams}`} align={look.align}>
              <OptionBox active>{formatWeight(variant.weightGrams, locale)}</OptionBox>
            </OptionGroup>
          )}
          {/* Low / out of stock still shows a short note */}
          {variant.stockStatus !== "in_stock" && (show.stock || variant.stockStatus === "out_of_stock") && (
            <p className={cn("text-sm", variant.stockStatus === "out_of_stock" ? "text-destructive" : "text-muted-foreground")}>{stockLabel[variant.stockStatus]}</p>
          )}
        </div>
      )}

      {/* ===== SIZE PICKER ===== (hidden when the product has a single size) */}
      {!boxes && showSizes && (
        <div>
          <p className="mb-2 text-sm font-medium">{labels.chooseSize}</p>
          <div className={cn("flex flex-wrap gap-2", JUSTIFY[look.align])}>
            {variants.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => selectVariant(v.id)}
                aria-pressed={v.id === variant.id}
                className={cn(
                  "min-w-14 rounded-md border px-3 py-2 text-sm transition-colors",
                  v.id === variant.id ? "border-primary bg-primary text-primary-foreground" : "hover:border-primary",
                  !canBuy(v) && "text-muted-foreground line-through opacity-60",
                )}
              >
                {v.size}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ===== QUANTITY ON ITS OWN LINE ("Quantity" title, then − 1 +) — dashboard → Product page ===== */}
      {look.quantityOwnRow && show.quantity && (
        <div>
          <p className="mb-2 text-sm">{labels.quantity}</p>
          <div className={cn("flex", JUSTIFY[look.align])}>{quantity}</div>
        </div>
      )}

      {/* ===== QUANTITY + BUTTONS ===== order, look and layout: dashboard → Product page */}
      {stacked ? (
        <div className="space-y-3">
          {buttons.map((k) =>
            // One under the other: the quantity sits beside "Add to cart"
            k === "cart" && show.quantity && !look.quantityOwnRow ? (
              <div key={k} className="flex flex-wrap items-stretch gap-3">
                {quantity}
                {renderButton(k, "flex-1")}
              </div>
            ) : (
              renderButton(k, "w-full")
            ),
          )}
        </div>
      ) : (
        <div className={cn("flex flex-wrap items-stretch gap-3", JUSTIFY[look.align])}>
          {show.quantity && !look.quantityOwnRow && quantity}
          {buttons.map((k) => renderButton(k, "min-w-36 flex-1"))}
        </div>
      )}

      {/* ===== CONFIRMATION after adding ===== */}
      {added === "added" && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800" role="status">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="size-5" />
            {labels.addedToCart}
          </span>
          <Link href={cartHref} className="font-semibold underline underline-offset-4">
            {labels.viewCart}
          </Link>
        </div>
      )}
      {added === "max" && (
        <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800" role="status">
          {labels.maxInCart}
        </p>
      )}

      {/* ===== PRICE BREAKDOWN ===== (only for gold-rate priced pieces) */}
      {!product.isFixedPrice && show.priceBreakdown && (
        <details className="group rounded-lg border p-4 text-start text-sm">
          <summary className="cursor-pointer font-medium marker:text-primary">{labels.priceBreakdown}</summary>
          <dl className="mt-3 space-y-2">
            {goldRatePerGram !== undefined && (
              <Row label={fill(labels.goldRate, { karat: product.karat })} value={`${price(goldRatePerGram)} ${labels.perGram}`} muted />
            )}
            <Row label={`${labels.goldValue} (${formatWeight(variant.weightGrams, locale)} ${labels.grams})`} value={price(variant.price.metalValue)} />
            <Row label={labels.makingCharge} value={price(variant.price.makingCharge)} />
            {variant.price.stones > 0 && <Row label={labels.stonesValue} value={price(variant.price.stones)} />}
            {variant.offer && <Row label={labels.offerDiscount} value={`− ${price(variant.offer.discount)}`} />}
            <div className="border-t pt-2">
              <Row label={labels.total} value={price(variant.offer?.total ?? variant.price.total)} strong />
            </div>
          </dl>
        </details>
      )}
    </div>
  );
}

/** One choice group: "Size: 14" title + its boxes */
function OptionGroup({ label, value, align, children }: { label: string; value: string; align: "start" | "center" | "end"; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-sm">
        {label}: <span className="font-medium">{value}</span>
      </p>
      <div className={cn("flex flex-wrap gap-2", JUSTIFY[align])}>{children}</div>
    </div>
  );
}

/** Outlined square box. Chosen = dark frame; not available = crossed out */
function OptionBox({ active, disabled, onClick, children }: { active?: boolean; disabled?: boolean; onClick?: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={!!active}
      className={cn(
        "min-w-14 border px-4 py-2 text-sm transition-colors",
        active ? "border-foreground" : "border-border hover:border-foreground",
        disabled && "text-muted-foreground line-through opacity-60",
        !onClick && "cursor-default",
      )}
    >
      {children}
    </button>
  );
}

function Row({ label, value, strong, muted }: { label: string; value: string; strong?: boolean; muted?: boolean }) {
  return (
    <div className={cn("flex justify-between gap-4", muted && "text-muted-foreground", strong && "font-semibold")}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
