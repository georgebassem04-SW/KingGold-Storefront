/**
 * SECTION TITLE — the heading above each block, with an optional "View all" link on the other side.
 *   - Title size -> "text-2xl md:text-3xl" below
 *   - center     -> centred title (used on content pages)
 */
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Props {
  title: string;
  href?: string;
  linkLabel?: string;
  center?: boolean;
}

export function SectionTitle({ title, href, linkLabel, center }: Props) {
  return (
    <div className={cn("mb-6 flex items-end gap-4", center ? "justify-center text-center" : "justify-between")}>
      <h2 className="text-2xl font-bold md:text-3xl">{title}</h2>
      {href && linkLabel && (
        <Link href={href} className="text-sm text-primary hover:underline">
          {linkLabel}
        </Link>
      )}
    </div>
  );
}
