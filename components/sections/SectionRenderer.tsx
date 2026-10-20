/**
 * BLOCK ENGINE — draws the blocks of the homepage AND of content pages (About...) in the order the dashboard sends them.
 *
 * How it works:
 *   1. Takes the list of blocks from mock-data/home.json (later: the dashboard).
 *   2. Skips blocks with "isActive": false.
 *   3. Sorts by "sortOrder" (1 = top).
 *   4. Draws each block with its component from the `registry` below.
 *
 * To reorder / hide homepage blocks: edit mock-data/home.json — no code change.
 * To add a NEW kind of block:
 *   1. Add its type in types/cms.ts
 *   2. Create its component in this folder
 *   3. Register it in `registry` below
 */
import type { ComponentType } from "react";
import type { HomeSection, HomeSectionType } from "@/types";
import type { SectionProps } from "./types";
import { HeroSection } from "./HeroSection";
import { BannerSection } from "./BannerSection";
import { FeaturedProductsSection } from "./FeaturedProductsSection";
import { CategoriesSection } from "./CategoriesSection";
import { BrandsSection } from "./BrandsSection";
import { VideoSection } from "./VideoSection";
import { PromotionSection } from "./PromotionSection";
import { GoldPricesSection } from "./GoldPricesSection";
import { PageHeroSection } from "./PageHeroSection";
import { ImageTextSection } from "./ImageTextSection";
import { StatsSection } from "./StatsSection";
import { FeaturesSection } from "./FeaturesSection";
import { TimelineSection } from "./TimelineSection";
import { RichTextSection } from "./RichTextSection";
import { BranchesSection } from "./BranchesSection";
import { CtaSection } from "./CtaSection";
import { ContactSection } from "./ContactSection";
import { FaqSection } from "./FaqSection";
import { CustomOrderSection } from "./CustomOrderSection";
import { SocialFeedSection } from "./SocialFeedSection";

/**
 * The CMS engine. The dashboard sends a list of sections; this renders them in sortOrder,
 * skipping inactive ones. Section type -> component mapping lives in this one registry.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const registry: Record<HomeSectionType, ComponentType<SectionProps<any>>> = {
  hero: HeroSection,
  banner: BannerSection,
  featured_products: FeaturedProductsSection,
  categories: CategoriesSection,
  brands: BrandsSection,
  video: VideoSection,
  promotion: PromotionSection,
  gold_prices: GoldPricesSection,
  // Content-page blocks (About, FAQ, custom pages) — usable on the homepage too
  page_hero: PageHeroSection,
  image_text: ImageTextSection,
  stats: StatsSection,
  features: FeaturesSection,
  timeline: TimelineSection,
  rich_text: RichTextSection,
  branches: BranchesSection,
  cta: CtaSection,
  contact: ContactSection,
  custom_order: CustomOrderSection,
  faq: FaqSection,
  // "Stay connected" pictures from Instagram / TikTok
  social_feed: SocialFeedSection,
};

export function SectionRenderer({ sections, ...rest }: { sections: HomeSection[] } & Omit<SectionProps, "section">) {
  return (
    <>
      {sections
        .filter((s) => s.isActive)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((section) => {
          const Component = registry[section.type];
          // Unknown type from the dashboard: skip it instead of crashing the page
          if (!Component) return null;
          return <Component key={section.id} section={section} {...rest} />;
        })}
    </>
  );
}
