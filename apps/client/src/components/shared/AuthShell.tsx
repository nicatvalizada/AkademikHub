import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { AkademikLogo } from "./AkademikLogo";
import { EducationFloatingIcons } from "./EducationFloatingIcons";
import { ThemeToggle } from "./ThemeToggle";

type Props = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export function AuthShell({ title, subtitle, children }: Props) {
  return (
    <div className="auth-page">
      <EducationFloatingIcons placement="auth" />
      <Link to="/" className="auth-page__brand" aria-label="Akademik Hub — ana səhifə">
        <AkademikLogo size="compact" />
        <span className="auth-page__brand-text">Akademik Hub</span>
      </Link>
      <div className="auth-page__chrome">
        <ThemeToggle />
      </div>
      <div className="auth-grid">
        <section className="auth-welcome animate-slide-up">
          <h1 className="auth-welcome__title">{title}</h1>
          {subtitle ? <p className="auth-welcome__subtitle">{subtitle}</p> : null}
        </section>
        {children}
      </div>
    </div>
  );
}
