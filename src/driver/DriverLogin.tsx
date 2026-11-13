import { useEffect, useState, type FormEvent } from "react";
import { Layout } from "../components/Layout";
import { api, ApiError, getToken, isDemo, setToken } from "./api";
import { I18nProvider, useI18n } from "./i18n";
import { isValidMobile, LanguageSwitcher } from "./ui";
import "./driver.css";

const resendSeconds = 30;

function LoginForm() {
  const { t, setLang } = useI18n();
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [seconds, setSeconds] = useState(0);
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

  useEffect(() => {
    if (seconds <= 0) return;
    const timer = window.setTimeout(() => setSeconds(seconds - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [seconds]);

  async function sendOtp(event?: FormEvent) {
    event?.preventDefault();
    if (!isValidMobile(mobile)) {
      setError(t("common:login.errMobile"));
      return;
    }
    setBusy(true);
    setError("");
    try {
      await api.requestOtp(mobile);
      setOtp("");
      setOtpSent(true);
      setSeconds(resendSeconds);
    } catch (failure) {
      setError(
        failure instanceof ApiError && failure.status === 404 && failure.message
          ? t("common:login.notRegistered")
          : failure instanceof ApiError && failure.status === 429
            ? t("common:login.tooMany")
            : failure instanceof ApiError && failure.unavailable
              ? t("common:state.unavailable")
              : t("common:state.error"),
      );
    } finally {
      setBusy(false);
    }
  }

  async function verify(event: FormEvent) {
    event.preventDefault();
    if (!/^\d{6}$/.test(otp)) {
      setError(t("common:login.errOtp"));
      return;
    }
    setBusy(true);
    setError("");
    try {
      const { accessToken } = await api.verifyOtp(mobile, otp);
      setToken(accessToken);
      window.location.assign("driver.html");
    } catch (failure) {
      setError(
        failure instanceof ApiError && failure.status === 429
          ? t("common:login.tooMany")
          : failure instanceof ApiError && failure.unavailable
            ? t("common:state.unavailable")
            : t("common:login.otpWrong"),
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

          {!otpSent ? (
            <form className="drv-form" onSubmit={sendOtp} noValidate>
              <div className="field">
                <label htmlFor="d-mobile">
                  {t("common:login.mobileLabel")}
                </label>
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
              <button className="button yellow" type="submit" disabled={busy}>
                {busy ? t("common:login.sending") : t("common:login.sendOtp")}
              </button>
            </form>
          ) : (
            <form className="drv-form" onSubmit={verify} noValidate>
              <p className="drv-success" role="status">
                {isDemo
                  ? t("common:login.demoOtp")
                  : t("common:login.otpSent", { mobile })}
              </p>
              <div className="field">
                <label htmlFor="d-otp">{t("common:login.otpLabel")}</label>
                <input
                  id="d-otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={otp}
                  onChange={(event) => {
                    setOtp(event.target.value.replace(/\D/g, "").slice(0, 6));
                    setError("");
                  }}
                />
              </div>
              <button className="button yellow" type="submit" disabled={busy}>
                {busy ? t("common:login.verifying") : t("common:login.verify")}
              </button>
              <button
                className="button ghost"
                type="button"
                disabled={busy || seconds > 0}
                onClick={() => void sendOtp()}
              >
                {seconds > 0
                  ? t("common:login.resendIn", { seconds })
                  : t("common:login.resend")}
              </button>
              <button
                className="drv-link"
                type="button"
                onClick={() => {
                  setOtpSent(false);
                  setOtp("");
                  setError("");
                  setSeconds(0);
                }}
              >
                {t("common:login.change")}
              </button>
            </form>
          )}

          {error && (
            <p className="drv-error" role="alert">
              {error}
            </p>
          )}
          {isDemo && (
            <p className="login-disclaimer">{t("common:login.demoNote")}</p>
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
