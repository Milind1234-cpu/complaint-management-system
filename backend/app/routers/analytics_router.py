import csv
import io
from datetime import date

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from app.db.database import tickets_collection
from app.models.user import UserRole
from app.auth.dependencies import require_roles

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


def _make_csv_response(rows: list, headers: list, filename_prefix: str) -> StreamingResponse:
    """Build an in-memory CSV and return it as a StreamingResponse download."""
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

PENDING_STATUSES = ["open", "in_progress"]
COMPLETED_STATUSES = ["resolved", "closed"]


@router.get("/overview")
async def get_overview(_admin=Depends(require_roles(UserRole.ADMIN))):
    """Top-level stat cards: total, open, in-progress, resolved, closed, avg resolution time (hours)."""
    pipeline = [{"$group": {"_id": "$status", "count": {"$sum": 1}}}]
    status_counts = {doc["_id"]: doc["count"] async for doc in tickets_collection.aggregate(pipeline)}
    total = sum(status_counts.values())

    resolution_pipeline = [
        {"$match": {"resolved_at": {"$ne": None}}},
        {"$project": {"resolution_hours": {"$divide": [{"$subtract": ["$resolved_at", "$created_at"]}, 1000 * 60 * 60]}}},
        {"$group": {"_id": None, "avg_hours": {"$avg": "$resolution_hours"}}},
    ]
    avg_result = await tickets_collection.aggregate(resolution_pipeline).to_list(length=1)
    avg_resolution_hours = round(avg_result[0]["avg_hours"], 2) if avg_result else None

    return {
        "total_tickets": total,
        "open": status_counts.get("open", 0),
        "in_progress": status_counts.get("in_progress", 0),
        "resolved": status_counts.get("resolved", 0),
        "closed": status_counts.get("closed", 0),
        "average_resolution_time_hours": avg_resolution_hours,
    }


async def _staff_performance_data() -> list:
    """Run the staff-performance pipeline and return processed rows."""
    pipeline = [
        {"$match": {"assigned_to": {"$ne": None}}},
        {
            "$group": {
                "_id": "$assigned_to",
                "staff_name": {"$first": "$assigned_to_name"},
                "total_assigned": {"$sum": 1},
                "completed": {"$sum": {"$cond": [{"$in": ["$status", COMPLETED_STATUSES]}, 1, 0]}},
                "pending": {"$sum": {"$cond": [{"$in": ["$status", PENDING_STATUSES]}, 1, 0]}},
                "resolution_times": {
                    "$push": {
                        "$cond": [
                            {"$ne": ["$resolved_at", None]},
                            {"$divide": [{"$subtract": ["$resolved_at", "$created_at"]}, 1000 * 60 * 60]},
                            None,
                        ]
                    }
                },
            }
        },
        {
            "$project": {
                "_id": 0,
                "staff_id": {"$toString": "$_id"},
                "staff_name": 1,
                "total_assigned": 1,
                "completed": 1,
                "pending": 1,
                "resolution_times": {"$filter": {"input": "$resolution_times", "as": "t", "cond": {"$ne": ["$$t", None]}}},
            }
        },
    ]
    results = await tickets_collection.aggregate(pipeline).to_list(length=None)
    for r in results:
        times = r.pop("resolution_times")
        r["average_resolution_time_hours"] = round(sum(times) / len(times), 2) if times else None
    return results


@router.get("/staff-performance")
async def get_staff_performance(_admin=Depends(require_roles(UserRole.ADMIN))):
    """Per staff member: total assigned, completed, pending, and average resolution time."""
    return await _staff_performance_data()


async def _product_wise_data() -> list:
    """Run the product-wise pipeline and return processed rows."""
    pipeline = [
        {
            "$group": {
                "_id": "$product_id",
                "product_name": {"$first": "$product_name"},
                "total_complaints": {"$sum": 1},
                "open": {"$sum": {"$cond": [{"$eq": ["$status", "open"]}, 1, 0]}},
                "in_progress": {"$sum": {"$cond": [{"$eq": ["$status", "in_progress"]}, 1, 0]}},
                "resolved": {"$sum": {"$cond": [{"$eq": ["$status", "resolved"]}, 1, 0]}},
                "closed": {"$sum": {"$cond": [{"$eq": ["$status", "closed"]}, 1, 0]}},
            }
        },
        {"$project": {"_id": 0, "product_id": {"$toString": "$_id"}, "product_name": 1, "total_complaints": 1, "open": 1, "in_progress": 1, "resolved": 1, "closed": 1}},
        {"$sort": {"total_complaints": -1}},
    ]
    return await tickets_collection.aggregate(pipeline).to_list(length=None)


