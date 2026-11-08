# Adrover website

A complete React + TypeScript conversion of the supplied Adrover designs, using Vite.
The site contains Home, Pricing, Contact us, an advertiser login preview, a
sample advertiser dashboard, a campaign setup preview, an ad list and a sample
profile, campaign details and billing history.
This project is a separate copy; the original design folder is unchanged.

## Run locally

Install [Node.js](https://nodejs.org/) 24 LTS (minimum supported: 22.12) and open a terminal in this folder:

```powershell
# Open PowerShell in this checkout, then run:
npm ci
npm run dev
```

Open the local URL printed by Vite (normally `http://127.0.0.1:5173`).
Do not double-click the HTML files: React/TypeScript must be served by Vite or built first.

```powershell
npm run typecheck
npm run build
npm run preview
```

The production output is `dist`. The preview URL is normally `http://127.0.0.1:4173`.

## Pages and source

| URL                   | React source                   | Purpose                                   |
| --------------------- | ------------------------------ | ----------------------------------------- |
| `index.html` or `/`   | `src/pages/Home.tsx`           | Three-section landing page                |
| `faq.html`            | `src/pages/Faq.tsx`            | Dedicated expandable FAQ page             |
| `pricing.html`        | `src/pages/Pricing.tsx`        | Video preview and illustrative calculator |
| `register.html`       | `src/pages/Register.tsx`       | Video selection and advertiser registration |

Register opens the creative onboarding form directly. Select a campaign video
and edit total ads, duration and requested cabs directly in the campaign sidebar.
The sidebar and Plan calculator share selections and update the price immediately.
Select a video
and use the same cab/ads/weeks calculator as Pricing in the Plan step. The selected
total ads, duration and amount update the sidebar, review and saved local brief;
invalid selections block continuing. Pricing remains INR 0.30 per total ad.
Select a video
and banner there to preview them on the mock screen before continuing. MP4/WebM
videos must be non-empty, browser-playable and at most 100 MB. Files stay local
and are cleared on refresh. The old `pricing.html#registration` URL redirects to
`register.html`; Pricing remains a separate calculator and video-preview page.
| `contact.html`        | `src/pages/Contact.tsx`        | Campaign handoff and local enquiry draft  |
| `login.html`          | `src/pages/Login.tsx`          | Client phone/OTP screen (delivery pending) |
| `dashboard.html`      | `src/pages/Dashboard.tsx`      | Sample advertiser dashboard               |
| `profile.html`        | `src/pages/Profile.tsx`        | Sample advertiser profile                 |
| `create-ad.html`      | `src/pages/CreateAd.tsx`       | Campaign setup and local creative preview |
| `advertisements.html` | `src/pages/Advertisements.tsx` | Searchable sample advertisement list      |
| `view-ad.html?id=...` | `src/pages/ViewAd.tsx`         | Campaign overview and creative preview    |
| `payments.html`       | `src/pages/Payments.tsx`       | Sample billing and transaction history    |
| `admin-login.html`    | `src/pages/AdminLogin.tsx`     | Separate website-admin demo sign-in       |
| `admin.html`          | `src/pages/AdminPortal.tsx`    | Clients, enquiries, cabs and ad approvals |

### Website administrator demo

Open `admin-login.html` (also linked from advertiser sign-in). Use any valid
email and a demo password, not real credentials. The separate admin session is
stored in `sessionStorage`; an advertiser sign-in does not open the admin area.
This is a convenience gate only, **not real authentication or authorization**.

The admin overview shows client, enquiry, cab and pending-ad counts.
Under Cabs & drivers, Create driver saves a name, vehicle number/model, phone,
email, service area and availability. Vehicle numbers are normalised and duplicates
are rejected. Saved entries appear in search, driver details and the overview cab
count after reload. Records include the creating admin email/time and remain in
this browser's local storage only; this does not register a driver with a backend.
It also shows total ads across every client/status and total revenue till date
from the shared sample billing records. Revenue counts successful campaign
payments minus refunded campaign amounts, excluding wallet top-ups, pending
payments, future-dated records and unpaid ad approvals. The current sample net
revenue is INR 282,500; it is illustrative, not actual collected money.
Total ad plays sums delivered plays across every ad, not assigned play targets.
The shared ad detail overview shows pending plays as the play target minus
delivered plays, clamped to zero, alongside delivered plays and the play target.
Pending approval targets are requested, not confirmed delivery commitments.
The dashboard includes a net revenue bar chart and an ad-status donut
chart, both calculated from the same records as the totals. Chart entrances and
bar animations run briefly and respect reduced-motion preferences.
Shared UI styling uses layered card shadows, consistent rounded panels, clearer
table typography and the home page's shared green, yellow, paper and sage
palette across admin and advertiser screens. Active ad-list filters use yellow,
and decorative campaign thumbnails stay within the brand palette; semantic
status and warning colors remain distinct. Shared UI styling includes
table typography, highlighted form focus states and short button/disclosure
transitions. Additional card entrances and disclosure animations are enabled
only when reduced motion is not requested; content and controls are never held
behind an animation.
The shared Graph period filter updates both ad plays and revenue: Yearly shows
10 calendar years, Monthly shows 12 calendar months, Weekly shows four
Monday-based calendar weeks, and Daily shows 30 days. All include the current
partial period in UTC and retain zero periods. Wide charts scroll inside their
panels on smaller screens. The ad plays chart includes a selected-period total.
Its explicitly illustrative delivery history reconciles
to the existing sample ads' 148,250 total plays as of 5 November 2026. Records
after the current date are excluded. New campaigns and approval targets add no
plays without delivery history; this chart does not infer dates from totals or
represent live telemetry.
Every shared-layout page includes a brief decorative Adrover cab-and-ad-screen
entrance in the corner. It never blocks input, covers the page or holds content
behind a loading timer. It is an entrance effect, not a network progress indicator;
it removes itself after animation and is omitted for reduced-motion preferences.

Visible navigation and action labels use normal product terminology (Sign in,
Sign out, Approve ad) instead of repeated demo badges. This is a presentation
cleanup, not a backend upgrade: admin sign-in remains a browser-local demo.
Client phone sign-in is disabled pending an SMS authentication provider. Financial, testimonial
and fictional fleet disclosures remain visible; exported reports remain
explicitly marked as illustrative.
Navigate
Clients → View client → View details to inspect a client's advertisements using
the same overview, creative concept and status bar as the advertiser. The clients
list includes sample brands and demo advertisers who sign in on this browser.
New ads retain their creator's sign-in email so they appear under that client.
Legacy ads without an owner are grouped by brand; sample ads remain visible to
advertisers as before. Profile changes appear in the associated admin client view.
Client info includes the advertiser's account name, business name, contact email,
phone, primary service area and advertiser type. Sign-in email is displayed
separately from the editable contact email. Missing saved profiles are explicitly
identified rather than filled with invented profile details.

Enquiries contains fictional examples plus entries explicitly saved using
**Save demo enquiry for admin** on Contact us. The existing draft download remains
separate and does not create an admin enquiry. Cabs & drivers is a searchable
read-only directory with fictional driver names, placeholder phone numbers,
example.com emails, demo car identifiers, model, route and availability.
Client and enquiry lists use searchable tables, consistent with the ad and cab
directories. Each cab row includes View details, opening the driver's contact,
vehicle, service area and availability information; direct loads and refreshes
preserve the selected record.
Enquiries have amber Awaiting reply and green Replied badges, plus expandable
internal notes and follow-up controls. Total, Awaiting reply and Replied summary
counts act as keyboard-accessible filters and combine with search. Counts always
cover all enquiries, while the result count reflects active filters; clear filters
restores the full list. Saving a reply status immediately updates counts and
removes the row from a status-filtered list when it no longer matches.
Mark Replied after contacting the client;
the control sends no message. Notes are appended with the admin email and timestamp,
and status changes record their last editor. These records persist in local storage
and are available to other admin sign-ins in the same browser only, not across
devices. They are not a trusted server-side audit trail.

Ad approvals shows pending and approved campaigns. Open a pending ad, review its
overview, assign positive whole-number plays and a positive total INR amount
(maximum two decimal places), confirm review, then approve. Approval is saved
locally with reviewer email and timestamp, changes the status to **Approved**,
and is visible after reloading the advertiser's list/details/dashboard. It does
not start the campaign or collect a payment: payment and scheduling remain pending.
Repeated approval is blocked. Storage/validation failures are shown explicitly.
Approval records are editable by the browser user and are not a trusted audit log.

All demo records stay in this browser/origin. They are not shared across devices,
and clearing site data removes them. Do not enter real client/driver information.
Production use requires server-side authentication, role enforcement, a database,
trusted audit logging, creative storage/review and payment/scheduling services.

`src/components` contains the shared layout and interactive components.
`src/lib/campaign.ts` is the shared typed calculation and query-string validation.
`src/styles.css` preserves the supplied responsive design.
`public/assets` contains the cab photograph used by the landing page and video preview.

The dashboard's Recent advertisements table links each campaign to its details
with a View details button. The dashboard omits route distribution, and the
portal menu contains Dashboard, My advertisements, Payments & history and Profile.
Campaign creation remains available through the Create new ad page buttons. The
details page keeps the campaign overview and creative preview without duration
or performance cards, daily charts, route coverage, or vehicle telemetry.
Its compact status bar shows campaign status and schedule progress. Active ads
show remaining days, pending ads show requested days without implying the campaign
has started, and completed ads show a finished schedule. Sample schedule values
are illustrative rather than a live countdown.
Portal headings and summary cards use brief staggered entrance effects, with
soft card highlights and table-row hover/focus feedback. Reduced-motion settings
disable these entrance effects; content remains visible without animation.
The profile page supports editing business and contact details, with Save and
Cancel actions. Profiles persist in browser local storage separately for each
demo sign-in email; changing the contact email does not change sign-in credentials.
These changes are not sent to a server.

The home page includes reference-inspired feedback cards with sample ratings
and initial avatars, plus a three-column footer with quick links and Hyderabad
contact information from the supplied design. Testimonials, named endorsements,
performance claims and contact details remain unverified and require confirmation
before publication. No social links are invented for unprovided profiles.

The landing page introduces Adrover, explains the planned video-upload process
in three side-by-side desktop steps (stacked on phones), and presents a clearly
labeled sample testimonial layout. The shared desktop and mobile navigation
contains Home, Pricing, Contact us and Log in. Footer FAQ links on all pages open
the dedicated `faq.html` page; FAQs are no longer embedded in the home footer.
Footer quick links contain only Login, FAQ, How it works and Contact us.
The client login page accepts an international phone number (country code with
no spaces). Its responsive side panel includes three campaign steps, an SVG
Charminar/cab scene and the current per-ad rate and campaign minimums. Phone login
accepts the country code with
no spaces) and shows an OTP field. Request OTP only displays an explicit
unconfigured-service notice: no OTP is generated, no SMS is sent, and no client
session is created. Verification remains disabled until a provider is selected.
Live integration must generate/send and verify OTPs on a trusted backend or
authentication provider, with expiry, rate limiting and secure sessions. Do not
put SMS credentials or OTP verification secrets in frontend code.
The previous email/password demo login has been removed; portal tests seed their
own browser-local demo sessions independently. Existing portal storage and route
gates are still demos, not secure authentication or protected backend data. The portal
includes example campaign metrics and profile details, a searchable sample
advertisement list, sample campaign detail and billing pages, and campaign
creation tools that reuse the local video preview and illustrative budget
estimator. Demo campaigns created in the portal are saved in this browser's
`localStorage` with a pending status; they are not sent for approval. Drafts and
sample reports are downloaded locally; no videos are uploaded and nothing is
charged. Existing local branding,
system fonts, and a cropped cab image from the supplied visual reference are used.
The reference-inspired design includes a photo-backed hero, yellow headline
underline, circular step icons, and an anchored services strip. The cab scene is
stored in `public/assets/hyderabad-cab-hero.jpg`; headings, navigation, buttons,
and steps remain live HTML, not a screenshot of the page. Unverified play-count,
QR-offer, and WhatsApp-service claims are not presented as available features.

