import { EnquiryForm } from "../components/EnquiryForm";
export function Contact() {
  return (
    <>
      <section className="campaign-heading wrap">
        <h1>Contact us</h1>
        <p>
          Prepare your campaign enquiry. This preview saves a local draft only.
        </p>
      </section>
      <section className="wrap section tight contact-content">
        <div className="split">
          <div>
            <h2>Your next campaign</h2>
            <p className="muted">
              Contact channels are pending verification. Use the form to prepare
              your brief; nothing is sent yet.
            </p>
            <div className="contacts">
              <article className="contact-card">
                <span className="pending">CONTACT PENDING</span>
                <h3>WhatsApp</h3>
                <span className="placeholder">
                  [Add verified WhatsApp number]
                </span>
                <p>For a campaign conversation and initial requirements.</p>
              </article>
              <article className="contact-card">
                <span className="pending">CONTACT PENDING</span>
                <h3>Call Adrover</h3>
                <span className="placeholder">[Add business phone number]</span>
                <p>Business hours: [to be confirmed].</p>
              </article>
              <article className="contact-card">
                <span className="pending">CONTACT PENDING</span>
                <h3>Business email</h3>
                <span className="placeholder">
                  [Add verified business email]
                </span>
                <p>
                  For campaign briefs, creative requirements and quotations.
                </p>
              </article>
              <article className="contact-card">
                <span className="pending">HYDERABAD FOCUS</span>
                <h3>Service city</h3>
                <span className="placeholder">Hyderabad, Telangana, India</span>
                <p>Office / meeting address: [to be added].</p>
              </article>
            </div>
            <div className="callout" style={{ marginTop: "23px" }}>
              <strong>Prefer to plan first?</strong>
              <br />
              Explore an illustrative cost and playback estimate, then bring
              those numbers into your enquiry.
              <br />
              <a
                className="text-link"
                href="pricing.html#planner"
                style={{ marginTop: "11px" }}
              >
                Open the campaign planner →
              </a>
            </div>
          </div>
          <EnquiryForm />
        </div>
      </section>
      <section className="wrap section tight" id="launch-notes">
        <div className="callout">
          <h3>What happens next</h3>
          <p>
            Prepare your brief, confirm available options and review a quote
            before booking. This preview saves a local draft only; nothing is
            sent.
          </p>
          <p className="fine">
            Contact details, Privacy and Terms, and campaign commitments are
            pending confirmation.
          </p>
        </div>
      </section>
    </>
  );
}
