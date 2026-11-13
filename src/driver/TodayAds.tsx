import { useState } from "react";
import { api, type AdStatus, type TodayAd } from "./api";
import { useI18n } from "./i18n";
import { Loader, PageHeading, Section, StatusBadge, useApi } from "./ui";

const tone: Record<AdStatus, string> = {
  upcoming: "wait",
  playing: "info",
  completed: "good",
  failed: "bad",
};

type Tab = "schedule" | "upcoming" | "completed" | "history";

function AdRow({ ad }: { ad: TodayAd }) {
  const { t, formatDate } = useI18n();
  const time = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(ad.scheduledAt));
  return (
    <li className="drv-timeline-item">
      <time className="drv-time" dateTime={ad.scheduledAt}>
        {time}
      </time>
      <div className="drv-card drv-ad">
        {ad.thumbnailUrl ? (
          <img src={ad.thumbnailUrl} alt="" loading="lazy" />
        ) : (
          <span className="drv-thumb-empty" aria-hidden="true">
            ▶
          </span>
        )}
        <div className="drv-ad-body">
          <strong>{ad.name}</strong>
          <span>
            {t("advertisements:field.advertiser", { name: ad.advertiserName })}
          </span>
          <span>
            {formatDate(ad.scheduledAt, true)} ·{" "}
            {t("advertisements:field.duration", {
              seconds: ad.durationSeconds,
            })}
          </span>
          <span>
            {t("advertisements:field.played", { count: ad.playsCompleted })} ·{" "}
            {t("advertisements:field.remaining", { count: ad.playsRemaining })}
          </span>
          <a
            className="drv-link"
            href={`#/report?ad=${encodeURIComponent(ad.id)}`}
          >
            {t("advertisements:report")}
          </a>
        </div>
        <StatusBadge tone={tone[ad.status]}>
          {t(`advertisements:status.${ad.status}`)}
        </StatusBadge>
      </div>
    </li>
  );
}

function History() {
  const { t, formatDate } = useI18n();
  const today = new Date();
  const weekAgo = new Date(today.getTime() - 6 * 86400000);
  const iso = (date: Date) => date.toISOString().slice(0, 10);
  const [from, setFrom] = useState(iso(weekAgo));
  const [to, setTo] = useState(iso(today));
  const state = useApi(() => api.getPlaybackHistory(from, to), [from, to]);
  const items = state.data?.items ?? [];

  return (
    <>
      <div className="drv-filters">
        <label>
          {t("advertisements:history.from")}
          <input
            type="date"
            value={from}
            max={to}
            onChange={(event) => setFrom(event.target.value)}
          />
        </label>
        <label>
          {t("advertisements:history.to")}
          <input
            type="date"
            value={to}
            min={from}
            max={iso(today)}
            onChange={(event) => setTo(event.target.value)}
          />
        </label>
      </div>
      <Loader state={state}>
        {items.length === 0 ? (
          <p className="drv-state">{t("advertisements:empty.history")}</p>
        ) : (
          <ul className="drv-list">
            {items.map((entry) => (
              <li className="drv-card drv-row" key={entry.id}>
                <div>
                  <strong>{entry.adName}</strong>
                  <span className="drv-sub">
                    {entry.advertiserName} · {formatDate(entry.date)}
                  </span>
                </div>
                <div className="drv-end">
                  <span>
                    {t("advertisements:history.plays", { count: entry.plays })}
                  </span>
                  <StatusBadge tone={tone[entry.status]}>
                    {t(`advertisements:status.${entry.status}`)}
                  </StatusBadge>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Loader>
    </>
  );
}

export function TodayAds() {
  const { t } = useI18n();
  const [tab, setTab] = useState<Tab>("schedule");
  const state = useApi(() => api.getTodayAds(), []);
  const ads = state.data?.items ?? [];
  const visible = ads.filter((ad) =>
    tab === "upcoming"
      ? ad.status === "upcoming"
      : tab === "completed"
        ? ad.status === "completed"
        : true,
  );
  const tabs: Tab[] = ["schedule", "upcoming", "completed", "history"];

  return (
    <>
      <PageHeading
        title={t("advertisements:title")}
        subtitle={t("advertisements:subtitle")}
      />
      <div className="drv-tabs" role="tablist">
        {tabs.map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
          >
            {t(`advertisements:tab.${key}`)}
          </button>
        ))}
      </div>
      {tab === "history" ? (
        <History />
      ) : (
        <Section title={t(`advertisements:tab.${tab}`)}>
          <Loader state={state}>
            {visible.length === 0 ? (
              <p className="drv-state">{t(`advertisements:empty.${tab}`)}</p>
            ) : (
              <ol className="drv-timeline">
                {visible.map((ad) => (
                  <AdRow ad={ad} key={ad.id} />
                ))}
              </ol>
            )}
          </Loader>
        </Section>
      )}
    </>
  );
}