All pages share the same capitalized wordmark, primary navigation,
campaign-button destination, footer links, palette and eyebrow styling.
Supporting pages use compact, left-aligned headings; the home hero intentionally
retains its larger marketing treatment.

The hero screen contains an SVG sample ad with six two-second scenes,
brief crossfades and subtle route motion, without a loader or progress bar.
All scenes are rendered immediately; the two-second interval controls rotation,
not network loading. The overlay and photograph
share one coordinate system so they stay aligned on every viewport. A pause/play
button controls all ad motion; reduced-motion preferences show a static first
scene instead. No video service, external requests, or real offers are involved.
The three process cards show all previews, guidance and checklists immediately,
without clicking or expanding. Connected, equal-height desktop cards illustrate
story creation, a video screen, and a cab travelling along a road. Each card plays
a brief, single-pass animation while in view: floating screens, pulsing accents,
and a moving cab. There is no Pause motion button; offscreen cards pause
automatically. Reduced-motion
preferences disable the animation; browsers without IntersectionObserver show
the complete static content. The walkthrough never simulates an upload or approval.
The QR/WhatsApp panel embedded in the source photo is covered by an opaque
screen backdrop, with the animated creative centered across the screen instead.

Scroll-driven CSS animations progressively reveal content in supporting browsers.
Other browsers display the content normally, and reduced-motion preferences disable
animations and smooth scrolling. Content is rendered immediately, not fetched as
you scroll. The reference URL `https://adonwheelz.com/` was retrieved for context;
its live animation behavior was not verified through the text-only fetch.

