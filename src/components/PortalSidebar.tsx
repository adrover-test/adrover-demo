import { endDemoSession } from "../lib/portal";

type PortalPage =
  "dashboard" | "advertisements" | "payments" | "profile" | "create";

const items = [
  { section: "#overview", label: "Dashboard", icon: "▦" },
  {
    href: "advertisements.html",
    label: "My advertisements",
    icon: "▣",
    page: "advertisements",
  },
  {
    href: "payments.html",
    label: "Payments & history",
    icon: "₹",
    page: "payments",
  },
  { href: "profile.html", label: "Profile", icon: "○", page: "profile" },
] as const;

export function PortalSidebar({
  currentPage,
  activeSection,
  onNavigate,
}: {
  currentPage: PortalPage;
  activeSection: string;
  onNavigate?: (section: string) => void;
}) {
  return (
    <aside className="dashboard-sidebar" aria-label="Advertiser portal">
      <span className="dashboard-sidebar-label">ADVERTISER PORTAL</span>
      <nav className="dashboard-nav" aria-label="Dashboard navigation">
        {items.map((item) => {
          const href =
            "section" in item
              ? currentPage === "dashboard"
                ? item.section
                : `dashboard.html${item.section}`
              : item.href;
          const isActive =
            ("page" in item && item.page === currentPage) ||
            (currentPage === "dashboard" &&
              "section" in item &&
              item.section === activeSection);
          return (
            <a
              aria-current={isActive ? "page" : undefined}
              className={isActive ? "dashboard-nav-active" : undefined}
              href={href}
              key={item.label}
              onClick={() => {
                if (currentPage === "dashboard" && "section" in item)
                  onNavigate?.(item.section);
              }}
            >
              <span aria-hidden="true" className="dashboard-nav-icon">
                {item.icon}
              </span>
              {item.label}
            </a>
          );
        })}
      </nav>
      <div className="dashboard-account">
        <span aria-hidden="true" className="dashboard-avatar">
          DA
        </span>
        <span>
          <strong>Advertiser</strong>
          <small>Campaign workspace</small>
        </span>
      </div>
      <a
        className="dashboard-logout"
        href="login.html?signedOut=1"
        onClick={endDemoSession}
      >
        <span aria-hidden="true">↪</span>
        Sign out
      </a>
    </aside>
  );
}
