# CSV Export — Requirements

## Overview
Add CSV export functionality to the Complaint Management System. All changes are purely additive — no existing logic is modified.

## Requirements

### R1 — Backend: Export All Tickets as CSV
- GET /api/analytics/export/tickets-csv
- Admin-only (reuse `require_roles(UserRole.ADMIN)`)
- Fetches all documents from `tickets_collection`
- Returns `StreamingResponse` with `media_type="text/csv"`
- Content-Disposition header: `attachment; filename="tickets_export_{YYYY-MM-DD}.csv"`
- Columns (in order): Ticket ID, Title, Product, Status, Priority, Created By, Assigned To, Created At, Resolved At, Resolution Time (hours)
- Resolution Time computed as `(resolved_at - created_at)` in hours; empty string if `resolved_at` is None
- Uses Python's built-in `csv` module with `io.StringIO` — no new dependencies

### R2 — Backend: Export Staff Performance as CSV
- GET /api/analytics/export/staff-performance-csv
- Admin-only
- Refactor `get_staff_performance()` to extract the aggregation + post-processing into a private async helper `_staff_performance_data()` that returns `list[dict]`
- Both the existing JSON endpoint and the new CSV endpoint call this helper
- Columns: Staff Name, Total Assigned, Completed, Pending, Avg Resolution Time (hours)

### R3 — Backend: Export Product-wise Analysis as CSV
- GET /api/analytics/export/product-wise-csv
- Admin-only
- Refactor `get_product_wise_analysis()` to extract logic into `_product_wise_data()` helper similarly
- Columns: Product Name, Total Complaints, Open, In Progress, Resolved, Closed

### R4 — Frontend: Export API functions
- Add to `frontend/src/api/analytics.js`:
  - `exportTicketsCSV()` — fetches blob, triggers download
  - `exportStaffPerformanceCSV()` — fetches blob, triggers download
  - `exportProductWiseCSV()` — fetches blob, triggers download
- Use axios with `responseType: 'blob'` and the existing `client` (Bearer token is auto-attached)
- Trigger download via `URL.createObjectURL` on the returned blob

### R5 — Frontend: Export Buttons in AnalyticsPage.jsx
- "Export All Tickets (CSV)" button at the top of the page (below the page header, above the Overview section)
- "Export Staff Data (CSV)" button at the top of the Staff Performance section (inside `SectionHeader` area or immediately below it)
- "Export Product Data (CSV)" button at the top of the Product Analysis section
- All buttons use existing `btn-secondary` CSS class
- Clicking triggers the corresponding export function from R4

### R6 — Verification
- All 15 existing `test_api_flow.py` tests still pass (nothing existing is broken)
- `npm run build` completes with zero errors
- Manual test: admin can click each button and download a valid CSV
