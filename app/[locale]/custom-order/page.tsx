/**
 * OLD ADDRESS: /[locale]/custom-order → /[locale]/pages/customize
 * The "Design your piece" page is now a normal site page built in the dashboard (Site pages → "customize"),
 * with the "Design your piece" form block. This file only keeps old links working.
 */
import { permanentRedirect } from "next/navigation";

export default async function CustomOrderRedirect({ params }: PageProps<"/[locale]/custom-order">) {
  permanentRedirect(`/${(await params).locale}/pages/customize`);
}
