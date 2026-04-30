export function Spinner({ label = "Yüklənir" }: { label?: string }) {
  return (
    <span className="spinner" role="status" aria-label={label}>
      <span className="spinner__ring" />
    </span>
  );
}
