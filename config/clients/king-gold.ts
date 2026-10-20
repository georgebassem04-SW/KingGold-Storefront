/**
 * CLIENT SETTINGS — King Gold
 * ------------------------------------------------------------------
 * Copied from demo.ts. Edit the values here to change how the King Gold
 * website looks. Registered in config/clients/index.ts as "king-gold".
 *
 * Look copied from kinggoldeg.com. When the dashboard runs, its Theme & design wins over this file.
 * Lines marked TODO still hold placeholder values — replace them when the
 * client sends the real details.
 */
import type { ClientConfig } from "@/types";

export const kingGoldClient: ClientConfig = {
  // Internal id. Must match the key in config/clients/index.ts
  id: "king-gold",

  // ===== STORE NAME =====
  name: { ar: "كينج جولد", en: "King Gold" },
  tagline: {
    ar: "مصنع مجوهرات ذهب عيار 18 يقدم مجموعات حصرية لشركاء الجملة داخل مصر وخارجها.",
    en: "18K gold jewelry manufacturer offering exclusive collections for international wholesale partners.",
  },

  // ===== LANGUAGES =====
  locales: ["ar", "en"],
  defaultLocale: "ar",

  // ===== MONEY =====
  currency: "EGP",
  vatPercent: 14, // TODO: confirm (Egypt 14, UAE 5, KSA 15)

  // ===== LOGO =====
  // Files live in public/clients/king-gold/. Swap for an SVG / larger PNG when the client sends one.
  branding: {
    logo: "/clients/king-gold/logo.png",
    // Browser tab icon (square). The client can change it: dashboard → Header → Logo → Browser tab icon
    favicon: "/clients/king-gold/favicon.png",
  },

  // ===== COLOURS, FONTS, CORNERS =====
  theme: {
    colors: {
      // Same as the dashboard's starting theme (dashboard/config/theme-defaults.ts) — copied from kinggoldeg.com
      primary: "#5C2324", // burgundy: buttons, prices, links
      primaryForeground: "#F2F2F2",
      secondary: "#E9E3DE",
      secondaryForeground: "#5C2324",
      accent: "#9B741F", // logo gold, hover highlights
      background: "#F2F2F2", // light grey page
      foreground: "#5C2324",
      muted: "#E6E2DF",
      mutedForeground: "#7A5354",
      border: "#D8CFCB",
      headerBackground: "#F2F2F2",
      headerForeground: "#5C2324",
      footerBackground: "#F2F2F2",
      footerForeground: "#5C2324",
    },
    // Font names must be one of the options listed in lib/fonts.ts
    // Only cairo/tajawal/almarai + inter/playfair are allowed here (types/client.ts).
    // The real King Gold fonts (Libre Baskerville headings) are set in the dashboard theme.
    fonts: { arabic: "cairo", latin: "inter", headingLatin: "playfair" },
    radius: "0", // square, like kinggoldeg.com
  },

  // ===== LAYOUT OPTIONS =====
  layout: {
    header: "centered",
    productCard: "minimal",
    gridColumns: 4,
  },

  // ===== CONTACT DETAILS ===== (from kinggoldeg.com)
  contact: {
    email: "info@kinggoldeg.com",
    phone: "+20 127 582 2964",
    whatsapp: "+201275822964",
    address: { ar: "72 ش، المنطقة الصناعية الأولى، مدينة العبور، القليوبية، مصر", en: "72 St. 1st Industrial Zone, Al Obour City, Qalubya, Egypt" },
    hours: { ar: "الاثنين – السبت: ٩ ص – ٥ م", en: "Monday – Saturday: 9am – 5pm" },
  },

  // ===== SOCIAL MEDIA LINKS =====
  social: {
    instagram: "https://www.instagram.com/kinggoldeg/",
    tiktok: "https://www.tiktok.com/@kinggoldeg",
  },

  // ===== ON/OFF SWITCHES =====
  features: {
    showGoldPrices: false, // their site has no gold price strip
    showWeight: true,
    storePickup: true,
    guestCheckout: true,
  },
};
