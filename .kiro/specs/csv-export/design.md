# CSV Export — Design

## Backend Changes

### analytics_router.py — Refactoring Strategy

Extract two private helpers so the aggregation pipelines are not duplicated:

```python
async def _staff_performance_data() -> list[dict]:
    """Run the staff-performance pipeline and return processed rows."""
    # (moves existing pipeline + post-processing out of get_staff_performance)

async def _product_wise_data() -> list[dict]:
    """Run the product-wise pipeline and return processed rows."""
    # (moves existing pipeline out of get_product_wise_analysis)
```

Existing endpoints delegate to these helpers. New CSV endpoints also call these helpers then format with `csv.writer`.

### CSV generation pattern (used for all three endpoints)

```python
import csv, io
from datetime import date
from fastapi.responses import StreamingResponse

def _make_csv_response(rows: list[list], headers: list[str], filename_prefix: str) -> StreamingResponse:
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(headers)
    writer.writerows(rows)
    buf.seek(0)
    today = date.today().isoformat()
    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename_prefix}_{today}.csv"'},
    )
```

### New endpoints

```
GET /api/analytics/export/tickets-csv
GET /api/analytics/export/staff-performance-csv
GET /api/analytics/export/product-wise-csv
```

All three require `_admin=Depends(require_roles(UserRole.ADMIN))`.

For tickets-csv, fetch with `tickets_collection.find({})` and project the needed fields directly.

## Frontend Changes

### analytics.js — new export functions

```js
export const exportTicketsCSV = () =>
  client.get('/analytics/export/tickets-csv', { responseType: 'blob' })
    .then(res => _triggerDownload(res.data, 'tickets_export.csv'))

export const exportStaffPerformanceCSV = () =>
  client.get('/analytics/export/staff-performance-csv', { responseType: 'blob' })
    .then(res => _triggerDownload(res.data, 'staff_performance.csv'))

export const exportProductWiseCSV = () =>
  client.get('/analytics/export/product-wise-csv', { responseType: 'blob' })
    .then(res => _triggerDownload(res.data, 'product_wise.csv'))

function _triggerDownload(blob, fallbackName) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fallbackName
  a.click()
  URL.revokeObjectURL(url)
}
```

### AnalyticsPage.jsx — button placement

- Below `<h1>Analytics</h1>` header block, add an `<ExportButtons>` component (or inline buttons row) with the tickets export button.
- Inside the Staff Performance `<section>`, add the staff export button alongside or below the `<SectionHeader>`.
- Inside the Product Analysis `<section>`, add the product export button similarly.
- Buttons use `className="btn-secondary"`.
- Each button calls the matching export function; errors are silently caught (console.error).
