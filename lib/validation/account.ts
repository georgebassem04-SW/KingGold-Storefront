/**
 * ACCOUNT FORM RULES (Zod) — sign up, log in, profile, password, address.
 * Used in the browser (errors under fields) and again on the server (app/api/auth/*, app/api/account/*).
 * Error messages are codes, turned into AR/EN text from i18n/dictionaries/*.json -> "auth.errors".
 */
import { z } from "zod";
import { normalizeDigits } from "./contact";

const name = z.string().trim().min(2, "tooShort").max(40, "tooLong");
const email = z.string().trim().toLowerCase().email("invalidEmail");
export const phoneField = z
  .string()
  .trim()
  .transform(normalizeDigits)
  .refine((v) => /^\+?[\d\s-]{7,20}$/.test(v) && v.replace(/\D/g, "").length >= 7 && v.replace(/\D/g, "").length <= 15, "invalidPhone");
/** At least 8 characters with a letter and a number */
const password = z
  .string()
  .min(8, "passwordShort")
  .max(100, "tooLong")
  .refine((v) => /[A-Za-z؀-ۿ]/.test(v) && /\d/.test(v), "passwordWeak");

export const registerSchema = z
  .object({
    firstName: name,
    lastName: name,
    email,
    phone: phoneField,
    password,
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, { path: ["confirmPassword"], message: "passwordMismatch", when: () => true });

export const loginSchema = z.object({ email, password: z.string().min(1, "required") });

export const profileSchema = z.object({
  firstName: name,
  lastName: name,
  email,
  // Google sign-ups may not have a phone yet
  phone: z.union([z.literal(""), phoneField]),
  birthDate: z.union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "invalidDate")]).optional(),
  marketingOptIn: z.boolean(),
});

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().optional(),
    newPassword: password,
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, { path: ["confirmPassword"], message: "passwordMismatch", when: () => true });

export const addressSchema = z.object({
  label: z.string().trim().min(1, "required").max(30, "tooLong"),
  fullName: name.max(80, "tooLong"),
  phone: phoneField,
  shippingZoneId: z.string().min(1, "required"),
  city: z.string().trim().min(2, "required").max(60, "tooLong"),
  area: z.string().trim().max(60, "tooLong").optional(),
  street: z.string().trim().min(3, "required").max(160, "tooLong"),
  building: z.string().trim().max(80, "tooLong").optional(),
  notes: z.string().trim().max(200, "tooLong").optional(),
  isDefault: z.boolean(),
});

export type RegisterInput = z.input<typeof registerSchema>;
export type LoginInput = z.input<typeof loginSchema>;
export type ProfileFormInput = z.input<typeof profileSchema>;
export type PasswordChangeInput = z.input<typeof passwordChangeSchema>;
export type AddressFormInput = z.input<typeof addressSchema>;

/** field -> error code, for sending validation errors back to the form */
export const zodErrors = (error: z.ZodError) => Object.fromEntries(error.issues.map((i) => [String(i.path[0]), i.message]));
