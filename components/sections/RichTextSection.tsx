/**
 * PAGE BLOCK: RICH TEXT — free formatted text from the dashboard editor (mission, policies, terms...).
 *
 * Where to edit:
 *   - Title and text (HTML) -> page JSON (block "rich_text")
 *   - Width -> "width": "narrow" (easy reading, ~65 characters per line) or "wide"
 */
import type { RichTextSection as RichTextSectionType } from "@/types";
import { t } from "@/lib/format";
import { cn } from "@/lib/utils";
import { RichText } from "@/components/common/RichText";
import { SectionTitle } from "@/components/common/SectionTitle";
import type { SectionProps } from "./types";

export function RichTextSection({ section, locale }: SectionProps<RichTextSectionType>) {
  const d = section.data;
  return (
    <section className={cn("mx-auto px-6 py-16", d.width === "narrow" ? "max-w-3xl" : "max-w-7xl")}>
      {d.title && <SectionTitle title={t(d.title, locale)} />}
      <RichText html={t(d.body, locale)} />
    </section>
  );
}
