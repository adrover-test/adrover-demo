export function Faq() {
  return (
    <section className="landing-faq faq-page wrap" id="faq">
      <div>
        <p className="landing-kicker">Frequently asked questions</p>
        <h1>Good to know before you go.</h1>
        <p className="fine">
          Get to know Adrover and how to prepare your campaign.
        </p>
        <a className="button small" href="contact.html">
          Ask a question
        </a>
      </div>
      <div className="landing-faq-list">
        <details open>
          <summary>What does Adrover do?</summary>
          <p>
            We help brands share video campaigns on interior passenger screens
            inside cabs and buses.
          </p>
        </details>
        <details>
          <summary>Can I upload a video now?</summary>
          <p>
            You can choose an MP4 or WebM on the campaign page and play it in a
            cab-screen mockup. It stays on your device. Sending files to Adrover
            and final screen compatibility must be confirmed before launch.
          </p>
        </details>
      </div>
    </section>
  );
}
