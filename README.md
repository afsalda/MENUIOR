# Fress Trees Garden & Cafe Menu

A mobile-first digital menu for **Fress Trees Garden & Cafe, Edapally, Kochi**. The guest menu is React/Vite, and the hosted version uses a Sites Worker with D1 for shared menu/settings data and R2 for uploaded dish photos.

## Run locally

Install Node.js 22 or later, then run:

```sh
npm install
npm run build
npm run preview:full
```

Open `http://127.0.0.1:4175/`. The local preview includes the Worker, database, photo bucket and simulated owner sign-in. Use the header **Admin** button, then sign in from the local prompt.

For fast frontend-only development, `npm run dev` still serves the app at Vite's local URL, but admin persistence and uploads require `npm run preview:full`.

## What is ready

- Default garden theme with warm off-white glass surfaces, botanical greens, leaf details and CSS-only rain that respects reduced motion.
- Mobile-optimized menu with the header, language row, category chips and new-product cards tested at 360px and 390px widths.
- Seven requested categories with clearly labelled sample items and the **Sample menu - prices not final** banner controlled from settings.
- Owner-only Admin panel for prices, sold-out status, photos, tags, translations, upsells, live event banner, review link and new-product animation setup.
- Guest experience dashboard with translation/photo coverage and shortcuts for bestsellers, paired dishes, WhatsApp and after-meal reviews.
- English, Malayalam, Hindi and Arabic guest controls, with Arabic right-to-left layout.
- Photos, bestseller tags, serving sizes, sharing-platter tags, add-ons, variants, diet/spice/allergen fields and paired-dish suggestions.
- Shared guest refresh: saved menu changes appear on open guest menus within a few seconds.
- Dish-view analytics in the owner panel. Counts are dish-detail opens from guests, not unique people or purchases.
- Booking by phone/WhatsApp, waiter and bill shortcuts, plant-shop link, Instagram prompt and review prompt after **Request bill** when the real Google review URL is set.
- New-product cards live inside the menu, with the organic mask reveal animation. There is no separate popup video.
- Installable offline shell for the production build. API and media requests are never cached by the service worker.

## Owner workflow

See [OWNER-GUIDE.md](OWNER-GUIDE.md). In production, open the menu and choose **Admin** in the header, or use `/?admin=1`. Only the configured owner email can save changes.

The owner can update:

- menu item price and sold-out status;
- all four language fields;
- dish photo uploads;
- bestseller/new/chef/sharing tags;
- upsells, add-ons, variants and serving text;
- event banner details;
- booking, social, plant-shop and review links;
- which dishes appear in the animated **New on the menu** section.

## Brand assets

Put approved logo and cafe photos in `public/brand/`. Current sample food art is replaceable placeholder material and should stay covered by the sample banner until the cafe approves final dishes and prices.

## Configuration

Defaults live in `src/config/restaurant.config.ts`. Runtime owner edits are stored in D1 after deployment. Set `ADMIN_EMAIL` in the Sites environment to the verified owner email; do not expose it as a `VITE_` variable.

Local and hosted storage bindings are declared in `.openai/hosting.json`.

## Checks

```sh
npm test
npm run build
npm run preview:full
node qa/admin.mjs
node qa/features.mjs
```

`qa/admin.mjs` verifies owner authentication, guest write denial, origin checks, price validation, optimistic edit conflicts, shared price and sold-out refresh, photo upload, translations, tags, upsells, analytics and review prompt behavior. It also runs axe checks for the admin screen at 1440, 768, 390 and 360 widths.

Screenshots and JSON evidence are written to `qa/`. See [qa/VERIFICATION.md](qa/VERIFICATION.md) for the latest measured results.

See [FEATURE-PITCH.md](FEATURE-PITCH.md) for the two recommended selling points: live menu updates and a four-language guest menu.

## Still needs owner input

Before public QR printing, replace placeholder food art with approved images, confirm final menu prices, review Malayalam/Hindi/Arabic copy with fluent speakers, add the real Google review URL, add any live DJ/event form link, confirm opening hours and decide whether the owner-private Site should be opened to guests.

WhatsApp actions open drafts for the guest to send. The cafe still confirms table bookings and orders manually.
