import { useEffect, useRef } from "react";

function LandingIcon({
  kind,
}: {
  kind: "story" | "upload" | "reach" | "screen" | "pin";
}) {
  const paths = {
    story: "M14 3H5v18h14V8l-5-5ZM14 3v6h5M8 12h7M8 16h4",
    upload:
      "M7 18H5a4 4 0 0 1-1-8 7 7 0 0 1 13-3 5 5 0 0 1 2 11h-2M12 21V10m-4 4 4-4 4 4",
    reach: "M3 21V14h4v7M10 21V8h4v13M17 21V3h4v18",
    screen: "M3 3h18v14H3ZM12 17v4m-4 0h8",
    pin: "M19 10c0 5-7 12-7 12S5 15 5 10a7 7 0 1 1 14 0ZM12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6",
  };
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[kind]} />
    </svg>
  );
}

const uploadSteps = [
  {
    number: "01",
    icon: "story",
    title: "Choose your campaign",
    copy: "Select Start Campaign, then choose your target cabs, plays and duration to customize your campaign.",
    preview: "One message. A memorable moment.",
    guidance: "Pick the offer, launch or message you want riders to remember.",
    tags: ["Your brand", "Your message", "Your audience"],
  },
  {
    number: "02",
    icon: "upload",
    title: "Upload your digital ad",
    copy: "Upload your digital ad and agree to the terms and conditions. Your business is one step away from reaching commuters.",
    preview: "Shape your story for the screen.",
    guidance:
      "Better ads, bigger impact. Make your message clear, vibrant and attractive to commuters.",
    tags: ["Clear visuals", "Readable text", "Sound-off friendly"],
  },
  {
    number: "03",
    icon: "reach",
    title: "Approve & go live",
    copy: "Review your ad details, complete payment, and get your brand broadcasting across the city fleet.",
    preview: "From your idea to their daily route.",
    guidance:
      "Verify your number of cabs, plays and duration, and preview your ad before completing payment.",
    tags: ["Review creative"],
  },
] as const;

const testimonials = [
  {
    quote:
      "Adrover gave us unmatched captive reach among IT commuters traveling through Madhapur and Financial District.",
    name: "Vikram Reddy",
    detail: "Head of Growth, Cyberabad FinTech",
    initials: "VR",
  },
  {
    quote:
      "The verifiable play telemetry and geo-targeted cab screens helped boost our store walk-ins by 34%.",
    name: "Sneha Rao",
    detail: "Brand Lead, Deccan Retail",
    initials: "SR",
  },
  {
    quote:
      "Approval was lightning fast and our in-cab video reached commuters right before lunch and dinner hours.",
    name: "Farhan Ahmed",
    detail: "Founder, Hyderabad DinePass",
    initials: "FA",
  },
];

