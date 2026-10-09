/**
 * CONTACT FORM RULES (Zod) — used in TWO places:
 *   1. In the browser, to show errors under each field before sending (components/sections/ContactForm.tsx)
 *   2. On the server, to re-check everything that arrives (app/api/contact/route.ts)
 *
 * Error messages are short CODES ("required", "invalidPhone"...). The form turns each code into
 * Arabic or English text from i18n/dictionaries/*.json -> "contact.errors".
 *
 * To change a rule (e.g. make email required, longer messages): edit the schema below.
 */
import { z } from "zod";

/** Turns Arabic-Indic digits (٠١٢…) into 0-9 so "٠١٠٠١٢٣٤٥٦٧" is accepted as a phone number */
export const normalizeDigits = (value: string) =>
  value.replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d))).replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)));

export const contactSchema = z.object({
  name: z.string().trim().min(2, "tooShort").max(80, "tooLong"),
  phone: z
    .string()
    .trim()
    .transform(normalizeDigits)
    // 7–15 digits, may start with +, spaces and dashes allowed
    .refine((v) => /^\+?[\d\s-]{7,20}$/.test(v) && v.replace(/\D/g, "").length >= 7 && v.replace(/\D/g, "").length <= 15, "invalidPhone"),
  // Optional: empty is fine, but if filled it must be a valid email
  email: z.union([z.literal(""), z.string().trim().email("invalidEmail")]),
  subject: z.string().min(1, "required"),
  branchId: z.string().optional(),
  preferredChannel: z.enum(["phone", "whatsapp", "email"]),
  message: z.string().trim().min(10, "tooShort").max(2000, "tooLong"),
  /** Hidden anti-spam field: people never see it, bots fill it. Must stay empty. */
  website: z.string().max(0).optional(),
});

/** What the form holds while typing */
export type ContactFormInput = z.input<typeof contactSchema>;
/** What is sent to the dashboard after validation */
export type ContactMessage = z.output<typeof contactSchema> & { locale: "ar" | "en"; pageUrl?: string };
