import { useState } from "react";
import { api, type Payment, type PaymentStatus, type Period } from "./api";
import { useI18n } from "./i18n";
import { Loader, PageHeading, Section, Stat, StatusBadge, useApi } from "./ui";

const tone: Record<PaymentStatus, string> = {
  released: "good",
  processing: "info",
  pending: "wait",
  failed: "bad",
};

function PeriodFilter({
  value,
  onChange,
}: {
  value: Period;
  onChange: (value: Period) => void;
}) {
  const { t } = useI18n();
  return (
    <div className="drv-tabs" role="tablist">
      {(["weekly", "monthly"] as const).map((key) => (
        <button
          key={key}
          type="button"
          role="tab"
          aria-selected={value === key}
          onClick={() => onChange(key)}
        >
          {t(`earnings:filter.${key}`)}
        </button>
      ))}
    </div>
  );
}

export function Earnings() {
  const { t, formatDate, formatMoney, formatNumber } = useI18n();
  const [period, setPeriod] = useState<Period>("monthly");
  const earnings = useApi(() => api.getEarnings(period), [period]);
  const payments = useApi(() => api.getPayments(period), [period]);
  const data = earnings.data;

  return (
    <>
      <PageHeading
        title={t("earnings:title")}
        subtitle={t("earnings:subtitle")}
      />
      <PeriodFilter value={period} onChange={setPeriod} />
      <Loader state={earnings}>
        {data && (
          <>
            <div className="drv-grid">
              <Stat
                icon="₹"
                label={t("earnings:total")}
                value={formatMoney(data.total)}
              />
              <Stat
                icon="▦"
                label={t("earnings:thisMonth")}
                value={formatMoney(data.thisMonth)}
              />
              <Stat
                icon="⏳"
                label={t("earnings:pending")}
                value={formatMoney(data.pending)}
                tone="yellow"
              />
              <Stat
                icon="⟳"
                label={t("earnings:processing")}
                value={formatMoney(data.processing)}
                tone="blue"
              />
              <Stat
                icon="✓"
                label={t("earnings:released")}
                value={formatMoney(data.released)}
              />
            </div>
            <p className="drv-note">{t("earnings:note")}</p>
            <div className="drv-card">
              <strong>{t("earnings:nextPayout")}: </strong>
              {data.nextPayout
                ? t("earnings:nextPayoutValue", {
                    amount: formatMoney(data.nextPayout.amount),
                    date: formatDate(data.nextPayout.date),
                  })
                : t("earnings:nextPayoutNone")}
            </div>

            <Section title={t("earnings:perAd.title")}>
              {data.perAd.length === 0 ? (
                <p className="drv-state">{t("earnings:perAd.empty")}</p>
              ) : (
                <ul className="drv-list">
                  {data.perAd.map((row) => (
                    <li className="drv-card drv-row" key={row.adId}>
                      <div>
                        <strong>{row.adName}</strong>
                        <span className="drv-sub">
                          {t("earnings:perAd.plays", {
                            count: formatNumber(row.plays),
                          })}
                        </span>
                      </div>
                      <strong>{formatMoney(row.amount)}</strong>
                    </li>
                  ))}
                </ul>
              )}
            </Section>
          </>
        )}
      </Loader>

      <Section title={t("payments:title")}>
        <Loader state={payments}>
          {(payments.data?.items.length ?? 0) === 0 ? (
            <p className="drv-state">{t("payments:empty")}</p>
          ) : (
            <ul className="drv-list">
              {payments.data?.items.map((payment) => (
                <li key={payment.id}>
                  <a
                    className="drv-card drv-row drv-card-link"
                    href={`#/payments/${encodeURIComponent(payment.id)}`}
                    aria-label={t("payments:open", {
                      id: payment.transactionId,
                    })}
                  >
                    <div>
                      <strong>{formatMoney(payment.amount)}</strong>
                      <span className="drv-sub">
                        {payment.transactionId} ·{" "}
                        {payment.paidAt
                          ? formatDate(payment.paidAt)
                          : t("payments:notPaid")}
                      </span>
                    </div>
                    <StatusBadge tone={tone[payment.status]}>
                      {t(`payments:status.${payment.status}`)}
                    </StatusBadge>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </Loader>
      </Section>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="drv-detail-row">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

export function PaymentDetail({ id }: { id: string }) {
  const { t, formatDate, formatMoney } = useI18n();
  const state = useApi<Payment>(() => api.getPayment(id), [id]);
  const payment = state.data;

  return (
    <>
      <a className="drv-link" href="#/earnings">
        ← {t("payments:back")}
      </a>
      <PageHeading title={t("payments:details")} />
      <Loader state={state}>
        {payment && (
          <dl className="drv-card drv-details">
            <Row label={t("payments:txnId")} value={payment.transactionId} />
            <Row
              label={t("payments:amount")}
              value={formatMoney(payment.amount)}
            />
            <Row
              label={t("payments:status")}
              value={t(`payments:status.${payment.status}`)}
            />
            <Row
              label={t("payments:date")}
              value={
                payment.paidAt
                  ? formatDate(payment.paidAt)
                  : t("payments:notPaid")
              }
            />
            <Row
              label={t("payments:reference")}
              value={payment.reference ?? t("payments:noReference")}
            />
            <Row
              label={t("payments:period")}
              value={t("payments:periodValue", {
                from: formatDate(payment.periodStart),
                to: formatDate(payment.periodEnd),
              })}
            />
          </dl>
        )}
      </Loader>
    </>
  );
}
