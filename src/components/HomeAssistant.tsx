import { useEffect, useRef, useState, type FormEvent } from "react";

type Reply = {
  text: string;
  href?: string;
  linkText?: string;
};

type Message = {
  id: number;
  role: "assistant" | "user";
  text: string;
  href?: string;
  linkText?: string;
};

const suggestions = [
  "How much does a campaign cost?",
  "How does the process work?",
  "How can I get in touch?",
];

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});
const number = new Intl.NumberFormat("en-IN");

function answerQuestion(question: string): Reply {
  const text = question.toLowerCase();

  if (
    /\b(price|pricing|cost|budget|estimate|estimated|₹|rupee|rupees)\b/.test(
      text,
    )
  ) {
    const playsPerDay = 1000;
    const days = 7;
    const plays = playsPerDay * days;
    return {
      text: `Each 30-second play is ₹0.30. Estimate your campaign as plays per day × campaign days; cab count does not affect the price. The minimum plan is 1,000 plays/day × 7 days = ${number.format(plays)} plays, or ${currency.format(plays * 0.3)} before taxes. This is illustrative; availability, final placement and taxes can change the final quote.`,
      href: "pricing.html#planner",
      linkText: "Open campaign planner",
    };
  }

  if (
    /\b(contact|reach|email|phone|call|whatsapp|human|talk|support|callback)\b|get in touch/.test(
      text,
    )
  ) {
    return {
      text: "The contact channels on this site are still pending verification. The contact page has an enquiry form, but this preview only saves a draft on your device; it does not send a message. Please confirm a working contact channel before sharing sensitive information.",
      href: "contact.html",
      linkText: "View contact options",
    };
  }

  if (
    /\b(process|how (do|does|can|to)|how it works|steps|start|begin|launch|book|booking|campaign)\b/.test(
      text,
    )
  ) {
    return {
      text: "Plan your cab count, campaign days and daily plays, then prepare your video ad and review your campaign details. Before booking, confirm availability, creative requirements and a final quote with Adrover. This website is a preview: it does not accept payment or confirm bookings.",
      href: "pricing.html#planner",
      linkText: "Plan a campaign",
    };
  }

  if (
    /\b(video|upload|file|format|mp4|webm|creative|ad specs|requirements)\b/.test(
      text,
    )
  ) {
    return {
      text: "You can preview an MP4 or WebM video in the campaign studio. The preview file stays on your device and is not sent to Adrover; it also does not transfer to the registration page. Confirm final creative and screen requirements before booking.",
      href: "pricing.html#planner",
      linkText: "Explore the campaign studio",
    };
  }

  if (
    /\b(where|location|city|cities|hyderabad|coverage|area|areas|bus|buses)\b/.test(
      text,
    )
  ) {
    return {
      text: "Adrover is focused on Hyderabad. The current campaign estimator supports cab campaigns; ask Adrover to confirm service areas, fleet availability and any other formats before planning a booking.",
      href: "contact.html",
      linkText: "View contact options",
    };
  }

  if (/\b(payment|pay|tax|taxes|gst|refund)\b/.test(text)) {
    return {
      text: "The planner provides an estimate at ₹0.30 per 30-second play. Taxes and final placement details apply at checkout. This website preview does not accept payments, process refunds or confirm bookings.",
      href: "pricing.html#planner",
      linkText: "See the campaign estimate",
    };
  }

  if (
    /\b(privacy|private|data|stored|save|saved|remember|record|chat)\b/.test(
      text,
    )
  ) {
    return {
      text: "This assistant responds using information built into the website. Your messages are not sent to an AI service or saved by this chat; they remain in this page until you leave or refresh it. The contact form also saves only a local draft in this preview.",
      href: "contact.html",
      linkText: "View contact options",
    };
  }

  if (
    /\b(hello|hi|hey|good morning|good afternoon|good evening)\b/.test(text)
  ) {
    return {
      text: "Hi! I can help with campaign estimates, how it works, video ads, coverage or contact options. What would you like to know?",
    };
  }

  return {
    text: "I can help with campaign pricing, the launch process, video requirements, Hyderabad coverage and contact options. For anything else, the contact page has the latest enquiry information; this preview does not send enquiries.",
    href: "faq.html",
    linkText: "Browse frequently asked questions",
  };
}

