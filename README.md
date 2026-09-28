# Fress Trees · Menure

A static, mobile-first digital menu for **Fress Trees Garden & Cafe, Edapally, Kochi**. Vite + React + TypeScript + Tailwind CSS. No backend, database, login, paid API or payment gateway. Guests use a normal URL, QR code or NFC tag.

## Run it on your computer

Install Node.js 22 or later. In this folder, run:

```sh
npm install
npm run dev
```

Open **http://127.0.0.1:4173/**. To check the finished static build:

```sh
npm run build
npm run preview
```

If the dev server already uses 4173, use `npm run preview -- --port 4174`.

## What is ready

- Default garden theme with a botanical palette, hand-drawn leaf motifs, rain, layered photos, responsive cards and motion preferences.
- Seven categories and 28 clearly labelled sample dishes; English, Malayalam, Hindi and Arabic names; translated main controls and Arabic RTL. Missing description translations fall back to English.
- Search, vegetarian/spice/price filters, local favourites, dark mode, sticky category navigation and scroll-spy.
- Item details, half/full prices, variants, add-ons, allergen/calorie fields, serving size, sharing platters, paired dishes, sold-out and Kochi time-based availability.
- Quantity-based order list with table number and notes, WhatsApp draft, booking via phone/WhatsApp, waiter and bill requests, info drawer, plant shop and Instagram.
- Google Sheet data with instant last-good local cache, background refresh, and bundled fallback.
- Installable offline PWA. Service worker precaches the app, fonts, sample data and lazy drawer; no server needed.
- Local printable QR generator.

## Change your cafe details

Edit **`src/config/restaurant.config.ts`**. This is the single default source for branding, contact details, categories, theme and QR settings. Website text uses these defaults until the published Settings sheet overrides them.

Place your approved logo/photos in **`public/brand/`**. In settings, use `brand/logo.webp` for `logo_url`; use `brand/filename.webp` for each item photo. Current photos are stock illustrations; credits are in `public/brand/README.md`. The current wordmark and leaf icon are placeholders, not a reconstruction of the official logo.

When duplicating for another restaurant, give it a new `id` (separates browser storage), change the config, and replace `public/menu.json`/CSV data. Static SEO and the production app manifest are generated from the config. Replace app icons and favicon if desired. Category IDs in Items must match the config IDs or full category names.

## Connect one Google Sheet

1. Create a Google Sheet. Name the first tab **Items**.
2. Import **`sheet-template.csv`** into Items. Keep the column headings exactly as supplied.
3. Add a tab named **Settings**. Import **`settings-template.csv`** into that tab. It has two columns: `key` and `value`.
4. Choose **File → Share → Publish to web**. Select **Items**, choose **Comma-separated values (.csv)**, and publish. Copy the published CSV URL.
5. Repeat for **Settings**. These are two published tabs in the same spreadsheet, with different `gid` values. A single CSV URL cannot contain two tabs.
6. Copy `.env.example` to `.env` and fill in:

```env
VITE_SHEET_CSV_URL=https://docs.google.com/spreadsheets/d/e/YOUR_PUBLISHED_ID/pub?gid=YOUR_ITEMS_GID&single=true&output=csv
VITE_SETTINGS_CSV_URL=https://docs.google.com/spreadsheets/d/e/YOUR_PUBLISHED_ID/pub?gid=YOUR_SETTINGS_GID&single=true&output=csv
VITE_GA4_ID=
```

7. Restart the dev server, or rebuild/redeploy once when changing these URLs. Subsequent Sheet edits are fetched when guests open/reload the menu. Google publication updates can take a few minutes.

The URLs are public: only publish information you intend guests to see. An ordinary private editor/share URL is not a CSV feed. No Google account or Google API key is used by the app.

## Updating dishes from your phone

Open the Google Sheets app, choose Items and edit the relevant row:

