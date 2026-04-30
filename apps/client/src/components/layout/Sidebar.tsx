import {
  DEFAULT_USER_PROFILE_COLOR,
  type UserRole,
} from "@akademik/shared";
import { useEffect, useRef, useState } from "react";
import { NavLink, Link, useLocation, useNavigate } from "react-router-dom";
import { AkademikLogo } from "@/components/shared/AkademikLogo";
import { useAuth } from "@/hooks/useAuth";
import { ProfileSettingsModal } from "./ProfileSettingsModal";

type Item = { to: string; label: string; icon: React.ReactNode; roles?: UserRole[] };

function IconDashboard() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}
function IconArticles() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
      <path d="M8 7h8M8 11h8M8 15h5" />
    </svg>
  );
}
function IconArchive() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="21 8 21 21 3 21 3 8" />
      <rect x="1" y="3" width="22" height="5" />
      <line x1="10" y1="12" x2="14" y2="12" />
    </svg>
  );
}
function IconTrash() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v5M14 11v5" />
    </svg>
  );
}
function IconSettings() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 005 15.08a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 008.92 5a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.49a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019 8.92a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.49A1.65 1.65 0 0019.4 15z" />
    </svg>
  );
}
function IconTests() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}
function IconComponents() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="2" y="2" width="8" height="8" rx="2" />
      <rect x="14" y="2" width="8" height="8" rx="2" />
      <rect x="2" y="14" width="8" height="8" rx="2" />
      <path d="M18 14v8M14 18h8" />
    </svg>
  );
}
function IconLeaderboard() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M7 3h10v4.5A5 5 0 0112 12a5 5 0 01-5-4.5V3z" />
      <path d="M7 5H4.5A1.5 1.5 0 003 6.5 4.5 4.5 0 007.5 11H8" />
      <path d="M17 5h2.5A1.5 1.5 0 0121 6.5 4.5 4.5 0 0116.5 11H16" />
      <path d="M12 12v4" />
      <path d="M9.5 16h5v3h-5z" />
      <path d="M8.5 21h7" />
    </svg>
  );
}
function IconElectro() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

const mainItems: Item[] = [
  { to: "/app/dashboard", label: "İdarə paneli", icon: <IconDashboard /> },
  { to: "/app/articles", label: "Məqalələr", icon: <IconArticles /> },
  { to: "/app/tests", label: "Testlər", icon: <IconTests /> },
];

const archiveItem: Item = { to: "/app/articles/archive", label: "Arxiv", icon: <IconArchive /> };
const myArticlesItem: Item = { to: "/app/articles/mine", label: "Mənim məqalələrim", icon: <IconArticles /> };
const trashItem: Item = { to: "/app/articles/trash", label: "Zibil qutusu", icon: <IconTrash /> };

const electroItems: Item[] = [
  { to: "/app/components", label: "Komponentlər", icon: <IconComponents /> },
];

const analyticsItems: Item[] = [
  { to: "/app/leaderboard", label: "Lider lövhəsi", icon: <IconLeaderboard /> },
];

const adminItems: Item[] = [
  { to: "/app/electro", label: "Elektro (tədqiqat)", icon: <IconElectro />, roles: ["researcher"] },
];

const roleLabelAz: Record<UserRole, string> = {
  student: "Tələbə",
  teacher: "Müəllim",
  researcher: "Tədqiqatçı",
};

function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

