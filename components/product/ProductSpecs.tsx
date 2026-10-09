/**
 * PRODUCT SPECIFICATIONS TABLE — code, category, metal, karat, weight range, stones, certificate.
 * Only rows that have a value are shown.
 *
 * Where to edit:
 *   - Row names (AR/EN) -> i18n/dictionaries/*.json -> "product"
 *   - Add a row         -> add it to `rows` below
 */
import type { Category, Locale, Product } from "@/types";
import type { Dictionary } from "@/i18n/get-dictionary";
import { formatWeight, t } from "@/lib/format";

export function ProductSpecs({ product, category, locale, labels, showWeight }: {
  product: Product;
  category?: Category | null;
  locale: Locale;
  labels: Dictionary["product"];
  showWeight: boolean;
}) {
  const weights = product.variants.map((v) => v.weightGrams);
  const minW = Math.min(...weights);
  const maxW = Math.max(...weights);
  const weightText =
    minW === maxW
      ? `${formatWeight(minW, locale)} ${labels.grams}`
      : `${formatWeight(minW, locale)} – ${formatWeight(maxW, locale)} ${labels.grams}`;

  const stonesText = product.stones.length
    ? product.stones
        .map((s) => {
          const parts = [`${s.count} × ${labels.stoneTypes[s.type] ?? s.type}`];
          if (s.caratWeight) parts.push(`${s.caratWeight} ${labels.carat}`);
          if (s.color || s.clarity) parts.push([s.color, s.clarity].filter(Boolean).join(" / "));
          return parts.join(" · ");
        })
        .join(locale === "ar" ? "، " : ", ")
    : null;

  const rows: [string, string | null | undefined][] = [
    [labels.sku, product.sku],
    [labels.category, category ? t(category.name, locale) : null],
    [labels.metal, labels.metals[product.metal]],
    [labels.karat, `${product.karat}K`],
    [labels.weight, showWeight ? weightText : null],
    [labels.stones, stonesText],
    [labels.certificate, product.certificate ? `${product.certificate.issuer} — ${product.certificate.number}` : null],
  ];

  return (
    <table className="w-full text-sm">
      <tbody>
        {rows
          .filter(([, value]) => value)
          .map(([label, value]) => (
            <tr key={label} className="border-b last:border-0">
              <th className="w-1/3 py-3 text-start font-medium text-muted-foreground">{label}</th>
              <td className="py-3">
                {/* codes stay left-to-right inside Arabic text */}
                {label === labels.sku ? <span dir="ltr">{value}</span> : value}
              </td>
            </tr>
          ))}
      </tbody>
    </table>
  );
}
