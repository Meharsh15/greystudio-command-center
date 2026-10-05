# GreyStudio Command Center

Private, mobile-first operating system for GreyStudio.

Includes fast cash capture, monthly survival tracking, debt plan, tasks, agency pipeline, daily shop pulse, and an AI advisor. Data is stored server-side in Turso.

## Required Vercel variables

TURSO_DATABASE_URL
TURSO_AUTH_TOKEN
APP_PASSWORD

Optional AI:
AI_GATEWAY_API_KEY
AI_MODEL

Never use NEXT_PUBLIC_ for these secrets.

## Quick cash syntax

100+, +100, 100v, V100 = incoming
100-, -100, 100p, P100 = outgoing
Add a description after the amount, e.g. 500+ passport

Initial planning values are seeded and can be changed in the database. They are not hard-coded financial truth.
