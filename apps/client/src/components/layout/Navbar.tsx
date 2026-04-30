import { useLocation } from "react-router-dom";
import { EducationFloatingIcons } from "@/components/shared/EducationFloatingIcons";
import { RoleBadge } from "@/components/ui/Badge";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { getNavPageMeta } from "@/utils/navPageMeta";

function IconSidebarToggle({ open }: { open: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M9 4v16" />
      {open ? <path d="M15 9l-4 3 4 3" /> : <path d="M13 9l4 3-4 3" />}
    </svg>
  );
}

type NavbarProps = {
  showSidebarToggle: boolean;
  onOpenSidebar: () => void;
};

export function Navbar({ showSidebarToggle, onOpenSidebar }: NavbarProps) {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const { title, subtitle } = getNavPageMeta(pathname);

  return (
    <header className="navbar">
      <EducationFloatingIcons placement="navbar" />
      <div className="navbar__left">
        {showSidebarToggle ? (
          <button
            type="button"
            className="navbar__toggle"
            onClick={onOpenSidebar}
            aria-controls="dashboard-sidebar"
            aria-expanded="false"
            aria-label="Sol paneli aç"
            title="Sol paneli aç"
          >
            <IconSidebarToggle open={false} />
          </button>
        ) : null}
        <div className="navbar__titles">
          <h1 className="navbar__title">{title}</h1>
          {subtitle ? <p className="navbar__subtitle">{subtitle}</p> : null}
        </div>
        {user ? <RoleBadge role={user.role} /> : null}
      </div>
      <div className="navbar__right">
        <ThemeToggle />
      </div>
    </header>
  );
}
