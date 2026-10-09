/**
 * PAGE BLOCK: FAQ — questions that open to show their answer (accordion).
 * Built with <details>/<summary>: works without JavaScript, keyboard and screen readers included.
 *
 * Where to edit:
 *   - Questions and answers -> dashboard → Site pages → the page → "FAQ" section (mock: page JSON, block "faq")
 *   - Answers are formatted text (HTML), cleaned by RichText before display
 */
import { ChevronDown } from "lucide-react";
import type { FaqSection as FaqSectionType } from "@/types";
import { t } from "@/lib/format";
import { RichText } from "@/components/common/RichText";
import { SectionTitle } from "@/components/common/SectionTitle";
import type { SectionProps } from "./types";

export function FaqSection({ section, locale }: SectionProps<FaqSectionType>) {
  const d = section.data;
  return (
    <section className="mx-auto max-w-3xl px-6 py-16">
      {d.title && <SectionTitle title={t(d.title, locale)} />}
      <div className="divide-y rounded-2xl border bg-card">
        {d.items.map((item, i) => (
          <details key={i} className="group px-5 [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-start font-semibold">
              {t(item.question, locale)}
              <ChevronDown className="size-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden />
            </summary>
            <div className="pb-5 text-muted-foreground">
              <RichText html={t(item.answer, locale)} />
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
