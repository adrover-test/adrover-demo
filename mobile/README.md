# Adrover Advertiser Mobile Application 📱

A native mobile application built for **Adrover Transit Advertising (Hyderabad)**, mirroring the brand theme, UI styling, and full advertiser workflow (Register, Login, and Advertiser Portal).

## Features

- **Brand Theme & Styling**:
  - Exact brand colors: Adrover Green (`#087a45`), Adrover Yellow (`#ffd21c`), Deep Ink (`#101814`), Light Paper (`#f8f7f1`), and Sage (`#eaf3e8`).
  - Native card elevation, rounded chips, bottom tabs, and live status beacons.

- **Advertiser Authentication & Onboarding**:
  - **Login Screen**: Business email and password form with password visibility and input validation.
  - **4-Step Registration Wizard**:
    1. **Creative & Digital Rooftop Screen Simulator**: Live 16:9 LED preview with preset Hyderabad brands (Paradise Biryani, HITEC AI Summit, Apollo Healthcare, Deccan Retail) or custom copy.
    2. **Business Details**: Contact person, brand name, email, phone, and target Hyderabad territory (*Hitec City, Jubilee Hills, Gachibowli, Secunderabad, Charminar, etc.*).
    3. **Campaign Planner & Tier Selection**: Starter (10k plays), Growth (25k plays), and Metro Dominance (60k plays) with budget calculation.
    4. **Review & Activation**: Review campaign details and continue to the advertiser portal.

- **Advertiser Portal (Mobile Experience)**:
  - **Dashboard**: Real-time stats (*Active Campaigns, Total Plays, Cabs on duty, Investment*), **Live Hyderabad Transit Radar Map**, and 7-day plays bar chart.
  - **Campaigns**: Filterable list (*All, Active, Pending approval, Completed*), search, delivery progress bars, and modal with digital screen broadcast view & GPS telemetry export.
  - **Create Ad**: Fast in-app campaign creation with corridor selection and instant pricing.
  - **Billing**: Available advertising credits, payment methods, and GST tax invoice statements.
  - **Profile**: Business profile management, telemetry alerts toggles, and Jubilee Hills support hotline (`+91 40 4859 2100`).

---

## Project Structure

```
mobile/
├── App.tsx                     # App entry point
├── app.json                    # Expo configuration
├── package.json                # Dependencies & scripts
├── tsconfig.json               # TypeScript configuration
└── src/
    ├── components/
    │   ├── CabScreenPreview.tsx  # Rooftop digital screen simulator
    │   ├── HeaderBar.tsx         # Mobile header with live online beacon
    │   └── TransitRadarMap.tsx   # Hyderabad route radar visualizer
    ├── navigation/
    │   └── AppNavigator.tsx      # Stack & Bottom Tab Navigators
    ├── screens/
    │   ├── LoginScreen.tsx       # Sign In screen
    │   ├── RegisterScreen.tsx    # 5-step registration wizard
    │   ├── DashboardScreen.tsx   # Portal overview & stats
    │   ├── CampaignsScreen.tsx   # Campaign listing & inspection
    │   ├── CreateAdScreen.tsx    # New campaign creation
    │   ├── BillingScreen.tsx     # Invoices & credits
    │   └── ProfileScreen.tsx     # Profile & settings
    ├── services/
    │   └── storage.ts            # Data models & persistence
    └── theme/
        └── colors.ts             # Adrover color system
```

---

## Running the Mobile App

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Quick Start
1. Navigate to the `mobile/` directory:
   ```bash
   cd mobile
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Check mobile TypeScript without involving the website project:
   ```bash
   npm run typecheck
   ```

4. Start the application:
   ```bash
   npx expo start
   ```

5. Run on your desired platform:
   - Press **`a`** for Android Emulator
   - Press **`i`** for iOS Simulator
   - Press **`w`** for Web Browser
   - Scan the QR code using the **Expo Go** app on your physical iPhone or Android device!
