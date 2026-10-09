/**
 * CLIENT SETTINGS — the demo client
 * ------------------------------------------------------------------
 * This is the MAIN file to edit when you want to change how a client's
 * website looks: name, logo, colours, fonts, currency, phone, email...
 * Save the file and the whole site updates (no component changes needed).
 *
 * New client? Copy this file (e.g. gemma.ts), change the values,
 * then register it in config/clients/index.ts.
 *
 * Later, these values will come from the dashboard API instead of this file.
 */
import type { ClientConfig } from "@/types";

export const demoClient: ClientConfig = {
  // Internal id. Must match the key in config/clients/index.ts
  id: "demo",

  // ===== STORE NAME ===== (shown in the header, footer and browser tab)
  name: { ar: "متجر المجوهرات", en: "My Store" },
  // Short line under the name in the footer + Google description
  tagline: { ar: "ذهب ومجوهرات بتصميمات فريدة", en: "Fine gold & jewelry" },

  // ===== LANGUAGES =====
  // Which languages the site has, and which one opens first
  locales: ["ar", "en"],
  defaultLocale: "ar",

  // ===== MONEY =====
  currency: "EGP", // EGP, AED, SAR, QAR, KWD...
  vatPercent: 14, // Egypt 14, UAE 5, KSA 15

  // ===== LOGO =====
  // Put the image in public/clients/demo/ and write its path here (starts with /)
  branding: {
    logo: "/clients/demo/logo.svg",
  },

  // ===== COLOURS, FONTS, CORNERS =====
  theme: {
    colors: {
      primary: "#B8860B", // buttons, prices, links (the gold colour)
      primaryForeground: "#FFFFFF", // text on top of primary buttons
      secondary: "#F5EFE6", // soft backgrounds (gold price strip, promo box)
      secondaryForeground: "#1A1A1A", // text on secondary backgrounds
      accent: "#D4AF37", // hover highlights
      background: "#FFFFFF", // page background
      foreground: "#1A1A1A", // main text colour
      muted: "#F6F6F4", // image placeholders, light boxes
      mutedForeground: "#6B6B6B", // grey secondary text
      border: "#E7E2DA", // lines and card borders
      headerBackground: "#000000", // header bar
      headerForeground: "#FFFFFF", // header text and icons
      footerBackground: "#111827", // footer
      footerForeground: "#FFFFFF", // footer text
    },
    // Font names must be one of the options listed in lib/fonts.ts
    fonts: { arabic: "cairo", latin: "inter", headingLatin: "playfair" },
    // Roundness of buttons, cards, images: "0" = square, "0.5rem" = soft, "1rem" = very round
    radius: "0.5rem",
  },

  // ===== LAYOUT OPTIONS =====
  layout: {
    header: "centered", // "centered" | "classic" (classic not built yet)
    productCard: "detailed", // "detailed" shows karat + weight under the name, "minimal" hides them
    gridColumns: 4, // products per row on desktop: 3 or 4
  },

  // ===== CONTACT DETAILS ===== (footer + contact page)
  contact: {
    email: "info@mystore.com",
    phone: "+20 123456789",
    whatsapp: "+20123456789",
    address: { ar: "القاهرة، مصر", en: "Cairo, Egypt" },
    hours: { ar: "السبت – الخميس: ١١ ص – ١٠ م", en: "Sat – Thu: 11 AM – 10 PM" }, // customer-service hours
  },

  // ===== SOCIAL MEDIA LINKS ===== (leave out any the client doesn't use)
  social: {
    instagram: "https://instagram.com/",
    facebook: "https://facebook.com/",
  },

  // ===== ON/OFF SWITCHES =====
  features: {
    // Defaults only — the dashboard (Settings → Store details → Website options) overrides these three
    showGoldPrices: true, // today's gold price strip on the homepage
    showWeight: true, // weight in grams on product cards
    storePickup: true, // allow "pick up from branch" at checkout
    guestCheckout: true, // allow ordering without an account
  },
};
