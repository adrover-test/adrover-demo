export function LoginJourney() {
  return (
    <div className="login-journey">
      <div className="login-journey-top">
        <div className="login-highlights">
          {[
            [
              "01",
              "Plan your Ads",
              "Explore an illustrative campaign estimate.",
              "M8 3h11l6 6v20H8zM19 3v7h6M12 15h9m-9 5h9",
            ],
            [
              "02",
              "Preview your creative",
              "Try a video in your browser before you enquire.",
              "m10 5 18 11-18 11z",
            ],
            [
              "03",
              "Go live in cabs",
              "Reach passengers on real journeys, once approved.",
              "M5 20h5v9H5zM14 13h5v16h-5zM23 5h5v24h-5z",
            ],
          ].map(([number, title, text, path]) => (
            <article key={number}>
              <span className="login-highlight-icon" aria-hidden="true">
                {number}
              </span>
              <svg
                className="login-step-symbol"
                viewBox="0 0 32 32"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d={path} />
              </svg>
              <div>
                <h2>{title}</h2>
                <p>{text}</p>
              </div>
            </article>
          ))}
        </div>
        <span className="login-city-mark">
          Hyderabad
          <br />
          First
        </span>
      </div>
      <p className="login-journey-slogan">
        A city that moves
        <br />
        with your brand.
      </p>
      <svg
        className="login-city-scene"
        viewBox="0 0 480 270"
        role="img"
        aria-label="Illustrated cab on a curved road beside Hyderabad's Charminar"
      >
        <defs>
          <linearGradient id="login-road" x2="0" y2="1">
            <stop stopColor="#244c3a" />
            <stop offset="1" stopColor="#102b22" />
          </linearGradient>
        </defs>
        <g fill="#18543d" stroke="#37775b" strokeWidth="2" opacity=".6">
          <path d="M310 175V82h124v93h-36v-30a26 26 0 0 0-52 0v30z" />
          {[305, 333, 410, 438].map((x) => (
            <g key={x}>
              <path
                d={`M${x - 7} 174V57h14v117zM${x - 10} 57v-7h20v7zM${x - 7} 50v-8q7-18 14 0v8z`}
              />
              <path d={`M${x} 25v-9M${x - 10} 76h20M${x - 10} 99h20`} />
            </g>
          ))}
          <path d="M320 113h105M320 91h105" />
        </g>
        <g fill="#1a4936">
          <path d="M50 205v-45h30v45h12v-65h32v65h20v-32h35v32h20v-49h36v49h22v-30h34v30z" />
          <path d="M5 228q-15-40 12-45 9-29 28-8 27-13 31 18 18 13 10 35zM413 215q-8-30 10-36 10-28 25-8 25-5 28 25l4 32z" />
        </g>
        <path
          d="M5 245c99-39 338 9 427-41 33-19 5-36-38-48 75 6 106 31 59 62-84 55-296 4-448 44z"
          fill="url(#login-road)"
          stroke="#a9bb87"
          strokeWidth="2"
        />
        <path
          d="M26 253c111-32 305 10 409-43"
          fill="none"
          stroke="#e2d88c"
          strokeDasharray="12 12"
        />
        <g transform="translate(164 176)">
          <path
            d="m8 26 31-20h67l27 20 29 8v24H0V38z"
            fill="#f4f4e7"
            stroke="#879990"
            strokeWidth="2"
          />
          <path d="m44 11-21 17h45V11zm30 0v17h45L101 11z" fill="#204439" />
          <rect x="68" y="1" width="15" height="6" rx="2" fill="#ffd21c" />
          <rect x="47" y="33" width="69" height="21" rx="3" fill="#ffd21c" />
          {[27, 135].map((x) => (
            <g key={x}>
              <circle cx={x} cy="56" r="13" fill="#101814" />
              <circle cx={x} cy="56" r="7" fill="#879990" />
            </g>
          ))}
          <path
            d="M-30 30h22m-40 10h32m-39 10h34"
            stroke="#ffd21c"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </g>
      </svg>
      <div className="login-journey-stats">
        <div>
          <strong>₹2,100</strong>
          <span>Minimum estimate</span>
        </div>
        <div>
          <strong>7,000</strong>
          <span>Minimum estimated plays</span>
        </div>
        <div>
          <strong>1,000 × 7</strong>
          <span>Plays per day × campaign days</span>
        </div>
      </div>
    </div>
  );
}
