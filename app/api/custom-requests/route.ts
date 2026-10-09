/**
 * CUSTOM ORDER ENDPOINT — POST /api/custom-requests   (form data: the fields + "photos" files)
 * ------------------------------------------------------------------
 * The "Design your piece" form (page /pages/customize) sends here; this route:
 *   1. Drops spam silently (hidden "website" field filled = a bot)
 *   2. Re-checks every field (lib/validation/custom-request.ts)
 *   3. Checks the photos: 1–4, real JPEG / PNG / WebP (read from the bytes, not the name), max 5 MB each
 *   4. Sends everything to the dashboard (lib/api → sendCustomRequest) → "Customization requests"
 * Logged-in customers are linked to their account automatically.
 */
import { NextResponse, type NextRequest } from "next/server";
import { api } from "@/lib/api";
import { getSession } from "@/lib/auth/session";
import { customRequestSchema, MAX_PHOTO_MB, MAX_PHOTOS, MIN_PHOTOS, photoType, type CustomRequestPhoto } from "@/lib/validation/custom-request";

export async function POST(request: NextRequest) {
  const form = await request.formData().catch(() => null);
  if (!form) return NextResponse.json({ ok: false, error: "invalid_form" }, { status: 400 });

  const field = (name: string) => {
    const v = form.get(name);
    return typeof v === "string" ? v : "";
  };

  // Bot trap: pretend it worked, store nothing
  if (field("website")) return NextResponse.json({ ok: true });

  const parsed = customRequestSchema.safeParse({
    name: field("name"),
    phone: field("phone"),
    email: field("email"),
    preferredChannel: field("preferredChannel"),
    pieceType: field("pieceType"),
    karat: field("karat") || "any",
    budget: field("budget"),
    description: field("description"),
  });
  const errors: Record<string, string> = parsed.success ? {} : Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), i.message]));

  // ----- photos -----
  const files = form.getAll("photos").filter((f): f is File => typeof f !== "string" && f.size > 0);
  const photos: CustomRequestPhoto[] = [];
  if (files.length < MIN_PHOTOS) errors.photos = "photoRequired";
  else if (files.length > MAX_PHOTOS) errors.photos = "tooManyPhotos";
  else {
    for (const file of files) {
      if (file.size > MAX_PHOTO_MB * 1024 * 1024) {
        errors.photos = "photoTooBig";
        break;
      }
      const data = Buffer.from(await file.arrayBuffer());
      const type = photoType(data);
      if (!type) {
        errors.photos = "photoType";
        break;
      }
      photos.push({ data, type, name: file.name.slice(0, 100) || "photo" });
    }
  }

  if (!parsed.success || Object.keys(errors).length) {
    return NextResponse.json({ ok: false, error: "validation", errors }, { status: 422 });
  }

  const session = await getSession();
  try {
    const result = await api.sendCustomRequest(
      { ...parsed.data, locale: field("locale") === "en" ? "en" : "ar", customerId: session?.customerId },
      photos,
    );
    return NextResponse.json({ ok: result.ok, reference: result.reference });
  } catch (error) {
    console.error("custom request failed", error);
    return NextResponse.json({ ok: false, error: "server" }, { status: 502 });
  }
}
