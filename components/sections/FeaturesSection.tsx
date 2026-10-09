/**
 * PAGE BLOCK: FEATURES — grid of icon + title + short text (values, "why choose us", services).
 *
 * Where to edit:
 *   - Title, subtitle, items -> page JSON (block "features")
 *   - Items per row          -> "columns": 2, 3 or 4
 *   - Icon for each item     -> "icon": one of the names in ICONS below
 *   - Add a new icon         -> import it from lucide-react, add it to ICONS,
 *                               and add its name to FeatureIcon in types/cms.ts
 */
import { Award, BadgeCheck, Gem, HandCoins, Heart, Scale, ShieldCheck, Sparkles, Truck, Wrench, type LucideIcon } from "lucide-react";
import type { FeatureIcon, FeaturesSection as FeaturesSectionType } from "@/types";
import { t } from "@/lib/format";
import { cn } from "@/lib/utils";
import { SectionTitle } from "@/components/common/SectionTitle";
import type { SectionProps } from "./types";

// Icon names the dashboard can send -> the icon drawn
const ICONS: Record<FeatureIcon, LucideIcon> = {
  gem: Gem,
  shield: ShieldCheck,
  scale: Scale,
  sparkles: Sparkles,
  award: Award,
  heart: Heart,
  truck: Truck,
  coins: HandCoins,
  wrench: Wrench,
  badge: BadgeCheck,
};

const GRID = { 2: "md:grid-cols-2", 3: "md:grid-cols-3", 4: "md:grid-cols-2 lg:grid-cols-4" } as const;

export function FeaturesSection({ section, locale }: SectionProps<FeaturesSectionType>) {
  const d = section.data;
  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <div className="mx-auto mb-10 max-w-2xl text-center">
        <SectionTitle title={t(d.title, locale)} center />
        {d.subtitle && <p className="-mt-2 text-muted-foreground">{t(d.subtitle, locale)}</p>}
      </div>
      <div className={cn("grid gap-6", GRID[d.columns] ?? GRID[3])}>
        {d.items.map((item, i) => {
          const Icon = ICONS[item.icon] ?? Gem; // unknown icon name -> gem
          return (
            <div key={i} className="rounded-xl border p-6 text-center transition-colors hover:border-primary">
              <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-secondary text-primary">
                <Icon className="size-6" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">{t(item.title, locale)}</h3>
              <p className="text-sm text-muted-foreground">{t(item.text, locale)}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