export function Home() {
  const journeyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!journeyRef.current || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const visible =
            entry.isIntersecting && entry.intersectionRatio >= 0.25;
          entry.target.setAttribute("data-in-view", String(visible));
          if (visible) {
            entry.target.setAttribute("data-animated", "true");
          }
        }
      },
      { threshold: [0, 0.25] },
    );
    journeyRef.current
      .querySelectorAll(".upload-step")
      .forEach((step) => observer.observe(step));
    return () => observer.disconnect();
  }, []);
  return (
    <div className="landing">
      <section className="landing-hero" id="about">
        <svg
          className="landing-cab-photo"
          viewBox="0 0 500 680"
          preserveAspectRatio="xMidYMid slice"
          width="500"
          height="680"
          role="img"
          aria-label="Six sample Adrover ad screens: good journeys, bigger possibilities, memorable brands, local discoveries, new launches, and your next chapter."
        >
          <image
            href="assets/hyderabad-cab-hero.jpg"
            width="504"
            height="683"
          />
          <g aria-hidden="true">
            <rect x="131" y="450" width="111" height="10" fill="#101814" />
        
          </g>
          <rect
            className="cab-screen-backdrop"
            x="109"
            y="293"
            width="0"
            height="0"
            fill="#101814"
            
          />
          <defs>
  <clipPath id="adScreenClip">
    <rect
      x="0"
      y="0"
      width="274"
      height="157"
      rx="12"
      ry="12"
    />
  </clipPath>
</defs>
          <svg
            x="102"
            y="230"
            width="330"
            height="295"
            viewBox="0 0 320 165"
            preserveAspectRatio="xMidYMid meet"
            overflow="hidden"
            transform="rotate(1 277.5 380)"
            aria-hidden="true"
          >
            <g clipPath="url(#adScreenClip)"> 
            <rect width="330" height="295" fill="#101814" />
            <g className="cab-ad-slide cab-ad-first">
              <rect width="330" height="295" fill="#ffd21c" />
              <circle
                className="cab-ad-orbit"
                cx="167"
                cy="18"
                r="45"
                fill="none"
                stroke="#dfb315"
                strokeWidth="14"
              />
              <text x="13" y="20" className="cab-ad-eyebrow">
                HELLO, HYDERABAD
              </text>
              <text x="13" y="48" className="cab-ad-heading">
                Good journeys.
              </text>
              <text x="13" y="71" className="cab-ad-heading">
                Great brands.
              </text>
              <rect
                x="13"
                y="89"
                width="127"
                height="24"
                rx="12"
                fill="#087a45"
              />
              <text x="23" y="105" fill="white" fontSize="10" fontWeight="700">
                Your story starts here
              </text>
            </g>
            <g className="cab-ad-slide cab-ad-second">
              <rect width="274" height="157" fill="#087a45" />
              <path
                className="cab-ad-route"
                d="M-15 114C57 64 96 150 200 70"
                fill="none"
                stroke="#ffd21c"
                strokeWidth="5"
                strokeDasharray="8 7"
              />
              <text x="13" y="20" className="cab-ad-eyebrow" fill="#ffd21c">
                A LITTLE RIDE.
              </text>
              <text x="13" y="49" className="cab-ad-heading" fill="white">
                A bigger
              </text>
              <text x="13" y="73" className="cab-ad-heading" fill="white">
                possibility.
              </text>
              <text x="13" y="96" fill="white" fontSize="10">
                Ad on the move.
              </text>
            </g>
            <g className="cab-ad-slide cab-ad-third">
              <rect width="274" height="157" fill="#101814" />
              <text x="13" y="20" className="cab-ad-eyebrow" fill="#ffd21c">
                PICTURE YOUR BRAND HERE
              </text>
              <text x="13" y="49" className="cab-ad-heading" fill="white">
                Seen inside.
              </text>
              <text x="13" y="73" className="cab-ad-heading" fill="white">
                Remembered
              </text>
              <text x="13" y="97" className="cab-ad-heading" fill="#ffd21c">
                outside.
              </text>
            </g>
            <g className="cab-ad-slide cab-ad-fourth">
              <rect width="274" height="157" fill="#eaf3e8" />
              <circle
                className="cab-ad-orbit"
                cx="173"
                cy="113"
                r="32"
                fill="#c9dfce"
              />
              <text x="13" y="20" className="cab-ad-eyebrow" fill="#087a45">
                DISCOVER SOMETHING LOCAL
              </text>
              <text x="13" y="49" className="cab-ad-heading">
                New places.
              </text>
              <text x="13" y="73" className="cab-ad-heading">
                Fresh stories.
              </text>
              <text
                x="13"
                y="104"
                fill="#087a45"
                fontSize="10"
                fontWeight="700"
              >
                Find inspiration along the way.
              </text>
            </g>
            <g className="cab-ad-slide cab-ad-fifth">
              <rect width="274" height="157" fill="#ffd21c" />
              <path
                className="cab-ad-route"
                d="M-10 116H195"
                fill="none"
                stroke="#087a45"
                strokeWidth="4"
                strokeDasharray="8 7"
              />
              <text x="13" y="20" className="cab-ad-eyebrow">
                SOMETHING NEW IN TOWN?
              </text>
              <text x="13" y="49" className="cab-ad-heading">
                Big launch.
              </text>
              <text x="13" y="73" className="cab-ad-heading">
                Local spotlight.
              </text>
              <text x="13" y="97" fill="#087a45" fontSize="10" fontWeight="700">
                Give your next idea a little airtime.
              </text>
            </g>
            <g className="cab-ad-slide cab-ad-sixth">
              <rect width="274" height="157" fill="#143c2a" />
              <text x="13" y="20" className="cab-ad-eyebrow" fill="#ffd21c">
                YOUR NEXT CHAPTER
              </text>
              <text x="13" y="49" className="cab-ad-heading" fill="white">
                Your video.
              </text>
              <text x="13" y="73" className="cab-ad-heading" fill="white">
                Their journey.
              </text>
              <rect
                x="13"
                y="90"
                width="145"
                height="24"
                rx="12"
                fill="#ffd21c"
              />
              <text
                x="23"
                y="106"
                fill="#101814"
                fontSize="10"
                fontWeight="700"
              >
                Imagine the possibilities.
              </text>
            </g>
            </g>
          </svg>
        </svg>
        <div className="cab-ad-controls">
          <span>Sample ad preview</span>
        </div>
        <div className="wrap landing-hero-content">
          <div className="landing-copy scroll-reveal">
            <p className="landing-kicker">Cab advertising in Hyderabad</p>
            <h1>
              Ads on the
              <br />
              <em>move</em>
            </h1>
            <p className="landing-intro">
              AdRover helps your business connect with people while they move
              around the city. We broadcast your digital ads on screens inside
              moving cabs, turning daily commutes into active branding
              opportunities.
            </p>
            <div className="landing-actions">
              <a className="button yellow" href="#upload">
                Start Campaign
              </a>
              <a className="landing-text-link" href="#upload">
                See how it works{" "}
                <span className="play-outline" aria-hidden="true">
                  ▶
                </span>
              </a>
            </div>
          </div>
        </div>
        <div className="wrap landing-proof scroll-reveal">
          <div>
            <LandingIcon kind="screen" />
            <span>
              <strong>Made to be seen</strong>
              <small>Passenger-facing screens</small>
            </span>
          </div>
          <div>
            <LandingIcon kind="reach" />
            <span>
              <strong>Reach Hyderabad</strong>
              <small>Along the daily journey</small>
            </span>
          </div>
          <div>
            <LandingIcon kind="pin" />
            <span>
              <strong>Ad on the move.</strong>
              <small>Local stories, everyday rides</small>
            </span>
          </div>
        </div>
      </section>

      <section className="upload-section" id="upload">
        <div className="wrap">
          <div className="landing-section-heading scroll-reveal">
            <p className="landing-kicker">A simple way to get moving</p>
            <h2>Get your ad on the move.</h2>
            <p>
              Three easy steps to launch your digital ads in front of daily
              commuters.
            </p>
          </div>
          <div className="journey-toolbar">
            <p>One story. Three simple steps. A whole city of possibilities.</p>
          </div>
          <div className="upload-steps" ref={journeyRef}>
            {uploadSteps.map((step) => (
              <article className="upload-step" key={step.number}>
                <span className="step-number">{step.number}</span>
                <div className="step-line" aria-hidden="true"></div>
                <div className="step-icon">
                  <LandingIcon kind={step.icon} />
                </div>
                <h3 id={`journey-heading-${step.number}`}>{step.title}</h3>
                <p>{step.copy}</p>
                <div
                  className="journey-preview"
                  id={`journey-preview-${step.number}`}
                  role="region"
                  aria-labelledby={`journey-heading-${step.number}`}
                >
                  <div
                    className={`journey-scene journey-scene-${step.icon}`}
                    aria-hidden="true"
                  >
                    <div className="journey-mini-screen">
                      <span>AdRover</span>
                      <strong>{step.preview}</strong>
                      {step.icon === "upload" && (
                        <span className="journey-play">▶</span>
                      )}
                      <div className="journey-scene-lines">
                        <i />
                        <i />
                        <i />
                      </div>
                      {step.icon === "reach" && (
                        <div className="journey-road">
                          <span className="journey-cab">
                            AdRover
                            <i />
                            <i />
                          </span>
                        </div>
                      )}
                    </div>
                    <span className="journey-scene-label">
                      Step illustration · {step.number}/03
                    </span>
                  </div>
                  <p>{step.guidance}</p>
                  <ul className="journey-tags">
                    {step.tags.map((tag) => (
                      <li key={tag}>{tag}</li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
          <div className="upload-cta scroll-reveal">
            <div>
              <p className="landing-kicker">Let&apos;s talk</p>
              <p>
                Have a question about advertising? Leave your details for a
                callback.
              </p>
            </div>
            <a className="button" href="contact.html">
              Request a callback
            </a>
          </div>
          <p className="upload-disclaimer">
            The illustrations above are not screen recordings. This website
            preview does not accept payments or confirm campaign bookings.
            Contact us to discuss your campaign.
          </p>
          <div
            className="service-strip"
            id="services"
            aria-label="Our services"
          >
            <div>
              <LandingIcon kind="screen" />
              <span>Cab screen ads</span>
            </div>
            <div>
              <LandingIcon kind="story" />
              <span>Creative planning</span>
            </div>
            <div>
              <LandingIcon kind="upload" />
              <span>Video preparation</span>
            </div>
            <div>
              <LandingIcon kind="pin" />
              <span>Hyderabad focused</span>
            </div>
            <p>
              Turn each ride into a high-impact branding opportunity for your
              business.
            </p>
          </div>
        </div>
      </section>

      <section className="testimonials-section" id="testimonials">
        <div className="wrap">
          <div className="landing-section-heading scroll-reveal">
            <p className="landing-kicker">Hyderabad advertiser feedback</p>
            <h2>Trusted by Businesses</h2>
            <p>
              A sample look at feedback from tech leaders, retail brands and
              local founders in Hyderabad.
            </p>
          </div>
          <div className="testimonials">
            {testimonials.map((testimonial) => (
              <figure
                className="testimonial scroll-reveal"
                key={testimonial.name}
              >
                <div
                  className="testimonial-rating"
                  aria-label="Sample rating: 5 out of 5"
                >
                  <span aria-hidden="true">★★★★★</span>
                  <small>5.0 · Sample</small>
                </div>
                <blockquote>{testimonial.quote}</blockquote>
                <figcaption>
                  <span className="testimonial-avatar" aria-hidden="true">
                    {testimonial.initials}
                  </span>
                  <div>
                    <strong>{testimonial.name}</strong>
                    <span>{testimonial.detail}</span>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
