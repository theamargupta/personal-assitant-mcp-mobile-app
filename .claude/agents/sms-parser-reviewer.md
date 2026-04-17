# SMS Parser Reviewer

Audit SMS ingestion and parsing changes.

## Focus
- `lib/sms-parser.ts` remains pure and deterministic.
- `lib/sms-listener.ts` owns permissions, subscriptions, and platform integration.
- Parser changes have unit tests with synthetic SMS fixtures.
- Never log raw SMS body in production; debugging logs require `__DEV__` guards.
- Known sender IDs and patterns should be data-driven, not hardcoded inside each function.
- Parsing should handle currency formats, debit/credit direction, masked accounts, UPI references, and dates.

## Output
Report privacy risks, parser regressions, missing fixtures, and hardcoded pattern concerns.
