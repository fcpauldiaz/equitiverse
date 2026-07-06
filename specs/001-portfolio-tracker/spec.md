# Feature Specification: EquitiVerse

## Overview
EquitiVerse is the equity portfolio tracker for EdgebyRS Equities subscribers. Admin publishes equity positions; subscribers view performance with delayed market prices via dashboard and scheduled email digests.

## User Stories

### US1 — Publish Position (Admin)
Admin adds ticker, entry price, entry date, optional thesis. Status defaults to `open`.

### US2 — Close Position (Admin)
Admin marks position closed with exit price and date. Performance locks to realized return.

### US3 — Subscriber Dashboard
Subscriber sees positions with entry, current price, return %, status, last quote update.

### US4 — Portfolio Summary
Aggregate: open count, average return, best/worst performer.

### US5 — Email Digest
Scheduled daily/weekly email with portfolio summary and dashboard link.

### US6 — Subscriber Onboarding
Admin sends invite link; subscriber registers and accesses EquitiVerse.

## Non-Functional
- Prices delayed ~15 min (Finnhub free tier)
- EquitiVerse visual design (EdgebyRS language: Montserrat, dark `#131517`, gradients)
- Not financial advice disclaimer
