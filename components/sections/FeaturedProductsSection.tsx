/**
 * HOMEPAGE BLOCK: PRODUCT ROW — e.g. "Featured pieces" or "New arrivals".
 *
 * Where to edit:
 *   - Title, which products, how many -> dashboard → Homepage → Product row  (sample: mock-data/home.json, "featured_products")
 *       "source": "featured" = products with isFeatured: true
 *                 "new"      = products with isNew: true
 *                 "manual"   = the ids listed in "productIds"
 *                 "category" = products of "categoryId"
 *       "limit": how many to show
 *   - Mark a product featured/new    -> mock-data/products.json (isFeatured / isNew)
 *   - Products per row               -> config/clients/demo.ts -> layout.gridColumns
 *   - How each product looks         -> components/product/ProductCard.tsx
 */
import type { FeaturedProductsSection as FeaturedProductsSectionType, Product } from "@/types";
import { api } from "@/lib/api";
import { localePath } from "@/i18n/config";
import { t } from "@/lib/format";
import { ProductCard } from "@/components/product/ProductCard";
import { SectionTitle } from "@/components/common/SectionTitle";
import type { SectionProps } from "./types";

async function loadProducts(data: FeaturedProductsSectionType["data"]): Promise<Product[]> {
  switch (data.source) {
    case "manual": {
      // Shown in the order chosen in the dashboard
      const ids = data.productIds ?? [];
      const found = await api.getProductsByIds(ids);
      return [...found].sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
    }
    case "category":
      return (await api.getProducts({ categoryId: data.categoryId, pageSize: data.limit })).items;
    case "new":
      return (await api.getProducts({ sort: "newest", pageSize: 100 })).items.filter((p) => p.isNew);
    default:
      return (await api.getProducts({ pageSize: 100 })).items.filter((p) => p.isFeatured);
  }
}

export async function FeaturedProductsSection({ section, locale, dict, goldPrices }: SectionProps<FeaturedProductsSectionType>) {
  const products = (await loadProducts(section.data)).slice(0, section.data.limit);
  if (!products.length) return null;

  return (
    <section className="mx-auto max-w-7xl px-6 py-12">
      <SectionTitle
        title={t(section.data.title, locale)}
        href={localePath(locale, "/products")}
        linkLabel={dict.product.viewAll}
      />
      <div className="product-grid">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} goldPrices={goldPrices} locale={locale} dict={dict} />
        ))}
      </div>
    </section>
  );
}
