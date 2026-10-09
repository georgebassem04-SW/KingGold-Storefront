/**
 * PAGE: /[locale]/search?q=ring — sends the visitor to the products page with the search applied,
 * so search results get the same filters and sorting.
 */
import { redirect } from "next/navigation";

export default async function SearchPage({ params, searchParams }: PageProps<"/[locale]/search">) {
  const { locale } = await params;
  const q = (await searchParams).q;
  const text = typeof q === "string" ? q.trim() : "";
  redirect(`/${locale}/products${text ? `?q=${encodeURIComponent(text)}` : ""}`);
}
