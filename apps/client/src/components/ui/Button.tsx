import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "outline" | "ghost";

const variants: Record<Variant, string> = {
  primary:
    "btn btn--primary shadow-[0_10px_30px_-10px_rgba(59,130,246,0.65)]",
  secondary: "btn btn--secondary",
  outline: "btn btn--outline",
  ghost: "btn btn--ghost",
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  children: ReactNode;
  loading?: boolean;
};

export function Button({
  variant = "primary",
  className = "",
  children,
  loading,
  disabled,
  type = "button",
  ...rest
}: Props) {
  return (
    <button
      type={type}
      className={`${variants[variant]} ${className}`.trim()}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? "Gözləyin…" : children}
    </button>
  );
}
