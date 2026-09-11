# JK India Analytics — React Native Mobile App

## Prerequisites

1. **Node.js** 18+ installed
2. **Expo CLI**: `npm install -g expo-cli`
3. **EAS CLI** (for building APK/IPA): `npm install -g eas-cli`
4. On device: install **Expo Go** app (for development preview)

---

## 1. Install dependencies

```bash
cd Mobile
npm install
```

---

## 2. Configure server URL

Edit `src/config.js` and set `API_BASE` to your Flask server address:

```js
// For LAN (same WiFi network):
export const API_BASE = 'http://192.168.1.XXX:5000';

// For production:
export const API_BASE = 'https://your-domain.com';
```

> **Note:** Use your machine's LAN IP — not `localhost`. Find it with `ipconfig` (Windows) or `ifconfig` (Mac/Linux).

---

## 3. Run in development

```bash
npx expo start
```

- Scan QR code with **Expo Go** on your phone
- Or press `a` for Android emulator, `i` for iOS simulator

---

## 4. Build APK (Android)

```bash
# Login to Expo account
eas login

# Configure EAS project (first time only)
eas build:configure

# Build APK for internal distribution
npx eas build --platform android --profile preview
```

The APK will be available at the Expo build dashboard to download and install.

---

## 5. Build IPA (iOS)

```bash
eas build --platform ios --profile production
```

> Requires Apple Developer account ($99/year) and valid certificates.

---

## App Structure

```
Mobile/
├── App.js                          # Root: nav container + font loading
├── src/
│   ├── config.js                   # ← Set API_BASE here
│   ├── theme.js                    # Colors, fonts, shared constants
│   ├── services/api.js             # All API calls (axios)
│   ├── components/
│   │   ├── GASiteScreen.js         # Shared screen for ChiniMandi + BioEnergy
│   │   ├── KPICard.js              # Metric card widget
│   │   ├── RangeBar.js             # Range selector pills
│   │   ├── ScreenHeader.js         # Back button + title header
│   │   └── ChartCard.js            # Chart wrapper card
│   └── screens/
│       ├── LoginScreen.js          # Company select + login
│       ├── DashboardHomeScreen.js  # Section cards
│       ├── ChiniMandiScreen.js     # GA4 — chinimandi.com
│       ├── BioEnergyScreen.js      # GA4 — bioenergytimes.com
│       ├── AgriInsightsScreen.js   # AgriInsights WordPress API
│       └── SEICScreen.js           # SEIC Conference sponsors
```

## Navigation Flow

```
LoginScreen
    ↓ (after successful login)
DashboardHomeScreen
    ├── ChiniMandiScreen    (GA4 analytics, 4 tabs: Overview/Trends/Devices/Pages)
    ├── BioEnergyScreen     (same as above, different site)
    ├── AgriInsightsScreen  (categories, languages, date range filter)
    └── SEICScreen          (events picker, KPIs, tier chart, sponsor list)
```

## APIs Used

| Endpoint | Used By |
|---|---|
| `GET /get_company_data_All` | Login — company list |
| `POST /userlogin` | Login — authenticate |
| `GET /get_user_permissions?...` | Login — GA4 permission check |
| `GET /ga4-analytics?site=chinimandi&range=week` | ChiniMandi screen |
| `GET /ga4-analytics?site=bioenergy&range=week` | BioEnergy screen |
| `GET https://agriinsite.com/wp-json/newsroom-insights/v1/stats?range=today` | AgriInsights |
| `GET https://events-api.chinimandi.com/event-masters/` | SEIC events list |
| `GET https://events-api.chinimandi.com/sponsors/dashboard-stats?event_code=X` | SEIC sponsor data |