- **Change a price:** put `250`, `₹250` or `Rs 250` in `price`.
- **Sold out for today:** set `sold_out` to `TRUE`. Guests see “Back soon” and cannot add it.
- **Hide completely:** set `available` to `FALSE`.
- **Restore:** use `sold_out=FALSE` and `available=TRUE`.
- **Sharing platter:** put `sharing` in `tags` and `Serves 2–3` in `serves`.
- **Multiple tags/allergens/pairings:** separate with `|`, e.g. `chef|sharing`, `Milk|Gluten`, `iced-latte|brownie`.
- **Variants:** `Small:180|Large:240` or JSON `[ {"name":"Small","price":180} ]`. Variant prices replace the base price. Add-ons use the same format and add to the selected price.
- **Half portion:** set `half_price`. Without variants, the detail sheet shows Half and Full. Explicit variants take precedence.
- **Availability hours:** set both `available_from` and `available_to` as `HH:mm`, e.g. `12:00` and `16:00`. Kochi time is the default, including when guests travel. Overnight ranges work. Blank or malformed ranges do not restrict availability.
- **Diet:** `veg`, `nonveg`, `egg`, `vegan` or `jain`. Verify these and allergens with the kitchen, especially for optional add-ons. Unknown diet values are conservatively treated as non-veg.
- **Spice:** 0 to 3. Calories are optional and should be supplied by the restaurant, never guessed.
- **Translations:** `name_en/ml/hi/ar` and `desc_en/ml/hi/ar`. Empty translations fall back to English.

Broken rows without an ID, valid category, English name or valid price are skipped. Duplicate IDs keep the first row. If the entire feed is unusable or offline, the last good menu or bundled sample stays available. The current visit's order is held in memory; it resets on reload. Favourites, language, theme mode and menu cache are local to the device.

## Settings tab: client-specific fields

| Field | What to put in it |
|---|---|
| `name`, `wordmark`, `tagline` | Restaurant name and short brand text |
| `phone`, `whatsapp` | Booking/cafe phone; WhatsApp includes country code, e.g. `917736003337` |
| `maps_link`, `address` | Directions link and location |
| `instagram`, `instagram_handle` | Instagram URL and `@fresstrees` |
| `facebook_name`, `facebook_link` | Facebook display name; leave URL blank until confirmed |
| `plants_shop_link` | Plants store URL |
| `event_title`, `event_time`, `event_link` | Confirmed event name, schedule text and actual DJ/event form URL. Banner appears only with title + link |
| `todays_special` | Optional daily special text |
| `opening_hours` | Verified opening hours; blank hides the row |
| `google_review_link` | Actual review URL; blank hides the button |
| `wifi_name`, `wifi_password` | Guest Wi-Fi only; blank name hides the row |
| `show_sample_banner` | `TRUE` until all sample content and prices are approved |
| `gst_note`, `currency` | Approved tax wording and currency code; INR is the default |
| `logo_url`, `hero_image`, `hero_food_image` | Approved images in `brand/` or HTTPS URLs |
| `hero_title`, `hero_description`, `hero_seal`, `menu_eyebrow` | Brand text; multiline cells are supported |
| `featured_ids` | Item IDs separated by `|` for Garden favourites |
| `time_zone` | `Asia/Kolkata` by default |

There is no guest-facing admin panel. “Settings tab” means the Google Sheet tab. Empty event fields do not invent a date or form destination. All default client links and the booking phone came from your request.

## Demo the four themes

- `/?theme=garden` — default, botanical photo cards.
- `/?theme=noir-cafe` — dark sans-serif, compact square-photo lists.
- `/?theme=spice-kitchen` — warm turmeric, larger rounded photo cards.
- `/?theme=grand-hotel` — serif, navy/gold, typographic rows with small images.

Theme selection changes presentation while retaining the same cafe and menu. Use `theme` in config for the permanent default. The sun/moon control independently changes the colour mode.

## Publish free as a static site

Run `npm run build`; the entire deployable website is **`dist/`**. Use a public HTTPS deployment for guest QR codes and PWA installation.

