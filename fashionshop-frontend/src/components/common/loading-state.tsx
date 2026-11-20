export function LoadingState({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="mx-auto my-8 max-w-3xl rounded-xl border border-outline-variant/60 bg-surface-container-lowest px-6 py-10">
      <div className="space-y-4">
        <div className="h-5 w-40 animate-pulse rounded-md bg-surface-container" />
        <div className="h-4 w-full animate-pulse rounded-md bg-surface-container" />
        <div className="h-4 w-5/6 animate-pulse rounded-md bg-surface-container" />
        <p className="pt-1 font-label text-[11px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
          {label}…
        </p>
      </div>
    </div>
  );
}
