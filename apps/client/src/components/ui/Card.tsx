import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
};

export function Card({ children, className = "", title, subtitle }: Props) {
  return (
    <section className={`card animate-slide-up ${className}`.trim()}>
      {title ? (
        <header className="card__head">
          <h2 className="card__title">{title}</h2>
          {subtitle ? <p className="card__sub">{subtitle}</p> : null}
        </header>
      ) : null}
      <div className="card__body">{children}</div>
    </section>
  );
}
