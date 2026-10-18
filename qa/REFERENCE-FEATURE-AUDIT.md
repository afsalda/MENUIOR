# FreeBees reference audit — in progress

Reference: https://play.freebeesmarket.com/fresstrees

## Observed in the browser

| Reference behavior | Menuoir status | Adaptation |
| --- | --- | --- |
| Branded play entry and points balance | Eight-game arcade and persisted best scores exist | Keep compact Menu / Games / Review root; enrich arcade entry |
| Start Playing call to action | Game links and dedicated start screens exist | Retain dedicated gameplay |
| Featured reward strip | Two demo offers at 100 and 160 points exist | Keep approved offers; surface progress before play |
| Current wait time | Not present | Requires owner-set or measured data; do not copy 15-minute claim |
| Player count / social proof | Not present | Requires real analytics; do not copy 500+ claim |
| Three-step journey | Claim steps exist, but no journey indicator | Map only after steps two and three are inspected |
| First-name and phone-number entry | Not present | Reference form blocks further inspection; no customer data submitted |
| Profile icon | Reference icon clicked; no visible response | No account functionality verified |

## Inspection boundary

The reference requires first name and phone number before showing further screens.
The user has been asked to complete this step in the reference tab. No game,
leaderboard, OTP, coupon, or redemption behavior beyond this point is yet verified.
Do not describe inferred functionality as observed or feature parity as complete.

## Existing constraints

- Menuoir uses a forest-green, cream, sage, and peach palette with Lora / DM Sans.
- Keep all eight games and standalone play routes.
- Existing rewards are demos; Instagram actions are checked by café staff.
- Public reviews remain optional and independent of rewards.
- Vercel deployment previously failed because the current account could not access the linked Menuoir team. Recheck access before claiming deployment.

## Implemented entry flow
First name and phone form, field validation, session persistence, edit details, dedicated game route gating, and three-step journey are now implemented in Menuoir styling. Browser checks covered empty submission and valid demo entry. Reference screens beyond its empty phone form remain uninspected. Central customer storage is not connected.
