/**
 * HOMEPAGE BLOCK: GOLD PRICES STRIP — "Today's gold prices: 24K ... 21K ... 18K ...".
 *
 * Where to edit:
 *   - Which karats show     -> mock-data/home.json (block "gold_prices" -> "karats")
 *   - The prices themselves -> mock-data/gold-prices.json (later: from the ERP)
 *   - Hide it completely    -> dashboard → Settings → Store details → Website options (default: config/clients/demo.ts → features)
 *   - Background colour     -> the client's "secondary" colour (bg-secondary)
 */
import type { GoldPricesSection as GoldPricesSectionType } from "@/types";
import { getSiteOptions } from "@/lib/store-contact";
import { fill, formatPrice, t } from "@/lib/format";
import type { SectionProps } from "./types";

export async function GoldPricesSection({ section, locale, dict, goldPrices }: SectionProps<GoldPricesSectionType>) {
  if (!(await getSiteOptions()).showGoldPrices) return null;
  const rows = goldPrices.filter((g) => section.data.karats.includes(g.karat));
  return (
    <section className="bg-secondary">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-10 gap-y-2 px-6 py-4">
        <span className="font-semibold">{t(section.data.title, locale)}</span>
        {rows.map((g) => (
          <span key={g.karat} className="text-sm">
            {fill(dict.gold.karatLabel, { karat: g.karat })}:{" "}
            <strong className="text-primary">{formatPrice(g.pricePerGram, g.currency, locale)}</strong>{" "}
            <span className="text-muted-foreground">{dict.gold.perGram}</span>
          </span>
        ))}
      </div>
    </section>
  );
}
