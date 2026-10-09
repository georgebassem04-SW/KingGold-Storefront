/** Centered card used by the login and sign-up pages */
export function AuthCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-md px-6 py-14">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="mt-2 text-muted-foreground">{subtitle}</p>
      </div>
      <div className="rounded-xl border p-6 md:p-8">{children}</div>
    </div>
  );
}
