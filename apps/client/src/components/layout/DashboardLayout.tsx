import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";

const DESKTOP_MEDIA_QUERY = "(min-width: 901px)";
const DESKTOP_SIDEBAR_STORAGE_KEY = "akademik:desktop-sidebar-open";

function getIsDesktop() {
  return typeof window !== "undefined" && window.matchMedia(DESKTOP_MEDIA_QUERY).matches;
}

function getStoredDesktopSidebarOpen() {
  if (typeof window === "undefined") {
    return true;
  }

  return window.localStorage.getItem(DESKTOP_SIDEBAR_STORAGE_KEY) !== "false";
}

export function DashboardLayout() {
  const { pathname } = useLocation();
  const [isDesktop, setIsDesktop] = useState(getIsDesktop);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(getStoredDesktopSidebarOpen);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(
      DESKTOP_SIDEBAR_STORAGE_KEY,
      String(isDesktopSidebarOpen),
    );
  }, [isDesktopSidebarOpen]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const media = window.matchMedia(DESKTOP_MEDIA_QUERY);
    const onChange = (event: MediaQueryListEvent) => {
      setIsDesktop(event.matches);
    };

    setIsDesktop(media.matches);
    media.addEventListener("change", onChange);

    return () => {
      media.removeEventListener("change", onChange);
    };
  }, []);

  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (typeof document === "undefined" || isDesktop) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = isMobileSidebarOpen ? "hidden" : previousOverflow;

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isDesktop, isMobileSidebarOpen]);

  const isSidebarOpen = isDesktop ? isDesktopSidebarOpen : isMobileSidebarOpen;
  const shellClassName = [
    "shell",
    isDesktop && !isDesktopSidebarOpen ? "shell--sidebar-collapsed" : "",
    !isDesktop && isMobileSidebarOpen ? "shell--sidebar-mobile-open" : "",
  ]
    .filter(Boolean)
    .join(" ");

  function closeSidebar() {
    if (isDesktop) {
      setIsDesktopSidebarOpen(false);
      return;
    }

    setIsMobileSidebarOpen(false);
  }

  function openSidebar() {
    if (isDesktop) {
      setIsDesktopSidebarOpen(true);
      return;
    }

    setIsMobileSidebarOpen(true);
  }

  return (
    <div className={shellClassName}>
      <Sidebar
        isDesktop={isDesktop}
        isOpen={isSidebarOpen}
        onOpen={openSidebar}
        onClose={closeSidebar}
      />
      <button
        type="button"
        className="shell__backdrop"
        onClick={closeSidebar}
        aria-label="Yan paneli bağla"
      />
      <div className="main main--dashboard">
        <div className="main--dashboard__surface">
          <Navbar
            showSidebarToggle={!isDesktop && !isSidebarOpen}
            onOpenSidebar={openSidebar}
          />
          <div className="content">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
