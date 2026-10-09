/**
 * ACCOUNT LAYOUT — wraps every page under /[locale]/account:
 * side menu (components/account/AccountNav.tsx) + the page on the other side.
 * Each account page checks the login itself (requireSession) and sends logged-out visitors to /login.
 */
import type { Locale } from "@/types";
import { getDictionary } from "@/i18n/get-dictionary";
import { AccountNav } from "@/components/account/AccountNav";

export default async function AccountLayout({ children, params }: LayoutProps<"/[locale]/account">) {
  const locale = (await params).locale as Locale;
  const dict = await getDictionary(locale);

  return (
    <div className="mx-auto grid max-w-7xl gap-8 px-6 py-10 lg:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="lg:sticky lg:top-24 lg:h-fit">
        <AccountNav locale={locale} labels={dict.account.nav} />
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
