import { useLayoutEffect, type ReactNode } from "react";
import { endDemoSession } from "../lib/portal";
import { endAdminSession } from "../lib/admin";
import { AdPageEntrance } from "./AdPageEntrance";
import { CabCursor } from "./CabCursor";

const navigation = [
  ["index.html", "Home"],
  ["pricing.html", "Pricing"],
  ["register.html", "Register"],
  ["contact.html", "Contact us"],
  ["login.html", "Log in"],
] as const;

function Logo() {
  return (
    <a className="logo" href="index.html" aria-label="Adrover home">
      <svg viewBox="0 0 40 40" aria-hidden="true">
        <path d="M0 37 14 2h12l14 35H28L20 14 12 37Z" fill="#ffd21c" />
        <path d="M18 25h4l3 8H15Z" fill="#101814" />
      </svg>
      <span>
        adrover<i>.</i>
      </span>
    </a>
  );
}

export function Layout({
  currentPage,
  children,
}: {
  currentPage: string;
  children: ReactNode;
}) {
  useLayoutEffect(() => {
    // The initial fragment lookup can run before React mounts the section.
    const target = document.getElementById(window.location.hash.slice(1));
    target?.scrollIntoView({ behavior: "instant" });
  }, []);

  const isLanding = currentPage === "index.html";
  const isAdmin = currentPage === "admin.html";
  const isPortal =
    isAdmin ||
    [
      "dashboard.html",
      "advertisements.html",
      "view-ad.html",
      "payments.html",
      "profile.html",
      "create-ad.html",
    ].includes(currentPage);
  const links = navigation.map(([href, label]) => (
    <a
      key={href}
      className={
        href === "login.html" ? "button ghost small nav-login-button" : undefined
      }
      href={href}
      aria-current={currentPage === href ? "page" : undefined}
    >
      {label}
    </a>
  ));
  return (
    <>
      <AdPageEntrance />
      <CabCursor />
      <a className="skip" href="#main">
        Skip to content
      </a>
      {isPortal ? (
        <header className="portal-topbar wrap">
          <Logo />
          <div className="portal-topbar-info">
            <span className="portal-topbar-badge">
              <span aria-hidden="true" />
              {isAdmin ? "Website admin" : "Advertiser portal"}
            </span>
            <a href="index.html">View public website</a>
            <a
              className="portal-exit"
              href={
                isAdmin
                  ? "admin-login.html?signedOut=1"
                  : "login.html?signedOut=1"
              }
              onClick={isAdmin ? endAdminSession : endDemoSession}
            >
              Sign out
            </a>
          </div>
        </header>
      ) : (
        <header className="nav wrap">
          <Logo />
          <nav className="links" aria-label="Main navigation">
            {links}
          </nav>
          <a className="button yellow small" href="pricing.html#planner">
            Plan your campaign
          </a>
          <details className="mobile-menu">
            <summary aria-label="Open navigation">Menu &#9776;</summary>
            <nav
              aria-label="Mobile navigation"
              onClick={(event) => {
                if (
                  event.target instanceof Element &&
                  event.target.closest("a")
                ) {
                  event.currentTarget
                    .closest("details")
                    ?.removeAttribute("open");
                }
              }}
            >
              {links}
            </nav>
          </details>
        </header>
      )}
      <main id="main">{children}</main>
      <footer className={isLanding ? "landing-footer" : undefined}>
        <div className="wrap">
          <div
            className={`footer-main${isLanding ? " landing-footer-grid" : ""}`}
          >
            <div>
              <Logo />
              {isLanding && (
                <h2 className="footer-tagline">Take Your Brand Everywhere.</h2>
              )}
              <p>
                {isLanding ? (
                  <>
                    Explore smart in-cab screen advertising for Hyderabad
                    businesses. Connect your brand with passengers on their
                    daily journeys.
                  </>
                ) : (
                  <>
                    Brands Move People.
                    <br />
                    Digital screens inside cabs and buses. Hyderabad, first.
                  </>
                )}
              </p>
            </div>
            <nav className="footer-links" aria-label="Footer navigation">
              {isLanding && (
                <h2 className="footer-column-heading">Quick links</h2>
              )}
              <a href="login.html">Login</a>
              <a
                href="faq.html"
                aria-current={currentPage === "faq.html" ? "page" : undefined}
              >
                FAQ
              </a>
              <a href={isLanding ? "#upload" : "index.html#upload"}>
                How it works
              </a>
              <a href="contact.html">Contact us</a>
            </nav>
            {isLanding && (
              <section
                className="footer-operations"
                aria-labelledby="operations-heading"
              >
                <h2 className="footer-column-heading" id="operations-heading">
                  Hyderabad operations HQ
                </h2>
                <address>
                  <div>
                    <span>Email</span>
                    <a href="mailto:admin@adrover.in">admin@adrover.in</a>
                  </div>
                  <div>
                    <span>Phone</span>
                    <a href="tel:+914048592100">+91 40 4859 2100</a>
                  </div>
                  <div>
                    <span>Address</span>
                    <p>
                      Plot 48, Cyber Hills, Madhapur, Hyderabad – 500081,
                      Telangana, India
                    </p>
                  </div>
                </address>
                <p className="footer-reference-note">
                  Contact details from the supplied reference; confirmation
                  pending.
                </p>
              </section>
            )}
          </div>
          <div className="footer-bottom">
            <span>&copy; 2026 Adrover. All rights reserved.</span>
            <span>
              Design preview &middot;{" "}
              <a href="contact.html#launch-notes">
                Contact details, Privacy and Terms: pending confirmation
              </a>
            </span>
          </div>
        </div>
      </footer>
    </>
  );
}
