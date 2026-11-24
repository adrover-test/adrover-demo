import { useEffect, useState, type FormEvent } from "react";
import { Layout } from "../components/Layout";
import { api, ApiError, getToken, setToken } from "./api";
import { I18nProvider, useI18n } from "./i18n";
import { isValidMobile, LanguageSwitcher } from "./ui";
import "./driver.css";

function LoginForm() {
  const { t, setLang } = useI18n();
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const params = new URLSearchParams(window.location.search);
  const info = params.has("expired")
    ? t("common:login.expired")
    : params.has("signedOut")
      ? t("common:login.signedOut")
      : "";

  useEffect(() => {
    if (getToken() && !params.has("expired") && !params.has("signedOut"))
      window.location.replace("driver.html");
  }, []);

  async function signIn(event: FormEvent) {
    event.preventDefault();
    if (!isValidMobile(mobile)) {
      setError(t("common:login.errMobile"));
      return;
    }
    if (!password) {
      setError(t("common:login.errPassword"));
      return;
    }
    setBusy(true);
    setError("");
    try {
      const { accessToken } = await api.loginWithPassword(mobile, password);
      setToken(accessToken);
      setPassword("");
      window.location.assign("driver.html");
    } catch (failure) {
      setError(
        failure instanceof ApiError && failure.status === 401
          ? t("common:login.badCredentials")
          : failure instanceof ApiError && failure.status === 429
            ? t("common:login.tooMany")
            : failure instanceof ApiError && failure.unavailable
              ? t("common:state.unavailable")
              : t("common:state.error"),
      );
      setBusy(false);
    }
  }

  return (
    <section className="wrap login-section">
      <div className="login-card">
        <aside className="login-intro">
          <span className="login-badge">{t("common:login.badge")}</span>
          <h1>{t("common:login.heroTitle")}</h1>
          <p>{t("common:login.heroText")}</p>
        </aside>
        <div className="login-form-panel">
          <div className="login-form-heading">
            <span className="eyebrow">{t("common:login.eyebrow")}</span>
            <h2>{t("common:login.title")}</h2>
            <p>{t("common:login.subtitle")}</p>
          </div>
          <LanguageSwitcher onChange={setLang} />
          {info && (
            <p className="drv-success" role="status">
              {info}
            </p>
          )}
          <form className="drv-form" onSubmit={signIn} noValidate>
            <div className="field">
              <label htmlFor="d-mobile">{t("common:login.mobileLabel")}</label>
              <div className="login-phone-input">
                <span aria-hidden="true">+91</span>
                <input
                  id="d-mobile"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  maxLength={10}
                  placeholder="9876543210"
                  value={mobile}
                  onChange={(event) => {
                    setMobile(
                      event.target.value.replace(/\D/g, "").slice(0, 10),
                    );
                    setError("");
                  }}
                  aria-describedby="d-mobile-hint"
                />
              </div>
              <small id="d-mobile-hint">{t("common:login.mobileHint")}</small>
            </div>
            <div className="field">
              <label htmlFor="d-password">
                {t("common:login.passwordLabel")}
              </label>
              <input
                id="d-password"
                type="password"
                autoComplete="current-password"
                maxLength={72}
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setError("");
                }}
                aria-describedby="d-password-hint"
              />
              <small id="d-password-hint">
                {t("common:login.passwordHint")}
              </small>
            </div>
            <button className="button yellow" type="submit" disabled={busy}>
              {busy ? t("common:login.verifying") : t("common:login.signIn")}
            </button>
          </form>
          {error && (
            <p className="drv-error" role="alert">
              {error}
            </p>
          )}
          <a className="text-link" href="login.html">
            {t("common:login.advertiser")}
          </a>
        </div>
      </div>
    </section>
  );
}

export function DriverLogin() {
  return (
    <I18nProvider>
      <Layout currentPage="driver-login.html">
        <LoginForm />
      </Layout>
    </I18nProvider>
  );
}
