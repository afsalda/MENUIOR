# Verification · Fress Trees menu

Verified locally on 28 September 2026 using the production Vite build, headless Microsoft Edge, Playwright, axe and Lighthouse. Browser screenshots were inspected and the mobile header, reading sizes, colour contrast and dark-mode inheritance were refined.

## Results

- `npm test`: **8/8 passed**. Defensive prices/CSV, duplicate and corrupt rows, variants/add-ons, Kochi and overnight availability, Settings URL validation, matching JSON/CSV menu and four language names, encoded WhatsApp totals/notes/table.
- `npm run build`: **passed**, strict TypeScript check and production build. Initial JavaScript ~85.7 KB gzip, lazy drawer ~4.9 KB gzip. Static output includes a versioned service worker.
- `node qa/browser.mjs`: **passed**. Seven categories, featured cards, search/no-results, veg filter, sold-out, add-ons, quantity, subtotal, favourites persistence, Arabic search/RTL and remembered language, phone/WhatsApp booking destinations, Escape and focus restoration, all themes, reduced motion, offline reload and offline lazy drawer. No runtime page errors. No live WhatsApp messages were sent.
- Responsive screenshots: **1440×1000, 1024×1000, 768×1000, 390×844, 360×844**, no document horizontal overflow. All four language layouts also checked at **360×800**.
- `node qa/theme-audit.mjs`: **0 axe violations** for garden, noir-cafe, spice-kitchen and grand-hotel in **both light and dark modes**, using WCAG 2 A/AA and 2.1 AA tags. Default mobile menu and cart drawer also reported zero violations. Automated scans are evidence, not accessibility certification; native language quality, screen-reader experience and individual dietary/allergen details still merit owner review.
- `node qa/sheet-sync.mjs`: **passed** with controlled mock CSV responses. Live Items and Settings refresh, changed price, sample flag, event form link, retained last-good cache on invalid CSV, bundled sample on a failed first visit. No real Google Sheet was supplied, so authentication/publication/CORS on an owner's actual Sheet remains to be checked when connected.
- Mobile Lighthouse: **Performance 96, Accessibility 100, SEO 100**. First Contentful Paint **1.8s**, Largest Contentful Paint **2.5s**, Total Blocking Time **70ms**, CLS **0**. This is a local simulated mobile run, not a field-performance guarantee. Report: `qa/lighthouse.json`. The reusable Node runner avoids a Windows temporary-directory cleanup issue encountered with the Lighthouse CLI.
- `npm run qr`: generated **13 PNG + 13 SVG** files (general + 12 tables). These use the clearly labelled localhost demo default. Generate new codes with a real public URL before printing.

## Evidence files

Generated evidence is intentionally Git-ignored. Re-run the scripts to recreate it:

- `desktop-final.png`, `layout-1440.png`, `layout-1024.png`, `layout-768.png`, `layout-390.png`, `layout-360.png`
- `dish-detail.png`, `order.png`, `arabic.png`, `theme-noir-cafe.png`, `theme-spice-kitchen.png`, `theme-grand-hotel.png`
- `results.json`, `theme-accessibility.json`, `lighthouse.json`

## Before the public guest launch

Replace stock photos/placeholder wordmark with approved brand assets; review translations and dietary/allergen labels; enter approved menu prices; connect published Items and Settings CSV URLs. Set the actual event form/schedule, opening hours, guest Wi-Fi and Google review URL where appropriate. These unknown fields are currently blank and their UI is conditional. Keep the sample banner enabled until the sample content is approved.

The app has no backend, login or payments. WhatsApp opens a draft and the cafe confirms orders/bookings. The offline menu may be older than the kitchen's live availability. A private Sites review URL is for owner review, not a public customer QR destination.

## Design references

The supplied printed menu guided dish/price hierarchy. The supplied video guided layered food photography and staggered entrances. Garden atmosphere and clear menu grouping were researched at [The Grounds](https://thegrounds.com.au/dine-in/the-grounds-cafe/) and [Dishoom](https://www.dishoom.com/menu/all-day-main/). Their branding and assets were not copied. All stock-photo sources and licenses are recorded in `public/brand/README.md`.
