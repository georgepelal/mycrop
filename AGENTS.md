# Core Project Instructions

## Strict Architectural Constraint: No Fake or Simulated Telemetry/Sensors
- **No Mock or Fake Data**: You are strictly forbidden from adding simulated data streams, pretend real-time hardware sensors, or mock wireless ping signals to the map or pages.
- **Literal and Authentic Mapping**: Any points plotted on the map must correspond directly and transparently to actual spatial boundaries, historical records, or registered user sample data. 
- **Terminology Discipline**: Never label user data point estimations as live dynamic hardware "sensors" or "active probes" unless actual hardware integrations exist. Use direct, humble, and literal descriptions (e.g., "Soil Sample Location", "Historical Core Log") instead of high-tech telemetry jargon.

## Missing Data Stays Missing
- If a provider fails or omits a value, return `null`, cut the series at the first gap, or answer 502/503. Never substitute a "typical" number, a default location, or a value derived from the coordinates (e.g. `Math.sin(lat)`).
- `null` is not zero: pages render missing values as "—", never `?? 0`.
- Label heuristics as heuristics. Don't cite a named scientific model unless the code implements it.
- `test/honest-data.test.ts` covers this; extend it when you add an endpoint.

## No Fake Billing, Payments, or Compliance Claims
This project is an open multi-tool demo, not a paid product — there is no subscription/billing layer (removed 2026-09; see git history if resurrecting any part of it).
- **No Simulated Checkout**: Do not add credit-card forms, "processing payment" animations, wallet/credits balances, or plan/tier gating unless a real payment processor is actually integrated.
- **No Fabricated Compliance/Security Badges**: Never claim "PCI-DSS Compliant," "Stripe Secured," or similar unless that integration genuinely exists. A fake trust badge is worse than no badge.
