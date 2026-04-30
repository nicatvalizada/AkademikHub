import type { InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export function Input({ label, id, error, className = "", ...rest }: Props) {
  const inputId = id ?? label.replace(/\s+/g, "-").toLowerCase();
  return (
    <label className={`field ${className}`.trim()} htmlFor={inputId}>
      <span className="field__label">{label}</span>
      <input
        id={inputId}
        className={`field__input ${error ? "field__input--error" : ""}`.trim()}
        {...rest}
      />
      {error ? <span className="field__error">{error}</span> : null}
    </label>
  );
}
