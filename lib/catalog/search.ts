/**
 * PRODUCT SEARCH (Arabic + English)
 * ------------------------------------------------------------------
 * Used by the mock API (lib/api/mock.ts). When the real API is connected, the dashboard/ERP should
 * apply the SAME rules on its side (normalize Arabic, search several fields, every word must match).
 *
 * Why this exists: Arabic is written in many ways. A visitor types "اسوره" but the product is "إسورة".
 * So before comparing, both the search text and the product text are "normalized":
 *   أ إ آ ٱ -> ا      ة -> ه      ى / ئ -> ي      ؤ -> و
 *   diacritics (ـَ ـُ ـِ ـّ …) and tatweel (ـ) are removed
 *   Arabic digits ١٢٣ -> 123   and English is lower-cased
 *
 * What is searched: name (AR/EN), description (AR/EN), SKU, category name (AR/EN), collection name,
 * karat ("21" or "عيار 21"), metal ("ذهب ابيض" / "white gold") and tags.
 * Several words = every word must be found (e.g. "خاتم زمرد").
 *
 * To make more words findable (e.g. "دبله" should find "خاتم"), add them to SYNONYMS below.
 */
import type { Brand, Category, Metal, Product } from "@/types";

const METAL_WORDS: Record<Metal, string> = {
  yellow_gold: "ذهب اصفر yellow gold",
  white_gold: "ذهب ابيض white gold",
  rose_gold: "ذهب وردي rose gold",
  platinum: "بلاتين platinum",
  silver: "فضه silver",
};

/** Extra words that should find a product. Key = what the visitor may type (normalized form is fine). */
const SYNONYMS: Record<string, string[]> = {
  خواتم: ["خاتم", "دبله"],
  اساور: ["اسوره", "غويشه"],
  سلاسل: ["سلسله", "قلاده", "كوليه"],
  حلق: ["اقراط", "قرط"],
  اقراط: ["حلق"],
  سبائك: ["سبيكه"],
};

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[ً-ٰٟـ]/g, "") // diacritics + tatweel
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/[ىئ]/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/\s+/g, " ")
    .trim();
}

/** Builds one searchable text for a product (normalized). */
function haystack(p: Product, categories: Category[], brands: Brand[]): string {
  const cat = categories.find((c) => c.id === p.categoryId);
  const brand = brands.find((b) => b.id === p.brandId);
  return normalize(
    [
      p.name.ar,
      p.name.en,
      p.description.ar,
      p.description.en,
      p.sku,
      cat?.name.ar,
      cat?.name.en,
      brand?.name.ar,
      brand?.name.en,
      `عيار ${p.karat} ${p.karat}k ${p.karat}`,
      METAL_WORDS[p.metal],
      ...p.tags,
    ]
      .filter(Boolean)
      .join(" "),
  );
}

/** Returns true when every word the visitor typed is found in the product. */
export function matchesSearch(p: Product, query: string, categories: Category[], brands: Brand[]): boolean {
  const words = normalize(query).replace(/[^\p{L}\p{N}]+/gu, " ").split(" ").filter(Boolean);
  if (!words.length) return true;
  // A leading space lets us match at the START of a word only ("ring" should not find "earrings")
  const text = " " + haystack(p, categories, brands).replace(/[^\p{L}\p{N}]+/gu, " ");
  const has = (w: string) => text.includes(" " + w) || text.includes(" ال" + w);
  return words.every((w) => {
    if (has(w)) return true;
    // "ال" at the start is optional: "الخاتم" finds "خاتم"
    if (w.startsWith("ال") && w.length > 3 && has(w.slice(2))) return true;
    return (SYNONYMS[w] ?? []).some(has);
  });
}
