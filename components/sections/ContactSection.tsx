/**
 * PAGE BLOCK: CONTACT — contact channels card + contact form, side by side.
 * ------------------------------------------------------------------
 * Where to edit:
 *   - Title, subtitle, subject options, success message,
 *     show/hide the channels card or the branch dropdown -> page JSON (block "contact")
 *   - Phone, WhatsApp, email, address, service hours    -> config/clients/demo.ts -> contact
 *     (later: GET /storefront/settings from the dashboard)
 *   - Social links                                       -> config/clients/demo.ts -> social
 *   - Labels (AR/EN)                                     -> i18n/dictionaries/*.json -> "contact"
 *   - The form itself                                    -> ContactForm.tsx
 */
import type { ReactNode } from "react";
import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { FaFacebookF, FaInstagram, FaSnapchat, FaTiktok, FaXTwitter, FaYoutube } from "react-icons/fa6";
import type { ContactSection as ContactSectionType } from "@/types";
import { api } from "@/lib/api";
import { getStoreContact } from "@/lib/store-contact";
import { t } from "@/lib/format";
import { cn } from "@/lib/utils";
import { SectionTitle } from "@/components/common/SectionTitle";
import { ContactForm } from "./ContactForm";
import type { SectionProps } from "./types";

const SOCIAL_ICONS = { instagram: FaInstagram, facebook: FaFacebookF, tiktok: FaTiktok, x: FaXTwitter, youtube: FaYoutube, snapchat: FaSnapchat };

/** "+20 100 123 4567" -> "201001234567" for wa.me and tel: links */
const digitsOnly = (v: string) => v.replace(/\D/g, "");

export async function ContactSection({ section, locale, dict }: SectionProps<ContactSectionType>) {
  const d = section.data;
  const labels = dict.contact;
  // Dashboard → Settings → Store details (default: config/clients/<client>.ts)
  const { contact, social } = await getStoreContact();
  const branches = d.showBranchSelect ? await api.getBranches() : [];

  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <div className="mx-auto mb-10 max-w-2xl text-center">
        <SectionTitle title={t(d.title, locale)} center />
        {d.subtitle && <p className="-mt-2 text-muted-foreground">{t(d.subtitle, locale)}</p>}
      </div>

      <div className={cn("grid gap-8", d.showContactInfo && "lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]")}>
        {/* ===== CONTACT CHANNELS CARD ===== */}
        {d.showContactInfo && (
          <aside className="h-fit space-y-6 rounded-xl bg-secondary p-6 md:p-8">
            <h3 className="text-xl font-semibold">{labels.info.title}</h3>
            <ul className="space-y-5">
              <InfoRow icon={<Phone />} label={labels.info.call}>
                <a href={`tel:+${digitsOnly(contact.phone)}`} dir="ltr" className="hover:text-primary">
                  {contact.phone}
                </a>
              </InfoRow>
              {contact.whatsapp && (
                <InfoRow icon={<MessageCircle />} label={labels.info.whatsapp}>
                  <a href={`https://wa.me/${digitsOnly(contact.whatsapp)}`} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">
                    {labels.info.chatNow}
                  </a>
                </InfoRow>
              )}
              <InfoRow icon={<Mail />} label={labels.info.email}>
                <a href={`mailto:${contact.email}`} className="break-all hover:text-primary">
                  {contact.email}
                </a>
              </InfoRow>
              {contact.address && (
                <InfoRow icon={<MapPin />} label={labels.info.address}>
                  {t(contact.address, locale)}
                </InfoRow>
              )}
              {contact.hours && (
                <InfoRow icon={<Clock />} label={labels.info.hours}>
                  {t(contact.hours, locale)}
                </InfoRow>
              )}
            </ul>

            {/* Social links: only networks with a link (dashboard → Settings → Store details) are shown */}
            {social && Object.keys(social).length > 0 && (
              <div>
                <p className="mb-3 text-sm font-medium">{labels.info.follow}</p>
                <div className="flex gap-2">
                  {(Object.entries(social) as [keyof typeof SOCIAL_ICONS, string][]).map(([network, url]) => {
                    const Icon = SOCIAL_ICONS[network];
                    return (
                      <a
                        key={network}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={network}
                        className="flex size-9 items-center justify-center rounded-full bg-background text-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
                      >
                        <Icon />
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </aside>
        )}

        {/* ===== FORM ===== (runs in the browser) */}
        <ContactForm
          locale={locale}
          labels={labels}
          subjects={d.subjects.map((s) => ({ value: s.value, label: t(s.label, locale) }))}
          branches={branches.map((b) => ({ id: b.id, name: t(b.name, locale) }))}
          successMessage={t(d.successMessage, locale)}
        />
      </div>
    </section>
  );
}

function InfoRow({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <li className="flex gap-4">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-background text-primary [&_svg]:size-5">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className="mt-0.5">{children}</div>
      </div>
    </li>
  );
}
