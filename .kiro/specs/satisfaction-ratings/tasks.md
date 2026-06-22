# Customer Satisfaction Ratings — Tasks

## Task List

- [ ] 1. Backend model changes
  - [ ] 1.1 Add `satisfaction_rating`, `satisfaction_comment`, `rated_at` fields to `TicketOut` in `backend/app/models/ticket.py`
  - [ ] 1.2 Add `TicketRatingSubmit` model to `backend/app/models/ticket.py`

- [ ] 2. Backend tickets router — rate endpoint
  - [ ] 2.1 Import `TicketRatingSubmit` in `backend/app/routers/tickets_router.py`
  - [ ] 2.2 Add `POST /api/tickets/{ticket_id}/rate` endpoint to `backend/app/routers/tickets_router.py`

- [ ] 3. Backend analytics router — satisfaction overview
  - [ ] 3.1 Add `_satisfaction_overview_data()` private helper to `backend/app/routers/analytics_router.py`
  - [ ] 3.2 Add `GET /api/analytics/satisfaction-overview` endpoint using the helper

- [ ] 4. Frontend API additions
  - [ ] 4.1 Add `rateTicket(ticketId, { rating, comment })` to `frontend/src/api/tickets.js`
  - [ ] 4.2 Add `getSatisfactionOverview()` to `frontend/src/api/analytics.js`

- [ ] 5. StarRating reusable component
  - [ ] 5.1 Create `frontend/src/components/ui/StarRating.jsx` with interactive and read-only modes

- [ ] 6. TicketDetailPage — rating UI
  - [ ] 6.1 Import `rateTicket` and `StarRating` in `frontend/src/pages/TicketDetailPage.jsx`
  - [ ] 6.2 Add interactive "Rate this ticket" form section (shown when unrated + resolved/closed + is creator customer)
  - [ ] 6.3 Add read-only satisfaction display (shown when already rated + is creator customer)

- [ ] 7. AnalyticsPage — Customer Satisfaction section
  - [ ] 7.1 Import `getSatisfactionOverview` and add `satisfactionData` state to `frontend/src/pages/AnalyticsPage.jsx`
  - [ ] 7.2 Add `SatisfactionSection` component and wire it into the page as section 6

- [ ] 8. Test and verification
  - [ ] 8.1 Write `backend/test_satisfaction_flow.py` test script
  - [ ] 8.2 Run `test_api_flow.py` — confirm all 15 original tests pass
  - [ ] 8.3 Run `test_satisfaction_flow.py` — confirm all new satisfaction tests pass
  - [ ] 8.4 Run `npm run build` — confirm zero errors
  - [ ] 8.5 Commit: "feat: add customer satisfaction ratings with analytics integration"