@router.get("/product-wise")
async def get_product_wise_analysis(_admin=Depends(require_roles(UserRole.ADMIN))):
    """Complaint volume and status breakdown per product."""
    return await _product_wise_data()


@router.get("/team-performance")
async def get_team_performance(_admin=Depends(require_roles(UserRole.ADMIN))):
    """Aggregate performance metrics rolled up per team."""
    pipeline = [
        {"$match": {"team_id": {"$ne": None}}},
        {
            "$group": {
                "_id": "$team_id",
                "total_tickets": {"$sum": 1},
                "resolved": {"$sum": {"$cond": [{"$in": ["$status", COMPLETED_STATUSES]}, 1, 0]}},
                "pending": {"$sum": {"$cond": [{"$in": ["$status", PENDING_STATUSES]}, 1, 0]}},
                "resolution_times": {
                    "$push": {
                        "$cond": [
                            {"$ne": ["$resolved_at", None]},
                            {"$divide": [{"$subtract": ["$resolved_at", "$created_at"]}, 1000 * 60 * 60]},
                            None,
                        ]
                    }
                },
            }
        },
        {"$lookup": {"from": "teams", "localField": "_id", "foreignField": "_id", "as": "team_info"}},
        {
            "$project": {
                "_id": 0,
                "team_id": {"$toString": "$_id"},
                "team_name": {"$arrayElemAt": ["$team_info.name", 0]},
                "total_tickets": 1,
                "resolved": 1,
                "pending": 1,
                "resolution_times": {"$filter": {"input": "$resolution_times", "as": "t", "cond": {"$ne": ["$$t", None]}}},
            }
        },
    ]
    results = await tickets_collection.aggregate(pipeline).to_list(length=None)
    for r in results:
        times = r.pop("resolution_times")
        r["average_resolution_time_hours"] = round(sum(times) / len(times), 2) if times else None
    return results


@router.get("/ticket-resolution-times")
async def get_ticket_resolution_times(_admin=Depends(require_roles(UserRole.ADMIN))):
    """Time taken for each individual resolved ticket — used for the resolution trend chart."""
    pipeline = [
        {"$match": {"resolved_at": {"$ne": None}}},
        {
            "$project": {
                "_id": 0,
                "ticket_id": {"$toString": "$_id"},
                "title": 1,
                "product_name": 1,
                "assigned_to_name": 1,
                "created_at": 1,
                "resolved_at": 1,
                "resolution_time_hours": {"$round": [{"$divide": [{"$subtract": ["$resolved_at", "$created_at"]}, 1000 * 60 * 60]}, 2]},
            }
        },
        {"$sort": {"resolved_at": -1}},
    ]
    return await tickets_collection.aggregate(pipeline).to_list(length=None)


@router.get("/export/tickets-csv")
async def export_tickets_csv(_admin=Depends(require_roles(UserRole.ADMIN))):
    """Export all tickets as a CSV file download."""
    tickets = await tickets_collection.find({}).to_list(length=None)
    rows = []
    for t in tickets:
        created_at = t.get("created_at")
        resolved_at = t.get("resolved_at")
        # Compute resolution time in hours
        if created_at and resolved_at:
            delta_seconds = (resolved_at - created_at).total_seconds()
            resolution_hours = round(delta_seconds / 3600, 2)
        else:
            resolution_hours = ""
        rows.append([
            str(t.get("_id", "")),
            t.get("title", ""),
            t.get("product_name", ""),
            t.get("status", ""),
            t.get("priority", ""),
            t.get("created_by_name", ""),
            t.get("assigned_to_name", ""),
            created_at.isoformat() if created_at else "",
            resolved_at.isoformat() if resolved_at else "",
            resolution_hours,
        ])
    headers = ["Ticket ID", "Title", "Product", "Status", "Priority",
               "Created By", "Assigned To", "Created At", "Resolved At", "Resolution Time (hours)"]
    return _make_csv_response(rows, headers, "tickets_export")