Before launch, replace the explicitly labeled sample quotes with approved customer
testimonials. Server-side video delivery remains a planned service:
the existing contact form only downloads a local enquiry draft.

### Campaign studio

The home-page Request a callback action opens `contact.html`, using the existing
contact enquiry form rather than an inline form or campaign setup. Local saving
and draft downloads retain the contact form's existing behavior; live callback
delivery still requires a backend.

On `pricing.html`, visitors can select an MP4
or WebM file (up to 100 MB), play it inside the cab-screen mockup and adjust the
existing pricing calculator. Video uses `object-fit: contain` to preserve its
aspect ratio and supports native seeking, sound and full-screen controls.
Playback starts only on request and is initially muted.
Once a selected video loads valid video metadata, Move forward with ad opens
`create-ad.html`, preserving the existing sign-in redirect. The action is hidden
for missing, invalid or removed videos. A visible notice explains that local
preview media is not transferred and must be selected again on the ad form.

Video selection is local, not a server upload: object URLs are revoked when the
file is replaced, removed or the component unmounts. Refresh/navigation clears
the video. Unsupported formats, empty/oversized files and decoding errors are
shown explicitly. The estimate still passes to `contact.html` for a local draft;
video data is not included in that handoff. Pricing is illustrative, and preview
playback does not guarantee compatibility with the physical fleet screens.
A small cab follows the mouse across pages without replacing the native cursor.
It hides over form fields and video controls, during keyboard navigation, and on
touch devices or when reduced motion is enabled.

