/**
 * 404 PAGE — shown when a URL doesn't exist.
 */
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-6 py-24 text-center">
      <h1 className="mb-4 text-3xl font-bold">404</h1>
      <p className="mb-6 text-muted-foreground">Page not found · الصفحة غير موجودة</p>
      <Link href="/" className="text-primary hover:underline">
        Home · الرئيسية
      </Link>
    </div>
  );
}
