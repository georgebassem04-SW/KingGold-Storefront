/**
 * RICH TEXT — shows formatted text (HTML) written in the dashboard's text editor.
 * ------------------------------------------------------------------
 * The HTML is CLEANED first: only safe tags are kept (headings, paragraphs, lists, links,
 * bold/italic, images, tables). Scripts, iframes and inline event handlers are removed,
 * so a mistake or a bad paste in the dashboard can't break or attack the website.
 *
 * Styling comes from the Tailwind Typography plugin ("prose" classes).
 *   - Text size -> "prose-lg" below (remove for smaller text)
 *   - Link colour follows the client's primary colour
 */
import sanitizeHtml from "sanitize-html";
import { cn } from "@/lib/utils";

const ALLOWED: sanitizeHtml.IOptions = {
  allowedTags: [
    "h2", "h3", "h4", "p", "br", "hr", "strong", "b", "em", "i", "u", "s", "blockquote",
    "ul", "ol", "li", "a", "img", "figure", "figcaption", "span",
    "table", "thead", "tbody", "tr", "th", "td",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel"],
    img: ["src", "alt", "width", "height"],
    "*": ["dir"],
  },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  // Links that open a new tab get rel="noopener" automatically
  transformTags: {
    a: (tagName, attribs) => ({
      tagName,
      attribs: attribs.target === "_blank" ? { ...attribs, rel: "noopener noreferrer" } : attribs,
    }),
  },
};

export function RichText({ html, className }: { html: string; className?: string }) {
  const clean = sanitizeHtml(html, ALLOWED);
  return (
    <div
      className={cn(
        "prose prose-lg max-w-none prose-headings:font-bold prose-a:text-primary prose-li:marker:text-primary",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
