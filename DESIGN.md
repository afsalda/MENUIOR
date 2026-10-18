---
version: alpha
name: "Menuoir"
description: "A compact menu, games, and review entry screen with a garden-inspired game area."
colors:
  primary: "#315b43"
  hero: "#244b37"
  background: "#faf8f1"
  cream: "#f4f2e6"
  ink: "#254235"
  accent: "#e8e7c1"
typography:
  sans:
    fontFamily: "DM Sans, sans-serif"
  serif:
    fontFamily: "Lora, Georgia, serif"
rounded:
  DEFAULT: "15px"
  card: "18px"
  pill: "100px"
spacing:
  section-gap: "105px"
  page-max: "1500px"
components:
  button: {}
  card: {}
  game: {}
  form: {}
---

# Menuoir Design System

## Overview

### Creative North Star

A small stack of three pastel choice cards, followed by the existing garden-themed menu and game area.

### Product context and register

- **Audience and primary job:** Café guests on phones who want to browse dishes quickly, find the menu, and play short games during a visit.
- **Market and locale:** The café is in Edapally, Kochi. The existing menu supports English, Malayalam, Hindi and Arabic; new landing and games copy is English until approved translations are supplied.
- **Usage scene:** Mostly a phone at a table; controls should be large enough for touch and scores easy to read.
- **Register:** Compact entry screen, practical menu and admin routes.
- **Memorable signature:** A tilted paper score ticket inside the garden arcade.
- **Restraint:** Menu, forms and claim steps use familiar buttons and explicit labels.
- **Anti-references:** Casino styling and simulated verification. Rewards are a clearly labelled demo and staff checks social actions in person.
- **Token ownership:** Runtime CSS in `src/styles.css`, `src/components/Landing.css` and `src/components/Games.css` is canonical. This document mirrors implemented tokens.

## Colors

Forest green anchors the arcade; warm off-white carries the entry screen. Light sage, yellow-green and peach distinguish Menu, Games and Review. Text on pale surfaces uses dark green; focus uses the existing rust outline in `src/styles.css`.

## Typography

Lora sets headlines and card titles; DM Sans sets navigation, body, labels and numbers. Headlines use close tracking and generous line-height. Controls avoid all-capitals except small eyebrows and status labels.

## Layout

The entry screen is a centered column up to 490px wide, with three short cards visible on a typical phone screen. The separate games page tops out at 1500px. Its four selectors use two columns, including on phones, while offers and claim steps become one column.

## Elevation & Depth

Tonal differences and borders organize surfaces. The tilted score ticket carries the only conspicuous depth.

## Shapes

Cards use roughly 15–22px radii; primary actions use pill shapes. Game tiles use slightly tighter corners for a compact playing surface.

## Components

### Foundational visual states

Hover lifts selection cards a little. Selected games invert to a cream surface. Keyboard focus uses the global visible outline. Disabled rewards remain labelled with the points needed. Results and validation are in-page text. Reduced-motion removes transitions.

### Buttons and actions

Primary buttons are forest green on cream or cream on green. Links to the menu and external social destinations state their purpose in text and use arrow icons only as supplements.

### Navigation and data display

The root page offers Menu, Games and Review in that order. `/?menu=1` remains the guest menu, `/?games=1` opens the games and offers, and QR URLs with a table query still open the menu directly. `/?admin=1` remains the demo admin.

### Forms and overlays

Private feedback uses a labelled textarea, an inline minimum-length error and a clear save action. Claim steps use native checkboxes; the final state says ready for staff review, not verified.

### Iconography

Lucide line icons accompany text. Decorative game symbols are visually distinct, but never the only accessible name for an action.

### Motion

The catch target changes position and the pour marker travels across a meter as game state. Reduced-motion users receive the same controls without decorative transitions.

### Content and data visualization

Scores show each game's best out of 50 and the total out of 400. Reward thresholds are 100 and 160 points, both explicitly demo offers. Instagram post and direct Google review links remain placeholders pending approved destinations.

## Do's and Don'ts

- **Do:** Keep menu and games visually related through the garden palette.
- **Do:** Distinguish customer self-confirmation from staff verification.
- **Don't:** imply that the website can verify Instagram follows or likes automatically.
- **Don't:** tie any reward to a public Google review.

## Dedicated gameplay

Eight games use /?games=1&game=<id>. Each opens a full-viewport cream play surface with only game controls, a start screen, best score, restart, and arcade link. The four new games are Malayalam Cinema, Sweet Swap, Barista Rush, and Garden Echo. Each contributes at most 50 points; the existing 100/160 demo offers remain unchanged. Legacy four-game scores migrate with zero defaults for new games.

## Player entry
Games require a first name and phone number, validated by src/lib/player.ts. PlayerEntry owns the shared three-step journey (details, play, claim). Details are session-only and never sent to a server in this demo; the UI states this. This is not authentication or phone verification. Games and points retain their existing browser-local persistence.
