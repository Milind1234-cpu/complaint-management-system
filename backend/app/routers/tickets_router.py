from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends, Query, status
from bson import ObjectId
from app.db.database import tickets_collection, products_collection, users_collection
from app.models.ticket import (
    TicketCreate,
    TicketOut,
    TicketStatus,
    TicketStatusUpdate,
    TicketReassign,
    TicketCommentCreate,
)
from app.models.common import utc_now
from app.models.user import UserOut, UserRole
from app.auth.dependencies import get_current_user, require_roles
from app.services.assignment_service import find_best_staff_for_team

router = APIRouter(prefix="/api/tickets", tags=["Tickets"])


def _log_entry(action: str, detail: str, actor: UserOut) -> dict:
    return {
        "action": action,
        "detail": detail,
        "actor_id": ObjectId(actor.id) if actor.id else None,
        "actor_name": actor.name,
        "timestamp": utc_now(),
    }


@router.post("/", response_model=TicketOut, status_code=status.HTTP_201_CREATED)
async def create_ticket(payload: TicketCreate, current_user: UserOut = Depends(get_current_user)):
    product = await products_collection.find_one({"_id": ObjectId(payload.product_id)})
    if not product:
        raise HTTPException(status_code=404, detail="product_id does not match any existing product")
    if not product.get("is_active", True):
        raise HTTPException(status_code=400, detail="This product is no longer accepting complaints")

    team_id = product["team_id"]
    assigned_staff = await find_best_staff_for_team(str(team_id))

    now = utc_now()
    ticket_doc = {
        "title": payload.title,
        "description": payload.description,
        "product_id": ObjectId(payload.product_id),
        "product_name": product["name"],
        "team_id": team_id,
        "status": TicketStatus.OPEN.value,
        "priority": payload.priority.value,
        "created_by": ObjectId(current_user.id),
        "created_by_name": current_user.name,
        "assigned_to": assigned_staff["_id"] if assigned_staff else None,
        "assigned_to_name": assigned_staff["name"] if assigned_staff else None,
        "created_at": now,
        "updated_at": now,
        "resolved_at": None,
        "closed_at": None,
        "activity_log": [
            _log_entry("created", f"Ticket created for product '{product['name']}'", current_user)
        ],
    }

    if assigned_staff:
        ticket_doc["activity_log"].append(
            _log_entry(
                "assigned",
                f"Auto-assigned to {assigned_staff['name']} (least-loaded staff on team)",
                current_user,
            )
        )
    else:
        ticket_doc["activity_log"].append(
            _log_entry("unassigned", "No staff available on the handling team yet", current_user)
        )

    result = await tickets_collection.insert_one(ticket_doc)
    ticket_doc["_id"] = result.inserted_id
    return TicketOut(**ticket_doc)


@router.get("/", response_model=list[TicketOut])
async def list_tickets(
    status_filter: TicketStatus | None = Query(default=None, alias="status"),
    product_id: str | None = None,
    assigned_to: str | None = None,
    search: str | None = None,
    current_user: UserOut = Depends(get_current_user),
):
    query: dict = {}

    # Role-based visibility
    if current_user.role == UserRole.CUSTOMER:
        query["created_by"] = ObjectId(current_user.id)
    elif current_user.role == UserRole.STAFF:
        query["assigned_to"] = ObjectId(current_user.id)
    # admin sees everything unless they filter

    if status_filter:
        query["status"] = status_filter.value
    if product_id:
        query["product_id"] = ObjectId(product_id)
    if assigned_to and current_user.role == UserRole.ADMIN:
        query["assigned_to"] = ObjectId(assigned_to)
    if search:
        query["$text"] = {"$search": search}

    tickets = await tickets_collection.find(query).sort("created_at", -1).to_list(length=None)
    return [TicketOut(**t) for t in tickets]


@router.get("/{ticket_id}", response_model=TicketOut)
async def get_ticket(ticket_id: str, current_user: UserOut = Depends(get_current_user)):
    ticket = await tickets_collection.find_one({"_id": ObjectId(ticket_id)})
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    _check_can_view(ticket, current_user)
    return TicketOut(**ticket)


def _check_can_view(ticket: dict, current_user: UserOut):
    if current_user.role == UserRole.ADMIN:
        return
    if current_user.role == UserRole.CUSTOMER and str(ticket["created_by"]) == current_user.id:
        return
    if current_user.role == UserRole.STAFF and ticket.get("assigned_to") and str(ticket["assigned_to"]) == current_user.id:
        return
    raise HTTPException(status_code=403, detail="You do not have permission to view this ticket")


@router.patch("/{ticket_id}/status", response_model=TicketOut)
async def update_ticket_status(
    ticket_id: str,
    payload: TicketStatusUpdate,
    current_user: UserOut = Depends(require_roles(UserRole.STAFF, UserRole.ADMIN)),
):
    ticket = await tickets_collection.find_one({"_id": ObjectId(ticket_id)})
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    if current_user.role == UserRole.STAFF and (
        not ticket.get("assigned_to") or str(ticket["assigned_to"]) != current_user.id
    ):
        raise HTTPException(status_code=403, detail="You can only update tickets assigned to you")

    old_status = ticket["status"]
    new_status = payload.status.value
    now = utc_now()

    update_fields = {"status": new_status, "updated_at": now}
    if new_status == TicketStatus.RESOLVED.value:
        update_fields["resolved_at"] = now
    if new_status == TicketStatus.CLOSED.value:
        update_fields["closed_at"] = now

    detail = f"Status changed from '{old_status}' to '{new_status}'"
    if payload.comment:
        detail += f" — Note: {payload.comment}"

    log_entry = _log_entry("status_changed", detail, current_user)

    result = await tickets_collection.find_one_and_update(
        {"_id": ObjectId(ticket_id)},
        {"$set": update_fields, "$push": {"activity_log": log_entry}},
        return_document=True,
    )
    return TicketOut(**result)


@router.patch("/{ticket_id}/reassign", response_model=TicketOut)
async def reassign_ticket(
    ticket_id: str,
    payload: TicketReassign,
    current_user: UserOut = Depends(require_roles(UserRole.ADMIN)),
):
    ticket = await tickets_collection.find_one({"_id": ObjectId(ticket_id)})
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    new_staff = await users_collection.find_one({"_id": ObjectId(payload.assigned_to), "role": "staff"})
    if not new_staff:
        raise HTTPException(status_code=404, detail="assigned_to does not match an existing staff member")

    log_entry = _log_entry(
        "reassigned", f"Manually reassigned to {new_staff['name']} by {current_user.name}", current_user
    )

    result = await tickets_collection.find_one_and_update(
        {"_id": ObjectId(ticket_id)},
        {
            "$set": {
                "assigned_to": new_staff["_id"],
                "assigned_to_name": new_staff["name"],
                "updated_at": utc_now(),
            },
            "$push": {"activity_log": log_entry},
        },
        return_document=True,
    )
    return TicketOut(**result)


@router.post("/{ticket_id}/comments", response_model=TicketOut)
async def add_comment(
    ticket_id: str,
    payload: TicketCommentCreate,
    current_user: UserOut = Depends(get_current_user),
):
    ticket = await tickets_collection.find_one({"_id": ObjectId(ticket_id)})
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    _check_can_view(ticket, current_user)

    log_entry = _log_entry("comment_added", payload.comment, current_user)
    result = await tickets_collection.find_one_and_update(
        {"_id": ObjectId(ticket_id)},
        {"$push": {"activity_log": log_entry}, "$set": {"updated_at": utc_now()}},
        return_document=True,
    )
    return TicketOut(**result)