/**
 * The muted rule marking the start of a unit's nodes:
 * `──── Unit title ────`, as in the reference.
 */
export default function UnitSeparator({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-4 py-6">
      <span className="h-0.5 flex-1 bg-duo-border" aria-hidden="true" />
      <h3 className="text-center text-[19px] font-bold text-duo-muted">
        {title}
      </h3>
      <span className="h-0.5 flex-1 bg-duo-border" aria-hidden="true" />
    </div>
  );
}
