# Where the features live

| Feature | Guest experience | Owner control / current status |
| --- | --- | --- |
| Price and sold-out changes | Cards, details and order reflect refreshed prices; unavailable items cannot be ordered | Edit `price`, `variants`, `addons`, `sold_out` or `available` in the Google Sheet **Items** tab. The CSV feeds still need connecting. |
| Four languages | Visible English / മലയാളം / हिन्दी / العربية row below the hero; header selector also remains | `name_en/ml/hi/ar` and `desc_en/ml/hi/ar` columns. Arabic changes reading direction. Missing text falls back to English. |
| Photos and bestsellers | Dish cards | `image` and `tags` columns; use `bestseller`, `chef`, `new`, `combo`, `sharing`, separated by `\|`. |
| Upsells | Open a dish → “Goes well with”; selectable extras above it | `recommended_with` contains item IDs; `addons` contains name/price pairs. |
| Dish views | Tracked when someone opens dish details; not a public counter | Set `VITE_GA4_ID`, rebuild, then view GA4 reports. Currently unconnected, so no real visitor totals are claimed. |
| Google reviews after a meal | A neutral review invitation appears after the guest clicks **Request bill** | Set `google_review_link` in **Settings**. Currently blank, so the prompt stays hidden. A bill request is only a prompt trigger, not proof that payment happened. |
| WhatsApp order | Add dishes → **My order** → **Send order on WhatsApp** | `whatsapp` in Settings. Opens a draft; guest sends and cafe confirms. |
| Waiter and bill | Visible shortcuts below the language choices; also in My order and Cafe information | WhatsApp requests include `?table=5` when the table-specific QR was used. There is no live kitchen/waiter dispatch system. |
| New product animation | **New on the menu**, embedded below the hero and language controls | Plays on entering the viewport. Wide layout on desktop, portrait on phones, with pause/replay. Tap a product label to open its details. |

**Settings is a Google Sheet tab, not an admin screen inside the guest menu.** See [README](README.md#connect-one-google-sheet) for setup and CSV templates. Prices, sold-out flags, review links and campaign fields can then be maintained from a phone.

## New product animation

The animation is part of the main page below the hero and guest controls. Desktop uses a wide composition; phones use a portrait composition. It begins when the section comes into view and pauses offscreen. No popup, backdrop or page scroll lock is used. Existing `?new=1` links also show the normal page; link directly to `#new-on-menu` when needed.

The supplied 10-second video and motion brief guide the choreography: cream 9:16 canvas, tall headline, organic black diagonal panels sliding and expanding through two curved clipping layers at 0.08–2.02 seconds. The panels and their cutout dishes/drinks share each clipping layer, so the food is uncovered within the moving boundary and settles with a small slide/scale. Fine-line callouts, prices, names and descriptions stagger into place at 2.25–3.67 seconds with smooth cubic-bezier easing, then hold to 10 seconds. Fress Trees branding and illustrative sample products replace the source identity. Pause and replay are available; reduced-motion users receive the complete static composition. There is no autoplay audio.

| Settings key | Meaning |
| --- | --- |
| `show_new_release` | `TRUE` shows the inline animated section; `FALSE` hides it. |
| `release_item_ids` | Up to four existing item IDs, in this order: upper plate, lower plate, left drink, right drink. Defaults: `alfredo\|greek-salad\|iced-latte\|watermelon`. |
| `release_image_1` … `release_image_4` | Transparent PNG/WebP cutouts, in the same order. Store approved images in `public/brand/`. Names/prices always come from the corresponding menu item. Replace the sample art when changing the dishes. |

Generated sample art and the full built-in image-generation prompts are in [public/brand/release](public/brand/release). These are illustrations, not photographs of food served by the cafe. `show_sample_banner` keeps sample prices clearly marked.

## Two client pitches

**1. Change the menu without reprinting it.** “Update a price or mark a dish sold out from your phone. Every table uses the same QR menu, which refreshes automatically.” The browser checks every 60 seconds while visible and on returning to the page. Google can delay published CSV updates; this is not guaranteed instant inventory sync. If a chosen option disappears, checkout is blocked until that selection is removed.

**2. Welcome guests in their own language.** “One scan, four languages: English, Malayalam, Hindi and Arabic. Tourists and local families can explore the same menu comfortably, with photos and clear prices.” Have a native speaker approve final translations before a public launch.

## View dishes in GA4

1. Add the cafe’s real measurement ID to `VITE_GA4_ID`, rebuild and deploy.
2. The `item_view` event carries `item_id`, `item_name` and `item_category`. It counts detail opens, not unique people or card impressions.
3. In GA4 Admin → Custom definitions, register event-scoped dimensions for those parameters. In Explore, filter Event name to `item_view`, use Item name / Item ID as rows and Event count as the value.
4. Use Realtime/DebugView to verify initial collection. Custom dimensions may need 24–48 hours before reporting. No raw guest order notes or phone numbers are sent by the event code.

Sources: [Google Analytics event parameters](https://support.google.com/analytics/answer/13675006?hl=en), [custom dimensions](https://support.google.com/analytics/answer/14240153?hl=en-au), [MDN reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/%40media/prefers-reduced-motion), [animation pause control](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/animation-play-state).
