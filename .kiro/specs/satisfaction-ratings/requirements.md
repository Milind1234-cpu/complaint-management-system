# Customer Satisfaction Ratings — Requirements

## Overview
Add a Customer Satisfaction Rating system. All changes are purely additive — no existing ticket creation, status update, or assignment logic is modified.

## Requirements

### R1 — Ticket Model: Add Rating Fields
- Add to `TicketOut` (do NOT remove any existing fields):
  - `satisfaction_rating: int | None = None`  (1–5)
  - `satisfaction_comment: str | None = None`
  - `rated_at: datetime | None = None`
- Add new request model `TicketRatingSubmit(BaseModel)`:
  - `rating: int = Field(ge=1, le=5)`
  - `comment: str | None = Field(default=None, max_length=1000)`
- Existing tickets with no rating fields in DB must still parse correctly via Pydantic defaults.

### R2 — Tickets Router: POST /api/tickets/{ticket_id}/rate
- Auth: any logged-in user (`get_current_user`)
- Authorization: only the customer who created the ticket (`ticket["created_by"] == current_user.id`), else 403 "You are not authorized to rate this ticket"
- Gate: ticket status must be "resolved" or "closed", else 400 "Ticket must be resolved before rating"
- Idempotency: if `satisfaction_rating` already set on ticket, return 400 "This ticket has already been rated"
- On success: set `satisfaction_rating`, `satisfaction_comment`, `rated_at = utc_now()`, and append activity log entry: `action="rated"`, `detail=f"Customer rated this ticket {rating}/5 stars"`
- Return: updated `TicketOut`

### R3 — Analytics Router: GET /api/analytics/satisfaction-overview
- Admin-only (`require_roles(UserRole.ADMIN)`)
- Returns:
  - `average_rating: float | None` — average of all `satisfaction_rating` values (rounded to 2 decimals), None if no ratings yet
  - `total_ratings: int` — count of tickets with a satisfaction_rating
  - `rating_distribution: dict` — `{"1": n, "2": n, "3": n, "4": n, "5": n}` (counts per star level, 0 for missing)
  - `per_staff_satisfaction: list[dict]` — grouped by `assigned_to` where satisfaction_rating exists: `{staff_name, staff_id, average_rating, total_ratings}`
- Follow same aggregation helper pattern as `_staff_performance_data()`; extract as `_satisfaction_overview_data()` for reuse

### R4 — Frontend API: tickets.js
- Add: `rateTicket(ticketId, { rating, comment })` → `client.post(\`/tickets/${ticketId}/rate\`, { rating, comment })`

### R5 — Frontend API: analytics.js
- Add: `getSatisfactionOverview()` → `client.get('/analytics/satisfaction-overview')`

### R6 — StarRating Component: frontend/src/components/ui/StarRating.jsx
- Reusable component, props: `value` (int 0–5), `onChange` (fn), `readOnly` (bool), `size` (sm|md|lg, default md)
- Uses lucide-react `Star` icon (filled/outlined based on selection/hover)
- Interactive mode: hover highlights stars, click sets value, calls `onChange(n)`
- ReadOnly mode: renders filled stars up to `value`, outlined for rest
- Accessible: `aria-label` on each star button

### R7 — TicketDetailPage: "Rate This Ticket" section
- Show interactive rating form ONLY when ALL:
  - `isCustomer === true`
  - `ticket.created_by === user._id`
  - `ticket.status === 'resolved' || ticket.status === 'closed'`
  - `ticket.satisfaction_rating == null`
- Form: `StarRating` component (interactive), optional textarea comment (max 1000 chars), "Submit Rating" button (`btn-primary`)
- On submit: call `rateTicket()`, reload ticket on success, show inline error on failure
- Show read-only display when `satisfaction_rating` IS set: `StarRating` in readOnly mode + rating text "You rated: X/5" + comment if any
- Import and use `rateTicket` from `../api/tickets`

### R8 — AnalyticsPage: "Customer Satisfaction" section (6th section)
- Add `satisfactionData` state + `getSatisfactionOverview()` to the `Promise.allSettled` call
- New `SatisfactionSection` component:
  - 2 stat cards: "Average Rating" (e.g. "4.3 ★"), "Total Ratings"
  - Bar chart: `rating_distribution` (x-axis: "1★" through "5★", y-axis: count)
  - Table: `per_staff_satisfaction` sorted highest-rated first (columns: Staff, Avg Rating, Total Ratings)
- If no ratings yet, show `EmptyState`

### R9 — Test: test_satisfaction_flow.py
- New test script `backend/test_satisfaction_flow.py` that:
  1. Creates a ticket as customer, resolves it as staff
  2. Staff attempts to rate → expects 403
  3. Customer rates (rating=5, comment="Great service") → expects 200
  4. GET /api/analytics/satisfaction-overview → verify average_rating=5.0, total_ratings≥1
  5. Customer attempts second rating → expects 400
  6. All 15 original `test_api_flow.py` tests still pass

### R10 — Preservation
- All 15 existing `test_api_flow.py` tests still pass
- `npm run build` — zero errors
