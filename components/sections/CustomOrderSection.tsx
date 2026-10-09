/**
 * PAGE BLOCK: "DESIGN YOUR PIECE" (custom_order) — numbered "how it works" steps + the custom-order form.
 * ------------------------------------------------------------------
 * The customer uploads photos of the piece and writes what they want → dashboard → "Customization requests".
 *
 * Where to edit:
 *   - Title, subtitle, steps, success message, show karat / budget -> dashboard → Site pages → the page → this block
 *     (test data without the dashboard: mock-data/pages/customize.json)
 *   - Field labels / errors (AR/EN)    -> i18n/dictionaries/*.json → "customOrder"
 *   - The form itself                  -> components/custom/CustomOrderForm.tsx
 * Logged-in customers get their name, phone and email filled in.
 */
import type { CustomOrderSection as CustomOrderSectionType } from "@/types";
import { api } from "@/lib/api";
import { getSession } from "@/lib/auth/session";
import { t } from "@/lib/format";
import { SectionTitle } from "@/components/common/SectionTitle";
import { CustomOrderForm } from "@/components/custom/CustomOrderForm";
import type { SectionProps } from "./types";

export async function CustomOrderSection({ section, locale, dict }: SectionProps<CustomOrderSectionType>) {
  const d = section.data;
  const session = await getSession();
  const customer = session ? await api.getCustomer(session).catch(() => null) : null;
  const steps = d.steps.map((s) => t(s, locale)).filter(Boolean);

  return (
    <section id="custom-order" className="mx-auto max-w-5xl scroll-mt-24 px-6 py-16">
      <div className="mx-auto mb-10 max-w-2xl text-center">
        <SectionTitle title={t(d.title, locale)} center />
        {d.subtitle && <p className="-mt-2 text-muted-foreground">{t(d.subtitle, locale)}</p>}
      </div>

      {/* How it works */}
      {steps.length > 0 && (
        <ol className="mb-8 grid gap-3" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, 200px), 1fr))` }}>
          {steps.map((step, i) => (
            <li key={i} className="flex items-center gap-3 rounded-xl border bg-secondary/40 p-4">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">{i + 1}</span>
              <span className="text-sm font-medium">{step}</span>
            </li>
          ))}
        </ol>
      )}

      <CustomOrderForm
        locale={locale}
        labels={dict.customOrder}
        customer={customer ? { name: `${customer.firstName} ${customer.lastName ?? ""}`.trim(), phone: customer.phone, email: customer.email } : null}
        successMessage={t(d.successMessage, locale)}
        showKarat={d.showKarat}
        showBudget={d.showBudget}
      />
    </section>
  );
}
