# Customer Satisfaction Ratings — Design

## Backend

### ticket.py changes
Append to `TicketOut`:
```python
satisfaction_rating: int | None = None
satisfaction_comment: str | None = None
rated_at: datetime | None = None
```
New model after `TicketCommentCreate`:
```python
class TicketRatingSubmit(BaseModel):
    rating: int = Field(ge=1, le=5)
    comment: str | None = Field(default=None, max_length=1000)
```

### tickets_router.py — new endpoint
```python
@router.post("/{ticket_id}/rate", response_model=TicketOut)
async def rate_ticket(ticket_id: str, payload: TicketRatingSubmit, current_user: UserOut = Depends(get_current_user)):
    # 1. Load ticket, 404 if missing / invalid id
    # 2. Check created_by == current_user.id → 403
    # 3. Check status in {resolved, closed} → 400
    # 4. Check satisfaction_rating is None → 400
    # 5. find_one_and_update: $set rating fields + $push log entry
    # 6. Return TicketOut
```
Import `TicketRatingSubmit` in the router.

### analytics_router.py — new helper + endpoint
```python
async def _satisfaction_overview_data() -> dict:
    # Pipeline 1: overall avg + count + distribution
    # Pipeline 2: per-staff aggregation
    # Returns {"average_rating", "total_ratings", "rating_distribution", "per_staff_satisfaction"}

@router.get("/satisfaction-overview")
async def get_satisfaction_overview(_admin=Depends(require_roles(UserRole.ADMIN))):
    return await _satisfaction_overview_data()
```

#### Aggregation design
Pipeline 1 — overall stats:
```python
[
  {"$match": {"satisfaction_rating": {"$ne": None}}},
  {"$group": {
    "_id": None,
    "average_rating": {"$avg": "$satisfaction_rating"},
    "total_ratings": {"$sum": 1},
    "ratings": {"$push": "$satisfaction_rating"}
  }}
]
```
Build `rating_distribution` in Python from the `ratings` list.

Pipeline 2 — per-staff:
```python
[
  {"$match": {"satisfaction_rating": {"$ne": None}, "assigned_to": {"$ne": None}}},
  {"$group": {
    "_id": "$assigned_to",
    "staff_name": {"$first": "$assigned_to_name"},
    "average_rating": {"$avg": "$satisfaction_rating"},
    "total_ratings": {"$sum": 1}
  }},
  {"$project": {"_id": 0, "staff_id": {"$toString": "$_id"}, "staff_name": 1, "average_rating": {"$round": ["$average_rating", 2]}, "total_ratings": 1}},
  {"$sort": {"average_rating": -1}}
]
```

## Frontend

### StarRating.jsx
```jsx
// Props: value (0–5), onChange, readOnly, size ('sm'|'md'|'lg')
// Uses lucide-react Star icon
// Interactive: hover state tracked in component, click calls onChange
// ReadOnly: no hover, no click
```

Size map: sm=14, md=20, lg=28 (px).

### TicketDetailPage.jsx additions
- Import `rateTicket` from `../api/tickets`
- Import `StarRating` from `../components/ui/StarRating`
- Add state: `ratingValue`, `ratingComment`, `submittingRating`, `ratingError`
- Show-condition guard (all must be true): `isCustomer && ticket.created_by === user._id && ['resolved','closed'].includes(ticket.status) && ticket.satisfaction_rating == null`
- On submit: `rateTicket(id, { rating: ratingValue, comment: ratingComment || undefined })` → reload
- Read-only display condition: `isCustomer && ticket.created_by === user._id && ticket.satisfaction_rating != null`

### AnalyticsPage.jsx additions
- Add `satisfactionData` state
- Add `getSatisfactionOverview()` to `Promise.allSettled` call
- Add new `SatisfactionSection` component before the closing `</div>` of the main page return
- Bar chart uses `AMBER_500` fill for the rating distribution bars

### analytics.js addition
```js
export const getSatisfactionOverview = () => client.get('/analytics/satisfaction-overview')
```

### tickets.js addition
```js
export const rateTicket = (ticketId, { rating, comment }) =>
  client.post(`/tickets/${ticketId}/rate`, { rating, comment })
```

## Test script: test_satisfaction_flow.py
Standalone script, runs against http://127.0.0.1:8000.
Steps: register/login users → create ticket → resolve → test 403 for staff rating → rate as customer → verify analytics → test double-rating 400.