export function HomeAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      role: "assistant",
      text: "Hi! I’m the Adrover assistant. Ask me about campaign estimates, the process, video ads or contact options.",
    },
  ]);
  const nextId = useRef(1);
  const inputRef = useRef<HTMLInputElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [isOpen, messages]);

  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  function submitQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const question = draft.trim().slice(0, 500);
    if (!question) return;

    const reply = answerQuestion(question);
    setMessages((current) => [
      ...current,
      { id: nextId.current++, role: "user", text: question },
      {
        id: nextId.current++,
        role: "assistant",
        ...reply,
      },
    ]);
    setDraft("");
  }

  function askSuggestion(question: string) {
    const reply = answerQuestion(question);
    setMessages((current) => [
      ...current,
      { id: nextId.current++, role: "user", text: question },
      {
        id: nextId.current++,
        role: "assistant",
        ...reply,
      },
    ]);
  }

  return (
    <aside className="home-assistant" aria-label="Adrover chat assistant">
      {isOpen && (
        <section
          className="assistant-panel"
          id="assistant-panel"
          aria-labelledby="assistant-title"
          aria-describedby="assistant-privacy"
        >
          <header className="assistant-header">
            <span className="assistant-avatar" aria-hidden="true">
              A
            </span>
            <div className="assistant-heading">
              <h2 id="assistant-title">Adrover assistant</h2>
              <span>
                <i aria-hidden="true" />
                Here to help
              </span>
            </div>
            <button
              className="assistant-close"
              type="button"
              aria-label="Close chat"
              onClick={() => {
                setIsOpen(false);
                triggerRef.current?.focus();
              }}
            >
              ×
            </button>
          </header>
          <p className="assistant-privacy" id="assistant-privacy">
            Instant answers · Your messages stay on this page
          </p>
          <div
            className="assistant-messages"
            ref={logRef}
            role="log"
            aria-label="Chat messages"
            aria-live="polite"
            aria-relevant="additions"
          >
            {messages.map((message) => (
              <div
                className={`assistant-message assistant-message-${message.role}`}
                key={message.id}
              >
                <p>{message.text}</p>
                {message.href && message.linkText && (
                  <a href={message.href}>
                    {message.linkText} <span aria-hidden="true">→</span>
                  </a>
                )}
              </div>
            ))}
            {messages.length === 1 && (
              <div
                className="assistant-suggestions"
                aria-label="Suggested questions"
              >
                {suggestions.map((suggestion) => (
                  <button
                    type="button"
                    key={suggestion}
                    onClick={() => askSuggestion(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
          <form className="assistant-form" onSubmit={submitQuestion}>
            <label className="assistant-sr-only" htmlFor="assistant-question">
              Ask a question
            </label>
            <input
              id="assistant-question"
              ref={inputRef}
              type="text"
              value={draft}
              onChange={(event) => setDraft(event.target.value.slice(0, 500))}
              placeholder="Ask us anything..."
              maxLength={500}
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={!draft.trim()}
              aria-label="Send message"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="m22 2-7 20-4-9-9-4Z" />
                <path d="M22 2 11 13" />
              </svg>
            </button>
          </form>
        </section>
      )}
      <button
        className={`assistant-trigger${isOpen ? " assistant-trigger-open" : ""}`}
        type="button"
        ref={triggerRef}
        aria-label={isOpen ? "Close Adrover chat" : "Chat with Adrover"}
        aria-expanded={isOpen}
        aria-controls="assistant-panel"
        onClick={() => setIsOpen((open) => !open)}
      >
        {isOpen ? (
          <span aria-hidden="true">×</span>
        ) : (
          <>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5 8 8 0 0 1-3.3-.7L4 20l1.7-4.1A7.5 7.5 0 1 1 20 11.5Z" />
              <path d="M8.5 11.5h.01m4 0h.01m4 0h.01" />
            </svg>
            <span>Ask Adrover</span>
            <i aria-hidden="true" />
          </>
        )}
      </button>
    </aside>
  );
}
