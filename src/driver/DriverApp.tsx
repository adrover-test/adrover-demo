import { useCallback, useEffect, useState } from "react";
import {
  api,
  clearToken,
  getToken,
  setRequestLanguage,
  type DriverProfile,
} from "./api";
import { I18nProvider, languages, useI18n, type Lang } from "./i18n";
import { Layout } from "../components/Layout";
import { Home } from "./Home";
import { TodayAds } from "./TodayAds";
import { Earnings, PaymentDetail } from "./Earnings";
import { MyVehicle, Profile } from "./Account";
import {
  Help,
  IssueDetailPage,
  MyIssues,
  Notifications,
  ReportIssue,
} from "./Support";
import {
  DriverContext,
  LanguageSwitcher,
  Loader,
  useApi,
  type DriverContextValue,
} from "./ui";
import "./driver.css";

export function DriverLogo() {
  return (
    <a className="logo" href="driver.html" aria-label="AdRover">
      <svg viewBox="0 0 40 40" aria-hidden="true">
        <path d="M0 37 14 2h12l14 35H28L20 14 12 37Z" fill="#ffd21c" />
        <path d="M18 25h4l3 8H15Z" fill="#101814" />
      </svg>
      <span>AdRover</span>
    </a>
  );
}

const navItems = [
  { path: "home", key: "nav.home", icon: "▦" },
  { path: "ads", key: "nav.ads", icon: "▶" },
  { path: "earnings", key: "nav.earnings", icon: "₹" },
  { path: "vehicle", key: "nav.vehicle", icon: "▣" },
  { path: "profile", key: "nav.profile", icon: "○" },
  { path: "notifications", key: "nav.notifications", icon: "●" },
  { path: "issues", key: "nav.issues", icon: "!" },
  { path: "help", key: "nav.help", icon: "?" },
] as const;

