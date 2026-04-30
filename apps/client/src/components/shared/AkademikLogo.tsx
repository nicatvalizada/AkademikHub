type LogoSize = "default" | "compact";

export function AkademikLogo({
  className = "",
  size = "default",
}: {
  className?: string;
  size?: LogoSize;
}) {
  return (
    <div
      className={`akademik-logo${size === "compact" ? " akademik-logo--compact" : ""} ${className}`.trim()}
      aria-hidden
    >
      <svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect
          x="2"
          y="2"
          width="52"
          height="52"
          rx="14"
          className="akademik-logo__frame"
          strokeWidth="2"
        />
        <path
          d="M28 8v6M28 42v6"
          className="akademik-logo__spine"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M16 38L28 14l12 24M20 30h16"
          className="akademik-logo__a"
          strokeWidth="2.25"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    </div>
  );
}
