import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { ApiError, type DriverProfile } from "./api";
import { languages, useI18n, type Lang } from "./i18n";

export type DriverContextValue = {
  profile: DriverProfile;
  changeLanguage: (lang: Lang) => Promise<boolean>;
  unreadCount: number;
  refreshUnread: () => void;
  reloadProfile: () => Promise<void>;
  logout: () => void;
};

export const DriverContext = createContext<DriverContextValue | null>(null);

export function useDriver() {
  const value = useContext(DriverContext);
  if (!value) throw new Error("useDriver must be used inside the driver app.");
  return value;
}

export function useApi<T>(load: () => Promise<T>, deps: unknown[]) {
  const [state, setState] = useState<{
    data: T | null;
    error: unknown;
    loading: boolean;
  }>({ data: null, error: null, loading: true });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState((previous) => ({ ...previous, error: null, loading: true }));
    load().then(
      (data) => {
        if (!cancelled) setState({ data, error: null, loading: false });
      },
      (error: unknown) => {
        if (!cancelled) setState({ data: null, error, loading: false });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [...deps, version]);

  const reload = useCallback(() => setVersion((value) => value + 1), []);
  return { ...state, reload };
}

export function Loader({
  state,
  children,
}: {
  state: {
    data: unknown;
    error: unknown;
    loading: boolean;
    reload: () => void;
  };
  children: ReactNode;
}) {
  const { t } = useI18n();
  if (state.loading && !state.data)
    return (
      <p className="drv-state" role="status">
        {t("common:state.loading")}
      </p>
    );
  if (state.error)
    return (
      <div className="drv-state drv-state-error" role="alert">
        <p>
          {state.error instanceof ApiError && state.error.unavailable
            ? t("common:state.unavailable")
            : t("common:state.error")}
        </p>
        {state.error instanceof ApiError && state.error.unavailable && (
          <small>
            {t("common:state.endpoint", { endpoint: state.error.endpoint })}
          </small>
        )}
        <button
          className="button ghost small"
          type="button"
          onClick={state.reload}
        >
          {t("common:action.retry")}
        </button>
      </div>
    );
  return <>{children}</>;
}

export function StatusBadge({
  tone,
  children,
}: {
  tone: string;
  children: ReactNode;
}) {
  return (
    <span className={`campaign-status drv-status-${tone}`}>{children}</span>
  );
}

export function LanguageSwitcher({
  onChange,
}: {
  onChange: (lang: Lang) => void;
}) {
  const { lang, t } = useI18n();
  return (
    <div
      className="drv-lang"
      role="group"
      aria-label={t("common:language.label")}
    >
      {languages.map((language) => (
        <button
          key={language.code}
          type="button"
          lang={language.code}
          aria-pressed={lang === language.code}
          onClick={() => onChange(language.code)}
        >
          {language.name}
        </button>
      ))}
    </div>
  );
}

export function Section({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="dashboard-panel drv-section">
      <div className="dashboard-panel-heading">
        <h2>{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function PageHeading({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  const { t } = useI18n();
  return (
    <header className="dashboard-heading">
      <div>
        <span className="eyebrow">{t("common:login.badge")}</span>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actions && <div className="dashboard-heading-actions">{actions}</div>}
    </header>
  );
}

const toneClass = {
  green: "ads",
  yellow: "plays",
  blue: "cabs",
  red: "pending",
} as const;

export function Stat({
  icon,
  label,
  value,
  foot,
  tone = "green",
}: {
  icon: string;
  label: string;
  value: ReactNode;
  foot?: ReactNode;
  tone?: "green" | "yellow" | "blue" | "red";
}) {
  return (
    <article className="dashboard-stat">
      <span
        className={`dashboard-stat-icon ${toneClass[tone]}`}
        aria-hidden="true"
      >
        {icon}
      </span>
      <span className="dashboard-stat-label">{label}</span>
      <strong>{value}</strong>
      {foot && <span className="dashboard-stat-foot">{foot}</span>}
    </article>
  );
}

export function isValidMobile(value: string) {
  return /^[6-9]\d{9}$/.test(value);
}

export function validImage(file: File) {
  return (
    ["image/jpeg", "image/png"].includes(file.type) && file.size <= 5242880
  );
}