The compact cab-only calculator keeps the inputs, week selection and live summary
without promotional benefit tiles or repeated guidance. It appears above the video
studio. A compact "Before you book" note below the studio summarizes the pricing
and audience-count caveats and links to Contact us, instead of long FAQ sections.

Each root HTML file is a small entry point for the same React application, not an embedded legacy page.
Vite emits all three HTML entry points. Normal relative links preserve the current URLs,
query parameters and section anchors. `base: "./"` makes bundled assets work at both the
domain root and any repository subpath. No SPA rewrite, custom 404 redirect, router dependency,
hard-coded username or repository name is needed. Direct loads and refreshes work on GitHub Pages.

## Publish to your personal GitHub Pages

Nothing has been uploaded or deployed for you. Use the following steps when ready.

1. Sign in to your personal [GitHub](https://github.com/) account. Create a new **public**
   repository, for example `adrover-website`. For the terminal steps below, leave the new
   repository empty (do not initialize a README, license or gitignore).
   Public repositories can use GitHub Pages on GitHub Free; private-repository availability
   depends on your plan.
2. Install [Git](https://git-scm.com/) if needed. In this project folder run the commands below,
   replacing `YOUR-USERNAME` and `YOUR-REPOSITORY` with your actual values.
   The `.gitignore` excludes dependencies, build output, test output and local environment files.
   Commit the source, `package-lock.json`, `public` assets and `.github` folder.

   ```powershell
   git init
   git add .
   git commit -m "Add Adrover React TypeScript website"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
   git push -u origin main
   ```

3. In the repository, open **Settings > Pages > Build and deployment**.
   Set **Source** to **GitHub Actions**. Enable Actions if GitHub asks.
4. Open **Actions > Deploy Adrover to GitHub Pages**. If the initial push ran before Pages
   was enabled, use **Run workflow** on `main` or rerun the failed deployment.
5. Wait for the build and deploy jobs to succeed. The workflow installs locked dependencies
   with `npm ci`, checks TypeScript, builds all pages and deploys `dist`.
6. Open the URL shown in **Settings > Pages** or the deployment job:
   `https://YOUR-USERNAME.github.io/YOUR-REPOSITORY/`.
   Other pages work directly, for example
   `https://YOUR-USERNAME.github.io/YOUR-REPOSITORY/pricing.html`.
   If your repository is named `YOUR-USERNAME.github.io`, the site is at
   `https://YOUR-USERNAME.github.io/` instead. Neither setup requires a code change.
7. For updates, edit the source, run `npm run build`, commit and push to `main`.
   The workflow deploys again automatically. If you choose a different default branch,
   update `on.push.branches` in `.github/workflows/deploy-pages.yml`.

You can alternatively publish this folder with GitHub Desktop to a new personal repository.
Include hidden `.github` and `.gitignore` files, then follow the Pages settings above.
Do not upload `node_modules` or rely on GitHub rendering source HTML from the repository view.
GitHub Pages serves the deployed build, not the TypeScript source.

## Browser checks

```powershell
npx playwright install chromium
npm run build
npm test
npm run format:check
```

Tests serve the built site under `/adrover-test/` to exercise GitHub-style repository paths.
They cover all three pages and refreshes, desktop/mobile layouts, landing sections,
calculator validation and safe numeric bounds, query handoff, invalid query values,
local video playback, draft downloads and mobile navigation.
The tests use port 4173; stop conflicting local servers first.
No tests submit enquiries or contact outside services.

Use `npm run format` to format source and configuration.

## Deliberate limitations before a business launch

- The calculator uses INR 0.30 per total ad across the entire campaign, with at least
  1,000 ads, a positive cab count, and a choice of 1, 2 or 3 weeks. Changing cabs or
  weeks updates the delivery summary without multiplying the total price. The
  default 1,000 ads cost INR 300. Older INR 0.25/play enquiry links remain readable
  with their original calculation. It is an illustration, not a quotation or
  reservation. Tax, fees, availability and delivery commitments are not calculated.
- Contact fields download a local text draft only. Nothing is sent, uploaded or stored on a
  backend. The site has no admin login, payment integration or server video uploads;
  the campaign studio supports private local video previews only.
- Verified phone, WhatsApp, email, address and business hours remain explicit placeholders.
  Add real, approved details and publish Privacy and Terms before a business launch.
- Confirm pricing, screen specifications, creative rules, fleet availability and reporting.
  External reference sites are not endorsements or verification of service claims.
- The project uses only bundled local assets and system fonts. Review your rights to all
  supplied content before making your GitHub repository public. No license grant is
  invented for your business materials.
"# adrover-demo" 
"# adrover-demo" 