@router.get("/export/staff-performance-csv")
async def export_staff_performance_csv(_admin=Depends(require_roles(UserRole.ADMIN))):
    """Export staff performance data as a CSV file download."""
    data = await _staff_performance_data()
    rows = [
        [
            r.get("staff_name") or r.get("staff_id", ""),
            r.get("total_assigned", ""),
            r.get("completed", ""),
            r.get("pending", ""),
            r.get("average_resolution_time_hours", ""),
        ]
        for r in data
    ]
    headers = ["Staff Name", "Total Assigned", "Completed", "Pending", "Avg Resolution Time (hours)"]
    return _make_csv_response(rows, headers, "staff_performance")


@router.get("/export/product-wise-csv")
async def export_product_wise_csv(_admin=Depends(require_roles(UserRole.ADMIN))):
    """Export product-wise complaint analysis as a CSV file download."""
    data = await _product_wise_data()
    rows = [
        [
            r.get("product_name") or r.get("product_id", ""),
            r.get("total_complaints", ""),
            r.get("open", ""),
            r.get("in_progress", ""),
            r.get("resolved", ""),
            r.get("closed", ""),
        ]
        for r in data
    ]
    headers = ["Product Name", "Total Complaints", "Open", "In Progress", "Resolved", "Closed"]
    return _make_csv_response(rows, headers, "product_wise")


async def _satisfaction_overview_data() -> dict:
    """Compute satisfaction rating overview: overall stats + per-staff breakdown."""
    # Overall stats
    overall_pipeline = [
        {"$match": {"satisfaction_rating": {"$ne": None}}},
        {
            "$group": {
                "_id": None,
                "average_rating": {"$avg": "$satisfaction_rating"},
                "total_ratings": {"$sum": 1},
                "ratings": {"$push": "$satisfaction_rating"},
            }
        },
    ]
    overall_result = await tickets_collection.aggregate(overall_pipeline).to_list(length=1)

    if not overall_result:
        return {
            "average_rating": None,
            "total_ratings": 0,
            "rating_distribution": {"1": 0, "2": 0, "3": 0, "4": 0, "5": 0},
            "per_staff_satisfaction": [],
        }

    overall = overall_result[0]
    average_rating = round(overall["average_rating"], 2)
    total_ratings = overall["total_ratings"]

    # Build distribution from pushed ratings list
    distribution = {"1": 0, "2": 0, "3": 0, "4": 0, "5": 0}
    for r in overall["ratings"]:
        key = str(int(r))
        if key in distribution:
            distribution[key] += 1

    # Per-staff breakdown
    staff_pipeline = [
        {"$match": {"satisfaction_rating": {"$ne": None}, "assigned_to": {"$ne": None}}},
        {
            "$group": {
                "_id": "$assigned_to",
                "staff_name": {"$first": "$assigned_to_name"},
                "average_rating": {"$avg": "$satisfaction_rating"},
                "total_ratings": {"$sum": 1},
            }
        },
        {
            "$project": {
                "_id": 0,
                "staff_id": {"$toString": "$_id"},
                "staff_name": 1,
                "average_rating": {"$round": ["$average_rating", 2]},
                "total_ratings": 1,
            }
        },
        {"$sort": {"average_rating": -1}},
    ]
    per_staff = await tickets_collection.aggregate(staff_pipeline).to_list(length=None)

    return {
        "average_rating": average_rating,
        "total_ratings": total_ratings,
        "rating_distribution": distribution,
        "per_staff_satisfaction": per_staff,
    }


@router.get("/satisfaction-overview")
async def get_satisfaction_overview(_admin=Depends(require_roles(UserRole.ADMIN))):
    """Overall customer satisfaction stats and per-staff breakdown."""
    return await _satisfaction_overview_data()