function NavBlock({
  label,
  items,
  role,
  onNavigate,
}: {
  label: string;
  items: Item[];
  role?: UserRole;
  onNavigate?: () => void;
}) {
  const { pathname } = useLocation();
  const visible = items.filter((i) => !i.roles || (role && i.roles.includes(role)));
  if (visible.length === 0) return null;
  return (
    <div className="sidebar__section">
      <p className="sidebar__section-label">{label}</p>
      <nav className="sidebar__nav" aria-label={label}>
        {visible.map((i) => (
          <NavLink
            key={i.to}
            to={i.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              `sidebar__link${
                i.to === "/app/articles" &&
                (pathname.startsWith("/app/articles/archive") ||
                  pathname.startsWith("/app/articles/trash") ||
                  pathname.startsWith("/app/articles/mine"))
                  ? ""
                  : isActive
                    ? " sidebar__link--active"
                    : ""
              }`
            }
          >
            <span className="sidebar__link-icon">{i.icon}</span>
            <span className="sidebar__link-text">{i.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

type SidebarProps = {
  isDesktop: boolean;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
};

export function Sidebar({ isDesktop, isOpen, onOpen, onClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isProfileSettingsOpen, setIsProfileSettingsOpen] = useState(false);
  const footerWrapRef = useRef<HTMLDivElement | null>(null);
  const role = user?.role;
  const isCollapsed = isDesktop && !isOpen;

  function handleNavigate() {
    setIsProfileMenuOpen(false);
    if (!isDesktop) {
      onClose();
    }
  }

  useEffect(() => {
    setIsProfileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isOpen || isCollapsed) {
      setIsProfileMenuOpen(false);
    }
  }, [isCollapsed, isOpen]);

  useEffect(() => {
    if (!isProfileMenuOpen) {
      return undefined;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!footerWrapRef.current) {
        return;
      }

      if (!footerWrapRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [isProfileMenuOpen]);

  async function onLogout() {
    await logout();
    setIsProfileMenuOpen(false);
    onClose();
    navigate("/login", { replace: true });
  }

  return (
    <aside
      id="dashboard-sidebar"
      className={`sidebar${isOpen ? " sidebar--open" : ""}${isCollapsed ? " sidebar--collapsed" : ""}`}
      aria-hidden={!isDesktop && !isOpen ? true : undefined}
    >
      <div className="sidebar__top">
        {isCollapsed ? (
          <button
            type="button"
            className="sidebar__dock-toggle"
            onClick={onOpen}
            aria-label="Paneli aç"
            title="Paneli aç"
          >
            <span className="sidebar__dock-logo" aria-hidden>
              <AkademikLogo size="compact" />
            </span>
            <span className="sidebar__dock-icon" aria-hidden>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 6l6 6-6 6" />
              </svg>
            </span>
          </button>
        ) : (
          <>
            <Link
              to="/app/dashboard"
              className="sidebar__brand"
              aria-label="İdarə paneli — Akademik Hub"
              onClick={handleNavigate}
            >
              <AkademikLogo size="compact" />
              <span className="sidebar__brand-text">
                <span className="sidebar__brand-name">Akademik</span>
                <span className="sidebar__brand-sub">Hub</span>
              </span>
            </Link>
            <button
              type="button"
              className="sidebar__collapse"
              onClick={onClose}
              aria-label="Paneli bağla"
              title="Paneli bağla"
            >
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
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
          </>
        )}
      </div>

      <NavBlock label="Əsas" items={mainItems} role={role} onNavigate={handleNavigate} />
      {!isCollapsed ? <NavBlock label="Resurslar" items={electroItems} role={role} onNavigate={handleNavigate} /> : null}
      {!isCollapsed ? <NavBlock label="Analitika" items={analyticsItems} role={role} onNavigate={handleNavigate} /> : null}
      <NavBlock label="İdarəetmə" items={adminItems} role={role} onNavigate={handleNavigate} />

      <div className="sidebar__spacer" />

      <div className="sidebar__footer-nav">
        <NavLink
          to={archiveItem.to}
          onClick={handleNavigate}
          className={({ isActive }) =>
            `sidebar__link sidebar__footer-link${isActive ? " sidebar__link--active" : ""}`
          }
        >
          <span className="sidebar__link-icon">{archiveItem.icon}</span>
          <span className="sidebar__link-text">{archiveItem.label}</span>
        </NavLink>
      </div>

      {user ? (
        <div ref={footerWrapRef} className="sidebar__footer-wrap">
          {isProfileMenuOpen ? (
            <div className="sidebar__profile-menu">
              <NavLink
                to={myArticlesItem.to}
                onClick={handleNavigate}
                className="sidebar__profile-menu-item"
              >
                <span className="sidebar__link-icon">{myArticlesItem.icon}</span>
                <span>{myArticlesItem.label}</span>
              </NavLink>
              <button
                type="button"
                className="sidebar__profile-menu-item"
                onClick={() => {
                  setIsProfileMenuOpen(false);
                  setIsProfileSettingsOpen(true);
                }}
              >
                <span className="sidebar__link-icon"><IconSettings /></span>
                <span>Profil ayarları</span>
              </button>
              <NavLink
                to={trashItem.to}
                onClick={handleNavigate}
                className="sidebar__profile-menu-item"
              >
                <span className="sidebar__link-icon">{trashItem.icon}</span>
                <span>{trashItem.label}</span>
              </NavLink>
            </div>
          ) : null}
          <div className="sidebar__footer">
            <button
              type="button"
              className="sidebar__profile-trigger"
              onClick={() => setIsProfileMenuOpen((current) => !current)}
              aria-expanded={isProfileMenuOpen}
            >
              <span
                className="sidebar__avatar"
                aria-hidden
                style={{ background: user.profileColor ?? DEFAULT_USER_PROFILE_COLOR }}
              >
                {initials(user.name)}
              </span>
              <span className="sidebar__user-meta">
                <span className="sidebar__user-name">{user.name}</span>
                <span className="sidebar__user-role">{role ? roleLabelAz[role] : ""}</span>
              </span>
            </button>
            <button
              type="button"
              className="sidebar__logout"
              onClick={onLogout}
              aria-label="Çıxış"
              title="Çıxış"
            >
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
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                <path d="M16 17l5-5-5-5M21 12H9" />
              </svg>
            </button>
          </div>
        </div>
      ) : null}
      {user ? (
        <ProfileSettingsModal
          open={isProfileSettingsOpen}
          user={user}
          onClose={() => setIsProfileSettingsOpen(false)}
        />
      ) : null}
    </aside>
  );
}
