/**
 * PAGE SHELL — gives simple pages the same width, padding and title style.
 *   - Max page width -> "max-w-7xl"   - Title size -> "text-3xl"
 */
export function PageShell({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <h1 className="mb-6 text-3xl font-bold">{title}</h1>
      {children}
    </div>
  );
}
