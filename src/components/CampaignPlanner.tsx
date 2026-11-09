import {
  calculate,
  campaignQuery,
  isPositiveInteger,
  moneyFormat,
  numberFormat,
} from "../lib/campaign";
import { useState } from "react";

export type CampaignSelection = {
  vehicles: string;
  days: string;
  dailyPlays: string;
};
export const defaultCampaignSelection: CampaignSelection = {
  vehicles: "20",
  days: "10",
  dailyPlays: "50",
};

export function CampaignPlanner({
  selection,
  onSelectionChange,
  embedded = false,
}: {
  selection?: CampaignSelection;
  onSelectionChange?: (selection: CampaignSelection) => void;
  embedded?: boolean;
}) {
  const [localSelection, setLocalSelection] = useState(
    defaultCampaignSelection,
  );
  const { vehicles, days, dailyPlays } = selection ?? localSelection;
  function update(change: Partial<CampaignSelection>) {
    const next = { vehicles, days, dailyPlays, ...change };
    if (onSelectionChange) onSelectionChange(next);
    else setLocalSelection(next);
  }
  const setVehicles = (vehicles: string) => update({ vehicles });
  const setDays = (days: string) => update({ days });
  const setDailyPlays = (dailyPlays: string) => update({ dailyPlays });
  const result = calculate(vehicles, days, dailyPlays, "Cabs");
  const estimate = result.ok ? result.estimate : null;

  return (
    <section
      className={
        embedded ? "cab-campaign cab-campaign-embedded" : "wrap cab-campaign"
      }
      id="planner"
      aria-labelledby="cab-campaign-title"
    >
      <header className="cab-campaign-header">
        <svg className="cab-header-taxi" viewBox="0 0 64 64" aria-hidden="true">
          <rect x="22" y="5" width="20" height="11" rx="3" fill="#101814" />
          <text
            x="32"
            y="13"
            textAnchor="middle"
            fill="#ffd21c"
            fontSize="7"
            fontWeight="700"
          >
            TAXI
          </text>
          <path d="m13 31 8-16h22l8 16 6 6v17H7V37z" fill="#101814" />
          <path d="m19 31 6-12h14l6 12z" fill="#ffe565" />
          <rect x="9" y="51" width="10" height="10" rx="4" fill="#101814" />
          <rect x="45" y="51" width="10" height="10" rx="4" fill="#101814" />
          <rect x="12" y="37" width="11" height="7" rx="3" fill="#ffe565" />
          <rect x="41" y="37" width="11" height="7" rx="3" fill="#ffe565" />
          <path d="M27 45h10" stroke="#ffe565" strokeWidth="4" />
        </svg>
        <div>
          <h2 id="cab-campaign-title">Advertise Inside Cabs</h2>
          <p>Reach daily commuters with impactful in-cab ads.</p>
        </div>
        <div className="cab-rate">
          <svg viewBox="0 0 40 40" aria-hidden="true">
            <path
              d="m5 17 20-9v24L5 25zM12 27l3 10h6l-4-12"
              fill="#185934"
              stroke="#101814"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <path
              d="m31 12 5-4m-4 12h6m-7 8 5 4"
              stroke="#e6ac00"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
          <div>
            <span>Per 30-second play</span>
            <strong>₹0.30</strong>
          </div>
        </div>
        <p className="cab-header-tagline">
          Big Visibility
          <br />
          Small Cost
          <br />
          Real Impact!
        </p>
      </header>
      <div className="cab-campaign-grid">
        <div className="cab-config">
          <div className="cab-config-heading">
            <h3>Campaign details</h3>
            <span>Cabs only</span>
          </div>
          <div className="cab-config-row">
            <div className="cab-count-label">
              <span className="cab-count-icon" aria-hidden="true">
                <svg
                  viewBox="0 0 32 32"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="m7 14 3-7h12l3 7M5 14h22v11H5zM12 7V4h8v3" />
                  <path d="M8 25v4m16-4v4M9 19h3m8 0h3M14 23h4" />
                </svg>
              </span>
              <div>
                <label htmlFor="vehicle-count">Number of Cabs</label>
                <p id="cabs-guidance">
                  How many cabs do you want to advertise in?
                </p>
              </div>
            </div>
            <input
              id="vehicle-count"
              type="number"
              min="1"
              step="1"
              value={vehicles}
              onChange={(event) => setVehicles(event.target.value)}
              aria-invalid={!isPositiveInteger(vehicles)}
              aria-describedby="cabs-guidance pricing-error"
            />
          </div>
          <div className="cab-config-row">
            <div className="cab-count-label">
              <span className="cab-count-icon" aria-hidden="true">
                <svg
                  viewBox="0 0 32 32"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M8 3h11l6 6v20H8zM19 3v7h6M12 15h9m-9 5h9m-9 5h6" />
                </svg>
              </span>
              <div>
                <label htmlFor="daily-play-count">Plays per Cab per Day</label>
                <p id="plays-guidance">Each play is a 30-second ad.</p>
              </div>
            </div>
            <input
              id="daily-play-count"
              type="number"
              min="1"
              step="1"
              value={dailyPlays}
              onChange={(event) => setDailyPlays(event.target.value)}
              aria-invalid={
                !isPositiveInteger(dailyPlays) ||
                (!result.ok &&
                  isPositiveInteger(vehicles) &&
                  isPositiveInteger(days) &&
                  isPositiveInteger(dailyPlays))
              }
              aria-describedby="plays-guidance pricing-error"
            />
          </div>
          <div className="cab-duration-row">
            <div className="cab-count-label">
              <span className="cab-count-icon" aria-hidden="true">
                <svg
                  viewBox="0 0 32 32"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="4" y="7" width="24" height="22" rx="3" />
                  <path d="M10 3v8m12-8v8M4 14h24M10 19h3m6 0h3m-12 5h3" />
                </svg>
              </span>
              <div>
                <label htmlFor="campaign-days">Campaign Duration (Days)</label>
                <p id="duration-guidance">
                  Choose the number of campaign days.
                </p>
              </div>
            </div>
            <input
              id="campaign-days"
              type="number"
              min="1"
              step="1"
              value={days}
              onChange={(event) => setDays(event.target.value)}
              aria-invalid={!isPositiveInteger(days)}
              aria-describedby="duration-guidance pricing-error"
            />
          </div>
          <p
            id="pricing-error"
            className="error"
            role="alert"
            hidden={result.ok}
          >
            {!result.ok && result.error}
          </p>
        </div>
        <aside className="cab-receipt" aria-label="Campaign estimate">
          <h3>Estimated Cost</h3>
          <div
            id="pricing-result"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            <dl className="cab-cost-details">
              <div>
                <dt>Number of Cabs</dt>
                <dd>
                  {isPositiveInteger(vehicles)
                    ? numberFormat.format(Number(vehicles))
                    : "—"}
                </dd>
              </div>
              <div>
                <dt>Plays per Cab per Day</dt>
                <dd id="daily-play-result">
                  {estimate ? numberFormat.format(Number(dailyPlays)) : "—"}
                </dd>
              </div>
              <div>
                <dt>Campaign duration</dt>
                <dd>
                  {isPositiveInteger(days)
                    ? `${numberFormat.format(Number(days))} days`
                    : "—"}
                </dd>
              </div>
              <div>
                <dt>Total Estimated Plays</dt>
                <dd id="total-plays">
                  {estimate ? numberFormat.format(estimate.plays) : "—"}
                </dd>
              </div>
            </dl>
            {estimate && (
              <p className="cab-play-breakdown" id="plays-breakdown">
                {numberFormat.format(estimate.vehicles)} cabs ×{" "}
                {numberFormat.format(estimate.days)} days ×{" "}
                {numberFormat.format(estimate.dailyPlays)} plays/day/cab ={" "}
                {numberFormat.format(estimate.plays)} estimated plays
              </p>
            )}
            <div className="cab-total">
              <h4>Estimated total</h4>
              <strong id="total-cost">
                {estimate ? moneyFormat.format(estimate.cost) : "—"}
              </strong>
              <p>₹0.30 per 30-second play</p>
            </div>
          </div>
          {!embedded && (
            <button
              className="button dark"
              id="continue-enquiry"
              type="button"
              disabled={!estimate}
              onClick={() => {
                if (estimate)
                  window.location.assign(
                    `contact.html?${campaignQuery(estimate)}`,
                  );
              }}
            >
              Discuss This Estimate
            </button>
          )}
        </aside>
      </div>
      <p className="fine">
        Estimated plays = cabs × days × plays per cab per day. Each play is a
        30-second ad at ₹0.30 per play. Taxes and final placement details apply
        at checkout. Total estimated plays must be greater than 1,000.
      </p>
    </section>
  );
}
