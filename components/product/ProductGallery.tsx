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

export function ProductGallery({ images, alt, badges }: { images: MediaImage[]; alt: string; badges?: React.ReactNode }) {
  const [active, setActive] = useState(0);
  const current = images[active];

  return (
    <div className="space-y-4">
      {/* Big image */}
      <div className="group relative aspect-square overflow-hidden rounded-xl bg-muted">
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
