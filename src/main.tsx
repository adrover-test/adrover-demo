import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Layout } from "./components/Layout";
import { Home } from "./pages/Home";
import { Faq } from "./pages/Faq";
import { Pricing } from "./pages/Pricing";
import { Register } from "./pages/Register";
import { Contact } from "./pages/Contact";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { Profile } from "./pages/Profile";
import { CreateAd } from "./pages/CreateAd";
import { Advertisements } from "./pages/Advertisements";
import { ViewAd } from "./pages/ViewAd";
import { Payments } from "./pages/Payments";
import { requireDemoSession } from "./lib/portal";
import { requireAdminSession } from "./lib/admin";
import { AdminLogin } from "./pages/AdminLogin";
import { AdminPortal } from "./pages/AdminPortal";
import "./styles.css";

const pages = {
  "index.html": Home,
  "faq.html": Faq,
  "pricing.html": Pricing,
  "register.html": Register,
  "contact.html": Contact,
  "login.html": Login,
  "dashboard.html": Dashboard,
  "profile.html": Profile,
  "create-ad.html": CreateAd,
  "advertisements.html": Advertisements,
  "view-ad.html": ViewAd,
  "payments.html": Payments,
  "admin-login.html": AdminLogin,
  "admin.html": AdminPortal,
};

const filename = window.location.pathname.split("/").pop() || "index.html";
const redirectingToAdminLogin = requireAdminSession(
  filename,
  window.location.search,
);
if (!redirectingToAdminLogin)
  requireDemoSession(filename, window.location.search);
const Page = Object.hasOwn(pages, filename)
  ? pages[filename as keyof typeof pages]
  : null;
const root = document.getElementById("root");
if (!root) throw new Error("The page is missing its React root.");

if (!redirectingToAdminLogin)
  createRoot(root).render(
    <StrictMode>
      <Layout currentPage={filename}>
        {Page ? (
          <Page />
        ) : (
          <section className="wrap section">
            <h1>Page not found</h1>
            <a className="button" href="index.html">
              Return home
            </a>
          </section>
        )}
      </Layout>
    </StrictMode>,
  );
