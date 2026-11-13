import { api, type AdStatus } from "./api";
import { useI18n } from "./i18n";
import {
  Loader,
  PageHeading,
  Stat,
  StatusBadge,
  useApi,
  useDriver,
} from "./ui";

const adTone: Record<AdStatus, string> = {
  upcoming: "info",
  playing: "wait",
  completed: "good",
  failed: "bad",
};

const isoDay = (offset: number) => {
  const date = new Date();
  date.setDate(date.getDate() - offset);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
};

function PlaysChart({ todayPlays }: { todayPlays: number }) {
  const { t, formatNumber } = useI18n();
  const history = useApi(
    () => api.getPlaybackHistory(isoDay(13), isoDay(1)),
    [],
  );
  if (!history.data) return null;

  const totals = new Map<string, number>();
  for (const entry of history.data.items)
    totals.set(entry.date, (totals.get(entry.date) ?? 0) + entry.plays);
  const days = Array.from({ length: 13 }, (_, index) => {
    const date = isoDay(13 - index);
    return { label: date.slice(8), plays: totals.get(date) ?? 0 };
  });
  days.push({ label: t("dashboard:chart.today"), plays: todayPlays });
  const peak = Math.max(...days.map((day) => day.plays), 1) * 1.15;

  return (
    <div className="dashboard-insights">
      <section className="dashboard-panel plays-panel">
        <div className="dashboard-panel-heading">
          <div>
            <h2>{t("dashboard:chart.title")}</h2>
            <p>{t("dashboard:chart.subtitle")}</p>
          </div>
          <span className="dashboard-panel-tag">
            {t("dashboard:chart.tag")}
          </span>
        </div>
        <div
          aria-label={t("dashboard:chart.title")}
          className="plays-chart"
          role="img"
        >
          <div aria-hidden="true" className="plays-chart-grid">
            <span />
            <span />
            <span />
            <span />
          </div>
          <div className="plays-bars">
            {days.map((day, index) => (
              <div className="plays-bar-column" key={`${day.label}-${index}`}>
                <span className="plays-bar-value">
                  {index === days.length - 1 || index === 0
                    ? formatNumber(day.plays)
                    : ""}
                </span>
                <span
                  className={
                    index === days.length - 1
                      ? "plays-bar plays-bar-today"
                      : "plays-bar"
                  }
                  style={{
                    height: `${(day.plays / peak) * 100}%`,
                    animationDelay: `${index * 45}ms`,
                  }}
                />
                <span className="plays-bar-day">{day.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="plays-chart-footer">
          <span>{t("dashboard:chart.footer")}</span>
          <strong>
            {t("dashboard:chart.todayTotal", {
              count: formatNumber(todayPlays),
            })}
          </strong>
        </div>
      </section>
    </div>
  );
}

export function Home() {
  const { t, formatDate, formatMoney, formatNumber } = useI18n();
  const { profile } = useDriver();
  const state = useApi(() => api.getDashboard(), []);
  const ads = useApi(() => api.getTodayAds(), []);
  const dashboard = state.data;

  return (
    <>
      <PageHeading
        title={t("dashboard:greeting", { name: profile.name })}
        subtitle={t("dashboard:subtitle")}
        actions={
          <a className="button yellow small" href="#/report">
            {t("dashboard:quick.report")}
          </a>
        }
      />
      <Loader state={state}>
        {dashboard && (
          <>
            <section
              className="dashboard-stats"
              aria-label={t("dashboard:month.title")}
            >
              <Stat
                icon="₹"
                label={t("dashboard:month.earned")}
                value={formatMoney(dashboard.month.amountEarned)}
                foot={
                  <>
                    <span>
                      {formatMoney(dashboard.month.releasedAmount)}{" "}
                      {t("dashboard:month.released")}
                    </span>
                  </>
                }
              />
              <Stat
                icon="↗"
                tone="yellow"
                label={t("dashboard:month.adsPlayed")}
                value={formatNumber(dashboard.month.adsPlayed)}
                foot={t("dashboard:month.workingDaysFoot", {
                  count: dashboard.month.workingDays,
                })}
              />
              <Stat
                icon="!"
                tone="red"
                label={t("dashboard:month.pending")}
                value={formatMoney(dashboard.month.pendingAmount)}
                foot={t("dashboard:month.pendingFoot")}
              />
              <Stat
                icon="AD"
                tone="blue"
                label={t("dashboard:today.remaining")}
                value={formatNumber(dashboard.today.remaining)}
                foot={t("dashboard:today.progress", {
                  played: dashboard.today.played,
                  total: dashboard.today.scheduled,
                })}
              />
            </section>

            <PlaysChart todayPlays={dashboard.today.played} />

            <section className="dashboard-panel drv-section">
              <div className="dashboard-panel-heading">
                <div>
                  <h2>{t("dashboard:table.title")}</h2>
                  <p>
                    {dashboard.today.next
                      ? `${t("dashboard:today.next")}: ${t(
                          "dashboard:today.nextAt",
                          {
                            name: dashboard.today.next.name,
                            time: formatDate(
                              dashboard.today.next.scheduledAt,
                              true,
                            ),
                          },
                        )}`
                      : t("dashboard:today.noNext")}
                  </p>
                </div>
                <a className="button yellow small" href="#/ads">
                  {t("dashboard:quick.today")}
                </a>
              </div>
              {ads.data && (
                <div className="dashboard-table-scroll">
                  <table className="dashboard-table">
                    <thead>
                      <tr>
                        <th scope="col">{t("dashboard:table.ad")}</th>
                        <th scope="col">{t("dashboard:table.time")}</th>
                        <th scope="col">{t("dashboard:table.status")}</th>
                        <th scope="col">{t("dashboard:table.plays")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ads.data.items.slice(0, 5).map((ad) => (
                        <tr key={ad.id}>
                          <th scope="row">
                            <strong>{ad.name}</strong>
                            <span>
                              {t("advertisements:field.advertiser", {
                                name: ad.advertiserName,
                              })}
                            </span>
                          </th>
                          <td>{formatDate(ad.scheduledAt, true)}</td>
                          <td>
                            <StatusBadge tone={adTone[ad.status]}>
                              {t(`advertisements:status.${ad.status}`)}
                            </StatusBadge>
                          </td>
                          <td>{formatNumber(ad.playsCompleted)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="dashboard-table-footer">
                <span>
                  {dashboard.device.status === "online"
                    ? t("dashboard:device.online")
                    : t(`dashboard:device.${dashboard.device.status}`)}
                  {" · "}
                  {dashboard.device.lastSyncAt
                    ? t("dashboard:device.lastSync", {
                        time: formatDate(dashboard.device.lastSyncAt, true),
                      })
                    : t("dashboard:device.neverSynced")}
                </span>
                <a href="#/ads">{t("dashboard:table.all")}</a>
              </div>
            </section>

            <div className="dashboard-bottom-panels">
              <section className="dashboard-panel dashboard-quiet-panel">
                <span className="dashboard-bottom-icon" aria-hidden="true">
                  ₹
                </span>
                <h2>{t("dashboard:bottom.paymentsTitle")}</h2>
                <p>{t("dashboard:bottom.paymentsText")}</p>
                <a className="dashboard-profile-link" href="#/earnings">
                  {t("dashboard:bottom.paymentsLink")}
                </a>
              </section>
              <section className="dashboard-panel dashboard-profile-panel">
                <span className="dashboard-bottom-icon" aria-hidden="true">
                  {profile.name.slice(0, 2).toUpperCase()}
                </span>
                <h2>{t("dashboard:bottom.profileTitle")}</h2>
                <p>{profile.vehicle?.registrationNumber ?? profile.mobile}</p>
                <span className="dashboard-profile-foot">
                  {t("dashboard:bottom.profileText")}
                </span>
                <a className="dashboard-profile-link" href="#/profile">
                  {t("dashboard:bottom.profileLink")}
                </a>
              </section>
            </div>
          </>
        )}
      </Loader>
    </>
  );
}
