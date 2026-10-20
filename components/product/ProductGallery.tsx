/**
 * PRODUCT GALLERY (runs in the browser) — big image + thumbnails underneath.
 * Clicking a thumbnail shows it in the big frame. Hovering the big image zooms it slightly.
 *
 * Where to edit:
 *   - Photos and their order -> product "images" (mock-data/products.json, later the dashboard)
 *   - Image shape            -> "aspect-square" below
 *   - Zoom on hover          -> "group-hover:scale-110" below (remove to disable)
 */
"use client";

import Image from "next/image";
import { useState } from "react";
import type { MediaImage } from "@/types";
import { cn } from "@/lib/utils";

/**
 * `look` (dashboard → Product page → Photos): "thumbs" = big photo + small photos under it · "stack" = every photo,
 * one under the other. `background` = colour behind the photos (Layout → Product cards → Behind the pictures).
 */
export function ProductGallery({ images, alt, badges, look = "thumbs", background }: { images: MediaImage[]; alt: string; badges?: React.ReactNode; look?: "thumbs" | "stack"; background?: string }) {
  const [active, setActive] = useState(0);
  const current = images[active];

  // STACK: all photos one under the other (no zoom, no small photos)
  if (look === "stack") {
    return (
      <div className="space-y-4">
        {images.map((img, i) => (
          <div key={img.url} className="relative aspect-square overflow-hidden bg-muted" style={background ? { background } : undefined}>
            <Image src={img.url} alt={i === 0 ? alt : ""} fill priority={i === 0} sizes="(max-width: 1024px) 100vw, 50vw" className="object-contain" />
            {i === 0 && badges && <div className="absolute start-3 top-3 flex gap-2">{badges}</div>}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Big image */}
      <div className="group relative aspect-square overflow-hidden rounded-xl bg-muted" style={background ? { background } : undefined}>
        {current && (
          <Image
            key={current.url}
            src={current.url}
            alt={alt}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />
        )}
        {badges && <div className="absolute start-3 top-3 flex gap-2">{badges}</div>}
      </div>

      {/* Thumbnails (only when there is more than one photo) */}
      {images.length > 1 && (
        <div className="grid grid-cols-5 gap-3">
          {images.map((img, i) => (
            <button
              key={img.url}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`${alt} ${i + 1}`}
              aria-current={i === active}
              className={cn(
                "relative aspect-square overflow-hidden rounded-lg border-2 bg-muted transition-colors",
                i === active ? "border-primary" : "border-transparent hover:border-border",
              )}
            >
              <Image src={img.url} alt="" fill sizes="120px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
