import { useEffect, useState } from "react";

type Theme = "dark" | "light";

function readTheme(): Theme {
  const saved = localStorage.getItem("akademik-theme") as Theme | null;
  if (saved === "light" || saved === "dark") return saved;
  return "dark";
}

function IconSun() {
  return (
    <svg
      className="theme-toggle__icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

function IconMoon() {
  return (
    <svg
      className="theme-toggle__icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
    </svg>
  );
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => readTheme());

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("akademik-theme", theme);
  }, [theme]);

  const nextLabel =
    theme === "dark" ? "İşıqlı rejimə keçid" : "Qaranlıq rejimə keçid";

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
      aria-label={nextLabel}
      title={nextLabel}
    >
      {theme === "dark" ? <IconSun /> : <IconMoon />}
    </button>
  );
}
