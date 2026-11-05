import { useState, type FormEvent } from "react";
import { moneyFormat, numberFormat, readCampaign } from "../lib/campaign";
import { requestDownload } from "../lib/download";
import { saveDemoEnquiry } from "../lib/portal";
import { VehicleOptions } from "./VehicleOptions";

export function EnquiryForm() {
  const [incoming] = useState(() => readCampaign(window.location.search));
  const estimate = incoming?.ok ? incoming.estimate : null;
  const [format, setFormat] = useState<string>(estimate?.type ?? "Both");
  const [formatChanged, setFormatChanged] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  function saveDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const value = (name: string) => String(data.get(name) ?? "").trim();
    const name = value("name");
    const business = value("business");
    if (!name || !business) {
      setStatus("Please provide a name and business name, not just spaces.");
      return;
    }
    setError("");
    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    if (
      submitter instanceof HTMLButtonElement &&
      submitter.value === "admin-demo"
    ) {
      try {
        saveDemoEnquiry({
          id: crypto.randomUUID(),
          name,
          business,
          email: value("email"),
          phone: value("phone"),
          goal: value("goal"),
          message: value("message"),
          createdAt: new Date().toISOString(),
        });
        setStatus(
          "Enquiry saved in this browser for the website admin. Nothing has been sent to Adrover.",
        );
      } catch (saveError) {
        setError(
          saveError instanceof Error
            ? saveError.message
            : "The enquiry could not be saved.",
        );
        setStatus("");
      }
      return;
    }
    const brief = [
      "ADROVER / CAMPAIGN ENQUIRY DRAFT",
      `Name: ${name}`,
      `Business: ${business}`,
      `Email: ${value("email")}`,
      `Phone: ${value("phone") || "Not provided"}`,
      `Objective: ${value("goal")}`,
      `Interior screen format: ${format}`,
      "Service city: Hyderabad",
      "",
      estimate
        ? `ILLUSTRATIVE PLAN: ${estimate.vehicles} total vehicles, ${estimate.days} days, ${estimate.dailyPlays} plays per vehicle/day. ${numberFormat.format(estimate.plays)} plays; ${moneyFormat.format(estimate.cost)} at assumed INR 0.25/play. This is not a quote.`
        : "Campaign scope and budget: to be discussed.",
      "",
      `Requirements: ${value("message") || "To be discussed"}`,
      "",
      "Please confirm availability, technical requirements, tax,",
      "commercial terms, delivery assumptions and final quotation.",
      "",
      "LOCAL PREVIEW DRAFT. Nothing has been submitted or sent.",
      "Use only verified Adrover contact channels once provided.",
    ].join("\n");
    requestDownload("Adrover-enquiry-draft.txt", brief);
    setStatus("Draft download requested. Nothing has been sent to Adrover.");
  }

  return (
    <form className="enquiry-form" id="enquiry-form" onSubmit={saveDraft}>
      <div className="eyebrow">Prepare your campaign enquiry</div>
      <h2>Start with the essentials.</h2>
      <p className="fine">
        Download a local draft or save an enquiry for the website admin in this
        browser. Nothing is sent to a server.
      </p>
      <div id="incoming-campaign" className="summary-box" hidden={!estimate}>
        {estimate &&
          (formatChanged
            ? `Updated format: ${format}. Illustrative plan: ${estimate.vehicles} vehicles, ${estimate.days} days, ${estimate.dailyPlays} plays/vehicle/day. ${numberFormat.format(estimate.plays)} plays; ${moneyFormat.format(estimate.cost)}. Same assumed INR 0.25/play; final format pricing requires confirmation.`
            : `From your illustrative estimate: ${estimate.vehicles} vehicles, ${estimate.days} days, ${estimate.dailyPlays} plays/vehicle/day. ${numberFormat.format(estimate.plays)} estimated plays; ${moneyFormat.format(estimate.cost)} at an assumed INR 0.25/play. Format: ${format}. Not a quote.`)}
      </div>
      <p
        id="incoming-error"
        className="error"
        role="alert"
        hidden={!incoming || incoming.ok}
      >
        {incoming &&
          !incoming.ok &&
          `The campaign link could not be used: ${incoming.error} You can still prepare a new enquiry below.`}
      </p>
      <div className="fields">
        <div className="field">
          <label htmlFor="contact-name">Your name *</label>
          <input
            id="contact-name"
            name="name"
            required
            maxLength={100}
            autoComplete="name"
            placeholder="Your full name"
          />
        </div>
        <div className="field">
          <label htmlFor="business-name">Business name *</label>
          <input
            id="business-name"
            name="business"
            required
            maxLength={150}
            autoComplete="organization"
            placeholder="Your business or brand"
          />
        </div>
        <div className="field">
          <label htmlFor="work-email">Work email *</label>
          <input
            id="work-email"
            name="email"
            type="email"
            required
            maxLength={254}
            autoComplete="email"
            placeholder="Your email address"
          />
        </div>
        <div className="field">
          <label htmlFor="contact-phone">Phone / WhatsApp</label>
          <input
            id="contact-phone"
            name="phone"
            type="tel"
            maxLength={35}
            autoComplete="tel"
            placeholder="Optional contact number"
          />
        </div>
        <div className="field">
          <label htmlFor="campaign-goal">Campaign objective *</label>
          <select id="campaign-goal" name="goal" required defaultValue="">
            <option value="">Choose an objective</option>
            <option>Introduce my business</option>
            <option>Launch a product or service</option>
            <option>Promote an offer or event</option>
            <option>Discuss a campaign idea</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="preferred-format">Preferred screen format</label>
          <select
            id="preferred-format"
            name="format"
            value={format}
            onChange={(event) => {
              setFormat(event.target.value);
              setFormatChanged(true);
            }}
          >
            <VehicleOptions />
          </select>
        </div>
        <div className="field full">
          <label htmlFor="campaign-message">Anything we should know?</label>
          <textarea
            id="campaign-message"
            name="message"
            maxLength={2000}
            placeholder="Preferred dates, areas, budget or your creative idea."
          />
        </div>
      </div>
      <button className="button" type="submit">
        Save My Enquiry Draft
      </button>
      <button
        className="button ghost small"
        type="submit"
        name="action"
        value="admin-demo"
      >
        Save enquiry for admin
      </button>
      <p className="error" role="alert">
        {error}
      </p>
      <p
        className="status"
        id="enquiry-status"
        role="status"
        aria-live="polite"
      >
        {status}
      </p>
      <p className="fine">
        Nothing is sent. Live enquiry delivery can be enabled only after
        verified contact details and the privacy process are finalized.
      </p>
    </form>
  );
}
