/**
 * NEXT.JS SETTINGS
 *   - reactCompiler: automatic performance optimisation (kept from your original project)
 *   - images.remotePatterns: websites allowed to serve product images.
 *     When the client's images come from their dashboard/CDN, add that domain here,
 *     e.g. { protocol: "https", hostname: "cdn.client.com" }
 *   - images.dangerouslyAllowLocalIP: Next.js refuses to load images from your own computer (localhost)
 *     for safety. It is switched on ONLY while DASHBOARD_URL points to localhost, so pictures uploaded
 *     in the dashboard on your computer show on the website. On the real server it stays off.
 */
import type { NextConfig } from "next";

/** true only when testing with the dashboard on this computer (.env.local → DASHBOARD_URL=http://localhost:3002) */
const localDashboard = /^https?:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(process.env.DASHBOARD_URL ?? "");

/** The dashboard online (e.g. on Vercel): pictures uploaded in its media library come from its address */
const onlineDashboard = (() => {
  try {
    const u = new URL(process.env.DASHBOARD_URL ?? "");
    return localDashboard || !/^https?:$/.test(u.protocol) ? null : { protocol: u.protocol.slice(0, -1) as "http" | "https", hostname: u.hostname };
  } catch {
    return null;
  }
})();

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    dangerouslyAllowLocalIP: localDashboard,
    // Product images will come from the client's dashboard/CDN.
    // Add each client's image host here when the API is ready.
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      // King Gold sample data: photos from their current Shopify site (remove once photos are in the media library)
      { protocol: "https", hostname: "cdn.shopify.com" },
      // Images uploaded in the dashboard's media library while developing on your computer
      { protocol: "http", hostname: "localhost", port: "3002" },
      // Images uploaded in the dashboard when it runs online (from DASHBOARD_URL)
      ...(onlineDashboard ? [onlineDashboard] : []),
    ],
  },
};

export default nextConfig;
