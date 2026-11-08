import {
  calculateAds,
  campaignQuery,
  isPositiveInteger,
  moneyFormat,
  numberFormat,
} from "../lib/campaign";
import { useState } from "react";

export type CampaignSelection = {
  vehicles: string;
  ads: string;
  weeks: number;
};
export const defaultCampaignSelection: CampaignSelection = {
  vehicles: "20",
  ads: "1000",
  weeks: 1,
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
  const { vehicles, ads, weeks } = selection ?? localSelection;
  function update(change: Partial<CampaignSelection>) {
    const next = { vehicles, ads, weeks, ...change };
    if (onSelectionChange) onSelectionChange(next);
    else setLocalSelection(next);
  }
  const setVehicles = (vehicles: string) => update({ vehicles });
  const setAds = (ads: string) => update({ ads });
  const setWeeks = (weeks: number) => update({ weeks });
  const result = calculateAds(vehicles, ads, weeks);
  const estimate = result.ok ? result.estimate : null;
  const duration = `${weeks} ${weeks === 1 ? "Week" : "Weeks"} (${weeks * 7} days)`;

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
            <span>Per ad only</span>
            <strong>₹0.30!</strong>
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
                <label htmlFor="ad-count">Number of Ads</label>
                <p id="ads-guidance">Minimum 1,000 ads (enter 1,000 or more)</p>
              </div>
            </div>
            <input
              id="ad-count"
              type="number"
              min="1000"
              step="1"
              value={ads}
              onChange={(event) => setAds(event.target.value)}
              aria-invalid={!isPositiveInteger(ads) || Number(ads) < 1000}
              aria-describedby="ads-guidance pricing-error"
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
                <span id="duration-label" className="cab-duration-label">
                  Campaign Duration (Weeks)
                </span>
                <p id="duration-guidance">
                  Select how long you want to run the campaign (minimum 7 days /
                  1 week).
                </p>
              </div>
            </div>
            <div
              role="group"
              aria-labelledby="duration-label"
              aria-describedby="duration-guidance"
            >
              <div className="cab-week-options">
                {[1, 2, 3].map((week) => (
                  <button
                    key={week}
                    type="button"
                    aria-pressed={weeks === week}
                    onClick={() => setWeeks(week)}
                  >
                    <strong>
                      {week} {week === 1 ? "Week" : "Weeks"}
                    </strong>
                    <span>({week * 7} days)</span>
                  </button>
                ))}
              </div>
            </div>
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
                <dt>Number of Ads</dt>
                <dd id="total-plays">
                  {isPositiveInteger(ads)
                    ? numberFormat.format(Number(ads))
                    : "—"}
                </dd>
              </div>
              <div>
                <dt>Duration</dt>
                <dd>{duration}</dd>
              </div>
            </dl>
            <div className="cab-total">
              <h4>Estimated total</h4>
              <strong id="total-cost">
                {estimate ? moneyFormat.format(estimate.cost) : "—"}
              </strong>
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
        Total ads × ₹0.30, across all cabs and weeks. Minimum 7 days. Pricing
        and availability need confirmation; taxes extra.
      </p>
    </section>
  );
}
