import { useEffect, useState } from "react";
import {
  calculate,
  campaignQuery,
  isPositiveInteger,
  moneyFormat,
  numberFormat,
  type Estimate,
} from "../lib/campaign";
import { VehicleOptions } from "./VehicleOptions";

export function CampaignPlanner({
  onEstimateChange,
}: {
  onEstimateChange?: (estimate: Estimate | null) => void;
}) {
  const [type, setType] = useState("Both");
  const [vehicles, setVehicles] = useState("20");
  const [days, setDays] = useState("10");
  const [dailyPlays, setDailyPlays] = useState("50");
  const result = calculate(vehicles, days, dailyPlays, type);
  const estimate = result.ok ? result.estimate : null;
  useEffect(() => {
    onEstimateChange?.(estimate);
  }, [
    onEstimateChange,
    estimate?.vehicles,
    estimate?.days,
    estimate?.dailyPlays,
    estimate?.type,
  ]);
  const fields = [
    {
      id: "vehicle-count",
      label: "Vehicles (combined total)",
      value: vehicles,
      set: setVehicles,
    },
    {
      id: "campaign-days",
      label: "Campaign days",
      value: days,
      set: setDays,
    },
    {
      id: "daily-plays",
      label: "Plays / vehicle / day",
      value: dailyPlays,
      set: setDailyPlays,
    },
  ];
  return (
    <section className="wrap compact-planner" id="planner">
      <div className="planner-bg">
        <div className="planner-heading">
          <h2>Campaign estimate</h2>
          <span className="tag">ILLUSTRATIVE ONLY</span>
        </div>
        <div className="ticket">
          <div className="config">
            <div className="fields">
              <div className="field">
                <label htmlFor="vehicle-type">Vehicle format</label>
                <select
                  id="vehicle-type"
                  value={type}
                  onChange={(event) => setType(event.target.value)}
                >
                  <VehicleOptions />
                </select>
              </div>
              {fields.map((field) => (
                <div className="field" key={field.id}>
                  <label htmlFor={field.id}>{field.label}</label>
                  <input
                    id={field.id}
                    type="number"
                    min="1"
                    step="1"
                    value={field.value}
                    onChange={(event) => field.set(event.target.value)}
                    aria-invalid={!isPositiveInteger(field.value)}
                    aria-describedby="pricing-error"
                  />
                </div>
              ))}
            </div>
            <div className="formula" id="estimate-formula" hidden={!estimate}>
              {estimate &&
                `${estimate.vehicles} vehicles x ${estimate.days} days x ${estimate.dailyPlays} plays/day = ${numberFormat.format(estimate.plays)} estimated plays`}
            </div>
            <p
              id="pricing-error"
              className="error"
              role="alert"
              tabIndex={-1}
              hidden={result.ok}
            >
              {!result.ok && result.error}
            </p>
          </div>
          <div className="receipt">
            <div
              id="pricing-result"
              role="status"
              aria-live="polite"
              aria-atomic="true"
              hidden={!estimate}
            >
              <div className="eyebrow">Estimated cost</div>
              <div className="price" id="total-cost">
                {estimate && moneyFormat.format(estimate.cost)}
              </div>
              <div className="plays">
                <strong id="total-plays">
                  {estimate && numberFormat.format(estimate.plays)}
                </strong>{" "}
                <span className="sub">estimated plays</span>
              </div>
            </div>
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
          </div>
        </div>
        <p className="fine">
          Assumes &#8377;0.25/play for cabs and buses; excludes taxes and fees.
          Rates and availability need confirmation. No booking or payment.
        </p>
      </div>
    </section>
  );
}
