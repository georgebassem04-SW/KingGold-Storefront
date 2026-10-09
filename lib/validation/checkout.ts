/**
 * CHECKOUT FORM RULES (Zod) — used in the browser (errors under each field) AND on the server
 * (app/api/checkout/order/route.ts re-checks everything before the order reaches the dashboard).
 *
 * Error messages are CODES; the page turns them into Arabic/English text from
 * i18n/dictionaries/*.json -> "checkout.errors".
 *
 * Rules that depend on the choice:
 *   - delivery     -> governorate (shipping zone), city and street are required
 *   - store_pickup -> a branch is required
 */
import { z } from "zod";
import { normalizeDigits } from "./contact";

const phone = z
  .string()
  .trim()
  .transform(normalizeDigits)
  .refine((v) => /^\+?[\d\s-]{7,20}$/.test(v) && v.replace(/\D/g, "").length >= 7 && v.replace(/\D/g, "").length <= 15, "invalidPhone");

export const checkoutFormSchema = z
  .object({
    // Contact
    name: z.string().trim().min(3, "tooShort").max(80, "tooLong"),
    phone,
    email: z.union([z.literal(""), z.string().trim().email("invalidEmail")]),

    // Delivery
    deliveryMethod: z.enum(["delivery", "store_pickup"]),
    shippingZoneId: z.string().optional(),
    city: z.string().trim().max(60, "tooLong").optional(),
    area: z.string().trim().max(60, "tooLong").optional(),
    street: z.string().trim().max(160, "tooLong").optional(),
    building: z.string().trim().max(80, "tooLong").optional(),
    addressNotes: z.string().trim().max(200, "tooLong").optional(),
    pickupBranchId: z.string().optional(),

    // Payment & extras
    paymentMethodId: z.string().min(1, "choosePayment"),
    couponCode: z.string().trim().max(30).optional(),
    notes: z.string().trim().max(500, "tooLong").optional(),
    acceptTerms: z.literal(true, { message: "acceptTerms" }),
    /** Logged-in customers: save the new delivery address to their account */
    saveAddress: z.boolean().optional(),
  })
  .superRefine((v, ctx) => {
    if (!v || typeof v !== "object") return;
    if (v.deliveryMethod === "delivery") {
      if (!v.shippingZoneId) ctx.addIssue({ code: "custom", path: ["shippingZoneId"], message: "required" });
      if (!v.city || v.city.length < 2) ctx.addIssue({ code: "custom", path: ["city"], message: "required" });
      if (!v.street || v.street.length < 3) ctx.addIssue({ code: "custom", path: ["street"], message: "required" });
    } else if (!v.pickupBranchId) {
      ctx.addIssue({ code: "custom", path: ["pickupBranchId"], message: "chooseBranch" });
    }
    // `when: () => true` = run these checks even if other fields have errors,
    // so the customer sees ALL missing fields at once
  }, { when: () => true });

export type CheckoutFormInput = z.input<typeof checkoutFormSchema>;
export type CheckoutFormValues = z.output<typeof checkoutFormSchema>;

/** Cart items sent with the order (prices are NOT trusted from the browser — only ids and quantities) */
export const cartItemsSchema = z
  .array(z.object({ variantId: z.string().min(1), quantity: z.number().int().min(1).max(99) }))
  .min(1)
  .max(50);
