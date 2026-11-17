import { useState, type FormEvent } from "react";
import { campaignDescription, readCampaign } from "../lib/campaign";
import { saveDemoEnquiry } from "../lib/portal";

const enquiryApiBaseUrl = (
  import.meta.env.VITE_API_BASE_URL ?? "https://localhost:7100"
)
  .trim()
  .replace(/\/$/, "");
const enquiryApiPath = "/api/inquiries";

type EnquiryRequest = {
  name: string;
  business: string;
  email: string;
  phone: string;
  goal: string;
  message: string;
  format: string;
};

async function sendEnquiry(payload: EnquiryRequest) {
  let response: Response;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  try {
    response = await fetch(`${enquiryApiBaseUrl}${enquiryApiPath}`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error("Unable to reach the enquiry service. Please try again.");
  }

  if (response.ok) return;

  let message = "The enquiry could not be sent.";
  const responseText = await response.text();
  if (responseText.trim()) {
    try {
      const result: unknown = JSON.parse(responseText);
      if (
        typeof result === "object" &&
        result !== null &&
        "message" in result &&
        typeof result.message === "string" &&
        result.message.trim()
      ) {
        message = result.message;
      } else {
        message = responseText;
      }
    } catch {
      message = responseText;
    }
  }

  throw new Error(message);
}

export function EnquiryForm() {
  const [incoming] = useState(() => readCampaign(window.location.search));
  const estimate = incoming?.ok ? incoming.estimate : null;
  const format = estimate?.type ?? "Cabs";
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isSending, setIsSending] = useState(false);

  async function saveDraft(event: FormEvent<HTMLFormElement>) {
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
    setStatus("");
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

    setIsSending(true);
    try {
      await sendEnquiry({
        name,
        business,
        email: value("email"),
        phone: value("phone"),
        goal: value("goal"),
        message: value("message"),
        format,
      });
      form.reset();
      setStatus("Enquiry sent successfully.");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "The enquiry could not be sent.",
      );
    } finally {
      setIsSending(false);
    }
  }

  return (
    <form className="enquiry-form" id="enquiry-form" onSubmit={saveDraft}>
      <div className="eyebrow">Prepare your campaign enquiry</div>
      <h2>Start with the essentials.</h2>
      <p className="fine">Send your enquiry directly to the Adrover API.</p>
      <div id="incoming-campaign" className="summary-box" hidden={!estimate}>
        {estimate &&
          `From your illustrative estimate: ${campaignDescription(estimate)} Format: ${format}. Not a quote.`}
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
          <label htmlFor="work-email">Work email</label>
          <input
            id="work-email"
            name="email"
            type="email"
            required
            maxLength={254}
            autoComplete="email"
            placeholder="Optional email address"
          />
        </div>
        <div className="field">
          <label htmlFor="contact-phone">Phone / WhatsApp *</label>
          <input
            id="contact-phone"
            name="phone"
            type="tel"
            maxLength={35}
            autoComplete="tel"
            placeholder="contact number"
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
      <button className="button" type="submit" disabled={isSending}>
        {isSending ? "Sending..." : "Send My Enquiry"}
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
    </form>
  );
}
