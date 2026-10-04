# Verification

Verified locally on 4 October 2026 using the production build, the full Worker preview at `http://127.0.0.1:4175/`, Microsoft Edge, Playwright and axe.

## Results

- `npm run build`: passed. Strict TypeScript, Vite production build, offline shell generation and Worker bundle generation completed.
- `/api/session`: returned a guest session instead of 404 in the full local preview.
- `/api/menu`: returned the shared menu document.
- `node qa/admin.mjs`: passed.
- `node qa/features.mjs`: passed against the final production build.

## Feature dashboard and ordering checks

- Dashboard cards filter incomplete translations and bestsellers and open review settings.
- All four guest language controls update dish names; blank fields fall back to English. Arabic changes the document to right-to-left layout.
- Bestseller and sold-out labels follow the chosen language.
- WhatsApp drafts include table number, selected dishes, current totals and encoded notes. No live orders were sent.
- A cart already open in an independent guest browser picks up a changed price and blocks checkout when its dish becomes sold out.
- Guest and owner pages have no horizontal overflow at 1440, 768, 390 and 360 widths; automated axe checks reported zero violations across all eight combinations.
- The tablet header overflow found at 768px was fixed and rechecked.

Evidence: `qa/features-results.json`, `qa/features-guest-*.png`, `qa/features-owner-*.png` and `qa/feature-language-*.png`. Authentication tests use the loopback preview's simulated owner identity; they do not constitute a hosted sign-in test.

The admin QA covers:

- owner sign-in in local preview;
- guest write denial;
- cross-origin mutation denial;
- invalid price validation;
- optimistic edit conflict handling;
- live price and sold-out updates reaching an independent guest browser within the test budget;
- R2 photo upload through the owner panel;
- English, Malayalam, Hindi and Arabic field editing;
- bestseller/new tags and upsell suggestions;
- guest dish-view analytics with owner views excluded;
- Google review prompt after **Request bill** when a review link is configured;
- axe checks with zero reported violations for the admin screen at 1440, 768, 390 and 360 widths.

## Mobile visual check

The mobile glitch reported by the owner was checked at 390px width after the fix.

- Header brand and actions stay inside the viewport.
- The Admin control collapses to an icon-sized action on narrow screens.
- The first three category chips fit fully at 390px.
- New-product cards keep the floating food image, save button, text, price and Add button inside the card.

Evidence files:

- `qa/mobile-glitch-fix-390-final.png`
- `qa/glass-mobile-top.png`
- `qa/glass-mobile-products.png`
- `qa/admin-360.png`
- `qa/admin-390.png`
- `qa/admin-results.json`

Automated axe results are useful evidence, not a replacement for human accessibility review. Final Malayalam, Hindi and Arabic copy, dietary labels, allergens, prices, review link and event links still need owner approval before public launch.
