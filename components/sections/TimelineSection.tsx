/**
 * PAGE BLOCK: TIMELINE — company history by year.
 *
 * Where to edit:
 *   - Title and milestones -> page JSON (block "timeline" -> "items": year, title, text)
 *   - Line colour -> "bg-border" below;  dot colour -> "bg-primary"
 * The line sits on the start side, so it flips automatically in Arabic.
 */
import type { TimelineSection as TimelineSectionType } from "@/types";
import { t } from "@/lib/format";
import { SectionTitle } from "@/components/common/SectionTitle";
import type { SectionProps } from "./types";

export function TimelineSection({ section, locale }: SectionProps<TimelineSectionType>) {
  const d = section.data;
  return (
    <section className="mx-auto max-w-3xl px-6 py-16">
      <SectionTitle title={t(d.title, locale)} center />
      <ol className="relative mt-4 space-y-10 ps-8">
        {/* vertical line */}
        <span aria-hidden className="absolute inset-y-1 start-[7px] w-px bg-border" />
        {d.items.map((item, i) => (
          <li key={i} className="relative">
            {/* dot */}
            <span aria-hidden className="absolute -start-8 top-1.5 size-[15px] rounded-full border-4 border-background bg-primary" />
            <p className="text-sm font-bold text-primary">{item.year}</p>
            <h3 className="mt-1 text-lg font-semibold">{t(item.title, locale)}</h3>
            <p className="mt-1 text-muted-foreground">{t(item.text, locale)}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