- **Vercel:** import the Git repository, use Vite, build command `npm run build`, output directory `dist`; add the two CSV variables in project settings, then deploy.
- **Cloudflare Pages:** import the repository or upload the built `dist` folder. For Git builds use `npm run build` and output `dist`.
- **GitHub Pages:** run the build and upload `dist` with a Pages deployment workflow. Relative asset URLs support a repository subdirectory. The published URL should end with `/`.

Only static assets are deployed. Hosting plans and free-tier limits can change; this app itself requires no paid service. A private Sites review deployment, if provided, is for your review, not the public guest QR destination. No authentication is built into the app.

Official deployment references: [Vite static deployment guide](https://vite.dev/guide/static-deploy) and [Cloudflare Pages React guide](https://developers.cloudflare.com/pages/framework-guides/deploy-a-react-site/).

For production, set the approved restaurant name, tagline and address in the config; the build updates the static page title, description, Open Graph text and PWA name. Optional absolute `og:url` and canonical URL can be added once a public domain is chosen. No third-party script loads unless GA4 is explicitly configured.

## Print QR codes and set NFC tags

After publishing, set `qr.base_url` and `qr.tables` in the config, or pass them on the command line:

```sh
npm run qr -- --url https://your-public-menu.example/ --tables 12
```

The script creates `qr-output/general.png` / `.svg` and `table-1` through `table-12` in both formats. Table codes contain `?table=N`; the order and waiter/bill draft includes the number. PNGs are 1024px and SVGs print at any size. Scan a printed test before bulk printing. Do not print the default localhost demo codes for customers.

For NFC, use a normal NFC-writing app, choose a URL record, and write the general URL or table-specific URL to an NFC tag. Test it with a second phone. No app install is needed for guests.

## Offline and WhatsApp limitations

Offline support activates after a successful online visit to the **production build** on HTTPS or localhost. The service worker is intentionally disabled in `npm run dev`. Cached data may be older than the kitchen's current availability. Guests still need a connection for WhatsApp, maps and social links. When updating the app, a new versioned cache replaces the old app assets.

WhatsApp opens a draft for the guest to review and send. The cafe must confirm the order or booking; there is no live table inventory, automatic order receipt or payment. The site never sends a message by itself.

## Optional analytics

Keep `VITE_GA4_ID` empty for no analytics. If explicitly configured, only item IDs, counts, value/currency and selected language are sent for `item_view`, `add_to_order`, `whatsapp_order`, `review_click` and `language_change`. Guest notes, table numbers and Wi-Fi details are never sent to analytics. Google Signals/ad personalisation are disabled. GA4 is a third-party service, not an anonymous self-hosted analytics system; configure it only if appropriate for your privacy requirements.

## Checks and file map

```sh
npm test
npm run build
npm run preview -- --port 4174
# In another terminal (uses Edge on Windows; install Playwright Chromium on other platforms):
node qa/browser.mjs
```

`qa/browser.mjs` verifies menu, cart, variants, WhatsApp drafts without sending, favourites, languages, breakpoints, themes, reduced motion and offline operation. Accessibility results are automated evidence, not certification. It saves screenshots and JSON to `qa/`. See `qa/VERIFICATION.md` for measured results and remaining setup.

```text
src/config/restaurant.config.ts  Cafe defaults, categories, theme and QR settings
src/App.tsx                     Menu, navigation, filtering, favourites and state
src/components/                 Cards, leaf motifs and lazy-loaded drawers
src/lib/                        CSV parsing, caching, availability, i18n and analytics
public/menu.json                Bundled sample fallback
public/brand/                   Replaceable logo, photos and app icons
sheet-template.csv              Import into Items
settings-template.csv           Import into Settings
scripts/qr.ts                   Local QR generator
scripts/build-static.mjs         Versioned offline service worker
tests/                          Data/price/time/CSV regression checks
qa/                             Browser verification and screenshots
```

No live Sheet, official logo/photos, confirmed prices, DJ form, opening hours, Wi-Fi details or Google review URL were supplied. The corresponding integrations are configurable; unverified business fields are blank. Sample translations should be reviewed by native speakers before launch.
