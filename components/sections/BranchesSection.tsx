/**
 * PAGE BLOCK: BRANCHES — one card per shop: city, address, opening hours, phone, map link.
 *
 * Where to edit:
 *   - Title / subtitle          -> page JSON (block "branches")
 *   - Show only some branches   -> add "branchIds": ["br-1", ...] to the block
 *   - Cards at the start / center / end of the row -> dashboard → Site pages → the Branches block → "Position"
 *   - Branch details, photo, WhatsApp -> dashboard → Settings → Branches (without the dashboard: mock-data/branches.json)
 *   - Photo shape                -> "aspect-[16/9]" below
 *   - Button labels (AR/EN)     -> i18n/dictionaries/*.json -> "branches"
 */
import { Clock, MapPin, MessageCircle, Navigation, Phone } from "lucide-react";
import type { BranchesSection as BranchesSectionType } from "@/types";
import { api } from "@/lib/api";
import { t } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SectionTitle } from "@/components/common/SectionTitle";
import type { SectionProps } from "./types";

/** Card position in the row: start = right in Arabic / left in English */
const ALIGN = { start: "justify-start", center: "justify-center", end: "justify-end" } as const;

export async function BranchesSection({ section, locale, dict }: SectionProps<BranchesSectionType>) {
  const all = await api.getBranches();
  const ids = section.data.branchIds;
  const branches = ids?.length ? all.filter((b) => ids.includes(b.id)) : all;
  if (!branches.length) return null;

  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <div className="mx-auto mb-10 max-w-2xl text-center">
        <SectionTitle title={t(section.data.title, locale)} center />
        {section.data.subtitle && <p className="-mt-2 text-muted-foreground">{t(section.data.subtitle, locale)}</p>}
      </div>

      {/* Cards: 1 per row on phones, 2 on tablets, 3 on desktop. `align` (dashboard → the block) places them when the row isn't full */}
      <div className={cn("flex flex-wrap gap-6", ALIGN[section.data.align ?? "start"])}>
        {branches.map((b) => (
          <article key={b.id} className="flex w-full flex-col overflow-hidden rounded-xl border p-6 md:w-[calc((100%-1.5rem)/2)] lg:w-[calc((100%-3rem)/3)]">
            {/* Branch photo (optional) — plain <img> because it can come from any address in the media library */}
            {b.image?.url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={b.image.url} alt={t(b.name, locale)} loading="lazy" className="-mx-6 -mt-6 mb-5 aspect-[16/9] w-[calc(100%+3rem)] max-w-none object-cover" />
            )}
            <div className="mb-4 flex items-start justify-between gap-2">
              <div>
                <h3 className="text-lg font-semibold">{t(b.name, locale)}</h3>
                <p className="text-sm text-muted-foreground">{t(b.city, locale)}</p>
              </div>
              {b.isPickupPoint && <Badge variant="secondary">{dict.branches.pickup}</Badge>}
            </div>

            <ul className="mb-6 space-y-3 text-sm">
              <li className="flex gap-3">
                <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>{t(b.address, locale)}</span>
              </li>
              <li className="flex gap-3">
                <Clock className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>{t(b.hours, locale)}</span>
              </li>
              <li className="flex gap-3">
                <Phone className="mt-0.5 size-4 shrink-0 text-primary" />
                {/* dir="ltr" keeps the number readable in Arabic */}
                <a href={`tel:${b.phone.replace(/\s/g, "")}`} dir="ltr" className="hover:text-primary">
                  {b.phone}
                </a>
              </li>
            </ul>

            <div className="mt-auto flex flex-wrap gap-2">
              {b.mapUrl && (
                <Button asChild size="sm">
                  <a href={b.mapUrl} target="_blank" rel="noopener noreferrer">
                    <Navigation /> {dict.branches.directions}
                  </a>
                </Button>
              )}
              <Button asChild size="sm" variant="outline">
                <a href={`tel:${b.phone.replace(/\s/g, "")}`}>
                  <Phone /> {dict.branches.call}
                </a>
              </Button>
              {b.whatsapp && (
                <Button asChild size="sm" variant="outline">
                  <a href={`https://wa.me/${b.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer">
                    <MessageCircle /> {dict.branches.whatsapp}
                  </a>
                </Button>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
