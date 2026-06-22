# CSV Export — Tasks

## Task List

- [x] 1. Refactor analytics_router.py and add CSV export endpoints
  - [x] 1.1 Extract `_staff_performance_data()` helper from `get_staff_performance()` and update the existing endpoint to call it
  - [x] 1.2 Extract `_product_wise_data()` helper from `get_product_wise_analysis()` and update the existing endpoint to call it
  - [x] 1.3 Add `_make_csv_response()` utility, import `csv`, `io`, `date`, `StreamingResponse`
  - [x] 1.4 Add `GET /api/analytics/export/tickets-csv` endpoint
  - [x] 1.5 Add `GET /api/analytics/export/staff-performance-csv` endpoint using `_staff_performance_data()`
  - [x] 1.6 Add `GET /api/analytics/export/product-wise-csv` endpoint using `_product_wise_data()`

- [x] 2. Add export API functions to frontend/src/api/analytics.js
  - [x] 2.1 Add `_triggerDownload(blob, fallbackName)` helper
  - [x] 2.2 Add `exportTicketsCSV()` calling `/analytics/export/tickets-csv` with `responseType: 'blob'`
  - [x] 2.3 Add `exportStaffPerformanceCSV()` calling `/analytics/export/staff-performance-csv` with `responseType: 'blob'`
  - [x] 2.4 Add `exportProductWiseCSV()` calling `/analytics/export/product-wise-csv` with `responseType: 'blob'`

- [x] 3. Add export buttons to frontend/src/pages/AnalyticsPage.jsx
  - [x] 3.1 Import `exportTicketsCSV`, `exportStaffPerformanceCSV`, `exportProductWiseCSV` from `../api/analytics`
  - [x] 3.2 Add "Export All Tickets (CSV)" button below the page header (above the Overview section)
  - [x] 3.3 Add "Export Staff Data (CSV)" button at the top of the Staff Performance section
  - [x] 3.4 Add "Export Product Data (CSV)" button at the top of the Product Analysis section

- [x] 4. Verify backend and frontend
  - [x] 4.1 Run `python test_api_flow.py` from the backend directory — all 15 tests must pass
  - [x] 4.2 Run `npm run build` from the frontend directory — zero errors
  - [x] 4.3 Commit with message: "feat: add CSV export for tickets, staff performance, and product analytics"
