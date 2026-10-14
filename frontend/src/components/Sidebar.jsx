import { useEffect, useRef, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ArrowLeftRight,
  ClipboardCheck,
  Settings,
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  ReceiptText,
  ArrowUpRight,
  ChevronRight,
  Layers,
} from "lucide-react";
import profLogo from "../../newprof.png";
import "./Sidebar.css";

const navigation = [
  { path: "/", label: "Overview", icon: LayoutDashboard },
  { path: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { path: "/batch", label: "Batch checker", icon: ClipboardCheck },
];

export default function Sidebar({ onMobileToggle, isMobileMenuOpen }) {
  const [collapsed, setCollapsed] = useState(false);
  const drawerRef = useRef(null);
  const toggleRef = useRef(null);

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const drawer = drawerRef.current;
    const toggle = toggleRef.current;
    const media = window.matchMedia("(max-width: 767px)");
    if (!media.matches) return;
    // Focus after the drawer becomes visible; its opening transition hides links initially.
    const focusTimer = setTimeout(() => {
      if (!drawer.contains(document.activeElement)) drawer.querySelector("a")?.focus();
    }, 250);
    const onKeyDown = (event) => {
      if (event.key === "Escape") onMobileToggle();
      if (event.key === "Tab") {
        const controls = [...drawer.querySelectorAll("a, button")].filter(
          (element) => element.getClientRects().length,
        );
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (!drawer.contains(document.activeElement)) {
          event.preventDefault();
          (event.shiftKey ? last : first)?.focus();
        } else if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      clearTimeout(focusTimer);
      document.removeEventListener("keydown", onKeyDown);
      toggle?.focus();
    };
  }, [isMobileMenuOpen, onMobileToggle]);

  const closeMobile = () => {
    if (isMobileMenuOpen) onMobileToggle();
  };
  return (
    <>
      <header className="mobile-brand-bar" inert={isMobileMenuOpen}>
        <button
          ref={toggleRef}
          className="shell-icon-button"
          onClick={onMobileToggle}
          aria-label={isMobileMenuOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={isMobileMenuOpen}
          aria-controls="main-sidebar"
        >
          <Menu size={20} />
        </button>
        <Link to="/" className="mobile-wordmark">
          <img className="mobile-brand-logo" src={profLogo} alt="ReceiPro" />
        </Link>
        <span className="mobile-workspace">Workspace</span>
      </header>
      {isMobileMenuOpen && (
        <button
          className="sidebar-backdrop"
          onClick={onMobileToggle}
          aria-label="Close navigation"
          tabIndex={-1}
        />
      )}
      <aside
        ref={drawerRef}
        id="main-sidebar"
        className={`app-sidebar ${collapsed ? "is-collapsed" : ""} ${isMobileMenuOpen ? "is-open" : ""}`}
        aria-label="Workspace sidebar"
      >
        <div className="sidebar-brand">
          <Link
            to="/"
            className="brand-link"
            aria-label="ReceiPro home"
            onClick={closeMobile}
          >
            <img className="brand-logo" src={profLogo} alt="ReceiPro" />
          </Link>
          <button
            className="shell-icon-button sidebar-collapse"
            onClick={() => setCollapsed((value) => !value)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <PanelLeftOpen size={17} />
            ) : (
              <PanelLeftClose size={17} />
            )}
          </button>
          <button
            className="shell-icon-button sidebar-mobile-close"
            onClick={onMobileToggle}
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
        </div>
        <div className="workspace-card">
          <span className="workspace-icon">
            <Layers size={18} />
          </span>
          <div className="sidebar-label">
            <strong>My workspace</strong>
            <small>Receipt management</small>
          </div>
        </div>
        <nav className="sidebar-navigation" aria-label="Main navigation">
          <p className="sidebar-section-label sidebar-label">WORKSPACE</p>
          {navigation.map(({ path, label, icon: NavIcon }) => (
            <NavLink
              key={path}
              to={path}
              end={path === "/"}
              onClick={closeMobile}
              className={({ isActive }) =>
                `sidebar-nav-link ${isActive ? "is-active" : ""}`
              }
              aria-label={label}
              title={collapsed ? label : undefined}
            >
              <NavIcon size={19} strokeWidth={1.8} />
              <span className="sidebar-label">{label}</span>
              <ChevronRight className="nav-chevron sidebar-label" size={15} />
            </NavLink>
          ))}
          <p className="sidebar-section-label sidebar-label preferences-label">
            PREFERENCES
          </p>
          <NavLink
            to="/settings"
            onClick={closeMobile}
            className={({ isActive }) =>
              `sidebar-nav-link ${isActive ? "is-active" : ""}`
            }
            aria-label="Settings"
            title={collapsed ? "Settings" : undefined}
          >
            <Settings size={19} strokeWidth={1.8} />
            <span className="sidebar-label">Settings</span>
          </NavLink>
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-tip sidebar-label">
            <span className="tip-icon">
              <ReceiptText size={19} />
            </span>
            <h3>
              Less paperwork.
              <br />
              More peace of mind.
            </h3>
            <p>Keep every receipt organized, from upload to verification.</p>
            <Link to="/batch" onClick={closeMobile}>
              Start a batch <ArrowUpRight size={15} />
            </Link>
          </div>
          <Link
            to="/settings"
            onClick={closeMobile}
            className="sidebar-profile"
            aria-label="Workspace settings"
          >
            <span className="profile-avatar">RP</span>
            <span className="sidebar-label profile-copy">
              <strong>My workspace</strong>
              <small>Manage preferences</small>
            </span>
            <Settings className="sidebar-label" size={16} />
          </Link>
          <span className="sidebar-version sidebar-label">
            ReceiPro · A little more organized
          </span>
        </div>
      </aside>
    </>
  );
}