function useRoute() {
  const read = () => {
    const raw = window.location.hash.replace(/^#\/?/, "");
    const [path = "", query = ""] = raw.split("?");
    return { segments: path.split("/").filter(Boolean), query };
  };
  const [route, setRoute] = useState(read);
  useEffect(() => {
    const onChange = () => {
      setRoute(read());
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return route;
}

function FirstLanguagePicker({
  onPick,
  error,
}: {
  onPick: (lang: Lang) => void;
  error: string;
}) {
  const { t } = useI18n();
  return (
    <main className="drv-center">
      <div className="drv-card drv-picker">
        <DriverLogo />
        <h1>{t("common:language.choose")}</h1>
        <p>{t("common:language.chooseHint")}</p>
        <div className="drv-picker-options">
          {languages.map((language) => (
            <button
              className="button yellow"
              key={language.code}
              type="button"
              lang={language.code}
              onClick={() => onPick(language.code)}
            >
              {language.name}
            </button>
          ))}
        </div>
        {error && (
          <p className="drv-error" role="alert">
            {error}
          </p>
        )}
      </div>
    </main>
  );
}

function Shell() {
  const { t, lang, setLang } = useI18n();
  const route = useRoute();
  const [unreadCount, setUnreadCount] = useState(0);
  const [languageError, setLanguageError] = useState("");
  const [needsLanguage, setNeedsLanguage] = useState(false);
  const [profileOverride, setProfileOverride] = useState(0);
  const profileState = useApi<DriverProfile>(
    () => api.getProfile(),
    [profileOverride],
  );
  const profile = profileState.data;

  useEffect(() => {
    if (!profile) return;
    if (profile.preferredLanguage) setLang(profile.preferredLanguage);
    else setNeedsLanguage(true);
    // Apply the saved preference only when the profile is first loaded.
  }, [profile?.id]);

  useEffect(() => {
    setRequestLanguage(lang);
  }, [lang]);

  const refreshUnread = useCallback(() => {
    api.getNotifications().then(
      (data) => setUnreadCount(data.unreadCount),
      () => undefined,
    );
  }, []);

  useEffect(() => {
    if (profile) refreshUnread();
  }, [profile?.id, route.segments[0], refreshUnread]);

  const changeLanguage = useCallback(
    async (next: Lang) => {
      const previous = lang;
      setLanguageError("");
      setLang(next);
      try {
        await api.saveLanguage(next);
        setNeedsLanguage(false);
        return true;
      } catch {
        setLang(previous);
        return false;
      }
    },
    [lang, setLang],
  );

  const logout = useCallback(() => {
    clearToken();
    window.location.assign("driver-login.html?signedOut=1");
  }, []);

  if (!profile)
    return (
      <main className="drv-center">
        <Loader state={profileState}>{null}</Loader>
      </main>
    );

  if (needsLanguage)
    return (
      <FirstLanguagePicker
        error={languageError}
        onPick={(next) => {
          void changeLanguage(next).then((saved) => {
            if (!saved) setLanguageError(t("common:language.saveFailed"));
          });
        }}
      />
    );

  const context: DriverContextValue = {
    profile,
    changeLanguage,
    unreadCount,
    refreshUnread,
    reloadProfile: async () => {
      setProfileOverride((value) => value + 1);
    },
    logout,
  };

  const [first = "home", second] = route.segments;
  const params = new URLSearchParams(route.query);
  let page;
  switch (first) {
    case "ads":
      page = <TodayAds />;
      break;
    case "earnings":
      page = <Earnings />;
      break;
    case "payments":
      page = second ? <PaymentDetail id={second} /> : <Earnings />;
      break;
    case "vehicle":
      page = <MyVehicle />;
      break;
    case "profile":
      page = <Profile />;
      break;
    case "notifications":
      page = <Notifications />;
      break;
    case "help":
      page = <Help />;
      break;
    case "report":
      page = <ReportIssue adId={params.get("ad") ?? ""} />;
      break;
    case "issues":
      page = second ? <IssueDetailPage id={second} /> : <MyIssues />;
      break;
    default:
      page = <Home />;
  }
  const activePath = first === "payments" ? "earnings" : first;

  return (
    <DriverContext.Provider value={context}>
      {languageError && (
        <p className="drv-error drv-banner" role="alert">
          {languageError}
        </p>
      )}
      <section className="wrap dashboard-page">
        <aside className="dashboard-sidebar" aria-label={t("common:nav.main")}>
          <span className="dashboard-sidebar-label">
            {t("common:login.badge")}
          </span>
          <nav className="dashboard-nav" aria-label={t("common:nav.main")}>
            {navItems.map((item) => (
              <a
                key={item.path}
                href={`#/${item.path}`}
                className={
                  activePath === item.path ? "dashboard-nav-active" : undefined
                }
                aria-current={activePath === item.path ? "page" : undefined}
              >
                <span aria-hidden="true" className="dashboard-nav-icon">
                  {item.icon}
                </span>
                {t(`common:${item.key}`)}
                {item.path === "notifications" && unreadCount > 0 && (
                  <b
                    className="drv-count"
                    aria-label={t("common:notif.badge", {
                      count: unreadCount,
                    })}
                  >
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </b>
                )}
              </a>
            ))}
          </nav>
          <LanguageSwitcher
            onChange={(next) => {
              void changeLanguage(next).then((saved) => {
                setLanguageError(saved ? "" : t("common:language.saveFailed"));
              });
            }}
          />
          <div className="dashboard-account">
            <span aria-hidden="true" className="dashboard-avatar">
              {profile.name
                .split(/\s+/)
                .map((word) => word[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </span>
            <span>
              <strong>{profile.name}</strong>
              <small>
                {profile.vehicle?.registrationNumber ?? profile.mobile}
              </small>
            </span>
          </div>
          <button className="dashboard-logout" type="button" onClick={logout}>
            <span aria-hidden="true">↪</span>
            {t("common:action.logout")}
          </button>
        </aside>
        <div className="dashboard-content">{page}</div>
      </section>
    </DriverContext.Provider>
  );
}

export function DriverApp() {
  if (!getToken()) {
    window.location.replace("driver-login.html");
    return null;
  }
  return (
    <I18nProvider>
      <Layout currentPage="driver.html">
        <Shell />
      </Layout>
    </I18nProvider>
  );
}
