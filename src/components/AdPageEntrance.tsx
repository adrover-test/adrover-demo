import { useEffect, useState } from "react";

export function AdPageEntrance() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    function respectReducedMotion() {
      if (preference.matches) setVisible(false);
    }
    respectReducedMotion();
    preference.addEventListener("change", respectReducedMotion);
    return () => preference.removeEventListener("change", respectReducedMotion);
  }, []);

  if (!visible) return null;

  return (
    <div
      className="ad-page-entrance"
      aria-hidden="true"
      onAnimationEnd={(event) => {
        if (event.target === event.currentTarget) setVisible(false);
      }}
    >
      <svg viewBox="0 0 160 80" fill="none" focusable="false">
        <path
          d="M8 67h144"
          stroke="#667b66"
          strokeWidth="2"
          strokeDasharray="9 7"
        />
        <g className="ad-entrance-cab">
          <path d="m31 44 12-17h49l16 17 15 4v13H20V49l11-5Z" fill="#ffd21c" />
          <path d="m48 32-8 12h26V32H48Zm25 0v12h26L88 32H73Z" fill="#d9eee1" />
          <circle cx="42" cy="61" r="9" fill="#101814" />
          <circle cx="102" cy="61" r="9" fill="#101814" />
          <circle cx="42" cy="61" r="4" fill="#f8f7f1" />
          <circle cx="102" cy="61" r="4" fill="#f8f7f1" />
          <rect
            x="52"
            y="6"
            width="47"
            height="27"
            rx="4"
            fill="#087a45"
            stroke="#f8f7f1"
            strokeWidth="2"
          />
          <path d="m61 26 6-14h5l6 14h-5l-3.5-9-3.5 9h-5Z" fill="#ffd21c" />
          <path
            className="ad-entrance-message"
            d="M82 15h10m-10 5h8m-8 5h6"
            stroke="#fff"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </g>
      </svg>
      <div>
        <strong>
          Adrover<span>.</span>
        </strong>
        <small>Brands on the move</small>
      </div>
    </div>
  );
}
