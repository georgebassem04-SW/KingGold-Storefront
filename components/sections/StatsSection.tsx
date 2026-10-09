/**
 * PAGE BLOCK: STATS — big numbers with a label ("30+ years of experience").
 *
 * Where to edit:
 *   - Numbers and labels -> page JSON (block "stats" -> "items"); "value" is text in both
 *     languages so Arabic can use Arabic digits ("+٣٠")
 *   - Background -> "bg-secondary" below; number colour -> "text-primary"
 *   - 2 to 4 items look best
 */
import type { StatsSection as StatsSectionType } from "@/types";
import { t } from "@/lib/format";
import type { SectionProps } from "./types";

export function StatsSection({ section, locale }: SectionProps<StatsSectionType>) {
  const { title, items } = section.data;
  return (
    <section className="bg-secondary">
      <div className="mx-auto max-w-7xl px-6 py-14">
        {title && <h2 className="mb-10 text-center text-2xl font-bold md:text-3xl">{t(title, locale)}</h2>}
        <dl className="grid grid-cols-2 gap-8 text-center md:grid-cols-4">
          {items.map((item, i) => (
            <div key={i}>
              <dt className="text-4xl font-bold text-primary md:text-5xl">{t(item.value, locale)}</dt>
              <dd className="mt-2 text-muted-foreground">{t(item.label, locale)}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
