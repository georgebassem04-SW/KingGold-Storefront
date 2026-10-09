/**
 * CUSTOM ORDER RULES (Zod) — the "Design your piece" form (block "custom_order", page /pages/customize). Used in TWO places:
 *   1. In the browser, to show errors under each field (components/custom/CustomOrderForm.tsx)
 *   2. On the server, to re-check everything that arrives (app/api/custom-requests/route.ts)
 * Error codes ("required", "tooShort"…) become text from i18n/dictionaries/*.json → "customOrder.errors".
 *
 * To change the choices (piece types, karats) or the photo limits: edit the lists / numbers below
 * (and the matching names in the dictionaries → "customOrder.types" / "customOrder.karats").
 */
import { z } from "zod";
import { normalizeDigits } from "./contact";

/** What the customer wants made */
export const PIECE_TYPES = ["ring", "necklace", "bracelet", "earrings", "set", "other"] as const;
export const KARATS = ["any", "18", "21", "24"] as const;

/** Photos: at least MIN, at most MAX, each up to MAX_PHOTO_MB (the browser shrinks big phone photos first) */
export const MIN_PHOTOS = 1;
export const MAX_PHOTOS = 4;
export const MAX_PHOTO_MB = 5;

export const customRequestSchema = z.object({
  name: z.string().trim().min(2, "tooShort").max(80, "tooLong"),
  phone: z
    .string()
    .trim()
    .transform(normalizeDigits)
    .refine((v) => /^\+?[\d\s-]{7,20}$/.test(v) && v.replace(/\D/g, "").length >= 7 && v.replace(/\D/g, "").length <= 15, "invalidPhone"),
  email: z.union([z.literal(""), z.string().trim().email("invalidEmail")]),
  preferredChannel: z.enum(["whatsapp", "phone", "email"]),
  pieceType: z.enum(PIECE_TYPES, "required"),
  karat: z.enum(KARATS),
  /** Free text so any currency / range works ("10,000 – 15,000") */
  budget: z.string().trim().max(60, "tooLong"),
  description: z.string().trim().min(15, "tooShort").max(2000, "tooLong"),
  /** Hidden anti-spam field: people never see it, bots fill it. Must stay empty. */
  website: z.string().max(0).optional(),
});

export type CustomRequestFormInput = z.input<typeof customRequestSchema>;
export type CustomRequestInput = Omit<z.output<typeof customRequestSchema>, "website"> & {
  locale: "ar" | "en";
  /** Logged-in customer (so the dashboard links it to their file) */
  customerId?: string;
};

/** One photo after the server checked it */
export interface CustomRequestPhoto {
  data: Buffer;
  type: "image/jpeg" | "image/png" | "image/webp";
  name: string;
}

/** Reads the real type from the file's first bytes (a renamed file can't sneak in). null = not a photo we accept. */
export function photoType(b: Buffer): CustomRequestPhoto["type"] | null {
  if (b.length < 12) return null;
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "image/png";
  if (b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  return null;
}
