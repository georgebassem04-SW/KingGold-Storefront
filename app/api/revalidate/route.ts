/**
 * INSTANT UPDATE ENDPOINT — POST /api/revalidate
 * ------------------------------------------------------------------
 * The dashboard calls this right after the client clicks Save, so the website
 * shows the change immediately instead of waiting for the cache to expire.
 *
 * Request the dashboard must send:
 *   POST https://<store-domain>/api/revalidate
 *   Header:  x-revalidate-secret: <REVALIDATE_SECRET from .env.local>
 *   Body:    { "tags": ["page:about"] }
 *
 * Tags in use (see lib/api/http.ts):
 *   theme · home · pages · page:<slug> · branches · categories · brands · products · product:<slug> · gold-prices · checkout-options
 * Example: the client edits the About page -> dashboard sends { "tags": ["page:about"] }
 */
import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  // Only the dashboard knows the secret; anyone else gets 401
  const secret = request.headers.get("x-revalidate-secret");
  if (!process.env.REVALIDATE_SECRET || secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ ok: false, error: "Invalid secret" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { tags?: unknown } | null;
  const tags = Array.isArray(body?.tags) ? body.tags.filter((t): t is string => typeof t === "string") : [];
  if (!tags.length) {
    return NextResponse.json({ ok: false, error: "Send { tags: [...] }" }, { status: 400 });
  }

  // expire: 0 = drop the old version now, so the very next visitor sees the new content
  for (const tag of tags) revalidateTag(tag, { expire: 0 });

  return NextResponse.json({ ok: true, revalidated: tags, at: new Date().toISOString() });
}
